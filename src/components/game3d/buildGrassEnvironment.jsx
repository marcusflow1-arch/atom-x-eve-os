// Builds the green-grass 3D environment for GameWorld3D:
//   • Textured grass ground plane with subtle rolling hills (vertex noise)
//   • Procedural grass texture (no external assets — generated via canvas)
//   • Decorative grass tufts scattered around the spawn area
//
// Returns the ground Mesh so the caller can add it to `groundMeshes` for
// raycast snapping. All decorative meshes are added directly to the scene.
import * as THREE from 'three';

const makeGrassTexture = () => {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4a7c3a';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = Math.random();
    ctx.fillStyle = v > 0.7
      ? `rgba(120, 170, 90, ${0.25 + Math.random() * 0.35})`
      : v > 0.4
        ? `rgba(60, 100, 50, ${0.15 + Math.random() * 0.25})`
        : `rgba(90, 140, 70, ${0.1 + Math.random() * 0.2})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(15, 15);
  tex.colorSpace = THREE.SRGBColorSpace;
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
      map: makeGrassTexture(),
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
    new THREE.MeshStandardMaterial({ color: 0x7a5a34, roughness: 1, metalness: 0 }),
  );
  path.rotation.x = -Math.PI / 2;
  path.receiveShadow = true;
  scene.add(path);

  return ground;
}