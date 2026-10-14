// Authors locomotion clips (Walk, Run) directly on the Getsuga and Artemis skeletons and appends them to new versioned
// GLBs. Nothing that is already in the file changes: the new clips only add accessors and animations.
//
//   node tools/avatar-motion/locomotion.mjs            -> public/models/characters/*_v5.glb + a report
//
// How a frame is built:
//  - base pose: trunk, neck, head and legs from the bind pose (straight, symmetric); arms, hands, eyes, jaw and every
//    effect / prop node from frame 0 of the body's own Idle clip (relaxed arms, hidden effects).
//  - pelvis: forward travel is in place (the runtime moves the character at `extras.speed`), with vertical bob (high at
//    mid-stance when walking, low when running), sway over the stance foot, yaw toward the swinging leg and hip drop.
//  - chest counter-rotates against the pelvis, leans with speed and breathes; neck and head keep the gaze level.
//  - legs: two-bone IK onto authored ankle paths. Stance: heel strike (toes up, rolling about the heel), flat foot,
//    heel off (rolling about the ball while the toes stay on the ground, still accelerating at toe-off), all sliding
//    back at exactly `speed` so a character moved at `speed` keeps planted feet. Swing: a C1 Hermite path from
//    toe-off to the next heel strike with toe clearance; its reach is softly limited to what the leg has at toe-off
//    and heel strike (no straight-leg snap), and the foot follows the shin in the air. The knee points where the
//    foot points (the bind feet turn out 11-14 degrees).
//  - arms swing against the legs with a small lag and elbow flex that grows on the forward swing; a held prop
//    (Artemis' bow) keeps its Idle orientation and its arm swings less.
//  - face: blinks and small eye saccades so the character stays alive while moving.
// Every curve is periodic in the gait cycle and each clip holds whole cycles, so the loop is seamless. Run is baked at
// 60 keys per second (its knee and ankle turn fast enough that 30 shows as corners).
import * as THREE from 'three';
import { readGlb, readAccessor, addAccessor, writeAccessorInPlace, writeGlb, compactGlb, sampleAnimation } from './glb-io.mjs';
import { bakeShapes } from '../avatar-shapes/shapes.mjs';

const ROOT = new URL('../../', import.meta.url);
const DEG = Math.PI / 180, TAU = Math.PI * 2;
const FPS_DEFAULT = 30;

export const BODIES = {
  // armOut: extra degrees the arms hang away from the body (clearing wider hips, a belt and the quiver strap)
  male: { src: 'public/models/characters/Getsuga_Tensho_Character_v3.glb', out: 'public/models/characters/Getsuga_Tensho_Character_v5.glb', armOut: 2, mesh: 'SK_Character_mesh' },
  // Artemis carries a long bow in her left hand: that arm swings less, bends less when running, and the bow keeps its
  // Idle orientation (it follows the chest, only a little of the hand), so it never sweeps through the legs.
  female: { src: 'public/models/characters/Artemis_Character_v3.glb', out: 'public/models/characters/Artemis_Character_v5.glb', armOut: 5, mesh: 'Artemis_Body',
    reskin: { side: 'r', radius: 0.085 }, // see reskinUpperArm
    // her right arm is modelled fused to her side along their contact: a smaller swing keeps that seam from tearing
    armSwing: { r: 0.6 },
    hold: [{ joint: 'bow', side: 'l', arm: 0.5, follow: 0.25, elbowMax: 45 }] },
};

