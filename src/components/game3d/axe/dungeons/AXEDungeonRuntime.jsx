import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createAXEInteractable } from '../interactions/AXEInteractionSystem';
import { addContribution } from '../../progression/contributionStore';
import { awardXP, getPlayerHUD } from '../../playerHUDStore';
import { xpForLevel } from '../../gameWorldConfig';
import {
  completeAXEDungeonBoss,
  completeAXEDungeonEncounter,
  enterAXEDungeonRoom,
  exitAXEDungeon,
  finalizeAXEDungeonClear,
  getAXEDungeonReturnPosition,
  getAXEDungeonState,
  isAXEDungeonEncounterCleared,
  startAXEDungeonBoss,
  subscribeAXEDungeons,
} from './AXEDungeonStore';
import {
  getAXEDungeonBossDefinition,
  getAXEDungeonDefinition,
  getAXEDungeonRoom,
} from './AXEDungeonSystem';

const teleportPlayer = (position, source = 'axe-dungeon') => {
  if (!position || typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('playerRespawn', {
    detail: {
      x: Number(position.x || 0),
      y: Number(position.y || 0),
      z: Number(position.z || 0),
      source,
    },
  }));
};

function createRoomBlockout(dungeon) {
  const root = new THREE.Group();
  root.name = `AXE_DungeonRuntime_${dungeon.id}`;

  for (const room of dungeon.rooms || []) {
    const p = room.runtimePosition;
    const s = room.runtimeSize;

    const roomGroup = new THREE.Group();
    roomGroup.name = room.id;
    roomGroup.position.set(p.x, p.y, p.z);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(s.width, 0.4, s.depth),
      new THREE.MeshStandardMaterial({
        color: room.type === 'boss' ? 0x2b1b32 : room.type === 'special' ? 0x2d2345 : 0x1b2931,
        roughness: 0.92,
        metalness: 0.05,
      }),
    );
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({
      color: room.type === 'boss' ? 0x493052 : 0x33434b,
      roughness: 0.88,
      metalness: 0.04,
      transparent: true,
      opacity: 0.92,
    });

    const wallH = Math.max(2.5, Number(s.height || 6));
    const wallT = 0.65;
    const wallDefs = [
      [0, wallH / 2, -s.depth / 2, s.width, wallH, wallT],
      [0, wallH / 2, s.depth / 2, s.width, wallH, wallT],
      [-s.width / 2, wallH / 2, 0, wallT, wallH, s.depth],
      [s.width / 2, wallH / 2, 0, wallT, wallH, s.depth],
    ];
    wallDefs.forEach(([x, y, z, w, h, d]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat.clone());
      wall.position.set(x, y, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      roomGroup.add(wall);
    });

    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 2.2, 16),
      new THREE.MeshStandardMaterial({
        color: room.type === 'boss' ? 0xf472b6 : room.type === 'special' ? 0xc084fc : 0x67e8f9,
        emissive: room.type === 'boss' ? 0x7a1e52 : room.type === 'special' ? 0x5b21b6 : 0x0e7490,
        emissiveIntensity: 1.15,
      }),
    );
    beacon.position.set(0, 1.1, 0);
    roomGroup.add(beacon);

    root.add(roomGroup);
  }

  return root;
}

function portalPosition(room, index = 0) {
  const offset = 3 + index * 3;
  return {
    x: Number(room.runtimePosition.x || 0) + Math.min(room.runtimeSize.width / 2 - 3, offset),
    y: Number(room.runtimePosition.y || 0),
    z: Number(room.runtimePosition.z || 0) + room.runtimeSize.depth / 2 - 3,
  };
}

