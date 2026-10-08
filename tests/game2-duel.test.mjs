import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const exists = path => existsSync(new URL(path, root));

test('Game 2 page mounts the Dark Jedi duel and keeps the way back to Luna', () => {
  const page = read('src/pages/Game2.jsx');
  assert.match(page, /import Game2Duel from '@\/components\/game2\/Game2Duel'/);
  assert.match(page, /<Game2Duel \/>/);
  assert.match(page, /<section className="relative min-h-0 flex-1">/);
  assert.match(page, /createPageUrl\('LunaTemplate'\)/);
  assert.match(page, /Back to Luna/);
});

test('the Moon dashboard Game 2 button still opens the Game2 page', () => {
  const layout = read('src/Layout.jsx');
  assert.match(layout, /navigate\(createPageUrl\('Game2'\)\)/);
  assert.match(layout, /Dark Jedi duel/);
});

test('the old Y Bot viewer has been removed', () => {
  assert.equal(exists('src/components/jedioutcast/game2'), false);
  assert.doesNotMatch(read('src/pages/Game2.jsx'), /Game2ThreeViewer|jedioutcast\/game2/);
});

test('wrapper loads the engine lazily, uses fresh canvases and releases everything on unmount', () => {
  const src = read('src/components/game2/Game2Duel.jsx');
  assert.match(src, /import\('\.\/engine\/game\.js'\)/);
  assert.match(src, /mode: 'duel'/);
  assert.match(src, /document\.createElement\('canvas'\)/);
  assert.match(src, /cancelAnimationFrame\(raf\)/);
  assert.match(src, /game\.dispose\(\)/);
  assert.match(src, /WEBGL_lose_context/);
});

test('every asset the engine loads is shipped under public/game2', () => {
  for (const f of ['rig.json', 'bank_pel.bin', 'sabermoves.json']) assert.ok(exists('public/game2/' + f), f);
  for (const [f, n, expectedSha] of [
    ['Explorer_G2_Game.glb', 19, '7b3b28d2a4cfa9883cbc8f8fa817a7d8508328b82764c1934d8b6f1a4513f5fe'],
    ['bank_q.bin.gz', 5, 'fd4096afe7cb019ecb3bd3b6ab201ece8bc320cf0e5b9a3edc5708c3b92957d7'],
  ]) {
    const complete = exists('public/game2/' + f);
    const parts = Array.from({ length: n }, (_, i) => `public/game2/parts/${f}.${String(i).padStart(3, '0')}`);
    assert.ok(complete || parts.every(exists), `missing asset ${f} or one of its ${n} binary chunks`);
    const hash = createHash('sha256');
    for (const path of complete ? [`public/game2/${f}`] : parts) hash.update(readFileSync(new URL(path, root)));
    assert.equal(hash.digest('hex'), expectedSha, `corrupted Game 2 binary ${f}`);
  }
  const audio = read('src/components/game2/engine/audio.js');
  const files = [...audio.matchAll(/'((?:saber|force)\/[a-z0-9_]+\.(?:mp3|wav))'/g)].map(m => m[1]);
  assert.ok(files.length > 50);
  for (const f of files) assert.ok(exists('public/game2/sfx/' + f), 'missing sfx ' + f);
  const assets = read('src/components/game2/engine/assets.js');
  for (const f of ['rig.json', 'bank_q.bin.gz', 'bank_pel.bin', 'Explorer_G2_Game.glb', 'sabermoves.json']) assert.ok(assets.includes(f), f);
});

test('the dark Jedi uses the same Force class as the player (same powers, costs and rules)', () => {
  const game = read('src/components/game2/engine/game.js');
  assert.match(game, /b\.force = new Force\(this, b, \{ npc: true/);
  assert.match(game, /this\.force = new Force\(this, this\.player/);
  const ai = read('src/components/game2/engine/darkjedi.js');
  for (const id of ['push', 'pull', 'grip', 'lightning', 'heal', 'rage', 'protect', 'absorb', 'speed']) assert.match(ai, new RegExp("cast\\('" + id + "'\\)"), id);
  const force = read('src/components/game2/engine/force.js');
  for (const fn of ['do_push', 'do_pull', 'do_grip', 'do_lightning', 'do_heal', 'do_absorb', 'do_protect', 'do_rage', 'do_speed', 'do_mind', 'do_drain']) assert.match(force, new RegExp(fn + '\\(\\)'), fn);
});

test('push and pull outcomes come from the shared rules, not ad-hoc damage in the cast code', () => {
  const force = read('src/components/game2/engine/force.js');
  assert.match(force, /g\.applyThrow\(this, t\.ref, false/);
  assert.match(force, /g\.applyThrow\(this, t\.ref, true/);
  const game = read('src/components/game2/engine/game.js');
  assert.match(game, /resolveThrow\(\{ attackerLevel: F\.lv\[kind\]/);
  assert.match(force, /gripBlocker\(/);
  assert.match(force, /gripPhase\(/);
  assert.match(force, /lightningMul\(/);
});

test('the Force power selector cycles with the wheel and brackets and uses the selection with Z / middle mouse', () => {
  const force = read('src/components/game2/engine/force.js');
  assert.match(force, /select\(d\)/);
  assert.match(force, /input\.pressed\('KeyZ'\) \|\| input\.pressed\('Mouse1'\)/);
  const game = read('src/components/game2/engine/game.js');
  assert.match(game, /BracketRight/);
  assert.match(game, /BracketLeft/);
  assert.match(game, /force\.select\(Math\.max\(-3, Math\.min\(3, i\.wheel\)\)\)/);
  const hud = read('src/components/game2/engine/hud.js');
  assert.match(hud, /Z \/ middle mouse = use/);
  assert.match(hud, /HEALTH /);
  assert.match(hud, /FORCE /);
});

test('input listeners are removable and never swallow typing in text fields', () => {
  const input = read('src/components/game2/engine/input.js');
  assert.match(input, /dispose\(\)/);
  assert.match(input, /removeEventListener/);
  assert.match(input, /INPUT\|TEXTAREA\|SELECT/);
});

test('engine folder is plain ES modules without eval or network calls beyond its own assets', () => {
  const dir = new URL('src/components/game2/engine/', root);
  for (const f of readdirSync(dir)) {
    const src = readFileSync(new URL(f, dir), 'utf8');
    assert.doesNotMatch(src, /\beval\(|new Function\(|XMLHttpRequest|https?:\/\//, f);
  }
});
