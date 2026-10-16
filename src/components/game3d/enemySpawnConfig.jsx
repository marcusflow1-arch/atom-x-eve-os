// Shared enemy spawn configuration + deterministic seeded spawn list.
// Every client must spawn enemies at IDENTICAL positions so two players see
// the same world. Use this module instead of Math.random() in GameWorld3D.

// AXE Prompt 016 — deterministic first-region PvE populations.
// `levels` is the zone's enemy level range: enemy stats come from their level (the power
// budget's enemy curve, docs/game3d/STAT_SYSTEM_AUDIT.md), so a zone's range is its difficulty.
export const ENEMY_ZONES = [
  { id: 'axe_starter_spirits', center: [40, 0, -150], radius: 90, count: 8, levels: [1, 4] },
  { id: 'axe_bamboo_raiders', center: [-560, 0, -250], radius: 150, count: 10, fixedTier: 'champion', levels: [6, 10] },
  { id: 'axe_bamboo_elites', center: [-700, 0, -350], radius: 90, count: 3, fixedTier: 'elite', levels: [10, 14] },
  { id: 'axe_cave_guardian', center: [620, 0, -520], radius: 8, count: 1, fixedTier: 'miniBoss', levels: [15, 15] },
];

// 10 seconds after death, the enemy respawns at its home position with full HP.
export const ENEMY_RESPAWN_SECONDS = 10;

// World seed — change to reshuffle the world. All clients use the same value.
const WORLD_SEED = 0xA70E1E;

// mulberry32 — deterministic, identical output on every machine for a given seed.
const seededRandom = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const _rng = seededRandom(WORLD_SEED);

// DETERMINISTIC spawn list — same on every client.
export const ENEMY_SPAWNS = ENEMY_ZONES.flatMap((zone) =>
  Array.from({ length: zone.count }, (_, i) => {
    const angle = _rng() * Math.PI * 2;
    const dist = _rng() * zone.radius;
    const tierRoll = _rng();
    return {
      id: `${zone.id}_${i}`,
      zoneId: zone.id,
      zoneCenter: zone.center,
      zoneRadius: zone.radius,
      home: [
        zone.center[0] + Math.cos(angle) * dist,
        zone.center[1],
        zone.center[2] + Math.sin(angle) * dist,
      ],
      tierRoll, // deterministic tier pick (replaces Math.random in pickTier)
      level: zone.levels ? zone.levels[0] + Math.floor(tierRoll * (zone.levels[1] - zone.levels[0] + 1)) : null,
      fixedTier: zone.fixedTier || null,
      aiProfile: zone.fixedTier === 'miniBoss' ? 'boss' : zone.fixedTier === 'elite' ? 'aggressive' : 'standard',
    };
  })
);