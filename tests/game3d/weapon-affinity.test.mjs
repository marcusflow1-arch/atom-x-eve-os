// Wuxia blueprint §3: weapon archetypes, Weapon Affinity (2x passive) and the
// two quick-switch slots, on the real AXE stores and player HUD (same harness as
// progression-integration.test.mjs; only the Base44 service boundary is stubbed).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), 'axe-affinity-'));
const dom = new JSDOM('', { url: 'http://localhost/' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent });
const intervals = [];
const nativeSetInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const timer = nativeSetInterval(...args); intervals.push(timer); return timer; };
const modules = {
  arche: 'axe/weapons/AXEWeaponArchetypes.js', affinity: 'axe/weapons/AXEWeaponAffinityStore.js',
  inv: 'axe/equipment/AXEEquipmentInventoryStore.js', storage: 'characterStorage.jsx',
  hud: 'playerHUDStore.jsx', helpers: 'weaponClassCombatHelpers.jsx',
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
const { arche, affinity, inv, storage, hud, helpers } = await import(pathToFileURL(path.join(temp, 'stores.mjs')));
after(async () => { intervals.forEach(clearInterval); globalThis.setInterval = nativeSetInterval; dom.window.close(); await rm(temp, { recursive: true, force: true }); });

let user = 0;
const weapon = (name, extra = {}) => ({ id: name.toLowerCase().replace(/\W+/g, '_'), name, slot: 'weapon', category: 'weapon',
  rarity: 'common', baseStats: { damage: 10 }, ...extra });
// a fresh character holding `held` (equipped and active)
function fresh(held = 'Test Sword') {
  storage.setStorageUser(`affinity-qa-${++user}`);
  inv.resetAXEEquipmentInventoryToStarter();
  for (const w of inv.getEquippedAXEItemsByCategory('weapon')) inv.unequipAXEInventoryItem(w.instanceId);
  const r = inv.addAXEEquipmentItem(weapon(held), { equipped: true });
  assert.ok(r.ok, 'test weapon equipped'); return r.item;
}

test('every existing weapon kind maps to one of the five archetypes', () => {
  const a = (name, extra) => arche.inferAXEWeaponArchetype({ name, ...extra });
  assert.equal(a('Heavy Greatsword'), 'single_hit', 'a greatsword is a burst weapon, not a plain sword');
  assert.equal(a('Mythic War Blades'), 'multi_hit');
  assert.equal(a('Whisper Dagger'), 'multi_hit');
  assert.equal(a('Recurve Bow'), 'ranged');
  assert.equal(a('Painted Fan'), 'ranged');
  assert.equal(a('True Heart — Sword'), 'close_combat');
  assert.equal(a('Guardian Shield'), 'defensive');
  assert.equal(a('Mystery Relic', { masteryWeaponId: 'dual_blades' }), 'multi_hit', 'falls back to the mastery family');
  assert.equal(a('Mystery Relic', { archetype: 'defensive' }), 'defensive', 'an explicit archetype wins');
  assert.equal(arche.inferAXEWeaponArchetype(null), null);
});

test('the blueprint passives, doubled only for the specialized archetype', () => {
  const p = (id, spec) => arche.getAXEArchetypePassive(id, spec);
  assert.equal(p('close_combat', null).damagePct, 0.20); assert.equal(p('close_combat', 'close_combat').damagePct, 0.40);
  assert.equal(p('single_hit', 'single_hit').damagePct, 0.40);
  assert.equal(p('defensive', null).defensePct, 0.50); assert.equal(p('defensive', 'defensive').defensePct, 1.00);
  assert.deepEqual([p('ranged', 'ranged').dodgePct, p('ranged', 'ranged').moveSpeedPct], [0.30, 0.30]);
  assert.equal(p('multi_hit', 'multi_hit').critDodgePct, 0.20);
  assert.equal(p('close_combat', 'ranged').doubled, false, 'specializing elsewhere leaves it at 1x');
});

test('the weapon in hand drives the derived stats; specializing in its archetype doubles the passive', () => {
  fresh('Test Sword');
  affinity.setAXESpecializedArchetype(null);
  const base = hud.getPlayerHUD().derived;
  assert.equal(base.weaponAffinity.archetype, 'close_combat'); assert.equal(base.weaponAffinity.doubled, false);
  affinity.setAXESpecializedArchetype('close_combat');
  const spec = hud.getPlayerHUD().derived;
  assert.equal(spec.weaponAffinity.doubled, true);
  assert.ok(Math.abs(spec.damage / base.damage - 1.4 / 1.2) < 1e-9, `damage x1.4 instead of x1.2 (${(spec.damage / base.damage).toFixed(4)})`);
  assert.equal(spec.defense, base.defense, 'nothing else moves');
  affinity.setAXESpecializedArchetype('defensive');
  assert.ok(Math.abs(hud.getPlayerHUD().derived.damage - base.damage) < 1e-9, 'specialized elsewhere: back to 1x');
  assert.equal(affinity.setAXESpecializedArchetype('nonsense').ok, false);
});

test('a ranged weapon in hand speeds movement; specialized, twice as much', () => {
  fresh('Test Longbow');
  affinity.setAXESpecializedArchetype(null); const one = helpers.getWeaponMoveSpeedMult();
  affinity.setAXESpecializedArchetype('ranged'); const two = helpers.getWeaponMoveSpeedMult();
  assert.ok(Math.abs(two / one - 1.30 / 1.15) < 1e-9, `${(two / one).toFixed(4)}`);
  const d = hud.getPlayerHUD().derived; assert.equal(d.weaponAffinity.archetype, 'ranged');
});

test('quick-switch draws the slot weapon at once, never drops the one in hand, and toggles back', () => {
  const sword = fresh('Test Sword');
  const bow = inv.addAXEEquipmentItem(weapon('Test Recurve Bow')).item;
  const dagger = inv.addAXEEquipmentItem(weapon('Test Whisper Dagger')).item;
  assert.equal(affinity.quickSwitchAXEWeapon(0).reason, 'EMPTY_SLOT');
  assert.ok(affinity.assignAXEQuickWeapon(0, bow.instanceId).ok); assert.ok(affinity.assignAXEQuickWeapon(1, dagger.instanceId).ok);

  let r = affinity.quickSwitchAXEWeapon(0);
  assert.ok(r.ok); assert.equal(inv.getActiveEquippedAXEWeapon().instanceId, bow.instanceId); assert.equal(r.archetype, 'ranged');
  let equipped = inv.getEquippedAXEItemsByCategory('weapon').map((w) => w.instanceId);
  assert.ok(equipped.includes(sword.instanceId), 'the sword it was drawn over stays equipped'); assert.ok(equipped.length <= 2, 'never a third equipped weapon');

  r = affinity.quickSwitchAXEWeapon(1);
  assert.ok(r.ok); assert.equal(inv.getActiveEquippedAXEWeapon().instanceId, dagger.instanceId);
  equipped = inv.getEquippedAXEItemsByCategory('weapon').map((w) => w.instanceId);
  assert.ok(equipped.includes(bow.instanceId), 'the bow in hand was not the one dropped'); assert.ok(!equipped.includes(sword.instanceId));
  assert.equal(hud.getPlayerHUD().derived.weaponAffinity.archetype, 'multi_hit', 'the stats follow the weapon in hand');

  r = affinity.quickSwitchAXEWeapon(1); // the dagger's key again: back to the bow
  assert.ok(r.ok && r.returned); assert.equal(inv.getActiveEquippedAXEWeapon().instanceId, bow.instanceId);

  // a weapon sits in one slot only; slots and specialty are per character
  affinity.assignAXEQuickWeapon(1, bow.instanceId);
  assert.deepEqual(affinity.getAXEWeaponAffinityState().quickSlots, [null, bow.instanceId]);
  affinity.setAXESpecializedArchetype('ranged');
  const me = storage.getStorageUser(); storage.setStorageUser('someone-else');
  assert.deepEqual(affinity.getAXEWeaponAffinityState().quickSlots, [null, null]); assert.equal(affinity.getAXEWeaponAffinityState().specialized, null);
  storage.setStorageUser(me);
  assert.deepEqual(affinity.getAXEWeaponAffinityState().quickSlots, [null, bow.instanceId]); assert.equal(affinity.getAXEWeaponAffinityState().specialized, 'ranged');
});

test('a quick-slot weapon that is gone clears its slot', () => {
  fresh('Test Sword');
  const bow = inv.addAXEEquipmentItem(weapon('Test Recurve Bow')).item;
  affinity.assignAXEQuickWeapon(0, bow.instanceId);
  inv.destroyAXEEquipmentItem(bow.instanceId);
  assert.equal(affinity.quickSwitchAXEWeapon(0).reason, 'WEAPON_NOT_OWNED');
  assert.equal(affinity.getAXEWeaponAffinityState().quickSlots[0], null);
  assert.equal(affinity.assignAXEQuickWeapon(0, 'not-a-weapon').reason, 'WEAPON_NOT_OWNED');
});
