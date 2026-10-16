// Game 3D power report: builds one character up system by system through the REAL stores
// (the same code the game runs), records the live derived stats after each step, and
// compares the result with the enemies the world spawns.
//
//   node tools/game3d/stat-report.mjs
//
// Output is Markdown; docs/game3d/STAT_SYSTEM_AUDIT.md was made from it.
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const dom = new JSDOM('', { url: 'http://localhost/', virtualConsole: new VirtualConsole() });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent });
globalThis.Audio = class { play() { return Promise.resolve(); } pause() {} load() {} addEventListener() {} removeEventListener() {} };

const modules = {
  storage: 'characterStorage.jsx', hud: 'playerHUDStore.jsx', stats: 'statsSystem.jsx',
  halo: 'progression/haloStore.jsx', haloData: 'progression/haloData.jsx',
  aura: 'progression/auraStore.jsx', auraData: 'progression/auraData.jsx',
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
  runtimeStats: 'axe/equipment/AXEEquipmentRuntimeStats.js',
  asc: 'axe/progression/AXEAscensionStore.js', world: 'gameWorldConfig.jsx',
};
const temp = await mkdtemp(path.join(tmpdir(), 'axe-stat-report-'));
await build({ stdin: { contents: Object.entries(modules).map(([n, f]) => `export * as ${n} from './src/components/game3d/${f}';`).join('\n'), resolveDir: root },
  bundle: true, jsx: 'automatic', format: 'esm', platform: 'node', outfile: path.join(temp, 'stores.mjs'),
  alias: { '@': path.join(root, 'src') }, define: { 'import.meta.env': '{}' },
  plugins: [{ name: 'offline-service-boundary', setup(b) {
    b.onResolve({ filter: /api\/base44Client/ }, () => ({ path: 'base44-offline', namespace: 'offline' }));
    b.onLoad({ filter: /.*/, namespace: 'offline' }, () => ({ contents: 'export const base44 = { auth: { updateMe: async () => ({}), me: async () => ({}) } };' }));
  } }], logLevel: 'silent' });
const m = await import(pathToFileURL(path.join(temp, 'stores.mjs')));
const { storage, hud, stats } = m;
storage.setStorageUser(`stat-report-${Date.now()}`);

const KEYS = ['damage', 'defense', 'maxHP', 'chi', 'critChance'];
const snap = () => { const d = hud.getPlayerHUD().derived; return Object.fromEntries(KEYS.map((k) => [k, Number(d[k] || 0)])); };
const rows = [{ label: 'Starting hero (level 1, starter kit)', note: '', now: snap() }];
const step = (label, fn) => {
  let note = '';
  try { note = fn() || ''; } catch (e) { note = `ERROR ${e.message}`; }
  rows.push({ label, note, now: snap() });
};
const score = (o = {}) => (o.damage || o.attack || 0) * 3 + (o.defense || 0) * 2 + (o.hp || o.maxHP || 0) * 0.2
  + ['strength', 'dexterity', 'constitution', 'focus', 'vitality', 'spirit'].reduce((s, k) => s + (o[k] || 0) * 5, 0);
const best = (defs, bonusOf) => Object.values(defs).map((d) => ({ d, s: score(bonusOf(d)) })).sort((a, b) => b.s - a.s)[0]?.d;

