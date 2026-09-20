import { collectAXELegendaryMountBonuses } from './AXELegendaryMountSystem';

// AXE Prompt 034 — Mount foundation: riding, EXP, PvP growth and stat percentages.
// Mount progression is separate from Pet progression even when a placeholder
// creature model is shared by both systems.

export const AXE_MOUNT_CONFIG = Object.freeze({
  maxGrowthPercent: 100,
  pvpRepeatTargetCooldownMs: 10 * 60 * 1000,
  rideRewardWindowSeconds: 30,
  rideRewardMinimumDistanceMeters: 25,
});

export const AXE_MOUNT_GROWTH_BANDS = Object.freeze([
  Object.freeze({ percent: 0, totalXpRequired: 0 }),
  Object.freeze({ percent: 5, totalXpRequired: 100 }),
  Object.freeze({ percent: 10, totalXpRequired: 250 }),
  Object.freeze({ percent: 15, totalXpRequired: 450 }),
  Object.freeze({ percent: 20, totalXpRequired: 700 }),
  Object.freeze({ percent: 30, totalXpRequired: 1100 }),
  Object.freeze({ percent: 40, totalXpRequired: 1650 }),
  Object.freeze({ percent: 60, totalXpRequired: 2500 }),
  Object.freeze({ percent: 80, totalXpRequired: 3600 }),
  Object.freeze({ percent: 100, totalXpRequired: 5000 }),
]);

export const AXE_MOUNT_XP_REWARDS = Object.freeze({
  rideWindow: 5,
  pveBase: 5,
  pvpBase: 20,
});

export const AXE_MOUNT_DEFINITIONS = Object.freeze({
  axe_mount_war_wolf: Object.freeze({
    id: 'axe_mount_war_wolf',
    name: 'War Wolf',
    rarity: 'rare',
    specialty: 'attack',
    modelRef: 'shadow_wolf',
    baseSpeedMultiplier: 1.55,
    maxSpeedGrowthBonus: 0.35,
    maxStats: Object.freeze({ hp: 500, damage: 120, defense: 40, attributionAttack: 45, attributionDefense: 10 }),
    zoneRules: Object.freeze({ indoor: false, water: false, combatMount: false }),
  }),
  axe_mount_iron_wolf: Object.freeze({
    id: 'axe_mount_iron_wolf',
    name: 'Iron Wolf',
    rarity: 'rare',
    specialty: 'defense',
    modelRef: 'shadow_wolf',
    baseSpeedMultiplier: 1.45,
    maxSpeedGrowthBonus: 0.25,
    maxStats: Object.freeze({ hp: 700, damage: 45, defense: 150, attributionAttack: 10, attributionDefense: 50 }),
    zoneRules: Object.freeze({ indoor: false, water: false, combatMount: false }),
  }),
  axe_mount_spirit_wolf: Object.freeze({
    id: 'axe_mount_spirit_wolf',
    name: 'Spirit Wolf',
    rarity: 'elite',
    specialty: 'attribute',
    modelRef: 'shadow_wolf',
    baseSpeedMultiplier: 1.6,
    maxSpeedGrowthBonus: 0.3,
    maxStats: Object.freeze({ hp: 450, damage: 70, defense: 70, attributionAttack: 100, attributionDefense: 75 }),
    zoneRules: Object.freeze({ indoor: false, water: false, combatMount: false }),
  }),
  axe_mount_vanguard_wolf: Object.freeze({
    id: 'axe_mount_vanguard_wolf',
    name: 'Vanguard Wolf',
    rarity: 'elite',
    specialty: 'balanced',
    modelRef: 'shadow_wolf',
    baseSpeedMultiplier: 1.5,
    maxSpeedGrowthBonus: 0.3,
    maxStats: Object.freeze({ hp: 600, damage: 85, defense: 90, attributionAttack: 35, attributionDefense: 35 }),
    zoneRules: Object.freeze({ indoor: false, water: false, combatMount: false }),
  }),
});

export function getAXEMountDefinition(id) {
  return AXE_MOUNT_DEFINITIONS[id] || null;
}

export function resolveAXEMountGrowthPercent(totalXp = 0) {
  const xp = Math.max(0, Number(totalXp) || 0);
  let percent = 0;
  for (const band of AXE_MOUNT_GROWTH_BANDS) {
    if (xp >= band.totalXpRequired) percent = band.percent;
  }
  return percent;
}

export function getAXENextMountGrowthBand(totalXp = 0) {
  const current = resolveAXEMountGrowthPercent(totalXp);
  return AXE_MOUNT_GROWTH_BANDS.find((band) => band.percent > current) || null;
}

