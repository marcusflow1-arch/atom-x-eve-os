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
//   GRASS       — Latest uploaded Grass FBX with blade textures
//   SPHERE      — Latest uploaded Sphere/Rock texture package for future road material

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
    // Normal ground-rock size: roughly a small fraction of player height.
    scale: 0.035,
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
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/3ba425676_FInal.fbx',
    textures: {
      plate1: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/462f6f613_Plate1.png',
      plate2: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/689121b41_Plate2.png',
      plate3: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/e17318434_Plate3.png',
      topSeamless: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/ad6043139_TopSeamless.png',
    },
    scale: 0.4,
    yOffset: 0,
  },

  SPHERE: {
    id: 'sphere-road',
    type: 'fbx',
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/cdccde138_Sphere.fbx',
    textures: {
      baseColor: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/f65c146a2_Rock01_basecolor.png',
      normal: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/44fc3d576_Rock01_normal.png',
      roughness: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/558285ce2_Rock01_roughness.png',
      height: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/f223a1c92_Rock01_height.png',
      ao: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/089d1f373_Rock01_ambientocclusion.png',
    },
    scale: 1,
    yOffset: 0,
  },
};