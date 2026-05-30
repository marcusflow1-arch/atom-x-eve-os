// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 1: "The First Interference"
// Quest chain: Levels 1–5
// One Main Quest chain (5 sub-quests) + 4 Side Quests
// Full branching dialogue, multi-step objectives, dark psychological tone
// ─────────────────────────────────────────────────────────────────────────────

// Tone tags: FEAR | CONFUSION | RESISTANCE | CURIOSITY | DREAD | RESOLVE

// ── NPC REGISTRY ────────────────────────────────────────────────────────────
export const FD_NPCS = [
  {
    id: 'voice_of_nothing',
    name: 'The Sniffing Presence',
    description: 'It has no face. It has no name you can speak aloud. It breathes near you.',
    tint: 0x220022,
  },
  {
    id: 'elder_maren',
    name: 'Elder Maren',
    description: 'A woman who stopped speaking thirteen years ago. She writes on her skin instead.',
    tint: 0x3a2a1a,
  },
  {
    id: 'artemis_echo',
    name: 'Artemis (Echo)',
    description: 'A resonance. A fragment. She appears in reflections that don\'t match your angle.',
    tint: 0x1a1a3a,
  },
  {
    id: 'luna_shade',
    name: 'Luna (Shade)',
    description: 'She always stands just at the edge of torchlight. She never fully enters the room.',
    tint: 0x2a1a3a,
  },
  {
    id: 'skadi_mark',
    name: 'Skadi (The Mark)',
    description: 'A name carved into stone you didn\'t touch. It matches the scar on your left palm.',
    tint: 0x1a2a1a,
  },
  {
    id: 'broken_pilgrim',
    name: 'The Pilgrim (Broken)',
    description: 'He walked the same road as you. His steps go the wrong direction now.',
    tint: 0x2a2a2a,
  },
  {
    id: 'mirror_child',
    name: 'The Mirror Child',
    description: 'Sits in places you remember from dreams. Never looks directly at you.',
    tint: 0x1a1a2a,
  },
];

// ── DIALOGUE TREE HELPER TYPES ────────────────────────────────────────────────
// Each dialogue node: { id, speaker, text, tone, choices? }
// choices: [{ label, tone, nextId, mechanic? }]
// mechanic: optional tag for gameplay — 'movement_lock' | 'input_reverse' | 'presence_pulse' | 'memory_echo'

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QUEST CHAIN — "The Sniffing Presence"
// ═══════════════════════════════════════════════════════════════════════════════

