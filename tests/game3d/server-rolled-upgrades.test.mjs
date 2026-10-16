// The Services gateway with the server's dice (docs/game3d/SERVER_UPGRADES.md), over the real
// stores: the game rolls on the server's record with the server's roll, pays as before, and
// keeps the server's result; a refused attempt never reaches the server.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), 'axe-server-dice-'));
const dom = new JSDOM('', { url: 'http://localhost/', virtualConsole: new VirtualConsole() });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent });
const intervals = [];
const nativeSetInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const timer = nativeSetInterval(...args); intervals.push(timer); return timer; };
localStorage.setItem('wwm_storage_user_v1', 'dice');
localStorage.setItem('wwm_character_active_v1::dice', 'char_d');
const modules = {
  gateway: 'axe/services/AXEServiceTransactionGateway.js', ench: 'equipment/enchantmentStore.jsx',
  adv: 'axe/equipment/AXEItemAdvancementStore.js', inv: 'axe/equipment/AXEEquipmentInventoryStore.js', loot: 'lootStore.jsx',
  vault: 'character/characterVault.js',
};
await build({ stdin: { contents: Object.entries(modules).map(([name, file]) =>
  `export * as ${name} from './src/components/game3d/${file}';`).join('\n'), resolveDir: root },
  bundle: true, jsx: 'automatic', format: 'esm', platform: 'node', outfile: path.join(temp, 'stores.mjs'),
  alias: { '@': path.join(root, 'src') }, define: { 'import.meta.env': '{}' },
  plugins: [{ name: 'offline-service-boundary', setup(b) {
    b.onResolve({ filter: /api\/base44Client/ }, () => ({ path: 'base44-test', namespace: 'offline' }));
    b.onLoad({ filter: /.*/, namespace: 'offline' }, () => ({ contents:
      'export const base44 = { auth: { updateMe: async () => ({}), me: async () => ({}) } };' }));
  } }], logLevel: 'silent',
});
const { gateway, ench, adv, inv, loot, vault } = await import(pathToFileURL(path.join(temp, 'stores.mjs')));
after(async () => { gateway.setAXEServiceDiceSource(null); intervals.forEach(clearInterval); globalThis.setInterval = nativeSetInterval; dom.window.close(); await rm(temp, { recursive: true, force: true }); });

let n = 0;
const sword = () => {
  const instanceId = `dice_sword_${++n}`;
  const added = inv.addAXEEquipmentItem({ id: 'dice_sword', instanceId, name: 'Test Sword', category: 'weapon', slot: 'weapon', rarity: 'legendary' });
  assert.ok(added.ok, JSON.stringify(added));
  return instanceId;
};
const materials = (id) => loot.getLootItemCount(id, 'material');
const serverAnswers = (answer) => { const asked = []; gateway.setAXEServiceDiceSource(async (req) => { asked.push(req); return typeof answer === 'function' ? answer(req) : answer; }); return asked; };

test("reinforcement rolls on the server's record with the server's roll, and pays as before", async () => {
  const id = sword();
  loot.grantLootItemById('mat_reinforce', 10);
  const stones = materials('mat_reinforce');
  // the server holds 40% for this sword (another device upgraded it); the browser shows 0%
  const asked = serverAnswers({ ok: true, result: { ok: true, outcome: 'success', roll: 0.01, before: { percent: 40 }, after: { percent: 45 } } });
  const result = await gateway.executeAXEServiceTransaction('reinforcement', { itemId: id });
  assert.deepEqual([result.ok, result.outcome, result.serverRolled], [true, 'success', true]);
  assert.equal(ench.getItemReinforcement(id).percent, 45);
  assert.equal(materials('mat_reinforce'), stones - 3, 'the cost of an attempt at 40%');
  assert.equal(asked.length, 1);
  assert.equal(asked[0].serviceId, 'reinforcement');
  assert.ok(asked[0].transactionId, 'each attempt has its own id, so a retry is never a second roll');
});

test("the server's result is the item's, whatever the game computes here", async () => {
  const id = sword();
  loot.grantLootItemById('mat_over_enchant', 10);
  // with roll 0.01 the game alone would succeed (level 7); the server's record says fracture
  serverAnswers({ ok: true, result: { ok: false, outcome: 'fracture', roll: 0.01, before: { level: 6, fractured: false }, after: { level: 5, fractured: true } } });
  const result = await gateway.executeAXEServiceTransaction('over_enchant', { itemId: id });
  assert.deepEqual([result.ok, result.outcome], [false, 'fracture']);
  assert.deepEqual(ench.getItemOverEnchant(id), { level: 5, fractured: true });
});

