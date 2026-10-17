// Wuxia blueprint v3 §4 — Taurus Chosen Ascension: a character at the peak of mortal
// progression becomes an Enlightened Being and walks one of three Natures. Ascended
// characters levitate a little above the ground and wear the Angel Cloak.
// docs/game3d/WUXIA_BLUEPRINT_GAP_MAP.md
//
// Game 3D has no level cap yet (AXECharacterProgressionConfig.normalLevelCap is null),
// so "peak character limits" is a provisional level threshold. Every value here is
// provisional balance for the owner to tune.

export const AXE_ASCENSION_CONFIG = Object.freeze({
  minLevel: 100,
  reattuneCooldownMs: 60 * 60 * 1000, // changing Nature again within an hour is refused
  hoverHeight: 0.15, // metres above the ground: "inches above the terrain"
  levitationMoveSpeedMult: 1.12, // low-friction, high-speed vectoring
  angelCloak: Object.freeze({
    label: 'Angel Cloak',
    flat: Object.freeze({ hp: 500, defense: 40, attributionDefense: 30 }),
    moveSpeedPct: 0.03,
  }),
});

export const AXE_ASCENSION_NATURES = Object.freeze({
  destroyer: Object.freeze({
    id: 'destroyer',
    label: 'Path of the Destroyer',
    summary: 'Unrelenting power: skill damage ×1.35, and single-hit skills unleash a shockwave.',
    skillDamageMult: 1.35, // was 1.25 (docs/game3d/BUILD_BALANCE.md)
    shockwave: true,
  }),
  balanced: Object.freeze({
    id: 'balanced',
    label: 'Path of the Balanced',
    summary: 'Harmony in every discipline: damage, defense, HP, chi, accuracy and block all +6%.',
    allStatsMult: 1.06,
  }),
  defensive: Object.freeze({
    id: 'defensive',
    label: 'Path of the Defensive',
    summary: 'Guardian of allies and strongholds: defense ×1.15, and 10% of the damage you deal becomes a protective shield.',
    defenseMult: 1.15, // was 1.25 (docs/game3d/BUILD_BALANCE.md)
    shieldFromDamage: 0.1, // was 0.2
    shieldCapOfMaxHp: 0.25, // the shield never holds more than 25% of max HP (was 40%)
    shieldLifeMs: 8000, // and fades 8 s after the last blow that fed it
  }),
});

export const AXE_ASCENSION_NATURE_ORDER = Object.freeze(['destroyer', 'balanced', 'defensive']);

export function isAXEAscensionNature(id) {
  return Object.prototype.hasOwnProperty.call(AXE_ASCENSION_NATURES, id);
}

export function canAXECharacterAscend({ level = 0, ascended = false } = {}) {
  if (ascended) return { ok: false, reason: 'ALREADY_ASCENDED' };
  if (!(Number(level) >= AXE_ASCENSION_CONFIG.minLevel)) return { ok: false, reason: 'LEVEL_TOO_LOW', required: AXE_ASCENSION_CONFIG.minLevel };
  return { ok: true };
}

// Balanced: the core combat stats ×1.06. Defensive: defense ×1.25. Destroyer acts on skills (skillExecutor).
// The Nature is the one true multiplier on the stat sheet, so it is kept small (power budget).
const BALANCED_KEYS = Object.freeze(['damage', 'physicalDamage', 'totalDamage', 'defense', 'maxHP', 'chi', 'attackSuccess', 'attackBlock']);
export function applyAXEAscensionToDerived(derived, profile) {
  if (!derived || !profile?.ascended) return derived;
  const out = { ...derived };
  const nature = AXE_ASCENSION_NATURES[profile.nature];
  if (nature?.allStatsMult) for (const k of BALANCED_KEYS) if (Number.isFinite(out[k])) out[k] *= nature.allStatsMult;
  if (nature?.defenseMult && Number.isFinite(out.defense)) out.defense *= nature.defenseMult;
  out.ascension = { ascended: true, nature: nature ? nature.id : null };
  return out;
}

// The Defensive shield bank: damage dealt feeds it (capped), it fades after its life.
export function bankAXEAscensionShield(shield, { damage = 0, maxHP = 0, now = Date.now() } = {}) {
  const def = AXE_ASCENSION_NATURES.defensive;
  const current = shield && shield.expiresAt > now ? shield.amount : 0;
  const cap = Math.max(0, Number(maxHP) || 0) * def.shieldCapOfMaxHp;
  const amount = Math.min(cap, current + Math.max(0, Number(damage) || 0) * def.shieldFromDamage);
  return { amount, expiresAt: now + def.shieldLifeMs };
}
