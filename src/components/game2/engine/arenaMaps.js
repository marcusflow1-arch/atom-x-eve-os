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
