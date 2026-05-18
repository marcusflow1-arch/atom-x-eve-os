// ─── Character-Scoped Storage ────────────────────────────────────────────
// All per-character progression (level, XP, stats, halo, titles, weapon
// mastery, kill count, etc.) is stored under a localStorage key namespaced
// by the active character ID, so two characters never share the same data.
//
// Layout:
//   <baseKey>::<characterId>    → that character's data
//   <baseKey>                    → legacy single-character data (read once
//                                  and migrated to the first character on
//                                  first run; never written to again).
//
// Stores call `characterScopedStorage(baseKey)` to get a tiny { get, set }
// pair that reads / writes the active character's slot automatically.
// When the active character changes, stores call `reloadFromStorage()`
// (via a subscription registered with `subscribeCharacterChange`) to refresh
// their in-memory state.

const ACTIVE_ID_KEY = 'wwm_character_active_v1';

// Default "fallback" character id used before the player has created any
// character. Lets the stores keep working in dev / tests without crashing.
const DEFAULT_ID = '__default__';

function getActiveId() {
  try {
    return localStorage.getItem(ACTIVE_ID_KEY) || DEFAULT_ID;
  } catch {
    return DEFAULT_ID;
  }
}

// Reactive: any store that wants to re-load its state when the active
// character changes registers a callback here. The character store calls
// `notifyCharacterChange()` after it changes the active id.
const changeListeners = new Set();

export function subscribeCharacterChange(fn) {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}

export function notifyCharacterChange() {
  changeListeners.forEach((fn) => { try { fn(getActiveId()); } catch {} });
}

// Builds the namespaced key for the CURRENT active character at call time.
function scopedKey(baseKey) {
  return `${baseKey}::${getActiveId()}`;
}

// Public: a { get, set, remove, baseKey } accessor scoped to the active
// character. On first read for a brand-new character, transparently
// migrates legacy single-key data into the new slot exactly once.
export function characterScopedStorage(baseKey) {
  return {
    baseKey,
    get() {
      try {
        const scoped = localStorage.getItem(scopedKey(baseKey));
        if (scoped !== null) return scoped;
        // Migration path: if this character has no scoped data yet but
        // there IS legacy data at the base key, copy it ONCE for the
        // first character (so existing players keep their progression).
        // For NEW characters created later, we skip this migration to
        // ensure they start fresh.
        const legacy = localStorage.getItem(baseKey);
        if (legacy !== null && isFirstCharacterToMigrate(baseKey)) {
          localStorage.setItem(scopedKey(baseKey), legacy);
          return legacy;
        }
        return null;
      } catch {
        return null;
      }
    },
    set(value) {
      try { localStorage.setItem(scopedKey(baseKey), value); } catch {}
    },
    remove() {
      try { localStorage.removeItem(scopedKey(baseKey)); } catch {}
    },
  };
}

// Only the FIRST character ever created inherits legacy single-key data.
// We track which baseKeys have been migrated so a NEW character created
// later starts completely fresh.
const MIGRATION_FLAG_KEY = 'wwm_character_storage_migrated_v1';

function getMigrationFlags() {
  try { return JSON.parse(localStorage.getItem(MIGRATION_FLAG_KEY) || '{}'); }
  catch { return {}; }
}

function setMigrationFlag(baseKey) {
  try {
    const flags = getMigrationFlags();
    flags[baseKey] = getActiveId();
    localStorage.setItem(MIGRATION_FLAG_KEY, JSON.stringify(flags));
  } catch {}
}

function isFirstCharacterToMigrate(baseKey) {
  const flags = getMigrationFlags();
  // Already migrated for some character → never migrate again.
  if (flags[baseKey]) return false;
  setMigrationFlag(baseKey);
  return true;
}