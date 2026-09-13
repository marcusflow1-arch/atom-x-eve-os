// Anatomical fitting for the supplied Hi3D warrior, not a general auto-rigger.
// Coordinates are meters, Y up, facing +Z. Original UVs and textures are retained.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { Vector3 as V, Quaternion as Q, Euler, Matrix4 } from 'three';
import { readGLB, builder } from './glb.mjs';
import { surfaceMask } from './parts.mjs';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node rig-and-animate.mjs optimized.glb animated.glb');
const src = readGLB(input), j = structuredClone(src.json), prim = j.meshes[0].primitives[0];
const sourcePositions = src.accessor(prim.attributes.POSITION);
const p = new Float32Array(sourcePositions.length);
const bounds = src.json.accessors[prim.attributes.POSITION];
const scale = 1.8 / (bounds.max[1] - bounds.min[1]);
for (let i = 0; i < p.length; i += 3) {
  p[i] = sourcePositions[i] * scale;
  p[i + 1] = (sourcePositions[i + 1] - bounds.min[1]) * scale;
  p[i + 2] = sourcePositions[i + 2] * scale;
}
const definitions = [
  ['Hips', null, [0, .915, -.015]],
  ['Spine', 'Hips', [0, 1.075, -.018]],
  ['Chest', 'Spine', [0, 1.305, -.021]],
  ['Neck', 'Chest', [0, 1.540, -.017]],
  ['Head', 'Neck', [0, 1.625, -.010]],
];
for (const [side, s] of [['Left', 1], ['Right', -1]]) definitions.push(
  [`${side}Shoulder`, 'Chest', [s * .113, 1.457, -.020]],
  [`${side}UpperArm`, `${side}Shoulder`, [s * .205, 1.460, -.022]],
  [`${side}ForeArm`, `${side}UpperArm`, [s * .271, 1.182, -.006]],
  [`${side}Hand`, `${side}ForeArm`, [s * .303, .968, .012]],
  [`${side}HandEnd`, `${side}Hand`, [s * .304, .865, .020]],
  [`${side}Thigh`, 'Hips', [s * .086, .906, -.015]],
  [`${side}Shin`, `${side}Thigh`, [s * .150, .573, .010]],
  [`${side}Foot`, `${side}Shin`, [s * .207, .126, -.013]],
  [`${side}Toe`, `${side}Foot`, [s * .225, .046, .108]],
);
const bones = definitions.map(([name, parent, position], i) => ({ name, parent: definitions.findIndex(x => x[0] === parent), rest: new V(...position), i }));
const byName = Object.fromEntries(bones.map(b => [b.name, b]));
const localRest = bones.map(b => b.rest.clone().sub(b.parent >= 0 ? bones[b.parent].rest : new V()));
const identity = () => new Q();
const euler = (x = 0, y = 0, z = 0) => new Q().setFromEuler(new Euler(x, y, z, 'XYZ'));
const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const mix = (a, b, t) => a + (b - a) * t;
const blendV = (a, b, t) => new V(...a).lerp(new V(...b), t);

