// Bakes the creator's shape keys (CC_FaceWidth, CC_JawWidth, ... see base44/shared/avatarCustomization.ts) into a
// character body. Each key is a smooth displacement field over bind-pose positions, placed from landmarks measured on
// the body itself: the eyeballs (their own meshes), the mouth, nostrils and brows (from the face's own expression
// shapes Mouth_Open, Nostril_Flare and Brow_Up_*), and the chest / glutes / shoulders (bones projected onto the skin).
// The same field is applied to the body and to the separate eye and mouth meshes, so the eyes stay in their sockets and
// the teeth inside the mouth. Keys are stored sparse (only moved vertices), and every animation that drives the body's
// expression weights gets zeros for the new keys (the creator sets them each frame).
// Most keys are two-sided: the creator drives them from -1 to 1 (age only 0..1).
import * as THREE from 'three';
import { readAccessor, addAccessor, addSparseAccessor } from '../avatar-motion/glb-io.mjs';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const smooth = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
const band = (x, a, b, soft) => smooth((x - a) / soft) * (1 - smooth((x - b) / soft));
const gauss = (d, s) => Math.exp(-(d / s) * (d / s));

export const SHAPE_KEYS = ['CC_FaceWidth', 'CC_JawWidth', 'CC_NoseWidth', 'CC_EyeSize', 'CC_BrowSize', 'CC_ChestSize', 'CC_GluteSize', 'CC_ShoulderWidth', 'CC_MuscleDefinition', 'CC_Age'];

function meshData(glb, mi) {
  const J = glb.json, mesh = J.meshes[mi], node = J.nodes.find((n) => n.mesh === mi);
  const skin = node?.skin !== undefined ? J.skins[node.skin] : null, names = skin ? skin.joints.map((j) => J.nodes[j].name) : [];
  return mesh.primitives.map((p) => ({
    prim: p,
    pos: readAccessor(glb, p.attributes.POSITION).map((r) => V(...r)),
    nor: p.attributes.NORMAL !== undefined ? readAccessor(glb, p.attributes.NORMAL).map((r) => V(...r)) : null,
    joints: p.attributes.JOINTS_0 !== undefined ? readAccessor(glb, p.attributes.JOINTS_0) : null,
    weights: p.attributes.WEIGHTS_0 !== undefined ? readAccessor(glb, p.attributes.WEIGHTS_0) : null,
    names,
  }));
}

// centroid of the vertices an expression shape moves (weighted by how far they move, above `share` of the largest)
function shapeCentroid(glb, body, mesh, targetName, share = 0.35, filter = () => true) {
  const names = mesh.extras?.targetNames || [], k = names.indexOf(targetName);
  if (k < 0) throw new Error('missing expression shape ' + targetName);
  const d = body[0], deltas = readAccessor(glb, d.prim.targets[k].POSITION).map((r) => V(...r).length());
  const top = Math.max(...deltas), c = V(); let w = 0;
  deltas.forEach((m, i) => { if (m > top * share && filter(d.pos[i])) { c.addScaledVector(d.pos[i], m); w += m; } });
  return c.multiplyScalar(1 / w);
}

export function landmarks(glb, bodyMesh) {
  const J = glb.json, mi = J.meshes.findIndex((m) => m.name === bodyMesh), mesh = J.meshes[mi], body = meshData(glb, mi);
  const center = (name) => { const m = J.meshes.findIndex((x) => x.name === name), p = readAccessor(glb, J.meshes[m].primitives[0].attributes.POSITION); return p.reduce((a, r) => a.add(V(...r).multiplyScalar(1 / p.length)), V()); };
  const skin = J.skins[J.nodes.find((n) => n.mesh === mi).skin], names = skin.joints.map((j) => J.nodes[j].name);
  const ibm = readAccessor(glb, skin.inverseBindMatrices).map((r) => new THREE.Matrix4().fromArray(r));
  const bone = (n) => V().applyMatrix4(ibm[names.indexOf(n)].clone().invert());
  const eyeL = center('EYE_Sclera_L'), eyeR = center('EYE_Sclera_R'), lateral = eyeL.clone().sub(eyeR).setY(0).normalize();
  const forward = V(0, 1, 0).cross(lateral).normalize().negate(); if (forward.z < 0) forward.negate();
  const face = eyeL.clone().add(eyeR).multiplyScalar(0.5);
  const near = (p) => p.distanceTo(face) < 0.16;
  const mouth = shapeCentroid(glb, body, mesh, 'Mouth_Open', 0.5, near);
  const nose = shapeCentroid(glb, body, mesh, 'Nostril_Flare', 0.35, near);
  const brow = shapeCentroid(glb, body, mesh, 'Brow_Up_Left', 0.35, near).add(shapeCentroid(glb, body, mesh, 'Brow_Up_Right', 0.35, near)).multiplyScalar(0.5);
  // chin: the lowest point of the face's front near its centre line (the neck below sits further back)
  const mouthW = mouth.clone().sub(face).dot(forward); let chin = null;
  body[0].pos.forEach((p) => { const q = p.clone().sub(face); if (Math.abs(q.dot(lateral)) < 0.012 && q.dot(forward) > mouthW - 0.03 && q.y > -0.16 && q.y < mouth.y - face.y && (!chin || p.y < chin.y)) chin = p.clone(); });
  // a point on the skin in front of / behind a body point (the extreme vertex within a small column around it)
  const surface = (at, dir, radius = 0.02) => {
    let best = null, score = -Infinity;
    body[0].pos.forEach((p) => { const off = p.clone().sub(at); if (Math.abs(off.x) > radius || Math.abs(off.y) > radius) return; const s = off.dot(dir); if (s > score) { score = s; best = p; } });
    return best.clone();
  };
  return { body, mesh, mi, bone, eyeL, eyeR, face, lateral, forward, mouth, nose, brow, chin, surface, eyeIris: [center('EYE_Iris_L'), center('EYE_Iris_R')] };
}

