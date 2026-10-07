import * as THREE from 'three';

const mat = (color, roughness = 0.72, metalness = 0.15, emissive = 0x000000, emissiveIntensity = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });

const imperial = {
  wall: mat(0x343a41, 0.86, 0.18),
  wallDark: mat(0x171d23, 0.9, 0.12),
  trim: mat(0x0d1217, 0.68, 0.38),
  floor: mat(0x151b20, 0.52, 0.45),
  light: mat(0xcfe8f5, 0.25, 0.2, 0xd8f1ff, 2.7),
  screenBlue: mat(0x19314d, 0.5, 0.35, 0x2677aa, 1.8),
  screenRed: mat(0x4c1713, 0.52, 0.35, 0xe6452f, 2.0),
  screenGreen: mat(0x153a29, 0.52, 0.35, 0x40d887, 1.5),
};

function box(scene, size, position, material, { los = true, collision = true, rotation = null } = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  if (rotation) mesh.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);
  return { mesh, los, collision };
}

function addControlBank(scene, x, z, side = 1) {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.45, 3.7), imperial.trim);
  shell.position.set(x, 1.0, z);
  group.add(shell);

  const colors = [imperial.screenBlue, imperial.screenRed, imperial.screenBlue, imperial.screenGreen];
  colors.forEach((material, index) => {
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.58), material);
    screen.position.set(x - side * 0.41, 1.2 + (index % 2) * 0.42, z - 1.1 + Math.floor(index / 2) * 1.5);
    group.add(screen);
  });
  scene.add(group);
  return group;
}

function addCeilingLight(scene, z, width = 6.6) {
  const fixture = new THREE.Mesh(new THREE.BoxGeometry(width, 0.07, 0.62), imperial.light);
  fixture.position.set(0, 4.46, z);
  fixture.rotation.z = Math.PI * 0.012;
  scene.add(fixture);
  const light = new THREE.RectAreaLight(0xd8efff, 4.0, width, 2.4);
  light.position.set(0, 4.15, z);
  light.rotation.x = -Math.PI / 2;
  scene.add(light);
}

