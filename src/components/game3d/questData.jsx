// ─────────────────────────────────────────────
// Quest Data — 10 hand-tuned quests.
// All unlocked at level 1 so the system can be tested end-to-end.
// quest.npcId = which archer NPC gives this quest.
// 5 archer NPCs total — Lyra/Vex/Kira/Noor/Zephyr each carry 2 quests.
// ─────────────────────────────────────────────

// Quest NPCs clustered ~6 units from player spawn so all are visible immediately.
// Y = 5 so snapToGround can place feet on terrain without sinking.
export const QUEST_NPCS = [
  { id: 'archer_lyra',    name: 'Lyra the Seeker',    pos: [6, 5, -3],    tint: 0x88c2ff }, // soft blue
  { id: 'archer_vex',     name: 'Vex the Hunter',     pos: [-6, 5, -3],   tint: 0xc488ff }, // soft purple
  { id: 'archer_kira',    name: 'Kira the Scout',     pos: [4, 5, 5],     tint: 0xffc488 }, // soft amber
  { id: 'archer_noor',    name: 'Noor the Wanderer',  pos: [-4, 5, 5],    tint: 0x88ffc4 }, // soft mint
  { id: 'archer_zephyr',  name: 'Zephyr the Silent',  pos: [0, 5, -7],    tint: 0xff88c4 }, // soft rose
];

export const QUESTS = [
  {
    id: 'q1_first_blood',
    unlockLevel: 1,
    npcId: 'archer_lyra',
    title: 'First Blood',
    description: "Welcome, traveler. The crimson ones to the north grow bolder by the hour. Slay three of them and return to me — prove you have steel in your hands.",
    objective: { type: 'kill', count: 3 },
    reward: { xp: 50, points: 1 },
    spawnCount: 3,
    spawnTier: 'normal',
  },
  {
    id: 'q2_clearing_path',
    unlockLevel: 1,
    npcId: 'archer_vex',
    title: 'Clearing the Path',
    description: "The southern fields are choked with hostile spirits. Cull five of them and the road to the inner sanctum will open. Move quickly — they multiply at dusk.",
    objective: { type: 'kill', count: 5 },
    reward: { xp: 80, points: 1 },
    spawnCount: 5,
    spawnTier: 'normal',
  },
  {
    id: 'q3_elite_hunt',
    unlockLevel: 1,
    npcId: 'archer_kira',
    title: 'Elite Hunt',
    description: "Among the rabble walks something stronger — an elite. Its hide is darker, its strikes heavier. Bring me proof of one slain elite and you'll have my respect.",
    objective: { type: 'kill_tier', tier: 'elite', count: 1 },
    reward: { xp: 100, points: 2 },
    spawnCount: 1,
    spawnTier: 'elite',
  },
  {
    id: 'q4_dual_blade',
    unlockLevel: 1,
    npcId: 'archer_noor',
    title: 'Dual Blade',
    description: "Your stance is sound but your tempo is loose. Defeat seven foes without falling — let me see if your blade keeps its rhythm under pressure.",
    objective: { type: 'kill', count: 7 },
    reward: { xp: 130, points: 2 },
    spawnCount: 7,
    spawnTier: 'normal',
  },
  {
    id: 'q5_silent_wind',
    unlockLevel: 1,
    npcId: 'archer_zephyr',
    title: 'The Silent Wind',
    description: "Two elites prowl the far edges of the arena. Hunt them both. Move like the wind — speak nothing, leave nothing standing.",
    objective: { type: 'kill_tier', tier: 'elite', count: 2 },
    reward: { xp: 160, points: 2 },
    spawnCount: 2,
    spawnTier: 'elite',
  },
  {
    id: 'q6_relentless',
    unlockLevel: 1,
    npcId: 'archer_lyra',
    title: 'Relentless',
    description: "You've grown. Now show me you can endure. Slay ten enemies in this run — any tier, any color. Let the arena know your name.",
    objective: { type: 'kill', count: 10 },
    reward: { xp: 200, points: 3 },
    spawnCount: 10,
    spawnTier: 'normal',
  },
  {
    id: 'q7_champion_call',
    unlockLevel: 1,
    npcId: 'archer_vex',
    title: 'The Champion Calls',
    description: "A champion has been seen at the arena's edge — a crowned beast among lesser kin. End its march. Bring it down once and I will share what I know of the deeper paths.",
    objective: { type: 'kill_tier', tier: 'champion', count: 1 },
    reward: { xp: 250, points: 3 },
    spawnCount: 1,
    spawnTier: 'champion',
  },
  {
    id: 'q8_swift_reckoning',
    unlockLevel: 1,
    npcId: 'archer_kira',
    title: 'Swift Reckoning',
    description: "Fifteen kills. That's the price of passage to the inner ring. No tricks, no shortcuts — just steel and resolve. Go.",
    objective: { type: 'kill', count: 15 },
    reward: { xp: 350, points: 3 },
    spawnCount: 15,
    spawnTier: 'normal',
  },
  {
    id: 'q9_twin_crowns',
    unlockLevel: 1,
    npcId: 'archer_noor',
    title: 'Twin Crowns',
    description: "Two champions remain. Their crowns are mine by right, but my legs no longer carry me. Bring them down for me — both, one after another. I will not forget this debt.",
    objective: { type: 'kill_tier', tier: 'champion', count: 2 },
    reward: { xp: 450, points: 4 },
    spawnCount: 2,
    spawnTier: 'champion',
  },
  {
    id: 'q10_arena_master',
    unlockLevel: 1,
    npcId: 'archer_zephyr',
    title: 'Arena Master',
    description: "The final trial. Twenty-five enemies. Any tier. No rest, no retreat. Walk back to me when the arena is silent — and the title of Arena Master will be yours.",
    objective: { type: 'kill', count: 25 },
    reward: { xp: 600, points: 5 },
    spawnCount: 25,
    spawnTier: 'normal',
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