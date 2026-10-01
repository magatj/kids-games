/**
 * Cyber Shift: Apex Vanguard - EnemyManager
 * Manages 3 original enemy robot types:
 * 1. Scrap-Viper: Light melee scout drone (fast, agile swarmer)
 * 2. Null Sentinel: Ranged artillery walker (strafes, fires burst laser volleys)
 * 3. Titan Dreadnought: Massive siege colossus boss (ground stomp shockwaves, missile barrage)
 * Includes destructible death animations with physics-driven debris.
 */

export class EnemyManager {
  constructor(scene, particles, soundSystem, combatSystem) {
    this.scene = scene;
    this.particles = particles;
    this.sound = soundSystem;
    this.combat = combatSystem;

    this.enemies = [];
    this.currentWave = 0;
    this.killsThisWave = 0;
    this.totalInWave = 0;
  }

  // --- Procedural Enemy 3D Models ---
  buildEnemyModel(type = 'viper', isBoss = false) {
    const T = window.THREE;
    const root = new T.Group();
    const boxGeo = new T.BoxGeometry(1, 1, 1);
    const cylGeo = new T.CylinderGeometry(1, 1, 1, 12);

    const matDark = new T.MeshStandardMaterial({ color: 0x1f232d, metalness: 0.8, roughness: 0.4 });
    const matArmor = new T.MeshStandardMaterial({
      color: isBoss ? 0x6e243b : (type === 'sentinel' ? 0x2e4860 : 0x484252),
      metalness: 0.7,
      roughness: 0.35
    });
    const matChrome = new T.MeshStandardMaterial({ color: 0x8fa3b4, metalness: 0.9, roughness: 0.2 });
    const matGlow = new T.MeshStandardMaterial({
      color: 0xff3b5c,
      emissive: 0xff1e42,
      emissiveIntensity: 2.4
    });
    const matGoldGlow = new T.MeshStandardMaterial({
      color: 0xff9900,
      emissive: 0xff6600,
      emissiveIntensity: 2.2
    });

    const addBox = (w, h, d, x, y, z, m) => {
      const mesh = new T.Mesh(boxGeo, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);
      return mesh;
    };

    if (type === 'viper') {
      // 1. Scrap-Viper: Agile raptor scout
      // Torso
      addBox(1.4, 0.9, 2.0, 0, 1.8, 0, matArmor);
      // Red mono-eye visor
      addBox(0.9, 0.22, 0.2, 0, 1.9, 1.05, matGlow);
      // Dual razor arm mantis blades
      for (const s of [-1, 1]) {
        addBox(0.3, 0.8, 0.5, s * 0.9, 2.1, 0.4, matDark);
        const blade = addBox(0.1, 0.2, 1.6, s * 1.05, 1.8, 1.2, matChrome);
        blade.rotation.x = -0.3;
      }
      // Digitigrade legs
      for (const s of [-1, 1]) {
        addBox(0.35, 1.0, 0.5, s * 0.75, 1.2, -0.3, matDark);
        addBox(0.3, 0.9, 0.4, s * 0.75, 0.5, 0.2, matArmor);
        addBox(0.5, 0.2, 0.8, s * 0.75, 0.1, 0.4, matChrome);
      }
    } else if (type === 'sentinel') {
      // 2. Null Sentinel: Bipedal ranged artillery walker
      // Upper Turret Chassis
      addBox(2.2, 1.4, 1.6, 0, 3.2, 0, matArmor);
      // Armored Sensor Visor
      addBox(1.5, 0.3, 0.2, 0, 3.4, 0.85, matGlow);
      // Twin Shoulder Railguns
      for (const s of [-1, 1]) {
        const gun = new T.Mesh(cylGeo, matDark);
        gun.scale.set(0.25, 2.4, 0.25);
        gun.rotation.x = Math.PI / 2;
        gun.position.set(s * 1.35, 3.8, 0.6);
        root.add(gun);

        const muzzle = new T.Mesh(cylGeo, matGlow);
        muzzle.scale.set(0.18, 0.2, 0.18);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(s * 1.35, 3.8, 1.85);
        root.add(muzzle);
      }
      // Walker Legs
      for (const s of [-1, 1]) {
        addBox(0.5, 1.6, 0.6, s * 0.9, 1.9, 0, matDark);
        addBox(0.6, 0.9, 1.4, s * 0.9, 0.45, 0.2, matArmor);
      }
    } else {
      // 3. Titan Dreadnought Boss (Hulking Heavy Mech)
      // Massive Chest & Core Reactor
      addBox(3.4, 2.4, 2.2, 0, 4.2, 0, matArmor);
      const core = addBox(1.2, 1.2, 0.4, 0, 4.2, 1.15, matGoldGlow);
      core.rotation.z = Math.PI / 4;

      // Heavy Armored Head
      addBox(1.4, 0.9, 1.2, 0, 5.8, 0.2, matDark);
      addBox(1.1, 0.25, 0.2, 0, 5.8, 0.82, matGlow);

      // Heavy Hydraulic Arms & Hammer Fists
      for (const s of [-1, 1]) {
        addBox(1.4, 1.3, 1.6, s * 2.4, 4.4, 0, matArmor);
        addBox(0.9, 1.6, 1.1, s * 2.6, 3.0, 0.2, matDark);
        // Hammer Fist
        addBox(1.3, 1.3, 1.8, s * 2.6, 1.8, 0.6, matChrome);
      }

      // Massive Reinforced Legs
      for (const s of [-1, 1]) {
        addBox(1.1, 2.0, 1.3, s * 1.2, 2.2, 0, matDark);
        addBox(1.4, 1.1, 2.2, s * 1.2, 0.55, 0.3, matArmor);
      }
    }

    if (isBoss) {
      root.scale.setScalar(1.9);
    }

    this.scene.add(root);
    return root;
  }

