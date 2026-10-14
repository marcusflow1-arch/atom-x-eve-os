// Skybridge Citadel: the large authored arena for Capture the Flag, Team Deathmatch, Free for All and Sudden Death.
// Original geometry. Two fortress platforms (Blue west, Red east) and a central island hang over a bottomless chasm.
// Each side has a permanent stone bridge in the middle lane and two energy bridges (north and south lanes). A console
// at either end of an energy bridge switches it off: it flickers for a moment, drops for 10 s, then reforms, and
// anyone on it falls to their death (credited to whoever cut the power, pushed or pulled them).
//
// Floor plan (metres, +X east, +Z north; every walkable floor at y = 0):
//   blue fortress  x -64..-36  z -26..26      chasm  x -36..-14      centre island  x -14..14  z -16..16
//   red fortress   x  36..64   z -26..26      chasm  x  14..36
//   stone bridges  z  -2..2 (both chasms)     energy bridges  z 11..14.5 (north) and z -14.5..-11 (south)
import { layoutKit } from '../level/kit.js';

const DEEP = -34;         // how far the platforms and bridge piers reach down into the abyss (render + side walls)
export const SKYBRIDGE_KILL_Y = -9;

// energy bridges: id -> span; consoles sit beside each end, on the platform side away from the bridge
const SPANS = [
  { id: 'wn', label: 'north-west', x0: -36, x1: -14, z0: 11, z1: 14.5 },
  { id: 'ws', label: 'south-west', x0: -36, x1: -14, z0: -14.5, z1: -11 },
  { id: 'en', label: 'north-east', x0: 14, x1: 36, z0: 11, z1: 14.5 },
  { id: 'es', label: 'south-east', x0: 14, x1: 36, z0: -14.5, z1: -11 },
];

