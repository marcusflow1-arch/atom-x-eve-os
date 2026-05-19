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
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(37.5, 96),
    new THREE.MeshStandardMaterial({ color: 0x555555 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const barrier = new THREE.Mesh(
    new THREE.CylinderGeometry(37.5, 37.5, 4, 96, 1, true),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  barrier.position.y = 2;
  barrier.name = 'invisible_arena_barrier';
  scene.add(barrier);

  return ground;
}