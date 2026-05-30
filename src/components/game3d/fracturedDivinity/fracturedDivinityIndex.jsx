// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Master Index
// All arcs, quests, and utilities in one import surface
// ─────────────────────────────────────────────────────────────────────────────

export * from './fracturedDivinityQuests';          // Arcs 1–3 (Levels 1–15)
export * from './fracturedDivinityArc4';             // Arc 4  (Levels 16–20)
export * from './fracturedDivinityArc5';             // Arc 5  (Levels 21–25)
export * from './fracturedDivinityArc6';             // Arc 6  (Levels 26–30)
export * from './fracturedDivinityArc7';             // Arc 7  (Levels 31–35)
export * from './fracturedDivinityArc8';             // Arc 8  (Levels 36–40)
export * from './fracturedDivinityArc9';             // Arc 9  (Levels 41–45)
export * from './fracturedDivinityArc10';            // Arc 10 (Levels 46–50)

// ── ARC METADATA ─────────────────────────────────────────────────────────────
export const FRACTURED_DIVINITY_ARCS = [
  { id: 'arc1_3', title: 'Arcs 1–3', subtitle: 'The Foundation', levels: '1–15', file: 'fracturedDivinityQuests' },
  { id: 'arc4',   title: 'Arc 4',    subtitle: 'The Copy Mechanism', levels: '16–20', file: 'fracturedDivinityArc4' },
  { id: 'arc5',   title: 'Arc 5',    subtitle: 'The Virus Event',    levels: '21–25', file: 'fracturedDivinityArc5' },
  { id: 'arc6',   title: 'Arc 6',    subtitle: 'The False Peace',    levels: '26–30', file: 'fracturedDivinityArc6' },
  { id: 'arc7',   title: 'Arc 7',    subtitle: 'The Judgment Loop',  levels: '31–35', file: 'fracturedDivinityArc7' },
  { id: 'arc8',   title: 'Arc 8',    subtitle: 'Betrayal of the Divine', levels: '36–40', file: 'fracturedDivinityArc8' },
  { id: 'arc9',   title: 'Arc 9',    subtitle: 'The Final Split',    levels: '41–45', file: 'fracturedDivinityArc9' },
  { id: 'arc10',  title: 'Arc 10',   subtitle: 'Reclamation',        levels: '46–50', file: 'fracturedDivinityArc10' },
];

// ── QUEST AGGREGATOR ─────────────────────────────────────────────────────────
import { ALL_ARC4_QUESTS } from './fracturedDivinityArc4';
import { ALL_ARC5_QUESTS } from './fracturedDivinityArc5';
import { ALL_ARC6_QUESTS } from './fracturedDivinityArc6';
import { ALL_ARC7_QUESTS } from './fracturedDivinityArc7';
import { ALL_ARC8_QUESTS } from './fracturedDivinityArc8';
import { ALL_ARC9_QUESTS } from './fracturedDivinityArc9';
import { ALL_ARC10_QUESTS } from './fracturedDivinityArc10';

export const ALL_FRACTURED_DIVINITY_QUESTS = [
  ...ALL_ARC4_QUESTS,
  ...ALL_ARC5_QUESTS,
  ...ALL_ARC6_QUESTS,
  ...ALL_ARC7_QUESTS,
  ...ALL_ARC8_QUESTS,
  ...ALL_ARC9_QUESTS,
  ...ALL_ARC10_QUESTS,
];

export function getQuestsForLevel(playerLevel) {
  return ALL_FRACTURED_DIVINITY_QUESTS.filter(q => q.level <= playerLevel);
}

export function getQuestById(questId) {
  return ALL_FRACTURED_DIVINITY_QUESTS.find(q => q.id === questId) || null;
}

export function getDialogueNode(questId, nodeId) {
  const quest = getQuestById(questId);
  if (!quest?.dialogue) return null;
  return quest.dialogue.find(d => d.id === nodeId) || null;
}