step('Level 100, 297 stat points', () => {
  hud.setPlayerHUD({ level: 100, unspentPoints: (hud.getPlayerHUD().unspentPoints || 0) + 297 });
  const r = hud.applyAttributeAllocationPlan({ strength: 120, dexterity: 60, constitution: 80, focus: 37 });
  return r.ok ? 'STR 120 / AGI 60 / VIT 80 / SPI 37' : r.reason;
});
step('Halo 200/200', () => { m.halo.setHaloLevel(m.haloData.MAX_HALO_LEVEL); });
step('Aura 200/200', () => { m.aura.setAuraLevel(m.auraData.MAX_AURA_LEVEL); });
step('Wings 200/200 (strongest path)', () => {
  const p = m.wingsData.WING_PATHS.map((w) => ({ w, s: score(m.wingsData.getWingFlatBonusesForLevel(w.id, 200)) })).sort((a, b) => b.s - a.s)[0].w;
  m.wings.setWingLevel(p.id, m.wingsData.MAX_WING_LEVEL); m.wings.equipWings(p.id);
  return `${p.name}; wing reinforcement left at 0%`;
});
step('Title 15/15 (strongest path)', () => {
  const p = m.titleData.TITLE_PATHS.map((t) => ({ t, s: score(m.titleData.getTitleBonusesForLevel(t.id, 15)) + score(m.titleData.getTitleAttributeBonusesForLevel(t.id, 15)) })).sort((a, b) => b.s - a.s)[0].t;
  m.titles.setTitleLevel(p.id, m.titleData.MAX_TITLE_LEVEL); m.titles.equipTitle(p.id);
  return p.name;
});
step('Elixirs, full capacity', () => {
  const types = Object.keys(m.elixirSys.AXE_ELIXIR_TYPES);
  const each = Math.floor(m.elixirSys.AXE_ELIXIR_CONFIG.baseCapacity / types.length);
  for (const t of types) { m.elixir.grantAXEElixirs(t, each); m.elixir.useAXEElixir(t, each); }
  return `${each} of each: ${types.join(', ')}`;
});
step('Cape (strongest)', () => { const d = best(m.capeSys.AXE_CAPE_DEFINITIONS, (c) => c.stats); m.cape.grantAXECape(d.id); m.cape.equipAXECape(d.id); return d.id; });
step('Cores (2 strongest, level 20)', () => {
  const defs = Object.values(m.coreSys.AXE_CORE_DEFINITIONS).map((d) => ({ d, s: score(m.coreSys.getAXECoreBonuses({ ...m.coreSys.createAXECoreInstance(d.id), level: 20 })) }))
    .sort((a, b) => b.s - a.s).slice(0, 2).map((x) => x.d);
  const levels = [];
  for (const d of defs) {
    m.core.grantAXECoreEssence(10_000_000); m.core.grantAXECore(d.id);
    const id = m.core.getAXECoreState().cores.at(-1)?.instanceId;
    for (let i = 0; i < 400; i++) if (!m.core.upgradeAXECore(id, { xpAmount: 1000 }).ok) break;
    m.core.registerAXECore(id); levels.push(`${d.id} lv${m.core.getAXECoreState().cores.find((c) => c.instanceId === id)?.level}`);
  }
  return levels.join(', ');
});
step('Pet (strongest, level 200, over-enchant 200%)', () => {
  const d = best(m.petSys.AXE_PET_DEFINITIONS, (p) => m.petSys.getAXEPetStatBonuses({ ...m.petSys.createAXEPetInstance(p.id), level: 200, overEnchantPercent: 200 }));
  const g = m.pet.grantAXEPet(d.id, { level: 200, overEnchantPercent: 200 }); m.pet.registerAXEPet(g.pet.instanceId); return d.id;
});
step('Mount (registered, 100% growth)', () => {
  const s = m.mount.getAXEMountState(); const id = s.registeredMountId || s.mounts[0]?.instanceId;
  if (!s.registeredMountId && id) m.mount.registerAXEMount(id);
  m.mount.awardAXEMountXP(id, 10_000_000);
});
step('Costume (strongest)', () => { const d = best(m.costumeSys.AXE_COSTUME_DEFINITIONS, (c) => m.costumeSys.getAXECostumeBonuses(c.id)); m.costume.grantAXECostume(d.id); m.costume.equipAXECostume(d.id); return d.id; });
step('Vanity (4 slots, top card)', () => {
  const card = Object.keys(m.vanitySys.AXE_VANITY_CARD_TYPES).at(-1); const bySlot = {};
  for (const p of Object.values(m.vanitySys.AXE_VANITY_PIECES)) bySlot[p.slot] ||= p;
  for (const p of Object.values(bySlot)) { m.vanity.grantAXEVanityPiece(p.id); m.vanity.equipAXEVanityPiece(p.id); m.vanity.grantAXEVanityCard(card, 1); m.vanity.activateAXEVanityPiece(p.id, card); }
  return `${card} card`;
});
step('Gear: heroic Lv100 Q20 drops, every upgrade maxed', () => {
  for (const it of m.inv.getEquippedAXEItems()) m.inv.unequipAXEInventoryItem(it.instanceId);
  const loot = 1.8 * (1 + 99 * 0.025) * 1.2; // AXEEquipmentLootSystem: heroic x level 100 x quality 20
  const E = m.enhance, A = m.advance;
  const enhancement = E.getAXEEnhancementStatMultiplier({ reinforcement: { percent: E.AXE_REINFORCEMENT_CONFIG.maxPercent },
    enchantments: Array(E.AXE_ENCHANTMENT_CONFIG.slots).fill(E.AXE_ENCHANTMENT_CONFIG.maxLevelPerSlot), overEnchant: { level: E.AXE_OVER_ENCHANT_CONFIG.maxLevel } });
  const c = m.runtimeStats.AXE_ADVANCEMENT_STAT_CONFIG;
  const advancement = 1 + A.AXE_COMBINE_CONFIG.maxCombines * c.combinePerSuccess + (A.AXE_STAGE_CONFIG.stages.length - 1) * c.stagePerRank
    + A.AXE_REFINE_CONFIG.maxLevel * c.refinePerLevel + A.AXE_ULTIMATE_CONFIG.maxLevel * c.ultimatePerLevel;
  const used = new Set(); let n = 0;
  for (const slot of ['weapon', 'helm', 'chest', 'gloves', 'legs', 'boots', 'ring', 'ring', 'necklace', 'trinket']) {
    const tpl = Object.values(m.invData.INVENTORY).flat().find((t) => t.slot === slot && !used.has(t.id) && Object.keys(t.baseStats || {}).length);
    if (!tpl) continue; used.add(tpl.id);
    const baseStats = Object.fromEntries(Object.entries(tpl.baseStats).map(([k, v]) => [k, v * loot * enhancement * advancement]));
    if (m.inv.addAXEEquipmentItem({ ...tpl, instanceId: undefined, id: `${tpl.id}_max`, category: tpl.category || slot, rarity: 'heroic', baseStats }, { equipped: true }).ok) n++;
  }
  return `${n} pieces; drop x${loot.toFixed(2)}, enhancement x${enhancement.toFixed(2)}, advancement x${advancement.toFixed(3)}; sockets, item auras and sets not included`;
});
step('Taurus Chosen Ascension (Balanced)', () => { m.asc.ascendAXECharacter({ level: 100, confirmed: true }); m.asc.setAXEAscensionNature('balanced'); });
step('Mount Soul Fusion (absorbed)', () => { const r = m.mount.absorbAXEMount('absorption_pill_s'); return r.ok ? `share ${m.mount.getAXEMountFusionState().share}%` : r.reason; });

