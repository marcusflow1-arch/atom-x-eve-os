import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const temp = await mkdtemp(path.join(tmpdir(), 'companion-save-'));
const root = process.cwd();
const dom = new JSDOM('', { url: 'http://localhost/' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage });
await build({ stdin: { contents: `
  export { createCompanionStore } from './src/components/game3d/companion/store';
  export { createCompanionCloud } from './src/components/game3d/companion/cloud';
  export * as storage from './src/components/game3d/characterStorage';
  export * as companion from './src/components/game3d/companionStore';
  export * as fusion from './src/components/game3d/equipment/companionFusionStore';`, resolveDir: root },
  bundle: true, format: 'esm', platform: 'node', outfile: path.join(temp, 'stores.mjs'),
  alias: { '@': path.join(root, 'src') }, plugins: [{ name: 'test-auth', setup(b) {
    b.onResolve({ filter: /api\/base44Client/ }, () => ({ path: 'test', namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const base44 = { auth: { me: async () => ({}) } };' }));
  } }], logLevel: 'silent' });
const { createCompanionStore, createCompanionCloud, storage, companion, fusion } = await import(pathToFileURL(path.join(temp, 'stores.mjs')));
after(async () => { dom.window.close(); await rm(temp, { recursive: true, force: true }); });
const clone = v => structuredClone(v);
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const loadout = (saddle = 'racing_saddle') => ({ activeCompanionId: 'shadow_wolf', gear: { shadow_wolf: { saddle } } });
const row = (character = 'A', saddle = 'racing_saddle', revision = 1) => ({ id: `row-${character}`, owner_id: 'alice', character_id: character, revision, loadout: loadout(saddle) });
function api() {
  const b = { user: 'alice', rows: [], calls: [], beforeRead: null, beforeWrite: null, legacy: null };
  b.client = { auth: { me: async () => ({ id: b.user, companion_state: b.legacy }) }, entities: { Game3DCompanionLoadout: {
    async filter(query) {
      b.calls.push(['read', clone(query)]); if (b.beforeRead) await b.beforeRead();
      return clone(b.rows.filter(r => Object.entries(query).every(([k, v]) => r[k] === v)));
    },
    async create(data) {
      b.calls.push(['create', clone(data)]); if (b.beforeWrite) await b.beforeWrite();
      const r = { id: `row-${b.rows.length}`, ...clone(data) }; b.rows.push(r); return clone(r);
    },
    async updateMany(query, update) {
      b.calls.push(['update', clone(query), clone(update)]); if (b.beforeWrite) await b.beforeWrite();
      const r = b.rows.find(r => Object.entries(query).every(([k, v]) => r[k] === v));
      if (!r) return { success: true, updated: 0 };
      Object.assign(r, clone(update.$set)); r.revision += update.$inc.revision;
      return { success: true, updated: 1 };
    },
  } } };
  return b;
}
function harness(t, backend = api(), initial = null) {
  let selected = { userId: 'alice', characterId: 'A' }, change;
  const records = new Map(initial ? [['alice/A', JSON.stringify(initial)]] : []);
  const h = { backend, records, blocked: false }, key = () => `${selected.userId}/${selected.characterId}`;
  h.store = createCompanionStore({
    storage: { get: () => records.get(key()) || null, setChecked: value => { if (h.blocked) return false; records.set(key(), value); return true; } },
    scope: () => selected, onScopeChange: fn => { change = fn; return () => {}; }, cloud: createCompanionCloud(backend.client), delay: 100000,
  });
  h.select = (characterId, userId = selected.userId) => { selected = { characterId, userId }; change(); };
  h.saved = (k = key()) => JSON.parse(records.get(k) || 'null');
  t.after(() => h.store.dispose()); return h;
}

test('characters and accounts have separate gear; mount state is transient', async t => {
  const h = harness(t); await h.store.sync();
  h.store.equip('shadow_wolf', 'saddle', 'racing_saddle'); h.store.setMounted(true); await h.store.sync();
  h.select('B'); await h.store.sync(); assert.deepEqual(h.store.getState().gear, {}); assert.equal(h.store.getState().isMounted, false);
  h.store.equip('shadow_wolf', 'saddle', 'royal_saddle'); await h.store.sync();
  h.select('A'); await h.store.sync(); assert.equal(h.store.getState().gear.shadow_wolf.saddle, 'racing_saddle');
  h.backend.user = 'bob'; h.select('A', 'bob'); await h.store.sync(); assert.deepEqual(h.store.getState().gear, {});
  assert.deepEqual(h.backend.rows.map(r => [r.owner_id, r.character_id, r.loadout.gear.shadow_wolf.saddle]),
    [['alice', 'A', 'racing_saddle'], ['alice', 'B', 'royal_saddle']]);
});
test('old hydration cannot apply to a newly-selected character', async t => {
  const b = api(), wait = deferred(); b.rows = [row()]; b.beforeRead = () => wait.promise;
  const h = harness(t, b), old = h.store.sync(); await tick();
  b.beforeRead = null; h.select('B'); await h.store.sync(); wait.resolve(); await old;
  assert.deepEqual(h.store.getState().gear, {}); assert.equal(h.saved('alice/B'), null);
});
test('edits during hydration survive and require conflict resolution', async t => {
  const b = api(), wait = deferred(); b.rows = [row('A', 'royal_saddle')]; b.beforeRead = () => wait.promise;
  const h = harness(t, b), pending = h.store.sync(); await tick();
  h.store.equip('shadow_wolf', 'saddle', 'racing_saddle'); b.beforeRead = null; wait.resolve(); await pending; await h.store.sync();
  assert.equal(h.store.getState().gear.shadow_wolf.saddle, 'racing_saddle');
  assert.equal(h.store.getState().sync.phase, 'conflict'); assert.equal(b.rows[0].revision, 1);
  await h.store.sync('device'); assert.equal(b.rows[0].loadout.gear.shadow_wolf.saddle, 'racing_saddle');
  assert.equal(h.saved().dirty, false); assert.equal(b.rows[0].revision, 2);
});
test('explicit cloud choice replaces current equipment without another cloud write', async t => {
  const b = api(); b.rows = [row('A', 'royal_saddle')];
  const h = harness(t, b, loadout()); await h.store.sync(); assert.equal(h.store.getState().sync.phase, 'conflict');
  await h.store.sync('cloud'); assert.equal(h.store.getState().gear.shadow_wolf.saddle, 'royal_saddle');
  assert.equal(h.saved().dirty, false); assert.equal(b.rows[0].revision, 1);
});
test('rapid edits during a write inherit its acknowledged revision', async t => {
  const b = api(); b.rows = [row()]; const h = harness(t, b); await h.store.sync();
  h.store.equip('shadow_wolf', 'saddle', 'royal_saddle');
  const wait = deferred(); b.beforeWrite = () => wait.promise; const pending = h.store.sync(); await tick();
  h.store.equip('shadow_wolf', 'charm', 'wind_amulet'); wait.resolve(); await pending;
  assert.equal(h.saved().dirty, true); assert.equal(h.saved().cloud.revision, 2);
  b.beforeWrite = null; await h.store.sync(); assert.equal(b.rows[0].revision, 3);
  assert.equal(b.rows[0].loadout.gear.shadow_wolf.charm, 'wind_amulet');
});
test('in-flight write remains attached to original character after switch', async t => {
  const b = api(); b.rows = [row()]; const h = harness(t, b); await h.store.sync();
  h.store.equip('shadow_wolf', 'saddle', 'royal_saddle');
  const wait = deferred(); b.beforeWrite = () => wait.promise; const pending = h.store.sync(); await tick();
  b.beforeWrite = null; h.select('B'); await h.store.sync(); wait.resolve(); await pending;
  assert.equal(b.rows[0].character_id, 'A'); assert.equal(b.rows[0].loadout.gear.shadow_wolf.saddle, 'royal_saddle');
  assert.deepEqual(h.store.getState().gear, {}); assert.equal(h.saved('alice/B'), null);
  h.select('A'); await h.store.sync(); assert.equal(h.saved().dirty, false);
});
test('wrong authenticated account cannot access the selected namespace', async t => {
  const b = api(); b.user = 'bob'; const h = harness(t, b, loadout()); await h.store.sync();
  assert.equal(b.calls.length, 0); assert.match(h.store.getState().sync.message, /Sign in/);
});
test('quota failure does not equip or queue writes; mounting and retry still work', async t => {
  const h = harness(t); await h.store.sync(); const before = h.store.getState().gear;
  h.blocked = true; assert.equal(h.store.equip('shadow_wolf', 'saddle', 'royal_saddle').ok, false);
  assert.deepEqual(h.store.getState().gear, before); assert.equal(h.store.getState().sync.phase, 'save-error');
  h.store.setMounted(true); assert.equal(h.store.getState().isMounted, true);
  assert.equal(h.backend.calls.filter(c => c[0] !== 'read').length, 0);
  h.blocked = false; assert.equal(h.store.equip('shadow_wolf', 'saddle', 'royal_saddle').ok, true);
  await h.store.sync(); assert.equal(h.saved().dirty, false);
});
test('invalid gear is rejected; snapshots and subscriber data are detached', async t => {
  const h = harness(t); await h.store.sync();
  assert.equal(h.store.equip('shadow_wolf', 'armor', 'royal_saddle').reason, 'INVALID_GEAR');
  assert.equal(h.store.equip('__proto__', 'saddle', 'royal_saddle').ok, false); assert.equal(h.store.setActive('unknown').ok, false);
  h.store.equip('shadow_wolf', 'saddle', 'racing_saddle');
  h.store.subscribe(s => { s.gear.shadow_wolf.saddle = 'royal_saddle'; });
  const s = h.store.getState(); s.gear.shadow_wolf.saddle = 'unknown';
  assert.equal(h.store.getState().gear.shadow_wolf.saddle, 'racing_saddle');
});
test('offline keeps dirty local data; retry syncs it', async t => {
  const b = api(); b.beforeRead = () => { throw new Error('offline'); };
  const h = harness(t, b); await h.store.sync(); h.store.equip('shadow_wolf', 'saddle', 'racing_saddle');
  await h.store.sync(); assert.equal(h.saved().dirty, true); assert.equal(h.store.getState().sync.phase, 'error');
  b.beforeRead = null; await h.store.sync(); assert.equal(h.saved().dirty, false);
});
test('revision conflict cannot overwrite another device; lost acknowledgement retries once', async t => {
  const b = api(); b.rows = [row()]; const h = harness(t, b); await h.store.sync(); h.store.equip('shadow_wolf', 'saddle', 'royal_saddle');
  b.beforeWrite = () => { b.rows[0].revision++; b.beforeWrite = null; };
  await h.store.sync(); assert.equal(h.store.getState().sync.phase, 'conflict');
  assert.equal(b.rows[0].loadout.gear.shadow_wolf.saddle, 'racing_saddle');
  const update = b.client.entities.Game3DCompanionLoadout.updateMany;
  b.client.entities.Game3DCompanionLoadout.updateMany = async (...args) => { await update(...args); throw new Error('ack lost'); };
  await h.store.sync('device'); assert.equal(h.saved().dirty, true); const revision = b.rows[0].revision;
  await h.store.sync(); assert.equal(h.saved().dirty, false); assert.equal(b.rows[0].revision, revision);
});
test('duplicate remote records are surfaced and never deleted or merged', async t => {
  const b = api(); b.rows = [row(), { ...row(), id: 'duplicate' }]; const h = harness(t, b, loadout()); await h.store.sync();
  assert.match(h.store.getState().sync.message, /Multiple cloud saves/);
  assert.equal(b.calls.filter(c => c[0] !== 'read').length, 0); assert.equal(h.saved().dirty, true);
});
test('account-wide legacy cloud preferences import only into Dev Test', async t => {
  const b = api(); b.legacy = loadout('royal_saddle'); const h = harness(t, b); await h.store.sync();
  assert.deepEqual(h.store.getState().gear, {}); h.select('__dev_test__'); await h.store.sync();
  assert.equal(h.store.getState().gear.shadow_wolf.saddle, 'royal_saddle'); assert.equal(b.rows[0].character_id, '__dev_test__');
});
test('mount toggles neither persist nor change cloud revisions', async t => {
  const b = api(); b.rows = [row()]; const h = harness(t, b); await h.store.sync();
  const saved = h.saved(); h.store.setMounted(true); h.store.setMounted(false);
  assert.deepEqual(h.saved(), saved); assert.equal(b.rows[0].revision, 1);
});
test('actual singleton and Gear UI share equipment; migration is owner/Dev-Test only', () => {
  localStorage.setItem('wwm_companion_fusion_v1', JSON.stringify({ activeCompanionId: 'shadow_wolf', equippedGear: { saddle: 'royal_saddle' } }));
  localStorage.setItem('wwm_legacy_owner_user_v1', 'legacy-owner');
  localStorage.setItem('wwm_character_active_v1::legacy-owner', '__dev_test__'); storage.setStorageUser('legacy-owner');
  assert.equal(companion.getCompanionState().gear.shadow_wolf.saddle, 'royal_saddle'); assert.equal(fusion.getFusionState().equippedGear.saddle, 'royal_saddle');
  fusion.equipCompanionGear('charm', 'wind_amulet'); assert.equal(companion.getCompanionState().gear.shadow_wolf.charm, 'wind_amulet');
  assert.equal(companion.getEffectiveSpeedMultiplier(), 2.15);
  companion.unequipCompanionGear('shadow_wolf', 'saddle'); assert.equal(fusion.getFusionState().equippedGear.saddle, null);
  storage.notifyCharacterChange(); assert.equal(fusion.getFusionState().equippedGear.saddle, null);
  localStorage.setItem('wwm_character_active_v1::other-owner', '__dev_test__'); storage.setStorageUser('other-owner');
  assert.deepEqual(companion.getCompanionState().gear, {}); storage.setStorageUser(null);
});
test('entity declares owner-only operations and immutable owner/character identity', async () => {
  const schema = JSON.parse(await readFile('base44/entities/game3-d-companion-loadout.jsonc', 'utf8'));
  for (const op of ['read', 'create', 'update']) assert.deepEqual(schema.rls[op], { 'data.owner_id': '{{user.id}}' });
  assert.equal(schema.rls.delete, false); assert.equal(schema.properties.owner_id.rls.update, false); assert.equal(schema.properties.character_id.rls.update, false);
});


test('simultaneous first saves stop on duplicates rather than choosing a winner', async t => {
  const b=api(), a=harness(t,b), c=harness(t,b); await Promise.all([a.store.sync(),c.store.sync()]);
  a.store.equip('shadow_wolf','saddle','racing_saddle'); c.store.equip('shadow_wolf','saddle','royal_saddle');
  await Promise.all([a.store.sync(),c.store.sync()]);
  assert.equal(b.rows.length,2); assert.match(a.store.getState().sync.message,/Multiple cloud saves/);
  assert.match(c.store.getState().sync.message,/Multiple cloud saves/);
  await a.store.sync(); assert.equal(b.rows.length,2); assert.equal(a.saved().dirty,true);
});

test('failed cloud hydration write preserves current equipment and offers retry', async t => {
  const b=api(), wait=deferred();b.rows=[row('A','royal_saddle')];b.beforeRead=()=>wait.promise;
  const h=harness(t,b), pending=h.store.sync();await tick(); h.blocked=true;wait.resolve();await pending;
  assert.deepEqual(h.store.getState().gear,{});assert.equal(h.store.getState().sync.phase,'error');
  h.blocked=false; b.beforeRead=null;await h.store.sync();
  assert.equal(h.store.getState().gear.shadow_wolf.saddle,'royal_saddle');
});

test('failed acknowledgement persistence retains dirty state and retry does not spend another revision', async t => {
  const b=api();b.rows=[row()];const h=harness(t,b);await h.store.sync();
  h.store.equip('shadow_wolf','saddle','royal_saddle');b.beforeWrite=()=>{h.blocked=true;};
  await h.store.sync(); assert.equal(h.saved().dirty,true);assert.equal(h.store.getState().sync.phase,'error');
  h.blocked=false;b.beforeWrite=null;await h.store.sync();assert.equal(h.saved().dirty,false);assert.equal(b.rows[0].revision,2);
});
