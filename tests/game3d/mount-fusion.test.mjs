// Wuxia blueprint §4: Mount Soul Fusion (seven gear slots, combination share,
// absorption pills) on the real AXE mount store, equipment and player HUD.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), 'axe-fusion-'));
const dom = new JSDOM('', { url: 'http://localhost/' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent });
const intervals = [];
const nativeSetInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const timer = nativeSetInterval(...args); intervals.push(timer); return timer; };
const modules = {
  fusion: 'axe/progression/AXEMountFusionSystem.js', mounts: 'axe/progression/AXEMountStore.js',
  mountSystem: 'axe/progression/AXEMountSystem.js', inv: 'axe/equipment/AXEEquipmentInventoryStore.js',
  storage: 'characterStorage.jsx', hud: 'playerHUDStore.jsx',
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
const { fusion, mounts, mountSystem, inv, storage, hud } = await import(pathToFileURL(path.join(temp, 'stores.mjs')));
after(async () => { intervals.forEach(clearInterval); globalThis.setInterval = nativeSetInterval; dom.window.close(); await rm(temp, { recursive: true, force: true }); });

let user = 0;
const fresh = () => { storage.setStorageUser(`fusion-qa-${++user}`); return mounts.getAXEMountState().registeredMountId; };
const registered = () => mounts.getAXEMountState().mounts.find((m) => m.registered);
const MIN = 60_000;

test('combination share: 25% at full growth plus 2% per gear piece at Stage 20, up to 39%', () => {
  const at = (growthPercent, stages = {}) => fusion.getAXEMountCombinationShare({ growthPercent, gear: Object.fromEntries(Object.entries(stages).map(([k, v]) => [k, { stage: v }])) });
  assert.equal(at(100).total, 25); assert.equal(at(40).total, 10); assert.equal(at(0).total, 0);
  assert.equal(at(100, { saddle: 19 }).total, 25, 'only a finished piece counts');
  const all = Object.fromEntries(fusion.AXE_MOUNT_GEAR_SLOTS.map((s) => [s.id, 20]));
  assert.deepEqual([at(100, all).total, at(100, all).maxedPieces, at(100, all).gear], [39, 7, 14]);
  assert.equal(fusion.AXE_MOUNT_GEAR_SLOTS.length, 7);
  const r = fusion.refineAXEMountGearSlot({ gear: { saddle: { stage: 4 } } }, 'saddle');
  assert.equal(r.stage, 5); assert.deepEqual(r.cost, { gold: 750 });
  assert.equal(fusion.refineAXEMountGearSlot({ gear: { saddle: { stage: 20 } } }, 'saddle').reason, 'MAX_GEAR_STAGE');
  assert.equal(fusion.refineAXEMountGearSlot({}, 'saddle', 3).reason, 'STALE_REVIEW');
  assert.equal(fusion.refineAXEMountGearSlot({}, 'tail').reason, 'UNKNOWN_GEAR_SLOT');
});

test('old mount saves gain seven Stage 0 gear slots and the starter absorption pills', () => {
  const old = mountSystem.createAXEMountInstance('axe_mount_war_wolf'); delete old.gear;
  const n = mountSystem.normalizeAXEMountInstance(old);
  assert.deepEqual(Object.values(n.gear).map((g) => g.stage), [0, 0, 0, 0, 0, 0, 0]);
  // a save written before this change: no pill keys in its materials
  fresh(); mounts.grantAXEMountMaterials({ gold: 1 });
  const key = Object.keys(localStorage).find((k) => k.includes('axe_mount_progression_v1') && k.includes(storage.getStorageUser()));
  const saved = JSON.parse(localStorage.getItem(key)); delete saved.materials.absorption_pill_s; delete saved.materials.absorption_pill_600; delete saved.fusion;
  localStorage.setItem(key, JSON.stringify(saved));
  const me = storage.getStorageUser(); storage.setStorageUser('elsewhere'); storage.setStorageUser(me);
  assert.equal(mounts.getAXEMountState().materials.absorption_pill_s, 3, 'the starter pills arrive once');
  assert.equal(mounts.getAXEMountState().materials.gold, saved.materials.gold, 'the rest of the save is untouched');
});

test('refining a gear slot needs confirmation, spends gold, and a finished piece adds 2%', () => {
  const id = fresh();
  assert.equal(mounts.refineAXEMountGear(id, 'saddle').reason, 'CONFIRMATION_REQUIRED');
  const gold = mounts.getAXEMountState().materials.gold;
  const r = mounts.refineAXEMountGear(id, 'saddle', { confirmed: true, expectedStage: 0 });
  assert.ok(r.ok); assert.equal(mounts.getAXEMountState().materials.gold, gold - 150);
  assert.equal(mounts.refineAXEMountGear(id, 'saddle', { confirmed: true, expectedStage: 0 }).reason, 'STALE_REVIEW', 'a stale review spends nothing');
  mounts.grantAXEMountMaterials({ gold: 1_000_000 });
  for (let s = 1; s < 20; s++) assert.ok(mounts.refineAXEMountGear(id, 'saddle', { confirmed: true, expectedStage: s }).ok);
  assert.equal(registered().gear.saddle.stage, 20); assert.equal(registered().combination.gear, 2);
  assert.equal(mounts.previewAXEMountGearRefine(id, 'saddle').reason, 'MAX_GEAR_STAGE');
  // the 20,000 starter gold reaches Stage 15 of one piece (18,000); Stage 16 costs 2,400 more
  const poor = fresh(); let last;
  for (let s = 0; s < 20; s++) { last = mounts.refineAXEMountGear(poor, 'core', { confirmed: true, expectedStage: s }); if (!last.ok) break; }
  assert.equal(last.reason, 'INSUFFICIENT_MATERIALS'); assert.equal(registered().gear.core.stage, 15);
  assert.equal(mounts.getAXEMountState().materials.gold, 2000, 'a refused refine spends nothing');
  assert.equal(mounts.previewAXEMountGearRefine(poor, 'core').canAfford, false);
});

test('granting mount materials keeps absorption pills (they used to be dropped)', () => {
  fresh();
  mounts.grantAXEMountMaterials({ gold: 10 });
  assert.equal(mounts.getAXEMountState().materials.absorption_pill_s, 3);
  mounts.grantAXEMountMaterials({ absorption_pill_600: 2 });
  assert.equal(mounts.getAXEMountState().materials.absorption_pill_600, 2);
});

test('a pill absorbs the registered mount for its time; more pills add time; it cannot be ridden; it ends on time', () => {
  const id = fresh(); const now = Date.now();
  assert.equal(mounts.absorbAXEMount('absorption_pill_600').reason, 'NO_ABSORPTION_PILL');
  assert.equal(mounts.absorbAXEMount('mystery').reason, 'UNKNOWN_PILL');
  assert.ok(mounts.setAXEMountRiding(true).ok, 'riding before');
  const r = mounts.absorbAXEMount('absorption_pill_s', { now });
  assert.ok(r.ok); assert.equal(r.until, now + 60 * MIN);
  assert.equal(mounts.getAXEMountState().ridingMountId, null, 'dismounted to absorb');
  assert.equal(mounts.setAXEMountRiding(true).reason, 'MOUNT_ABSORBED');
  assert.equal(mounts.getAXEMountState().materials.absorption_pill_s, 2);
  assert.equal(mounts.absorbAXEMount('absorption_pill_s', { now }).until, now + 120 * MIN, 'a second pill adds its hour');
  const f = mounts.getAXEMountFusionState(now);
  assert.equal(f.active, true); assert.equal(f.mountId, id); assert.equal(f.palette.id, 'flame', 'the War Wolf burns crimson-orange');
  assert.equal(mounts.releaseAXEMount(id, { confirmed: true }).reason, 'MOUNT_IN_USE');
  assert.equal(mounts.tickAXEMountFusion(now + 119 * MIN), false, 'not yet');
  assert.equal(mounts.tickAXEMountFusion(now + 121 * MIN), true, 'ended');
  assert.equal(mounts.getAXEMountFusionState().active, false); assert.ok(mounts.setAXEMountRiding(true).ok, 'rideable again');
  mounts.setAXEMountRiding(false);
  mounts.absorbAXEMount('absorption_pill_s'); assert.ok(mounts.releaseAXEMountFusion().ok);
  assert.equal(mounts.getAXEMountFusionState().active, false, 'released early');
});

test('the fusion survives a reload and stays with its character', () => {
  fresh(); mounts.absorbAXEMount('absorption_pill_s');
  const me = storage.getStorageUser();
  storage.setStorageUser('someone-else'); assert.equal(mounts.getAXEMountFusionState().active, false);
  storage.setStorageUser(me); assert.equal(mounts.getAXEMountFusionState().active, true);
  mounts.releaseAXEMountFusion();
});

test('while absorbed, the equipment stats are multiplied by (1 + share / 100) in the live derived stats', () => {
  const id = fresh();
  mounts.awardAXEMountXP(id, 5000); // full growth: 25%
  inv.resetAXEEquipmentInventoryToStarter();
  for (const item of inv.getEquippedAXEItems()) inv.unequipAXEInventoryItem(item.instanceId);
  const bare = hud.getPlayerHUD().derived.damage;
  // a ranged archetype has no damage passive, so Weapon Affinity leaves damage alone
  assert.ok(inv.addAXEEquipmentItem({ id: 'fusion_test_bow', name: 'Fusion Test Bow', archetype: 'ranged', slot: 'weapon', category: 'weapon', rarity: 'common', baseStats: { damage: 100 } }, { equipped: true }).ok);
  const geared = hud.getPlayerHUD().derived.damage, fromGear = geared - bare;
  assert.ok(fromGear > 0, 'the bow adds damage');
  assert.ok(mounts.absorbAXEMount('absorption_pill_s').ok);
  const share = mounts.getAXEMountFusionState().share;
  assert.equal(share, 25);
  const fused = hud.getPlayerHUD().derived;
  assert.ok(Math.abs((fused.damage - bare) - fromGear * 1.25) < 1e-6, `gear part ${(fused.damage - bare).toFixed(3)} = ${fromGear} x 1.25`);
  assert.deepEqual(fused.mountFusion, { active: true, share: 25 });
  mounts.releaseAXEMountFusion();
  assert.ok(Math.abs(hud.getPlayerHUD().derived.damage - geared) < 1e-9, 'back to normal');
});
