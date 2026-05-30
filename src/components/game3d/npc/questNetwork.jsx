// questNetwork.js — Full quest definitions for all 4 NPCs + branching logic

export const QuestState = {
  NONE: 'NONE',
  ACTIVE: 'ACTIVE',
  READY_TO_TURN: 'READY_TO_TURN',
  COMPLETED: 'COMPLETED',
};

// ── NPC Definitions ───────────────────────────────────────────────────────────
export const NPC_DEFS = [
  {
    id: 'npc_stranger',
    name: 'The Stranger',
    icon: '🧑',
    alignment: 'mirror',
    color: '#f97316',
    accent: 'rgba(249,115,22,0.15)',
    position: { left: '15%', top: '65%' },
    quests: ['stranger_mirror', 'stranger_verdict'],
    trustGate: -50,
    // Uses CharacterSprite instead of emoji
    usesSprite: true,
  },
  {
    id: 'npc_artemis',
    name: 'Artemis',
    icon: '🧍‍♀️',
    alignment: 'truth',
    color: '#6ec3ff',
    accent: 'rgba(110,195,255,0.15)',
    position: { left: '25%', top: '40%' },
    quests: ['shared_corrupted', 'artemis_q1', 'artemis_q2'],
    // Which quests are blocked if trust is low
    trustGate: -30,
  },
  {
    id: 'npc_kali',
    name: 'Kali',
    icon: '⚔️',
    alignment: 'power',
    color: '#f87171',
    accent: 'rgba(248,113,113,0.15)',
    position: { left: '65%', top: '38%' },
    quests: ['shared_corrupted', 'kali_q1', 'kali_q2'],
    trustGate: -40,
  },
  {
    id: 'npc_skadi',
    name: 'Skadi',
    icon: '🌑',
    alignment: 'memory',
    color: '#a78bfa',
    accent: 'rgba(167,139,250,0.15)',
    position: { left: '45%', top: '60%' },
    quests: ['skadi_q1', 'skadi_q2'],
    trustGate: -20,
    // Skadi only appears after interrogate path
    appearsAfterFlag: 'interrogated_target',
  },
  {
    id: 'npc_system',
    name: 'System',
    icon: '🖥️',
    alignment: 'control',
    color: '#34d399',
    accent: 'rgba(52,211,153,0.15)',
    position: { left: '80%', top: '55%' },
    quests: ['system_q1', 'system_q2'],
    trustGate: -50,
    appearsAfterFlag: 'interrogated_target',
  },
];

