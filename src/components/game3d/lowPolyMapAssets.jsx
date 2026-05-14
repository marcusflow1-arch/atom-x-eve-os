// ─────────────────────────────────────────────
// Low-Poly Environment map assets (scene.gltf bundle).
// Source: Model3D entity "scene.gltf" (admin → 3D Models).
// The GLTF references a sibling scene.bin + textures via relative paths.
// We provide a URLModifier so Three.js fetches them from the Base44 bundle.
// ─────────────────────────────────────────────

export const LOWPOLY_MAP_URL =
  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/a0e6ca7f1_scene.gltf';

// Bundle manifest: maps relative paths (as referenced inside the .gltf)
// to absolute Base44 URLs. Keys include both bare filenames and the
// "low_poly_environment_idea_1/..." folder-prefixed variants the GLTF uses.
export const LOWPOLY_BUNDLE = {
  'scene.bin':
    'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/b0b4f9611_scene.bin',
  'low_poly_environment_idea_1/scene.bin':
    'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/b0b4f9611_scene.bin',
  'textures/rock_base_baseColor.png':
    'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/52a2e4822_rock_base_baseColor.png',
  'low_poly_environment_idea_1/textures/rock_base_baseColor.png':
    'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/52a2e4822_rock_base_baseColor.png',
  'rock_base_baseColor.png':
    'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/52a2e4822_rock_base_baseColor.png',
};

/**
 * Builds a Three.js LoadingManager whose URLModifier rewrites relative GLTF
 * resource paths (e.g. "scene.bin", "textures/foo.png") to the matching
 * Base44 bundle URLs so the GLTFLoader can fetch them.
 */
export const createLowPolyLoadingManager = (THREE) => {
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    // Already an absolute Base44 URL? leave it.
    if (url.startsWith('http')) {
      // Some GLTF parsers resolve relative URLs against the gltf URL, producing
      // e.g. ".../a0e6ca7f1_scene.gltf/scene.bin" — strip and map.
      const tail = url.split('/').slice(-1)[0];
      if (LOWPOLY_BUNDLE[tail]) return LOWPOLY_BUNDLE[tail];
      // Also try last 2 segments (e.g. "textures/foo.png")
      const tail2 = url.split('/').slice(-2).join('/');
      if (LOWPOLY_BUNDLE[tail2]) return LOWPOLY_BUNDLE[tail2];
      return url;
    }
    // Relative path — try direct lookup, then progressively shorter keys.
    if (LOWPOLY_BUNDLE[url]) return LOWPOLY_BUNDLE[url];
    const cleaned = url.replace(/^\.\//, '');
    if (LOWPOLY_BUNDLE[cleaned]) return LOWPOLY_BUNDLE[cleaned];
    const tail = url.split('/').slice(-1)[0];
    if (LOWPOLY_BUNDLE[tail]) return LOWPOLY_BUNDLE[tail];
    return url;
  });
  return manager;
};