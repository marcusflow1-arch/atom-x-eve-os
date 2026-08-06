// BossTelegraphSystem — reusable ground-warning system for scripted boss
// attacks. Telegraphs appear on the ground, warn for a delay, then fire:
// damage is applied if the player is still inside the shape, and an onFire
// callback lets callers spawn VFX, play sounds, or shake the camera.
//
// Shapes:
//   • circle — meteor impacts, explosions, orbital strikes, stomp markers
//   • line   — light beams, directional lanes, sweeping line attacks
//
// Cones can be approximated later by composing several line/circle shapes.

import * as THREE from 'three';

function pointInCircle(px, pz, cx, cz, radius) {
  const dx = px - cx;
  const dz = pz - cz;
  return dx * dx + dz * dz <= radius * radius;
}

function pointNearLineSegment(px, pz, x1, z1, x2, z2, width) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq <= 0.00001) return false;
  let t = ((px - x1) * dx + (pz - z1) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const lx = x1 + dx * t;
  const lz = z1 + dz * t;
  const ddx = px - lx;
  const ddz = pz - lz;
  return ddx * ddx + ddz * ddz <= width * width;
}

export function createBossTelegraphSystem({
  scene,
  setHP,
  getPlayerHUD,
  spawnDamageFloat,
  playActionSound,
  cameraShake,
}) {
  const telegraphs = [];

  // Shared geometry — each telegraph scales its own mesh, so one geo is fine.
  const circleGeo = new THREE.RingGeometry(0.92, 1, 40);
  const lineGeo = new THREE.PlaneGeometry(1, 1);

  const makeCircle = ({ x, z, radius, color = 0xff5533 }) => {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(circleGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.05, z);
    mesh.scale.set(radius, radius, radius);
    scene.add(mesh);
    return mesh;
  };

  const makeLine = ({ from, to, width, color = 0xffdd66 }) => {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(lineGeo, mat);
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    const angle = Math.atan2(dz, dx);
    mesh.position.set((from.x + to.x) * 0.5, 0.05, (from.z + to.z) * 0.5);
    mesh.scale.set(len, width * 2, 1);
    // Lay flat, then rotate around world Y to align the length with the lane.
    // With Euler 'XYZ' order, after rotation.x the local Z axis points up
    // (world +Y), so rotation.z rotates around world Y — -angle aligns +X with dir.
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -angle;
    scene.add(mesh);
    return mesh;
  };

  const spawnCircle = ({
    x,
    z,
    radius = 2.5,
    delay = 1.0,
    damage = 25,
    color = 0xff5533,
    onFire,
  }) => {
    telegraphs.push({
      type: 'circle',
      x,
      z,
      radius,
      delay,
      timer: 0,
      damage,
      fired: false,
      mesh: makeCircle({ x, z, radius, color }),
      onFire,
    });
  };

  const spawnLine = ({
    from,
    to,
    width = 1.25,
    delay = 0.9,
    damage = 32,
    color = 0xffdd66,
    onFire,
  }) => {
    telegraphs.push({
      type: 'line',
      from: { x: from.x, z: from.z },
      to: { x: to.x, z: to.z },
      width,
      delay,
      timer: 0,
      damage,
      fired: false,
      mesh: makeLine({ from, to, width, color }),
      onFire,
    });
  };

  const applyDamage = (damage) => {
    const hud = getPlayerHUD?.();
    if (!hud) return;
    setHP?.(Math.max(0, (hud.hp || 0) - damage));
    spawnDamageFloat?.('player', damage);
  };

  const update = (delta, { player, groundY = 0 } = {}) => {
    if (!player) return;
    for (let i = telegraphs.length - 1; i >= 0; i--) {
      const t = telegraphs[i];
      t.timer += delta;
      if (t.mesh) {
        t.mesh.position.y = groundY + 0.05;
        const pulse = 0.82 + Math.sin(t.timer * 8) * 0.12;
        t.mesh.material.opacity = Math.min(0.92, 0.45 + (t.timer / t.delay) * 0.35);
        t.mesh.scale.y = pulse;
      }
      if (!t.fired && t.timer >= t.delay) {
        t.fired = true;
        let hit = false;
        if (t.type === 'circle') {
          hit = pointInCircle(player.position.x, player.position.z, t.x, t.z, t.radius);
        } else if (t.type === 'line') {
          hit = pointNearLineSegment(
            player.position.x,
            player.position.z,
            t.from.x,
            t.from.z,
            t.to.x,
            t.to.z,
            t.width
          );
        }
        if (hit) {
          applyDamage(t.damage);
        }
        t.onFire?.({
          hit,
          type: t.type,
          x: t.x,
          z: t.z,
          from: t.from,
          to: t.to,
          radius: t.radius,
          width: t.width,
        });
        if (t.mesh) {
          scene.remove(t.mesh);
          t.mesh.material.dispose();
        }
        telegraphs.splice(i, 1);
      }
    }
  };

  const clear = () => {
    for (const t of telegraphs) {
      if (t.mesh) {
        scene.remove(t.mesh);
        t.mesh.material.dispose();
      }
    }
    telegraphs.length = 0;
  };

  const getState = () => ({ count: telegraphs.length });

  return { spawnCircle, spawnLine, update, clear, getState };
}