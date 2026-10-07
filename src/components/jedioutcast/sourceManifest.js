export const JEDI_OUTCAST_RECONSTRUCTION = Object.freeze({
  source: {
    repository: 'grayj/Jedi-Outcast',
    commit: '85f58467344d3ccbc6e2501a9af573ff4488a898',
    license: 'GPL-2.0',
    referenceFiles: [
      'code/game/AI_Stormtrooper.cpp',
      'code/game/NPC_behavior.cpp',
      'code/game/NPC_senses.cpp',
      'code/game/NPC_combat.cpp',
      'code/game/g_nav.cpp',
      'code/game/g_navigator.cpp',
      'code/game/g_combat.cpp',
      'code/game/wp_saber.cpp',
    ],
  },
  firstLevel: {
    id: 'kejim_post',
    label: 'Kejim Outpost',
    referenceFrames: 'Drive reference sequence: Kejim Outpost Level 1, one-second screenshot cadence',
    privateAssetTree: [
      'maps/kejim_post.nav',
      'scripts/kejim_post/*',
      'models/players/*',
      'forcecfg/*',
      'shaders/*',
      'textures/*',
      'sound/*',
      'music/*',
    ],
    scriptSignals: [
      'start_level',
      'kejim_start',
      '3_point_patrol_loop',
      '2_point_patrol',
      'alert_security',
      'ambush_officer',
      'attack_kyle',
      'imp_alarm',
      'stand_shoot',
      'stand_shoot_burst',
      'generic_go',
      'generic_go2',
      'jan_fight',
      'end_conv',
    ],
  },
});

export const JKO_FORCE_POWERS = Object.freeze({
  push: { label: 'Force Push', key: 'F', cost: 15, radius: 9 },
  pull: { label: 'Force Pull', key: 'G', cost: 15, radius: 9 },
  heal: { label: 'Force Heal', key: 'H', cost: 20, amount: 30 },
  speed: { label: 'Force Speed', key: 'E', cost: 25, duration: 3200 },
});

export const JKO_AI_STATES = Object.freeze([
  'idle',
  'patrol',
  'investigate',
  'combat',
  'search',
  'wounded',
  'dead',
]);
