// AXE Prompt 013 — authoritative combat math / hit-resolution pipeline.
// Pure calculation only: no UI, animation, random generation, or persistence.
// Existing runtime systems can supply the crit roll and consume the result.
//
// Power budget rules (docs/game3d/STAT_SYSTEM_AUDIT.md, AXEPowerBudget.js): defense is a
// percentage reduction with diminishing returns instead of a subtraction, attribute attack
// is extra damage only attribute defense reduces, crits are x2 (+ crit damage) up to 50%,
// and the level gap counts both ways. The hit roll itself lives with the RNG (statsSystem).
import {
  AXE_BUILD_CAPS,
  AXE_COMBAT_RULES,
  getAXEAttributeReduction,
  getAXELevelGapMultiplier,
  getAXEStrikeCritChance,
  getAXETotalMitigation,
} from '../balance/AXEPowerBudget';

export const AXE_COMBAT_MODE = Object.freeze({
  PVE: 'pve',
  PVP: 'pvp',
});

export const AXE_COMBAT_CONFIG = Object.freeze({
  minimumDamage: 1,
  defaultCriticalMultiplier: AXE_COMBAT_RULES.critMultiplier,
  criticalChanceCapPct: AXE_COMBAT_RULES.critChanceCapPct,
  maximumMitigationPct: AXE_COMBAT_RULES.mitigationCapPct,
  coefficients: Object.freeze({
    pve: Object.freeze({ outgoing: 1, incoming: 1 }),
    pvp: Object.freeze({ outgoing: 1, incoming: 1 }),
  }),
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

// the budget's: the crit cap and the defender's crit dodge (capped) in one place
export function getAXECriticalChance(attackerStats = {}, defenderStats = {}) {
  return getAXEStrikeCritChance(attackerStats, defenderStats);
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
  // attribute (elemental) attack rides the same skill / weapon / outgoing scaling
  const scaleSoFar = Math.max(0, Number(skillCoefficient) || 0) * Math.max(0, Number(weaponCoefficient) || 0)
    * Math.max(0, Number(outgoingMultiplier) || 0) * Math.max(0, Number(configuredMode.outgoing) || 0);
  let attributeDamage = Math.max(0, Number(attackerStats.attributionAttack || 0)) * scaleSoFar;

  const didCrit = Boolean(critical && criticalAllowed);
  if (didCrit) {
    const critMultiplier = Math.max(
      1,
      AXE_COMBAT_CONFIG.defaultCriticalMultiplier + clamp(attackerStats.criticalDamage || 0, 0, AXE_BUILD_CAPS.critDamage),
    );
    const criticalDefense = clamp(defenderStats.criticalDefense || 0, 0, AXE_BUILD_CAPS.criticalDefense);
    const critScale = 1 + (critMultiplier - 1) * (1 - criticalDefense);
    damage *= critScale;
    attributeDamage *= critScale;
    breakdown.push({
      stage: 'critical',
      value: damage,
      criticalMultiplier: critMultiplier,
      criticalDefense,
    });
  }

  const attackerLevel = Number(attackerStats.level) || 1;
  const defenderLevel = Number(defenderStats.level) || 1;
  const defense = Math.max(0, Number(defenderStats.defense || 0));
  // defense (less armor penetration) and every damage reduction together, under one cap
  const reduction = getAXETotalMitigation(attackerStats, defenderStats);
  damage *= 1 - reduction;
  breakdown.push({ stage: 'defense', value: damage, defense, reductionPct: reduction * 100 });

  const attributeReduction = getAXEAttributeReduction(defenderStats.attributionDefense, attackerLevel);
  damage += attributeDamage * (1 - attributeReduction);
  breakdown.push({ stage: 'attribute', value: damage, attributeDamage, reductionPct: attributeReduction * 100 });

  const levelGap = getAXELevelGapMultiplier(attackerLevel, defenderLevel);
  damage = Math.max(AXE_COMBAT_CONFIG.minimumDamage, damage * levelGap);
  breakdown.push({ stage: 'level-gap', value: damage, multiplier: levelGap, attackerLevel, defenderLevel });

  const resolvedFlatMitigation = Math.max(
    0,
    Number(flatMitigation || defenderStats.flatDamageReduction || 0),
  );
  damage = Math.max(AXE_COMBAT_CONFIG.minimumDamage, damage - resolvedFlatMitigation);
  breakdown.push({ stage: 'flat-mitigation', value: damage, flatMitigation: resolvedFlatMitigation });

  // an explicit extra reduction from the caller only; the defender's own is in the total above
  const mitigationPct = clamp(
    percentMitigation ?? 0,
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