// Distances in metres for a leg (hip to ankle) of 0.85 m; scaled per body. Angles in degrees.
export const GAITS = {
  Walk: {
    midReach: 0.965, maxEnds: 0.98, minDuty: 0.58, minCycle: 1.0, liftVel: 0.8, strikeVel: 0.55, footFollow: 0.5, swingPlantar: 8, speed: 1.25, cycle: 1.1, cycles: 4, duty: 0.61, stanceCenter: 0.0, width: 0.095, lift: 0.07, drop: 0.032, bob: 0.018, sway: 0.022,
    yaw: 6, roll: 4, tilt: 3, lean: 2.5, arm: 17, armLag: 0.04, elbow: 16, elbowSwing: 10, abduct: 9, shoulderDrop: 4, shoulderSwing: 0.2, heel: 16, toeOff: 30,
    qFlat: 0.14, qHeelOff: 0.52, toeOut: -6, swingPitch: [[0, -30], [0.32, 4], [0.78, 8], [1, 16]], headPitch: -1.5, blinks: [1.7], mouth: 0,
  },
  Run: {
    midReach: 0.925, maxEnds: 0.99, minDuty: 0.31, minCycle: 0.64, liftVel: 1.0, strikeVel: 0.55, liftEarly: 0.2, footFollow: 1, swingPlantar: 22, fps: 60, speed: 3.3, cycle: 0.72, cycles: 6, duty: 0.37, stanceCenter: -0.1, width: 0.06, lift: 0.24, drop: 0.075, bob: 0.028, sway: 0.012,
    yaw: 8, roll: 3, tilt: 7, lean: 9, arm: 34, armCarry: -6, armLag: 0.03, elbow: 75, elbowSwing: 12, abduct: 12, shoulderDrop: 3, shoulderSwing: 0.18, heel: 8, toeOff: 42,
    qFlat: 0.12, qHeelOff: 0.4, toeOut: -8, swingPitch: [[0, -42], [0.3, -6], [0.75, 10], [1, 8]], headPitch: -4, blinks: [2.25], mouth: 0.14,
  },
  // A calm standing idle for the creator: weight on the right leg with the left hip a little lower, the free foot
  // relaxed forward, slow breathing (4 s) that lifts the chest and shoulders, an unhurried look around and blinks.
  // 16 s holds one weight-shift cycle, four breaths and the head's slow loop, so it repeats without a seam.
  Stand: {
    stand: true, speed: 0, cycle: 16, cycles: 1, duty: 1, fps: 30, width: 0.1, toeOut: 0, drop: 0, stanceSide: 'r',
    stanceWidth: 0.95, freeWidth: 1.25, freeForward: 0.06, stanceOut: 7, freeOut: 14, standReach: 0.985, weight: 0.026, hipDrop: 2.4,
    pelvisYaw: 2, tilt: 1, lean: 0.5, breath: 4, breathChest: -0.7, breathShoulder: 1.1, headYaw: 3.5, headPitch: -1,
    arm: 1.2, armLag: 0, elbow: 12, elbowSwing: 0, abduct: 7, shoulderDrop: 5, shoulderSwing: 0.3,
    blinks: [1.4, 5.2, 7.0, 7.32, 11.3, 14.6], mouth: 0,
  },
};

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const Q = () => new THREE.Quaternion();
const axisAngle = (axis, deg) => Q().setFromAxisAngle(axis.clone().normalize(), deg * DEG);
const smooth = x => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
const frac = x => x - Math.floor(x);
function piecewise(points, x) { // smoothstep between keyed values (C1 at keys: zero slope there)
  for (let i = 0; i + 1 < points.length; i++) {
    const [a, va] = points[i], [b, vb] = points[i + 1];
    if (x <= b || i + 2 === points.length) return va + (vb - va) * smooth((x - a) / (b - a));
  }
  return points[points.length - 1][1];
}
function hermite(p0, m0, p1, m1, s) {
  const s2 = s * s, s3 = s2 * s;
  return p0.clone().multiplyScalar(2 * s3 - 3 * s2 + 1).add(m0.clone().multiplyScalar(s3 - 2 * s2 + s))
    .add(p1.clone().multiplyScalar(-2 * s3 + 3 * s2)).add(m1.clone().multiplyScalar(s3 - s2));
}

export class Rig {
  constructor(glb, hold = [], armOut = 0) {
    this.glb = glb; this.hold = hold; this.armOut = armOut; this.armSwing = {}; const J = glb.json; this.nodes = J.nodes;
    this.parent = []; J.nodes.forEach((n, i) => (n.children || []).forEach(c => (this.parent[c] = i)));
    this.byName = new Map(J.nodes.map((n, i) => [n.name, i]));
    this.joints = new Set(J.skins[0].joints);
    const order = [], seen = new Set(), visit = i => { if (seen.has(i)) return; seen.add(i); if (this.parent[i] !== undefined) visit(this.parent[i]); order.push(i); };
    J.nodes.forEach((_, i) => visit(i)); this.order = order;
    this.idle = J.animations.find(a => a.name === 'Idle');
    if (!this.idle) throw new Error('no Idle clip');
    this.animated = new Set(this.idle.channels.map(c => c.target.node));
    const s0 = sampleAnimation(glb, this.idle, 0);
    this.idleWeights = null; this.faceNode = null;
    for (const [node, rec] of s0) if (rec.weights) { this.idleWeights = rec.weights; this.faceNode = node; }
    const rest = i => { const n = J.nodes[i]; return { t: V(...(n.translation || [0, 0, 0])), r: Q().set(...(n.rotation || [0, 0, 0, 1])), s: V(...(n.scale || [1, 1, 1])) }; };
    const idleLocal = i => { const r = rest(i), rec = s0.get(i) || {}; if (rec.translation) r.t.set(...rec.translation); if (rec.rotation) r.r.set(...rec.rotation); if (rec.scale) r.s.set(...rec.scale); return r; };
    // base pose: straight trunk and legs from the bind pose, everything else from Idle frame 0
    const trunk = /^(root|pelvis|spine_0[12]|neck_01|head|thigh_[lr]|calf_[lr]|foot_[lr]|ball_[lr])$/;
    this.base = new Map(J.nodes.map((n, i) => [i, trunk.test(n.name) ? rest(i) : idleLocal(i)]));
    const tw = this.world(this.base); this.baseWorld = tw;
  }
  id(name) { const i = this.byName.get(name); if (i === undefined) throw new Error('missing node ' + name); return i; }
  // world matrices for every node from a local-pose map
  world(local) {
    const W = new Map();
    for (const i of this.order) {
      const L = local.get(i), M = new THREE.Matrix4().compose(L.t, L.r, L.s), p = this.parent[i];
      W.set(i, p === undefined ? M : W.get(p).clone().multiply(M));
    }
    return W;
  }
  static pos(M) { return V().setFromMatrixPosition(M); }
  static rot(M) { const p = V(), q = Q(), s = V(); M.decompose(p, q, s); return q; }
}

