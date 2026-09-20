// AXE Prompt 039 — recurring faction wars, central-objective control,
// homeland invasion routes, shield/tower defenses, and PvP progression.
//
// This is AXE-original/data-driven structure inspired by the user's requested
// TwelveSky-style faction-war loop. Exact historical map counts/timers/rewards
// are not treated as legacy facts here; they remain editable AXE balance data.

import { AXE_FACTIONS } from './AXEFactionWeaponConfig';

export const AXE_WAR_CONFIG = Object.freeze({
  cycleMinutes: 60,
  registrationMinutes: 10,
  battleMinutes: 35,
  resolutionMinutes: 5,
  maxPlayersPerFactionPerBracket: 50,
  captureSeconds: 30,
  objectiveTickSeconds: 1,
  homelandAlertCooldownSeconds: 20,
});

export const AXE_WAR_BRACKETS = Object.freeze([
  Object.freeze({ id: 'power_0', label: 'Initiate', minPowerTier: 0, maxPowerTier: 0 }),
  Object.freeze({ id: 'power_1', label: 'Ascendant I', minPowerTier: 1, maxPowerTier: 1 }),
  Object.freeze({ id: 'power_2', label: 'Ascendant II', minPowerTier: 2, maxPowerTier: 2 }),
  Object.freeze({ id: 'power_3_plus', label: 'High Ascendant', minPowerTier: 3, maxPowerTier: 999 }),
]);

export const AXE_WAR_MAPS = Object.freeze([
  Object.freeze({
    id: 'AXE_WarMap_Central',
    name: 'Convergence Field',
    type: 'central_objective',
    routeIndex: 0,
    prototypePosition: Object.freeze({ x: -90, y: 0, z: 110 }),
  }),
  Object.freeze({
    id: 'AXE_WarMap_Invasion1',
    name: 'Outer Warpath',
    type: 'invasion_route',
    routeIndex: 1,
    prototypePosition: Object.freeze({ x: -135, y: 0, z: 125 }),
  }),
  Object.freeze({
    id: 'AXE_WarMap_Invasion2',
    name: 'Shielded Pass',
    type: 'invasion_route',
    routeIndex: 2,
    prototypePosition: Object.freeze({ x: -180, y: 0, z: 140 }),
  }),
  Object.freeze({
    id: 'AXE_WarMap_Invasion3',
    name: 'Inner Defense Line',
    type: 'invasion_route',
    routeIndex: 3,
    prototypePosition: Object.freeze({ x: -225, y: 0, z: 155 }),
  }),
  Object.freeze({
    id: 'AXE_WarMap_Homeland',
    name: 'Faction Homeland',
    type: 'homeland',
    routeIndex: 4,
    prototypePosition: Object.freeze({ x: -270, y: 0, z: 170 }),
  }),
]);

const makeDefense = (id, mapId, type, hp, position) => Object.freeze({
  id,
  mapId,
  type,
  maxHP: hp,
  position: Object.freeze(position),
  rebuildOnWarStart: true,
});

export const AXE_WAR_DEFENSES = Object.freeze([
  makeDefense('AXE_Defense_OuterShieldA', 'AXE_WarMap_Invasion1', 'shield', 25000, { x: -135, y: 0, z: 118 }),
  makeDefense('AXE_Defense_OuterTowerA', 'AXE_WarMap_Invasion1', 'tower', 18000, { x: -142, y: 0, z: 128 }),
  makeDefense('AXE_Defense_PassShieldA', 'AXE_WarMap_Invasion2', 'shield', 35000, { x: -180, y: 0, z: 134 }),
  makeDefense('AXE_Defense_PassTowerA', 'AXE_WarMap_Invasion2', 'tower', 26000, { x: -188, y: 0, z: 145 }),
  makeDefense('AXE_Defense_InnerShieldA', 'AXE_WarMap_Invasion3', 'shield', 50000, { x: -225, y: 0, z: 150 }),
  makeDefense('AXE_Defense_InnerTowerA', 'AXE_WarMap_Invasion3', 'tower', 32000, { x: -232, y: 0, z: 161 }),
  makeDefense('AXE_Defense_HomelandCore', 'AXE_WarMap_Homeland', 'core', 90000, { x: -270, y: 0, z: 170 }),
]);

export const AXE_WAR_REWARDS = Object.freeze({
  participation: Object.freeze({ contribution: 20, warTokens: 2 }),
  centralCapture: Object.freeze({ contribution: 35, warTokens: 4 }),
  defenseDestroyed: Object.freeze({ contribution: 15, warTokens: 2 }),
  homelandBreach: Object.freeze({ contribution: 75, warTokens: 8 }),
  victory: Object.freeze({ contribution: 120, warTokens: 12 }),
});

export function getAXEWarBracket(powerTier = 0) {
  const tier = Math.max(0, Number(powerTier) || 0);
  return AXE_WAR_BRACKETS.find((entry) => tier >= entry.minPowerTier && tier <= entry.maxPowerTier)
    || AXE_WAR_BRACKETS[0];
}

export function getAXEWarCycle(now = Date.now()) {
  const cycleMs = AXE_WAR_CONFIG.cycleMinutes * 60 * 1000;
  const regMs = AXE_WAR_CONFIG.registrationMinutes * 60 * 1000;
  const battleMs = AXE_WAR_CONFIG.battleMinutes * 60 * 1000;
  const resolutionMs = AXE_WAR_CONFIG.resolutionMinutes * 60 * 1000;
  const cycleStart = Math.floor(Number(now) / cycleMs) * cycleMs;
  const elapsed = Number(now) - cycleStart;

  let phase = 'cooldown';
  let phaseEndsAt = cycleStart + cycleMs;
  if (elapsed < regMs) {
    phase = 'registration';
    phaseEndsAt = cycleStart + regMs;
  } else if (elapsed < regMs + battleMs) {
    phase = 'battle';
    phaseEndsAt = cycleStart + regMs + battleMs;
  } else if (elapsed < regMs + battleMs + resolutionMs) {
    phase = 'resolution';
    phaseEndsAt = cycleStart + regMs + battleMs + resolutionMs;
  }

  return {
    cycleId: `axe_war_${cycleStart}`,
    cycleStart,
    cycleEndsAt: cycleStart + cycleMs,
    phase,
    phaseEndsAt,
    remainingMs: Math.max(0, phaseEndsAt - Number(now)),
  };
}

export function createAXEWarDefenseState() {
  return Object.fromEntries(
    AXE_WAR_DEFENSES.map((def) => [def.id, {
      id: def.id,
      mapId: def.mapId,
      type: def.type,
      hp: def.maxHP,
      maxHP: def.maxHP,
      destroyed: false,
    }]),
  );
}

export function getAXEWarMap(mapId) {
  return AXE_WAR_MAPS.find((map) => map.id === mapId) || null;
}

export function getAXEWarDefense(defenseId) {
  return AXE_WAR_DEFENSES.find((def) => def.id === defenseId) || null;
}

export function canAdvanceAXEInvasionTo(routeIndex, defenses = {}) {
  const target = Math.max(1, Number(routeIndex) || 1);
  const priorMaps = AXE_WAR_MAPS.filter((map) =>
    map.routeIndex > 0 && map.routeIndex < target
  );
  return priorMaps.every((map) => {
    const defs = AXE_WAR_DEFENSES.filter((def) => def.mapId === map.id && def.type === 'shield');
    return defs.every((def) => defenses[def.id]?.destroyed);
  });
}

export function getAXEFactionWarTeams() {
  return AXE_FACTIONS.map((faction) => ({
    factionId: faction.id,
    label: faction.displayName,
  }));
}
