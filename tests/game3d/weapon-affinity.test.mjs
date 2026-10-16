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
  identity: 'axe/weapons/AXEWeaponIdentityMount.jsx', mastery: 'progression/weaponMasteryStore.jsx',
  buffs: 'weaponClassBuffStore.jsx', abilities: 'abilityStore.jsx', cycle: 'axe/weapons/AXEWeaponQuickSwitch.js',
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
const { arche, affinity, inv, storage, hud, helpers, identity, mastery, buffs, abilities, cycle } = await import(pathToFileURL(path.join(temp, 'stores.mjs')));
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

// The passive values are power-budget balance (AXEWeaponArchetypes): the tests read them from there.
const passiveOf = (id) => arche.AXE_WEAPON_ARCHETYPES[id].passive;

test('every archetype has its passive, doubled only for the specialized archetype', () => {
  const p = (id, spec) => arche.getAXEArchetypePassive(id, spec);
  assert.equal(arche.AXE_WEAPON_AFFINITY_MULTIPLIER, 2);
  for (const id of Object.keys(arche.AXE_WEAPON_ARCHETYPES)) {
    for (const [k, v] of Object.entries(passiveOf(id))) {
      assert.ok(v > 0, `${id} ${k}`);
      assert.equal(p(id, null)[k], v); assert.equal(p(id, id)[k], v * 2, `${id} ${k} doubled`);
    }
  }
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
  // the passive joins the percent pool: specializing adds the passive once more
  const extra = passiveOf('close_combat').damagePct * 100;
  assert.ok(Math.abs(spec.percentPool.damagePct - base.percentPool.damagePct - extra) < 1e-9, 'one more passive in the pool');
  const expected = base.damage * (1 + spec.percentPool.damagePct / 100) / (1 + base.percentPool.damagePct / 100);
  assert.ok(Math.abs(spec.damage - expected) <= 1, `damage ${base.damage} -> ${spec.damage} (expected about ${expected.toFixed(1)})`);
  assert.equal(spec.defense, base.defense, 'nothing else moves');
  affinity.setAXESpecializedArchetype('defensive');
  assert.ok(Math.abs(hud.getPlayerHUD().derived.damage - base.damage) < 1e-9, 'specialized elsewhere: back to 1x');
  assert.equal(affinity.setAXESpecializedArchetype('nonsense').ok, false);
});

