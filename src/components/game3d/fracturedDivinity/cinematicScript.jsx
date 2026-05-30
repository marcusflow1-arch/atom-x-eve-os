// ─────────────────────────────────────────────────────────────────────────────
// DIVIDED: RECLAMATION — Full Cinematic Script
// Acts I–X + Prologue + Post-Credits + Voice Direction
// ─────────────────────────────────────────────────────────────────────────────

export const VOICE_DIRECTION = {
  PLAYER: {
    id: 'player',
    label: 'Player (V.O.)',
    arc: 'Grounded, evolving from confusion → authority. Emotional but controlled. Final arc = confident, centered.',
    toneProgression: ['confused', 'strained', 'urgent', 'resolute', 'authoritative'],
  },
  ARTEMIS: {
    id: 'artemis',
    label: 'Artemis',
    arc: 'Empathetic, human anchor. Shifts from uncertain → strong and clear. Emotional core of the story.',
    toneProgression: ['distant', 'uncertain', 'frightened', 'grounded', 'clear', 'strong'],
  },
  COPY: {
    id: 'copy',
    label: 'The Copy',
    arc: 'Calm, analytical, never overly emotional. Starts subtle → becomes dominant presence. Not evil — just decisive.',
    toneProgression: ['whisper', 'faint', 'emerging', 'clear', 'dominant'],
  },
  SYSTEM_VOICE: {
    id: 'system_voice',
    label: 'System Voice',
    arc: 'Mechanical, neutral. No emotion. Slight distortion.',
    toneProgression: ['neutral', 'distorted'],
  },
  PRESENCE: {
    id: 'presence',
    label: 'The Presence',
    arc: "Calm, vast, timeless. No urgency, no anger. Speaks like it doesn't need to explain.",
    toneProgression: ['vast', 'timeless', 'measured'],
  },
  WELCOMING_FIGURE: {
    id: 'welcoming_figure',
    label: 'The Welcoming Figure',
    arc: 'Warm but slightly "off." Comforting tone with hidden control.',
    toneProgression: ['warm', 'too_comfortable', 'controlling'],
  },
  UNKNOWN_VOICE: {
    id: 'unknown_voice',
    label: 'Unknown Voice',
    arc: 'Whispered, layered — as if multiple voices speaking simultaneously.',
    toneProgression: ['layered_whisper'],
  },
  FAINT_VOICE: {
    id: 'faint_voice',
    label: 'Faint Voice',
    arc: 'Post-credits. Barely audible. The signal that was never gone.',
    toneProgression: ['barely_audible'],
  },
};

// ── CINEMATIC SCENES ─────────────────────────────────────────────────────────

