// ─── Character Roster Store ────────────────────────────────────────────
// Persistent multi-character roster. Each character has:
//   { id, name, appearance: { head, body, shoulders }, createdAt }
//
// One character is "active" at a time. The active character's ID is the
// namespace key used by every progression store (level/xp, halo, titles,
// weapon mastery, kill count, etc.) via `characterStorage.js`. Switching
// the active character causes every store to reload from that character's
// own slot — so each character has fully independent stats and starts
// fresh at level 1 with 0 in everything.

import {
  notifyCharacterChange,
} from './characterStorage';

const ROSTER_KEY = 'wwm_character_roster_v1';
const ACTIVE_KEY = 'wwm_character_active_v1';

// Default appearance — only one option per slot for now. More can be added later.
export const APPEARANCE_OPTIONS = {
  head:      [{ id: 'default', label: 'Default' }],
  body:      [{ id: 'default', label: 'Default' }],
  shoulders: [{ id: 'default', label: 'Default' }],
};

// Reserved id for the editor-only "Dev Test" character. This slot OWNS the
// legacy single-key progression data (the test progression that existed
// before the multi-character system) — `characterStorage.js` migrates the
// legacy keys into this id on first run, so it shows up pre-loaded with
// your old test data. Every character created AFTER this one starts fresh.
const DEV_TEST_ID = '__dev_test__';

const DEV_TEST_CHARACTER = {
  id: DEV_TEST_ID,
  name: 'Dev Test',
  isDevTest: true,
  appearance: { head: 'default', body: 'default', shoulders: 'default' },
  createdAt: '1970-01-01T00:00:00.000Z',
};

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(ROSTER_KEY) || '[]');
    // Ensure the Dev Test slot is always present at the top of the roster
    // (editor-only — safe to leave in for now; will be the first to display).
    const withoutDev = stored.filter((c) => c.id !== DEV_TEST_ID);
    const roster = [DEV_TEST_CHARACTER, ...withoutDev];
    const activeId = localStorage.getItem(ACTIVE_KEY) || DEV_TEST_ID;
    return { roster, activeId };
  } catch {
    return { roster: [DEV_TEST_CHARACTER], activeId: DEV_TEST_ID };
  }
}

let state = load();
const listeners = new Set();

const persist = () => {
  try {
    // Don't persist the Dev Test character into the roster — it's seeded
    // on every load() so it's always present without polluting the saved
    // user-created roster.
    const persistable = state.roster.filter((c) => c.id !== DEV_TEST_ID);
    localStorage.setItem(ROSTER_KEY, JSON.stringify(persistable));
    if (state.activeId) localStorage.setItem(ACTIVE_KEY, state.activeId);
  } catch {}
};
const emit = () => { persist(); listeners.forEach((fn) => fn(state)); };

export function getCharacterState() { return state; }

export function subscribeCharacters(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function getActiveCharacter() {
  return state.roster.find((c) => c.id === state.activeId) || null;
}

// Create a new character. Stored progression starts EMPTY for this id —
// the namespaced storage layer returns nothing for new ids, so every store
// initializes to its defaults (level 1, 0 XP, 0 halo, no titles, etc.).
export function createCharacter({ name, appearance }) {
  const id = `char_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const character = {
    id,
    name: (name || 'New Character').trim().slice(0, 24),
    appearance: {
      head:      appearance?.head      || 'default',
      body:      appearance?.body      || 'default',
      shoulders: appearance?.shoulders || 'default',
    },
    createdAt: new Date().toISOString(),
  };
  state = {
    roster: [...state.roster, character],
    activeId: id,
  };
  emit();
  // Tell every progression store to reload from this character's slot
  // (which is empty for a new character → everything resets to defaults).
  notifyCharacterChange();
  return character;
}

export function setActiveCharacter(id) {
  if (!state.roster.some((c) => c.id === id)) return;
  if (state.activeId === id) return;
  state = { ...state, activeId: id };
  emit();
  notifyCharacterChange();
}

// Called by the login screen when "PLAY" is pressed for a chosen character.
// Just switches the active character — every progression store will
// automatically reload from that character's namespaced slot.
export function activateAndSyncToHUD(id) {
  setActiveCharacter(id);
}