// ─────────────────────────────────────────────
// Volcano Island Low Poly map assets.
// Source: Model3D entity "Volcano island lowpoly.fbx" (admin → 3D Models).
// The FBX references material/texture names like "Island_Grass", "Volcano_Base", etc.
// We provide a lookup so the loader can swap those references for real texture
// URLs at runtime (FBXLoader won't auto-resolve them from the bundle).
// ─────────────────────────────────────────────

export const VOLCANO_MAP_URL =
  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/5c49974d7_Volcanoislandlowpoly.fbx';

// Map of texture basename (lowercase, no extension) → image URL.
// FBX materials may carry the name, or their bound map.image may reference these
// names. We match against material name AND any existing map.name / source path.
export const VOLCANO_TEXTURES = {
  clouds:         'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/691b44f5a_Clouds.png',
  hammock:        'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/1820acd4c_hammock.png',
  island_grass:   'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/4cfd32737_Island_Grass.png',
  lava_bubble:    'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/2842c69ef_Lava_bubble.png',
  ocean:          'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/870378d53_Ocean.png',
  palm_tree_1:    'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/47a1953d8_Palm_tree_1.png',
  palm_tree_2:    'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/bec99e3bf_Palm_tree_2.png',
  pyramid:        'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/5d6176e8e_Pyramid.png',
  shrubbery:      'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/e58c0a4f1_shrubbery.png',
  skeleton:       'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/94192f44d_Skeleton.png',
  tequila_bottle: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/82a5a2967_Tequila_Bottle.png',
  volacano_sand:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/2d76cc15f_Volacano_Sand.png',
  volcano_sand:   'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/2d76cc15f_Volacano_Sand.png',
  volcanic_lava:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/9094f0c60_Volcanic_lava.png',
  volcano_base:   'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/c6e3cb923_Volcano_Base.png',
  volcano_grass:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/1dd06213a_Volcano_Grass.png',
};

/**
 * Build a Three.js Texture lookup keyed by basename. Caller can pick the right
 * texture by inspecting material.name / existing map.name.
 */
export const loadVolcanoTextureMap = (THREE) => {
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';
  const out = {};
  Object.entries(VOLCANO_TEXTURES).forEach(([key, url]) => {
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.flipY = false; // FBX-style UVs
    out[key] = tex;
  });
  return out;
};

/**
 * Try to match a material's name / existing texture-source name against the
 * texture lookup. Returns the matched Texture or null.
 */
export const matchVolcanoTexture = (material, textureMap) => {
  const candidates = [];
  if (material?.name) candidates.push(material.name);
  if (material?.map?.name) candidates.push(material.map.name);
  if (material?.map?.image?.src) candidates.push(material.map.image.src);

  const normalize = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, '')
      .replace(/[^a-z0-9]+/g, '_');

  for (const cand of candidates) {
    const key = normalize(cand);
    if (textureMap[key]) return textureMap[key];
    // Try partial match (e.g. "volcano_base_mat" → "volcano_base")
    const partial = Object.keys(textureMap).find((k) => key.includes(k));
    if (partial) return textureMap[partial];
  }
  return null;
};