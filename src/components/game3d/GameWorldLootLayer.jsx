import React, { useEffect, useRef, useState } from 'react';
import WorldLootDrops from './WorldLootDrops';
import LootPickupToast from './LootPickupToast';
import { rollEnemyDrops } from './lootStore';

/**
 * GameWorldLootLayer
 * Mounted as a sibling to GameWorld3D's canvas.
 * Listens for `enemyKilled` custom events, rolls loot drops,
 * and renders the WorldLootDrops + LootPickupToast overlays.
 *
 * It hooks into the shared window globals that GameWorld3D already exposes:
 *   window.__gw3dScene  — THREE.Scene
 *   window.__gw3dCamera — THREE.Camera
 *   window.__localPlayerPos — { x, y, z }  (set every frame by GameWorld3D)
 *
 * For the player ref, we create a thin proxy that reads window.__localPlayerPos.
 */
export default function GameWorldLootLayer() {
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);
  const [drops, setDrops] = useState([]);

  // Proxy player object that reads live position from global
  const playerProxyRef = useRef({
    get position() {
      const p = window.__localPlayerPos;
      return p ? { x: p.x, y: p.y, z: p.z } : { x: 0, y: 0, z: 0 };
    },
  });

  // Wait for scene to be ready
  useEffect(() => {
    const onReady = () => {
      setScene(window.__gw3dScene);
      setCamera(window.__gw3dCamera);
    };
    if (window.__gw3dScene) {
      onReady();
    } else {
      window.addEventListener('gw3dSceneReady', onReady);
    }
    const onTeardown = () => { setScene(null); setCamera(null); };
    window.addEventListener('gw3dSceneTeardown', onTeardown);
    return () => {
      window.removeEventListener('gw3dSceneReady', onReady);
      window.removeEventListener('gw3dSceneTeardown', onTeardown);
    };
  }, []);

  // Listen for enemy death broadcasts — two sources:
  // 1. `enemyLootDrop` fired from broadcastEnemyKill (when lootCtx is passed)
  // 2. `multiplayerLocalAction` with kind=enemy_killed (fallback: look up pos in scene)
  useEffect(() => {
    const handleDrop = (e) => {
      const { enemyId, tier, isBoss, x, y, z } = e.detail || {};
      if (!enemyId) return;
      spawnDrops(tier || 'normal', !!isBoss, x ?? 0, y ?? 0, z ?? 0);
    };

    const handleMultiplayer = (e) => {
      const d = e.detail;
      if (!d || d.kind !== 'enemy_killed') return;
      // Try to locate the enemy mesh in the Three.js scene to get position
      let ex = 0, ey = 0, ez = 0;
      const sc = window.__gw3dScene;
      if (sc) {
        sc.traverse((node) => {
          if (node.userData?.enemyId === d.enemy_id) {
            ex = node.position.x; ey = node.position.y; ez = node.position.z;
          }
        });
      }
      spawnDrops('normal', false, ex, ey, ez);
    };

    window.addEventListener('enemyLootDrop', handleDrop);
    window.addEventListener('multiplayerLocalAction', handleMultiplayer);
    return () => {
      window.removeEventListener('enemyLootDrop', handleDrop);
      window.removeEventListener('multiplayerLocalAction', handleMultiplayer);
    };
  }, []);

  const spawnDrops = (tier, isBoss, x, y, z) => {
    const rolled = rollEnemyDrops(tier, isBoss);
    if (rolled.length === 0) return;
    const newDrops = rolled.map((item) => ({
      ...item,
      x: x + (Math.random() - 0.5) * 1.4,
      y: y || 0,
      z: z + (Math.random() - 0.5) * 1.4,
    }));
    setDrops((prev) => [...prev, ...newDrops]);
  };

  const handlePickup = (dropId) => {
    setDrops((prev) => prev.filter((d) => d.dropId !== dropId));
  };

  if (!scene || !camera) return <LootPickupToast />;

  return (
    <>
      <WorldLootDrops
        scene={scene}
        camera={camera}
        drops={drops}
        onPickup={handlePickup}
        playerRef={playerProxyRef}
      />
      <LootPickupToast />
    </>
  );
}