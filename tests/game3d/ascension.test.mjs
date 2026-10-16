// Wuxia blueprint v3 §4: Taurus Chosen Ascension (the ritual, the three Natures, the
// Angel Cloak, levitation) on the real AXE stores, player HUD, skill executor and the
// damage-absorb path GameWorld3D uses.
import { test, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), 'axe-ascension-'));
// JSDOM has no 2D canvas; the cloak runtime falls back to an untextured cloth, so the warning is noise
const dom = new JSDOM('', { url: 'http://localhost/', virtualConsole: new VirtualConsole() });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent });
globalThis.Audio = class { constructor() { this.volume = 1; this.currentTime = 0; } play() { return Promise.resolve(); } pause() {} load() {} addEventListener() {} removeEventListener() {} cloneNode() { return new globalThis.Audio(); } };
const intervals = [];
const nativeSetInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const timer = nativeSetInterval(...args); intervals.push(timer); return timer; };
const modules = {
  sys: 'axe/progression/AXEAscensionSystem.js', asc: 'axe/progression/AXEAscensionStore.js',
  visual: 'axe/progression/AXEAscensionVisualRuntime.js', buffs: 'skills/buffCompat.jsx',
  helpers: 'weaponClassCombatHelpers.jsx', inv: 'axe/equipment/AXEEquipmentInventoryStore.js',
  storage: 'characterStorage.jsx', hud: 'playerHUDStore.jsx', executor: 'skills/skillExecutor.jsx',
};
await build({ stdin: { contents: Object.entries(modules).map(([name, file]) =>
  `export * as ${name} from './src/components/game3d/${file}';`).join('\n') + "\nexport * as THREE from 'three';", resolveDir: root },
  bundle: true, jsx: 'automatic', format: 'esm', platform: 'node', outfile: path.join(temp, 'stores.mjs'),
  alias: { '@': path.join(root, 'src') }, define: { 'import.meta.env': '{}' },
  plugins: [{ name: 'offline-service-boundary', setup(b) {
    b.onResolve({ filter: /api\/base44Client/ }, () => ({ path: 'base44-test', namespace: 'offline' }));
    b.onLoad({ filter: /.*/, namespace: 'offline' }, () => ({ contents:
      'export const base44 = { auth: { updateMe: async () => ({}), me: async () => ({}) } };' }));
  } }], logLevel: 'silent',
});
const { sys, asc, visual, buffs, helpers, inv, storage, hud, executor, THREE } = await import(pathToFileURL(path.join(temp, 'stores.mjs')));
after(async () => { intervals.forEach(clearInterval); globalThis.setInterval = nativeSetInterval; dom.window.close(); await rm(temp, { recursive: true, force: true }); });

