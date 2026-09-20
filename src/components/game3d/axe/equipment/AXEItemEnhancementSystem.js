// AXE Prompt 019 — reinforcement, enchantment and over-enchantment.
// These are intentionally separate systems with separate progression records.
// Numerical values are provisional and data-driven; UI/services consume this
// contract rather than embedding risk/cost rules.

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

export const AXE_REINFORCEMENT_CONFIG = Object.freeze({
  stepPercent: 5,
  maxPercent: 120,
  safeThroughPercent: 40,
  downgradeStartsPercent: 70,
  baseSuccessChance: 0.96,
  minimumSuccessChance: 0.28,
});

export const AXE_ENCHANTMENT_CONFIG = Object.freeze({
  slots: 4,
  maxLevelPerSlot: 10,
  safeLevelPerSlot: 5,
});

export const AXE_OVER_ENCHANT_CONFIG = Object.freeze({
  maxLevel: 10,
  baseSuccessChance: 0.72,
  minimumSuccessChance: 0.18,
  fractureStartsAt: 4,
});

export function reinforcementSuccessChance(currentPercent) {
  const pct = Math.max(0, Number(currentPercent) || 0);
  if (pct <= AXE_REINFORCEMENT_CONFIG.safeThroughPercent) return 1;
  const span = Math.max(
    1,
    AXE_REINFORCEMENT_CONFIG.maxPercent - AXE_REINFORCEMENT_CONFIG.safeThroughPercent,
  );
  const t = clamp01((pct - AXE_REINFORCEMENT_CONFIG.safeThroughPercent) / span);
  return Math.max(
    AXE_REINFORCEMENT_CONFIG.minimumSuccessChance,
    AXE_REINFORCEMENT_CONFIG.baseSuccessChance - t * 0.68,
  );
}

export function previewReinforcement(record = {}) {
  const currentPercent = Number(record.percent || 0);
  const nextPercent = Math.min(
    AXE_REINFORCEMENT_CONFIG.maxPercent,
    currentPercent + AXE_REINFORCEMENT_CONFIG.stepPercent,
  );
  return {
    currentPercent,
    nextPercent,
    successChance: reinforcementSuccessChance(currentPercent),
    canAdvance: currentPercent < AXE_REINFORCEMENT_CONFIG.maxPercent,
    failureOutcomes: currentPercent < AXE_REINFORCEMENT_CONFIG.downgradeStartsPercent
      ? ['no_change']
      : ['no_change', 'downgrade'],
  };
}

export function resolveReinforcement(record = {}, {
  roll = Math.random(),
  protectedAttempt = false,
} = {}) {
  const preview = previewReinforcement(record);
  if (!preview.canAdvance) return { ok: false, reason: 'max_reinforcement', record: { ...record } };

  if (roll <= preview.successChance) {
    return {
      ok: true,
      outcome: 'success',
      record: { ...record, percent: preview.nextPercent },
    };
  }

  if (
    !protectedAttempt &&
    preview.currentPercent >= AXE_REINFORCEMENT_CONFIG.downgradeStartsPercent
  ) {
    return {
      ok: false,
      outcome: 'downgrade',
      record: {
        ...record,
        percent: Math.max(
          AXE_REINFORCEMENT_CONFIG.safeThroughPercent,
          preview.currentPercent - AXE_REINFORCEMENT_CONFIG.stepPercent,
        ),
      },
    };
  }

  return { ok: false, outcome: protectedAttempt ? 'protected' : 'no_change', record: { ...record } };
}

export function overEnchantSuccessChance(level) {
  const t = clamp01((Number(level) || 0) / AXE_OVER_ENCHANT_CONFIG.maxLevel);
  return Math.max(
    AXE_OVER_ENCHANT_CONFIG.minimumSuccessChance,
    AXE_OVER_ENCHANT_CONFIG.baseSuccessChance - t * 0.54,
  );
}

export function resolveOverEnchant(record = {}, {
  roll = Math.random(),
  protectedAttempt = false,
} = {}) {
  const level = Number(record.level || 0);
  if (level >= AXE_OVER_ENCHANT_CONFIG.maxLevel) {
    return { ok: false, reason: 'max_over_enchant', record: { ...record } };
  }

  const successChance = overEnchantSuccessChance(level);
  if (roll <= successChance) {
    return {
      ok: true,
      outcome: 'success',
      record: { ...record, level: level + 1, fractured: false },
    };
  }

  if (protectedAttempt) {
    return { ok: false, outcome: 'protected', record: { ...record } };
  }

  if (level >= AXE_OVER_ENCHANT_CONFIG.fractureStartsAt) {
    return {
      ok: false,
      outcome: 'fracture',
      record: { ...record, level: Math.max(0, level - 1), fractured: true },
    };
  }

  return { ok: false, outcome: 'no_change', record: { ...record } };
}

export function getAXEEnhancementStatMultiplier({
  reinforcement = {},
  enchantments = [],
  overEnchant = {},
} = {}) {
  const reinforcementPct = Math.max(0, Number(reinforcement.percent || 0));
  const enchantLevels = (enchantments || []).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const overLevel = Math.max(0, Number(overEnchant.level || 0));

  return 1
    + reinforcementPct / 100
    + enchantLevels * 0.01
    + overLevel * 0.025;
}
