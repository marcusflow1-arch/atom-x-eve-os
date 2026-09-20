// AXE Prompt 013 — authoritative combat math / hit-resolution pipeline.
// Pure calculation only: no UI, animation, random generation, or persistence.
// Existing runtime systems can supply the crit roll and consume the result.

export const AXE_COMBAT_MODE = Object.freeze({
  PVE: 'pve',
  PVP: 'pvp',
});

export const AXE_COMBAT_CONFIG = Object.freeze({
  minimumDamage: 1,
  defaultCriticalMultiplier: 3,
  criticalChanceCapPct: 75,
  maximumMitigationPct: 90,
  coefficients: Object.freeze({
    pve: Object.freeze({ outgoing: 1, incoming: 1 }),
    pvp: Object.freeze({ outgoing: 1, incoming: 1 }),
  }),
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

export function getAXECriticalChance(attackerStats = {}, defenderStats = {}) {
  const attacker = clamp(attackerStats.critChance || 0, 0, AXE_COMBAT_CONFIG.criticalChanceCapPct);
  const defensePct = clamp(
    (defenderStats.critChanceReductionPct || defenderStats.criticalChanceDefensePct || 0),
    0,
    100,
  );
  return clamp(attacker * (1 - defensePct / 100), 0, AXE_COMBAT_CONFIG.criticalChanceCapPct);
}

export function resolveAXEHit({
  attackerStats = {},
  defenderStats = {},
  mode = AXE_COMBAT_MODE.PVE,
  baseDamage = null,
  skillCoefficient = 1,
  weaponCoefficient = 1,
  outgoingMultiplier = 1,
  critical = false,
  criticalAllowed = true,
  flatMitigation = 0,
  percentMitigation = null,
  shield = 0,
  reflected = false,
  reflectedDamageMultiplier = 0,
} = {}) {
  const breakdown = [];
  const configuredMode = AXE_COMBAT_CONFIG.coefficients[mode] || AXE_COMBAT_CONFIG.coefficients.pve;

  let damage = Math.max(
    AXE_COMBAT_CONFIG.minimumDamage,
    Number(baseDamage ?? attackerStats.totalDamage ?? attackerStats.damage ?? 1) || 1,
  );
  breakdown.push({ stage: 'base', value: damage });

  damage *= Math.max(0, Number(skillCoefficient) || 0);
  breakdown.push({ stage: 'skill-coefficient', value: damage, coefficient: skillCoefficient });

  damage *= Math.max(0, Number(weaponCoefficient) || 0);
  breakdown.push({ stage: 'weapon-coefficient', value: damage, coefficient: weaponCoefficient });

  damage *= Math.max(0, Number(outgoingMultiplier) || 0);
  damage *= Math.max(0, Number(configuredMode.outgoing) || 0);
  breakdown.push({
    stage: 'outgoing-modifiers',
    value: damage,
    outgoingMultiplier,
    modeCoefficient: configuredMode.outgoing,
  });

  const didCrit = Boolean(critical && criticalAllowed);
  if (didCrit) {
    const critMultiplier = Math.max(
      1,
      AXE_COMBAT_CONFIG.defaultCriticalMultiplier + Number(attackerStats.criticalDamage || 0),
    );
    const criticalDefense = clamp(defenderStats.criticalDefense || 0, 0, 1);
    const normalPart = damage;
    const bonusPart = damage * (critMultiplier - 1) * (1 - criticalDefense);
    damage = normalPart + bonusPart;
    breakdown.push({
      stage: 'critical',
      value: damage,
      criticalMultiplier: critMultiplier,
      criticalDefense,
    });
  }

  const defense = Math.max(0, Number(defenderStats.defense || 0));
  damage = Math.max(AXE_COMBAT_CONFIG.minimumDamage, damage - defense);
  breakdown.push({ stage: 'defense', value: damage, defense });

  const resolvedFlatMitigation = Math.max(
    0,
    Number(flatMitigation || defenderStats.flatDamageReduction || 0),
  );
  damage = Math.max(AXE_COMBAT_CONFIG.minimumDamage, damage - resolvedFlatMitigation);
  breakdown.push({ stage: 'flat-mitigation', value: damage, flatMitigation: resolvedFlatMitigation });

  const mitigationPct = clamp(
    percentMitigation ?? defenderStats.damageReductionPct ?? 0,
    0,
    AXE_COMBAT_CONFIG.maximumMitigationPct,
  );
  damage *= 1 - mitigationPct / 100;
  damage *= Math.max(0, Number(configuredMode.incoming) || 0);
  breakdown.push({
    stage: 'percent-mitigation',
    value: damage,
    mitigationPct,
    modeCoefficient: configuredMode.incoming,
  });

  const shieldAvailable = Math.max(0, Number(shield || 0));
  const shieldAbsorbed = Math.min(shieldAvailable, Math.max(0, damage));
  damage -= shieldAbsorbed;
  breakdown.push({ stage: 'shield', value: damage, shieldAbsorbed });

  const finalDamage = Math.max(
    shieldAbsorbed >= damage + shieldAbsorbed ? 0 : AXE_COMBAT_CONFIG.minimumDamage,
    Math.round(Math.max(0, damage)),
  );

  const reflectedDamage = reflected
    ? Math.max(0, Math.round(finalDamage * Math.max(0, Number(reflectedDamageMultiplier) || 0)))
    : 0;

  breakdown.push({ stage: 'final', value: finalDamage });

  return {
    damage: finalDamage,
    critical: didCrit,
    criticalChancePct: getAXECriticalChance(attackerStats, defenderStats),
    shieldAbsorbed,
    reflectedDamage,
    mode,
    breakdown,
  };
}

export function formatAXECombatBreakdown(result) {
  return (result?.breakdown || [])
    .map((entry) => `${entry.stage}: ${Number(entry.value || 0).toFixed(2)}`)
    .join(' | ');
}
