import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { parseRBSP, BSPCollision } from '../src/components/game2/engine/rbsp.js';
import { World } from '../src/components/game2/engine/world.js';

const source = 'public/game2/maps/duel_training.bsp';
const raw = readFileSync(new URL('../'+source, import.meta.url));
const map = parseRBSP(raw);

test('an original Google Drive RBSP map, not a procedural stand-in, is present and decodable', () => {
  assert.equal(raw.subarray(0,4).toString(), 'RBSP');
  assert.equal(statSync(new URL('../'+source, import.meta.url)).size, 905388);
  assert.equal(map.source, 'duel_training.bsp');
  assert.equal(map.name, 'Lightsaber Training');
  assert.ok(map.originalSurfaceCount > 500);
  assert.ok(map.tris.length > 1400);
  assert.ok(map.mesh.idx.length > 5000);
  assert.equal(map.mesh.pos.length, map.mesh.nrm.length);
  assert.equal(map.mesh.col.length, map.mesh.pos.length/3*4);
});

test('corrupt or fake level files are not silently replaced by old procedural world', () => {
  assert.throws(() => parseRBSP(new Uint8Array(905388)), /invalid Raven RBSP/);
  const copy=Buffer.from(raw);copy.writeUInt32LE(0xffffff00,8+13*8);
  assert.throws(() => parseRBSP(copy), /corrupt BSP lump/);
});

test('map contains authentic spawn entities, floors and walls used by the duel', () => {
  const collision = new BSPCollision(map);
  assert.ok(map.spawns.filter(s=>s.kind==='info_player_deathmatch').length >= 3);
  assert.ok(collision.floors.size > 50 && collision.walls.size > 50);
  const chosen = collision.chooseSpawns();
  assert.ok(chosen.player && chosen.enemy);
  assert.ok(Math.hypot(chosen.player[0]-chosen.enemy[0], chosen.player[2]-chosen.enemy[2]) > 3);
  for(const p of [chosen.player,chosen.enemy]){
    assert.ok(Math.abs(collision.floorAt(p[0],p[2],p[1]+0.3)-p[1]) < 0.15);
    const clone=p.slice();collision.collide(clone,0.45);
    assert.ok(Math.hypot(p[0]-clone[0],p[2]-clone[2]) < 0.1);
  }
  assert.equal(collision.floorAt(600,600), null);
});

test('Game 2 uses imported mesh while leaving Game 1 and legacy explorer alone', () => {
  const uploaded=[];
  const renderer={uploadStatic:mesh=>{uploaded.push(mesh);return mesh;},drawMesh(){}};
  const world = new World(renderer,map);
  assert.equal(uploaded.length,map.texturedMeshes.length);
  assert.ok(uploaded.length >= 20);
  assert.ok(uploaded.every(g=>g.uv && g.uv.length === g.pos.length / 3 * 2));
  assert.equal(world.map,map);
  assert.equal(world.bodies.length,0,'old barrels/crates not scattered over the genuine map');
  world.draw();world.update(1/60);
  const src=readFileSync(new URL('../src/components/game2/engine/game.js',import.meta.url),'utf8');
  assert.match(src,/const arena = this\.duel \|\| this\.online;/); // duel and online matches use the imported arena
  assert.match(src,/new World\(R, arena \? A\.duelMap : null, level\)/);
  assert.match(src,/label: 'Reborn'/);
  const assets=readFileSync(new URL('../src/components/game2/engine/assets.js',import.meta.url),'utf8');
  assert.match(assets,/maps\/duel_training\.bsp/);
  assert.match(assets,/if \(!raw\.ok\) throw/);
});

test('map surfaces are batched by genuine BSP material with finite UV coordinates', () => {
  assert.ok(map.texturedMeshes.some(x => x.shader === 'textures/yavin/goldblock'));
  assert.ok(map.texturedMeshes.some(x => x.shader === 'textures/yavin/temple_stone2'));
  assert.equal(map.texturedMeshes.reduce((sum, x) => sum + x.mesh.idx.length / 3, 0), map.tris.length);
  for (const {mesh} of map.texturedMeshes) {
    assert.ok(mesh.uv.length > 0);
    assert.ok(Array.from(mesh.uv).every(Number.isFinite));
  }
  const gl = readFileSync(new URL('../src/components/game2/engine/gl.js', import.meta.url), 'utf8');
  assert.match(gl, /uniform sampler2D uDiffuse/);
  assert.match(gl, /gl\.texImage2D/);
  assert.match(gl, /gl\.TEXTURE_WRAP_S, gl\.REPEAT/);
  const assets = readFileSync(new URL('../src/components/game2/engine/assets.js', import.meta.url), 'utf8');
  assert.match(assets, /duelMap\.textureBitmaps/);
  assert.match(assets, /createImageBitmap/);
});

test('original Drive Yavin textures exist for every explicitly loaded material', () => {
  const assets = readFileSync(new URL('../src/components/game2/engine/assets.js', import.meta.url), 'utf8');
  const expected = ['ceiling','goldblock','met_floor01','metalrandom1worn','metalstockworn',
    'stone_tile2','temple_basicwall3','temple_basicwall4','temple_interiorsmall3',
    'temple_stone2','tileblock','trim_stone06','trim_stone10'];
  for(const tex of expected) {
    const path = new URL('../public/game2/maps/textures/yavin/' + tex + '.jpg', import.meta.url);
    assert.ok(statSync(path).size > 5000, 'texture not present: ' + tex);
    assert.ok(assets.includes("'" + tex + "'"), 'asset loader not configured: ' + tex);
  }
});
