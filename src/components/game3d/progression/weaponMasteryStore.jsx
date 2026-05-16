// ─── Weapon Mastery Store ────────────────────────────────────────────────
// Tracks per-weapon mastery level, XP (kills/uses), and unlocked abilities.
// Mirrors the same persistent / subscribe pattern as halo + title stores.

import { WEAPONS, MASTERY_MAX_LEVEL, killsForMasteryLevel } from './weaponSynergyData';

const STORAGE_KEY = 'weapon_mastery_v1';

const defaults = () => {
  const out = {};
  WEAPONS.forEach((w) => {
    out[w.id] = { level: 1, killsIntoLevel: 0, totalKills: 0 };
  });
  return out;
};

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged = defaults();
      Object.keys(parsed.weapons || {}).forEach((id) => {
        if (merged[id]) {
          const p = parsed.weapons[id];
          merged[id] = {
            level:          Math.max(1, Math.min(MASTERY_MAX_LEVEL, p.level || 1)),
            killsIntoLevel: Math.max(0, p.killsIntoLevel || 0),
            totalKills:     Math.max(0, p.totalKills || 0),
          };
        }
      });
      return { weapons: merged, activeWeaponId: parsed.activeWeaponId || null };
    }
  } catch {}
  return { weapons: defaults(), activeWeaponId: null };
};

let state = load();
const listeners = new Set();

const save = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
};
const emit = () => {
  const snap = getMasteryState();
  listeners.forEach((fn) => fn(snap));
};

function advance(weaponId, count) {
  const w = state.weapons[weaponId];
  if (!w) return;
  w.totalKills += count;
  if (w.level >= MASTERY_MAX_LEVEL) return;
  let kills = w.killsIntoLevel + count;
  let level = w.level;
  while (level < MASTERY_MAX_LEVEL) {
    const need = killsForMasteryLevel(level + 1);
    if (kills >= need) {
      kills -= need;
      level += 1;
    } else break;
  }
  w.level = level;
  w.killsIntoLevel = level >= MASTERY_MAX_LEVEL ? 0 : kills;
}

export function setActiveWeapon(weaponId) {
  state.activeWeaponId = weaponId || null;
  save();
  emit();
}

// Record a kill while a weapon is equipped. Pass an explicit weaponId or
// fall back to the currently-active weapon set via setActiveWeapon().
export function recordWeaponKill(weaponId = null, count = 1) {
  const id = weaponId || state.activeWeaponId;
  if (!id || !state.weapons[id] || count <= 0) return;
  advance(id, count);
  save();
  emit();
}

export function getMasteryState() {
  const weapons = {};
  Object.keys(state.weapons).forEach((id) => {
    const w = state.weapons[id];
    const nextNeed = w.level >= MASTERY_MAX_LEVEL ? 0 : killsForMasteryLevel(w.level + 1);
    weapons[id] = {
      ...w,
      killsForNextLevel: nextNeed,
      isMaxLevel: w.level >= MASTERY_MAX_LEVEL,
    };
  });
  return { weapons, activeWeaponId: state.activeWeaponId };
}

export function getWeaponLevel(weaponId) {
  return state.weapons[weaponId]?.level || 1;
}

export function subscribeMastery(fn) {
  listeners.add(fn);
  fn(getMasteryState());
  return () => listeners.delete(fn);
}

export function setMasteryLevel(weaponId, level) {
  if (!state.weapons[weaponId]) return;
  state.weapons[weaponId].level = Math.max(1, Math.min(MASTERY_MAX_LEVEL, Math.round(level)));
  state.weapons[weaponId].killsIntoLevel = 0;
  save();
  emit();
}

export function resetMastery() {
  state = { weapons: defaults(), activeWeaponId: null };
  save();
  emit();
}