export function createAXEMountInstance(definitionId, instanceId = null) {
  const def = getAXEMountDefinition(definitionId);
  if (!def) throw new Error(`Unknown AXE mount definition: ${definitionId}`);
  return {
    instanceId: instanceId || `${definitionId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    definitionId,
    totalXp: 0,
    growthPercent: 0,
    registered: false,
    active: false,
    riding: false,
    sourceStats: { ridingXp: 0, pveXp: 0, pvpXp: 0 },
    tradeable: true,
    bound: false,
  };
}

export function normalizeAXEMountInstance(mount = {}) {
  const def = getAXEMountDefinition(mount.definitionId);
  if (!def) return null;
  const totalXp = Math.max(0, Number(mount.totalXp) || 0);
  return {
    ...mount,
    totalXp,
    growthPercent: resolveAXEMountGrowthPercent(totalXp),
    registered: !!mount.registered,
    active: !!mount.active,
    riding: !!mount.riding,
    sourceStats: {
      ridingXp: 0,
      pveXp: 0,
      pvpXp: 0,
      ...(mount.sourceStats || {}),
    },
    tradeable: mount.tradeable !== false,
    bound: !!mount.bound,
  };
}

export function getAXEMountBonuses(mount) {
  const m = normalizeAXEMountInstance(mount);
  if (!m) return { hp: 0, damage: 0, defense: 0, attributionAttack: 0, attributionDefense: 0 };
  const def = getAXEMountDefinition(m.definitionId);
  const scale = Math.max(0, Math.min(1, m.growthPercent / AXE_MOUNT_CONFIG.maxGrowthPercent));
  const out = {};
  for (const [key, value] of Object.entries(def.maxStats || {})) {
    out[key] = Math.round(Number(value || 0) * scale);
  }
  const legendary = collectAXELegendaryMountBonuses(m.legendary);
  for (const [key, value] of Object.entries(legendary)) {
    if (key === 'mountSpeedBonus') continue;
    out[key] = (out[key] || 0) + Number(value || 0);
  }
  return out;
}

export function getAXEMountSpeedMultiplier(mount) {
  const m = normalizeAXEMountInstance(mount);
  if (!m) return null;
  const def = getAXEMountDefinition(m.definitionId);
  const scale = Math.max(0, Math.min(1, m.growthPercent / AXE_MOUNT_CONFIG.maxGrowthPercent));
  const legendary = collectAXELegendaryMountBonuses(m.legendary);
  return Number((
    def.baseSpeedMultiplier
    + def.maxSpeedGrowthBonus * scale
    + Number(legendary.mountSpeedBonus || 0)
  ).toFixed(3));
}

export function addAXEMountXP(mount, amount, source = 'pve') {
  const m = normalizeAXEMountInstance(mount);
  if (!m) return { ok: false, reason: 'MOUNT_INVALID', mount };
  const gain = Math.max(0, Number(amount) || 0);
  if (gain <= 0) return { ok: false, reason: 'NO_XP', mount: m };

  const sourceKey = source === 'pvp' ? 'pvpXp' : source === 'riding' ? 'ridingXp' : 'pveXp';
  const next = normalizeAXEMountInstance({
    ...m,
    totalXp: m.totalXp + gain,
    sourceStats: {
      ...m.sourceStats,
      [sourceKey]: Number(m.sourceStats[sourceKey] || 0) + gain,
    },
  });

  return {
    ok: true,
    mount: next,
    xpGained: gain,
    oldGrowthPercent: m.growthPercent,
    newGrowthPercent: next.growthPercent,
    growthAdvanced: next.growthPercent > m.growthPercent,
    nextBand: getAXENextMountGrowthBand(next.totalXp),
  };
}

export function getAXEMountXPReward(source, context = {}) {
  if (source === 'pvp') {
    const level = Math.max(1, Number(context.opponentLevel) || 1);
    return AXE_MOUNT_XP_REWARDS.pvpBase + Math.min(30, Math.floor(level / 5));
  }
  if (source === 'riding') return AXE_MOUNT_XP_REWARDS.rideWindow;
  const level = Math.max(1, Number(context.enemyLevel) || 1);
  return AXE_MOUNT_XP_REWARDS.pveBase + Math.min(15, Math.floor(level / 10));
}

export function canRideAXEMount(mount, context = {}) {
  const m = normalizeAXEMountInstance(mount);
  if (!m) return { ok: false, reason: 'MOUNT_INVALID' };
  const def = getAXEMountDefinition(m.definitionId);
  if (context.isIndoor && !def.zoneRules.indoor) return { ok: false, reason: 'INDOOR_RESTRICTED' };
  if (context.isInWater && !def.zoneRules.water) return { ok: false, reason: 'WATER_RESTRICTED' };
  if (context.inCombat && !def.zoneRules.combatMount) return { ok: false, reason: 'COMBAT_RESTRICTED' };
  return { ok: true };
}
