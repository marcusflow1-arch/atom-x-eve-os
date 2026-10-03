// Chidori in the PvP arena.
//
// The attacker grabs their wrist, slams the hand into the ground and charges,
// crosses the net, strikes the opponent's torso, then fades out and fades back
// in on their own side. A struck opponent is thrown back, drops to their
// knees and collapses with lightning running through their body, lies stunned
// for the server's stun window, then gets back up.
//
// Engine-agnostic: poses HumanoidRigs (so the male and female bodies move the
// same), paints the lightning into FxBuffers and returns screen hints. The PvP
// arena (three.js) and the offline preview renderer both drive it.
//
// Times: `ta` is seconds since the cast started; `tv` is seconds since impact.

import { clamp, easeOut, lerp, rng, smooth, span, v3, window4 } from './math.js';
import { COLORS, FxPainter, SHAPE, boltPath, crackle, randomDir } from './vfx.js';

export const ARENA_CHIDORI = Object.freeze({
  slam: 0.48,
  launch: 1.42,
  impact: 2.0, // must match the server's hit_ms for Chidori
  hitStop: 0.12,
  fadeOutStart: 2.42,
  fadeOutEnd: 2.6,
  home: 2.68,
  fadeInStart: 2.76,
  fadeInEnd: 2.98,
  attackerEnd: 3.8,
  stun: 2.8, // server stun, seconds after impact
  victimEnd: 3.95, // seconds after impact
  strikeGap: 0.9, // metres, centre to centre, when the palm lands
});
const T = ARENA_CHIDORI;

// ---------------------------------------------------------------------------
// Keyframed poses (actor space: metres, +Z forward, +X the fighter's left)
// ---------------------------------------------------------------------------

function lerpDeep(a, b, w) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (typeof a === 'number') return lerp(a, b, w);
  if (Array.isArray(a)) return a.map((value, i) => lerp(value, b[i], w));
  const out = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) out[key] = lerpDeep(a[key], b[key], w);
  return out;
}

const EASE = { linear: (x) => x, smooth, out: (x) => easeOut(x, 2), in: (x) => x * x, snap: (x) => easeOut(x, 4), hold: () => 0 };

function samplePose(keys, t) {
  if (t <= keys[0].t) return keys[0].pose;
  for (let i = 1; i < keys.length; i += 1) {
    const k = keys[i];
    if (t <= k.t) {
      const prev = keys[i - 1];
      return lerpDeep(prev.pose, k.pose, (EASE[k.ease] || smooth)((t - prev.t) / Math.max(1e-4, k.t - prev.t)));
    }
  }
  return keys[keys.length - 1].pose;
}

const feet = (ah, lx, lz, rx, rz, extra = {}) => ({
  legL: { target: [lx, ah, lz], pole: [0.25, 0, 1], yaw: 0.3, pitch: 0, ...(extra.legL || {}) },
  legR: { target: [rx, ah, rz], pole: [-0.25, 0, 1], yaw: -0.35, pitch: 0, ...(extra.legR || {}) },
});

