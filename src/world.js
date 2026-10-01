/**
 * Cyber Shift: Apex Vanguard - WorldCity
 * Procedural futuristic cyberpunk city map:
 * - Asphalt avenues, highways, crosswalks, jump ramps
 * - Illuminated neon skyscrapers with procedural windows & rooftop beacon towers
 * - Holographic billboards, streetlights, cyber trees
 * - Boundary security forcefields
 * - Health and boost energy pickups
 * - Fast 2D AABB & radial collision system
 */

export class WorldCity {
  constructor(scene) {
    const T = window.THREE;
    this.scene = scene;
    this.cityGroup = new T.Group();
    this.scene.add(this.cityGroup);

    this.obstacles = [];
    this.ramps = [];
    this.pickups = [];

    // Shared Materials
    this.matDark = new T.MeshStandardMaterial({ color: 0x141b25, metalness: 0.8, roughness: 0.35 });
    this.matChrome = new T.MeshStandardMaterial({ color: 0x8ea2b5, metalness: 0.9, roughness: 0.2 });
    this.matRoad = new T.MeshStandardMaterial({ color: 0x222b35, metalness: 0.2, roughness: 0.8 });
    this.matCurb = new T.MeshStandardMaterial({ color: 0x566573, metalness: 0.3, roughness: 0.7 });
    this.matLane = new T.MeshBasicMaterial({ color: 0xf5d77f });
    this.matCyanNeon = new T.MeshStandardMaterial({ color: 0x38dfff, emissive: 0x22bbee, emissiveIntensity: 2.2 });
    this.matOrangeNeon = new T.MeshStandardMaterial({ color: 0xff7b38, emissive: 0xee5511, emissiveIntensity: 2.2 });
    this.matRedBeacon = new T.MeshBasicMaterial({ color: 0xff385c });

    this.buildGround();
    this.buildRoadNetwork();
    this.buildSkyscrapers();
    this.buildHoloBillboards();
    this.buildJumpRamps();
    this.buildBoundary();
  }

