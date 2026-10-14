// Bakes recolour region masks (skin, hair and each garment) for the character bodies, whose skin, hair and clothes
// share one painted texture atlas. Run once per body change; the masks and their manifest ship with the app.
//
//   node tools/avatar-regions/bake-regions.mjs [--debug <dir>]
//
// For every texel of the atlas the tool knows where it sits on the body (bind-pose position and the bone that moves
// it, by rasterising the mesh in UV space) and its painted colour. Each region has a colour model fitted to seed
// spots chosen on the body (cheeks for skin, the crown for hair, the chest for a shirt, ...) and the parts of the body
// where it may appear; a texel belongs to the region whose colour it matches, only where that region is allowed.
// Memberships are soft, smoothed inside each UV island and padded across island borders so filtering never shows a
// seam. Needs ffmpeg on PATH (decoding the atlas and writing PNGs).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { readGlb, readAccessor } from '../avatar-motion/glb-io.mjs';

const ROOT = new URL('../../', import.meta.url);
const SIZE = 1024; // mask resolution (the atlases are 2048)

// Regions per body. `where`: bone groups the region may cover (plus an optional test on the body-space position);
// `lightnessSpread`: extra lightness variance of the colour model (a white garment is painted from near-black folds to
// full white, while its neutral colour already sets it apart); `chromaFloor`: minimum a/b variance (painted shadows on
// white cloth drift cool or warm);
// `seeds`: spots on the body whose painted colour defines the region. Positions are body space: metres, +Y up,
// +Z forward, +X the character's left. `face` is the frame between the eyes (lateral, up, forward).
const GROUPS = {
  head: ['head', 'jaw', 'eye_l', 'eye_r'], neck: ['neck_01'], torso: ['spine_01', 'spine_02', 'clavicle_l', 'clavicle_r'],
  upperarm: ['upperarm_l', 'upperarm_r'], forearm: ['lowerarm_l', 'lowerarm_r', 'hand_l', 'hand_r', 'fingers_l', 'fingers_r'],
  hips: ['pelvis', 'root'], thigh: ['thigh_l', 'thigh_r'], shin: ['calf_l', 'calf_r'], foot: ['foot_l', 'foot_r', 'ball_l', 'ball_r'],
};
const ALL = Object.keys(GROUPS);
const cheekSeeds = (f) => [-1, 1].map((s) => ({ at: f.point(s * 0.034, -0.042, -0.004), r: 0.02 }));
const along = (b, from, to, t, offset = [0, 0, 0], r = 0.035) => ({ at: b(from).lerp(b(to), t).add(new THREE.Vector3(...offset)), r });

