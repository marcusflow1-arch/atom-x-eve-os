// Exploration discoveries in the game (docs/game3d/EXPLORATION_DISCOVERIES.md), over the real
// stores: the seeds are placed in the land, a local character rolls with the shared table, a
// character the server keeps takes the server's answer, the gather runs its time, and what the
// device keeps is exactly what the Vault's rule expects.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), 'axe-discoveries-'));
const dom = new JSDOM('', { url: 'http://localhost/', virtualConsole: new VirtualConsole() });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent });
localStorage.setItem('wwm_storage_user_v1', 'explorer');
localStorage.setItem('wwm_character_active_v1::explorer', 'char_x');
const modules = {
  store: 'exploration/explorationDiscoveryStore.js', gather: 'exploration/discoveryGather.js', loot: 'lootStore.jsx',
  vault: 'character/characterVault.js', storage: 'characterStorage.jsx', world: 'axe/world/AXEWorldStreamingSystem.js', interactions: 'axe/interactions/AXEInteractionSystem.js',
};
await build({ stdin: { contents: [...Object.entries(modules).map(([name, file]) =>
  `export * as ${name} from './src/components/game3d/${file}';`), "export * as shared from './base44/shared/explorationDiscoveries.ts';"].join('\n'), resolveDir: root },
  bundle: true, jsx: 'automatic', format: 'esm', platform: 'node', outfile: path.join(temp, 'stores.mjs'),
  alias: { '@': path.join(root, 'src') }, define: { 'import.meta.env': '{}' },
  plugins: [{ name: 'offline-service-boundary', setup(b) {
    b.onResolve({ filter: /api\/base44Client/ }, () => ({ path: 'base44-test', namespace: 'offline' }));
    b.onLoad({ filter: /.*/, namespace: 'offline' }, () => ({ contents:
      'export const base44 = { auth: { updateMe: async () => ({}), me: async () => ({}) } };' }));
  } }], logLevel: 'silent',
});
const { store, gather, loot, vault, storage, world, interactions, shared } = await import(pathToFileURL(path.join(temp, 'stores.mjs')));
after(async () => { store.setDiscoveryClaimSource(null); dom.window.close(); await rm(temp, { recursive: true, force: true }); });

const { EXPLORATION_DISCOVERIES, DISCOVERY_MATERIALS, ELITE_SKILLS, getDiscovery } = shared;
const at = (id) => { const p = getDiscovery(id).position; return { x: p[0], y: 0, z: p[2] + 1 }; };
const units = (prefix) => (loot.getLootInventory().material || []).filter((u) => String(u.dropId).startsWith(prefix));
const events = [];
['explorationDiscoveryClaimed', 'axeQuestEvent'].forEach((name) => window.addEventListener(name, (e) => events.push({ name, ...e.detail })));
const MIN = 60_000;
// the server's answer for a claim, as explorationDiscovery sends it
let minted = 0;
const serverResult = (id, itemIds, { skills = [], now = Date.now(), count = 1 } = {}) => {
  const def = getDiscovery(id);
  return {
    ok: true, discoveryId: id, kind: def.kind, skills,
    units: itemIds.map((itemId) => shared.discoveryUnit(itemId, `disc_${id}_${count}_${++minted}_t`, now)),
    claim: shared.nextDiscoveryClaim(def, null, now),
  };
};
const serverAnswers = (answer) => {
  const asked = [];
  const source = async (req) => { asked.push(req); return typeof answer === 'function' ? answer(req) : answer; };
  let flushed = 0;
  source.afterApply = async () => { flushed += 1; };
  store.setDiscoveryClaimSource(source);
  return { asked, flushed: () => flushed };
};

