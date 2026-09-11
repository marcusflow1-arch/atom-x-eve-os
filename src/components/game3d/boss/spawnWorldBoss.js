// spawnWorldBoss — spawns the first registered world boss into the 3D scene.
//
// The boss reuses the creature model supersized x7; idle/walk/death clips attach
// when available, but the model still appears if an animation fails to load.
// isBoss=true keeps it outside the '=' visibility toggle so the boss is always
// visible until it is defeated and finishes its death sequence.
import * as THREE from 'three';
import { BOSSES, BOSS_SCALE_MULT } from '../bossData';
import { CREATURE_MODEL_URL, CREATURE_ANIMATION_URLS } from '../creatureAssets';
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

  // Preload the creature's real death clip for the world boss. Keeping this
  // local means every damage source can use the same bossEntry.deathAction.
  const deathClipPromise = new Promise((resolve) => {
    loader.load(
      CREATURE_ANIMATION_URLS.death,
      (fbx) => resolve(fbx.animations?.[0] || null),
      undefined,
      () => resolve(null),
    );
  });

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
        deathAction: null,
        deathDuration: 2.4,
        deathTimer: 0,
        deathStarted: false,
        dying: false,
        defeated: false,
        alive: true,
        hp: bossHp,
        maxHp: bossHp,
        derived: bossDerived,
        level: 1,
        xpReward: 0,
        tintMaterials: bossTintMaterials,
        fadeMaterials: [...bossTintMaterials, ringMat],
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

      // Attach idle, walk and the real mutant death clip. The death action is
      // LoopOnce + clampWhenFinished so the defeated boss stays down until fade.
      Promise.all([walkClipPromise, idleClipPromise, deathClipPromise]).then(([walkClip, idleClip, deathClip]) => {
        if (idleClip) {
          const ia = bossMixer.clipAction(idleClip);
          ia.setEffectiveTimeScale(0.4);
          bossEntry.idleAction = ia;
          ia.reset().fadeIn(0.3).play();
        }
        if (walkClip) {
          bossEntry.walkAction = bossMixer.clipAction(walkClip);
        }
        if (deathClip) {
          const da = bossMixer.clipAction(deathClip);
          da.setLoop(THREE.LoopOnce, 1);
          da.clampWhenFinished = true;
          bossEntry.deathAction = da;
          bossEntry.deathDuration = Math.max(0.8, Number(deathClip.duration) || 2.4);
        }
      });
    },
    undefined,
    () => { /* boss model load failed - non-fatal */ },
  );
}