// per-body tuning (metres); the fields are shared
const TUNING = {
  male: { chestDrop: 0.03, chestSpread: 0.085, chestSigma: 0.075, chestDepth: 0.02, gluteSigma: 0.08 },
  female: { chestDrop: 0.06, chestSpread: 0.075, chestSigma: 0.06, chestDepth: 0.024, gluteSigma: 0.075 },
};

export function shapeFields(L, key) {
  const t = TUNING[key], { face, lateral: Lat, forward: F, mouth, nose, brow, chin, bone, surface } = L;
  const Y = V(0, 1, 0), skull = face.clone().addScaledVector(F, -0.085).addScaledVector(Y, 0.04);
  const local = (p) => { const q = p.clone().sub(face); return { u: q.dot(Lat), v: q.y, w: q.dot(F) }; };
  // the head (fading out over the neck) and its front half
  const head = (p) => (1 - smooth((p.distanceTo(skull) - 0.105) / 0.04)) * smooth((p.y - (chin.y - 0.03)) / 0.025);
  const front = (w) => smooth((w + 0.075) / 0.06);
  const chinV = chin.y - face.y, mouthV = mouth.y - face.y, browV = brow.y - face.y;
  const chest = [-1, 1].map((s) => surface(bone('spine_02').add(V(s * t.chestSpread, -t.chestDrop, 0)), V(0, 0, 1)));
  const glutes = [-1, 1].map((s) => surface(bone('pelvis').add(V(s * 0.075, -0.07, 0)), V(0, 0, -1)));
  const shoulders = ['l', 'r'].map((s) => bone('upperarm_' + s));
  const eyes = [L.eyeL, L.eyeR];
  const limb = /^(upperarm|lowerarm|thigh|calf)_[lr]$/;
  return {
    // wider / narrower face: cheeks, temples and jaw move sideways, the back of the head stays
    CC_FaceWidth: ({ p }) => { const { u, v, w } = local(p); return Lat.clone().multiplyScalar(u * 0.16 * head(p) * front(w) * band(v, chinV - 0.01, browV + 0.035, 0.02)); },
    // jaw: below the mouth, strongest at the jaw angle
    CC_JawWidth: ({ p }) => { const { u, v, w } = local(p); return Lat.clone().multiplyScalar(u * 0.26 * head(p) * smooth((w + 0.09) / 0.05) * band(v, chinV - 0.012, mouthV + 0.006, 0.018)); },
    // nose: the wings and tip spread from the nose's centre (an upright ellipsoid reaching the bridge)
    CC_NoseWidth: ({ p }) => { const q = p.clone().sub(nose), u = q.dot(Lat), v = q.y - 0.006, w = q.dot(F); return Lat.clone().multiplyScalar(u * 0.75 * gauss(Math.hypot(u, v / 1.8, w), 0.017)); },
    // eyes: the eyelids and the eyeballs scale about each eyeball's centre
    CC_EyeSize: ({ p }) => { const d = V(); for (const e of eyes) { const r = p.distanceTo(e); d.addScaledVector(p.clone().sub(e), 0.2 * (1 - smooth((r - 0.013) / 0.012))); } return d; },
    // brow ridge: forward and a little up where the brows lift
    CC_BrowSize: ({ p }) => { const q = p.clone().sub(brow), m = gauss(Math.hypot(q.dot(Lat) / 2.4, q.y / 1.1, q.dot(F)), 0.016); return F.clone().multiplyScalar(0.007 * m).addScaledVector(Y, 0.003 * m); },
    // chest: out along the skin's normal around two centres on the front of the chest
    CC_ChestSize: ({ p, n }) => { if (!n || n.z < 0.1) return V(); const m = Math.max(...chest.map((c) => gauss(p.distanceTo(c), t.chestSigma))); return n.clone().multiplyScalar(t.chestDepth * m * smooth((n.z - 0.1) / 0.3)); },
    // glutes: the same behind the pelvis
    CC_GluteSize: ({ p, n }) => { if (!n || n.z > -0.1) return V(); const m = Math.max(...glutes.map((c) => gauss(p.distanceTo(c), t.gluteSigma))); return n.clone().multiplyScalar(0.03 * m * smooth((-n.z - 0.1) / 0.3)); },
    // shoulders: the shoulder caps move out sideways
    CC_ShoulderWidth: ({ p }) => { const d = V(); shoulders.forEach((s, i) => { if ((i === 0) !== (p.x > 0)) return; d.x += (i === 0 ? 1 : -1) * 0.035 * gauss(p.distanceTo(s), 0.1); }); return d; },
    // muscle: arms and legs fill out along the normal (the chest has its own key; the quiver rides on the chest bone)
    CC_MuscleDefinition: ({ p, n, bones }) => { if (!n || !bones) return V(); const m = bones.reduce((a, [name, w]) => a + (limb.test(name) ? w : 0), 0); return m < 0.05 ? V() : n.clone().multiplyScalar(0.009 * Math.min(1, m)); },
    // age: jowls and the lower cheeks settle, the under-eye fills slightly
    CC_Age: ({ p }) => {
      const d = V();
      for (const s of [-1, 1]) {
        const jowl = mouth.clone().addScaledVector(Lat, s * 0.038).addScaledVector(Y, -0.014), cheek = mouth.clone().addScaledVector(Lat, s * 0.03).addScaledVector(Y, 0.012).addScaledVector(F, 0.004);
        d.addScaledVector(Y, -0.006 * gauss(p.distanceTo(jowl), 0.018)).addScaledVector(Lat, s * 0.0022 * gauss(p.distanceTo(jowl), 0.018));
        d.addScaledVector(Y, -0.003 * gauss(p.distanceTo(cheek), 0.016));
      }
      for (const e of L.eyeIris) d.addScaledVector(F, 0.0012 * gauss(p.distanceTo(e.clone().addScaledVector(Y, -0.016)), 0.009));
      return d;
    },
  };
}

