// BossTelegraphSystem — ground warnings for scripted world-boss attacks.
// Telegraphs are valid only while the real world boss is alive. If Ironmaw
// dies, pending circles/beam lanes are cleared before they can fire or damage.

import * as THREE from 'three';

function getLiveWorldBoss() {
  if (typeof window === 'undefined' || !Array.isArray(window.__gw3dBosses)) return null;
  return window.__gw3dBosses.find((boss) =>
    boss?.group &&
    boss.alive !== false &&
    !boss.dying &&
    !boss.defeated &&
    Number(boss.hp) > 0 &&
    boss.group.visible !== false
  ) || null;
}

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
  const circleGeo = new THREE.RingGeometry(0.92, 1, 40);
  const lineGeo = new THREE.PlaneGeometry(1, 1);

  const removeTelegraph = (t) => {
    if (!t?.mesh) return;
    scene.remove(t.mesh);
    t.mesh.material?.dispose?.();
    t.mesh = null;
  };

  const clear = () => {
    for (const t of telegraphs) removeTelegraph(t);
    telegraphs.length = 0;
  };

  const makeCircle = ({ x, z, radius, color = 0xff5533 }) => {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(circleGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.05, z);
    mesh.scale.set(radius, radius, radius);
    scene.add(mesh);
    return mesh;
  };

  const makeLine = ({ from, to, width, color = 0xffdd66 }) => {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(lineGeo, mat);
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    const angle = Math.atan2(dz, dx);
    mesh.position.set((from.x + to.x) * 0.5, 0.05, (from.z + to.z) * 0.5);
    mesh.scale.set(len, width * 2, 1);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -angle;
    scene.add(mesh);
    return mesh;
  };

  const spawnCircle = ({ x, z, radius = 2.5, delay = 1.0, damage = 25, color = 0xff5533, onFire }) => {
    const boss = getLiveWorldBoss();
    if (!boss) return false;
    telegraphs.push({
      type: 'circle', bossId: boss.id, x, z, radius, delay, timer: 0, damage, fired: false,
      mesh: makeCircle({ x, z, radius, color }), onFire,
    });
    return true;
  };

  const spawnLine = ({ from, to, width = 1.25, delay = 0.9, damage = 32, color = 0xffdd66, onFire }) => {
    const boss = getLiveWorldBoss();
    if (!boss) return false;
    telegraphs.push({
      type: 'line', bossId: boss.id,
      from: { x: from.x, z: from.z }, to: { x: to.x, z: to.z },
      width, delay, timer: 0, damage, fired: false,
      mesh: makeLine({ from, to, width, color }), onFire,
    });
    return true;
  };

  const applyDamage = (damage, bossId) => {
    const boss = getLiveWorldBoss();
    if (!boss || boss.id !== bossId) return;
    const hud = getPlayerHUD?.();
    if (!hud) return;
    setHP?.(Math.max(0, (hud.hp || 0) - damage));
    spawnDamageFloat?.('player', damage);
  };

  const update = (delta, { player, groundY = 0 } = {}) => {
    const boss = getLiveWorldBoss();
    if (!boss) {
      clear();
      return;
    }
    if (!player) return;

    for (let i = telegraphs.length - 1; i >= 0; i--) {
      const t = telegraphs[i];
      if (t.bossId !== boss.id) {
        removeTelegraph(t);
        telegraphs.splice(i, 1);
        continue;
      }

      t.timer += delta;
      if (t.mesh) {
        t.mesh.position.y = groundY + 0.05;
        const pulse = 0.82 + Math.sin(t.timer * 8) * 0.12;
        t.mesh.material.opacity = Math.min(0.92, 0.45 + (t.timer / t.delay) * 0.35);
        t.mesh.scale.y = pulse;
      }

      if (!t.fired && t.timer >= t.delay) {
        // Re-check immediately before impact so a death on the same frame wins.
        const liveBoss = getLiveWorldBoss();
        if (!liveBoss || liveBoss.id !== t.bossId) {
          removeTelegraph(t);
          telegraphs.splice(i, 1);
          continue;
        }

        t.fired = true;
        let hit = false;
        if (t.type === 'circle') {
          hit = pointInCircle(player.position.x, player.position.z, t.x, t.z, t.radius);
        } else if (t.type === 'line') {
          hit = pointNearLineSegment(player.position.x, player.position.z, t.from.x, t.from.z, t.to.x, t.to.z, t.width);
        }
        if (hit) applyDamage(t.damage, t.bossId);

        if (getLiveWorldBoss()?.id === t.bossId) {
          t.onFire?.({ hit, type: t.type, x: t.x, z: t.z, from: t.from, to: t.to, radius: t.radius, width: t.width });
        }
        removeTelegraph(t);
        telegraphs.splice(i, 1);
      }
    }
  };

  const getState = () => ({ count: telegraphs.length, bossId: getLiveWorldBoss()?.id || null });
  return { spawnCircle, spawnLine, update, clear, getState };
}