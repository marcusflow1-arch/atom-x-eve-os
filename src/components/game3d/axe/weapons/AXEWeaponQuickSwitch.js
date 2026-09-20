import {
  equipAXEInventoryItem,
  getAXEInventoryItemsByCategory,
  getActiveEquippedAXEWeapon,
  setActiveAXEWeapon,
} from '../equipment/AXEEquipmentInventoryStore';
import { resolveAXEWeaponIdentity } from './AXEWeaponIdentity';

export function getOwnedAXEWeapons() {
  return getAXEInventoryItemsByCategory('weapon');
}

export function getCurrentAXEWeapon() {
  return getActiveEquippedAXEWeapon();
}

export function cycleAXEEquippedWeapon(direction = 1) {
  const weapons = getOwnedAXEWeapons();
  if (!weapons.length) return { ok: false, reason: 'NO_WEAPONS_OWNED' };

  const current = getCurrentAXEWeapon();
  const currentIndex = Math.max(
    0,
    weapons.findIndex((item) => item.instanceId === current?.instanceId),
  );
  const step = Number(direction) < 0 ? -1 : 1;
  const nextIndex = (currentIndex + step + weapons.length) % weapons.length;
  const next = weapons[nextIndex];

  const equippedResult = equipAXEInventoryItem(next.instanceId);
  if (!equippedResult.ok) return equippedResult;
  const result = setActiveAXEWeapon(next.instanceId);
  return {
    ...result,
    weapon: next,
    identity: resolveAXEWeaponIdentity(next),
    index: nextIndex,
    total: weapons.length,
  };
}
