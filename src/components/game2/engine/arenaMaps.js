// Two source-selected Jedi Outcast arena choices from the user's Drive /maps folder.
// The maps contain original proprietary art. Do not copy new retail BSPs into
// the public repository; authorized users may sync their own copy locally.
export const GAME2_ARENA_MAPS = Object.freeze({
  training: {
    id: 'training', label: 'Lightsaber Training',
    filename: 'duel_training.bsp',
    driveFileId: '1uIQPWKuqMbujSn9dUrnwVFGqv6LKq3t9',
    source: 'Drive /maps/duel_training.bsp',
  },
  hangar: {
    id: 'hangar', label: 'Hangar Duel',
    filename: 'duel_hangar.bsp',
    driveFileId: '16dHdYcOiPIJo1lvHVhcOjEZcf3KJmIJV',
    source: 'Drive /maps/duel_hangar.bsp',
  },
});

// An original-playable fallback for Hangar when the player's authorized Drive
// BSP has not been installed. This does NOT pretend to be the retail geometry.
// Its broad floor is deliberately navigable for 7v7/8v8 AI testing. Inspired
// by the Hangar map's two distant original deathmatch spawn areas.
export const GAME2_HANGAR_TEST_LAYOUT = {
  ground: { x0: -30, z0: -38, x1: 30, z1: 38, y: 0, mat: 'metalDark', tile: 5 },
  navBounds: [-28, -36, 28, 36],
  playerSpawn: [-9, 0.2, -24],
  enemySpawn: [9, 0.2, 24],
  playerYaw: 0,
  env: {
    sunDir: [0.1, 0.78, 0.4],
    sunCol: [0.52, 0.62, 0.76],
    ambTop: [0.26, 0.34, 0.49],
    ambBot: [0.09, 0.13, 0.2],
    fogCol: [0.06, 0.1, 0.18],
    fogD: 0.004,
  },
  solids: [
    { min: [-29.5, 0, -38], max: [-28.7, 6, 38], mat: 'metal' },
    { min: [28.7, 0, -38], max: [29.5, 6, 38], mat: 'metal' },
    { min: [-29.5, 0, -38], max: [29.5, 6, -37], mat: 'metal' },
    { min: [-29.5, 0, 37], max: [29.5, 6, 38], mat: 'metal' },
    { min: [-25, 0, -4], max: [-20, 3, -0.5], mat: 'crate' },
    { min: [20, 0, 0.5], max: [25, 3, 4], mat: 'crate' },
    { min: [-12, 0, -7], max: [-8, 2.2, -3], mat: 'hullDark' },
    { min: [8, 0, 3], max: [12, 2.2, 7], mat: 'hullDark' },
    { min: [-2.4, 0, -1.1], max: [2.4, 2.1, 1.1], mat: 'metal' },
    { min: [-23, 0, 18], max: [-20, 2.2, 21], mat: 'crate' },
    { min: [20, 0, -21], max: [23, 2.2, -18], mat: 'crate' },
  ],
  deco: [
    { min: [-27, 0.02, -35], max: [-26.6, 0.06, 35], glow: 'blue' },
    { min: [26.6, 0.02, -35], max: [27, 0.06, 35], glow: 'blue' },
    { min: [-11, 0.03, -26], max: [-7, 0.07, -25.6], glow: 'blue' },
    { min: [7, 0.03, 25.6], max: [11, 0.07, 26], glow: 'red' },
  ],
  clips: [],
};
