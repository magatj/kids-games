/**
 * Cyber Shift: Apex Vanguard - InputController
 * Manages keyboard, mouse, and touch inputs,
 * and processes vehicle steering, acceleration, drifting, and boost dynamics.
 */

export class InputController {
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
