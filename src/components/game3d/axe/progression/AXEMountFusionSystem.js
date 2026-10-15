// Wuxia blueprint §4 — Mount Soul Fusion: seven mount gear slots, the
// combination stat share and absorption. docs/game3d/WUXIA_BLUEPRINT_GAP_MAP.md
//
// Combination share = base share (25% at full mount growth, scaled by the
// existing 0–100% growth that stands in for the blueprint's mount level 1–50)
// + 2% for every gear slot refined to Stage 20 (7 × 2% = +14%), so 25% → 39%.
// While absorbed (an Absorption Pill: 60 or 600 minutes) the share multiplies
// the character's equipment stats: S_absorbed = S_gear × (1 + C / 100).
//
// Pure rules: no store imports, so AXEMountSystem can normalize gear without
// an import cycle. Costs and the starter pills are provisional balance.

export const AXE_MOUNT_GEAR_SLOTS = Object.freeze([
  Object.freeze({ id: 'bitting', label: 'Headpiece & Bitting' }),
  Object.freeze({ id: 'saddle', label: 'Saddle' }),
  Object.freeze({ id: 'barding', label: 'Chest Barding' }),
  Object.freeze({ id: 'stirrups', label: 'Leg Guards & Stirrups' }),
  Object.freeze({ id: 'reins', label: 'Reins' }),
  Object.freeze({ id: 'harness', label: 'Reinforced Harness' }),
  Object.freeze({ id: 'core', label: 'Mount Core Jewel' }),
]);

export const AXE_MOUNT_FUSION_CONFIG = Object.freeze({
  baseShareMax: 25,
  maxGearStage: 20,
  sharePerMaxedGear: 2,
  stageGoldPerLevel: 150, // Stage n -> n+1 costs 150 x (n+1) gold: 31,500 per slot to Stage 20
  pills: Object.freeze({
    absorption_pill_s: Object.freeze({ id: 'absorption_pill_s', label: 'Absorption Pill (S)', minutes: 60 }),
    absorption_pill_600: Object.freeze({ id: 'absorption_pill_600', label: 'Absorption Pill (600 min)', minutes: 600 }),
  }),
});

// The energy that streams from the absorbed mount, by clan: the blueprint's
// Ninja Clan blue-and-black, Flame Imugi crimson-orange, Water Qilin azure,
// and a jade spirit current. Mounts without an entry use their specialty.
const PALETTES = Object.freeze({
  flame: Object.freeze({ id: 'flame', label: 'Flame', primary: '#ff5a1f', secondary: '#ffb347', core: '#fff1d6' }),
  water: Object.freeze({ id: 'water', label: 'Water', primary: '#2f8bff', secondary: '#8fd3ff', core: '#e6f6ff' }),
  spirit: Object.freeze({ id: 'spirit', label: 'Spirit', primary: '#22d3a6', secondary: '#a7f3d0', core: '#ecfff8' }),
  ninja: Object.freeze({ id: 'ninja', label: 'Ninja Clan', primary: '#3b4dff', secondary: '#0b0d1a', core: '#c7d0ff' }),
});
const BY_MOUNT = Object.freeze({
  axe_mount_war_wolf: 'flame',
  axe_mount_iron_wolf: 'water',
  axe_mount_spirit_wolf: 'spirit',
  axe_mount_vanguard_wolf: 'ninja',
});
const BY_SPECIALTY = Object.freeze({ attack: 'flame', defense: 'water', attribute: 'spirit', balanced: 'ninja' });

export function getAXEMountSoulPalette(definition) {
  const id = BY_MOUNT[definition?.id] || BY_SPECIALTY[definition?.specialty] || 'ninja';
  return PALETTES[id];
}

const clampStage = (v) => Math.max(0, Math.min(AXE_MOUNT_FUSION_CONFIG.maxGearStage, Math.floor(Number(v) || 0)));

// Old saves have no gear: every slot starts at Stage 0.
export function normalizeAXEMountGear(gear) {
  const src = gear && typeof gear === 'object' ? gear : {};
  return Object.fromEntries(AXE_MOUNT_GEAR_SLOTS.map((s) => [s.id, { stage: clampStage(src[s.id]?.stage) }]));
}

export function getAXEMountCombinationShare(mount) {
  const growth = Math.max(0, Math.min(100, Number(mount?.growthPercent) || 0));
  const gear = normalizeAXEMountGear(mount?.gear);
  const maxedPieces = AXE_MOUNT_GEAR_SLOTS.filter((s) => gear[s.id].stage >= AXE_MOUNT_FUSION_CONFIG.maxGearStage).length;
  const base = Number((AXE_MOUNT_FUSION_CONFIG.baseShareMax * growth / 100).toFixed(2));
  const fromGear = maxedPieces * AXE_MOUNT_FUSION_CONFIG.sharePerMaxedGear;
  return { growthPercent: growth, base, gear: fromGear, maxedPieces, total: Number((base + fromGear).toFixed(2)) };
}

export function getAXEMountGearStageCost(stage) {
  return { gold: AXE_MOUNT_FUSION_CONFIG.stageGoldPerLevel * (clampStage(stage) + 1) };
}

// Pure: returns the mount with one slot a stage higher. The store spends the cost.
export function refineAXEMountGearSlot(mount, slotId, expectedStage) {
  if (!AXE_MOUNT_GEAR_SLOTS.some((s) => s.id === slotId)) return { ok: false, reason: 'UNKNOWN_GEAR_SLOT' };
  const gear = normalizeAXEMountGear(mount?.gear);
  const stage = gear[slotId].stage;
  if (stage >= AXE_MOUNT_FUSION_CONFIG.maxGearStage) return { ok: false, reason: 'MAX_GEAR_STAGE' };
  if (expectedStage !== undefined && expectedStage !== stage) return { ok: false, reason: 'STALE_REVIEW' };
  return {
    ok: true,
    cost: getAXEMountGearStageCost(stage),
    mount: { ...mount, gear: { ...gear, [slotId]: { stage: stage + 1 } } },
    stage: stage + 1,
  };
}

// The equipment contribution while absorbed: every number × (1 + share / 100).
export function scaleAXEGearForFusion(bonuses = {}, sharePercent = 0) {
  const k = 1 + Math.max(0, Number(sharePercent) || 0) / 100;
  if (k === 1) return bonuses;
  return Object.fromEntries(Object.entries(bonuses || {}).map(([key, v]) => [key, typeof v === 'number' ? v * k : v]));
}
