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
  getActiveEquippedAXEWeapon,
  getAXEEquipmentItem,
  getPreviousAXEWeaponInstanceId,
  switchAXEInventoryWeapon,
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
  return { ...state, quickSlots: [...state.quickSlots], previousInstanceId: getPreviousAXEWeaponInstanceId() === undefined ? state.previousInstanceId : getPreviousAXEWeaponInstanceId() };
}

const publish = () => listeners.forEach(fn => fn(getAXEWeaponAffinityState()));
const commit = (next) => {
  if (!storage.setChecked(JSON.stringify(next))) {
    return { ok: false, reason: 'SAVE_FAILED', message: 'Could not save weapon preferences. Your selection is unchanged. Free device storage and retry.' };
  }
  state = next;
  publish();
  return { ok: true };
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
  return commit({ ...state, specialized: archetype });
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
  return commit({ ...state, quickSlots });
}

// Shift+1 / Shift+2: draw that slot's weapon at once (no cast time, allowed
// during the global cooldown). Pressing the key of the weapon already in hand
// returns to the weapon held before it.
export function quickSwitchAXEWeapon(slot, context = {}) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= AXE_QUICK_WEAPON_SLOTS) return { ok: false, reason: 'INVALID_SLOT' };
  let targetId = state.quickSlots[slot];
  if (!targetId) return { ok: false, reason: 'EMPTY_SLOT' };
  if (!getAXEEquipmentItem(targetId)) {
    const cleared = assignAXEQuickWeapon(slot, null);
    return cleared.ok ? { ok: false, reason: 'WEAPON_NOT_OWNED' } : cleared;
  }
  const current = getActiveEquippedAXEWeapon();
  if (current?.instanceId === targetId) {
    const back = getAXEWeaponAffinityState().previousInstanceId;
    if (!back || back === targetId || !getAXEEquipmentItem(back)) return { ok: true, reason: 'ALREADY_ACTIVE', weapon: current, archetype: inferAXEWeaponArchetype(current) };
    targetId = back;
  }
  const result = switchAXEInventoryWeapon(targetId, context);
  if (!result.ok) return result;
  // History was saved together with the inventory, so this notification needs
  // no second localStorage write and cannot leave a half-saved switch.
  publish();
  const weapon = result.item;
  return { ok: true, weapon, archetype: inferAXEWeaponArchetype(weapon), returned: targetId !== state.quickSlots[slot] };
}
