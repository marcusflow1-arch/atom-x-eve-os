// AXE Prompt 039 — character-scoped faction-war participation/progression.
// Shared war-state mutation uses an authority gateway when available; local
// state is a prototype fallback for the browser Game3D track.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import { getActiveCharacter } from '../../characterStore';
import { addContribution } from '../../progression/contributionStore';
import {
  AXE_WAR_REWARDS,
  createAXEWarDefenseState,
  getAXEWarBracket,
  getAXEWarCycle,
  getAXEWarDefense,
} from './AXEFactionWarSystem';

const storage = characterScopedStorage('axe_faction_war_progression_v1');

const starter = () => ({
  joinedCycleId: null,
  joinedFactionId: null,
  bracketId: null,
  lifetimeKills: 0,
  lifetimeCaptures: 0,
  lifetimeDefensesDestroyed: 0,
  lifetimeHomelandBreaches: 0,
  warTokens: 0,
  wins: 0,
  losses: 0,
  participationCycles: [],
});

const load = () => {
  try {
    const raw = storage.get();
    if (raw) return { ...starter(), ...JSON.parse(raw) };
  } catch {}
  return starter();
};

let state = load();
const listeners = new Set();

let sharedPrototype = {
  cycleId: null,
  centralOwnerFactionId: null,
  centralCaptureProgress: {},
  factionScores: {},
  defenses: createAXEWarDefenseState(),
  homelandBreachedByFactionId: null,
};

const emit = () => {
  storage.set(JSON.stringify(state));
  const snapshot = getAXEFactionWarState();
  listeners.forEach((fn) => fn(snapshot));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeFactionWarChanged', { detail: snapshot }));
  }
};

subscribeCharacterChange(() => {
  state = load();
  listeners.forEach((fn) => fn(getAXEFactionWarState()));
});

const ensureSharedCycle = (cycleId) => {
  if (sharedPrototype.cycleId === cycleId) return;
  sharedPrototype = {
    cycleId,
    centralOwnerFactionId: null,
    centralCaptureProgress: {},
    factionScores: {},
    defenses: createAXEWarDefenseState(),
    homelandBreachedByFactionId: null,
  };
};

const grantReward = (reward) => {
  const contribution = Math.max(0, Number(reward?.contribution || 0));
  const warTokens = Math.max(0, Number(reward?.warTokens || 0));
  if (contribution > 0) addContribution(contribution);
  state = { ...state, warTokens: Number(state.warTokens || 0) + warTokens };
  return { contribution, warTokens };
};

export function getAXEFactionWarState(now = Date.now()) {
  const cycle = getAXEWarCycle(now);
  ensureSharedCycle(cycle.cycleId);
  return {
    player: { ...state, participationCycles: [...state.participationCycles] },
    cycle,
    shared: {
      ...sharedPrototype,
      centralCaptureProgress: { ...sharedPrototype.centralCaptureProgress },
      factionScores: { ...sharedPrototype.factionScores },
      defenses: Object.fromEntries(
        Object.entries(sharedPrototype.defenses).map(([id, def]) => [id, { ...def }]),
      ),
    },
  };
}

export function subscribeAXEFactionWar(fn) {
  listeners.add(fn);
  fn(getAXEFactionWarState());
  return () => listeners.delete(fn);
}

export async function joinAXEFactionWar({
  powerTier = 0,
  now = Date.now(),
} = {}) {
  const character = getActiveCharacter();
  const factionId = character?.factionId;
  if (!factionId || factionId === 'AXE_Faction_Unassigned') {
    return { ok: false, reason: 'FACTION_REQUIRED' };
  }

  const cycle = getAXEWarCycle(now);
  if (!['registration', 'battle'].includes(cycle.phase)) {
    return { ok: false, reason: 'WAR_NOT_OPEN', phase: cycle.phase };
  }

  const bracket = getAXEWarBracket(powerTier);

  if (typeof window !== 'undefined' && typeof window.__axeAuthoritativeWarRequest === 'function') {
    const remote = await window.__axeAuthoritativeWarRequest({
      action: 'join',
      cycleId: cycle.cycleId,
      factionId,
      bracketId: bracket.id,
    });
    if (!remote?.ok) return remote || { ok: false, reason: 'AUTHORITY_REJECTED' };
  }

  state = {
    ...state,
    joinedCycleId: cycle.cycleId,
    joinedFactionId: factionId,
    bracketId: bracket.id,
    participationCycles: [...new Set([...state.participationCycles, cycle.cycleId])].slice(-100),
  };
  grantReward(AXE_WAR_REWARDS.participation);
  emit();
  return { ok: true, cycleId: cycle.cycleId, factionId, bracketId: bracket.id };
}

