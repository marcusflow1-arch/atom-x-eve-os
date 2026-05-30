// questData.js — Quest definitions & state constants

export const QuestState = {
  NONE:           'NONE',          // No quest offered yet
  ACTIVE:         'ACTIVE',        // Quest accepted, in progress
  READY_TO_TURN:  'READY_TO_TURN', // Objective complete, awaiting turn-in
  COMPLETED:      'COMPLETED',     // Fully turned in
};

export const QUESTS = [
  {
    id: 'quest_001',
    name: 'Clear the Distortion',
    npcId: 'npc_artemis',
    description: 'The Distortion entities are weakening the barrier. Eliminate them before the rift expands.',
    objective: 'Kill 3 Distortion enemies',
    killTarget: 3,
    rewards: { xp: 120, currency: 50 },
    dialogue: {
      [QuestState.NONE]:          "You look capable. I need help dealing with something nearby. The Distortion entities are multiplying — take 3 of them out.",
      [QuestState.ACTIVE]:        "You haven't finished the task yet. Come back when it's done.",
      [QuestState.READY_TO_TURN]: "You did it. I can feel it — the area is clear. Let me reward you properly.",
      [QuestState.COMPLETED]:     "Thanks again. I may have more work for you soon — the rift isn't fully closed.",
    },
    acceptText: "I'll handle it.",
    declineText: "Not right now.",
    turnInText:  "Here's my report.",
  },
  {
    id: 'quest_002',
    name: 'Silence the Sentinel',
    npcId: 'npc_artemis',
    description: 'A Loop Sentinel is patrolling dangerously close. It must be stopped.',
    objective: 'Kill the Loop Sentinel',
    killTarget: 1,
    rewards: { xp: 200, currency: 80 },
    dialogue: {
      [QuestState.NONE]:          "There's a Sentinel looping through the area. One kill — that's all I need from you.",
      [QuestState.ACTIVE]:        "It's still out there. I can feel it pacing. Finish the job.",
      [QuestState.READY_TO_TURN]: "The loop broke. That was you, wasn't it? Come collect what you're owed.",
      [QuestState.COMPLETED]:     "Well done. The pattern is disrupted... for now.",
    },
    acceptText: "Consider it done.",
    declineText: "Maybe later.",
    turnInText:  "Sentinel's down.",
  },
];

export function getQuestById(id) {
  return QUESTS.find(q => q.id === id) || null;
}