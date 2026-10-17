// Skill mastery: every skill starts at level 1 and levels up by being used in a fight, up to its
// max level (docs/game3d/SKILL_MASTERY.md). Shared by the game (skills/skillMasteryStore.jsx) and
// the server's save check (characterSaveRules.ts), so both read the one curve.
//
// A use earns the skill's cooldown in XP, so a skill used every time it is ready earns about
// 1 XP a second of fighting whatever its cooldown: a 4 s strike and a 90 s buff master at the
// same pace. The level is never stored, only the XP; the level is read from it.

export const SKILL_MASTERY_KEY = 'axe_skill_mastery_v1';

export const SKILL_MASTERY = Object.freeze({
  maxLevel: 30,       // every registry skill's max_level
  xpToMax: 72_000,    // level 1 → max: about 20 hours of fighting with the skill in use
  curve: 2.2,         // > 1: early levels come in minutes, the last ones take hours
  maxSkills: 200,
  // review flag: a skill used every time it is ready earns ~60 XP a minute
  flagXpPerMinute: 90,
  flagXpSlack: 600,
});

// Evolution ranks, the same five as the skill book (equipment/skillData.jsx EVOLUTION_RANKS).
export const SKILL_MASTERY_RANKS = Object.freeze([
  Object.freeze({ id: 'base',    label: 'Base',    from: 1,  color: '#9ca3af' }),
  Object.freeze({ id: 'master',  label: 'Master',  from: 8,  color: '#60a5fa' }),
  Object.freeze({ id: 'demigod', label: 'Demigod', from: 15, color: '#a78bfa' }),
  Object.freeze({ id: 'god',     label: 'God',     from: 22, color: '#f59e0b' }),
  Object.freeze({ id: 'chosen',  label: 'Chosen',  from: 30, color: '#e879f9' }), // the max level
]);

const clampLevel = (level: number, maxLevel: number) => Math.max(1, Math.min(maxLevel, Math.floor(Number(level) || 1)));

/** Total XP a skill needs to reach `level`. */
export function skillMasteryXpForLevel(level: number, maxLevel = SKILL_MASTERY.maxLevel): number {
  const max = Math.max(2, Math.floor(maxLevel) || SKILL_MASTERY.maxLevel);
  const l = clampLevel(level, max);
  if (l <= 1) return 0;
  return Math.ceil(SKILL_MASTERY.xpToMax * ((l - 1) / (max - 1)) ** SKILL_MASTERY.curve);
}

/** The level a skill with `xp` total XP has reached. */
export function skillMasteryLevel(xp: number, maxLevel = SKILL_MASTERY.maxLevel): number {
  const max = Math.max(2, Math.floor(maxLevel) || SKILL_MASTERY.maxLevel);
  const total = Math.max(0, Number(xp) || 0);
  let level = 1;
  while (level < max && total >= skillMasteryXpForLevel(level + 1, max)) level++;
  return level;
}

/** The evolution rank at `level`; the last rank is the max level. */
export function skillMasteryRank(level: number, maxLevel = SKILL_MASTERY.maxLevel) {
  const ranks = SKILL_MASTERY_RANKS;
  if (level >= maxLevel) return ranks[ranks.length - 1];
  let rank = ranks[0];
  for (const r of ranks.slice(0, -1)) if (level >= r.from) rank = r;
  return rank;
}

/** XP one use of a skill earns: its cooldown in seconds, at least 1. */
export function skillMasteryXpPerUse(cooldownSeconds: number): number {
  return Math.max(1, Number(cooldownSeconds) || 0);
}

type MasterySave = { v?: unknown; xp?: Record<string, unknown> };

/** Hard errors in a stored mastery value (the parsed `axe_skill_mastery_v1`). */
export function checkSkillMasterySave(value: unknown): string[] {
  const errors: string[] = [];
  const save = value as MasterySave;
  if (!save || typeof save !== 'object' || save.v !== 1 || !save.xp || typeof save.xp !== 'object' || Array.isArray(save.xp)) {
    return ['skill mastery must be { v: 1, xp: { skillId: xp } }'];
  }
  const entries = Object.entries(save.xp);
  if (entries.length > SKILL_MASTERY.maxSkills) errors.push(`skill mastery for ${entries.length} skills (at most ${SKILL_MASTERY.maxSkills})`);
  for (const [id, xp] of entries) {
    if (!/^[a-z][a-z0-9_]{1,63}$/.test(id)) { errors.push(`bad skill id ${id.slice(0, 40)}`); continue; }
    if (!(typeof xp === 'number' && Number.isFinite(xp) && xp >= 0 && xp <= SKILL_MASTERY.xpToMax)) {
      errors.push(`skill ${id} mastery XP ${String(xp).slice(0, 20)} is outside 0–${SKILL_MASTERY.xpToMax}`);
    }
    if (errors.length >= 10) break;
  }
  return errors;
}

/** Review flags: skills that gained XP faster than using them allows since the last save. */
export function skillMasteryRateFlags(now: unknown, before: unknown, minutes: number): string[] {
  const xpNow = (now as MasterySave)?.xp || {};
  const xpBefore = (before as MasterySave)?.xp || {};
  const allowed = SKILL_MASTERY.flagXpSlack + SKILL_MASTERY.flagXpPerMinute * Math.max(0, minutes);
  const flags: string[] = [];
  for (const [id, xp] of Object.entries(xpNow)) {
    const gained = (Number(xp) || 0) - (Number(xpBefore[id]) || 0);
    if (gained > allowed) flags.push(`skill_mastery_rate: ${id} +${Math.round(gained)} XP in ${minutes.toFixed(1)} min`);
  }
  return flags.slice(0, 5);
}
