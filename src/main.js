/**
 * Cyber Shift: Apex Vanguard - Main Game Application
 * High-quality original transforming robot action game running entirely client-side.
 * Orchestrates rendering, camera, physics, world generation, player controls,
 * combat, enemy AI, particles, procedural audio, and UI systems.
 */

import { RenderEngine } from './renderer.js';
import { GameCamera } from './camera.js';
import { SoundSystem } from './audio.js';
import { ParticleSystem } from './particles.js';
import { WorldCity } from './world.js';
import { PlayerHero } from './player.js';
import { InputController } from './controller.js';
import { CombatSystem } from './combat.js';
import { EnemyManager } from './enemies.js';
import { UIManager } from './ui.js';

export class GameApp {
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
