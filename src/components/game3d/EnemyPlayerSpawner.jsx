// ─── EnemyPlayerSpawner ───────────────────────────────────────────────
// Spawns hostile player-AI characters (archer model, red-tinted) into the
// existing 3D scene exposed by GameWorld3D on window.__gw3dScene.
//
// Each rogue:
//  - chases player when within detectionRange
//  - attacks when in attackRange (damages player HP via setHP)
//  - dies in 1-2 player hits, drops loot via enemyLootDrop event
//  - awards XP, gold, and records a PvP title kill
//  - respawns after 25s
//
// Hooks into the existing scene without modifying GameWorld3D directly.

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { ARCHER_URL, ANIMATION_URLS } from './gameWorldConfig';
import { ENEMY_PLAYER_SPAWNS, ENEMY_PLAYER_STATS, ENEMY_PLAYER_RESPAWN_SECONDS, getRandomRogueName } from './enemyPlayerSpawnConfig';
import { getPlayerHUD, setHP, awardXP } from './playerHUDStore';
import { xpForLevel } from './gameWorldConfig';
import { addGold } from './shop/shopStore';
import { addSouls } from './progression/weaponMastery/soulEssenceStore';
import { recordTitleKill } from './progression/titleStore';
import { incrementKillCount } from './killCountStore';
import { addFusionPoints, FUSION_POINTS_PER_KILL } from './fusionStore';
import { registerKill as registerStreakKill } from './killStreakStore';
import { awardCompanionXP } from './companionProgressionStore';
import { getCompanionState } from './companionStore';
import toast from 'react-hot-toast';

// Radius around each rogue that blocks the player from walking through them.
const ROGUE_BODY_RADIUS = 0.9;

