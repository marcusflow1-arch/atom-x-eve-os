// ─── Asset Loader Cache ───────────────────────────────────────────────────
// Loads each terrain asset (FBX / GLTF / GLB) once and returns clones for
// every placement. Auto-fits to TARGET_HEIGHT via AABB normalization — no
// more guess scalars.

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TERRAIN_ASSETS } from './terrainAssetRegistry';
import { base44 } from '@/api/base44Client';

const cache = new Map();
const inflight = new Map();
// Dynamic registry for user-uploaded Model3D assets, keyed by `model3d:<id>`.
// Populated lazily by resolveDynamicDef() on first use.
const dynamicDefs = new Map();

const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();

async function resolveDynamicDef(assetKey) {
  if (dynamicDefs.has(assetKey)) return dynamicDefs.get(assetKey);
  if (!assetKey.startsWith('model3d:')) return null;
  const id = assetKey.slice('model3d:'.length);
  const model = await base44.entities.Model3D.get(id);
  if (!model?.file_url) throw new Error(`Model3D ${id} has no file_url`);
  const type = (model.file_type || '').toLowerCase();
  const def = {
    id: assetKey,
    type: type === 'fbx' ? 'fbx' : 'gltf', // glb is loaded by GLTFLoader
    url: model.file_url,
    targetHeight: 2.5, // sensible default; user can scale via inspector
  };
  dynamicDefs.set(assetKey, def);
  return def;
}

function loadOnce(assetKey) {
  if (cache.has(assetKey)) return Promise.resolve(cache.get(assetKey));
  if (inflight.has(assetKey)) return inflight.get(assetKey);

  const builtIn = TERRAIN_ASSETS[assetKey];
  const defPromise = builtIn ? Promise.resolve(builtIn) : resolveDynamicDef(assetKey);

  const p = defPromise.then((def) => new Promise((resolve, reject) => {
    if (!def) { reject(new Error(`Unknown terrain asset: ${assetKey}`)); return; }
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
  }));
  p.catch(() => { inflight.delete(assetKey); });
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

/**
 * Get the cached source object (NOT a clone) with its fit scale applied
 * to the root. Used by the instanced-props builder so we can read the
 * sub-mesh geometries directly instead of cloning per-instance.
 */
export async function getSource(assetKey) {
  const root = await loadOnce(assetKey);
  const fit = root.userData.__fitScale || 1;
  root.scale.setScalar(fit);
  root.updateMatrixWorld(true);
  return root;
}

export function preload(assetKeys) {
  assetKeys.forEach((k) => loadOnce(k).catch(() => {}));
}