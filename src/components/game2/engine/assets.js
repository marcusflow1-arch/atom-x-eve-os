/* eslint-disable */
import { parseGLB } from './glb.js';
import { fetchGame2Binary } from './chunked.js';
import { Skeleton } from './actor.js';
import { parseRBSP } from './rbsp.js';

const fetchBuf = fetchGame2Binary;
async function gunzip(buf) {
  const ds = new DecompressionStream('gzip'); const stream = new Blob([buf]).stream().pipeThrough(ds); return new Response(stream).arrayBuffer();
}
export async function loadBank(base, progress = () => { }) {
  let qbuf;
  try { progress('animation bank (gz)'); qbuf = await gunzip(await fetchBuf(base + 'bank_q.bin.gz')); }
  catch (e) { console.warn('gz bank failed, falling back to raw', e); progress('animation bank'); qbuf = await fetchBuf(base + 'bank_q.bin'); }
  const pbuf = await fetchBuf(base + 'bank_pel.bin');
  return { q: new Int16Array(qbuf), pel: new Float32Array(pbuf) };
}
export async function loadAll(base = 'assets/', progress = () => { }) {
  progress('rig'); const rigJson = await (await fetch(base + 'rig.json')).json();
  const bank = await loadBank(base, progress);
  progress('model'); const glb = parseGLB(await fetchBuf(base + 'Explorer_G2_Game.glb'));
  const skel = new Skeleton(rigJson, bank.q, bank.pel, glb);
  const J = glb.json, prim = J.meshes[0].primitives[0], A = prim.attributes;
  const body = { pos: glb.accessor(A.POSITION).data, nrm: glb.accessor(A.NORMAL).data, col: glb.accessor(A.COLOR_0).data, joints: glb.accessor(A.JOINTS_0).data, weights: glb.accessor(A.WEIGHTS_0).data, idx: glb.accessor(prim.indices).data };
  const lp = J.meshes.find(m => m.name === 'Explorer_Body_LOD1'), lod = lp ? (() => { const pr = lp.primitives[0], a = pr.attributes; return { pos: glb.accessor(a.POSITION).data, nrm: glb.accessor(a.NORMAL).data, col: glb.accessor(a.COLOR_0).data, joints: glb.accessor(a.JOINTS_0).data, weights: glb.accessor(a.WEIGHTS_0).data, idx: glb.accessor(pr.indices).data }; })() : null;
  const hp = J.meshes[1].primitives[0], HA = hp.attributes;
  const hilt = { pos: glb.accessor(HA.POSITION).data, nrm: glb.accessor(HA.NORMAL).data, col: glb.accessor(HA.COLOR_0).data, idx: glb.accessor(hp.indices).data };
  const node = n => J.nodes.find(x => x.name === n);
  const holster = node('Saber_Hilt'), grip = node('Saber_Grip_R');
  const attach = { holster: { t: holster.translation, q: holster.rotation, bone: 'rfemurYZ' }, grip: { t: grip.translation, q: grip.rotation, s: grip.extras.hilt_scale, bone: 'rhand' }, hiltLen: holster.extras.length_m };
  progress('saber moves'); const saberData = await (await fetch(base + 'sabermoves.json')).json();
  progress('Lightsaber Training map');
  const raw = await fetch(base + 'maps/duel_training.bsp');
  if (!raw.ok) throw new Error('Game 2 Lightsaber Training map missing: HTTP ' + raw.status);
  const duelMap = parseRBSP(await raw.arrayBuffer());
  // Fetch only original textures imported from the user's Drive. Other shader
  // references stay clearly color-shaded until their original assets are supplied.
  const have = new Set([
    'ceiling', 'goldblock', 'met_floor01', 'metalrandom1worn', 'metalstockworn',
    'stone_tile2', 'temple_basicwall3', 'temple_basicwall4',
    'temple_interiorsmall3', 'temple_stone2', 'tileblock', 'trim_stone06', 'trim_stone10',
  ]);
  duelMap.textureBitmaps = new Map();
  await Promise.all(duelMap.texturedMeshes.map(async ({ shader }) => {
    const match = /^textures\/yavin\/([a-z0-9_]+)$/.exec(shader);
    if (!match || !have.has(match[1])) return;
    const url = base + 'maps/' + shader + '.jpg';
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const bitmap = await createImageBitmap(await res.blob());
      duelMap.textureBitmaps.set(shader, bitmap);
    } catch (e) { console.warn('Game 2 texture unavailable:', url, e); }
  }));
  return { rigJson, skel, body, lod, hilt, attach, glb, saberData, duelMap };
}
