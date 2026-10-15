// Dual sabers and the saberstaff on Jedi Academy's own animation sets (the optional local bank, engine/assets.js
// loadLocalBank) and their fallback to Jedi Outcast's when it is not there (the live site, CI).
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, makeMatch, addFoe, run, JA_BANK } from './support/game2Sim.mjs';
import { loadLocalBank } from '../src/components/game2/engine/assets.js';
import { KATA_ANIMS } from '../src/components/game2/engine/fighter.js';

const ready = g => { const P = g.player; P.igniteNow(); run(g, 40); return P; };

test('the local bank is appended after the Jedi Outcast one: every existing animation keeps its frames and index', async () => {
  const rig = { rig: { nBones: 2, nFrames: 3 }, anims: [{ name: 'BOTH_STAND1', first: 0, n: 3, loop: 0, fps: 20 }] };
  const bank = { q: new Int16Array(3 * 2 * 4).fill(7), pel: new Float32Array(9).fill(1) };
  const jaQ = new Int16Array(2 * 2 * 4).fill(9), jaPel = new Float32Array(6).fill(2);
  const gz = await new Response(new Blob([jaQ.buffer]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
  const files = { 'ja_anims.json': JSON.stringify({ bones: 2, frames: 2, anims: [{ name: 'BOTH_A6_T__B_', first: 0, n: 2, loop: -1, fps: 20 }] }), 'ja_q.bin.gz': gz, 'ja_pel.bin': jaPel.buffer };
  const request = async url => { const f = files[url.split('/').pop()]; return f ? new Response(f) : new Response('', { status: 404 }); };
  const out = await loadLocalBank('/', rig, bank, () => {}, request);
  assert.equal(out.rigJson.anims[0].first, 0, 'Jedi Outcast animations untouched');
  assert.deepEqual(out.rigJson.anims[1], { name: 'BOTH_A6_T__B_', first: 3, n: 2, loop: -1, fps: 20, ja: true });
  assert.equal(out.bank.q.length, (3 + 2) * 8); assert.equal(out.bank.q[3 * 8], 9); assert.equal(out.bank.q[0], 7);
  const none = await loadLocalBank('/', rig, bank, () => {}, async () => new Response('', { status: 404 }));
  assert.equal(none.bank, bank, 'no local bank: nothing changes');
});

test('without the local bank, dual sabers and the staff keep the Jedi Outcast moves', () => {
  const g = makeGame(), P = ready(g); P.setSaberKit('dual');
  assert.equal(P.saber.animLevel, 0); assert.equal(P.saber.level, 1, 'dual: the one-handed Fast stance');
  P.setSaberKit('staff'); assert.equal(P.saber.animLevel, 0);
  assert.match(P.saber.animFor(P.saber.I.LS_A_T2B), /^BOTH_A[1-3]_/);
});

test('with Jedi Academy animations: dual sabers and the saberstaff stand, run, swing, parry and do their katas their own way', { skip: !JA_BANK && 'no local Jedi Academy bank on this machine' }, () => {
  for (const [kit, al] of [['dual', 6], ['staff', 7]]) {
    const g = makeGame({ ja: true }), P = ready(g), S = P.saber; P.setSaberKit(kit); run(g, 30);
    assert.equal(S.animLevel, al, kit);
    assert.equal(S.animFor(S.I.LS_A_T2B), `BOTH_A${al}_T__B_`, 'attacks');
    assert.equal(S.animFor(S.I.LS_PARRY_UP), `BOTH_P${al}_S${al}_T_`, 'parries');
    assert.match(S.animFor(S.I.LS_T1_BR__R), new RegExp(`^BOTH_T${al}_`), 'transitions');
    assert.equal(S.stanceAnim(), al === 6 ? 'BOTH_SABERDUAL_STANCE' : 'BOTH_SABERSTAFF_STANCE');
    run(g, 40, () => ({ held: new Set(['KeyW']) })); assert.equal(P.actor.legs.name, al === 6 ? 'BOTH_RUN_DUAL' : 'BOTH_RUN_STAFF', 'runs with its own cycle');
    run(g, 40); g.force.fp = 100; assert.ok(P.startKata()); run(g, 2);
    assert.equal(P.actor.legs.name, KATA_ANIMS[kit], 'the real kata'); assert.ok(P.kata.anim);
    let t = 0; while (P.kata && t < 600) { run(g, 1); t++; } assert.ok(t > 200, 'played as authored (~4 s)');
  }
});

test('with Jedi Academy animations: a saberstaff kick knocks down whoever is in front', { skip: !JA_BANK && 'no local Jedi Academy bank on this machine' }, () => {
  const g = makeGame({ ja: true }), P = ready(g); P.setSaberKit('staff'); run(g, 30);
  const foe = addFoe(g, [0, 0, 1.3]), side = addFoe(g, [-3, 0, 0]);
  assert.ok(P.startKick('F')); assert.equal(P.actor.legs.name, 'BOTH_A7_KICK_F');
  run(g, 40);
  assert.equal(foe.status === 'flung' || foe.status === 'down' || foe.status === 'getup', true, 'kicked down (' + foe.status + ')');
  assert.ok(foe.hp < foe.maxHp); assert.equal(side.status, 'normal', 'only the way the foot goes');
  const m = makeMatch('tdm', 'skybridge', { ja: true });
  const kits = m.npcs.map(n => n.saberKit); assert.ok(kits.includes('dual') && kits.includes('staff'), 'bots fight with every kit');
});
