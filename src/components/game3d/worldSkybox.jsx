import * as THREE from 'three';

const DEEP_SPACE_SKYBOX_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/cad7e28f0_milky_way_skybox_hdri_panorama.glb';

let skyboxPromise = null;
let cachedTexture = null;

export function loadDeepSpaceSkybox({ scene, gltfLoader }) {
  if (!scene || !gltfLoader) return () => {};

  scene.background = new THREE.Color(0x050711);
  scene.fog = new THREE.Fog(0x080b18, 90, 260);

  let disposed = false;
  let skyObject = null;

  if (cachedTexture) {
    scene.background = cachedTexture;
    scene.environment = cachedTexture;
  }

  if (!skyboxPromise) {
    skyboxPromise = new Promise((resolve) => {
      gltfLoader.load(
        DEEP_SPACE_SKYBOX_URL,
        (gltf) => resolve(gltf),
        undefined,
        () => resolve(null),
      );
    });
  }

  skyboxPromise.then((gltf) => {
    if (disposed || !gltf?.scene) return;

    let texture = null;
    gltf.scene.traverse((node) => {
      if (!node.isMesh) return;
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((mat) => {
        if (!texture && mat?.map) texture = mat.map;
      });
    });

    if (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      cachedTexture = texture;
      scene.background = texture;
      scene.environment = texture;
    } else {
      skyObject = gltf.scene.clone(true);
      skyObject.name = 'DeepSpaceSkybox';
      skyObject.scale.setScalar(180);
      skyObject.traverse((node) => {
        if (!node.isMesh) return;
        node.frustumCulled = false;
        node.renderOrder = -999;
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((mat) => {
          if (!mat) return;
          mat.depthWrite = false;
          mat.depthTest = false;
          mat.side = THREE.BackSide;
          mat.fog = false;
        });
      });
      scene.add(skyObject);
    }
  });

  return () => {
    disposed = true;
    if (skyObject) scene.remove(skyObject);
  };
}