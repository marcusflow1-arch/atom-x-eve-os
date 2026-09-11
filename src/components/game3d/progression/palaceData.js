// TwelveSky2 Palace Rank rules.
// Verified structure: Rank 0..96, each successful rank grants +1 STR/AGI/VIT/SPI.
// Each attempt costs 100 CP + 1,000,000 Silver. Failure can reduce rank by 1;
// an Imperial Pardon prevents that decrease. Critical Defense rises by rank band.
// Exact historical success probabilities are not in the imported Fenrir tables,
// so the roll profile remains a clearly isolated Mines tuning preset.

export const MAX_PALACE_RANK = 96;
export const PALACE_CP_COST = 100;
export const PALACE_SILVER_COST = 1_000_000;

const OUTCOME_BANDS = Object.freeze([
  { from: 0, to: 15, success: 0.58 },
  { from: 16, to: 31, success: 0.47 },
  { from: 32, to: 47, success: 0.37 },
  { from: 48, to: 63, success: 0.29 },
  { from: 64, to: 79, success: 0.22 },
  { from: 80, to: 95, success: 0.15 },
]);

export function getPalaceSuccessChance(rank) {
  if (rank >= MAX_PALACE_RANK) return 0;
  const current = Math.max(0, Math.min(95, Math.floor(Number(rank) || 0)));
  return OUTCOME_BANDS.find((band) => current >= band.from && current <= band.to)?.success || 0.15;
}

export function getPalaceCriticalDefense(rank) {
  const current = Math.max(0, Math.min(MAX_PALACE_RANK, Math.floor(Number(rank) || 0)));
  if (current >= 96) return 0.10;
  return Math.floor(current / 10) / 100;
}

export function getPalaceTier(rank) {
  const current = Math.max(0, Math.min(MAX_PALACE_RANK, Math.floor(Number(rank) || 0)));
  if (current <= 0) return 0;
  return Math.min(12, Math.ceil(current / 8));
}

export function getPalaceBonuses(rank) {
  const current = Math.max(0, Math.min(MAX_PALACE_RANK, Math.floor(Number(rank) || 0)));
  return {
    strength: current,
    agility: current,
    dexterity: current,
    vitality: current,
    constitution: current,
    spirit: current,
    focus: current,
    criticalDefense: getPalaceCriticalDefense(current),
  };
}
