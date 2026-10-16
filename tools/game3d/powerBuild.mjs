// Builds Game 3D heroes through the REAL stores (the code the game runs), for the power
// report (tools/game3d/stat-report.mjs) and the power-budget test.
//
// buildAXEHero(m, { level, progress, skip }) makes a fresh character at `level` with every
// system advanced to `progress` (0..1) and returns its live derived stats. `skip` leaves
// whole groups out, which is how each group's share is measured: what the hero loses
// without it.
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const AXE_POWER_GROUPS = Object.freeze({
  character: 'Level, stat points, elixirs, weapon affinity',
  gear: 'Gear and every upgrade',
  prestige: 'Halo, aura, wings, titles',
  companions: 'Pet, mount, cores, cape',
  appearance: 'Costume, vanity',
  ascension: 'Taurus Chosen Ascension',
});

const MODULES = {
  storage: 'characterStorage.jsx', hud: 'playerHUDStore.jsx', stats: 'statsSystem.jsx',
  halo: 'progression/haloStore.jsx', aura: 'progression/auraStore.jsx',
  wings: 'progression/wingsStore.jsx', wingsData: 'progression/wingsData.jsx',
  titles: 'progression/titleStore.jsx', titleData: 'progression/titleData.jsx',
  elixir: 'axe/progression/AXEElixirStore.js', elixirSys: 'axe/progression/AXEElixirSystem.js',
  cape: 'axe/progression/AXECapeStore.js', capeSys: 'axe/progression/AXECapeSystem.js',
  core: 'axe/progression/AXECoreStore.js', coreSys: 'axe/progression/AXECoreSystem.js',
  pet: 'axe/progression/AXEPetStore.js', petSys: 'axe/progression/AXEPetSystem.js',
  mount: 'axe/progression/AXEMountStore.js',
  costume: 'axe/progression/AXECostumeStore.js', costumeSys: 'axe/progression/AXECostumeSystem.js',
  vanity: 'axe/progression/AXEVanityStore.js', vanitySys: 'axe/progression/AXEVanitySystem.js',
  inv: 'axe/equipment/AXEEquipmentInventoryStore.js', invData: 'equipment/inventoryData.jsx',
  enhance: 'axe/equipment/AXEItemEnhancementSystem.js', advance: 'axe/equipment/AXEItemAdvancementSystem.js',
  runtimeStats: 'axe/equipment/AXEEquipmentRuntimeStats.js', loot: 'axe/loot/AXEEquipmentLootSystem.js',
  affinity: 'axe/weapons/AXEWeaponAffinityStore.js', archetypes: 'axe/weapons/AXEWeaponArchetypes.js',
  asc: 'axe/progression/AXEAscensionStore.js', world: 'gameWorldConfig.jsx',
  budget: 'axe/balance/AXEPowerBudget.js', combat: 'axe/combat/AXECombatMath.js',
};

// Bundles the stores once with a browser stand-in; returns their modules.
export async function loadAXEStores(root = process.cwd()) {
  if (!globalThis.window) {
    const dom = new JSDOM('', { url: 'http://localhost/', virtualConsole: new VirtualConsole() });
    Object.assign(globalThis, { window: dom.window, document: dom.window.document,
      localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent });
  }
  globalThis.Audio ||= class { play() { return Promise.resolve(); } pause() {} load() {} addEventListener() {} removeEventListener() {} };
  const temp = await mkdtemp(path.join(tmpdir(), 'axe-power-'));
  await build({ stdin: { contents: Object.entries(MODULES).map(([n, f]) => `export * as ${n} from './src/components/game3d/${f}';`).join('\n'), resolveDir: root },
    bundle: true, jsx: 'automatic', format: 'esm', platform: 'node', outfile: path.join(temp, 'stores.mjs'),
    alias: { '@': path.join(root, 'src') }, define: { 'import.meta.env': '{}' },
    plugins: [{ name: 'offline-service-boundary', setup(b) {
      b.onResolve({ filter: /api\/base44Client/ }, () => ({ path: 'base44-offline', namespace: 'offline' }));
      b.onLoad({ filter: /.*/, namespace: 'offline' }, () => ({ contents: 'export const base44 = { auth: { updateMe: async () => ({}), me: async () => ({}) } };' }));
    } }], logLevel: 'silent' });
  return { ...(await import(pathToFileURL(path.join(temp, 'stores.mjs')))), temp };
}