  // --- Procedural Canvas Textures ---
  createCanvasTexture(width, height, drawFn) {
    const T = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, width, height);
    const tex = new T.CanvasTexture(canvas);
    tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  buildGround() {
    const T = window.THREE;
    const asphaltTex = this.createCanvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#1e2632';
      ctx.fillRect(0, 0, w, h);
      // Subtle noise grit
      for (let i = 0; i < 14000; i++) {
        const v = 35 + Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgba(${v}, ${v + 8}, ${v + 15}, 0.4)`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }
    });
    asphaltTex.wrapS = asphaltTex.wrapT = T.RepeatWrapping;
    asphaltTex.repeat.set(90, 90);

    const groundGeo = new T.PlaneGeometry(640, 640);
    const groundMat = new T.MeshStandardMaterial({
      map: asphaltTex,
      metalness: 0.25,
      roughness: 0.75
    });
    const ground = new T.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.cityGroup.add(ground);
  }

  buildRoadNetwork() {
    const T = window.THREE;
    const boxGeo = new T.BoxGeometry(1, 1, 1);

    // Grid of main thoroughfares every 70 units
    for (let a = -210; a <= 210; a += 70) {
      // Long road strips
      const roadZ = new T.Mesh(boxGeo, this.matRoad);
      roadZ.scale.set(22, 0.05, 580);
      roadZ.position.set(a, 0.03, 0);
      this.cityGroup.add(roadZ);

      const roadX = new T.Mesh(boxGeo, this.matRoad);
      roadX.scale.set(580, 0.05, 22);
      roadX.position.set(0, 0.04, a);
      this.cityGroup.add(roadX);

      // Yellow lane dash markings
      for (let b = -270; b <= 270; b += 14) {
        if (Math.abs(b % 70) < 14) continue; // Skip intersections

        const dashZ = new T.Mesh(boxGeo, this.matLane);
        dashZ.scale.set(0.35, 0.06, 5);
        dashZ.position.set(a, 0.08, b);
        this.cityGroup.add(dashZ);

        const dashX = new T.Mesh(boxGeo, this.matLane);
        dashX.scale.set(5, 0.06, 0.35);
        dashX.position.set(b, 0.08, a);
        this.cityGroup.add(dashX);
      }
    }

    // Streetlight gantries at key road sectors
    for (let a = -210; a <= 210; a += 70) {
      for (let b = -210; b <= 210; b += 70) {
        if ((a + b) % 140 !== 0) continue;

        for (const side of [-1, 1]) {
          const pole = new T.Mesh(new T.CylinderGeometry(0.18, 0.22, 9, 8), this.matChrome);
          pole.position.set(a + 12 * side, 4.5, b + 12);
          this.cityGroup.add(pole);

          const arm = new T.Mesh(boxGeo, this.matDark);
          arm.scale.set(4, 0.25, 0.6);
          arm.position.set(a + 10.5 * side, 9, b + 12);
          this.cityGroup.add(arm);

          const lamp = new T.Mesh(boxGeo, this.matCyanNeon);
          lamp.scale.set(3.2, 0.1, 0.4);
          lamp.position.set(a + 10.5 * side, 8.85, b + 12);
          this.cityGroup.add(lamp);
        }
      }
    }
  }

  buildSkyscrapers() {
    const T = window.THREE;
    const boxGeo = new T.BoxGeometry(1, 1, 1);
    const sphereGeo = new T.IcosahedronGeometry(0.5, 1);

    // Procedural Window Grid Texture
    const windowTex = this.createCanvasTexture(128, 256, (ctx, w, h) => {
      ctx.fillStyle = '#1c2738';
      ctx.fillRect(0, 0, w, h);
      for (let y = 6; y < h; y += 14) {
        for (let x = 6; x < w; x += 14) {
          const r = Math.random();
          if (r > 0.4) {
            ctx.fillStyle = r > 0.75 ? '#80f0ff' : (r > 0.6 ? '#ffb366' : '#d2e7ff');
          } else {
            ctx.fillStyle = '#161e2b';
          }
          ctx.fillRect(x, y, 7, 8);
        }
      }
    });

    const buildingMats = [
      new T.MeshStandardMaterial({
        color: 0x3d4f63,
        map: windowTex,
        emissive: 0x3a536b,
        emissiveMap: windowTex,
        emissiveIntensity: 0.35,
        metalness: 0.5,
        roughness: 0.4
      }),
      new T.MeshStandardMaterial({
        color: 0x2e3c4d,
        map: windowTex,
        emissive: 0x2e4a63,
        emissiveMap: windowTex,
        emissiveIntensity: 0.3,
        metalness: 0.6,
        roughness: 0.35
      }),
      new T.MeshStandardMaterial({
        color: 0x48586b,
        map: windowTex,
        emissive: 0x405568,
        emissiveMap: windowTex,
        emissiveIntensity: 0.4,
        metalness: 0.45,
        roughness: 0.45
      })
    ];

    // City blocks inside the grid
    for (let gx = -3; gx < 3; gx++) {
      for (let gz = -3; gz < 3; gz++) {
        const cx = gx * 70 + 35;
        const cz = gz * 70 + 35;

        // Block curb foundation
        const curb = new T.Mesh(boxGeo, this.matCurb);
        curb.scale.set(46, 0.45, 46);
        curb.position.set(cx, 0.22, cz);
        this.cityGroup.add(curb);

        // Center block park plaza
        if (gx === 0 && gz === 0) {
          const parkMat = new T.MeshStandardMaterial({ color: 0x1f3b32, roughness: 0.9 });
          const park = new T.Mesh(boxGeo, parkMat);
          park.scale.set(42, 0.15, 42);
          park.position.set(cx, 0.5, cz);
          this.cityGroup.add(park);

          // Central Holographic Beacon in Park
          const spire = new T.Mesh(new T.CylinderGeometry(0.6, 1.2, 16, 8), this.matChrome);
          spire.position.set(cx, 8, cz);
          this.cityGroup.add(spire);

          const core = new T.Mesh(new T.OctahedronGeometry(2), this.matCyanNeon);
          core.position.set(cx, 16, cz);
          this.cityGroup.add(core);

          this.obstacles.push({ x: cx, z: cz, w: 3, d: 3 });
          continue;
        }

        // Skyscraper building
        const height = 24 + Math.random() * 64;
        const bw = 26 + Math.random() * 12;
        const bd = 26 + Math.random() * 12;

        const mat = buildingMats[Math.floor(Math.random() * buildingMats.length)];
        const tower = new T.Mesh(boxGeo, mat);
        tower.scale.set(bw, height, bd);
        tower.position.set(cx, height / 2 + 0.45, cz);
        tower.castShadow = true;
        tower.receiveShadow = true;
        this.cityGroup.add(tower);

        // Register obstacle for collisions
        this.obstacles.push({ x: cx, z: cz, w: bw / 2 + 1.2, d: bd / 2 + 1.2 });

        // Architectural roof cornice & neon strip
        const roof = new T.Mesh(boxGeo, this.matChrome);
        roof.scale.set(bw + 1.5, 1.2, bd + 1.5);
        roof.position.set(cx, height + 1, cz);
        this.cityGroup.add(roof);

        const neonStrip = new T.Mesh(boxGeo, Math.random() > 0.5 ? this.matCyanNeon : this.matOrangeNeon);
        neonStrip.scale.set(bw + 0.4, 0.35, 0.4);
        neonStrip.position.set(cx, 3.5, cz + bd / 2 + 0.2);
        this.cityGroup.add(neonStrip);

        // Rooftop antenna with blinking beacon light
        if (height > 40) {
          const ant = new T.Mesh(new T.CylinderGeometry(0.18, 0.3, 12, 6), this.matChrome);
          ant.position.set(cx, height + 7, cz);
          this.cityGroup.add(ant);

          const beacon = new T.Mesh(sphereGeo, this.matRedBeacon);
          beacon.position.set(cx, height + 13, cz);
          this.cityGroup.add(beacon);
        }
      }
    }

    // Distant outer perimeter skyline buildings (visual depth)
    for (let i = 0; i < 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const radius = 330 + Math.random() * 50;
      const h = 30 + Math.random() * 110;
      const w = 18 + Math.random() * 24;
      const d = 18 + Math.random() * 24;

      const tower = new T.Mesh(boxGeo, buildingMats[i % 3]);
      tower.scale.set(w, h, d);
      tower.position.set(Math.sin(angle) * radius, h / 2, Math.cos(angle) * radius);
      this.cityGroup.add(tower);
    }
  }

  buildHoloBillboards() {
    const T = window.THREE;
    const boxGeo = new T.BoxGeometry(1, 1, 1);

    const slogans = [
      'AEGIS DEFENSE\nSECTOR 09 SECURE',
      'APEX VANGUARD\nTRANSMUTE & PREVAIL',
      'NEO-GRID 2099\nCYBER INITIATIVE',
      'TURBO OVERCHARGE\nMAX VELOCITY'
    ];

    slogans.forEach((text, idx) => {
      const billTex = this.createCanvasTexture(256, 128, (ctx, w, h) => {
        ctx.fillStyle = '#071526';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = idx % 2 === 0 ? '#38dfff' : '#ff7b38';
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, w - 8, h - 8);

        ctx.fillStyle = idx % 2 === 0 ? '#78ecff' : '#ffaa66';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        const lines = text.split('\n');
        ctx.fillText(lines[0], w / 2, 50);
        ctx.font = '14px sans-serif';
        ctx.fillText(lines[1], w / 2, 85);
      });

      const billMat = new T.MeshBasicMaterial({ map: billTex, side: T.DoubleSide });
      const board = new T.Mesh(boxGeo, billMat);
      board.scale.set(16, 8, 0.4);

      const positions = [
        { x: -35, y: 15, z: 68, rot: 0 },
        { x: 35, y: 18, z: -68, rot: Math.PI },
        { x: 68, y: 16, z: 35, rot: Math.PI / 2 },
        { x: -68, y: 17, z: -35, rot: -Math.PI / 2 }
      ];
      const p = positions[idx];
      board.position.set(p.x, p.y, p.z);
      board.rotation.y = p.rot;
      this.cityGroup.add(board);
    });
  }

  buildJumpRamps() {
    const T = window.THREE;
    // Sloped jump ramps placed along road corridors
    const rampGeo = new T.BoxGeometry(10, 2.5, 14);
    // Tweak vertices to create wedge shape
    const pos = rampGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getZ(i) > 0) {
        pos.setY(i, -1.25); // Lower back to ground
      }
    }
    rampGeo.computeVertexNormals();

    const rampMat = new T.MeshStandardMaterial({
      color: 0x334455,
      metalness: 0.6,
      roughness: 0.4
    });

    const rampConfigs = [
      { x: 0, z: -105, rot: 0 },
      { x: 0, z: 105, rot: Math.PI },
      { x: -105, z: 0, rot: -Math.PI / 2 },
      { x: 105, z: 0, rot: Math.PI / 2 }
    ];

    for (const cfg of rampConfigs) {
      const ramp = new T.Mesh(rampGeo, rampMat);
      ramp.position.set(cfg.x, 1.25, cfg.z);
      ramp.rotation.y = cfg.rot;
      ramp.castShadow = true;
      ramp.receiveShadow = true;
      this.cityGroup.add(ramp);

      // Neon runway chevrons on ramp
      const chevron = new T.Mesh(new T.BoxGeometry(6, 0.1, 0.6), this.matOrangeNeon);
      chevron.position.set(cfg.x, 1.3, cfg.z);
      chevron.rotation.y = cfg.rot;
      this.cityGroup.add(chevron);

      this.ramps.push({ x: cfg.x, z: cfg.z, rot: cfg.rot });
    }
  }

  buildBoundary() {
    const T = window.THREE;
    const fenceMat = new T.MeshBasicMaterial({
      color: 0x38dfff,
      transparent: true,
      opacity: 0.22,
      side: T.DoubleSide
    });
    const boxGeo = new T.BoxGeometry(1, 1, 1);

    // 4 boundary forcefield walls around map (limit 275)
    for (let side = 0; side < 4; side++) {
      const wall = new T.Mesh(boxGeo, fenceMat);
      wall.scale.set(560, 10, 0.2);
      if (side === 0) wall.position.set(0, 5, -280);
      if (side === 1) wall.position.set(0, 5, 280);
      if (side === 2) {
        wall.position.set(-280, 5, 0);
        wall.rotation.y = Math.PI / 2;
      }
      if (side === 3) {
        wall.position.set(280, 5, 0);
        wall.rotation.y = Math.PI / 2;
      }
      this.cityGroup.add(wall);
    }
  }

  // --- Pickups Spawner ---
  spawnPickup(pos, type = 'repair') {
    const T = window.THREE;
    const group = new T.Group();
    group.position.copy(pos);
    group.position.y = 1.4;

    if (type === 'repair') {
      // Green Nanite Repair Core
      const coreGeo = new T.OctahedronGeometry(0.8);
      const coreMat = new T.MeshStandardMaterial({
        color: 0x4dfc8f,
        emissive: 0x22ee77,
        emissiveIntensity: 2.2,
        roughness: 0.2
      });
      const core = new T.Mesh(coreGeo, coreMat);
      group.add(core);

      // Orbiting energy ring
      const ring = new T.Mesh(new T.TorusGeometry(1.2, 0.06, 6, 24), this.matCyanNeon);
      ring.rotation.x = Math.PI / 4;
      group.add(ring);
    } else {
      // Overcharge Matrix (Cyan/Orange boost refill)
      const coreGeo = new T.IcosahedronGeometry(0.8, 1);
      const coreMat = new T.MeshStandardMaterial({
        color: 0x38dfff,
        emissive: 0x11ccff,
        emissiveIntensity: 2.5
      });
      const core = new T.Mesh(coreGeo, coreMat);
      group.add(core);

      const ring = new T.Mesh(new T.TorusGeometry(1.3, 0.08, 6, 24), this.matOrangeNeon);
      ring.rotation.x = -Math.PI / 4;
      group.add(ring);
    }

    this.scene.add(group);
    this.pickups.push({
      group,
      type,
      life: 45.0, // Lasts 45 seconds
      maxLife: 45.0
    });
  }

  updatePickups(dt, playerPos, onCollect) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.life -= dt;

      // Bobbing and spinning animation
      p.group.rotation.y += dt * 2.5;
      p.group.position.y = 1.4 + Math.sin(Date.now() * 0.004 + i) * 0.35;

      // Distance check to player
      const dist = p.group.position.distanceTo(playerPos);
      if (dist < 3.8) {
        onCollect(p.type);
        this.scene.remove(p.group);
        this.pickups.splice(i, 1);
        continue;
      }

      if (p.life <= 0) {
        this.scene.remove(p.group);
        this.pickups.splice(i, 1);
      }
    }
  }

  // --- Collision Detection ---
  isBlocked(x, z, radius = 0) {
    // Map bounds
    if (Math.abs(x) > 275 - radius || Math.abs(z) > 275 - radius) {
      return true;
    }

    // Building obstacles AABB
    for (const obs of this.obstacles) {
      if (Math.abs(x - obs.x) < obs.w + radius && Math.abs(z - obs.z) < obs.d + radius) {
        return true;
      }
    }
    return false;
  }

  tryMove(pos, dx, dz, radius = 0.5) {
    let movedX = false;
    let movedZ = false;

    if (!this.isBlocked(pos.x + dx, pos.z, radius)) {
      pos.x += dx;
      movedX = true;
    }
    if (!this.isBlocked(pos.x, pos.z + dz, radius)) {
      pos.z += dz;
      movedZ = true;
    }

    return { movedX, movedZ };
  }

  clearPickups() {
    for (const p of this.pickups) {
      this.scene.remove(p.group);
    }
    this.pickups = [];
  }
}
