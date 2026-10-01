/* Cyber Shift: Apex Vanguard - Standalone Game Bundle */
(() => {
"use strict";

// === audio.js ===
/**
 * Cyber Shift: Apex Vanguard - SoundSystem
 * Procedural Web Audio API sound synthesizer.
 * Zero external audio assets required - instant loading, 100% reliable, zero CORS issues.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicEnabled = true;
    this.volume = 0.7;

    // Procedural BGM sequencer variables
    this.bgmPlaying = false;
    this.bgmTimer = 0;
    this.bgmStep = 0;
    this.bgmBpm = 124;
    this.bgmStepDuration = 60 / (this.bgmBpm * 4); // 16th notes
    this.engineOsc = null;
    this.engineGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.engineGain) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return !this.muted;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    return this.musicEnabled;
  }

  // --- Sound Effects Synthesizers ---

  playTransform(toCar) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Dual-tone servo whirr
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const startFreq = toCar ? 220 : 660;
    const endFreq = toCar ? 740 : 180;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.45);

    gain.gain.setValueAtTime(0.08 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    // Mechanical latch click at the end
    setTimeout(() => {
      if (this.muted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const click = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(980, t);
      click.frequency.exponentialRampToValueAtTime(120, t + 0.08);
      clickGain.gain.setValueAtTime(0.12 * this.volume, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      click.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      click.start(t);
      click.stop(t + 0.09);
    }, 380);
  }

  playBlaster(isAlt = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isAlt ? 'square' : 'sawtooth';

    const freq = isAlt ? 1100 : 880;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);

    gain.gain.setValueAtTime(0.06 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playMeleeSwing(step = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Resonant blade whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';

    const baseFreq = 300 + step * 80;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);

    gain.gain.setValueAtTime(0.09 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playMeleeHit(isHeavy = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Dual-metal resonance
    for (const f of [260, 520, isHeavy ? 130 : 780]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + (isHeavy ? 0.28 : 0.14));

      gain.gain.setValueAtTime((isHeavy ? 0.14 : 0.08) * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.28 : 0.14));

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + (isHeavy ? 0.28 : 0.14));
    }
  }

  playExplosion(isHeavy = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Deep sub-bass boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(isHeavy ? 110 : 85, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + (isHeavy ? 0.65 : 0.45));

    subGain.gain.setValueAtTime((isHeavy ? 0.22 : 0.15) * this.volume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.65 : 0.45));

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + (isHeavy ? 0.65 : 0.45));

    // White noise explosion burst
    const dur = isHeavy ? 0.55 : 0.35;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isHeavy ? 600 : 900, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + dur);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime((isHeavy ? 0.16 : 0.1) * this.volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  playBoost() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(320, now + 0.18);

    gain.gain.setValueAtTime(0.08 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playDash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

    gain.gain.setValueAtTime(0.09 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playJump() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);

    gain.gain.setValueAtTime(0.07 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playPickup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const notes = [587.33, 880, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.08 * this.volume, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.2);
    });
  }

  playWarning() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(600, now + 0.08);

    gain.gain.setValueAtTime(0.07 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // --- Dynamic Vehicle Engine Pitch Synthesizer ---
  updateEngine(isCar, speedKmh, isBoosting) {
    if (this.muted || !this.ctx) return;

    if (!isCar) {
      if (this.engineGain) {
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return;
    }

    if (!this.engineOsc) {
      try {
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(60, this.ctx.currentTime);
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, this.ctx.currentTime);

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();
      } catch (err) {
        return;
      }
    }

    const now = this.ctx.currentTime;
    const baseFreq = 55 + Math.min(160, speedKmh * 0.8) + (isBoosting ? 65 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.05);

    const targetGain = (0.015 + Math.min(0.04, speedKmh * 0.0003) + (isBoosting ? 0.025 : 0)) * this.volume;
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
  }

  // --- Procedural Synthwave BGM Sequencer ---
  updateBGM(dt) {
    if (!this.musicEnabled || this.muted || !this.ctx) return;
    this.bgmTimer += dt;

    if (this.bgmTimer >= this.bgmStepDuration) {
      this.bgmTimer -= this.bgmStepDuration;
      this.stepBGM();
      this.bgmStep = (this.bgmStep + 1) % 32; // 2-bar loop
    }
  }

  stepBGM() {
    const now = this.ctx.currentTime;
    const step = this.bgmStep;

    // Synth bassline (Cyberpunk D minor progression: D2 -> F2 -> G2 -> C2)
    const bassProgression = [
      73.42, 73.42, 73.42, 73.42, 73.42, 73.42, 87.31, 73.42, // Bar 1
      98.0, 98.0, 98.0, 98.0, 65.41, 65.41, 73.42, 87.31      // Bar 2
    ];
    const bassNote = bassProgression[Math.floor(step / 2)];

    // Play bass on 8th notes
    if (step % 2 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassNote, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + 0.14);

      gain.gain.setValueAtTime(0.04 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    }

    // Synth Kick on beats 0, 4, 8, 12, 16, 20, 24, 28
    if (step % 4 === 0) {
      const kick = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(130, now);
      kick.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      kickGain.gain.setValueAtTime(0.07 * this.volume, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      kick.connect(kickGain);
      kickGain.connect(this.ctx.destination);
      kick.start(now);
      kick.stop(now + 0.14);
    }

    // Cyber Hi-Hat on offbeats
    if (step % 2 === 1) {
      const hatOsc = this.ctx.createOscillator();
      const hatGain = this.ctx.createGain();
      hatOsc.type = 'triangle';
      hatOsc.frequency.setValueAtTime(6500, now);

      hatGain.gain.setValueAtTime(0.015 * this.volume, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      hatOsc.connect(hatGain);
      hatGain.connect(this.ctx.destination);
      hatOsc.start(now);
      hatOsc.stop(now + 0.04);
    }
  }
}


// === particles.js ===
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

class ParticleSystem {
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


// === renderer.js ===
/**
 * Cyber Shift: Apex Vanguard - RenderEngine
 * Handles WebGL rendering, lighting, shadows, atmospheric sky dome,
 * and high/low graphics quality scaling.
 */

class RenderEngine {
  constructor(canvas) {
    const T = window.THREE;
    this.canvas = canvas;
    this.highQuality = true;

    // 1. WebGL Renderer with fallback
    try {
      this.renderer = new T.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (e1) {
      try {
        this.renderer = new T.WebGLRenderer({
          canvas: this.canvas,
          antialias: false,
          powerPreference: 'default'
        });
      } catch (e2) {
        throw new Error('WebGL not supported: ' + (e2.message || e1.message));
      }
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    // 2. Scene & Atmospheric Fog
    this.scene = new T.Scene();
    this.scene.fog = new T.FogExp2(0x121b2b, 0.0032);

    // 3. Sky Dome Shader
    this.buildSkyDome();

    // 4. Lighting Rig
    this.hemiLight = new T.HemisphereLight(0x75d5ff, 0x221326, 2.2);
    this.scene.add(this.hemiLight);

    // Sun with shadow mapping
    this.sun = new T.DirectionalLight(0xffbe85, 3.4);
    this.sun.position.set(-80, 120, 60);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, {
      left: -85,
      right: 85,
      top: 85,
      bottom: -85,
      near: 1,
      far: 300
    });
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 0.06;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    // Cyber Rim Light
    this.rimLight = new T.DirectionalLight(0x38dfff, 1.8);
    this.rimLight.position.set(45, 35, -70);
    this.scene.add(this.rimLight);

    // Distant Neon Sun / Cyber Moon disc
    const sunMat = new T.MeshBasicMaterial({ color: 0xffe2b8, fog: false });
    const sunMesh = new T.Mesh(new T.SphereGeometry(22, 24, 16), sunMat);
    sunMesh.position.set(-280, 110, -420);
    this.scene.add(sunMesh);

    // Window resize binding
    window.addEventListener('resize', () => this.onWindowResize());
  }

  buildSkyDome() {
    const T = window.THREE;
    const skyGeo = new T.SphereGeometry(650, 32, 16);
    const skyMat = new T.ShaderMaterial({
      side: T.BackSide,
      uniforms: {
        topColor: { value: new T.Color('#08101e') },
        midColor: { value: new T.Color('#192b42') },
        horizonColor: { value: new T.Color('#ff8f5a') }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          vec3 col = mix(horizonColor, midColor, clamp(pow(max(h, 0.0), 0.5), 0.0, 1.0));
          col = mix(col, topColor, clamp(pow(max(h, 0.0), 1.8), 0.0, 1.0));
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    const sky = new T.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  setQuality(isHigh) {
    this.highQuality = isHigh;
    const ratio = isHigh ? Math.min(window.devicePixelRatio || 1, 1.75) : 1.0;
    this.renderer.setPixelRatio(ratio);
    this.renderer.shadowMap.enabled = isHigh;

    if (this.sun) {
      this.sun.castShadow = isHigh;
      if (isHigh) {
        this.sun.shadow.mapSize.set(2048, 2048);
      }
    }

    this.scene.traverse((obj) => {
      if (obj.material) {
        obj.material.needsUpdate = true;
      }
    });

    return this.highQuality;
  }

  updateLightFollow(targetPos) {
    // Keep shadow map centered around the player
    this.sun.position.set(targetPos.x - 80, 120, targetPos.z + 60);
    this.sun.target.position.copy(targetPos);
  }

  onWindowResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render(camera) {
    this.renderer.render(this.scene, camera);
  }
}


// === camera.js ===
/**
 * Cyber Shift: Apex Vanguard - GameCamera
 * Handles third-person chase camera for vehicle mode,
 * over-the-shoulder combat camera for robot mode,
 * obstacle collision pull-in, dynamic speed FOV, and trauma screen shake.
 */

class GameCamera {
  constructor(canvas) {
    const T = window.THREE;
    this.camera = new T.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.2, 900);
    this.canvas = canvas;

    // Camera states
    this.baseFov = 54;
    this.currentFov = 54;
    this.targetFov = 54;

    // Screen shake trauma (0 to 1)
    this.trauma = 0;
    this.shakeDecay = 2.5;

    // Smoothing parameters
    this.desiredPos = new T.Vector3(0, 10, 20);
    this.lookTarget = new T.Vector3();

    // Mouse aiming offsets
    this.yaw = 0;
    this.pitch = 0;

    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  update(dt, player, isCar, speedKmh, isBoosting, lockedEnemy = null, worldObstacles = []) {
    const T = window.THREE;
    const pos = player.position;
    const heading = player.heading;

    // 1. Dynamic FOV
    const speedRatio = Math.min(1.0, Math.abs(speedKmh) / 180);
    this.targetFov = this.baseFov + (isCar ? speedRatio * 10 : 0) + (isBoosting ? 14 : 0);
    this.currentFov += (this.targetFov - this.currentFov) * Math.min(1, dt * 5);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();

    // 2. Camera Distance & Height
    const distance = isCar ? (12.0 + (isBoosting ? 2.5 : 0)) : 10.5;
    const height = isCar ? 4.6 : 6.0;

    // 3. Compute desired camera position behind player
    const behindX = -Math.sin(heading) * distance;
    const behindZ = -Math.cos(heading) * distance;
    this.desiredPos.set(pos.x + behindX, pos.y + height, pos.z + behindZ);

    // 4. Obstacle collision pull-in (prevent wall clipping)
    for (const obs of worldObstacles) {
      if (Math.abs(this.desiredPos.x - obs.x) < obs.w + 1.2 &&
          Math.abs(this.desiredPos.z - obs.z) < obs.d + 1.2) {
        // Push camera above or closer
        this.desiredPos.y += 5.0;
        this.desiredPos.x += (pos.x - this.desiredPos.x) * 0.4;
        this.desiredPos.z += (pos.z - this.desiredPos.z) * 0.4;
      }
    }

    // 5. Smooth Camera Movement (Lerp)
    const lerpRate = isCar ? 6.5 : 8.5;
    this.camera.position.lerp(this.desiredPos, 1 - Math.exp(-dt * lerpRate));

    // 6. Camera Look-at Target
    const lookHeight = isCar ? 1.8 : 3.0;
    const lookLead = isCar ? 8.0 : 4.0;
    const leadX = Math.sin(heading) * lookLead;
    const leadZ = Math.cos(heading) * lookLead;

    if (lockedEnemy && !isCar) {
      // Soft tracking on locked target in robot mode
      const enemyPos = lockedEnemy.model.position;
      this.lookTarget.lerp(
        new T.Vector3(
          pos.x * 0.6 + enemyPos.x * 0.4,
          lookHeight + 0.5,
          pos.z * 0.6 + enemyPos.z * 0.4
        ),
        1 - Math.exp(-dt * 8)
      );
    } else {
      this.lookTarget.lerp(
        new T.Vector3(pos.x + leadX, pos.y + lookHeight, pos.z + leadZ),
        1 - Math.exp(-dt * 8)
      );
    }

    // 7. Trauma Shake Offset
    if (this.trauma > 0) {
      const shakeAmt = this.trauma * this.trauma * 0.45;
      const shakeX = (Math.random() - 0.5) * shakeAmt;
      const shakeY = (Math.random() - 0.5) * shakeAmt;
      const shakeZ = (Math.random() - 0.5) * shakeAmt;
      this.camera.position.add(new T.Vector3(shakeX, shakeY, shakeZ));

      this.trauma = Math.max(0, this.trauma - dt * this.shakeDecay);
    }

    this.camera.lookAt(this.lookTarget);
  }

  setMenuPose() {
    this.camera.position.set(12, 6.8, 16);
    this.camera.lookAt(-2.5, 2.8, 0);
  }
}


// === world.js ===
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

class WorldCity {
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


// === player.js ===
/**
 * Cyber Shift: Apex Vanguard - PlayerHero
 * Procedural articulated transforming robot model with:
 * - 2 original Hero Frames: Aegis Stryker (Heavy) & Volt Phantom (Recon)
 * - Articulated mechanical transformation folding
 * - Melee energy blade weapon with dynamic slashing animations
 * - Front twin plasma blasters & vehicle headlights/exhausts
 * - Physics states: walking, jumping, drifting, boosting, dashing
 */

class PlayerHero {
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


// === controller.js ===
/**
 * Cyber Shift: Apex Vanguard - InputController
 * Manages keyboard, mouse, and touch inputs,
 * and processes vehicle steering, acceleration, drifting, and boost dynamics.
 */

class InputController {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.mouse = { x: 0, y: 0, leftDown: false, rightDown: false };
    this.callbacks = {};

    this.bindEvents();
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  emit(event, ...args) {
    if (this.callbacks[event]) {
      this.callbacks[event](...args);
    }
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;

      if (e.repeat) return;

      if (e.code === 'KeyT') this.emit('transform');
      if (e.code === 'KeyC') this.emit('switchHero');
      if (e.code === 'KeyE') this.emit('ability');
      if (e.code === 'Escape' || e.code === 'KeyP') this.emit('pause');
      if (e.code === 'KeyJ') this.emit('melee');
      if (e.code === 'KeyK') this.emit('ranged');
    });

    window.addEventListener('keyup', (e) => {
      delete this.keys[e.code];
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.emit('pause');
    });

    // Mouse bindings
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.leftDown = true;
        this.emit('melee');
      } else if (e.button === 2) {
        this.mouse.rightDown = true;
        this.emit('ranged');
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.leftDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch controls bindings
    document.querySelectorAll('[data-key]').forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        btn.setPointerCapture(e.pointerId);
        const code = btn.dataset.key;
        this.keys[code] = true;
        if (code === 'KeyJ') this.emit('melee');
        if (code === 'Space') this.emit('ranged');
      });

      const release = (e) => {
        delete this.keys[btn.dataset.key];
      };
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
    });

    const touchTransform = document.getElementById('touchTransform');
    if (touchTransform) {
      touchTransform.addEventListener('click', () => this.emit('transform'));
    }
  }

  // --- Vehicle & Robot Movement Update ---
  updatePlayerMovement(dt, player, worldCity, soundSystem, particles) {
    const isW = this.keys.KeyW || this.keys.ArrowUp;
    const isS = this.keys.KeyS || this.keys.ArrowDown;
    const isA = this.keys.KeyA || this.keys.ArrowLeft;
    const isD = this.keys.KeyD || this.keys.ArrowRight;
    const isShift = this.keys.ShiftLeft || this.keys.ShiftRight;
    const isSpace = this.keys.Space;

    const forwardInput = (isW ? 1 : 0) - (isS ? 1 : 0);
    const turnInput = (isA ? 1 : 0) - (isD ? 1 : 0);

    const cfg = player.getHeroColors();

    // 1. Dash Movement (Robot mode active dash)
    if (player.isDashing) {
      const dashSpeed = 38.0;
      const dx = player.dashDirection.x * dashSpeed * dt;
      const dz = player.dashDirection.z * dashSpeed * dt;
      worldCity.tryMove(player.position, dx, dz, 0.8);
      return;
    }

    // 2. Continuous Energy Recharge
    const isBoosting = isShift && forwardInput > 0 && player.boostEnergy > 3;
    if (isBoosting) {
      player.boostEnergy = Math.max(0, player.boostEnergy - 32 * dt);
      soundSystem.playBoost();

      // Nitro boost flame particles
      if (player.isCar) {
        particles.createBoostFlame(
          player.position.clone().add(new window.THREE.Vector3(0, 0.8, 0)),
          player.heading,
          player.heroType === 1 ? 0x00d4ff : 0xff7b38
        );
      }
    } else {
      // Regenerate boost energy
      player.boostEnergy = Math.min(
        player.maxBoostEnergy,
        player.boostEnergy + (player.overchargedTimer > 0 ? 40 : 18) * dt
      );
    }

    // 3. Movement Physics Differentiation: Vehicle vs Robot Mode
    if (player.isCar) {
      // --- VEHICLE MODE (Arcade Driving Physics) ---
      const maxSpeed = cfg.maxSpeedCar * (isBoosting ? cfg.boostMultiplier : 1.0);
      const accelRate = isBoosting ? 28 : 16;
      const brakeRate = 32;

      // Drifting with Space or hard cornering
      const isDrifting = isSpace && Math.abs(player.speed) > 12;
      const turnRate = (isDrifting ? 3.2 : 2.2) * (player.speed < -1 ? -1 : 1);

      if (forwardInput > 0) {
        player.speed = Math.min(maxSpeed, player.speed + accelRate * dt);
      } else if (forwardInput < 0) {
        // Reverse
        player.speed = Math.max(-14, player.speed - brakeRate * dt);
      } else {
        // Natural friction coasting
        player.speed *= Math.exp(-dt * (isDrifting ? 1.2 : 2.5));
        if (Math.abs(player.speed) < 0.1) player.speed = 0;
      }

      // Steering (scaled by speed to avoid sudden snapping at high velocity)
      if (Math.abs(player.speed) > 0.5) {
        const speedFactor = Math.min(1.0, Math.abs(player.speed) / 20);
        player.heading += turnInput * turnRate * speedFactor * dt;
      }

      // Tire smoke & sparks when drifting
      if (isDrifting && Math.abs(player.speed) > 14) {
        particles.createDriftSparks(player.position, player.heading, turnInput > 0);
      }

      // Engine pitch audio update
      soundSystem.updateEngine(true, player.speedKmh, isBoosting);

    } else {
      // --- ROBOT MODE (Combat Omnidirectional Physics) ---
      const maxSpeed = cfg.maxSpeedRobot;
      const targetSpeed = forwardInput * maxSpeed;
      player.speed += (targetSpeed - player.speed) * Math.min(1, dt * 10);

      // Snappy turning in robot mode
      player.heading += turnInput * 3.4 * dt;

      // Thruster Dash Trigger on Shift in Robot Mode
      if (isShift && !player.isDashing && player.boostEnergy >= 18) {
        const moveDir = new window.THREE.Vector3(
          Math.sin(player.heading) * (forwardInput || 1),
          0,
          Math.cos(player.heading) * (forwardInput || 1)
        );
        player.triggerDash(moveDir, soundSystem, particles);
      }

      // Stop vehicle engine audio
      soundSystem.updateEngine(false, 0, false);
    }

    // 4. Position Displacement with Obstacle Collision
    const moveX = Math.sin(player.heading) * player.speed * dt;
    const moveZ = Math.cos(player.heading) * player.speed * dt;
    const hitRadius = player.isCar ? 1.1 : 0.8;

    const moveResult = worldCity.tryMove(player.position, moveX, moveZ, hitRadius);

    // Wall bounce / deceleration
    if (!moveResult.movedX || !moveResult.movedZ) {
      player.speed *= 0.6;
    }
  }
}


// === combat.js ===
/**
 * Cyber Shift: Apex Vanguard - CombatSystem
 * Manages player attacks, 3-hit melee combos, plasma projectiles,
 * vehicle kinetic ramming, EMP shockwaves, and damage calculations.
 */

class CombatSystem {
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


// === enemies.js ===
/**
 * Cyber Shift: Apex Vanguard - EnemyManager
 * Manages 3 original enemy robot types:
 * 1. Scrap-Viper: Light melee scout drone (fast, agile swarmer)
 * 2. Null Sentinel: Ranged artillery walker (strafes, fires burst laser volleys)
 * 3. Titan Dreadnought: Massive siege colossus boss (ground stomp shockwaves, missile barrage)
 * Includes destructible death animations with physics-driven debris.
 */

class EnemyManager {
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


// === ui.js ===
/**
 * Cyber Shift: Apex Vanguard - UIManager
 * Manages the cyberpunk sci-fi heads-up display (HUD):
 * - Health, energy, and form indicators
 * - Digital speedometer & combo counter
 * - Real-time radar / minimap canvas
 * - Smart lock-on targeting reticle & enemy health gauge
 * - Garage hero selection, pause modal, victory/game-over screens
 */

class UIManager {
  constructor() {
    this.$ = (id) => document.getElementById(id);

    this.radarCanvas = this.$('radar');
    this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;

    this.toastTimer = 0;
    this.hudUpdateTimer = 0;

    this.callbacks = {};
    this.bindButtons();
  }

  on(event, fn) {
    this.callbacks[event] = fn;
  }

  emit(event, ...args) {
    if (this.callbacks[event]) {
      this.callbacks[event](...args);
    }
  }

  bindButtons() {
    const click = (id, event) => {
      const el = this.$(id);
      if (el) el.addEventListener('click', () => this.emit(event));
    };

    click('startBtn', 'start');
    click('previewBtn', 'previewTransform');
    click('transformBtn', 'transform');
    click('abilityBtn', 'ability');
    click('pauseBtn', 'pause');
    click('resumeBtn', 'resume');
    click('restartBtn', 'restart');
    click('soundBtn', 'toggleSound');
    click('musicBtn', 'toggleMusic');
    click('qualityBtn', 'toggleQuality');

    // Hero selection cards
    document.querySelectorAll('[data-hero]').forEach((card) => {
      card.addEventListener('click', () => {
        const type = parseInt(card.dataset.hero, 10);
        this.emit('selectHero', type);
      });
    });
  }

  showToast(text, duration = 3.0) {
    const el = this.$('toast');
    if (!el) return;
    el.textContent = text;
    el.style.opacity = '1';
    this.toastTimer = duration;
  }

  setDamageFlash(amount) {
    const el = this.$('damageFlash');
    if (el) {
      el.style.opacity = (amount * 0.8).toString();
    }
  }

  updateHUD(dt, player, enemyManager, worldCity, combatSystem, gameState) {
    // 1. Toast timer
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        const el = this.$('toast');
        if (el) el.style.opacity = '0';
      }
    }

    this.hudUpdateTimer += dt;
    if (this.hudUpdateTimer < 0.05) return; // 20 FPS HUD throttle for high performance
    this.hudUpdateTimer = 0;

    // 2. Health & Boost Energy Bars
    const hpRatio = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
    const hpBar = this.$('health');
    if (hpBar) {
      hpBar.style.width = hpRatio + '%';
      hpBar.style.background = hpRatio < 25 ? '#ff3b5c' : (hpRatio < 50 ? '#ff9900' : '#38dfff');
    }
    const hpText = this.$('healthText');
    if (hpText) hpText.textContent = Math.ceil(hpRatio) + '%';

    const energyBar = this.$('energy');
    if (energyBar) {
      const enRatio = Math.max(0, Math.min(100, (player.boostEnergy / player.maxBoostEnergy) * 100));
      energyBar.style.width = enRatio + '%';
    }

    // 3. Current Mode & Speedometer
    const formEl = this.$('form');
    if (formEl) {
      formEl.textContent = player.isCar ? 'APEX INTERCEPTOR' : 'COMBAT ROBOT';
      formEl.className = player.isCar ? 'mode-car' : 'mode-robot';
    }

    const speedEl = this.$('speed');
    if (speedEl) speedEl.textContent = player.speedKmh.toString();

    // 4. Ability Cooldown Status
    const abilityEl = this.$('ability');
    if (abilityEl) {
      if (combatSystem.shockwaveCooldown > 0) {
        abilityEl.textContent = `EMP CHARGING ${Math.ceil(combatSystem.shockwaveCooldown)}s`;
        abilityEl.style.color = '#ff9900';
      } else {
        abilityEl.textContent = 'E · EMP SHOCKWAVE READY';
        abilityEl.style.color = '#38dfff';
      }
    }

    // 5. Combo Counter
    const comboEl = this.$('combo');
    if (comboEl) {
      if (combatSystem.comboCount > 1) {
        comboEl.textContent = `COMBO x${combatSystem.comboCount}!`;
        comboEl.style.opacity = '1';
      } else {
        comboEl.style.opacity = '0';
      }
    }

    // 6. Wave & Objectives
    const remainingEnemies = enemyManager.getActiveEnemies().length;
    const waveEl = this.$('wave');
    if (waveEl) waveEl.textContent = gameState.isRoam ? 'FREE CRUISE' : `WAVE 0${enemyManager.currentWave} / 03`;

    const remainingEl = this.$('remaining');
    if (remainingEl) remainingEl.textContent = `${remainingEnemies} HOSTILES`;

    const progBar = this.$('waveProgress');
    if (progBar && enemyManager.totalInWave > 0) {
      const prog = (enemyManager.killsThisWave / enemyManager.totalInWave) * 100;
      progBar.style.width = `${prog}%`;
    }

    const missionTitle = this.$('missionTitle');
    if (missionTitle) {
      if (gameState.isRoam) missionTitle.textContent = 'NEO-KYOTO LIBERATED';
      else if (enemyManager.currentWave === 3) missionTitle.textContent = 'ELIMINATE TITAN DREADNOUGHT';
      else missionTitle.textContent = 'SWEEP & SECURE SECTOR 09';
    }

    // 7. Lock-On Target Reticle
    const targetEnemy = enemyManager.getNearestEnemyInSight(player.position, player.heading, 90);
    const reticleEl = this.$('reticle');
    const targetLabel = this.$('targetLabel');

    if (targetEnemy) {
      if (reticleEl) {
        reticleEl.style.borderColor = targetEnemy.isBoss ? '#ff9900' : '#38dfff';
        reticleEl.classList.add('locked');
      }
      if (targetLabel) {
        const hpPct = Math.ceil((targetEnemy.health / targetEnemy.maxHealth) * 100);
        const name = targetEnemy.isBoss ? 'TITAN DREADNOUGHT' : (targetEnemy.type === 'sentinel' ? 'NULL SENTINEL' : 'SCRAP-VIPER');
        targetLabel.textContent = `${name} [ ${hpPct}% ]`;
      }
    } else {
      if (reticleEl) {
        reticleEl.style.borderColor = 'rgba(56, 223, 255, 0.4)';
        reticleEl.classList.remove('locked');
      }
      if (targetLabel) targetLabel.textContent = '';
    }

    // 8. Render Radar Minimap
    this.renderRadar(player, enemyManager, worldCity);
  }

  renderRadar(player, enemyManager, worldCity) {
    if (!this.radarCtx) return;
    const ctx = this.radarCtx;
    const w = 170;
    const h = 170;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.28; // Map scale to radar

    ctx.clearRect(0, 0, w, h);

    // Radar background with circular grid
    ctx.fillStyle = 'rgba(8, 18, 32, 0.85)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(56, 223, 255, 0.15)';
    ctx.lineWidth = 1;

    // Grid crosshairs
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();

    // Range rings
    ctx.beginPath();
    ctx.arc(cx, cy, 35, 0, Math.PI * 2);
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.stroke();

    // Pickups (Green squares)
    ctx.fillStyle = '#4dfc8f';
    for (const p of worldCity.pickups) {
      const rx = cx + (p.group.position.x - player.position.x) * scale;
      const ry = cy + (p.group.position.z - player.position.z) * scale;
      if (rx >= 4 && rx <= w - 4 && ry >= 4 && ry <= h - 4) {
        ctx.fillRect(rx - 2, ry - 2, 4, 4);
      }
    }

    // Hostile Enemies (Color coded dots)
    for (const enemy of enemyManager.getActiveEnemies()) {
      const rx = cx + (enemy.model.position.x - player.position.x) * scale;
      const ry = cy + (enemy.model.position.z - player.position.z) * scale;
      if (rx >= 4 && rx <= w - 4 && ry >= 4 && ry <= h - 4) {
        ctx.fillStyle = enemy.isBoss ? '#ff9900' : (enemy.type === 'sentinel' ? '#ff7b38' : '#ff3b5c');
        ctx.beginPath();
        ctx.arc(rx, ry, enemy.isBoss ? 4.5 : 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player Direction Arrow in Center
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-player.heading);
    ctx.fillStyle = player.heroType === 1 ? '#00d4ff' : '#ffd700';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  updateGarageCards(heroType) {
    document.querySelectorAll('[data-hero]').forEach((card, idx) => {
      card.classList.toggle('selected', idx === heroType);
    });

    const isVolt = heroType === 1;
    const titleEl = this.$('heroTitle');
    if (titleEl) titleEl.textContent = isVolt ? 'VOLT PHANTOM' : 'AEGIS STRYKER';

    const classEl = this.$('heroClass');
    if (classEl) classEl.textContent = isVolt ? 'HYPER-RECON / V-02' : 'APEX INTERCEPTOR / A-01';

    const descEl = this.$('heroDescription');
    if (descEl) {
      descEl.textContent = isVolt
        ? 'Superior aerodynamic speed, twin pulse blasters, lightning agile drift.'
        : 'Heavily armored titanium plating, twin heavy railguns, crushing kinetic impact.';
    }
  }

  showDialog(type, score = 0) {
    const dialog = this.$('dialog');
    if (!dialog) return;
    dialog.hidden = false;

    const tag = this.$('dialogTag');
    const title = this.$('dialogTitle');
    const text = this.$('dialogText');
    const resumeBtn = this.$('resumeBtn');

    if (type === 'pause') {
      tag.textContent = 'SYSTEM STANDBY / TACTICAL PAUSE';
      title.textContent = 'OPERATION PAUSED';
      text.textContent = 'Controls: WASD to drive/move. T to transform. Left Click/J for melee blade. Right Click/K for plasma blasters. Shift for boost/dash. Space to drift/jump. E for EMP shockwave.';
      resumeBtn.textContent = 'RESUME MISSION ↗';
    } else if (type === 'win') {
      tag.textContent = 'MISSION ACCOMPLISHED / SECTOR 09 SECURE';
      title.textContent = 'VICTORY ACHIEVED';
      text.textContent = `The Null Syndicate forces have been neutralized! Tactical Score: ${score.toLocaleString()} PTS. Free cruise around the city, or launch a new defense wave.`;
      resumeBtn.textContent = 'FREE CRUISE ↗';
    } else if (type === 'gameover') {
      tag.textContent = 'FRAME CRITICAL / EMERGENCY TELEPORT';
      title.textContent = 'CHASSIS OFFLINE';
      text.textContent = 'Armor integrity reached zero. Tip: Transform to vehicle mode to quickly dodge enemy fire, and collect glowing green Nanite Repair Cores.';
      resumeBtn.textContent = 'REPAIR & RETRY ↗';
    }
  }

  hideDialog() {
    const dialog = this.$('dialog');
    if (dialog) dialog.hidden = true;
  }
}


// === main.js ===
/**
 * Cyber Shift: Apex Vanguard - Main Game Application
 * High-quality original transforming robot action game running entirely client-side.
 * Orchestrates rendering, camera, physics, world generation, player controls,
 * combat, enemy AI, particles, procedural audio, and UI systems.
 */











class GameApp {
  constructor() {
    const canvas = document.getElementById('world');
    if (!canvas || !window.THREE) {
      const err = document.getElementById('error');
      if (err) err.hidden = false;
      return;
    }

    // 1. Initialize Subsystems
    try {
      this.renderer = new RenderEngine(canvas);
    } catch (e) {
      console.error(e);
      const err = document.getElementById('error');
      if (err) err.hidden = false;
      return;
    }
    this.camera = new GameCamera(canvas);
    this.sound = new SoundSystem();
    this.particles = new ParticleSystem(this.renderer.scene);
    this.world = new WorldCity(this.renderer.scene);
    this.player = new PlayerHero(this.renderer.scene, 0);
    this.controller = new InputController(canvas);
    this.combat = new CombatSystem(this.renderer.scene, this.particles, this.sound, this.camera);
    this.enemies = new EnemyManager(this.renderer.scene, this.particles, this.sound, this.combat);
    this.ui = new UIManager();

    // 2. Application State
    this.state = {
      mode: 'menu', // 'menu' | 'playing' | 'paused' | 'win' | 'gameover'
      score: 0,
      isRoam: false,
      nextWaveTimer: 0,
      damageVignette: 0
    };

    // 3. Connect Event Handlers
    this.setupEvents();

    // 4. Position Camera for Menu Showroom
    this.camera.setMenuPose();

    // 5. Start Render / Game Loop
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupEvents() {
    // Controller Input Events
    this.controller.on('transform', () => {
      this.sound.init();
      this.player.triggerTransform(this.sound, this.particles);
      if (this.state.mode === 'playing') {
        this.ui.showToast(
          this.player.isCar ? 'APEX INTERCEPTOR ENGAGED • MAX VELOCITY' : 'COMBAT ROBOT ENGAGED • BLADES ACTIVE'
        );
      }
    });

    this.controller.on('melee', () => {
      this.sound.init();
      if (this.state.mode === 'playing') {
        this.combat.triggerMelee(this.player, this.enemies, this.world);
      }
    });

    this.controller.on('ranged', () => {
      this.sound.init();
      if (this.state.mode === 'playing') {
        this.combat.triggerRanged(this.player, this.enemies, this.world);
      }
    });

    this.controller.on('ability', () => {
      this.sound.init();
      if (this.state.mode === 'playing') {
        this.combat.triggerShockwave(this.player, this.enemies);
      }
    });

    this.controller.on('switchHero', () => {
      this.selectHero(1 - this.player.heroType);
    });

    this.controller.on('pause', () => {
      if (this.state.mode === 'playing') {
        this.pause();
      } else if (this.state.mode === 'paused') {
        this.resume();
      }
    });

    // UI Events
    this.ui.on('start', () => this.startGame());
    this.ui.on('previewTransform', () => {
      this.sound.init();
      this.player.triggerTransform(this.sound, this.particles);
    });
    this.ui.on('transform', () => {
      this.sound.init();
      this.player.triggerTransform(this.sound, this.particles);
      this.ui.showToast(
        this.player.isCar ? 'APEX INTERCEPTOR ENGAGED' : 'COMBAT ROBOT ENGAGED'
      );
    });
    this.ui.on('ability', () => {
      this.sound.init();
      if (this.state.mode === 'playing') {
        this.combat.triggerShockwave(this.player, this.enemies);
      }
    });
    this.ui.on('pause', () => this.pause());
    this.ui.on('resume', () => {
      if (this.state.mode === 'win') {
        this.enterFreeCruise();
      } else if (this.state.mode === 'gameover') {
        this.startGame();
      } else {
        this.resume();
      }
    });
    this.ui.on('restart', () => this.startGame());
    this.ui.on('selectHero', (type) => this.selectHero(type));

    this.ui.on('toggleSound', () => {
      const active = this.sound.toggleMute();
      const btn = document.getElementById('soundBtn');
      if (btn) btn.textContent = active ? 'SOUND: ON' : 'SOUND: OFF';
    });

    this.ui.on('toggleMusic', () => {
      const active = this.sound.toggleMusic();
      const btn = document.getElementById('musicBtn');
      if (btn) btn.textContent = active ? 'MUSIC: ON' : 'MUSIC: OFF';
    });

    this.ui.on('toggleQuality', () => {
      const isHigh = this.renderer.setQuality(!this.renderer.highQuality);
      const btn = document.getElementById('qualityBtn');
      if (btn) btn.textContent = isHigh ? 'QUALITY: HIGH' : 'QUALITY: LITE';
    });

    // Enemy Death Loot Dropper Callback
    this.enemies.onEnemyKilled = (enemy, pos) => {
      this.state.score += enemy.isBoss ? 1500 : (enemy.type === 'sentinel' ? 250 : 100);
      // Drop Repair Core or Overcharge Matrix
      if (enemy.isBoss || Math.random() > 0.4) {
        const lootType = Math.random() > 0.3 ? 'repair' : 'overcharge';
        this.world.spawnPickup(pos, lootType);
      }
    };
  }

  selectHero(type) {
    this.player.setHeroType(type);
    this.ui.updateGarageCards(type);
    this.sound.playBlaster(type === 1);
    if (this.state.mode === 'playing') {
      const cfg = this.player.getHeroColors();
      this.ui.showToast(`${cfg.name} DEPLOYED TO FIELD`);
    }
  }

  startGame() {
    this.sound.init();
    this.combat.clearProjectiles();
    this.particles.clear();
    this.world.clearPickups();
    this.enemies.clearEnemies();

    // Reset Player
    this.player.health = 100;
    this.player.boostEnergy = 100;
    this.player.speed = 0;
    this.player.isCar = false;
    this.player.transformProgress = 0;
    this.player.position.set(0, 0, 15);
    this.player.heading = Math.PI;

    this.state.mode = 'playing';
    this.state.score = 0;
    this.state.isRoam = false;
    this.state.nextWaveTimer = 0;

    // UI Updates
    document.getElementById('menu').hidden = true;
    document.getElementById('hud').hidden = false;
    document.getElementById('pauseBtn').hidden = false;
    document.body.classList.add('playing');
    this.ui.hideDialog();

    // Spawn Initial Wave
    this.enemies.spawnWave(1, this.player.position);
    this.ui.showToast('WAVE 01 INCOMING • SECURE THE SECTOR');
    this.sound.playWarning();
  }

  pause() {
    if (this.state.mode !== 'playing') return;
    this.state.mode = 'paused';
    this.ui.showDialog('pause');
  }

  resume() {
    if (this.state.mode !== 'paused') return;
    this.state.mode = 'playing';
    this.ui.hideDialog();
  }

  enterFreeCruise() {
    this.state.mode = 'playing';
    this.state.isRoam = true;
    this.player.health = 100;
    this.ui.hideDialog();
    this.ui.showToast('SECTOR SECURE • ENJOY FREE CRUISE');
  }

  triggerVictory() {
    this.state.mode = 'win';
    this.sound.playExplosion(true);
    this.ui.showDialog('win', this.state.score);
  }

  triggerGameOver() {
    this.state.mode = 'gameover';
    this.sound.playExplosion(false);
    this.ui.showDialog('gameover', this.state.score);
  }

  // --- Main Animation & Simulation Frame ---
  animate(now) {
    requestAnimationFrame(this.animate);
    const dt = Math.min((now - this.lastTime) * 0.001, 0.05);
    this.lastTime = now;

    if (this.state.mode === 'menu') {
      // Menu showroom: slow rotate and preview pose
      const time = now * 0.001;
      this.player.root.rotation.y = -0.4 + Math.sin(time * 0.4) * 0.2;
      this.player.updatePose(dt, time, 0);
      this.renderer.render(this.camera.camera);
      return;
    }

    if (this.state.mode === 'playing') {
      // 1. Procedural Synthwave BGM update
      this.sound.updateBGM(dt);

      // 2. Player Input & Vehicle Physics
      this.controller.updatePlayerMovement(dt, this.player, this.world, this.sound, this.particles);

      // 3. Player Model & Pose Update
      this.player.update(dt, this.world, this.particles, this.sound);

      // 4. Camera Follow & Dynamic Zoom
      const nearestEnemy = this.enemies.getNearestEnemyInSight(this.player.position, this.player.heading, 85);
      const isShift = this.controller.keys.ShiftLeft || this.controller.keys.ShiftRight;
      this.camera.update(
        dt,
        this.player,
        this.player.isCar,
        this.player.speedKmh,
        isShift && this.player.boostEnergy > 3,
        nearestEnemy,
        this.world.obstacles
      );

      // 5. Combat & Projectiles Simulation
      this.combat.update(dt, this.player, this.enemies, this.world);

      // 6. Enemy AI Simulation
      this.enemies.update(dt, this.player, this.world);

      // 7. World Pickups Update (Health & Boost Cores)
      this.world.updatePickups(dt, this.player.position, (pickupType) => {
        if (pickupType === 'repair') {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 32);
          this.sound.playPickup();
          this.particles.createRepairSparkle(this.player.position);
          this.ui.showToast('NANITE REPAIR CORE • +32 HP RECOVERED');
        } else {
          this.player.boostEnergy = this.player.maxBoostEnergy;
          this.player.overchargedTimer = 10.0; // 10s of overcharged rapid fire!
          this.sound.playPickup();
          this.particles.createShockwave(this.player.position, 0x38dfff, 10);
          this.ui.showToast('OVERCHARGE MATRIX • BOOST REFILLED & RAPID FIRE');
        }
      });

      // 8. Wave Progression Logic
      if (!this.state.isRoam && this.enemies.getActiveEnemies().length === 0) {
        this.state.nextWaveTimer += dt;
        if (this.state.nextWaveTimer > 2.8) {
          this.state.nextWaveTimer = 0;
          if (this.enemies.currentWave < 3) {
            const nextWave = this.enemies.currentWave + 1;
            this.enemies.spawnWave(nextWave, this.player.position);
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
            this.ui.showToast(
              nextWave === 3 ? 'FINAL WAVE • THE TITAN DREADNOUGHT IS HERE!' : `WAVE 0${nextWave} INCOMING`
            );
            this.sound.playWarning();
          } else {
            this.triggerVictory();
          }
        }
      }

      // 9. Player Health & Defeat Check
      if (this.player.health <= 0) {
        this.triggerGameOver();
      }

      // 10. Damage Vignette Flash
      if (this.player.invulnerableTimer > 0) {
        this.ui.setDamageFlash(this.player.invulnerableTimer * 2);
      } else {
        this.ui.setDamageFlash(0);
      }

      // 11. Light rig follow player for crisp shadow maps
      this.renderer.updateLightFollow(this.player.position);

      // 12. Particles Update
      this.particles.update(dt);

      // 13. UI & HUD Update
      this.ui.updateHUD(dt, this.player, this.enemies, this.world, this.combat, this.state);
    }

    // Render WebGL Scene
    this.renderer.render(this.camera.camera);
  }
}

// Instantiate on window load
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});

})();
