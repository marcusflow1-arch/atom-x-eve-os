import { useEffect } from 'react';
import * as THREE from 'three';
import { AXE_FIRST_REGION, AXE_REGION_BLOCKOUT_COLORS } from './AXEFirstRegionLayout';

function addRoad(group, road) {
  const points = road.points.map(([x, y, z]) => new THREE.Vector3(x, y + 0.035, z));
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const length = a.distanceTo(b);
    const geom = new THREE.BoxGeometry(road.width, 0.06, length);
    const mat = new THREE.MeshStandardMaterial({ color: 0x756a57, roughness: 1 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = `${road.id}_Segment_${i}`;
    mesh.position.copy(mid);
    mesh.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    mesh.receiveShadow = true;
    group.add(mesh);
  }
}

function addRiver(group, river) {
  const points = river.points.map(([x, y, z]) => new THREE.Vector3(x, y + 0.02, z));
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const length = a.distanceTo(b);
    const geom = new THREE.BoxGeometry(river.width, 0.03, length);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2d6b87,
      roughness: 0.25,
      metalness: 0.05,
      transparent: true,
      opacity: 0.82,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = `${river.id}_Segment_${i}`;
    mesh.position.copy(mid);
    mesh.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    group.add(mesh);
  }
}

function buildBlockout(scene) {
  const existing = scene.getObjectByName('AXE_FirstRegion_Blockout');
  if (existing) return existing;

  const group = new THREE.Group();
  group.name = 'AXE_FirstRegion_Blockout';

  // Large playable-region base. This is a blockout surface only; later prompts
  // replace it with authored terrain/biomes without changing the layout data.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(AXE_FIRST_REGION.size.width, AXE_FIRST_REGION.size.depth, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x26392b, roughness: 1 }),
  );
  ground.name = 'AXE_FirstRegion_Ground';
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.04;
  ground.receiveShadow = true;
  group.add(ground);

  AXE_FIRST_REGION.zones.forEach((zone) => {
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(zone.radius, 64),
      new THREE.MeshBasicMaterial({
        color: AXE_REGION_BLOCKOUT_COLORS[zone.kind] || 0x444444,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    );
    disc.name = zone.id;
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(zone.center[0], 0.01, zone.center[2]);
    disc.userData.axeZone = zone;
    group.add(disc);
  });

  AXE_FIRST_REGION.roads.forEach((road) => addRoad(group, road));
  addRiver(group, AXE_FIRST_REGION.river);

  // Development landmarks make the macro layout readable from a distance.
  AXE_FIRST_REGION.landmarks.forEach((landmark) => {
    const h = 6 + landmark.importance * 0.08;
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, h, 8),
      new THREE.MeshStandardMaterial({ color: 0x74d8ff, emissive: 0x123c4c, emissiveIntensity: 0.7 }),
    );
    marker.name = landmark.id;
    marker.position.set(landmark.position[0], h / 2, landmark.position[2]);
    marker.userData.axeLandmark = landmark;
    group.add(marker);
  });

  scene.add(group);
  return group;
}

function disposeGroup(group) {
  group?.traverse?.((obj) => {
    obj.geometry?.dispose?.();
    if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
    else obj.material?.dispose?.();
  });
  group?.parent?.remove?.(group);
}

export default function AXEFirstRegionMount() {
  useEffect(() => {
    let disposed = false;
    let group = null;

    const attach = () => {
      if (disposed || group) return;
      const scene = window.__gw3dScene;
      if (!scene) return;
      group = buildBlockout(scene);
      window.__axeFirstRegion = AXE_FIRST_REGION;
      window.dispatchEvent(new CustomEvent('axeFirstRegionReady', { detail: AXE_FIRST_REGION }));
    };

    attach();
    const timer = window.setInterval(attach, 250);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      // Only remove the group this mount created for the current scene.
      if (group?.parent) disposeGroup(group);
      if (window.__axeFirstRegion === AXE_FIRST_REGION) window.__axeFirstRegion = null;
    };
  }, []);

  return null;
}
