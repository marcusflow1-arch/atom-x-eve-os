import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const engine = path => import(new URL('src/components/game2/engine/' + path, root));

const { buildLevel } = await engine('level/builder.js');
const { LevelSpace } = await engine('level/space.js');
const { NavGrid } = await engine('level/nav.js');
const { MISSIONS } = await engine('missions/index.js');
const { ARCHETYPES } = await engine('archetypes.js');
const { BRAINS } = await engine('brains/index.js');
const { MissionDirector } = await engine('mission/director.js');

const M = MISSIONS.kejim;
const freshLevel = () => { const level = buildLevel(M.layout); const space = new LevelSpace(level); const nav = new NavGrid(space, level.navBounds, 1); return { level, space, nav }; };

test('Game 2 starts on a menu: Single Player runs the mission, Multiplayer runs the Dark Jedi duel', () => {
  const src = read('src/components/game2/Game2Duel.jsx');
  assert.match(src, /tag: 'Single player'/);
  assert.match(src, /tag: 'Multiplayer', title: 'Dark Jedi Duel'/);
  assert.match(src, /mode: 'mission', mission: 'kejim'/);
  assert.match(src, /choice === 'multi'/);
  assert.match(src, /Main menu/);
  assert.match(src, /\{ map: duel \}/); // the mission does not download the duel arena
});