export const BODIES = {
  male: {
    src: 'public/models/characters/Getsuga_Tensho_Character_v4.glb', mesh: 'SK_Character_mesh', material: 'M_Character',
    out: 'public/models/characters/regions/getsuga-v4',
    regions: (b, f) => [
      { id: 'skin', label: 'Skin', priority: 0, where: ALL, seeds: [...cheekSeeds(f), along(b, 'lowerarm_l', 'hand_l', 0.45, [0, 0, 0.03]), along(b, 'lowerarm_r', 'hand_r', 0.45, [0, 0, 0.03]), along(b, 'calf_l', 'foot_l', 0.4, [0, 0, 0.05]), along(b, 'calf_r', 'foot_r', 0.4, [0, 0, 0.05])] },
      { id: 'hair', label: 'Hair', where: ['head', 'neck', 'torso', 'upperarm'], test: (p) => p.y > b('neck_01').y - 0.18 && Math.abs(p.x) < 0.2 && !f.nearEyes(p, 0.024), seeds: [{ at: b('head').add(new THREE.Vector3(0, 0.17, -0.05)), r: 0.045 }, { at: b('head').add(new THREE.Vector3(0, 0.08, -0.12)), r: 0.04 }] },
      { id: 'shirt', label: 'Shirt', priority: 1, lightnessSpread: 500, chromaFloor: 20, where: ['torso', 'upperarm', 'hips', 'thigh', 'head', 'neck'], test: (p) => p.y < f.center.y - 0.13, seeds: [{ at: b('spine_02').add(new THREE.Vector3(0.06, 0.02, 0.13)), r: 0.05 }, { at: b('spine_02').add(new THREE.Vector3(-0.06, 0.0, -0.13)), r: 0.05 }] },
      { id: 'shorts', label: 'Shorts', priority: 1, where: ['hips', 'thigh', 'torso'], seeds: [along(b, 'thigh_l', 'calf_l', 0.4, [0, 0, 0.075], 0.04), along(b, 'thigh_r', 'calf_r', 0.4, [0, 0, 0.075], 0.04)] },
      { id: 'leather', label: 'Sandals & straps', where: ['foot', 'shin', 'forearm', 'hips'], seeds: [along(b, 'foot_l', 'ball_l', 0.5, [0, -0.025, 0], 0.03), along(b, 'foot_r', 'ball_r', 0.5, [0, -0.025, 0], 0.03)] },
    ],
  },
  female: {
    src: 'public/models/characters/Artemis_Character_v4.glb', mesh: 'Artemis_Body', material: 'M_Artemis',
    lightnessSpread: 40, // her leather and armour are skin-coloured but darker: keep the skin model tight in lightness
    out: 'public/models/characters/regions/artemis-v4',
    regions: (b, f) => [
      // her arms carry armbands and bracers, so skin is sampled on the face only (cheeks and chin)
      { id: 'skin', label: 'Skin', priority: 0, where: ALL, seeds: [...cheekSeeds(f), { at: f.point(0, -0.09, -0.012), r: 0.015 }] },
      // her hair is worn up, close around the skull; the quiver's arrows rise beside her head behind the right shoulder
      // (skinned to the head as well), about 22 cm from the skull centre
      { id: 'hair', label: 'Hair', where: ['head'], test: (p) => p.distanceTo(f.point(0, 0.04, -0.085)) < 0.165 && !f.nearEyes(p, 0.024), seeds: [{ at: f.center.clone().add(new THREE.Vector3(0, 0.1, 0)).addScaledVector(f.forward, -0.12), r: 0.045 }] },
      // the skirt panels hang between and behind the legs (the thighs show through the side slits)
      { id: 'dress', label: 'Dress', priority: 1, lightnessSpread: 500, chromaFloor: 20, where: ['torso', 'hips', 'thigh', 'shin', 'upperarm'], test: (p) => p.y < f.center.y - 0.12, seeds: [{ at: b('calf_l').lerp(b('calf_r'), 0.5).add(new THREE.Vector3(0, 0.05, 0.1)), r: 0.06 }, { at: b('calf_l').lerp(b('calf_r'), 0.5).add(new THREE.Vector3(0, 0, -0.12)), r: 0.06 }] },
      { id: 'leather', label: 'Leather & armour', where: ['torso', 'hips', 'upperarm', 'forearm', 'shin', 'foot', 'thigh'], test: (p) => p.y < f.center.y - 0.12, seeds: [along(b, 'lowerarm_l', 'hand_l', 0.6, [0, 0, 0], 0.04), along(b, 'lowerarm_r', 'hand_r', 0.6, [0, 0, 0], 0.04)] },
    ],
  },
};

// ---- colour ----
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lab(r, g, b) {
  const R = lin(r / 255), G = lin(g / 255), B = lin(b / 255);
  const x = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, y = 0.2126 * R + 0.7152 * G + 0.0722 * B, z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
// colour model: mean and inverse covariance in Lab, fitted to the middle 80 % of the seed texels; the lightness
// spread is widened because painted shading makes one material much lighter or darker across the body
function fitModel(samples, lightnessSpread = 120, chromaFloor = 6) {
  if (samples.length < 20) throw new Error('too few seed texels: ' + samples.length);
  const median = [0, 1, 2].map((k) => samples.map((s) => s[k]).sort((a, b) => a - b)[samples.length >> 1]);
  const kept = samples.map((s) => [s, Math.hypot(s[0] - median[0], s[1] - median[1], s[2] - median[2])]).sort((a, b) => a[1] - b[1]).slice(0, Math.ceil(samples.length * 0.8)).map((x) => x[0]);
  const mean = [0, 1, 2].map((k) => kept.reduce((a, s) => a + s[k], 0) / kept.length);
  const cov = new THREE.Matrix3().set(0, 0, 0, 0, 0, 0, 0, 0, 0), e = cov.elements;
  for (const s of kept) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) e[j * 3 + i] += ((s[i] - mean[i]) * (s[j] - mean[j])) / kept.length;
  const floor = [60, chromaFloor, chromaFloor]; // minimum variances (L, a, b): a seed patch never covers the full shading range
  for (let i = 0; i < 3; i++) e[i * 3 + i] = Math.max(e[i * 3 + i], floor[i]) + (i === 0 ? lightnessSpread : 0);
  return { mean, inv: cov.clone().invert(), count: kept.length };
}
const mahalanobis = (m, c) => {
  const d = [c[0] - m.mean[0], c[1] - m.mean[1], c[2] - m.mean[2]], e = m.inv.elements;
  let s = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += d[i] * e[j * 3 + i] * d[j];
  return Math.sqrt(Math.max(0, s));
};

