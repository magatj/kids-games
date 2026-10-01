/**
 * Cyber Shift: Apex Vanguard - GameCamera
 * Handles third-person chase camera for vehicle mode,
 * over-the-shoulder combat camera for robot mode,
 * obstacle collision pull-in, dynamic speed FOV, and trauma screen shake.
 */

export class GameCamera {
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
