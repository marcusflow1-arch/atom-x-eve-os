import { useEffect } from 'react';
import { activateAXEMasteryTransition } from './AXEWeaponAffinityStore';
import {
  getActiveEquippedAXEWeapon,
  subscribeAXEEquipmentInventory,
} from '../equipment/AXEEquipmentInventoryStore';
import { resolveAXEWeaponIdentity } from './AXEWeaponIdentity';
import {
  getMasteryState,
  setActiveWeapon,
} from '../../progression/weaponMasteryStore';
import {
  getActiveAXEWeaponRole,
  setActiveAXEWeaponRole,
} from '../../weaponClassBuffStore';

let currentIdentity = resolveAXEWeaponIdentity(null);
const listeners = new Set();

export function getActiveAXEWeaponIdentity() {
  return { ...currentIdentity };
}

export function subscribeAXEWeaponIdentity(fn) {
  listeners.add(fn);
  fn(getActiveAXEWeaponIdentity());
  return () => listeners.delete(fn);
}

function syncFromEquipment() {
  const equipped = getActiveEquippedAXEWeapon();
  const next = resolveAXEWeaponIdentity(equipped);

  currentIdentity = next;

  if (next.masteryWeaponId) {
    const mastery = getMasteryState();
    if (mastery.activeWeaponId !== next.masteryWeaponId) {
      setActiveWeapon(next.masteryWeaponId);
    }
  }

  if (next.role && getActiveAXEWeaponRole() !== next.role) {
    setActiveAXEWeaponRole(next.role);
  }

  const snapshot = getActiveAXEWeaponIdentity();
  listeners.forEach((fn) => fn(snapshot));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeActiveWeaponIdentityChanged', {
      detail: snapshot,
    }));
  }
}

export function bindAXEWeaponIdentity() {
  // subscribeAXEEquipmentInventory already delivers the initial snapshot.
  return subscribeAXEEquipmentInventory(syncFromEquipment);
}

export default function AXEWeaponIdentityMount() {
  useEffect(() => {
    const unbind = bindAXEWeaponIdentity();
    const onTransition = (event) => activateAXEMasteryTransition(event.detail);
    window.addEventListener('axeMasteryWeaponTransition', onTransition);
    return () => { window.removeEventListener('axeMasteryWeaponTransition', onTransition); unbind(); };
  }, []);

  return null;
}
