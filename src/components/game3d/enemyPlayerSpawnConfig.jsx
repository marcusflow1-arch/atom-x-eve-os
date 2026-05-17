// ─── Hostile Player-AI spawn config ─────────────────────────────────
// "Rogue players" — same archer model as you, red-tinted, hostile.
// Killing them gives bonus gold + records a PvP-style title kill.

export const ENEMY_PLAYER_SPAWNS = [
  { id: 'rogue_alpha',   pos: [18, 0.3, 8],   level: 3, color: 0xff3b3b },
  { id: 'rogue_bravo',   pos: [-16, 0.3, -8], level: 4, color: 0xb91c1c },
  { id: 'rogue_charlie', pos: [4, 0.3, -18],  level: 5, color: 0x991b1b },
  { id: 'rogue_delta',   pos: [-4, 0.3, 18],  level: 6, color: 0xdc2626 },
  { id: 'rogue_echo',    pos: [22, 0.3, -14], level: 7, color: 0x7f1d1d },
];

// Random name pool — assigned on first spawn and each respawn for variety.
const ROGUE_FIRST = ['Crimson', 'Shadow', 'Void', 'Blood', 'Ghost', 'Iron', 'Frost', 'Ember', 'Storm', 'Night', 'Ash', 'Grim', 'Raven', 'Bone', 'Wraith'];
const ROGUE_LAST  = ['Rogue', 'Stalker', 'Hunter', 'Reaver', 'Slayer', 'Blade', 'Fang', 'Wolf', 'Talon', 'Marauder', 'Drifter', 'Hex', 'Viper', 'Reaper', 'Phantom'];

export function getRandomRogueName() {
  const a = ROGUE_FIRST[Math.floor(Math.random() * ROGUE_FIRST.length)];
  const b = ROGUE_LAST[Math.floor(Math.random() * ROGUE_LAST.length)];
  return `${a} ${b}`;
}

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