function attackerKeys(ah) {
  const IDLE = {
    hips: { offset: [0, -0.07, 0], pitch: 0.08, yaw: 0.14, roll: 0 },
    spine: { pitch: 0.04, yaw: 0.06, roll: 0 },
    head: { pitch: -0.06, yaw: -0.18, roll: 0 },
    clavL: { raise: 0, fwd: 0 }, clavR: { raise: 0, fwd: 0 },
    armL: { target: [0.3, 0.95, 0.14], pole: [0.5, -0.2, -1], twist: 0, flex: 0, curl: 0.2 },
    armR: { target: [-0.29, 0.97, 0.12], pole: [-0.5, -0.2, -1], twist: 0, flex: 0, curl: 0.2 },
    grab: 0, thrust: 0,
    ...feet(ah, 0.18, 0.12, -0.18, -0.12),
  };
  const GRAB = {
    ...IDLE,
    hips: { offset: [0.02, -0.24, -0.04], pitch: 0.34, yaw: 0.05, roll: 0.02 },
    spine: { pitch: 0.24, yaw: 0.04, roll: 0 },
    head: { pitch: -0.36, yaw: -0.05, roll: 0 },
    clavR: { raise: -0.05, fwd: 0.2 },
    armR: { target: [-0.22, 0.62, 0.46], pole: [-0.9, 0.1, -0.5], twist: -0.3, flex: 0.4, curl: 0.05 },
    armL: { target: [0.1, 0.8, 0.4], pole: [0.8, -0.3, -0.6], twist: 0, flex: 0, curl: 0.5 },
    grab: 1,
    ...feet(ah, 0.3, 0.32, -0.3, -0.3, { legL: { yaw: 0.4 }, legR: { yaw: -0.5 } }),
  };
  const SLAM = {
    ...GRAB,
    hips: { offset: [0.03, -0.43, -0.02], pitch: 0.62, yaw: 0.02, roll: 0.03 },
    spine: { pitch: 0.3, yaw: 0.02, roll: 0 },
    head: { pitch: -0.85, yaw: 0, roll: 0 },
    clavR: { raise: -0.12, fwd: 0.35 },
    armR: { target: [-0.3, 0.075, 0.64], pole: [-1, 0.3, -0.35], twist: -0.2, flex: 0.9, curl: 0 },
    ...feet(ah, 0.34, 0.4, -0.34, -0.36, { legL: { yaw: 0.45 }, legR: { yaw: -0.55 } }),
  };
  const CHARGE = {
    ...SLAM,
    hips: { offset: [0.03, -0.46, -0.05], pitch: 0.66, yaw: 0, roll: 0.03 },
    head: { pitch: -0.9, yaw: 0.02, roll: 0 },
  };
  const LAUNCH = {
    ...CHARGE,
    hips: { offset: [0, -0.3, 0.12], pitch: 0.92, yaw: -0.08, roll: 0 },
    spine: { pitch: 0.12, yaw: 0, roll: 0 },
    head: { pitch: -1.05, yaw: 0, roll: 0 },
    clavR: { raise: 0, fwd: -0.1 }, clavL: { raise: 0, fwd: -0.1 },
    armR: { target: [-0.4, 0.2, -0.3], pole: [-0.6, 0.6, 0.4], twist: -0.4, flex: 0.2, curl: 0 },
    armL: { target: [0.4, 0.55, -0.42], pole: [0.6, 0.6, 0.3], twist: 0, flex: 0, curl: 0.4 },
    grab: 0,
    ...feet(ah, 0.15, 0.45, -0.18, -0.5, { legR: { pitch: 0.6 } }),
  };
  const RUSH = {
    ...LAUNCH,
    hips: { offset: [0, -0.3, 0.12], pitch: 1.0, yaw: -0.05, roll: 0 },
    spine: { pitch: 0.2, yaw: 0, roll: 0 },
    head: { pitch: -1.25, yaw: 0, roll: 0 },
    armR: { target: [-0.42, 0.22, -0.46], pole: [-0.5, 0.7, 0.4], twist: -0.4, flex: 0.1, curl: 0 },
    armL: { target: [0.42, 0.5, -0.52], pole: [0.5, 0.7, 0.3], twist: 0, flex: 0, curl: 0.4 },
  };
  const WINDUP = {
    ...RUSH,
    hips: { offset: [0, -0.22, 0.02], pitch: 0.5, yaw: -0.35, roll: 0 },
    spine: { pitch: 0.18, yaw: -0.2, roll: 0 },
    head: { pitch: -0.5, yaw: 0.25, roll: 0 },
    armR: { target: [-0.42, 0.95, -0.3], pole: [-0.5, -0.4, -0.6], twist: -0.3, flex: -0.2, curl: 0 },
    ...feet(ah, 0.2, 0.5, -0.24, -0.55, { legR: { pitch: 0.4 } }),
  };
  const THRUST = {
    ...WINDUP,
    hips: { offset: [0, -0.24, 0.02], pitch: 0.32, yaw: 0.45, roll: 0 },
    spine: { pitch: 0.16, yaw: 0.3, roll: 0.05 },
    head: { pitch: -0.3, yaw: -0.55, roll: 0 },
    clavR: { raise: 0.05, fwd: 0.45 }, clavL: { raise: 0, fwd: -0.2 },
    armR: { target: [-0.1, 1.2, 0.8], pole: [-0.6, -0.8, 0.1], twist: 0.2, flex: -0.25, curl: 0.1 },
    armL: { target: [0.4, 0.92, -0.38], pole: [0.6, -0.4, -0.4], twist: 0, flex: 0, curl: 0.8 },
    thrust: 1,
    ...feet(ah, 0.22, 0.55, -0.26, -0.6, { legR: { pitch: 0.5, yaw: -0.5 } }),
  };
  const DRIVE = {
    ...THRUST,
    hips: { offset: [0, -0.27, 0.08], pitch: 0.42, yaw: 0.5, roll: 0 },
    spine: { pitch: 0.2, yaw: 0.34, roll: 0.05 },
  };
  const FINISH = {
    ...IDLE,
    hips: { offset: [0, -0.1, 0], pitch: 0.02, yaw: -0.12, roll: 0 },
    spine: { pitch: 0.04, yaw: -0.04, roll: 0 },
    head: { pitch: 0.18, yaw: 0.05, roll: 0 },
    clavR: { raise: 0.02, fwd: 0.15 },
    armR: { target: [-0.05, 1.22, 0.3], pole: [-1, -0.7, -0.2], twist: 0.6, flex: -0.15, curl: 0.1 },
    armL: { target: [0.12, 1.1, 0.3], pole: [1, -0.6, -0.2], twist: 0, flex: 0, curl: 0.5 },
    grab: 1, thrust: 0,
  };
  const RELAX = { ...FINISH, head: { pitch: -0.02, yaw: 0.1, roll: 0 }, armR: IDLE.armR, armL: IDLE.armL, grab: 0 };
  return [
    { t: 0, pose: IDLE },
    { t: 0.3, pose: GRAB, ease: 'out' },
    { t: 0.4, pose: lerpDeep(GRAB, SLAM, 0.25), ease: 'smooth' },
    { t: T.slam, pose: SLAM, ease: 'in' },
    { t: 0.72, pose: CHARGE, ease: 'out' },
    { t: 1.32, pose: CHARGE },
    { t: 1.5, pose: LAUNCH, ease: 'out' },
    { t: 1.8, pose: RUSH },
    { t: 1.92, pose: WINDUP, ease: 'smooth' },
    { t: T.impact, pose: THRUST, ease: 'snap' },
    { t: T.impact + T.hitStop, pose: THRUST, ease: 'hold' },
    { t: 2.4, pose: DRIVE, ease: 'out' },
    { t: T.home - 0.001, pose: DRIVE },
    { t: T.home, pose: FINISH, ease: 'snap' },
    { t: 3.25, pose: FINISH },
    { t: T.attackerEnd, pose: RELAX, ease: 'smooth' },
  ];
}

