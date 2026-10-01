/**
 * Cyber Shift: Apex Vanguard - ParticleSystem
 * Handles high-performance WebGL particle effects:
 * - Sparks & weapon impact bursts
 * - Multi-stage explosions with smoking debris
 * - Nitro boost jet flames & motion trails
 * - Tire drift smoke & friction sparks
 * - Animated transformation shockwave rings
 * - Nanite repair swirls
 */

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.rings = [];
    this.debris = [];

    // Shared geometries and materials for batching
    const T = window.THREE;
    this.sparkGeo = new T.IcosahedronGeometry(0.12, 1);
    this.smokeGeo = new T.IcosahedronGeometry(0.25, 1);
    this.debrisGeo = new T.BoxGeometry(0.35, 0.25, 0.45);
    this.ringGeo = new T.RingGeometry(0.5, 0.7, 32);

    this.cyanMat = new T.MeshBasicMaterial({ color: 0x38dfff, transparent: true, opacity: 1 });
    this.orangeMat = new T.MeshBasicMaterial({ color: 0xff8c38, transparent: true, opacity: 1 });
    this.redMat = new T.MeshBasicMaterial({ color: 0xff3b5c, transparent: true, opacity: 1 });
    this.yellowMat = new T.MeshBasicMaterial({ color: 0xffeb3b, transparent: true, opacity: 1 });
    this.greenMat = new T.MeshBasicMaterial({ color: 0x4dfc8f, transparent: true, opacity: 1 });
  }

  // --- Particle Spawners ---

  createHitSparks(pos, count = 12, color = 0x38dfff) {
    const T = window.THREE;
    for (let i = 0; i < count; i++) {
      const mat = new T.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1
      });
      const mesh = new T.Mesh(this.sparkGeo, mat);
      mesh.position.copy(pos);
      mesh.scale.setScalar(0.7 + Math.random() * 0.9);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 12;
      const vel = new T.Vector3(
        Math.cos(angle) * speed,
        (Math.random() - 0.2) * speed * 0.8 + 2,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh,
        mat,
        vel,
        gravity: 18,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        fade: true
      });
    }
  }

  createExplosion(pos, isHeavy = false, isBoss = false) {
    const T = window.THREE;
    const count = isBoss ? 45 : (isHeavy ? 28 : 18);
    const colors = [0xff3b5c, 0xff8c38, 0xffeb3b, 0xffffff];

    // Core flash and expanding fire particles
    for (let i = 0; i < count; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const mat = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 1 });
      const mesh = new T.Mesh(this.smokeGeo, mat);
      mesh.position.copy(pos);
      const scale = (isHeavy ? 1.5 : 1) * (0.8 + Math.random() * 1.5);
      mesh.scale.setScalar(scale);
      this.scene.add(mesh);

      const dir = new T.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 2
      ).normalize();
      const speed = (isHeavy ? 14 : 9) * (0.5 + Math.random());

      this.particles.push({
        mesh,
        mat,
        vel: dir.multiplyScalar(speed),
        gravity: 8,
        life: 0.4 + Math.random() * 0.5,
        maxLife: 0.9,
        scaleGrowth: 2.2,
        fade: true
      });
    }

    // Exploding mechanical debris pieces
    const debrisCount = isBoss ? 16 : (isHeavy ? 8 : 5);
    for (let i = 0; i < debrisCount; i++) {
      const mat = new T.MeshStandardMaterial({
        color: 0x242836,
        metalness: 0.8,
        roughness: 0.4
      });
      const mesh = new T.Mesh(this.debrisGeo, mat);
      mesh.position.copy(pos).add(new T.Vector3(
        (Math.random() - 0.5) * 1.5,
        Math.random() * 2,
        (Math.random() - 0.5) * 1.5
      ));
      this.scene.add(mesh);

      const vel = new T.Vector3(
        (Math.random() - 0.5) * 16,
        6 + Math.random() * 14,
        (Math.random() - 0.5) * 16
      );
      const rotSpeed = new T.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );

      this.debris.push({
        mesh,
        mat,
        vel,
        rotSpeed,
        life: 2.5 + Math.random() * 1.5,
        maxLife: 4.0
      });
    }

    // Shockwave ring on ground
    this.createShockwave(pos, isHeavy ? 0xff5533 : 0x38dfff, isHeavy ? 28 : 16);
  }

  createShockwave(pos, color = 0x38dfff, maxRadius = 18) {
    const T = window.THREE;
    const mat = new T.MeshBasicMaterial({
      color,
      side: T.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const mesh = new T.Mesh(this.ringGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(pos);
    mesh.position.y = 0.25;
    this.scene.add(mesh);

    this.rings.push({
      mesh,
      mat,
      radius: 1,
      maxRadius,
      growthRate: maxRadius / 0.45,
      life: 0.45,
      maxLife: 0.45
    });
  }

  createBoostFlame(pos, heading, color = 0x38dfff) {
    const T = window.THREE;
    const mat = new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
    const mesh = new T.Mesh(this.sparkGeo, mat);
    mesh.position.copy(pos);
    mesh.scale.setScalar(0.7 + Math.random() * 0.6);
    this.scene.add(mesh);

    // Eject backwards relative to vehicle heading
    const spread = (Math.random() - 0.5) * 0.4;
    const dir = new T.Vector3(-Math.sin(heading + spread), 0.1, -Math.cos(heading + spread));
    const speed = 12 + Math.random() * 8;

    this.particles.push({
      mesh,
      mat,
      vel: dir.multiplyScalar(speed),
      gravity: 0,
      life: 0.16 + Math.random() * 0.1,
      maxLife: 0.26,
      fade: true
    });
  }

  createDriftSparks(pos, heading, isLeft = true) {
    const T = window.THREE;
    const mat = new T.MeshBasicMaterial({ color: 0xffaa22, transparent: true, opacity: 0.9 });
    const mesh = new T.Mesh(this.sparkGeo, mat);
    mesh.position.copy(pos);
    mesh.scale.setScalar(0.5);
    this.scene.add(mesh);

    const sideAngle = heading + (isLeft ? Math.PI * 0.6 : -Math.PI * 0.6);
    const vel = new T.Vector3(Math.sin(sideAngle) * 5, 1.5 + Math.random() * 2, Math.cos(sideAngle) * 5);

    this.particles.push({
      mesh,
      mat,
      vel,
      gravity: 12,
      life: 0.2,
      maxLife: 0.2,
      fade: true
    });
  }

  createRepairSparkle(pos) {
    const T = window.THREE;
    for (let i = 0; i < 6; i++) {
      const mat = new T.MeshBasicMaterial({ color: 0x4dfc8f, transparent: true, opacity: 0.9 });
      const mesh = new T.Mesh(this.sparkGeo, mat);
      const offset = new T.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 2
      );
      mesh.position.copy(pos).add(offset);
      mesh.scale.setScalar(0.8);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        mat,
        vel: new T.Vector3(0, 4 + Math.random() * 3, 0),
        gravity: -2, // Float upwards
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        fade: true
      });
    }
  }

  // --- Frame Update Loop ---
  update(dt) {
    // 1. Update basic particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.y -= p.gravity * dt;

      if (p.scaleGrowth) {
        p.mesh.scale.addScalar(p.scaleGrowth * dt);
      }

      if (p.fade) {
        const progress = Math.max(0, p.life / p.maxLife);
        p.mat.opacity = progress;
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mat.dispose();
        this.particles.splice(i, 1);
      }
    }

    // 2. Update shockwave rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      r.radius += r.growthRate * dt;
      const s = r.radius;
      r.mesh.scale.set(s, s, s);

      const progress = Math.max(0, r.life / r.maxLife);
      r.mat.opacity = progress * 0.9;

      if (r.life <= 0) {
        this.scene.remove(r.mesh);
        r.mat.dispose();
        this.rings.splice(i, 1);
      }
    }

    // 3. Update physical debris
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.life -= dt;

      d.vel.y -= 22 * dt; // Heavy gravity
      d.mesh.position.addScaledVector(d.vel, dt);

      d.mesh.rotation.x += d.rotSpeed.x * dt;
      d.mesh.rotation.y += d.rotSpeed.y * dt;
      d.mesh.rotation.z += d.rotSpeed.z * dt;

      // Ground bounce
      if (d.mesh.position.y < 0.2) {
        d.mesh.position.y = 0.2;
        d.vel.y = -d.vel.y * 0.45; // Bounce absorption
        d.vel.x *= 0.75;
        d.vel.z *= 0.75;
        d.rotSpeed.multiplyScalar(0.7);
      }

      if (d.life <= 0) {
        this.scene.remove(d.mesh);
        d.mat.dispose();
        this.debris.splice(i, 1);
      }
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mat.dispose();
    }
    this.particles = [];

    for (const r of this.rings) {
      this.scene.remove(r.mesh);
      r.mat.dispose();
    }
    this.rings = [];

    for (const d of this.debris) {
      this.scene.remove(d.mesh);
      d.mat.dispose();
    }
    this.debris = [];
  }
}
