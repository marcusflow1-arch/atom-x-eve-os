import * as THREE from 'three';

// Locomotion on the character creator stage.
//
// The Walk and Run clips are authored on each body (tools/avatar-motion/locomotion.mjs) and play in place; the stage
// floor scrolls under the character at the clip's authored speed, so a planted foot stays planted on the floor.
// Nothing ever snaps or restarts:
//  - leaving Idle, the gait clip starts at the phase whose legs best match the pose on screen, and the remaining
//    difference fades out from the pose on screen (inertial blending, the motion keeps its velocity);
//  - Walk <-> Run is a phase-locked blend: both clips advance on one shared gait phase while their weights cross, so
//    the feet stay in step and the floor speed blends with them;
//  - stopping waits for the next heel strike (both feet on or near the ground) before easing into Idle.

const LEG_NODES = ['pelvis', 'thigh_l', 'calf_l', 'foot_l', 'thigh_r', 'calf_r', 'foot_r'];
const MATCH_SAMPLES = 32;

// GLTFLoader drops animation extras (speed, cycle length, foot contacts); read them from the parser's JSON.
export function clipExtras(gltf) {
  const out = new Map();
  for (const anim of gltf?.parser?.json?.animations || []) if (anim?.name) out.set(anim.name, anim.extras || {});
  return out;
}

// Local transforms of a clip at any time, without touching a mixer.
export class ClipSampler {
  constructor(root, clip) {
    this.tracks = [];
    for (const track of clip?.tracks || []) {
      const { nodeName, propertyName } = THREE.PropertyBinding.parseTrackName(track.name);
      if (propertyName !== 'quaternion' && propertyName !== 'position') continue;
      const node = THREE.PropertyBinding.findNode(root, nodeName);
      if (node) this.tracks.push({ node, propertyName, interpolant: track.createInterpolant() });
    }
  }

  nodes() {
    return [...new Set(this.tracks.map((track) => track.node))];
  }

  sample(time, only = null) {
    const pose = new Map();
    for (const { node, propertyName, interpolant } of this.tracks) {
      if (only && !only.has(node)) continue;
      const value = interpolant.evaluate(time);
      const entry = pose.get(node) || {};
      entry[propertyName] = propertyName === 'quaternion' ? new THREE.Quaternion().fromArray(value) : new THREE.Vector3().fromArray(value);
      pose.set(node, entry);
    }
    return pose;
  }
}

const rotationVector = (q, out = new THREE.Vector3()) => {
  let { x, y, z, w } = q;
  if (w < 0) { x = -x; y = -y; z = -z; w = -w; }
  const s = Math.hypot(x, y, z);
  if (s < 1e-9) return out.set(0, 0, 0);
  return out.set(x, y, z).multiplyScalar((2 * Math.atan2(s, w)) / s);
};
const rotationFromVector = (v, out = new THREE.Quaternion()) => {
  const angle = v.length();
  if (angle < 1e-9) return out.identity();
  const s = Math.sin(angle / 2) / angle;
  return out.set(v.x * s, v.y * s, v.z * s, Math.cos(angle / 2));
};

// Inertial blending: when the animation source changes, the pose on screen continues (with its velocity) and the
// difference to the new source decays as a critically damped spring. Call `settle(dt)` once per frame after
// everything has posed the skeleton; `begin()` right before the source changes.
export class PoseInertializer {
  constructor(nodes, { halfLife = 0.11 } = {}) {
    this.nodes = [...nodes];
    this.lambda = 1.678 / halfLife; // (1 + lambda t) e^(-lambda t) halves at lambda t = 1.678
    this.last = null;
    this.previous = null;
    this.lastDt = 1 / 60;
    this.pending = null;
    this.offsets = null;
    this.time = 0;
  }

  // destinationVelocity: Map(node -> { angular: Vector3 (rad/s), linear: Vector3 }) of the new source at its start
  begin(destinationVelocity = null) {
    if (this.last) this.pending = { destinationVelocity };
  }

