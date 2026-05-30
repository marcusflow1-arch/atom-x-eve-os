// npcNetworkData.js — All NPC definitions, questlines, branching dialogue

export const NPCS_NETWORK = [
  {
    id: 'npc_stranger',
    name: 'The Stranger',
    icon: '🧑',
    role: 'Mirror / Rival',
    color: '#f97316',
    position: { left: '18%', top: '62%' },
    intro: "Familiar, aren't I? That's because I'm what you could have become. I have one last test for you.",
    trustLines: {
      hostile:  "You chose a different path than me. I respect that — barely.",
      neutral:  "We share the same origin. What we do with that is another matter.",
      friendly: "You're more like me than you admit. That's not a bad thing.",
    },
  },
  {
    id: 'npc_artemis',
    name: 'Artemis',
    icon: '🧍‍♀️',
    role: 'Support / Truth',
    color: '#6ec3ff',
    position: { left: '28%', top: '40%' },
    intro: "I've been watching you. There's a target that needs dealing with — but how you deal with it will say everything about who you are.",
    trustLines: {
      hostile:  "Don't come near me. You've shown what you really are.",
      neutral:  "You look capable. I need help dealing with something nearby.",
      friendly: "I'm glad it's you. I trust your judgment more than most.",
    },
  },
  {
    id: 'npc_skadi',
    name: 'Skadi',
    icon: '🧍',
    role: 'Observer / Memory',
    color: '#a78bfa',
    position: { left: '65%', top: '35%' },
    intro: "I remember everything. Every loop, every choice. You've been here before — even if you don't know it yet.",
    trustLines: {
      hostile:  "The pattern shows you cannot be trusted. I've updated my model.",
      neutral:  "I observe. I record. I do not judge — yet.",
      friendly: "Your pattern is diverging from all previous iterations. Interesting.",
    },
  },
  {
    id: 'npc_kali',
    name: 'Kali',
    icon: '🧍‍♂️',
    role: 'Power / Combat',
    color: '#ef4444',
    position: { left: '50%', top: '60%' },
    intro: "Mercy is a weakness the enemy will exploit. Strike hard, and strike now.",
    trustLines: {
      hostile:  "You hesitate too much. Weakness has no place here.",
      neutral:  "Prove yourself in battle and I'll respect you.",
      friendly: "You fight without restraint. That's all that matters.",
    },
  },
  {
    id: 'npc_system',
    name: 'System',
    icon: '🤖',
    role: 'Control / Manipulation',
    color: '#fbbf24',
    position: { left: '80%', top: '58%' },
    intro: "Compliance is efficiency. I have a task. Your execution will be evaluated.",
    trustLines: {
      hostile:  "Deviation detected. Recalibrating threat assessment.",
      neutral:  "Your choices are being logged.",
      friendly: "Optimal agent. Access level elevated.",
    },
  },
];

// ── Quest network ─────────────────────────────────────────────────────────────

