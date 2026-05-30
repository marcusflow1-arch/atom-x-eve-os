// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 2: "The Loss of Hands"
// Quest chain: Levels 6–10
// Main Quest 2: "The Severing" (5 sub-quests) + 5 Side Quests
// Full branching dialogue, multi-step objectives, psychological tone
// ─────────────────────────────────────────────────────────────────────────────

// Tone tags: PAIN | DOUBT | DETERMINATION | FRUSTRATION | GRIEF | RESOLVE | FEAR | CONFUSION

// ── NPC REGISTRY (Arc 2 additions) ──────────────────────────────────────────
export const ARC2_NPCS = [
  {
    id: 'kylie',
    name: 'Kylie',
    description: 'A trainer. Practical, direct, occasionally tender. She has seen this kind of injury before — but she won\'t say where.',
    tint: 0x3a2a1a,
  },
  {
    id: 'elder_maren',
    name: 'Elder Maren',
    description: 'Still writing on her skin. The characters have moved from her forearm to her neck.',
    tint: 0x3a2a1a,
  },
  {
    id: 'the_winter',
    name: 'The Winter',
    description: 'Not a person. A condition. A season that arrived too early and stayed too long. It speaks in temperature.',
    tint: 0x1a2a3a,
  },
  {
    id: 'skadi_mark',
    name: 'Skadi (The Mark)',
    description: 'Increasingly present. Still operating through marks and messages. She is watching the Severing closely.',
    tint: 0x1a2a1a,
  },
  {
    id: 'the_silent_observer',
    name: 'The Silent Observer',
    description: 'They were there when it happened. They chose not to intervene. You don\'t know why yet.',
    tint: 0x1a1a1a,
  },
  {
    id: 'echo_self',
    name: 'Echo (Past Self)',
    description: 'A memory fragment given form. The version of you from the moment of the Severing.',
    tint: 0x2a1a2a,
  },
  {
    id: 'voice_of_nothing',
    name: 'The Sniffing Presence',
    description: 'It has been quiet since Arc 1. Too quiet. The silence itself is a message.',
    tint: 0x220022,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QUEST CHAIN 2 — "The Severing"
// ═══════════════════════════════════════════════════════════════════════════════

export const MAIN_QUEST_CHAIN_2 = {
  id: 'mq_arc2',
  title: 'The Severing',
  arc: 'Arc 2: The Loss of Hands',
  description: 'Something took your ability to act. The question is not whether to accept it — it is whether you can survive long enough to understand what actually happened.',
  subQuests: [

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 1 — "When the Hands Stopped"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq2_1_hands_stopped',
      title: 'When the Hands Stopped',
      level: 6,
      npcId: 'echo_self',
      narrativeSetup: `
        You wake up and reach for something. Your hands move — but the signal stops before it arrives.
        The intention is there. The muscles flex. The result does not come.
        It is not paralysis. It is not pain — not yet. It is the specific horror
        of a command that leaves your mind and disappears somewhere between thought and action.
        You stand in the cold corridor. Your breath mists. The floor is frost-covered.
        Something called The Winter arrived while you were sleeping.
        Or something used The Winter as cover.
      `,
      objectives: [
        { step: 1, text: 'Discover the extent of the loss — attempt 3 basic ability checks' },
        { step: 2, text: 'Find the Echo of the moment it happened — follow the frost trail' },
        { step: 3, text: 'Confront your Past Self in the Echo chamber' },
        { step: 4, text: 'Retrieve the first fragment of what occurred' },
      ],
      reward: {
        type: 'adaptive_mechanic',
        name: 'The Frost Step',
        description: 'Without direct ability, you learn to read the environment. Environmental interaction range +30%.',
        xp: 180,
        points: 4,
      },
      dialogue: [
        {
          id: 'mq2_1_d1_discover',
          speaker: 'Inner Voice',
          text: '[You reach out. The intention is clean — precise — the kind of action you\'ve performed ten thousand times. Nothing. You reach again. Still nothing. Not resistance. Not interference. Absence. As if the pathway between will and action has simply... stopped existing. You look at your hands. They are yours. They are here. They are not responding.]',
          tone: 'CONFUSION',
          mechanic: 'ability_locked',
          choices: [
            { label: '[Try again. Force it.]', tone: 'FRUSTRATION', nextId: 'mq2_1_d2_force' },
            { label: '[Be still. Assess what you still have.]', tone: 'DETERMINATION', nextId: 'mq2_1_d2_assess' },
            { label: '[Call out. Someone has to know what happened.]', tone: 'FEAR', nextId: 'mq2_1_d2_call' },
          ],
        },
        {
          id: 'mq2_1_d2_force',
          speaker: 'Inner Voice',
          text: '[You force it. Something responds — not the ability, but the strain of attempting it. A sharp pull from elbow to shoulder. The kind of pain that signals damage, not effort. You stop. Panting slightly. It hurts. And it still doesn\'t work.]',
          tone: 'PAIN',
          mechanic: 'strain_feedback',
          choices: [
            { label: '[Stop forcing. Think instead.]', tone: 'DETERMINATION', nextId: 'mq2_1_d2_assess' },
            { label: 'What did I do to cause this?', tone: 'DOUBT', nextId: 'mq2_1_d3_self_blame' },
          ],
        },
        {
          id: 'mq2_1_d2_assess',
          speaker: 'Inner Voice',
          text: '[Movement: intact. Perception: intact. Voice: intact. Direct ability channels: severed. Environmental response: still present — when you press your palm to the frosted wall, you feel the cold, and the wall feels your touch in return. You have not lost everything. You have lost precision. What remains is contact.]',
          tone: 'DETERMINATION',
          choices: [
            { label: 'Then I work with contact.', tone: 'DETERMINATION', nextId: 'mq2_1_d3_frost_trail' },
            { label: 'This isn\'t enough. I need more than contact.', tone: 'FRUSTRATION', nextId: 'mq2_1_d3_frustration' },
          ],
        },
        {
          id: 'mq2_1_d2_call',
          speaker: 'Inner Voice',
          text: '[Silence. The kind that has been listening for you to call out. You feel, in that silence, the shape of something paying attention. It is not Skadi. It is not the Presence. It is something that was present when this happened. Something that chose not to stop it.]',
          tone: 'FEAR',
          choices: [
            { label: '[Don\'t call again. Follow the frost instead.]', tone: 'DETERMINATION', nextId: 'mq2_1_d3_frost_trail' },
          ],
        },
        {
          id: 'mq2_1_d3_self_blame',
          speaker: 'Inner Voice',
          text: '[The thought arrives quickly: you pushed too hard. You used the resistance too aggressively. You damaged the channel yourself. It is a neat explanation. Clean. It asks nothing of anyone else. You notice how comfortable it feels to accept it. That comfort makes you suspicious.]',
          tone: 'DOUBT',
          choices: [
            { label: 'Maybe I did do this to myself.', tone: 'GRIEF', nextId: 'mq2_1_d3_frost_trail' },
            { label: 'No. Something this complete doesn\'t happen from overuse.', tone: 'DETERMINATION', nextId: 'mq2_1_d3_frost_trail' },
          ],
        },
        {
          id: 'mq2_1_d3_frustration',
          speaker: 'Inner Voice',
          text: '[The frustration is real. It is yours. And it is useless here — the situation does not care about your frustration. Something colder and more patient than your anger is waiting at the other end of this corridor. Follow the frost. Answers first. Rage later, if it still feels warranted.]',
          tone: 'FRUSTRATION',
          choices: [{ label: '[Follow the frost trail.]', tone: 'DETERMINATION', nextId: 'mq2_1_d3_frost_trail' }],
        },
        {
          id: 'mq2_1_d3_frost_trail',
          speaker: 'Inner Voice',
          text: '[The frost forms a trail. Not random ice — directional. As if something walked through here and left cold in its wake. Or as if the cold itself is trying to show you something. You follow it to a door you haven\'t used before. It opens without resistance. Inside: you.]',
          tone: 'CONFUSION',
          choices: [{ label: '[Enter.]', tone: 'DETERMINATION', nextId: 'mq2_1_d4_echo_self' }],
        },
        {
          id: 'mq2_1_d4_echo_self',
          speaker: 'Echo (Past Self)',
          text: '[The figure in the chamber is you — exactly you — but from a specific moment. The posture is wrong. Braced. As if something struck without warning. The hands are raised — a reflex. The expression is not fear. It is the specific confusion of someone who reached for something they knew how to do and found it gone.] You\'re seeing it happen.',
          tone: 'GRIEF',
          choices: [
            { label: 'When did this happen? What was I doing?', tone: 'CONFUSION', nextId: 'mq2_1_d5_when' },
            { label: 'Was it the cold? The Winter?', tone: 'DOUBT', nextId: 'mq2_1_d5_winter' },
            { label: 'Did someone do this to me?', tone: 'FEAR', nextId: 'mq2_1_d5_someone' },
          ],
        },
        {
          id: 'mq2_1_d5_when',
          speaker: 'Echo (Past Self)',
          text: 'You were training. Full capacity. Everything was working — better than working, actually. Something felt aligned. And then between one breath and the next — the channel closed. Like a door shutting. Not breaking. Shutting. Someone shut it.',
          tone: 'GRIEF',
          choices: [
            { label: 'You\'re saying it was deliberate.', tone: 'FEAR', nextId: 'mq2_1_d6_fragment' },
          ],
        },
        {
          id: 'mq2_1_d5_winter',
          speaker: 'Echo (Past Self)',
          text: 'The Winter arrived the same night. That is either a coincidence or a cover. I don\'t know which. What I know is that cold doesn\'t close channels — it slows them. This wasn\'t slow. This was immediate. Complete.',
          tone: 'DOUBT',
          choices: [
            { label: 'So The Winter didn\'t cause this.', tone: 'DETERMINATION', nextId: 'mq2_1_d6_fragment' },
            { label: 'But The Winter could be connected.', tone: 'CONFUSION', nextId: 'mq2_1_d6_fragment' },
          ],
        },
        {
          id: 'mq2_1_d5_someone',
          speaker: 'Echo (Past Self)',
          text: 'I felt something in the room with me when it happened. Not the Presence — I know that shape now. Something different. More deliberate. Less hungry. It didn\'t want to consume me. It wanted to limit me. There\'s a difference.',
          tone: 'FEAR',
          choices: [
            { label: 'Who limits instead of consumes?', tone: 'CONFUSION', nextId: 'mq2_1_d6_fragment' },
          ],
        },
        {
          id: 'mq2_1_d6_fragment',
          speaker: 'Echo (Past Self)',
          text: 'I can give you one fragment. The moment just before. Hold it carefully — it\'s the kind of memory the Presence would very much like to intercept.',
          tone: 'DETERMINATION',
          mechanic: 'memory_echo',
          isEnd: true,
          rewardUnlocked: 'fragment_the_moment_before',
        },
      ],
      narrativeHook: `
        The fragment lands in you like a stone dropped into still water.
        The memory: training. Full function. Something watching from above.
        Not the Presence — the Presence watches from animal proximity.
        This was distant. Calculated. Clinical.
        And in the fraction of a second before the channel closed:
        a choice. Something chose to close it.
        You return to the corridor. Kylie is waiting outside the Echo chamber door.
        She looks at your hands. Her face does something complicated.
        "I heard you found the echo," she says. "How much did it show you?"
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 2 — "Kylie's First Session"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq2_2_kylie_first',
      title: 'Kylie\'s First Session',
      level: 6,
      npcId: 'kylie',
      narrativeSetup: `
        Kylie sets up a training space in the east room.
        She doesn't use conventional equipment — just two flat stones,
        a rope with specific knots, and a candle she places at precise distances.
        She watches you enter without speaking.
        When you stand across from her, she finally says:
        "The channel isn't gone. Closed is different from gone. We're going to find the edge of it."
        She says this with the confidence of someone who has done it before.
        You don't ask who she did it for. Not yet.
      `,
      objectives: [
        { step: 1, text: 'Complete the first positioning drill — environmental timing only' },
        { step: 2, text: 'Sustain contact with the training stone for 45 seconds without strain' },
        { step: 3, text: 'Identify the moment the closed channel creates the "edge sensation"' },
        { step: 4, text: 'Receive the Partial Restoration from Kylie\'s technique' },
        { step: 5, text: 'Report what the edge felt like' },
      ],
      reward: {
        type: 'partial_restoration',
        name: 'The Edge Technique',
        description: 'Partial channel function restored. Core abilities available at 40% capacity. Overuse triggers strain feedback.',
        xp: 220,
        points: 4,
      },
      dialogue: [
        {
          id: 'mq2_2_d1_kylie_open',
          speaker: 'Kylie',
          text: 'Stand here. Not there — here. The stone needs to be between us. Put your hand on it. Not over it, not near it — on it. Full palm contact.',
          tone: 'DETERMINATION',
          choices: [
            { label: '[Comply immediately.]', tone: 'DETERMINATION', nextId: 'mq2_2_d2_stone_contact' },
            { label: 'What does the stone do?', tone: 'CONFUSION', nextId: 'mq2_2_d1b_explain' },
            { label: 'Has this worked before? For someone else?', tone: 'DOUBT', nextId: 'mq2_2_d1c_before' },
          ],
        },
        {
          id: 'mq2_2_d1b_explain',
          speaker: 'Kylie',
          text: 'The stone is a conductor. Not for the ability itself — for the intention behind it. When direct channels are closed, intention still moves. It just needs something physical to move through. The stone is that thing.',
          tone: 'DETERMINATION',
          choices: [{ label: '[Put your hand on the stone.]', tone: 'DETERMINATION', nextId: 'mq2_2_d2_stone_contact' }],
        },
        {
          id: 'mq2_2_d1c_before',
          speaker: 'Kylie',
          text: '[She pauses. A beat too long to be comfortable.] Yes. Once. Someone who was severed more completely than you are. Don\'t ask what happened to them. Focus on the stone.',
          tone: 'GRIEF',
          choices: [
            { label: '[Let it go. Put your hand on the stone.]', tone: 'DETERMINATION', nextId: 'mq2_2_d2_stone_contact' },
            { label: 'I need to know — did they recover?', tone: 'DOUBT', nextId: 'mq2_2_d1d_recover' },
          ],
        },
        {
          id: 'mq2_2_d1d_recover',
          speaker: 'Kylie',
          text: '[Longer pause.] Partially. Hand on the stone.',
          tone: 'GRIEF',
          choices: [{ label: '[Hand on the stone. Don\'t push on that answer yet.]', tone: 'DETERMINATION', nextId: 'mq2_2_d2_stone_contact' }],
        },
        {
          id: 'mq2_2_d2_stone_contact',
          speaker: 'Kylie',
          text: 'Good. Now — don\'t try to DO anything. Just feel the stone. The temperature of it. The weight of your palm against it. Notice when your mind tries to push an ability through — don\'t let it. Just stay in contact.',
          tone: 'DETERMINATION',
          mechanic: 'adaptive_timing',
          choices: [
            { label: '[Hold still. Feel the stone.]', tone: 'DETERMINATION', nextId: 'mq2_2_d3_hold' },
            { label: '[Try to push an ability through by accident.]', tone: 'FRUSTRATION', nextId: 'mq2_2_d3_push_fail' },
          ],
        },
        {
          id: 'mq2_2_d3_push_fail',
          speaker: 'Kylie',
          text: 'Stop. I felt you try. The stone transmitted it — there\'s a specific heat signature when the closed channel fires. You just generated it. Good — that means it\'s not gone. Bad — doing that repeatedly will injure you. Stop pushing. Just feel.',
          tone: 'PAIN',
          choices: [{ label: '[Stop pushing. Just hold.]', tone: 'DETERMINATION', nextId: 'mq2_2_d3_hold' }],
        },
        {
          id: 'mq2_2_d3_hold',
          speaker: 'Inner Voice',
          text: '[You hold. The stone is cool. Then warmer. Then — at exactly forty-one seconds — something you haven\'t felt before: a boundary. A definite edge in the darkness where your ability used to flow. Not broken. Bounded. There is something on the other side of the boundary. You can feel it the way you feel sunlight through closed eyelids.]',
          tone: 'DETERMINATION',
          choices: [
            { label: 'I can feel the edge. There\'s something beyond it.', tone: 'DETERMINATION', nextId: 'mq2_2_d4_edge_report' },
          ],
        },
        {
          id: 'mq2_2_d4_edge_report',
          speaker: 'Kylie',
          text: '[She exhales — relief she was keeping controlled.] That\'s it. That\'s the closure point. Now listen to me carefully: what you\'re feeling on the other side is not your ability being restored. It\'s the mechanism that closed it. You found the lock, not the key. But finding the lock means the key exists.',
          tone: 'DETERMINATION',
          choices: [
            { label: 'What is the lock made of?', tone: 'CONFUSION', nextId: 'mq2_2_d5_lock' },
            { label: 'Can you open it from this side?', tone: 'DETERMINATION', nextId: 'mq2_2_d5_open' },
            { label: 'It felt deliberate. Constructed. Not natural.', tone: 'FEAR', nextId: 'mq2_2_d5_deliberate' },
          ],
        },
        {
          id: 'mq2_2_d5_lock',
          speaker: 'Kylie',
          text: 'Something that knows your channel architecture well enough to close it precisely. That requires either extensive observation or... direct access at some point.',
          tone: 'FEAR',
          choices: [
            { label: 'Someone was inside my channel.', tone: 'FEAR', nextId: 'mq2_2_d6_restore' },
          ],
        },
        {
          id: 'mq2_2_d5_open',
          speaker: 'Kylie',
          text: 'Not fully. Not yet. But I can give you a temporary bypass — think of it as a side door. It won\'t hold long and it will cause strain if you overuse it. But it will let you function. Forty percent. Maybe fifty on a good hour.',
          tone: 'DETERMINATION',
          choices: [
            { label: 'Forty percent is enough to work with.', tone: 'RESOLVE', nextId: 'mq2_2_d6_restore' },
            { label: 'How long will the bypass last?', tone: 'DOUBT', nextId: 'mq2_2_d5_duration' },
          ],
        },
        {
          id: 'mq2_2_d5_deliberate',
          speaker: 'Kylie',
          text: '[She looks at you steadily. Something in her expression shifts — confirmation, not surprise.] Yes. I know. I\'ve known since the morning it happened. I was trying to let you reach that conclusion yourself.',
          tone: 'GRIEF',
          choices: [
            { label: 'You knew and you didn\'t tell me immediately?', tone: 'FRUSTRATION', nextId: 'mq2_2_d5_kylie_knew' },
            { label: 'Who did it?', tone: 'FEAR', nextId: 'mq2_2_d5_who_did' },
          ],
        },
        {
          id: 'mq2_2_d5_kylie_knew',
          speaker: 'Kylie',
          text: 'Because if I\'d told you before you felt it yourself, the lock would have learned from your reaction. It\'s observing. Everything I tell you — it might intercept. The less it can anticipate how you process information, the better. I\'m sorry. That calculation was cold. I know that.',
          tone: 'GRIEF',
          choices: [
            { label: 'I\'ll deal with that later. Give me the bypass.', tone: 'DETERMINATION', nextId: 'mq2_2_d6_restore' },
            { label: 'I appreciate that you\'re honest about the calculation being cold.', tone: 'RESOLVE', nextId: 'mq2_2_d6_restore' },
          ],
        },
        {
          id: 'mq2_2_d5_who_did',
          speaker: 'Kylie',
          text: 'I don\'t know yet. I have a suspicion. A name I\'ve heard connected to this kind of work. I\'m not saying it here — same reason. The moment I name it, the lock recalibrates.',
          tone: 'FEAR',
          choices: [{ label: 'Give me the bypass. We work on the name separately.', tone: 'DETERMINATION', nextId: 'mq2_2_d6_restore' }],
        },
        {
          id: 'mq2_2_d5_duration',
          speaker: 'Kylie',
          text: 'Two, maybe three hours of intensive use before the strain becomes serious. Think of it as a borrowed limb. Use it carefully.',
          tone: 'DETERMINATION',
          choices: [{ label: '[Accept the bypass.]', tone: 'DETERMINATION', nextId: 'mq2_2_d6_restore' }],
        },
        {
          id: 'mq2_2_d6_restore',
          speaker: 'Kylie',
          text: '[She places both hands over yours on the stone. The technique is physical — pressure points along the wrist, a specific sequence of contact. She works in silence for two minutes. When she lifts her hands, something is different. Not restored — bypassed. The difference matters.] Try it. Gently.',
          tone: 'DETERMINATION',
          isEnd: true,
          rewardUnlocked: 'partial_restoration_edge_technique',
        },
      ],
      narrativeHook: `
        The bypass works. Forty percent — she was right.
        You flex the channel carefully, the way you'd test weight on a repaired bridge.
        It holds. The strain is there — a faint burn at the threshold — but it holds.
        Kylie watches you without celebration.
        "Don't thank me yet. The bypass is temporary. We need the actual key."
        She begins wrapping the training rope into a specific pattern.
        "There's someone who's seen this lock before. Someone who was watching
        when it was put in place. The problem is: they chose not to stop it."
        She doesn't look up from the rope.
        "And they're still here."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 3 — "The Silent Observer"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq2_3_silent_observer',
      title: 'The Silent Observer',
      level: 7,
      npcId: 'the_silent_observer',
      narrativeSetup: `
        You find them in a room that shouldn't be accessible — a gallery of frozen moments,
        each one a snapshot of a decision point in your life. They are standing in front of
        the largest one: the moment of the Severing.
        They are watching it with the focused attention of someone reviewing their work.
        Or their failure to act.
        When they hear you enter, they don't turn around.
        "I was wondering when you'd find me," they say, in a voice that is neither
        apologetic nor defensive. It is the voice of someone who has made peace
        with a choice you haven't made peace with yet.
      `,
      objectives: [
        { step: 1, text: 'Confront the Silent Observer without triggering a retreat' },
        { step: 2, text: 'Determine why they chose not to intervene' },
        { step: 3, text: 'Decide whether their reason changes anything' },
        { step: 4, text: 'Extract the location of the lock\'s origin from them' },
      ],
      reward: {
        type: 'knowledge_fragment',
        name: 'The Observer\'s Account',
        description: 'The truth of why no one stopped it. Clears the Doubt status effect. Reveals the lock\'s architect.',
        xp: 280,
        points: 5,
      },
      dialogue: [
        {
          id: 'mq2_3_d1_enter',
          speaker: 'The Silent Observer',
          text: 'I know why you\'re here. I know what you want from me. I\'ll save us both the buildup: I saw it happen. I could have intervened. I chose not to.',
          tone: 'DOUBT',
          choices: [
            { label: 'Why.', tone: 'FRUSTRATION', nextId: 'mq2_3_d2_why' },
            { label: '[Stay quiet. Let them keep talking.]', tone: 'DETERMINATION', nextId: 'mq2_3_d2_quiet' },
            { label: 'You understand that choice cost me everything.', tone: 'GRIEF', nextId: 'mq2_3_d2_cost' },
          ],
        },
        {
          id: 'mq2_3_d2_why',
          speaker: 'The Silent Observer',
          text: 'Because intervening would have revealed me. And if I\'m revealed — the thing that built the lock knows I exist and knows I\'ve been watching it. I would become a target. My utility as an observer would end.',
          tone: 'DOUBT',
          choices: [
            { label: 'You protected your position at my expense.', tone: 'FRUSTRATION', nextId: 'mq2_3_d3_protect' },
            { label: 'That\'s a calculated answer. Do you feel anything about it?', tone: 'GRIEF', nextId: 'mq2_3_d3_feel' },
            { label: 'Has your observation yielded anything useful?', tone: 'DETERMINATION', nextId: 'mq2_3_d3_useful' },
          ],
        },
        {
          id: 'mq2_3_d2_quiet',
          speaker: 'The Silent Observer',
          text: '[They turn. Finally. Their face is composed — not cold. The kind of composed that has cost something.] The lock was placed by something that has access to channel architecture that should not be accessible to any single entity. This wasn\'t improvised. This was a system. Someone spent significant time learning your specific channel pathways before closing them.',
          tone: 'FEAR',
          choices: [
            { label: 'How long were they studying me?', tone: 'CONFUSION', nextId: 'mq2_3_d3_how_long' },
          ],
        },
        {
          id: 'mq2_3_d2_cost',
          speaker: 'The Silent Observer',
          text: '[They are quiet for a long moment.] I know. I\'ve been accounting for that cost since it happened. The calculation I made was real — but the cost was also real. Both things are true.',
          tone: 'GRIEF',
          choices: [
            { label: 'Your accounting doesn\'t restore what I lost.', tone: 'FRUSTRATION', nextId: 'mq2_3_d3_accounting' },
            { label: 'Tell me what your observation has learned. Make it worth something.', tone: 'DETERMINATION', nextId: 'mq2_3_d3_useful' },
          ],
        },
        {
          id: 'mq2_3_d3_protect',
          speaker: 'The Silent Observer',
          text: 'Yes. And I would make the same choice again — except. [pause] Except the lock has held longer than I anticipated. I underestimated the severity. That part of the calculation was wrong.',
          tone: 'DOUBT',
          choices: [
            { label: 'Good. Then tell me what you know about how to undo it.', tone: 'DETERMINATION', nextId: 'mq2_3_d4_location' },
          ],
        },
        {
          id: 'mq2_3_d3_feel',
          speaker: 'The Silent Observer',
          text: '[Long pause. They look back at the frozen moment on the wall.] Yes. I feel it. Not guilt — something more specific. The feeling of watching a door close on someone and knowing I had a hand on the frame. I didn\'t shut the door. But I didn\'t hold it open either.',
          tone: 'GRIEF',
          choices: [
            { label: 'That distinction matters to you.', tone: 'DOUBT', nextId: 'mq2_3_d3_distinction' },
            { label: 'Tell me who built the lock.', tone: 'DETERMINATION', nextId: 'mq2_3_d4_location' },
          ],
        },
        {
          id: 'mq2_3_d3_distinction',
          speaker: 'The Silent Observer',
          text: 'It\'s the only distinction I have left. [They turn to face you fully.] I\'m going to give you everything I observed. Not because I owe it to you — though I do. Because it\'s the only thing I can offer that is actually useful.',
          tone: 'RESOLVE',
          choices: [{ label: '[Listen.]', tone: 'DETERMINATION', nextId: 'mq2_3_d4_location' }],
        },
        {
          id: 'mq2_3_d3_useful',
          speaker: 'The Silent Observer',
          text: 'Enough to give you a name. And a location. The entity that built the lock has a signature — a specific pattern in how it closes channels. I\'ve documented it across seven cases in the last decade. Yours is the eighth.',
          tone: 'DETERMINATION',
          choices: [
            { label: 'Seven others. What happened to them?', tone: 'FEAR', nextId: 'mq2_3_d3_seven' },
            { label: 'Give me the location.', tone: 'DETERMINATION', nextId: 'mq2_3_d4_location' },
          ],
        },
        {
          id: 'mq2_3_d3_seven',
          speaker: 'The Silent Observer',
          text: 'Three adapted. Two didn\'t. Two I lost track of. You are the first who found the lock from the inside. That\'s not nothing.',
          tone: 'GRIEF',
          choices: [{ label: 'Give me the location.', tone: 'DETERMINATION', nextId: 'mq2_3_d4_location' }],
        },
        {
          id: 'mq2_3_d3_how_long',
          speaker: 'The Silent Observer',
          text: 'Based on the lock\'s precision? At minimum two years of observation. Possibly longer. The kind of patience this requires is not human. Or if human — barely.',
          tone: 'FEAR',
          choices: [{ label: 'Where is this thing?', tone: 'DETERMINATION', nextId: 'mq2_3_d4_location' }],
        },
        {
          id: 'mq2_3_d3_accounting',
          speaker: 'The Silent Observer',
          text: 'No. It doesn\'t. Nothing I say here restores it. That\'s also true. [They reach into their coat and remove a folded piece of paper.] But this might help.',
          tone: 'GRIEF',
          choices: [{ label: '[Take it.]', tone: 'DETERMINATION', nextId: 'mq2_3_d4_location' }],
        },
        {
          id: 'mq2_3_d4_location',
          speaker: 'The Silent Observer',
          text: 'The lock\'s origin is in the lower chamber — the one the Winter sealed. The architect doesn\'t live there, but the mechanism does. The lock has a physical component — not metaphysical, not abstract. Something was placed in that chamber before the Severing occurred. A device. Find it, and you find the mechanism. Find the mechanism, and Kylie can work on the key.',
          tone: 'DETERMINATION',
          choices: [
            { label: 'Will you help from here on?', tone: 'DOUBT', nextId: 'mq2_3_d5_help' },
            { label: '[Take the information and leave.]', tone: 'DETERMINATION', nextId: 'mq2_3_end' },
          ],
        },
        {
          id: 'mq2_3_d5_help',
          speaker: 'The Silent Observer',
          text: 'In the way I can. Which means I won\'t be visible, won\'t intervene directly, and won\'t confirm my involvement if asked. The same limitations as before. I know what that sounds like. I\'m telling you anyway, so you can decide how much to rely on me.',
          tone: 'DOUBT',
          choices: [
            { label: 'That\'s an honest answer. I\'ll take it.', tone: 'RESOLVE', nextId: 'mq2_3_end' },
            { label: 'An observer who never acts is just a witness. I don\'t need witnesses.', tone: 'FRUSTRATION', nextId: 'mq2_3_end' },
          ],
        },
        {
          id: 'mq2_3_end',
          speaker: 'Inner Voice',
          text: '[You leave the gallery. The frozen moment of the Severing is still on the wall behind you. You don\'t look back at it. You already know what it shows. The lower chamber is sealed by The Winter. You need to get through the cold to reach the mechanism. Kylie needs to know what you found.]',
          tone: 'DETERMINATION',
          isEnd: true,
          rewardUnlocked: 'knowledge_fragment_observers_account',
        },
      ],
      narrativeHook: `
        Kylie takes the information without blinking.
        She's quiet for a long time. Then:
        "The lower chamber. Of course."
        She looks at the frost on the window.
        "The Winter didn't just arrive as cover. It's protective — for the mechanism, not for us.
        The cold is keeping the device stable. If we go in there and retrieve it,
        the device destabilizes. The lock might open completely. Or it might close permanently."
        She pauses.
        "It's a gamble. And I need you to be the one to decide whether to take it."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 4 — "Into the Winter"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq2_4_into_winter',
      title: 'Into the Winter',
      level: 8,
      npcId: 'the_winter',
      narrativeSetup: `
        The lower chamber is cold enough to make your breath appear as solid fog.
        The frost on the walls forms patterns — too regular to be natural.
        Crystalline structures that look deliberate.
        The Winter speaks in your body here: a slowing of thought,
        a heaviness in the joints, a particular grey at the edge of vision
        that you understand is not hypothermia but something more targeted.
        Something designed this cold. Tuned it.
        Somewhere in this chamber is a mechanism that holds your ability closed.
        And the cold is its guardian.
      `,
      objectives: [
        { step: 1, text: 'Navigate the lower chamber using environmental timing — no direct ability use' },
        { step: 2, text: 'Locate the mechanism through the frost patterns' },
        { step: 3, text: 'Resist The Winter\'s disorientation effect long enough to reach it' },
        { step: 4, text: 'Make the decision: retrieve the device and risk the lock, or document it and leave' },
      ],
      reward: {
        type: 'critical_choice',
        name: 'The Winter\'s Gift',
        description: 'Path A: Device retrieved — lock unstable. Path B: Device documented — lock unchanged but mapped. Both unlock Arc 2 Sub-Quest 5.',
        xp: 350,
        points: 6,
      },
      dialogue: [
        {
          id: 'mq2_4_d1_enter',
          speaker: 'Inner Voice',
          text: '[The cold arrives before the doorway does. A pressure change — your sinuses register it, then your lungs. By the time you step through the threshold, you understand that the cold is not weather. It has weight and direction. It is pointing at you.]',
          tone: 'FEAR',
          mechanic: 'environmental_navigation',
          choices: [
            { label: '[Move forward. Use the frost patterns to navigate.]', tone: 'DETERMINATION', nextId: 'mq2_4_d2_frost_nav' },
            { label: '[Test the bypass channel first. Make sure it holds in the cold.]', tone: 'DOUBT', nextId: 'mq2_4_d2_test_bypass' },
          ],
        },
        {
          id: 'mq2_4_d2_test_bypass',
          speaker: 'Inner Voice',
          text: '[The bypass responds — but at reduced efficiency in the cold. Perhaps thirty percent instead of forty. The strain threshold is lower here. The Winter is not just cold — it is specifically suppressive toward channel function. You file this information. Someone designed this environment as an amplifier for the lock.]',
          tone: 'DETERMINATION',
          choices: [{ label: '[Navigate using the frost patterns.]', tone: 'DETERMINATION', nextId: 'mq2_4_d2_frost_nav' }],
        },
        {
          id: 'mq2_4_d2_frost_nav',
          speaker: 'The Winter',
          text: '[Not words — sensation. The cold speaks in physical impressions: a pulling sensation toward the wrong passage, a numbing that starts in your left hand — your marked hand — and moves up the arm. The Winter is trying to steer. The irony is immediate: another steering force, a different method.] Turn back. This is not a place for what you\'re looking for.',
          tone: 'FEAR',
          choices: [
            { label: 'I know what I\'m looking for. You\'re protecting it.', tone: 'DETERMINATION', nextId: 'mq2_4_d3_confront_winter' },
            { label: '[Follow the frost patterns instead of the pulling sensation.]', tone: 'DETERMINATION', nextId: 'mq2_4_d3_navigate' },
          ],
        },
        {
          id: 'mq2_4_d3_confront_winter',
          speaker: 'The Winter',
          text: '[The cold intensifies — briefly, sharply, like a warning.] I protect what is placed in my keeping. I don\'t choose what is placed here. I am not the architect of the mechanism. I am only the environment.',
          tone: 'DOUBT',
          choices: [
            { label: 'Then stand aside. You\'re not my enemy.', tone: 'RESOLVE', nextId: 'mq2_4_d3_navigate' },
            { label: 'If you\'re not choosing to protect it — you can let me through.', tone: 'DETERMINATION', nextId: 'mq2_4_d4_winter_yields' },
          ],
        },
        {
          id: 'mq2_4_d4_winter_yields',
          speaker: 'The Winter',
          text: '[A long pause in the form of temperature. Then: the pulling sensation stops. The cold remains but stops directing. You have, somehow, negotiated with a season. The frost patterns become clear guides rather than obstacles.]',
          tone: 'RESOLVE',
          choices: [{ label: '[Follow the patterns to the mechanism.]', tone: 'DETERMINATION', nextId: 'mq2_4_d3_navigate' }],
        },
        {
          id: 'mq2_4_d3_navigate',
          speaker: 'Inner Voice',
          text: '[The frost patterns are precise — too precise for ice. They were laid deliberately, like a map. You follow them through three passages, each colder than the last. At the fourth, the disorientation begins: edges of your vision turning grey, thoughts arriving slightly delayed from the moment you think them. The Winter\'s cognitive effect. You push through. The mechanism is ahead.]',
          tone: 'PAIN',
          mechanic: 'visual_distortion',
          choices: [
            { label: '[Push through the disorientation. Keep moving.]', tone: 'DETERMINATION', nextId: 'mq2_4_d5_find_mechanism' },
            { label: '[Stop. Breathe. Let the disorientation stabilize before continuing.]', tone: 'RESOLVE', nextId: 'mq2_4_d5_stabilize' },
          ],
        },
        {
          id: 'mq2_4_d5_stabilize',
          speaker: 'Inner Voice',
          text: '[You stop. Breathe slowly. The grey recedes slightly. You notice, in the stillness, that the disorientation has a rhythm — it pulses in sync with something nearby. The mechanism. Its operation is causing the cognitive suppression as a side effect. This information is useful.]',
          tone: 'DETERMINATION',
          choices: [{ label: '[Move toward the pulse. Find the mechanism.]', tone: 'DETERMINATION', nextId: 'mq2_4_d5_find_mechanism' }],
        },
        {
          id: 'mq2_4_d5_find_mechanism',
          speaker: 'Inner Voice',
          text: '[You find it. A device — physical, as the Observer promised. Not large. Not impressive looking. A construction of materials you don\'t recognize, shaped to create a specific resonance. It is pulsing softly — a rhythm that matches, you realize with cold understanding, your own channel frequency. This was tuned to you specifically. This was built for you.]',
          tone: 'FEAR',
          choices: [
            { label: '[Retrieve it. Remove it from the chamber.]', tone: 'DETERMINATION', nextId: 'mq2_4_d6_retrieve', mechanic: 'critical_choice_a' },
            { label: '[Document it. Record its frequency. Leave it in place.]', tone: 'DOUBT', nextId: 'mq2_4_d6_document', mechanic: 'critical_choice_b' },
          ],
        },
        {
          id: 'mq2_4_d6_retrieve',
          speaker: 'Inner Voice',
          text: '[Your hand closes around it. The moment of contact: a vibration travels from the device up through your wrist, your arm, your shoulder. The lock — wherever it sits in your channel architecture — responds. A shudder. Then a shift. Then: forty percent becomes sixty. The bypass snaps wider. More function returns. And the device begins to crack.]',
          tone: 'PAIN',
          mechanic: 'ability_partial_restore',
          isEnd: true,
          rewardUnlocked: 'winter_gift_path_a_retrieved',
          arcResult: 'DEVICE_RETRIEVED',
        },
        {
          id: 'mq2_4_d6_document',
          speaker: 'Inner Voice',
          text: '[You study it. Carefully. The frequency, the construction, the specific resonance pattern that matches your channel. You record every detail without touching it. When you finally stand and leave the chamber, the cold releases you gradually — as if even The Winter respects this choice. The device remains. The lock remains. But now you have a map of the key.]',
          tone: 'RESOLVE',
          isEnd: true,
          rewardUnlocked: 'winter_gift_path_b_documented',
          arcResult: 'DEVICE_DOCUMENTED',
        },
      ],
      narrativeHook: `
        You emerge from the lower chamber. Kylie is waiting.
        She sees your expression and reads it immediately.
        If you retrieved the device: "The lock shifted. You felt it." She almost smiles.
        "The crack is an opening. We need to work fast before it recalibrates."
        If you documented it: "You mapped it." She nods slowly. "Safer. Slower.
        We build the key from the pattern. It'll take longer but it won't risk everything
        on a single moment." Either way, she looks at the frost on your clothes.
        "There's one more thing. The thing that built this — it knows what you did in there.
        And it knows that you know. It will respond."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 5 — "The Return of Function"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq2_5_return_of_function',
      title: 'The Return of Function',
      level: 9,
      npcId: 'kylie',
      narrativeSetup: `
        The final session. Kylie has been working for three days without significant rest.
        The key — whether constructed from the documented frequency map or reverse-engineered
        from the cracking device — is almost complete.
        But there is a complication.
        The entity that built the lock has noticed the interference with its mechanism.
        It has begun a counter-measure: not closing the bypass, but narrowing it.
        Incrementally. As if testing how much it can take back before you respond.
        Kylie and you have a narrowing window.
        The question is not whether function can be restored. It can.
        The question is what the restoration will cost — and whether you are willing to pay it.
      `,
      objectives: [
        { step: 1, text: 'Sustain the bypass under active counter-pressure — timing drill' },
        { step: 2, text: 'Work with Kylie to insert the key at the exact right moment' },
        { step: 3, text: 'Survive the counter-measure response (full interference wave)' },
        { step: 4, text: 'Choose the depth of restoration: partial but safe, or full but exposed' },
        { step: 5, text: 'Receive Skadi\'s message upon completion — Arc 2 close' },
      ],
      reward: {
        type: 'arc_completion',
        name: 'Restored — At Cost',
        description: 'Full or partial restoration achieved. Arc 2 complete. The architect of the lock has been identified. Arc 3 unlocked: "The Architect\'s Name."',
        xp: 500,
        points: 10,
      },
      dialogue: [
        {
          id: 'mq2_5_d1_kylie_ready',
          speaker: 'Kylie',
          text: 'The key is ready. The window is closing. I need you to hold the bypass open at exactly forty percent — not more, not less — while I work. If you close it, the key won\'t seat. If you push it open wider, the counter-measure will accelerate. Forty percent. And hold it.',
          tone: 'DETERMINATION',
          choices: [
            { label: 'Understood. Let\'s go.', tone: 'DETERMINATION', nextId: 'mq2_5_d2_drill' },
            { label: 'What happens if the counter-measure hits mid-insertion?', tone: 'DOUBT', nextId: 'mq2_5_d1b_risk' },
            { label: 'I trust your read on the window. Tell me when.', tone: 'RESOLVE', nextId: 'mq2_5_d2_drill' },
          ],
        },
        {
          id: 'mq2_5_d1b_risk',
          speaker: 'Kylie',
          text: 'The key fragments. I have to reconstruct it. We lose the window. The lock closes to eighty percent. We go back to the stone technique and start over. [pause] So don\'t let the counter-measure hit mid-insertion.',
          tone: 'DETERMINATION',
          choices: [{ label: 'Tell me when.', tone: 'DETERMINATION', nextId: 'mq2_5_d2_drill' }],
        },
        {
          id: 'mq2_5_d2_drill',
          speaker: 'Inner Voice',
          text: '[The bypass holds at forty. Kylie works. You feel the counter-measure before you see it — a tightening, the same quality as the original Severing but smaller, more precise. A response, not an attack. Testing. Probing. It is looking for a weakness in the hold.] It\'s pushing back.',
          tone: 'PAIN',
          mechanic: 'ability_hold',
          choices: [
            { label: '[Hold the forty. Don\'t give ground.]', tone: 'DETERMINATION', nextId: 'mq2_5_d3_hold' },
            { label: '[Push to fifty to compensate — more margin.]', tone: 'FRUSTRATION', nextId: 'mq2_5_d3_push_fifty' },
          ],
        },
        {
          id: 'mq2_5_d3_push_fifty',
          speaker: 'Kylie',
          text: 'Don\'t — [sharp, immediate] — you just pushed to fifty. I can feel the counter-measure spike. Pull back. Now. Forty. Forty.',
          tone: 'FRUSTRATION',
          choices: [
            { label: '[Pull back to forty.]', tone: 'DETERMINATION', nextId: 'mq2_5_d3_hold' },
          ],
        },
        {
          id: 'mq2_5_d3_hold',
          speaker: 'Inner Voice',
          text: '[You hold. The counter-measure intensifies — a wave of grey at the edges of perception, the same disorientation as The Winter amplified. The bypass strains. Your arm hurts. The hurt is real — not feedback, not warning. Genuine strain damage building. You hold.] It hurts.',
          tone: 'PAIN',
          mechanic: 'strain_feedback',
          choices: [
            { label: 'It hurts. I can still hold.', tone: 'DETERMINATION', nextId: 'mq2_5_d4_key_moment' },
            { label: '[Don\'t speak. Save the energy for holding.]', tone: 'RESOLVE', nextId: 'mq2_5_d4_key_moment' },
          ],
        },
        {
          id: 'mq2_5_d4_key_moment',
          speaker: 'Kylie',
          text: 'Almost. Three seconds. Two. One — [the key seats with a sensation you feel through your entire channel system: a click that isn\'t a sound, a release that isn\'t an absence] — it\'s in.',
          tone: 'RESOLVE',
          choices: [
            { label: '[Wait for what happens next.]', tone: 'CONFUSION', nextId: 'mq2_5_d5_choice' },
          ],
        },
        {
          id: 'mq2_5_d5_choice',
          speaker: 'Kylie',
          text: 'The key is in. The lock is… cracked. Not open — cracked. I can push it to full open right now, while the crack is fresh. Or I can seal it at sixty percent — stable, functional, difficult to re-lock — and we stop here. Sixty percent is survivable and sustainable. Full open is everything you had before — but it will draw the architect\'s full attention. They will know exactly where you are and what you\'ve recovered. Your choice. Right now.',
          tone: 'DETERMINATION',
          choices: [
            {
              label: 'Full open. I want everything back.',
              tone: 'DETERMINATION',
              nextId: 'mq2_5_d6_full_open',
              mechanic: 'critical_choice_full',
            },
            {
              label: 'Sixty percent. Stable and functional. Don\'t expose us.',
              tone: 'RESOLVE',
              nextId: 'mq2_5_d6_sixty',
              mechanic: 'critical_choice_partial',
            },
          ],
        },
        {
          id: 'mq2_5_d6_full_open',
          speaker: 'Kylie',
          text: '[She pushes. The crack becomes an opening. The opening becomes restoration. The channel floods back with the specific warmth of function returning — everything there, everything responsive, everything that was taken now present again. And then, almost immediately: the counter-measure responds. Full force. A wave of interference that knocks your vision sideways. You hold. And for the first time since the Severing — you hold because you chose to, with everything working.]',
          tone: 'PAIN',
          mechanic: 'full_ability_restore',
          isEnd: true,
          rewardUnlocked: 'arc2_complete_full_restoration',
          arcResult: 'FULL_RESTORE',
        },
        {
          id: 'mq2_5_d6_sixty',
          speaker: 'Kylie',
          text: '[She seals it. The crack closes around the key — stable, solid. Not everything — but sixty percent returned and functioning without strain. The counter-measure probes once, finds the seal, and withdraws. Calculating. You can feel it calculating. It knows what you chose. It is not certain what that means about you. Neither, entirely, are you. But you are standing. You are functional. You made the choice yourself.] Good.',
          tone: 'RESOLVE',
          mechanic: 'partial_ability_restore',
          isEnd: true,
          rewardUnlocked: 'arc2_complete_partial_restoration',
          arcResult: 'PARTIAL_RESTORE',
        },
      ],
      narrativeHook: `
        The session ends. Kylie sits on the floor against the wall.
        She looks exhausted in a way she wasn't showing before.
        You ask: "What now?"
        She says: "Now the architect knows you broke their mechanism.
        They will try to understand how. That gives us a window —
        while they're studying us, we study them."
        
        A mark appears on the wall beside you. Three lines. Skadi.
        Beneath it, a single carved word: "FOUND THEM."
        
        Kylie reads it. Looks at you.
        "Skadi found the architect. That's either the best news we've had
        in two arcs or the beginning of something considerably worse."
        
        Arc 2: The Loss of Hands — Complete.
        Arc 3: The Architect's Name — Unlocked.
      `,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIDE QUESTS — Arc 2
// ═══════════════════════════════════════════════════════════════════════════════

export const ARC2_SIDE_QUESTS = [

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 1 — "What the Winter Remembers"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq2_1_winter_remembers',
    title: 'What the Winter Remembers',
    level: 6,
    npcId: 'the_winter',
    connectedMainQuest: 'mq2_1_hands_stopped',
    narrativeSetup: `
      The Winter is not malicious. It is environmental — and it has a memory.
      Every entity that has passed through this cold has left a thermal trace,
      and The Winter holds those traces the way stone holds the impression of weight.
      If you know how to read cold, you can find the architect's approach path —
      the trajectory they took to reach the mechanism before placing it.
      This is the only route that bypasses the lock's perimeter sensing.
      You need to read The Winter before it melts those traces.
    `,
    objectives: [
      { step: 1, text: 'Find the three entry thermal traces in the lower corridor' },
      { step: 2, text: 'Map the approach path of the architect' },
      { step: 3, text: 'Follow the path to its origin point without triggering the mechanism' },
      { step: 4, text: 'Return the thermal map to Kylie' },
    ],
    reward: {
      type: 'tactical_knowledge',
      name: 'The Approach Map',
      description: 'The architect\'s movement pattern revealed. Future counter-measure waves arrive 1.5 seconds later — you can predict them.',
      xp: 200,
      points: 4,
    },
    dialogue: [
      {
        id: 'sq2_1_d1_read_cold',
        speaker: 'The Winter',
        text: '[Not language. A lowering of temperature in specific locations — a trail of relative cold within cold. You understand, after a moment, that this is information being offered. The Winter is showing you the footprints left in temperature by something that passed through with more body heat than it should have had. The architect was warm. Artificially warm. Insulated against the very environment they deployed.]',
        tone: 'CONFUSION',
        choices: [
          { label: '[Follow the warm-trace trail.]', tone: 'DETERMINATION', nextId: 'sq2_1_d2_trace_follow' },
          { label: 'Why are you showing me this?', tone: 'CURIOSITY', nextId: 'sq2_1_d1b_why' },
        ],
      },
      {
        id: 'sq2_1_d1b_why',
        speaker: 'The Winter',
        text: '[Temperature drop. Then rise. As if a shrug expressed in Celsius.] I protect what is placed in my keeping. The device has been retrieved or recorded — my function shifts. The traces are not mine to guard. They are the architect\'s. I have no contract with the architect.',
        tone: 'RESOLVE',
        choices: [{ label: '[Follow the traces.]', tone: 'DETERMINATION', nextId: 'sq2_1_d2_trace_follow' }],
      },
      {
        id: 'sq2_1_d2_trace_follow',
        speaker: 'Inner Voice',
        text: '[Three traces — each left at different distances from the mechanism, like calibration points. The architect stood here, here, and here before placing the device. They knew the chamber. They\'d been in it before. The origin point of the traces leads to a section of wall that appears solid. On closer inspection: a seam. A concealed entrance. From outside this chamber entirely.]',
        tone: 'CONFUSION',
        choices: [
          { label: '[Mark the entrance. Don\'t open it yet.]', tone: 'DETERMINATION', nextId: 'sq2_1_d3_mark' },
          { label: '[Try to open it now.]', tone: 'FRUSTRATION', nextId: 'sq2_1_d3_open_now' },
        ],
      },
      {
        id: 'sq2_1_d3_open_now',
        speaker: 'Inner Voice',
        text: '[The entrance requires something you don\'t have — a specific pressure combination, or a key, or a frequency. It doesn\'t yield. But your attempt registers somewhere: a faint vibration travels through the wall in both directions. Someone on the other side felt you try. You step back. Mark it instead.]',
        tone: 'FEAR',
        choices: [{ label: '[Mark and leave.]', tone: 'DETERMINATION', nextId: 'sq2_1_d3_mark' }],
      },
      {
        id: 'sq2_1_d3_mark',
        speaker: 'Inner Voice',
        text: '[You record the exact location, the thermal trace pattern, the approach vectors. The Winter watches — temperature-neutral now, neither hostile nor helpful. A season that has done what it could. You carry the thermal map back to Kylie. She spreads it on the floor and stares at it for a long time before speaking.]',
        tone: 'DETERMINATION',
        choices: [{ label: '[Wait for Kylie\'s read.]', tone: 'DETERMINATION', nextId: 'sq2_1_d4_kylie_read' }],
      },
      {
        id: 'sq2_1_d4_kylie_read',
        speaker: 'Kylie',
        text: 'This entrance. I know where it leads from the other side. [She looks up.] It connects to a corridor that should only be accessible to someone with a specific kind of channel architecture. The same architecture as the lock. The architect built their own access route into this chamber before the Severing. They weren\'t improvising. They prepared this for you specifically and in advance.',
        tone: 'FEAR',
        isEnd: true,
        rewardUnlocked: 'tactical_knowledge_approach_map',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 2 — "Kylie's Other Student"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq2_2_kylie_other_student',
    title: 'Kylie\'s Other Student',
    level: 7,
    npcId: 'kylie',
    connectedMainQuest: 'mq2_2_kylie_first',
    narrativeSetup: `
      You find a second training stone in Kylie's workspace that you haven't seen before.
      It's older than the one she uses with you — worn smooth by longer use.
      When you ask about it, Kylie goes very still.
      She says: "That belonged to someone I trained before you.
      Someone the same mechanism was used on. They recovered to forty percent
      and stayed there. They stopped coming to sessions."
      She says it like a fact. But her hands stop moving while she says it.
    `,
    objectives: [
      { step: 1, text: 'Ask Kylie about the other student' },
      { step: 2, text: 'Find the other student\'s training record in the corridor archive' },
      { step: 3, text: 'Understand what made their case different from yours' },
      { step: 4, text: 'Return to Kylie with what you learned — and what you think it means' },
    ],
    reward: {
      type: 'mentor_bond',
      name: 'Kylie\'s Full Investment',
      description: 'Kylie now shares everything she knows without strategic omission. Training sessions have a permanent +10% effectiveness bonus.',
      xp: 160,
      points: 3,
    },
    dialogue: [
      {
        id: 'sq2_2_d1_stone',
        speaker: 'You',
        text: 'The other stone. Who did it belong to?',
        tone: 'CURIOSITY',
        choices: [
          { label: '[Wait for the answer.]', tone: 'DETERMINATION', nextId: 'sq2_2_d2_kylie_pause' },
        ],
      },
      {
        id: 'sq2_2_d2_kylie_pause',
        speaker: 'Kylie',
        text: 'Someone I failed. [She moves on immediately.] His name was Dren. Same mechanism, same lock profile. Two years before you. I got him to forty percent. He said it was enough. He stopped coming. Six months later the bypass degraded — when you don\'t maintain it, it narrows. He\'s at fifteen percent now. Functional but diminished.',
        tone: 'GRIEF',
        choices: [
          { label: 'You didn\'t fail him. He stopped coming.', tone: 'RESOLVE', nextId: 'sq2_2_d3_kylie_respond' },
          { label: 'Why didn\'t you go find him when the bypass degraded?', tone: 'CONFUSION', nextId: 'sq2_2_d3_why_no_find' },
          { label: 'Where is he now?', tone: 'CURIOSITY', nextId: 'sq2_2_d3_where' },
        ],
      },
      {
        id: 'sq2_2_d3_kylie_respond',
        speaker: 'Kylie',
        text: 'He stopped coming because I let him believe forty percent was sustainable without maintenance. I simplified the truth because I thought he needed hope more than accuracy. I was wrong. That\'s on me.',
        tone: 'GRIEF',
        choices: [
          { label: 'You\'ve been more accurate with me from the start.', tone: 'RESOLVE', nextId: 'sq2_2_d4_record' },
        ],
      },
      {
        id: 'sq2_2_d3_why_no_find',
        speaker: 'Kylie',
        text: 'I did. Three times. He wouldn\'t open the door. I don\'t know if that was his choice or the degraded channel affecting his judgment. That uncertainty has been with me for eight months.',
        tone: 'GRIEF',
        choices: [{ label: '[Go find the training record.]', tone: 'DETERMINATION', nextId: 'sq2_2_d4_record' }],
      },
      {
        id: 'sq2_2_d3_where',
        speaker: 'Kylie',
        text: 'Still here. Three corridors east. He doesn\'t train. He moves through his day at fifteen percent function and calls it adaptation. [pause] It\'s not adaptation. It\'s accepted limitation.',
        tone: 'GRIEF',
        choices: [{ label: '[Find the training record.]', tone: 'DETERMINATION', nextId: 'sq2_2_d4_record' }],
      },
      {
        id: 'sq2_2_d4_record',
        speaker: 'Inner Voice',
        text: '[The corridor archive holds Dren\'s record: training logs that show rapid early progress, then a plateau, then increasing gaps between sessions, then nothing. The final entry, in Kylie\'s handwriting: "Discontinued. Student reports adequate function. Note: forty percent is not adequate function. It is survivable. I should have said so. — K." The date is eight months ago. The note was written for herself, not the record.]',
        tone: 'GRIEF',
        choices: [
          { label: '[Return to Kylie with the record.]', tone: 'DETERMINATION', nextId: 'sq2_2_d5_return' },
        ],
      },
      {
        id: 'sq2_2_d5_return',
        speaker: 'Kylie',
        text: '[She reads the final note she wrote. Looks at you.] I wrote that for whoever came next. I wrote it so I\'d remember not to do the same thing twice.',
        tone: 'GRIEF',
        choices: [
          { label: 'It worked. You haven\'t done it twice.', tone: 'RESOLVE', nextId: 'sq2_2_d6_bond' },
          { label: 'What would it take to bring Dren back?', tone: 'DETERMINATION', nextId: 'sq2_2_d6_dren' },
        ],
      },
      {
        id: 'sq2_2_d6_dren',
        speaker: 'Kylie',
        text: 'The same technique. The stone, the bypass, the key — but slower. Fifteen percent recovery to sixty would take longer than you and me put together. [pause] Ask me again after Arc 3. If we identify the architect, we might be able to unlock him from the source. That changes everything.',
        tone: 'DETERMINATION',
        isEnd: true,
        rewardUnlocked: 'mentor_bond_kylie_full_investment',
      },
      {
        id: 'sq2_2_d6_bond',
        speaker: 'Kylie',
        text: '[She is quiet for a moment. Then she puts the record down and picks up the worn stone.] I\'m going to tell you something I didn\'t tell Dren until it was too late: you can go all the way back. Full function. I\'ve never seen it happen, but I believe it\'s possible. I\'m saying it now because I think you need to hear it, and because I\'m done strategically withholding hope.',
        tone: 'RESOLVE',
        isEnd: true,
        rewardUnlocked: 'mentor_bond_kylie_full_investment',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 3 — "Echo Pain"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq2_3_echo_pain',
    title: 'Echo Pain',
    level: 7,
    npcId: 'echo_self',
    connectedMainQuest: 'mq2_1_hands_stopped',
    narrativeSetup: `
      The Echo chamber from the first sub-quest can be revisited.
      You didn't take everything it had to offer the first time —
      you were focused on the fragment of the moment before.
      There is a second layer: the moment during.
      The specific experience of function disappearing in real time.
      Memory fragments of this kind are painful — the Echo version of you
      knows this and has been waiting to be asked, not waiting to offer.
      You have to choose to go back in.
    `,
    objectives: [
      { step: 1, text: 'Return to the Echo chamber' },
      { step: 2, text: 'Request the during-moment fragment from your Past Self' },
      { step: 3, text: 'Survive the pain memory without dissociating from it' },
      { step: 4, text: 'Extract the specific sensation of the lock closing — identify its frequency' },
    ],
    reward: {
      type: 'frequency_data',
      name: 'The Lock\'s Signature',
      description: 'The exact frequency of the closing mechanism. Kylie can use this to narrow the key construction. Key insertion time reduced by 40%.',
      xp: 175,
      points: 3,
    },
    dialogue: [
      {
        id: 'sq2_3_d1_return',
        speaker: 'Echo (Past Self)',
        text: 'You came back. [It is a statement, not a question.] You want the during-moment.',
        tone: 'GRIEF',
        choices: [
          { label: 'Yes. I need the frequency of the close.', tone: 'DETERMINATION', nextId: 'sq2_3_d2_warning' },
          { label: 'I want to understand what happened from the inside.', tone: 'GRIEF', nextId: 'sq2_3_d2_warning' },
        ],
      },
      {
        id: 'sq2_3_d2_warning',
        speaker: 'Echo (Past Self)',
        text: 'I\'ll give it to you. But I need you to understand: this memory hurts in a specific way. Not physical pain — though there\'s that too. The hurt of a capability disappearing while you\'re using it. It\'s the loss happening in real time. You felt it once. You\'re choosing to feel it again.',
        tone: 'GRIEF',
        choices: [
          { label: 'I know. I\'m ready.', tone: 'DETERMINATION', nextId: 'sq2_3_d3_memory' },
          { label: 'Is there any way to get the frequency without the pain?', tone: 'DOUBT', nextId: 'sq2_3_d2b_shortcut' },
        ],
      },
      {
        id: 'sq2_3_d2b_shortcut',
        speaker: 'Echo (Past Self)',
        text: 'No. The frequency is encoded in the sensation. They\'re the same thing. The lock closed against active resistance — that resistance is what makes the frequency detectable. To read it, you have to feel it.',
        tone: 'DETERMINATION',
        choices: [{ label: 'Then let\'s do it.', tone: 'DETERMINATION', nextId: 'sq2_3_d3_memory' }],
      },
      {
        id: 'sq2_3_d3_memory',
        speaker: 'Echo (Past Self)',
        text: '[The fragment arrives. The during-moment. You feel it: full function, then a narrowing — like a fist closing slowly around something you were reaching through. The narrowing has a rhythm. You were fighting it when it happened, which means the fight is in the memory too. Your own resistance is encoded alongside the closing mechanism. They are intertwined. The frequency of the lock and the frequency of your resistance are measurably different — and in that difference is the key.]',
        tone: 'PAIN',
        mechanic: 'memory_echo',
        choices: [
          { label: '[Hold through the pain. Identify the lock frequency.]', tone: 'DETERMINATION', nextId: 'sq2_3_d4_identify' },
          { label: '[Pull out. It\'s too much.]', tone: 'FEAR', nextId: 'sq2_3_d4_pull_back' },
        ],
      },
      {
        id: 'sq2_3_d4_pull_back',
        speaker: 'Echo (Past Self)',
        text: 'It\'s okay. You can try again. The memory doesn\'t expire. [pause] But for what it\'s worth — you were closer than you think.',
        tone: 'GRIEF',
        choices: [{ label: '[Try again. Hold longer.]', tone: 'DETERMINATION', nextId: 'sq2_3_d4_identify' }],
      },
      {
        id: 'sq2_3_d4_identify',
        speaker: 'Inner Voice',
        text: '[You hold. The pain is real — the specific grief of a thing you knew how to do, being taken while you were doing it. You hold through it. And in the holding: the frequency becomes separable. Clear. A signature distinct from your own resistance. You have it. The lock\'s exact resonance. The key was already partially built. Now it can be built exactly.]',
        tone: 'DETERMINATION',
        isEnd: true,
        rewardUnlocked: 'frequency_data_lock_signature',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 4 — "False Recovery"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq2_4_false_recovery',
    title: 'False Recovery',
    level: 8,
    npcId: 'voice_of_nothing',
    connectedMainQuest: 'mq2_3_silent_observer',
    narrativeSetup: `
      Three days after your first training session with Kylie, you wake up with full function.
      Not the bypass — actual function. The channel is open. The lock is gone.
      Everything works. Better than before, even.
      For two hours, you are whole.
      Then it closes again. More completely than before.
      And in the seconds before it closes, you feel it: the same breathing from Arc 1.
      The Sniffing Presence. It was the one who opened the channel —
      not to restore you. To see what you would do with it.
      And now it has taken more than the original lock closed.
      You need to recover what the false restoration took.
    `,
    objectives: [
      { step: 1, text: 'Document exactly what function you had during the false recovery window' },
      { step: 2, text: 'Identify the Presence\'s fingerprint in the false restoration' },
      { step: 3, text: 'Resist the increased closure without the bypass — use only environmental contact' },
      { step: 4, text: 'Report to Kylie: the Presence and the architect may be connected' },
    ],
    reward: {
      type: 'presence_awareness',
      name: 'False Signal Detection',
      description: 'You can now identify when a restoration is genuine vs Presence-offered. Prevents future false recovery traps. Resistance to Presence manipulation +25%.',
      xp: 240,
      points: 5,
    },
    dialogue: [
      {
        id: 'sq2_4_d1_false_open',
        speaker: 'Inner Voice',
        text: '[Full function. The channel is open — completely, cleanly. You test it. Everything responds. For the first time since the Severing: wholeness. You allow yourself, briefly, to feel it. The specific relief of being unbroken. Then you remember: you didn\'t do anything to cause this. Kylie isn\'t here. Nothing changed. It just... opened.]',
        tone: 'DOUBT',
        choices: [
          { label: '[Enjoy it. Use it. Test its limits.]', tone: 'FRUSTRATION', nextId: 'sq2_4_d2_use' },
          { label: '[Be suspicious. Document what\'s open without using it yet.]', tone: 'DETERMINATION', nextId: 'sq2_4_d2_document' },
          { label: '[Look for the source of the opening immediately.]', tone: 'FEAR', nextId: 'sq2_4_d2_source' },
        ],
      },
      {
        id: 'sq2_4_d2_use',
        speaker: 'Inner Voice',
        text: '[You use it. For ninety minutes, everything works — more than works. Enhanced. The Presence\'s opening added something to the channel, or the relief of full function makes it feel enhanced. By the time the ninety minutes ends and the channel slams closed again — harder than before — you\'ve given it ninety minutes of data about what you do with full function. You\'ve shown it everything.]',
        tone: 'GRIEF',
        mechanic: 'ability_locked',
        choices: [
          { label: '[Accept what it cost. Use the information you have.]', tone: 'DETERMINATION', nextId: 'sq2_4_d3_aftermath' },
        ],
      },
      {
        id: 'sq2_4_d2_document',
        speaker: 'Inner Voice',
        text: '[You document without using. The architecture of the open channel — how wide, which pathways restored, in what sequence. After forty minutes the channel begins to close — more slowly, because you\'re not generating the activity that would accelerate the data collection. You get out ahead of the closing and document the Presence\'s signature as it withdraws. You\'ve given it little. You\'ve taken more.]',
        tone: 'DETERMINATION',
        choices: [{ label: '[Report to Kylie.]', tone: 'RESOLVE', nextId: 'sq2_4_d4_kylie' }],
      },
      {
        id: 'sq2_4_d2_source',
        speaker: 'Inner Voice',
        text: '[In the seconds before the opening fully seats, you find it: a presence in the room. Warm. Close. The specific warmth you identified in Arc 1 — animal, metabolic, not human. It opened the channel the way a locksmith opens a lock — from the outside, to study the mechanism. You feel its attention on the open channel, cataloguing, reading. And then: it closes it. Harder than it was before. And withdraws.]',
        tone: 'FEAR',
        choices: [
          { label: '[Don\'t react. Let it think you didn\'t notice.]', tone: 'DETERMINATION', nextId: 'sq2_4_d3_aftermath' },
        ],
      },
      {
        id: 'sq2_4_d3_aftermath',
        speaker: 'Inner Voice',
        text: '[The new closure is twenty percent tighter than the original lock. Twenty percent is significant. The bypass will be harder to maintain. Kylie needs to know — both that the Presence accessed the mechanism and that its access point is different from the architect\'s. They entered from different directions. Two entities. Two interests. Possibly connected. Possibly competing.]',
        tone: 'FEAR',
        choices: [{ label: '[Get to Kylie. Now.]', tone: 'DETERMINATION', nextId: 'sq2_4_d4_kylie' }],
      },
      {
        id: 'sq2_4_d4_kylie',
        speaker: 'Kylie',
        text: '[She listens without interrupting. When you finish, she is very still.] Two entry points. The architect locked you. The Presence borrowed the channel to study it. They may not be working together — if they were, the Presence would have known the mechanism was already there and wouldn\'t need to investigate. Which means you have two separate entities, two separate interests, and one channel caught between them. [pause] That\'s either worse than we thought or — potentially — better. Two competing forces means they might work against each other.',
        tone: 'DETERMINATION',
        isEnd: true,
        rewardUnlocked: 'presence_awareness_false_signal_detection',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 5 — "Skadi Watches the Severing"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq2_5_skadi_watches',
    title: 'Skadi Watches the Severing',
    level: 9,
    npcId: 'skadi_mark',
    connectedMainQuest: 'mq2_5_return_of_function',
    narrativeSetup: `
      Before Arc 2 closes, Skadi's marks multiply.
      They appear near the mechanism's original location, near Kylie's training room,
      and one — inexplicably — inside the Echo chamber where your Past Self waits.
      The final mark is different from the others. Longer. More complex.
      When you find it and read it, you understand: Skadi was watching the Severing
      in real time. She saw the architect. She knows the name.
      She is deciding whether to give it to you — and more importantly,
      she is deciding how.
    `,
    objectives: [
      { step: 1, text: 'Find and read all four marks left by Skadi during Arc 2' },
      { step: 2, text: 'Piece together her account of the Severing from the marks in sequence' },
      { step: 3, text: 'Respond to the final mark — she is asking a question' },
      { step: 4, text: 'Receive the partial reveal: the architect\'s nature, not yet their name' },
    ],
    reward: {
      type: 'arc3_key',
      name: 'The Shape of the Architect',
      description: 'You know what the architect is, if not who. This knowledge changes how you approach Arc 3. Counter-measure resistance permanently increased.',
      xp: 320,
      points: 6,
    },
    dialogue: [
      {
        id: 'sq2_5_d1_marks',
        speaker: 'Inner Voice',
        text: '[Four marks. Reading them in sequence — chronological, by placement — they form a sentence that spans the entire arc. Mark one, near the mechanism: "The architect arrived first." Mark two, near the training room: "The architect watched Kylie work and adjusted the lock accordingly." Mark three, in the Echo chamber: "The architect heard the frequency you extracted." Mark four, at the mechanism\'s original location, the longest: "The architect is not the Presence and not a person. The question I need answered before I give you the name: does that change whether you want to find them?"]',
        tone: 'CURIOSITY',
        choices: [
          { label: '[Write a response: Yes. I want to find them regardless of what they are.]', tone: 'DETERMINATION', nextId: 'sq2_5_d2_yes' },
          { label: '[Write a response: I need to know what they are first.]', tone: 'DOUBT', nextId: 'sq2_5_d2_need_to_know' },
          { label: '[Write a response: What they are might change my approach. Not whether I find them.]', tone: 'RESOLVE', nextId: 'sq2_5_d2_approach' },
        ],
      },
      {
        id: 'sq2_5_d2_yes',
        speaker: 'Skadi (The Mark)',
        text: '[A new mark appears beside your response, immediately. As if she was waiting.] Good. Simple. The name is not a person\'s name. It\'s a function. The architect operates through permission systems — they can only close channels that have been opened to them at some point. Which means at some point, your channel was willingly accessed by something. Think about when that was. Arc 3 begins there.',
        tone: 'DETERMINATION',
        isEnd: true,
        rewardUnlocked: 'arc3_key_shape_of_architect',
      },
      {
        id: 'sq2_5_d2_need_to_know',
        speaker: 'Skadi (The Mark)',
        text: '[The new mark:] That\'s the careful answer. I respect it. Here\'s what it is: not human. Not the Presence. Something that operates in the space between what you willingly allow and what happens as a result of that allowance. A consequence-entity. It doesn\'t force. It uses permission you gave without knowing you gave it. The name in Arc 3 is the name of that permission. Find when you gave it.',
        tone: 'FEAR',
        isEnd: true,
        rewardUnlocked: 'arc3_key_shape_of_architect',
      },
      {
        id: 'sq2_5_d2_approach',
        speaker: 'Skadi (The Mark)',
        text: '[The new mark:] That\'s the right distinction. What it is: a system. Not a will — a consequence of accumulated permission. Which means your approach in Arc 3 is not combat and not resistance. It\'s understanding what you permitted. Then deciding whether to rescind it. I\'ll have the name ready when you\'ve found the original permission. You\'ll know when you\'ve found it — it will feel like recognition, not discovery.',
        tone: 'RESOLVE',
        isEnd: true,
        rewardUnlocked: 'arc3_key_shape_of_architect',
      },
    ],
  },
];

// ── COMBINED EXPORT ──────────────────────────────────────────────────────────
export const ALL_ARC2_QUESTS = [
  ...MAIN_QUEST_CHAIN_2.subQuests.map(sq => ({
    ...sq,
    questType: 'main',
    chain: 'mq_arc2',
    chainTitle: MAIN_QUEST_CHAIN_2.title,
  })),
  ...ARC2_SIDE_QUESTS.map(sq => ({
    ...sq,
    questType: 'side',
  })),
];

export function getArc2QuestsForLevel(playerLevel) {
  return ALL_ARC2_QUESTS.filter(q => q.level <= playerLevel);
}

export function getArc2DialogueNode(questId, nodeId) {
  const quest = ALL_ARC2_QUESTS.find(q => q.id === questId);
  if (!quest?.dialogue) return null;
  return quest.dialogue.find(d => d.id === nodeId) || null;
}