  active() {
    return Boolean(this.pending || this.offsets);
  }

  settle(dt) {
    if (dt <= 0) return;
    if (this.offsets) this._unapply();
    if (this.pending) this._capture(dt);
    if (this.offsets) this._apply(dt);
    this._record(dt);
  }

  // three's mixer only writes a property when its animated value changed since the frame before, so a node it left
  // alone still holds last frame's blended value: put the animated value back before blending again
  _unapply() {
    for (const [node, o] of this.offsets) {
      if (o.shownQ && node.quaternion.equals(o.shownQ)) node.quaternion.copy(o.rawQ);
      if (o.shownP && node.position.equals(o.shownP)) node.position.copy(o.rawP);
    }
  }

  _capture(dt) {
    const { destinationVelocity } = this.pending;
    this.pending = null;
    const offsets = new Map(), qa = new THREE.Quaternion(), va = new THREE.Vector3();
    for (const node of this.nodes) {
      const last = this.last.get(node), previous = this.previous?.get(node);
      if (!last) continue;
      // where the old motion would be now: the last pose carried on by its velocity
      const angular = previous ? rotationVector(qa.copy(last.q).multiply(previous.q.clone().invert())).divideScalar(this.lastDt) : new THREE.Vector3();
      const linear = previous ? last.p.clone().sub(previous.p).divideScalar(this.lastDt) : new THREE.Vector3();
      const predicted = rotationFromVector(va.copy(angular).multiplyScalar(dt), qa).multiply(last.q);
      const destination = destinationVelocity?.get(node);
      offsets.set(node, {
        x: rotationVector(predicted.clone().multiply(node.quaternion.clone().invert())),
        v: angular.clone().sub(destination?.angular || new THREE.Vector3()),
        px: last.p.clone().addScaledVector(linear, dt).sub(node.position),
        pv: linear.clone().sub(destination?.linear || new THREE.Vector3()),
      });
    }
    this.offsets = offsets;
    this.time = 0;
  }

  _apply(dt) {
    const t = this.time, decay = Math.exp(-this.lambda * t), q = new THREE.Quaternion(), x = new THREE.Vector3();
    if (this.lambda * t > 9) { this.offsets = null; return; } // spent: the animated values are back in place
    for (const [node, o] of this.offsets) {
      (o.rawQ ||= new THREE.Quaternion()).copy(node.quaternion);
      (o.rawP ||= new THREE.Vector3()).copy(node.position);
      x.copy(o.x).multiplyScalar(1 + this.lambda * t).addScaledVector(o.v, t).multiplyScalar(decay);
      node.quaternion.premultiply(rotationFromVector(x, q));
      node.position.add(x.copy(o.px).multiplyScalar(1 + this.lambda * t).addScaledVector(o.pv, t).multiplyScalar(decay));
      (o.shownQ ||= new THREE.Quaternion()).copy(node.quaternion);
      (o.shownP ||= new THREE.Vector3()).copy(node.position);
    }
    this.time += dt;
  }

  _record(dt) {
    const pose = this.previous && this.previous.size === this.nodes.length ? this.previous : new Map();
    for (const node of this.nodes) {
      const entry = pose.get(node) || { q: new THREE.Quaternion(), p: new THREE.Vector3() };
      entry.q.copy(node.quaternion);
      entry.p.copy(node.position);
      pose.set(node, entry);
    }
    this.previous = this.last;
    this.last = pose;
    this.lastDt = dt;
  }
}

const smoothstep = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