function victimKeys(ah) {
  const STAND = {
    hips: { offset: [0, -0.08, 0], pitch: 0.1, yaw: -0.1, roll: 0 },
    spine: { pitch: 0.06, yaw: -0.05, roll: 0 },
    head: { pitch: 0.02, yaw: 0.1, roll: 0 },
    clavL: { raise: 0, fwd: 0.1 }, clavR: { raise: 0, fwd: 0.1 },
    armL: { target: [0.2, 1.22, 0.3], pole: [0.8, -1, -0.2], twist: 0, flex: 0.3, curl: 0.9 },
    armR: { target: [-0.18, 1.16, 0.26], pole: [-0.8, -1, -0.2], twist: 0, flex: 0.3, curl: 0.9 },
    grab: 0, thrust: 0,
    ...feet(ah, 0.17, 0.1, -0.17, -0.1, { legL: { yaw: 0.25 }, legR: { yaw: -0.25 } }),
  };
  const HIT = {
    ...STAND,
    hips: { offset: [0, -0.12, -0.14], pitch: 0.38, yaw: 0, roll: 0 },
    spine: { pitch: 0.5, yaw: 0, roll: 0 },
    head: { pitch: 0.55, yaw: 0, roll: 0 },
    clavL: { raise: 0.2, fwd: 0.3 }, clavR: { raise: 0.2, fwd: 0.3 },
    armL: { target: [0.42, 1.3, 0.34], pole: [0.8, -0.6, -0.4], twist: 0, flex: -0.4, curl: -0.2 },
    armR: { target: [-0.42, 1.3, 0.34], pole: [-0.8, -0.6, -0.4], twist: 0, flex: -0.4, curl: -0.2 },
    ...feet(ah, 0.17, 0.05, -0.19, -0.2),
  };
  const PUSHED = {
    ...HIT,
    hips: { offset: [0, -0.16, -0.18], pitch: 0.46, yaw: 0.05, roll: 0 },
    spine: { pitch: 0.62, yaw: 0, roll: 0 },
    head: { pitch: 0.65, yaw: 0, roll: 0 },
    armL: { target: [0.34, 0.95, 0.42], pole: [0.8, -0.6, -0.4], twist: 0, flex: 0, curl: 0.2 },
    armR: { target: [-0.32, 0.92, 0.44], pole: [-0.8, -0.6, -0.4], twist: 0, flex: 0, curl: 0.2 },
  };
  const STAGGER = {
    ...PUSHED,
    hips: { offset: [0, -0.13, -0.04], pitch: -0.1, yaw: 0.12, roll: 0.06 },
    spine: { pitch: -0.18, yaw: 0.08, roll: 0.05 },
    head: { pitch: -0.42, yaw: 0.2, roll: 0.15 },
    clavL: { raise: 0, fwd: 0 }, clavR: { raise: 0, fwd: 0 },
    armL: { target: [0.3, 0.86, 0.02], pole: [0.5, -0.2, -1], twist: 0, flex: 0, curl: 0.3 },
    armR: { target: [-0.3, 0.84, 0.05], pole: [-0.5, -0.2, -1], twist: 0, flex: 0, curl: 0.3 },
    ...feet(ah, 0.2, -0.1, -0.15, 0.12),
  };
  const KNEEL = {
    ...STAGGER,
    hips: { offset: [0, -0.46, 0.04], pitch: 0.18, yaw: 0.05, roll: -0.04 },
    spine: { pitch: 0.42, yaw: 0, roll: -0.05 },
    head: { pitch: 0.6, yaw: -0.1, roll: -0.1 },
    armL: { target: [0.28, 0.34, 0.3], pole: [0.5, 0.2, -1], twist: 0, flex: 0, curl: 0.2 },
    armR: { target: [-0.27, 0.33, 0.28], pole: [-0.5, 0.2, -1], twist: 0, flex: 0, curl: 0.2 },
    legL: { target: [0.16, 0.11, -0.42], pole: [0.2, -0.6, 1], yaw: 0.1, pitch: 1.2 },
    legR: { target: [-0.16, 0.11, -0.4], pole: [-0.2, -0.6, 1], yaw: -0.1, pitch: 1.2 },
  };
  const FALLEN = {
    ...KNEEL,
    hips: { offset: [0, -0.78, 0.4], pitch: 1.5, yaw: 0.12, roll: -0.12 },
    spine: { pitch: 0.06, yaw: 0.1, roll: -0.1 },
    head: { pitch: 0.15, yaw: 1.1, roll: 0.2 },
    clavL: { raise: 0.25, fwd: 0.1 }, clavR: { raise: 0.1, fwd: 0.1 },
    armL: { target: [0.72, 0.07, 0.95], pole: [0.2, 1, -0.3], twist: 0, flex: 0, curl: 0.3 },
    armR: { target: [-0.48, 0.06, 0.2], pole: [-0.3, 1, 0.3], twist: 0, flex: 0, curl: 0.5 },
    legL: { target: [0.2, 0.08, -0.62], pole: [0.2, -1, 0.3], yaw: 0.2, pitch: 1.45 },
    legR: { target: [-0.1, 0.09, -0.56], pole: [-0.2, -1, 0.3], yaw: -0.1, pitch: 1.45 },
  };
  const BOUNCE = { ...FALLEN, hips: { ...FALLEN.hips, offset: [0, -0.7, 0.42], pitch: 1.42 } };
  // Getting up: push off the ground, one knee, then back into stance.
  const PUSH_UP = {
    ...FALLEN,
    hips: { offset: [0, -0.62, 0.3], pitch: 1.05, yaw: 0.05, roll: 0 },
    spine: { pitch: 0.2, yaw: 0, roll: 0 },
    head: { pitch: -0.2, yaw: 0.2, roll: 0 },
    armL: { target: [0.3, 0.07, 0.62], pole: [0.4, 0.6, -0.8], twist: 0, flex: 0.6, curl: 0 },
    armR: { target: [-0.3, 0.07, 0.6], pole: [-0.4, 0.6, -0.8], twist: 0, flex: 0.6, curl: 0 },
  };
  const ONE_KNEE = {
    ...KNEEL,
    hips: { offset: [0, -0.4, 0.02], pitch: 0.3, yaw: 0, roll: 0 },
    spine: { pitch: 0.25, yaw: 0, roll: 0 },
    head: { pitch: 0.1, yaw: 0, roll: 0 },
    armL: { target: [0.25, 0.62, 0.42], pole: [0.6, -0.4, -0.8], twist: 0, flex: 0, curl: 0.5 },
    armR: { target: [-0.3, 0.5, 0.2], pole: [-0.6, -0.4, -0.8], twist: 0, flex: 0, curl: 0.5 },
    legL: { target: [0.18, ah, 0.35], pole: [0.2, 0, 1], yaw: 0.2, pitch: 0 },
    legR: { target: [-0.16, 0.11, -0.4], pole: [-0.2, -0.6, 1], yaw: -0.1, pitch: 1.2 },
  };
  return [
    { t: 0, pose: STAND },
    { t: 0.02, pose: HIT, ease: 'snap' },
    { t: T.hitStop, pose: HIT, ease: 'hold' },
    { t: 0.45, pose: PUSHED, ease: 'out' },
    { t: 0.8, pose: STAGGER, ease: 'smooth' },
    { t: 1.2, pose: KNEEL, ease: 'in' },
    { t: 1.3, pose: KNEEL },
    { t: 1.55, pose: FALLEN, ease: 'in' },
    { t: 1.65, pose: BOUNCE, ease: 'out' },
    { t: 1.8, pose: FALLEN, ease: 'in' },
    { t: T.stun, pose: FALLEN },
    { t: T.stun + 0.3, pose: PUSH_UP, ease: 'out' },
    { t: T.stun + 0.62, pose: ONE_KNEE, ease: 'smooth' },
    { t: T.victimEnd - 0.1, pose: STAND, ease: 'smooth' },
  ];
}