test('the seeds are placed out in the land, in an existing region, with loot-table rewards', () => {
  const regions = new Set(world.createAXEInitialWorldManifest().regions.map((r) => r.id));
  const ids = new Set();
  for (const def of EXPLORATION_DISCOVERIES) {
    assert.ok(!ids.has(def.id), `${def.id} is unique`); ids.add(def.id);
    assert.ok(regions.has(def.region), `${def.id}: ${def.region} is a region of the world manifest`);
    assert.ok(shared.DISCOVERY_KINDS.includes(def.kind));
    assert.ok(interactions.AXE_INTERACTION_TYPES.includes(def.interaction), def.interaction);
    const [x, , z] = def.position;
    assert.ok(Math.abs(x) <= 195 && Math.abs(z) <= 195, `${def.id} stands on the 400 m playable plane`);
    assert.ok(Math.hypot(x, z) >= 60, `${def.id} is out in the land, away from the capital start`);
    assert.ok(def.gatherMs >= 1000 && def.gatherMs <= 5000 && def.range > 0);
    assert.ok(def.respawnMs === null || def.respawnMs >= 5 * MIN);
    for (const reward of def.rewards) {
      if (reward.type === 'skill') { assert.ok(ELITE_SKILLS[reward.skillId], reward.skillId); continue; }
      const row = loot.LOOT_TABLE.find((i) => i.id === reward.itemId);
      assert.equal(row?.category, 'material', `${reward.itemId} is a loot-table material`);
      assert.deepEqual(DISCOVERY_MATERIALS[reward.itemId], { name: row.name, rarity: row.rarity, icon: row.icon }, `${reward.itemId}: the server's unit matches the loot table`);
      assert.ok(reward.min >= 1 && reward.max >= reward.min && reward.chance > 0 && reward.chance <= 1);
    }
  }
  const nodes = EXPLORATION_DISCOVERIES.filter((d) => d.kind === 'material_node');
  assert.ok(nodes.length >= 3 && new Set(nodes.map((d) => d.region)).size === 1, 'a few material nodes in one region');
  assert.ok(nodes.some((d) => d.respawnMs) && nodes.some((d) => d.respawnMs === null), 'respawning nodes and a one-time find');
  const elite = EXPLORATION_DISCOVERIES.filter((d) => d.kind === 'elite_find');
  assert.equal(elite.length, 1);
  assert.equal(elite[0].placeholder, true, 'the owner has not chosen the elite skills yet');
  for (const skill of Object.values(ELITE_SKILLS)) assert.deepEqual(Object.keys(skill).sort(), ['id', 'name', 'placeholder'], 'no combat numbers');
  assert.equal(loot.LOOT_TABLE.some((i) => ELITE_SKILLS[i.id]), false, 'an elite skill never drops from an enemy');
});

test('a local character rolls with the shared table and keeps its claim', async () => {
  store.setDiscoveryClaimSource(null);
  const now = Date.now();
  const before = loot.getLootItemCount('mat_crystal', 'material');
  const first = await store.claimExplorationDiscovery('ft_spirit_vein', { position: at('ft_spirit_vein'), now, rng: () => 0.99 });
  assert.deepEqual([first.ok, first.serverGranted], [true, false]);
  assert.deepEqual(first.units.map((u) => u.id), ['mat_crystal', 'mat_crystal'], 'Spirit Crystal 1–2 at 0.99, no Starlight Dust');
  assert.ok(first.units.every((u) => u.name === 'Spirit Crystal' && !u.dropId.startsWith('disc_')), 'a local unit is an ordinary one');
  assert.equal(loot.getLootItemCount('mat_crystal', 'material'), before + 2);
  assert.equal(store.getDiscoveryClaim('ft_spirit_vein').nextAvailableAt, new Date(now + 20 * MIN).toISOString());
  const early = await store.claimExplorationDiscovery('ft_spirit_vein', { position: at('ft_spirit_vein'), now: now + MIN });
  assert.deepEqual([early.ok, early.reason], [false, 'respawning']);
  assert.equal(loot.getLootItemCount('mat_crystal', 'material'), before + 2);
  const back = await store.claimExplorationDiscovery('ft_spirit_vein', { position: at('ft_spirit_vein'), now: now + 21 * MIN, rng: () => 0.01 });
  assert.deepEqual(back.units.map((u) => u.id), ['mat_crystal', 'mat_starlight']);
  assert.equal(store.getDiscoveryClaim('ft_spirit_vein').count, 2);
  assert.equal((await store.claimExplorationDiscovery('ft_hidden_divine_cache', { now })).ok, true);
  assert.equal((await store.claimExplorationDiscovery('ft_hidden_divine_cache', { now: now + 365 * 24 * 60 * MIN })).reason, 'already_claimed', 'found once, ever');
  assert.deepEqual(store.getDiscoveryAvailability('ft_hidden_divine_cache'), { available: false, reason: 'already_claimed' });
});