export class CreatorLocomotion {
  // onIdle(): put the body's own idle on the mixer at full weight (called when a stop reaches Idle)
  constructor({ root, mixer, clips = [], extras = new Map(), scale = 1, onIdle, blendTime = 0.4, halfLife = 0.11 }) {
    this.root = root;
    this.mixer = mixer;
    this.scale = scale;
    this.onIdle = onIdle;
    this.blendTime = blendTime;
    this.gaits = new Map();
    const nodes = new Set();
    for (const clip of clips) {
      const info = extras.get(clip?.name) || {};
      const sampler = new ClipSampler(root, clip);
      sampler.nodes().forEach((node) => nodes.add(node));
      if (!info.inPlace || !(info.speed > 0) || !(info.cycleSeconds > 0)) continue;
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.setEffectiveTimeScale(0); // the gait phase below drives the clip time
      this.gaits.set(clip.name, { name: clip.name, clip, action, sampler, speed: info.speed, cycle: info.cycleSeconds, duration: clip.duration, weight: 0 });
    }
    this.legs = new Set(LEG_NODES.map((name) => root.getObjectByName(name)).filter(Boolean));
    for (const gait of this.gaits.values()) {
      gait.table = Array.from({ length: MATCH_SAMPLES }, (_, i) => gait.sampler.sample((i / MATCH_SAMPLES) * gait.cycle, this.legs));
    }
    this.inertia = new PoseInertializer(nodes, { halfLife });
    this.state = 'Idle';
    this.target = 'Idle';
    this.phase = 0; // gait cycles since the gait started (fraction = position in the cycle, 0 = left heel strike)
    this.ramp = 1;
    this.speed = 0; // floor speed, metres per second in the scene
  }

  names() {
    return [...this.gaits.keys()];
  }

  current() {
    return this.target;
  }

  moving() {
    return this.state !== 'Idle';
  }

  request(name) {
    if (name !== 'Idle' && !this.gaits.has(name)) return false;
    this.target = name;
    if (name === 'Idle') { this.stopAt = this.state === 'Idle' ? null : this._nextContact(); return true; }
    this.stopAt = null;
    if (this.state === 'Idle') this._start(name);
    else this.state = name;
    return true;
  }

  // drop back to Idle at once (another animation takes the body over); the change of source is still blended
  cancel() {
    if (this.state === 'Idle') return;
    this.inertia.begin();
    for (const gait of this.gaits.values()) { gait.weight = 0; gait.action.stop(); }
    this.state = this.target = 'Idle';
    this.stopAt = null;
  }

  // before the mixer update: advance the shared gait phase, set clip times and weights
  drive(dt) {
    if (this.state === 'Idle' || dt <= 0) { this.speed += (0 - this.speed) * (1 - Math.exp(-dt * 10)); return; }
    const k = 1 - Math.exp(-dt * (3 / this.blendTime));
    let rate = 0, speed = 0, total = 0;
    for (const gait of this.gaits.values()) {
      gait.weight += ((gait.name === this.state ? 1 : 0) - gait.weight) * k;
      if (gait.weight < 1e-3 && gait.name !== this.state) gait.weight = 0;
      total += gait.weight;
    }
    for (const gait of this.gaits.values()) {
      const w = total > 0 ? gait.weight / total : 0;
      rate += w / gait.cycle;
      speed += w * gait.speed;
    }
    // a start eases the cadence and the floor in together (the feet stay planted while the body gets going)
    this.ramp = Math.min(1, this.ramp + dt / 0.35);
    const ease = 0.2 + 0.8 * smoothstep(this.ramp);
    const before = this.phase;
    this.phase += dt * rate * ease;
    this.speed = speed * this.scale * ease;
    for (const gait of this.gaits.values()) {
      const w = total > 0 ? gait.weight / total : 0;
      if (w <= 0) { if (gait.action.isRunning()) gait.action.stop(); continue; }
      if (!gait.action.isRunning()) gait.action.reset().setEffectiveTimeScale(0).play();
      gait.action.setEffectiveWeight(w);
      gait.action.time = ((this.phase * gait.cycle) % gait.duration + gait.duration) % gait.duration;
    }
    if (this.stopAt !== null && this.stopAt !== undefined && before < this.stopAt && this.phase >= this.stopAt) this._stop();
  }

  // after every mixer / runtime update: blend from the pose on screen and remember it
  settle(dt) {
    this.inertia.settle(dt);
  }

