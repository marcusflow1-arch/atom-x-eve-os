// ─── Skill Mastery — skills level up by being used ───────────────────────
// Every skill starts at level 1. Using it in a fight earns it XP; enough XP and it
// reaches the next level, up to its max level (30), passing the evolution ranks
// Base → Master → Demigod → God → Chosen. The level feeds every cast
// (skillExecutor → scaleStat), so a mastered skill hits harder, shields more,
// reflects more. Curve and ranks: base44/shared/skillMastery.ts, shared with the
// server's save check. docs/game3d/SKILL_MASTERY.md.
//
// What counts as a use (one use earns the skill's cooldown in XP):
//   • attack skills — each strike that lands earns its share (cooldown / strikes);
//     a strike into the air earns nothing;
//   • buffs — the cast earns once combat happens while the buff is up
//     (a hit landed or taken), so buffing in town earns nothing;
//   • a Critical Focus charge (an attack in slot 2) — earned by the next hit landed.
//
// Hits landed reach this store as window events already in the game:
// weaponMasteryEvent ON_HIT (an enemy), rogueAITakeDamage (a rogue player),
// duelAttack (a locked duel opponent). Hits taken come from CombatMusicTrigger
// through noteCombatActivity().
//
// EVENTS (window 'skillMasteryEvent'):
//   { type: 'LEVEL_UP', skillId, level }
//   { type: 'RANK_UP',  skillId, rank }

import { getSkillById } from './skillRegistry';
import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';
import {
  SKILL_MASTERY,
  SKILL_MASTERY_KEY,
  skillMasteryLevel,
  skillMasteryRank,
  skillMasteryXpForLevel,
  skillMasteryXpPerUse,
} from '../../../../base44/shared/skillMastery.ts';

export const SKILL_MASTERY_WINDOWS = Object.freeze({
  strikeMs: 1000,  // a strike must land this soon after it is thrown
  chargeMs: 20000, // a Critical Focus charge must be spent this soon
});

const storage = characterScopedStorage(SKILL_MASTERY_KEY);
const _listeners = new Set();

const now = () => performance.now();

function load() {
  try {
    const saved = JSON.parse(storage.get() || 'null');
    if (saved?.v === 1 && saved.xp && typeof saved.xp === 'object') {
      const xp = {};
      for (const [id, v] of Object.entries(saved.xp)) {
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) xp[id] = Math.min(SKILL_MASTERY.xpToMax, n);
      }
      return xp;
    }
  } catch {}
  return {};
}

let _xp = load();
// uses waiting to be confirmed by combat
let _strikes = []; // [{ skillId, xp, until }] — oldest first; one landed hit confirms one strike
let _charges = []; // [{ skillId, xp, until }]
let _buffs = {};   // skillId → { xp, until }

function persist() {
  try { storage.set(JSON.stringify({ v: 1, xp: _xp })); } catch {}
}

function emitEvent(detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('skillMasteryEvent', { detail }));
}

function toast(text) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('skillActivatedToast', { detail: { text } }));
}

const maxLevelOf = (skill) => Math.max(2, Number(skill?.max_level) || SKILL_MASTERY.maxLevel);

function snapshot(skillId) {
  const skill = getSkillById(skillId);
  const maxLevel = maxLevelOf(skill);
  const xp = _xp[skillId] || 0;
  const level = skillMasteryLevel(xp, maxLevel);
  const levelStartXp = skillMasteryXpForLevel(level, maxLevel);
  const nextLevelXp = level >= maxLevel ? null : skillMasteryXpForLevel(level + 1, maxLevel);
  return {
    skill_id: skillId,
    xp,
    level,
    maxLevel,
    rank: skillMasteryRank(level, maxLevel),
    levelStartXp,
    nextLevelXp,
    progress: nextLevelXp == null ? 1 : (xp - levelStartXp) / Math.max(1, nextLevelXp - levelStartXp),
  };
}

function emit() {
  const state = { xp: _xp };
  _listeners.forEach((fn) => fn(state));
}

