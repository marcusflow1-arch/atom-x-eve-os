// explorationDiscovery + characterVault: the server decides what a hero finds out in the land,
// records it, and every save keeps the server's claims and rewards
// (docs/game3d/EXPLORATION_DISCOVERIES.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import vm from 'node:vm';

const tables = {};
const reset = () => { for (const k of Object.keys(tables)) delete tables[k]; Object.assign(tables, { Game3DCharacterSave: [], Game3DCharacterSaveBackup: [], Game3DItemUpgrade: [], Game3DDiscoveryClaim: [] }); };
let seq = 0;
const entities = new Proxy({}, { get: (_, name) => ({
  filter: async (filter = {}, _sort, limit) => (tables[name] || []).filter((r) => Object.entries(filter).every(([k, v]) => r[k] === v)).reverse().slice(0, limit || undefined).map((r) => structuredClone(r)),
  get: async (id) => { const r = (tables[name] || []).find((x) => x.id === id); return r ? structuredClone(r) : null; },
  create: async (data) => { const row = { id: `${name}-${String(++seq).padStart(6, '0')}`, created_date: new Date().toISOString(), ...structuredClone(data) }; (tables[name] ||= []).push(row); return structuredClone(row); },
  update: async (id, patch) => { const r = (tables[name] || []).find((x) => x.id === id); Object.assign(r, structuredClone(patch)); return structuredClone(r); },
  delete: async (id) => { tables[name] = (tables[name] || []).filter((x) => x.id !== id); },
}) });
const users = { alice: { id: 'alice', role: 'user' }, bob: { id: 'bob', role: 'user' } };
let nextRoll = 0.5; // the server's dice, fixed for each test
let clock = 0; // how far the server's clock has moved on: time passing in the game
class ServerDate extends Date {
  constructor(...args) { super(...(args.length ? args : [Date.now() + clock])); }
  static now() { return Date.now() + clock; }
}
const handlers = {};
for (const fn of ['explorationDiscovery', 'characterVault']) {
  const source = buildSync({ entryPoints: [`base44/functions/${fn}/entry.ts`], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['npm:*'] }).outputFiles[0].text;
  vm.runInNewContext(source, {
    module: { exports: {} }, exports: {}, Response, Request, Date: ServerDate, JSON, Number, String, Object, Array, Promise, Math, Infinity, Set, Map,
    crypto: { getRandomValues: (a) => { a[0] = Math.min(2 ** 32 - 1, Math.floor(nextRoll * 2 ** 32)); return a; } },
    console: { warn() {}, error() {}, log() {} },
    Deno: { serve: (h) => { handlers[fn] = h; } },
    require: () => ({ createClientFromRequest: (req) => ({ auth: { me: async () => users[req.headers.get('test-user')] || null }, asServiceRole: { entities } }) }),
  });
}
const shared = await import(`data:text/javascript;base64,${Buffer.from(buildSync({ entryPoints: ['base44/shared/explorationDiscoveries.ts'], bundle: true, write: false, format: 'esm' }).outputFiles[0].text).toString('base64')}`);
const { getDiscovery, DISCOVERY_STATE_KEY, LEARNED_SKILLS_KEY } = shared;

