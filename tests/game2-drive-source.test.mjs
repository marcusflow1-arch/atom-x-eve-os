import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  SOURCE_FOLDER_ID, PUBLIC_GAME2_FOLDER_ID, CHUNKED_ASSETS,
  safeName, splitPaths, md5,
} from '../tools/game2/drive-source-sync.mjs';

const root = new URL('../', import.meta.url);
const source = p => readFileSync(new URL(p, root), 'utf8');

test('sync targets the exact user-provided October 8 Game Two Google Drive package', () => {
  assert.equal(SOURCE_FOLDER_ID, '1Ug-lWjnJBFI9tq51kjTn6Q04r5f_V_sG');
  assert.equal(PUBLIC_GAME2_FOLDER_ID, '15PAB_alifRzJjo4HulGP-0QSdEEU9POH');
});

test('existing character rig and saber move data are byte-for-byte the Drive version', () => {
  // These Git blob hashes were cross-checked against the actual files in
  // the user-provided Drive package on October 11, 2026.
  const driveGitBlobs = {
    'public/game2/rig.json': '9bcf68667017c9427f2b168a2e48e86be7926266',
    'public/game2/sabermoves.json': 'c6ec01838f579fc59270f8995fc41b153d466145',
  };
  for (const [filename, expected] of Object.entries(driveGitBlobs)) {
    const data = readFileSync(new URL(filename, root));
    const sha = createHash('sha1').update('blob ' + data.length + '\0').update(data).digest('hex');
    assert.equal(sha, expected, filename);
  }
});

test('Drive filenames are sanitized and matching binary chunks are recognized', () => {
  assert.equal(safeName('saberon.mp3'), true);
  for (const name of ['../escape', 'bad\\name', '..', '.git', 'bad/thing', '']) {
    assert.equal(safeName(name), false, name);
  }
  assert.equal(CHUNKED_ASSETS['Explorer_G2_Game.glb'], 19);
  assert.equal(CHUNKED_ASSETS['bank_q.bin.gz'], 5);
  assert.equal(splitPaths('Explorer_G2_Game.glb').length, 19);
  assert.equal(splitPaths('bank_q.bin.gz').length, 5);
  assert.equal(splitPaths('rig.json').length, 0);
  assert.equal(md5(Buffer.from('data')), '8d777f385d3dfec8815d20f7496026dc');
});

test('Game Two loader rejects HTML and corrupt JSON rather than accepting a missing asset', () => {
  const assets = source('src/components/game2/engine/assets.js');
  assert.match(assets, /export async function fetchGame2Json/);
  assert.match(assets, /content-type/);
  assert.match(assets, /required asset has invalid JSON/);
  assert.match(assets, /fetchGame2Json\(base, 'rig\.json'\)/);
  assert.match(assets, /fetchGame2Json\(base, 'sabermoves\.json'\)/);
  const code = source('tools/game2/drive-source-sync.mjs');
  assert.doesNotMatch(code, /deleteFile|unlinkSync|writeFileSync/);
  assert.match(code, /if \(existsSync\(target\)\) return false/);
});

test('sync help works without credentials or side effects', () => {
  const entry = fileURLToPath(new URL('../tools/game2/drive-source-sync.mjs', import.meta.url));
  const r = spawnSync(process.execPath, [entry, '--help'], { encoding: 'utf8', env: { PATH: process.env.PATH || '' } });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /--sync-missing/);
});