test('a refine the server says destroyed the item removes it here too', async () => {
  const id = sword();
  loot.grantLootItemById('mat_reinforce', 20);
  serverAnswers({ ok: true, result: { ok: false, outcome: 'destroyed', destroyed: true, roll: 0.999, before: { level: 12 }, after: { level: 12, destroyed: true } } });
  const result = await gateway.executeAXEServiceTransaction('refine', { itemId: id });
  assert.equal(result.destroyed, true);
  assert.equal(inv.getAXEEquipmentItem(id), null);
});

test('starter items that live only in memory are written before the server is asked', async () => {
  const id = sword();
  loot.grantLootItemById('mat_reinforce', 5);
  const key = 'axe_equipment_inventory_v2::dice::char_d';
  localStorage.removeItem(key); // as for a new character: the inventory was never written
  let seen = null;
  serverAnswers(() => { seen = (JSON.parse(localStorage.getItem(key) || '{"items":[]}').items || []).some((i) => i.instanceId === id); return { ok: false, reason: 'upgrades_need_a_server_connection' }; });
  await gateway.executeAXEServiceTransaction('reinforcement', { itemId: id });
  assert.equal(seen, true, 'the save the server receives holds the item');
});

test('an attempt the game refuses anyway never reaches the server; a server refusal changes nothing', async () => {
  const id = sword();
  const asked = serverAnswers({ ok: true, result: { ok: true, outcome: 'success', roll: 0.01, before: { level: 0, fractured: false }, after: { level: 1, fractured: false } } });
  const catalysts = materials('mat_over_enchant');
  loot.consumeLootItemById('mat_over_enchant', catalysts, 'material');
  const broke = await gateway.executeAXEServiceTransaction('over_enchant', { itemId: id });
  assert.equal(broke.reason, 'insufficient_materials');
  assert.equal(asked.length, 0, 'no roll spent on an attempt the player cannot pay for');

  loot.grantLootItemById('mat_over_enchant', 5);
  serverAnswers({ ok: false, reason: 'upgrades_need_a_server_connection' });
  const offline = await gateway.executeAXEServiceTransaction('over_enchant', { itemId: id });
  assert.deepEqual([offline.ok, offline.reason], [false, 'upgrades_need_a_server_connection']);
  assert.equal(materials('mat_over_enchant'), 5, 'nothing paid');
  assert.deepEqual(ench.getItemOverEnchant(id), { level: 0, fractured: false });
});

test('a character kept on this device rolls here, as before; other services never ask the server', async () => {
  const id = sword();
  loot.grantLootItemById('mat_reinforce', 5);
  const asked = serverAnswers({ local: true });
  const result = await gateway.executeAXEServiceTransaction('reinforcement', { itemId: id, options: { roll: 0.01 } });
  assert.deepEqual([result.ok, result.serverRolled], [true, undefined]);
  assert.equal(ench.getItemReinforcement(id).percent, 5);
  loot.grantLootItemById('evo_upgrade_stone', 3);
  await gateway.executeAXEServiceTransaction('stage', { itemId: id });
  assert.equal(asked.length, 1, 'stage is not a rolled upgrade');
});

test('the server dice: waits for the save, retries once after saving, maps refusals', async () => {
  const states = { status: 'saved' };
  let flushes = 0;
  const engine = { get: () => states, flush: async () => { flushes++; return true; } };
  const calls = [];
  let answers = [];
  const dice = vault.createServerDice(engine, {
    call: async (fn, action, data) => { calls.push([fn, action, data]); const next = answers.shift(); if (next instanceof Error) throw next; return next; },
    getIdentity: () => ({ userId: 'dice', characterId: 'char_d' }),
    wait: async () => {},
  });
  const coded = (code) => Object.assign(new Error(code), { code });
  answers = [coded('not_synced'), { result: { ok: true, roll: 0.2 } }];
  const ok = await dice({ serviceId: 'refine', itemId: 'x', transactionId: 't' });
  assert.deepEqual([ok.ok, ok.result.roll, flushes, calls.length], [true, 0.2, 2, 2]);
  assert.deepEqual(calls[0], ['itemUpgrade', 'roll', { characterId: 'char_d', serviceId: 'refine', itemId: 'x', protectedAttempt: undefined, transactionId: 't' }]);
  answers = [coded('not_synced'), coded('not_synced')];
  assert.equal((await dice({ serviceId: 'refine', itemId: 'x' })).reason, 'saving_your_character_try_again');
  answers = [coded('server')];
  assert.equal((await dice({ serviceId: 'refine', itemId: 'x' })).reason, 'upgrades_need_a_server_connection');
  answers = [coded('local_only')];
  assert.deepEqual(await dice({ serviceId: 'refine', itemId: 'x' }), { local: true });
  states.status = 'conflict';
  assert.equal((await dice({ serviceId: 'refine', itemId: 'x' })).reason, 'choose_which_save_to_keep_first');
  states.status = 'local_only';
  assert.deepEqual(await dice({ serviceId: 'refine', itemId: 'x' }), { local: true });
});