async function call(fn, user, action, data = {}, status = 200) {
  const res = await handlers[fn](new Request('https://test.local', { method: 'POST', headers: { 'test-user': user }, body: JSON.stringify({ action, data }) }));
  const body = await res.json();
  assert.equal(res.status, status, `${fn} ${action}: ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}
// standing at the discovery, as the game reports it
const at = (id) => { const p = getDiscovery(id)?.position || [0, 0, 0]; return { x: p[0] + 1, y: 0, z: p[2] - 1 }; };
let tx = 0;
const claim = (discoveryId, status, extra = {}) => call('explorationDiscovery', 'alice', 'claim', { characterId: 'char_1', discoveryId, position: at(discoveryId), transactionId: `tx_${++tx}`, ...extra }, status);
// time passes: past the per-character pace, and (with `cooldown`) past every respawn
const later = ({ cooldown = false } = {}) => { clock += cooldown ? 31 * 60_000 : 5000; };

const hero = (level) => JSON.stringify({ level, xp: 0, baseStats: { strength: 3 + 3 * (level - 1), dexterity: 2, constitution: 5, focus: 2 }, unspentPoints: 0 });
const saveOf = ({ material = [], learned = ['power_charge'], claims = null } = {}) => ({
  wwm_player_progression_v1: hero(20),
  game_loot_inventory_v2: JSON.stringify({ material: [{ id: 'mat_reinforce', category: 'material', dropId: 'drop_1' }, ...material] }),
  [LEARNED_SKILLS_KEY]: JSON.stringify(learned),
  ...(claims ? { [DISCOVERY_STATE_KEY]: JSON.stringify({ claims }) } : {}),
});
// what the game does with an answer: the units go into the loot inventory, the claim into its state
const applied = (data, ...results) => {
  const inv = JSON.parse(data.game_loot_inventory_v2);
  const state = JSON.parse(data[DISCOVERY_STATE_KEY] || '{"claims":{}}');
  const learned = JSON.parse(data[LEARNED_SKILLS_KEY] || '[]');
  for (const r of results) {
    for (const u of r.units) (inv[u.category] ||= []).push({ ...u });
    state.claims[r.discoveryId] = r.claim;
    for (const s of r.skills) if (!learned.includes(s)) learned.push(s);
  }
  return { ...data, game_loot_inventory_v2: JSON.stringify(inv), [DISCOVERY_STATE_KEY]: JSON.stringify(state), [LEARNED_SKILLS_KEY]: JSON.stringify(learned) };
};
const saved = () => tables.Game3DCharacterSave.find((r) => r.character_id === 'char_1' && r.owner_id === 'alice');
const rowOf = (id) => tables.Game3DDiscoveryClaim.find((r) => r.discovery_id === id);
const unitsIn = (data, prefix = 'disc_') => JSON.parse(data.game_loot_inventory_v2).material.filter((u) => String(u.dropId).startsWith(prefix));
let revision = 0;
const put = async (data, extra = {}) => { const body = await call('characterVault', 'alice', 'put', { characterId: 'char_1', data, expectedRevision: revision, ...extra }); revision = body.save.revision; return body; };
const fresh = async (data = saveOf()) => { reset(); revision = 0; nextRoll = 0.5; clock = 0; await put(data); };

test('a claim needs a character the server holds, a real discovery, and the hero next to it', async () => {
  reset(); revision = 0; clock = 0;
  assert.equal((await claim('ft_spirit_vein', 409)).code, 'not_synced');
  await put(saveOf());
  assert.equal((await call('explorationDiscovery', 'alice', 'claim', { characterId: '__default__', discoveryId: 'ft_spirit_vein', position: at('ft_spirit_vein') }, 400)).code, 'local_only');
  assert.equal((await claim('ft_made_up', 400)).code, 'invalid');
  assert.equal((await claim('ft_spirit_vein', 409, { position: { x: 0, y: 0, z: 0 } })).code, 'too_far', 'from the capital start');
  assert.equal((await claim('ft_spirit_vein', 409, { position: null })).code, 'too_far');
  assert.equal((await call('explorationDiscovery', 'bob', 'claim', { characterId: 'char_1', discoveryId: 'ft_spirit_vein', position: at('ft_spirit_vein') }, 409)).code, 'not_synced', "bob's own char_1, not alice's");
  assert.equal(tables.Game3DDiscoveryClaim.length, 0, 'nothing was granted');
});

test("the server rolls the reward with the node's own table and records it", async () => {
  await fresh();
  nextRoll = 0.99; // Spirit Crystal 1–2 → 2; Starlight Dust at 15% → none
  const first = (await claim('ft_spirit_vein')).result;
  assert.equal(first.ok, true);
  assert.deepEqual(first.units.map((u) => u.id), ['mat_crystal', 'mat_crystal']);
  assert.ok(first.units.every((u) => u.dropId.startsWith('disc_ft_spirit_vein_1_')), 'server-minted units');
  assert.equal(new Set(first.units.map((u) => u.dropId)).size, 2);
  const row = rowOf('ft_spirit_vein');
  assert.deepEqual([row.claims, row.pending.length, row.granted_count, row.kind], [1, 2, 2, 'material_node']);
  assert.equal(Date.parse(row.next_available_at) - Date.parse(row.last_claimed_at), 20 * 60_000, 'respawns in 20 minutes');
  later({ cooldown: true });
  nextRoll = 0.01; // 1 Spirit Crystal, and the 15% Starlight Dust
  const second = (await claim('ft_spirit_vein')).result;
  assert.deepEqual(second.units.map((u) => u.id), ['mat_crystal', 'mat_starlight']);
  assert.equal(second.claim.count, 2);
  assert.equal(rowOf('ft_spirit_vein').pending.length, 4, 'neither claim has reached a save yet');
});

test('granted units land in the save, even when the device lost the answer', async () => {
  await fresh();
  const lost = (await claim('ft_reinforce_outcrop')).result;
  // the device never applied it: its next save is delivered the units and the claim
  const body = await put(saveOf());
  assert.equal(body.corrected, true);
  assert.deepEqual(unitsIn(body.data).map((u) => u.dropId), lost.units.map((u) => u.dropId));
  assert.deepEqual(unitsIn(body.data)[0], { id: 'mat_reinforce', name: 'Reinforcement Stone', rarity: 'uncommon', icon: '⬟', category: 'material', dropId: lost.units[0].dropId, source: 'discovery', collectedAt: lost.units[0].collectedAt }, 'a whole loot unit, as a picked-up one');
  assert.deepEqual(JSON.parse(body.data[DISCOVERY_STATE_KEY]).claims.ft_reinforce_outcrop, lost.claim);
  assert.deepEqual(unitsIn(saved().data).map((u) => u.dropId), lost.units.map((u) => u.dropId), 'the server keeps them');
  assert.deepEqual(rowOf('ft_reinforce_outcrop').pending, [], 'delivered');
  assert.ok(!saved().flags.some((f) => f.startsWith('discovery_corrected')), 'a delivery is not suspicious');
  // the device takes the save as kept: nothing more to put right
  const settled = await put(body.data);
  assert.deepEqual([settled.unchanged, settled.corrected], [true, undefined]);
  // a device that did apply its answer: nothing to correct either
  later();
  const found = (await claim('ft_soul_bloom')).result;
  const own = await put(applied(body.data, found));
  assert.equal(own.corrected, undefined);
  assert.deepEqual(rowOf('ft_soul_bloom').pending, []);
});

test('a one-time find is found once, whatever the save says', async () => {
  await fresh();
  const cache = (await claim('ft_hidden_divine_cache')).result;
  assert.deepEqual(cache.units.map((u) => u.id).sort(), ['mat_divine_essence', 'mat_divine_essence', 'mat_heroic_core']);
  assert.equal(cache.claim.nextAvailableAt, null);
  assert.equal(rowOf('ft_hidden_divine_cache').next_available_at, undefined);
  await put(applied(saveOf(), cache));
  later({ cooldown: true });
  const again = (await claim('ft_hidden_divine_cache')).result;
  assert.deepEqual([again.ok, again.reason], [false, 'already_claimed']);
  assert.deepEqual(again.claim, cache.claim);
  // a browser save from before the find is put back (a reload): the claim stays
  const reloaded = await put(saveOf());
  assert.equal(reloaded.corrected, true);
  assert.deepEqual(JSON.parse(reloaded.data[DISCOVERY_STATE_KEY]).claims.ft_hidden_divine_cache, cache.claim);
  assert.deepEqual(unitsIn(reloaded.data), [], 'its units were delivered once; a save without them has spent them');
  later();
  assert.equal((await claim('ft_hidden_divine_cache')).result.reason, 'already_claimed');
  assert.equal(rowOf('ft_hidden_divine_cache').granted_count, 3);
});

test('a respawning node waits out its cooldown', async () => {
  await fresh();
  const first = (await claim('ft_spirit_vein')).result;
  later(); // past the per-character pace, not the respawn
  const early = (await claim('ft_spirit_vein')).result;
  assert.deepEqual([early.ok, early.reason, early.nextAvailableAt], [false, 'respawning', first.claim.nextAvailableAt]);
  assert.equal(rowOf('ft_spirit_vein').claims, 1);
  later({ cooldown: true });
  const back = (await claim('ft_spirit_vein')).result;
  assert.deepEqual([back.ok, back.claim.count, back.claim.firstClaimedAt], [true, 2, first.claim.firstClaimedAt]);
});

test('claims are paced, and a retried claim gets the same answer without a second reward', async () => {
  await fresh();
  const first = await claim('ft_spirit_vein', 200, { transactionId: 'retry_me' });
  const retry = await claim('ft_spirit_vein', 200, { transactionId: 'retry_me' });
  assert.equal(retry.repeated, true);
  assert.deepEqual(retry.result, first.result);
  assert.deepEqual([rowOf('ft_spirit_vein').claims, rowOf('ft_spirit_vein').granted_count], [1, first.result.units.length]);
  assert.equal((await claim('ft_soul_bloom', 429)).code, 'too_fast', 'one claim at a time per character');
  later();
  assert.equal((await claim('ft_soul_bloom')).result.ok, true);
});

test('units the server did not grant are removed, and a spent one cannot come back', async () => {
  await fresh();
  // made up in the browser, with the server's prefix
  const forged = await put(saveOf({ material: [{ id: 'mat_divine_essence', category: 'material', dropId: 'disc_ft_hidden_divine_cache_1_0_x' }] }));
  assert.equal(forged.corrected, true);
  assert.deepEqual(unitsIn(forged.data), []);
  assert.ok(saved().flags.some((f) => /^discovery_corrected: 1/.test(f)));
  // a real one, then copied
  const found = (await claim('ft_reinforce_outcrop')).result;
  const real = await put(applied(forged.data, found));
  assert.equal(real.corrected, undefined);
  const inv = JSON.parse(saved().data.game_loot_inventory_v2);
  const copied = await put({ ...saved().data, game_loot_inventory_v2: JSON.stringify({ ...inv, material: [...inv.material, { ...inv.material.at(-1) }] }) });
  assert.equal(copied.corrected, true);
  assert.equal(unitsIn(copied.data).length, found.units.length, 'one of each');
  // one is spent here, and an older browser save brings it back
  const spentOne = found.units[0].dropId;
  const afterSpend = { ...copied.data, game_loot_inventory_v2: JSON.stringify({ material: JSON.parse(copied.data.game_loot_inventory_v2).material.filter((u) => u.dropId !== spentOne) }) };
  assert.equal((await put(afterSpend)).corrected, undefined);
  const back = await put(copied.data);
  assert.equal(back.corrected, true);
  assert.ok(!unitsIn(back.data).some((u) => u.dropId === spentOne));
  assert.ok(JSON.parse(back.data.game_loot_inventory_v2).material.some((u) => u.dropId === 'drop_1'), 'ordinary units are not touched');
});

test('an elite find teaches its skill, and only a find can', async () => {
  await fresh();
  const learnedIn = (data) => JSON.parse(data[LEARNED_SKILLS_KEY]);
  const forged = await put(saveOf({ learned: ['power_charge', 'elite_placeholder_unwritten'] }));
  assert.equal(forged.corrected, true);
  assert.deepEqual(learnedIn(forged.data), ['power_charge'], 'the ordinary skill stays');
  later();
  const tablet = (await claim('ft_weathered_tablet')).result;
  assert.deepEqual([tablet.ok, tablet.kind, tablet.skills, tablet.units], [true, 'elite_find', ['elite_placeholder_unwritten'], []]);
  assert.deepEqual(rowOf('ft_weathered_tablet').skills, ['elite_placeholder_unwritten']);
  // a save without it (another device, a reload) learns it again
  const relearned = await put(saveOf());
  assert.equal(relearned.corrected, true);
  assert.deepEqual(learnedIn(relearned.data), ['power_charge', 'elite_placeholder_unwritten']);
  assert.ok(!saved().flags.some((f) => f.startsWith('discovery_corrected')), 'learning it again is not suspicious');
  later({ cooldown: true });
  assert.equal((await claim('ft_weathered_tablet')).result.reason, 'already_claimed');
});

test('a restore keeps what was found and delivers the newer rewards again', async () => {
  await fresh();
  const backup = tables.Game3DCharacterSaveBackup.find((b) => b.reason === 'first_upload');
  backup.created_date = new Date(Date.now() - 60_000).toISOString();
  const outcrop = (await claim('ft_reinforce_outcrop')).result;
  later();
  const tablet = (await claim('ft_weathered_tablet')).result;
  await put(applied(saveOf(), outcrop, tablet));
  assert.deepEqual(rowOf('ft_reinforce_outcrop').pending, []);
  revision = (await call('characterVault', 'alice', 'restore', { characterId: 'char_1', backupId: backup.id })).save.revision;
  assert.deepEqual(rowOf('ft_reinforce_outcrop').pending.map((u) => u.dropId), outcrop.units.map((u) => u.dropId), 'granted after that backup');
  // the device takes the restored save and sends it back: the finds come with it
  const body = await put(saved().data);
  assert.equal(body.corrected, true);
  assert.deepEqual(unitsIn(body.data).map((u) => u.dropId), outcrop.units.map((u) => u.dropId));
  assert.ok(JSON.parse(body.data[LEARNED_SKILLS_KEY]).includes('elite_placeholder_unwritten'));
  assert.deepEqual(Object.keys(JSON.parse(body.data[DISCOVERY_STATE_KEY]).claims).sort(), ['ft_reinforce_outcrop', 'ft_weathered_tablet']);
  later({ cooldown: true });
  assert.equal((await claim('ft_weathered_tablet')).result.reason, 'already_claimed', 'still found');
});

test('two first claims of a one-time find at the same moment: only one gets it', async () => {
  await fresh();
  const [a, b] = await Promise.all([claim('ft_hidden_divine_cache'), claim('ft_hidden_divine_cache')]);
  const results = [a.result, b.result];
  assert.equal(results.filter((r) => r.ok).length, 1);
  assert.equal(results.find((r) => !r.ok).reason, 'already_claimed');
  assert.equal(tables.Game3DDiscoveryClaim.filter((r) => r.discovery_id === 'ft_hidden_divine_cache').length, 1);
  const kept = await put(saveOf());
  assert.equal(unitsIn(kept.data).length, 3, 'the winner\'s units only');
});

test('list shows a character its own claims', async () => {
  await fresh();
  const found = (await claim('ft_spirit_vein')).result;
  const mine = await call('explorationDiscovery', 'alice', 'list', { characterId: 'char_1' });
  assert.deepEqual(mine.claims, [{ discovery_id: 'ft_spirit_vein', claim: found.claim, skills: [] }]);
  assert.deepEqual((await call('explorationDiscovery', 'bob', 'list', { characterId: 'char_1' })).claims, []);
});
