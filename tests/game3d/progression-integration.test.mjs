import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), 'axe-progression-'));
const dom = new JSDOM('', { url: 'http://localhost/' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent });
const intervals = [];
const nativeSetInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const timer = nativeSetInterval(...args); intervals.push(timer); return timer; };
const modules = {
  mounts: 'axe/progression/AXEMountStore.js', mountSystem: 'axe/progression/AXEMountSystem.js',
  spiritual: 'axe/progression/AXEMountSpiritualSystem.js',
  vanity: 'axe/progression/AXEVanityStore.js', vanitySystem: 'axe/progression/AXEVanitySystem.js',
  storage: 'characterStorage.jsx', halo: 'progression/haloStore.jsx',
  kills: 'killCountStore.jsx', hud: 'playerHUDStore.jsx',
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
const { mounts, mountSystem, spiritual, vanity, vanitySystem, storage, halo, kills, hud } =
  await import(pathToFileURL(path.join(temp, 'stores.mjs')));
let user = 0;
const reset = () => { storage.setStorageUser(`qa-${++user}`); return mounts.getAXEMountState().activeMountId; };
after(async () => { intervals.forEach(clearInterval); globalThis.setInterval = nativeSetInterval; dom.window.close(); await rm(temp, { recursive: true, force: true }); });

test('old mount saves keep growth, legendary rolls, and gain a zero-rank spiritual weapon', () => {
  const old = { ...mountSystem.createAXEMountInstance('axe_mount_war_wolf'), totalXp: 700,
    legendary: { isLegendary: true, abilities: [{ id: 'mount_attack', stat: 'damage', value: 30 }], passiveId: 'war_resonance' } };
  const migrated = mountSystem.normalizeAXEMountInstance(old);
  assert.equal(migrated.growthPercent, 20);
  assert.deepEqual(migrated.legendary, old.legendary);
  assert.deepEqual(migrated.spiritualWeapon, { rank: 0, mode: 'offensive' });
});

test('spiritual upgrade spends available XP once and preserves lifetime growth', () => {
  const id = reset(); mounts.awardAXEMountXP(id, 700);
  const before = mounts.getRegisteredAXEMountBonuses().damage;
  assert.equal(mounts.strengthenAXEMountSpiritualWeapon(id, { expectedRank: 0 }).reason, 'CONFIRMATION_REQUIRED');
  assert.equal(mounts.strengthenAXEMountSpiritualWeapon(id, { confirmed: true, expectedRank: 0 }).ok, true);
  const m = mounts.getAXEMountState().mounts[0];
  assert.equal(m.totalXp, 700); assert.equal(m.growthPercent, 20);
  assert.equal(m.spiritualProfile.availableXp, 200); assert.equal(m.spiritualProfile.investedXp, 500);
  assert.equal(mounts.getRegisteredAXEMountBonuses().damage - before, 8);
  assert.equal(mounts.strengthenAXEMountSpiritualWeapon(id, { confirmed: true, expectedRank: 0 }).reason, 'PREVIEW_CHANGED');
  assert.equal(mounts.strengthenAXEMountSpiritualWeapon(id, { confirmed: true, expectedRank: 1 }).reason, 'INSUFFICIENT_MOUNT_XP');
  storage.notifyCharacterChange();
  assert.equal(mounts.getAXEMountState().mounts[0].spiritualProfile.availableXp, 200);
});

test('mode changes update actual HUD combat stats and active mounted-speed path', () => {
  const id = reset(); mounts.awardAXEMountXP(id, 500);
  const base = { ...hud.getPlayerHUD().derived };
  const speed = mounts.getActiveAXEMountSpeedMultiplier();
  mounts.strengthenAXEMountSpiritualWeapon(id, { confirmed: true, expectedRank: 0 });
  assert.ok(hud.getPlayerHUD().derived.damage > base.damage);
  mounts.setAXEMountSpiritualMode(id, 'utility');
  const utility = hud.getPlayerHUD().derived;
  assert.equal(utility.damage, base.damage);
  assert.ok(utility.critChance > base.critChance);
  assert.ok(utility.evasionPct > base.evasionPct);
  assert.ok(Math.abs(mounts.getActiveAXEMountSpeedMultiplier() - speed - 0.002) < 1e-9);
  assert.equal(mounts.setAXEMountSpiritualMode(id, 'invalid').ok, false);
});

test('spiritual ranks are finite, capped, and must be funded', () => {
  assert.equal(spiritual.getMountSpiritualProfile({ totalXp: 0, spiritualWeapon: { rank: 20 } }).rank, 0);
  const capXp = spiritual.spiritualXPInvested(20);
  const full = { totalXp: capXp, spiritualWeapon: { rank: 999, mode: 'utility' } };
  assert.equal(spiritual.getMountSpiritualProfile(full).rank, 20);
  assert.equal(spiritual.advanceMountSpiritualWeapon(full, 20).reason, 'MAX_SPIRITUAL_RANK');
  for (const amount of [Infinity, NaN, -10, 0]) {
    assert.equal(mountSystem.addAXEMountXP(mountSystem.createAXEMountInstance('axe_mount_war_wolf'), amount).ok, false);
  }
});

test('invalid PvP XP does not consume the target cooldown; first target at zero is allowed', () => {
  const id = reset();
  assert.equal(mounts.awardAXEMountXP(id, 0, 'pvp', { opponentId: 'target', now: 0 }).ok, false);
  assert.deepEqual(mounts.getAXEMountState().pvpVictimCooldowns, {});
  assert.equal(mounts.awardAXEMountXP(id, 20, 'pvp', { opponentId: 'target', now: 0 }).ok, true);
  assert.equal(mounts.awardAXEMountXP(id, 20, 'pvp', { opponentId: 'target', now: 1 }).reason, 'PVP_REPEAT_TARGET_COOLDOWN');
  assert.equal(mounts.awardAXEMountXP(id, 20, 'pvp', { opponentId: 'target', now: 600000 }).ok, true);
});

test('mount snapshots cannot mutate saved XP or spiritual progression', () => {
  reset(); const snapshot = mounts.getAXEMountState();
  snapshot.mounts[0].sourceStats.pveXp = 999;
  snapshot.mounts[0].spiritualProfile.rank = 20;
  const active = mounts.getActiveAXEMount(); active.totalXp = 99999;
  assert.equal(mounts.getAXEMountState().mounts[0].sourceStats.pveXp, 0);
  assert.equal(mounts.getAXEMountState().mounts[0].spiritualProfile.rank, 0);
  assert.equal(mounts.getActiveAXEMount().totalXp, 0);
});

test('removed vanity stays removed after reload, including an entirely empty loadout', () => {
  reset();
  for (const slot of Object.keys(vanitySystem.AXE_VANITY_SLOTS)) vanity.unequipAXEVanitySlot(slot);
  storage.notifyCharacterChange();
  assert.deepEqual(vanity.getAXEVanityState().equippedBySlot, {});
  assert.deepEqual(vanity.getAXEVanityState().appearanceLayers, []);
  assert.equal(vanity.getEquippedAXEVanityBaseBonuses().flat.damage, 0);
});

test('vanity migration rejects unowned and wrong-slot items without resetting valid ownership', () => {
  reset(); storage.characterScopedStorage('axe_vanity_custom_pieces_v1').set(JSON.stringify({
    ownedPieceIds: ['axe_vanity_wanderer_head'],
    equippedBySlot: { head: 'axe_vanity_wanderer_torso', torso: 'axe_vanity_wanderer_head' },
  }));
  storage.notifyCharacterChange();
  assert.deepEqual(vanity.getAXEVanityState().ownedPieceIds, ['axe_vanity_wanderer_head']);
  assert.deepEqual(vanity.getAXEVanityState().equippedBySlot, {});
});

test('wrong-slot vanity cannot supply activation bonuses or appearance layers', () => {
  const wrong = { torso: 'axe_vanity_wanderer_head' };
  const profile = vanitySystem.collectAXEVanityActivationProfile(wrong, { axe_vanity_wanderer_head: { active: true, percent: 999 } });
  assert.equal(profile.hpPct, 0); assert.equal(profile.activePieces.length, 0);
  assert.deepEqual(vanitySystem.getAXEVanityAppearanceLayers(wrong), []);
});

test('vanity activation consumes one card, applies its locked percent, and cannot be duplicated', () => {
  const PCT = vanitySystem.AXE_VANITY_ACTIVATION_PERCENT; // power-budget balance (AXEVanitySystem)
  reset(); const id = 'axe_vanity_wanderer_leggings';
  const before = hud.getPlayerHUD().derived.damage;
  assert.equal(vanity.activateAXEVanityPiece(id, 'silver').ok, true);
  assert.equal(vanity.getAXEVanityState().cards.silver, 3);
  assert.equal(vanity.getEquippedAXEVanityActivationProfile().damagePct, PCT);
  assert.ok(hud.getPlayerHUD().derived.damage > before);
  assert.equal(vanity.activateAXEVanityPiece(id, 'gold').reason, 'ALREADY_ACTIVATED');
  assert.equal(vanity.getAXEVanityState().cards.gold, 2);
  const snapshot = vanity.getAXEVanityState(); snapshot.activationByPieceId[id].active = false;
  assert.equal(vanity.getEquippedAXEVanityActivationProfile().damagePct, PCT);
  vanity.unequipAXEVanitySlot('leggings');
  assert.equal(vanity.getEquippedAXEVanityActivationProfile().damagePct, 0);
});

test('character switching isolates earned XP, spiritual rank, vanity, and halo', () => {
  const id = reset(); const oldUser = storage.getStorageUser();
  mounts.awardAXEMountXP(id, 500);
  mounts.strengthenAXEMountSpiritualWeapon(id, { confirmed: true, expectedRank: 0 });
  vanity.unequipAXEVanitySlot('head'); halo.setHaloLevel(25);
  reset();
  assert.equal(mounts.getAXEMountState().mounts[0].totalXp, 0);
  assert.ok(vanity.getAXEVanityState().equippedBySlot.head);
  assert.equal(halo.getHaloState().level, 0);
  storage.setStorageUser(oldUser);
  assert.equal(mounts.getAXEMountState().mounts[0].spiritualProfile.rank, 1);
  assert.equal(vanity.getAXEVanityState().equippedBySlot.head, undefined);
  assert.equal(halo.getHaloState().level, 25);
});

test('halo batches consume actual kill currency and stop at existing cap', () => {
  reset(); kills.incrementKillCount(25);
  const original = Math.random; Math.random = () => 0;
  try {
    const summary = halo.attemptEnhancementBatch(10);
    assert.equal(summary.attempts, 2); assert.equal(kills.getKillCount(), 5);
    halo.setHaloLevel(199); kills.incrementKillCount(100);
    const atCap = halo.attemptEnhancementBatch(10);
    assert.equal(atCap.attempts, 1); assert.equal(atCap.finalLevel, 200);
    assert.equal(kills.getKillCount(), 95);
  } finally { Math.random = original; }
});