function scalePose(pose, s) {
  if (s === 1) return pose;
  const out = { ...pose };
  if (pose.hips?.offset) out.hips = { ...pose.hips, offset: v3.scale(pose.hips.offset, s) };
  for (const key of ['armL', 'armR', 'legL', 'legR']) {
    if (pose[key]?.target) out[key] = { ...pose[key], target: v3.scale(pose[key].target, s) };
  }
  return out;
}

// ---------------------------------------------------------------------------
// Travel along the line between the fighters
// ---------------------------------------------------------------------------

/** Attacker displacement toward the target (metres) for a logical gap. */
export function attackerPush(ta, gap) {
  const reach = Math.max(0, gap - T.strikeGap);
  if (ta < T.launch) return 0;
  if (ta < T.impact) {
    const u = (ta - T.launch) / (T.impact - T.launch);
    return reach * (0.35 * smooth(u) + 0.65 * u);
  }
  if (ta < T.home) return reach + 0.28 * easeOut(span(ta, T.impact + T.hitStop, 2.4), 2);
  return 0;
}

/** Target thrown back from their spot (metres, away from the attacker). */
export function victimKnock(tv) {
  if (tv < T.hitStop) return 0;
  const out = 0.45 * easeOut(span(tv, T.hitStop, 0.45), 2.5) + 0.3 * smooth(span(tv, 0.45, 0.85));
  return out * (1 - smooth(span(tv, T.stun + 0.45, T.victimEnd - 0.05)));
}

/** Attacker visibility: the flash step back to their own side. */
export function attackerOpacity(ta) {
  if (ta < T.fadeOutStart) return 1;
  if (ta < T.fadeOutEnd) return 1 - smooth(span(ta, T.fadeOutStart, T.fadeOutEnd));
  if (ta < T.fadeInStart) return 0;
  return smooth(span(ta, T.fadeInStart, T.fadeInEnd));
}

/** How much the choreography owns each skeleton (for blending with the fighter's own clips). */
export const attackerWeight = (ta) => (ta < 0 ? 0 : ta < 0.14 ? smooth(ta / 0.14) : ta < T.attackerEnd ? 1 : 1 - smooth(span(ta, T.attackerEnd, T.attackerEnd + 0.25)));
export const victimWeight = (tv) => (tv < 0 ? 0 : tv < 0.03 ? tv / 0.03 : tv < T.victimEnd - 0.1 ? 1 : 1 - smooth(span(tv, T.victimEnd - 0.1, T.victimEnd + 0.15)));
export const ARENA_CHIDORI_END = Math.max(T.attackerEnd + 0.3, T.impact + T.victimEnd + 0.2);

// ---------------------------------------------------------------------------
// Presenter
// ---------------------------------------------------------------------------

const place2world = (place, p) => {
  const c = Math.cos(place.yaw), s = Math.sin(place.yaw);
  return [place.x + p[0] * c + p[2] * s, p[1], place.z - p[0] * s + p[2] * c];
};
const world2place = (place, w) => {
  const dx = w[0] - place.x, dz = w[2] - place.z;
  const c = Math.cos(place.yaw), s = Math.sin(place.yaw);
  return [dx * c - dz * s, w[1], dx * s + dz * c];
};

export class ArenaChidori {
  /**
   * attacker: HumanoidRig of the caster (actor space = metres, +Z forward).
   * victim: HumanoidRig of the opponent, or null.
   */
  constructor({ attacker, victim = null, seed = 1 }) {
    this.attacker = attacker;
    this.victim = victim;
    this.seed = seed;
    this.scaleA = attacker ? clamp(attacker.hipsRest[1] / 0.93, 0.6, 1.6) : 1;
    this.scaleV = victim ? clamp(victim.hipsRest[1] / 0.93, 0.6, 1.6) : 1;
    this.keysA = attacker ? attackerKeys(attacker.ankleHeight / this.scaleA) : null;
    this.keysV = victim ? victimKeys(victim.ankleHeight / this.scaleV) : null;
    this.painter = new FxPainter({ position: [0, 2, -6], target: [0, 1, 0], fov: 50 });
    this.trail = [];
    this.slamPoint = null;
    this.struck = null; // null until impact is decided; then true (hit) or false (dodged/missed)
    this.strikePoint = null;
  }

  // The arena decides at impact whether the strike connected.
  setStruck(hit) { if (this.struck === null) this.struck = Boolean(hit); }

