// Single-player mission registry. Add a mission: write missions/<name>.js (layout + groups + objectives) and list it here.
import { KEJIM_POST } from './kejimPost.js';

export const MISSIONS = Object.freeze({ kejim: KEJIM_POST });
export const MISSION_ORDER = ['kejim'];
