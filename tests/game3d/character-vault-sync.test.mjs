// The browser side of character saves (docs/game3d/CHARACTER_VAULT.md): the sync engine
// against the real characterVault function, run in-process, across two "devices".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build, buildSync } from 'esbuild';
import vm from 'node:vm';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// ---- the server: the real function over in-memory tables ----
const tables = { Game3DCharacterSave: [], Game3DCharacterSaveBackup: [] };
let seq = 0;
const entities = new Proxy({}, { get: (_, name) => ({
  filter: async (f = {}, _s, limit) => (tables[name] || []).filter((r) => Object.entries(f).every(([k, v]) => r[k] === v)).slice(0, limit || undefined).map((r) => structuredClone(r)),
  get: async (id) => { const r = (tables[name] || []).find((x) => x.id === id); return r ? structuredClone(r) : null; },
  create: async (d) => { const row = { id: `${name}-${++seq}`, created_date: new Date().toISOString(), ...structuredClone(d) }; (tables[name] ||= []).push(row); return structuredClone(row); },
  update: async (id, p) => { const r = tables[name].find((x) => x.id === id); Object.assign(r, structuredClone(p)); return structuredClone(r); },
}) });
let handler;
vm.runInNewContext(buildSync({ entryPoints: ['base44/functions/characterVault/entry.ts'], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['npm:*'] }).outputFiles[0].text, {
  module: { exports: {} }, exports: {}, Response, Request, Date, JSON, Number, String, Object, Array, Promise, Math, Infinity, console: { warn() {}, error() {}, log() {} },
  Deno: { serve: (fn) => { handler = fn; } },
  require: () => ({ createClientFromRequest: (req) => ({ auth: { me: async () => ({ id: req.headers.get('test-user'), role: 'user' }) }, asServiceRole: { entities } }) }),
});
let offline = false;
const serverFor = (userId) => async (action, data) => {
  if (offline) throw Object.assign(new Error('Network Error'), { code: 'server' });
  const res = await handler(new Request('https://test.local', { method: 'POST', headers: { 'test-user': userId }, body: JSON.stringify({ action, data }) }));
  const body = await res.json();
  if (res.status >= 400) throw Object.assign(new Error(body.error), { code: body.code, status: res.status, body });
  return body;
};

// ---- the client engine ----
const temp = await mkdtemp(path.join(tmpdir(), 'axe-vault-sync-'));
await build({ entryPoints: ['src/components/game3d/character/characterVault.js'], bundle: true, format: 'esm', platform: 'neutral', outfile: path.join(temp, 'vault.mjs'), logLevel: 'silent' });
const { createCharacterVaultSync, summarizeCharacterSave } = await import(pathToFileURL(path.join(temp, 'vault.mjs')));
process.on('exit', () => { rm(temp, { recursive: true, force: true }); });

