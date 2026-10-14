// Three distinct, actual BSP maps from the owner's Google Drive /maps folder.
// Training already existed. Hangar and Carbon were imported as original BSP
// binaries in this branch and must never silently share the Training geometry.
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
  carbon: {
    id: 'carbon', label: 'Carbon Chamber',
    filename: 'duel_carbon.bsp',
    driveFileId: '18Fb_OkshjX9SqdW-UcG1eWapc8jsKXhB',
    source: 'Drive /maps/duel_carbon.bsp',
  },
});

// Authored large arenas (engine/levels/*.js, built by level/builder.js like the story mission) for the bigger modes.
export const GAME2_AUTHORED_MAPS = Object.freeze({
  skybridge: { id: 'skybridge', label: 'Skybridge Citadel', authored: true },
});

// What the Skirmish menu offers: the large authored map first, then the three original duel arenas.
export const GAME2_SKIRMISH_MAPS = Object.freeze({
  skybridge: { ...GAME2_AUTHORED_MAPS.skybridge, size: 'Large', blurb: 'Two fortress platforms over a bottomless chasm. Energy bridges can be switched off under your enemies; a fall is fatal.' },
  training: { ...GAME2_ARENA_MAPS.training, size: 'Small', blurb: 'The original duel arena.' },
  hangar: { ...GAME2_ARENA_MAPS.hangar, size: 'Small', blurb: 'Original hangar duel map.' },
  carbon: { ...GAME2_ARENA_MAPS.carbon, size: 'Small', blurb: 'Original carbon-freezing chamber.' },
});
