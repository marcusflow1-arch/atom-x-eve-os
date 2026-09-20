// AXE Prompt 037 — cave / dungeon / boss / SOS-access definitions.
// This layer keeps dungeon structure data-driven and separate from the render
// implementation. Open exploration caves coexist with specially-gated wings.

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
  ...room,
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
    exitPosition: Object.freeze({ x: 650, y: 0, z: -485 }),
    rooms: Object.freeze([
      freezeRoom({
        id: 'AXE_Dungeon_StoneVein_Entry',
        name: 'Weathered Mouth',
        type: 'exploration',
        checkpoint: true,
      }),
      freezeRoom({
        id: 'AXE_Dungeon_StoneVein_Forks',
        name: 'Three-Way Fork',
        type: 'combat',
      }),
      freezeRoom({
        id: 'AXE_Dungeon_StoneVein_DeepChamber',
        name: 'Deep Chamber',
        type: 'boss',
        bossId: 'AXE_Boss_CavernWarden',
        checkpoint: true,
      }),
      freezeRoom({
        id: 'AXE_Dungeon_StoneVein_SOSVault',
        name: 'SOS Vault',
        type: 'special',
        accessItemId: 'AXE_Item_SOS_Access',
        checkpoint: true,
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
    exitPosition: Object.freeze({ x: 650, y: 0, z: -485 }),
    rooms: Object.freeze([
      freezeRoom({
        id: 'AXE_Dungeon_SealedSanctum_Threshold',
        name: 'Sealed Threshold',
        checkpoint: true,
      }),
      freezeRoom({
        id: 'AXE_Dungeon_SealedSanctum_Gauntlet',
        name: 'Sanctum Gauntlet',
        type: 'combat',
      }),
      freezeRoom({
        id: 'AXE_Dungeon_SealedSanctum_Core',
        name: 'Sanctum Core',
        type: 'boss',
        bossId: 'AXE_Boss_SealedGuardian',
        checkpoint: true,
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
