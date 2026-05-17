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
import { ENEMY_PLAYER_SPAWNS, ENEMY_PLAYER_STATS, ENEMY_PLAYER_RESPAWN_SECONDS } from './enemyPlayerSpawnConfig';
import { getPlayerHUD, setHP } from './playerHUDStore';
import { addGold } from './shop/shopStore';
import { recordTitleKill } from './progression/titleStore';
import toast from 'react-hot-toast';

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
              if (n.material) {
                const mats = Array.isArray(n.material) ? n.material : [n.material];
                const red = mats.map((m) => {
                  const c = m.clone();
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
          const entry = {
            ...def,
            group: fbx,
            mixer,
            tintMats,
            ringMat,
            hp: ENEMY_PLAYER_STATS.hp + def.level * 20,
            maxHp: ENEMY_PLAYER_STATS.hp + def.level * 20,
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
        addGold(r.goldReward || 75);
        recordTitleKill('pvp', 1);
        // Drop loot at the rogue's position
        window.dispatchEvent(new CustomEvent('enemyLootDrop', {
          detail: {
            enemyId: r.id, tier: 'elite', isBoss: false,
            x: r.group.position.x, y: r.group.position.y, z: r.group.position.z,
          },
        }));
        toast.success(`Defeated ${r.name} — +${r.goldReward} gold`, { icon: '⚔️' });
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