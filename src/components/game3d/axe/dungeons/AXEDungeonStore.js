// AXE Prompt 037 — character-scoped dungeon session/progression store.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import {
  getAXEAccessItemCount,
  hasAXEAccessItem,
} from './AXEAccessItemStore';
import {
  getAXEDungeonDefinition,
  getAXEDungeonEntryRequirement,
  getAXEDungeonRoom,
} from './AXEDungeonSystem';

const storage = characterScopedStorage('axe_dungeon_progression_v1');

const starter = () => ({
  discoveredDungeonIds: [],
  clearCounts: {},
  bossClearCounts: {},
  bestClearMs: {},
  activeSession: null,
});

const load = () => {
  try {
    const raw = storage.get();
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...starter(),
        ...parsed,
        discoveredDungeonIds: Array.isArray(parsed.discoveredDungeonIds) ? parsed.discoveredDungeonIds : [],
        clearCounts: parsed.clearCounts || {},
        bossClearCounts: parsed.bossClearCounts || {},
        bestClearMs: parsed.bestClearMs || {},
        // Active runtime sessions do not survive logout/reload by default.
        activeSession: null,
      };
    }
  } catch {}
  return starter();
};

let state = load();
const listeners = new Set();

const emit = () => {
  storage.set(JSON.stringify({
    ...state,
    activeSession: null,
  }));
  const snapshot = getAXEDungeonState();
  listeners.forEach((fn) => fn(snapshot));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeDungeonStateChanged', { detail: snapshot }));
  }
};

subscribeCharacterChange(() => {
  state = load();
  listeners.forEach((fn) => fn(getAXEDungeonState()));
});