test("for a character the server keeps, the server's answer is the reward", async () => {
  const answer = serverResult('ft_soul_bloom', ['mat_soul_fragment', 'mat_aura_shard']);
  const server = serverAnswers({ ok: true, result: answer });
  events.length = 0;
  const got = await store.claimExplorationDiscovery('ft_soul_bloom', { position: at('ft_soul_bloom') });
  assert.deepEqual([got.ok, got.serverGranted], [true, true]);
  assert.deepEqual(server.asked.map((a) => [a.discoveryId, a.position.x]), [['ft_soul_bloom', 122]]);
  assert.ok(server.asked[0].transactionId, 'each claim has its own id, so a retry is never a second reward');
  assert.deepEqual(units('disc_ft_soul_bloom').map((u) => [u.id, u.name, u.dropId]), answer.units.map((u) => [u.id, u.name, u.dropId]), "the server's own units");
  assert.deepEqual(store.getDiscoveryClaim('ft_soul_bloom'), answer.claim, "the server's claim, timestamps and all");
  assert.equal(server.flushed(), 1, 'the reward is sent to the server at once');
  store.applyDiscoveryResult(answer, { serverGranted: true });
  assert.equal(units('disc_ft_soul_bloom').length, 2, 'an answer applied twice adds nothing');
  assert.deepEqual(events.filter((e) => e.name === 'axeQuestEvent').slice(0, 3).map((e) => [e.type, e.targetId || e.itemId]),
    [['world_interact', 'ft_soul_bloom'], ['item_collected', 'mat_soul_fragment'], ['item_collected', 'mat_aura_shard']]);
  // respawning here: refused without asking
  assert.equal((await store.claimExplorationDiscovery('ft_soul_bloom', { position: at('ft_soul_bloom') })).reason, 'respawning');
  assert.equal(server.asked.length, 1);
});

test('a find another device took: nothing is granted, and this device learns the claim', async () => {
  const taken = shared.nextDiscoveryClaim(getDiscovery('ft_weathered_tablet'), null, Date.now() - 60_000);
  const server = serverAnswers({ ok: true, result: { ok: false, reason: 'already_claimed', claim: taken, discoveryId: 'ft_weathered_tablet' } });
  const learned = loot.getLearnedSkillIds().has('elite_placeholder_unwritten');
  const refused = await store.claimExplorationDiscovery('ft_weathered_tablet', { position: at('ft_weathered_tablet') });
  assert.deepEqual([refused.ok, refused.reason], [false, 'already_claimed']);
  assert.equal(loot.getLearnedSkillIds().has('elite_placeholder_unwritten'), learned);
  assert.deepEqual(store.getDiscoveryClaim('ft_weathered_tablet'), taken);
  assert.equal((await store.claimExplorationDiscovery('ft_weathered_tablet', { position: at('ft_weathered_tablet') })).reason, 'already_claimed');
  assert.equal(server.asked.length, 1, 'the second attempt never reached the server');
  // a server that can't be reached grants nothing
  serverAnswers({ ok: false, reason: 'discoveries_need_a_server_connection' });
  const offline = await store.claimExplorationDiscovery('ft_reinforce_outcrop', { position: at('ft_reinforce_outcrop') });
  assert.deepEqual([offline.ok, offline.reason], [false, 'discoveries_need_a_server_connection']);
  assert.equal(store.getDiscoveryClaim('ft_reinforce_outcrop'), null);
});

test('an elite find teaches its skill, and the device keeps exactly what the Vault expects', async () => {
  // a fresh character, so its save holds only this test's finds
  localStorage.setItem('wwm_character_active_v1::explorer', 'char_elite');
  storage.notifyCharacterChange();
  assert.equal(store.getDiscoveryClaim('ft_reinforce_outcrop'), null);
  const now = Date.now();
  const tablet = serverResult('ft_weathered_tablet', [], { skills: ['elite_placeholder_unwritten'], now });
  const outcrop = serverResult('ft_reinforce_outcrop', ['mat_reinforce', 'mat_reinforce'], { now });
  serverAnswers(({ discoveryId }) => ({ ok: true, result: discoveryId === 'ft_weathered_tablet' ? tablet : outcrop }));
  const elite = await store.claimExplorationDiscovery('ft_weathered_tablet', { position: at('ft_weathered_tablet') });
  assert.deepEqual([elite.ok, elite.kind, elite.skills], [true, 'elite_find', ['elite_placeholder_unwritten']]);
  assert.ok(loot.getLearnedSkillIds().has('elite_placeholder_unwritten'));
  assert.ok(events.some((e) => e.name === 'explorationDiscoveryClaimed' && e.discoveryId === 'ft_weathered_tablet'));
  await store.claimExplorationDiscovery('ft_reinforce_outcrop', { position: at('ft_reinforce_outcrop') });
  // this character's save, as the Vault collects it, against the server's ledger for it
  const suffix = '::explorer::char_elite';
  const save = Object.fromEntries(Object.keys(localStorage).filter((k) => k.endsWith(suffix)).map((k) => [k.slice(0, -suffix.length), localStorage.getItem(k)]));
  const row = (result) => ({ id: result.discoveryId, discovery_id: result.discoveryId, claims: 1, first_claimed_at: result.claim.firstClaimedAt,
    last_claimed_at: result.claim.lastClaimedAt, ...(result.claim.nextAvailableAt ? { next_available_at: result.claim.nextAvailableAt } : {}),
    skills: result.skills, pending: result.units });
  const kept = shared.enforceDiscoveryLedger(save, null, [row(tablet), row(outcrop)]);
  assert.deepEqual(kept.corrections, [], 'nothing to put right: no correction loop between the device and the server');
  assert.deepEqual(kept.delivered, ['ft_reinforce_outcrop'], 'the units it granted are all here (the tablet granted none)');
});

