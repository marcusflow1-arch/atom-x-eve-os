// spawnBossMinion — factory that adds a minion enemy entity into the
// existing GameWorld3D enemies array. Used by useBossEventBus when the boss
// casts Summon Legion.
//
// Reuses the creature FBX + walk/idle clips so no extra asset loads.

import * as THREE from 'three';
import { CREATURE_MODEL_URL } from '../creatureAssets';
import { ENEMY_STAT_TEMPLATES, computeDerivedStats } from '../statsSystem';

export function makeBossMinionSpawner({
  scene, loader, enemies, bossEntities, snapToGround,
  walkClipPromise, idleClipPromise, setEnemyCount,
}) {
  return function spawnBossMinion(bossId, payload) {
    loader.load(CREATURE_MODEL_URL, (fbx) => {
      const baseStats = ENEMY_STAT_TEMPLATES.common;
      const derived = computeDerivedStats(baseStats, []);
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scl = (1.7 / maxDim) * 0.85;
      fbx.scale.setScalar(scl);
      fbx.position.set(payload.x, 0.3, payload.z);

      const tintMaterials = [];
      fbx.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = !node.isSkinnedMesh;
          node.receiveShadow = true;
          if (node.material) {
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach((m) => tintMaterials.push(m));
          }
        }
      });

      // Purple ring marks this as a summoned minion (visually distinct from
      // standard red-ring enemies).
      const ringGeo = new THREE.RingGeometry(0.7 / scl, 0.9 / scl, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xaa44ff, side: THREE.DoubleSide,
        transparent: true, opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02 / scl;
      fbx.add(ring);

      scene.add(fbx);
      snapToGround(fbx, 0);

      const minionId = `minion_${bossId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const mixer = new THREE.AnimationMixer(fbx);
      const minion = {
        id: minionId,
        group: fbx, mixer,
        walkAction: null, idleAction: null,
        state: 'walk', stateTimer: 0,
        target: null, alive: true, hitCooldown: 0,
        tintMaterials,
        zoneCenter: [payload.x, 0.3, payload.z],
        zoneRadius: 10,
        home: [payload.x, 0.3, payload.z],
        respawnAt: null,
        tier: 'common', level: 5,
        hp: derived.maxHP, maxHp: derived.maxHP,
        derived,
        xpReward: 2,
        attackCooldown: Math.random() * 1.5,
        attacking: false, attackWindupTimer: 0,
        // Async AI cadence
        thinkInterval: 0.2 + Math.random() * 0.8,
        thinkTimer: Math.random() * 0.5,
        speedJitter: 0.9 + Math.random() * 0.3,
        idleVariance: 0.6 + Math.random() * 0.6,
        walkVariance: 0.6 + Math.random() * 0.6,
        isSummon: true,
        ownerBossId: bossId,
        role: payload.role || 'melee',
      };
      enemies.push(minion);

      const boss = bossEntities.find((b) => b.id === bossId);
      boss?.brain?.onMinionSpawned?.(minionId, payload.role);

      Promise.all([walkClipPromise, idleClipPromise]).then(([wc, ic]) => {
        if (wc) {
          const wa = mixer.clipAction(wc);
          wa.setEffectiveTimeScale(0.6);
          minion.walkAction = wa;
          wa.reset().fadeIn(0.2).play();
        }
        if (ic) minion.idleAction = mixer.clipAction(ic);
      });
      setEnemyCount(enemies.filter((e) => e.alive && !e.dying).length);
    });
  };
}