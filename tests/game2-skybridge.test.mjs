// Skybridge Citadel (engine/levels/skybridge.js) and the skirmish modes on it: energy bridges that consoles cut, fall
// deaths credited to whoever cut the power, Free for All and Team Deathmatch scoring, and bots that keep off ledges.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from '../src/components/game2/engine/level/builder.js';
import { LevelSpace, BRIDGE_WARN, BRIDGE_DOWN } from '../src/components/game2/engine/level/space.js';
import { NavGrid } from '../src/components/game2/engine/level/nav.js';
import { SKYBRIDGE, SKYBRIDGE_KILL_Y } from '../src/components/game2/engine/levels/skybridge.js';
import { GAME2_AUTHORED_MAPS } from '../src/components/game2/engine/arenaMaps.js';
import { AUTHORED_LEVELS } from '../src/components/game2/engine/levels/index.js';
import { TEAM_MODES } from '../src/components/game2/engine/teamMatch.js';
import { hostile } from '../src/components/game2/engine/combat.js';
import { makeMatch, run } from './support/game2Sim.mjs';

const level = () => buildLevel(SKYBRIDGE.layout);
const near = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

test('every authored map in the menu has a level, and the modes are 7v7 CTF, 8v8 Sudden Death, 6v6 TDM to 30 and an 8-fighter FFA to 15', () => {
  for (const id of Object.keys(GAME2_AUTHORED_MAPS)) assert.ok(AUTHORED_LEVELS[id], id);
  assert.deepEqual([TEAM_MODES.tdm.members, TEAM_MODES.tdm.killTarget, TEAM_MODES.ffa.members, TEAM_MODES.ffa.fragTarget], [6, 30, 8, 15]);
  assert.equal(TEAM_MODES.ctf.members, 7); assert.equal(TEAM_MODES.sudden.respawn, null);
});

test('Skybridge: no floor over the chasm; an energy bridge carries you until its console cuts it, flickers, drops, then reforms', () => {
  const L = level(), S = new LevelSpace(L);
  assert.equal(L.killY, SKYBRIDGE_KILL_Y);
  assert.equal(S.floorAt(-50, 0, 1), 0, 'blue fortress');
  assert.equal(S.floorAt(50, 5, 1), 0, 'red fortress');
  assert.equal(S.floorAt(5, 5, 1), 0, 'centre island');
  assert.equal(S.floorAt(-25, 8, 1), null, 'chasm');
  assert.equal(S.floorAt(-35.8, 8, 1), null, 'the platform edge is exact (no floor just past it)');
  assert.equal(S.floorAt(-25, 0, 1), 0, 'stone bridge');
  assert.equal(S.floorAt(-25, 12.75, 1), 0, 'energy bridge');
  const consoles = [...S.interactables.values()].filter(i => i.bridge);
  assert.equal(consoles.length, 8, 'a console at each end of the four energy bridges');
  for (const c of consoles) assert.equal(S.floorAt(c.p[0], c.p[2], 1, false), 0, c.id + ' stands on solid ground');
  assert.equal(S.dropBridge('wn'), true);
  assert.equal(S.dropBridge('wn'), false, 'already going down');
  S.update(BRIDGE_WARN / 2); assert.equal(S.floorAt(-25, 12.75, 1), 0, 'still carries you while it flickers');
  S.update(BRIDGE_WARN); assert.equal(S.bridges.get('wn').state, 'off'); assert.equal(S.floorAt(-25, 12.75, 1), null);
  assert.equal(S.floorAt(-25, -12.75, 1), 0, 'the other bridges stay up');
  S.update(BRIDGE_DOWN + 0.1); assert.equal(S.bridges.get('wn').state, 'on'); assert.equal(S.floorAt(-25, 12.75, 1), 0, 'reformed');
});