export function buildClip(rig, body, name, g, dry = false) {
  const J = rig.glb.json, B = rig.baseWorld;
  const id = n => rig.id(n), P = i => Rig.pos(B.get(i)), R = i => Rig.rot(B.get(i));
  const hipL = P(id('thigh_l')), kneeL = P(id('calf_l')), ankleL = P(id('foot_l'));
  const legLen = hipL.distanceTo(kneeL) + kneeL.distanceTo(ankleL), k = legLen / 0.85;
  const FPS = +(process.env.LOCO_FPS || g.fps || FPS_DEFAULT);
  const v = g.speed * k, T = g.stand ? g.cycle : g.cycle * Math.sqrt(k), N = g.cycles, duration = N * T, frames = Math.round(duration * FPS);
  const duty = g.duty, Ls = v * duty * T, swingT = (1 - duty) * T;
  const pelvis0 = P(id('pelvis'));
  const legs = ['l', 'r'].map(side => {
    const sgn = side === 'l' ? 1 : -1, H0 = P(id('thigh_' + side)), K0 = P(id('calf_' + side)), A0 = P(id('foot_' + side)), B0 = P(id('ball_' + side));
    const heel0 = V(A0.x, 0, A0.z - 0.045 * k);
    // the bind feet already turn out (11-14 degrees); the knee must point where the foot finally points
    const toe0 = Math.atan2(B0.x - A0.x, B0.z - A0.z) / DEG;
    const leg = { side, sgn, H0, K0, A0, B0, heel0, l1: H0.distanceTo(K0), l2: K0.distanceTo(A0), offset: side === 'l' ? 0 : 0.5,
      x: sgn * g.width * k, yaw: sgn * g.toeOut, knee: 0.8 * (toe0 + sgn * g.toeOut), footLen: B0.z - heel0.z };
    if (g.stand) {
      // planted feet: the supporting foot under its hip, the free foot a little wider and forward, both turned out
      const supporting = side === g.stanceSide, out = supporting ? g.stanceOut : g.freeOut;
      leg.foot = V(H0.x * (supporting ? g.stanceWidth : g.freeWidth), A0.y, A0.z + (supporting ? 0 : g.freeForward * k));
      leg.yaw = sgn * out - toe0; leg.knee = 0.8 * sgn * out;
    }
    return leg;
  });
  const standSide = g.stanceSide === 'l' ? -1 : 1; // +1: standing on the right leg (the pelvis shifts towards -X)
  const up = V(0, 1, 0), X = V(1, 0, 0), Z = V(0, 0, 1);

  // ankle position + foot pitch (deg, + = toes up) + whether the toes are planted, for a leg at phase p (relative to pelvis)
  function footAt(leg, p) {
    const yawQ = axisAngle(up, leg.yaw), lat = X.clone().applyQuaternion(yawQ);
    const toHeel = leg.A0.clone().sub(leg.heel0).setX(0), toBall = leg.A0.clone().sub(leg.B0).setX(0);
    const anchor = q => g.stanceCenter * k + Ls * (0.5 - q);
    const stance = q => {
      if (q < g.qFlat) { const pitch = g.heel * (1 - smooth(q / g.qFlat)), heel = V(leg.x, 0, anchor(q)); return { ankle: heel.add(toHeel.clone().applyAxisAngle(lat, -pitch * DEG).applyQuaternion(yawQ)), pitch, toes: false }; }
      if (q < g.qHeelOff) return { ankle: V(leg.x, 0, anchor(q)).add(toHeel.clone().applyQuaternion(yawQ)), pitch: 0, toes: false };
      // the heel rise is still accelerating at toe-off (2x^2 - x^3 ends with slope 1), so the foot leaves the ground
      // moving up and plantar-flexing instead of stopping dead for a frame
      const x = (q - g.qHeelOff) / (1 - g.qHeelOff), pitch = -g.toeOff * x * x * (2 - x), ball = V(leg.x, leg.B0.y, anchor(q) + leg.footLen);
      return { ankle: ball.add(toBall.clone().applyAxisAngle(lat, -pitch * DEG).applyQuaternion(yawQ)), pitch, toes: true };
    };
    if (p < duty) return stance(p / duty);
    const s = (p - duty) / (1 - duty), e = 1e-3;
    const a = stance(1), b = stance(0);
    const va = stance(1).ankle.clone().sub(stance(1 - e).ankle).divideScalar(e * duty * T), vb = stance(e).ankle.clone().sub(stance(0).ankle).divideScalar(e * duty * T);
    // endpoint velocities are softened so the foot does not overshoot far behind at lift-off or far ahead before the
    // strike (a little swing-leg retraction is natural, a full stance-speed overshoot over-reaches the leg)
    const pos = hermite(a.ankle, va.multiplyScalar(swingT * g.liftVel), b.ankle, vb.multiplyScalar(swingT * g.strikeVel), s);
    // a smooth time warp moves the highest point earlier (heel recovery happens early in a running swing)
    const early = g.liftEarly ?? 0, sw = s + early * s * (1 - s);
    pos.y += g.lift * k * Math.pow(Math.sin(Math.PI * sw), 2);
    // early swing carries on the toe-off plantar flexion for a moment (a bump that starts at the stance-end pitch rate
    // and dies out by the first key) before the foot swings up
    const s1 = g.swingPitch[1][0], rate = -g.toeOff * (1 - duty) / ((1 - g.qHeelOff) * duty);
    const bump = s < s1 ? rate * s * (1 - s / s1) ** 2 : 0;
    // the toes ease off the ground instead of snapping to the foot at toe-off
    return { ankle: pos, pitch: piecewise(g.swingPitch, s) + bump, toes: 1 - smooth(s / 0.4), swing: s };
  }

  function twoBoneIK(H, A, l1, l2, pole) {
    const d = A.clone().sub(H), dist = Math.min(d.length(), (l1 + l2) * 0.9995), u = d.normalize();
    const cosA = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), alpha = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const w = pole.clone().sub(u.clone().multiplyScalar(u.dot(pole))).normalize();
    const knee = H.clone().add(u.clone().multiplyScalar(Math.cos(alpha) * l1)).add(w.clone().multiplyScalar(Math.sin(alpha) * l1));
    return { knee, ankle: H.clone().add(u.multiplyScalar(dist)), w };
  }
  const frame = (dir, pole) => { const x = dir.clone().normalize(), y = pole.clone().sub(x.clone().multiplyScalar(x.dot(pole))).normalize(), z = x.clone().cross(y); return new THREE.Matrix4().makeBasis(x, y, z); };
  const aimDelta = (dir0, dirN, pole0, poleN) => Q().setFromRotationMatrix(frame(dirN, poleN).multiply(frame(dir0, pole0).transpose()));

  const tracks = new Map(); // node -> {t:[], r:[], s:[]}
  const weights = [];
  const report = { reachMax: 0, reachFront: 0, reachBack: 0, reachMid: 0, angMax: 0, angBone: '', accMax: 0, accBone: '', seam: 0, toeMin: Infinity };
  let prevLocal = null, prev2Local = null, firstLocal = null;
  const faceNames = rig.faceNode !== null ? (J.meshes[J.nodes[rig.faceNode].mesh].extras?.targetNames || []) : [];
  const times = [];
  for (let f = 0; f <= frames; f++) {
    const t = (f / frames) * duration, phi = frac((f * N) / frames);
    times.push(t);
    const local = new Map([...rig.base].map(([i, L]) => [i, { t: L.t.clone(), r: L.r.clone(), s: L.s.clone() }]));
    let W = rig.world(local);
    const setWorldRot = (i, q) => { const pr = Rig.rot(W.get(rig.parent[i])); local.get(i).r.copy(pr.invert().multiply(q)); W = rig.world(local); };
    const D = (yaw, roll, pitch) => axisAngle(up, yaw).multiply(axisAngle(Z, roll)).multiply(axisAngle(X, pitch));

    // pelvis: a gait bobs, sways and turns with the steps; standing shifts the weight slowly onto one leg (the free hip
    // drops a little) and breathes
    const mid = duty / 2, run = g.speed > 2, pid = id('pelvis');
    let yaw, roll, tilt, lean, breathe, headYaw, headPitch, shoulderLift = 0;
    if (g.stand) {
      const weight = 0.8 + 0.2 * Math.sin(TAU * phi), breath = Math.sin(TAU * t / g.breath);
      yaw = g.pelvisYaw * weight; roll = -g.hipDrop * weight * standSide; tilt = g.tilt; lean = g.lean + g.breathChest * breath;
      breathe = 0; shoulderLift = g.breathShoulder * (0.5 + 0.5 * breath);
      headYaw = g.headYaw * Math.sin(TAU * phi + 1.1) + 1.2 * Math.sin(TAU * 3 * phi + 0.4);
      headPitch = g.headPitch + Math.sin(TAU * 2 * phi + 0.5);
      const pelvisPos = V(pelvis0.x - standSide * g.weight * k * weight, pelvis0.y - g.drop * k, pelvis0.z);
      local.get(pid).t.copy(pelvisPos.clone().applyMatrix4(W.get(rig.parent[pid]).clone().invert()));
      W = rig.world(local);
      setWorldRot(pid, D(yaw, roll, tilt * 0.4).multiply(R(pid)));
      // hip height: the supporting leg nearly straight over its planted foot
      const stance = legs.find((l) => l.side === g.stanceSide), H = Rig.pos(W.get(id('thigh_' + stance.side)));
      const reachXZ = Math.hypot(H.x - stance.foot.x, H.z - stance.foot.z), want = stance.foot.y + Math.sqrt(Math.max(0, (g.standReach * (stance.l1 + stance.l2)) ** 2 - reachXZ ** 2));
      local.get(pid).t.copy(pelvisPos.setY(pelvisPos.y + want - H.y).applyMatrix4(W.get(rig.parent[pid]).clone().invert()));
      W = rig.world(local);
      setWorldRot(pid, D(yaw, roll, tilt * 0.4).multiply(R(pid)));
    } else {
      const bob = (run ? -1 : 1) * g.bob * k * Math.cos(2 * TAU * (phi - mid));
      const sway = g.sway * k * Math.cos(TAU * (phi - mid));
      yaw = -g.yaw * Math.cos(TAU * phi); roll = g.roll * Math.cos(TAU * (phi - mid)); tilt = g.tilt; lean = g.lean;
      breathe = 0.6 * Math.sin(TAU * (t / duration) * N / 2);
      headYaw = 0; headPitch = g.headPitch + 0.5 * Math.cos(2 * TAU * (phi - mid));
      const pelvisPos = V(sway, pelvis0.y - g.drop * k + bob, pelvis0.z);
      local.get(pid).t.copy(pelvisPos.clone().applyMatrix4(W.get(rig.parent[pid]).clone().invert()));
      W = rig.world(local);
      setWorldRot(pid, D(yaw, roll, tilt * 0.4).multiply(R(pid)));
    }
    // spine, neck, head: the chest counter-turns the pelvis (and, standing, tilts against the dropped hip)
    const spineRoll = g.stand ? [-0.3, 0.45] : [0.2, -0.35];
    const Ds1 = D(yaw * 0.25, roll * spineRoll[0], tilt * 0.4 + lean * 0.4), Ds2 = D(-yaw * 0.85, roll * spineRoll[1], tilt * 0.4 + lean + breathe * 0.3);
    setWorldRot(id('spine_01'), Ds1.clone().multiply(R(id('spine_01'))));
    setWorldRot(id('spine_02'), Ds2.clone().multiply(R(id('spine_02'))));
    const Dh = D(yaw * 0.08 + headYaw, -roll * 0.05, headPitch);
    setWorldRot(id('neck_01'), Ds2.clone().slerp(Dh, 0.55).multiply(R(id('neck_01'))));
    setWorldRot(id('head'), Dh.clone().multiply(R(id('head'))));
    // arms. Shoulders sit relaxed (a little lowered) and draw forward and back with the arm swing; the upper arm swings
    // about the chest's side axis, held slightly out from the body; the elbow bends to an absolute angle about the arm's
    // own hinge (the bend already in the base pose is replaced, not added to); the wrist trails the swing a little
    for (const [side, sgn, legPhase] of [['l', 1, 0.5], ['r', -1, 0]]) {
      const hold = rig.hold.find((h) => h.side === side);
      const wave = g.stand ? Math.sin(TAU * t / g.breath + (side === 'l' ? 0.6 : 0)) : Math.cos(TAU * (phi - legPhase - g.armLag));
      const swingAmp = g.arm * (hold ? hold.arm : 1) * (rig.armSwing[side] ?? 1) * wave, swing = (g.armCarry || 0) + swingAmp;
      const lat = X.clone().applyQuaternion(Ds2), fwd = Z.clone().applyQuaternion(Ds2), upv = up.clone().applyQuaternion(Ds2);
      const protract = (g.shoulderSwing || 0) * swingAmp, elevate = shoulderLift - (g.shoulderDrop || 0);
      const Dcl = axisAngle(fwd, sgn * elevate).multiply(axisAngle(upv, -sgn * protract)).multiply(Ds2.clone());
      setWorldRot(id('clavicle_' + side), Dcl.clone().multiply(R(id('clavicle_' + side))));
      // abduction is an absolute angle from hanging straight down in the chest's frontal plane (the base pose already
      // holds the arm out a little; that is replaced, not added to)
      const ub = P(id('lowerarm_' + side)).sub(P(id('upperarm_' + side))).normalize().applyQuaternion(Ds2);
      const abdNow = Math.atan2(sgn * ub.dot(lat), -ub.dot(upv)) / DEG;
      const Dua = axisAngle(lat, -swing).multiply(axisAngle(fwd, sgn * (g.abduct + rig.armOut - abdNow))).multiply(Ds2.clone());
      setWorldRot(id('upperarm_' + side), Dua.clone().multiply(R(id('upperarm_' + side))));
      const S = Rig.pos(W.get(id('upperarm_' + side))), E = Rig.pos(W.get(id('lowerarm_' + side))), Hn = Rig.pos(W.get(id('hand_' + side)));
      const u = E.clone().sub(S).normalize(), fore = Hn.clone().sub(E).normalize();
      let hinge = u.clone().cross(fore);
      if (hinge.length() < 0.05) hinge = u.clone().cross(fwd); // a straight base arm: bend towards the front
      hinge.normalize();
      const bendNow = Math.acos(Math.max(-1, Math.min(1, u.dot(fore)))) / DEG;
      const bend = Math.min(hold?.elbowMax ?? 180, g.elbow + g.elbowSwing * Math.max(0, swingAmp / g.arm));
      setWorldRot(id('lowerarm_' + side), axisAngle(hinge, bend - bendNow).multiply(Rig.rot(W.get(id('lowerarm_' + side)))));
      const lagged = g.arm * (g.stand ? Math.sin(TAU * t / g.breath + (side === 'l' ? 0.4 : -0.2)) : Math.cos(TAU * (phi - legPhase - g.armLag - 0.06)));
      setWorldRot(id('hand_' + side), axisAngle(hinge, -0.1 * lagged).multiply(Rig.rot(W.get(id('hand_' + side)))));
    }
    for (const h of rig.hold) if (rig.byName.has(h.joint)) {
      const j = id(h.joint), carried = Ds2.clone().multiply(R(j));
      setWorldRot(j, carried.slerp(Rig.rot(W.get(j)), h.follow));
    }
    // legs
    for (const leg of legs) {
      const p = frac(phi + leg.offset), foot = g.stand ? { ankle: leg.foot.clone(), pitch: 0, toes: true } : footAt(leg, p);
      const H = Rig.pos(W.get(id('thigh_' + leg.side)));
      const pole = Z.clone().applyAxisAngle(up, leg.knee * DEG);
      if (foot.swing !== undefined) {
        // a foot in the air never forces the knee straight: softly limit its reach mid-swing. The limit opens back up
        // to the IK maximum at lift-off and at the strike, so it meets the stance path exactly (no pop at contact)
        // Between those ends the knee may not straighten past what it has at toe-off / heel strike (measured by the
        // fitter), so the leg never snaps straight just before contact or just after lift-off.
        const d = foot.ankle.clone().sub(H), len = leg.l1 + leg.l2, s = foot.swing, w = Math.sin(Math.PI * s);
        const ends = g.rLift && g.rStrike ? g.rLift + (g.rStrike - g.rLift) * smooth(s) + 0.002 : 0.9995;
        const hard = len * Math.min(0.9995, ends - 0.02 * w), soft = hard - len * (0.006 + 0.03 * w), dl = d.length();
        if (dl > soft) foot.ankle.copy(H).add(d.setLength(soft + (hard - soft) * (1 - Math.exp(-(dl - soft) / (hard - soft)))));
      }
      const ik = twoBoneIK(H, foot.ankle, leg.l1, leg.l2, pole);
      const reach = foot.ankle.distanceTo(H) / (leg.l1 + leg.l2);
      if (foot.swing !== undefined) report.reachSwing = Math.max(report.reachSwing || 0, reach);
      if (g.trace && leg.side === g.trace.slice(-1)) (report.legTrace ||= []).push({ f, reach: +reach.toFixed(3), y: +foot.ankle.y.toFixed(3), z: +foot.ankle.z.toFixed(3), hy: +H.y.toFixed(3), hz: +H.z.toFixed(3), knee: +(180 - Math.acos(Math.max(-1, Math.min(1, ik.knee.clone().sub(H).normalize().dot(ik.ankle.clone().sub(ik.knee).normalize())))) / DEG).toFixed(1) });
      report.reachMax = Math.max(report.reachMax, reach);
      if (p < duty * 0.3) report.reachFront = Math.max(report.reachFront, reach); else if (p > duty * 0.7 && p < duty) report.reachBack = Math.max(report.reachBack, reach);
      else if (p > duty * 0.42 && p < duty * 0.58) report.reachMid = Math.max(report.reachMid, reach);
      const pole0 = Z.clone();
      setWorldRot(id('thigh_' + leg.side), aimDelta(leg.K0.clone().sub(leg.H0), ik.knee.clone().sub(H), pole0, ik.w).multiply(R(id('thigh_' + leg.side))));
      setWorldRot(id('calf_' + leg.side), aimDelta(leg.A0.clone().sub(leg.K0), ik.ankle.clone().sub(ik.knee), pole0, ik.w).multiply(R(id('calf_' + leg.side))));
      const yawQ = axisAngle(up, leg.yaw), lat = X.clone().applyQuaternion(yawQ);
      // On the ground the foot pitch is set against the floor. In the air it follows the shin (slightly pointed), so a
      // high heel recovery does not bend the ankle backwards; the blend is zero-slope at lift-off and at the strike.
      let footQ = axisAngle(lat, -foot.pitch).multiply(yawQ.clone()).multiply(R(id('foot_' + leg.side)));
      if (foot.swing !== undefined && g.footFollow) {
        const calf = id('calf_' + leg.side), Dcalf = Rig.rot(W.get(calf)).multiply(R(calf).invert());
        const follow = axisAngle(lat, g.swingPlantar || 0).multiply(Dcalf).multiply(R(id('foot_' + leg.side)));
        footQ = footQ.slerp(follow, g.footFollow * Math.sin(Math.PI * foot.swing) ** 2);
      }
      setWorldRot(id('foot_' + leg.side), footQ);
      // toes stay flat on the ground while the heel rolls up, then ease back to following the foot during the swing
      const toes = foot.toes === true ? 1 : foot.toes || 0;
      if (toes > 0) {
        const ball = id('ball_' + leg.side), follow = Rig.rot(W.get(ball)), planted = yawQ.clone().multiply(R(ball));
        setWorldRot(ball, follow.slerp(planted, toes));
      }
    }
    // eyes: small saccades (in head space)
    const head = Rig.rot(W.get(id('head')));
    // placed by fraction of the clip and each one returns before the end, so the gaze loops with the clip
    const hold = Math.min(0.9, duration * 0.2);
    let dy = 0, dp = 0; for (const [at, y, p] of [[0.12, 3, 1], [0.43, -2, 0], [0.7, 1, -1]]) { const a = smooth((t - at * duration) / 0.05) - smooth((t - at * duration - hold) / 0.08); dy += y * a; dp += p * a; }
    for (const e of ['eye_l', 'eye_r']) if (rig.byName.has(e)) {
      const i = id(e), cur = Rig.rot(W.get(i));
      setWorldRot(i, axisAngle(V(0, 1, 0).applyQuaternion(head), dy).multiply(axisAngle(V(1, 0, 0).applyQuaternion(head), -dp)).multiply(cur));
    }
    // quality checks: fastest joint rotation between frames, loop seam, lowest toe point
    const cur = new Map([...rig.joints].map(i => [i, local.get(i).r.clone()]));
    if (prevLocal) for (const [i, r] of cur) { const a = 2 * Math.acos(Math.min(1, Math.abs(r.dot(prevLocal.get(i))))) / DEG; if (a > report.angMax) { report.angMax = a; report.angBone = J.nodes[i].name; } }
    // pops: how far each joint departs from continuing its previous frame's motion (second difference, degrees)
    if (prev2Local) for (const [i, r] of cur) {
      const a = prevLocal.get(i), pred = a.clone().multiply(prev2Local.get(i).clone().invert()).multiply(a);
      const e = 2 * Math.acos(Math.min(1, Math.abs(r.dot(pred)))) / DEG; if (e > report.accMax) { report.accMax = e; report.accBone = J.nodes[i].name; }
      if (g.trace && J.nodes[i].name === g.trace) (report.trace ||= []).push({ f, phi: +phi.toFixed(3), e: +e.toFixed(2), q: r.toArray().map(x => +x.toFixed(3)) });
    }
    if (!firstLocal) firstLocal = cur; prev2Local = prevLocal; prevLocal = cur;
    if (f === frames) for (const [i, r] of cur) { const a = 2 * Math.acos(Math.min(1, Math.abs(r.dot(firstLocal.get(i))))) / DEG; if (a > report.seam) { report.seam = a; report.seamBone = J.nodes[i].name; } }
    for (const s of ['l', 'r']) report.toeMin = Math.min(report.toeMin, Rig.pos(W.get(id('ball_' + s))).y);
    if (dry) continue;
    // record locals for every node the Idle clip animates (keeps hidden effects hidden and props in place)
    for (const i of rig.animated) {
      const L = local.get(i), rec = tracks.get(i) || { t: [], r: [], s: [] };
      rec.t.push(L.t.toArray()); rec.r.push(L.r.normalize().toArray()); rec.s.push(L.s.toArray()); tracks.set(i, rec);
    }
    if (rig.idleWeights) {
      const w = rig.idleWeights.slice();
      for (const at of g.blinks) {
        const x = t - at, close = x < 0 ? 0 : x < 0.06 ? smooth(x / 0.06) : x < 0.09 ? 1 : x < 0.2 ? 1 - smooth((x - 0.09) / 0.11) : 0;
        for (const n of ['Blink_Left', 'Blink_Right']) { const ix = faceNames.indexOf(n); if (ix >= 0) w[ix] = Math.max(w[ix], close); }
      }
      const mo = faceNames.indexOf('Mouth_Open'); if (mo >= 0 && g.mouth) w[mo] = Math.max(w[mo], g.mouth * (0.7 + 0.3 * Math.cos(2 * TAU * phi)));
      weights.push(...w.map(x => [x]));
    }
  }
  if (dry) return { ...report, speed: v, cycle: T, duration, frames };
  // write the clip
  const input = addAccessor(rig.glb, times.map(t => [t]), 'SCALAR', true);
  const anim = { name, samplers: [], channels: [], extras: g.stand
    ? { loop: true, inPlace: true, speed: 0, idle: true, cycleSeconds: +T.toFixed(4), cycles: N, gait: name.toLowerCase(), author: 'tools/avatar-motion/locomotion.mjs' }
    : { loop: true, inPlace: true, speed: +v.toFixed(4), cycleSeconds: +T.toFixed(4), cycles: N, gait: name.toLowerCase(),
      footContacts: { left: [0, duty], right: [0.5, frac(0.5 + duty)] }, author: 'tools/avatar-motion/locomotion.mjs' } };
  const constant = rows => rows.every(r => r.every((x, j) => Math.abs(x - rows[0][j]) < 1e-6));
  for (const [i, rec] of tracks) {
    for (const [path, rows, type] of [['translation', rec.t, 'VEC3'], ['rotation', rec.r, 'VEC4'], ['scale', rec.s, 'VEC3']]) {
      const flat = constant(rows), keys = flat ? [rows[0], rows[0]] : rows, inp = flat ? addAccessor(rig.glb, [[0], [duration]], 'SCALAR', true) : input;
      anim.samplers.push({ input: inp, output: addAccessor(rig.glb, keys, type), interpolation: 'LINEAR' });
      anim.channels.push({ sampler: anim.samplers.length - 1, target: { node: i, path } });
    }
  }
  if (rig.idleWeights) {
    anim.samplers.push({ input, output: addAccessor(rig.glb, weights, 'SCALAR'), interpolation: 'LINEAR' });
    anim.channels.push({ sampler: anim.samplers.length - 1, target: { node: rig.faceNode, path: 'weights' } });
  }
  J.animations = J.animations.filter(a => a.name !== name); J.animations.push(anim);
  return { name, speed: v, cycle: T, duration, frames, ...report, tracks: anim.channels.length, drop: g.drop, stanceCenter: g.stanceCenter };
}

