// Builds the green-grass 3D environment for GameWorld3D:
//   • Textured grass ground plane with subtle rolling hills (vertex noise)
//   • Procedural grass texture (no external assets — generated via canvas)
//   • Decorative grass tufts scattered around the spawn area
//
// Returns the ground Mesh so the caller can add it to `groundMeshes` for
// raycast snapping. All decorative meshes are added directly to the scene.
import * as THREE from 'three';
import { TERRAIN_ASSETS } from './terrain/terrainAssetRegistry';

const ARENA_SIZE = 75;

const textureLoader = new THREE.TextureLoader();

const loadRepeatingTexture = (url, repeatX, repeatY, colorSpace = THREE.SRGBColorSpace) => {
  const tex = textureLoader.load(url);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = colorSpace;
  return tex;
};

// Game 3D is currently a systems/animation sandbox. Keep one flat walkable
// collider instead of authored maps, scenery, terrain streams, or arena walls.
export function buildGrassEnvironment(scene) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0x53616e, roughness: 0.92, metalness: 0 }),
  );
  ground.name = 'Systems Test Plane';
  ground.userData.isTerrain = true;
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  return ground;
}