let user = 0;
const fresh = () => storage.setStorageUser(`ascension-qa-${++user}`);
const HOUR = 3_600_000, T = 1_700_000_000_000;
const NATURES = sys.AXE_ASCENSION_NATURES; // the Natures' numbers are power-budget balance (AXEAscensionSystem)
const BAL = NATURES.balanced.allStatsMult, DEF = NATURES.defensive.defenseMult, DES = NATURES.destroyer.skillDamageMult;
const SHARE = NATURES.defensive.shieldFromDamage;
const ascend = () => assert.ok(asc.ascendAXECharacter({ level: 100, confirmed: true }).ok);
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} vs ${b}`);

test('the ritual needs level 100 and an explicit confirmation, and happens once', () => {
  fresh();
  assert.deepEqual(asc.ascendAXECharacter({ level: 99, confirmed: true }), { ok: false, reason: 'LEVEL_TOO_LOW', required: 100 });
  assert.equal(asc.ascendAXECharacter({ level: 100 }).reason, 'CONFIRMATION_REQUIRED');
  assert.equal(asc.getAXEAscensionState().ascended, false);
  ascend();
  assert.equal(asc.ascendAXECharacter({ level: 140, confirmed: true }).reason, 'ALREADY_ASCENDED');
  assert.deepEqual(asc.getAXEAscensionProfile(), { ascended: true, nature: null, natureDef: null, cloakVisible: true, hoverHeight: 0.15 });
});

test('a Nature is chosen once ascended; changing it again waits an hour', () => {
  fresh();
  assert.equal(asc.setAXEAscensionNature('destroyer').reason, 'NOT_ASCENDED');
  ascend();
  assert.equal(asc.setAXEAscensionNature('berserker').reason, 'UNKNOWN_NATURE');
  assert.ok(asc.setAXEAscensionNature('destroyer', { now: T }).ok);
  const early = asc.setAXEAscensionNature('balanced', { now: T + 10 * 60_000 });
  assert.deepEqual(early, { ok: false, reason: 'REATTUNE_COOLDOWN', readyAt: T + HOUR });
  assert.equal(asc.setAXEAscensionNature('destroyer', { now: T + 1 }).reason, 'UNCHANGED');
  assert.ok(asc.setAXEAscensionNature('balanced', { now: T + HOUR }).ok);
  assert.equal(asc.getAXEAscensionState().nature, 'balanced');
});

test('the Angel Cloak and the Natures act on the live derived stats', () => {
  fresh(); inv.resetAXEEquipmentInventoryToStarter();
  for (const item of inv.getEquippedAXEItems()) inv.unequipAXEInventoryItem(item.instanceId);
  const mortal = hud.getPlayerHUD().derived;
  ascend();
  const cloaked = hud.getPlayerHUD().derived;
  assert.equal(cloaked.maxHP - mortal.maxHP, 500, 'the cloak: +500 HP');
  near(cloaked.defense - mortal.defense, 40, 'the cloak: +40 defense');
  assert.equal(cloaked.attributionDefense - mortal.attributionDefense, 30);
  assert.deepEqual(cloaked.ascension, { ascended: true, nature: null });

  assert.ok(asc.setAXEAscensionNature('balanced', { now: T }).ok);
  const balanced = hud.getPlayerHUD().derived;
  for (const k of ['damage', 'defense', 'maxHP', 'chi', 'attackSuccess', 'attackBlock']) near(balanced[k], cloaked[k] * BAL, `balanced ${k} x${BAL}`);
  assert.equal(balanced.critChance, cloaked.critChance, 'secondary stats untouched');

  assert.ok(asc.setAXEAscensionNature('defensive', { now: T + HOUR }).ok);
  const defensive = hud.getPlayerHUD().derived;
  near(defensive.defense, cloaked.defense * DEF, `defensive defense x${DEF}`);
  near(defensive.damage, cloaked.damage, 'defensive leaves damage alone');

  asc.setAXEAngelCloakHidden(true);
  assert.equal(asc.getAXEAscensionProfile().cloakVisible, false);
  assert.equal(hud.getPlayerHUD().derived.maxHP, defensive.maxHP, 'a hidden cloak keeps its bonuses');
});

test('levitation and the cloak speed the hero up', () => {
  fresh();
  const before = helpers.getWeaponMoveSpeedMult();
  ascend();
  near(helpers.getWeaponMoveSpeedMult() / before, 1.12 * 1.03, 'x1.12 levitation, +3% cloak');
});

test('Destroyer: a real cast deals its skill-damage multiplier, and only single-hit skills send a shockwave', () => {
  fresh(); inv.resetAXEEquipmentInventoryToStarter();
  for (const w of inv.getEquippedAXEItemsByCategory('weapon')) inv.unequipAXEInventoryItem(w.instanceId);
  inv.addAXEEquipmentItem({ id: 'ascension_test_sword', name: 'Ascension Test Sword', slot: 'weapon', category: 'weapon', rarity: 'common', baseStats: { damage: 10 } }, { equipped: true });
  const strikes = []; const on = (e) => strikes.push(e.detail); window.addEventListener('playerSkillStrike', on);
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const cast = (id) => { strikes.length = 0; assert.ok(executor.castSkill(id, { slotIndex: 0 }).ok, id); mock.timers.tick(3000); return strikes.slice(); };
    const [mortal] = cast('sword_heavy_strike');
    const mortalTriple = cast('sword_triple_slash');
    assert.equal(mortal.ascensionShockwave, false);
    ascend();
    assert.ok(asc.setAXEAscensionNature('destroyer', { now: T }).ok);
    const [heavy] = cast('sword_heavy_strike');
    near(heavy.multiplier / mortal.multiplier, DES, `heavy strike x${DES}`);
    assert.equal(heavy.ascensionShockwave, true);
    const triple = cast('sword_triple_slash');
    near(triple[0].multiplier / mortalTriple[0].multiplier, DES, `triple slash x${DES}`);
    assert.ok(triple.every((s) => s.ascensionShockwave === false), 'multi-hit skills: no shockwave');
    assert.ok(asc.setAXEAscensionNature('balanced', { now: T + HOUR }).ok);
    const [plain] = cast('sword_heavy_strike');
    near(plain.multiplier, mortal.multiplier, 'other Natures leave skills alone');
    assert.equal(plain.ascensionShockwave, false);
  } finally { mock.timers.reset(); window.removeEventListener('playerSkillStrike', on); }
});

test('Defensive: a share of damage dealt banks a shield (capped at 40% max HP) that absorbs incoming damage after Aegis', () => {
  fresh(); ascend();
  assert.equal(asc.bankAXEAscensionDamage(1000, { maxHP: 2000 }), 0, 'no Nature: no shield');
  assert.ok(asc.setAXEAscensionNature('defensive', { now: T }).ok);
  const shieldEvents = []; const on = (e) => shieldEvents.push(e.detail.amount); window.addEventListener('axeAscensionShield', on);
  try {
    assert.equal(asc.bankAXEAscensionDamage(1000, { maxHP: 2000 }), 1000 * SHARE);
    assert.equal(asc.bankAXEAscensionDamage(10_000, { maxHP: 2000 }), 800, 'capped at 40% of max HP');
    assert.equal(buffs.absorbShield(200), 200, 'the world absorb path drains it');
    assert.equal(asc.getAXEAscensionShield(), 600);
    assert.equal(buffs.absorbShield(1000), 600, 'it absorbs no more than it holds');
    assert.equal(asc.getAXEAscensionShield(), 0);
    assert.deepEqual(shieldEvents, [1000 * SHARE, 800, 600, 0]);
  } finally { window.removeEventListener('axeAscensionShield', on); }
  const now = Date.now();
  asc.bankAXEAscensionDamage(1000, { maxHP: 2000, now });
  assert.equal(asc.getAXEAscensionShield(now + 7999), 1000 * SHARE);
  assert.equal(asc.getAXEAscensionShield(now + 8001), 0, 'fades 8 s after the last blow');
});

test('ascension is per character and survives a reload; the shield does not', () => {
  fresh(); ascend(); asc.setAXEAscensionNature('defensive', { now: T });
  asc.bankAXEAscensionDamage(1000, { maxHP: 2000 });
  const me = storage.getStorageUser();
  storage.setStorageUser('someone-else');
  assert.equal(asc.getAXEAscensionState().ascended, false);
  assert.equal(hud.getPlayerHUD().derived.ascension, undefined);
  storage.setStorageUser(me);
  const back = asc.getAXEAscensionState();
  assert.deepEqual([back.ascended, back.nature, back.shield], [true, 'defensive', 0]);
  assert.equal(hud.getPlayerHUD().derived.ascension.nature, 'defensive');
});

test('the visual runtime lifts the body (never the root), hangs the cloak and plays shockwaves', () => {
  const model = new THREE.Group();
  const body = new THREE.Group(); body.position.y = 0.4; model.add(body);
  const profile = { ascended: true, cloakVisible: true, hoverHeight: 0.15 };
  const rt = visual.createAXEAscensionVisualRuntime({ model, initialState: profile });
  rt.update(0.016); rt.lateUpdate();
  assert.equal(model.position.y, 0, 'the root stays on the ground');
  assert.ok(Math.abs(body.position.y - 0.4 - 0.15) <= 0.031, `the body floats: ${body.position.y}`);
  rt.update(0.016); rt.lateUpdate();
  assert.ok(Math.abs(body.position.y - 0.4 - 0.15) <= 0.031, 'the lift does not pile up frame after frame');
  body.position.y = 0.55; // the mixer poses an animated root bone higher this frame
  rt.update(0.016); rt.lateUpdate();
  assert.ok(Math.abs(body.position.y - 0.55 - 0.15) <= 0.031, `the lift follows the animation: ${body.position.y}`);
  body.position.y = 0.4; rt.update(0.016); rt.lateUpdate();
  const ground = model.getObjectByName('AXE_Ascension_Ground');
  assert.equal(ground.position.y, 0, 'the glow and shockwaves stay on the floor');
  const cloak = model.getObjectByName('AXE_Ascension_Runtime').children.find((c) => c.geometry?.type === 'PlaneGeometry');
  assert.equal(cloak.visible, true);
  window.dispatchEvent(new CustomEvent('axeAscensionChanged', { detail: { ...profile, cloakVisible: false } }));
  assert.equal(cloak.visible, false, 'the cloak can be hidden');

  const rings = () => ground.children.filter((c) => c.geometry?.type === 'RingGeometry').length;
  window.dispatchEvent(new CustomEvent('playerSkillStrike', { detail: { ascensionShockwave: false } }));
  window.dispatchEvent(new CustomEvent('playerSkillStrike', { detail: { ascensionShockwave: true } }));
  assert.equal(rings(), 1);
  for (let i = 0; i < 6; i++) rt.update(0.1);
  assert.equal(rings(), 0, 'the shockwave fades out');

  const bubble = model.getObjectByName('AXE_Ascension_Runtime').children.find((c) => c.geometry?.type === 'SphereGeometry');
  window.dispatchEvent(new CustomEvent('axeAscensionShield', { detail: { amount: 120, expiresAt: Date.now() + 60_000 } }));
  for (let i = 0; i < 5; i++) rt.update(0.1);
  assert.ok(bubble.visible && bubble.material.opacity > 0.2, 'a banked shield shows the bubble');
  window.dispatchEvent(new CustomEvent('axeAscensionShield', { detail: { amount: 120, expiresAt: Date.now() - 1 } }));
  for (let i = 0; i < 10; i++) rt.update(0.1);
  assert.equal(bubble.visible, false, 'the bubble goes when the shield fades, with no event');

  window.dispatchEvent(new CustomEvent('axeAscensionChanged', { detail: { ascended: false } }));
  rt.update(0.016); rt.lateUpdate();
  assert.equal(body.position.y, 0.4, 'back on the ground when not ascended');
  rt.dispose();
  assert.equal(model.children.length, 1, 'dispose removes everything it added');
  window.dispatchEvent(new CustomEvent('playerSkillStrike', { detail: { ascensionShockwave: true } }));
});

test('the hover is in metres whatever the avatar loader scaled the model to', () => {
  const model = new THREE.Group(); model.scale.setScalar(0.01); // a centimetre FBX rig
  const hips = new THREE.Bone(); model.add(hips);
  const rt = visual.createAXEAscensionVisualRuntime({ model, initialState: { ascended: true, cloakVisible: true, hoverHeight: 0.15 } });
  rt.update(0); rt.lateUpdate();
  assert.ok(Math.abs(hips.position.y * 0.01 - 0.15) < 1e-9, `0.15 m in world space: ${hips.position.y * 0.01}`);
  assert.ok(Math.abs(model.getObjectByName('AXE_Ascension_Runtime').scale.y * 0.01 - 1) < 1e-9, 'the cloak keeps its size in metres');
  rt.dispose();
  assert.equal(hips.position.y, 0);
});
