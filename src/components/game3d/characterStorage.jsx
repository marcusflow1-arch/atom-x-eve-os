// ─── Per-User, Per-Character Scoped Storage ──────────────────────────────
// All persistent character progression (level, XP, stats, halo, titles,
// weapon mastery, kill count, checkpoints, …) is stored under a key that is
// namespaced by BOTH the logged-in user and the active character, so:
//   • two accounts on the same browser never share a save
//   • two characters on one account never share a save
//
// Layout:
//   <baseKey>::<userId>::<characterId>   → that user's character data
//   <baseKey>                            → legacy single-key data, read once
//                                          and migrated into the legacy
//                                          owner's Dev Test slot only.
//
// Stores call `characterScopedStorage(baseKey)` for a { get, set, remove }
// pair that always resolves the CURRENT user + character at call time, and
// `subscribeCharacterChange()` to reload when either one changes.

const ACTIVE_ID_BASE = 'wwm_character_active_v1';
const STORAGE_USER_KEY = 'wwm_storage_user_v1';

// Namespace used before a user is known (offline / not signed in). It is a
// real namespace of its own — never a shared fallback for signed-in users.
const ANON_USER = '__anon__';
// Fallback character id used before any character has been created.
const DEFAULT_ID = '__default__';

let currentUserNs = (() => {
  try { return localStorage.getItem(STORAGE_USER_KEY) || ANON_USER; }
  catch { return ANON_USER; }
})();

export function getStorageUser() { return currentUserNs; }

// Called by the auth layer whenever the signed-in user changes (login,
// logout, account switch). Every store reloads from the new user's slots.
export function setStorageUser(userId) {
  const ns = userId || ANON_USER;
  if (ns === currentUserNs) return;
  currentUserNs = ns;
  try { localStorage.setItem(STORAGE_USER_KEY, ns); } catch {}
  notifyCharacterChange();
}

// User-scoped (character-agnostic) key — used for the roster / active id.
export function userScopedKey(baseKey) {
  return `${baseKey}::${currentUserNs}`;
}

export function getActiveId() {
  try {
    return localStorage.getItem(userScopedKey(ACTIVE_ID_BASE)) || DEFAULT_ID;
  } catch {
    return DEFAULT_ID;
  }
}

// Reactive: stores register here to re-load state when the active user or
// character changes.
const changeListeners = new Set();

export function subscribeCharacterChange(fn) {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}

export function notifyCharacterChange() {
  changeListeners.forEach((fn) => { try { fn(getActiveId()); } catch {} });
}

function scopedKey(baseKey) {
  return `${baseKey}::${currentUserNs}::${getActiveId()}`;
}

// ─── Legacy migration ────────────────────────────────────────────────────
// The old single-key progression belongs to ONE account (whoever ran the app
// before user scoping existed). It is migrated into that account's Dev Test
// slot only — it is never handed to any other user as starter data.
const DEV_TEST_ID = '__dev_test__';
const MIGRATION_FLAG_KEY = 'wwm_character_storage_migrated_v1';
const LEGACY_OWNER_KEY = 'wwm_legacy_owner_user_v1';

function getMigrationFlags() {
  try { return JSON.parse(localStorage.getItem(MIGRATION_FLAG_KEY) || '{}'); }
  catch { return {}; }
}

function markMigrated(baseKey) {
  try {
    const flags = getMigrationFlags();
    flags[`${currentUserNs}::${baseKey}`] = true;
    localStorage.setItem(MIGRATION_FLAG_KEY, JSON.stringify(flags));
  } catch {}
}

// Only the legacy owner may inherit the pre-scoping data. The first user to
// look for it claims ownership; everyone else starts fresh.
function isLegacyOwner() {
  try {
    const owner = localStorage.getItem(LEGACY_OWNER_KEY);
    if (!owner) { localStorage.setItem(LEGACY_OWNER_KEY, currentUserNs); return true; }
    return owner === currentUserNs;
  } catch {
    return false;
  }
}

export function characterScopedStorage(baseKey) {
  return {
    baseKey,
    get() {
      try {
        const key = scopedKey(baseKey);
        const scoped = localStorage.getItem(key);
        if (scoped !== null) return scoped;

        if (getActiveId() === DEV_TEST_ID && isLegacyOwner()) {
          const flags = getMigrationFlags();
          if (!flags[`${currentUserNs}::${baseKey}`]) {
            markMigrated(baseKey);
            const legacy = localStorage.getItem(baseKey);
            if (legacy !== null) {
              localStorage.setItem(key, legacy);
              return legacy;
            }
          }
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