// ─── Hostile Player-AI spawn config ─────────────────────────────────
// "Rogue players" — same archer model as you, red-tinted, hostile.
// Killing them gives bonus gold + records a PvP-style title kill.

export const ENEMY_PLAYER_SPAWNS = [
  { id: 'rogue_alpha',   name: 'Crimson Rogue',  pos: [18, 0.3, 8],   level: 3, color: 0xff3b3b },
  { id: 'rogue_bravo',   name: 'Shadow Stalker', pos: [-16, 0.3, -8], level: 4, color: 0xb91c1c },
  { id: 'rogue_charlie', name: 'Void Hunter',    pos: [4, 0.3, -18],  level: 5, color: 0x991b1b },
  { id: 'rogue_delta',   name: 'Blood Reaver',   pos: [-4, 0.3, 18],  level: 6, color: 0xdc2626 },
  { id: 'rogue_echo',    name: 'Ghost Slayer',   pos: [22, 0.3, -14], level: 7, color: 0x7f1d1d },
];

export const ENEMY_PLAYER_STATS = {
  hp: 180,
  attack: 14,
  defense: 6,
  speed: 3.5,
  attackRange: 2.5,
  detectionRange: 14,
  attackCooldown: 1.6,
  xpReward: 8,
  goldReward: 75,
};

export const ENEMY_PLAYER_RESPAWN_SECONDS = 25;