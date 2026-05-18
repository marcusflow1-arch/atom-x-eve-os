// ─── Title Store ──────────────────────────────────────────────────────────
// Manages persistent title progression: kill tracking per path, current
// equipped title, and stat-bonus exposure for the combat pipeline.
//
// Each title path tracks its OWN kill counter so players can grind multiple
// paths in parallel. Only ONE title is equipped at a time — that one
// contributes stat bonuses to derived stats.
//
// API mirrors haloStore for consistency:
//
//   recordTitleKill(killType?)          — credit kills toward ALL active grinds
//   equipTitle(pathId)                  — set the active title path
//   unequipTitle()                      — clear active title
//   getTitleState()                     — full snapshot for UI
//   getEquippedTitleBonuses()           — bonuses to feed into statsSystem
//   subscribeTitles(fn)                 — reactive subscription
//   setTitleLevel(pathId, level)        — admin / debug
//   resetTitles()                       — admin / debug

import {
  MAX_TITLE_LEVEL,
  TITLE_PATHS,
  TITLE_KILL_POINTS,
  killsRequiredForTitleLevel,
  getTitlePathById,
  getTitleBonusesForLevel,
  getTitleRarityForLevel,
} from './titleData';
import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';

const storage = characterScopedStorage('title_progression_v1');

// Tracks per-path stats. paths[pathId] = { level, killsIntoLevel, totalKills }
const initialPathState = () => {
  const paths = {};
  TITLE_PATHS.forEach((p) => {
    paths[p.id] = { level: 0, killsIntoLevel: 0, totalKills: 0 };
  });
  return paths;
};

const loadState = () => {
  try {
    const raw = storage.get();
    if (raw) {
      const parsed = JSON.parse(raw);
      const paths = initialPathState();
      // Merge persisted path data on top of defaults to handle new paths added later.
      Object.keys(parsed.paths || {}).forEach((id) => {
        if (paths[id]) {
          const p = parsed.paths[id];
          paths[id] = {
            level:          Math.max(0, Math.min(MAX_TITLE_LEVEL, p.level || 0)),
            killsIntoLevel: Math.max(0, p.killsIntoLevel || 0),
            totalKills:     Math.max(0, p.totalKills || 0),
          };
        }
      });
      return {
        paths,
        equippedPathId: parsed.equippedPathId || null,
        tracking: {
          totalEnemyKills: parsed.tracking?.totalEnemyKills || 0,
          bossKills:       parsed.tracking?.bossKills       || 0,
          eliteKills:      parsed.tracking?.eliteKills      || 0,
          pvpKills:        parsed.tracking?.pvpKills        || 0,
          raidParticipation: parsed.tracking?.raidParticipation || 0,
        },
      };
    }
  } catch {}
  return {
    paths: initialPathState(),
    equippedPathId: null,
    tracking: {
      totalEnemyKills: 0,
      bossKills: 0,
      eliteKills: 0,
      pvpKills: 0,
      raidParticipation: 0,
    },
  };
};

let state = loadState();
const listeners = new Set();

const save = () => { storage.set(JSON.stringify(state)); };

const emit = () => {
  const snapshot = getTitleState();
  listeners.forEach((fn) => fn(snapshot));
};

// Reload this character's title data when the active character switches.
subscribeCharacterChange(() => { state = loadState(); emit(); });

// ── Progression math ──────────────────────────────────────────────────────
// Adds `count` kills toward a specific path, leveling it up as thresholds
// are crossed. Returns the path's new state.
function advancePath(pathId, count) {
  const p = state.paths[pathId];
  if (!p) return null;
  if (p.level >= MAX_TITLE_LEVEL) {
    // Still bank totalKills for analytics, but stop leveling.
    p.totalKills += count;
    return p;
  }

  let kills = p.killsIntoLevel + count;
  let level = p.level;
  p.totalKills += count;

  // Each level requires `killsRequiredForTitleLevel(level+1)` kills.
  while (level < MAX_TITLE_LEVEL) {
    const need = killsRequiredForTitleLevel(level + 1);
    if (kills >= need) {
      kills -= need;
      level += 1;
    } else {
      break;
    }
  }

  p.level = level;
  p.killsIntoLevel = level >= MAX_TITLE_LEVEL ? 0 : kills;
  return p;
}

