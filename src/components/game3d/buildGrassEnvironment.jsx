// Builds the green-grass 3D environment for GameWorld3D:
//   • Textured grass ground plane with subtle rolling hills (vertex noise)
//   • Procedural grass texture (no external assets — generated via canvas)
//   • Decorative grass tufts scattered around the spawn area
//
// Returns the ground Mesh so the caller can add it to `groundMeshes` for
// raycast snapping. All decorative meshes are added directly to the scene.
import * as THREE from 'three';
import { TERRAIN_ASSETS } from './terrain/terrainAssetRegistry';

const textureLoader = new THREE.TextureLoader();

const loadRepeatingTexture = (url, repeatX, repeatY, colorSpace = THREE.SRGBColorSpace) => {
  const tex = textureLoader.load(url);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = colorSpace;
  return tex;
};

export function buildGrassEnvironment(scene) {
  // Ground plane (75×75) for the focused boss-fight arena.
  // Vertices near origin are flat so spawn area stays usable.
  const grassGeo = new THREE.PlaneGeometry(75, 75, 40, 40);
  const posAttr = grassGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const dist = Math.sqrt(x * x + y * y);
    const fade = Math.min(1, Math.max(0, (dist - 15) / 40));
    const z = Math.sin(x * 0.08) * Math.cos(y * 0.08) * 0.6 * fade
            + Math.sin(x * 0.22 + y * 0.18) * 0.25 * fade;
    posAttr.setZ(i, z);
  }
  grassGeo.computeVertexNormals();

  const ground = new THREE.Mesh(
    grassGeo,
    new THREE.MeshStandardMaterial({
      map: loadRepeatingTexture(TERRAIN_ASSETS.GRASS.textures.topSeamless, 14, 14),
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  // Simple dirt walkway through the arena, kept as terrain detail rather than a prop.
  const pathGeo = new THREE.PlaneGeometry(5, 74, 4, 40);
  const pathPos = pathGeo.attributes.position;
  for (let i = 0; i < pathPos.count; i++) {
    const x = pathPos.getX(i);
    const y = pathPos.getY(i);
    const dist = Math.sqrt(x * x + y * y);
    const fade = Math.min(1, Math.max(0, (dist - 15) / 40));
    const z = Math.sin(x * 0.08) * Math.cos(y * 0.08) * 0.6 * fade
            + Math.sin(x * 0.22 + y * 0.18) * 0.25 * fade;
    pathPos.setZ(i, z + 0.025);
  }
  pathGeo.computeVertexNormals();
  const path = new THREE.Mesh(
    pathGeo,
    new THREE.MeshStandardMaterial({
      map: loadRepeatingTexture(TERRAIN_ASSETS.DIRT.textures.baseColor, 1.5, 18),
      normalMap: loadRepeatingTexture(TERRAIN_ASSETS.DIRT.textures.normal, 1.5, 18, THREE.NoColorSpace),
      roughnessMap: loadRepeatingTexture(TERRAIN_ASSETS.DIRT.textures.roughness, 1.5, 18, THREE.NoColorSpace),
      roughness: 1,
      metalness: 0,
    }),
  );
  path.rotation.x = -Math.PI / 2;
  path.receiveShadow = true;
  scene.add(path);

  return ground;
}