  /**
   * ta: seconds since cast. camera: { position, target, fov }.
   * attackerPlace / victimPlace: { x, z, yaw } world placement this frame.
   * victimTorso: world position of the target's chest when the victim is not posed.
   * Returns { attacker: { weight, opacity }, victim: { weight }, hints, fx }.
   */
  update(ta, { camera, attackerPlace, victimPlace, victimTorso = null }) {
    const painter = this.painter;
    painter.setCamera(camera);
    painter.reset();
    const tv = ta - T.impact;
    const hit = this.struck === true;

    // Victim first: the palm aims at their torso.
    let torso = victimTorso ? [...victimTorso] : [victimPlace.x, 1.25 * this.scaleV, victimPlace.z];
    const vWeight = hit && this.victim ? victimWeight(tv) : 0;
    if (vWeight > 0) {
      const pose = scalePose(samplePose(this.keysV, tv), this.scaleV);
      this.addVictimLife(pose, tv);
      this.victim.solve(pose);
      const chest = this.victim.point('chest');
      const neck = this.victim.point('neck');
      torso = place2world(victimPlace, v3.add(v3.lerp(chest, neck, -0.15), [0, 0, 0.07]));
    }
    if (ta <= T.impact) this.strikePoint = torso;
    const aim = this.strikePoint || torso;

    // Attacker.
    const aWeight = this.attacker ? attackerWeight(ta) : 0;
    let palm = [attackerPlace.x, 1 * this.scaleA, attackerPlace.z];
    let fore = palm;
    if (this.attacker && aWeight > 0) {
      const pose = scalePose(samplePose(this.keysA, ta), this.scaleA);
      this.addAttackerLife(pose, ta);
      if (pose.thrust > 0) {
        const target = world2place(attackerPlace, aim);
        pose.armR = { ...pose.armR, target: v3.lerp(pose.armR.target, target, pose.thrust) };
      }
      this.attacker.solve(pose);
      if (pose.grab > 0.001) {
        const hand = this.attacker.point('handR');
        const elbow = this.attacker.point('foreR');
        const wrist = v3.add(v3.lerp(hand, elbow, 0.22), [0.035, 0.03, 0]);
        pose.armL = { ...pose.armL, target: v3.lerp(pose.armL.target, wrist, pose.grab) };
        this.attacker.solve(pose);
      }
      const hand = place2world(attackerPlace, this.attacker.point('handR'));
      fore = place2world(attackerPlace, this.attacker.point('foreR'));
      palm = v3.add(hand, v3.scale(v3.norm(v3.sub(hand, fore)), 0.07));
    }
    if (ta >= T.slam && !this.slamPoint) this.slamPoint = [palm[0], 0.03, palm[2]];
    if (ta >= T.launch && ta <= T.impact + 0.05) {
      this.trail.push({ t: ta, p: palm });
      if (this.trail.length > 40) this.trail.shift();
    }

    this.paint(painter, ta, { palm, fore, aim, attackerPlace, victimPlace, hit });

    return {
      attacker: { weight: aWeight, opacity: attackerOpacity(ta) },
      victim: { weight: vWeight },
      hints: this.hints(ta, hit),
      fx: { additive: painter.additive, alpha: painter.alpha },
      done: ta > ARENA_CHIDORI_END,
    };
  }

  addAttackerLife(pose, ta) {
    const tremble = window4(ta, T.slam + 0.05, T.slam + 0.15, 1.3, 1.42);
    if (tremble > 0) {
      const r = rng(Math.floor(ta * 30) + 5);
      pose.armR = { ...pose.armR, target: v3.add(pose.armR.target, [(r() - 0.5) * 0.02 * tremble, (r() - 0.5) * 0.01 * tremble, (r() - 0.5) * 0.02 * tremble]) };
    }
    // Sprint: big alternating strides while dashing across the court.
    const run = window4(ta, T.launch + 0.02, T.launch + 0.1, 1.86, 1.94);
    if (run > 0) {
      const phase = (ta - T.launch) * Math.PI * 2 * 4.5;
      const ah = this.attacker.ankleHeight;
      const stride = (sign) => [sign * 0.13, ah + 0.26 * Math.max(0, Math.cos(phase + (sign > 0 ? 0 : Math.PI))), 0.55 * Math.sin(phase + (sign > 0 ? 0 : Math.PI)) - 0.05];
      pose.legL = { ...pose.legL, target: v3.lerp(pose.legL.target, stride(1), run) };
      pose.legR = { ...pose.legR, target: v3.lerp(pose.legR.target, stride(-1), run) };
      const bob = Math.abs(Math.sin(phase)) * 0.05 * run;
      pose.hips = { ...pose.hips, offset: v3.add(pose.hips.offset, [0, bob, 0]) };
    }
  }

  addVictimLife(pose, tv) {
    const twitch = this.stunPulse(tv);
    if (twitch <= 0) return;
    const r = rng(Math.floor(tv * 20) + 31);
    const j = (k) => (r() - 0.5) * k * twitch;
    pose.head = { ...pose.head, pitch: pose.head.pitch + j(0.25), yaw: pose.head.yaw + j(0.2) };
    pose.armL = { ...pose.armL, target: v3.add(pose.armL.target, [j(0.08), j(0.08), j(0.08)]) };
    pose.armR = { ...pose.armR, target: v3.add(pose.armR.target, [j(0.08), j(0.08), j(0.08)]) };
    pose.spine = { ...pose.spine, roll: pose.spine.roll + j(0.1) };
  }

  // Electric spasms while the target is down.
  stunPulse(tv) {
    if (tv < T.hitStop || tv > T.stun + 0.2) return 0;
    const k = Math.floor(tv * 8);
    const on = rng(k * 13 + 3 + this.seed)() > 0.45 ? 1 : 0;
    const local = Math.min(1, ((tv * 8) % 1) * 1.6);
    return on * Math.sin(Math.PI * local) * (1 - span(tv, T.stun - 0.4, T.stun + 0.2) * 0.7);
  }

