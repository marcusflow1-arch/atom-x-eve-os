// Dual sabers and the saberstaff on Jedi Academy's own animation sets (the optional local bank, engine/assets.js
// loadLocalBank) and their fallback to Jedi Outcast's when it is not there (the live site, CI).
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, makeMatch, addFoe, run, JA_BANK } from './support/game2Sim.mjs';
import { loadLocalBank } from '../src/components/game2/engine/assets.js';
import { KATA_ANIMS } from '../src/components/game2/engine/fighter.js';
import { DUAL_LAG, DUAL_SPREAD } from '../src/components/game2/engine/actor.js';

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

test('without the local bank (the live site): dual sabers fight with both arms, from moves derived from Jedi Outcast\'s', () => {
  const g = makeGame(), P = ready(g), S = P.saber, sk = P.actor.skel, R = sk.rigJson.rig, NB = R.nBones, q = sk.qBank;
  P.setSaberKit('dual');
  assert.equal(S.animLevel, 0); assert.equal(S.derivedKit, 'dual'); assert.equal(S.level, 1, 'the one-handed Fast style');
  assert.equal(S.animFor(S.I.LS_A_T2B), 'G2D_BOTH_A1_T__B_'); assert.equal(S.stanceAnim(), 'G2D_BOTH_SABERFAST_STANCE');
  // the left arm is the right one mirrored DUAL_LAG frames behind, swung out from the shoulder; the rest is untouched
  const D = sk.anims.G2D_BOTH_A1_T__B_, O = sk.anims.BOTH_A1_T__B_, i = n => R.g2Bones.indexOf(n), at = (f, b) => [...q.subarray((f * NB + b) * 4, (f * NB + b) * 4 + 4)];
  assert.equal(D.n, O.n); const k = 6, r = at(O.first + k - DUAL_LAG, i('rhumerus')).map(v => v / 32767), m = [r[0], r[1], -r[2], -r[3]], s = DUAL_SPREAD;
  const want = [s[0] * m[0] - s[1] * m[1] - s[2] * m[2] - s[3] * m[3], s[0] * m[1] + s[1] * m[0] + s[2] * m[3] - s[3] * m[2], s[0] * m[2] - s[1] * m[3] + s[2] * m[0] + s[3] * m[1], s[0] * m[3] + s[1] * m[2] - s[2] * m[1] + s[3] * m[0]];
  at(D.first + k, i('lhumerus')).forEach((v, c) => assert.ok(Math.abs(v / 32767 - want[c]) < 1e-3, 'left humerus = spread * mirror(right, lag)'));
  assert.deepEqual(at(D.first + k, i('rhumerus')), at(O.first + k, i('rhumerus')), 'the right arm is untouched');
  assert.deepEqual(at(D.first + k, i('thoracic')), at(O.first + k, i('thoracic')), 'and so is the body');
  // the two hands work apart through every swing instead of meeting in the middle
  const gap = (an, t) => { P.actor.setBoth(an, { blend: 0, restart: true, loop: false, speed: 0.02, startAt: t / 0.02 }); run(g, 2); const a = P.actor.bonePos('lhand'), b = P.actor.bonePos('rhand'); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); };
  for (const an of ['G2D_BOTH_SABERFAST_STANCE', 'G2D_BOTH_A1_T__B_', 'G2D_BOTH_A1__L__R', 'G2D_BOTH_A1_TL_BR']) for (const t of [0.05, 0.15, 0.25]) assert.ok(gap(an, t) > 0.35, `${an} @${t}: hands ${gap(an, t).toFixed(2)} m apart`);
  P.setStyle(3); assert.equal(S.level, 1, 'a kit keeps its own style (the AI switches styles at random)');
  P.setSaberKit('single'); P.setStyle(3); assert.equal(S.level, 3, 'a single saber changes style freely'); assert.equal(S.derivedKit, null);
});

test('without the local bank: the saberstaff is held at the middle in one hand and spins through each attack', () => {
  const g = makeGame(), P = ready(g), S = P.saber; P.setSaberKit('staff'); P.igniteNow(); run(g, 20);
  assert.equal(S.animLevel, 0); assert.equal(S.derivedKit, 'staff'); assert.equal(S.level, 1, 'one-handed (Fast)');
  assert.equal(P.twirl || 0, 0, 'still between attacks');
  const dot = () => P.blade.dir.reduce((s, v, c) => s + v * P.blade2.dir[c], 0);
  run(g, 1, () => ({ attack: true })); let most = 0;
  for (let n = 0; n < 60 && (n < 5 || S.isActiveSwing()); n++) { run(g, 1); most = Math.max(most, P.twirl || 0); assert.ok(Math.abs(dot() + 1) < 1e-3, 'the two blades stay end to end'); }
  assert.ok(most > Math.PI / 2, 'it spins (' + most.toFixed(2) + ' rad)');
  run(g, 60); assert.equal(P.twirl || 0, 0, 'and settles between attacks');
  const m = makeMatch('tdm', 'skybridge'), kits = m.npcs.map(n => n.saberKit);
  assert.ok(kits.includes('dual') && kits.includes('staff'), 'skirmish bots fight with every kit on the live site too');
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