// Fit a gait to a body. The bind pose stands with the feet apart, so its hip height says little about walking:
//  1. set the hip height so the supporting leg is nearly straight at mid-stance (g.midReach of its length),
//  2. centre the stance so the leg reaches equally far at heel strike and at heel off,
//  3. if either end still asks for more than 98 % of the leg, shorten the stride (lower speed, same cadence).
export function fitGait(rig, name, g0) {
  const g = { ...g0 };
  for (let i = 0; i < 150; i++) {
    const r = buildClip(rig, null, name, g, true), legLen = 0.85;
    const mid = g.midReach - r.reachMid, imbalance = r.reachFront - r.reachBack, ends = Math.max(r.reachFront, r.reachBack);
    let changed = false;
    if (Math.abs(mid) > 0.002) { g.drop -= mid * legLen * 0.9; changed = true; }
    if (Math.abs(imbalance) > 0.003) { g.stanceCenter -= imbalance * 0.35; changed = true; }
    // over-reaching ends: a quicker cadence and a shorter ground contact before giving up speed
    if (ends > g.maxEnds) { if (g.duty > g.minDuty) g.duty -= 0.005; else if (g.cycle > g.minCycle) g.cycle *= 0.99; else g.speed *= 0.99; changed = true; }
    // the swing leg's reach limit at lift-off and strike (see buildClip)
    if (Math.abs((g.rLift || 0) - r.reachBack) > 1e-4 || Math.abs((g.rStrike || 0) - r.reachFront) > 1e-4) { g.rLift = r.reachBack; g.rStrike = r.reachFront; changed = true; }
    if (!changed) break;
  }
  return g;
}

