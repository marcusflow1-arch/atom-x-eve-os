import * as THREE from 'three';

// The creator stage's living face: the character keeps eye contact with the camera as it orbits (the eyes lead, the
// head, neck and upper chest follow within natural limits, and it lets go when the camera goes behind it or while it
// runs), and it reacts to changes in the creator with a short expression (a smile, a curious brow, a smirk).
//
// It is a layer on top of whatever animation poses the body: call restore() at the start of a frame, before any mixer
// updates, and update(dt) after everything else has posed the skeleton. three's mixer only writes a property when its
// animated value changed, so restore() puts back the animated values this layer covered (the same reason as
// PoseInertializer._unapply in creatorLocomotion.js).

const UP = new THREE.Vector3(0, 1, 0);
const deg = THREE.MathUtils.degToRad;
const clamp = THREE.MathUtils.clamp;
const smooth = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
const approach = (value, target, rate, dt) => value + (target - value) * (1 - Math.exp(-rate * dt));
// how the look rotation is shared out, chest to head (the eyes take the rest)
const CHAIN = [['spine_02', 0.12], ['neck_01', 0.33], ['head', 0.55]];
const LIMITS = { headYaw: deg(60), headUp: deg(18), headDown: deg(24), eyeYaw: deg(28), eyePitch: deg(16) };
// the head turns most of the way and the eyes cover the rest, as people do
const HEAD_SHARE = { yaw: 0.8, pitch: 0.65 };

export const REACTIONS = {
  pleased: { morphs: { Smile_Left: 0.42, Smile_Right: 0.42, MouthCorner_Up: 0.2, Eye_Squint_Left: 0.22, Eye_Squint_Right: 0.22, Brow_Up_Left: 0.1, Brow_Up_Right: 0.1 }, tilt: 3, nod: 3 },
  curious: { morphs: { Brow_Inner_Up: 0.35, Brow_Up_Left: 0.3, Brow_Up_Right: 0.16, Eye_Wide_Left: 0.15, Eye_Wide_Right: 0.15 }, tilt: -5, nod: -2 },
  smirk: { morphs: { Smile_Left: 0.5, MouthCorner_Up: 0.1, Brow_Up_Right: 0.22, Eye_Squint_Left: 0.15 }, tilt: 2, nod: 1 },
};
const ORDER = ['pleased', 'curious', 'smirk'];
const ENVELOPE = { attack: 0.35, hold: 1.1, release: 1.0 };

// signed angle from a to b about the vertical, and the elevation of a direction
const yawBetween = (a, b) => Math.atan2(a.z * b.x - a.x * b.z, a.x * b.x + a.z * b.z);
const elevation = (v) => Math.asin(clamp(v.y, -1, 1));

// Each eye's gaze axis in its bone's space: from the bone (the eyeball's pivot) through the centre of its iris, in the bind
// pose (the iris mesh follows the eye bone). These bodies' eyes rest a few degrees apart, so aiming this axis, not the
// head's forward, is what makes both eyes meet the camera. null for an eye without an iris mesh.
export function irisAxes(root, eyes) {
  return eyes.map((eye) => {
    let axis = null;
    root.traverse((mesh) => {
      if (axis || !mesh.isSkinnedMesh || !/iris/i.test(mesh.name)) return;
      const bone = mesh.skeleton.bones.indexOf(eye), g = mesh.geometry;
      const pos = g.getAttribute('position'), index = g.getAttribute('skinIndex'), weight = g.getAttribute('skinWeight');
      if (bone < 0 || !pos || !index || !weight) return;
      const centre = new THREE.Vector3(), p = new THREE.Vector3();
      let n = 0;
      for (let i = 0; i < pos.count; i++) {
        let w = 0;
        for (let k = 0; k < 4; k++) if (index.getComponent(i, k) === bone) w += weight.getComponent(i, k);
        if (w > 0.5) { centre.add(p.fromBufferAttribute(pos, i)); n++; }
      }
      if (n < 8) return;
      const toBone = new THREE.Matrix4().multiplyMatrices(mesh.skeleton.boneInverses[bone], mesh.bindMatrix);
      axis = centre.multiplyScalar(1 / n).applyMatrix4(toBone).normalize();
    });
    return axis;
  });
}

