// livingQuestData.js — A self-contained "Living Quest" that runs a FULL quest loop:
//   talk to NPC → get quest → go do a task (collect / fetch / defeat) → return →
//   dialogue & choices → next quest → resolution.
//
// Each "beat" is one step. A beat can be:
//  - type 'story'     → narrative card
//  - type 'dialogue'  → branching conversation line (choices carry `next`)
//  - type 'objective' → an interactive task you must DO before you can return
//  - type 'ending'    → consequence / reward card
// Beats are chained by `next` (or per-choice `next`), so the quest flows and branches.

export const QUEST_GIVER = {
  name: 'Eve',
  role: 'Architect of the Symbiotic OS',
  color: '#a855f7',
  accent: 'rgba(168,85,247,0.15)',
  portrait: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c5d34984a_ChatGPTImageJul22202503_41_59PM.png',
};

export const BEATS = {
  // ════════════════════════════════════════════════════════════════════════
  // QUEST 1 — "Recover the Fragment"  (talk → fetch task → return → dialogue)
  // ════════════════════════════════════════════════════════════════════════

  // STORY: opening
  intro: {
    id: 'intro',
    type: 'story',
    chapter: 'Chapter 1 — The First Breath',
    headline: 'A Universe in Her Gaze',
    body: "Before time carved its grooves into reality, there was only Will. From that Will came the First Breath — and you. Eve has been waiting for someone like you to wake inside the loop.",
    media: QUEST_GIVER.portrait,
    next: 'greet',
  },

  // DIALOGUE: meet the NPC, get the quest
  greet: {
    id: 'greet',
    type: 'dialogue',
    speaker: 'Eve',
    text: "So. You're awake. Most echoes never make it this far. Before we go further, I need your help — the System scattered fragments of your memory across Sector 7. Bring three back to me.",
    choices: [
      { label: "I'll find the fragments.", next: 'q1_objective', tone: 'bold' },
      { label: "What are these fragments?", next: 'greet_explain', tone: 'curious' },
      { label: "Why should I trust you?", next: 'greet_defiant', tone: 'defiant' },
    ],
  },
  greet_explain: {
    id: 'greet_explain',
    type: 'dialogue',
    speaker: 'Eve',
    text: "They're pieces of who you were before the loop wiped you. Each one you recover, the clearer you become. Go — they glow pale blue in the ruins.",
    choices: [
      { label: "Understood. I'll go.", next: 'q1_objective' },
    ],
  },
  greet_defiant: {
    id: 'greet_defiant',
    type: 'dialogue',
    speaker: 'Eve',
    text: "Sharp tongue. Good — you'll need it. I dreamt this world into being, and I'm the only one offering you a way out. Prove yourself: bring me the fragments.",
    choices: [
      { label: "Fine. I'll bring them.", next: 'q1_objective' },
    ],
  },

  // OBJECTIVE: go out and DO the task
  q1_objective: {
    id: 'q1_objective',
    type: 'objective',
    location: 'Sector 7 Ruins',
    headline: 'Recover the Memory Fragments',
    body: "Search the broken corridors of Sector 7. Three fragments of your past lie buried in the rubble — gather them all, then return to Eve.",
    media: 'https://images.unsplash.com/photo-1639149546376-52bae675b81a?q=80&w=1200',
    objective: { kind: 'collect', target: 'Memory Fragments', amount: 3 },
    returnLabel: 'Return to Eve',
    next: 'q1_return',
  },

  // DIALOGUE: return & resolve, then hand out the next quest
  q1_return: {
    id: 'q1_return',
    type: 'dialogue',
    speaker: 'Eve',
    text: "You found them. I can see it — your edges are sharper now, more real. But the System knows you're awake. It's sending hunters. There's one more thing I need before we can fight back.",
    choices: [
      { label: "Tell me. What's next?", next: 'q2_brief', tone: 'bold' },
      { label: "Let me rest a moment.", next: 'q1_rest', tone: 'curious' },
    ],
  },
  q1_rest: {
    id: 'q1_rest',
    type: 'dialogue',
    speaker: 'Eve',
    text: "Rest later. Out here, stillness is how echoes get erased. Listen — the hunters are already moving.",
    choices: [
      { label: "Alright. What do you need?", next: 'q2_brief' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // QUEST 2 — "Hold the Line"  (briefing → choose your task → return → verdict)
  // ════════════════════════════════════════════════════════════════════════

  q2_brief: {
    id: 'q2_brief',
    type: 'dialogue',
    speaker: 'Eve',
    text: "The hunters draw power from a corrupted spring near the old wetlands. You can fight them head-on, or cut their supply by tainting the spring with purified water and luring the spring-fish away. Your call — both crack the loop.",
    choices: [
      { label: '⚔️  Fight the hunters directly.', next: 'q2_defeat', tone: 'combat' },
      { label: '🌊  Sabotage the spring instead.', next: 'q2_fetch', tone: 'control' },
    ],
  },

  // OBJECTIVE A — combat path
  q2_defeat: {
    id: 'q2_defeat',
    type: 'objective',
    location: 'The Wetlands',
    headline: 'Defeat the Hunters',
    body: "Five System hunters patrol the wetland approach. Strike them down before they reach Eve's signal — then report back.",
    media: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200',
    objective: { kind: 'defeat', target: 'System Hunters', amount: 5 },
    returnLabel: 'Report to Eve',
    next: 'verdict',
  },

  // OBJECTIVE B — gather/fetch path
  q2_fetch: {
    id: 'q2_fetch',
    type: 'objective',
    location: 'The Old Wetlands',
    headline: 'Sabotage the Spring',
    body: "Collect four flasks of purified water from the upstream pools to taint the corrupted spring. The hunters' power will fade — then return to Eve.",
    media: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200',
    objective: { kind: 'fetch', target: 'Purified Water', amount: 4 },
    returnLabel: 'Return to Eve',
    next: 'verdict',
  },

  // DIALOGUE: the branching climax / verdict
  verdict: {
    id: 'verdict',
    type: 'dialogue',
    speaker: 'Eve',
    text: "It's done. The hunters are scattered and the loop is thinner than it's ever been. But at its heart sits a corrupted node — alive, aware, afraid. This is your verdict. What will you do with it?",
    choices: [
      { label: '⚔️  Destroy it — sever the System.', next: 'end_destroy', tone: 'combat' },
      { label: '🕊️  Free it — let it choose.', next: 'end_free', tone: 'mercy' },
      { label: '🧠  Absorb it — take its data.', next: 'end_absorb', tone: 'control' },
    ],
  },

  // ENDINGS — consequence beats
  end_destroy: {
    id: 'end_destroy',
    type: 'ending',
    chapter: 'Verdict — The Severance',
    headline: 'Warlord Path',
    body: "The node shatters. The System screams across the sector — and for the first time, it fears you. Eve watches in silence. \"Violence. That changes things between us.\"",
    reward: { xp: 320, path: 'Combat' },
    media: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200',
    tone: '#f87171',
  },
  end_free: {
    id: 'end_free',
    type: 'ending',
    chapter: 'Verdict — The Liberation',
    headline: 'Guardian Path',
    body: "You release the node. It dissolves into light, free at last. Eve smiles. \"You showed restraint. That matters more than you know — and the loop just lost a thread.\"",
    reward: { xp: 280, path: 'Mercy' },
    media: QUEST_GIVER.portrait,
    tone: '#6ec3ff',
  },
  end_absorb: {
    id: 'end_absorb',
    type: 'ending',
    chapter: 'Verdict — The Assimilation',
    headline: 'Operative Path',
    body: "You drink the node's data. Knowledge floods you — maps, secrets, the loop's true architecture. Eve narrows her eyes. \"Smart. But the System is watching you now too.\"",
    reward: { xp: 350, path: 'Control' },
    media: 'https://images.unsplash.com/photo-1639149546411-122415ab5332?q=80&w=1200',
    tone: '#34d399',
  },
};

export const FIRST_BEAT = 'intro';