// ─── MapBuilderLoader ────────────────────────────────────────────────
// Loads 3D assets for the MapBuilder viewport. Handles:
//   • Built-in TERRAIN_ASSETS via shared cache
//   • Model3D entries (GLB/GLTF/FBX) by fetching file_url
//   • ModelFBX entries (always FBX) by fetching file_url
// Each instantiate() returns a fresh THREE.Object3D scaled to ~1.7 units
// tall so all assets land at a usable starting size.

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { instantiate as instantiateBuiltin } from '@/components/game3d/terrain/assetLoaderCache';
import { base44 } from '@/api/base44Client';

const cache = new Map(); // assetKey -> THREE.Object3D (template to clone)

function autoFit(obj, targetHeight = 1.7) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const max = Math.max(size.x, size.y, size.z);
  if (max > 0) obj.scale.setScalar(targetHeight / max);
  obj.traverse((n) => {
    if (n.isMesh) {
      n.castShadow = !n.isSkinnedMesh;
      n.receiveShadow = true;
    }
  });
  return obj;
}

async function loadFromUrl(url, fileType) {
  const ext = (fileType || url.split('.').pop() || '').toLowerCase();
  if (ext === 'fbx') {
    const loader = new FBXLoader();
    return new Promise((resolve, reject) => {
      loader.load(url, (fbx) => resolve(fbx), undefined, reject);
    });
  }
  // GLB / GLTF
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf.scene || gltf.scenes?.[0]), undefined, reject);
  });
}

export async function instantiateAsset(payload) {
  // payload = "type|id|name"
  const [type, id] = payload.split('|');
  const cacheKey = `${type}:${id}`;

  if (type === 'builtin') {
    // Built-in cache already applies auto-fit
    return instantiateBuiltin(id);
  }

  let template = cache.get(cacheKey);
  if (!template) {
    let entry;
    if (type === 'model3d') {
      entry = await base44.entities.Model3D.get(id);
    } else if (type === 'modelfbx') {
      entry = await base44.entities.ModelFBX.get(id);
    }
    if (!entry?.file_url) throw new Error(`Asset ${cacheKey} has no file_url`);
    template = await loadFromUrl(entry.file_url, entry.file_type);
    autoFit(template);
    cache.set(cacheKey, template);
  }
  return template.clone(true);
}