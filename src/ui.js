/**
 * Cyber Shift: Apex Vanguard - UIManager
 * Manages the cyberpunk sci-fi heads-up display (HUD):
 * - Health, energy, and form indicators
 * - Digital speedometer & combo counter
 * - Real-time radar / minimap canvas
 * - Smart lock-on targeting reticle & enemy health gauge
 * - Garage hero selection, pause modal, victory/game-over screens
 */

export class UIManager {
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
