// ─── GameWorld3D constants & enemy tier table ──────────────────────────
// Extracted from GameWorld3D.jsx so that file stays under the editor's
// line-count limit for find_replace operations.

export const ARCHER_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
export const ANIMATION_URLS = {
  idle:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx',
  run:   'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/4edd51169_Running.fbx',
  jump:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/b1e388a25_Jumping.fbx',
  kick:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/d4d6d9112_standingmeleekick.fbx',
  roll:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/c9ba745cd_SprintingForwardRoll.fbx',
  death: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/183d60083_standingdeathforward01.fbx',
};

export const DEATH_FADE_DELAY = 5.0;
export const WALK_SPEED = 4.0;
export const RUN_SPEED = 9.0;
export const ROT_SMOOTH = 0.18;
export const BLEND = 0.2;

export const NPC_SPAWNS = [
  { id: 'npc_elara', name: 'Elara the Guide', pos: [6, 0.3, 6], color: 0x4a90e2, dialogue: "Welcome, traveler! The arena ahead is full of restless spirits — defeat them to prove your worth." },
  { id: 'npc_borin', name: 'Borin the Blacksmith', pos: [-7, 0.3, 4], color: 0xe2a04a, dialogue: "Need stronger arrows? Come back when you've slain a few enemies and I'll forge you something special." },
  { id: 'npc_sage', name: 'Sage Mira', pos: [0, 0.3, 12], color: 0xa04ae2, dialogue: "The runes whisper of an ancient power buried beneath the platform. Be careful where you tread." },
];

export const ENEMY_SPEED = 1.2;
export const ENEMY_WALK_TIME = 3.0;
export const ENEMY_IDLE_TIME = 5.0;
export const ENEMY_WANDER_RADIUS = 4;
export const NPC_INTERACT_RANGE = 3.5;
export const ENEMY_ATTACK_RANGE = 2.0;
export const ENEMY_ATTACK_COOLDOWN = 2.2;
export const ENEMY_ATTACK_WINDUP = 0.4;
export const PLAYER_ATTACK_COOLDOWN = 0.6;
export const PLAYER_INVUL_AFTER_HIT = 0.5;

export const ENEMY_TIERS = [
  { name: 'normal',   weight: 0.70, xp: 1, level: 1, scale: 1.0,  tintMix: 0.55 },
  { name: 'elite',    weight: 0.22, xp: 3, level: 2, scale: 1.15, tintMix: 0.70 },
  { name: 'champion', weight: 0.08, xp: 5, level: 4, scale: 1.30, tintMix: 0.85 },
];

export const pickTier = (roll = Math.random()) => {
  let acc = 0;
  for (const t of ENEMY_TIERS) { acc += t.weight; if (roll < acc) return t; }
  return ENEMY_TIERS[0];
};

// XP curve: XP_TABLE[n] = XP to reach level n+2 from n+1.
export const XP_TABLE = [5, 7, 14, 22, 35, 50, 70, 95, 125, 160];
export const xpForLevel = (level) => XP_TABLE[Math.min(level - 1, XP_TABLE.length - 1)] || 200;