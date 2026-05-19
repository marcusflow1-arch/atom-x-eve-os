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

export function buildGrassEnvironment(scene) {
  const grassMaterial = new THREE.MeshStandardMaterial({
    map: loadRepeatingTexture(TERRAIN_ASSETS.GRASS.textures.topSeamless, 16, 16),
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0,
  });

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE, 1, 1),
    grassMaterial,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  return ground;
}