  _start(name) {
    const gait = this.gaits.get(name);
    const start = this._bestPhase(gait);
    this.inertia.begin(this._velocity(gait, start));
    this.mixer.stopAllAction();
    for (const other of this.gaits.values()) other.weight = 0;
    gait.weight = 1;
    this.phase = start;
    this.ramp = 0;
    this.state = name;
    gait.action.reset().setEffectiveTimeScale(0).setEffectiveWeight(1).play();
    gait.action.time = start * gait.cycle;
  }

  _stop() {
    this.inertia.begin();
    for (const gait of this.gaits.values()) { gait.weight = 0; gait.action.stop(); }
    this.state = 'Idle';
    this.stopAt = null;
    this.onIdle?.();
  }

  // the next heel strike of either foot (phase 0 or 0.5 of the cycle), at least a few frames away
  _nextContact() {
    const p = this.phase + 0.06;
    return Math.ceil(p * 2) / 2;
  }

  // the cycle phase whose legs are closest to the pose on screen
  _bestPhase(gait) {
    let best = 0, bestCost = Infinity;
    gait.table.forEach((pose, i) => {
      let cost = 0;
      for (const [node, entry] of pose) if (entry.quaternion) { const a = node.quaternion.angleTo(entry.quaternion); cost += a * a; }
      if (cost < bestCost) { bestCost = cost; best = i / MATCH_SAMPLES; }
    });
    return best;
  }

  _velocity(gait, phase) {
    const h = 1 / 120, t = phase * gait.cycle, a = gait.sampler.sample(t), b = gait.sampler.sample(t + h), out = new Map();
    for (const [node, entry] of a) {
      const next = b.get(node);
      out.set(node, {
        angular: entry.quaternion && next?.quaternion ? rotationVector(next.quaternion.clone().multiply(entry.quaternion.clone().invert())).divideScalar(h) : new THREE.Vector3(),
        linear: entry.position && next?.position ? next.position.clone().sub(entry.position).divideScalar(h) : new THREE.Vector3(),
      });
    }
    return out;
  }
}

// A stage floor with a faint grid that scrolls under the character while it walks or runs. The radial fade stays
// fixed under the character; only the grid moves.
export function createStageFloor({ size = 8, cell = 0.5, color = 'rgba(150, 196, 255, 0.5)' } = {}) {
  const grid = document.createElement('canvas');
  grid.width = grid.height = 256;
  const g = grid.getContext('2d');
  g.strokeStyle = color;
  g.lineWidth = 3;
  g.strokeRect(0, 0, 256, 256);
  g.globalAlpha = 0.35;
  g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
  const fade = document.createElement('canvas');
  fade.width = fade.height = 128;
  const f = fade.getContext('2d'), radial = f.createRadialGradient(64, 64, 0, 64, 64, 64);
  radial.addColorStop(0, '#ffffff'); radial.addColorStop(0.4, '#9a9a9a'); radial.addColorStop(1, '#000000');
  f.fillStyle = radial;
  f.fillRect(0, 0, 128, 128);
  const map = new THREE.CanvasTexture(grid);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(size / cell, size / cell);
  map.anisotropy = 8;
  map.colorSpace = THREE.SRGBColorSpace;
  const alphaMap = new THREE.CanvasTexture(fade);
  const material = new THREE.MeshBasicMaterial({ map, alphaMap, transparent: true, depthWrite: false, opacity: 0.6, toneMapped: false });
  material.userData.outlineParameters = { visible: false };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.014;
  mesh.renderOrder = -1;
  return {
    mesh,
    // move the grid by (dx, dz) metres in the world
    scroll(dx, dz) {
      map.offset.x -= (dx / size) * map.repeat.x;
      map.offset.y += (dz / size) * map.repeat.y;
    },
    dispose() {
      mesh.geometry.dispose();
      material.dispose();
      map.dispose();
      alphaMap.dispose();
    },
  };
}
