// Companion definitions — rideable mounts.
// Active companion is the admin Model3D entity "companion" (baby_wolf bundle).
// The bundle is a glTF + scene.bin + texture, so we provide a bundle manifest
// keyed by the relative paths the .gltf references — the loader uses a
// LoadingManager URL modifier to resolve those to absolute Base44 URLs.

// Resolved Base44 URLs for every file in the baby_wolf bundle.
const BABY_WOLF_GLTF =
  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/5c34f2f05_scene.gltf';
const BABY_WOLF_BIN =
  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/60d93e9c0_scene.bin';
const BABY_WOLF_TEX =
  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/75a75efbb_Material_35_baseColor.png';

// Manifest — covers every variant of the relative paths a GLTF parser
// might resolve (bare filename, folder-prefixed, encoded spaces, etc.).
const BABY_WOLF_BUNDLE = {
  'scene.bin': BABY_WOLF_BIN,
  'baby_wolf (1)/scene.bin': BABY_WOLF_BIN,
  'baby_wolf%20(1)/scene.bin': BABY_WOLF_BIN,
  'Material_35_baseColor.png': BABY_WOLF_TEX,
  'textures/Material_35_baseColor.png': BABY_WOLF_TEX,
  'baby_wolf (1)/textures/Material_35_baseColor.png': BABY_WOLF_TEX,
  'baby_wolf%20(1)/textures/Material_35_baseColor.png': BABY_WOLF_TEX,
};

export const COMPANION_DEFINITIONS = [
  {
    id: 'shadow_wolf',
    name: 'Baby Wolf',
    description: 'A nimble baby wolf companion that grants increased movement speed when ridden.',
    rarity: 'rare',
    // Admin Model3D entity "companion" — baby_wolf glTF bundle.
    modelUrl: BABY_WOLF_GLTF,
    modelFormat: 'glb', // GLTFLoader handles both .gltf and .glb
    bundleManifest: BABY_WOLF_BUNDLE,
    // Embedded clip name hints (case-insensitive substring match).
    walkClipName: 'walk',
    idleClipName: 'idle',
    runClipName: 'run',
    // Fallback if the gltf has no embedded clips — pulls idle/walk from
    // the admin AnimationFBX library (folder = "companion").
    externalAnimUrl: null,
    scale: 0.91,
    speedMultiplier: 1.8, // 80% faster while mounted
    spawnPos: [4, 0.3, -3],
    color: 0x9ca3af,
    // Gear slots specific to companions
    gearSlots: ['saddle', 'armor', 'charm'],
  },
];

// Companion gear catalog — simple flat list, equipped state stored in companionStore.
// `icon` is a lucide-react icon name (rendered via COMPANION_ITEM_ICONS map in the UI).
export const COMPANION_GEAR = {
  saddle: [
    { id: 'leather_saddle',  name: 'Leather Saddle',  rarity: 'common',   icon: 'Anchor',    speedBonus: 0.0,  description: 'A sturdy leather saddle.' },
    { id: 'racing_saddle',   name: 'Racing Saddle',   rarity: 'rare',     icon: 'Zap',       speedBonus: 0.15, description: 'Lightweight saddle for speed.' },
    { id: 'royal_saddle',    name: 'Royal Saddle',    rarity: 'epic',     icon: 'Crown',     speedBonus: 0.25, description: 'Embroidered with gold thread.' },
  ],
  armor: [
    { id: 'cloth_barding',   name: 'Cloth Barding',   rarity: 'common',   icon: 'Shirt',     defense: 5,  description: 'Basic protection.' },
    { id: 'iron_barding',    name: 'Iron Barding',    rarity: 'rare',     icon: 'Shield',    defense: 15, description: 'Heavy iron plates.' },
  ],
  charm: [
    { id: 'lucky_horseshoe', name: 'Lucky Horseshoe', rarity: 'rare',     icon: 'Clover',    description: 'Brings good fortune.' },
    { id: 'wind_amulet',     name: 'Wind Amulet',     rarity: 'epic',     icon: 'Wind',      speedBonus: 0.10, description: 'Whispers of the wind.' },
  ],
};

export const getCompanionById = (id) =>
  COMPANION_DEFINITIONS.find((c) => c.id === id) || null;

/**
 * Builds a Three.js LoadingManager that rewrites relative GLTF resource
 * paths (e.g. "scene.bin", "textures/foo.png") to the absolute Base44 URLs
 * defined in the companion's bundleManifest. Required because the .gltf
 * file references its sibling files by relative path, but each file is
 * hosted at a different Base44 URL.
 *
 * Returns null when the companion has no bundle (e.g. a single-file .glb).
 */
export const createCompanionLoadingManager = (THREE, companionDef) => {
  if (!companionDef?.bundleManifest) return null;
  const bundle = companionDef.bundleManifest;
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    if (url.startsWith('http')) {
      const tail = url.split('/').slice(-1)[0];
      if (bundle[tail]) return bundle[tail];
      const tail2 = url.split('/').slice(-2).join('/');
      if (bundle[tail2]) return bundle[tail2];
      return url;
    }
    if (bundle[url]) return bundle[url];
    const cleaned = url.replace(/^\.\//, '');
    if (bundle[cleaned]) return bundle[cleaned];
    const tail = url.split('/').slice(-1)[0];
    if (bundle[tail]) return bundle[tail];
    return url;
  });
  return manager;
};