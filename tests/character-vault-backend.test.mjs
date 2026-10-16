// characterVault: the server's checked copy of every Game 3D character (docs/game3d/CHARACTER_VAULT.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import vm from 'node:vm';

const tables = {};
const reset = () => { for (const k of Object.keys(tables)) delete tables[k]; Object.assign(tables, { Game3DCharacterSave: [], Game3DCharacterSaveBackup: [] }); };
let seq = 0;
const entities = new Proxy({}, { get: (_, name) => ({
  filter: async (filter = {}, _sort, limit) => (tables[name] || []).filter((r) => Object.entries(filter).every(([k, v]) => r[k] === v)).slice(0, limit || undefined).map((r) => structuredClone(r)),
  get: async (id) => { const r = (tables[name] || []).find((x) => x.id === id); return r ? structuredClone(r) : null; },
  create: async (data) => { const row = { id: `${name}-${++seq}`, created_date: new Date().toISOString(), ...structuredClone(data) }; (tables[name] ||= []).push(row); return structuredClone(row); },
  update: async (id, patch) => { const r = (tables[name] || []).find((x) => x.id === id); Object.assign(r, structuredClone(patch)); return structuredClone(r); },
}) });
const users = { alice: { id: 'alice', role: 'user' }, bob: { id: 'bob', role: 'user' }, owner: { id: 'owner', role: 'admin' } };

