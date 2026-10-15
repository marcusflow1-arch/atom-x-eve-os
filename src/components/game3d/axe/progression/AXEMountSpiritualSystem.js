// Additive adapter for the earlier spiritual-weapon work. Lifetime mount XP
// still drives Game3D growth; invested XP is derived from purchased ranks.
// Balance is centralized here for playtesting, not a new player-level system.
export const AXE_MOUNT_SPIRITUAL_CONFIG = Object.freeze({
  maxRank: 20,
  xpPerRank: 500,
  offensiveDamagePerRank: 8,
  utilityBlockPerRank: 1,
  utilityCritPerRank: 0.15,
  utilityMountedSpeedPerRank: 0.002,
});

export function finiteMountXP(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(n))) : 0;
}

export function spiritualXPInvested(rank) {
  return AXE_MOUNT_SPIRITUAL_CONFIG.xpPerRank * rank * (rank + 1) / 2;
}

export function normalizeMountSpiritualWeapon(value = {}, totalXp = 0) {
  let rank = Math.min(AXE_MOUNT_SPIRITUAL_CONFIG.maxRank, finiteMountXP(value?.rank));
  while (rank > 0 && spiritualXPInvested(rank) > finiteMountXP(totalXp)) rank--;
  return { rank, mode: value?.mode === 'utility' ? 'utility' : 'offensive' };
}

export function getMountSpiritualProfile(mount) {
  const totalXp = finiteMountXP(mount?.totalXp);
  const weapon = normalizeMountSpiritualWeapon(mount?.spiritualWeapon, totalXp);
  const investedXp = spiritualXPInvested(weapon.rank);
  const availableXp = totalXp - investedXp;
  const isMaxRank = weapon.rank === AXE_MOUNT_SPIRITUAL_CONFIG.maxRank;
  const nextCost = isMaxRank ? 0 : (weapon.rank + 1) * AXE_MOUNT_SPIRITUAL_CONFIG.xpPerRank;
  const c = AXE_MOUNT_SPIRITUAL_CONFIG;
  const bonuses = weapon.mode === 'offensive'
    ? { damage: weapon.rank * c.offensiveDamagePerRank }
    : {
        attackBlock: weapon.rank * c.utilityBlockPerRank,
        critChance: Number((weapon.rank * c.utilityCritPerRank).toFixed(3)),
        mountSpeedBonus: Number((weapon.rank * c.utilityMountedSpeedPerRank).toFixed(3)),
      };
  return { ...weapon, totalXp, investedXp, availableXp, nextCost, isMaxRank,
    maxRank: c.maxRank, canAdvance: !isMaxRank && availableXp >= nextCost, bonuses };
}

export function advanceMountSpiritualWeapon(mount, expectedRank) {
  const preview = getMountSpiritualProfile(mount);
  if (expectedRank !== preview.rank) return { ok: false, reason: 'PREVIEW_CHANGED' };
  if (preview.isMaxRank) return { ok: false, reason: 'MAX_SPIRITUAL_RANK' };
  if (!preview.canAdvance) return { ok: false, reason: 'INSUFFICIENT_MOUNT_XP' };
  return {
    ok: true, xpSpent: preview.nextCost,
    mount: { ...mount, spiritualWeapon: { rank: preview.rank + 1, mode: preview.mode } },
  };
}
