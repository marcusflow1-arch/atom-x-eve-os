// ─── WeaponMasteryEngine ─────────────────────────────────────────────────
// Tracks per-weapon usage statistics and converts them into mastery XP via
// the existing weaponMasteryStore (which owns level + persistence).
//
// This engine is the ONLY module that should be called from combat sites.
// It emits weaponMasteryEvents on window for any listener that wants
// to react (UI, audio, milestone toasts).
//
// EVENTS (window dispatchEvents on 'weaponMasteryEvent'):
//   { type: 'ON_HIT',           weaponId, damage }
//   { type: 'ON_CRIT',          weaponId, damage }
//   { type: 'ON_KILL',          weaponId }
//   { type: 'ON_BOSS_DAMAGE',   weaponId, damage }
//   { type: 'ON_LEVEL_UP',      weaponId, level }
//   { type: 'ON_MILESTONE_UNLOCK', weaponId, milestone }

import {
  getMasteryState,
  getWeaponLevel,
  recordWeaponKill,
  setMasteryLevel,
} from '../weaponMasteryStore';
import {
  XP_WEIGHTS,
  MILESTONE_LEVELS,
  MILESTONE_PASSIVES,
  resolveWeaponType,
} from './weaponMasteryConfig';

const STORAGE_KEY = 'weapon_mastery_stats_v1';

// Per-weapon stats kept in memory + persisted. These are usage counters that
// drive the XP curve in addition to the existing kills-into-level system.
const buildDefaultStats = () => ({
  total_hits: 0,
  total_damage: 0,
  crit_hits: 0,
  boss_damage: 0,
  mastery_xp: 0, // fractional XP accumulator (1.0 = one kill-equivalent)
});

let stats = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
})();

const ensure = (weaponId) => {
  if (!stats[weaponId]) stats[weaponId] = buildDefaultStats();
  return stats[weaponId];
};

const persist = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch {}
};

const emit = (payload) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('weaponMasteryEvent', { detail: payload }));
};

// ─── XP intake ──────────────────────────────────────────────────────────
// Adds fractional kill-equivalent XP; when accumulated ≥ 1 we forward the
// integer portion to the existing store (which handles the level curve).
function addXP(weaponId, amount) {
  if (!weaponId || amount <= 0) return;
  const s = ensure(weaponId);
  s.mastery_xp += amount;
  if (s.mastery_xp >= 1) {
    const whole = Math.floor(s.mastery_xp);
    s.mastery_xp -= whole;
    const before = getWeaponLevel(weaponId);
    recordWeaponKill(weaponId, whole);
    const after = getWeaponLevel(weaponId);
    if (after > before) {
      for (let lvl = before + 1; lvl <= after; lvl++) {
        emit({ type: 'ON_LEVEL_UP', weaponId, level: lvl });
        const type = resolveWeaponType(weaponId);
        if (MILESTONE_LEVELS.includes(lvl)) {
          const milestone = MILESTONE_PASSIVES[type]?.[lvl];
          if (milestone) emit({ type: 'ON_MILESTONE_UNLOCK', weaponId, milestone });
        }
      }
    }
  }
  persist();
}

// ─── Public combat hooks ────────────────────────────────────────────────
export function reportWeaponHit({ weaponId, damage = 0, isCrit = false, isBoss = false }) {
  if (!weaponId) return;
  const s = ensure(weaponId);
  s.total_hits += 1;
  s.total_damage += damage;
  if (isCrit) s.crit_hits += 1;
  if (isBoss) s.boss_damage += damage;

  let xp = XP_WEIGHTS.perHit + damage * XP_WEIGHTS.perDamageDealt;
  if (isCrit) xp += XP_WEIGHTS.perCrit;
  if (isBoss) xp += damage * (XP_WEIGHTS.perBossDamage - XP_WEIGHTS.perDamageDealt);
  addXP(weaponId, xp);

  emit({ type: 'ON_HIT', weaponId, damage });
  if (isCrit) emit({ type: 'ON_CRIT', weaponId, damage });
  if (isBoss) emit({ type: 'ON_BOSS_DAMAGE', weaponId, damage });
}

export function reportWeaponKill(weaponId) {
  if (!weaponId) return;
  addXP(weaponId, XP_WEIGHTS.perKill);
  emit({ type: 'ON_KILL', weaponId });
}

export function reportSkillCast(weaponId) {
  if (!weaponId) return;
  addXP(weaponId, XP_WEIGHTS.perSkillCast);
}

// ─── Read-only API ──────────────────────────────────────────────────────
export function getWeaponMasterySnapshot(weaponId) {
  const s = ensure(weaponId);
  const level = getWeaponLevel(weaponId);
  return { weapon_id: weaponId, level, ...s };
}

export function getAllWeaponMastery() {
  const out = {};
  const ms = getMasteryState();
  Object.keys(ms.weapons).forEach((id) => {
    out[id] = getWeaponMasterySnapshot(id);
  });
  return out;
}

// Debug / cheat util
export function devSetLevel(weaponId, level) {
  setMasteryLevel(weaponId, level);
}

// Subscribe to mastery events. Returns an unsubscribe fn.
export function subscribeWeaponMasteryEvents(fn) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e) => fn(e.detail);
  window.addEventListener('weaponMasteryEvent', handler);
  return () => window.removeEventListener('weaponMasteryEvent', handler);
}