// add the shape keys to the body and the eye / mouth meshes, and pad the body's expression animations with zeros
export function bakeShapes(glb, key, bodyMesh) {
  const J = glb.json, L = landmarks(glb, bodyMesh), fields = shapeFields(L, key);
  const targets = J.meshes.map((m, i) => [m, i]).filter(([m]) => m.name === bodyMesh || /^(EYE|MOUTH)_/.test(m.name));
  const stats = Object.fromEntries(SHAPE_KEYS.map((k) => [k, { vertices: 0, max: 0 }]));
  const before = new Map();
  for (const [mesh, mi] of targets) {
    const data = meshData(glb, mi);
    mesh.extras ||= {}; mesh.extras.targetNames ||= [];
    before.set(mi, mesh.extras.targetNames.length);
    for (const name of SHAPE_KEYS) {
      data.forEach((d) => {
        const entries = [];
        d.pos.forEach((p, i) => {
          const bones = d.joints ? d.joints[i].map((j, k) => [d.names[j], d.weights[i][k]]) : null;
          const delta = fields[name]({ p, n: d.nor?.[i], bones });
          if (delta.lengthSq() > 1e-8) { entries.push([i, delta.toArray()]); stats[name].max = Math.max(stats[name].max, delta.length()); }
        });
        if (mi === L.mi && d === data[0]) stats[name].vertices = entries.length;
        (d.prim.targets ||= []).push({ POSITION: addSparseAccessor(glb, d.pos.length, entries, 'VEC3') });
      });
      mesh.extras.targetNames.push(name);
      if (mesh.weights) mesh.weights.push(0);
    }
  }
  // animations: every weights track on these meshes gets zeros for the new keys (one new output per sampler)
  const meshOfNode = new Map(J.nodes.map((n, i) => [i, n.mesh]));
  for (const anim of J.animations) {
    const done = new Map();
    for (const ch of anim.channels) {
      if (ch.target.path !== 'weights' || !before.has(meshOfNode.get(ch.target.node))) continue;
      const sampler = anim.samplers[ch.sampler];
      if (done.has(sampler)) continue;
      const oldN = before.get(meshOfNode.get(ch.target.node)), keys = readAccessor(glb, sampler.input).length, out = readAccessor(glb, sampler.output);
      const per = out.length / keys, scale = per / oldN; // CUBICSPLINE carries 3 values per key
      const rows = [];
      for (let k = 0; k < keys * scale; k++) { for (let j = 0; j < oldN; j++) rows.push(out[k * oldN + j]); for (let j = 0; j < SHAPE_KEYS.length; j++) rows.push([0]); }
      sampler.output = addAccessor(glb, rows, 'SCALAR');
      done.set(sampler, true);
    }
  }
  return stats;
}
