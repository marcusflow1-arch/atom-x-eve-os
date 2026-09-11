// ─── Loadout Store — Equipped Skills ───────────────────────────────────
// Player chooses which skills go in which slot. ONE rule:
// passives go in the passive panel, NEVER in active slots.
//
// State shape:
//   {
//     activeSlots:  Array<skill_id|null>   length 10  (keys 1-9, 0 = slot 10)
//     passivePanel: Array<skill_id|null>   length 6
//     cooldowns:    Array<number>          length 10 (active slots only)
//   }

import { canEquipToSlot } from './slotValidator';
import { SLOT_KIND } from './skillTypes';
import { getSkillById } from './skillRegistry';

export const ACTIVE_SLOTS = 10;
const PASSIVE_SLOTS = 6;
// Keep the same storage key so existing 8-slot saves migrate naturally: the
// old entries are copied into slots 1-8 and slots 9-10 initialize empty.
const LS_KEY = 'game_loadout_v4';

const listeners = new Set();

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.activeSlots || !parsed?.passivePanel) return null;
    return {
      activeSlots: normalize(parsed.activeSlots, ACTIVE_SLOTS),
      passivePanel: normalize(parsed.passivePanel, PASSIVE_SLOTS),
    };
  } catch { return null; }
}

function normalize(arr, len) {
  const out = new Array(len).fill(null);
  if (Array.isArray(arr)) {
    for (let i = 0; i < Math.min(arr.length, len); i++) {
      const v = arr[i];
      if (typeof v === 'string' && getSkillById(v)) out[i] = v;
    }
  }
  return out;
}

function saveToStorage(current) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      activeSlots: current.activeSlots,
      passivePanel: current.passivePanel,
    }));
  } catch {}
}

const initial = loadFromStorage() || {
  activeSlots: new Array(ACTIVE_SLOTS).fill(null),
  passivePanel: new Array(PASSIVE_SLOTS).fill(null),
};

let state = {
  ...initial,
  cooldowns: new Array(ACTIVE_SLOTS).fill(0),
};

const emit = () => listeners.forEach((fn) => fn(state));

export function getLoadout() { return state; }
export function subscribeLoadout(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

/** Place a skill in an active slot (0..9). */
export function equipActive(slotIndex, skill_id) {
  if (slotIndex < 0 || slotIndex >= ACTIVE_SLOTS) return { ok: false, reason: 'bad_slot' };
  if (skill_id) {
    const check = canEquipToSlot(skill_id, SLOT_KIND.ACTIVE);
    if (!check.ok) return check;
  }
  const next = [...state.activeSlots];
  next[slotIndex] = skill_id || null;
  state = { ...state, activeSlots: next };
  saveToStorage(state);
  emit();
  return { ok: true };
}

export function unequipActive(slotIndex) {
  return equipActive(slotIndex, null);
}

export function equipPassive(slotIndex, skill_id) {
  if (slotIndex < 0 || slotIndex >= PASSIVE_SLOTS) return { ok: false, reason: 'bad_slot' };
  if (skill_id) {
    const check = canEquipToSlot(skill_id, SLOT_KIND.PASSIVE);
    if (!check.ok) return check;
  }
  const next = [...state.passivePanel];
  next[slotIndex] = skill_id || null;
  state = { ...state, passivePanel: next };
  saveToStorage(state);
  emit();
  return { ok: true };
}

export function unequipPassive(slotIndex) {
  return equipPassive(slotIndex, null);
}

export function getActiveSkillAt(slotIndex) {
  const id = state.activeSlots[slotIndex];
  return id ? getSkillById(id) : null;
}

export function startCooldown(slotIndex) {
  const skill = getActiveSkillAt(slotIndex);
  if (!skill) return;
  const next = [...state.cooldowns];
  next[slotIndex] = skill.cooldown || 0;
  state = { ...state, cooldowns: next };
  emit();
}

export function tickCooldowns(delta) {
  let changed = false;
  const next = state.cooldowns.map((cd) => {
    const v = Math.max(0, cd - delta);
    if (v !== cd) changed = true;
    return v;
  });
  if (changed) {
    state = { ...state, cooldowns: next };
    emit();
  }
}

export function isOnCooldown(slotIndex) {
  return (state.cooldowns[slotIndex] || 0) > 0;
}
