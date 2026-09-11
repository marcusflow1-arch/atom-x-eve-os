// Classic-inspired Elixir preset selected for Mines.
// The current live wiki documents a later 200 + 200 expansion model. Mines
// intentionally uses the earlier-feeling 100 standard -> 200 over-elixir path
// requested for this project, with the full Vanity set extending the cap +50.
// Per-dose stat effects are taken from TwelveSky2 reference data.

export const STANDARD_ELIXIR_CAP = 100;
export const OVER_ELIXIR_CAP = 200;
export const VANITY_ELIXIR_BONUS = 50;
export const VANITY_SET_PIECES = 5;

export const ELIXIR_TYPES = Object.freeze([
  { id: 'strength', label: 'STR', name: 'Strength Elixir', effect: '+3 ATK per dose', perDose: { damage: 3 } },
  { id: 'agility', label: 'AGI', name: 'Agility Elixir', effect: '+2 HIT / +2 Dodge per dose', perDose: { attackSuccess: 2, attackBlock: 2 } },
  { id: 'vitality', label: 'VIT', name: 'Vitality Elixir', effect: '+20 HP per dose', perDose: { hp: 20 } },
  { id: 'spirit', label: 'SPI', name: 'Spirit Elixir', effect: '+25 Chi per dose', perDose: { chi: 25 } },
  { id: 'attributionAttack', label: 'A.ATK', name: 'Attribution ATK Elixir', effect: '+10 Attribution ATK per dose', perDose: { attributionAttack: 10 } },
  { id: 'attributionDefense', label: 'A.DEF', name: 'Attribution DEF Elixir', effect: '+10 Attribution DEF per dose', perDose: { attributionDefense: 10 } },
]);

export function getElixirType(id) { return ELIXIR_TYPES.find((type) => type.id === id) || null; }
export function getElixirCap(vanityPieces = 0) {
  return OVER_ELIXIR_CAP + (vanityPieces >= VANITY_SET_PIECES ? VANITY_ELIXIR_BONUS : 0);
}

export function getElixirPhase(count) {
  if (count < STANDARD_ELIXIR_CAP) return 'standard';
  if (count < OVER_ELIXIR_CAP) return 'over';
  return 'vanity';
}