let handler;
const source = buildSync({ entryPoints: ['base44/functions/characterVault/entry.ts'], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['npm:*'] }).outputFiles[0].text;
vm.runInNewContext(source, {
  module: { exports: {} }, exports: {}, Response, Request, Date, JSON, Number, String, Object, Array, Promise, Math, Infinity,
  console: { warn() {}, error() {}, log() {} },
  Deno: { serve: (fn) => { handler = fn; } },
  require: () => ({ createClientFromRequest: (req) => ({ auth: { me: async () => users[req.headers.get('test-user')] || null }, asServiceRole: { entities } }) }),
});
async function call(user, action, data = {}, status = 200) {
  const res = await handler(new Request('https://test.local', { method: 'POST', headers: { 'test-user': user }, body: JSON.stringify({ action, data }) }));
  const body = await res.json();
  assert.equal(res.status, status, `${action}: ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}
const hero = (level, extra = {}) => JSON.stringify({ level, xp: 0, baseStats: { strength: 3 + 3 * (level - 1), dexterity: 2, constitution: 5, focus: 2 }, unspentPoints: 0, ...extra });
const saveOf = ({ level = 10, halo = 5, silver = 5000, more = {} } = {}) => ({
  wwm_player_progression_v1: hero(level), halo_progression_v3: JSON.stringify({ level: halo }), axe_shop_state_v1: JSON.stringify({ gold: silver, inventory: {} }), ...more,
});
const row = (owner = 'alice', character = 'char_1') => tables.Game3DCharacterSave.find((r) => r.owner_id === owner && r.character_id === character);
const backupsOf = (owner = 'alice', character = 'char_1') => tables.Game3DCharacterSaveBackup.filter((b) => b.owner_id === owner && b.character_id === character);
const ageSave = (ms) => { const r = row(); r.saved_at = new Date(Date.parse(r.saved_at) - ms).toISOString(); r.last_backup_at = new Date(Date.parse(r.last_backup_at) - ms).toISOString(); };

test('the first upload is the migration: revision 1, with a backup of the browser save as it was', async () => {
  reset();
  await call('nobody', 'list', {}, 401);
  assert.equal((await call('alice', 'put', { characterId: '__default__', data: saveOf(), expectedRevision: 0 }, 400)).code, 'local_only');
  assert.equal((await call('alice', 'put', { characterId: 'char_1', data: saveOf(), expectedRevision: 3 }, 409)).code, 'conflict');
  const { save } = await call('alice', 'put', { characterId: 'char_1', data: saveOf(), expectedRevision: 0, rosterEntry: { id: 'x', name: 'Mei', appearance: { head: 'default' }, secret: 'dropped' } });
  assert.equal(save.revision, 1);
  assert.deepEqual(row().roster_entry, { id: 'char_1', name: 'Mei', appearance: { head: 'default' } }, 'only roster fields, always the character id');
  assert.deepEqual(backupsOf().map((b) => [b.reason, b.save_revision]), [['first_upload', 1]]);
  assert.deepEqual(backupsOf()[0].data, saveOf());
});

test('impossible saves are refused, with the reasons', async () => {
  reset();
  const refused = async (data, pattern) => {
    const r = await call('alice', 'put', { characterId: 'char_1', data, expectedRevision: 0 }, 422);
    assert.equal(r.code, 'rejected');
    assert.ok(r.errors.some((e) => pattern.test(e)), `${pattern} in ${JSON.stringify(r.errors)}`);
  };
  await refused(saveOf({ level: 150 }), /level 150/);
  await refused({ wwm_player_progression_v1: hero(5, { baseStats: { strength: 500, dexterity: 2, constitution: 5, focus: 2 } }) }, /attribute points at level 5/);
  await refused(saveOf({ halo: 300 }), /halo_progression_v3 level 300/);
  await refused(saveOf({ level: 50, more: { axe_ascension_v1: JSON.stringify({ ascended: true }) } }), /ascended at level 50/);
  await refused(saveOf({ more: { axe_equipment_inventory_v2: JSON.stringify({ items: [{ name: 'Cheat Blade', baseStats: { attack: 99999 } }] }) } }), /Cheat Blade: attack 99999/);
  await refused(saveOf({ silver: 2e9 }), /Silver/);
  await refused({ 'Bad Key!': '1' }, /bad key/);
  await refused({ wwm_player_progression_v1: { level: 1 } }, /must be a stored string/);
  await refused({ big_store: 'x'.repeat(400_001) }, /too large/);
  assert.equal(tables.Game3DCharacterSave.length, 0, 'nothing refused is kept');
});

test('every save must build on the revision it names; a repeat of the same save changes nothing', async () => {
  reset();
  await call('alice', 'put', { characterId: 'char_1', data: saveOf(), expectedRevision: 0 });
  const second = await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 11 }), expectedRevision: 1 });
  assert.equal(second.save.revision, 2);
  const stale = await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 12 }), expectedRevision: 1 }, 409);
  assert.equal(stale.code, 'conflict');
  assert.equal(stale.save.revision, 2, 'the conflict carries the save that won');
  assert.deepEqual(stale.save.data, saveOf({ level: 11 }));
  const again = await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 11 }), expectedRevision: 1 });
  assert.equal(again.unchanged, true, 'a lost acknowledgement is recovered, not refused');
  assert.equal(row().revision, 2);
});

test('backups: at most one an hour while playing', async () => {
  reset();
  await call('alice', 'put', { characterId: 'char_1', data: saveOf(), expectedRevision: 0 });
  await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 11 }), expectedRevision: 1 });
  await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 12 }), expectedRevision: 2 });
  assert.equal(backupsOf().length, 1, 'only the first-upload backup within the hour');
  ageSave(61 * 60 * 1000);
  await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 13 }), expectedRevision: 3 });
  assert.deepEqual(backupsOf().map((b) => [b.reason, b.save_revision]), [['first_upload', 1], ['hourly', 3]], 'the save as it stood before the overwrite');
});

test('a save that lowers the level keeps the higher save first, even within the hour', async () => {
  reset();
  await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 12 }), expectedRevision: 0 });
  await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 13 }), expectedRevision: 1 });
  const body = await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 1 }), expectedRevision: 2 });
  assert.ok(body.flags.some((f) => /level_drop: 13 -> 1/.test(f)));
  const kept = backupsOf().find((b) => b.reason === 'before_level_drop');
  assert.equal(JSON.parse(kept.data.wwm_player_progression_v1).level, 13, 'the level-13 save can be restored');
  assert.equal(row().flag_count, 1);
});

test('progress faster than play allows is kept but flagged for review', async () => {
  reset();
  await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 10, silver: 5000 }), expectedRevision: 0 });
  const fast = await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 60, silver: 900000 }), expectedRevision: 1 });
  assert.equal(fast.save.revision, 2, 'accepted');
  assert.ok(fast.flags.some((f) => f.startsWith('level_rate')) && fast.flags.some((f) => f.startsWith('silver_rate')), JSON.stringify(fast.flags));
  assert.equal(row().flag_count, 2);
  ageSave(30 * 60 * 1000);
  assert.deepEqual((await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 62, silver: 910000 }), expectedRevision: 2 })).flags, [], 'normal pace, no flags');
});

test('rollback: restore any backup, and the restore itself can be undone', async () => {
  reset();
  await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 10 }), expectedRevision: 0 });
  await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 20 }), expectedRevision: 1 });
  const { backups } = await call('alice', 'backups', { characterId: 'char_1' });
  const first = backups.find((b) => b.reason === 'first_upload');
  const restored = await call('alice', 'restore', { characterId: 'char_1', backupId: first.id });
  assert.equal(restored.save.revision, 3);
  assert.deepEqual(row().data, saveOf({ level: 10 }));
  assert.ok(backupsOf().some((b) => b.reason === 'before_restore' && b.save_revision === 2), 'the replaced save is kept');
  await call('bob', 'restore', { characterId: 'char_1', backupId: first.id }, 404); // not Bob's backup
  await call('bob', 'restore', { characterId: 'char_1', backupId: first.id, ownerId: 'alice' }, 404); // a player cannot act on another account
  const admin = await call('owner', 'restore', { characterId: 'char_1', backupId: first.id, ownerId: 'alice' });
  assert.equal(admin.save.revision, 4, 'an admin can roll back a player for support');
});

test('players see only their own characters; list carries no save data', async () => {
  reset();
  await call('alice', 'put', { characterId: 'char_1', data: saveOf(), expectedRevision: 0, rosterEntry: { name: 'Mei' } });
  await call('bob', 'put', { characterId: 'char_9', data: saveOf(), expectedRevision: 0 });
  const { saves } = await call('alice', 'list');
  assert.deepEqual(saves.map((s) => [s.character_id, s.roster_entry?.name]), [['char_1', 'Mei']]);
  assert.equal(saves[0].data, undefined);
  assert.equal((await call('alice', 'get', { characterId: 'char_9' })).save, null, "Bob's character is not Alice's");
  assert.deepEqual((await call('alice', 'get', { characterId: 'char_1' })).save.data, saveOf());
});

test('two first saves at once are reported, never silently merged', async () => {
  reset();
  await call('alice', 'put', { characterId: 'char_1', data: saveOf(), expectedRevision: 0 });
  tables.Game3DCharacterSave.push({ ...structuredClone(row()), id: 'twin' });
  assert.equal((await call('alice', 'get', { characterId: 'char_1' }, 409)).code, 'duplicate_saves');
  assert.equal((await call('alice', 'put', { characterId: 'char_1', data: saveOf({ level: 11 }), expectedRevision: 1 }, 409)).code, 'duplicate_saves');
  assert.equal(tables.Game3DCharacterSave.length, 2, 'both kept');
});