  orbPower(ta) {
    return clamp(0.25 * window4(ta, 0.08, 0.3, 0.42, T.slam) + window4(ta, T.slam - 0.02, T.slam + 0.03, 2.1, 2.4) + 0.5 * window4(ta, T.fadeInStart, T.fadeInEnd, 3.2, 3.7));
  }

  hints(ta, hit) {
    const decay = (t0, amp, len) => (ta < t0 ? 0 : amp * Math.exp(-(ta - t0) / len) * (ta - t0 < len * 5 ? 1 : 0));
    const impactScale = hit ? 1 : 0.4;
    return {
      flash: Math.max(
        0.4 * window4(ta, T.slam - 0.01, T.slam, T.slam + 0.02, T.slam + 0.14),
        0.62 * impactScale * window4(ta, T.impact + 0.05, T.impact + 0.06, T.impact + 0.08, T.impact + 0.26),
        0.22 * window4(ta, T.fadeOutEnd - 0.04, T.fadeOutEnd, T.fadeOutEnd + 0.02, T.fadeOutEnd + 0.12),
      ),
      invert: hit && ta >= T.impact && ta < T.impact + 0.066 ? 1 : 0,
      shake: decay(T.slam, 0.6, 0.12) + 0.12 * window4(ta, T.slam + 0.05, T.slam + 0.1, 1.35, 1.45)
        + impactScale * decay(T.impact, 1.4, 0.14) + (hit ? decay(T.impact + 1.55, 0.35, 0.1) : 0),
      exposure: 0.12 * window4(ta, T.slam, T.slam + 0.1, 1.9, 2.3),
    };
  }