export function buildKejimOutpost(scene) {
  const losMeshes = [];
  const collisionMeshes = [];
  const add = (args) => {
    const built = box(scene, ...args);
    if (built.los) losMeshes.push(built.mesh);
    if (built.collision) collisionMeshes.push(built.mesh);
    return built.mesh;
  };

  // Main floor / ceiling spine.
  add([[14, 0.35, 72], [0, -0.18, -20], imperial.floor, { los: false }]);
  add([[14, 0.28, 72], [0, 4.72, -20], imperial.wallDark, { collision: false }]);

  // Start bay: wide Imperial chamber.
  add([[0.35, 4.8, 20], [-7.0, 2.3, 8], imperial.wall]);
  add([[0.35, 4.8, 20], [7.0, 2.3, 8], imperial.wall]);
  add([[14, 4.8, 0.35], [0, 2.3, 18], imperial.wall]);
  add([[3.2, 4.8, 0.35], [-5.4, 2.3, -2], imperial.wall]);
  add([[3.2, 4.8, 0.35], [5.4, 2.3, -2], imperial.wall]);

  // Narrow security corridor.
  add([[0.35, 4.8, 31], [-4.15, 2.3, -17.2], imperial.wall]);
  add([[0.35, 4.8, 31], [4.15, 2.3, -17.2], imperial.wall]);
  add([[3.0, 4.8, 0.35], [-5.5, 2.3, -32.5], imperial.wall]);
  add([[3.0, 4.8, 0.35], [5.5, 2.3, -32.5], imperial.wall]);

  // Final control room, styled from the provided end-of-level screenshot.
  add([[0.35, 4.8, 22], [-7.0, 2.3, -43.5], imperial.wall]);
  add([[0.35, 4.8, 22], [7.0, 2.3, -43.5], imperial.wall]);
  add([[14, 4.8, 0.35], [0, 2.3, -54.5], imperial.wall]);
  add([[14, 0.25, 0.8], [0, 3.9, -33.0], imperial.trim, { collision: false }]);

  // Blast-door frames and architecture ribs.
  for (const z of [-2.0, -12, -22, -32.5]) {
    add([[0.28, 4.6, 0.52], [-3.9, 2.2, z], imperial.trim]);
    add([[0.28, 4.6, 0.52], [3.9, 2.2, z], imperial.trim]);
    add([[8.0, 0.32, 0.52], [0, 4.3, z], imperial.trim, { collision: false }]);
  }

  // Console banks mimic the long illuminated Imperial workstation wall in the reference.
  addControlBank(scene, 6.45, -39.0, 1);
  addControlBank(scene, 6.45, -44.0, 1);
  addControlBank(scene, 6.45, -49.0, 1);
  addControlBank(scene, -6.45, -44.0, -1);

  // Terminals.
  for (const [x,z,c] of [[-2.8,-48.5,imperial.screenBlue],[-1.7,-48.5,imperial.screenGreen],[2.5,-39.0,imperial.screenRed]]) {
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.7), imperial.trim);
    pedestal.position.set(x, 0.7, z);
    scene.add(pedestal);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.05), c);
    screen.position.set(x, 1.25, z + 0.37);
    scene.add(screen);
  }

  // Slanted white ceiling lights.
  for (const z of [13, 8, 3, -5, -10, -15, -20, -25, -30, -36, -41, -46, -51]) {
    addCeilingLight(scene, z, z < -33 ? 10.8 : 6.5);
  }

  // Exterior-ish entrance pads and crates to break silhouettes.
  const crateMat = mat(0x252d34, 0.78, 0.32);
  for (const [x,z,s] of [[-4,11,1],[4,6,1.2],[-2,-8,.8],[2.8,-26,1]]) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.2*s, 1.1*s, 1.2*s), crateMat);
    crate.position.set(x, 0.55*s, z);
    crate.castShadow = true;
    crate.receiveShadow = true;
    crate.userData.jkoObstacle = true;
    scene.add(crate);
    collisionMeshes.push(crate);
    losMeshes.push(crate);
  }

  // Atmospheric blue security strips.
  for (const z of [-6,-16,-26,-36,-46]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 1.1), imperial.screenBlue);
    strip.position.set(-4.0, 2.0, z);
    scene.add(strip);
  }

  return {
    losMeshes,
    collisionMeshes,
    playerSpawn: new THREE.Vector3(0, 0, 13),
    patrols: [
      [new THREE.Vector3(-2.2, 0, 7), new THREE.Vector3(2.4, 0, 2)],
      [new THREE.Vector3(1.8, 0, -7), new THREE.Vector3(-1.8, 0, -15)],
      [new THREE.Vector3(-1.8, 0, -21), new THREE.Vector3(1.8, 0, -28)],
      [new THREE.Vector3(-3.0, 0, -38), new THREE.Vector3(2.2, 0, -42)],
      [new THREE.Vector3(3.0, 0, -46), new THREE.Vector3(-2.5, 0, -50)],
      [new THREE.Vector3(0, 0, -52), new THREE.Vector3(4.0, 0, -49)],
    ],
  };
}

function limb(material, radius, length) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 5, 8), material);
  mesh.castShadow = true;
  return mesh;
}

