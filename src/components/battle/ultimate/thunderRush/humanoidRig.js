// Rig-agnostic humanoid pose solver.
//
// Poses are authored once in "actor space" (metres, +Y up, +Z forward, feet on
// y = 0, character normalised to 1.8 m) and solved onto any humanoid skeleton:
// the male Getsuga rig (UE-style names), Mixamo rigs (female Artemis) and the
// Hi3D rig. Every bone's new orientation is expressed as a world-space delta
// from its own rest orientation, and limbs are solved with a two-bone IK whose
// twist is pinned by frame alignment, so the result does not depend on how a
// given rig orients its local bone axes. That is what keeps the move identical
// on male and female avatars.

import { clamp, q, v3, m4 } from './math.js';

const clean = (name = '') => String(name).toLowerCase()
  .replace(/^.*[|:]/, '')
  .replace(/^mixamorig\d*_?/, '')
  .replace(/^(bip0?1|def|b)[_ ]/, '')
  .replace(/\s+/g, '');

const SIDE_PATTERNS = {
  l: [/^(left|l)[_.]?/, /[_.](l|left)$/, /^left/, /left$/],
  r: [/^(right|r)[_.]?/, /[_.](r|right)$/, /^right/, /right$/],
};
const sideOf = (name) => {
  if (SIDE_PATTERNS.l.some((re) => re.test(name))) return 'l';
  if (SIDE_PATTERNS.r.some((re) => re.test(name))) return 'r';
  return '';
};
const stripSide = (name) => name
  .replace(/^(left|right)[_.]?/, '')
  .replace(/^(l|r)[_.]/, '')
  .replace(/[_.](l|r|left|right)$/, '')
  .replace(/(left|right)$/, '');

/**
 * Maps canonical humanoid keys to joint indices.
 * joints: [{ name, parent }] (parent = index or -1)
 */
export function resolveHumanoid(joints) {
  const names = joints.map((joint) => clean(joint.name));
  const find = (test) => names.findIndex((name, index) => test(name, index));
  const findSide = (side, re) => find((name) => sideOf(name) === side && re.test(stripSide(name)));
  const parentOf = (index) => (index >= 0 ? joints[index].parent : -1);
  const childrenOf = (index) => joints.map((joint, i) => (joint.parent === index ? i : -1)).filter((i) => i >= 0);

  const map = {};
  map.hips = find((name) => /^(hips|pelvis|hip)$/.test(name));
  if (map.hips < 0) map.hips = find((name) => /hips|pelvis/.test(name));
  map.head = find((name) => /^head$/.test(name));
  if (map.head < 0) map.head = find((name) => /head/.test(name) && !/end|top|nub/.test(name));
  map.neck = parentOf(map.head);
  if (map.neck >= 0 && !/neck/.test(names[map.neck])) map.neck = -1;

  for (const side of ['l', 'r']) {
    const S = side.toUpperCase();
    const hand = findSide(side, /^hand$/);
    const fore = hand >= 0 ? parentOf(hand) : -1;
    const upper = fore >= 0 ? parentOf(fore) : -1;
    const clav = upper >= 0 ? parentOf(upper) : -1;
    map[`hand${S}`] = hand;
    map[`fore${S}`] = fore;
    map[`upper${S}`] = upper;
    map[`clav${S}`] = clav >= 0 && /shoulder|clavicle|collar/.test(names[clav]) ? clav : -1;
    const foot = findSide(side, /^foot$/);
    const shin = foot >= 0 ? parentOf(foot) : -1;
    const thigh = shin >= 0 ? parentOf(shin) : -1;
    map[`foot${S}`] = foot;
    map[`shin${S}`] = shin;
    map[`thigh${S}`] = thigh;
    map[`toe${S}`] = foot >= 0 ? (childrenOf(foot)[0] ?? -1) : -1;
    map[`fingers${S}`] = hand >= 0 ? collect(hand, childrenOf) : [];
  }

  // Spine chain = joints strictly between hips and neck/head.
  const top = map.neck >= 0 ? map.neck : map.head;
  const spine = [];
  for (let at = parentOf(top); at >= 0 && at !== map.hips; at = parentOf(at)) spine.unshift(at);
  map.spine = spine;
  map.chest = spine.length ? spine[spine.length - 1] : map.hips;

  const required = ['hips', 'head', 'handL', 'foreL', 'upperL', 'handR', 'foreR', 'upperR', 'footL', 'shinL', 'thighL', 'footR', 'shinR', 'thighR'];
  const missing = required.filter((key) => !(map[key] >= 0));
  return { map, missing };
}

