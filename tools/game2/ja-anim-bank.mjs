// Build Game 2's optional Jedi Academy animation bank from the user's own Jedi Academy install.
//
//   node tools/game2/ja-anim-bank.mjs [folder with _humanoid.gla and animation.cfg]
//
// (default folder: ../local-retail/jka next to the repo; extract them from GameData/base/assets1.pk3, the
// models/players/_humanoid/ folder). Writes public/game2/local/ja/ — ignored by git: retail animation data stays on
// this PC and is never committed or deployed. The game loads it when it is there (engine/assets.js) and falls back to
// the Jedi Outcast set otherwise.
//
// Only the animations Jedi Outcast does not have are taken (dual sabers, saberstaff, katas, Jedi Academy Force poses…),
// so every existing move stays exactly as it was. Game 2's rig poses 72 bones; Jedi Academy animates 50 of them
// (no finger joints or toe bones): those keep a two-handed saber grip taken from Jedi Outcast's BOTH_STAND2.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readGla, readAnimationCfg } from './gla.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const src = resolve(process.argv[2] || join(repo, '../local-retail/jka'));
const out = join(repo, 'public/game2/local/ja');

const G = readGla(readFileSync(join(src, '_humanoid.gla')));
const cfg = readAnimationCfg(readFileSync(join(src, 'animation.cfg'), 'latin1'));
const rig = JSON.parse(readFileSync(join(repo, 'public/game2/rig.json')));
const NB = rig.rig.nBones, names = rig.rig.g2Bones;
const joQ = new Int16Array(new Uint8Array(gunzipSync(Buffer.concat([0, 1, 2, 3, 4].map(i => readFileSync(join(repo, `public/game2/parts/bank_q.bin.gz.00${i}`)))))).buffer);
const have = new Set(rig.anims.map(a => a.name));

// Game 2 bone -> Jedi Academy bone (or -1: no data, use the reference grip)
const jaIndex = names.map(n => G.bones.findIndex(b => b.name === n));
const ref = rig.anims.find(a => a.name === 'BOTH_STAND2'), refBase = ref.first * NB * 4;
const pelvis = G.bones.findIndex(b => b.name === 'pelvis');

const take = cfg.filter(a => !have.has(a.name) && a.n > 0 && a.first >= 0 && a.first + a.n <= G.numFrames);
const frames = take.reduce((s, a) => s + a.n, 0);
const q = new Int16Array(frames * NB * 4), pel = new Float32Array(frames * 3), anims = [];
let f = 0;
for (const a of take) {
  anims.push({ name: a.name, first: f, n: a.n, loop: a.loop, fps: a.fps });
  for (let k = 0; k < a.n; k++, f++) {
    for (let b = 0; b < NB; b++) {
      const o = (f * NB + b) * 4, j = jaIndex[b];
      if (j < 0) { for (let i = 0; i < 4; i++) q[o + i] = joQ[refBase + b * 4 + i]; continue; }
      const w = G.quat(a.first + k, j); for (let i = 0; i < 4; i++) q[o + i] = Math.max(-32767, Math.min(32767, Math.round(w[i] * 32767)));
    }
    const t = G.trans(a.first + k, pelvis); pel[f * 3] = t[0]; pel[f * 3 + 1] = t[1]; pel[f * 3 + 2] = t[2];
  }
}
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'ja_q.bin.gz'), gzipSync(Buffer.from(q.buffer)));
writeFileSync(join(out, 'ja_pel.bin'), Buffer.from(pel.buffer));
writeFileSync(join(out, 'ja_anims.json'), JSON.stringify({ version: 1, source: 'Jedi Academy models/players/_humanoid (local install)', bones: NB, frames, anims }));
console.log('Jedi Academy bank:', anims.length, 'animations,', frames, 'frames ->', out);