const final = rows.at(-1).now;
const n0 = (v) => (Math.abs(v) >= 100 ? Math.round(v).toLocaleString('en-US') : String(Number(v.toFixed(1))));
const pct = (v, total) => `${((v / total) * 100).toFixed(1)}%`;
console.log('| Step | Damage | Share of final damage | Max HP | Share of final HP | Defense | Crit % | Notes |');
console.log('|---|---|---|---|---|---|---|---|');
rows.forEach((r, i) => {
  const prev = i ? rows[i - 1].now : { damage: 0, maxHP: 0 };
  const dd = r.now.damage - prev.damage, dh = r.now.maxHP - prev.maxHP;
  console.log(`| ${r.label} | ${i ? '+' : ''}${n0(dd)} | ${pct(dd, final.damage)} | ${i ? '+' : ''}${n0(dh)} | ${pct(dh, final.maxHP)} | ${n0(r.now.defense)} | ${n0(r.now.critChance)} | ${r.note} |`);
});
console.log(`| **Total** | **${n0(final.damage)}** | | **${n0(final.maxHP)}** | | **${n0(final.defense)}** | **${n0(final.critChance)}** | |`);

const versus = (hero, label) => {
  console.log(`\n${label}\n\n| Enemy | Level | HP | Attack | Defense | Hero's hit | Hits to kill | Enemy's hit | Hits to kill the hero |`);
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const tier of m.world.ENEMY_TIERS) {
    const e = stats.computeDerivedStats(stats.ENEMY_STAT_TEMPLATES[tier.name], []);
    const heroHit = Math.max(1, Math.round(hero.damage - e.defense)), enemyHit = Math.max(1, Math.round(e.damage - hero.defense));
    console.log(`| ${tier.name} | ${tier.level} | ${e.maxHP} | ${e.damage} | ${n0(e.defense)} | ${n0(heroHit)} | ${Math.ceil(e.maxHP / heroHit)} | ${enemyHit} | ${n0(Math.ceil(hero.maxHP / enemyHit))} |`);
  }
};
versus(rows[0].now, '**Starting hero against every enemy tier** (plain hits: no crits, skills or level modifier)');
versus(final, '**Fully built hero against every enemy tier**');
dom.window.close(); await rm(temp, { recursive: true, force: true });
process.exit(0);