function decode(file) {
  const info = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]).toString().trim().split(',').map(Number);
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 });
  return { width: info[0], height: info[1], data: raw };
}
function writePng(file, width, height, rgba) {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-i', '-', '-pix_fmt', 'rgba', file], { input: Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength) });
}

export function bake(key, { debug = null } = {}) {
  const body = BODIES[key], glb = readGlb(new URL(body.src, ROOT)), J = glb.json;
  const mi = J.meshes.findIndex((m) => m.name === body.mesh), prim = J.meshes[mi].primitives.find((p) => J.materials[p.material].name === body.material);
  const node = J.nodes.find((n) => n.mesh === mi), skin = J.skins[node.skin];
  const jointNames = skin.joints.map((j) => J.nodes[j].name);
  const ibm = readAccessor(glb, skin.inverseBindMatrices).map((r) => new THREE.Matrix4().fromArray(r));
  const b = (name) => new THREE.Vector3().applyMatrix4(ibm[jointNames.indexOf(name)].clone().invert());
  const center = (name) => { const m = J.meshes.findIndex((x) => x.name === name), p = readAccessor(glb, J.meshes[m].primitives[0].attributes.POSITION); return p.reduce((a, v) => a.add(new THREE.Vector3(...v).multiplyScalar(1 / p.length)), new THREE.Vector3()); };
  const eyeL = center('EYE_Iris_L'), eyeR = center('EYE_Iris_R'), lateral = eyeL.clone().sub(eyeR).setY(0).normalize();
  const face = { center: eyeL.clone().add(eyeR).multiplyScalar(0.5), lateral, forward: new THREE.Vector3(0, 1, 0).cross(lateral).normalize().negate() };
  face.point = (x, y, z) => face.center.clone().addScaledVector(face.lateral, x).add(new THREE.Vector3(0, y, 0)).addScaledVector(face.forward, z);
  face.nearEyes = (p, r) => p.distanceTo(eyeL) < r || p.distanceTo(eyeR) < r;
  if (face.forward.z < 0) face.forward.negate();
  const regions = body.regions(b, face);
  const groupOf = new Map(Object.entries(GROUPS).flatMap(([g, names]) => names.map((n) => [n, g])));

  // ---- mesh -> UV raster: body position and bone group of every mask texel
  const pos = readAccessor(glb, prim.attributes.POSITION), uv = readAccessor(glb, prim.attributes.TEXCOORD_0), idx = readAccessor(glb, prim.indices).map((r) => r[0]);
  const joints = readAccessor(glb, prim.attributes.JOINTS_0), weights = readAccessor(glb, prim.attributes.WEIGHTS_0);
  const vGroup = joints.map((j, i) => { let best = 0; for (let k = 1; k < 4; k++) if (weights[i][k] > weights[i][best]) best = k; return groupOf.get(jointNames[j[best]]) || 'other'; });
  const N = SIZE * SIZE, covered = new Uint8Array(N), tPos = new Float32Array(N * 3), tGroup = new Array(N);
  for (let t = 0; t < idx.length; t += 3) {
    const [a, c, d] = [idx[t], idx[t + 1], idx[t + 2]];
    const ax = uv[a][0] * SIZE, ay = uv[a][1] * SIZE, bx = uv[c][0] * SIZE, by = uv[c][1] * SIZE, cx = uv[d][0] * SIZE, cy = uv[d][1] * SIZE;
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax); if (Math.abs(area) < 1e-12) continue;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(SIZE - 1, Math.ceil(Math.max(ax, bx, cx)));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), y1 = Math.min(SIZE - 1, Math.ceil(Math.max(ay, by, cy)));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w1 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area, w2 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area, w3 = 1 - w1 - w2;
      if (w1 < -1e-4 || w2 < -1e-4 || w3 < -1e-4) continue;
      const i = y * SIZE + x; covered[i] = 1;
      for (let k = 0; k < 3; k++) tPos[i * 3 + k] = pos[a][k] * w1 + pos[c][k] * w2 + pos[d][k] * w3;
      tGroup[i] = vGroup[w1 >= w2 && w1 >= w3 ? a : w2 >= w3 ? c : d];
    }
  }
  // ---- atlas colour per mask texel (box average)
  const image = J.images[J.textures[J.materials[prim.material].pbrMetallicRoughness.baseColorTexture.index].source];
  const view = J.bufferViews[image.bufferView], tmp = `${os.tmpdir()}/avatar-atlas-${key}.${image.mimeType.split('/')[1]}`;
  fs.writeFileSync(tmp, glb.bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength));
  const atlas = decode(tmp), s = atlas.width / SIZE, tLab = new Float32Array(N * 3), tRgb = new Float32Array(N * 3);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    let r = 0, g = 0, bb = 0, n = 0;
    for (let yy = 0; yy < s; yy++) for (let xx = 0; xx < s; xx++) { const o = ((y * s + yy) * atlas.width + (x * s + xx)) * 4; r += atlas.data[o]; g += atlas.data[o + 1]; bb += atlas.data[o + 2]; n++; }
    const i = y * SIZE + x; tRgb.set([r / n, g / n, bb / n], i * 3); tLab.set(lab(r / n, g / n, bb / n), i * 3);
  }
  // ---- colour models from seeds
  const P = (i) => new THREE.Vector3(tPos[i * 3], tPos[i * 3 + 1], tPos[i * 3 + 2]);
  const C = (i) => [tLab[i * 3], tLab[i * 3 + 1], tLab[i * 3 + 2]];
  const allowed = (r, i) => covered[i] && r.where.includes(tGroup[i]) && (!r.test || r.test(P(i)));
  for (const r of regions) {
    const samples = [];
    for (let i = 0; i < N; i++) if (allowed(r, i) && r.seeds.some((sd) => P(i).distanceTo(sd.at) < sd.r)) samples.push(C(i));
    r.model = fitModel(samples, r.lightnessSpread ?? body.lightnessSpread, r.chromaFloor);
    if (process.env.REGION_STATS) { const q = (k, p) => samples.map((x) => x[k]).sort((a, b) => a - b)[Math.floor(samples.length * p)]; console.log(key, r.id, 'n', samples.length, ['L', 'a', 'b'].map((n, k) => `${n} ${q(k, 0.1).toFixed(0)}/${q(k, 0.5).toFixed(0)}/${q(k, 0.9).toFixed(0)}`).join('  ')); }
  }
  // ---- classify: the nearest colour model among the regions allowed here; soft by distance and by margin
  const member = regions.map(() => new Float32Array(N));
  for (let i = 0; i < N; i++) {
    if (!covered[i]) continue;
    const c = C(i), d = regions.map((r) => (allowed(r, i) ? mahalanobis(r.model, c) : Infinity));
    let best = 0; for (let k = 1; k < d.length; k++) if (d[k] < d[best]) best = k;
    const second = Math.min(...d.filter((_, k) => k !== best));
    const fit = 1 - smoothstep(2.6, 4.2, d[best]), margin = smoothstep(0.0, 0.8, second - d[best]);
    member[best][i] = fit * (0.5 + 0.5 * margin);
  }
  // REGION_PROBE="key:x,y,z,r;..." prints what the texels around body points became (tuning aid)
  for (const probe of (process.env.REGION_PROBE || '').split(';').filter((p) => p.startsWith(key + ':'))) {
    const [x, y, z, r] = probe.slice(key.length + 1).split(',').map(Number), at = new THREE.Vector3(x, y, z), hits = [];
    for (let i = 0; i < N; i++) if (covered[i] && P(i).distanceTo(at) < r) hits.push(i);
    const mean = (k) => (hits.reduce((a, i) => a + tLab[i * 3 + k], 0) / hits.length).toFixed(1);
    console.log(key, 'probe', probe, 'texels', hits.length, 'Lab', [0, 1, 2].map(mean).join('/'), regions.map((rg, k) => `${rg.id} ${(hits.reduce((a, i) => a + member[k][i], 0) / hits.length).toFixed(2)}`).join(' '),
      'groups', [...new Set(hits.map((i) => tGroup[i]))].join(','), 'dist', regions.map((rg) => `${rg.id} ${(hits.reduce((a, i) => a + Math.min(9, allowed(rg, i) ? mahalanobis(rg.model, C(i)) : 9), 0) / hits.length).toFixed(1)}`).join(' '));
  }
  // REGION_DUMP="key:regionId" prints where (5 cm cells, body space) a region's texels are (tuning aid)
  if (process.env.REGION_DUMP?.startsWith(key + ':')) {
    const k = regions.findIndex((r) => r.id === process.env.REGION_DUMP.split(':')[1]), cells = new Map();
    for (let i = 0; i < N; i++) if (member[k]?.[i] > 0.5) { const c = P(i).multiplyScalar(20).round().multiplyScalar(5).toArray().join(','); cells.set(c, (cells.get(c) || 0) + 1); }
    console.log(key, 'dump', [...cells].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([c, n]) => `(${c})cm:${n}`).join(' '));
  }
  // ---- painted lines (muscle definition, wrinkles, seams) belong to what they are drawn on: close each region over
  // thin gaps, in priority order, so a line inside skin is skin and not the nearest-coloured garment
  regions.map((r, k) => [r.priority ?? 2, k]).sort((x, y) => x[0] - y[0]).forEach(([, k], rank, order) => {
    const solid = close(member[k], covered, 4);
    const before = new Set(order.slice(0, rank).map(([, j]) => j));
    for (let i = 0; i < N; i++) {
      if (!solid[i] || member[k][i] > 0.5) continue;
      if ([...before].some((j) => member[j][i] > 0.5)) continue; // a higher-priority region already owns it
      member[k][i] = 1;
      member.forEach((m, j) => { if (j !== k) m[i] = Math.min(m[i], 0.05); });
    }
  });
  // ---- smooth inside islands, then pad across island borders
  for (const m of member) { blur(m, covered, 2); pad(m, covered, 6); }
  // ---- region reference colours: the average of confident texels taken in gamma space (where the shader measures each
  // texel's offset from it), stored linear as (mean)^2.2 to match the shader's encoding
  const manifest = { body: key, source: body.src, material: body.material, size: SIZE, version: 1, regions: [] };
  regions.forEach((r, k) => {
    let n = 0; const sum = [0, 0, 0];
    // texels on the mesh only: the padding grown outside each island holds gutter colours
    for (let i = 0; i < N; i++) if (covered[i] && member[k][i] > 0.8) { n++; for (let c = 0; c < 3; c++) sum[c] += tRgb[i * 3 + c] / 255; }
    manifest.regions.push({ id: r.id, label: r.label, texture: k >> 2, channel: 'rgba'[k & 3], reference: sum.map((v) => +((v / Math.max(1, n)) ** 2.2).toFixed(5)), coverage: +(n / covered.reduce((a, v) => a + v, 0)).toFixed(4), seedTexels: r.model.count });
  });
  // ---- write: RGBA mask textures (4 regions each) + manifest
  const out = new URL(body.out + '/', ROOT); fs.mkdirSync(out, { recursive: true });
  const textures = Math.ceil(regions.length / 4); manifest.textures = [];
  for (let t = 0; t < textures; t++) {
    const rgba = new Uint8Array(N * 4);
    for (let i = 0; i < N; i++) for (let c = 0; c < 4; c++) { const k = t * 4 + c; rgba[i * 4 + c] = k < regions.length ? Math.round(member[k][i] * 255) : 0; }
    const name = `mask-${t}.png`; writePng(fileURLToPath(new URL(name, out)), SIZE, SIZE, rgba); manifest.textures.push(name);
  }
  fs.writeFileSync(new URL('regions.json', out), JSON.stringify(manifest, null, 2) + '\n');
  if (debug) writeDebug(debug, key, regions, member, covered, tRgb, tGroup);
  return manifest;
}