export const QUEST_NETWORK = [
  // ── Shared quest — offered by Artemis, outcomes ripple to all ──────────────
  {
    id: 'qn_001',
    name: 'The Corrupted Entity',
    npcId: 'npc_artemis',
    description: 'A corrupted entity is destabilizing the sector. How you handle it will shape everything that follows.',
    objective: 'Confront the entity',
    killTarget: 0, // no kill required — choice-driven
    isChoiceQuest: true,
    choices: [
      {
        id: 'choice_kill',
        label: '⚔️ Eliminate it.',
        consequence: 'killed_first_target',
        trustDeltas: { npc_kali: 25, npc_artemis: -20, npc_system: 10 },
        pathScore: { combat: 2, chaos: 1 },
        chaosAdjust: 15,
        reward: { xp: 150, currency: 60 },
        unlocks: ['qn_002_kali', 'qn_003_system'],
        locks: ['qn_002_artemis'],
        nextDialogue: "Violence was your answer. I won't pretend I'm surprised.",
      },
      {
        id: 'choice_spare',
        label: '🕊️ Let it go.',
        consequence: 'spared_first_target',
        trustDeltas: { npc_artemis: 30, npc_skadi: 15, npc_kali: -20 },
        pathScore: { mercy: 2, control: 1 },
        chaosAdjust: -10,
        reward: { xp: 100, currency: 80 },
        unlocks: ['qn_002_artemis', 'qn_002_skadi'],
        locks: ['qn_002_kali'],
        nextDialogue: "You showed restraint. That matters more than you know.",
      },
      {
        id: 'choice_interrogate',
        label: '🔍 Interrogate it first.',
        consequence: 'interrogated_first',
        trustDeltas: { npc_skadi: 25, npc_artemis: 10, npc_system: -10 },
        pathScore: { control: 2, mercy: 1 },
        chaosAdjust: 0,
        reward: { xp: 200, currency: 50, specialAbility: 'echo_trace' },
        unlocks: ['qn_hidden_skadi', 'qn_002_skadi'],
        locks: [],
        nextDialogue: "You chose information over action. The hidden questline opens.",
      },
    ],
    dialogue: {
      NONE:          null, // use trust-based line from NPC
      ACTIVE:        "The entity awaits. Your choice will echo further than you think.",
      READY_TO_TURN: null, // choice-driven, no turn-in needed
      COMPLETED:     "Done. But the consequences are only beginning.",
    },
  },

  // ── Artemis path ───────────────────────────────────────────────────────────
  {
    id: 'qn_002_artemis',
    name: 'The Proof',
    npcId: 'npc_artemis',
    description: 'Artemis needs you to gather proof before acting — no violence.',
    objective: 'Gather 3 intel fragments',
    killTarget: 3,
    isChoiceQuest: false,
    prerequisiteFlag: 'spared_first_target',
    trustBonus: { npc_artemis: 20 },
    reward: { xp: 180, currency: 90, buff: 'control_boost' },
    dialogue: {
      NONE:    "You spared the entity — now let's find out why it was corrupted. Gather what you can.",
      ACTIVE:  "Keep searching. The answer is in the data.",
      READY_TO_TURN: "You found it. The corruption wasn't random — someone caused this.",
      COMPLETED: "You've given me hope that reason still exists here.",
    },
  },

  // ── Kali path ─────────────────────────────────────────────────────────────
  {
    id: 'qn_002_kali',
    name: 'The Purge',
    npcId: 'npc_kali',
    description: 'Kali wants the area cleared — no mercy, no questions.',
    objective: 'Eliminate 5 corrupted units',
    killTarget: 5,
    isChoiceQuest: false,
    prerequisiteFlag: 'killed_first_target',
    trustBonus: { npc_kali: 25, npc_artemis: -10 },
    reward: { xp: 220, currency: 100, buff: 'damage_boost' },
    dialogue: {
      NONE:    "You made the right call earlier. Now finish the job — clear this zone entirely.",
      ACTIVE:  "Still standing? Good. More to kill. Keep moving.",
      READY_TO_TURN: "That's what power looks like. The zone is clear.",
      COMPLETED: "You're useful. I'll remember that.",
    },
  },

  // ── Skadi path ────────────────────────────────────────────────────────────
  {
    id: 'qn_002_skadi',
    name: 'The Memory',
    npcId: 'npc_skadi',
    description: 'Skadi has detected a memory echo — track it across the loop.',
    objective: 'Find 2 memory echoes',
    killTarget: 2,
    isChoiceQuest: false,
    prerequisiteFlag: null,
    trustBonus: { npc_skadi: 20 },
    reward: { xp: 160, currency: 70, buff: 'chain_duration' },
    dialogue: {
      NONE:    "There are echoes here from a previous loop. I need you to trace them — they hold answers.",
      ACTIVE:  "The echoes are fading. You must find them before the next reset.",
      READY_TO_TURN: "You've seen it too. The loop is not random — it's directed.",
      COMPLETED: "I've updated my records. You're beginning to understand.",
    },
  },

  // ── System path ───────────────────────────────────────────────────────────
  {
    id: 'qn_003_system',
    name: 'Compliance Protocol',
    npcId: 'npc_system',
    description: 'The System requires you to neutralize a deviation. No questions.',
    objective: 'Neutralize 4 deviants',
    killTarget: 4,
    isChoiceQuest: false,
    prerequisiteFlag: 'killed_first_target',
    trustBonus: { npc_system: 30, npc_artemis: -25, npc_skadi: -15 },
    reward: { xp: 250, currency: 120, buff: 'chain_scaling' },
    dialogue: {
      NONE:    "Deviation detected in sector 7. Neutralize all units. Compliance is efficiency.",
      ACTIVE:  "Progress insufficient. Accelerate elimination protocol.",
      READY_TO_TURN: "Compliance confirmed. Uploading reward package.",
      COMPLETED: "Performance rated: optimal. Access tier elevated.",
    },
  },

  // ── Stranger questline (mirror of the player) ────────────────────────────
  {
    id: 'qn_stranger_mirror',
    name: 'The Mirror Test',
    npcId: 'npc_stranger',
    description: 'The Stranger presents you with a reflection of your own choices. Pass the trial to unlock a permanent buff.',
    objective: 'Defeat 3 mirror echoes',
    killTarget: 3,
    isChoiceQuest: false,
    prerequisiteFlag: null,
    trustBonus: { npc_stranger: 30 },
    reward: { xp: 300, currency: 150, buff: 'mirror_resilience', specialAbility: 'echo_strike' },
    dialogue: {
      NONE:    "You've faced others — now face yourself. Three echoes of your past choices roam this sector. Defeat them.",
      ACTIVE:  "The echoes fight using your own patterns. Adapt or fall.",
      READY_TO_TURN: "You overcame your own shadow. That's rarer than you know.",
      COMPLETED: "The mirror no longer holds power over you. Take this — you earned it.",
    },
  },
  {
    id: 'qn_stranger_verdict',
    name: 'Verdict of Two Paths',
    npcId: 'npc_stranger',
    description: 'The Stranger demands a final reckoning: will you diverge or converge?',
    objective: 'Choose your verdict',
    killTarget: 0,
    isChoiceQuest: true,
    prerequisiteFlag: null,
    choices: [
      {
        id: 'choice_diverge',
        label: '🔀 We are different. I forge my own path.',
        consequence: 'diverged_from_stranger',
        trustDeltas: { npc_stranger: -15, npc_artemis: 20, npc_skadi: 10 },
        pathScore: { control: 2 },
        chaosAdjust: -5,
        reward: { xp: 200, currency: 100, buff: 'independence_aura' },
        unlocks: [],
        locks: [],
        nextDialogue: "Then go. Prove you're more than a reflection.",
      },
      {
        id: 'choice_converge',
        label: '🔗 We are the same. I embrace the parallel.',
        consequence: 'converged_with_stranger',
        trustDeltas: { npc_stranger: 40, npc_kali: 15 },
        pathScore: { combat: 3 },
        chaosAdjust: 10,
        reward: { xp: 200, currency: 100, buff: 'twin_strike' },
        unlocks: [],
        locks: [],
        nextDialogue: "At last, clarity. Together we are something new.",
      },
    ],
    dialogue: {
      NONE:    null,
      ACTIVE:  "The verdict must be spoken. Choose.",
      READY_TO_TURN: null,
      COMPLETED: "The choice is made. The loop registers it.",
    },
  },

  // ── Hidden Skadi questline (interrogation path only) ──────────────────────
  {
    id: 'qn_hidden_skadi',
    name: 'The Loop Architect',
    npcId: 'npc_skadi',
    description: 'Skadi reveals the true architect of the loop. This is the hidden path.',
    objective: 'Confront the Architect (defeat 1 boss)',
    killTarget: 1,
    isChoiceQuest: false,
    prerequisiteFlag: 'interrogated_first',
    isHidden: true,
    trustBonus: { npc_skadi: 40, npc_system: -40 },
    reward: { xp: 400, currency: 200, specialAbility: 'loop_break', buff: 'all_boost' },
    dialogue: {
      NONE:    "You asked the right question. No one else has. The Architect is real — and they're watching this conversation.",
      ACTIVE:  "The Architect knows you're coming. They will not make it easy.",
      READY_TO_TURN: "You broke the pattern. I've never seen this branch before.",
      COMPLETED: "The loop fractures. What happens now — I genuinely don't know.",
    },
  },
];

export function getNPCById(id) { return NPCS_NETWORK.find(n => n.id === id) || null; }
export function getNetworkQuest(id) { return QUEST_NETWORK.find(q => q.id === id) || null; }

export function getAvailableQuestsForNPC(npcId, flags, questStates) {
  return QUEST_NETWORK.filter(q => {
    if (q.npcId !== npcId) return false;
    if (q.prerequisiteFlag && !flags[q.prerequisiteFlag]) return false;
    // Not already completed
    const state = questStates[q.id]?.state;
    return state !== 'COMPLETED';
  });
}