export default function EnemyPlayerSpawner() {
  const rogueRef = useRef([]);
  const sceneRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let frameId = null;

    const init = () => {
      const scene = window.__gw3dScene;
      const camera = window.__gw3dCamera;
      if (!scene || !camera) {
        // Scene not ready yet — retry shortly.
        setTimeout(init, 500);
        return;
      }
      sceneRef.current = scene;

      const loader = new FBXLoader();
      const clock = new THREE.Clock();
      const rogues = [];

      // Preload shared animations once.
      const idleClipP = new Promise((res) => loader.load(ANIMATION_URLS.idle, (f) => res(f.animations?.[0] || null), undefined, () => res(null)));
      const runClipP  = new Promise((res) => loader.load(ANIMATION_URLS.run,  (f) => res(f.animations?.[0] || null), undefined, () => res(null)));
      const kickClipP = new Promise((res) => loader.load(ANIMATION_URLS.kick, (f) => res(f.animations?.[0] || null), undefined, () => res(null)));
      const deathClipP= new Promise((res) => loader.load(ANIMATION_URLS.death,(f) => res(f.animations?.[0] || null), undefined, () => res(null)));

      ENEMY_PLAYER_SPAWNS.forEach((def) => {
        loader.load(ARCHER_URL, (fbx) => {
          if (!mounted) return;
          const box = new THREE.Box3().setFromObject(fbx);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.7 / maxDim;
          fbx.scale.setScalar(scale);
          fbx.position.set(def.pos[0], def.pos[1], def.pos[2]);

          const tintMats = [];
          fbx.traverse((n) => {
            if (n.isMesh) {
              n.castShadow = !n.isSkinnedMesh;
              n.receiveShadow = true;
              n.visible = true;
              n.frustumCulled = false;
              if (n.material) {
                const mats = Array.isArray(n.material) ? n.material : [n.material];
                const red = mats.map((m) => {
                  const c = m.clone();
                  c.transparent = false;
                  c.opacity = 1;
                  c.side = THREE.DoubleSide;
                  c.emissive = new THREE.Color(def.color);
                  c.emissiveIntensity = 0.4;
                  return c;
                });
                n.material = Array.isArray(n.material) ? red : red[0];
                red.forEach((r) => tintMats.push(r));
              }
            }
          });

          // Hostile red marker ring
          const ringGeo = new THREE.RingGeometry(0.75 / scale, 1.0 / scale, 32);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0xff2020, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = 0.02 / scale;
          fbx.add(ring);

          scene.add(fbx);
          const mixer = new THREE.AnimationMixer(fbx);
          const baseHp = ENEMY_PLAYER_STATS.hp + def.level * 20;
          const hpTanks = def.hpTanks || 1;
          const entry = {
            ...def,
            name: def.name || getRandomRogueName(),
            group: fbx,
            mixer,
            tintMats,
            ringMat,
            hp: baseHp * hpTanks,
            maxHp: baseHp * hpTanks,
            hpTankSize: baseHp,
            hpTanks,
            alive: true,
            dying: false,
            deathTimer: 0,
            respawnAt: null,
            attackCooldown: 0,
            home: [...def.pos],
            currentAnim: 'idle',
            idleAction: null,
            runAction: null,
            kickAction: null,
            deathAction: null,
          };

          Promise.all([idleClipP, runClipP, kickClipP, deathClipP]).then(([idleClip, runClip, kickClip, deathClip]) => {
            if (idleClip) { entry.idleAction = mixer.clipAction(idleClip); entry.idleAction.play(); }
            if (runClip)  { entry.runAction = mixer.clipAction(runClip); }
            if (kickClip) { entry.kickAction = mixer.clipAction(kickClip); entry.kickAction.setLoop(THREE.LoopOnce); entry.kickAction.clampWhenFinished = true; }
            if (deathClip){ entry.deathAction = mixer.clipAction(deathClip); entry.deathAction.setLoop(THREE.LoopOnce); entry.deathAction.clampWhenFinished = true; }
          });

          rogues.push(entry);
          rogueRef.current = rogues;
        });
      });

      const playAnim = (entry, name) => {
        if (entry.currentAnim === name) return;
        const prev = entry[entry.currentAnim + 'Action'];
        const next = entry[name + 'Action'];
        if (prev) prev.fadeOut(0.2);
        if (next) next.reset().fadeIn(0.2).play();
        entry.currentAnim = name;
      };

      // Listen for player melee attacks — damage the nearest hostile-AI in range.
      const onPlayerAttack = (ev) => {
        const detail = ev.detail || {};
        const dmg = detail.damage || 25;
        const px = window.__localPlayerPos?.x ?? 0;
        const pz = window.__localPlayerPos?.z ?? 0;
        let closest = null;
        let closestDist = ENEMY_PLAYER_STATS.attackRange + 0.5;
        rogues.forEach((r) => {
          if (!r.alive || r.dying) return;
          const dx = r.group.position.x - px;
          const dz = r.group.position.z - pz;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < closestDist) { closestDist = d; closest = r; }
        });
        if (!closest) return;
        closest.hp -= dmg;
        closest.tintMats.forEach((m) => { m.emissive.setHex(0xffffff); });
        setTimeout(() => closest.tintMats.forEach((m) => { m.emissive.setHex(closest.color); }), 100);
        if (closest.hp <= 0) killRogue(closest);
      };

      const killRogue = (r) => {
        if (r.dying) return;
        r.dying = true;
        r.hp = 0;
        r.respawnAt = performance.now() + ENEMY_PLAYER_RESPAWN_SECONDS * 1000;
        if (r.deathAction) {
          if (r.idleAction) r.idleAction.fadeOut(0.15);
          if (r.runAction) r.runAction.fadeOut(0.15);
          r.deathAction.reset().fadeIn(0.15).play();
        }
        // Rewards
        // ── Kill reward formula ──────────────────────────────────────────
        // PROD (live version): kills awarded == the rogue's level.
        //   e.g. level 3 rogue → +3 kills, level 50 rogue → +50 kills.
        // TEST (current): multiplied by 100 so each kill yields ~level×100
        //   to make Halo enhancement attempts easy to verify.
        // ── Kill streak multiplier ────────────────────────────────────
        // Bump the consecutive kill streak FIRST so both kill points and
        // XP rewards benefit from the same multiplier (resets on death).
        const streakMult = registerStreakKill();

        const TEST_KILL_MULTIPLIER = 100; // ⚠ remove for live release
        const basePoints = (r.level || 1) * TEST_KILL_MULTIPLIER;
        const killReward = Math.round(basePoints * streakMult);
        addGold(r.goldReward || 75);
        recordTitleKill('pvp', killReward);
        incrementKillCount(killReward);
        addFusionPoints(FUSION_POINTS_PER_KILL);

        // ── Soul Essence drop ─────────────────────────────────────────
        // 35% chance per kill to drop 1–3 souls. Higher-level rogues drop
        // slightly more. Souls are required to enchant weapons.
        if (Math.random() < 0.35) {
          const soulAmount = 1 + Math.floor(Math.random() * 3) + Math.floor((r.level || 1) / 5);
          addSouls(soulAmount);
          toast.success(`+${soulAmount} Soul Essence`, { icon: '👻', duration: 2000 });
        }

        const baseXp = 25 + (r.level || 1) * 10;
        const finalXp = Math.round(baseXp * streakMult);
        window.dispatchEvent(new CustomEvent('combatXPReward', {
          detail: {
            xp: finalXp,
            genre: 'PvP',
            source: streakMult > 1 ? `Streak ×${streakMult.toFixed(1)}` : 'Kill',
          },
        }));

        // Feed the same XP into the player HUD progression so the rested 2×
        // bonus applies to rogue-AI kills (same path as mobs/bosses).
        const hud = getPlayerHUD();
        let nXP = (hud.xp || 0) + finalXp;
        let nLv = hud.level || 1;
        let need = xpForLevel(nLv);
        let gained = 0;
        while (nXP >= need) { nXP -= need; nLv++; gained++; need = xpForLevel(nLv); }
        awardXP({ newLevel: nLv, newXP: nXP, xpForNext: xpForLevel(nLv), levelsGained: gained, xpGained: finalXp });

        // Companion earns the same base XP (rested 1.5× applies inside the store).
        const compId = getCompanionState().activeCompanionId;
        if (compId) awardCompanionXP(compId, finalXp);

        // Drop loot at the rogue's position
        window.dispatchEvent(new CustomEvent('enemyLootDrop', {
          detail: {
            enemyId: r.id, tier: 'elite', isBoss: false,
            x: r.group.position.x, y: r.group.position.y, z: r.group.position.z,
          },
        }));
        toast.success(
          `Defeated ${r.name} — +${finalXp} XP${streakMult > 1 ? ` (×${streakMult.toFixed(1)})` : ''}, +${r.goldReward} gold`,
          { icon: '⚔️' }
        );
      };

      window.addEventListener('rogueAITakeDamage', onPlayerAttack);

      // Main update loop
      const tick = () => {
        if (!mounted) return;
        frameId = requestAnimationFrame(tick);
        const delta = clock.getDelta();
        const px = window.__localPlayerPos?.x ?? 0;
        const py = window.__localPlayerPos?.y ?? 0;
        const pz = window.__localPlayerPos?.z ?? 0;

        rogues.forEach((r) => {
          if (r.mixer) r.mixer.update(delta);

          // Respawn
          if (r.dying) {
            r.deathTimer += delta;
            if (r.deathTimer > 1.5) {
              r.tintMats.forEach((m) => { m.transparent = true; m.opacity = Math.max(0, m.opacity - delta); });
              if (r.group.visible && r.tintMats[0]?.opacity <= 0.05) r.group.visible = false;
            }
            if (r.respawnAt && performance.now() >= r.respawnAt) {
              r.dying = false; r.deathTimer = 0; r.respawnAt = null;
              r.hp = r.maxHp;
              r.name = getRandomRogueName();
              r.group.position.set(r.home[0], r.home[1], r.home[2]);
              r.group.visible = true;
              r.tintMats.forEach((m) => { m.opacity = 1; m.transparent = false; m.emissive.setHex(r.color); });
              if (r.deathAction) r.deathAction.fadeOut(0.1);
              if (r.idleAction)  r.idleAction.reset().fadeIn(0.2).play();
              r.currentAnim = 'idle';
            }
            return;
          }
          if (!r.alive) return;

          const dx = px - r.group.position.x;
          const dz = pz - r.group.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < ENEMY_PLAYER_STATS.detectionRange && dist > ENEMY_PLAYER_STATS.attackRange) {
            // Chase
            const nx = dx / dist, nz = dz / dist;
            r.group.position.x += nx * ENEMY_PLAYER_STATS.speed * delta;
            r.group.position.z += nz * ENEMY_PLAYER_STATS.speed * delta;
            const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(nx, nz));
            r.group.quaternion.slerp(q, 0.15);
            playAnim(r, 'run');
          } else if (dist <= ENEMY_PLAYER_STATS.attackRange) {
            // Attack
            const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(dx, dz));
            r.group.quaternion.slerp(q, 0.2);
            r.attackCooldown -= delta;
            if (r.attackCooldown <= 0) {
              r.attackCooldown = ENEMY_PLAYER_STATS.attackCooldown;
              if (r.kickAction) {
                if (r.idleAction) r.idleAction.fadeOut(0.1);
                if (r.runAction) r.runAction.fadeOut(0.1);
                r.kickAction.reset().fadeIn(0.1).play();
                r.currentAnim = 'kick';
              }
              const hud = getPlayerHUD();
              const dmg = ENEMY_PLAYER_STATS.attack + r.level * 2;
              setHP(Math.max(0, (hud.hp || 0) - dmg));
            }
          } else {
            playAnim(r, 'idle');
          }
        });
      };
      tick();

      // Expose for external systems (loot etc.)
      window.__gw3dRogues = rogues;

      // Cleanup function for the inner init scope
      window.__gw3dRogueCleanup = () => {
        window.removeEventListener('rogueAITakeDamage', onPlayerAttack);
        rogues.forEach((r) => {
          if (r.group && r.group.parent) r.group.parent.remove(r.group);
        });
        window.__gw3dRogues = null;
      };
    };

    init();

    return () => {
      mounted = false;
      if (frameId) cancelAnimationFrame(frameId);
      if (typeof window.__gw3dRogueCleanup === 'function') {
        window.__gw3dRogueCleanup();
        window.__gw3dRogueCleanup = null;
      }
    };
  }, []);

  return null;
}