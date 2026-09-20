import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createAXEInteractable } from '../interactions/AXEInteractionSystem';
import { awardXP, getPlayerHUD, getAXEPowerProgression } from '../../playerHUDStore';
import { xpForLevel } from '../../gameWorldConfig';
import { addContribution } from '../../progression/contributionStore';
import {
  canEnterAXEDungeon,
  canLeaveCurrentAXEDungeonRoom,
  completeAXEDungeonBoss,
  completeAXEDungeonRoomEncounter,
  enterAXEDungeon,
  enterAXEDungeonRoom,
  exitAXEDungeon,
  finalizeAXEDungeonClear,
  getAXEDungeonState,
  markAXEDungeonRoomEncounterStarted,
  startAXEDungeonBoss,
  subscribeAXEDungeons,
} from './AXEDungeonStore';
import {
  AXE_DUNGEON_DEFINITIONS,
  getAXEDungeonBossDefinition,
  getAXEDungeonDefinition,
  getAXEDungeonPrototypeEntrances,
  getAXEDungeonRoom,
} from './AXEDungeonSystem';
import {
  getAXEAccessItemCount,
  getAXEAccessItemState,
  subscribeAXEAccessItems,
} from './AXEAccessItemStore';

function makeMaterial(color, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    roughness: 0.78,
    metalness: 0.08,
  });
}

function createPortalMarker(scene, entry, gated) {
  const group = new THREE.Group();
  group.name = `AXE_DungeonPortal_${entry.dungeonId}`;
  group.position.set(entry.position.x, entry.position.y, entry.position.z);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.08, 10, 48),
    new THREE.MeshStandardMaterial({
      color: gated ? 0xf0abfc : 0x67e8f9,
      emissive: gated ? 0x5b165f : 0x0d3d48,
      emissiveIntensity: 1.2,
      roughness: 0.35,
      metalness: 0.45,
    }),
  );
  ring.rotation.y = Math.PI / 2;
  ring.position.y = 1.25;
  group.add(ring);

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.45, 0.12, 32),
    makeMaterial(gated ? 0x5b214f : 0x153745),
  );
  pad.position.y = 0.06;
  group.add(pad);

  scene.add(group);
  return group;
}

function buildRoomBlockout(scene, dungeon, room, index) {
  const group = new THREE.Group();
  group.name = `AXE_DungeonRoom_${room.id}`;
  group.position.set(room.runtimePosition.x, room.runtimePosition.y, room.runtimePosition.z);

  const { width, depth, height } = room.runtimeSize;
  const floorColor = room.type === 'boss'
    ? 0x2a1b2f
    : room.type === 'special'
      ? 0x2b2235
      : room.type === 'combat'
        ? 0x1e2730
        : 0x20262b;
  const wallColor = room.type === 'boss' ? 0x33243d : 0x2a3138;

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.3, depth),
    makeMaterial(floorColor),
  );
  floor.position.y = -0.15;
  floor.receiveShadow = true;
  group.add(floor);

  const wallMaterial = makeMaterial(wallColor);
  const wallThickness = 0.5;
  const wallHeight = Math.max(3.5, height * 0.55);
  const north = new THREE.Mesh(new THREE.BoxGeometry(width, wallHeight, wallThickness), wallMaterial.clone());
  const south = new THREE.Mesh(new THREE.BoxGeometry(width, wallHeight, wallThickness), wallMaterial.clone());
  const east = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, depth), wallMaterial.clone());
  const west = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, depth), wallMaterial.clone());
  north.position.set(0, wallHeight / 2, -depth / 2);
  south.position.set(0, wallHeight / 2, depth / 2);
  east.position.set(width / 2, wallHeight / 2, 0);
  west.position.set(-width / 2, wallHeight / 2, 0);
  group.add(north, south, east, west);

  const ceilingRing = new THREE.Mesh(
    new THREE.TorusGeometry(Math.min(width, depth) * 0.24, 0.07, 8, 36),
    new THREE.MeshBasicMaterial({
      color: room.type === 'boss' ? 0xec4899 : 0x67e8f9,
      transparent: true,
      opacity: room.type === 'boss' ? 0.35 : 0.18,
    }),
  );
  ceilingRing.rotation.x = Math.PI / 2;
  ceilingRing.position.y = Math.min(height, 5.5);
  group.add(ceilingRing);

  const pillarGeo = new THREE.CylinderGeometry(0.45, 0.55, Math.min(height, 5), 10);
  for (const [x, z] of [
    [-width * 0.35, -depth * 0.32],
    [width * 0.35, -depth * 0.32],
    [-width * 0.35, depth * 0.32],
    [width * 0.35, depth * 0.32],
  ]) {
    const pillar = new THREE.Mesh(pillarGeo, makeMaterial(index % 2 ? 0x30343a : 0x353a3f));
    pillar.position.set(x, Math.min(height, 5) / 2, z);
    group.add(pillar);
  }

  const beacon = new THREE.PointLight(
    room.type === 'boss' ? 0xec4899 : room.type === 'special' ? 0xf0abfc : 0x67e8f9,
    room.type === 'boss' ? 6 : 3.5,
    Math.max(width, depth) * 0.85,
    2,
  );
  beacon.position.set(0, Math.min(height, 5), 0);
  group.add(beacon);

  scene.add(group);
  return group;
}

