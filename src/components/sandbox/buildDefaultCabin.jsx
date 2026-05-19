// ─── Default Cabin Builder ──────────────────────────────────────────────
// Returns a THREE.Group representing a simple wooden cabin: log-textured
// walls, sloped dark roof, a door, and two windows. Used as the starting
// placement on the MapBuilder canvas so the world isn't completely empty.

import * as THREE from 'three';

export function buildDefaultCabin() {
  const cabin = new THREE.Group();
  cabin.name = 'default_cabin';

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.8 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x4a2e15, roughness: 0.7 });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x88c4e8, roughness: 0.2, metalness: 0.3, emissive: 0x2a4a6a, emissiveIntensity: 0.2,
  });

  // Walls — single box, 6 wide × 3 tall × 5 deep
  const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 5), wallMat);
  walls.position.y = 1.5;
  walls.castShadow = true;
  walls.receiveShadow = true;
  cabin.add(walls);

  // Roof — sloped triangular prism made from a cone with 4 segments
  const roofGeo = new THREE.ConeGeometry(4.5, 2.2, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 3 + 1.1;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  cabin.add(roof);

  // Door — front face (negative Z)
  const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), doorMat);
  door.position.set(0, 1, -2.55);
  door.castShadow = true;
  cabin.add(door);

  // Two front windows
  const w1 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 0.1), windowMat);
  w1.position.set(-2, 1.8, -2.55);
  cabin.add(w1);
  const w2 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 0.1), windowMat);
  w2.position.set(2, 1.8, -2.55);
  cabin.add(w2);

  return cabin;
}