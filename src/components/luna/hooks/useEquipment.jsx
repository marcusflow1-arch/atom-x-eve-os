import { useState, useEffect } from 'react';

/**
 * Hook for managing equipment state and global state bridge
 * @returns {Object} Equipment state and handlers
 */
export function useEquipment() {
  const [equippedItems, setEquippedItems] = useState({});
  const [weaponModelUrl, setWeaponModelUrl] = useState(null);

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

    // Initialize global state bridge
    if (!window.LUNA_STATE) window.LUNA_STATE = {};

    // Update global state for weapon equips
    if (slotId.startsWith('weapon-') && item.name === 'Blade of Abyss') {
      window.LUNA_STATE.equippedWeapon = "sword_of_the_abyss";
    } else if (slotId.startsWith('weapon-')) {
      window.LUNA_STATE.equippedWeapon = null;
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
      if (window.LUNA_STATE) {
        window.LUNA_STATE.equippedWeapon = null;
      }
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