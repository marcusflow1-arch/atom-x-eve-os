import { useEffect } from 'react';
import * as THREE from 'three';
import { AXE_CAPITAL_LAYOUT } from './AXECapitalLayout';

function addBox(group, name, position, size, color, yOffset = 0) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.08 }),
  );
  mesh.name = name;
  mesh.position.set(position[0], position[1] + size[1] / 2 + yOffset, position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function buildCapital(scene) {
  const existing = scene.getObjectByName('AXE_Capital_Blockout');
  if (existing) return existing;

  const group = new THREE.Group();
  group.name = 'AXE_Capital_Blockout';

  const [cx, , cz] = AXE_CAPITAL_LAYOUT.center;
  const { width, depth } = AXE_CAPITAL_LAYOUT.footprint;
  const wallH = AXE_CAPITAL_LAYOUT.wall.height;
  const wallT = AXE_CAPITAL_LAYOUT.wall.thickness;
  const north = cz + depth / 2;
  const south = cz - depth / 2;
  const west = cx - width / 2;
  const east = cx + width / 2;
  const gateHalf = AXE_CAPITAL_LAYOUT.mainGate.width / 2;

  // Defensive perimeter. South wall is split around the monumental gate.
  addBox(group, 'AXE_Wall_North', [cx, 0, north], [width, wallH, wallT], 0x3b4650);
  addBox(group, 'AXE_Wall_West', [west, 0, cz], [wallT, wallH, depth], 0x3b4650);
  addBox(group, 'AXE_Wall_East', [east, 0, cz], [wallT, wallH, depth], 0x3b4650);

  const southSegment = width / 2 - gateHalf;
  addBox(group, 'AXE_Wall_South_L', [west + southSegment / 2, 0, south], [southSegment, wallH, wallT], 0x3b4650);
  addBox(group, 'AXE_Wall_South_R', [east - southSegment / 2, 0, south], [southSegment, wallH, wallT], 0x3b4650);

  // Gatehouse + flanking towers.
  addBox(group, 'AXE_Gatehouse', [0, 0, south + 12], [42, 20, 24], 0x46535f);
  addBox(group, 'AXE_GateTower_L', [-28, 0, south + 8], [18, 26, 18], 0x4b5965);
  addBox(group, 'AXE_GateTower_R', [28, 0, south + 8], [18, 26, 18], 0x4b5965);

  // Main avenue.
  addBox(group, 'AXE_CentralAvenue', [0, 0, cz], [22, 0.12, depth - 80], 0x786e5f, 0.02);

  // District pads are intentionally simple, readable blockout geometry.
  AXE_CAPITAL_LAYOUT.districts.forEach((district, index) => {
    const [w, d] = district.size;
    const pad = addBox(
      group,
      district.id,
      district.center,
      [w, 0.16, d],
      index % 2 ? 0x334955 : 0x3b4f49,
      0.03,
    );
    pad.userData.axeDistrict = district;

    // One massing block makes each district legible at macro scale.
    const height = district.id.includes('FactionHQ') ? 34 : district.id.includes('Training') ? 10 : 16;
    const mass = addBox(
      group,
      `${district.id}_Massing`,
      [district.center[0], 0, district.center[2]],
      [Math.max(18, w * 0.28), height, Math.max(18, d * 0.28)],
      district.id.includes('FactionHQ') ? 0x596b7d : 0x4f5a61,
    );
    mass.userData.axeDistrictId = district.id;
  });

  // Defensive watchtowers + energy-emplacement placeholders.
  AXE_CAPITAL_LAYOUT.defensiveTowers.forEach((pos, i) => {
    addBox(group, `AXE_DefenseTower_${i + 1}`, pos, [16, 30, 16], 0x4b5965);
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0x61dfff,
        emissive: 0x1f7088,
        emissiveIntensity: 1.4,
        roughness: 0.25,
      }),
    );
    orb.name = `AXE_DefenseEmitter_${i + 1}`;
    orb.position.set(pos[0], 33, pos[2]);
    orb.userData.futureDefenseEmitter = true;
    group.add(orb);
  });

  // Service markers become real NPC/service actors in later prompts.
  AXE_CAPITAL_LAYOUT.serviceMarkers.forEach((service) => {
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 2.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x69d7ff, emissive: 0x143f4d, emissiveIntensity: 0.9 }),
    );
    marker.name = service.id;
    marker.position.set(service.position[0], 1.2, service.position[2]);
    marker.userData.axeService = service;
    group.add(marker);
  });

  // Palace/HQ is the dominant upper-city landmark.
  addBox(group, 'AXE_FactionHQ_UpperHall', [70, 0, 850], [160, 42, 90], 0x566a7a);
  addBox(group, 'AXE_FactionHQ_Tower', [70, 0, 875], [46, 72, 46], 0x61788b);

  scene.add(group);
  window.__axeCapitalLayout = AXE_CAPITAL_LAYOUT;
  window.dispatchEvent(new CustomEvent('axeCapitalBlockoutReady', { detail: AXE_CAPITAL_LAYOUT }));
  return group;
}

function dispose(group) {
  group?.traverse?.((obj) => {
    obj.geometry?.dispose?.();
    if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
    else obj.material?.dispose?.();
  });
  group?.parent?.remove?.(group);
}

export default function AXECapitalBlockoutMount() {
  useEffect(() => {
    let group = null;
    let stopped = false;

    const attach = () => {
      if (stopped || group || !window.__gw3dScene) return;
      group = buildCapital(window.__gw3dScene);
    };

    attach();
    const timer = window.setInterval(attach, 250);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      if (group?.parent) dispose(group);
      if (window.__axeCapitalLayout === AXE_CAPITAL_LAYOUT) window.__axeCapitalLayout = null;
    };
  }, []);

  return null;
}