const RARITY_BY_PROGRESS = ['common', 'uncommon', 'rare', 'elite', 'legendary', 'heroic'];
const RARITY_SCALE = { common: 1, uncommon: 1.08, rare: 1.18, elite: 1.32, legendary: 1.52, heroic: 1.8 }; // AXEEquipmentLootSystem
const BUILD_SPLIT = { strength: 0.4, dexterity: 0.2, constitution: 0.27, focus: 0.13 }; // a balanced melee build
const GEAR_SLOTS = ['weapon', 'helm', 'chest', 'gloves', 'legs', 'boots', 'ring', 'ring', 'necklace', 'trinket'];
let heroCount = 0;

const score = (o = {}) => (o.damage || o.attack || 0) * 3 + (o.defense || 0) * 2 + (o.hp || o.maxHP || 0) * 0.2
  + ['strength', 'dexterity', 'constitution', 'focus', 'vitality', 'spirit'].reduce((s, k) => s + (o[k] || 0) * 5, 0);
const ranked = (defs, bonusOf) => Object.values(defs).map((d) => ({ d, s: score(bonusOf(d)) })).sort((a, b) => a.s - b.s).map((x) => x.d);
const pick = (list, p) => list[Math.min(list.length - 1, Math.floor(p * list.length * 0.999))];

// The multiplier every upgrade path gives one item at `p` of its maximum.
export function gearUpgradeMultiplier(m, p) {
  const E = m.enhance, A = m.advance, c = m.runtimeStats.AXE_ADVANCEMENT_STAT_CONFIG;
  const enhancement = E.getAXEEnhancementStatMultiplier({
    reinforcement: { percent: Math.round((E.AXE_REINFORCEMENT_CONFIG.maxPercent * p) / 5) * 5 },
    enchantments: Array(E.AXE_ENCHANTMENT_CONFIG.slots).fill(Math.round(E.AXE_ENCHANTMENT_CONFIG.maxLevelPerSlot * p)),
    overEnchant: { level: Math.round(E.AXE_OVER_ENCHANT_CONFIG.maxLevel * p) },
  });
  const advancement = 1 + Math.round(A.AXE_COMBINE_CONFIG.maxCombines * p) * c.combinePerSuccess
    + Math.round((A.AXE_STAGE_CONFIG.stages.length - 1) * p) * c.stagePerRank
    + Math.round(A.AXE_REFINE_CONFIG.maxLevel * p) * c.refinePerLevel + Math.round(A.AXE_ULTIMATE_CONFIG.maxLevel * p) * c.ultimatePerLevel;
  return enhancement * advancement;
}

