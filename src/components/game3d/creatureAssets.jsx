// ─────────────────────────────────────────────
// Enemy creature asset URLs (Survivor A Lusth + mutant animation set).
// Sourced from the AnimationFBX "creature" folder in the admin panel.
// ─────────────────────────────────────────────

// 3D mesh used as the enemy body
export const CREATURE_MODEL_URL =
  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/3e8b3e64d_SurvivorALusth.fbx';

// Animation files — keyed by the role used in the enemy AI state machine.
// The keys match what GameWorld3D's enemy logic already looks for (idle, walk,
// attack, death), with extras available for future hooks.
export const CREATURE_ANIMATION_URLS = {
  idle:       'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/148ec5e53_mutantidle.fbx',
  breathing:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/f752bc8a5_mutantbreathingidle.fbx',
  walk:       'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/49f0a0cef_mutantwalking.fbx',
  run:        'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/8dd0c6ff5_mutantrun.fbx',
  attack:     'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/5287274a4_mutantswiping.fbx',
  punch:      'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/9888f5f65_mutantpunch.fbx',
  jumpAttack: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/8c44b418e_mutantjumpattack.fbx',
  jump:       'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/b50a13cac_mutantjumping.fbx',
  roar:       'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/f73978392_mutantroaring.fbx',
  flex:       'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/10b61f19d_mutantflexingmuscles.fbx',
  turnLeft45: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/04b577add_mutantleftturn45.fbx',
  turnRight45:'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/124677252_mutantrightturn45.fbx',
  turnRight90:'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/fc9fa2a6b_mutantrightturn90.fbx',
  death:      'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/624c4b411_mutantdying.fbx',
};