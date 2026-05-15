// Slice A — minimal local player controller for the NetworkTest page.
// Reads WASD + Space keys, applies movement locally via predictionManager,
// and sends inputs to the realtime server. Includes simple gravity + jump.

const MOVE_SPEED = 4;        // units / sec
const SPRINT_MULT = 1.6;     // Shift
const JUMP_VEL = 4.5;        // initial vertical velocity
const GRAVITY = -12;         // units / sec^2
const GROUND_Y = 0;

export class LocalPlayerController {
  constructor() {
    this.keys = new Set();
    this.velocityY = 0;
    this.grounded = true;
    this.yaw = 0;
    this.anim = 'idle';
    this._onKeyDown = (e) => this.keys.add(e.code);
    this._onKeyUp = (e) => this.keys.delete(e.code);
  }

  attach() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  detach() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.keys.clear();
  }

  // Returns { dx, dy, dz, rotY, anim, dt } for predictionManager.applyInput
  step(dt) {
    const k = this.keys;
    let ix = 0, iz = 0;
    if (k.has('KeyW') || k.has('ArrowUp'))    iz -= 1;
    if (k.has('KeyS') || k.has('ArrowDown'))  iz += 1;
    if (k.has('KeyA') || k.has('ArrowLeft'))  ix -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) ix += 1;

    const sprint = k.has('ShiftLeft') || k.has('ShiftRight');
    const len = Math.hypot(ix, iz);
    if (len > 0) { ix /= len; iz /= len; }
    const speed = MOVE_SPEED * (sprint ? SPRINT_MULT : 1);
    const dx = ix * speed * dt;
    const dz = iz * speed * dt;

    // Face movement direction (simple)
    if (ix !== 0 || iz !== 0) this.yaw = Math.atan2(ix, -iz);

    // Jump + gravity
    if ((k.has('Space')) && this.grounded) {
      this.velocityY = JUMP_VEL;
      this.grounded = false;
    }
    this.velocityY += GRAVITY * dt;
    let dy = this.velocityY * dt;

    // Animation state
    let anim;
    if (!this.grounded) anim = this.velocityY > 0 ? 'jump' : 'fall';
    else if (len > 0) anim = sprint ? 'sprint' : 'walk';
    else anim = 'idle';
    this.anim = anim;

    return { dx, dy, dz, rotY: this.yaw, anim, dt, _yVel: this.velocityY };
  }

  // Called after predictionManager applies input — clamp to ground.
  postApply(predictedPos) {
    if (predictedPos.y <= GROUND_Y) {
      predictedPos.y = GROUND_Y;
      this.velocityY = 0;
      this.grounded = true;
    }
  }
}