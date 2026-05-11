// ─────────────────────────────────────────────
// Quest Data — 10 hand-tuned quests, gated by player level.
// quest.unlockLevel = the player level at which this quest BECOMES available.
// quest.npcId = which archer NPC gives this quest.
// 5 archer NPCs total, each carries 2 quests.
// ─────────────────────────────────────────────

export const QUEST_NPCS = [
  { id: 'archer_lyra',    name: 'Lyra the Seeker',    pos: [5, 0.3, -8],   tint: 0x88c2ff }, // soft blue
  { id: 'archer_vex',     name: 'Vex the Hunter',     pos: [-9, 0.3, -5],  tint: 0xc488ff }, // soft purple
  { id: 'archer_kira',    name: 'Kira the Scout',     pos: [10, 0.3, 8],   tint: 0xffc488 }, // soft amber
  { id: 'archer_noor',    name: 'Noor the Wanderer',  pos: [-14, 0.3, 0],  tint: 0x88ffc4 }, // soft mint
  { id: 'archer_zephyr',  name: 'Zephyr the Silent',  pos: [0, 0.3, -14],  tint: 0xff88c4 }, // soft rose
];

export const QUESTS = [
  {
    id: 'q1_first_blood',
    unlockLevel: 1,
    npcId: 'archer_lyra',
    title: 'First Blood',
    description: "Welcome, traveler. The crimson ones to the north grow bolder by the hour. Slay three of them and return to me — prove you have steel in your hands.",
    objective: { type: 'kill', count: 3 },
    reward: { xp: 5, points: 1 },
  },
  {
    id: 'q2_clearing_path',
    unlockLevel: 2,
    npcId: 'archer_vex',
    title: 'Clearing the Path',
    description: "The southern fields are choked with hostile spirits. Cull five of them and the road to the inner sanctum will open. Move quickly — they multiply at dusk.",
    objective: { type: 'kill', count: 5 },
    reward: { xp: 12, points: 1 },
  },
  {
    id: 'q3_elite_hunt',
    unlockLevel: 3,
    npcId: 'archer_kira',
    title: 'Elite Hunt',
    description: "Among the rabble walks something stronger — an elite. Its hide is darker, its strikes heavier. Bring me proof of one slain elite and you'll have my respect.",
    objective: { type: 'kill_tier', tier: 'elite', count: 1 },
    reward: { xp: 18, points: 2 },
  },
  {
    id: 'q4_dual_blade',
    unlockLevel: 4,
    npcId: 'archer_noor',
    title: 'Dual Blade',
    description: "Your stance is sound but your tempo is loose. Defeat seven foes without falling — let me see if your blade keeps its rhythm under pressure.",
    objective: { type: 'kill', count: 7 },
    reward: { xp: 25, points: 2 },
  },
  {
    id: 'q5_silent_wind',
    unlockLevel: 5,
    npcId: 'archer_zephyr',
    title: 'The Silent Wind',
    description: "Two elites prowl the far edges of the arena. Hunt them both. Move like the wind — speak nothing, leave nothing standing.",
    objective: { type: 'kill_tier', tier: 'elite', count: 2 },
    reward: { xp: 35, points: 2 },
  },
  {
    id: 'q6_relentless',
    unlockLevel: 6,
    npcId: 'archer_lyra',
    title: 'Relentless',
    description: "You've grown. Now show me you can endure. Slay ten enemies in this run — any tier, any color. Let the arena know your name.",
    objective: { type: 'kill', count: 10 },
    reward: { xp: 50, points: 3 },
  },
  {
    id: 'q7_champion_call',
    unlockLevel: 7,
    npcId: 'archer_vex',
    title: 'The Champion Calls',
    description: "A champion has been seen at the arena's edge — a crowned beast among lesser kin. End its march. Bring it down once and I will share what I know of the deeper paths.",
    objective: { type: 'kill_tier', tier: 'champion', count: 1 },
    reward: { xp: 70, points: 3 },
  },
  {
    id: 'q8_swift_reckoning',
    unlockLevel: 8,
    npcId: 'archer_kira',
    title: 'Swift Reckoning',
    description: "Fifteen kills. That's the price of passage to the inner ring. No tricks, no shortcuts — just steel and resolve. Go.",
    objective: { type: 'kill', count: 15 },
    reward: { xp: 95, points: 3 },
  },
  {
    id: 'q9_twin_crowns',
    unlockLevel: 9,
    npcId: 'archer_noor',
    title: 'Twin Crowns',
    description: "Two champions remain. Their crowns are mine by right, but my legs no longer carry me. Bring them down for me — both, one after another. I will not forget this debt.",
    objective: { type: 'kill_tier', tier: 'champion', count: 2 },
    reward: { xp: 125, points: 4 },
  },
  {
    id: 'q10_arena_master',
    unlockLevel: 10,
    npcId: 'archer_zephyr',
    title: 'Arena Master',
    description: "The final trial. Twenty-five enemies. Any tier. No rest, no retreat. Walk back to me when the arena is silent — and the title of Arena Master will be yours.",
    objective: { type: 'kill', count: 25 },
    reward: { xp: 200, points: 5 },
  },
];

// Helper: which quest (if any) is currently available from this NPC for this player?
// Picks the lowest-unlockLevel quest from this NPC that the player has unlocked
// but not yet accepted or completed.
export function getAvailableQuestForNPC(npcId, playerLevel, acceptedIds, completedIds) {
  return QUESTS.find(
    (q) =>
      q.npcId === npcId &&
      q.unlockLevel <= playerLevel &&
      !acceptedIds.includes(q.id) &&
      !completedIds.includes(q.id)
  ) || null;
}