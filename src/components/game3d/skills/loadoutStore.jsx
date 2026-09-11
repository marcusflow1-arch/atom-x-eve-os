// TwelveSky-style equipped skill loadout.
// Active keys are 1..9 plus 0 for slot 10. Passives remain separate.

import { canEquipToSlot } from './slotValidator';
import { SLOT_KIND } from './skillTypes';
import { getSkillById } from './skillRegistry';

export const ACTIVE_SLOTS = 10;
const PASSIVE_SLOTS = 6;
const LS_KEY = 'game_loadout_v5';
const LEGACY_KEY = 'game_loadout_v4';
const listeners = new Set();

function normalize(arr, len) {
  const out = new Array(len).fill(null);
  if (Array.isArray(arr)) {
    for (let i = 0; i < Math.min(arr.length, len); i += 1) {
      const value = arr[i];
      if (typeof value === 'string' && getSkillById(value)) out[i] = value;
    }
  }
  return out;
}

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function loadFromStorage() {
  const parsed = read(LS_KEY) || read(LEGACY_KEY);
  if (!parsed?.activeSlots || !parsed?.passivePanel) return null;
  return {
    activeSlots: normalize(parsed.activeSlots, ACTIVE_SLOTS),
    passivePanel: normalize(parsed.passivePanel, PASSIVE_SLOTS),
  };
}

function saveToStorage(snapshot) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      activeSlots: snapshot.activeSlots,
      passivePanel: snapshot.passivePanel,
    }));
  } catch {}
}

const initial = loadFromStorage() || {
  activeSlots: new Array(ACTIVE_SLOTS).fill(null),
  passivePanel: new Array(PASSIVE_SLOTS).fill(null),
};

let state = { ...initial, cooldowns: new Array(ACTIVE_SLOTS).fill(0) };
const emit = () => listeners.forEach((fn) => fn(state));

export function getLoadout() { return state; }
export function subscribeLoadout(fn) { listeners.add(fn); fn(state); return () => listeners.delete(fn); }

export function equipActive(slotIndex, skillId) {
  if (slotIndex < 0 || slotIndex >= ACTIVE_SLOTS) return { ok: false, reason: 'bad_slot' };
  if (skillId) {
    const check = canEquipToSlot(skillId, SLOT_KIND.ACTIVE);
    if (!check.ok) return check;
  }
  const activeSlots = [...state.activeSlots];
  activeSlots[slotIndex] = skillId || null;
  state = { ...state, activeSlots };
  saveToStorage(state);
  emit();
  return { ok: true };
}

export function unequipActive(slotIndex) { return equipActive(slotIndex, null); }

export function equipPassive(slotIndex, skillId) {
  if (slotIndex < 0 || slotIndex >= PASSIVE_SLOTS) return { ok: false, reason: 'bad_slot' };
  if (skillId) {
    const check = canEquipToSlot(skillId, SLOT_KIND.PASSIVE);
    if (!check.ok) return check;
  }
  const passivePanel = [...state.passivePanel];
  passivePanel[slotIndex] = skillId || null;
  state = { ...state, passivePanel };
  saveToStorage(state);
  emit();
  return { ok: true };
}

export function unequipPassive(slotIndex) { return equipPassive(slotIndex, null); }

export function getActiveSkillAt(slotIndex) {
  const id = state.activeSlots[slotIndex];
  return id ? getSkillById(id) : null;
}

export function startCooldown(slotIndex) {
  const skill = getActiveSkillAt(slotIndex);
  if (!skill) return;
  const cooldowns = [...state.cooldowns];
  cooldowns[slotIndex] = skill.cooldown || 0;
  state = { ...state, cooldowns };
  emit();
}

export function tickCooldowns(delta) {
  let changed = false;
  const cooldowns = state.cooldowns.map((cd) => {
    const next = Math.max(0, cd - delta);
    if (next !== cd) changed = true;
    return next;
  });
  if (changed) { state = { ...state, cooldowns }; emit(); }
}

export function isOnCooldown(slotIndex) { return (state.cooldowns[slotIndex] || 0) > 0; }
