// ─── Asset Loader Cache ───────────────────────────────────────────────────
// Loads each terrain asset (FBX / GLTF / GLB) exactly ONCE and caches the
// parsed root object. Subsequent requests return a SkeletonUtils-free
// shallow clone — meshes share their geometry + materials but get fresh
// transforms so they can be placed independently in the scene.
//
// This is what makes re-entering an unloaded chunk feel instant: the file
// has already been parsed, we just clone it.

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TERRAIN_ASSETS } from './terrainAssetRegistry';

const cache = new Map();           // assetKey → parsed root Object3D
const inflight = new Map();        // assetKey → Promise<Object3D>

const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();

function loadOnce(assetKey) {
  if (cache.has(assetKey)) return Promise.resolve(cache.get(assetKey));
  if (inflight.has(assetKey)) return inflight.get(assetKey);

  const def = TERRAIN_ASSETS[assetKey];
  if (!def) return Promise.reject(new Error(`Unknown terrain asset: ${assetKey}`));

  const promise = new Promise((resolve, reject) => {
    const onDone = (obj) => {
      // Tag every mesh so the streamer can find them later if needed.
      obj.traverse((n) => {
        if (n.isMesh) {
          n.castShadow = false;            // props don't cast shadows (perf)
          n.receiveShadow = true;
          n.userData.__terrainAsset = assetKey;
        }
      });
      cache.set(assetKey, obj);
      inflight.delete(assetKey);
      resolve(obj);
    };
    const onErr = (e) => { inflight.delete(assetKey); reject(e); };

    if (def.type === 'fbx') {
      fbxLoader.load(def.url, onDone, undefined, onErr);
    } else {
      gltfLoader.load(def.url, (gltf) => onDone(gltf.scene || gltf.scenes?.[0]), undefined, onErr);
    }
  });
  inflight.set(assetKey, promise);
  return promise;
}

/**
 * Return a fresh clone of the asset ready to be added to the scene.
 * Geometry + materials are shared with the cache (cheap clone).
 */
export async function instantiate(assetKey) {
  const root = await loadOnce(assetKey);
  const clone = root.clone(true);
  const def = TERRAIN_ASSETS[assetKey];
  clone.scale.setScalar(def.scale || 1);
  return clone;
}

/** Preload a batch of assets — fire & forget. */
export function preload(assetKeys) {
  assetKeys.forEach((k) => loadOnce(k).catch(() => {}));
}