test('Skybridge navigation: across an energy bridge while it is up, over the stone bridge while it is down; never over the void or along an edge', () => {
  const L = level(), S = new LevelSpace(L), N = new NavGrid(S, L.navBounds, 1);
  const check = (a, b) => {
    const p = N.findPath(a, b, 9000); assert.ok(p && p.length, 'a route'); let prev = a;
    for (const q of p) { for (let s = 0; s <= 24; s++) { const x = prev[0] + (q[0] - prev[0]) * s / 24, z = prev[2] + (q[2] - prev[2]) * s / 24; assert.notEqual(S.floorAt(x, z, 1), null, 'floor under ' + x.toFixed(1) + ',' + z.toFixed(1)); for (const [ox, oz] of [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) assert.notEqual(S.floorAt(x + ox, z + oz, 1), null, 'half a metre from an edge at ' + x.toFixed(1) + ',' + z.toFixed(1)); } prev = q; }
    return p;
  };
  const up = check([-45, 0, 20], [0, 0, 13]);
  assert.ok(up.some(q => q[0] > -36 && q[0] < -14 && q[2] > 11) || up.every(q => q[2] > 8), 'the north energy bridge is the short way');
  for (const id of ['wn', 'ws', 'en', 'es']) S.dropBridge(id); S.update(BRIDGE_WARN + 0.01);
  const down = check([-45, 0, 20], [0, 0, 13]);
  assert.ok(down.some(q => Math.abs(q[2]) < 2 && q[0] > -36 && q[0] < -14), 'detours over the stone bridge');
  check([-55, 0.3, 0], [55, 0.3, 0]);
});

test('Free for All on Skybridge: you and seven rivals, all on solid floor and hostile to each other; Team Deathmatch is 6v6 at the team homes', () => {
  const g = makeMatch('ffa');
  assert.equal(g.arenaDef.label, 'Skybridge Citadel'); assert.equal(g.world.killY, SKYBRIDGE_KILL_Y);
  const all = g.fighters(); assert.equal(all.length, 8);
  for (const f of all) { assert.equal(f.team, 'ffa'); assert.notEqual(g.world.floorAt(f.pos[0], f.pos[2], f.pos[1] + 0.5), null, f.name + ' on a floor'); assert.ok(f.force, f.name + ' has Force'); }
  for (const a of all) for (const b of all) if (a !== b) assert.ok(hostile(a, b));
  const t = makeMatch('tdm'), M = t.teamMatch;
  assert.equal(t.fighters().filter(f => f.team === 'blue').length, 6); assert.equal(t.fighters().filter(f => f.team === 'red').length, 6);
  for (const f of t.fighters()) assert.ok(near(f.pos, M.homes[f.team]) < 7, f.name + ' starts at the ' + f.team + ' home');
  assert.ok(Math.abs(t.player.yaw - Math.PI / 2) < 1e-6, 'Blue faces the enemy across the chasm');
});

test('cutting a bridge drops whoever is on it to their death, credited to the one at the console', () => {
  const g = makeMatch('tdm'), M = g.teamMatch, P = g.player, S = g.world.space; g.aiOff = true;
  const con = S.interactables.get('console_wn_a'); P.pos = con.p.slice();
  const red = g.npcs.find(n => n.team === 'red'); red.pos = [-25, 0, 12.75];
  run(g, 1, () => ({ pressed: ['KeyE'] }));
  assert.equal(S.bridges.get('wn').state, 'warn');
  assert.equal(S.bridges.get('wn').cutBy, P);
  run(g, 150);
  assert.equal(red.status, 'dead'); assert.ok(red.fellOut, 'a fall'); assert.equal(red.killedBy, P);
  assert.equal(M.scores.blue, 1, 'Team Deathmatch scores the fall for Blue');
  assert.ok(red.pos[1] < SKYBRIDGE_KILL_Y, 'the body keeps falling out of sight');
  assert.equal(P.status, 'normal', 'the player at the console is safe');
});

test('a bot at a console cuts the bridge when an enemy is on it (and not when a friend is)', () => {
  const g = makeMatch('tdm'), S = g.world.space; g.aiOff = true;
  const blue = g.npcs.find(n => n.team === 'blue'), red = g.npcs.find(n => n.team === 'red'), red2 = g.npcs.filter(n => n.team === 'red')[1];
  blue.pos = S.interactables.get('console_ws_b').p.slice();
  red.pos = [-25, 0, -12.75]; red2.pos = S.interactables.get('console_es_b').p.slice();
  run(g, 18); assert.equal(S.bridges.get('ws').state, 'on', 'a short reaction first');
  run(g, 60); assert.notEqual(S.bridges.get('ws').state, 'on', 'Blue cut the south-west bridge under Red');
  assert.equal(S.bridges.get('ws').cutBy, blue);
  const g2 = makeMatch('tdm'), S2 = g2.world.space; g2.aiOff = true;
  const b = g2.npcs.filter(n => n.team === 'blue'); b[0].pos = S2.interactables.get('console_ws_b').p.slice(); b[1].pos = [-25, 0, -12.75];
  g2.npcs.find(n => n.team === 'red').pos = [-27, 0, -12.75];
  run(g2, 120); assert.equal(S2.bridges.get('ws').state, 'on', 'never under a teammate');
});

test('Free for All: defeats count per fighter, the first to 15 wins; you respawn after 3 s, shielded', () => {
  const g = makeMatch('ffa'), M = g.teamMatch, P = g.player, rival = g.npcs[0]; g.aiOff = true;
  for (let i = 0; i < 14; i++) M.onDeath({ killedBy: rival, team: 'ffa' });
  assert.equal(M.kills.get(rival), 14); assert.equal(M.ended, false);
  P.hurt(999, rival); assert.equal(P.status, 'dead');
  assert.equal(M.kills.get(rival), 15); assert.equal(M.ended, true); assert.equal(M.winnerFighter, rival);
  const g2 = makeMatch('ffa'), P2 = g2.player; g2.aiOff = true;
  P2.hurt(999, g2.npcs[0]); run(g2, 170); assert.equal(P2.status, 'dead', 'still down at 2.8 s');
  run(g2, 20); assert.equal(P2.status, 'normal', 'back at 3 s'); assert.ok(P2.spawnShield > g2.t, 'with respawn immunity');
  assert.notEqual(g2.world.floorAt(P2.pos[0], P2.pos[2], P2.pos[1] + 0.5), null);
  assert.equal(g2.teamMatch.kills.get(g2.npcs[0]), 1);
});

test('a bot chasing someone across the chasm goes round over a bridge instead of walking off the edge', () => {
  const g = makeMatch('tdm'), P = g.player, S = g.world.space;
  for (const n of g.npcs.slice()) if (n.name !== 'red_bot_1') g.removeNpc(n);
  const bot = g.npcs[0]; bot.pos = [-11, 0, 8]; bot.yaw = bot.targetYaw = -Math.PI / 2;
  for (const id of ['wn', 'ws']) S.dropBridge(id);
  P.pos = [-41, 0, 8]; P.takeMul = 0; let closest = Infinity;
  for (let i = 0; i < 60; i++) { run(g, 15); closest = Math.min(closest, near(bot.pos, P.pos)); assert.ok(!bot.fellOut && bot.status !== 'dead', 'the bot fell at step ' + i * 15); }
  assert.ok(closest < 3.5, 'the bot reached the player (closest ' + closest.toFixed(1) + ' m)');
});