class Storage {
  constructor() { this.m = new Map(); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}
const U = 'alice', C = 'char_1';
const hero = (level, xp = 10) => JSON.stringify({ level, xp, baseStats: { strength: 3 + 3 * (level - 1), dexterity: 2, constitution: 5, focus: 2 }, unspentPoints: 0 });
const put = (s, base, value, user = U, char = C) => s.setItem(`${base}::${user}::${char}`, value);
const levelOn = (s) => JSON.parse(s.getItem(`wwm_player_progression_v1::${U}::${C}`)).level;
function device({ storage = new Storage(), user = U, character = C, roster = [] } = {}) {
  const d = { storage, reloads: 0, roster: [...roster], merged: [] };
  d.engine = createCharacterVaultSync({
    call: serverFor(user), storage,
    getIdentity: () => ({ userId: user, characterId: character }),
    reloadCharacter: () => { d.reloads++; },
    getRosterEntry: (id) => d.roster.find((c) => c.id === id) || null,
    mergeRoster: (entries) => { d.merged.push(...entries); return entries.length; },
    setTimer: () => 1, clearTimer: () => {},
  });
  return d;
}
const reset = () => { tables.Game3DCharacterSave.length = 0; tables.Game3DCharacterSaveBackup.length = 0; offline = false; };

test('first sync uploads the character: the migration, with a server backup', async () => {
  reset();
  const pc = device({ roster: [{ id: C, name: 'Mei' }] });
  put(pc.storage, 'wwm_player_progression_v1', hero(12));
  put(pc.storage, 'axe_shop_state_v1', JSON.stringify({ gold: 7000 }));
  put(pc.storage, 'halo_progression_v3', JSON.stringify({ level: 3 }), U, 'other_char'); // another character: not part of this save
  await pc.engine.start();
  assert.equal(pc.engine.get().status, 'saved');
  const saved = tables.Game3DCharacterSave[0];
  assert.deepEqual(Object.keys(saved.data).sort(), ['axe_shop_state_v1', 'wwm_player_progression_v1']);
  assert.equal(saved.roster_entry.name, 'Mei');
  assert.equal(tables.Game3DCharacterSaveBackup[0].reason, 'first_upload');
  // playing changes the save; the next check uploads it on top of revision 1
  put(pc.storage, 'wwm_player_progression_v1', hero(13));
  await pc.engine.tick();
  assert.equal(tables.Game3DCharacterSave[0].revision, 2);
  await pc.engine.tick();
  assert.equal(tables.Game3DCharacterSave[0].revision, 2, 'nothing changed, nothing sent');
});

test('a new device takes the server copy, keeps what it had in a local backup, and learns the roster', async () => {
  reset();
  const pc = device({ roster: [{ id: C, name: 'Mei' }] });
  put(pc.storage, 'wwm_player_progression_v1', hero(30));
  await pc.engine.start();
  const phone = device();
  put(phone.storage, 'wwm_player_progression_v1', hero(1, 0)); // a fresh start on the phone
  await phone.engine.start();
  assert.equal(levelOn(phone.storage), 30, 'the phone now has the level-30 character');
  assert.equal(phone.reloads, 1, 'the stores re-read the character');
  assert.equal(JSON.parse(JSON.parse(phone.storage.getItem(`axe_character_vault_local_backup::${U}::${C}`)).data.wwm_player_progression_v1).level, 1);
  assert.deepEqual(phone.merged.map((e) => e.name), ['Mei']);
});

test('a new device with no character picked yet still learns the roster, and stays local until one is picked', async () => {
  reset();
  const pc = device({ roster: [{ id: C, name: 'Mei' }] });
  put(pc.storage, 'wwm_player_progression_v1', hero(30));
  await pc.engine.start();
  const phone = device({ character: '__default__' });
  await phone.engine.start();
  assert.equal(phone.engine.get().status, 'local_only');
  assert.deepEqual(phone.merged.map((e) => e.name), ['Mei'], 'the login screen can offer the character');
  assert.equal(tables.Game3DCharacterSave.length, 1, 'the pre-character slot is never uploaded');
  const anon = device({ user: '__anon__', character: '__default__' });
  await anon.engine.start();
  assert.deepEqual(anon.merged, [], 'anonymous play asks the server nothing');
});

test('the other device played on: a device with nothing new takes the newer save quietly', async () => {
  reset();
  const pc = device(); const phone = device();
  put(pc.storage, 'wwm_player_progression_v1', hero(30));
  await pc.engine.start();
  await phone.engine.start();
  put(phone.storage, 'wwm_player_progression_v1', hero(31));
  await phone.engine.tick(); // phone saves revision 2
  await pc.engine.start(); // the PC, untouched since revision 1, opens the character again
  assert.equal(pc.engine.get().status, 'saved');
  assert.equal(levelOn(pc.storage), 31);
});

test('both devices changed: the player chooses, and the other save is kept as a backup', async () => {
  reset();
  const pc = device(); const phone = device();
  put(pc.storage, 'wwm_player_progression_v1', hero(30));
  await pc.engine.start();
  await phone.engine.start();
  put(phone.storage, 'wwm_player_progression_v1', hero(35));
  await phone.engine.tick(); // revision 2 from the phone
  put(pc.storage, 'wwm_player_progression_v1', hero(32));
  await pc.engine.tick(); // the PC tries to save on top of revision 1
  const state = pc.engine.get();
  assert.equal(state.status, 'conflict');
  assert.deepEqual([state.conflict.local.level, state.conflict.saved.level], [32, 35]);
  assert.equal(levelOn(pc.storage), 32, 'nothing is overwritten until the player chooses');
  await pc.engine.resolve('keep_device');
  assert.equal(tables.Game3DCharacterSave[0].revision, 3);
  const kept = tables.Game3DCharacterSaveBackup.find((b) => b.reason === 'before_overwrite');
  assert.ok(kept, 'the replaced server save is backed up');
  assert.equal(JSON.parse(kept.data.wwm_player_progression_v1).level, 35, "the phone's progress can be restored");
  assert.equal(levelOn(pc.storage), 32);
  // the phone, untouched since its save, now takes the PC's choice
  await phone.engine.start();
  assert.equal(levelOn(phone.storage), 32);
});

test('"use the saved copy" replaces this device and keeps its save locally', async () => {
  reset();
  const pc = device(); const phone = device();
  put(pc.storage, 'wwm_player_progression_v1', hero(30));
  await pc.engine.start(); await phone.engine.start();
  put(phone.storage, 'wwm_player_progression_v1', hero(40)); await phone.engine.tick();
  put(pc.storage, 'wwm_player_progression_v1', hero(33)); await pc.engine.tick();
  await pc.engine.resolve('use_saved');
  assert.equal(levelOn(pc.storage), 40);
  assert.equal(JSON.parse(JSON.parse(pc.storage.getItem(`axe_character_vault_local_backup::${U}::${C}`)).data.wwm_player_progression_v1).level, 33);
});

test('a save the server refuses stays on the device and is not resent until it changes', async () => {
  reset();
  const pc = device();
  put(pc.storage, 'wwm_player_progression_v1', hero(150));
  await pc.engine.start();
  assert.equal(pc.engine.get().status, 'rejected');
  assert.ok(pc.engine.get().errors.some((e) => /level 150/.test(e)));
  assert.equal(levelOn(pc.storage), 150, 'the device keeps it');
  await pc.engine.tick();
  assert.equal(tables.Game3DCharacterSave.length, 0);
  put(pc.storage, 'wwm_player_progression_v1', hero(40));
  await pc.engine.tick();
  assert.equal(pc.engine.get().status, 'saved');
});

test('offline: play goes on, the save waits; this device only, for anonymous play and the pre-character slot', async () => {
  reset();
  offline = true;
  const pc = device();
  put(pc.storage, 'wwm_player_progression_v1', hero(20));
  await pc.engine.start();
  assert.equal(pc.engine.get().status, 'offline');
  assert.equal(levelOn(pc.storage), 20);
  offline = false;
  for (const d of [device({ user: '__anon__' }), device({ character: '__default__' })]) {
    await d.engine.start();
    assert.equal(d.engine.get().status, 'local_only');
  }
  assert.equal(tables.Game3DCharacterSave.length, 0);
});

test('summaries name the level, Silver and items', () => {
  assert.deepEqual(summarizeCharacterSave({ wwm_player_progression_v1: hero(7), axe_shop_state_v1: JSON.stringify({ gold: 123 }), axe_equipment_inventory_v2: JSON.stringify({ items: [{}, {}] }) }), { level: 7, silver: 123, items: 2 });
});