  // --- Spawner ---
  spawnEnemy(type, pos, isBoss = false) {
    const model = this.buildEnemyModel(type, isBoss);
    model.position.copy(pos);

    let maxHp;
    if (isBoss) maxHp = 680;
    else if (type === 'sentinel') maxHp = 145;
    else maxHp = 70;

    const enemy = {
      model,
      type,
      isBoss,
      health: maxHp,
      maxHealth: maxHp,
      speed: isBoss ? 6.5 : (type === 'sentinel' ? 8.5 : 15.5),
      attackCooldown: 1.5 + Math.random() * 0.8,
      strafingDir: Math.random() > 0.5 ? 1 : -1,
      strafingTimer: 2.0,
      knockback: new window.THREE.Vector3(),
      hitFlash: 0
    };

    this.enemies.push(enemy);
    return enemy;
  }

  spawnWave(waveNum, playerPos) {
    this.currentWave = waveNum;
    this.killsThisWave = 0;

    // Clear remaining
    this.clearEnemies();

    // Wave Configurations
    const counts = [5, 7, 9];
    const total = counts[Math.min(waveNum - 1, counts.length - 1)];
    this.totalInWave = total;

    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = 55 + Math.random() * 30;
      const x = Math.max(-230, Math.min(230, playerPos.x + Math.sin(angle) * dist));
      const z = Math.max(-230, Math.min(230, playerPos.z + Math.cos(angle) * dist));

      let type = 'viper';
      let isBoss = false;

      if (waveNum === 1) {
        type = 'viper';
      } else if (waveNum === 2) {
        type = i % 2 === 0 ? 'sentinel' : 'viper';
      } else {
        // Wave 3+: Boss on last enemy
        if (i === total - 1) {
          type = 'titan';
          isBoss = true;
        } else {
          type = i % 2 === 0 ? 'sentinel' : 'viper';
        }
      }

      this.spawnEnemy(type, new window.THREE.Vector3(x, 0, z), isBoss);
    }
  }

  damageEnemy(enemy, damage, attackerPos) {
    if (!this.enemies.includes(enemy)) return;

    enemy.health -= damage;
    enemy.hitFlash = 0.15;

    // Flash visual
    enemy.model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.emissiveIntensity = 4.0;
      }
    });

    if (enemy.health <= 0) {
      this.destroyEnemy(enemy);
    }
  }

  destroyEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx === -1) return;

    const pos = enemy.model.position.clone();
    this.particles.createExplosion(pos.clone().add(new window.THREE.Vector3(0, 2, 0)), enemy.type === 'sentinel', enemy.isBoss);
    this.sound.playExplosion(enemy.isBoss);

    this.scene.remove(enemy.model);
    this.enemies.splice(idx, 1);
    this.killsThisWave++;

    // Emit event callback if registered
    if (this.onEnemyKilled) {
      this.onEnemyKilled(enemy, pos);
    }
  }

  // --- Frame Update AI Behaviors ---
  update(dt, player, worldCity) {
    const activeEnemies = [...this.enemies];

    for (const enemy of activeEnemies) {
      const pPos = enemy.model.position;
      const targetPos = player.position;

      // 1. Hit Flash Reset
      if (enemy.hitFlash > 0) {
        enemy.hitFlash -= dt;
        if (enemy.hitFlash <= 0) {
          enemy.model.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.emissiveIntensity = 2.4;
            }
          });
        }
      }

      // 2. Knockback decay
      if (enemy.knockback.lengthSq() > 0.01) {
        pPos.addScaledVector(enemy.knockback, dt);
        enemy.knockback.multiplyScalar(Math.exp(-dt * 6.5));
      }

      // 3. Distance and Orientation to Player
      const delta = targetPos.clone().sub(pPos);
      delta.y = 0;
      const dist = delta.length();
      const angle = Math.atan2(delta.x, delta.z);

      // Smooth facing rotation towards player
      enemy.model.rotation.y = angle;

      // 4. Distinct AI State Machines by Enemy Type:
      enemy.attackCooldown -= dt;

      if (enemy.type === 'viper') {
        // --- 1. SCRAP-VIPER (Fast Swarm Chaser) ---
        if (dist > 3.2) {
          const moveDir = delta.clone().normalize();
          const dx = moveDir.x * enemy.speed * dt;
          const dz = moveDir.z * enemy.speed * dt;
          worldCity.tryMove(pPos, dx, dz, 0.9);
        } else {
          // In close melee range: lunging blade slash
          if (enemy.attackCooldown <= 0) {
            enemy.attackCooldown = 1.2 + Math.random() * 0.4;
            if (player.invulnerableTimer <= 0) {
              const cfg = player.getHeroColors();
              player.health = Math.max(0, player.health - (18 / cfg.armorScale));
              this.sound.playMeleeHit(false);
              this.particles.createHitSparks(player.position.clone().add(new window.THREE.Vector3(0, 1.5, 0)), 8, 0xff3b5c);
            }
          }
        }

      } else if (enemy.type === 'sentinel') {
        // --- 2. NULL SENTINEL (Strafing Ranged Artillery) ---
        enemy.strafingTimer -= dt;
        if (enemy.strafingTimer <= 0) {
          enemy.strafingDir *= -1;
          enemy.strafingTimer = 1.8 + Math.random() * 1.5;
        }

        // Maintain distance between 22 and 38 meters
        let forwardSpeed = 0;
        if (dist > 38) forwardSpeed = enemy.speed;
        else if (dist < 18) forwardSpeed = -enemy.speed * 0.8;

        // Lateral strafe
        const strafeDir = new window.THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle)).multiplyScalar(enemy.strafingDir);
        const dx = (Math.sin(angle) * forwardSpeed + strafeDir.x * enemy.speed * 0.7) * dt;
        const dz = (Math.cos(angle) * forwardSpeed + strafeDir.z * enemy.speed * 0.7) * dt;
        worldCity.tryMove(pPos, dx, dz, 1.2);

        // Firing Railgun Bursts
        if (enemy.attackCooldown <= 0 && dist < 85) {
          enemy.attackCooldown = 2.4 + Math.random() * 0.8;
          const fireOrigin = pPos.clone().add(new window.THREE.Vector3(0, 3.8, 0));
          const aimPos = targetPos.clone().add(new window.THREE.Vector3(0, player.isCar ? 0.9 : 2.2, 0));
          this.combat.spawnBullet(fireOrigin, aimPos, true, 16);
          this.sound.playBlaster(true);
        }

      } else {
        // --- 3. TITAN DREADNOUGHT BOSS (Heavy Siege Colossus) ---
        // Relentless march forward
        if (dist > 7.0) {
          const moveDir = delta.clone().normalize();
          const dx = moveDir.x * enemy.speed * dt;
          const dz = moveDir.z * enemy.speed * dt;
          worldCity.tryMove(pPos, dx, dz, 2.2);
        }

        // Close-Range Ground Stomp Shockwave
        if (dist < 12.0 && enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 3.8;
          this.sound.playExplosion(true);
          this.particles.createShockwave(pPos, 0xff7b38, 22);

          // Damage player if within shockwave
          if (dist < 18.0 && player.invulnerableTimer <= 0) {
            const cfg = player.getHeroColors();
            player.health = Math.max(0, player.health - (35 / cfg.armorScale));
            this.sound.playMeleeHit(true);
            this.particles.createHitSparks(player.position.clone().add(new window.THREE.Vector3(0, 2, 0)), 16, 0xff3b5c);
          }
        } else if (dist >= 12.0 && enemy.attackCooldown <= 0 && dist < 95) {
          // Long-Range Missile Salvo (fires 2 twin heavy bolts)
          enemy.attackCooldown = 2.8;
          for (const s of [-1.5, 1.5]) {
            const fireOrigin = pPos.clone().add(new window.THREE.Vector3(s, 5.0, 0));
            const aimPos = targetPos.clone().add(new window.THREE.Vector3(0, player.isCar ? 0.9 : 2.5, 0));
            this.combat.spawnBullet(fireOrigin, aimPos, true, 26);
          }
          this.sound.playBlaster(false);
        }
      }
    }
  }

  // Smart lock-on query for targeting reticle
  getNearestEnemyInSight(playerPos, playerHeading, maxDistance = 90) {
    let closest = null;
    let closestDist = maxDistance;

    const forward = new window.THREE.Vector3(
      Math.sin(playerHeading),
      0,
      Math.cos(playerHeading)
    );

    for (const enemy of this.enemies) {
      const delta = enemy.model.position.clone().sub(playerPos);
      delta.y = 0;
      const d = delta.length();

      if (d < closestDist) {
        const dot = delta.clone().normalize().dot(forward);
        if (dot > 0.25 || d < 14) {
          closest = enemy;
          closestDist = d;
        }
      }
    }
    return closest;
  }

  getActiveEnemies() {
    return this.enemies;
  }

  clearEnemies() {
    for (const e of this.enemies) {
      this.scene.remove(e.model);
    }
    this.enemies = [];
  }
}
