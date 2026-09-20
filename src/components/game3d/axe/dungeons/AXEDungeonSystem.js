// AXE Prompt 037 — cave / dungeon / boss / SOS-access definitions.
// Open exploration caves coexist with specially-gated wings. Runtime positions
// are temporary browser-Game3D blockout coordinates, not final map geometry.

export const AXE_DUNGEON_INSTANCE_MODES = Object.freeze({
  OPEN_WORLD: 'open_world',
  PARTY_INSTANCE: 'party_instance',
  SOLO_INSTANCE: 'solo_instance',
});

export const AXE_DUNGEON_PHASES = Object.freeze([
  'idle',
  'entering',
  'exploring',
  'encounter',
  'boss_locked',
  'boss_active',
  'completed',
  'failed',
  'exiting',
]);

const freezeRoom = (room) => Object.freeze({
  type: 'exploration',
  checkpoint: false,
  accessItemId: null,
  bossId: null,
  runtimePosition: Object.freeze({ x: 0, y: 0, z: 0 }),
  runtimeSize: Object.freeze({ width: 28, depth: 24, height: 6 }),
  encounter: null,
  ...room,
  runtimePosition: Object.freeze({ ...(room.runtimePosition || { x: 0, y: 0, z: 0 }) }),
  runtimeSize: Object.freeze({ ...(room.runtimeSize || { width: 28, depth: 24, height: 6 }) }),
  encounter: room.encounter ? Object.freeze({ ...room.encounter }) : null,
});

export const AXE_DUNGEON_DEFINITIONS = Object.freeze({
  AXE_Dungeon_StoneVein: Object.freeze({
    id: 'AXE_Dungeon_StoneVein',
    name: 'Stone Vein Caverns',
    regionId: 'AXE_Region_CaveReserve',
    entrancePOIId: 'AXE_POI_CaveEntrance',
    mode: AXE_DUNGEON_INSTANCE_MODES.OPEN_WORLD,
    recommendedLevel: 1,
    recommendedPower: 0,
    entryAccessItemId: null,
    entryPosition: Object.freeze({ x: 650, y: 0, z: -500 }),
    prototypeEntryPosition: Object.freeze({ x: 24, y: 0, z: -10 }),
    prototypeReturnPosition: Object.freeze({ x: 22, y: 0, z: -10 }),
    interiorOrigin: Object.freeze({ x: 6000, y: 0, z: -6000 }),
    rooms: Object.freeze([
      freezeRoom({
        id: 'AXE_Dungeon_StoneVein_Entry',
        name: 'Weathered Mouth',
        type: 'exploration',
        checkpoint: true,
        runtimePosition: { x: 6000, y: 0, z: -6000 },
        nextRoomIds: Object.freeze(['AXE_Dungeon_StoneVein_Forks']),
      }),
      freezeRoom({
        id: 'AXE_Dungeon_StoneVein_Forks',
        name: 'Three-Way Fork',
        type: 'combat',
        runtimePosition: { x: 6042, y: 0, z: -6000 },
        runtimeSize: { width: 34, depth: 28, height: 7 },
        encounter: { count: 4, tierName: 'normal' },
        nextRoomIds: Object.freeze([
          'AXE_Dungeon_StoneVein_DeepChamber',
          'AXE_Dungeon_StoneVein_SOSVault',
        ]),
      }),
      freezeRoom({
        id: 'AXE_Dungeon_StoneVein_DeepChamber',
        name: 'Deep Chamber',
        type: 'boss',
        bossId: 'AXE_Boss_CavernWarden',
        checkpoint: true,
        runtimePosition: { x: 6086, y: 0, z: -6000 },
        runtimeSize: { width: 38, depth: 34, height: 9 },
        nextRoomIds: Object.freeze([]),
      }),
      freezeRoom({
        id: 'AXE_Dungeon_StoneVein_SOSVault',
        name: 'SOS Vault',
        type: 'special',
        accessItemId: 'AXE_Item_SOS_Access',
        checkpoint: true,
        runtimePosition: { x: 6042, y: 0, z: -6042 },
        runtimeSize: { width: 28, depth: 28, height: 7 },
        encounter: { count: 2, tierName: 'elite' },
        nextRoomIds: Object.freeze(['AXE_Dungeon_StoneVein_Forks']),
      }),
    ]),
    completion: Object.freeze({
      requiredBossIds: Object.freeze(['AXE_Boss_CavernWarden']),
      requiredRoomIds: Object.freeze(['AXE_Dungeon_StoneVein_DeepChamber']),
    }),
    rewards: Object.freeze({
      firstClearXp: 500,
      repeatClearXp: 150,
      contribution: 25,
    }),
  }),

  AXE_Dungeon_SealedSanctum: Object.freeze({
    id: 'AXE_Dungeon_SealedSanctum',
    name: 'Sealed Sanctum',
    regionId: 'AXE_Region_CaveReserve',
    entrancePOIId: 'AXE_POI_CaveEntrance',
    mode: AXE_DUNGEON_INSTANCE_MODES.PARTY_INSTANCE,
    recommendedLevel: 10,
    recommendedPower: 1,
    entryAccessItemId: 'AXE_Item_SOS_Access',
    entryPosition: Object.freeze({ x: 690, y: 0, z: -540 }),
    prototypeEntryPosition: Object.freeze({ x: 28, y: 0, z: -10 }),
    prototypeReturnPosition: Object.freeze({ x: 30, y: 0, z: -10 }),
    interiorOrigin: Object.freeze({ x: 6400, y: 0, z: -6000 }),
    rooms: Object.freeze([
      freezeRoom({
        id: 'AXE_Dungeon_SealedSanctum_Threshold',
        name: 'Sealed Threshold',
        checkpoint: true,
        runtimePosition: { x: 6400, y: 0, z: -6000 },
        nextRoomIds: Object.freeze(['AXE_Dungeon_SealedSanctum_Gauntlet']),
      }),
      freezeRoom({
        id: 'AXE_Dungeon_SealedSanctum_Gauntlet',
        name: 'Sanctum Gauntlet',
        type: 'combat',
        runtimePosition: { x: 6446, y: 0, z: -6000 },
        runtimeSize: { width: 38, depth: 30, height: 8 },
        encounter: { count: 6, tierName: 'elite' },
        nextRoomIds: Object.freeze(['AXE_Dungeon_SealedSanctum_Core']),
      }),
      freezeRoom({
        id: 'AXE_Dungeon_SealedSanctum_Core',
        name: 'Sanctum Core',
        type: 'boss',
        bossId: 'AXE_Boss_SealedGuardian',
        checkpoint: true,
        runtimePosition: { x: 6494, y: 0, z: -6000 },
        runtimeSize: { width: 44, depth: 38, height: 10 },
        nextRoomIds: Object.freeze([]),
      }),
    ]),
    completion: Object.freeze({
      requiredBossIds: Object.freeze(['AXE_Boss_SealedGuardian']),
      requiredRoomIds: Object.freeze(['AXE_Dungeon_SealedSanctum_Core']),
    }),
    rewards: Object.freeze({
      firstClearXp: 1200,
      repeatClearXp: 350,
      contribution: 60,
    }),
  }),
});

