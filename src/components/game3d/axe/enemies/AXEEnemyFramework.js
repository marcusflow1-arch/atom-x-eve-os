// AXE Prompt 016 — scalable PvE enemy framework.
// Definitions are data, while the existing GameWorld3D loader/AI remains the runtime.

export const AXE_ENEMY_TIERS = Object.freeze({
  normal: Object.freeze({ id: 'normal', hpMult: 1, damageMult: 1, defenseMult: 1, xpMult: 1, scale: 1, randomWeight: 0.70 }),
  champion: Object.freeze({ id: 'champion', hpMult: 1.8, damageMult: 1.3, defenseMult: 1.25, xpMult: 2.5, scale: 1.12, randomWeight: 0.20 }),
  elite: Object.freeze({ id: 'elite', hpMult: 2.8, damageMult: 1.6, defenseMult: 1.5, xpMult: 4, scale: 1.22, randomWeight: 0.10 }),
  miniBoss: Object.freeze({ id: 'miniBoss', hpMult: 8, damageMult: 2.3, defenseMult: 2, xpMult: 12, scale: 1.55, randomWeight: 0 }),
  caveBoss: Object.freeze({ id: 'caveBoss', hpMult: 18, damageMult: 3.2, defenseMult: 2.6, xpMult: 30, scale: 1.9, randomWeight: 0 }),
  gateBoss: Object.freeze({ id: 'gateBoss', hpMult: 30, damageMult: 4, defenseMult: 3, xpMult: 50, scale: 2.25, randomWeight: 0 }),
  worldBoss: Object.freeze({ id: 'worldBoss', hpMult: 100, damageMult: 6, defenseMult: 4.5, xpMult: 150, scale: 3, randomWeight: 0 }),
});

export const AXE_AI_PROFILES = Object.freeze({
  passive: Object.freeze({ aggroRange: 0, leashRange: 20, moveSpeed: 1.5, attackRange: 1.8, respawnSeconds: 10 }),
  standard: Object.freeze({ aggroRange: 10, leashRange: 28, moveSpeed: 2.5, attackRange: 2.2, respawnSeconds: 10 }),
  aggressive: Object.freeze({ aggroRange: 16, leashRange: 40, moveSpeed: 3.1, attackRange: 2.5, respawnSeconds: 14 }),
  boss: Object.freeze({ aggroRange: 28, leashRange: 80, moveSpeed: 2.8, attackRange: 4, respawnSeconds: 90 }),
});

export function createAXEEnemyDefinition({
  id,
  name,
  family = 'spirit',
  tier = 'normal',
  level = 1,
  aiProfile = 'standard',
  exp = 1,
  lootTableId = 'AXE_Loot_CommonWorld',
  skills = [],
  faction = 'hostile',
  tags = [],
} = {}) {
  const tierData = AXE_ENEMY_TIERS[tier] || AXE_ENEMY_TIERS.normal;
  const ai = AXE_AI_PROFILES[aiProfile] || AXE_AI_PROFILES.standard;
  return Object.freeze({
    id,
    name: name || id,
    family,
    tier,
    tierData,
    level: Math.max(1, Number(level) || 1),
    aiProfile,
    ai,
    exp: Math.max(0, Number(exp) || 0),
    lootTableId,
    skills: [...skills],
    faction,
    tags: [...tags],
  });
}

export const AXE_FIRST_REGION_ENEMIES = Object.freeze([
  createAXEEnemyDefinition({ id: 'AXE_Enemy_WanderingSpirit', name: 'Wandering Spirit', tier: 'normal', level: 1, exp: 1 }),
  createAXEEnemyDefinition({ id: 'AXE_Enemy_ForestRaider', name: 'Forest Raider', tier: 'champion', level: 3, exp: 3, aiProfile: 'aggressive' }),
  createAXEEnemyDefinition({ id: 'AXE_Enemy_BambooElite', name: 'Bamboo Elite', tier: 'elite', level: 5, exp: 5, aiProfile: 'aggressive' }),
  createAXEEnemyDefinition({ id: 'AXE_Enemy_CaveGuardian', name: 'Cave Guardian', tier: 'miniBoss', level: 8, exp: 12, aiProfile: 'boss' }),
]);

export function getAXEEnemyTier(id) {
  return AXE_ENEMY_TIERS[id] || AXE_ENEMY_TIERS.normal;
}
