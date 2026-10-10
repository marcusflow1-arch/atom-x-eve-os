// Brain registry: Fighter.kind -> per-step AI function (g, fighter, dt). The original Game 2 brains are registered
// unchanged; missions add their own kinds here instead of growing an if-chain in game.js.
import { aiDroid, aiDuelist, aiAlly } from '../ai.js';
import { aiDarkJedi } from '../darkjedi.js';
import { aiTrooper } from './trooper.js';
import { aiCompanion } from './companion.js';

export const BRAINS = Object.freeze({
  droid: aiDroid, duelist: aiDuelist, darkjedi: aiDarkJedi, ally: aiAlly,
  trooper: aiTrooper, companion: aiCompanion,
});
