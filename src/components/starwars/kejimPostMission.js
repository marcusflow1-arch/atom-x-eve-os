// Source-faithful integration manifest for Jedi Outcast mission 1: Kejim Post.
// Retail data comes from the user's connected Drive asset pack. The released
// grayj/Jedi-Outcast source is used as the behavior reference.
//
// IMPORTANT: retail binary assets are intentionally not committed to this public
// repository. The runtime looks for a converted/private asset pack under
// /starwars/kejim_post and falls back to a procedural combat harness when absent.

export const KEJIM_POST_MISSION = Object.freeze({
  id: 'kejim_post',
  title: 'Kejim Post',
  game: 'Star Wars Jedi Knight II: Jedi Outcast',
  sourceCode: 'grayj/Jedi-Outcast',
  assetPackBase: '/starwars/kejim_post',
  sceneUrl: '/starwars/kejim_post/kejim_post.glb',
  navSource: 'maps/kejim_post.nav',
  retailObjectives: [
    {
      id: 'KEJIM_POST_OBJ1',
      text: 'Investigate the abandoned Imperial outpost.',
    },
    {
      id: 'KEJIM_POST_OBJ2',
      text: 'Engage Remnant forces in the area.',
    },
  ],
  driveEvidence: Object.freeze({
    retailRootFolderId: '19lKiOAeAl1m9r01uw9HTULXl4kw3t2Jp',
    scriptsFolderId: '14k0TJ8jfsNR8N1o_dsvrkvdxz_hd8q5A',
    musicFolderId: '1H4VUllqKlhPsdcZaCeLPgSjnh_zeW17u',
    navFileId: '1Xq7JktxUkbPTso1WW6W-x376J002k9AT',
    stripFileId: '1Aq0CAMzNCxIr0eQY-hE9U3YnYSQ1yl36',
    objectivesFileId: '1vu2NMmBj1jb5sPgYv7biFNidVHx6BdH9',
    visualReferenceFolderId: '17jTbFKOpaDZZynh56-CVXglXiECqN8RY',
    visualReference: Object.freeze({
      cadenceSeconds: 1,
      firstFrame: 1,
      lastVerifiedFrame: 1653,
      firstTimestamp: '00:00:00',
      lastVerifiedTimestamp: '00:27:32',
      sourceLabel: 'Level 1 - Kejim Outpost frame-by-frame walkthrough',
    }),
  }),
  sourceScripts: Object.freeze([
    'kejim_start.ibi',
    'jan_fight.ibi',
    'jan_death.ibi',
    'attack_kyle.ibi',
    'attack_kyle2.ibi',
    'control_elevator.ibi',
    'ambush_officer.ibi',
    '3_point_patrol_loop.ibi',
    'anger_shuttle.ibi',
    'alert_security.ibi',
    'all_clear.ibi',
    'rotate_dish.ibi',
    'probe_lift.ibi',
    'stand_shoot.ibi',
    'stand_shoot_burst.ibi',
    'stand_shoot_silent.ibi',
  ]),
  // Strings recovered from the retail IBI scripts. These are behavior contracts,
  // not guesses: Jan follows Kyle and engages enemies, patrol scripts use explicit
  // nav goals, and Imperial actors transition into default chase/combat behavior.
  behaviorContracts: Object.freeze({
    kyle: {
      forceAtMissionStart: false,
      primaryWeaponFamily: 'blaster',
    },
    jan: {
      leader: 'kyle',
      chaseEnemies: true,
      lookForEnemies: true,
      ignoreAlerts: false,
      behavior: 'follow_leader_then_default_combat',
    },
    imperial: {
      chaseEnemies: true,
      lookForEnemies: true,
      ignoreAlerts: false,
    },
    patrol: ['nav_patrol1', 'nav_patrol2', 'nav_patrol3'],
    scriptedMovers: ['control_elevator', 'probe_lift', 'rotate_dish'],
  }),
  actorAssets: Object.freeze({
    kyle: '/starwars/kejim_post/actors/kyle.glb',
    jan: '/starwars/kejim_post/actors/jan.glb',
    stormtrooper: '/starwars/kejim_post/actors/stormtrooper.glb',
    officer: '/starwars/kejim_post/actors/officer.glb',
  }),
  audio: Object.freeze({
    explore: '/starwars/kejim_post/audio/explore.ogg',
    action: '/starwars/kejim_post/audio/action.ogg',
  }),
});

export const KEJIM_POST_TEST_SPAWNS = Object.freeze([
  { id: 'st_guard1', type: 'stormtrooper', position: [-8, 0, -30], patrol: [[-8, 0, -30], [-1, 0, -36], [-11, 0, -43]] },
  { id: 'st_guard2', type: 'stormtrooper', position: [8, 0, -34], patrol: [[8, 0, -34], [12, 0, -42], [4, 0, -48]] },
  { id: 'security_officer', type: 'officer', position: [0, 0, -58], patrol: [[0, 0, -58], [7, 0, -62], [-7, 0, -62]] },
]);

export const STAR_WARS_ANIMATION_ALIASES = Object.freeze({
  idle: ['idle', 'stand', 'both_stand', 'torso_stand'],
  walk: ['walk', 'walk1', 'both_walk'],
  run: ['run', 'run1', 'both_run'],
  fire: ['fire', 'attack', 'shoot', 'weapon_fire'],
  pain: ['pain', 'hit', 'damage'],
  death: ['death', 'dead', 'death1'],
});
