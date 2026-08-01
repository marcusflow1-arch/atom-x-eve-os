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

  // ───────────────────────────────────────────
  // STORY ARC — "The Hollow Crown" (q11–q20)
  // The arena stands atop a sealed divine reactor. Its seal is cracking, and
  // the corrupted spill out. Quests chain via `requires` — each unlocks after
  // the previous is completed — and milestones grant abilities or a class change.
  // ───────────────────────────────────────────
  {
    id: 'q11_echoes_below',
    unlockLevel: 2,
    requires: 'q1_first_blood',
    npcId: 'archer_lyra',
    title: 'Echoes Below',
    description: "Have you heard it, traveler? A heartbeat under the arena floor. The old ones built a reactor down there to cage a fractured god — and its seal is cracking. The creatures pouring out are its echoes. Cut down eight of them while I read the fault lines.",
    objective: { type: 'kill', count: 8 },
    reward: { xp: 250, points: 2 },
    spawnCount: 8,
    spawnTier: 'normal',
  },
  {
    id: 'q12_shadow_rift',
    unlockLevel: 3,
    requires: 'q11_echoes_below',
    npcId: 'archer_zephyr',
    title: 'The Shadow Rift',
    description: "Lyra's fault lines end at a rift of pure shadow. Two elite wardens guard it — twisted keepers who once served the seal. Destroy them both, and I will teach you the step-between-shadows they used to patrol the deep halls.",
    objective: { type: 'kill_tier', tier: 'elite', count: 2 },
    reward: { xp: 350, points: 2, unlock: { type: 'ability', id: 'shadow_teleport', name: 'Shadow Teleport', icon: '🌀' } },
    spawnCount: 2,
    spawnTier: 'elite',
  },
  {
    id: 'q13_sparks_old_war',
    unlockLevel: 4,
    requires: 'q12_shadow_rift',
    npcId: 'archer_vex',
    title: 'Sparks of the Old War',
    description: "The rift you closed was one of twelve. In the first war, we sealed them with blood and lightning. The reactor remembers — and so do its spawn. Twelve rifts, twelve sparks: slay twelve of the corrupted before they reignite the old war.",
    objective: { type: 'kill', count: 12 },
    reward: { xp: 450, points: 3 },
    spawnCount: 12,
    spawnTier: 'normal',
  },
  {
    id: 'q14_trial_of_rage',
    unlockLevel: 5,
    requires: 'q13_sparks_old_war',
    npcId: 'archer_noor',
    title: 'Trial of Rage',
    description: "You fight with discipline — but discipline alone will not survive what sleeps below. The god's rage seeps upward, and one champion has drunk deep of it. Face it. Kill it. Take its fury for yourself and be reforged as a Berserker.",
    objective: { type: 'kill_tier', tier: 'champion', count: 1 },
    reward: { xp: 600, points: 3, unlock: { type: 'class', id: 'berserker', name: 'Berserker', icon: '🔥' } },
    spawnCount: 1,
    spawnTier: 'champion',
  },
  {
    id: 'q15_reactors_pulse',
    unlockLevel: 6,
    requires: 'q14_trial_of_rage',
    npcId: 'archer_kira',
    title: "The Reactor's Pulse",
    description: "The heartbeat is faster now — the reactor pulses with every kill you make, feeding on violence yet weakened by it. A paradox the old ones designed: only a warrior can drain it. Fifteen more echoes must fall before the pulse steadies.",
    objective: { type: 'kill', count: 15 },
    reward: { xp: 750, points: 3 },
    spawnCount: 15,
    spawnTier: 'normal',
  },
  {
    id: 'q16_stormcallers_rite',
    unlockLevel: 7,
    requires: 'q15_reactors_pulse',
    npcId: 'archer_lyra',
    title: "Stormcaller's Rite",
    description: "In the first war, the Stormcallers bound lightning itself to hold the seal. Their rite demands three elite hearts, offered under an open sky. Bring them down, and the storm will answer to your hand as it once answered theirs.",
    objective: { type: 'kill_tier', tier: 'elite', count: 3 },
    reward: { xp: 900, points: 4, unlock: { type: 'ability', id: 'lightning_strike', name: 'Lightning Strike', icon: '⚡' } },
    spawnCount: 3,
    spawnTier: 'elite',
  },
  {
    id: 'q17_vanguard_hollow',
    unlockLevel: 8,
    requires: 'q16_stormcallers_rite',
    npcId: 'archer_vex',
    title: 'Vanguard of the Hollow',
    description: "It knows your name now. The fractured god has raised a vanguard from the Hollow — eighteen soldiers of ash and memory marching on the arena. If one reaches the seal stone, everything we've bled for is undone. None may pass.",
    objective: { type: 'kill', count: 18 },
    reward: { xp: 1100, points: 4 },
    spawnCount: 18,
    spawnTier: 'normal',
  },
  {
    id: 'q18_oath_of_dawn',
    unlockLevel: 9,
    requires: 'q17_vanguard_hollow',
    npcId: 'archer_noor',
    title: 'Oath of the Dawn',
    description: "Rage carried you this far — but rage cannot hold a seal. That takes an oath. Two crowned champions carry fragments of the god's crown; reclaim both fragments and swear them to the light. Do this, and rise as a Paladin of the Dawn.",
    objective: { type: 'kill_tier', tier: 'champion', count: 2 },
    reward: { xp: 1400, points: 5, unlock: { type: 'class', id: 'paladin', name: 'Paladin', icon: '⛪' } },
    spawnCount: 2,
    spawnTier: 'champion',
  },
  {
    id: 'q19_winters_requiem',
    unlockLevel: 10,
    requires: 'q18_oath_of_dawn',
    npcId: 'archer_kira',
    title: "Winter's Requiem",
    description: "The god burns — so we answer with winter. The final rite of sealing was sung in frost, a requiem that froze the Hollow shut for a thousand years. Twenty echoes stand between you and the last verse. Silence them, and the frost is yours.",
    objective: { type: 'kill', count: 20 },
    reward: { xp: 1700, points: 5, unlock: { type: 'ability', id: 'frost_tornado', name: 'Frost Tornado', icon: '🌪️' } },
    spawnCount: 20,
    spawnTier: 'normal',
  },
  {
    id: 'q20_hollow_crown',
    unlockLevel: 12,
    requires: 'q19_winters_requiem',
    npcId: 'archer_zephyr',
    title: 'The Hollow Crown',
    description: "This is the end of it. Three champions — the god's last regalia — hold the broken crown above the reactor core. Destroy all three and the seal closes for another age. Walk out of that darkness alive, and you will have earned its deepest secret: the way of the Shadow Ranger.",
    objective: { type: 'kill_tier', tier: 'champion', count: 3 },
    reward: { xp: 2500, points: 6, unlock: { type: 'class', id: 'shadow_ranger', name: 'Shadow Ranger', icon: '🌑' } },
    spawnCount: 3,
    spawnTier: 'champion',
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
      (!q.requires || completedIds.includes(q.requires)) &&
      !acceptedIds.includes(q.id) &&
      !completedIds.includes(q.id)
  ) || null;
}