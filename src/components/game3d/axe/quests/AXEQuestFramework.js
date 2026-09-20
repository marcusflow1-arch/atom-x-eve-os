// AXE Prompt 036 — data-driven Quest / Campaign / Faction Story framework.

export const AXE_QUEST_OBJECTIVE_TYPES = Object.freeze([
  'talk',
  'kill',
  'kill_tier',
  'defeat_boss',
  'collect_item',
  'discover_location',
  'interact',
  'escort',
  'defend',
  'capture',
  'craft',
  'enter_cave',
  'faction_war',
  'explore',
]);

export const AXE_CAMPAIGNS = Object.freeze({
  axe_campaign_first_steps: Object.freeze({
    id: 'axe_campaign_first_steps',
    name: 'First Steps Beyond the Gate',
    type: 'faction',
    factionId: 'AXE_Faction_Unassigned',
    order: 1,
    questIds: Object.freeze(['axe_q_first_patrol', 'axe_q_first_elite']),
  }),
  axe_campaign_world_discovery: Object.freeze({
    id: 'axe_campaign_world_discovery',
    name: 'Paths Unseen',
    type: 'exploration',
    factionId: null,
    order: 2,
    questIds: Object.freeze(['axe_q_cave_scout']),
  }),
});

const quest = (data) => Object.freeze({
  recommendedLevel: 1,
  recommendedPower: 0,
  repeatable: false,
  failureRules: Object.freeze([]),
  optionalObjectives: Object.freeze([]),
  storyFlagsRequired: Object.freeze([]),
  storyFlagsOnComplete: Object.freeze([]),
  choiceHooks: Object.freeze([]),
  priority: 0,
  ...data,
  objectives: Object.freeze(data.objectives || []),
  optionalObjectives: Object.freeze(data.optionalObjectives || []),
  reward: Object.freeze(data.reward || {}),
});

export const AXE_QUESTS = Object.freeze([
  quest({
    id: 'axe_q_first_patrol',
    campaignId: 'axe_campaign_first_steps',
    factionId: 'AXE_Faction_Unassigned',
    npcId: 'archer_lyra',
    priority: 100,
    unlockLevel: 1,
    title: 'Beyond the Capital Gate',
    description: 'The roads outside the capital must be tested before caravans move. Defeat three hostile spirits along the first patrol route and report back.',
    objectives: [
      Object.freeze({ id: 'patrol_kills', type: 'kill', count: 3 }),
    ],
    // Compatibility with the existing quest dialogue/HUD while AXE supports
    // multiple objectives through the objectives array.
    objective: Object.freeze({ type: 'kill', count: 3 }),
    reward: { xp: 80, points: 1, contribution: 10, reputation: 5 },
    spawnCount: 3,
    spawnTier: 'normal',
    storyFlagsOnComplete: ['axe_first_patrol_complete'],
  }),
  quest({
    id: 'axe_q_first_elite',
    campaignId: 'axe_campaign_first_steps',
    factionId: 'AXE_Faction_Unassigned',
    npcId: 'archer_lyra',
    priority: 99,
    unlockLevel: 1,
    requires: 'axe_q_first_patrol',
    title: 'The Road Has Teeth',
    description: 'The patrol found a stronger presence coordinating the lesser spirits. Bring down one elite before it can push toward the capital road.',
    objectives: [
      Object.freeze({ id: 'elite_kill', type: 'kill_tier', tier: 'elite', count: 1 }),
    ],
    objective: Object.freeze({ type: 'kill_tier', tier: 'elite', count: 1 }),
    optionalObjectives: [
      Object.freeze({ id: 'elite_without_fall', type: 'defeat_boss', targetId: 'no_player_death', count: 1, optional: true }),
    ],
    reward: { xp: 140, points: 2, contribution: 20, reputation: 10 },
    spawnCount: 1,
    spawnTier: 'elite',
    storyFlagsRequired: ['axe_first_patrol_complete'],
    storyFlagsOnComplete: ['axe_first_route_secured'],
  }),
  quest({
    id: 'axe_q_cave_scout',
    campaignId: 'axe_campaign_world_discovery',
    factionId: null,
    npcId: 'archer_noor',
    priority: 95,
    unlockLevel: 1,
    requires: 'axe_q_first_patrol',
    title: 'A Mouth in the Mountain',
    description: 'Scouts saw movement east of the road. Find the cave entrance and mark it for a future expedition. Fighting inside is not required for this reconnaissance.',
    objectives: [
      Object.freeze({ id: 'find_cave', type: 'discover_location', targetId: 'AXE_POI_CaveEntrance', count: 1 }),
    ],
    objective: Object.freeze({ type: 'discover_location', targetId: 'AXE_POI_CaveEntrance', count: 1 }),
    reward: { xp: 100, points: 1, contribution: 8, discoveryReward: true },
    storyFlagsOnComplete: ['axe_cave_entrance_scouted'],
  }),
]);

export function getAXECampaign(campaignId) {
  return AXE_CAMPAIGNS[campaignId] || null;
}

export function getAXEQuest(questId) {
  return AXE_QUESTS.find((entry) => entry.id === questId) || null;
}

export function getAXEQuestObjectives(questDef) {
  if (Array.isArray(questDef?.objectives) && questDef.objectives.length) return questDef.objectives;
  return questDef?.objective ? [questDef.objective] : [];
}

export function objectiveMatchesAXEQuestEvent(objective, event = {}) {
  if (!objective || !event?.type) return false;

  const typeMap = {
    kill: 'enemy_killed',
    kill_tier: 'enemy_killed',
    defeat_boss: 'boss_killed',
    collect_item: 'item_collected',
    discover_location: 'location_discovered',
    interact: 'world_interact',
    talk: 'npc_talked',
    escort: 'escort_completed',
    defend: 'defend_completed',
    capture: 'capture_completed',
    craft: 'craft_completed',
    enter_cave: 'cave_entered',
    faction_war: 'faction_war_participated',
    explore: 'exploration_completed',
  };

  if (typeMap[objective.type] !== event.type) return false;
  if (objective.type === 'kill_tier' && objective.tier && objective.tier !== event.tier) return false;
  if (objective.targetId && objective.targetId !== event.targetId) return false;
  if (objective.itemId && objective.itemId !== event.itemId) return false;
  if (objective.recipeId && objective.recipeId !== event.recipeId) return false;
  if (objective.factionId && objective.factionId !== event.factionId) return false;
  return true;
}
