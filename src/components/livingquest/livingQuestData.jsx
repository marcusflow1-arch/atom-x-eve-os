// livingQuestData.js — The "Living Quest" main-story line: Artemis, Kali & the demon incursion.
// Runs a FULL loop: talk to NPC → cinematic dialogue → accept quest → go defeat demons → return.
//
// Beat types:
//  - 'dialogue'  → spoken line (voiced) with branching choices (choices carry `next`)
//  - 'quest'     → the quest offer (Accept / Decline). Accepting spawns enemies in-world.
//  - 'ending'    → resolution / reward card
// Beats are chained by `next` (or per-choice `next`).

export const QUEST_GIVER = {
  name: 'Artemis',
  role: 'Huntress of the Waning Moon',
  color: '#a855f7',
  accent: 'rgba(168,85,247,0.15)',
  portrait: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c5d34984a_ChatGPTImageJul22202503_41_59PM.png',
};

export const BEATS = {
  // ── Opening: Artemis greets the player ──
  greet: {
    id: 'greet',
    type: 'dialogue',
    speaker: 'Artemis',
    text: "Stranger. You carry the scent of the living — rare, in these cursed fields. I am Artemis, and the moon above us is bleeding. Kali has torn the veil, and her demons pour through it.",
    choices: [
      { label: "Who is Kali?", next: 'explain_kali', tone: 'curious' },
      { label: "Tell me what you need.", next: 'brief', tone: 'bold' },
    ],
  },

  explain_kali: {
    id: 'explain_kali',
    type: 'dialogue',
    speaker: 'Artemis',
    text: "Kali — the Devourer, the Endless Dark. Once a goddess of endings, now a tyrant who feeds on souls. Her demons are her hands, and they reach for everything that still breathes. Including you.",
    choices: [
      { label: "Then I'll cut those hands off.", next: 'brief', tone: 'bold' },
    ],
  },

  brief: {
    id: 'brief',
    type: 'dialogue',
    speaker: 'Artemis',
    text: "A pack of Kali's demons has crossed into these fields, hunting for a relic of mine. Slay them before they find it. Do this, and I will fight at your side against the Devourer herself.",
    choices: [
      { label: "Show me the hunt.", next: 'offer', tone: 'bold' },
      { label: "And if I refuse?", next: 'refuse', tone: 'defiant' },
    ],
  },

  refuse: {
    id: 'refuse',
    type: 'dialogue',
    speaker: 'Artemis',
    text: "Then the demons feast tonight, and you with them. There is no neutral ground when Kali walks. Choose — the hunt, or the grave.",
    choices: [
      { label: "Fine. The hunt.", next: 'offer' },
    ],
  },

  // ── The quest offer (Accept / Decline) ──
  offer: {
    id: 'offer',
    type: 'quest',
    title: "Demons of the Bleeding Moon",
    giver: 'Artemis',
    objectiveText: 'Slay 5 of Kali\'s demons stalking the fields',
    spawnCount: 5,
    spawnTier: 'normal',
    reward: { xp: 300 },
    next: 'complete',
  },

  // ── Returning after the kills (handled by the quest tracker) ──
  complete: {
    id: 'complete',
    type: 'ending',
    chapter: 'The Hunt Answered',
    headline: 'Artemis Stands With You',
    body: "The demons lie scattered, their dark ichor steaming on the grass. Artemis lowers her bow. \"You fight like one who has nothing left to lose — good. Kali will need to fear something. Rest now. The true hunt begins soon.\"",
    reward: { xp: 300, path: 'Hunter' },
    media: QUEST_GIVER.portrait,
    tone: '#a855f7',
  },
};

export const FIRST_BEAT = 'greet';