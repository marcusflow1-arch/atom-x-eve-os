// ─── Terrain Asset Registry ───────────────────────────────────────────────
// Frozen URL map of the environment assets used by the isolated forest area.
// Each asset uses TARGET HEIGHT (world units) instead of a guess scalar —
// the loader auto-fits via AABB normalization so things never come in giant
// or microscopic.
//
// TREE_1 (elm collection) was removed at the player's request.

export const TERRAIN_ASSETS = {
  ROCKS: {
    id: 'rocks',
    type: 'fbx',
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/ac1bc3f98_Stylised_Rock_Collection.fbx',
    targetHeight: 1.6,
  },

  ALTAR_SCENE: {
    id: 'altar',
    type: 'gltf',
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/c0abe02a2_scene.gltf',
    targetHeight: 4.5,
  },

  WATER_SCENE: {
    id: 'water',
    type: 'gltf',
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/c7bacd682_scene.gltf',
    targetHeight: 3.0,
  },

  TREE_2: {
    id: 'tree2',
    type: 'glb',
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/8526a0515_more_realistic_trees_free.glb',
    targetHeight: 6.0,
  },

  GRASS: {
    id: 'grass',
    type: 'fbx',
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/03a674d24_Grass.fbx',
    targetHeight: 0.35,
  },
};