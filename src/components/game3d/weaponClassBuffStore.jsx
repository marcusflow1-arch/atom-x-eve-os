// ─── Weapon-Class Native Passive Buffs ─────────────────────────────────────
// AXE Prompt 012: the existing damage/defense/ranged browser paths are retained
// for compatibility, while AXE exposes them as offensive/defensive/ranged roles.
// State is now scoped per character so swapping characters cannot leak weapon
// class levels or the active weapon identity between save slots.

import { characterScopedStorage, subscribeCharacterChange } from './characterStorage';
import {
  getAXEWeaponRoleFromLegacyPath,
  getLegacyWeaponPathFromAXERole,
} from './axe/factions/AXEFactionWeaponConfig';

const storage = characterScopedStorage('weapon_class_buffs_v2');

export const WEAPON_CLASS_BUFFS = {
  damage: {
    id: 'brutal_force',
    name: 'Brutal Force',
    path: 'damage',
    axeRole: 'offensive',
    icon: '⚔️',
    color: '#ef4444',
    maxLevel: 20,
    description: 'Native passive of offensive weapons. Increases damage and grants a chance for Lethal Blow.',
    curves: {
      damageBonusPct:  { min: 0, max: 0.35 },
      lethalBlowPct:   { min: 0, max: 0.02 },
    },
  },
  ranged: {
    id: 'swift_marksman',
    name: 'Swift Marksman',
    path: 'ranged',
    axeRole: 'ranged',
    icon: '🏹',
    color: '#10b981',
    maxLevel: 25,
    description: 'Native passive of ranged weapons. Increases mobility, accuracy, damage and critical strike.',
    curves: {
      moveSpeedBonusPct: { min: 0, max: 0.25 },
      damageBonusPct:    { min: 0, max: 0.10 },
      hitChanceBonusPct: { min: 0, max: 0.15 },
      critChanceBonusPct:{ min: 0, max: 0.05 },
    },
  },
  defense: {
    id: 'iron_stance',
    name: 'Iron Stance',
    path: 'defense',
    axeRole: 'defensive',
    icon: '🛡️',
    color: '#3b82f6',
    maxLevel: 20,
    description: 'Native passive of defensive weapons. Bolsters defense, damage, evasion and guard.',
    curves: {
      defenseBonusPct: { min: 0, max: 0.40 },
      damageBonusPct:  { min: 0, max: 0.20 },
      dodgeChancePct:  { min: 0, max: 0.07 },
      guardChancePct:  { min: 0, max: 0.07 },
    },
  },
};

const defaultState = () => ({
  levels: { damage: 1, ranged: 1, defense: 1 },
  activePath: 'damage',
});

function loadState() {
  try {
    const raw = storage.get();
    if (raw) {
      const parsed = JSON.parse(raw);
      // v2 state shape
      if (parsed?.levels) {
        return {
          levels: {
            damage: Math.max(0, Number(parsed.levels.damage ?? 1)),
            ranged: Math.max(0, Number(parsed.levels.ranged ?? 1)),
            defense: Math.max(0, Number(parsed.levels.defense ?? 1)),
          },
          activePath: WEAPON_CLASS_BUFFS[parsed.activePath] ? parsed.activePath : 'damage',
        };
      }
      // migration from an old levels-only object if one is ever copied into this key
      if (parsed && typeof parsed === 'object') {
        return {
          levels: {
            damage: Math.max(0, Number(parsed.damage ?? 1)),
            ranged: Math.max(0, Number(parsed.ranged ?? 1)),
            defense: Math.max(0, Number(parsed.defense ?? 1)),
          },
          activePath: 'damage',
        };
      }
    }
  } catch {}
  return defaultState();
}

let state = loadState();
const listeners = new Set();

const save = () => {
  try { storage.set(JSON.stringify(state)); } catch {}
};

const emit = () => {
  save();
  const snapshot = {
    levels: { ...state.levels },
    activePath: state.activePath,
    activeAXERole: getAXEWeaponRoleFromLegacyPath(state.activePath),
  };
  listeners.forEach((fn) => fn(snapshot));
};

subscribeCharacterChange(() => {
  state = loadState();
  const snapshot = {
    levels: { ...state.levels },
    activePath: state.activePath,
    activeAXERole: getAXEWeaponRoleFromLegacyPath(state.activePath),
  };
  listeners.forEach((fn) => fn(snapshot));
});

export function subscribeWeaponBuffs(fn) {
  listeners.add(fn);
  fn({
    levels: { ...state.levels },
    activePath: state.activePath,
    activeAXERole: getAXEWeaponRoleFromLegacyPath(state.activePath),
  });
  return () => listeners.delete(fn);
}

export function getWeaponBuffLevels() { return { ...state.levels }; }
export function getActiveWeaponPath() { return state.activePath; }
export function getActiveAXEWeaponRole() { return getAXEWeaponRoleFromLegacyPath(state.activePath); }

export function setActiveWeaponPath(path) {
  if (!WEAPON_CLASS_BUFFS[path]) return false;
  if (state.activePath === path) return true;
  state = { ...state, activePath: path };
  emit();
  return true;
}

export function setActiveAXEWeaponRole(role) {
  return setActiveWeaponPath(getLegacyWeaponPathFromAXERole(role));
}

export function setWeaponBuffLevel(path, level) {
  const cfg = WEAPON_CLASS_BUFFS[path];
  if (!cfg) return false;
  const clamped = Math.max(0, Math.min(cfg.maxLevel, Math.round(level)));
  state = {
    ...state,
    levels: { ...state.levels, [path]: clamped },
  };
  emit();
  return true;
}

export function levelUpWeaponBuff(path) {
  const cfg = WEAPON_CLASS_BUFFS[path];
  if (!cfg) return false;
  return setWeaponBuffLevel(path, (state.levels[path] || 0) + 1);
}

function curveValue(curve, level, maxLevel) {
  if (maxLevel <= 0) return 0;
  const t = Math.max(0, Math.min(1, level / maxLevel));
  return curve.min + (curve.max - curve.min) * t;
}

export function getBuffValuesFor(path) {
  const cfg = WEAPON_CLASS_BUFFS[path];
  if (!cfg) return {};
  const lvl = state.levels[path] || 0;
  const out = {};
  for (const key of Object.keys(cfg.curves)) {
    out[key] = curveValue(cfg.curves[key], lvl, cfg.maxLevel);
  }
  return out;
}

export function getActiveBuffValues() {
  return getBuffValuesFor(state.activePath);
}