// small, quick eye flicks while holding a gaze (deterministic, so a stage replays the same)
const SACCADE = { yaw: deg(1.4), pitch: deg(0.9), every: [0.7, 2.4] };
function random(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export class CreatorFace {
  // null when the body lacks a head with eye bones
  static attach(root, options = {}) {
    const head = root?.getObjectByName('head'), eyes = ['eye_l', 'eye_r'].map((name) => root?.getObjectByName(name));
    if (!head?.isBone || eyes.some((eye) => !eye?.isBone)) return null;
    return new CreatorFace(root, head, eyes, options);
  }

  constructor(root, head, eyes, { camera = null } = {}) {
    this.root = root;
    this.camera = camera;
    this.head = head;
    this.eyes = eyes;
    this.chain = CHAIN.map(([name, share]) => [root.getObjectByName(name), share]).filter(([node]) => node?.isBone);
    root.traverse((node) => { if (!this.face && node.isMesh && node.morphTargetDictionary?.Smile_Left !== undefined) this.face = node; });
    this.calibration = null;
    this.look = { yaw: 0, pitch: 0, weight: 0 };
    this.eyeLook = eyes.map(() => ({ yaw: 0, pitch: 0 }));
    this.irises = irisAxes(root, eyes);
    this.random = random(7);
    this.saccade = { yaw: 0, pitch: 0, wait: 1 };
    this.reaction = null;
    this.reactions = 0;
    this.shownBones = new Map(); // bone -> { raw, shown }
    this.shownMorphs = new Map(); // morph index -> { raw, shown }
  }

  // Start (or keep holding) a short expression; without a kind, the next one in turn.
  react(kind) {
    const r = this.reaction;
    if (r && r.t < ENVELOPE.attack + ENVELOPE.hold) { r.t = Math.min(r.t, ENVELOPE.attack); return r.kind; }
    const next = REACTIONS[kind] ? kind : ORDER[this.reactions++ % ORDER.length];
    this.reaction = { kind: next, t: 0 };
    return next;
  }

  expression() {
    const r = this.reaction;
    if (!r) return 0;
    const { attack, hold, release } = ENVELOPE;
    return r.t < attack ? smooth(r.t / attack) : r.t < attack + hold ? 1 : 1 - smooth((r.t - attack - hold) / release);
  }

  restore() {
    for (const [node, o] of this.shownBones) if (node.quaternion.equals(o.shown)) node.quaternion.copy(o.raw);
    const influences = this.face?.morphTargetInfluences;
    if (influences) for (const [i, o] of this.shownMorphs) if (influences[i] === o.shown) influences[i] = o.raw;
    this.shownBones.clear();
    this.shownMorphs.clear();
  }

  // speed: how fast the body is travelling (m/s); busy: another animation owns the body (a skill), so let go
  update(dt, { speed = 0, busy = false } = {}) {
    if (!(dt > 0)) return;
    this.head.updateWorldMatrix(true, true);
    if (!this.calibration) this.calibration = this._calibrate();
    const { forward, lateral } = this.calibration, hq = this.head.getWorldQuaternion(new THREE.Quaternion());
    const F = forward.clone().applyQuaternion(hq), L = lateral.clone().applyQuaternion(hq);
    const eyesAt = this.eyes.map((eye) => eye.getWorldPosition(new THREE.Vector3()));
    const target = this.camera?.position;

    // how much to look: fully when the camera is in front, letting go as it swings behind or the body speeds up
    let yawError = 0, pitchError = 0, weight = 0;
    if (target) {
      const D = target.clone().sub(eyesAt[0].clone().add(eyesAt[1]).multiplyScalar(0.5)).normalize();
      yawError = yawBetween(F, D);
      pitchError = elevation(D) - elevation(F);
      weight = (1 - smooth((Math.abs(yawError) - deg(95)) / deg(45))) * (1 - smooth((speed - 0.3) / 2.6));
    }
    if (busy) weight = 0;
    const look = this.look;
    look.weight = approach(look.weight, weight, 3, dt);
    look.yaw = approach(look.yaw, clamp(yawError * HEAD_SHARE.yaw, -LIMITS.headYaw, LIMITS.headYaw) * look.weight, 4, dt);
    look.pitch = approach(look.pitch, clamp(pitchError * HEAD_SHARE.pitch, -LIMITS.headDown, LIMITS.headUp) * look.weight, 4, dt);

    // reactions: a nod and a tilt of the head with the expression
    if (this.reaction) { this.reaction.t += dt; if (this.reaction.t > ENVELOPE.attack + ENVELOPE.hold + ENVELOPE.release) this.reaction = null; }
    const e = this.expression(), reaction = this.reaction ? REACTIONS[this.reaction.kind] : null;
    const nod = reaction ? deg(reaction.nod) * e : 0, tilt = reaction ? deg(reaction.tilt) * e : 0;

    // head: yaw about the vertical, then pitch about the turned head's side axis (+ about the left axis looks down)
    const yawQ = new THREE.Quaternion().setFromAxisAngle(UP, look.yaw);
    const side = L.clone().applyQuaternion(yawQ), front = F.clone().applyQuaternion(yawQ);
    const R = new THREE.Quaternion().setFromAxisAngle(side, -look.pitch + nod).multiply(yawQ);
    R.premultiply(new THREE.Quaternion().setFromAxisAngle(front, tilt));
    const identity = new THREE.Quaternion();
    for (const [node, share] of this.chain) this._rotate(node, identity.clone().slerp(R, share));

    // eyes: each eye aims at the camera (within the eyes' range from where the head now points), with small flicks
    this.head.updateWorldMatrix(true, true);
    const F2 = F.clone().applyQuaternion(R), L2 = L.clone().applyQuaternion(R), sac = this.saccade;
    if ((sac.wait -= dt) <= 0) {
      sac.yaw = (this.random() * 2 - 1) * SACCADE.yaw; sac.pitch = (this.random() * 2 - 1) * SACCADE.pitch;
      sac.wait = SACCADE.every[0] + this.random() * (SACCADE.every[1] - SACCADE.every[0]);
    }
    this.eyes.forEach((eye, i) => {
      const s = this.eyeLook[i], iris = this.irises[i];
      let yaw = 0, pitch = 0;
      if (target) {
        const D = target.clone().sub(eye.getWorldPosition(new THREE.Vector3())).normalize();
        yaw = clamp(yawBetween(F2, D), -LIMITS.eyeYaw, LIMITS.eyeYaw);
        pitch = clamp(elevation(D) - elevation(F2), -LIMITS.eyePitch, LIMITS.eyePitch);
      }
      if (!iris) { yaw *= look.weight; pitch *= look.weight; } // no iris axis: turn the clip's eyes by the difference
      s.yaw = approach(s.yaw, yaw, 14, dt);
      s.pitch = approach(s.pitch, pitch, 14, dt);
      const ey = new THREE.Quaternion().setFromAxisAngle(UP, s.yaw + sac.yaw * look.weight), side = L2.clone().applyQuaternion(ey);
      const turn = new THREE.Quaternion().setFromAxisAngle(side, -(s.pitch + sac.pitch * look.weight)).multiply(ey);
      if (!iris) { this._rotate(eye, turn); return; }
      // with an iris axis: carry the eye's actual gaze to that direction, as far as the look's weight says
      const want = F2.clone().applyQuaternion(turn), gaze = iris.clone().applyQuaternion(eye.getWorldQuaternion(new THREE.Quaternion()));
      this._rotate(eye, new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(gaze, want), look.weight));
    });

    // expression morphs on top of the clip's face track
    const influences = this.face?.morphTargetInfluences, dict = this.face?.morphTargetDictionary;
    if (reaction && influences && e > 0) {
      for (const [name, amount] of Object.entries(reaction.morphs)) {
        const i = dict[name];
        if (i === undefined) continue;
        const raw = influences[i], shown = Math.min(1, raw + amount * e);
        influences[i] = shown;
        this.shownMorphs.set(i, { raw, shown });
      }
    }
  }

  // apply a world-space rotation to a bone (keeping its position), remembering the animated value
  _rotate(node, worldRotation) {
    const parent = node.parent.getWorldQuaternion(new THREE.Quaternion());
    const raw = node.quaternion.clone();
    node.quaternion.premultiply(parent.clone().invert().multiply(worldRotation).multiply(parent));
    const entry = this.shownBones.get(node);
    this.shownBones.set(node, { raw: entry ? entry.raw : raw, shown: node.quaternion.clone() });
    node.updateWorldMatrix(false, true);
  }

  // the face's forward and side directions in head space, measured from the eyes in the current (animated) pose
  _calibrate() {
    const [l, r] = this.eyes.map((eye) => eye.getWorldPosition(new THREE.Vector3()));
    const lateral = l.sub(r).setY(0).normalize(), forward = new THREE.Vector3().crossVectors(lateral, UP).normalize();
    const inverse = this.head.getWorldQuaternion(new THREE.Quaternion()).invert();
    return { forward: forward.applyQuaternion(inverse), lateral: lateral.applyQuaternion(inverse) };
  }
}