export const AXE_DUNGEON_BOSSES = Object.freeze({
  AXE_Boss_CavernWarden: Object.freeze({
    id: 'AXE_Boss_CavernWarden',
    name: 'Cavern Warden',
    title: 'Keeper of the Stone Vein',
    dungeonId: 'AXE_Dungeon_StoneVein',
    roomId: 'AXE_Dungeon_StoneVein_DeepChamber',
    level: 8,
    hpScale: 8,
    damageScale: 1.8,
    defenseScale: 1.4,
    encounterProfile: 'melee-control',
    respawnMode: 'session',
    color: 0x8b5cf6,
    speed: 1.4,
  }),
  AXE_Boss_SealedGuardian: Object.freeze({
    id: 'AXE_Boss_SealedGuardian',
    name: 'Sealed Guardian',
    title: 'Voice Beneath the Sanctum',
    dungeonId: 'AXE_Dungeon_SealedSanctum',
    roomId: 'AXE_Dungeon_SealedSanctum_Core',
    level: 20,
    hpScale: 18,
    damageScale: 2.6,
    defenseScale: 2,
    encounterProfile: 'multi-phase',
    respawnMode: 'session',
    color: 0xec4899,
    speed: 1.7,
  }),
});

export function getAXEDungeonDefinition(dungeonId) {
  return AXE_DUNGEON_DEFINITIONS[dungeonId] || null;
}

export function getAXEDungeonBossDefinition(bossId) {
  return AXE_DUNGEON_BOSSES[bossId] || null;
}

export function getAXEDungeonRoom(dungeonId, roomId) {
  const dungeon = getAXEDungeonDefinition(dungeonId);
  return dungeon?.rooms?.find((room) => room.id === roomId) || null;
}

export function getAXEDungeonRoomIndex(dungeonId, roomId) {
  const dungeon = getAXEDungeonDefinition(dungeonId);
  return Math.max(-1, dungeon?.rooms?.findIndex((room) => room.id === roomId) ?? -1);
}

export function getAXEDungeonEntryRequirement(dungeonId, roomId = null) {
  const dungeon = getAXEDungeonDefinition(dungeonId);
  if (!dungeon) return { ok: false, reason: 'DUNGEON_MISSING' };
  const room = roomId ? getAXEDungeonRoom(dungeonId, roomId) : null;
  const accessItemId = room?.accessItemId || dungeon.entryAccessItemId || null;
  return {
    ok: true,
    accessItemId,
    gated: !!accessItemId,
    dungeon,
    room,
  };
}

export function getAXEDungeonPrototypeEntrances() {
  return Object.values(AXE_DUNGEON_DEFINITIONS).map((dungeon) => ({
    dungeonId: dungeon.id,
    name: dungeon.name,
    position: { ...dungeon.prototypeEntryPosition },
    accessItemId: dungeon.entryAccessItemId || null,
  }));
}
