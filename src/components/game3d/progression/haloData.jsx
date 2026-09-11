// TwelveSky2 Halo / CP Reinforcement rules for Mines.
// Verified structural rules:
//   • Bonus Level +0 .. +96.
//   • Every successful bonus level grants +1 STR / AGI / VIT / SPI.
//   • An attempt requires 100 Contribution Points + 1,000,000 Silver.
//   • Outcomes can be success (+1), failure (no change), or de-level (-1).
//   • The visible halo evolves through 12 bands: 1-8, 9-16 ... 89-96.
//
// The exact historical success/de-level probability table is not present in
// the Fenrir seed data we currently import. The probability profile below is
// therefore an explicit Mines tuning preset, isolated here so it can be
// replaced without touching progression/store/UI code when a canonical table
// is recovered.

export const MAX_HALO_LEVEL = 96;
export const HALO_CP_COST = 100;
export const HALO_SILVER_COST = 1_000_000;

export const HALO_TIERS = Object.freeze([
  { id: 'halo_01', label: 'Halo I', minLevel: 1, maxLevel: 8, color: '#e2e8f0', glow: 'rgba(226,232,240,0.28)' },
  { id: 'halo_02', label: 'Halo II', minLevel: 9, maxLevel: 16, color: '#bae6fd', glow: 'rgba(186,230,253,0.30)' },
  { id: 'halo_03', label: 'Halo III', minLevel: 17, maxLevel: 24, color: '#67e8f9', glow: 'rgba(103,232,249,0.32)' },
  { id: 'halo_04', label: 'Halo IV', minLevel: 25, maxLevel: 32, color: '#5eead4', glow: 'rgba(94,234,212,0.34)' },
  { id: 'halo_05', label: 'Halo V', minLevel: 33, maxLevel: 40, color: '#86efac', glow: 'rgba(134,239,172,0.36)' },
  { id: 'halo_06', label: 'Halo VI', minLevel: 41, maxLevel: 48, color: '#fde68a', glow: 'rgba(253,230,138,0.38)' },
  { id: 'halo_07', label: 'Halo VII', minLevel: 49, maxLevel: 56, color: '#fbbf24', glow: 'rgba(251,191,36,0.40)' },
  { id: 'halo_08', label: 'Halo VIII', minLevel: 57, maxLevel: 64, color: '#fdba74', glow: 'rgba(253,186,116,0.42)' },
  { id: 'halo_09', label: 'Halo IX', minLevel: 65, maxLevel: 72, color: '#f9a8d4', glow: 'rgba(249,168,212,0.44)' },
  { id: 'halo_10', label: 'Halo X', minLevel: 73, maxLevel: 80, color: '#d8b4fe', glow: 'rgba(216,180,254,0.46)' },
  { id: 'halo_11', label: 'Halo XI', minLevel: 81, maxLevel: 88, color: '#c4b5fd', glow: 'rgba(196,181,253,0.50)' },
  { id: 'halo_12', label: 'Halo XII', minLevel: 89, maxLevel: 96, color: '#ffffff', glow: 'rgba(255,255,255,0.58)' },
]);

// Current Mines tuning preset only. Replace these rows when an authoritative
// historical probability table is recovered.
export const HALO_OUTCOME_BANDS = Object.freeze([
  { from: 0,  to: 15, success: 0.62, delevelOnFailure: 0.00 },
  { from: 16, to: 31, success: 0.50, delevelOnFailure: 0.05 },
  { from: 32, to: 47, success: 0.40, delevelOnFailure: 0.10 },
  { from: 48, to: 63, success: 0.31, delevelOnFailure: 0.16 },
  { from: 64, to: 79, success: 0.23, delevelOnFailure: 0.22 },
  { from: 80, to: 95, success: 0.16, delevelOnFailure: 0.30 },
]);

export function getHaloOutcomeBand(level) {
  const current = Math.max(0, Math.min(MAX_HALO_LEVEL - 1, Math.floor(Number(level) || 0)));
  return HALO_OUTCOME_BANDS.find((band) => current >= band.from && current <= band.to)
    || HALO_OUTCOME_BANDS[HALO_OUTCOME_BANDS.length - 1];
}

export function getSuccessChanceForLevel(level) {
  if (level >= MAX_HALO_LEVEL) return 0;
  return getHaloOutcomeBand(level).success;
}

export function getDelevelChanceOnFailure(level) {
  if (level <= 0) return 0;
  return getHaloOutcomeBand(level).delevelOnFailure;
}

export function getTierForLevel(level) {
  const current = Math.max(0, Math.min(MAX_HALO_LEVEL, Math.floor(Number(level) || 0)));
  if (current <= 0) {
    return { id: 'halo_00', label: 'No Halo', minLevel: 0, maxLevel: 0, color: '#94a3b8', glow: 'rgba(148,163,184,0.12)' };
  }
  return HALO_TIERS.find((tier) => current >= tier.minLevel && current <= tier.maxLevel)
    || HALO_TIERS[HALO_TIERS.length - 1];
}

export const PER_LEVEL_HALO_BONUSES = Object.freeze({
  strength: 1,
  agility: 1,
  vitality: 1,
  spirit: 1,
});

export const MAX_HALO_BONUSES = Object.freeze({
  strength: MAX_HALO_LEVEL,
  agility: MAX_HALO_LEVEL,
  vitality: MAX_HALO_LEVEL,
  spirit: MAX_HALO_LEVEL,
  dexterity: MAX_HALO_LEVEL,
  constitution: MAX_HALO_LEVEL,
  focus: MAX_HALO_LEVEL,
});

export function getHaloBonusesForLevel(level) {
  const current = Math.max(0, Math.min(MAX_HALO_LEVEL, Math.floor(Number(level) || 0)));
  return {
    strength: current,
    agility: current,
    dexterity: current,
    vitality: current,
    constitution: current,
    spirit: current,
    focus: current,
  };
}

// Compatibility helper for older UI imports.
export function killsRequiredForAttempt() {
  return 0;
}
