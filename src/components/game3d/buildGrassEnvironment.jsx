// Builds the green-grass 3D environment for GameWorld3D:
//   • Textured grass ground plane with subtle rolling hills (vertex noise)
//   • Procedural grass texture (no external assets — generated via canvas)
//   • Decorative grass tufts scattered around the spawn area
//
// Returns the ground Mesh so the caller can add it to `groundMeshes` for
// raycast snapping. All decorative meshes are added directly to the scene.
import * as THREE from 'three';
import { TERRAIN_ASSETS } from './terrain/terrainAssetRegistry';
import { ARENA_SIZE, DIRT_CIRCLE, DIRT_PATH_WIDTH, getSPathCenterX } from './terrain/terrainPathLayout';

const textureLoader = new THREE.TextureLoader();

const loadRepeatingTexture = (url, repeatX, repeatY, colorSpace = THREE.SRGBColorSpace) => {
  const tex = textureLoader.load(url);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = colorSpace;
  return tex;
};

export function buildGrassEnvironment(scene) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x25441f, roughness: 1, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.035;
  ground.receiveShadow = true;
  scene.add(ground);

  const dirtMaterial = new THREE.MeshStandardMaterial({
    map: loadRepeatingTexture(TERRAIN_ASSETS.DIRT.textures.baseColor, 2, 16),
    normalMap: loadRepeatingTexture(TERRAIN_ASSETS.DIRT.textures.normal, 2, 16, THREE.NoColorSpace),
    roughnessMap: loadRepeatingTexture(TERRAIN_ASSETS.DIRT.textures.roughness, 2, 16, THREE.NoColorSpace),
    roughness: 1,
    metalness: 0,
  });

  const points = [];
  for (let z = -35; z <= DIRT_CIRCLE.z; z += 1.5) {
    points.push(new THREE.Vector3(getSPathCenterX(z), 0.035, z));
  }

  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.25);
  const pathGeo = new THREE.TubeGeometry(curve, 96, DIRT_PATH_WIDTH * 0.5, 14, false);
  const path = new THREE.Mesh(pathGeo, dirtMaterial);
  path.scale.y = 0.035;
  path.receiveShadow = true;
  scene.add(path);

  const circle = new THREE.Mesh(
    new THREE.CircleGeometry(DIRT_CIRCLE.radius, 80),
    dirtMaterial.clone(),
  );
  circle.rotation.x = -Math.PI / 2;
  circle.position.set(DIRT_CIRCLE.x, 0.045, DIRT_CIRCLE.z);
  circle.receiveShadow = true;
  scene.add(circle);

  return ground;
}