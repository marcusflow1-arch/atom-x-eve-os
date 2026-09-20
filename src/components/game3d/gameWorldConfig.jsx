// ─── GameWorld3D constants & enemy tier table ──────────────────────────
// Extracted from GameWorld3D.jsx so that file stays under the editor's
// line-count limit for find_replace operations.

import { AXE_FOUNDATION } from './axe/core/axeFoundation';
import { AXE_PLAYER_TRAVERSAL_CONFIG } from './axe/player/AXEPlayerTraversalConfig';

export { AXE_FOUNDATION, AXE_PLAYER_TRAVERSAL_CONFIG };

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
// Prompt 001: movement defaults now come from the shared AXE foundation so
// the world uses one meter-based source of truth instead of duplicated literals.
export const WALK_SPEED = AXE_PLAYER_TRAVERSAL_CONFIG.movement.walkSpeed;
export const RUN_SPEED = AXE_PLAYER_TRAVERSAL_CONFIG.movement.runSpeed;
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
// Ranged weapons (bows/firearms/energy) can engage from much further away
// than melee. In the AXE world 1 Three.js unit ~= 1 real-world meter.
export const RANGED_ATTACK_RANGE = 12.0;
export const ENEMY_ATTACK_COOLDOWN = 2.2;
export const ENEMY_ATTACK_WINDUP = 0.4;
export const PLAYER_ATTACK_COOLDOWN = 0.6;
export const PLAYER_INVUL_AFTER_HIT = 0.5;

export const ENEMY_TIERS = [
  { name: 'normal',    weight: 0.70, xp: 1,   level: 1,  scale: 1.00, tintMix: 0.55 },
  { name: 'champion',  weight: 0.20, xp: 3,   level: 3,  scale: 1.12, tintMix: 0.68 },
  { name: 'elite',     weight: 0.10, xp: 5,   level: 5,  scale: 1.22, tintMix: 0.82 },
  { name: 'miniBoss',  weight: 0.00, xp: 12,  level: 8,  scale: 1.55, tintMix: 0.90 },
  { name: 'caveBoss',  weight: 0.00, xp: 30,  level: 12, scale: 1.90, tintMix: 0.95 },
  { name: 'gateBoss',  weight: 0.00, xp: 50,  level: 18, scale: 2.25, tintMix: 1.00 },
  { name: 'worldBoss', weight: 0.00, xp: 150, level: 25, scale: 3.00, tintMix: 1.00 },
];

export const getEnemyTierByName = (name) =>
  ENEMY_TIERS.find((tier) => tier.name === name) || ENEMY_TIERS[0];

export const pickTier = (roll = Math.random()) => {
  let acc = 0;
  for (const t of ENEMY_TIERS) {
    if (t.weight <= 0) continue;
    acc += t.weight;
    if (roll < acc) return t;
  }
  return ENEMY_TIERS[0];
};

// XP curve: XP_TABLE[n] = XP to reach level n+2 from n+1.
export const XP_TABLE = [5, 7, 14, 22, 35, 50, 70, 95, 125, 160];
export const xpForLevel = (level) => XP_TABLE[Math.min(level - 1, XP_TABLE.length - 1)] || 200;