function layout() {
  const k = layoutKit('skybridge_citadel', 2187);
  const L = k.L;
  L.navBounds = [-65, -27, 65, 27];
  L.killY = SKYBRIDGE_KILL_Y;
  L.playerSpawn = [-50, 0, 0]; L.playerYaw = Math.PI / 2;
  L.env = { sunDir: [0.42, 0.62, -0.38], sunCol: [0.98, 0.84, 0.72], ambTop: [0.48, 0.52, 0.72], ambBot: [0.17, 0.15, 0.21], fogCol: [0.08, 0.09, 0.17], fogD: 0.0095 };
  L.bridges = SPANS.map(s => ({ ...s, y: 0 }));
  L.teamHomes = { blue: [-55, 0.3, 0], red: [55, 0.3, 0] };
  L.teamYaw = { blue: Math.PI / 2, red: -Math.PI / 2 };

  // ---------- the two fortresses (mirror images: s = -1 Blue in the west, s = +1 Red in the east)
  for (const s of [-1, 1]) {
    const glow = s < 0 ? 'blue' : 'red';
    // u runs from the chasm edge (36) to the back wall (64); x = s * u
    const box = (u0, y0, z0, u1, y1, z1, mat, walk) => k.solid([Math.min(s * u0, s * u1), y0, z0], [Math.max(s * u0, s * u1), y1, z1], mat, walk);
    const deco = (u0, y0, z0, u1, y1, z1, mat) => k.deco([Math.min(s * u0, s * u1), y0, z0], [Math.max(s * u0, s * u1), y1, z1], mat);
    box(36, DEEP, -26, 64, 0, 26, 'rockDark');                                         // the platform
    deco(36.4, 0, -25.6, 63.6, 0.02, 25.6, 'floor');
    deco(36, 0, -26, 36.25, 0.05, 26, glow);                                            // the chasm edge glows in team colour
    for (const z of [-26, 25.75]) deco(36, 0, z, 46, 0.05, z + 0.25, glow);
    box(63, 0, -26, 64, 10, 26, 'metal');                                               // back wall + battlements
    for (let z = -25; z < 25; z += 4) deco(63, 10, z, 64, 11, z + 2, 'metal');
    box(46, 0, 25, 63, 7, 26, 'metal'); box(46, 0, -26, 63, 7, -25, 'metal');          // side walls (the front corners stay open)
    for (const z of [-26, 25]) for (let u = 47; u < 62; u += 4) deco(u, 7, z, u + 2, 7.8, z + 1, 'metal');
    box(59.5, 0, -7, 63, 12, 7, 'hull');                                                // the keep behind the flag
    deco(59.4, 7, -5, 59.5, 7.3, 5, glow); deco(59.4, 9.5, -5, 59.5, 9.8, 5, glow);
    box(52, 0, -4, 58, 0.3, 4, 'pad');                                                  // flag dais
    deco(51.8, 0, -4.2, 58.2, 0.34, -4, glow); deco(51.8, 0, 4, 58.2, 0.34, 4.2, glow);
    deco(51.8, 0, -4, 52, 0.34, 4, glow); deco(58, 0, -4, 58.2, 0.34, 4, glow);
    for (const z of [-8.4, 7]) { box(47, 0, z, 48.4, 6, z + 1.4, 'metal'); deco(46.8, 6, z - 0.2, 48.6, 6.3, z + 1.6, 'metalDark'); } // pillars
    for (const z of [14, -19]) box(42, 0, z, 43, 1.2, z + 5, 'metalDark');              // low cover walls
    for (const z of [-6, 3.5]) box(39, 0, z, 40, 1.2, z + 2.5, 'metalDark');            // barricades at the stone bridge head
    box(49, 0, 17, 50.6, 1.6, 18.6, 'crate'); box(50.6, 0, 17, 52.2, 1.6, 18.6, 'crate'); box(49, 1.6, 17, 50.6, 3.2, 18.6, 'crate');
    box(49, 0, -18.6, 50.6, 1.6, -17, 'crate'); box(53, 0, -21, 54.6, 1.6, -19.4, 'crate');
    for (const [u, z] of [[37, 24.5], [37, -24.5], [61.5, 23.5], [61.5, -23.5]]) k.lampPost(s * u, z, 4.2, glow);
    k.lamp([s * 59.3, 11.4, 0], glow);
    for (const [u, z] of [[44, 9], [41, -9], [45, -22]]) k.prop('barrel', s * u, z);
    k.prop('crate', s * 44, 21);
  }

  // ---------- centre island
  k.solid([-14, DEEP, -16], [14, 0, 16], 'rock');
  k.deco([-13.6, 0, -15.6], [13.6, 0.02, 15.6], 'grate');
  for (const x of [-14, 13.8]) k.deco([x, 0, -16], [x + 0.2, 0.05, 16], 'white');
  for (const z of [-16, 15.8]) k.deco([-14, 0, z], [14, 0.05, z + 0.2], 'white');
  k.solid([-3, 0, -3], [3, 0.3, 3], 'pad'); k.deco([-2.2, 0.3, -0.15], [2.2, 0.33, 0.15], 'white'); k.deco([-0.15, 0.3, -2.2], [0.15, 0.33, 2.2], 'white');
  for (const [x, z] of [[-6.6, -6.6], [5.4, -6.6], [-6.6, 5.4], [5.4, 5.4]]) { k.solid([x, 0, z], [x + 1.2, 8, z + 1.2], 'hull'); k.deco([x - 0.2, 8, z - 0.2], [x + 1.4, 8.3, z + 1.4], 'metalDark'); k.lamp([x + 0.6, 8.5, z + 0.6], 'white'); }
  for (const z of [10, -13]) k.solid([-1, 0, z], [1, 1.2, z + 3], 'metalDark');
  k.solid([8.2, 0, 4], [9.8, 1.6, 5.6], 'crate'); k.solid([-9.8, 0, -5.6], [-8.2, 1.6, -4], 'crate');
  k.prop('barrel', 4, 11); k.prop('barrel', -4, -11);

  // ---------- stone bridges (permanent): a thin deck on a pier, no railings
  for (const [x0, x1] of [[-36, -14], [14, 36]]) {
    k.solid([x0, -1.4, -2], [x1, 0, 2], 'metal');
    k.deco([x0, 0, -2], [x1, 0.04, -1.85], 'orange'); k.deco([x0, 0, 1.85], [x1, 0.04, 2], 'orange');
    const mid = (x0 + x1) / 2; k.deco([mid - 1.5, DEEP, -1.2], [mid + 1.5, -1.4, 1.2], 'rockDark'); // pier
  }

  // ---------- energy bridge emitters and consoles (the bridge decks themselves are drawn and collided from L.bridges)
  for (const b of SPANS) {
    for (const x of [b.x0, b.x1]) for (const z of [b.z0 - 0.35, b.z1]) { k.deco([x - 0.25, 0, z], [x + 0.25, 0.9, z + 0.35], 'metalDark'); k.deco([x - 0.18, 0.9, z + 0.05], [x + 0.18, 1.05, z + 0.3], 'blue'); }
    const north = b.z0 > 0, cz = north ? b.z1 + 1.0 : b.z0 - 1.0, sz = north ? 1 : -1;
    for (const [x, inward] of [[b.x0, -1], [b.x1, 1]]) { // a console on each end, set back onto the solid platform
      const cx = x + inward * 1.4;
      k.solid([cx - 0.45, 0, cz - 0.35], [cx + 0.45, 1.1, cz + 0.35], 'console');
      k.deco([cx - 0.35, 1.1, cz - 0.25], [cx + 0.35, 1.16, cz + 0.25], 'green');
      L.interactables.push({ id: 'console_' + b.id + (inward < 0 ? '_a' : '_b'), p: [cx, 0, cz - sz * 0.9], r: 2.2, prompt: 'Cut the ' + b.label + ' bridge', bridge: b.id });
    }
  }

  // ---------- the abyss: rock spires and far cliffs fading into the fog (render only)
  for (const [x, z, w, top] of [[-25, 22, 3, -5], [-26, -23, 4, -7], [25, 21, 3.5, -6], [24, -22, 3, -4.5], [0, 24, 5, -8], [0, -24, 4, -6], [-50, 33, 6, -3], [50, -33, 6, -4], [-30, -36, 7, -10], [32, 37, 7, -9]]) k.deco([x - w / 2, -70, z - w / 2], [x + w / 2, top, z + w / 2], 'rockDark');
  for (const z of [-60, 60]) k.deco([-90, -70, z - 3], [90, -12, z + 3], 'rockDark');

  // free-for-all spawn points across the whole map (Team modes spawn around the flag of their team)
  L.ffaSpawns = [[-55, 0.3, 0], [-50, 0, 12], [-50, 0, -12], [-41, 0, 20], [-41, 0, -20], [-45, 0, 0], [55, 0.3, 0], [50, 0, 12], [50, 0, -12], [41, 0, 20], [41, 0, -20], [45, 0, 0], [0, 0, 8], [0, 0, -8], [9, 0, -1], [-9, 0, 1]];
  return L;
}

export const SKYBRIDGE = Object.freeze({ id: 'skybridge', label: 'Skybridge Citadel', layout: layout() });