  paint(painter, ta, { palm, fore, aim, attackerPlace, victimPlace, hit }) {
    const frame = Math.floor(ta * 30);
    const orb = this.orbPower(ta);
    const seed = this.seed * 7919;
    const tv = ta - T.impact;
    const toVictim = v3.norm([victimPlace.x - attackerPlace.x, 0, victimPlace.z - attackerPlace.z]);

    // 1. The lightning in the hand (hidden while the attacker is fading).
    const visible = attackerOpacity(ta);
    if (orb > 0.01 && visible > 0.02) {
      const r = rng(frame * 7 + 1 + seed);
      const big = orb * (0.85 + 0.3 * r()) * visible;
      painter.glow(palm, 0.9 * big, COLORS.deep, 0.35 * big);
      painter.glow(palm, 0.45 * big, COLORS.bolt, 0.75 * big);
      painter.glow(palm, 0.2 * big, COLORS.core, big);
      painter.sparkle(palm, 0.28 * big, COLORS.core, 0.9 * big, r() * Math.PI);
      const chirps = Math.round(4 + orb * 12);
      for (let i = 0; i < chirps; i += 1) {
        crackle(painter, palm, randomDir(r), (0.12 + r() * 0.5) * (0.5 + orb * 0.7), frame * 131 + i * 17 + seed, { width: 0.0045, intensity: (0.8 + r() * 0.4) * visible, forks: 2, jag: 0.35, detail: 4 });
      }
      if (orb > 0.3) {
        for (let i = 0; i < 2; i += 1) {
          const along = v3.lerp(palm, fore, 0.5 + r() * 0.5);
          painter.bolt(boltPath(palm, v3.add(along, [(r() - 0.5) * 0.08, (r() - 0.5) * 0.08, (r() - 0.5) * 0.08]), r, { detail: 4, jag: 0.3 }), 0.004, 0.8 * orb * visible);
        }
      }
    }
    // Static building before the slam.
    if (ta > 0.08 && ta < T.slam) {
      const r = rng(frame * 3 + 2 + seed);
      const k = span(ta, 0.08, T.slam);
      for (let i = 0; i < 2 + Math.floor(k * 4); i += 1) {
        crackle(painter, palm, randomDir(r), 0.06 + r() * 0.16 * k, frame * 91 + i + seed, { width: 0.003, intensity: 0.6 + k * 0.5, forks: 1, jag: 0.4, detail: 3 });
      }
    }

    const slam = this.slamPoint;
    // 2. Ignition: shock rings on the ground.
    if (slam && ta < T.slam + 0.6) {
      const k = span(ta, T.slam, T.slam + 0.45);
      painter.plane(painter.additive, [slam[0], 0.03, slam[2]], 0.3 + easeOut(k, 3) * 3.2, [0, 1, 0], COLORS.bolt, (1 - k) * 0.9, SHAPE.ring);
      painter.plane(painter.additive, [slam[0], 0.035, slam[2]], 0.2 + easeOut(k, 2) * 1.8, [0, 1, 0], COLORS.core, (1 - k) * 0.6, SHAPE.ring);
      painter.glow(v3.add(slam, [0, 0.25, 0]), 0.9 * (1 - k) + 0.3, COLORS.bolt, (1 - k) * 0.55);
    }
    // 3. Charging: ground arcs, scorch glow, arcs leaping from the hand, rising sparks.
    const groundK = slam ? window4(ta, T.slam, T.slam + 0.02, T.launch, T.launch + 0.15) : 0;
    if (groundK > 0) {
      const r = rng(frame * 5 + 3 + seed);
      painter.plane(painter.additive, [slam[0], 0.02, slam[2]], 1.4, [0, 1, 0], COLORS.haze, 0.55 * groundK, SHAPE.glow);
      painter.plane(painter.additive, [slam[0], 0.025, slam[2]], 0.6, [0, 1, 0], COLORS.bolt, 0.6 * groundK, SHAPE.glow);
      for (let i = 0; i < 6; i += 1) {
        const ang = r() * Math.PI * 2;
        const len = 0.5 + r() * 1.6;
        const end = [slam[0] + Math.cos(ang) * len, 0.03, slam[2] + Math.sin(ang) * len];
        const path = boltPath([slam[0], 0.05, slam[2]], end, r, { detail: 5, jag: 0.25 }).map((p) => [p[0], Math.max(0.02, p[1] * 0.3), p[2]]);
        painter.bolt(path, 0.006, groundK * (0.7 + r() * 0.4));
      }
      if (r() > 0.35) crackle(painter, palm, v3.norm([r() - 0.5, 0.8 + r() * 0.6, r() - 0.5]), 1.0 + r() * 1.4, frame * 57 + 5 + seed, { width: 0.007, intensity: groundK, forks: 3, jag: 0.28, detail: 5 });
      for (let i = 0; i < 40; i += 1) {
        const pr = rng(i * 7919 + 11);
        const age = ta - (T.slam + pr() * 0.8);
        if (age < 0 || age > 0.6) continue;
        const ang = pr() * Math.PI * 2;
        const vel = [Math.cos(ang) * (0.4 + pr() * 1.2), 1.2 + pr() * 2.2, Math.sin(ang) * (0.4 + pr() * 1.2)];
        const p = v3.add(slam, [vel[0] * age, vel[1] * age - 2.2 * age * age, vel[2] * age]);
        painter.streak(v3.sub(p, v3.scale([vel[0], vel[1] - 4.4 * age, vel[2]], 0.035)), p, 0.012, COLORS.spark, (1 - age / 0.6) * groundK);
      }
    }

    // 4. The dash: hand trail and a glowing trench to where the palm landed.
    if (ta > T.launch && ta < T.impact + 0.35) {
      const fade = 1 - span(ta, T.impact, T.impact + 0.35);
      const pts = this.trail.filter((s) => s.t > Math.min(ta, T.impact) - 0.3).map((s) => s.p);
      if (pts.length > 1) {
        const n = pts.length;
        painter.ribbon(painter.additive, pts, pts.map((_, i) => 0.05 + 0.25 * (i / n)), COLORS.haze, pts.map((_, i) => (i / (n - 1)) * 0.45 * fade));
        painter.bolt(pts, 0.006, 0.9 * fade);
      }
      if (slam) {
        const stop = v3.addScaled([attackerPlace.x, 0, attackerPlace.z], toVictim, -0.1);
        const len = v3.dist([slam[0], 0, slam[2]], [stop[0], 0, stop[2]]);
        if (len > 0.3 && ta > T.launch + 0.05) {
          const tr = rng(Math.floor(ta * 15) + 8 + seed);
          const n = 22;
          const ground = [];
          for (let i = 0; i <= n; i += 1) {
            const p = v3.lerp([slam[0], 0.03, slam[2]], [stop[0], 0.03, stop[2]], i / n);
            ground.push([p[0] + (tr() - 0.5) * 0.08, 0.03, p[2] + (tr() - 0.5) * 0.08]);
          }
          const trench = 1 - span(ta, T.impact - 0.1, T.impact + 0.5);
          painter.ribbon(painter.additive, ground, 0.12, COLORS.bolt, ground.map((_, i) => (0.25 + 0.55 * (i / n)) * trench));
          painter.ribbon(painter.additive, ground, 0.035, COLORS.core, ground.map((_, i) => (0.2 + 0.7 * (i / n)) * trench));
        }
      }
    }

    // 5. Impact at the torso (a smaller burst in the air when dodged).
    if (tv >= 0 && tv < 0.6 && aim) {
      const r = rng(frame * 13 + 6 + seed);
      const s = hit ? 1 : 0.45;
      const k = span(tv, 0, 0.5);
      painter.glow(aim, 1.6 * s * (1 - k * 0.6), COLORS.deep, 0.4 * (1 - k));
      painter.glow(aim, 0.85 * s * (1 - k * 0.5), COLORS.bolt, 0.8 * (1 - k));
      painter.glow(aim, 0.4 * s, COLORS.core, 1 - k);
      const burst = window4(tv, 0, 0.01, 0.2, 0.45);
      const sr = rng(4242 + seed);
      for (let i = 0; i < 26; i += 1) {
        const ang = (i / 26) * Math.PI * 2 + sr() * 0.2;
        const len = s * (0.9 + sr() * 2.2) * (0.6 + 0.6 * easeOut(k, 2));
        const dir = v3.add(v3.scale(painter.right, Math.cos(ang)), v3.scale(painter.up, Math.sin(ang)));
        painter.ribbon(painter.additive, [v3.addScaled(aim, dir, 0.1), v3.addScaled(aim, dir, len)], [0.06 + sr() * 0.05, 0], COLORS.core, [burst, 0], SHAPE.ribbon);
      }
      if (hit) {
        for (let i = 0; i < 2; i += 1) {
          const rk = span(tv, i * 0.06, 0.4 + i * 0.1);
          if (rk <= 0 || rk >= 1) continue;
          painter.plane(painter.additive, v3.addScaled(aim, toVictim, 0.2 + rk * 0.8), 0.25 + easeOut(rk, 2) * (1.3 + i * 0.6), toVictim, i ? COLORS.bolt : COLORS.core, (1 - rk) * 0.9, SHAPE.ring);
        }
        const through = window4(tv, 0, 0.01, 0.35, 0.55);
        for (let i = 0; i < 10; i += 1) {
          const dir = v3.norm(v3.add(toVictim, [(r() - 0.5) * 1.4, (r() - 0.35) * 1.2, (r() - 0.5) * 1.4]));
          crackle(painter, v3.addScaled(aim, toVictim, 0.15), dir, 1.2 + r() * 2.2, frame * 23 + i * 7 + seed, { width: 0.008, intensity: through, forks: 2, jag: 0.22, detail: 5 });
        }
      }
      for (let i = 0; i < (hit ? 70 : 30); i += 1) {
        const pr = rng(i * 104729 + 17 + seed);
        const age = tv - pr() * 0.12;
        if (age < 0 || age > 0.7) continue;
        const dir = v3.norm([(pr() - 0.5) * 2, (pr() - 0.2) * 1.6, (pr() - 0.5) * 2]);
        const vel = v3.scale(dir, 2.5 + pr() * 5);
        const p = v3.add(aim, [vel[0] * age, vel[1] * age - 4.9 * age * age, vel[2] * age]);
        if (p[1] < 0) continue;
        painter.streak(v3.sub(p, v3.scale([vel[0], vel[1] - 9.8 * age, vel[2]], 0.03)), p, 0.014, COLORS.spark, 1 - age / 0.7);
      }
    }

    // 6. Flash step: the attacker vanishes in a lightning column and reappears at home.
    for (const [start, end, where] of [[T.fadeOutStart - 0.02, T.fadeOutEnd + 0.12, 'strike'], [T.fadeInStart - 0.06, T.fadeInEnd + 0.1, 'home']]) {
      if (ta < start || ta > end) continue;
      const k = span(ta, start, end);
      const env = Math.sin(Math.PI * k);
      const base = [attackerPlace.x, 0.02, attackerPlace.z];
      const r = rng(frame * 29 + (where === 'home' ? 91 : 17) + seed);
      painter.plane(painter.additive, [base[0], 0.03, base[2]], 0.3 + easeOut(k, 2) * 1.2, [0, 1, 0], COLORS.bolt, env * 0.8, SHAPE.ring);
      painter.glow(v3.add(base, [0, 1.0, 0]), 1.1, COLORS.bolt, env * 0.45);
      for (let i = 0; i < 5; i += 1) {
        const from = v3.add(base, [(r() - 0.5) * 0.5, 0.02, (r() - 0.5) * 0.5]);
        const to = v3.add(base, [(r() - 0.5) * 0.6, 1.6 + r() * 0.9, (r() - 0.5) * 0.6]);
        painter.bolt(boltPath(from, to, r, { detail: 5, jag: 0.22 }), 0.006, env);
      }
      for (let i = 0; i < 14; i += 1) {
        const pr = rng(i * 131 + (where === 'home' ? 7 : 3) + seed);
        const age = (ta - start) - pr() * 0.1;
        if (age < 0 || age > 0.35) continue;
        const ang = pr() * Math.PI * 2;
        const vel = [Math.cos(ang) * (1 + pr() * 2), 1.5 + pr() * 2.5, Math.sin(ang) * (1 + pr() * 2)];
        const p = v3.add(base, [vel[0] * age, 0.3 + vel[1] * age, vel[2] * age]);
        painter.streak(v3.sub(p, v3.scale(vel, 0.03)), p, 0.012, COLORS.spark, 1 - age / 0.35);
      }
    }

    // 7. Lightning running through the struck body while they are down.
    if (hit && this.victim && tv > T.hitStop && tv < T.stun + 0.3) {
      const r = rng(frame * 17 + 9 + seed);
      const pulse = this.stunPulse(tv);
      const fadeStun = 1 - span(tv, T.stun - 0.3, T.stun + 0.3);
      const keys = ['head', 'chest', 'hips', 'handL', 'handR', 'foreL', 'foreR', 'shinL', 'shinR', 'footL', 'footR'];
      const joint = (key) => place2world(victimPlace, this.victim.point(key));
      const chest = joint('chest');
      painter.glow(chest, 0.9, COLORS.haze, (0.2 + 0.35 * pulse) * fadeStun);
      const crawl = Math.round((4 + pulse * 5) * fadeStun);
      for (let i = 0; i < crawl; i += 1) {
        const ia = Math.floor(r() * keys.length);
        const ib = (ia + 1 + Math.floor(r() * (keys.length - 1))) % keys.length;
        const a = joint(keys[ia]);
        const b = joint(keys[ib]);
        if (v3.dist(a, b) < 0.12) continue;
        painter.bolt(boltPath(a, b, r, { detail: 4, jag: 0.3 }), 0.004, (0.55 + 0.45 * pulse) * fadeStun);
      }
      if (pulse > 0.4) {
        for (let i = 0; i < 3; i += 1) crackle(painter, joint(keys[Math.floor(r() * keys.length)]), randomDir(r), 0.15 + r() * 0.3, frame * 31 + i + seed, { width: 0.0035, intensity: pulse * fadeStun, forks: 1, jag: 0.4, detail: 3 });
      }
      if (tv > 0.9) {
        const head = joint('head');
        const starK = window4(tv, 0.9, 1.1, T.stun, T.stun + 0.3);
        for (let i = 0; i < 4; i += 1) {
          const ang = ta * 4.2 + (i / 4) * Math.PI * 2;
          const p = [head[0] + Math.cos(ang) * 0.24, head[1] + 0.26 + Math.sin(ang * 2) * 0.03, head[2] + Math.sin(ang) * 0.24];
          painter.sparkle(p, 0.09, i % 2 ? COLORS.star : COLORS.spark, 0.95 * starK, ta * 3 + i);
        }
      }
      const fallAge = tv - 1.55;
      if (fallAge > 0 && fallAge < 0.7) {
        const hips = joint('hips');
        const dr = rng(1234 + seed);
        for (let i = 0; i < 9; i += 1) {
          const ang = dr() * Math.PI * 2;
          const d = 0.3 + fallAge * (0.9 + dr() * 0.8);
          painter.puff([hips[0] + Math.cos(ang) * d, 0.08 + fallAge * 0.3 + dr() * 0.08, hips[2] + Math.sin(ang) * d], 0.14 + fallAge * 0.4, [0.3, 0.33, 0.42], 0.5 * (1 - fallAge / 0.7), dr() * 6);
        }
      }
    }

    // 8. Residual static on the attacker's hand once home.
    if (ta > T.fadeInEnd && ta < 3.6 && visible > 0.5) {
      const r = rng(frame * 19 + 10 + seed);
      const k = span(ta, T.fadeInEnd, 3.6);
      if (r() > k) crackle(painter, palm, randomDir(r), 0.1 + r() * 0.2, frame * 29 + 3 + seed, { width: 0.0035, intensity: 1 - k, forks: 1, jag: 0.4, detail: 3 });
    }
  }
}
