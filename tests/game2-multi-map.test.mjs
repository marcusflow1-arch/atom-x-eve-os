import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { GAME2_ARENA_MAPS } from '../src/components/game2/engine/arenaMaps.js';
import { parseRBSP, BSPCollision } from '../src/components/game2/engine/rbsp.js';

const lengths = {
  training: 905388,
  hangar: 702604,
  carbon: 910684,
};

const maps = Object.values(GAME2_ARENA_MAPS).map(record => {
  const url = new URL('../public/game2/maps/' + record.filename, import.meta.url);
  const buf = readFileSync(url);
  const bsp = parseRBSP(buf, { source: record.filename, name: record.label });
  return { record, bsp, buf, url };
});

test('all three SELECTABLE game modes load actual, different Drive BSP binaries', () => {
  const sha = [];
  for (const { record, bsp, buf, url } of maps) {
    assert.equal(statSync(url).size, lengths[record.id], 'real binary size for ' + record.id);
    assert.equal(buf.toString('ascii', 0, 4), 'RBSP');
    assert.equal(buf.readInt32LE(4), 1);
    assert.equal(bsp.source, record.filename);
    assert.equal(bsp.name, record.label);
    assert.ok(bsp.originalSurfaceCount > 80, record.filename + ' geometry present');
    assert.ok(bsp.spawns.filter(p => p.kind === 'info_player_deathmatch').length >= 2);
    assert.ok(bsp.tris.length > 150, record.filename + ' has collision triangles');
    sha.push(createHash('sha256').update(buf).digest('hex'));
  }
  assert.equal(new Set(sha).size, 3, 'the buttons do not secretly load the same map');
});

test('Hangar and Carbon use their own original world geometry and local map coordinates', () => {
  for (const { record, bsp } of maps.filter(m => m.record.id !== 'training')) {
    const collide = new BSPCollision(bsp);
    assert.ok(bsp.tris.every(t => [t.a, t.b, t.c].every(v => v.every(Number.isFinite))), record.id);
    const span = bsp.spawns.map(s => Math.hypot(s.pos[0], s.pos[2]));
    assert.ok(Math.max(...span) < 250, record.id + ' spawns are near the selected map origin');
    assert.ok(collide.floors.size > 10);
    assert.ok(collide.walls.size > 10);
    const spawn = collide.chooseSpawns();
    assert.ok(spawn.player && spawn.enemy);
    assert.ok(Math.hypot(spawn.player[0]-spawn.enemy[0], spawn.player[2]-spawn.enemy[2]) > 2.5);
  }
});