// binary closing (dilate then erode, square window) of membership > 0.5, inside covered texels
function close(m, covered, r) {
  const bin = new Uint8Array(m.length);
  for (let i = 0; i < m.length; i++) bin[i] = m[i] > 0.5 ? 1 : 0;
  const pass = (src, grow) => {
    const tmp = new Uint8Array(src.length), dst = new Uint8Array(src.length);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      let v = grow ? 0 : 1;
      for (let k = -r; k <= r; k++) { const xx = Math.min(SIZE - 1, Math.max(0, x + k)), s = src[y * SIZE + xx]; v = grow ? Math.max(v, s) : Math.min(v, s); }
      tmp[y * SIZE + x] = v;
    }
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      let v = grow ? 0 : 1;
      for (let k = -r; k <= r; k++) { const yy = Math.min(SIZE - 1, Math.max(0, y + k)), s = tmp[yy * SIZE + x]; v = grow ? Math.max(v, s) : Math.min(v, s); }
      dst[y * SIZE + x] = v;
    }
    return dst;
  };
  // texels outside the mesh never stop the erosion (an island edge is not a gap)
  const grown = pass(bin, true);
  for (let i = 0; i < m.length; i++) if (!covered[i]) grown[i] = 1;
  const closed = pass(grown, false);
  for (let i = 0; i < m.length; i++) closed[i] &= covered[i];
  return closed;
}
function smoothstep(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function blur(m, covered, radius) {
  const tmp = new Float32Array(m.length);
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const src = dx ? m : tmp, dst = dx ? tmp : m;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x; if (!covered[i]) { dst[i] = src[i]; continue; }
      let s = 0, n = 0;
      for (let k = -radius; k <= radius; k++) { const xx = x + k * dx, yy = y + k * dy; if (xx < 0 || yy < 0 || xx >= SIZE || yy >= SIZE) continue; const j = yy * SIZE + xx; if (covered[j]) { s += src[j]; n++; } }
      dst[i] = s / n;
    }
  }
}
// grow every island outwards by `steps` texels (average of covered neighbours) so bilinear filtering and mipmaps
// near a seam read the island's own value
function pad(m, covered, steps) {
  let mask = covered.slice();
  for (let s = 0; s < steps; s++) {
    const next = mask.slice();
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x; if (mask[i]) continue;
      let sum = 0, n = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= SIZE || yy >= SIZE) continue; const j = yy * SIZE + xx; if (mask[j]) { sum += m[j]; n++; } }
      if (n) { m[i] = sum / n; next[i] = 1; }
    }
    mask = next;
  }
}
const REGION_COLORS = [[255, 170, 120], [70, 110, 255], [240, 240, 240], [110, 200, 80], [200, 80, 220], [255, 220, 60]];
function writeDebug(dir, key, regions, member, covered, tRgb, tGroup) {
  fs.mkdirSync(dir, { recursive: true });
  const N = SIZE * SIZE, over = new Uint8Array(N * 4), groups = new Uint8Array(N * 4);
  const gColor = { head: [230, 80, 80], torso: [80, 160, 230], upperarm: [80, 220, 200], forearm: [230, 200, 80], hips: [160, 90, 220], thigh: [90, 200, 90], shin: [240, 140, 60], foot: [200, 200, 200], other: [90, 90, 90] };
  for (let i = 0; i < N; i++) {
    const base = [tRgb[i * 3], tRgb[i * 3 + 1], tRgb[i * 3 + 2]].map((v) => v * 0.35);
    let col = base;
    regions.forEach((r, k) => { const w = member[k][i]; if (w > 0) col = col.map((v, c) => v * (1 - w * 0.75) + REGION_COLORS[k][c] * w * 0.75); });
    over.set([...col.map(Math.round), 255], i * 4);
    groups.set([...(covered[i] ? gColor[tGroup[i]] || [0, 0, 0] : [0, 0, 0]), 255], i * 4);
  }
  writePng(`${dir}/${key}-regions.png`, SIZE, SIZE, over);
  writePng(`${dir}/${key}-bones.png`, SIZE, SIZE, groups);
}

if (process.argv[1]?.endsWith('bake-regions.mjs')) {
  const dbg = process.argv.indexOf('--debug'), debug = dbg > 0 ? process.argv[dbg + 1] : null;
  for (const key of Object.keys(BODIES)) {
    const m = bake(key, { debug });
    console.log(key, JSON.stringify(m.regions.map((r) => [r.id, r.coverage, r.seedTexels, r.reference])));
  }
}
