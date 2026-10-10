// Character archetypes: one data entry per kind of combatant. Game.spawnArchetype() turns an entry into a Fighter.
// 'reborn' is the Game 2 duel opponent value for value (tests/game2-mission.test.mjs keeps it equal to populateDuel),
// so the mission's Reborn fights exactly like the Multiplayer Dark Jedi.
export const ARCHETYPES = Object.freeze({
  reborn: {
    kind: 'darkjedi', label: 'Reborn', team: 'enemy', hp: 220, tint: [0.12, 0.09, 0.17], tintAmt: 0.66, saber: true, blade: [1, 0.05, 0.04],
    dmgScale: 0.6, blockSkill: 0.55, reaction: 0.7, style: 2,
    force: { npc: true, fp: 100, regen: 7, dmgScale: 0.75, healRate: 18, speedGain: 1.4, protectMul: 0.4 },
  },
  stormtrooper: {
    kind: 'trooper', label: 'Stormtrooper', team: 'enemy', hp: 18, tint: [0.93, 0.94, 0.97], tintAmt: 0.62, saber: false, gun: true,
    brain: { dmg: 7, err: 0.075, burst: 3, rest: [1.4, 2.5], range: [7, 13] },
  },
  officer: {
    kind: 'trooper', label: 'Imperial Officer', team: 'enemy', hp: 34, tint: [0.33, 0.36, 0.31], tintAmt: 0.6, saber: false, gun: true,
    brain: { officer: true, dmg: 9, err: 0.06, burst: 2, gap: 0.18, rest: [1.0, 1.8], range: [8, 15], hear: 11, sight: 26 },
  },
  jan: {
    kind: 'companion', label: 'Jan Ors', team: 'ally', hp: 100, tint: [0.55, 0.40, 0.28], tintAmt: 0.45, saber: false, gun: true, takeMul: 0,
  },
});
