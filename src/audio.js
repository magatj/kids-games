/**
 * Cyber Shift: Apex Vanguard - SoundSystem
 * Procedural Web Audio API sound synthesizer.
 * Zero external audio assets required - instant loading, 100% reliable, zero CORS issues.
 */

export class SoundSystem {
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
