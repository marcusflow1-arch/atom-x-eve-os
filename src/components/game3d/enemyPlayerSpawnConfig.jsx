// ─── Hostile Player-AI spawn config ─────────────────────────────────
// "Rogue players" — same archer model as you, red-tinted, hostile.
// Killing them gives bonus gold + records a PvP-style title kill.

// Single visible boss-style rogue player AI.
export const ENEMY_PLAYER_SPAWNS = [
  { id: 'rogue_boss', name: 'Arena Boss', pos: [12, 0.3, -10], level: 10, color: 0xff2020, hpTanks: 10 },
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