export const CINEMATICS = [

  // ─────────────────────────────────────────────────────────────────────────
  // PROLOGUE — "The First Fracture"
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'prologue',
    title: 'The First Fracture',
    label: 'Prologue',
    levelRange: null,
    sceneStyle: 'Dark void → fragmented reality forming',
    audio: { ambient: 'low_pulse', sfx: ['distant_whispers', 'heartbeat_slow_heavy'] },
    lines: [
      {
        id: 'p_sfx_1',
        type: 'sfx',
        text: 'Heartbeat… slow… heavy…',
        direction: 'BLACK SCREEN',
      },
      {
        id: 'p_1',
        speaker: 'UNKNOWN_VOICE',
        tone: 'layered_whisper',
        text: 'Something is wrong.',
        direction: 'whisper, layered',
      },
      {
        id: 'p_visual_1',
        type: 'visual',
        text: 'FLASHES — fragmented images: hands reaching, symbols breaking, a figure turning away',
      },
      {
        id: 'p_2',
        speaker: 'PLAYER',
        tone: 'strained',
        text: "I remember fighting… but not what I was fighting.",
        direction: 'V.O., strained',
      },
      {
        id: 'p_visual_2',
        type: 'visual',
        text: 'A faint silhouette (ARTEMIS) appears, flickering',
      },
      {
        id: 'p_3',
        speaker: 'ARTEMIS',
        tone: 'distant',
        text: '…Can you hear me?',
        direction: 'soft, distant',
      },
      {
        id: 'p_visual_3',
        type: 'visual',
        text: 'A second silhouette briefly overlaps the player — THE COPY',
      },
      {
        id: 'p_4',
        speaker: 'COPY',
        tone: 'whisper',
        text: "I've always been here.",
        direction: 'whisper',
      },
      {
        id: 'p_visual_4',
        type: 'visual',
        text: 'WORLD COLLAPSES → CUT TO WHITE',
      },
      {
        id: 'p_title',
        type: 'title_card',
        text: 'DIVIDED: RECLAMATION',
      },
    ],
    cameraDirection: 'Black screen → fragmented flash cuts → white out',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACT I — "Awakening to Conflict" (Levels 1–5)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'act_1',
    title: 'Awakening to Conflict',
    label: 'Act I',
    levelRange: [1, 5],
    sceneStyle: 'Broken terrain, unstable sky',
    audio: { ambient: 'broken_terrain_wind', sfx: ['distant_rumble'] },
    lines: [
      {
        id: 'a1_1',
        speaker: 'ARTEMIS',
        tone: 'uncertain',
        text: "You're awake… good. We don't have much time.",
      },
      {
        id: 'a1_2',
        speaker: 'PLAYER',
        tone: 'confused',
        text: 'What is this place?',
      },
      {
        id: 'a1_3',
        speaker: 'ARTEMIS',
        tone: 'uncertain',
        text: "It's not a place. It's… what's left.",
      },
      {
        id: 'a1_visual_1',
        type: 'visual',
        text: 'Enemy distortion forms in the distance',
      },
      {
        id: 'a1_4',
        speaker: 'COPY',
        tone: 'faint',
        text: "Or what's being taken.",
        direction: 'faint, barely audible',
      },
    ],
    cameraDirection: 'Slow orbit → tension build',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACT II — "Interference" (Levels 6–10)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'act_2',
    title: 'Interference',
    label: 'Act II',
    levelRange: [6, 10],
    sceneStyle: 'Movement glitches, paths shift',
    audio: { ambient: 'digital_glitch_low', sfx: ['path_shift_distortion'] },
    lines: [
      {
        id: 'a2_1',
        speaker: 'PLAYER',
        tone: 'confused',
        text: "That wasn't there before.",
      },
      {
        id: 'a2_2',
        speaker: 'ARTEMIS',
        tone: 'uncertain',
        text: "…Something's changing things.",
      },
      {
        id: 'a2_3',
        speaker: 'SYSTEM_VOICE',
        tone: 'neutral',
        text: 'Correction applied.',
        direction: 'first appearance — mechanical, slight distortion',
      },
      {
        id: 'a2_4',
        speaker: 'PLAYER',
        tone: 'confused',
        text: '…Did you hear that?',
      },
      {
        id: 'a2_5',
        speaker: 'ARTEMIS',
        tone: 'uncertain',
        text: '…Yeah.',
        direction: 'quiet',
      },
    ],
    cameraDirection: 'Static shot → sudden path-shift glitch cut',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACT III — "Protect Artemis" (Levels 11–15)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'act_3',
    title: 'Protect Artemis',
    label: 'Act III',
    levelRange: [11, 15],
    sceneStyle: 'Artemis weakened, surrounded by distortion',
    audio: { ambient: 'oppressive_drone', sfx: ['distortion_close', 'heartbeat_faster'] },
    lines: [
      {
        id: 'a3_1',
        speaker: 'ARTEMIS',
        tone: 'frightened',
        text: "…It's targeting me.",
      },
      {
        id: 'a3_2',
        speaker: 'PLAYER',
        tone: 'urgent',
        text: 'Stay behind me.',
        direction: 'urgent',
      },
      {
        id: 'a3_3',
        speaker: 'COPY',
        tone: 'faint',
        text: 'Or let me handle it.',
      },
      {
        id: 'a3_4',
        speaker: 'PLAYER',
        tone: 'resolute',
        text: 'No.',
      },
    ],
    cameraDirection: 'Close-up on player hands shaking → resolve sets in',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACT IV — "The Copy Emerges" (Levels 16–20)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'act_4',
    title: 'The Copy Emerges',
    label: 'Act IV',
    levelRange: [16, 20],
    sceneStyle: 'Reflection becomes independent',
    audio: { ambient: 'mirror_resonance', sfx: ['identity_split_tone'] },
    lines: [
      {
        id: 'a4_1',
        speaker: 'PLAYER',
        tone: 'strained',
        text: "…That's not possible.",
      },
      {
        id: 'a4_2',
        speaker: 'COPY',
        tone: 'emerging',
        text: 'You keep saying that.',
        direction: 'clear now — present, not faint',
      },
      {
        id: 'a4_3',
        speaker: 'ARTEMIS',
        tone: 'uncertain',
        text: "…There's two of you.",
      },
      {
        id: 'a4_4',
        speaker: 'COPY',
        tone: 'clear',
        text: 'Not two. Just… divided.',
      },
    ],
    cameraDirection: 'Slow reveal of the Copy standing separate from the player',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACT V — "The Virus Event" (Levels 21–25)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'act_5',
    title: 'The Virus Event',
    label: 'Act V',
    levelRange: [21, 25],
    sceneStyle: 'Reality glitching, repeating frames',
    audio: { ambient: 'audio_desync_loop', sfx: ['frame_stutter', 'reality_tear'] },
    lines: [
      {
        id: 'a5_1',
        speaker: 'ARTEMIS',
        tone: 'looping',
        text: "You're back… you're back…",
        direction: 'looping — same tone each repetition',
      },
      {
        id: 'a5_2',
        speaker: 'PLAYER',
        tone: 'urgent',
        text: "Stop—something's wrong!",
      },
      {
        id: 'a5_3',
        speaker: 'SYSTEM_VOICE',
        tone: 'distorted',
        text: 'Reality correction in progress.',
      },
      {
        id: 'a5_4',
        speaker: 'COPY',
        tone: 'clear',
        text: "It's rewriting everything.",
      },
    ],
    cameraDirection: 'Frame stutter, audio desync — camera itself appears to glitch',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACT VI — "The Fake Kingdom" (Levels 26–30)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'act_6',
    title: 'The Fake Kingdom',
    label: 'Act VI',
    levelRange: [26, 30],
    sceneStyle: 'Bright, peaceful, unnatural stillness',
    audio: { ambient: 'false_peace_hum', sfx: ['too_quiet', 'distant_bells'] },
    lines: [
      {
        id: 'a6_1',
        speaker: 'WELCOMING_FIGURE',
        tone: 'warm',
        text: "You've suffered enough.",
        direction: 'warm but slightly off — comfort with hidden control',
      },
      {
        id: 'a6_2',
        speaker: 'PLAYER',
        tone: 'confused',
        text: '…What is this?',
      },
      {
        id: 'a6_3',
        speaker: 'WELCOMING_FIGURE',
        tone: 'too_comfortable',
        text: 'Peace.',
      },
      {
        id: 'a6_4',
        speaker: 'ARTEMIS',
        tone: 'uncertain',
        text: '…It feels wrong.',
      },
      {
        id: 'a6_5',
        speaker: 'COPY',
        tone: 'clear',
        text: 'Because it is.',
      },
    ],
    cameraDirection: 'Wide establishing shot of false utopia → slow push toward the seam',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACT VII — "The Judgment Loop" (Levels 31–35)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'act_7',
    title: 'The Judgment Loop',
    label: 'Act VII',
    levelRange: [31, 35],
    sceneStyle: 'Repeating environment reset',
    audio: { ambient: 'loop_drone_building', sfx: ['reset_click', 'iteration_tone'] },
    lines: [
      {
        id: 'a7_1',
        speaker: 'ARTEMIS',
        tone: 'relieved',
        text: '…We made it out.',
      },
      {
        id: 'a7_reset',
        type: 'visual',
        text: '[RESET]',
      },
      {
        id: 'a7_2',
        speaker: 'ARTEMIS',
        tone: 'relieved',
        text: '…We made it out.',
        direction: 'exact same tone — the loop makes it identical',
      },
      {
        id: 'a7_3',
        speaker: 'PLAYER',
        tone: 'resolute',
        text: '…No we didn\'t.',
        direction: 'realizing — the weight of the recognition',
      },
      {
        id: 'a7_4',
        speaker: 'SYSTEM_VOICE',
        tone: 'neutral',
        text: 'Cycle maintained.',
      },
    ],
    cameraDirection: 'Identical shot repeated — the second iteration slightly earlier cut reveals the loop',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACT VIII — "Betrayal of the Divine" (Levels 36–40)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'act_8',
    title: 'Betrayal of the Divine',
    label: 'Act VIII',
    levelRange: [36, 40],
    sceneStyle: 'Vast emptiness → Presence forms',
    audio: { ambient: 'divine_resonance_low', sfx: ['presence_forming', 'vast_silence'] },
    lines: [
      {
        id: 'a8_1',
        speaker: 'PLAYER',
        tone: 'resolute',
        text: "Why didn't you help me?",
        direction: 'not angry — the genuine question, held weight',
      },
      {
        id: 'a8_2',
        speaker: 'PRESENCE',
        tone: 'vast',
        text: 'You endured.',
        direction: 'calm, vast, timeless — not a dismissal, a witness-function',
      },
      {
        id: 'a8_3',
        speaker: 'ARTEMIS',
        tone: 'strong',
        text: "That's not an answer!",
        direction: 'angry — her first moment of full clarity and force',
      },
      {
        id: 'a8_4',
        speaker: 'PRESENCE',
        tone: 'measured',
        text: 'You seek certainty where there is none.',
      },
    ],
    cameraDirection: 'Vast emptiness → the Presence forms slowly, dwarfing the characters — camera stays low',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACT IX — "The Final Split" (Levels 41–45)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'act_9',
    title: 'The Final Split',
    label: 'Act IX',
    levelRange: [41, 45],
    sceneStyle: 'Player and Copy face each other',
    audio: { ambient: 'identity_tension_low', sfx: ['mirror_crack', 'dual_heartbeat'] },
    lines: [
      {
        id: 'a9_1',
        speaker: 'COPY',
        tone: 'dominant',
        text: 'No more hiding behind each other.',
      },
      {
        id: 'a9_2',
        speaker: 'PLAYER',
        tone: 'resolute',
        text: "You're still me.",
      },
      {
        id: 'a9_3',
        speaker: 'COPY',
        tone: 'dominant',
        text: 'Then prove it.',
      },
      {
        id: 'a9_4',
        speaker: 'ARTEMIS',
        tone: 'strong',
        text: "Stop—this isn't helping!",
      },
    ],
    cameraDirection: 'Hard cuts between both perspectives — never settling on one for more than 2 seconds',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACT X — "Reclamation" (Levels 46–50) — FOUR VARIANT ENDINGS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'act_10',
    title: 'Reclamation',
    label: 'Act X — Final',
    levelRange: [46, 50],
    isMultiVariant: true,
    variants: [

      {
        id: 'ending_self_mastery',
        label: 'Self-Mastery',
        arcResult: 'INTEGRATED',
        sceneStyle: 'Calm, stable world',
        audio: { ambient: 'open_stable_air', sfx: ['world_settling'] },
        lines: [
          {
            id: 'e_sm_1',
            speaker: 'PLAYER',
            tone: 'authoritative',
            text: 'No more systems. No more control.',
          },
          {
            id: 'e_sm_2',
            speaker: 'ARTEMIS',
            tone: 'relieved',
            text: '…Just you.',
            direction: 'relieved — the first genuine breath in ten arcs',
          },
          {
            id: 'e_sm_3',
            speaker: 'COPY',
            tone: 'calm',
            text: '…Us.',
          },
          {
            id: 'e_sm_4',
            speaker: 'PLAYER',
            tone: 'authoritative',
            text: 'I decide what happens next.',
          },
        ],
        cameraDirection: 'Pull back → world expands outward from the player center',
      },

      {
        id: 'ending_creation',
        label: 'Creation',
        arcResult: 'DUAL',
        sceneStyle: 'Empty world forming',
        audio: { ambient: 'creation_pulse', sfx: ['world_building_sequence'] },
        lines: [
          {
            id: 'e_cr_1',
            speaker: 'PLAYER',
            tone: 'clear',
            text: "This isn't the end.",
          },
          {
            id: 'e_cr_2',
            speaker: 'ARTEMIS',
            tone: 'curious',
            text: '…Then what is it?',
          },
          {
            id: 'e_cr_3',
            speaker: 'PLAYER',
            tone: 'authoritative',
            text: 'A beginning.',
          },
          {
            id: 'e_cr_visual',
            type: 'visual',
            text: 'Environment builds in real-time around them',
          },
        ],
        cameraDirection: 'Static center shot while world constructs outward in all directions',
      },

      {
        id: 'ending_release',
        label: 'Release',
        arcResult: 'SURRENDERED',
        sceneStyle: 'Soft fade, minimal space',
        audio: { ambient: 'release_tone_soft', sfx: ['fade_breath'] },
        lines: [
          {
            id: 'e_rl_1',
            speaker: 'PLAYER',
            tone: 'peaceful',
            text: "I don't need to hold onto any of it.",
          },
          {
            id: 'e_rl_2',
            speaker: 'ARTEMIS',
            tone: 'soft',
            text: '…Then rest.',
            direction: 'soft — the first time she says that word without fear in it',
          },
          {
            id: 'e_rl_visual',
            type: 'visual',
            text: 'Fade to white',
          },
        ],
        cameraDirection: 'Slow fade — no dramatic pull, just quiet dissolution',
      },

      {
        id: 'ending_continuation',
        label: 'Continuation',
        arcResult: 'CONTROLLED',
        sceneStyle: 'Horizon ahead',
        audio: { ambient: 'forward_motion_ambient', sfx: ['footsteps_begin'] },
        lines: [
          {
            id: 'e_cn_1',
            speaker: 'PLAYER',
            tone: 'resolute',
            text: "There's more out there.",
          },
          {
            id: 'e_cn_2',
            speaker: 'COPY',
            tone: 'calm',
            text: 'Good.',
          },
          {
            id: 'e_cn_3',
            speaker: 'ARTEMIS',
            tone: 'strong',
            text: "Then let's go.",
          },
          {
            id: 'e_cn_visual',
            type: 'visual',
            text: 'They walk forward together toward the horizon',
          },
        ],
        cameraDirection: 'Tracks them walking — holds on the horizon as they become small against it',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POST-CREDITS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'post_credits',
    title: 'Post-Credits',
    label: 'Post-Credits',
    levelRange: null,
    sceneStyle: 'Subtle distortion returns',
    audio: { ambient: 'faint_signal', sfx: ['static_whisper'] },
    lines: [
      {
        id: 'pc_1',
        speaker: 'FAINT_VOICE',
        tone: 'barely_audible',
        text: '…Observation continues.',
        direction: 'barely audible — the signal that was never gone',
      },
      {
        id: 'pc_visual',
        type: 'visual',
        text: 'Cut to black',
      },
    ],
    cameraDirection: 'Holds on slight distortion ripple → hard cut to black',
  },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────

export function getCinematicById(id) {
  return CINEMATICS.find(c => c.id === id) || null;
}

export function getCinematicForLevel(level) {
  return CINEMATICS.find(c =>
    c.levelRange && level >= c.levelRange[0] && level <= c.levelRange[1]
  ) || null;
}

export function getEndingVariant(arcResult) {
  const act10 = getCinematicById('act_10');
  if (!act10?.variants) return null;
  return act10.variants.find(v => v.arcResult === arcResult) || act10.variants[0];
}

export function getAllSpeakers() {
  return Object.values(VOICE_DIRECTION);
}

export const CINEMATIC_ORDER = [
  'prologue',
  'act_1', 'act_2', 'act_3', 'act_4', 'act_5',
  'act_6', 'act_7', 'act_8', 'act_9', 'act_10',
  'post_credits',
];