// ─── Terrain Asset Registry ───────────────────────────────────────────────
// Frozen URL map of the 6 environment assets uploaded by the player on
// 2026-05-19. Pulled directly from the Model3D / ModelFBX entities so the
// streamer doesn't have to query the DB at runtime.
//
// Asset roles:
//   ROCKS       — Stylised Rock Collection (FBX, 4 PBR rock variants)
//   ALTAR_SCENE — "This Tree Is Growing" altar scene (GLB)
//   WATER_SCENE — Low-poly tree + water scene (GLB)
//   TREE_1      — High detail Elm tree collection (GLB)
//   TREE_2      — Realistic trees pack (GLB)
//   GRASS       — Grass FBX with 2 blade textures

export const TERRAIN_ASSETS = {
  ROCKS: {
    id: 'rocks',
    type: 'fbx',
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/ac1bc3f98_Stylised_Rock_Collection.fbx',
    textures: {
      desertBase:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/386b781da_M_Desert_Rock_BaseColour.png',
      mossyBase:   'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/ffb7f4998_M_Mossy_Rock_BaseColour.png',
      plainBase:   'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/817c7c7bc_M_Plain_Rock_BaseColour.png',
      snowyBase:   'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/3f20e8246_M_Snowy_Rock_BaseColour.png',
    },
    scale: 1.0,
    yOffset: 0,
  },

  ALTAR_SCENE: {
    id: 'altar',
    type: 'gltf',
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/c0abe02a2_scene.gltf',
    scale: 1.2,
    yOffset: 0,
  },

  WATER_SCENE: {
    id: 'water',
    type: 'gltf',
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/c7bacd682_scene.gltf',
    scale: 1.5,
    yOffset: 0,
  },

  TREE_1: {
    id: 'tree1',
    type: 'glb',
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/ffc6892b6_high_detail_elm_tree_collection.glb',
    scale: 0.015, // big elm pack — heavily downscale
    yOffset: 0,
  },

  TREE_2: {
    id: 'tree2',
    type: 'glb',
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/8526a0515_more_realistic_trees_free.glb',
    scale: 0.02,
    yOffset: 0,
  },

  GRASS: {
    id: 'grass',
    type: 'fbx',
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/03a674d24_Grass.fbx',
    scale: 0.4,
    yOffset: 0,
  },
};