function doorwayPosition(fromRoom, toRoom, index = 0) {
  const from = fromRoom.runtimePosition;
  const to = toRoom.runtimePosition;
  let dx = to.x - from.x;
  let dz = to.z - from.z;
  const len = Math.hypot(dx, dz) || 1;
  dx /= len;
  dz /= len;
  const reach = Math.min(fromRoom.runtimeSize.width, fromRoom.runtimeSize.depth) * 0.32;
  const sideOffset = index * 1.6;
  return {
    x: from.x + dx * reach - dz * sideOffset,
    y: 0,
    z: from.z + dz * reach + dx * sideOffset,
  };
}

function createDoorMarker(scene, id, position, color = 0x67e8f9) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.07, 8, 36),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }),
  );
  mesh.name = id;
  mesh.position.set(position.x, 1.1, position.z);
  mesh.rotation.y = Math.PI / 2;
  scene.add(mesh);
  return mesh;
}

function awardDungeonClearReward(reward = {}) {
  const xp = Math.max(0, Number(reward.xp || 0));
  const contribution = Math.max(0, Number(reward.contribution || 0));

  if (xp > 0) {
    const hud = getPlayerHUD();
    let newLevel = Number(hud.level || 1);
    let newXP = Number(hud.xp || 0) + xp;
    let needed = xpForLevel(newLevel);
    let levelsGained = 0;

    while (newXP >= needed) {
      newXP -= needed;
      newLevel += 1;
      levelsGained += 1;
      needed = xpForLevel(newLevel);
    }

    awardXP({
      newLevel,
      newXP,
      xpForNext: xpForLevel(newLevel),
      levelsGained,
      xpGained: xp,
    });
  }

  if (contribution > 0) addContribution(contribution);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('combatXPReward', {
      detail: { xp, contribution, source: 'dungeon-clear' },
    }));
  }
}