test("the mission's Reborn is the duel's Reborn value for value", () => {
  const game = read('src/components/game2/engine/game.js');
  const duel = /populateDuel\(\) \{[\s\S]*?addNpc\('darkjedi'[^{]*\{([^}]*)\}\);[\s\S]*?b\.force = new Force\(this, b, \{([^}]*)\}/.exec(game);
  assert.ok(duel, 'populateDuel still spawns its Reborn inline');
  const R = ARCHETYPES.reborn;
  const num = (src, key) => Number(new RegExp(key + ': ([\\d.]+)').exec(src)[1]);
  assert.equal(R.kind, 'darkjedi'); assert.equal(R.label, 'Reborn');
  for (const k of ['hp', 'tintAmt', 'dmgScale', 'blockSkill']) assert.equal(R[k], num(duel[1], k), k);
  for (const k of ['fp', 'regen', 'dmgScale', 'healRate', 'speedGain', 'protectMul']) assert.equal(R.force[k], num(duel[2], k), 'force.' + k);
  assert.match(game, /b\.reaction = 0\.7/); assert.equal(R.reaction, 0.7);
  assert.match(game, /b\.setStyle\(2\)/); assert.equal(R.style, 2);
  assert.equal(BRAINS.darkjedi.name, 'aiDarkJedi', 'missions use the unchanged duel brain');
});

test('combat core is shared, not forked: missions import no saber / Force / fighter code of their own', () => {
  for (const f of ['mission/director.js', 'brains/trooper.js', 'brains/companion.js', 'missions/kejimPost.js', 'level/space.js', 'level/nav.js', 'level/builder.js']) {
    const src = read('src/components/game2/engine/' + f);
    assert.doesNotMatch(src, /from '\.\.\/(saber|forcerules|fighter|force|combat|darkjedi)\.js'/, f);
  }
  const trooper = read('src/components/game2/engine/brains/trooper.js');
  assert.match(trooper, /g\.combat\.shoot\(/, 'troopers fire Game 2 blaster bolts (saber reflection / Absorb apply)');
});

test('Kejim Post builds a closed level whose spawns all stand on walkable ground', () => {
  const { level, space, nav } = freshLevel();
  assert.ok(level.tris.length > 1000 && level.solids.length > 100);
  assert.equal(space.floorAt(...[level.playerSpawn[0], level.playerSpawn[2]], 1), 0.3);
  for (const [id, list] of Object.entries(M.groups)) for (const e of list) {
    assert.ok(ARCHETYPES[e.a], 'archetype ' + e.a);
    const k = nav.nearest(e.at, 0.6); assert.ok(k >= 0 && Math.abs(nav.y[k] - e.at[1]) < 0.3, `${id} spawn ${e.at} is walkable`);
  }
  for (const it of space.interactables.values()) assert.ok(nav.nearest(it.p, 1.5) >= 0, it.id);
});

test('navigation routes around walls, follows the doors and keeps ledge snipers on their ledge', () => {
  const { space, nav } = freshLevel();
  const court = [0, 0, -2], term = space.interactables.get('comm_terminal').p, hangar = [45, 0, -8];
  assert.ok(nav.findPath([0, 0.3, -61], [0, 0, -30]), 'pad to canyon');
  assert.ok(nav.findPath(court, [25, 2.4, 11]), 'up the ramp to the watch platform');
  assert.equal(nav.findPath(court, term), null, 'blast door closed');
  space.snapDoor('blast', true); assert.ok(nav.findPath(court, term), 'blast door open');
  assert.equal(nav.findPath(court, hangar), null, 'hangar closed');
  space.snapDoor('hangar_door', true); assert.ok(nav.findPath(court, hangar), 'hangar open');
  assert.equal(nav.findPath([0, 0, -30], [5, 2.6, -38.5]), null, 'canyon ledge is not walkable from the floor');
});

test('walls and closed doors block sight, bolts and the camera', () => {
  const { space } = freshLevel();
  assert.ok(space.lineOfSight([0, 1.5, -10], [0, 1.5, 10]), 'open courtyard');
  assert.equal(space.lineOfSight([1.5, 1.5, 10], [1.5, 1.5, 28]), false, 'closed blast door');
  space.snapDoor('blast', true); assert.ok(space.lineOfSight([1.5, 1.5, 10], [1.5, 1.5, 28]), 'open blast door');
  assert.equal(space.lineOfSight([-10, 1.5, 0], [-28, 1.5, 4]), false, 'guard post wall');
  const eye = space.cameraClip([0, 1.6, 26], [8, 4, 40]); assert.ok(eye[2] < 32, 'camera pulled in front of the lobby wall');
  const p = [-27, 0, 0]; space.collide(p, 0.42); assert.deepEqual(p, [-27, 0, 0], 'standing in the guard post is fine');
  const q = [0, 0, 21]; space.snapDoor('blast', false); space.collide(q, 0.42); assert.ok(q[2] < 20.4 || q[2] > 21.6, 'closed door pushes people out');
});

// ---------- headless run of the whole mission through the real director
function stubGame() {
  const { level, space, nav } = freshLevel();
  const g = {
    t: 0, npcs: [], arcs: [], round: null,
    world: { level, space, nav, resetProps() {} },
    combat: { kills: 0, reflected: 0, bolts: [] },
    hud: { msgs: [], msg(t) { this.msgs.push(t); } }, banners: [], banner(t) { g.banners.push(t); },
    sfxAt() {},
    player: { isPlayer: true, pos: level.playerSpawn.slice(), status: 'normal', hp: 100, saber: { holstered: true } },
    spawnArchetype(id, at, yaw, extra) { const A = ARCHETYPES[id]; const f = { name: extra.name, kind: A.kind, team: A.team, hp: A.hp, pos: at.slice(), status: 'normal', lastHurt: -9, yaw, ai: null, revive(p) { this.status = 'normal'; this.pos = p.slice(); } }; g.npcs.push(f); return f; },
    removeNpc(f) { g.npcs.splice(g.npcs.indexOf(f), 1); },
    respawnPlayerAt(p) { g.player.pos = p.slice(); g.player.status = 'normal'; g.player.hp = 100; },
  };
  return g;
}
const keys = (...k) => ({ pressed: c => k.includes(c) });
const step = (d, g, sec = 0.1) => { g.t += sec; d.update(sec); };
const goTo = (g, p) => { g.player.pos = p.slice(); };
const kill = (g, group) => { for (const n of g.npcs) if (n.group === group) n.status = 'dead'; };

test('Kejim Post plays start to finish: zones, cleared groups, console, timed download with waves, boss, extraction', () => {
  const g = stubGame(); const d = new MissionDirector(g, M); const S = g.world.space;
  assert.equal(g.round.state, 'fight', 'the duel brain is allowed to fight');
  assert.ok(g.npcs.some(n => n.name === 'companion'), 'Jan joins');
  assert.equal(d.objective.id, 'canyon'); assert.ok(g.npcs.some(n => n.group === 'canyon'));
  goTo(g, [0, 0, -30]); step(d, g); assert.equal(d.objective.id, 'courtyard');
  kill(g, 'courtyard'); step(d, g); assert.equal(d.objective.id, 'console');
  goTo(g, [-29.6, 0, 0.5]); assert.equal(d.usable()?.id, 'guard_console'); d.frameInput(keys('KeyE')); step(d, g);
  assert.equal(d.objective.id, 'logs'); assert.equal(S.doors.get('blast').want, true);
  goTo(g, [0, 0, 57.5]); d.frameInput(keys('KeyE')); assert.ok(d.hold.started);
  for (let i = 0; i < 40; i++) step(d, g, 0.1); // 4 s: first wave
  assert.ok(g.npcs.some(n => n.group === 'wave1')); assert.equal(S.doors.get('west_closet').want, true);
  goTo(g, [0, 0, 30]); const before = d.hold.t; step(d, g, 1); assert.equal(d.hold.t, before, 'progress pauses away from the terminal');
  goTo(g, [0, 0, 57.5]); for (let i = 0; i < 200; i++) step(d, g, 0.1);
  assert.ok(g.npcs.some(n => n.group === 'wave2')); assert.equal(d.objective.id, 'hangar'); assert.equal(S.doors.get('hangar_door').want, true);
  goTo(g, [44, 0, -8]); step(d, g); assert.equal(d.objective.id, 'reborn'); assert.equal(S.doors.get('hangar_door').want, false, 'locked in with the Reborn');
  assert.equal(d.boss?.kind, 'darkjedi');
  kill(g, 'reborn'); step(d, g); assert.equal(d.objective.id, 'extract'); assert.ok(g.npcs.some(n => n.group === 'ambush'));
  goTo(g, [0, 0.3, -60]); step(d, g); assert.equal(d.state, 'complete');
});

test('dying restarts the checkpoint: later enemies vanish, its own enemies and doors come back, earlier progress stays', () => {
  const g = stubGame(); const d = new MissionDirector(g, M); const S = g.world.space;
  goTo(g, [0, 0, -30]); step(d, g); kill(g, 'courtyard'); step(d, g);
  goTo(g, [-29.6, 0, 0.5]); d.frameInput(keys('KeyE')); step(d, g);
  goTo(g, [0, 0, 57.5]); d.frameInput(keys('KeyE')); for (let i = 0; i < 40; i++) step(d, g, 0.1);
  assert.ok(g.npcs.some(n => n.group === 'wave1'));
  kill(g, 'lobby');
  g.player.status = 'dead'; d.onDeath(g.player); step(d, g, 0.5); assert.equal(d.frameInput(keys('Enter')), true); assert.equal(g.player.status, 'dead', 'too early');
  step(d, g, 0.6); d.frameInput(keys('Enter'));
  assert.equal(g.player.status, 'normal'); assert.deepEqual(g.player.pos, M.objectives[3].checkpoint.pos);
  assert.equal(d.objective.id, 'logs'); assert.equal(d.hold.started, false); assert.equal(d.hold.t, 0);
  assert.equal(g.npcs.filter(n => n.group === 'wave1').length, 0, 'the wave is gone');
  assert.equal(g.npcs.filter(n => n.group === 'lobby' && n.status !== 'dead').length, 3, 'the checkpoint enemies are back');
  assert.equal(S.doors.get('west_closet').want, false); assert.equal(S.doors.get('blast').want, true, 'earlier doors stay open');
  assert.equal(d.stats.deaths, 1);
});
