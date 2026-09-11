// TwelveSky2 data sources consumed by the Mines modernization layer.
// The MIT-licensed Fenrir server is already pinned under third_party/.
// Keep source paths centralized so importer/runtime code never hard-codes them.

export const FENRIR_SERVER_ROOT = 'third_party/twelvesky2-fenrir-server';

export const FENRIR_WORLD_SEEDS = Object.freeze({
  levels: 'Database/Migrations/Seed/world/001_levels.sql',
  skills: 'Database/Migrations/Seed/world/002_skills.sql',
  skillDescriptions: 'Database/Migrations/Seed/world/003_skill_descriptions.sql',
  skillGrades: 'Database/Migrations/Seed/world/004_skill_grades.sql',
  items: 'Database/Migrations/Seed/world/005_items.sql',
  itemBonusSkills: 'Database/Migrations/Seed/world/006_item_bonus_skills.sql',
  zones: 'Database/Migrations/Seed/world/007_zones.sql',
  starterSkills: 'Database/Migrations/Seed/world/010_starter_kit_skills.sql',
  starterHotkeys: 'Database/Migrations/Seed/world/011_starter_kit_hotkeys.sql',
  tribeSkillEquivalences: 'Database/Migrations/Seed/world/012_tribe_skill_equivalences.sql',
  tribeItemEquivalences: 'Database/Migrations/Seed/world/013_tribe_item_equivalences.sql',
  tribeCostumeEquivalences: 'Database/Migrations/Seed/world/014_tribe_costume_equivalences.sql',
  monsters: 'Database/Migrations/Seed/world/015_monsters.sql',
  npcs: 'Database/Migrations/Seed/world/016_npcs.sql',
  zoneNpcSpawns: 'Database/Migrations/Seed/world/017_zone_npc_spawns.sql',
  zonePortals: 'Database/Migrations/Seed/world/018_zone_portals.sql',
  zoneSpawnPoints: 'Database/Migrations/Seed/world/019_zone_spawn_points.sql',
  monsterSpawnRegions: 'Database/Migrations/Seed/world/020_monster_spawn_regions.sql',
  gemSockets: 'Database/Migrations/Seed/world/021_gem_sockets.sql',
  quests: 'Database/Migrations/Seed/world/022_quests.sql',
  questRewards: 'Database/Migrations/Seed/world/023_quest_rewards.sql',
  questSpeeches: 'Database/Migrations/Seed/world/024_quest_speeches.sql',
  bloodExchange: 'Database/Migrations/Seed/world/026_blood_exchange_catalog.sql',
});

export const FENRIR_RUNTIME_DATA_URL = '/twelvesky-data/catalog.json';