// ── Quest Definitions ─────────────────────────────────────────────────────────
export const QUEST_DEFS = {

  // ── SHARED QUEST (all paths branch here) ──────────────────────────────────
  shared_corrupted: {
    id: 'shared_corrupted',
    title: 'The Corrupted Entity',
    npcId: 'npc_artemis', // offered by Artemis first
    description: 'A corrupted entity destabilizes the sector. Deal with it.',
    killTarget: 2,
    hasBranching: true,
    branches: {
      kill:         { label: 'Eliminate it',    icon: '⚔️' },
      spare:        { label: 'Let it go',        icon: '🕊️' },
      interrogate:  { label: 'Extract data',    icon: '🧠' },
    },
    dialogue: {
      NONE:     "A corrupted entity has been detected nearby. It's destabilizing everything. I need you to deal with it — but how you deal with it… that's your choice.",
      ACTIVE:   "The entity is still out there. Defeat {killTarget} corrupted units first, then make your decision.",
      READY_TO_TURN: "You've weakened it. Now — what will you do? This choice will echo through everything that follows.",
      COMPLETED:"You made your choice. The consequences are already unfolding.",
    },
    memoryDialogue: {
      killed: "I didn't expect you to choose violence. That… changes things between us.",
      spared: "You showed restraint. That matters more than you know.",
      interrogated: "You extracted the data. Smart. The System is watching you now.",
    },
    rewards: {
      kill:         { xp: 300, currency: 150, flag: 'killed_first_target',    pathScore: { combat: 3, chaos: 2 } },
      spare:        { xp: 250, currency: 120, flag: 'spared_target',          pathScore: { mercy: 3, control: 1 } },
      interrogate:  { xp: 350, currency: 200, flag: 'interrogated_target',    pathScore: { control: 4 } },
    },
    trustEffects: {
      kill:        { npc_artemis: -20, npc_kali: +20, npc_skadi: -10 },
      spare:       { npc_artemis: +20, npc_kali: -15, npc_skadi: +10 },
      interrogate: { npc_system: +25, npc_artemis: 0, npc_kali: -5 },
    },
  },

  // ── ARTEMIS QUESTLINE ──────────────────────────────────────────────────────
  artemis_q1: {
    id: 'artemis_q1',
    title: 'Signal in the Static',
    npcId: 'npc_artemis',
    description: 'Trace a distress signal before the System silences it.',
    killTarget: 1,
    requiredFlag: 'spared_target',
    blockedByFlag: 'killed_first_target',
    dialogue: {
      NONE:     "There's a signal — faint, fragmented. Someone or something is trying to break through the noise. I need a protector, not a destroyer. Are you that person?",
      ACTIVE:   "Clear the interference. Destroy {killTarget} disruption node to amplify the signal.",
      READY_TO_TURN: "The signal is clear. Come back — there's something you need to hear.",
      COMPLETED:"You heard it. The truth is louder than the System wants to admit.",
    },
    rewards: { xp: 280, currency: 130, flag: 'heard_signal', pathScore: { mercy: 2, control: 1 } },
    trustEffects: { npc_artemis: +15, npc_system: -10 },
  },

  artemis_q2: {
    id: 'artemis_q2',
    title: 'The Memory Cache',
    npcId: 'npc_artemis',
    description: 'Recover a suppressed memory archive before it is purged.',
    killTarget: 3,
    requiredFlag: 'heard_signal',
    dialogue: {
      NONE:     "The System is purging records — rewriting history. There's a cache of real memories hidden in the combat zone. Protect it.",
      ACTIVE:   "Defeat {killTarget} purge units threatening the memory cache.",
      READY_TO_TURN: "The cache is safe. This is proof the System has been lying.",
      COMPLETED:"The truth is preserved. Whatever happens next — you did that.",
    },
    rewards: { xp: 400, currency: 180, flag: 'memory_recovered', pathScore: { mercy: 3, control: 2 } },
    trustEffects: { npc_artemis: +25, npc_system: -20 },
  },

  // ── KALI QUESTLINE ─────────────────────────────────────────────────────────
  kali_q1: {
    id: 'kali_q1',
    title: 'Trial by Flame',
    npcId: 'npc_kali',
    description: 'Prove your strength by clearing the fire sector.',
    killTarget: 4,
    requiredFlag: 'killed_first_target',
    blockedByFlag: 'spared_target',
    dialogue: {
      NONE:     "You killed without hesitation. Good. Strength is the only honest language. Prove it again — the fire sector crawls with weakness.",
      ACTIVE:   "Burn through {killTarget} enemies. No mercy. Show me what you are.",
      READY_TO_TURN: "The sector is cleared. You fight like someone who understands the truth of this world.",
      COMPLETED:"Power is earned. You're beginning to understand.",
    },
    rewards: { xp: 350, currency: 200, flag: 'proved_strength', pathScore: { combat: 4, chaos: 2 } },
    trustEffects: { npc_kali: +20, npc_artemis: -15 },
  },

  kali_q2: {
    id: 'kali_q2',
    title: 'The Warlord\'s Gambit',
    npcId: 'npc_kali',
    description: 'Eliminate the rival faction leader who challenges Kali\'s domain.',
    killTarget: 1,
    requiredFlag: 'proved_strength',
    dialogue: {
      NONE:     "There is a rival. A faction leader who thinks power can be taken from me. I want them gone. Not weakened — gone. Can you deliver?",
      ACTIVE:   "Find and destroy {killTarget} faction commander. This ends now.",
      READY_TO_TURN: "It's done. The rival is finished. You've earned my respect — and my blade fights beside you now.",
      COMPLETED:"Dominance established. The world bends for those who take it.",
    },
    rewards: { xp: 500, currency: 280, flag: 'rival_eliminated', pathScore: { combat: 5, chaos: 3 } },
    trustEffects: { npc_kali: +30, npc_artemis: -25, npc_skadi: -10 },
  },

  // ── SKADI QUESTLINE (hidden — interrogate path only) ──────────────────────
  skadi_q1: {
    id: 'skadi_q1',
    title: 'Echoes of the Loop',
    npcId: 'npc_skadi',
    description: 'Investigate temporal anomalies left by the corrupted entity.',
    killTarget: 2,
    requiredFlag: 'interrogated_target',
    dialogue: {
      NONE:     "You extracted the data. Then you saw it — the echoes. This loop has been running longer than anyone admits. I've been watching. I need someone who asks questions. Will you help me understand what's real?",
      ACTIVE:   "Destroy {killTarget} temporal echo units. They're corrupting the timeline.",
      READY_TO_TURN: "The echoes are suppressed. For now. What you found — it changes the map of everything.",
      COMPLETED:"You see it now. The loop is not natural. Someone built it.",
    },
    rewards: { xp: 420, currency: 220, flag: 'loop_discovered', pathScore: { control: 3, chaos: 1 } },
    trustEffects: { npc_skadi: +30, npc_system: -15 },
  },

  skadi_q2: {
    id: 'skadi_q2',
    title: 'The Observer\'s Proof',
    npcId: 'npc_skadi',
    description: 'Gather evidence of the System\'s manipulation to expose the truth.',
    killTarget: 2,
    requiredFlag: 'loop_discovered',
    dialogue: {
      NONE:     "I have a theory. The System isn't maintaining order — it's manufacturing it. Every 'random' conflict, every corrupted entity — manufactured. I need proof from the core nodes.",
      ACTIVE:   "Destroy {killTarget} System core nodes and recover their logs.",
      READY_TO_TURN: "We have the proof. This is bigger than any of us. What you do with this… defines your legacy.",
      COMPLETED:"The truth is recorded. History will remember this moment — if the System doesn't erase it first.",
    },
    rewards: { xp: 500, currency: 260, flag: 'system_exposed', pathScore: { control: 4, mercy: 2 } },
    trustEffects: { npc_skadi: +25, npc_system: -30, npc_artemis: +15 },
  },

  // ── STRANGER QUESTLINE (mirror / rival) ──────────────────────────────────
  stranger_mirror: {
    id: 'stranger_mirror',
    title: 'The Mirror Test',
    npcId: 'npc_stranger',
    description: 'The Stranger is a version of you. Face your own echo — defeat three mirror projections of yourself.',
    killTarget: 3,
    hasBranching: false,
    dialogue: {
      NONE:     "I know your moves because they're mine. Same origin, different choices. Three mirror echoes are out there — reflections of your worst decisions. Destroy them, and I'll respect you. Maybe.",
      ACTIVE:   "Destroy {killTarget} mirror echoes. They fight like you — because they are you.",
      READY_TO_TURN: "You did it. You overcame yourself. That's harder than it sounds. Come back.",
      COMPLETED:"You're not just a player anymore. You're a variable the loop didn't account for.",
    },
    rewards: { xp: 320, currency: 160, flag: 'passed_mirror_test', pathScore: { combat: 2, control: 2 } },
    trustEffects: { npc_stranger: +30, npc_skadi: +10 },
  },

  stranger_verdict: {
    id: 'stranger_verdict',
    title: 'Verdict of Two Paths',
    npcId: 'npc_stranger',
    description: 'The Stranger demands you answer: are you the same, or different?',
    killTarget: 0,
    requiredFlag: 'passed_mirror_test',
    hasBranching: true,
    branches: {
      diverge:  { label: 'We are different. I forge my own path.', icon: '🔀' },
      converge: { label: 'We are the same. I embrace the parallel.', icon: '🔗' },
    },
    dialogue: {
      NONE:     "You passed the mirror test. Now answer the only question that matters: are you me, or aren't you?",
      ACTIVE:   "Make your choice. The loop is watching.",
      READY_TO_TURN: "Speak your verdict.",
      COMPLETED:"The parallel is settled. The loop registers your answer.",
    },
    memoryDialogue: {
      diverge:  "Different paths. Same war. I'll see you on the other side.",
      converge: "At last. Two become one pattern. We'll be unstoppable.",
    },
    rewards: {
      diverge:  { xp: 220, currency: 110, flag: 'diverged_from_stranger', pathScore: { mercy: 2, control: 1 } },
      converge: { xp: 220, currency: 110, flag: 'converged_with_stranger', pathScore: { combat: 3 } },
    },
    trustEffects: {
      diverge:  { npc_stranger: -10, npc_artemis: +15, npc_skadi: +10 },
      converge: { npc_stranger: +40, npc_kali: +10 },
    },
  },

  // ── SYSTEM QUESTLINE (control path) ──────────────────────────────────────
  system_q1: {
    id: 'system_q1',
    title: 'Protocol Enforcement',
    npcId: 'npc_system',
    description: 'Enforce System protocols by eliminating non-compliant entities.',
    killTarget: 3,
    requiredFlag: 'interrogated_target',
    dialogue: {
      NONE:     "Operative. Your data extraction confirmed our interest in you. Non-compliant entities threaten stability. Eliminate them. Compliance is order. Order is survival.",
      ACTIVE:   "Terminate {killTarget} non-compliant entities. Precision. No collateral.",
      READY_TO_TURN: "Targets neutralized. Your efficiency is noted. Report for further assignment.",
      COMPLETED:"Well-executed. The System remembers loyalty.",
    },
    rewards: { xp: 380, currency: 240, flag: 'system_operative', pathScore: { control: 5 } },
    trustEffects: { npc_system: +25, npc_artemis: -20, npc_skadi: -15, npc_kali: -10 },
  },

  system_q2: {
    id: 'system_q2',
    title: 'The Compliance Protocol',
    npcId: 'npc_system',
    description: 'Silence those who discovered the System\'s true nature.',
    killTarget: 1,
    requiredFlag: 'system_operative',
    blockedByFlag: 'system_exposed', // can't complete if Skadi exposed System
    dialogue: {
      NONE:     "An observer has gathered dangerous data. Skadi. She threatens the architecture of order. Silence her findings — by whatever means necessary. This is your final evaluation.",
      ACTIVE:   "Locate and eliminate {killTarget} threat to System integrity.",
      READY_TO_TURN: "The threat is contained. You are now a full System operative. Your rewards are significant.",
      COMPLETED:"Order restored. You are part of the System now.",
    },
    rewards: { xp: 600, currency: 350, flag: 'system_loyal', pathScore: { control: 6, chaos: -2 } },
    trustEffects: { npc_system: +40, npc_skadi: -100, npc_artemis: -30, npc_kali: -20 },
  },
};

