// Wuxia blueprint §3 — Weapon Affinity choice and the two quick-switch slots,
// scoped per character. The active weapon's archetype passive (doubled for the
// specialized archetype) feeds playerHUDStore's derived stats; its movement
// part feeds getWeaponMoveSpeedMult (weaponClassCombatHelpers).
//
// Quick-switch never adds a third equipped weapon (every equipped item adds its
// stats). A quick-slot weapon that is not equipped takes the place of the
// inactive equipped weapon, so the weapon in hand is never the one dropped.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import {
  equipAXEInventoryItem,
  getActiveEquippedAXEWeapon,
  getAXEEquipmentItem,
  getEquippedAXEItemsByCategory,
  setActiveAXEWeapon,
  unequipAXEInventoryItem,
} from '../equipment/AXEEquipmentInventoryStore';
import {
  AXE_QUICK_WEAPON_SLOTS,
  getAXEArchetypePassive,
  inferAXEWeaponArchetype,
  isAXEWeaponArchetype,
} from './AXEWeaponArchetypes';

const storage = characterScopedStorage('axe_weapon_affinity_v1');
const empty = () => ({ specialized: null, quickSlots: Array(AXE_QUICK_WEAPON_SLOTS).fill(null), previousInstanceId: null });

const load = () => {
  try {
    const raw = storage.get();
    if (!raw) return empty();
    const p = JSON.parse(raw);
    const slots = Array.isArray(p.quickSlots) ? p.quickSlots : [];
    return {
      specialized: isAXEWeaponArchetype(p.specialized) ? p.specialized : null,
      quickSlots: Array.from({ length: AXE_QUICK_WEAPON_SLOTS }, (_, i) => (typeof slots[i] === 'string' ? slots[i] : null)),
      previousInstanceId: typeof p.previousInstanceId === 'string' ? p.previousInstanceId : null,
    };
  } catch {
    return empty();
  }
};

let state = load();
const listeners = new Set();

export function getAXEWeaponAffinityState() {
  return { ...state, quickSlots: [...state.quickSlots] };
}

const emit = () => {
  storage.set(JSON.stringify(state));
  const snapshot = getAXEWeaponAffinityState();
  listeners.forEach((fn) => fn(snapshot));
};

subscribeCharacterChange(() => {
  state = load();
  listeners.forEach((fn) => fn(getAXEWeaponAffinityState()));
});

export function subscribeAXEWeaponAffinity(fn) {
  listeners.add(fn);
  fn(getAXEWeaponAffinityState());
  return () => listeners.delete(fn);
}

// One specialization at a time; null clears it.
export function setAXESpecializedArchetype(archetype) {
  if (archetype !== null && !isAXEWeaponArchetype(archetype)) return { ok: false, reason: 'UNKNOWN_ARCHETYPE' };
  if (state.specialized === archetype) return { ok: true, reason: 'UNCHANGED' };
  state = { ...state, specialized: archetype };
  emit();
  return { ok: true };
}

// The passive of the weapon in hand (null archetype when unarmed).
export function getAXEWeaponAffinityProfile() {
  const weapon = getActiveEquippedAXEWeapon();
  return getAXEArchetypePassive(inferAXEWeaponArchetype(weapon), state.specialized);
}

export function getAXEAffinityMoveSpeedMult() {
  return 1 + (getAXEWeaponAffinityProfile().moveSpeedPct || 0);
}

// Assign an owned weapon to quick slot 0 or 1 (null clears). A weapon sits in
// at most one slot.
export function assignAXEQuickWeapon(slot, instanceId) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= AXE_QUICK_WEAPON_SLOTS) return { ok: false, reason: 'INVALID_SLOT' };
  if (instanceId !== null) {
    const item = getAXEEquipmentItem(instanceId);
    if (!item || item.category !== 'weapon') return { ok: false, reason: 'WEAPON_NOT_OWNED' };
  }
  const quickSlots = state.quickSlots.map((id, i) => (i === slot ? instanceId : id === instanceId ? null : id));
  state = { ...state, quickSlots };
  emit();
  return { ok: true };
}

// Shift+1 / Shift+2: draw that slot's weapon at once (no cast time, allowed
// during the global cooldown). Pressing the key of the weapon already in hand
// returns to the weapon held before it.
export function quickSwitchAXEWeapon(slot) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= AXE_QUICK_WEAPON_SLOTS) return { ok: false, reason: 'INVALID_SLOT' };
  let targetId = state.quickSlots[slot];
  if (!targetId) return { ok: false, reason: 'EMPTY_SLOT' };
  if (!getAXEEquipmentItem(targetId)) {
    assignAXEQuickWeapon(slot, null);
    return { ok: false, reason: 'WEAPON_NOT_OWNED' };
  }
  const current = getActiveEquippedAXEWeapon();
  if (current?.instanceId === targetId) {
    const back = state.previousInstanceId;
    if (!back || back === targetId || !getAXEEquipmentItem(back)) return { ok: true, reason: 'ALREADY_ACTIVE', weapon: current };
    targetId = back;
  }
  const target = getAXEEquipmentItem(targetId);
  if (!target.equipped) {
    // make room by dropping an inactive equipped weapon, never the one in hand
    const inactive = getEquippedAXEItemsByCategory('weapon').filter((w) => w.instanceId !== current?.instanceId);
    for (const w of inactive) unequipAXEInventoryItem(w.instanceId);
    const equipped = equipAXEInventoryItem(targetId);
    if (!equipped.ok) {
      for (const w of inactive) equipAXEInventoryItem(w.instanceId); // put things back as they were
      if (current) setActiveAXEWeapon(current.instanceId);
      return equipped;
    }
  }
  const active = setActiveAXEWeapon(targetId);
  if (!active.ok) return active;
  state = { ...state, previousInstanceId: current?.instanceId || null };
  emit();
  const weapon = getActiveEquippedAXEWeapon();
  return { ok: true, weapon, archetype: inferAXEWeaponArchetype(weapon), returned: targetId !== state.quickSlots[slot] };
}