export default function AXEDungeonRuntime() {
  const [state, setState] = useState(getAXEDungeonState());
  const [notice, setNotice] = useState(null);
  const spawnedEncounterKeys = useRef(new Set());
  const defeatedEnemyIds = useRef(new Set());
  const encounterDefeats = useRef(new Map());
  const spawnedBossKeys = useRef(new Set());
  const sessionBootstrapped = useRef(new Set());

  useEffect(() => subscribeAXEDungeons(setState), []);

  // Build/tear down the procedural interior and room transition interactables.
  useEffect(() => {
    const session = state.activeSession;
    if (!session || typeof window === 'undefined') return undefined;

    const dungeon = getAXEDungeonDefinition(session.dungeonId);
    const scene = window.__gw3dScene;
    const interactions = window.__axeInteractions;
    if (!dungeon || !scene || !interactions) return undefined;

    const root = createRoomBlockout(dungeon);
    scene.add(root);
    const registeredIds = [];

    const leaveDungeon = (source = 'axe-dungeon-exit') => {
      const returnPos = getAXEDungeonReturnPosition() || dungeon.prototypeReturnPosition || dungeon.prototypeEntryPosition;
      const latest = getAXEDungeonState().activeSession;
      if (!latest) return { state: 'idle' };
      if (latest.phase === 'completed' && !latest.rewardClaimed) {
        finalizeAXEDungeonClear();
      }
      exitAXEDungeon({ failed: latest.phase !== 'completed' });
      teleportPlayer(returnPos, source);
      return { state: 'idle' };
    };

    for (const room of dungeon.rooms || []) {
      (room.nextRoomIds || []).forEach((nextRoomId, index) => {
        const nextRoom = getAXEDungeonRoom(dungeon.id, nextRoomId);
        if (!nextRoom) return;
        const id = `AXE_DungeonGate_${session.sessionId}_${room.id}_${nextRoomId}`;
        registeredIds.push(id);
        interactions.register(createAXEInteractable({
          id,
          name: nextRoom.name,
          type: 'Enter',
          position: portalPosition(room, index),
          range: 4,
          priority: 18,
          prompt: `Enter ${nextRoom.name}`,
          metadata: {
            dungeonId: dungeon.id,
            sourceRoomId: room.id,
            targetRoomId: nextRoom.id,
            accessItemId: nextRoom.accessItemId || null,
          },
          onInteract: () => {
            const latest = getAXEDungeonState().activeSession;
            if (!latest || latest.sessionId !== session.sessionId) return { state: 'idle' };
            if (latest.currentRoomId !== room.id) {
              setNotice({ type: 'blocked', message: 'Move to the active room before using this passage.' });
              window.setTimeout(() => setNotice(null), 1800);
              return { state: 'idle' };
            }
            if (room.encounter && !isAXEDungeonEncounterCleared(room.id)) {
              setNotice({ type: 'blocked', message: 'Defeat the room encounter before advancing.' });
              window.setTimeout(() => setNotice(null), 2000);
              return { state: 'idle' };
            }
            if (latest.phase === 'boss_active') {
              setNotice({ type: 'blocked', message: 'The boss room is sealed while the boss is alive.' });
              window.setTimeout(() => setNotice(null), 2000);
              return { state: 'idle' };
            }

            const result = enterAXEDungeonRoom(nextRoom.id);
            if (!result.ok) {
              setNotice({
                type: 'blocked',
                message: result.reason === 'ACCESS_ITEM_REQUIRED'
                  ? 'SOS Access is required to open this passage.'
                  : result.reason,
              });
              window.setTimeout(() => setNotice(null), 2200);
              return { state: 'idle' };
            }

            teleportPlayer(nextRoom.runtimePosition, 'axe-dungeon-room');
            return { state: 'idle' };
          },
        }));
      });
    }

    const entryRoom = dungeon.rooms?.[0];
    if (entryRoom) {
      const id = `AXE_DungeonExit_${session.sessionId}`;
      registeredIds.push(id);
      interactions.register(createAXEInteractable({
        id,
        name: 'Return to Surface',
        type: 'Exit',
        position: {
          x: entryRoom.runtimePosition.x - Math.min(6, entryRoom.runtimeSize.width / 3),
          y: entryRoom.runtimePosition.y,
          z: entryRoom.runtimePosition.z - Math.min(6, entryRoom.runtimeSize.depth / 3),
        },
        range: 4,
        priority: 17,
        prompt: 'Leave Dungeon',
        metadata: { dungeonId: dungeon.id, sessionId: session.sessionId },
        onInteract: () => leaveDungeon('axe-dungeon-abandon'),
      }));
    }

    const bossRoom = (dungeon.rooms || []).find((room) => room.type === 'boss');
    if (bossRoom) {
      const id = `AXE_DungeonClearExit_${session.sessionId}`;
      registeredIds.push(id);
      interactions.register(createAXEInteractable({
        id,
        name: 'Dungeon Exit',
        type: 'Exit',
        position: {
          x: bossRoom.runtimePosition.x,
          y: bossRoom.runtimePosition.y,
          z: bossRoom.runtimePosition.z - bossRoom.runtimeSize.depth / 2 + 4,
        },
        range: 4,
        priority: 21,
        prompt: 'Return to Open World',
        metadata: { dungeonId: dungeon.id, sessionId: session.sessionId, clearExit: true },
        onInteract: () => {
          const latest = getAXEDungeonState().activeSession;
          if (!latest || latest.phase !== 'completed') {
            setNotice({ type: 'blocked', message: 'The boss seal must be broken before this exit opens.' });
            window.setTimeout(() => setNotice(null), 2200);
            return { state: 'idle' };
          }
          return leaveDungeon('axe-dungeon-clear-exit');
        },
      }));
    }

    if (!sessionBootstrapped.current.has(session.sessionId)) {
      sessionBootstrapped.current.add(session.sessionId);
      const currentRoom = getAXEDungeonRoom(session.dungeonId, session.currentRoomId) || dungeon.rooms?.[0];
      if (currentRoom) teleportPlayer(currentRoom.runtimePosition, 'axe-dungeon-entry');
    }

    return () => {
      registeredIds.forEach((id) => interactions.unregister?.(id));
      root.traverse((node) => {
        node.geometry?.dispose?.();
        if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
        else node.material?.dispose?.();
      });
      root.parent?.remove(root);
    };
  }, [state.activeSession?.sessionId]);

  // Spawn room encounters / dungeon bosses when the active room changes.
  useEffect(() => {
    const session = state.activeSession;
    if (!session || typeof window === 'undefined') return;

    const room = getAXEDungeonRoom(session.dungeonId, session.currentRoomId);
    if (!room) return;

    if (room.encounter && !(session.clearedEncounterRoomIds || []).includes(room.id)) {
      const key = `${session.sessionId}::${room.id}`;
      if (!spawnedEncounterKeys.current.has(key)) {
        spawnedEncounterKeys.current.add(key);
        encounterDefeats.current.set(key, 0);
        window.__gw3dSpawnQuestEnemies?.({
          count: Math.max(1, Number(room.encounter.count || 1)),
          tierName: room.encounter.tierName || 'normal',
          playerPos: room.runtimePosition,
          metadata: {
            dungeonSessionId: session.sessionId,
            dungeonId: session.dungeonId,
            dungeonRoomId: room.id,
            dungeonEncounter: true,
          },
        });
      }
    }

    if (room.type === 'boss' && room.bossId && !session.clearedBossIds.includes(room.bossId)) {
      const key = `${session.sessionId}::${room.bossId}`;
      if (!spawnedBossKeys.current.has(key)) {
        const bossDef = getAXEDungeonBossDefinition(room.bossId);
        const spawnBridge = window.__gw3dSpawnAXEDungeonBoss;
        if (bossDef && typeof spawnBridge === 'function') {
          spawnedBossKeys.current.add(key);
          startAXEDungeonBoss(room.bossId);
          spawnBridge({
            bossDef,
            position: room.runtimePosition,
            sessionId: session.sessionId,
            roomId: room.id,
          });
        }
      }
    }
  }, [
    state.activeSession?.sessionId,
    state.activeSession?.currentRoomId,
    state.activeSession?.phase,
    state.activeSession?.clearedEncounterRoomIds?.length,
    state.activeSession?.clearedBossIds?.length,
  ]);

  // Resolve combat encounters and boss clears from tagged live GameWorld kills.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onDefeated = (event) => {
      const detail = event?.detail || {};
      if (!detail.enemyId || defeatedEnemyIds.current.has(detail.enemyId)) return;
      defeatedEnemyIds.current.add(detail.enemyId);

      const meta = detail.metadata || {};
      const session = getAXEDungeonState().activeSession;
      if (!session || meta.dungeonSessionId !== session.sessionId) return;

      if (detail.dungeonBoss || meta.dungeonBossId) {
        const bossId = meta.dungeonBossId;
        if (!bossId) return;
        const result = completeAXEDungeonBoss(bossId);
        if (result.ok && result.dungeonCompleted) {
          const rewardResult = finalizeAXEDungeonClear();
          if (rewardResult.ok) {
            setNotice({ type: 'clear', message: 'Dungeon cleared. The return seal has opened.' });
            window.setTimeout(() => setNotice(null), 3200);
          }
        }
        return;
      }

      const roomId = meta.dungeonRoomId;
      const room = getAXEDungeonRoom(session.dungeonId, roomId);
      if (!room?.encounter) return;

      const key = `${session.sessionId}::${roomId}`;
      const defeated = Number(encounterDefeats.current.get(key) || 0) + 1;
      encounterDefeats.current.set(key, defeated);

      if (defeated >= Math.max(1, Number(room.encounter.count || 1))) {
        completeAXEDungeonEncounter(roomId);
        setNotice({ type: 'clear', message: `${room.name} cleared.` });
        window.setTimeout(() => setNotice(null), 1800);
      }
    };

    window.addEventListener('axeRuntimeEnemyDefeated', onDefeated);
    return () => window.removeEventListener('axeRuntimeEnemyDefeated', onDefeated);
  }, []);

  // Dungeon clear reward bridge into the existing live XP / contribution systems.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onReward = (event) => {
      const reward = event?.detail?.reward || {};
      const rewardXP = Math.max(0, Number(reward.xp || 0));
      const contribution = Math.max(0, Number(reward.contribution || 0));

      if (rewardXP > 0) {
        const hud = getPlayerHUD();
        let level = Number(hud.level || 1);
        let xp = Number(hud.xp || 0) + rewardXP;
        let needed = xpForLevel(level);
        let levelsGained = 0;
        while (xp >= needed) {
          xp -= needed;
          level += 1;
          levelsGained += 1;
          needed = xpForLevel(level);
        }
        awardXP({
          newLevel: level,
          newXP: xp,
          xpForNext: xpForLevel(level),
          levelsGained,
          xpGained: rewardXP,
        });
      }
      if (contribution > 0) addContribution(contribution);

      setNotice({
        type: 'reward',
        message: `Clear reward: +${rewardXP} XP${contribution ? ` · +${contribution} Contribution` : ''}`,
      });
      window.setTimeout(() => setNotice(null), 3000);
    };

    window.addEventListener('axeDungeonClearReward', onReward);
    return () => window.removeEventListener('axeDungeonClearReward', onReward);
  }, []);

  const session = state.activeSession;
  const dungeon = session ? getAXEDungeonDefinition(session.dungeonId) : null;
  const room = session ? getAXEDungeonRoom(session.dungeonId, session.currentRoomId) : null;

  if (!session) return null;

  return (
    <>
      <div className="pointer-events-none absolute left-4 top-24 z-[125] w-[270px] rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white backdrop-blur-xl">
        <div className="text-[9px] uppercase tracking-[0.28em] text-cyan-200/55">Dungeon Run</div>
        <div className="mt-1 text-sm font-semibold">{dungeon?.name || session.dungeonId}</div>
        <div className="mt-1 text-xs text-white/45">{room?.name || session.currentRoomId}</div>
        <div className="mt-2 text-[10px] uppercase tracking-widest text-white/35">
          Phase: <span className="text-white/70">{session.phase}</span>
        </div>
        {room?.encounter && !(session.clearedEncounterRoomIds || []).includes(room.id) && (
          <div className="mt-2 text-xs text-amber-200/75">
            Encounter active — defeat {room.encounter.count} {room.encounter.tierName} enemies.
          </div>
        )}
        {session.phase === 'boss_active' && (
          <div className="mt-2 text-xs text-fuchsia-200/80">Boss seal active — exits are locked.</div>
        )}
        {session.phase === 'completed' && (
          <div className="mt-2 text-xs text-emerald-200/80">Dungeon complete — return seal open.</div>
        )}
      </div>

      {notice && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-[155] -translate-x-1/2">
          <div className={`rounded-xl border px-4 py-2 text-sm backdrop-blur-xl ${
            notice.type === 'blocked'
              ? 'border-rose-300/30 bg-rose-950/80 text-rose-100'
              : notice.type === 'clear'
                ? 'border-emerald-300/30 bg-emerald-950/75 text-emerald-100'
                : 'border-cyan-300/30 bg-slate-950/80 text-cyan-100'
          }`}>
            {notice.message}
          </div>
        </div>
      )}
    </>
  );
}