export default function AXEDungeonMount() {
  const [dungeonState, setDungeonState] = useState(getAXEDungeonState());
  const [accessState, setAccessState] = useState(getAXEAccessItemState());
  const [notice, setNotice] = useState(null);
  const stateRef = useRef(dungeonState);
  stateRef.current = dungeonState;

  useEffect(() => subscribeAXEDungeons(setDungeonState), []);
  useEffect(() => subscribeAXEAccessItems(setAccessState), []);

  // Static world entrances + temporary room blockouts.
  useEffect(() => {
    let disposed = false;
    let timer = 0;
    let registered = false;
    let scene = null;
    const markerGroups = [];
    const roomGroups = [];
    const registeredIds = [];

    const setup = () => {
      if (disposed || registered) return;
      const interactions = window.__axeInteractions;
      scene = window.__gw3dScene;
      if (!interactions || !scene) return;

      for (const dungeon of Object.values(AXE_DUNGEON_DEFINITIONS)) {
        dungeon.rooms.forEach((room, index) => {
          roomGroups.push(buildRoomBlockout(scene, dungeon, room, index));
        });
      }

      for (const entry of getAXEDungeonPrototypeEntrances()) {
        const def = getAXEDungeonDefinition(entry.dungeonId);
        if (!def) continue;
        const gated = !!entry.accessItemId;
        markerGroups.push(createPortalMarker(scene, entry, gated));

        const interactableId = `AXE_Interact_Dungeon_${def.id}`;
        registeredIds.push(interactableId);

        interactions.register(createAXEInteractable({
          id: interactableId,
          name: def.name,
          type: 'Enter',
          position: entry.position,
          range: 3.8,
          priority: gated ? 16 : 15,
          prompt: gated ? `Enter ${def.name} (SOS Access)` : `Enter ${def.name}`,
          metadata: {
            dungeonId: def.id,
            accessItemId: entry.accessItemId,
            prototype: true,
          },
          onInteract: () => {
            const hud = getPlayerHUD();
            const power = getAXEPowerProgression();
            const check = canEnterAXEDungeon(def.id, {
              playerLevel: hud?.level || 1,
              powerTier: power?.powerTier || 0,
            });

            if (!check.ok && check.hardBlocked) {
              const message = check.reason === 'ACCESS_ITEM_REQUIRED'
                ? `SOS Access required for ${def.name}.`
                : check.reason === 'POWER_REQUIRED'
                  ? `Power Tier ${check.requiredPowerTier} required.`
                  : `Cannot enter ${def.name}.`;
              setNotice({ type: 'blocked', message });
              window.setTimeout(() => setNotice(null), 2600);
              return { state: 'idle' };
            }

            const result = enterAXEDungeon(def.id, {
              playerLevel: hud?.level || 1,
              powerTier: power?.powerTier || 0,
            });

            if (!result.ok) {
              setNotice({ type: 'blocked', message: result.reason });
              window.setTimeout(() => setNotice(null), 2600);
              return { state: 'idle' };
            }

            const firstRoom = def.rooms[0];
            window.dispatchEvent(new CustomEvent('playerRespawn', {
              detail: {
                ...firstRoom.runtimePosition,
                spawnId: firstRoom.id,
                source: 'axe-dungeon-enter',
              },
            }));

            setNotice({
              type: 'entered',
              message: check.ok
                ? `Entered ${def.name}.`
                : `Entered ${def.name} below the recommended level.`,
            });
            window.setTimeout(() => setNotice(null), 2600);
            return { state: 'idle' };
          },
        }));
      }

      registered = true;
      window.dispatchEvent(new CustomEvent('axeDungeonLayerReady', {
        detail: { entrances: registeredIds.length, rooms: roomGroups.length },
      }));
    };

    setup();
    timer = window.setInterval(setup, 250);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      const interactions = window.__axeInteractions;
      registeredIds.forEach((id) => interactions?.unregister?.(id));
      [...markerGroups, ...roomGroups].forEach((group) => {
        group.traverse?.((node) => {
          node.geometry?.dispose?.();
          if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
          else node.material?.dispose?.();
        });
        group.parent?.remove(group);
      });
    };
  }, []);

  // Runtime session: room transitions, encounter gates, bosses, exit and rewards.
  useEffect(() => {
    const session = dungeonState.activeSession;
    if (!session) return undefined;

    const dungeon = getAXEDungeonDefinition(session.dungeonId);
    const room = getAXEDungeonRoom(session.dungeonId, session.currentRoomId);
    const interactions = window.__axeInteractions;
    const scene = window.__gw3dScene;
    if (!dungeon || !room || !interactions || !scene) return undefined;

    const ids = [];
    const meshes = [];
    let encounterPoll = 0;
    let bossPoll = 0;
    let bossSeen = false;

    const register = (item) => {
      interactions.register(item);
      ids.push(item.id);
    };

    const goToRoom = (nextRoom) => {
      const leaveCheck = canLeaveCurrentAXEDungeonRoom();
      if (!leaveCheck.ok) {
        setNotice({
          type: 'blocked',
          message: leaveCheck.reason === 'ENCOUNTER_ACTIVE'
            ? 'Defeat the room encounter before moving on.'
            : 'Defeat the dungeon boss before leaving this chamber.',
        });
        window.setTimeout(() => setNotice(null), 2200);
        return;
      }

      const result = enterAXEDungeonRoom(nextRoom.id);
      if (!result.ok) {
        setNotice({
          type: 'blocked',
          message: result.reason === 'ACCESS_ITEM_REQUIRED'
            ? 'SOS Access is required for this special chamber.'
            : result.reason,
        });
        window.setTimeout(() => setNotice(null), 2200);
        return;
      }

      window.dispatchEvent(new CustomEvent('playerRespawn', {
        detail: {
          ...nextRoom.runtimePosition,
          spawnId: nextRoom.id,
          source: 'axe-dungeon-room',
        },
      }));
    };

    (room.nextRoomIds || []).forEach((nextRoomId, index) => {
      const nextRoom = getAXEDungeonRoom(dungeon.id, nextRoomId);
      if (!nextRoom) return;
      const position = doorwayPosition(room, nextRoom, index);
      const gated = !!nextRoom.accessItemId;
      const marker = createDoorMarker(
        scene,
        `AXE_DungeonDoor_${room.id}_${nextRoom.id}`,
        position,
        gated ? 0xf0abfc : 0x67e8f9,
      );
      meshes.push(marker);

      register(createAXEInteractable({
        id: `AXE_Interact_DungeonDoor_${session.sessionId}_${nextRoom.id}`,
        name: nextRoom.name,
        type: 'Enter',
        position,
        range: 3.2,
        priority: gated ? 23 : 22,
        prompt: gated ? `Enter ${nextRoom.name} (SOS Access)` : `Proceed to ${nextRoom.name}`,
        metadata: {
          dungeonId: dungeon.id,
          fromRoomId: room.id,
          toRoomId: nextRoom.id,
          accessItemId: nextRoom.accessItemId || null,
        },
        onInteract: () => {
          goToRoom(nextRoom);
          return { state: 'idle' };
        },
      }));
    });

    const isFirstRoom = dungeon.rooms[0]?.id === room.id;
    if (isFirstRoom) {
      const exitPos = {
        x: room.runtimePosition.x - room.runtimeSize.width * 0.32,
        y: 0,
        z: room.runtimePosition.z,
      };
      meshes.push(createDoorMarker(scene, `AXE_DungeonExit_${dungeon.id}`, exitPos, 0xf59e0b));
      register(createAXEInteractable({
        id: `AXE_Interact_DungeonExit_${session.sessionId}`,
        name: 'Exit Dungeon',
        type: 'Exit',
        position: exitPos,
        range: 3.2,
        priority: 18,
        prompt: 'Exit Dungeon',
        onInteract: () => {
          exitAXEDungeon({ failed: false });
          window.dispatchEvent(new CustomEvent('playerRespawn', {
            detail: {
              ...dungeon.prototypeReturnPosition,
              spawnId: `${dungeon.id}_return`,
              source: 'axe-dungeon-exit',
            },
          }));
          return { state: 'idle' };
        },
      }));
    }

    if (room.encounter && !(session.clearedEncounterRoomIds || []).includes(room.id)) {
      if (!(session.spawnedEncounterRoomIds || []).includes(room.id)) {
        markAXEDungeonRoomEncounterStarted(room.id);
        window.__gw3dSpawnQuestEnemies?.({
          count: room.encounter.count,
          tierName: room.encounter.tierName,
          playerPos: room.runtimePosition,
          metadata: {
            type: 'dungeon-enemy',
            dungeonId: dungeon.id,
            dungeonSessionId: session.sessionId,
            dungeonRoomId: room.id,
          },
        });
      }

      encounterPoll = window.setInterval(() => {
        const enemies = Array.isArray(window.__gw3dEnemies) ? window.__gw3dEnemies : [];
        const tagged = enemies.filter((enemy) =>
          enemy?.metadata?.dungeonSessionId === session.sessionId &&
          enemy?.metadata?.dungeonRoomId === room.id
        );
        if (!tagged.length) return;
        const alive = tagged.some((enemy) => enemy.alive !== false && !enemy.dying && Number(enemy.hp || 0) > 0);
        if (!alive) {
          window.clearInterval(encounterPoll);
          completeAXEDungeonRoomEncounter(room.id);
          setNotice({ type: 'entered', message: `${room.name} cleared.` });
          window.setTimeout(() => setNotice(null), 1800);
        }
      }, 300);
    }

    if (room.bossId && !(session.clearedBossIds || []).includes(room.bossId)) {
      const bossDef = getAXEDungeonBossDefinition(room.bossId);
      if (bossDef && session.activeBossId !== room.bossId) {
        startAXEDungeonBoss(room.bossId);
      }

      const existingBoss = (window.__gw3dBosses || []).find((boss) =>
        boss?.metadata?.dungeonSessionId === session.sessionId &&
        boss?.metadata?.dungeonBossId === room.bossId &&
        boss.alive !== false &&
        !boss.dying
      );

      if (!existingBoss && bossDef) {
        window.__gw3dSpawnAXEDungeonBoss?.({
          bossDef,
          position: {
            x: room.runtimePosition.x + 3,
            y: 0,
            z: room.runtimePosition.z,
          },
          sessionId: session.sessionId,
          roomId: room.id,
        });
      }

      bossPoll = window.setInterval(() => {
        const bosses = Array.isArray(window.__gw3dBosses) ? window.__gw3dBosses : [];
        const matching = bosses.filter((boss) =>
          boss?.metadata?.dungeonSessionId === session.sessionId &&
          boss?.metadata?.dungeonBossId === room.bossId
        );
        if (matching.length) bossSeen = true;
        if (!bossSeen) return;

        const alive = matching.some((boss) =>
          boss.alive !== false &&
          !boss.dying &&
          !boss.defeated &&
          Number(boss.hp || 0) > 0
        );
        if (!alive) {
          window.clearInterval(bossPoll);
          const result = completeAXEDungeonBoss(room.bossId);
          if (result.ok) {
            setNotice({
              type: 'entered',
              message: result.dungeonCompleted
                ? `${bossDef?.name || 'Dungeon boss'} defeated — dungeon clear available.`
                : `${bossDef?.name || 'Dungeon boss'} defeated.`,
            });
            window.setTimeout(() => setNotice(null), 2400);
          }
        }
      }, 300);
    }

    if (session.phase === 'completed' && !session.rewardClaimed) {
      const claimPos = {
        x: room.runtimePosition.x + room.runtimeSize.width * 0.28,
        y: 0,
        z: room.runtimePosition.z,
      };
      meshes.push(createDoorMarker(scene, `AXE_DungeonClear_${dungeon.id}`, claimPos, 0x34d399));
      register(createAXEInteractable({
        id: `AXE_Interact_DungeonClear_${session.sessionId}`,
        name: 'Claim Dungeon Clear',
        type: 'Exit',
        position: claimPos,
        range: 3.5,
        priority: 30,
        prompt: 'Claim Clear Reward & Exit',
        onInteract: () => {
          const result = finalizeAXEDungeonClear();
          if (!result.ok) {
            setNotice({ type: 'blocked', message: result.reason });
            window.setTimeout(() => setNotice(null), 2000);
            return { state: 'idle' };
          }

          awardDungeonClearReward(result.reward);
          setNotice({
            type: 'entered',
            message: `Clear reward: +${result.reward.xp} XP · +${result.reward.contribution} Contribution`,
          });

          window.setTimeout(() => {
            exitAXEDungeon({ failed: false });
            window.dispatchEvent(new CustomEvent('playerRespawn', {
              detail: {
                ...dungeon.prototypeReturnPosition,
                spawnId: `${dungeon.id}_clear_return`,
                source: 'axe-dungeon-clear',
              },
            }));
          }, 700);
          return { state: 'idle' };
        },
      }));
    }

    return () => {
      ids.forEach((id) => interactions.unregister?.(id));
      meshes.forEach((mesh) => {
        mesh.parent?.remove(mesh);
        mesh.geometry?.dispose?.();
        mesh.material?.dispose?.();
      });
      if (encounterPoll) window.clearInterval(encounterPoll);
      if (bossPoll) window.clearInterval(bossPoll);
    };
  }, [
    dungeonState.activeSession?.sessionId,
    dungeonState.activeSession?.currentRoomId,
    dungeonState.activeSession?.phase,
    dungeonState.activeSession?.rewardClaimed,
    dungeonState.activeSession?.clearedEncounterRoomIds?.join('|'),
    dungeonState.activeSession?.clearedBossIds?.join('|'),
  ]);

  const active = dungeonState.activeSession;
  const activeDungeon = active ? getAXEDungeonDefinition(active.dungeonId) : null;
  const activeRoom = active ? getAXEDungeonRoom(active.dungeonId, active.currentRoomId) : null;
  const sosCount = Number(accessState.items?.AXE_Item_SOS_Access ?? getAXEAccessItemCount('AXE_Item_SOS_Access'));

  return (
    <>
      {notice && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-[140] -translate-x-1/2">
          <div className={`rounded-xl border px-4 py-2 text-sm backdrop-blur-xl ${
            notice.type === 'blocked'
              ? 'border-rose-300/30 bg-rose-950/75 text-rose-100'
              : 'border-cyan-300/30 bg-slate-950/80 text-cyan-100'
          }`}>
            {notice.message}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute right-4 top-24 z-[120] rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-[10px] text-white/55 backdrop-blur-lg">
        <div className="uppercase tracking-[0.2em] text-white/35">Dungeon Runtime</div>
        <div className="mt-1">SOS Access: <b className="text-fuchsia-200">{sosCount}</b></div>
        {active && (
          <>
            <div className="mt-1 max-w-[240px] truncate text-cyan-200/80">
              {activeDungeon?.name || active.dungeonId}
            </div>
            <div className="max-w-[240px] truncate text-white/50">
              {activeRoom?.name || active.currentRoomId} · {active.phase}
            </div>
          </>
        )}
      </div>
    </>
  );
}