export function buildAXEHero(m, { level = 100, progress = 1, skip = new Set(), nature = 'balanced', fusion = false, wingPath = null } = {}) {
  const p = Math.max(0, Math.min(1, progress));
  const on = (group) => !skip.has(group);
  m.storage.setStorageUser(`power-hero-${++heroCount}-${Date.now()}`);
  for (const it of m.inv.getEquippedAXEItems()) m.inv.unequipAXEInventoryItem(it.instanceId); // gear is the gear group's
  m.hud.setPlayerHUD({ level });

  if (on('character')) {
    const points = 3 * (level - 1);
    const plan = Object.fromEntries(Object.entries(BUILD_SPLIT).map(([k, f]) => [k, Math.floor(points * f)]));
    plan.strength += points - Object.values(plan).reduce((a, b) => a + b, 0);
    if (points > 0) { m.hud.setPlayerHUD({ unspentPoints: (m.hud.getPlayerHUD().unspentPoints || 0) + points }); m.hud.applyAttributeAllocationPlan(plan); }
    const types = Object.keys(m.elixirSys.AXE_ELIXIR_TYPES);
    const each = Math.floor((m.elixirSys.AXE_ELIXIR_CONFIG.baseCapacity * p) / types.length);
    if (each > 0) for (const t of types) { m.elixir.grantAXEElixirs(t, each); m.elixir.useAXEElixir(t, each); }
  }
  if (on('prestige') && p > 0) {
    m.halo.setHaloLevel(Math.round(200 * p));
    m.aura.setAuraLevel(Math.round(200 * p));
    const wing = (wingPath && m.wingsData.getWingPathById(wingPath)) || ranked(m.wingsData.WING_PATHS, (w) => m.wingsData.getWingFlatBonusesForLevel(w.id, 200)).at(-1);
    m.wings.setWingLevel(wing.id, Math.round(200 * p)); m.wings.equipWings(wing.id);
    m.wings.grantWingMaterials({ wing_feather: 1e6, wing_essence: 1e6, wing_stabilizer: 1e6 });
    const reinforce = Math.round((120 * p) / 5) * 5;
    for (let i = 0; i < 200 && (m.wings.getWingsState().paths[wing.id]?.reinforcementPercent || 0) < reinforce; i++) m.wings.attemptWingReinforcement(wing.id, { roll: 0 });
    const title = ranked(m.titleData.TITLE_PATHS, (t) => ({ ...m.titleData.getTitleBonusesForLevel(t.id, 15), ...m.titleData.getTitleAttributeBonusesForLevel(t.id, 15) })).at(-1);
    const tl = Math.round(15 * p); if (tl > 0) { m.titles.setTitleLevel(title.id, tl); m.titles.equipTitle(title.id); }
  }
  if (on('companions') && p > 0) {
    const cape = pick(ranked(m.capeSys.AXE_CAPE_DEFINITIONS, (c) => c.stats), p); m.cape.grantAXECape(cape.id); m.cape.equipAXECape(cape.id);
    const cores = ranked(m.coreSys.AXE_CORE_DEFINITIONS, (d) => m.coreSys.getAXECoreBonuses({ ...m.coreSys.createAXECoreInstance(d.id), level: 20 })).slice(-2);
    const coreLevel = Math.max(1, Math.round(20 * p));
    for (const d of cores.slice(p >= 0.2 ? 0 : 1)) {
      m.core.grantAXECoreEssence(10_000_000); m.core.grantAXECore(d.id);
      const id = m.core.getAXECoreState().cores.at(-1)?.instanceId;
      for (let i = 0; i < 400 && (m.core.getAXECoreState().cores.find((c) => c.instanceId === id)?.level || 1) < coreLevel; i++) if (!m.core.upgradeAXECore(id, { xpAmount: 50 }).ok) break;
      m.core.registerAXECore(id);
    }
    const pet = ranked(m.petSys.AXE_PET_DEFINITIONS, (d) => m.petSys.getAXEPetStatBonuses({ ...m.petSys.createAXEPetInstance(d.id), level: 200, overEnchantPercent: 200 })).at(-1);
    const g = m.pet.grantAXEPet(pet.id, { level: Math.max(1, Math.round(200 * p)), overEnchantPercent: Math.round((200 * p) / 5) * 5 });
    m.pet.registerAXEPet(g.pet.instanceId);
    const s = m.mount.getAXEMountState(); const id = s.registeredMountId || s.mounts[0]?.instanceId;
    if (id) {
      if (!s.registeredMountId) m.mount.registerAXEMount(id);
      for (let i = 0; i < 2000; i++) {
        const growth = m.mount.getAXEMountState().mounts.find((x) => x.instanceId === id)?.growthPercent || 0;
        if (growth >= 100 * p - 1e-9) break;
        m.mount.awardAXEMountXP(id, 25);
      }
    }
  }
  if (on('appearance') && p > 0) {
    if (p >= 0.5) { const c = ranked(m.costumeSys.AXE_COSTUME_DEFINITIONS, (d) => m.costumeSys.getAXECostumeBonuses(d.id)).at(-1); m.costume.grantAXECostume(c.id); m.costume.equipAXECostume(c.id); }
    const card = Object.keys(m.vanitySys.AXE_VANITY_CARD_TYPES).at(-1); const bySlot = {};
    for (const piece of Object.values(m.vanitySys.AXE_VANITY_PIECES)) bySlot[piece.slot] ||= piece;
    for (const piece of Object.values(bySlot).slice(0, Math.round(4 * p))) {
      m.vanity.grantAXEVanityPiece(piece.id); m.vanity.equipAXEVanityPiece(piece.id); m.vanity.grantAXEVanityCard(card, 1); m.vanity.activateAXEVanityPiece(piece.id, card);
    }
  }
  if (on('gear')) {
    const rarity = RARITY_BY_PROGRESS[Math.min(5, Math.floor(p * 6 * 0.999))];
    const scale = RARITY_SCALE[rarity] * m.loot.getAXELootLevelScale(level) * 1.1 * gearUpgradeMultiplier(m, p); // quality 10
    const used = new Set();
    for (const slot of GEAR_SLOTS) {
      const tpl = Object.values(m.invData.INVENTORY).flat().find((t) => t.slot === slot && !used.has(t.id) && Object.keys(t.baseStats || {}).length);
      if (!tpl) continue; used.add(tpl.id);
      // as a real drop and its upgrades would: flat stats scale with everything, rate stats with rarity only
      const baseStats = Object.fromEntries(Object.entries(tpl.baseStats).map(([k, v]) => [k, v * (m.runtimeStats.isAXERateStat(k) ? RARITY_SCALE[rarity] : scale)]));
      m.inv.addAXEEquipmentItem({ ...tpl, instanceId: undefined, id: `${tpl.id}_par`, category: tpl.category || slot, rarity, baseStats }, { equipped: true });
    }
    if (on('character') && p > 0.3) {
      const weapon = m.inv.getEquippedAXEItems().find((it) => it.slot === 'weapon');
      const arch = weapon && m.archetypes.inferAXEWeaponArchetype(weapon);
      if (arch) m.affinity.setAXESpecializedArchetype(arch);
    }
  }
  if (on('ascension') && level >= 100 && p >= 1) { m.asc.ascendAXECharacter({ level, confirmed: true }); m.asc.setAXEAscensionNature(nature); }
  if (fusion) m.mount.absorbAXEMount('absorption_pill_s');
  return { ...m.hud.getPlayerHUD().derived, level };
}

