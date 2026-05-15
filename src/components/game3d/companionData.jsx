// Companion definitions — rideable mounts.
// The wolf_with_animations GLB has embedded idle + walk animation clips,
// so we mark it as a GLB asset and let the loader pick the right anim clip
// by name (case-insensitive substring match on clip name).

export const COMPANION_DEFINITIONS = [
  {
    id: 'shadow_wolf',
    name: 'Shadow Wolf',
    description: 'A swift wolf companion that grants increased movement speed when ridden.',
    rarity: 'rare',
    // Wolf companion — the "wolf companion" Model3D from admin
    // (geometric_stylised_wolf_meshy_6.glb). Embedded idle/walk clips are
    // matched by name substring at runtime.
    modelUrl: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/d2fe3d0ef_geometric_stylised_wolf_meshy_6.glb',
    modelFormat: 'glb', // 'glb' = GLTFLoader + embedded anims; 'fbx' = FBXLoader + separate anim URLs
    // For GLB: substring (case-insensitive) used to find the matching clip inside the file
    walkClipName: 'walk',
    idleClipName: 'idle',
    scale: 1.2,
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