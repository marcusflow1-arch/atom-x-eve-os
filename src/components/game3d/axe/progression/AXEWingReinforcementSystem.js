// AXE Prompt 027 — wing reinforcement and visual evolution.
// Existing wing path levels remain intact; this layer adds independent
// reinforcement percent progression up to a configurable cap.

export const AXE_WING_REINFORCEMENT_CONFIG = Object.freeze({
  minPercent: 0,
  maxPercent: 120,
  stepPercent: 5,
  safeThroughPercent: 40,
  downgradeStartsPercent: 70,
  destructionEnabled: false,
  baseSuccessChance: 0.95,
  minimumSuccessChance: 0.2,
  statScaleAtMax: 1.6,
});

export const AXE_WING_REINFORCEMENT_MATERIALS = Object.freeze({
  feather: Object.freeze({ id: 'wing_feather', name: 'Celestial Feather' }),
  essence: Object.freeze({ id: 'wing_essence', name: 'Wing Essence' }),
  stabilizer: Object.freeze({ id: 'wing_stabilizer', name: 'Wing Stabilizer' }),
});

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

export function getAXEWingReinforcementChance(percent = 0) {
  const cfg = AXE_WING_REINFORCEMENT_CONFIG;
  const p = Math.max(cfg.minPercent, Math.min(cfg.maxPercent, Number(percent) || 0));
  if (p <= cfg.safeThroughPercent) return 1;
  const t = clamp01((p - cfg.safeThroughPercent) / Math.max(1, cfg.maxPercent - cfg.safeThroughPercent));
  return Math.max(cfg.minimumSuccessChance, cfg.baseSuccessChance - t * 0.75);
}

export function getAXEWingReinforcementCost(percent = 0, protectedAttempt = false) {
  const step = Math.floor(Math.max(0, Number(percent) || 0) / 20);
  return {
    wing_feather: 1 + step,
    wing_essence: 1 + Math.floor(step / 2),
    ...(protectedAttempt ? { wing_stabilizer: 1 } : {}),
  };
}

export function getAXEWingStatScale(percent = 0) {
  const cfg = AXE_WING_REINFORCEMENT_CONFIG;
  const t = clamp01((Number(percent) || 0) / cfg.maxPercent);
  return 1 + t * (cfg.statScaleAtMax - 1);
}

export function getAXEWingVisualTier(percent = 0) {
  const p = Math.max(0, Number(percent) || 0);
  if (p >= 120) return { id: 'ascendant', rank: 6, label: 'Ascendant Radiance' };
  if (p >= 100) return { id: 'mythic', rank: 5, label: 'Mythic Radiance' };
  if (p >= 80) return { id: 'legendary', rank: 4, label: 'Legendary Radiance' };
  if (p >= 60) return { id: 'epic', rank: 3, label: 'Epic Radiance' };
  if (p >= 40) return { id: 'rare', rank: 2, label: 'Rare Radiance' };
  if (p >= 20) return { id: 'awakened', rank: 1, label: 'Awakened' };
  return { id: 'base', rank: 0, label: 'Dormant' };
}

export function resolveAXEWingReinforcement(percent = 0, {
  roll = Math.random(),
  protectedAttempt = false,
} = {}) {
  const cfg = AXE_WING_REINFORCEMENT_CONFIG;
  const current = Math.max(cfg.minPercent, Math.min(cfg.maxPercent, Number(percent) || 0));
  if (current >= cfg.maxPercent) return { ok: false, reason: 'MAX_REINFORCEMENT', percent: current };

  const chance = getAXEWingReinforcementChance(current);
  if (roll <= chance) {
    return {
      ok: true,
      outcome: 'success',
      chance,
      percent: Math.min(cfg.maxPercent, current + cfg.stepPercent),
    };
  }

  if (protectedAttempt) return { ok: false, outcome: 'protected', chance, percent: current };

  if (current >= cfg.downgradeStartsPercent) {
    return {
      ok: false,
      outcome: 'downgrade',
      chance,
      percent: Math.max(cfg.safeThroughPercent, current - cfg.stepPercent),
    };
  }

  return { ok: false, outcome: 'no_change', chance, percent: current };
}