// A hero's effective power against an even-level normal enemy: offense is its average
// swing (misses, crits and attribute damage included), survival is how many of the
// enemy's average swings it takes to fall (HP, defense, Block and crit defense included).
export function effectivePower(m, hero) {
  const enemy = m.budget.getAXEEnemyStats(hero.level, 'normal');
  return { offense: m.budget.getAXEExpectedHit(hero, enemy), survival: hero.maxHP / m.budget.getAXEExpectedHit(enemy, hero) };
}

// Each group's share of a hero's power: what the hero loses without it.
export function measureAXEGroupShares(m, opts = {}) {
  const full = buildAXEHero(m, opts);
  const fullPower = effectivePower(m, full);
  const shares = {};
  for (const group of Object.keys(AXE_POWER_GROUPS)) {
    const without = buildAXEHero(m, { ...opts, skip: new Set([group]) });
    const power = effectivePower(m, without);
    shares[group] = {
      damage: 1 - without.damage / full.damage, hp: 1 - without.maxHP / full.maxHP,
      offense: 1 - power.offense / fullPower.offense, survival: 1 - power.survival / fullPower.survival,
    };
  }
  // Losses overlap (removing a group also removes its part of the % pool and the Nature), so
  // each group's share is its loss over the sum of all losses: the shares add up to 100%.
  for (const k of ['damage', 'hp', 'offense', 'survival']) {
    const total = Object.values(shares).reduce((sum, v) => sum + Math.max(0, v[k]), 0) || 1;
    for (const v of Object.values(shares)) v[`${k}Share`] = Math.max(0, v[k]) / total;
  }
  return { full, fullPower, shares };
}