export const QUEST_LIST = Object.values(QUEST_DEFS);
export function getQuestDef(id) { return QUEST_DEFS[id] || null; }

// ── Determine available quests for an NPC given world flags ──────────────────
export function getAvailableQuestsForNPC(npcId, questEntries, flags) {
  const npc = NPC_DEFS.find(n => n.id === npcId);
  if (!npc) return [];
  return npc.quests.filter(qId => {
    const def = QUEST_DEFS[qId];
    if (!def) return false;
    const entry = questEntries[qId] || {};
    if (entry.state === QuestState.COMPLETED) return false;
    if (def.requiredFlag && !flags[def.requiredFlag]) return false;
    if (def.blockedByFlag && flags[def.blockedByFlag]) return false;
    return true;
  });
}

// ── Endgame path based on path scores ────────────────────────────────────────
export function getEndgamePath(pathScores) {
  const { combat, mercy, control } = pathScores;
  const max = Math.max(combat, mercy, control);
  if (max === 0) return null;
  if (combat >= max) return { path: 'power',   title: 'Warlord Ending',   npc: 'Kali',    color: '#f87171' };
  if (mercy  >= max) return { path: 'truth',   title: 'Guardian Ending',  npc: 'Artemis', color: '#6ec3ff' };
  return               { path: 'control', title: 'Operative Ending', npc: 'System',  color: '#34d399' };
}