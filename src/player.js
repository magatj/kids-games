/**
 * Cyber Shift: Apex Vanguard - PlayerHero
 * Procedural articulated transforming robot model with:
 * - 2 original Hero Frames: Aegis Stryker (Heavy) & Volt Phantom (Recon)
 * - Articulated mechanical transformation folding
 * - Melee energy blade weapon with dynamic slashing animations
 * - Front twin plasma blasters & vehicle headlights/exhausts
 * - Physics states: walking, jumping, drifting, boosting, dashing
 */

export class PlayerHero {
  constructor(scene, heroType = 0) {
    const T = window.THREE;
    this.scene = scene;
    this.heroType = heroType; // 0 = Aegis Stryker, 1 = Volt Phantom

    this.root = new T.Group();
    this.scene.add(this.root);

    // Player Gameplay State
    this.position = this.root.position;
    this.heading = Math.PI; // Face forward initially
    this.speed = 0; // Units/s
    this.speedKmh = 0;
    this.isCar = false;
    this.transformProgress = 0; // 0 = Robot, 1 = Car
    this.targetTransform = 0;

    this.health = 100;
    this.maxHealth = 100;
    this.boostEnergy = 100;
    this.maxBoostEnergy = 100;
    this.overchargedTimer = 0;

    // Jumping & Vertical Physics
    this.velocityY = 0;
    this.gravity = 32;
    this.onGround = true;

    // Combat & Animation States
    this.meleeSwing = 0; // 0 to 1 progress of current swing
    this.meleeStep = 0; // 1, 2, 3
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDirection = new T.Vector3();
    this.invulnerableTimer = 0;

    // Articulation parts storage
    this.parts = [];
    this.wheels = [];
    this.shell = null;
    this.sword = null;
    this.bladeLight = null;
    this.headlights = [];
    this.exhausts = [];

    this.buildModel();
  }

  // --- Hero Frame Color Configurations ---
  getHeroColors() {
    if (this.heroType === 1) {
      // Volt Phantom (Recon Fighter: Cyan & Obsidian with Gold & Violet)
      return {
        name: 'VOLT PHANTOM',
        class: 'HYPER-RECON / V-02',
        desc: 'Superior aerodynamic speed, twin pulse blasters, lightning agile drift.',
        primary: 0x00d4ff,
        secondary: 0x141824,
        accent: 0xa633ff,
        core: 0x00ffff,
        maxSpeedRobot: 15,
        maxSpeedCar: 46, // ~165 km/h
        boostMultiplier: 1.6,
        armorScale: 0.9,
        damageScale: 1.15
      };
    } else {
      // Aegis Stryker (Heavy Interceptor: Crimson & Gold with Titanium Steel)
      return {
        name: 'AEGIS STRYKER',
        class: 'APEX INTERCEPTOR / A-01',
        desc: 'Heavily armored titanium plating, twin heavy railguns, crushing kinetic impact.',
        primary: 0xc92434,
        secondary: 0x1e2736,
        accent: 0xf5b033,
        core: 0x38dfff,
        maxSpeedRobot: 12,
        maxSpeedCar: 38, // ~140 km/h
        boostMultiplier: 1.5,
        armorScale: 1.25,
        damageScale: 1.0
      };
    }
  }

