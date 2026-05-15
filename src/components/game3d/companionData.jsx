// Companion definitions — rideable mounts.
// Each companion is a Mixamo-compatible character used as a "horse-like" mount.
// We reuse the creature model URLs already in the codebase so no new asset upload is needed.

import { CREATURE_MODEL_URL, CREATURE_ANIMATION_URLS } from './creatureAssets';

export const COMPANION_DEFINITIONS = [
  {
    id: 'shadow_steed',
    name: 'Shadow Steed',
    description: 'A swift mount that grants increased movement speed when ridden.',
    rarity: 'rare',
    modelUrl: CREATURE_MODEL_URL,
    walkAnim: CREATURE_ANIMATION_URLS.walk,
    idleAnim: CREATURE_ANIMATION_URLS.idle,
    scale: 1.0,
    speedMultiplier: 1.8, // 80% faster while mounted
    spawnPos: [4, 0.3, -3],
    color: 0x4a5568,
    // Gear slots specific to companions
    gearSlots: ['saddle', 'armor', 'charm'],
  },
];

// Companion gear catalog — simple flat list, equipped state stored in companionStore.
export const COMPANION_GEAR = {
  saddle: [
    { id: 'leather_saddle',  name: 'Leather Saddle',  rarity: 'common',   speedBonus: 0.0,  description: 'A sturdy leather saddle.' },
    { id: 'racing_saddle',   name: 'Racing Saddle',   rarity: 'rare',     speedBonus: 0.15, description: 'Lightweight saddle for speed.' },
    { id: 'royal_saddle',    name: 'Royal Saddle',    rarity: 'epic',     speedBonus: 0.25, description: 'Embroidered with gold thread.' },
  ],
  armor: [
    { id: 'cloth_barding',   name: 'Cloth Barding',   rarity: 'common',   defense: 5,  description: 'Basic protection.' },
    { id: 'iron_barding',    name: 'Iron Barding',    rarity: 'rare',     defense: 15, description: 'Heavy iron plates.' },
  ],
  charm: [
    { id: 'lucky_horseshoe', name: 'Lucky Horseshoe', rarity: 'rare',     description: 'Brings good fortune.' },
    { id: 'wind_amulet',     name: 'Wind Amulet',     rarity: 'epic',     speedBonus: 0.10, description: 'Whispers of the wind.' },
  ],
};

export const getCompanionById = (id) =>
  COMPANION_DEFINITIONS.find((c) => c.id === id) || null;