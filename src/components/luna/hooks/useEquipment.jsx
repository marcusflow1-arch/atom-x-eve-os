import { useState } from 'react';
import useLunaStore from '../useLunaStore';

/**
 * Hook for managing equipment state with Zustand store integration
 * @returns {Object} Equipment state and handlers
 */
export function useEquipment() {
  const [equippedItems, setEquippedItems] = useState({});
  const [weaponModelUrl, setWeaponModelUrl] = useState(null);
  const { setWeapon, setEquippedWeapon } = useLunaStore();

  /**
   * Equip an item to a slot
   * @param {string} slotId - Slot identifier (e.g., 'weapon-1', 'armor-5')
   * @param {Object} item - Item to equip
   */
  const equipItem = (slotId, item) => {
    setEquippedItems((prev) => ({
      ...prev,
      [slotId]: item
    }));

    // Update Zustand store for weapon equips
    if (slotId.startsWith('weapon-') && item.name === 'Blade of Abyss') {
      setWeapon("sword_of_the_abyss");
      setEquippedWeapon("sword_of_the_abyss");
    } else if (slotId.startsWith('weapon-')) {
      setWeapon(null);
      setEquippedWeapon(null);
    }
  };

  /**
   * Unequip an item from a slot
   * @param {string} slotId - Slot identifier
   */
  const unequipItem = (slotId) => {
    setEquippedItems((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });

    if (slotId.startsWith('weapon-')) {
      setWeapon(null);
      setEquippedWeapon(null);
    }
  };

  return {
    equippedItems,
    weaponModelUrl,
    setWeaponModelUrl,
    equipItem,
    unequipItem
  };
}