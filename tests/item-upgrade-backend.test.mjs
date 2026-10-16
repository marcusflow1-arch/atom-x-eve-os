// itemUpgrade + characterVault: the server rolls risky item upgrades and every save keeps
// the server's result (docs/game3d/SERVER_UPGRADES.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import vm from 'node:vm';

const tables = {};
const reset = () => { for (const k of Object.keys(tables)) delete tables[k]; Object.assign(tables, { Game3DCharacterSave: [], Game3DCharacterSaveBackup: [], Game3DItemUpgrade: [] }); };
let seq = 0;
const entities = new Proxy({}, { get: (_, name) => ({
  filter: async (filter = {}, _sort, limit) => (tables[name] || []).filter((r) => Object.entries(filter).every(([k, v]) => r[k] === v)).reverse().slice(0, limit || undefined).map((r) => structuredClone(r)),
  get: async (id) => { const r = (tables[name] || []).find((x) => x.id === id); return r ? structuredClone(r) : null; },
  create: async (data) => { const row = { id: `${name}-${++seq}`, created_date: new Date().toISOString(), ...structuredClone(data) }; (tables[name] ||= []).push(row); return structuredClone(row); },
  update: async (id, patch) => { const r = (tables[name] || []).find((x) => x.id === id); Object.assign(r, structuredClone(patch)); return structuredClone(r); },
}) });
const users = { alice: { id: 'alice', role: 'user' }, bob: { id: 'bob', role: 'user' } };
let nextRoll = 0.5; // the server's dice, fixed for each test
const handlers = {};
for (const fn of ['itemUpgrade', 'characterVault']) {
  const source = buildSync({ entryPoints: [`base44/functions/${fn}/entry.ts`], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['npm:*'] }).outputFiles[0].text;
  vm.runInNewContext(source, {
    module: { exports: {} }, exports: {}, Response, Request, Date, JSON, Number, String, Object, Array, Promise, Math, Infinity, Set, Map,
    crypto: { getRandomValues: (a) => { a[0] = Math.min(2 ** 32 - 1, Math.floor(nextRoll * 2 ** 32)); return a; } },
    console: { warn() {}, error() {}, log() {} },
    Deno: { serve: (h) => { handlers[fn] = h; } },
    require: () => ({ createClientFromRequest: (req) => ({ auth: { me: async () => users[req.headers.get('test-user')] || null }, asServiceRole: { entities } }) }),
  });
}
async function call(fn, user, action, data = {}, status = 200) {
  const res = await handlers[fn](new Request('https://test.local', { method: 'POST', headers: { 'test-user': user }, body: JSON.stringify({ action, data }) }));
  const body = await res.json();
  assert.equal(res.status, status, `${fn} ${action}: ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}
const roll = (data, status, user = 'alice') => call('itemUpgrade', user, 'roll', { characterId: 'char_1', ...data }, status);
const ageRolls = () => tables.Game3DItemUpgrade.forEach((r) => { r.rolled_at = new Date(Date.now() - 5000).toISOString(); });

const hero = (level) => JSON.stringify({ level, xp: 0, baseStats: { strength: 3 + 3 * (level - 1), dexterity: 2, constitution: 5, focus: 2 }, unspentPoints: 0 });
const ADV = { combine: { count: 0 }, stage: { rank: 0, id: 'stage_0', label: 'Base' }, refine: { level: 0 }, ultimate: { level: 0, sealed: false } };
const saveOf = ({ reinforcement = { sword_1: { percent: 75 } }, overEnchant = {}, advancement = { sword_1: { ...ADV, refine: { level: 12 } } }, items } = {}) => ({
  wwm_player_progression_v1: hero(20),
  axe_equipment_inventory_v2: JSON.stringify({ items: items || [{ instanceId: 'sword_1', id: 'sword', rarity: 'legendary', category: 'weapon' }, { instanceId: 'ring_1', id: 'ring', rarity: 'rare', category: 'ring' }], activeWeaponInstanceId: 'sword_1' }),
  axe_reinforcement_v1: JSON.stringify(reinforcement),
  axe_over_enchant_v1: JSON.stringify(overEnchant),
  axe_item_advancement_v2: JSON.stringify(advancement),
});
const saved = () => tables.Game3DCharacterSave.find((r) => r.character_id === 'char_1' && r.owner_id === 'alice');
let revision = 0;
const put = async (data, extra = {}) => { const body = await call('characterVault', 'alice', 'put', { characterId: 'char_1', data, expectedRevision: revision, ...extra }); revision = body.save.revision; return body; };
const fresh = async (data = saveOf()) => { reset(); revision = 0; nextRoll = 0.5; await put(data); };
const recordIn = (data, key, id) => JSON.parse(data[key])[id];

test('the server rolls only on a character it holds, item included', async () => {
  reset(); revision = 0;
  assert.equal((await roll({ serviceId: 'reinforcement', itemId: 'sword_1' }, 409)).code, 'not_synced');
  await put(saveOf());
  assert.equal((await roll({ serviceId: 'reinforcement', itemId: 'lost_item' }, 409)).code, 'not_synced', 'an item the server has not seen yet');
  assert.equal((await roll({ serviceId: 'stage', itemId: 'sword_1' }, 400)).code, 'invalid', 'only the four risky upgrades');
  assert.equal((await call('itemUpgrade', 'alice', 'roll', { characterId: '__default__', serviceId: 'refine', itemId: 'sword_1' }, 400)).code, 'local_only');
  assert.equal((await roll({ serviceId: 'reinforcement', itemId: 'sword_1' }, 409, 'bob')).code, 'not_synced', "bob's own char_1, not alice's");
});

test("the game's rules with the server's roll: success, and a failure that downgrades", async () => {
  await fresh();
  nextRoll = 0.01;
  const up = (await roll({ serviceId: 'reinforcement', itemId: 'sword_1' })).result;
  assert.deepEqual([up.ok, up.outcome, up.before.percent, up.after.percent], [true, 'success', 75, 80]);
  ageRolls();
  nextRoll = 0.999;
  const down = (await roll({ serviceId: 'reinforcement', itemId: 'sword_1' })).result;
  assert.deepEqual([down.ok, down.outcome, down.before.percent, down.after.percent], [false, 'downgrade', 80, 75], 'rolled on the server record (80), not the save (75)');
  ageRolls();
  const kept = (await roll({ serviceId: 'reinforcement', itemId: 'sword_1', protectedAttempt: true })).result;
  assert.equal(kept.outcome, 'protected');
  const row = tables.Game3DItemUpgrade.find((r) => r.item_id === 'sword_1' && r.service === 'reinforcement');
  assert.deepEqual([row.record.percent, row.attempts], [75, 3]);
});

test('a save that undoes a bad roll, or adds levels, keeps the server result instead', async () => {
  await fresh();
  nextRoll = 0.999;
  await roll({ serviceId: 'reinforcement', itemId: 'sword_1' }); // 75 -> 70
  // the browser save from before the roll is put back (a reload): the downgrade stays
  const undone = await put(saveOf({ reinforcement: { sword_1: { percent: 75 } }, overEnchant: { ring_1: { level: 1, fractured: false } } }));
  assert.equal(undone.corrected, true);
  assert.equal(recordIn(undone.data, 'axe_reinforcement_v1', 'sword_1').percent, 70);
  assert.equal(recordIn(saved().data, 'axe_reinforcement_v1', 'sword_1').percent, 70, 'the server keeps the corrected save');
  assert.equal(recordIn(undone.data, 'axe_over_enchant_v1', 'ring_1').level, 0, 'an over-enchant no server rolled is not kept either');
  assert.ok(saved().flags.some((f) => /^upgrade_corrected: 2/.test(f)));
  // the device then sends the save as kept: nothing more to correct
  const settled = await put(undone.data);
  assert.equal(settled.corrected, undefined);
  assert.equal(settled.unchanged, true);
  // the same undo again, after a reload: put right to the kept save, and still recorded
  const flagsBefore = saved().flag_count;
  const again = await put({ ...saved().data, axe_reinforcement_v1: JSON.stringify({ sword_1: { percent: 75 } }) });
  assert.deepEqual([again.unchanged, again.corrected], [true, true]);
  assert.equal(recordIn(again.data, 'axe_reinforcement_v1', 'sword_1').percent, 70);
  assert.equal(saved().flag_count, flagsBefore + 1);
});

test('without a server roll, an upgrade cannot appear and a penalty cannot be deleted', async () => {
  await fresh(saveOf({ overEnchant: { ring_1: { level: 5, fractured: true } } }));
  const body = await put(saveOf({ reinforcement: { sword_1: { percent: 75 }, ring_1: { percent: 50 } }, overEnchant: {} }));
  assert.equal(body.corrected, true);
  assert.equal(recordIn(body.data, 'axe_reinforcement_v1', 'ring_1').percent, 0);
  assert.deepEqual(recordIn(body.data, 'axe_over_enchant_v1', 'ring_1'), { level: 5, fractured: true }, 'the fracture comes back');
});

test('an item the server destroyed leaves the inventory and cannot be rolled again', async () => {
  await fresh();
  nextRoll = 0.999;
  const gone = (await roll({ serviceId: 'refine', itemId: 'sword_1' })).result;
  assert.deepEqual([gone.outcome, gone.destroyed], ['destroyed', true]);
  const body = await put(saveOf()); // the save still has the sword
  const inventory = JSON.parse(body.data.axe_equipment_inventory_v2);
  assert.deepEqual(inventory.items.map((i) => i.instanceId), ['ring_1']);
  assert.equal(inventory.activeWeaponInstanceId, null);
  ageRolls();
  assert.equal((await roll({ serviceId: 'reinforcement', itemId: 'sword_1' }, 409)).code, 'item_destroyed');
});

test('a retried attempt gets the same answer, never a second roll; rolls are paced', async () => {
  await fresh();
  nextRoll = 0.01;
  const first = await roll({ serviceId: 'over_enchant', itemId: 'ring_1', transactionId: 'tx-1' });
  nextRoll = 0.999;
  const again = await roll({ serviceId: 'over_enchant', itemId: 'ring_1', transactionId: 'tx-1' });
  assert.equal(again.repeated, true);
  assert.deepEqual(again.result, first.result);
  assert.equal(tables.Game3DItemUpgrade.find((r) => r.item_id === 'ring_1').attempts, 1);
  assert.equal((await roll({ serviceId: 'over_enchant', itemId: 'ring_1', transactionId: 'tx-2' }, 429)).code, 'too_fast');
});

test('nothing is rolled at the cap or on an item that cannot take the upgrade', async () => {
  await fresh(saveOf({ overEnchant: { sword_1: { level: 10, fractured: false } } }));
  assert.equal((await roll({ serviceId: 'over_enchant', itemId: 'sword_1' })).result.reason, 'max_over_enchant');
  assert.equal((await roll({ serviceId: 'ultimate', itemId: 'ring_1' })).result.reason, 'RARITY_NOT_ELIGIBLE', 'the server reads the rarity from its own copy');
  assert.equal(tables.Game3DItemUpgrade.length, 0);
});

test('restoring a backup brings the items back as they were, and the server keeps them so', async () => {
  await fresh();
  nextRoll = 0.999;
  await roll({ serviceId: 'refine', itemId: 'sword_1' }); // destroyed
  await put(saveOf());
  const first = tables.Game3DCharacterSaveBackup.find((b) => b.reason === 'first_upload');
  const restored = await call('characterVault', 'alice', 'restore', { characterId: 'char_1', backupId: first.id });
  revision = restored.save.revision;
  assert.equal(tables.Game3DItemUpgrade.find((r) => r.service === 'refine').record.destroyed, undefined);
  const body = await put({ ...saveOf(), wwm_player_progression_v1: hero(21) });
  assert.equal(body.corrected, undefined, 'the restored sword and its refine 12 stand');
  assert.equal(JSON.parse(saved().data.axe_equipment_inventory_v2).items.length, 2);
});
