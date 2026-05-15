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
 * - Flat green ground (140×140)
 * - ~40 trees scattered, avoiding the central spawn area
 */
function buildProceduralMap() {
  const root = new THREE.Group();
  root.name = 'ProceduralLowPolyMap';

  // Ground
  const groundGeo = new THREE.PlaneGeometry(140, 140);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x6b9e4a,
    roughness: 0.95,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = 'ground';
  ground.userData.isGround = true; // GameWorld3D uses this to pick raycast targets
  root.add(ground);

  // Shared tree materials (cheap — one allocation, all trees reuse)
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5a3a1f,
    roughness: 0.9,
  });
  const leafMatA = new THREE.MeshStandardMaterial({
    color: 0x2d6a3f,
    roughness: 0.85,
  });
  const leafMatB = new THREE.MeshStandardMaterial({
    color: 0x3a8a4f,
    roughness: 0.85,
  });

  // Tree scatter — deterministic via a simple LCG so the layout is stable
  // across reloads (helpful for multiplayer parity later).
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  const TREE_COUNT = 40;
  const MAP_HALF = 65;          // keep trees inside the 140 ground (with margin)
  const SPAWN_CLEAR_RADIUS = 6; // don't block player spawn at origin

  for (let i = 0; i < TREE_COUNT; i++) {
    // Reject samples too close to origin
    let x, z;
    let tries = 0;
    do {
      x = (rand() * 2 - 1) * MAP_HALF;
      z = (rand() * 2 - 1) * MAP_HALF;
      tries++;
    } while (Math.sqrt(x * x + z * z) < SPAWN_CLEAR_RADIUS && tries < 10);

    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.rotation.y = rand() * Math.PI * 2;
    const scale = 0.8 + rand() * 0.9;
    tree.scale.setScalar(scale);

    // Trunk — short cylinder
    const trunkH = 1.4;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, trunkH, 6),
      trunkMat,
    );
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Foliage — 1–2 stacked cones for a low-poly look
    const leafMat = rand() < 0.5 ? leafMatA : leafMatB;
    const cone1 = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 1.6, 6),
      leafMat,
    );
    cone1.position.y = trunkH + 0.6;
    cone1.castShadow = true;
    tree.add(cone1);

    if (rand() < 0.65) {
      const cone2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 1.2, 6),
        leafMat,
      );
      cone2.position.y = trunkH + 1.4;
      cone2.castShadow = true;
      tree.add(cone2);
    }

    root.add(tree);
  }

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