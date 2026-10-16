import {
  getAXEInventoryItemsByCategory,
  getActiveEquippedAXEWeapon,
  switchAXEInventoryWeapon,
} from '../equipment/AXEEquipmentInventoryStore';
import { resolveAXEWeaponIdentity } from './AXEWeaponIdentity';

export function getOwnedAXEWeapons() {
  return getAXEInventoryItemsByCategory('weapon');
}

export function getCurrentAXEWeapon() {
  return getActiveEquippedAXEWeapon();
}

export function cycleAXEEquippedWeapon(direction = 1, context = {}) {
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

  const result = switchAXEInventoryWeapon(next.instanceId, context);
  if (!result.ok) return result;
  return {
    ...result,
    weapon: next,
    identity: resolveAXEWeaponIdentity(next),
    index: nextIndex,
    total: weapons.length,
  };
}
