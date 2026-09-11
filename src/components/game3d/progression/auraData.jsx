// Atom XE Aura progression.
// Aura is an original Atom XE extension, not the TwelveSky2 Halo/CP system.
// Keep its kill-driven progression independent so correcting Halo does not
// silently rewrite this separate feature.

export const MAX_AURA_LEVEL = 100;
export const AURA_ATTEMPT_COST = 10;

const AURA_SUCCESS_BANDS = Object.freeze([
  { from: 0, to: 19, chance: 0.55 },
  { from: 20, to: 39, chance: 0.42 },
  { from: 40, to: 59, chance: 0.30 },
  { from: 60, to: 79, chance: 0.20 },
  { from: 80, to: 99, chance: 0.12 },
]);

export function getAuraSuccessChance(level) {
  if (level >= MAX_AURA_LEVEL) return 0;
  const current = Math.max(0, Math.floor(Number(level) || 0));
  return AURA_SUCCESS_BANDS.find((band) => current >= band.from && current <= band.to)?.chance || 0.12;
}

// Aura stays intentionally lightweight: one virtual point in each of the four
// active character stats every five aura levels. No fabricated TwelveSky crit
// bonuses are attached to it.
export function getAuraBonusesForLevel(level) {
  const current = Math.max(0, Math.min(MAX_AURA_LEVEL, Math.floor(Number(level) || 0)));
  const points = Math.floor(current / 5);
  return {
    strength: points,
    agility: points,
    dexterity: points,
    vitality: points,
    constitution: points,
    spirit: points,
    focus: points,
  };
}

export const AURA_TIERS = Object.freeze([
  { id: 'flicker', label: 'Flicker', minLevel: 1, color: '#bae6fd', glow: 'rgba(186,230,253,0.24)', auraDesc: 'A faint outline around the character.' },
  { id: 'flow', label: 'Flow', minLevel: 21, color: '#67e8f9', glow: 'rgba(103,232,249,0.28)', auraDesc: 'A stable energy outline.' },
  { id: 'flare', label: 'Flare', minLevel: 41, color: '#5eead4', glow: 'rgba(94,234,212,0.32)', auraDesc: 'A brighter flowing aura.' },
  { id: 'radiant', label: 'Radiant', minLevel: 61, color: '#fde68a', glow: 'rgba(253,230,138,0.36)', auraDesc: 'A radiant body-wide energy layer.' },
  { id: 'ascendant', label: 'Ascendant', minLevel: 81, color: '#c4b5fd', glow: 'rgba(196,181,253,0.42)', auraDesc: 'A dense high-level energy field.' },
]);

export function getAuraTierForLevel(level) {
  const current = Math.max(0, Math.min(MAX_AURA_LEVEL, Math.floor(Number(level) || 0)));
  let tier = AURA_TIERS[0];
  for (const candidate of AURA_TIERS) if (current >= candidate.minLevel) tier = candidate;
  return tier;
}
