// Mock inventory data — each gear category has its own list of items.
// Items live in their own per-category slots (no shared bag), matching
// the Where Winds Meet inventory style.

import { Swords, Shield, Shirt, HardHat, Footprints, Hand, Gem, Sparkles } from 'lucide-react';

export const CATEGORY_ICONS = {
  weapon: Swords,
  helm: HardHat,
  chest: Shirt,
  gloves: Hand,
  legs: Shield,
  boots: Footprints,
  accessory: Gem,
  trinket: Sparkles,
};

// Per-category item pools. `equippedSlot` marks which equipped slot it occupies
// (null = in storage). All info content is generic/placeholder.
export const INVENTORY = {
  weapon: [
    { id: 'wp_truesword',  name: 'True Heart — Sword', type: 'Weapon — Sword',  mastery: 7, tier: 1, atk: '2-3', durability: '99/100', level: 1, equipped: true,  locked: false },
    { id: 'wp_dagger',     name: 'Whisper Dagger',     type: 'Weapon — Dagger', mastery: 3, tier: 1, atk: '1-2', durability: '88/100', level: 1, equipped: false, locked: false },
    { id: 'wp_fan',        name: 'Painted Fan',        type: 'Weapon — Fan',    mastery: 2, tier: 1, atk: '1-2', durability: '92/100', level: 1, equipped: false, locked: false },
  ],
  helm: [
    { id: 'hl_hood',  name: "Wanderer's Hood", type: 'Helm', mastery: 1, tier: 1, atk: '—', durability: '70/100', level: 1, equipped: true, locked: false },
  ],
  chest: [
    { id: 'ch_robe', name: 'Linen Robe', type: 'Chest', mastery: 1, tier: 1, atk: '—', durability: '95/100', level: 1, equipped: true, locked: false },
  ],
  gloves: [
    { id: 'gl_wraps', name: 'Cloth Wraps', type: 'Gloves', mastery: 1, tier: 1, atk: '—', durability: '80/100', level: 1, equipped: true, locked: false },
  ],
  legs: [
    { id: 'lg_pants', name: 'Travel Pants', type: 'Legs', mastery: 1, tier: 1, atk: '—', durability: '78/100', level: 1, equipped: true, locked: false },
  ],
  boots: [
    { id: 'bt_boots', name: 'Soft Boots', type: 'Boots', mastery: 1, tier: 1, atk: '—', durability: '82/100', level: 1, equipped: true, locked: false },
  ],
  accessory: [
    { id: 'ac_ring1', name: 'Brass Ring',    type: 'Ring',    mastery: 1, tier: 1, atk: '—', durability: '100/100', level: 1, equipped: true,  locked: false },
    { id: 'ac_ring2', name: 'Silver Ring',   type: 'Ring',    mastery: 2, tier: 1, atk: '—', durability: '100/100', level: 1, equipped: false, locked: false },
    { id: 'ac_neck',  name: 'Jade Necklace', type: 'Neck',    mastery: 1, tier: 1, atk: '—', durability: '100/100', level: 1, equipped: false, locked: false },
  ],
  trinket: [
    { id: 'tr_coin', name: 'Lucky Coin', type: 'Trinket', mastery: 1, tier: 1, atk: '—', durability: '—', level: 1, equipped: true, locked: false },
  ],
};

export const getEquippedItem = (categoryId) =>
  (INVENTORY[categoryId] || []).find((it) => it.equipped) || null;