export function createKyleProxy(scene, position) {
  const group = new THREE.Group();
  group.position.copy(position);

  const jacket = mat(0x6b5439, .82, .05);
  const shirt = mat(0x9d8060, .86, .02);
  const pants = mat(0x263342, .86, .04);
  const skin = mat(0xb78869, .95, .01);
  const hair = mat(0x2a1c14, .94, .01);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(.72, .92, .38), jacket);
  torso.position.y = 1.55;
  group.add(torso);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(.56, .68, .42), shirt);
  chest.position.set(0,1.58,.03);
  group.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.23, 16, 12), skin);
  head.position.y = 2.22;
  group.add(head);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(.238, 16, 8, 0, Math.PI*2, 0, Math.PI*.52), hair);
  hairCap.position.y = 2.27;
  group.add(hairCap);

  const leftArm = limb(jacket,.11,.62); leftArm.position.set(-.48,1.5,0); leftArm.rotation.z = -.08; group.add(leftArm);
  const rightArm = limb(jacket,.11,.62); rightArm.position.set(.48,1.5,0); rightArm.rotation.z = .08; group.add(rightArm);
  const leftLeg = limb(pants,.14,.75); leftLeg.position.set(-.2,.58,0); group.add(leftLeg);
  const rightLeg = limb(pants,.14,.75); rightLeg.position.set(.2,.58,0); group.add(rightLeg);

  const blaster = new THREE.Mesh(new THREE.BoxGeometry(.09,.10,.58), imperial.trim);
  blaster.position.set(.43,1.32,-.35);
  blaster.rotation.x = .1;
  group.add(blaster);

  group.traverse((obj) => { if (obj.isMesh) obj.castShadow = true; });
  scene.add(group);
  return group;
}

export function createStormtrooperProxy(scene, position, patrolPoints, index) {
  const group = new THREE.Group();
  group.position.copy(position);

  const armor = mat(0xdadfe2, .58, .12);
  const armorDark = mat(0x101418, .7, .28);
  const cloth = mat(0x171b20, .88, .02);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(.72,.92,.42), armor);
  torso.position.y = 1.55;
  group.add(torso);

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(.58,.34,.38), armor);
  pelvis.position.y = 1.03;
  group.add(pelvis);

  const head = new THREE.Mesh(new THREE.BoxGeometry(.47,.44,.43), armor);
  head.position.y = 2.25;
  group.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(.34,.10,.03), armorDark);
  visor.position.set(0,2.28,-.23);
  group.add(visor);

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(.28,.10,.04), armorDark);
  mouth.position.set(0,2.12,-.23);
  group.add(mouth);

  const leftArm = limb(armor,.105,.66); leftArm.position.set(-.48,1.5,0); group.add(leftArm);
  const rightArm = limb(armor,.105,.66); rightArm.position.set(.48,1.5,0); group.add(rightArm);
  const leftLeg = limb(cloth,.13,.74); leftLeg.position.set(-.2,.57,0); group.add(leftLeg);
  const rightLeg = limb(cloth,.13,.74); rightLeg.position.set(.2,.57,0); group.add(rightLeg);

  const blaster = new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.78), armorDark);
  blaster.position.set(.35,1.35,-.38);
  group.add(blaster);

  const hitMeshes = [];
  group.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.userData.jkoNpcId = index;
    hitMeshes.push(obj);
  });

  scene.add(group);

  return {
    id: index,
    group,
    hitMeshes,
    health: 100,
    maxHealth: 100,
    state: 'patrol',
    patrol: patrolPoints.map((p) => p.clone()),
    patrolIndex: 0,
    lastSeen: null,
    lastSeenAt: -Infinity,
    investigateUntil: 0,
    searchUntil: 0,
    nextShotAt: 0,
    aimSeed: Math.random() * Math.PI * 2,
    knockVelocity: new THREE.Vector3(),
    alertedBy: '',
  };
}

export function setNpcDeadPose(npc) {
  npc.group.rotation.z = npc.id % 2 ? 1.32 : -1.32;
  npc.group.position.y = 0.22;
}

export function disposeObject3D(root) {
  root.traverse((obj) => {
    if (obj.geometry?.dispose) obj.geometry.dispose();
    if (Array.isArray(obj.material)) obj.material.forEach((material) => material?.dispose?.());
    else obj.material?.dispose?.();
  });
}
