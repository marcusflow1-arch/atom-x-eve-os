// ─── Character Roster Store ────────────────────────────────────────────
// Persistent multi-character roster. Each character has:
//   { id, name, level, xp, appearance: { head, body, shoulders }, createdAt }
//
// One character is "active" at a time. The active character's level/xp is
// MIRRORED into playerHUDStore so in-world progression updates the roster,
// and logging back in restores that exact level. Persisted in localStorage.

import {
  getPlayerHUD,
  subscribePlayerHUD,
  setPlayerHUD,
} from './playerHUDStore';

const ROSTER_KEY = 'wwm_character_roster_v1';
const ACTIVE_KEY = 'wwm_character_active_v1';

// Default appearance — only one option per slot for now. More can be added later.
export const APPEARANCE_OPTIONS = {
  head:      [{ id: 'default', label: 'Default' }],
  body:      [{ id: 'default', label: 'Default' }],
  shoulders: [{ id: 'default', label: 'Default' }],
};

function load() {
  try {
    const roster = JSON.parse(localStorage.getItem(ROSTER_KEY) || '[]');
    const activeId = localStorage.getItem(ACTIVE_KEY) || (roster[0]?.id ?? null);
    return { roster, activeId };
  } catch {
    return { roster: [], activeId: null };
  }
}

let state = load();
const listeners = new Set();

const persist = () => {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(state.roster));
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

// Create a new character at level 1. Returns the new character.
export function createCharacter({ name, appearance }) {
  const id = `char_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const character = {
    id,
    name: (name || 'New Character').trim().slice(0, 24),
    level: 1,
    xp: 0,
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
  return character;
}

export function setActiveCharacter(id) {
  if (!state.roster.some((c) => c.id === id)) return;
  state = { ...state, activeId: id };
  emit();
}

// ─── Live sync with playerHUDStore ───────────────────────────────────────
// Whenever the player's HUD level/xp changes in-world, write it back to the
// active character in the roster. This is what makes "log out at lvl 3 → log
// back in at lvl 3" work.
subscribePlayerHUD((hud) => {
  if (!state.activeId) return;
  const active = state.roster.find((c) => c.id === state.activeId);
  if (!active) return;
  if (active.level === hud.level && active.xp === hud.xp) return;
  state = {
    ...state,
    roster: state.roster.map((c) =>
      c.id === state.activeId ? { ...c, level: hud.level, xp: hud.xp } : c
    ),
  };
  emit();
});

// When the active character changes (or on app load), seed the HUD so
// gameplay sees the saved level. We DO NOT overwrite HUD if it's already
// at a higher level than the saved value — playerHUDStore is its own
// source of truth for the running session.
export function activateAndSyncToHUD(id) {
  setActiveCharacter(id);
  const c = getActiveCharacter();
  if (!c) return;
  const hud = getPlayerHUD();
  if (hud.level !== c.level || hud.xp !== c.xp) {
    setPlayerHUD({ level: c.level, xp: c.xp });
  }
}