// Artemis' right upper arm hangs pressed against her torso in the bind pose and was skinned to her collarbone and chest
// (only a strip along its outer side followed the arm bone), so a swinging arm left its skin behind: half an arm, with
// the armband ties stretched away from it. It is re-skinned with a smooth envelope around the arm's axis: full upper-arm
// weight within 75 % of the arm's radius, fading to none at 140 % (the radius tapers from the deltoid to the elbow), so
// the skin where arm and torso touch blends between them instead of tearing apart. The shoulder cap blends into the
// collarbone / chest and the original elbow blend is kept. A vertex only ever gains upper-arm weight; its other non-arm
// weights shrink in proportion.
export function reskinUpperArm(glb, meshName, side, radius) {
  const J = glb.json, mi = J.meshes.findIndex((m) => m.name === meshName), prim = J.meshes[mi].primitives[0];
  const skin = J.skins[J.nodes.find((n) => n.mesh === mi).skin], names = skin.joints.map((j) => J.nodes[j].name);
  const ibm = readAccessor(glb, skin.inverseBindMatrices).map((r) => new THREE.Matrix4().fromArray(r));
  const bp = (n) => V().applyMatrix4(ibm[names.indexOf(n)].clone().invert());
  const pos = readAccessor(glb, prim.attributes.POSITION), joints = readAccessor(glb, prim.attributes.JOINTS_0), weights = readAccessor(glb, prim.attributes.WEIGHTS_0);
  const upper = names.indexOf('upperarm_' + side), lower = names.indexOf('lowerarm_' + side);
  const S = bp('upperarm_' + side), E = bp('lowerarm_' + side), ax = E.clone().sub(S).normalize(), L = S.distanceTo(E);
  const outJ = joints.map((j) => j.slice()), outW = weights.map((w) => w.slice()), stats = { vertices: 0 };
  for (let i = 0; i < pos.length; i++) {
    const p = V(...pos[i]), t = p.clone().sub(S).dot(ax) / L;
    if (t < 0 || t > 1.05) continue;
    const d = p.clone().sub(S.clone().addScaledVector(ax, t * L)).length(), R = radius * (1 - 0.35 * t);
    const envelope = 1 - smooth((d - 0.75 * R) / (0.65 * R));
    const goal = envelope * smooth((t - 0.06) / 0.2) * (1 - smooth((t - 0.72) / 0.22));
    const current = new Map(); joints[i].forEach((j, k) => current.set(j, (current.get(j) || 0) + weights[i][k]));
    const had = current.get(upper) || 0;
    if (goal <= had + 0.02) continue;
    const others = [...current].filter(([j]) => j !== upper && j !== lower), othersSum = others.reduce((a, [, w]) => a + w, 0);
    const gain = Math.min(goal - had, othersSum);
    if (gain < 1e-3) continue;
    const target = new Map(current); target.set(upper, had + gain);
    for (const [j, w] of others) target.set(j, w - gain * (w / othersSum));
    const top = [...target].filter(([, w]) => w > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4), sum = top.reduce((a, [, w]) => a + w, 0);
    outJ[i] = [0, 1, 2, 3].map((k) => (top[k] ? top[k][0] : 0)); outW[i] = [0, 1, 2, 3].map((k) => (top[k] ? top[k][1] / sum : 0));
    stats.vertices++;
  }
  writeAccessorInPlace(glb, prim.attributes.JOINTS_0, outJ);
  writeAccessorInPlace(glb, prim.attributes.WEIGHTS_0, outW);
  return stats;
}

