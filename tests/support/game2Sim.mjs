// Headless Game 2 for behaviour tests: the real Game, Fighter, Force, Combat and saber code on the real Jedi Outcast
// skeleton and animation bank, with WebGL, audio and the DOM stubbed out. The procedural explorer arena (flat floor at
// y = 0, radius 23.5 m, kill height -20 m) unless `world` overrides floorAt / collide / killY.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { Skeleton } from '../../src/components/game2/engine/actor.js';
import { Game } from '../../src/components/game2/engine/game.js';
import { Force, SELECT_ORDER } from '../../src/components/game2/engine/force.js';

const root = new URL('../../', import.meta.url);
const read = p => readFileSync(new URL(p, root));
let skel = null, saberData = null;
function assets() {
  if (!skel) {
    const rig = JSON.parse(read('public/game2/rig.json'));
    const gz = Buffer.concat([0, 1, 2, 3, 4].map(i => read(`public/game2/parts/bank_q.bin.gz.00${i}`)));
    const q = new Int16Array(new Uint8Array(gunzipSync(gz)).buffer), pel = new Float32Array(new Uint8Array(read('public/game2/bank_pel.bin')).buffer);
    skel = new Skeleton(rig, q, pel, null); saberData = JSON.parse(read('public/game2/sabermoves.json'));
  }
  const ident = { t: [0, 0, 0], q: [0, 0, 0, 1], s: [1, 1, 1] };
  return { skel, saberData, body: {}, hilt: {}, lod: null, duelMap: null, attach: { holster: { ...ident, bone: 'rfemurYZ' }, grip: { ...ident, bone: 'rhand' }, hiltLen: 0.27 } };
}

function stubDom() {
  if (!globalThis.window) globalThis.window = new EventTarget();
  if (!globalThis.document) globalThis.document = Object.assign(new EventTarget(), { pointerLockElement: null, exitPointerLock() {} });
}
const ctx2d = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {} })), set: (t, k, v) => { t[k] = v; return true; } });
const canvas = () => Object.assign(new EventTarget(), { focus() {}, requestPointerLock() {}, getContext: () => ctx2d, clientWidth: 1280, clientHeight: 720, width: 1280, height: 720, style: {} });
const renderer = () => ({ uploadSkinned: () => ({}), uploadStatic: () => ({}), lights: [0, 1, 2, 3].map(() => ({ p: [0, 0, 0], r: 0, c: [0, 0, 0] })), env: { sunDir: [0, 1, 0], sunCol: [1, 1, 1], ambTop: [1, 1, 1], ambBot: [1, 1, 1], fogCol: [0, 0, 0], fogD: 0 } });

// make a game; o.world: { floorAt, collide, killY } overrides; the explorer's own NPCs and practice remote are removed
export function makeGame(o = {}) {
  stubDom();
  const g = new Game(renderer(), assets(), canvas(), canvas(), { mode: 'explorer', ...(o.opts || {}) });
  for (const n of g.npcs.slice()) g.removeNpc(n);
  g.combat.remote = null; g.world.bodies.length = 0; g.hud.help = false; g.started = true; // no practice remote or crates
  if (o.world) Object.assign(g.world, o.world);
  g.player.pos = [0, 0, 0]; g.player.yaw = g.player.targetYaw = 0; g.cam.yaw = 0; g.cam.pitch = 0;
  return g;
}

// a skirmish match (engine/teamMatch.js: 'ffa' | 'tdm' | 'ctf' | 'sudden') on an authored arena, bots and level included
export function makeMatch(mode, mapId = 'skybridge', o = {}) {
  stubDom();
  const g = new Game(renderer(), assets(), canvas(), canvas(), { mode, mapId, ...(o.opts || {}) });
  g.hud.help = false; g.started = true;
  return g;
}

// a Reborn-like opponent with its own Force (no brain unless brain: true)
export function addFoe(g, pos = [0, 0, 4], o = {}) {
  const f = g.addNpc(o.kind || 'darkjedi', pos[0], pos[2], { name: o.name || 'foe' + g.npcs.length, label: 'Foe', team: 'enemy', hp: o.hp ?? 200, saber: true, blade: [1, 0.1, 0.1], yaw: Math.PI, dmgScale: 0.6, blockSkill: 0 });
  f.pos[1] = pos[1]; f.maxHp = o.hp ?? 200; f.hp = f.maxHp; f.reaction = o.reaction ?? 0; f.spawn = pos.slice();
  f.force = new Force(g, f, { npc: true, fp: 100, list: SELECT_ORDER });
  if (!o.brain) f.kind = 'dummy'; // no BRAINS entry: it stands still unless the test drives it
  return f;
}

// run n fixed 60 Hz steps; input(i) may set held keys / presses for step i: { held: Set, pressed: Set, alt, attack }
export function run(g, n, input) {
  for (let i = 0; i < n; i++) {
    const k = input ? input(i) || {} : {};
    g.input.down = k.held || new Set(); g.stepPresses = new Set(k.pressed || []); g.input.btn = [!!k.attack, false, !!k.alt];
    g.firstSub = true; g.step(1 / 60);
  }
}
