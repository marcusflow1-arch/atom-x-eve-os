// ─── Companion Loadout Store ───────────────────────────────────────────
// Mirrors the player loadoutStore but for the companion's 4-button bar
// (Z / X / V / B). State is persisted to localStorage so equipped
// companion skills survive reloads.
//
// State shape:
//   { activeSlots: Array<skill_id|null>(length 4) }
//
// Default loadout: the 4 original companion abilities pre-equipped so
// existing gameplay (Bite/Drain/Dash/Heal) keeps working out of the box.

import { getCompanionSkillById } from './companionSkillRegistry';

const SLOT_COUNT = 4;
const LS_KEY = 'companion_loadout_v1';

const DEFAULT_LOADOUT = [
  'companion_bite',
  'companion_life_drain',
  'companion_teleport_dash',
  'companion_heal',
];

const listeners = new Set();

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.activeSlots)) return null;
    return { activeSlots: normalize(parsed.activeSlots) };
  } catch { return null; }
}

function normalize(arr) {
  const out = new Array(SLOT_COUNT).fill(null);
  for (let i = 0; i < Math.min(arr.length, SLOT_COUNT); i++) {
    const v = arr[i];
    if (typeof v === 'string' && getCompanionSkillById(v)) out[i] = v;
  }
  return out;
}

function saveToStorage(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ activeSlots: state.activeSlots })); } catch {}
}

let state = loadFromStorage() || { activeSlots: [...DEFAULT_LOADOUT] };

const emit = () => listeners.forEach((fn) => fn(state));

export function getCompanionLoadout() { return state; }

export function subscribeCompanionLoadout(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

// Place a companion skill in a slot (0..3). Passing null clears the slot.
export function equipCompanionSkill(slotIndex, skill_id) {
  if (slotIndex < 0 || slotIndex >= SLOT_COUNT) return { ok: false, reason: 'bad_slot' };
  if (skill_id && !getCompanionSkillById(skill_id)) return { ok: false, reason: 'unknown_skill' };

  // Prevent the same skill being equipped twice — auto-swap.
  const next = [...state.activeSlots];
  if (skill_id) {
    const existing = next.indexOf(skill_id);
    if (existing !== -1) next[existing] = null;
  }
  next[slotIndex] = skill_id || null;
  state = { ...state, activeSlots: next };
  saveToStorage(state);
  emit();
  return { ok: true };
}

export function unequipCompanionSkill(slotIndex) {
  return equipCompanionSkill(slotIndex, null);
}

export function getEquippedCompanionSkillAt(slotIndex) {
  const id = state.activeSlots[slotIndex];
  return id ? getCompanionSkillById(id) : null;
}

// Resolve a key (Z/X/V/B) → the equipped skill at that position, in order.
export const COMPANION_SLOT_KEYS = ['Z', 'X', 'V', 'B'];
export function getCompanionSkillForKey(key) {
  const idx = COMPANION_SLOT_KEYS.indexOf(key);
  return idx === -1 ? null : getEquippedCompanionSkillAt(idx);
}