// ── GAME STATE RESOLVER ───────────────────────────────────────────────────────
// Resolves dialogue for the current arc state (especially Arc 10 variants)
export function resolveDialogue(questId, nodeId, gameState = {}) {
  const node = getDialogueNode(questId, nodeId);
  if (!node) return null;
  if (node.variants && gameState.arc9Result && node.variants[gameState.arc9Result]) {
    return { ...node, ...node.variants[gameState.arc9Result] };
  }
  return node;
}

// ── OUTCOME TRACKING ─────────────────────────────────────────────────────────
export const BRANCHING_OUTCOMES = {
  arc4: ['SYNC', 'CONTROL_SET', 'REJECTED'],
  arc5: ['PURGE', 'STABILIZE', 'LET_RUN'],
  arc6: ['REJECTED', 'DELAYED', 'ACCEPTED'],
  arc7: ['BROKEN', 'STAYED', 'EXPLOITED'],
  arc8: ['FAILED', 'ROLE_ACCEPTED', 'AUTONOMY', 'HONEST'],
  arc9: ['INTEGRATED', 'CONTROLLED', 'SURRENDERED', 'DUAL'],
  arc10_final_word: ['WHOLE', 'FREE', 'DECIDED', 'MINE'],
  arc10_ending: ['OPEN', 'CHOSEN', 'RELATIONAL', 'FORWARD'],
};

export function getOutcomeDescription(arc, outcome) {
  const descriptions = {
    arc4: {
      SYNC: 'Synchronized — speed and depth combined. The most powerful and most vulnerable configuration.',
      CONTROL_SET: 'Controlled — Original leads, Copy advises. Tension maintained. Power held.',
      REJECTED: 'Rejected — desyncs increase. The Copy persists unacknowledged. Cost accumulates.',
    },
    arc5: {
      PURGE: 'Purged — virus removed violently. Artemis weakened. Clean ground for Arc 6.',
      STABILIZE: 'Stabilized — virus contained at 22%. You manage it. It watches you managing it.',
      LET_RUN: 'Let run — virus improvises. The Copy becomes a secondary vector. Information accumulates about the instruction set origin.',
    },
    arc6: {
      REJECTED: 'Rejected — left the false peace intact. Entered the real world carrying everything kept.',
      DELAYED: 'Delayed — stayed longer. Artemis partially eroded. The cost of hesitation.',
      ACCEPTED: 'Accepted — Arc 7 begins inside the peace. Reclaiming what was given away is Arc 7\'s first task.',
    },
    arc7: {
      BROKEN: 'Broken — chose uncertainty. The loop\'s demand refused. Arc 8 begins on open ground.',
      STAYED: 'Stayed — chose stability on your terms. The system noticed the difference.',
      EXPLOITED: 'Exploited — learned from the loop before leaving. The data is available in Arc 10.',
    },
    arc8: {
      FAILED: 'The Presence failed you. That position held. The Presence acknowledged it may be correct.',
      ROLE_ACCEPTED: 'The Presence had a role not requiring intervention. Partial understanding reached.',
      AUTONOMY: 'The Presence does not define your experience. Autonomy recognized.',
      HONEST: 'Unresolved. The full weight of not-understanding held without reduction.',
    },
    arc9: {
      INTEGRATED: 'Integrated — one voice, combined capacity. Depth and speed simultaneously.',
      CONTROLLED: 'Controlled — Original dominant, Copy available. Tension as structural feature.',
      SURRENDERED: 'Surrendered — Copy primary, Original as conscience. The rarest path.',
      DUAL: 'Dual — two entities, mutual acknowledgment, shared trust in Artemis.',
    },
    arc10_final_word: {
      WHOLE: 'Whole — the full word. Everything it means.',
      FREE: 'Free — genuine choice. Not absence of constraint.',
      DECIDED: 'Decided — not concluded, not finished. Decided.',
      MINE: 'Mine — thirteen years.',
    },
  };
  return descriptions[arc]?.[outcome] || 'No description available.';
}