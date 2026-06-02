// livingQuestData.js — A self-contained "Living Quest" combining story + continuous dialogue.
// This drives the test scenario: a single questline told through narrative beats and
// multi-step branching conversation. No external store — fully playable on its own.

export const QUEST_GIVER = {
  name: 'Eve',
  role: 'Architect of the Symbiotic OS',
  color: '#a855f7',
  accent: 'rgba(168,85,247,0.15)',
  portrait: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c5d34984a_ChatGPTImageJul22202503_41_59PM.png',
};

// Each "beat" is one step of the living quest. A beat can be:
//  - type 'story'    → narrative card (the AI Story / Storyline content)
//  - type 'dialogue' → continuous dialogue line with optional branching choices
// Choices carry a `next` beat id, so the conversation flows and branches.
export const BEATS = {
  // ── STORY: opening chapter ──────────────────────────────────────────────
  intro: {
    id: 'intro',
    type: 'story',
    chapter: 'Chapter 1 — The First Breath',
    headline: 'A Universe in Her Gaze',
    body: "Before time carved its grooves into reality, there was only Will. From that Will came the First Breath — and you. Eve has been waiting for someone like you to wake inside the loop.",
    media: QUEST_GIVER.portrait,
    next: 'greet',
  },

  // ── DIALOGUE: continuous branching conversation ─────────────────────────
  greet: {
    id: 'greet',
    type: 'dialogue',
    speaker: 'Eve',
    text: "So. You're awake. Most echoes never make it this far. Tell me — do you remember why you're here?",
    choices: [
      { label: "I don't remember anything.", next: 'explain', tone: 'curious' },
      { label: "I'm here to break the loop.", next: 'bold', tone: 'bold' },
      { label: "Who are you to question me?", next: 'defiant', tone: 'defiant' },
    ],
  },
  explain: {
    id: 'explain',
    type: 'dialogue',
    speaker: 'Eve',
    text: "Of course you don't. The loop wipes you every cycle. But I kept a fragment of you safe. That fragment is your first quest — recover what the System stole.",
    choices: [
      { label: "Then show me the way.", next: 'mission' },
      { label: "Why should I trust you?", next: 'defiant' },
    ],
  },
  bold: {
    id: 'bold',
    type: 'dialogue',
    speaker: 'Eve',
    text: "Bold. I like that. But breaking the loop starts small — with a single corrupted node the System buried. Reach it, and the cracks begin.",
    choices: [
      { label: "Let's start the crack.", next: 'mission' },
    ],
  },
  defiant: {
    id: 'defiant',
    type: 'dialogue',
    speaker: 'Eve',
    text: "Sharp tongue. Good — you'll need it. I'm the one who dreamt this world into being. And right now, I'm the only one offering you a way out. Will you take it?",
    choices: [
      { label: "Fine. I'll hear you out.", next: 'mission' },
      { label: "Walk me through it.", next: 'explain' },
    ],
  },

  // ── STORY: transition beat ──────────────────────────────────────────────
  mission: {
    id: 'mission',
    type: 'story',
    chapter: 'Chapter 1A — Neural Link',
    headline: 'The Buried Node',
    body: "Eve marks a corrupted node deep in Sector 7. Reach it and decide its fate. Every choice from here echoes through everything that follows.",
    media: 'https://images.unsplash.com/photo-1639149546376-52bae675b81a?q=80&w=1200',
    next: 'verdict',
  },

  // ── DIALOGUE: the branching climax (the "quest decision") ───────────────
  verdict: {
    id: 'verdict',
    type: 'dialogue',
    speaker: 'Eve',
    text: "You've reached the node. It's alive — corrupted, but aware. What will you do? This is your verdict, and the loop is watching.",
    choices: [
      { label: '⚔️  Destroy it — sever the System.', next: 'end_destroy', tone: 'combat' },
      { label: '🕊️  Free it — let it choose.', next: 'end_free', tone: 'mercy' },
      { label: '🧠  Absorb it — take its data.', next: 'end_absorb', tone: 'control' },
    ],
  },

  // ── STORY: three endings (consequence beats) ────────────────────────────
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