test('a ranged weapon in hand speeds movement; specialized, twice as much', () => {
  fresh('Test Longbow');
  affinity.setAXESpecializedArchetype(null); const one = helpers.getWeaponMoveSpeedMult();
  affinity.setAXESpecializedArchetype('ranged'); const two = helpers.getWeaponMoveSpeedMult();
  const m = passiveOf('ranged').moveSpeedPct;
  assert.ok(Math.abs(two / one - (1 + 2 * m) / (1 + m)) < 1e-9, `${(two / one).toFixed(4)}`);
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

function switchingFixture({ requiredLevel = 1 } = {}) {
  const sword = fresh('Test Sword');
  const old = inv.addAXEEquipmentItem(weapon('Old Health Bow', { baseStats: { damage: 10, hp: 100 } }), { equipped: true }).item;
  inv.setActiveAXEWeapon(sword.instanceId);
  const next = inv.addAXEEquipmentItem(weapon('Next Health Longbow', { baseStats: { damage: 10, hp: 100 }, itemLevel: requiredLevel })).item;
  affinity.assignAXEQuickWeapon(0, next.instanceId);
  hud.setHP(25);
  return { sword, old, next };
}

test('one quick-switch publishes one complete loadout without granting free healing', () => {
  const { sword, old, next } = switchingFixture();
  const beforeHP = hud.getPlayerHUD().hp, beforeMax = hud.getPlayerHUD().maxHP;
  const seen = []; const off = inv.subscribeAXEEquipmentInventory(s => seen.push(s)); seen.length = 0;
  const result = affinity.quickSwitchAXEWeapon(0); off();
  assert.equal(result.ok, true);
  assert.equal(hud.getPlayerHUD().maxHP, beforeMax);
  assert.equal(hud.getPlayerHUD().hp, beforeHP, 'equivalent HP weapons must not heal between unequip/equip');
  assert.equal(seen.length, 1, 'subscribers receive one complete loadout');
  assert.equal(seen[0].activeWeaponInstanceId, next.instanceId);
  assert.deepEqual(seen[0].items.filter(i => i.category === 'weapon' && i.equipped).map(i => i.instanceId).sort(), [sword.instanceId, next.instanceId].sort());
  assert.equal(inv.getAXEEquipmentItem(old.instanceId).equipped, false);
});

test('an invalid quick-switch cannot temporarily unequip equipment or change health', () => {
  switchingFixture({ requiredLevel: 2 });
  const before = inv.getAXEEquipmentInventoryState(), beforeHP = hud.getPlayerHUD().hp;
  let emissions = 0; const off = inv.subscribeAXEEquipmentInventory(() => emissions++); emissions = 0;
  const result = affinity.quickSwitchAXEWeapon(0); off();
  assert.equal(result.reason, 'LEVEL_REQUIRED');
  assert.deepEqual(inv.getAXEEquipmentInventoryState(), before);
  assert.equal(hud.getPlayerHUD().hp, beforeHP, 'a denied switch must not heal');
  assert.equal(emissions, 0);
});

test('blocked storage cannot publish a weapon switch or change derived combat stats', () => {
  switchingFixture();
  const before = inv.getAXEEquipmentInventoryState(), derived = structuredClone(hud.getPlayerHUD().derived);
  const original = dom.window.Storage.prototype.setItem;
  let result, emissions = 0;
  const off = inv.subscribeAXEEquipmentInventory(() => emissions++); emissions = 0;
  try {
    dom.window.Storage.prototype.setItem = function(key, value) {
      if (String(key).startsWith('axe_equipment_inventory_v2')) throw new dom.window.DOMException('Full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
    result = affinity.quickSwitchAXEWeapon(0);
  } finally { dom.window.Storage.prototype.setItem = original; off(); }
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'SAVE_FAILED');
  assert.deepEqual(inv.getAXEEquipmentInventoryState(), before);
  assert.deepEqual(hud.getPlayerHUD().derived, derived);
  assert.equal(emissions, 0);
});


function withBlockedStorage(prefix, fn) {
  const original = dom.window.Storage.prototype.setItem;
  try {
    dom.window.Storage.prototype.setItem = function(key, value) {
      if (String(key).startsWith(prefix)) throw new dom.window.DOMException('Full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
    return fn();
  } finally { dom.window.Storage.prototype.setItem = original; }
}

test('failed specialty/slot preference saves do not change affinity bonuses or selections', () => {
  const { sword } = switchingFixture();
  const before = affinity.getAXEWeaponAffinityState(), derived = structuredClone(hud.getPlayerHUD().derived);
  let emissions=0;const off=affinity.subscribeAXEWeaponAffinity(()=>emissions++);emissions=0;
  withBlockedStorage('axe_weapon_affinity_v1',()=>{
    assert.equal(affinity.setAXESpecializedArchetype('close_combat').reason,'SAVE_FAILED');
    assert.equal(affinity.assignAXEQuickWeapon(1,sword.instanceId).reason,'SAVE_FAILED');
  });off();
  assert.deepEqual(affinity.getAXEWeaponAffinityState(),before);assert.deepEqual(hud.getPlayerHUD().derived,derived);assert.equal(emissions,0);
  assert.equal(affinity.setAXESpecializedArchetype('close_combat').ok,true);
});

test('draw and return history persist together even if the separate preference key is blocked', () => {
  const { sword, next } = switchingFixture();
  const r=withBlockedStorage('axe_weapon_affinity_v1',()=>affinity.quickSwitchAXEWeapon(0));assert.equal(r.ok,true);
  const key=`axe_equipment_inventory_v2::${storage.getStorageUser()}::${storage.getActiveId()}`;
  const saved=JSON.parse(localStorage.getItem(key));
  assert.equal(saved.activeWeaponInstanceId,next.instanceId);assert.equal(saved.previousWeaponInstanceId,sword.instanceId);
  storage.notifyCharacterChange();assert.equal(affinity.getAXEWeaponAffinityState().previousInstanceId,sword.instanceId);
  assert.equal(affinity.quickSwitchAXEWeapon(0).returned,true);assert.equal(inv.getActiveEquippedAXEWeapon().instanceId,sword.instanceId);
});

test('the real identity binding updates mastery, role and legacy hotbar only after a committed draw', () => {
  const { sword, next } = switchingFixture();
  const unbind=identity.bindAXEWeaponIdentity();
  try {
    abilities.equipAbility(0,'shadow_teleport');abilities.startCooldown(0);
    const cooldown=abilities.getAbilityState().cooldowns[0];
    assert.equal(buffs.getActiveWeaponPath(),'damage');assert.equal(mastery.getMasteryState().activeWeaponId,'sword');
    let changes=0;const off=identity.subscribeAXEWeaponIdentity(()=>changes++);changes=0;
    withBlockedStorage('axe_equipment_inventory_v2',()=>assert.equal(affinity.quickSwitchAXEWeapon(0).ok,false));
    assert.equal(changes,0);assert.equal(abilities.getAbilityState().equipped[0],'shadow_teleport');
    assert.equal(abilities.getAbilityState().cooldowns[0],cooldown);
    assert.equal(affinity.quickSwitchAXEWeapon(0).ok,true);assert.equal(changes,1);
    assert.equal(identity.getActiveAXEWeaponIdentity().itemId,next.instanceId);
    assert.equal(mastery.getMasteryState().activeWeaponId,'bow');assert.equal(buffs.getActiveWeaponPath(),'ranged');
    abilities.equipAbility(0,'lightning_strike');
    affinity.quickSwitchAXEWeapon(0);
    assert.equal(identity.getActiveAXEWeaponIdentity().itemId,sword.instanceId);assert.equal(abilities.getAbilityState().equipped[0],'shadow_teleport');off();
  } finally { unbind(); }
});

test('a permitted higher-level weapon uses the provided live character level', () => {
  switchingFixture({requiredLevel:12});
  assert.equal(affinity.quickSwitchAXEWeapon(0,{level:11}).reason,'LEVEL_REQUIRED');
  assert.equal(affinity.quickSwitchAXEWeapon(0,{level:12}).ok,true);
});

test('legacy cycle path also publishes a complete loadout and retains the held weapon', () => {
  const held=fresh('Cycle Sword');
  const old=inv.addAXEEquipmentItem(weapon('Cycle Old Bow'),{equipped:true}).item;
  inv.setActiveAXEWeapon(held.instanceId);
  const before=[];const off=inv.subscribeAXEEquipmentInventory(s=>before.push(s));before.length=0;
  const r=cycle.cycleAXEEquippedWeapon(1);off();
  assert.equal(r.ok,true);assert.equal(before.length,1);
  assert.equal(inv.getAXEEquipmentItem(held.instanceId).equipped,true);
  assert.ok(inv.getEquippedAXEItemsByCategory('weapon').length<=2);
  assert.ok(inv.getAXEEquipmentItem(old.instanceId),'inactive weapon still owned');
});
