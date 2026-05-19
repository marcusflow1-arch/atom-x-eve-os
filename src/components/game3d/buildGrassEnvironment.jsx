// Builds the green-grass 3D environment for GameWorld3D:
//   • Textured grass ground plane with subtle rolling hills (vertex noise)
//   • Procedural grass texture (no external assets — generated via canvas)
//   • Decorative grass tufts + bushes scattered around the spawn area
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
  tex.repeat.set(40, 40);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

export function buildGrassEnvironment(scene) {
  // Ground plane (200×200) with gentle rolling hills.
  // Vertices near origin are flat so spawn area stays usable.
  const grassGeo = new THREE.PlaneGeometry(200, 200, 80, 80);
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

  // Decorative grass tufts — instanced small green cones scattered around.
  const tuftGeo = new THREE.ConeGeometry(0.15, 0.45, 5);
  const tuftMat = new THREE.MeshStandardMaterial({ color: 0x6aa84f, roughness: 1 });
  const tuftCount = 220;
  const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, tuftCount);
  const tmpMat = new THREE.Matrix4();
  const tmpEuler = new THREE.Euler();
  const tmpQuat = new THREE.Quaternion();
  const tmpScale = new THREE.Vector3();
  const tmpPos = new THREE.Vector3();
  for (let i = 0; i < tuftCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 8 + Math.random() * 82;
    tmpPos.set(Math.cos(angle) * radius, 0.22, Math.sin(angle) * radius);
    tmpEuler.set(0, Math.random() * Math.PI * 2, 0);
    tmpQuat.setFromEuler(tmpEuler);
    const s = 0.7 + Math.random() * 0.9;
    tmpScale.set(s, s, s);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    tufts.setMatrixAt(i, tmpMat);
  }
  tufts.instanceMatrix.needsUpdate = true;
  tufts.receiveShadow = true;
  scene.add(tufts);

  // Decorative bushes — rounded green spheres dotted further out.
  const bushGeo = new THREE.SphereGeometry(0.8, 8, 6);
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x4f7a3a, roughness: 1 });
  const bushCount = 28;
  const bushes = new THREE.InstancedMesh(bushGeo, bushMat, bushCount);
  for (let i = 0; i < bushCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 14 + Math.random() * 70;
    tmpPos.set(Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius);
    tmpEuler.set(0, Math.random() * Math.PI * 2, 0);
    tmpQuat.setFromEuler(tmpEuler);
    const s = 0.8 + Math.random() * 0.7;
    tmpScale.set(s * 1.2, s, s * 1.2);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    bushes.setMatrixAt(i, tmpMat);
  }
  bushes.instanceMatrix.needsUpdate = true;
  bushes.castShadow = true;
  bushes.receiveShadow = true;
  scene.add(bushes);

  return ground;
}