test('the server claim source saves first, retries once and maps refusals', async () => {
  let status = 'saved';
  let flushes = 0;
  const engine = { get: () => ({ status }), flush: async () => { flushes += 1; return true; } };
  const calls = [];
  let replies = [];
  const source = vault.createServerDiscoveryClaims(engine, {
    call: async (fn, action, data) => { calls.push({ fn, action, data }); const r = replies.shift(); if (r instanceof Error) throw r; return r; },
    getIdentity: () => ({ userId: 'explorer', characterId: 'char_x' }),
    wait: async () => {},
  });
  const coded = (code) => Object.assign(new Error(code), { code });
  replies = [coded('not_synced'), { result: { ok: true, discoveryId: 'ft_spirit_vein' } }];
  const ok = await source({ discoveryId: 'ft_spirit_vein', position: { x: 1, z: 2 }, transactionId: 't1' });
  assert.deepEqual(ok, { ok: true, result: { ok: true, discoveryId: 'ft_spirit_vein' } });
  assert.deepEqual(calls.map((c) => [c.fn, c.action, c.data.characterId, c.data.transactionId]), [['explorationDiscovery', 'claim', 'char_x', 't1'], ['explorationDiscovery', 'claim', 'char_x', 't1']], 'the same transaction, retried once');
  assert.equal(flushes, 2, 'saved before asking, and again before the retry');
  replies = [coded('too_far')];
  assert.deepEqual(await source({ discoveryId: 'ft_spirit_vein' }), { ok: false, reason: 'too_far' });
  replies = [coded('server')];
  assert.deepEqual(await source({ discoveryId: 'ft_spirit_vein' }), { ok: false, reason: 'discoveries_need_a_server_connection' });
  replies = [coded('local_only')];
  assert.deepEqual(await source({ discoveryId: 'ft_spirit_vein' }), { local: true });
  status = 'local_only';
  assert.deepEqual(await source({ discoveryId: 'ft_spirit_vein' }), { local: true });
  status = 'conflict';
  assert.deepEqual(await source({ discoveryId: 'ft_spirit_vein' }), { ok: false, reason: 'choose_which_save_to_keep_first' });
  const before = flushes;
  await source.afterApply();
  assert.equal(flushes, before + 1);
});

test('the gather runs its time, and walking away cancels it', () => {
  let clock = 0;
  const g = gather.createDiscoveryGather({ now: () => clock });
  const def = getDiscovery('ft_spirit_vein');
  assert.equal(g.start(def, { x: 0, z: 0 }), false, 'out of reach');
  assert.equal(g.start(def, at(def.id)), true);
  assert.equal(g.start(def, at(def.id)), false, 'one at a time');
  clock = def.gatherMs / 2;
  assert.deepEqual(g.update(at(def.id)), {});
  assert.equal(g.snapshot().progress, 0.5);
  assert.equal(g.update({ x: def.position[0] + 20, z: def.position[2] }).cancelled, def, 'walked away');
  assert.equal(g.snapshot().outcome, 'moved_away');
  assert.equal(g.start(def, at(def.id)), true);
  clock += def.gatherMs - 1;
  assert.deepEqual(g.update(at(def.id)), {});
  clock += 1;
  assert.equal(g.update(at(def.id)).done, def);
  assert.deepEqual([g.snapshot().active, g.snapshot().outcome, g.snapshot().progress], [false, 'complete', 1]);
});