const newSessionId = (dungeonId) =>
  `${dungeonId}_session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function getAXEDungeonState() {
  return {
    ...state,
    discoveredDungeonIds: [...state.discoveredDungeonIds],
    clearCounts: { ...state.clearCounts },
    bossClearCounts: { ...state.bossClearCounts },
    bestClearMs: { ...state.bestClearMs },
    activeSession: state.activeSession
      ? {
          ...state.activeSession,
              visitedRoomIds: [...state.activeSession.visitedRoomIds],
          clearedBossIds: [...state.activeSession.clearedBossIds],
          spawnedEncounterRoomIds: [...(state.activeSession.spawnedEncounterRoomIds || [])],
          clearedEncounterRoomIds: [...(state.activeSession.clearedEncounterRoomIds || [])],
          partyMemberIds: [...state.activeSession.partyMemberIds],
        }
      : null,
  };
}

export function subscribeAXEDungeons(fn) {
  listeners.add(fn);
  fn(getAXEDungeonState());
  return () => listeners.delete(fn);
}

export function discoverAXEDungeon(dungeonId) {
  const dungeon = getAXEDungeonDefinition(dungeonId);
  if (!dungeon) return { ok: false, reason: 'DUNGEON_MISSING' };
  if (!state.discoveredDungeonIds.includes(dungeonId)) {
    state = {
      ...state,
      discoveredDungeonIds: [...state.discoveredDungeonIds, dungeonId],
    };
    emit();
  }
  return { ok: true, dungeon };
}

export function canEnterAXEDungeon(dungeonId, {
  powerTier = 0,
  playerLevel = 1,
} = {}) {
  const dungeon = getAXEDungeonDefinition(dungeonId);
  if (!dungeon) return { ok: false, reason: 'DUNGEON_MISSING' };

  // Hard gates must be evaluated BEFORE the soft recommended-level warning.
  // Otherwise a low-level player could accidentally bypass SOS or power access.
  if (Number(powerTier || 0) < Number(dungeon.recommendedPower || 0)) {
    return {
      ok: false,
      reason: 'POWER_REQUIRED',
      requiredPowerTier: dungeon.recommendedPower,
      hardBlocked: true,
    };
  }

  const requirement = getAXEDungeonEntryRequirement(dungeonId);
  if (requirement.accessItemId && !hasAXEAccessItem(requirement.accessItemId)) {
    return {
      ok: false,
      reason: 'ACCESS_ITEM_REQUIRED',
      itemId: requirement.accessItemId,
      itemCount: getAXEAccessItemCount(requirement.accessItemId),
      hardBlocked: true,
    };
  }

  if (Number(playerLevel || 1) < Number(dungeon.recommendedLevel || 1)) {
    return {
      ok: false,
      reason: 'LEVEL_RECOMMENDATION',
      recommendedLevel: dungeon.recommendedLevel,
      hardBlocked: false,
    };
  }

  return { ok: true, dungeon };
}

export function enterAXEDungeon(dungeonId, {
  partyId = null,
  partyMemberIds = [],
  playerLevel = 1,
  powerTier = 0,
  forceRecommendedLevel = false,
} = {}) {
  const check = canEnterAXEDungeon(dungeonId, { playerLevel, powerTier });
  if (!check.ok && (check.hardBlocked || forceRecommendedLevel)) return check;

  const dungeon = getAXEDungeonDefinition(dungeonId);
  if (!dungeon) return { ok: false, reason: 'DUNGEON_MISSING' };

  const firstRoom = dungeon.rooms?.[0] || null;
  state = {
    ...state,
    discoveredDungeonIds: state.discoveredDungeonIds.includes(dungeonId)
      ? state.discoveredDungeonIds
      : [...state.discoveredDungeonIds, dungeonId],
    activeSession: {
      sessionId: newSessionId(dungeonId),
      dungeonId,
      mode: dungeon.mode,
      partyId,
      partyMemberIds: [...new Set(partyMemberIds.filter(Boolean))],
      phase: 'exploring',
      enteredAt: Date.now(),
      currentRoomId: firstRoom?.id || null,
      checkpointRoomId: firstRoom?.checkpoint ? firstRoom.id : null,
      visitedRoomIds: firstRoom ? [firstRoom.id] : [],
      clearedBossIds: [],
      spawnedEncounterRoomIds: [],
      clearedEncounterRoomIds: [],
      failed: false,
      rewardClaimed: false,
    },
  };
  emit();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeDungeonEntered', {
      detail: { ...state.activeSession, dungeon },
    }));
    window.dispatchEvent(new CustomEvent('axeQuestEvent', {
      detail: {
        type: 'cave_entered',
        targetId: dungeon.id,
        dungeonId: dungeon.id,
        count: 1,
      },
    }));
  }

  return { ok: true, session: { ...state.activeSession }, warning: check.ok ? null : check.reason };
}

export function enterAXEDungeonRoom(roomId) {
  const session = state.activeSession;
  if (!session) return { ok: false, reason: 'NO_ACTIVE_DUNGEON' };

  const room = getAXEDungeonRoom(session.dungeonId, roomId);
  if (!room) return { ok: false, reason: 'ROOM_MISSING' };

  const requirement = getAXEDungeonEntryRequirement(session.dungeonId, roomId);
  if (requirement.accessItemId && !hasAXEAccessItem(requirement.accessItemId)) {
    return { ok: false, reason: 'ACCESS_ITEM_REQUIRED', itemId: requirement.accessItemId };
  }

  state = {
    ...state,
    activeSession: {
      ...session,
      currentRoomId: room.id,
      checkpointRoomId: room.checkpoint ? room.id : session.checkpointRoomId,
      visitedRoomIds: [...new Set([...session.visitedRoomIds, room.id])],
      phase: room.type === 'boss'
        ? 'boss_locked'
        : room.encounter
          ? 'encounter'
          : 'exploring',
    },
  };
  emit();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeDungeonRoomEntered', {
      detail: { dungeonId: session.dungeonId, room },
    }));
  }

  return { ok: true, room };
}

export function completeAXEDungeonEncounter(roomId) {
  const session = state.activeSession;
  if (!session) return { ok: false, reason: 'NO_ACTIVE_DUNGEON' };
  const room = getAXEDungeonRoom(session.dungeonId, roomId);
  if (!room) return { ok: false, reason: 'ROOM_MISSING' };

  state = {
    ...state,
    activeSession: {
      ...session,
      clearedEncounterRoomIds: [...new Set([
        ...(session.clearedEncounterRoomIds || []),
        roomId,
      ])],
      phase: room.type === 'boss' ? session.phase : 'exploring',
    },
  };
  emit();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeDungeonEncounterCleared', {
      detail: {
        dungeonId: session.dungeonId,
        roomId,
        sessionId: session.sessionId,
      },
    }));
  }

  return { ok: true, roomId };
}

export function startAXEDungeonBoss(bossId) {
  const session = state.activeSession;
  if (!session) return { ok: false, reason: 'NO_ACTIVE_DUNGEON' };
  const room = getAXEDungeonRoom(session.dungeonId, session.currentRoomId);
  if (!room || room.bossId !== bossId) return { ok: false, reason: 'BOSS_NOT_IN_CURRENT_ROOM' };

  state = {
    ...state,
    activeSession: {
      ...session,
      phase: 'boss_active',
      activeBossId: bossId,
    },
  };
  emit();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeDungeonBossStartRequested', {
      detail: {
        dungeonId: session.dungeonId,
        roomId: room.id,
        bossId,
        sessionId: session.sessionId,
      },
    }));
  }

  return { ok: true, bossId };
}

const isSessionComplete = (session) => {
  const dungeon = getAXEDungeonDefinition(session?.dungeonId);
  if (!dungeon || !session) return false;

  const requiredBossIds = dungeon.completion?.requiredBossIds || [];
  const requiredRoomIds = dungeon.completion?.requiredRoomIds || [];

  return (
    requiredBossIds.every((id) => session.clearedBossIds.includes(id)) &&
    requiredRoomIds.every((id) => session.visitedRoomIds.includes(id))
  );
};

export function completeAXEDungeonBoss(bossId) {
  const session = state.activeSession;
  if (!session) return { ok: false, reason: 'NO_ACTIVE_DUNGEON' };
  if (session.activeBossId && session.activeBossId !== bossId) {
    return { ok: false, reason: 'BOSS_MISMATCH' };
  }

  const clearedBossIds = [...new Set([...session.clearedBossIds, bossId])];
  const nextSession = {
    ...session,
    activeBossId: null,
    clearedBossIds,
    phase: 'exploring',
  };

  state = {
    ...state,
    bossClearCounts: {
      ...state.bossClearCounts,
      [bossId]: Number(state.bossClearCounts[bossId] || 0) + 1,
    },
    activeSession: nextSession,
  };

  if (isSessionComplete(nextSession)) {
    state.activeSession = { ...nextSession, phase: 'completed', completedAt: Date.now() };
  }

  emit();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeDungeonBossDefeated', {
      detail: {
        dungeonId: session.dungeonId,
        bossId,
        sessionId: session.sessionId,
        dungeonCompleted: state.activeSession?.phase === 'completed',
      },
    }));
    window.dispatchEvent(new CustomEvent('axeQuestEvent', {
      detail: { type: 'boss_killed', targetId: bossId, count: 1 },
    }));
  }

  return { ok: true, dungeonCompleted: state.activeSession?.phase === 'completed' };
}

export function finalizeAXEDungeonClear() {
  const session = state.activeSession;
  if (!session) return { ok: false, reason: 'NO_ACTIVE_DUNGEON' };
  if (session.rewardClaimed) return { ok: false, reason: 'REWARD_ALREADY_CLAIMED' };
  if (session.phase !== 'completed') return { ok: false, reason: 'DUNGEON_INCOMPLETE' };
  if (session.rewardClaimed) return { ok: false, reason: 'CLEAR_REWARD_ALREADY_CLAIMED' };

  const dungeon = getAXEDungeonDefinition(session.dungeonId);
  const elapsedMs = Math.max(0, Number(session.completedAt || Date.now()) - Number(session.enteredAt || Date.now()));
  const previousBest = Number(state.bestClearMs[session.dungeonId] || 0);
  const clearCount = Number(state.clearCounts[session.dungeonId] || 0) + 1;
  const firstClear = clearCount === 1;

  state = {
    ...state,
    clearCounts: { ...state.clearCounts, [session.dungeonId]: clearCount },
    bestClearMs: {
      ...state.bestClearMs,
      [session.dungeonId]: previousBest > 0 ? Math.min(previousBest, elapsedMs) : elapsedMs,
    },
    activeSession: {
      ...session,
      rewardClaimed: true,
      rewardClaimedAt: Date.now(),
    },
  };
  emit();

  const reward = {
    xp: firstClear ? Number(dungeon?.rewards?.firstClearXp || 0) : Number(dungeon?.rewards?.repeatClearXp || 0),
    contribution: Number(dungeon?.rewards?.contribution || 0),
    firstClear,
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeDungeonClearReward', {
      detail: {
        dungeonId: session.dungeonId,
        sessionId: session.sessionId,
        elapsedMs,
        clearCount,
        reward,
      },
    }));
  }

  return { ok: true, dungeonId: session.dungeonId, elapsedMs, clearCount, reward };
}

export function exitAXEDungeon({ failed = false } = {}) {
  const session = state.activeSession;
  if (!session) return { ok: false, reason: 'NO_ACTIVE_DUNGEON' };

  state = {
    ...state,
    activeSession: null,
  };
  emit();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeDungeonExited', {
      detail: {
        dungeonId: session.dungeonId,
        sessionId: session.sessionId,
        failed: !!failed,
      },
    }));
  }

  return { ok: true };
}


export function markAXEDungeonRoomEncounterStarted(roomId) {
  const session = state.activeSession;
  if (!session) return { ok: false, reason: 'NO_ACTIVE_DUNGEON' };
  const room = getAXEDungeonRoom(session.dungeonId, roomId);
  if (!room) return { ok: false, reason: 'ROOM_MISSING' };

  state = {
    ...state,
    activeSession: {
      ...session,
      phase: room.type === 'boss' ? 'boss_locked' : 'encounter',
      spawnedEncounterRoomIds: [
        ...new Set([...(session.spawnedEncounterRoomIds || []), roomId]),
      ],
    },
  };
  emit();
  return { ok: true };
}

export function completeAXEDungeonRoomEncounter(roomId) {
  const session = state.activeSession;
  if (!session) return { ok: false, reason: 'NO_ACTIVE_DUNGEON' };
  const room = getAXEDungeonRoom(session.dungeonId, roomId);
  if (!room) return { ok: false, reason: 'ROOM_MISSING' };

  state = {
    ...state,
    activeSession: {
      ...session,
      phase: room.type === 'boss' ? session.phase : 'exploring',
      clearedEncounterRoomIds: [
        ...new Set([...(session.clearedEncounterRoomIds || []), roomId]),
      ],
    },
  };
  emit();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeDungeonEncounterCleared', {
      detail: {
        dungeonId: session.dungeonId,
        roomId,
        sessionId: session.sessionId,
      },
    }));
  }
  return { ok: true };
}

export function isAXEDungeonRoomEncounterCleared(roomId) {
  const session = state.activeSession;
  if (!session) return false;
  const room = getAXEDungeonRoom(session.dungeonId, roomId);
  if (!room) return false;
  if (!room.encounter) return true;
  return (session.clearedEncounterRoomIds || []).includes(roomId);
}

export function canLeaveCurrentAXEDungeonRoom() {
  const session = state.activeSession;
  if (!session) return { ok: false, reason: 'NO_ACTIVE_DUNGEON' };
  const room = getAXEDungeonRoom(session.dungeonId, session.currentRoomId);
  if (!room) return { ok: false, reason: 'ROOM_MISSING' };

  if (room.encounter && !(session.clearedEncounterRoomIds || []).includes(room.id)) {
    return { ok: false, reason: 'ENCOUNTER_ACTIVE', roomId: room.id };
  }

  if (room.bossId && !(session.clearedBossIds || []).includes(room.bossId)) {
    return { ok: false, reason: 'BOSS_ALIVE', bossId: room.bossId };
  }

  return { ok: true, room };
}

export { isAXEDungeonRoomEncounterCleared as isAXEDungeonEncounterCleared };

export function getAXEDungeonReturnPosition() {
  const session = state.activeSession;
  if (!session) return null;
  const dungeon = getAXEDungeonDefinition(session.dungeonId);
  const position = dungeon?.prototypeReturnPosition || dungeon?.prototypeEntryPosition;
  return position ? { ...position } : null;
}

export function getAXEDungeonCheckpointPosition() {
  const session = state.activeSession;
  if (!session) return null;
  const room = getAXEDungeonRoom(
    session.dungeonId,
    session.checkpointRoomId || session.currentRoomId,
  );
  return room?.runtimePosition ? { ...room.runtimePosition } : null;
}

export function failAXEDungeonSession(reason = 'FAILED') {
  const session = state.activeSession;
  if (!session) return { ok: false, reason: 'NO_ACTIVE_DUNGEON' };
  state = {
    ...state,
    activeSession: {
      ...session,
      phase: 'failed',
      failed: true,
      failureReason: reason,
      failedAt: Date.now(),
    },
  };
  emit();
  return { ok: true };
}