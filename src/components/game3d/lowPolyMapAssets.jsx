// ─────────────────────────────────────────────
// Simple procedural environment — flat ground + fake low-poly trees.
//
// Replaces the previous Base44-hosted scene.gltf bundle with an inline
// procedural map. Keeps the SAME public API so GameWorld3D.jsx is unchanged:
//
//   - LOWPOLY_MAP_URL                 → sentinel URL (loader ignores it)
//   - createLowPolyLoadingManager()   → THREE.LoadingManager (no-op rewrites)
//
// The procedural map is built via a tiny shim around GLTFLoader.load(): the
// loader intercepts the sentinel URL and calls onLoad with a synthetic
// { scene } object containing the procedural meshes. GameWorld3D treats it
// exactly like a loaded GLTF (auto-scale, ground raycast, etc.).
// ─────────────────────────────────────────────

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Sentinel URL — never fetched. The patched loader recognizes this and
// builds the procedural scene instead.
export const LOWPOLY_MAP_URL = 'procedural://simple-tree-environment';

/**
 * Build the procedural environment as a single THREE.Group.
 *
 * The previous version generated a flat green ground + 40 low-poly trees.
 * It has been intentionally stripped to an empty group so the game world
 * renders no built-in environment — the world surface is now provided
 * entirely by TerrainArea (flat ground + SandboxScene placements).
 *
 * NOTE: A tiny invisible ground plane is kept ONLY as a raycast target so
 * GameWorld3D's spawn / ground-pick logic still has a hit surface. It is
 * fully transparent and casts no shadow, so it is not visible to players.
 */
function buildProceduralMap() {
  const root = new THREE.Group();
  root.name = 'ProceduralLowPolyMap';

  // Invisible raycast ground — required by GameWorld3D's ground picker.
  const groundGeo = new THREE.PlaneGeometry(140, 140);
  const groundMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.name = 'ground';
  ground.userData.isGround = true;
  ground.visible = false;
  root.add(ground);

  return root;
}

/**
 * Returns a THREE.LoadingManager that recognizes the sentinel URL and
 * short-circuits the load to build the procedural scene synchronously.
 *
 * Implementation note: we cannot intercept GLTFLoader.load() from a
 * LoadingManager alone, so we monkey-patch GLTFLoader.prototype.load on
 * first call. The patch is idempotent and only triggers for our sentinel.
 */
export const createLowPolyLoadingManager = (THREE_ref) => {
  patchGLTFLoaderForProcedural(THREE_ref || THREE);
  // Plain LoadingManager — no URL rewrites needed since nothing is fetched.
  return new (THREE_ref || THREE).LoadingManager();
};

let _patched = false;
function patchGLTFLoaderForProcedural(THREE_ref) {
  if (_patched) return;
  _patched = true;
  const originalLoad = GLTFLoader.prototype.load;
  GLTFLoader.prototype.load = function (url, onLoad, onProgress, onError) {
    if (url === LOWPOLY_MAP_URL) {
      // Build synchronously, then dispatch to onLoad on the next microtask
      // so callers that rely on async semantics still work correctly.
      Promise.resolve().then(() => {
        try {
          const scene = buildProceduralMap();
          onLoad && onLoad({ scene, scenes: [scene], animations: [] });
        } catch (err) {
          onError && onError(err);
        }
      });
      return;
    }
    return originalLoad.call(this, url, onLoad, onProgress, onError);
  };
}