// ─── Asset Loader Cache ───────────────────────────────────────────────────
// Loads each terrain asset (FBX / GLTF / GLB) once and returns clones for
// every placement. Auto-fits to TARGET_HEIGHT via AABB normalization — no
// more guess scalars.

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TERRAIN_ASSETS } from './terrainAssetRegistry';

const cache = new Map();
const inflight = new Map();

const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();

function loadOnce(assetKey) {
  if (cache.has(assetKey)) return Promise.resolve(cache.get(assetKey));
  if (inflight.has(assetKey)) return inflight.get(assetKey);

  const def = TERRAIN_ASSETS[assetKey];
  if (!def) return Promise.reject(new Error(`Unknown terrain asset: ${assetKey}`));

  const p = new Promise((resolve, reject) => {
    const done = (root) => {
      // AABB-normalize: compute current height, derive scale to hit targetHeight.
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const currentHeight = size.y || Math.max(size.x, size.z) || 1;
      const fitScale = (def.targetHeight || 1) / currentHeight;
      root.userData.__fitScale = fitScale;

      root.traverse((n) => {
        if (n.isMesh) {
          n.castShadow = false;
          n.receiveShadow = true;
        }
      });
      cache.set(assetKey, root);
      inflight.delete(assetKey);
      resolve(root);
    };
    const err = (e) => { inflight.delete(assetKey); reject(e); };

    if (def.type === 'fbx') fbxLoader.load(def.url, done, undefined, err);
    else gltfLoader.load(def.url, (g) => done(g.scene || g.scenes?.[0]), undefined, err);
  });
  inflight.set(assetKey, p);
  return p;
}

/** Clone the asset, pre-scaled to its target world height. */
export async function instantiate(assetKey) {
  const root = await loadOnce(assetKey);
  const clone = root.clone(true);
  const fit = root.userData.__fitScale || 1;
  clone.scale.setScalar(fit);
  return clone;
}

export function preload(assetKeys) {
  assetKeys.forEach((k) => loadOnce(k).catch(() => {}));
}