// spawnWorldBoss — spawns the first registered world boss into the 3D scene.
//
// The boss reuses the creature model supersized x7; idle/walk clips attach if
// they load, but the model appears even without them (T-pose is fine). HP is
// 1000x a normal enemy's. isBoss=true keeps it outside the '=' visibility
// toggle so the boss is always visible. The autonomous attack cycle in
// GameWorld3D fires scripted patterns using this entity as the beam origin.
import * as THREE from 'three';
import { BOSSES, BOSS_SCALE_MULT } from '../bossData';
import { CREATURE_MODEL_URL } from '../creatureAssets';
import { ENEMY_STAT_TEMPLATES, computeDerivedStats } from '../statsSystem';

export function spawnWorldBoss({
  loader,
  scene,
  snapToGround,
  bossEntities,
  setBosses,
  walkClipPromise,
  idleClipPromise,
}) {
  const bossDef = BOSSES[0];
  if (!bossDef) return;
  loader.load(
    CREATURE_MODEL_URL,
    (fbx) => {
      const bossModel = fbx;
      const bossBaseStats =
        ENEMY_STAT_TEMPLATES.champion ||
        ENEMY_STAT_TEMPLATES[Object.keys(ENEMY_STAT_TEMPLATES)[0]];
      const bossDerived = computeDerivedStats(bossBaseStats, []);
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const bossScale = (1.7 / maxDim) * BOSS_SCALE_MULT;
      // Spawn in front of the player so the boss is immediately visible.
      bossModel.scale.setScalar(bossScale);
      bossModel.position.set(0, 0.3, 16);

      const bossTintMaterials = [];
      bossModel.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = !node.isSkinnedMesh;
          node.receiveShadow = true;
          if (node.material) {
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach((m) => bossTintMaterials.push(m));
          }
        }
      });

      // Hostile ground ring (boss color)
      const ringGeo = new THREE.RingGeometry(0.7 / bossScale, 0.95 / bossScale, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: bossDef.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02 / bossScale;
      bossModel.add(ring);

      scene.add(bossModel);
      snapToGround(bossModel, 0);

      const bossMixer = new THREE.AnimationMixer(bossModel);
      const bossHp = Math.round(bossDerived.maxHP * 1000);
      const bossEntry = {
        id: bossDef.id,
        name: bossDef.name,
        title: bossDef.title,
        color: bossDef.color,
        isBoss: true,
        group: bossModel,
        mixer: bossMixer,
        walkAction: null,
        idleAction: null,
        alive: true,
        hp: bossHp,
        maxHp: bossHp,
        derived: bossDerived,
        level: 1,
        xpReward: 0,
        tintMaterials: bossTintMaterials,
        // Segmented HP tanks (10 tanks) — consumed by the top-center
        // RogueBossHPTank HUD and the floating BossHeadHPTank bar.
        hpTanks: 10,
        hpTankSize: Math.round(bossHp / 10),
        // Wander/chase state — the boss walks toward the player when far,
        // wanders at mid range, and idles when close, so it roams the arena.
        state: 'idle',
        stateTimer: 0,
        target: null,
        speed: 1.6,
      };
      bossEntities.push(bossEntry);
      try { setBosses(bossEntities); } catch (e) { /* store sync is non-fatal */ }

      // Attach idle/walk clips if they load - the boss is visible without them.
      Promise.all([walkClipPromise, idleClipPromise]).then(([walkClip, idleClip]) => {
        if (idleClip) {
          const ia = bossMixer.clipAction(idleClip);
          ia.setEffectiveTimeScale(0.4);
          bossEntry.idleAction = ia;
          ia.reset().fadeIn(0.3).play();
        }
        if (walkClip) {
          bossEntry.walkAction = bossMixer.clipAction(walkClip);
        }
      });
    },
    undefined,
    () => { /* boss model load failed - non-fatal */ },
  );
}