export function buildBody(key, gaits = GAITS) {
  const body = BODIES[key], glb = readGlb(new URL(body.src, ROOT));
  const weightRepair = body.reskin ? reskinUpperArm(glb, body.mesh, body.reskin.side, body.reskin.radius) : null;
  const rig = new Rig(glb, body.hold, body.armOut), results = [];
  rig.armSwing = body.armSwing || {};
  for (const [name, g] of Object.entries(gaits)) results.push(buildClip(rig, body, name, g.stand ? g : fitGait(rig, name, g)));
  // the creator's shape keys (tools/avatar-shapes/shapes.mjs) go in last, so every clip's face track is padded for them
  const shapes = bakeShapes(glb, key, body.mesh);
  compactGlb(glb);
  const bytes = writeGlb(glb, new URL(body.out, ROOT));
  return { key, out: body.out, bytes, results, weightRepair, shapes };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('locomotion.mjs')) {
  for (const key of Object.keys(BODIES)) {
    const r = buildBody(key);
    console.log(JSON.stringify({ body: r.key, out: r.out, mb: +(r.bytes / 1048576).toFixed(2), weightRepair: r.weightRepair, shapes: r.shapes, clips: r.results.map(c => Object.fromEntries(Object.entries(c).map(([k, x]) => [k, typeof x === "number" ? +x.toFixed(3) : x]))) }));
  }
}
