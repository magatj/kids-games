/**
 * Cyber Shift: Apex Vanguard - CombatSystem
 * Manages player attacks, 3-hit melee combos, plasma projectiles,
 * vehicle kinetic ramming, EMP shockwaves, and damage calculations.
 */

export class CombatSystem {
  constructor(scene, particles, soundSystem, camera) {
    const T = window.THREE;
    this.scene = scene;
    this.particles = particles;
    this.sound = soundSystem;
    this.camera = camera;

    this.projectiles = [];
    this.comboCount = 0;
    this.comboTimer = 0;
    this.meleeCooldown = 0;
    this.rangedCooldown = 0;
    this.shockwaveCooldown = 0;

    // Bullet Geometry & Materials
    this.bulletGeo = new T.SphereGeometry(0.2, 6, 6);
    this.playerBulletMat = new T.MeshBasicMaterial({ color: 0x38dfff });
    this.playerBulletAltMat = new T.MeshBasicMaterial({ color: 0xffd700 });
    this.enemyBulletMat = new T.MeshBasicMaterial({ color: 0xff3b5c });
  }

  // --- Projectile Spawner ---
  spawnBullet(from, to, isHostile = false, damage = 22, isAlt = false) {
    const T = window.THREE;
    const mesh = new T.Mesh(
      this.bulletGeo,
      isHostile ? this.enemyBulletMat : (isAlt ? this.playerBulletAltMat : this.playerBulletMat)
    );
    mesh.position.copy(from);
    mesh.scale.set(1.2, 1.2, 4.0); // Elongated plasma bolt

    const dir = to.clone().sub(from).normalize();
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), dir);

    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      dir,
      speed: isHostile ? 36 : 115,
      isHostile,
      damage,
      life: 2.2
    });
  }

  // --- Melee Attack (3-Hit Combo) ---
  triggerMelee(player, enemyManager, worldCity) {
    if (this.meleeCooldown > 0) return;

    if (player.isCar) {
      // In car mode, Left Click fires front kinetic blaster pulse
      this.triggerRanged(player, enemyManager, worldCity);
      return;
    }

    // Step up combo (1 -> 2 -> 3)
    player.meleeStep = (player.meleeStep % 3) + 1;
    player.meleeSwing = 1.0;
    this.meleeCooldown = 0.28;

    this.comboCount++;
    this.comboTimer = 1.6; // Combo reset window

    const isHeavyFinisher = player.meleeStep === 3;
    const baseDamage = isHeavyFinisher ? 75 : (player.meleeStep === 2 ? 45 : 32);
    const damage = baseDamage * (player.heroType === 1 ? 1.15 : 1.0);

    this.sound.playMeleeSwing(player.meleeStep);

    // Camera punch
    this.camera.addTrauma(isHeavyFinisher ? 0.35 : 0.15);

    // Frontal Arc Hit Detection (Radius 6.5m, Angle 130°)
    const playerForward = new window.THREE.Vector3(
      Math.sin(player.heading),
      0,
      Math.cos(player.heading)
    );

    let hitAny = false;
    const activeEnemies = enemyManager.getActiveEnemies();

    for (const enemy of activeEnemies) {
      const delta = enemy.model.position.clone().sub(player.position);
      delta.y = 0;
      const dist = delta.length();

      if (dist < 6.8) {
        const dot = delta.clone().normalize().dot(playerForward);
        if (dot > 0.25 || dist < 2.8) {
          // HIT!
          hitAny = true;
          enemyManager.damageEnemy(enemy, damage, player.position);
          this.sound.playMeleeHit(isHeavyFinisher);
          this.particles.createHitSparks(
            enemy.model.position.clone().add(new window.THREE.Vector3(0, 2, 0)),
            isHeavyFinisher ? 22 : 12,
            player.heroType === 1 ? 0x00d4ff : 0xf5b033
          );

          // Knockback
          const knockDir = delta.clone().normalize();
          enemy.knockback.addScaledVector(knockDir, isHeavyFinisher ? 24 : 12);
        }
      }
    }

    if (isHeavyFinisher) {
      // Finisher ground shockwave ring
      this.particles.createShockwave(
        player.position.clone().add(playerForward.clone().multiplyScalar(3.0)),
        player.heroType === 1 ? 0x00d4ff : 0xf5b033,
        12
      );
    }
  }

  // --- Ranged Blaster Attack ---
  triggerRanged(player, enemyManager, worldCity) {
    if (this.rangedCooldown > 0) return;

    const isRapid = player.overchargedTimer > 0;
    this.rangedCooldown = isRapid ? 0.09 : (player.heroType === 1 ? 0.14 : 0.22);
    const damage = (player.heroType === 1 ? 22 : 34) * (player.overchargedTimer > 0 ? 1.3 : 1.0);

    const forward = new window.THREE.Vector3(
      Math.sin(player.heading),
      0,
      Math.cos(player.heading)
    );

    // Arm gun offsets
    const side = Math.random() > 0.5 ? 1 : -1;
    const right = new window.THREE.Vector3(
      Math.cos(player.heading) * side * (player.isCar ? 0.9 : 1.6),
      0,
      -Math.sin(player.heading) * side * (player.isCar ? 0.9 : 1.6)
    );

    const fireOrigin = player.position.clone().add(right).add(new window.THREE.Vector3(
      forward.x * 2.2,
      player.isCar ? 0.9 : 2.8,
      forward.z * 2.2
    ));

    // Target locked enemy or straight ahead
    const lockedEnemy = enemyManager.getNearestEnemyInSight(player.position, player.heading, 95);
    let targetPos;

    if (lockedEnemy) {
      targetPos = lockedEnemy.model.position.clone().add(new window.THREE.Vector3(0, 2.5, 0));
    } else {
      targetPos = fireOrigin.clone().add(forward.clone().multiplyScalar(90));
    }

    this.spawnBullet(fireOrigin, targetPos, false, damage, player.heroType === 1);
    this.sound.playBlaster(player.heroType === 1);
    this.camera.addTrauma(0.08);

    // Muzzle flash particle
    this.particles.createHitSparks(fireOrigin, 4, player.heroType === 1 ? 0x00d4ff : 0xffd700);
  }

  // --- EMP Shockwave Ability (Key E) ---
  triggerShockwave(player, enemyManager) {
    if (this.shockwaveCooldown > 0) return;
    this.shockwaveCooldown = 8.5; // 8.5 second cooldown

    this.sound.playExplosion(true);
    this.camera.addTrauma(0.6);

    // Expanding dual electric ring
    this.particles.createShockwave(player.position, 0x38dfff, 24);
    this.particles.createShockwave(player.position, 0xff7b38, 16);

    // Damage all enemies within 22 meters
    const activeEnemies = enemyManager.getActiveEnemies();
    for (const enemy of activeEnemies) {
      const dist = enemy.model.position.distanceTo(player.position);
      if (dist < 22) {
        const damage = 95 * (1 - dist / 26);
        enemyManager.damageEnemy(enemy, Math.max(35, damage), player.position);
        enemy.knockback.addScaledVector(
          enemy.model.position.clone().sub(player.position).normalize(),
          28
        );
        this.particles.createHitSparks(
          enemy.model.position.clone().add(new window.THREE.Vector3(0, 2, 0)),
          16,
          0x38dfff
        );
      }
    }
  }

  // --- Vehicle Ramming Impact Check ---
  checkVehicleRam(player, enemyManager) {
    if (!player.isCar || Math.abs(player.speedKmh) < 35) return;

    const activeEnemies = enemyManager.getActiveEnemies();
    for (const enemy of activeEnemies) {
      const dist = enemy.model.position.distanceTo(player.position);
      if (dist < 3.8) {
        // Crushing kinetic impact!
        const ramDamage = Math.round(Math.abs(player.speedKmh) * 1.6);
        enemyManager.damageEnemy(enemy, ramDamage, player.position);

        this.sound.playMeleeHit(true);
        this.camera.addTrauma(0.45);

        // Knock enemy violently away
        const pushDir = new window.THREE.Vector3(
          Math.sin(player.heading),
          0.3,
          Math.cos(player.heading)
        ).normalize();
        enemy.knockback.addScaledVector(pushDir, 35);

        // Impact spark shockwave
        this.particles.createShockwave(enemy.model.position, 0xff7b38, 8);
        this.particles.createHitSparks(enemy.model.position, 20, 0xffeb3b);

        // Player slows slightly on heavy impact
        player.speed *= 0.65;
      }
    }
  }

  // --- Frame Update ---
  update(dt, player, enemyManager, worldCity) {
    // Cooldown timers
    if (this.meleeCooldown > 0) this.meleeCooldown -= dt;
    if (this.rangedCooldown > 0) this.rangedCooldown -= dt;
    if (this.shockwaveCooldown > 0) this.shockwaveCooldown -= dt;

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        player.meleeStep = 0;
      }
    }

    // Vehicle ramming check
    this.checkVehicleRam(player, enemyManager);

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;

      const travelDist = p.speed * dt;
      const steps = Math.ceil(travelDist / 0.8);
      let hit = false;

      for (let s = 1; s <= steps; s++) {
        p.mesh.position.addScaledVector(p.dir, travelDist / steps);

        // 1. World building collision
        if (worldCity.isBlocked(p.mesh.position.x, p.mesh.position.z, 0.2)) {
          hit = true;
          this.particles.createHitSparks(p.mesh.position, 6, 0x8ea2b5);
          break;
        }

        // 2. Target collision
        if (p.isHostile) {
          // Hostile bullet hits player
          const pCenter = player.position.clone().add(
            new window.THREE.Vector3(0, player.isCar ? 1.0 : 2.5, 0)
          );
          if (p.mesh.position.distanceTo(pCenter) < (player.isCar ? 1.6 : 2.0)) {
            hit = true;
            if (player.invulnerableTimer <= 0) {
              const cfg = player.getHeroColors();
              const finalDmg = p.damage / cfg.armorScale;
              player.health = Math.max(0, player.health - finalDmg);
              this.sound.playMeleeHit(false);
              this.camera.addTrauma(0.22);
              this.particles.createHitSparks(p.mesh.position, 10, 0xff3b5c);
            }
            break;
          }
        } else {
          // Player bullet hits enemy
          const activeEnemies = enemyManager.getActiveEnemies();
          for (const enemy of activeEnemies) {
            const eCenter = enemy.model.position.clone().add(
              new window.THREE.Vector3(0, enemy.isBoss ? 4.0 : 2.5, 0)
            );
            const hitDist = enemy.isBoss ? 3.5 : 2.2;

            if (p.mesh.position.distanceTo(eCenter) < hitDist) {
              hit = true;
              enemyManager.damageEnemy(enemy, p.damage, player.position);
              this.particles.createHitSparks(
                p.mesh.position,
                8,
                player.heroType === 1 ? 0x00d4ff : 0xffd700
              );
              break;
            }
          }
          if (hit) break;
        }
      }

      if (hit || p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  clearProjectiles() {
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
    }
    this.projectiles = [];
  }
}