function collect(root, childrenOf) {
  const out = [];
  const stack = [...childrenOf(root)];
  while (stack.length) { const at = stack.pop(); out.push(at); stack.push(...childrenOf(at)); }
  return out;
}

const DEFAULT_ARM_POLE = [0, 0, -1];
const DEFAULT_LEG_POLE = [0, 0, 1];

/**
 * joints: [{ name, parent, position:[3], quaternion:[4], scale:number }]
 *   local rest transforms, in the order they should be solved (parents first).
 * rootParents: Map(jointIndex -> actor-space matrix of that root joint's parent node).
 */
export class HumanoidRig {
  constructor(joints, rootParents) {
    this.joints = joints;
    this.count = joints.length;
    this.rootParents = rootParents;
    const { map, missing } = resolveHumanoid(joints);
    if (missing.length) throw new Error(`Humanoid rig is missing: ${missing.join(', ')}`);
    this.map = map;
    this.order = topoOrder(joints);

    // Rest pose in actor space.
    this.restRot = new Array(this.count);
    this.restPos = new Array(this.count);
    this.restScale = new Array(this.count);
    for (const i of this.order) {
      const joint = joints[i];
      const parentRot = joint.parent >= 0 ? this.restRot[joint.parent] : m4.rotationOf(rootParents.get(i) || m4.identity());
      const parentScale = joint.parent >= 0 ? this.restScale[joint.parent] : m4.scaleOf(rootParents.get(i) || m4.identity());
      this.restRot[i] = q.norm(q.mul(parentRot, joint.quaternion));
      this.restScale[i] = parentScale * (joint.scale || 1);
      this.restPos[i] = joint.parent >= 0
        ? v3.add(this.restPos[joint.parent], q.rotate(parentRot, v3.scale(joint.position, parentScale)))
        : m4.point(rootParents.get(i) || m4.identity(), joint.position);
    }

    const P = this.restPos;
    const limb = (a, b, c, fallbackPole) => {
      const L1 = v3.dist(P[a], P[b]);
      const L2 = v3.dist(P[b], P[c]);
      const u0 = v3.norm(v3.sub(P[b], P[a]));
      const l0 = v3.norm(v3.sub(P[c], P[b]));
      // Use the rig's own elbow/knee direction when it is visibly bent at rest.
      const axis = v3.norm(v3.sub(P[c], P[a]));
      const bend = v3.perp(v3.sub(P[b], P[a]), axis);
      const bent = Math.acos(clamp(v3.dot(u0, l0), -1, 1)) > 0.14 && v3.len(bend) > 1e-4;
      const pole = bent ? v3.norm(bend) : fallbackPole;
      return { a, b, c, L1, L2, u0, l0, pole, reach: L1 + L2 };
    };
    this.armL = limb(map.upperL, map.foreL, map.handL, DEFAULT_ARM_POLE);
    this.armR = limb(map.upperR, map.foreR, map.handR, DEFAULT_ARM_POLE);
    this.legL = limb(map.thighL, map.shinL, map.footL, DEFAULT_LEG_POLE);
    this.legR = limb(map.thighR, map.shinR, map.footR, DEFAULT_LEG_POLE);

    this.hipsRest = P[map.hips];
    this.ankleHeight = (P[map.footL][1] + P[map.footR][1]) / 2;
    this.shoulderHeight = (P[map.upperL][1] + P[map.upperR][1]) / 2;
    this.hipWidth = Math.abs(P[map.thighL][0] - P[map.thighR][0]);

    // Roles for the solve loop.
    this.role = new Array(this.count).fill(null);
    const set = (index, role) => { if (index >= 0) this.role[index] = role; };
    set(map.hips, 'hips');
    map.spine.forEach((index, k) => set(index, { spine: (k + 1) / map.spine.length }));
    set(map.neck, 'neck');
    set(map.head, 'head');
    set(map.clavL, 'clavL'); set(map.clavR, 'clavR');
    set(map.upperL, 'upperL'); set(map.upperR, 'upperR');
    set(map.foreL, 'foreL'); set(map.foreR, 'foreR');
    set(map.handL, 'handL'); set(map.handR, 'handR');
    set(map.thighL, 'thighL'); set(map.thighR, 'thighR');
    set(map.shinL, 'shinL'); set(map.shinR, 'shinR');
    set(map.footL, 'footL'); set(map.footR, 'footR');
    map.fingersL.forEach((index) => set(index, 'fingerL'));
    map.fingersR.forEach((index) => set(index, 'fingerR'));

    this.worldRot = this.restRot.map((r) => [...r]);
    this.worldPos = this.restPos.map((p) => [...p]);
    this.localRot = joints.map((j) => [...j.quaternion]);
    this.localPos = joints.map((j) => [...j.position]);
  }

