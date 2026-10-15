import test from 'node:test';
import assert from 'node:assert/strict';
import { Game2TeamMatch, TEAM_MODES, spawnNearby } from '../src/components/game2/engine/teamMatch.js';
import { GAME2_ARENA_MAPS } from '../src/components/game2/engine/arenaMaps.js';

function fakeGame() {
  const game = {
    t: 0,
    world: {
      map: null,
      floorAt(_x, _z, _probe) { return 0; },
      collide() {},
      lineOfSight() { return true; },
    },
    playerSpawn: [-12, 0, -20],
    enemySpawn: [12, 0, 20],
    npcs: [],
    hud: { msgs: [], msg(s) { this.msgs.push(s); } },
    readySaber() {},
    addNpc(kind, x, z, cfg) {
      const fighter = {
        kind, ...cfg, pos: [x, 0, z], spawn: [x, 0, z],
        hp: cfg.hp, maxHp: cfg.hp, status: 'normal', deadAt: 0,
        cmd: {}, humId: game.npcs.length + 1, igniteNow() {},
      };
      game.npcs.push(fighter);
      return fighter;
    },
    fighters() { return [this.player, ...this.npcs]; },
    foesOf(f) { return this.fighters().filter(o => o !== f && o.team !== f.team && o.status !== 'dead'); },
    respawnNpc(f) { f.status = 'normal'; f.hp = 100; f.pos = f.spawn.slice(); },
    respawnPlayer() { this.player.status = 'normal'; this.player.hp = 100; this.player.pos = this.playerSpawn.slice(); },
  };
  game.player = {
    isPlayer: true, status: 'normal', hp: 100, maxHp: 100,
    pos: game.playerSpawn.slice(), spawn: game.playerSpawn.slice(), cmd: {},
  };
  return game;
}

test('three map choices reference distinct real BSP files in Drive', () => {
  assert.notEqual(GAME2_ARENA_MAPS.training.driveFileId, GAME2_ARENA_MAPS.hangar.driveFileId);
  assert.equal(GAME2_ARENA_MAPS.training.filename, 'duel_training.bsp');
  assert.equal(GAME2_ARENA_MAPS.hangar.filename, 'duel_hangar.bsp');
  assert.equal(GAME2_ARENA_MAPS.carbon.filename, 'duel_carbon.bsp');
  assert.equal(new Set(Object.values(GAME2_ARENA_MAPS).map(m => m.driveFileId)).size, 3);
});

test('team sizes are 15v15 Capture the Flag and 25v25 (50 fighters) Sudden Death', () => {
  assert.equal(TEAM_MODES.ctf.members, 15);
  assert.equal(TEAM_MODES.sudden.members, 25);
  for (const [mode, n] of [['ctf', 15], ['sudden', 25]]) {
    const game = fakeGame();
    new Game2TeamMatch(game, mode);
    assert.equal(game.fighters().length, n * 2);
    assert.equal(game.fighters().filter(f => f.team === 'blue').length, n);
    assert.equal(game.fighters().filter(f => f.team === 'red').length, n);
  }
});

test('blue flag capture requires blue own flag to be home', () => {
  const game = fakeGame(), match = new Game2TeamMatch(game, 'ctf');
  game.player.pos = match.homes.red.slice();
  match.update(0.016);
  assert.equal(match.flags.red.state, 'carried');
  assert.equal(match.flags.red.carrier, game.player);
  const red = game.npcs.find(f => f.team === 'red');
  red.pos = match.homes.blue.slice();
  match.update(0.016);
  assert.equal(match.flags.blue.state, 'carried');
  game.player.pos = match.homes.blue.slice();
  match.update(0.016);
  assert.equal(match.scores.blue, 0, 'own flag is missing');
  match.onDeath(red);
  red.status = 'dead'; red.hp = 0;
  game.t = 21;
  match.update(0.016);
  assert.equal(match.flags.blue.state, 'base');
  match.update(0.016);
  assert.equal(match.scores.blue, 1, 'the carrier can score after the home flag returns');
});

test('flag drops when carrier dies and auto-returns after 20 seconds', () => {
  const game = fakeGame(), match = new Game2TeamMatch(game, 'ctf');
  game.player.pos = match.homes.red.slice();
  match.update(0);
  assert.equal(match.flags.red.state, 'carried');
  game.player.status = 'dead'; game.player.hp = 0;
  match.onDeath(game.player);
  assert.equal(match.flags.red.state, 'dropped');
  game.t = 21;
  match.update(0);
  assert.equal(match.flags.red.state, 'base');
});

test('Sudden Death ends after final enemy elimination; never respawns', () => {
  const game = fakeGame(), match = new Game2TeamMatch(game, 'sudden');
  game.npcs.filter(f => f.team === 'red').forEach(f => { f.status = 'dead'; f.hp = 0; f.deadAt = 0; });
  game.t = 60;
  match.update(0.016);
  assert.equal(match.ended, true);
  assert.equal(match.winner, 'blue');
  assert.equal(match.config.respawn, null);
  assert.ok(game.npcs.filter(f => f.team === 'red').every(f => f.status === 'dead'));
});

test('spawn probe honors map elevation instead of placing fighters at y=0', () => {
  const world = { floorAt() { return 8; }, collide() {} };
  const pos = spawnNearby(world, [0, 8, 0], 1, 7);
  assert.equal(pos[1], 8);
});