// ── Public API ────────────────────────────────────────────────────────────

export function getTitleState() {
  const paths = {};
  TITLE_PATHS.forEach((def) => {
    const p = state.paths[def.id];
    const nextLevelKills = p.level >= MAX_TITLE_LEVEL ? 0 : killsRequiredForTitleLevel(p.level + 1);
    paths[def.id] = {
      ...def,
      level: p.level,
      killsIntoLevel: p.killsIntoLevel,
      killsForNextLevel: nextLevelKills,
      totalKills: p.totalKills,
      isMaxLevel: p.level >= MAX_TITLE_LEVEL,
      rarity: getTitleRarityForLevel(Math.max(1, p.level || 1)),
      bonuses: getTitleBonusesForLevel(def.id, p.level),
      nextLevelBonuses: p.level < MAX_TITLE_LEVEL
        ? getTitleBonusesForLevel(def.id, p.level + 1)
        : null,
    };
  });
  return {
    paths,
    equippedPathId: state.equippedPathId,
    equippedTitle: state.equippedPathId ? paths[state.equippedPathId] : null,
    tracking: { ...state.tracking },
  };
}

// Bonuses from the currently-equipped title only. null-safe for statsSystem.
// Returns FLAT FINAL stats (hp/damage/defense/critChance/critDamage/criticalDefense).
export function getEquippedTitleBonuses() {
  if (!state.equippedPathId) {
    return { hp: 0, damage: 0, defense: 0, critChance: 0, critDamage: 0, criticalDefense: 0 };
  }
  const p = state.paths[state.equippedPathId];
  return getTitleBonusesForLevel(state.equippedPathId, p.level);
}

export function subscribeTitles(fn) {
  listeners.add(fn);
  fn(getTitleState());
  return () => listeners.delete(fn);
}

// Record a kill toward title progression. ONLY the EQUIPPED title path
// accumulates progress — players choose which build to grind by equipping it.
// Each killType is worth a different number of progress points (see
// TITLE_KILL_POINTS): normal=1, elite=5, boss=100, pvp=10, raid=25.
//
//   killType: 'normal' | 'elite' | 'boss' | 'pvp' | 'raid'
//   count:    number of kills (each multiplied by the type's point value)
export function recordTitleKill(killType = 'normal', count = 1) {
  if (count <= 0) return;

  // Update global tracking counters (for analytics / future use).
  state.tracking.totalEnemyKills += count;
  if (killType === 'elite') state.tracking.eliteKills += count;
  if (killType === 'boss')  state.tracking.bossKills  += count;
  if (killType === 'pvp')   state.tracking.pvpKills   += count;
  if (killType === 'raid')  state.tracking.raidParticipation += count;

  // Convert kills to progress points. Only the EQUIPPED path advances.
  const pointsPerKill = TITLE_KILL_POINTS[killType] ?? 1;
  const points = pointsPerKill * count;
  if (state.equippedPathId && points > 0) {
    advancePath(state.equippedPathId, points);
  }

  save();
  emit();
}

export function equipTitle(pathId) {
  if (!getTitlePathById(pathId)) return;
  state.equippedPathId = pathId;
  save();
  emit();
}

export function unequipTitle() {
  state.equippedPathId = null;
  save();
  emit();
}

export function setTitleLevel(pathId, level) {
  const p = state.paths[pathId];
  if (!p) return;
  p.level = Math.max(0, Math.min(MAX_TITLE_LEVEL, Math.round(level)));
  p.killsIntoLevel = 0;
  save();
  emit();
}

export function resetTitles() {
  state = {
    paths: initialPathState(),
    equippedPathId: null,
    tracking: { totalEnemyKills: 0, bossKills: 0, eliteKills: 0, pvpKills: 0, raidParticipation: 0 },
  };
  save();
  emit();
}