  buildModel() {
    const T = window.THREE;
    // Clear any previous child meshes
    while (this.root.children.length > 0) {
      this.root.remove(this.root.children[0]);
    }
    this.parts = [];
    this.wheels = [];
    this.headlights = [];
    this.exhausts = [];

    const cfg = this.getHeroColors();

    // Standard PBR Materials
    const matPrimary = new T.MeshStandardMaterial({
      color: cfg.primary,
      metalness: 0.7,
      roughness: 0.3
    });
    const matSecondary = new T.MeshStandardMaterial({
      color: cfg.secondary,
      metalness: 0.8,
      roughness: 0.35
    });
    const matAccent = new T.MeshStandardMaterial({
      color: cfg.accent,
      metalness: 0.6,
      roughness: 0.25
    });
    const matChrome = new T.MeshStandardMaterial({
      color: 0xa8c4d8,
      metalness: 0.9,
      roughness: 0.18
    });
    const matRubber = new T.MeshStandardMaterial({
      color: 0x11161d,
      roughness: 0.85,
      metalness: 0.1
    });
    const matGlass = new T.MeshStandardMaterial({
      color: 0x15344d,
      metalness: 0.85,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9
    });
    const matCore = new T.MeshStandardMaterial({
      color: cfg.core,
      emissive: cfg.core,
      emissiveIntensity: 2.5
    });
    const matRedGlow = new T.MeshStandardMaterial({
      color: 0xff3b5c,
      emissive: 0xff2044,
      emissiveIntensity: 2.0
    });

    const boxGeo = new T.BoxGeometry(1, 1, 1);
    const cylGeo = new T.CylinderGeometry(1, 1, 1, 12);

    const helperBox = (parent, w, h, d, x, y, z, m) => {
      const mesh = new T.Mesh(boxGeo, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    const helperCyl = (parent, r, h, x, y, z, m) => {
      const mesh = new T.Mesh(cylGeo, m);
      mesh.scale.set(r, h, r);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // Helper for articulated shifting parts:
    // rPos: Robot resting pos, cPos: Car resting pos
    const addPart = (rPos, cPos, buildFn) => {
      const g = new T.Group();
      this.root.add(g);
      buildFn(g);
      this.parts.push({
        group: g,
        rPos: new T.Vector3(...rPos),
        cPos: new T.Vector3(...cPos)
      });
      g.position.set(...rPos);
      return g;
    };

    // 1. Torso & Power Core Cockpit
    addPart([0, 3.5, 0], [0, 1.35, 0.1], (p) => {
      // Main armored chest
      helperBox(p, 2.5, 1.7, 1.3, 0, 0, 0, matPrimary);
      helperBox(p, 0.2, 1.4, 1.35, 0, 0, 0.05, matChrome);

      // Glowing Hexagon Chest Power Core
      const core = helperBox(p, 0.6, 0.6, 0.2, 0, 0.1, 0.68, matCore);
      core.rotation.z = Math.PI / 4;

      // Windshield glass canopy (slanted)
      for (const s of [-1, 1]) {
        const glass = helperBox(p, 0.9, 0.75, 0.15, s * 0.65, 0.25, 0.68, matGlass);
        glass.rotation.x = -0.15;
      }
      // Vent grill
      helperBox(p, 1.2, 0.35, 0.15, 0, -0.55, 0.68, matSecondary);
    });

    // 2. Head & Visor (folds inside cowl in car mode)
    addPart([0, 4.8, 0], [0, 1.05, -0.65], (p) => {
      // Helmet base
      helperBox(p, 0.95, 0.9, 0.85, 0, 0, 0, matSecondary);
      // Glowing combat visor
      helperBox(p, 0.75, 0.18, 0.15, 0, 0.12, 0.45, matCore);
      // Faceplate armor
      helperBox(p, 0.65, 0.35, 0.12, 0, -0.15, 0.44, matChrome);
      // Ear antennae crests
      for (const s of [-1, 1]) {
        helperBox(p, 0.12, 0.7, 0.3, s * 0.52, 0.25, -0.05, matAccent);
      }
      // Top crest fin
      helperBox(p, 0.2, 0.35, 0.7, 0, 0.55, 0, matPrimary);
    });

    // 3. Pelvis & Hip Thrusters
    addPart([0, 2.3, 0], [0, 0.85, -0.2], (p) => {
      helperBox(p, 1.7, 0.7, 1.0, 0, 0, 0, matSecondary);
      helperBox(p, 0.6, 0.4, 0.15, 0, 0, 0.52, matCore);
      for (const s of [-1, 1]) {
        helperBox(p, 0.3, 0.5, 0.8, s * 0.95, 0, 0, matAccent);
      }
    });

    // 4. Shoulders, Arms, Weapons & Wheels
    for (const s of [-1, 1]) {
      // Shoulder pauldron
      addPart([s * 1.7, 3.95, 0], [s * 1.25, 1.05, 0.6], (p) => {
        helperBox(p, 0.95, 1.05, 1.35, 0, 0, 0, matPrimary);
        helperBox(p, 1.05, 0.18, 1.45, 0, 0.55, 0, matChrome);
        // Shoulder Cannon Barrel
        const cannon = helperCyl(p, 0.16, 1.5, s * 0.25, 0.6, -0.4, matSecondary);
        cannon.rotation.x = Math.PI / 2;
      });

      // Forearm & Arm Blaster / Energy Blade
      const forearm = addPart([s * 1.85, 2.7, 0.15], [s * 1.25, 0.92, -0.85], (p) => {
        helperCyl(p, 0.3, 0.6, 0, 0.55, 0, matChrome);
        helperBox(p, 0.75, 1.1, 0.9, 0, 0, 0, matSecondary);
        helperBox(p, 0.2, 0.7, 0.1, s * 0.25, 0, 0.48, matAccent);

        // Arm Plasma Blaster Barrel
        const gun = helperCyl(p, 0.18, 1.0, 0, -0.1, 0.8, matSecondary);
        gun.rotation.x = Math.PI / 2;
        const muzzle = helperCyl(p, 0.12, 0.1, 0, -0.1, 1.32, matCore);
        muzzle.rotation.x = Math.PI / 2;

        // RIGHT ARM (s === 1): Energy Plasma Sword
        if (s === 1) {
          const swordGroup = new T.Group();
          swordGroup.position.set(0, -0.3, 0.5);

          // Hilt
          helperBox(swordGroup, 0.2, 0.25, 0.6, 0, 0, 0, matChrome);
          // Crossguard
          helperBox(swordGroup, 0.6, 0.15, 0.25, 0, 0, 0.35, matSecondary);

          // Glowing Plasma Blade
          const blade = helperBox(swordGroup, 0.08, 0.3, 2.8, 0, 0, 1.85, matCore);
          const bladeEdge = helperBox(swordGroup, 0.12, 0.08, 2.9, 0, 0, 1.85, matAccent);

          p.add(swordGroup);
          this.sword = swordGroup;
        }
      });

      // Legs & Boots
      addPart([s * 0.65, 1.45, 0], [s * 0.68, 0.82, -1.25], (p) => {
        // Thigh
        helperBox(p, 0.85, 1.05, 0.9, 0, 0.15, 0, matSecondary);
        // Knee armor plate
        helperBox(p, 0.65, 0.55, 0.15, 0, 0.32, 0.52, matChrome);
        // Shin
        helperBox(p, 0.95, 0.6, 1.1, 0, -0.55, 0, matPrimary);
        // Armored Foot Sabaton
        helperBox(p, 1.0, 0.45, 1.6, 0, -1.0, 0.3, matSecondary);
        // Heel thruster
        helperBox(p, 0.4, 0.3, 0.3, 0, -0.85, -0.65, matCore);
      });

      // 4 Wheels (Front & Rear on each side)
      for (const j of [-1, 1]) {
        addPart([s * (j === 1 ? 1.88 : 0.98), j === 1 ? 3.8 : 0.85, -0.5], [s * 1.38, 0.62, j * 1.45], (p) => {
          const tire = helperCyl(p, 0.62, 0.38, 0, 0, 0, matRubber);
          tire.rotation.z = Math.PI / 2;

          const hub = helperCyl(p, 0.34, 0.4, 0, 0, 0, matChrome);
          hub.rotation.z = Math.PI / 2;

          const center = helperCyl(p, 0.15, 0.42, 0, 0, 0, matCore);
          center.rotation.z = Math.PI / 2;

          this.wheels.push(p);
        });
      }
    }

    // 5. Vehicle Aerodynamic Shell (Expands & clamps in car mode)
    const shell = new T.Group();
    this.root.add(shell);

    // Car Body / Hood / Roof
    helperBox(shell, 2.5, 0.7, 4.6, 0, 0.88, 0, matPrimary);
    helperBox(shell, 2.3, 0.2, 1.8, 0, 1.25, 1.3, matPrimary);
    helperBox(shell, 2.0, 0.68, 1.7, 0, 1.55, -0.28, matPrimary);

    // Slanted Front Windshield & Rear Window
    const ws = helperBox(shell, 1.88, 0.6, 0.08, 0, 1.55, 0.6, matGlass);
    ws.rotation.x = -0.42;
    helperBox(shell, 1.85, 0.45, 0.08, 0, 1.52, -1.15, matGlass);

    // Headlights (Front Cyan / Orange)
    for (const s of [-1, 1]) {
      const hl = helperBox(shell, 0.55, 0.22, 0.1, s * 0.85, 0.95, 2.32, matCore);
      this.headlights.push(hl);

      // Taillights (Rear Red)
      helperBox(shell, 0.45, 0.18, 0.08, s * 0.85, 0.9, -2.32, matRedGlow);
    }

    // Aerodynamic Rear Wing Spoiler
    helperBox(shell, 2.7, 0.16, 0.5, 0, 1.52, -2.0, matSecondary);
    for (const s of [-1, 1]) {
      helperBox(shell, 0.12, 0.45, 0.35, s * 1.1, 1.3, -2.0, matChrome);
    }

    // Twin Jet Afterburners on rear
    for (const s of [-1, 1]) {
      const ex = helperCyl(shell, 0.22, 0.5, s * 0.45, 0.85, -2.35, matSecondary);
      ex.rotation.x = Math.PI / 2;
      const exGlow = helperCyl(shell, 0.15, 0.1, s * 0.45, 0.85, -2.58, matCore);
      exGlow.rotation.x = Math.PI / 2;
      this.exhausts.push(exGlow);
    }

    shell.scale.setScalar(0.001); // Hidden in pure robot mode
    this.shell = shell;
  }

  setHeroType(type) {
    if (this.heroType === type) return;
    this.heroType = type;
    this.buildModel();
  }

  // --- Dynamic Pose & Morph Interpolation ---
  updatePose(dt, time, movingRatio) {
    // Morph progress smooth cubic easing
    const e = this.transformProgress * this.transformProgress * (3 - 2 * this.transformProgress);

    for (let i = 0; i < this.parts.length; i++) {
      const part = this.parts[i];
      // Interpolate position between robot rest (rPos) and car rest (cPos)
      part.group.position.lerpVectors(part.rPos, part.cPos, e);
      part.group.rotation.set(0, 0, 0);

      // Head retraction rotation
      if (i === 1) {
        part.group.rotation.x = e * (Math.PI / 2);
      }

      // Robot mode limb walking / running swing
      if (e < 0.95 && movingRatio > 0.05) {
        const swing = Math.sin(time * 9) * 0.35 * movingRatio * (1 - e);
        // Thighs / Legs
        if (i === 5) part.group.rotation.x = swing;
        if (i === 11) part.group.rotation.x = -swing;

        // Arms
        if (i === 3) part.group.rotation.x = -swing * 0.7;
        if (i === 9) part.group.rotation.x = swing * 0.7;
      }
    }

    // Car shell scale interpolation
    if (this.shell) {
      this.shell.scale.setScalar(Math.max(0.001, e));
    }

    // Wheels rotation
    for (const w of this.wheels) {
      w.rotation.x = time * movingRatio * 10 * e;
    }

    // Melee attack animation on sword
    if (this.sword) {
      if (this.meleeSwing > 0) {
        this.sword.visible = true;
        // Animated slash sweep
        const s = this.meleeSwing;
        if (this.meleeStep === 1) {
          // Horizontal right-to-left sweep
          this.sword.rotation.set(0.4, (s - 0.5) * Math.PI * 1.4, -0.6);
        } else if (this.meleeStep === 2) {
          // Uppercut rising backhand slash
          this.sword.rotation.set(-0.8 + s * 1.6, 0.4, 0.5);
        } else {
          // Overhead downward slam
          this.sword.rotation.set(1.4 - s * 2.2, 0, 0);
        }
      } else {
        // Holstered / ready pose
        this.sword.visible = this.transformProgress < 0.5;
        this.sword.rotation.set(0.2, 0, 0);
      }
    }
  }

  // --- Frame Update ---
  update(dt, worldCity, particles, soundSystem) {
    const time = Date.now() * 0.001;

    // 1. Smooth transformation lerp
    this.targetTransform = this.isCar ? 1.0 : 0.0;
    this.transformProgress += (this.targetTransform - this.transformProgress) * Math.min(1, dt * 7.5);

    // 2. Timers
    if (this.meleeSwing > 0) {
      this.meleeSwing = Math.max(0, this.meleeSwing - dt * 4.5);
    }
    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - dt);
      if (this.dashTimer <= 0) this.isDashing = false;
    }
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }
    if (this.overchargedTimer > 0) {
      this.overchargedTimer = Math.max(0, this.overchargedTimer - dt);
    }

    // 3. Vertical jump / fall physics
    if (!this.onGround) {
      this.velocityY -= this.gravity * dt;
      this.position.y += this.velocityY * dt;

      if (this.position.y <= 0) {
        this.position.y = 0;
        this.velocityY = 0;
        this.onGround = true;
      }
    }

    // 4. Robot walking bobbing
    if (!this.isCar && this.onGround && Math.abs(this.speed) > 0.5) {
      this.position.y = Math.abs(Math.sin(time * 9)) * 0.12;
    }

    // 5. Update visual mesh pose & articulation
    const movingRatio = Math.min(1.0, Math.abs(this.speed) / 10);
    this.updatePose(dt, time, movingRatio);

    this.root.rotation.y = this.heading;
    this.speedKmh = Math.round(Math.abs(this.speed) * 3.6);
  }

  triggerTransform(soundSystem, particles) {
    this.isCar = !this.isCar;
    soundSystem.playTransform(this.isCar);

    // Spawn animated holographic transformation shockwave ring & sparks
    particles.createShockwave(this.position, this.heroType === 1 ? 0x00d4ff : 0xf5b033, 14);
    particles.createHitSparks(this.position.clone().add(new window.THREE.Vector3(0, 1.5, 0)), 16, 0x38dfff);
  }

  jump(soundSystem) {
    if (this.isCar || !this.onGround) return;
    this.velocityY = 13.5;
    this.onGround = false;
    soundSystem.playJump();
  }

  triggerDash(dir, soundSystem, particles) {
    if (this.isCar || this.isDashing || this.boostEnergy < 18) return;
    this.boostEnergy = Math.max(0, this.boostEnergy - 18);
    this.isDashing = true;
    this.dashTimer = 0.22;
    this.invulnerableTimer = 0.3; // i-frames
    this.dashDirection.copy(dir).normalize();
    soundSystem.playDash();

    // Dash jet trail
    particles.createHitSparks(this.position.clone().add(new window.THREE.Vector3(0, 1.5, 0)), 12, 0x38dfff);
  }
}
