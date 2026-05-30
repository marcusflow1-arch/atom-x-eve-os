// questEnemySpawner.js — spawns quest-target enemies on the map when a quest is accepted.
import * as THREE from 'three';
import { ENEMY_STAT_TEMPLATES, computeDerivedStats } from './statsSystem';
import { CREATURE_MODEL_URL } from './creatureAssets';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const QUEST_TIER_MAP = {
  normal:   { name: 'normal',   scale: 1.0,  ringColor: 0xff3030, tintColor: null     },
  elite:    { name: 'elite',    scale: 1.35, ringColor: 0xff6600, tintColor: 0xff4400 },
  champion: { name: 'champion', scale: 1.6,  ringColor: 0xcc00ff, tintColor: 0xaa00ee },
};

/**
 * Creates a quest enemy spawner bound to the live scene + enemies array.
 *
 * @param {{ scene, enemies, loader, snapToGround, walkClipPromise, idleClipPromise, setEnemyCount }} ctx
 * @returns {Function} spawnQuestEnemies({ count, tierName, playerPos })
 */
export function createQuestEnemySpawner({ scene, enemies, loader, snapToGround, walkClipPromise, idleClipPromise, setEnemyCount }) {
  return function spawnQuestEnemies({ count, tierName, playerPos }) {
    const tierDef = QUEST_TIER_MAP[tierName] || QUEST_TIER_MAP.normal;
    const enemyStats = ENEMY_STAT_TEMPLATES[tierDef.name] || ENEMY_STAT_TEMPLATES['normal'];
    const derived = computeDerivedStats(enemyStats, []);

    for (let i = 0; i < count; i++) {
      loader.load(CREATURE_MODEL_URL, (fbx) => {
        const b = new THREE.Box3().setFromObject(fbx);
        const s = b.getSize(new THREE.Vector3());
        const sc = (1.7 / Math.max(s.x, s.y, s.z)) * tierDef.scale;
        fbx.scale.setScalar(sc);

        // Spread enemies in a ring around the player (radius 8–14)
        const angle = (i / Math.max(count, 1)) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 8 + Math.random() * 6;
        const sx = (playerPos?.x || 0) + Math.cos(angle) * dist;
        const sz = (playerPos?.z || 0) + Math.sin(angle) * dist;
        fbx.position.set(sx, 0, sz);
        snapToGround(fbx, 0);

        const tintMaterials = [];
        fbx.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = !node.isSkinnedMesh;
            node.receiveShadow = true;
            if (node.material) {
              const mats = Array.isArray(node.material) ? node.material : [node.material];
              mats.forEach((m) => {
                if (tierDef.tintColor) m.color?.setHex(tierDef.tintColor);
                tintMaterials.push(m);
              });
            }
          }
        });

        // Colored ground ring to distinguish tier
        const rg = new THREE.RingGeometry(0.7 / sc, 0.9 / sc, 24);
        const rm = new THREE.MeshBasicMaterial({ color: tierDef.ringColor, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
        const ring = new THREE.Mesh(rg, rm);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02 / sc;
        fbx.add(ring);
        scene.add(fbx);

        const em = new THREE.AnimationMixer(fbx);
        const spawnId = `qe_${Date.now()}_${i}_${Math.floor(Math.random() * 9999)}`;

        const entry = {
          id: spawnId,
          group: fbx,
          mixer: em,
          walkAction: null,
          idleAction: null,
          state: 'idle',
          stateTimer: Math.random() * 2,
          target: null,
          alive: true,
          hitCooldown: 0,
          tintMaterials,
          zoneCenter: [sx, 0, sz],
          zoneRadius: 6,
          home: [sx, fbx.position.y, sz],
          respawnAt: null,
          tier: tierDef.name,
          level: tierDef.name === 'champion' ? 8 : tierDef.name === 'elite' ? 5 : 3,
          hp: derived.maxHP,
          maxHp: derived.maxHP,
          derived,
          xpReward: tierDef.name === 'champion' ? 70 : tierDef.name === 'elite' ? 30 : 15,
          attackCooldown: Math.random() * 1.5,
          attacking: false,
          attackWindupTimer: 0,
          thinkInterval: 0.2 + Math.random() * 1.2,
          thinkTimer: Math.random() * 0.9,
          speedJitter: 0.85 + Math.random() * 0.3,
          idleVariance: 0.7 + Math.random() * 0.8,
          walkVariance: 0.7 + Math.random() * 0.8,
          isQuestSpawn: true,
        };

        enemies.push(entry);
        setEnemyCount(enemies.filter((e) => e.alive && !e.dying).length);

        Promise.all([walkClipPromise, idleClipPromise]).then(([wc, ic]) => {
          if (wc) { const wa = em.clipAction(wc); wa.setEffectiveTimeScale(0.55); entry.walkAction = wa; }
          if (ic) { entry.idleAction = em.clipAction(ic); entry.idleAction.reset().fadeIn(0.2).play(); }
        });
      });
    }
  };
}