function award(skillId, amount) {
  const skill = getSkillById(skillId);
  if (!skill || !(amount > 0)) return;
  const before = snapshot(skillId);
  if (before.level >= before.maxLevel) return;
  _xp = { ..._xp, [skillId]: Math.min(SKILL_MASTERY.xpToMax, before.xp + amount) };
  persist();
  const after = snapshot(skillId);
  for (let level = before.level + 1; level <= after.level; level++) {
    emitEvent({ type: 'LEVEL_UP', skillId, level });
  }
  if (after.rank.id !== before.rank.id) emitEvent({ type: 'RANK_UP', skillId, rank: after.rank.id });
  if (after.level > before.level) {
    const rankText = after.rank.id !== before.rank.id ? ` — ${after.rank.label}` : '';
    toast(`${skill.icon || '⬆️'} ${skill.skill_name} reached level ${after.level}${rankText}`);
  }
  emit();
}

const xpPerUse = (skill) => skillMasteryXpPerUse(skill?.cooldown);

// ─── Uses, called by the skill executor ────────────────────────────────
/** An attack skill threw one of its `strikesTotal` strikes. */
export function noteSkillStrike(skillId, strikesTotal = 1) {
  const skill = getSkillById(skillId);
  if (!skill) return;
  const t = now();
  _strikes = _strikes.filter((s) => s.until > t);
  _strikes.push({ skillId, xp: xpPerUse(skill) / Math.max(1, Number(strikesTotal) || 1), until: t + SKILL_MASTERY_WINDOWS.strikeMs });
}

/** A buff was cast; `until` is when it runs out (performance.now() ms). */
export function noteBuffCast(skillId, until) {
  const skill = getSkillById(skillId);
  if (!skill) return;
  _buffs = { ..._buffs, [skillId]: { xp: xpPerUse(skill), until: Number(until) || now() + (skill.duration || 0) * 1000 } };
}

/** An attack skill was spent as a Critical Focus charge (slot 2): the next hit landed uses it. */
export function noteSkillCharge(skillId) {
  const skill = getSkillById(skillId);
  if (!skill) return;
  const t = now();
  _charges = _charges.filter((c) => c.until > t && c.skillId !== skillId);
  _charges.push({ skillId, xp: xpPerUse(skill), until: t + SKILL_MASTERY_WINDOWS.chargeMs });
}

// ─── Combat confirmations ──────────────────────────────────────────────
function creditBuffs(t) {
  const pending = Object.entries(_buffs);
  if (!pending.length) return;
  _buffs = {};
  for (const [skillId, b] of pending) if (b.until > t) award(skillId, b.xp);
}

/** The hero landed a hit (any hit: basic attack or skill). */
export function noteHitLanded() {
  const t = now();
  _strikes = _strikes.filter((s) => s.until > t);
  const strike = _strikes.shift();
  if (strike) award(strike.skillId, strike.xp);
  const charges = _charges.filter((c) => c.until > t);
  _charges = [];
  for (const c of charges) award(c.skillId, c.xp);
  creditBuffs(t);
}

/** Combat is happening (a hit taken or landed): buffs that are up count as used. */
export function noteCombatActivity() {
  creditBuffs(now());
}

// ─── Read API ──────────────────────────────────────────────────────────
export function getSkillMastery(skillId) { return snapshot(skillId); }
export function getSkillMasteryLevel(skillId) { return snapshot(skillId).level; }
export function getAllSkillMastery() { return { ..._xp }; }
export function subscribeSkillMastery(fn) {
  _listeners.add(fn);
  fn({ xp: _xp });
  return () => _listeners.delete(fn);
}

subscribeCharacterChange(() => {
  _xp = load();
  _strikes = []; _charges = []; _buffs = {};
  emit();
});

if (typeof window !== 'undefined') {
  window.addEventListener('weaponMasteryEvent', (e) => { if (e.detail?.type === 'ON_HIT') noteHitLanded(); });
  window.addEventListener('rogueAITakeDamage', () => noteHitLanded());
  window.addEventListener('duelAttack', () => noteHitLanded());
}
