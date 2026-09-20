// AXE Prompt 020 — combine, stage, refine and ultimate item progression.
// Separate from reinforcement/enchant/over-enchant. All balance values are
// provisional and data-driven.

export const AXE_COMBINE_CONFIG = Object.freeze({
  maxCombines: 12,
  sameTemplateRequired: true,
  sameGradeRequired: true,
  baseSuccessChance: 0.9,
  minimumSuccessChance: 0.35,
});

export const AXE_STAGE_CONFIG = Object.freeze({
  stages: Object.freeze([
    { id: 'stage_0', rank: 0, label: 'Base' },
    { id: 'stage_1', rank: 1, label: 'Stage I' },
    { id: 'stage_2', rank: 2, label: 'Stage II' },
    { id: 'stage_3', rank: 3, label: 'Stage III' },
    { id: 'stage_4', rank: 4, label: 'Stage IV' },
    { id: 'stage_5', rank: 5, label: 'Stage V' },
  ]),
});

export const AXE_REFINE_CONFIG = Object.freeze({
  maxLevel: 15,
  safeThroughLevel: 5,
  downgradeStartsLevel: 8,
  destructionStartsLevel: 12,
  baseSuccessChance: 0.92,
  minimumSuccessChance: 0.2,
});

export const AXE_ULTIMATE_CONFIG = Object.freeze({
  eligibleRarities: Object.freeze(['legendary', 'heroic']),
  maxLevel: 10,
  baseSuccessChance: 0.68,
  minimumSuccessChance: 0.16,
  sealStartsLevel: 4,
});

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

export function combineSuccessChance(count = 0) {
  const t = clamp01((Number(count) || 0) / AXE_COMBINE_CONFIG.maxCombines);
  return Math.max(
    AXE_COMBINE_CONFIG.minimumSuccessChance,
    AXE_COMBINE_CONFIG.baseSuccessChance - t * 0.55,
  );
}

export function validateCombine(target, donor) {
  if (!target || !donor) return { ok: false, reason: 'ITEM_MISSING' };
  if (target.instanceId && donor.instanceId && target.instanceId === donor.instanceId) {
    return { ok: false, reason: 'SAME_INSTANCE' };
  }
  if (
    AXE_COMBINE_CONFIG.sameTemplateRequired &&
    target.templateId &&
    donor.templateId &&
    target.templateId !== donor.templateId
  ) return { ok: false, reason: 'TEMPLATE_MISMATCH' };

  if (
    AXE_COMBINE_CONFIG.sameGradeRequired &&
    target.rarity &&
    donor.rarity &&
    target.rarity !== donor.rarity
  ) return { ok: false, reason: 'GRADE_MISMATCH' };

  const count = Number(target.combine?.count || 0);
  if (count >= AXE_COMBINE_CONFIG.maxCombines) return { ok: false, reason: 'MAX_COMBINE' };
  return { ok: true };
}

export function resolveCombine(target, donor, { roll = Math.random() } = {}) {
  const valid = validateCombine(target, donor);
  if (!valid.ok) return { ok: false, ...valid, target };

  const current = Number(target.combine?.count || 0);
  const chance = combineSuccessChance(current);
  if (roll > chance) {
    return { ok: false, outcome: 'failure', chance, target: { ...target } };
  }

  return {
    ok: true,
    outcome: 'success',
    chance,
    donorConsumed: true,
    target: {
      ...target,
      combine: { count: current + 1 },
    },
  };
}

export function getNextStage(record = {}) {
  const current = Number(record.rank || 0);
  return AXE_STAGE_CONFIG.stages.find((s) => s.rank === current + 1) || null;
}

export function resolveStageAdvance(record = {}, { successChance = 1, roll = Math.random() } = {}) {
  const next = getNextStage(record);
  if (!next) return { ok: false, reason: 'MAX_STAGE', record: { ...record } };
  if (roll > Number(successChance)) return { ok: false, outcome: 'failure', record: { ...record } };
  return { ok: true, outcome: 'success', record: { ...record, ...next } };
}

export function refineSuccessChance(level = 0) {
  const t = clamp01((Number(level) || 0) / AXE_REFINE_CONFIG.maxLevel);
  return Math.max(
    AXE_REFINE_CONFIG.minimumSuccessChance,
    AXE_REFINE_CONFIG.baseSuccessChance - t * 0.72,
  );
}

export function resolveRefine(record = {}, {
  roll = Math.random(),
  protectedAttempt = false,
} = {}) {
  const level = Number(record.level || 0);
  if (level >= AXE_REFINE_CONFIG.maxLevel) return { ok: false, reason: 'MAX_REFINE', record: { ...record } };

  const chance = refineSuccessChance(level);
  if (roll <= chance) {
    return { ok: true, outcome: 'success', chance, record: { ...record, level: level + 1 } };
  }

  if (protectedAttempt) return { ok: false, outcome: 'protected', chance, record: { ...record } };

  if (level >= AXE_REFINE_CONFIG.destructionStartsLevel) {
    return { ok: false, outcome: 'destroyed', chance, destroyed: true, record: { ...record } };
  }

  if (level >= AXE_REFINE_CONFIG.downgradeStartsLevel) {
    return {
      ok: false,
      outcome: 'downgrade',
      chance,
      record: { ...record, level: Math.max(AXE_REFINE_CONFIG.safeThroughLevel, level - 1) },
    };
  }

  return { ok: false, outcome: 'no_change', chance, record: { ...record } };
}

export function ultimateSuccessChance(level = 0) {
  const t = clamp01((Number(level) || 0) / AXE_ULTIMATE_CONFIG.maxLevel);
  return Math.max(
    AXE_ULTIMATE_CONFIG.minimumSuccessChance,
    AXE_ULTIMATE_CONFIG.baseSuccessChance - t * 0.52,
  );
}

export function resolveUltimate(item, record = {}, {
  roll = Math.random(),
  protectedAttempt = false,
} = {}) {
  if (!AXE_ULTIMATE_CONFIG.eligibleRarities.includes(String(item?.rarity || '').toLowerCase())) {
    return { ok: false, reason: 'RARITY_NOT_ELIGIBLE', record: { ...record } };
  }

  const level = Number(record.level || 0);
  if (level >= AXE_ULTIMATE_CONFIG.maxLevel) {
    return { ok: false, reason: 'MAX_ULTIMATE', record: { ...record } };
  }

  const chance = ultimateSuccessChance(level);
  if (roll <= chance) {
    return { ok: true, outcome: 'success', chance, record: { level: level + 1, sealed: false } };
  }

  if (protectedAttempt) return { ok: false, outcome: 'protected', chance, record: { ...record } };

  if (level >= AXE_ULTIMATE_CONFIG.sealStartsLevel) {
    return { ok: false, outcome: 'sealed', chance, record: { ...record, sealed: true } };
  }

  return { ok: false, outcome: 'no_change', chance, record: { ...record } };
}

export function previewAXEAdvancement(type, payload = {}) {
  switch (type) {
    case 'combine':
      return { type, validation: validateCombine(payload.target, payload.donor), chance: combineSuccessChance(payload.target?.combine?.count || 0) };
    case 'stage':
      return { type, next: getNextStage(payload.record || {}) };
    case 'refine':
      return { type, chance: refineSuccessChance(payload.record?.level || 0), currentLevel: payload.record?.level || 0 };
    case 'ultimate':
      return { type, chance: ultimateSuccessChance(payload.record?.level || 0), currentLevel: payload.record?.level || 0 };
    default:
      return { type, error: 'UNKNOWN_ADVANCEMENT' };
  }
}