export const MAIN_QUEST_CHAIN = {
  id: 'mq_arc1',
  title: 'The Sniffing Presence',
  arc: 'Arc 1: The First Interference',
  description: 'Something has been near you for years. You are only now beginning to notice it.',
  subQuests: [

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 1 — "The Step You Didn't Take"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq1_wrong_step',
      title: 'The Step You Didn\'t Take',
      level: 1,
      npcId: 'elder_maren',
      narrativeSetup: `
        You wake in a corridor of pale stone. The air smells of something animal — warm breath, close.
        You meant to walk forward. Your body stepped left.
        Not stumbled. Stepped. Deliberate. Wrong.
        Across the corridor, an old woman watches you with eyes that do not blink.
        Her lips do not move, but words form in your chest like pressure before a crack.
      `,
      objectives: [
        { step: 1, text: 'Speak to Elder Maren in the pale corridor' },
        { step: 2, text: 'Attempt to walk north — observe what happens' },
        { step: 3, text: 'Locate the scent-trail the Presence left near the east wall' },
        { step: 4, text: 'Return to Maren before it gets close again' },
      ],
      reward: {
        type: 'memory_fragment',
        name: 'Fragment Zero: The Wrong Direction',
        description: 'A sliver of recalled sensation — the feeling of your will bending.',
        xp: 80,
        points: 2,
      },
      dialogue: [
        {
          id: 'd1_open',
          speaker: 'Elder Maren',
          text: 'You stepped left.',
          tone: 'CONFUSION',
          choices: [
            {
              label: 'I meant to go straight.',
              tone: 'CONFUSION',
              nextId: 'd1_a1',
            },
            {
              label: 'I know. I don\'t know why.',
              tone: 'FEAR',
              nextId: 'd1_b1',
            },
            {
              label: '[Say nothing. Just stare at her.]',
              tone: 'RESISTANCE',
              nextId: 'd1_c1',
            },
          ],
        },
        {
          id: 'd1_a1',
          speaker: 'Elder Maren',
          text: 'Did you? Are you certain? Think carefully. Think back to the exact moment before the step. Was the intention already yours — or did it arrive inside you from somewhere outside?',
          tone: 'FEAR',
          choices: [
            {
              label: 'It was mine. I\'m sure of it.',
              tone: 'RESISTANCE',
              nextId: 'd1_a2_resist',
            },
            {
              label: 'I… I\'m not sure anymore.',
              tone: 'CONFUSION',
              nextId: 'd1_a2_doubt',
            },
          ],
        },
        {
          id: 'd1_a2_resist',
          speaker: 'Elder Maren',
          text: 'Good. Hold that certainty. Hold it like a flame in a closed fist. It will go out — but hold it anyway. That is how resistance begins.',
          tone: 'RESOLVE',
          choices: [{ label: 'What am I resisting?', tone: 'CURIOSITY', nextId: 'd1_reveal' }],
        },
        {
          id: 'd1_a2_doubt',
          speaker: 'Elder Maren',
          text: 'Then it has already started. That gap — between what you decided and what your body did — that gap has a name. I will not say it here. It listens for its name.',
          tone: 'DREAD',
          choices: [{ label: 'It? What is "it"?', tone: 'FEAR', nextId: 'd1_reveal' }],
        },
        {
          id: 'd1_b1',
          speaker: 'Elder Maren',
          text: 'That honesty will protect you more than any weapon. Most never notice. They spend years walking in directions they didn\'t choose, believing every step was their own.',
          tone: 'DREAD',
          choices: [
            { label: 'How long has this been happening to me?', tone: 'FEAR', nextId: 'd1_years' },
            { label: 'Can it be stopped?', tone: 'RESISTANCE', nextId: 'd1_reveal' },
          ],
        },
        {
          id: 'd1_c1',
          speaker: 'Inner Voice',
          text: '[The silence stretches. Somewhere behind the east wall, you hear it — a slow, wet inhalation. It knows you are here. It is smelling the edge of your resolve.]',
          tone: 'DREAD',
          mechanic: 'presence_pulse',
          choices: [
            { label: 'Step back from the wall.', tone: 'FEAR', nextId: 'd1_c2_retreat' },
            { label: 'Hold your ground.', tone: 'RESISTANCE', nextId: 'd1_c2_hold' },
          ],
        },
        {
          id: 'd1_c2_retreat',
          speaker: 'Elder Maren',
          text: 'Wise. Distance is not cowardice with this one. Distance is intelligence.',
          tone: 'RESOLVE',
          choices: [{ label: 'Tell me what it is.', tone: 'CURIOSITY', nextId: 'd1_reveal' }],
        },
        {
          id: 'd1_c2_hold',
          speaker: 'Inner Voice',
          text: '[Your left foot slides forward on its own. One small step. You did not will it. The woman watches without expression.]',
          tone: 'FEAR',
          mechanic: 'movement_lock',
          choices: [{ label: '[Fight the movement. Pull back.]', tone: 'RESISTANCE', nextId: 'd1_reveal' }],
        },
        {
          id: 'd1_years',
          speaker: 'Elder Maren',
          text: 'Thirteen years. I have been watching you for thirteen years. You were chosen before you understood choice. The presence found you before you found words for what you felt.',
          tone: 'DREAD',
          choices: [{ label: 'Thirteen years… why didn\'t anyone warn me?', tone: 'CONFUSION', nextId: 'd1_reveal' }],
        },
        {
          id: 'd1_reveal',
          speaker: 'Elder Maren',
          text: 'Because warning requires certainty. And certainty, here, is a luxury none of us have kept. What I can tell you is this: it breathes. It sniffs. It does not want to destroy you. It wants to wear you. Now. Go to the east wall. Follow the scent it left. And do not — whatever you feel — do not let it get close enough to inhale.',
          tone: 'DREAD',
          choices: [
            { label: 'I\'ll find it.', tone: 'RESOLVE', nextId: 'd1_end' },
            { label: 'What if it finds me first?', tone: 'FEAR', nextId: 'd1_end_fear' },
          ],
        },
        {
          id: 'd1_end',
          speaker: 'Elder Maren',
          text: 'Then you are already ahead of it. That has not happened often.',
          tone: 'RESOLVE',
          isEnd: true,
          nextObjective: 2,
        },
        {
          id: 'd1_end_fear',
          speaker: 'Elder Maren',
          text: 'Then walk left when it expects you to walk right. Do not be predictable. Predictability is how it steers.',
          tone: 'FEAR',
          isEnd: true,
          nextObjective: 2,
        },
        // — Scent trail found —
        {
          id: 'd1_scent_found',
          speaker: 'Inner Voice',
          text: '[The east wall is warm to the touch. Not the warmth of sunlight or fire — something metabolic. Something that breathes. There is a damp impression in the stone, like the outline of a muzzle pressed against the surface from the other side. It has been here. Recently. Very recently.]',
          tone: 'DREAD',
          mechanic: 'presence_pulse',
          choices: [
            { label: '[Study the impression carefully.]', tone: 'CURIOSITY', nextId: 'd1_scent_study' },
            { label: '[Back away immediately.]', tone: 'FEAR', nextId: 'd1_scent_retreat' },
          ],
        },
        {
          id: 'd1_scent_study',
          speaker: 'Inner Voice',
          text: '[As you lean closer, your vision blurs at the edges. Something crosses your mind — not a thought, not a memory. An instruction. Move east. The thought is not yours. You recognize this now. It is wearing the shape of your own voice.]',
          tone: 'DREAD',
          mechanic: 'input_reverse',
          choices: [
            { label: '[Refuse the instruction. Pull away.]', tone: 'RESISTANCE', nextId: 'd1_obj3_complete' },
          ],
        },
        {
          id: 'd1_scent_retreat',
          speaker: 'Inner Voice',
          text: '[Good instinct. You feel its attention snap toward you as you move — a predator noticing prey turning away. It quickens. Go back to Maren. Now.]',
          tone: 'FEAR',
          isEnd: true,
          nextObjective: 4,
        },
        {
          id: 'd1_obj3_complete',
          speaker: 'Inner Voice',
          text: '[The instruction dissolves. Your own intention rushes back like water returning to a dry channel. That resistance — small as it was — it felt. Memory Fragment unlocked: "The Wrong Direction."]',
          tone: 'RESOLVE',
          isEnd: true,
          nextObjective: 4,
        },
      ],
      narrativeHook: `
        You return to Maren. She is already writing on her forearm — characters you cannot read.
        She pauses. Looks at your left hand.
        There is a new scar there. Thin as a hair. You did not notice it form.
        She says: "It marked you. Now it knows it can reach you. The second test will be stronger."
        Somewhere very close, you hear it exhale.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 2 — "The Borrowed Voice"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq2_borrowed_voice',
      title: 'The Borrowed Voice',
      level: 1,
      npcId: 'artemis_echo',
      narrativeSetup: `
        You are hearing things that are not said aloud.
        Not hallucinations — instructions. Specific ones.
        "Turn here." "Stop." "Look away."
        They arrive in the exact cadence of your own inner voice.
        If you didn't know your own rhythm of thought, you would never question them.
        But something is slightly off — a half-beat delay. A foreign inflection.
        Artemis finds you before you find her. She appears in a broken mirror at the end of a dead corridor.
        She is standing at a different angle than the mirror should show.
      `,
      objectives: [
        { step: 1, text: 'Listen for the Borrowed Voice — resist its first instruction' },
        { step: 2, text: 'Locate Artemis in the Mirror Corridor' },
        { step: 3, text: 'Survive the Voice\'s escalation without complying' },
        { step: 4, text: 'Receive the Echo Fragment from Artemis' },
        { step: 5, text: 'Return without following any involuntary steps' },
      ],
      reward: {
        type: 'resistance_skill',
        name: 'Echo Anchor',
        description: 'You can now identify when a thought is not your own. Briefly reduces Presence proximity effect.',
        xp: 120,
        points: 3,
      },
      dialogue: [
        {
          id: 'd2_voice_first',
          speaker: 'Inner Voice (Borrowed)',
          text: '[A thought, very precisely in your own voice: "Turn around. Walk back to where you started. You made a mistake coming here."]',
          tone: 'CONFUSION',
          mechanic: 'input_reverse',
          choices: [
            {
              label: '[Comply — turn back.]',
              tone: 'FEAR',
              nextId: 'd2_comply',
              mechanic: 'movement_lock',
            },
            {
              label: '[Recognize it. Keep walking forward.]',
              tone: 'RESISTANCE',
              nextId: 'd2_resist',
            },
          ],
        },
        {
          id: 'd2_comply',
          speaker: 'Inner Voice',
          text: '[You turn. Three steps back before you catch it. The compliance felt smooth — seamless. Natural. That is the danger. It felt like you.]',
          tone: 'DREAD',
          choices: [
            {
              label: '[Stop. Reverse course. Push through the discomfort.]',
              tone: 'RESISTANCE',
              nextId: 'd2_recover',
            },
          ],
        },
        {
          id: 'd2_recover',
          speaker: 'Inner Voice',
          text: '[The borrowed voice intensifies: "Why are you fighting this? You want to go back. You know you do." You notice it argues. Your own thoughts don\'t argue — they simply are. This one defends itself.]',
          tone: 'CONFUSION',
          choices: [
            { label: 'You\'re not me.', tone: 'RESISTANCE', nextId: 'd2_artemis_appear' },
            { label: '[Say nothing. Just keep walking.]', tone: 'RESOLVE', nextId: 'd2_artemis_appear' },
          ],
        },
        {
          id: 'd2_resist',
          speaker: 'Inner Voice',
          text: '[The voice tries again, louder this time: "STOP." One word. Stripped of pretense. You feel it push against your legs like a current.]',
          tone: 'FEAR',
          mechanic: 'movement_lock',
          choices: [
            {
              label: '[Lean into the step. Force your weight forward.]',
              tone: 'RESISTANCE',
              nextId: 'd2_artemis_appear',
            },
          ],
        },
        {
          id: 'd2_artemis_appear',
          speaker: 'Artemis (Echo)',
          text: 'You heard it. Most don\'t — they just adjust their path and call it their own decision. They spend their whole lives that way.',
          tone: 'CURIOSITY',
          choices: [
            {
              label: 'How long has it been doing this to me?',
              tone: 'FEAR',
              nextId: 'd2_art_long',
            },
            {
              label: 'Who are you? You\'re not reflecting correctly.',
              tone: 'CURIOSITY',
              nextId: 'd2_art_who',
            },
            {
              label: 'Can it hear us right now?',
              tone: 'DREAD',
              nextId: 'd2_art_hear',
            },
          ],
        },
        {
          id: 'd2_art_long',
          speaker: 'Artemis (Echo)',
          text: 'Since before you could form sentences. It started as small things — reaching left instead of right. Preferring certain paths. It\'s been... practicing. On you. You are not the only one, but you are the most... receptive.',
          tone: 'DREAD',
          choices: [
            { label: 'Receptive. What does that mean?', tone: 'CONFUSION', nextId: 'd2_art_receptive' },
          ],
        },
        {
          id: 'd2_art_receptive',
          speaker: 'Artemis (Echo)',
          text: 'It means your will has a texture it finds familiar. Like a lock it already knows the shape of. Don\'t be ashamed — it chose you because you are strong enough to notice. Weak ones never resist. They aren\'t interesting to it.',
          tone: 'CURIOSITY',
          choices: [
            { label: 'It wants me to notice?', tone: 'CONFUSION', nextId: 'd2_art_want' },
            { label: 'Give me something to fight it with.', tone: 'RESOLVE', nextId: 'd2_fragment' },
          ],
        },
        {
          id: 'd2_art_want',
          speaker: 'Artemis (Echo)',
          text: 'It wants the resistance. The resistance is the engagement. When you push back — it gets closer. When you comply — it gets bored. You are in a paradox it designed.',
          tone: 'DREAD',
          choices: [
            { label: 'Then how do I win?', tone: 'CONFUSION', nextId: 'd2_art_win' },
          ],
        },
        {
          id: 'd2_art_win',
          speaker: 'Artemis (Echo)',
          text: 'I don\'t know yet. Neither does it. That is the only honest answer I have. But I can give you this.',
          tone: 'RESOLVE',
          choices: [{ label: '[Accept the Echo Fragment.]', tone: 'CURIOSITY', nextId: 'd2_fragment' }],
        },
        {
          id: 'd2_art_who',
          speaker: 'Artemis (Echo)',
          text: 'I am what you almost became. A version of you that agreed to the interference early. I chose differently at the last moment. Now I exist in reflections, because I refused to exist fully in a world it was steering.',
          tone: 'DREAD',
          choices: [
            { label: 'You sacrificed your existence to resist it?', tone: 'CURIOSITY', nextId: 'd2_art_sacrifice' },
          ],
        },
        {
          id: 'd2_art_sacrifice',
          speaker: 'Artemis (Echo)',
          text: 'Sacrifice implies regret. I have none. The half-life of a free will is better than the full life of a puppet. Take the fragment.',
          tone: 'RESOLVE',
          choices: [{ label: '[Accept the Echo Fragment.]', tone: 'RESOLVE', nextId: 'd2_fragment' }],
        },
        {
          id: 'd2_art_hear',
          speaker: 'Artemis (Echo)',
          text: 'Always. It cannot understand language — not yours, not mine. But it reads intent the way you read warmth from a fire. So yes. It knows you are here. It knows you are with me. That makes this conversation... brief.',
          tone: 'DREAD',
          choices: [
            { label: 'Then give me what you have quickly.', tone: 'RESOLVE', nextId: 'd2_fragment' },
          ],
        },
        {
          id: 'd2_fragment',
          speaker: 'Artemis (Echo)',
          text: 'The Echo Anchor. When its voice arrives dressed as yours — you will feel a tremor in the left side of your chest. Small. Easy to miss. Do not miss it. That is the seam where it entered.',
          tone: 'RESOLVE',
          isEnd: true,
          rewardUnlocked: 'resistance_skill_echo_anchor',
        },
      ],
      narrativeHook: `
        The mirror cracks down the center as Artemis fades.
        Your left hand pulses — the scar Elder Maren noticed, now slightly larger.
        You feel the Presence shift in the distance. Not closer. Not yet.
        But aware. The borrowed voice tries one more time as you leave:
        "You should have listened."
        You recognize the seam. You walk forward.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 3 — "What It Remembers"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq3_what_it_remembers',
      title: 'What It Remembers',
      level: 2,
      npcId: 'luna_shade',
      narrativeSetup: `
        The Presence has memory. Not intelligence — memory.
        It has watched you long enough to know your patterns: the places you linger,
        the hesitations before a choice, the specific weight of your footfall when afraid.
        Luna appears in a doorway you didn't notice before. She is holding something
        that looks like a folded piece of shadow. She extends it toward you, but
        does not fully cross the threshold.
        You understand, somehow, that she cannot.
      `,
      objectives: [
        { step: 1, text: 'Approach Luna without triggering the Presence (stay unpredictable)' },
        { step: 2, text: 'Receive the Memory Map — a record of your most-interfered paths' },
        { step: 3, text: 'Walk three routes the Presence does NOT expect' },
        { step: 4, text: 'Find the Observation Point — where it has watched you from' },
        { step: 5, text: 'Return to Luna with the location' },
      ],
      reward: {
        type: 'path_awareness',
        name: 'Lunar Imprint',
        description: 'Your minimap briefly shows Presence proximity trails. It cannot predict your movement as easily.',
        xp: 160,
        points: 3,
      },
      dialogue: [
        {
          id: 'd3_luna_open',
          speaker: 'Luna (Shade)',
          text: 'Don\'t walk here the way you walked yesterday. It knows yesterday.',
          tone: 'DREAD',
          choices: [
            { label: 'What do you mean, it knows yesterday?', tone: 'CONFUSION', nextId: 'd3_luna_knows' },
            { label: '[Step in an unexpected direction before answering.]', tone: 'RESISTANCE', nextId: 'd3_luna_good' },
            { label: 'How long have you been watching me?', tone: 'FEAR', nextId: 'd3_luna_watching' },
          ],
        },
        {
          id: 'd3_luna_knows',
          speaker: 'Luna (Shade)',
          text: 'It catalogues. Every path you take. Every hesitation. It does not remember the way you do — not like a story. More like a hunter memorizes the watering hole. Where you linger. When you linger. What you linger near.',
          tone: 'DREAD',
          choices: [
            { label: 'So I\'ve been giving it information about myself.', tone: 'CONFUSION', nextId: 'd3_luna_map' },
          ],
        },
        {
          id: 'd3_luna_good',
          speaker: 'Luna (Shade)',
          text: 'Good. That. Keep doing that. Every unexpected movement costs it a fraction of its model of you. Enough of those — and it has to start over.',
          tone: 'RESOLVE',
          choices: [
            { label: 'Why are you helping me?', tone: 'CURIOSITY', nextId: 'd3_luna_why' },
          ],
        },
        {
          id: 'd3_luna_watching',
          speaker: 'Luna (Shade)',
          text: 'Not as long as it has. I found you three years after it did. I\'ve been trying to stay between you and it ever since.',
          tone: 'DREAD',
          choices: [
            { label: 'What are you?', tone: 'CURIOSITY', nextId: 'd3_luna_what' },
          ],
        },
        {
          id: 'd3_luna_what',
          speaker: 'Luna (Shade)',
          text: 'I am what you become if you survive this. Or I am a projection your mind constructed to explain what it cannot yet face. I genuinely don\'t know which. Does it matter?',
          tone: 'CONFUSION',
          choices: [
            { label: 'Yes, it matters.', tone: 'RESISTANCE', nextId: 'd3_luna_matter_yes' },
            { label: 'No. Help me regardless.', tone: 'RESOLVE', nextId: 'd3_luna_map' },
          ],
        },
        {
          id: 'd3_luna_matter_yes',
          speaker: 'Luna (Shade)',
          text: 'Then hold onto that. The refusal to accept vague answers — that is a form of resistance too. Here. Take this.',
          tone: 'RESOLVE',
          choices: [{ label: '[Accept the Memory Map.]', tone: 'CURIOSITY', nextId: 'd3_luna_map' }],
        },
        {
          id: 'd3_luna_map',
          speaker: 'Luna (Shade)',
          text: 'This is every path you\'ve walked in the last month. The ones marked in dark — those are the ones it predicted. Walk differently. Not randomly — randomly has its own patterns. Walk with intention you haven\'t had before.',
          tone: 'DREAD',
          choices: [
            { label: 'Where does it watch from?', tone: 'CURIOSITY', nextId: 'd3_luna_source' },
          ],
        },
        {
          id: 'd3_luna_why',
          speaker: 'Luna (Shade)',
          text: 'Because what it wants to do to you — I have seen it do to others. And I could not watch again and do nothing.',
          tone: 'DREAD',
          choices: [
            { label: 'What does it do to them?', tone: 'FEAR', nextId: 'd3_luna_do' },
          ],
        },
        {
          id: 'd3_luna_do',
          speaker: 'Luna (Shade)',
          text: 'They become accurate. Every movement precise. Every decision efficient. From the outside — they look like they\'ve found peace. On the inside...',
          tone: 'DREAD',
          choices: [
            { label: 'On the inside?', tone: 'FEAR', nextId: 'd3_luna_inside' },
          ],
        },
        {
          id: 'd3_luna_inside',
          speaker: 'Luna (Shade)',
          text: 'Nothing. It doesn\'t leave anything inside. It uses the outside and empties the rest.',
          tone: 'DREAD',
          choices: [{ label: '[Stand in silence for a moment.]', tone: 'FEAR', nextId: 'd3_luna_source' }],
        },
        {
          id: 'd3_luna_source',
          speaker: 'Luna (Shade)',
          text: 'Northwest. There is a high place. A ledge above the old dry riverbed. It watches from there. Find it. See it watching. When it knows you have seen it — the balance shifts. Slightly. But it shifts.',
          tone: 'RESOLVE',
          isEnd: true,
          nextObjective: 3,
        },
        // — Observation Point reached —
        {
          id: 'd3_observation',
          speaker: 'Inner Voice',
          text: '[You find the ledge. The stone there is worn smooth in a way that takes years — decades — of the same weight resting in the same position. It has been here many times. A long strand of something organic is caught on the rock\'s edge. When you touch it, your left hand convulses. Once. Sharp. Not pain — recognition.]',
          tone: 'DREAD',
          mechanic: 'presence_pulse',
          choices: [
            { label: '[Force your hand open. Hold it steady.]', tone: 'RESISTANCE', nextId: 'd3_obs_resist' },
          ],
        },
        {
          id: 'd3_obs_resist',
          speaker: 'Inner Voice',
          text: '[The convulsion passes. Something in your peripheral vision pulls — as if the Presence noticed you noticing. You hold the location in your mind. You turn back. Lunar Imprint acquired.]',
          tone: 'RESOLVE',
          isEnd: true,
          nextObjective: 5,
        },
      ],
      narrativeHook: `
        Luna receives the location with closed eyes, nodding slowly.
        "It knows you found it. It will change positions now. That is what we wanted.
        Every time it has to move — it loses something. Continuity. Pattern.
        It has been static for thirteen years. You made it move."
        For the first time, she almost smiles.
        Then something cold crosses her face. She looks past you.
        "It moved faster than I expected."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 4 — "The Inhalation"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq4_the_inhalation',
      title: 'The Inhalation',
      level: 3,
      npcId: 'voice_of_nothing',
      narrativeSetup: `
        It is close enough to touch.
        You cannot see it — not fully. But you feel its proximity as a change in air pressure.
        A warmth that has no source. A sound that is not quite sound — more like the space
        between sounds bending toward something.
        Elder Maren said it wants to wear you.
        You understand now what that means. It wants to breathe you in.
        This is the moment that was predicted thirteen years ago.
        Someone — somewhere — knew this moment would come.
        The question is whether the prediction was a warning. Or a plan.
      `,
      objectives: [
        { step: 1, text: 'Survive direct Presence proximity without losing control — 90 seconds' },
        { step: 2, text: 'Identify one genuine thought amid the interference' },
        { step: 3, text: 'Speak the thought aloud (in-game: select the correct dialogue option)' },
        { step: 4, text: 'Force the Presence back using the Echo Anchor ability' },
      ],
      reward: {
        type: 'core_upgrade',
        name: 'The Unbreathed',
        description: 'You were not consumed. Presence interference cooldown reduced permanently. Resistance stat +15.',
        xp: 250,
        points: 5,
      },
      dialogue: [
        {
          id: 'd4_proximity',
          speaker: 'The Sniffing Presence',
          text: '[No words. Just breath. Warm. Close. Rhythmic. Each inhalation pulls at something inside you — not physically. Something deeper. Your next thought begins to form and you feel it being read before it finishes. The shape of the thought. The weight of it. The direction it was going.]',
          tone: 'DREAD',
          mechanic: 'presence_pulse',
          choices: [
            {
              label: '[Go still. Don\'t think in full sentences. Think in fragments.]',
              tone: 'RESISTANCE',
              nextId: 'd4_fragment_think',
            },
            {
              label: '[Try to run.]',
              tone: 'FEAR',
              nextId: 'd4_run',
              mechanic: 'movement_lock',
            },
          ],
        },
        {
          id: 'd4_run',
          speaker: 'Inner Voice',
          text: '[Your legs do not comply. You stand rooted — not paralyzed, but rerouted. The borrowed voice says: "Stay." You are staying. But it is not because you chose to.]',
          tone: 'DREAD',
          choices: [
            {
              label: '[Shift focus. Make the stillness your choice, not its command.]',
              tone: 'RESISTANCE',
              nextId: 'd4_fragment_think',
            },
          ],
        },
        {
          id: 'd4_fragment_think',
          speaker: 'Inner Voice',
          text: '[Fragments only. No full intent. "Sky—" "Left hand—" "The scar—" Each partial thought is harder to read. You feel it adjusting, leaning in, trying to catch the edges. This is resistance at its most precise.]',
          tone: 'RESISTANCE',
          choices: [
            {
              label: '[Hold for twenty more seconds. Let a full thought form — one that is entirely yours.]',
              tone: 'RESOLVE',
              nextId: 'd4_true_thought',
            },
          ],
        },
        {
          id: 'd4_true_thought',
          speaker: 'Inner Voice',
          text: '[A thought arrives. Complete. Unsteered. Which of these is entirely yours?]',
          tone: 'CONFUSION',
          choices: [
            {
              label: '"I am afraid. That fear is mine."',
              tone: 'FEAR',
              nextId: 'd4_true_correct',
            },
            {
              label: '"I should leave this place."',
              tone: 'CONFUSION',
              nextId: 'd4_true_wrong',
            },
            {
              label: '"I will never be free."',
              tone: 'DREAD',
              nextId: 'd4_true_wrong',
            },
          ],
        },
        {
          id: 'd4_true_wrong',
          speaker: 'Inner Voice',
          text: '[You feel it pulse with satisfaction. That thought — it offered that thought to you. It was a test of your discernment. Try again. Find yours.]',
          tone: 'DREAD',
          choices: [
            {
              label: '"I am afraid. That fear is mine."',
              tone: 'RESISTANCE',
              nextId: 'd4_true_correct',
            },
          ],
        },
        {
          id: 'd4_true_correct',
          speaker: 'Inner Voice',
          text: '[YES. That one. The acknowledgment of fear without direction — it cannot weaponize that. It cannot use fear that knows itself. You feel the Echo Anchor pulse in your chest. Use it. Now.]',
          tone: 'RESOLVE',
          mechanic: 'presence_pulse',
          choices: [
            { label: '[Activate Echo Anchor — project the genuine thought outward.]', tone: 'RESOLVE', nextId: 'd4_anchor' },
          ],
        },
        {
          id: 'd4_anchor',
          speaker: 'The Sniffing Presence',
          text: '[The air pressure drops. The warmth — withdraws. Not far. Not gone. But back. A foot. Two feet. You can feel the space around you as your own again. For now.]',
          tone: 'RESOLVE',
          isEnd: true,
          rewardUnlocked: 'core_upgrade_unbreathed',
        },
      ],
      narrativeHook: `
        The Presence retreats to the edge of your perception.
        In the silence that follows, you hear something you haven't heard before:
        another breathing — different from yours, different from it.
        Somewhere above. Something watching the confrontation.
        You look up. Nothing.
        But in the pale stone of the ceiling, scratched into the surface as if by a careful hand:
        "SKADI WAS RIGHT ABOUT YOU."
        You have never heard that name. But your scar pulses once.
        Like recognition.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 5 — "Thirteen Years Ago"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq5_thirteen_years',
      title: 'Thirteen Years Ago',
      level: 4,
      npcId: 'elder_maren',
      narrativeSetup: `
        Elder Maren calls you to a room you have not entered before.
        It is a record room. Floor to ceiling, walls of compressed stone — names carved into them,
        dates, and next to each name: a simple outcome.
        CONSUMED. COMPLIED. FLED. BROKE. RESISTED.
        You scan the columns until you find your own name.
        It has been here for thirteen years.
        Carved before the scar. Before the corridor. Before any of this began.
        Next to your name: no outcome yet. A blank space. Waiting.
      `,
      objectives: [
        { step: 1, text: 'Read the record — find your entry and the entry before yours' },
        { step: 2, text: 'Speak to Elder Maren about the prediction' },
        { step: 3, text: 'Find the name "Skadi" in the records and what was written beside it' },
        { step: 4, text: 'Return to the Observation Point — something has been left for you' },
        { step: 5, text: 'Accept or reject the first contact from Skadi\'s Mark' },
      ],
      reward: {
        type: 'lore_unlock',
        name: 'The Thirteenth Record',
        description: 'Arc 1 complete. Skadi\'s Mark is now visible in the world. The Presence knows you saw the records. It will return differently.',
        xp: 400,
        points: 8,
      },
      dialogue: [
        {
          id: 'd5_record_read',
          speaker: 'Inner Voice',
          text: '[Your name. Carved thirteen years ago in a handwriting you do not recognize. The ink of it — if it is ink — has a faint copper tint. Below it, in smaller characters: "Will notice early. Will resist partially. Needs contact before isolation." Beside the outcome column: nothing. A blank rectangle. Waiting.]',
          tone: 'DREAD',
          choices: [
            { label: 'Who wrote this?', tone: 'CONFUSION', nextId: 'd5_who_wrote' },
            { label: '[Look for the entry directly above yours.]', tone: 'CURIOSITY', nextId: 'd5_above_entry' },
          ],
        },
        {
          id: 'd5_who_wrote',
          speaker: 'Elder Maren',
          text: 'The same hand that writes most futures that don\'t want to be written. She was here long before the records began. She moves through time differently than we do. She told me your name before you were born.',
          tone: 'DREAD',
          choices: [
            { label: 'She?', tone: 'CURIOSITY', nextId: 'd5_she' },
          ],
        },
        {
          id: 'd5_she',
          speaker: 'Elder Maren',
          text: 'Skadi. But do not say it near the Presence. She and it have a history that predates this world. It reacts to her name with something very close to... caution.',
          tone: 'DREAD',
          choices: [
            { label: 'Skadi is real? She\'s not a symbol?', tone: 'CONFUSION', nextId: 'd5_skadi_real' },
            { label: '[Find the name Skadi in the records.]', tone: 'CURIOSITY', nextId: 'd5_skadi_entry' },
          ],
        },
        {
          id: 'd5_skadi_real',
          speaker: 'Elder Maren',
          text: 'Everything that matters is real. The question is what form real takes. She exists in the gap between what the Presence predicts and what actually happens. She operates in that gap.',
          tone: 'CURIOSITY',
          choices: [{ label: '[Find her entry in the records.]', tone: 'CURIOSITY', nextId: 'd5_skadi_entry' }],
        },
        {
          id: 'd5_above_entry',
          speaker: 'Inner Voice',
          text: '[The entry above yours: "Haelen. Male. Noticed early. Resisted for three years." Outcome column: COMPLIED. The word has been crossed out. Below it, in a different hand, a single word: "LOST." You don\'t know which word is more accurate. Neither does the record, apparently.]',
          tone: 'DREAD',
          choices: [
            { label: 'What happened to Haelen?', tone: 'FEAR', nextId: 'd5_haelen' },
            { label: '[Find the name Skadi.]', tone: 'CURIOSITY', nextId: 'd5_skadi_entry' },
          ],
        },
        {
          id: 'd5_haelen',
          speaker: 'Elder Maren',
          text: 'He walks. He breathes. His hands are steady. His eyes track things correctly. Everyone who knew him before says he seems better. More at peace.',
          tone: 'DREAD',
          choices: [
            { label: 'But?', tone: 'FEAR', nextId: 'd5_haelen_but' },
          ],
        },
        {
          id: 'd5_haelen_but',
          speaker: 'Elder Maren',
          text: 'But when his daughter cries, he doesn\'t turn toward her. He turns in the direction the Presence wants him to turn. Every time. Without hesitation. Without noticing.',
          tone: 'DREAD',
          choices: [
            { label: '[Stand with that image for a moment. Then find Skadi\'s entry.]', tone: 'FEAR', nextId: 'd5_skadi_entry' },
          ],
        },
        {
          id: 'd5_skadi_entry',
          speaker: 'Inner Voice',
          text: '[You find it. Near the oldest section of wall. "Skadi. Unknown origin. Unknown timeline." Outcome column — nothing. No word. No blank rectangle. The space where the outcome should be has been carved out. Removed. Deliberately. As if whatever she became could not be fit into the system\'s categories.]',
          tone: 'CURIOSITY',
          choices: [
            { label: 'She broke the record system.', tone: 'CURIOSITY', nextId: 'd5_broke_system' },
          ],
        },
        {
          id: 'd5_broke_system',
          speaker: 'Elder Maren',
          text: 'Or the record system recognized that it couldn\'t contain her and chose to leave space rather than lie. Either interpretation should give you hope.',
          tone: 'RESOLVE',
          choices: [
            { label: 'What did she leave at the Observation Point?', tone: 'CURIOSITY', nextId: 'd5_obs_point' },
          ],
        },
        {
          id: 'd5_obs_point',
          speaker: 'Elder Maren',
          text: 'Go there. Don\'t tell me what you find. If I know, the Presence can read it from me. It knows how to look.',
          tone: 'DREAD',
          isEnd: true,
          nextObjective: 4,
        },
        // — Observation Point return —
        {
          id: 'd5_obs_return',
          speaker: 'Skadi (The Mark)',
          text: '[Not a voice. Not a figure. A mark carved into the stone where the Presence used to watch from. Three symbols. Beneath them, in a language you somehow understand without having learned it: "You were predicted. You exceeded the prediction. We should meet. If you want to. I will not steer you to this meeting. That is the difference between me and what hunts you."]',
          tone: 'CURIOSITY',
          choices: [
            {
              label: '[Accept the contact. Leave a mark in response.]',
              tone: 'RESOLVE',
              nextId: 'd5_accept_contact',
            },
            {
              label: '[Leave nothing. Walk away. Think about it.]',
              tone: 'RESISTANCE',
              nextId: 'd5_defer_contact',
            },
          ],
        },
        {
          id: 'd5_accept_contact',
          speaker: 'Inner Voice',
          text: '[You press your scarred left palm to the stone. It leaves a faint impression — not ink, not blood. Something between them. A response. Honest. Yours. The three symbols pulse once.]',
          tone: 'RESOLVE',
          isEnd: true,
          rewardUnlocked: 'arc1_complete_contact_accepted',
          arcResult: 'CONTACT_ACCEPTED',
        },
        {
          id: 'd5_defer_contact',
          speaker: 'Inner Voice',
          text: '[You walk away without leaving anything. The symbols remain. The mark does not pursue. She said she wouldn\'t steer. She appears to have meant it. The choice is still open. For now. Arc 1 closes on uncertainty — which is the most honest way it could close.]',
          tone: 'CURIOSITY',
          isEnd: true,
          rewardUnlocked: 'arc1_complete_contact_deferred',
          arcResult: 'CONTACT_DEFERRED',
        },
      ],
      narrativeHook: `
        Arc 1: The First Interference — Complete.
        
        The record room fills with the faintest sound — not the Presence. Something else.
        Something cooler. More distant. Watching from a different angle entirely.
        Elder Maren looks at the ceiling.
        "It knows the arc is closing. It will accelerate in Arc 2."
        She pauses.
        "But so will the others who are watching it. You are not as alone in this as it needs you to believe."
        
        Arc 2: "The Weight of Prediction" — Unlocked.
      `,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIDE QUESTS — Arc 1
// ═══════════════════════════════════════════════════════════════════════════════

export const SIDE_QUESTS = [

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 1 — "The Pilgrim Who Walks Wrong"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq1_wrong_pilgrim',
    title: 'The Pilgrim Who Walks Wrong',
    level: 1,
    npcId: 'broken_pilgrim',
    connectedMainQuest: 'mq1_wrong_step',
    narrativeSetup: `
      On the road between the pale corridor and the east wall, you find a man walking.
      His stride is confident, purposeful. He is going the wrong direction.
      Not confused-wrong — steered-wrong. You can see it because you now know what it looks like.
      He doesn't notice you at first. He is too busy going wherever it is taking him.
    `,
    objectives: [
      { step: 1, text: 'Intercept the Broken Pilgrim before he reaches the junction' },
      { step: 2, text: 'Determine whether he is complying willingly or unknowingly' },
      { step: 3, text: 'Choose: attempt to redirect him, or let him continue' },
      { step: 4, text: 'Return to Maren with what you learned' },
    ],
    reward: {
      type: 'knowledge_token',
      name: 'The Pilgrim\'s Pattern',
      description: 'You learned to identify a steered walk vs a chosen one. Presence detection range +5%.',
      xp: 60,
      points: 1,
    },
    dialogue: [
      {
        id: 'sq1_d1_meet',
        speaker: 'The Pilgrim (Broken)',
        text: '[He nearly walks past you. You step into his path. He stops. His eyes focus slowly — like someone surfacing from deep water.] Oh. I didn\'t see you. I was... I was going somewhere. I think.',
        tone: 'CONFUSION',
        choices: [
          { label: 'Where are you going?', tone: 'CURIOSITY', nextId: 'sq1_d2_where' },
          { label: 'Do you feel anything following you?', tone: 'FEAR', nextId: 'sq1_d2_follow' },
          { label: '[Say nothing. Watch how his feet point.]', tone: 'RESISTANCE', nextId: 'sq1_d2_feet' },
        ],
      },
      {
        id: 'sq1_d2_where',
        speaker: 'The Pilgrim (Broken)',
        text: 'The... the old bridge. I was going to the old bridge. I\'ve been going there for a week. I\'ve never reached it. I keep ending up back here. I thought I was losing my mind.',
        tone: 'CONFUSION',
        choices: [
          { label: 'You\'re not losing your mind. Something is redirecting you.', tone: 'CONFUSION', nextId: 'sq1_d3_explain' },
          { label: 'Maybe don\'t go to the bridge.', tone: 'RESISTANCE', nextId: 'sq1_d3_redirect' },
        ],
      },
      {
        id: 'sq1_d2_follow',
        speaker: 'The Pilgrim (Broken)',
        text: '[He pauses. Blinks. Something crosses his face — recognition? Fear? He suppresses it quickly.] No. Nothing follows me. I\'m just... walking.',
        tone: 'DREAD',
        choices: [
          { label: 'That pause. That suppression. Tell me what it was.', tone: 'CURIOSITY', nextId: 'sq1_d3_pause' },
        ],
      },
      {
        id: 'sq1_d2_feet',
        speaker: 'Inner Voice',
        text: '[His feet are pointed toward the junction — but his body is angled to continue past it. The junction is where the Presence\'s scent trail is strongest. It is using him as an approach vector. He doesn\'t know he is bait.]',
        tone: 'DREAD',
        choices: [
          { label: '[Step in front of him. Block the path naturally.]', tone: 'RESISTANCE', nextId: 'sq1_d3_block' },
        ],
      },
      {
        id: 'sq1_d3_explain',
        speaker: 'The Pilgrim (Broken)',
        text: 'Redirecting. That\'s a... that\'s a word. Yes. When I try to think about stopping, the thought just... slides away. Like it can\'t stick. I thought that was normal.',
        tone: 'CONFUSION',
        choices: [
          { label: 'It\'s not normal. But it\'s recoverable. I think.', tone: 'RESOLVE', nextId: 'sq1_d4_choice' },
        ],
      },
      {
        id: 'sq1_d3_redirect',
        speaker: 'The Pilgrim (Broken)',
        text: 'But I want to go to the bridge. I\'m sure I want to.',
        tone: 'CONFUSION',
        choices: [
          {
            label: 'Are you sure the wanting is yours?',
            tone: 'RESISTANCE',
            nextId: 'sq1_d4_choice',
          },
        ],
      },
      {
        id: 'sq1_d3_pause',
        speaker: 'The Pilgrim (Broken)',
        text: '[Long silence. His jaw works. He is fighting something — you can see it now.] Sometimes. At night. When I\'m nearly asleep. I hear breathing that isn\'t mine. I always tell myself I was dreaming.',
        tone: 'DREAD',
        choices: [
          { label: 'You weren\'t dreaming.', tone: 'DREAD', nextId: 'sq1_d4_choice' },
        ],
      },
      {
        id: 'sq1_d3_block',
        speaker: 'The Pilgrim (Broken)',
        text: '[He stops. Blinks again. This time the surface breaks slightly.] Why did I... why was I going that way? I didn\'t decide to go that way.',
        tone: 'CONFUSION',
        choices: [
          { label: 'No. You didn\'t.', tone: 'DREAD', nextId: 'sq1_d4_choice' },
        ],
      },
      {
        id: 'sq1_d4_choice',
        speaker: 'Inner Voice',
        text: '[He is conscious now. Partially. The gap is open. What you do with this moment will stay with him for a long time — or until the Presence resumes steering.]',
        tone: 'CONFUSION',
        choices: [
          {
            label: 'Tell him exactly what I know. Give him every tool I have.',
            tone: 'RESOLVE',
            nextId: 'sq1_full_truth',
          },
          {
            label: 'Tell him only what he can immediately use — don\'t overwhelm him.',
            tone: 'CURIOSITY',
            nextId: 'sq1_partial_truth',
          },
          {
            label: 'Say nothing. The knowing might make him more interesting to it.',
            tone: 'DREAD',
            nextId: 'sq1_silence',
          },
        ],
      },
      {
        id: 'sq1_full_truth',
        speaker: 'The Pilgrim (Broken)',
        text: '[You tell him everything. He listens with the concentrated attention of someone who has been confused for a very long time and is finally being given words for what they felt. By the end, he is sitting on the ground. He says:] Thank you. I don\'t know if I can resist it. But now I know what I\'m resisting.',
        tone: 'RESOLVE',
        isEnd: true,
        outcome: 'pilgrim_informed',
      },
      {
        id: 'sq1_partial_truth',
        speaker: 'The Pilgrim (Broken)',
        text: 'When a thought feels like yours but arrives fully formed — like it was already decided — question it. Just that one moment of questioning is enough.',
        tone: 'RESOLVE',
        isEnd: true,
        outcome: 'pilgrim_cautioned',
      },
      {
        id: 'sq1_silence',
        speaker: 'Inner Voice',
        text: '[You say nothing. He looks at you a moment longer, then nods once — as if something passed between you without language — and turns back the way he came. Not toward the junction. Away from it. Maybe that was enough.]',
        tone: 'DREAD',
        isEnd: true,
        outcome: 'pilgrim_redirected_silently',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 2 — "The Mirror Child's Request"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq2_mirror_child',
    title: 'The Mirror Child\'s Request',
    level: 2,
    npcId: 'mirror_child',
    connectedMainQuest: 'mq2_borrowed_voice',
    narrativeSetup: `
      In a room adjacent to the Mirror Corridor, there is a child sitting cross-legged
      on the floor. They are facing away from you.
      You have the strong sense — though they have not looked at you —
      that they have been waiting specifically for you to enter.
      Near them on the floor is a small object: a stone, carved into the shape of an ear.
      They do not speak. They push the carved ear across the floor toward you
      with one finger.
    `,
    objectives: [
      { step: 1, text: 'Approach the Mirror Child without startling them' },
      { step: 2, text: 'Accept or decline the carved ear' },
      { step: 3, text: 'Sit in the room and listen for 60 seconds without reacting to the Borrowed Voice' },
      { step: 4, text: 'Report what you heard to Artemis' },
    ],
    reward: {
      type: 'passive_ability',
      name: 'The Stone Ear',
      description: 'Passive: You can hear Presence approach 2 seconds earlier. Interference has a brief visual warning.',
      xp: 90,
      points: 2,
    },
    dialogue: [
      {
        id: 'sq2_d1_approach',
        speaker: 'Inner Voice',
        text: '[You approach slowly. The child does not turn around. The carved ear sits between you now. Close enough to pick up. The room is very quiet — the particular quiet of something that is holding its breath.]',
        tone: 'FEAR',
        choices: [
          { label: '[Pick up the carved ear.]', tone: 'CURIOSITY', nextId: 'sq2_d2_accept' },
          { label: '[Sit down across from the child without taking it.]', tone: 'RESISTANCE', nextId: 'sq2_d2_sit' },
          { label: '[Ask the child why they\'re here.]', tone: 'CURIOSITY', nextId: 'sq2_d2_ask' },
        ],
      },
      {
        id: 'sq2_d2_accept',
        speaker: 'Mirror Child',
        text: '[The child nods once, still facing away. A barely perceptible movement, but deliberate. Confirming something. The stone is warm — warmer than stone should be. It hums with a frequency your bones recognize before your mind does.]',
        tone: 'CURIOSITY',
        choices: [{ label: '[Sit down. Listen.]', tone: 'CURIOSITY', nextId: 'sq2_d3_listen' }],
      },
      {
        id: 'sq2_d2_sit',
        speaker: 'Mirror Child',
        text: '[They turn their head slightly — not to look at you. Just to acknowledge you chose differently. Then they push the ear closer to the middle point between you. Still available. Not insisted upon.]',
        tone: 'CURIOSITY',
        choices: [
          { label: '[Take it now.]', tone: 'CURIOSITY', nextId: 'sq2_d2_accept' },
          { label: '[Leave it there. Just listen from here.]', tone: 'RESISTANCE', nextId: 'sq2_d3_listen' },
        ],
      },
      {
        id: 'sq2_d2_ask',
        speaker: 'Mirror Child',
        text: '[They don\'t answer. But they turn — for the first time, you see their face. They look like you. Not exactly. Not uncannily. The way a reflection looks like you when the mirror is slightly dirty. Close enough to be unsettling. They look at the ear. Then at you. Then away.]',
        tone: 'DREAD',
        choices: [{ label: '[Pick up the carved ear.]', tone: 'CURIOSITY', nextId: 'sq2_d2_accept' }],
      },
      {
        id: 'sq2_d3_listen',
        speaker: 'Inner Voice',
        text: '[You sit. You listen. The Borrowed Voice comes — multiple times. "Get up." "This is pointless." "Leave the stone." "The child is not real." Each time, you hold still. You hold the ear. You hear, beneath the borrowed instructions, something else: the actual sound of the Presence navigating. Planning. Recalculating. The stone lets you hear its thinking.]',
        tone: 'DREAD',
        mechanic: 'presence_pulse',
        choices: [
          { label: '[Hold until the Borrowed Voice stops.]', tone: 'RESISTANCE', nextId: 'sq2_d4_report' },
        ],
      },
      {
        id: 'sq2_d4_report',
        speaker: 'Mirror Child',
        text: '[When the Borrowed Voice finally stops — exhausted, or choosing to wait — the child stands. They walk to the door without looking back. Before leaving, they press one hand flat against the doorframe. When they lift it, there is a small mark left: three lines. The same lines from Skadi\'s mark. You hold the stone ear. You understand: the child was also predicted. The child is also resisting. You are not alone.]',
        tone: 'RESOLVE',
        isEnd: true,
        rewardUnlocked: 'passive_stone_ear',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 3 — "Echoes From Before"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq3_echoes_from_before',
    title: 'Echoes From Before',
    level: 3,
    npcId: 'artemis_echo',
    connectedMainQuest: 'mq3_what_it_remembers',
    narrativeSetup: `
      Artemis appears to you outside the Mirror Corridor this time.
      She is standing in a doorway that leads to an open sky — an impossible geography
      given where you are. The sky beyond her is the color of early evening,
      thirteen years ago.
      She says: "There are places where the interference left impressions.
      Physical echoes of moments when it tried to take control and almost succeeded.
      Those echoes still carry the feeling of resistance. I want you to find them.
      I think they can teach you something that I can't explain in words."
    `,
    objectives: [
      { step: 1, text: 'Find Echo Site 1 — the room where you first walked wrong' },
      { step: 2, text: 'Find Echo Site 2 — a crossroads you don\'t remember but your body does' },
      { step: 3, text: 'Find Echo Site 3 — a doorway you almost didn\'t walk through' },
      { step: 4, text: 'Return to Artemis with the memory fragments collected' },
    ],
    reward: {
      type: 'memory_integration',
      name: 'The Three Echoes',
      description: 'Three moments of near-compliance, recovered. Clarity +20. Presence interference duration -10%.',
      xp: 140,
      points: 3,
    },
    dialogue: [
      {
        id: 'sq3_d1_send',
        speaker: 'Artemis (Echo)',
        text: 'You remember a crossroads. You remember a doorway. You walked through both without knowing what they cost you. Those are the moments I need you to revisit. The echoes are still there — soaked into the stone. You\'ll know them by the warmth. Not the Presence\'s warmth — this is older. Your own will, pressed into the place where it held on.',
        tone: 'CURIOSITY',
        choices: [
          { label: 'What will I feel when I find them?', tone: 'CURIOSITY', nextId: 'sq3_d2_feel' },
          { label: 'What if I didn\'t resist? What if I complied in those moments?', tone: 'FEAR', nextId: 'sq3_d2_comply_ask' },
        ],
      },
      {
        id: 'sq3_d2_feel',
        speaker: 'Artemis (Echo)',
        text: 'A specific kind of grief. The grief of a near-miss you didn\'t know was a near-miss. That is what memory fragments feel like — not nostalgia. Relief.',
        tone: 'DREAD',
        choices: [{ label: '[Go find the first site.]', tone: 'RESOLVE', nextId: 'sq3_site1' }],
      },
      {
        id: 'sq3_d2_comply_ask',
        speaker: 'Artemis (Echo)',
        text: 'Then there is no echo. Compliance leaves nothing. The Presence absorbs it. Resistance leaves a mark — it cannot absorb resistance, only work around it. That is why these echoes exist: they are proof you have always been fighting this, even before you knew what it was.',
        tone: 'RESOLVE',
        choices: [{ label: '[Go find the first site.]', tone: 'RESOLVE', nextId: 'sq3_site1' }],
      },
      {
        id: 'sq3_site1',
        speaker: 'Inner Voice',
        text: '[Echo Site 1. A hallway. You don\'t recognize it — not visually. But as you step across the threshold your left foot stutters. A microsecond hesitation. Your body recognizes it before your mind does. This is where it first tried. This is where you first, unknowingly, pushed back. The stone is warm. You press your palm to it and something flows back into you — a fraction of something that was almost taken. Fragment 1 of 3 recovered.]',
        tone: 'RESOLVE',
        mechanic: 'memory_echo',
        choices: [{ label: '[Continue to Site 2.]', tone: 'CURIOSITY', nextId: 'sq3_site2' }],
      },
      {
        id: 'sq3_site2',
        speaker: 'Inner Voice',
        text: '[The crossroads. Four directions. You stand in the center and feel the pull of each — and can clearly identify which direction belongs to you and which doesn\'t. This is new. This discernment is new. But the crossroads is not. You\'ve been here. Your hesitation shaped the stones beneath your feet — you can feel the worn groove where you stood, once, for a long time, fighting a direction you couldn\'t name. Fragment 2 of 3 recovered.]',
        tone: 'CURIOSITY',
        mechanic: 'memory_echo',
        choices: [{ label: '[Continue to Site 3.]', tone: 'CURIOSITY', nextId: 'sq3_site3' }],
      },
      {
        id: 'sq3_site3',
        speaker: 'Inner Voice',
        text: '[The doorway. You almost didn\'t walk through this one. Not because you were afraid — because something very strong told you not to. You did anyway. On the other side of this door: the beginning of something. The exact moment when the Presence\'s interference became conscious — when it shifted from background noise to active steering. And you walked through it anyway. Fragment 3 of 3 recovered.]',
        tone: 'DREAD',
        mechanic: 'memory_echo',
        choices: [{ label: '[Return to Artemis.]', tone: 'RESOLVE', nextId: 'sq3_d3_return' }],
      },
      {
        id: 'sq3_d3_return',
        speaker: 'Artemis (Echo)',
        text: 'You found all three. Do you feel it? That\'s not grief — that\'s integration. Those moments were yours and they\'re yours again. The Presence took the memory of those resistances. You just took them back.',
        tone: 'RESOLVE',
        isEnd: true,
        rewardUnlocked: 'memory_integration_three_echoes',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 4 — "What Skadi Left"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq4_what_skadi_left',
    title: 'What Skadi Left',
    level: 4,
    npcId: 'skadi_mark',
    connectedMainQuest: 'mq5_thirteen_years',
    narrativeSetup: `
      After finding the record room, you begin noticing markings you didn't see before.
      Three-line symbols, left in specific locations — above doorways, near choice points,
      at the exact spots where the Presence's influence is strongest.
      They were left deliberately. They were left for you.
      Or for someone like you.
      Each marking comes with a small carved stone — a different shape.
      Taken together, they form something. You don't know what yet.
    `,
    objectives: [
      { step: 1, text: 'Find the three marked stones left by Skadi\'s presence' },
      { step: 2, text: 'Arrange them in the order they were left (oldest to newest)' },
      { step: 3, text: 'Place them at the Observation Point in sequence' },
      { step: 4, text: 'Witness the result' },
    ],
    reward: {
      type: 'world_unlock',
      name: 'Skadi\'s Channel',
      description: 'A pathway of communication opened. Skadi\'s Mark can now leave direct guidance when Presence interference peaks. Arc 2 access unlocked.',
      xp: 300,
      points: 6,
    },
    dialogue: [
      {
        id: 'sq4_d1_first_stone',
        speaker: 'Inner Voice',
        text: '[First Stone. Above the doorway to the pale corridor. The symbol is the oldest — the edges slightly worn by time. The stone shape: a closed eye. Beneath the carving, a message: "The first interference happened here. Before you were aware. I was aware. I could not intervene yet. I am sorry for the delay."]',
        tone: 'DREAD',
        choices: [{ label: '[Take the stone. Continue searching.]', tone: 'CURIOSITY', nextId: 'sq4_d2_second_stone' }],
      },
      {
        id: 'sq4_d2_second_stone',
        speaker: 'Inner Voice',
        text: '[Second Stone. At the crossroads echo site. The symbol is sharper — more recently made. The stone shape: an open hand. Beneath: "You chose your own direction here. It cost you. I recorded the cost. It matters. Every resistance is recorded by something other than the Presence. History has more observers than it usually knows."]',
        tone: 'CURIOSITY',
        choices: [{ label: '[Take the stone. Find the third.]', tone: 'CURIOSITY', nextId: 'sq4_d3_third_stone' }],
      },
      {
        id: 'sq4_d3_third_stone',
        speaker: 'Inner Voice',
        text: '[Third Stone. At the door from Echo Site 3 — the one you walked through anyway. The symbol is newest — almost fresh. The stone shape: a foot mid-step. Beneath: "This is the one I hoped for most. You didn\'t know what was on the other side. You walked through regardless. That is not recklessness. That is the specific courage of someone who has decided their will belongs to them."]',
        tone: 'RESOLVE',
        choices: [{ label: '[Carry all three to the Observation Point.]', tone: 'RESOLVE', nextId: 'sq4_d4_arrange' }],
      },
      {
        id: 'sq4_d4_arrange',
        speaker: 'Inner Voice',
        text: '[You place the stones in sequence on the ledge: closed eye — open hand — mid-step foot. The moment the third stone makes contact with the stone, all three pulse with a pale light. Not warm light. Clear light. The kind that comes from high altitude and carries distance with it. And then — a voice. Not borrowed. Not internal. Actual. External. Present.]',
        tone: 'CURIOSITY',
        choices: [{ label: '[Listen.]', tone: 'CURIOSITY', nextId: 'sq4_d5_skadi_speaks' }],
      },
      {
        id: 'sq4_d5_skadi_speaks',
        speaker: 'Skadi (The Mark)',
        text: 'I have been trying to find a way to speak to you that the Presence cannot intercept. This ledge — where it watched from and where it now avoids — is that place. I won\'t waste it. You have done something in Arc 1 that I only saw happen twice before in thirteen years of watching. You didn\'t just resist. You began to understand the shape of what you\'re resisting. That understanding — the Presence has no model for it. You are, as of now, partially outside its predictions. I need you to stay there.',
        tone: 'RESOLVE',
        choices: [
          { label: 'Who are you, really?', tone: 'CURIOSITY', nextId: 'sq4_d6_who_really' },
          { label: 'What comes next?', tone: 'RESOLVE', nextId: 'sq4_d6_what_next' },
          { label: 'Why did you watch for thirteen years before acting?', tone: 'RESISTANCE', nextId: 'sq4_d6_why_wait' },
        ],
      },
      {
        id: 'sq4_d6_who_really',
        speaker: 'Skadi (The Mark)',
        text: 'Someone who was in your position, once. Someone who found a different gap in the system. I exist in what the Presence cannot predict. I have been building that space for a long time. You are the first person I have invited into it.',
        tone: 'CURIOSITY',
        choices: [{ label: 'Why me?', tone: 'CURIOSITY', nextId: 'sq4_d7_why_you' }],
      },
      {
        id: 'sq4_d7_why_you',
        speaker: 'Skadi (The Mark)',
        text: 'Because Maren\'s records were right about one thing. You notice. And noticing — the real kind, the kind that survives the borrowed voice and the borrowed step — is rarer than any weapon I\'ve found in thirteen years of searching.',
        tone: 'RESOLVE',
        isEnd: true,
        rewardUnlocked: 'world_unlock_skadi_channel',
      },
      {
        id: 'sq4_d6_what_next',
        speaker: 'Skadi (The Mark)',
        text: 'Arc 2. The Presence will begin operating through predictions now — not just interference. It will try to give you information. Accurate information. Useful information. That is harder to resist than stolen movement. Prepare for gifts.',
        tone: 'DREAD',
        isEnd: true,
        rewardUnlocked: 'world_unlock_skadi_channel',
      },
      {
        id: 'sq4_d6_why_wait',
        speaker: 'Skadi (The Mark)',
        text: 'Because intervention has a cost. Every time I reach into the Presence\'s territory, it locates me more precisely. I had to wait until you were strong enough that the contact would be worth the exposure. I waited until you were worth the risk. I mean that as the highest compliment I know how to give.',
        tone: 'RESOLVE',
        isEnd: true,
        rewardUnlocked: 'world_unlock_skadi_channel',
      },
    ],
  },
];

// ── COMBINED EXPORT ──────────────────────────────────────────────────────────
export const ALL_FD_QUESTS = [
  ...MAIN_QUEST_CHAIN.subQuests.map(sq => ({
    ...sq,
    questType: 'main',
    chain: 'mq_arc1',
    chainTitle: MAIN_QUEST_CHAIN.title,
  })),
  ...SIDE_QUESTS.map(sq => ({
    ...sq,
    questType: 'side',
  })),
];

// Helper: get all quests available at a given player level
export function getFDQuestsForLevel(playerLevel) {
  return ALL_FD_QUESTS.filter(q => q.level <= playerLevel);
}

// Helper: get the full dialogue tree for a quest by id
export function getFDDialogue(questId) {
  const quest = ALL_FD_QUESTS.find(q => q.id === questId);
  return quest?.dialogue || [];
}

// Helper: get a specific dialogue node
export function getFDDialogueNode(questId, nodeId) {
  const dialogue = getFDDialogue(questId);
  return dialogue.find(d => d.id === nodeId) || null;
}