export function registerAXEWarKill({
  victimFactionId = null,
  cycleId = null,
} = {}) {
  const cycle = getAXEWarCycle();
  if (cycle.phase !== 'battle') return { ok: false, reason: 'WAR_NOT_ACTIVE' };
  if (state.joinedCycleId !== cycle.cycleId) return { ok: false, reason: 'NOT_JOINED' };
  if (cycleId && cycleId !== cycle.cycleId) return { ok: false, reason: 'CYCLE_MISMATCH' };
  if (victimFactionId && victimFactionId === state.joinedFactionId) {
    return { ok: false, reason: 'FRIENDLY_FIRE' };
  }

  state = { ...state, lifetimeKills: Number(state.lifetimeKills || 0) + 1 };
  sharedPrototype.factionScores[state.joinedFactionId] =
    Number(sharedPrototype.factionScores[state.joinedFactionId] || 0) + 1;
  emit();
  return { ok: true };
}

export function tickAXECentralCapture({
  factionId,
  deltaSeconds = 1,
  contested = false,
} = {}) {
  const cycle = getAXEWarCycle();
  if (cycle.phase !== 'battle') return { ok: false, reason: 'WAR_NOT_ACTIVE' };
  if (!factionId || contested) return { ok: false, reason: contested ? 'CONTESTED' : 'FACTION_REQUIRED' };

  ensureSharedCycle(cycle.cycleId);
  const current = Number(sharedPrototype.centralCaptureProgress[factionId] || 0);
  const next = current + Math.max(0, Number(deltaSeconds) || 0);
  sharedPrototype.centralCaptureProgress = {
    ...sharedPrototype.centralCaptureProgress,
    [factionId]: next,
  };

  if (next >= 30 && sharedPrototype.centralOwnerFactionId !== factionId) {
    sharedPrototype.centralOwnerFactionId = factionId;
    sharedPrototype.centralCaptureProgress = { [factionId]: 30 };
    if (state.joinedFactionId === factionId) {
      state = {
        ...state,
        lifetimeCaptures: Number(state.lifetimeCaptures || 0) + 1,
      };
      grantReward(AXE_WAR_REWARDS.centralCapture);
    }
    sharedPrototype.factionScores[factionId] =
      Number(sharedPrototype.factionScores[factionId] || 0) + 25;
    emit();
    return { ok: true, captured: true, factionId };
  }

  emit();
  return { ok: true, captured: false, progress: next };
}

export function damageAXEWarDefense(defenseId, damage, attackingFactionId) {
  const cycle = getAXEWarCycle();
  if (cycle.phase !== 'battle') return { ok: false, reason: 'WAR_NOT_ACTIVE' };
  const def = sharedPrototype.defenses[defenseId];
  const defConfig = getAXEWarDefense(defenseId);
  if (!def || !defConfig) return { ok: false, reason: 'DEFENSE_MISSING' };
  if (def.destroyed) return { ok: false, reason: 'ALREADY_DESTROYED' };

  const nextHP = Math.max(0, Number(def.hp || 0) - Math.max(0, Number(damage) || 0));
  const destroyed = nextHP <= 0;
  sharedPrototype.defenses = {
    ...sharedPrototype.defenses,
    [defenseId]: { ...def, hp: nextHP, destroyed },
  };

  if (destroyed && attackingFactionId) {
    sharedPrototype.factionScores[attackingFactionId] =
      Number(sharedPrototype.factionScores[attackingFactionId] || 0) + 10;
    if (state.joinedFactionId === attackingFactionId) {
      state = {
        ...state,
        lifetimeDefensesDestroyed: Number(state.lifetimeDefensesDestroyed || 0) + 1,
      };
      grantReward(AXE_WAR_REWARDS.defenseDestroyed);
    }
    if (defConfig.type === 'core') {
      sharedPrototype.homelandBreachedByFactionId = attackingFactionId;
      if (state.joinedFactionId === attackingFactionId) {
        state = {
          ...state,
          lifetimeHomelandBreaches: Number(state.lifetimeHomelandBreaches || 0) + 1,
        };
        grantReward(AXE_WAR_REWARDS.homelandBreach);
      }
    }
  }

  emit();
  return { ok: true, hp: nextHP, destroyed, defense: sharedPrototype.defenses[defenseId] };
}

export function resolveAXEFactionWar({ winningFactionId = null } = {}) {
  const cycle = getAXEWarCycle();
  if (!['resolution', 'cooldown'].includes(cycle.phase)) {
    return { ok: false, reason: 'WAR_NOT_RESOLVING' };
  }
  if (state.joinedCycleId !== cycle.cycleId) return { ok: false, reason: 'NOT_JOINED' };

  const winner = winningFactionId || Object.entries(sharedPrototype.factionScores)
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))[0]?.[0] || null;

  const won = !!winner && winner === state.joinedFactionId;
  state = {
    ...state,
    wins: Number(state.wins || 0) + (won ? 1 : 0),
    losses: Number(state.losses || 0) + (!won ? 1 : 0),
  };
  if (won) grantReward(AXE_WAR_REWARDS.victory);
  emit();
  return { ok: true, winnerFactionId: winner, won };
}
