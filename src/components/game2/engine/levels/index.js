// Authored arenas for the skirmish modes (arenaMaps.js GAME2_AUTHORED_MAPS lists them in the menu). Add one: write
// levels/<name>.js (a level/kit.js layout with teamHomes, teamYaw and ffaSpawns) and list it here.
import { SKYBRIDGE } from './skybridge.js';

export const AUTHORED_LEVELS = Object.freeze({ skybridge: SKYBRIDGE });