  // World position (actor space) of a canonical joint after the last solve.
  point(key) {
    const index = this.map[key];
    return index >= 0 ? this.worldPos[index] : this.worldPos[this.map.hips];
  }

  /**
   * pose: {
   *   hips: { offset:[x,y,z], pitch, yaw, roll },
   *   spine: { pitch, yaw, roll }, head: { pitch, yaw, roll },
   *   clavL/clavR: { raise, fwd },
   *   armL/armR: { target:[x,y,z] actor space, pole:[x,y,z], twist, flex, curl },
   *   legL/legR: { target:[x,y,z] ankle, pole:[x,y,z], yaw, pitch },
   * }
   */
  solve(pose) {
    const hips = pose.hips || {};
    const dHips = q.euler(hips.pitch || 0, hips.yaw || 0, hips.roll || 0);
    const spine = pose.spine || {};
    const dSpineFull = q.euler(spine.pitch || 0, spine.yaw || 0, spine.roll || 0);
    const head = pose.head || {};
    const dChest = q.mul(dHips, dSpineFull);
    const ik = {};

    for (const i of this.order) {
      const joint = this.joints[i];
      const role = this.role[i];
      const parent = joint.parent;
      const parentRot = parent >= 0 ? this.worldRot[parent] : m4.rotationOf(this.rootParents.get(i) || m4.identity());
      const parentScale = parent >= 0 ? this.restScale[parent] : m4.scaleOf(this.rootParents.get(i) || m4.identity());
      let pos = parent >= 0
        ? v3.add(this.worldPos[parent], q.rotate(parentRot, v3.scale(joint.position, parentScale)))
        : m4.point(this.rootParents.get(i) || m4.identity(), joint.position);
      let delta = null;

      if (role === 'hips') {
        delta = dHips;
        pos = v3.add(this.restPos[i], hips.offset || [0, 0, 0]);
      } else if (role && role.spine) {
        delta = q.mul(dHips, q.slerp(q.identity(), dSpineFull, role.spine));
      } else if (role === 'neck') {
        delta = q.mul(dChest, q.slerp(q.identity(), q.euler(head.pitch || 0, head.yaw || 0, head.roll || 0), 0.4));
      } else if (role === 'head') {
        delta = q.mul(dChest, q.euler(head.pitch || 0, head.yaw || 0, head.roll || 0));
      } else if (role === 'clavL' || role === 'clavR') {
        const c = pose[role] || {};
        const s = role === 'clavL' ? 1 : -1;
        // raise: shrug up (roll about forward axis), fwd: reach forward (yaw).
        delta = q.mul(dChest, q.euler(0, -s * (c.fwd || 0), s * (c.raise || 0)));
      } else if (role === 'upperL' || role === 'upperR') {
        const side = role === 'upperL' ? 'L' : 'R';
        const limb = side === 'L' ? this.armL : this.armR;
        const spec = pose[`arm${side}`];
        if (spec?.target) {
          const sol = twoBone(pos, spec.target, limb, spec.pole || [0, -0.3, -1]);
          ik[side] = sol;
          delta = q.alignFrames(limb.u0, limb.pole, sol.u1, sol.pole);
        }
      } else if (role === 'foreL' || role === 'foreR') {
        const side = role === 'foreL' ? 'L' : 'R';
        const limb = side === 'L' ? this.armL : this.armR;
        const sol = ik[side];
        delta = sol ? q.alignFrames(limb.l0, limb.pole, sol.l1, sol.pole) : null;
        if (sol) ik[`fore${side}`] = delta;
      } else if (role === 'handL' || role === 'handR') {
        const side = role === 'handL' ? 'L' : 'R';
        const spec = pose[`arm${side}`] || {};
        const base = ik[`fore${side}`];
        if (base) {
          const sol = ik[side];
          const hinge = v3.norm(v3.cross(sol.l1, sol.pole));
          let extra = q.axisAngle(sol.l1, spec.twist || 0);
          extra = q.mul(extra, q.axisAngle(hinge, spec.flex || 0));
          delta = q.mul(extra, base);
        }
      } else if (role === 'fingerL' || role === 'fingerR') {
        const side = role === 'fingerL' ? 'L' : 'R';
        const spec = pose[`arm${side}`] || {};
        const sol = ik[side];
        if (spec.curl && sol) {
          // Each finger joint curls a little further about the wrist hinge.
          const hinge = v3.norm(v3.cross(sol.l1, sol.pole));
          this.worldRot[i] = q.norm(q.mul(q.axisAngle(hinge, spec.curl), q.mul(parentRot, joint.quaternion)));
          this.worldPos[i] = pos;
          continue;
        }
      } else if (role === 'thighL' || role === 'thighR') {
        const side = role === 'thighL' ? 'L' : 'R';
        const limb = side === 'L' ? this.legL : this.legR;
        const spec = pose[`leg${side}`];
        if (spec?.target) {
          const sol = twoBone(pos, spec.target, limb, spec.pole || [0, 0, 1]);
          ik[`leg${side}`] = sol;
          delta = q.alignFrames(limb.u0, limb.pole, sol.u1, sol.pole);
        }
      } else if (role === 'shinL' || role === 'shinR') {
        const side = role === 'shinL' ? 'L' : 'R';
        const limb = side === 'L' ? this.legL : this.legR;
        const sol = ik[`leg${side}`];
        delta = sol ? q.alignFrames(limb.l0, limb.pole, sol.l1, sol.pole) : null;
      } else if (role === 'footL' || role === 'footR') {
        const side = role === 'footL' ? 'L' : 'R';
        const spec = pose[`leg${side}`] || {};
        // Feet stay level with the ground unless pitched explicitly.
        delta = q.euler(spec.pitch || 0, spec.yaw || 0, spec.roll || 0);
      }

      this.worldRot[i] = delta ? q.norm(q.mul(delta, this.restRot[i])) : q.norm(q.mul(parentRot, joint.quaternion));
      this.worldPos[i] = pos;
    }

    // Back to local transforms for the engine.
    for (const i of this.order) {
      const joint = this.joints[i];
      const parent = joint.parent;
      const parentRot = parent >= 0 ? this.worldRot[parent] : m4.rotationOf(this.rootParents.get(i) || m4.identity());
      this.localRot[i] = q.norm(q.mul(q.conj(parentRot), this.worldRot[i]));
      if (this.role[i] === 'hips') {
        const parentMatrix = parent >= 0
          ? m4.compose(this.worldPos[parent], this.worldRot[parent], this.restScale[parent])
          : (this.rootParents.get(i) || m4.identity());
        this.localPos[i] = m4.point(m4.invert(parentMatrix), this.worldPos[i]);
      }
    }
    return this;
  }
}

function twoBone(A, target, limb, poleHint) {
  const { L1, L2 } = limb;
  const d = v3.sub(target, A);
  const raw = v3.len(d) || 1e-4;
  const dist = clamp(raw, Math.abs(L1 - L2) + 1e-3, (L1 + L2) * 0.9995);
  const dn = v3.scale(d, 1 / raw);
  let p = v3.perp(poleHint, dn);
  p = v3.len(p) < 1e-5 ? v3.anyPerp(dn) : v3.norm(p);
  const cosA = clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1);
  const a = Math.acos(cosA);
  const u1 = v3.add(v3.scale(dn, Math.cos(a)), v3.scale(p, Math.sin(a)));
  const B = v3.addScaled(A, u1, L1);
  const Tc = v3.addScaled(A, dn, dist);
  const l1 = v3.norm(v3.sub(Tc, B));
  return { u1, l1, pole: p, elbow: B, end: Tc };
}

function topoOrder(joints) {
  const order = [];
  const seen = new Set();
  const visit = (i) => {
    if (seen.has(i)) return;
    const parent = joints[i].parent;
    if (parent >= 0) visit(parent);
    seen.add(i);
    order.push(i);
  };
  joints.forEach((_, i) => visit(i));
  return order;
}