function newPose() { return { rotations: bones.map(identity), root: bones[0].rest.clone(), chestScale: [1, 1, 1] }; }
function world(pose) {
  const pos = [], rot = [];
  bones.forEach((b, i) => {
    const parentRot = b.parent >= 0 ? rot[b.parent] : identity();
    pos[i] = b.parent < 0 ? pose.root.clone() : localRest[i].clone().applyQuaternion(parentRot).add(pos[b.parent]);
    rot[i] = parentRot.clone().multiply(pose.rotations[i]);
  });
  return { pos, rot };
}
function setRotation(pose, name, q) { pose.rotations[byName[name].i] = q; }
function solveLimb(pose, firstName, middleName, endName, target, pole, endRotation = identity()) {
  const first = byName[firstName], middle = byName[middleName], end = byName[endName];
  const w = world(pose), start = w.pos[first.i];
  const l1 = localRest[middle.i].length(), l2 = localRest[end.i].length();
  const direction = target.clone().sub(start); const distance = Math.max(.001, Math.min(direction.length(), l1 + l2 - .0001));
  direction.normalize();
  const bend = pole.clone().addScaledVector(direction, -pole.dot(direction)).normalize();
  const along = (l1 * l1 - l2 * l2 + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const mid = start.clone().addScaledVector(direction, along).addScaledVector(bend, height);
  const endpoint = start.clone().addScaledVector(direction, distance);
  const firstWorld = new Q().setFromUnitVectors(localRest[middle.i].clone().normalize(), mid.clone().sub(start).normalize());
  const middleWorld = new Q().setFromUnitVectors(localRest[end.i].clone().normalize(), endpoint.clone().sub(mid).normalize());
  pose.rotations[first.i] = w.rot[first.parent].clone().invert().multiply(firstWorld);
  pose.rotations[middle.i] = firstWorld.clone().invert().multiply(middleWorld);
  pose.rotations[end.i] = middleWorld.clone().invert().multiply(endRotation);
}
function legs(pose, targets) {
  for (const [side, s] of [['Left', 1], ['Right', -1]]) solveLimb(pose, `${side}Thigh`, `${side}Shin`, `${side}Foot`, targets[side], new V(s * .08, 0, 1));
}
function idle(t = 0, afk = false) {
  const pose = newPose(), breath = Math.sin(t * Math.PI / 2);
  pose.root.y += .002 * breath;
  setRotation(pose, 'Spine', euler(.005 * breath, 0, afk ? .015 * Math.sin(t * Math.PI / 4) : .003 * breath));
  setRotation(pose, 'Chest', euler(.004 * breath));
  setRotation(pose, 'Head', euler(afk ? .035 * Math.sin(t * Math.PI / 2) : .003 * breath, afk ? .13 * Math.sin(t * Math.PI / 4) : .009 * breath));
  pose.chestScale = [1 + .0015 * breath, 1, 1 + .006 * breath];
  for (const [side, s] of [['Left', 1], ['Right', -1]]) setRotation(pose, `${side}UpperArm`, euler(.009 * breath, 0, s * .006 * breath));
  return pose;
}
function walking(t) {
  const phase = t / 1.2 * Math.PI * 2, pose = newPose();
  pose.root.y -= .016 + .008 * (1 - Math.cos(2 * phase));
  setRotation(pose, 'Hips', euler(0, .025 * Math.sin(phase)));
  setRotation(pose, 'Chest', euler(.022, -.035 * Math.sin(phase)));
  const targets = {};
  for (const [side, s] of [['Left', 1], ['Right', -1]]) {
    const ph = phase + (s < 0 ? Math.PI : 0), swing = Math.sin(ph);
    targets[side] = new V(s * .205, .126 + .055 * Math.max(0, Math.cos(ph)), -.013 + .15 * swing);
    setRotation(pose, `${side}UpperArm`, euler(.24 * swing, 0, s * -.02));
    setRotation(pose, `${side}ForeArm`, euler(-.08 - .07 * Math.max(0, -swing)));
  }
  legs(pose, targets); return pose;
}
function armPose(t, waving = false) {
  const pose = idle(0), amount = waving ? smooth(t / .65) * smooth((3.2 - t) / .65) : smooth(t / 1.4);
  const oscillation = waving ? Math.sin(Math.max(0, t - .65) * Math.PI * 3.5) * smooth((t - .65) / .25) * smooth((2.65 - t) / .3) : 0;
  const target = byName.RightHand.rest.clone().lerp(new V(-.43 + oscillation * .035, 1.655, .125), amount);
  solveLimb(pose, 'RightUpperArm', 'RightForeArm', 'RightHand', target, new V(-1, -.15, 0), identity().slerp(euler(-Math.PI * .91, .08, .10 * oscillation), amount));
  setRotation(pose, 'Head', euler(0, -.03 * amount, -.02 * amount));
  return pose;
}
function seated(amount = 1, lean = 0, t = 0) {
  const pose = newPose(), a = smooth(amount), b = smooth(lean);
  pose.root.copy(blendV([0, .915, -.015], [0, .225, -.07], a));
  pose.root.y -= .015 * b;
  setRotation(pose, 'Hips', euler(mix(.025 * a, -.72, b)));
  setRotation(pose, 'Spine', euler(mix(.025 * a, -.20, b)));
  setRotation(pose, 'Chest', euler(mix(.012 * a, -.15, b)));
  setRotation(pose, 'Neck', euler(.33 * b));
  setRotation(pose, 'Head', euler(.20 * b + .003 * Math.sin(t * Math.PI / 2)));
  const targets = {};
  for (const [side, s] of [['Left', 1], ['Right', -1]]) targets[side] = blendV([s * .207, .126, -.013], [s * .205, .126, .46], smooth((a - .15) / .85));
  legs(pose, targets);
  const w = world(pose);
  for (const [side, s] of [['Left', 1], ['Right', -1]]) {
    const knee = w.pos[byName[`${side}Shin`].i];
    const seatedTarget = knee.clone().add(new V(s * .025, .070, -.06));
    const target = byName[`${side}Hand`].rest.clone().lerp(seatedTarget, a).lerp(new V(s * .30, .057, -.47), b);
    const supportPalm = new Q().setFromRotationMatrix(new Matrix4().makeBasis(new V(0, -s, 0), new V(0, 0, -1), new V(s, 0, 0)));
    const handOrientation = identity().slerp(euler(-Math.PI / 2, 0, -s * .12), a * .6).slerp(supportPalm, b);
    solveLimb(pose, `${side}UpperArm`, `${side}ForeArm`, `${side}Hand`, target, new V(s, -.3, -.2), handOrientation);
  }
  return pose;
}

// Four influences per vertex, with independent limb envelopes and smooth joints.
// The arm/torso boundary follows the armpit; hair below the neck follows the head.
const jointIndices = new Uint16Array(p.length / 3 * 4), weights = new Float32Array(p.length / 3 * 4);
const sourceIndices = src.accessor(prim.indices);
const upperSword = execFileSync('python', [new URL('./segment-prop.py', import.meta.url).pathname, input]);
if (upperSword.length !== p.length / 3) throw new Error('Prop segmentation size mismatch');
const leftThumb = surfaceMask(p, sourceIndices, (x, y, z) => x > .225 && x < .31 && y > .785 && y < 1 && z > .07, [.247, .876, .124]);
function smoothRange(value, center, radius) { return smooth((value - center + radius) / (2 * radius)); }
function segmentWeight(y, centers, names) {
  const result = {};
  for (let k = 0; k < centers.length - 1; k++) {
    const upper = centers[k], lower = centers[k + 1];
    if (y <= upper && y >= lower) { const t = smooth((y - lower) / (upper - lower)); result[names[k]] = t; result[names[k + 1]] = (result[names[k + 1]] || 0) + 1 - t; return result; }
  }
  result[y > centers[0] ? names[0] : names.at(-1)] = 1; return result;
}
for (let v = 0; v < p.length / 3; v++) {
  const x = p[v * 3], y = p[v * 3 + 1], z = p[v * 3 + 2], ax = Math.abs(x), side = x >= 0 ? 'Left' : 'Right';
  const armBoundary = y > 1.31 ? mix(.172, .194, smooth((y - 1.31) / .14)) : y > 1 ? mix(.172, .218, smooth((1.31 - y) / .31)) : mix(.218, .248, smooth((1 - y) / .13));
  const armAmount = smoothRange(ax, armBoundary, .009) * (1 - smoothRange(y, 1.491, .022)) * smoothRange(y, .710, .014);
  let body;
  if (y > 1.49) body = segmentWeight(y, [1.615, 1.555, 1.465], ['Head', 'Neck', 'Chest']);
  else if (y > 1.005) body = segmentWeight(y, [1.36, 1.14, 1.005], ['Chest', 'Spine', 'Hips']);
  else {
    const thighAmount = smoothRange(y, .573, .075), footAmount = 1 - smoothRange(y, .155, .045);
    const leg = { [`${side}Thigh`]: thighAmount, [`${side}Shin`]: (1 - thighAmount) * (1 - footAmount), [`${side}Foot`]: footAmount };
    // Keep the waistband on the pelvis. Below the crotch the shorts follow thighs.
    const hipAmount = smoothRange(y, .889 + .05 * Math.exp(-ax * ax / .003), .068);
    body = { Hips: hipAmount };
    for (const [name, weight] of Object.entries(leg)) body[name] = weight * (1 - hipAmount);
    if (y < .105 && z > .07) body = { [`${side}Foot`]: 1 };
  }
  const arm = segmentWeight(y, [1.32, 1.235, 1.12, 1.00, .949], [`${side}UpperArm`, `${side}UpperArm`, `${side}ForeArm`, `${side}ForeArm`, `${side}Hand`]);
  let combined = {};
  for (const [name, weight] of Object.entries(body)) combined[name] = weight * (1 - armAmount);
  for (const [name, weight] of Object.entries(arm)) combined[name] = (combined[name] || 0) + weight * armAmount;
  // Long ponytail lies behind the shoulders. This narrow envelope excludes shirt.
  if (y > 1.405 && z < -.066 && ax < .092) combined = { Head: 1 };
  // The source's sheathed sword is fused into the single mesh. Give the complete
  // diagonal sheath a rigid thigh attachment instead of borrowing hand weights.
  const swordX = y > 1.08 ? .17 - (y - 1.08) * .24 : .17 + (1.08 - y) * .19;
  const swordZ = .14 + (y - 1.14) * .57;
  const crossguard = Math.exp(-Math.pow((y - 1.025) / .028, 2));
  const swordRadiusX = (y > 1.075 ? .028 : .047) + .025 * crossguard, swordRadiusZ = (y > 1.075 ? .034 : .049) + .012 * crossguard;
  const swordDistance = Math.pow((x - swordX) / swordRadiusX, 2) + Math.pow((z - swordZ) / swordRadiusZ, 2);
  const lowerSheath = x > .145 && x < .282 && y > .67 && y < .89 && z < .015;
  const middleSheath = x > .13 && x < .235 + .02 * smooth((y - .98) / .06) && y >= .89 && y < 1.04 && z > .01 && z < .15;
  if (upperSword[v] || (y <= 1.015 && (lowerSheath || middleSheath || (x > .125 && y > .675 && swordDistance < 1.3)))) combined = { LeftThigh: 1 };
  // The inward-facing left thumb projects in front of the sheath.
  if (leftThumb[v]) combined = { LeftHand: 1 };
  const entries = Object.entries(combined).filter(([, w]) => w > .00001).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const sum = entries.reduce((s, [, w]) => s + w, 0);
  entries.forEach(([name, w], k) => { jointIndices[v * 4 + k] = byName[name].i; weights[v * 4 + k] = w / sum; });
}

const b = builder(j);
j.nodes = [{ name: 'Hi3D_Warrior', children: [1, 2], extras: { avatarRig: 'luna-hi3d-v1', preserveAppearance: true } }, { name: 'Hi3D_Warrior_Mesh', mesh: 0, skin: 0 }];
bones.forEach((bone, i) => j.nodes.push({ name: bone.name, translation: localRest[i].toArray(), children: bones.filter(x => x.parent === i).map(x => x.i + 2) }));
j.scenes = [{ name: 'Hi3D Warrior', nodes: [0] }]; j.scene = 0;
prim.attributes = {
  POSITION: b.addAccessor(p, 'VEC3', 34962, true),
  NORMAL: b.addAccessor(src.accessor(prim.attributes.NORMAL), 'VEC3', 34962),
  TEXCOORD_0: b.addAccessor(src.accessor(prim.attributes.TEXCOORD_0), 'VEC2', 34962),
  JOINTS_0: b.addAccessor(jointIndices, 'VEC4', 34962),
  WEIGHTS_0: b.addAccessor(weights, 'VEC4', 34962),
};
// Separate the tiny fused contact bridges. A sword and a hand must not share
// triangles with the shirt or shorts when they move independently.
const separatedIndices = [];
let separatedContactTriangles = 0;
for (let i = 0; i < sourceIndices.length; i += 3) {
  const face = Array.from(sourceIndices.subarray(i, i + 3));
  const propCount = face.reduce((n, v) => n + upperSword[v], 0);
  const yMin = Math.min(...face.map(v => p[v * 3 + 1]));
  const yMax = Math.max(...face.map(v => p[v * 3 + 1]));
  const hand = face.map(v => {
    let total = 0;
    for (let k = 0; k < 4; k++) if (/Hand|ForeArm/.test(bones[jointIndices[v * 4 + k]].name)) total += weights[v * 4 + k];
    return total;
  });
  const handBridge = yMax < 1.015 && yMin > .70 && Math.max(...hand) > .85 && Math.min(...hand) < .15;
  const propBridge = propCount > 0 && propCount < 3 && yMin > .995;
  if (handBridge || propBridge) { separatedContactTriangles++; continue; }
  separatedIndices.push(...face);
}
prim.indices = b.addAccessor(new Uint32Array(separatedIndices), 'SCALAR', 34963);
for (let i = 0; i < j.images.length; i++) j.images[i].bufferView = b.addView(src.view(src.json.images[i].bufferView));
const inverses = new Float32Array(bones.length * 16);
bones.forEach((bone, i) => new Matrix4().makeTranslation(...bone.rest.clone().negate().toArray()).toArray(inverses, i * 16));
j.skins = [{ name: 'Hi3D_Warrior_Skeleton', skeleton: 2, joints: bones.map(x => x.i + 2), inverseBindMatrices: b.addAccessor(inverses, 'MAT4') }];
j.animations = [];
const clips = [
  ['Idle', 4, t => idle(t), true],
  ['AFK', 8, t => idle(t, true), true],
  ['Wave', 3.2, t => armPose(t, true), false, 'Idle'],
  ['Walk', 1.2, walking, true],
  ['Arm_Raise', 1.4, t => armPose(t), false],
  ['Sit_Down', 2.6, t => seated(t / 2.6), false, 'Sit_Idle'],
  ['Sit_Idle', 4, t => seated(1, 0, t), true],
  ['Lean_Back', 2.2, t => seated(1, t / 2.2), false, 'Lean_Back_Idle'],
  ['Lean_Back_Idle', 4, t => seated(1, 1, t), true],
  ['Sit_Forward', 2.2, t => seated(1, 1 - t / 2.2), false, 'Sit_Idle'],
  ['Stand_Up', 2.6, t => seated(1 - t / 2.6), false, 'Idle'],
];
for (const [name, duration, sample, loop, next] of clips) {
  const count = Math.round(duration * 30) + 1, times = new Float32Array(count), poses = [];
  for (let i = 0; i < count; i++) { times[i] = duration * i / (count - 1); poses.push(sample(times[i])); }
  if (loop) poses[count - 1] = sample(0);
  const inputAccessor = b.addAccessor(times, 'SCALAR', undefined, true), animation = { name, samplers: [], channels: [], extras: { loop, ...(next ? { next } : {}) } };
  function track(node, path, values, type) {
    const sampler = animation.samplers.push({ input: inputAccessor, output: b.addAccessor(values, type), interpolation: 'LINEAR' }) - 1;
    animation.channels.push({ sampler, target: { node, path } });
  }
  bones.forEach((bone, boneIndex) => {
    const q = new Float32Array(count * 4); let previous = null;
    poses.forEach((pose, i) => {
      const rotation = pose.rotations[boneIndex].clone().normalize();
      if (previous && previous.dot(rotation) < 0) rotation.set(-rotation.x, -rotation.y, -rotation.z, -rotation.w);
      rotation.toArray(q, i * 4); previous = rotation;
    });
    track(boneIndex + 2, 'rotation', q, 'VEC4');
  });
  track(2, 'translation', new Float32Array(poses.flatMap(pose => pose.root.toArray())), 'VEC3');
  track(byName.Chest.i + 2, 'scale', new Float32Array(poses.flatMap(pose => pose.chestScale)), 'VEC3');
  j.animations.push(animation);
}
j.asset.generator = 'Hi3D source; Luna anatomical skinning and authored skeletal animation';
j.asset.extras = { ...j.asset.extras, triangles: separatedIndices.length / 3, separatedContactTriangles, rigJoints: bones.length, rigVersion: 1, units: 'meters', forward: '+Z', note: 'Procedural hand-authored clips. No facial rig, cloth simulation, or motion capture.' };
b.write(output);
fs.writeFileSync(output.replace(/\.glb$/, '.json'), JSON.stringify({ source: 'User-supplied Hi3D stylized male warrior', ...j.asset.extras, vertices: p.length / 3, bytes: fs.statSync(output).size, clips: clips.map(([name, duration, , loop, next]) => ({ name, duration, loop, next })), skeleton: definitions }, null, 2));
console.log(JSON.stringify({ output, bytes: fs.statSync(output).size, joints: bones.length, clips: clips.map(x => x[0]) }));
