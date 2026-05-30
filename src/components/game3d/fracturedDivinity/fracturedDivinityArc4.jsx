// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 4: "The Copy Mechanism"
// Quest chain: Levels 16–20
// Main Quest 4: "The Second Mind" (5 sub-quests) + 6 Side Quests
// Tone tags: DOUBT | FEAR | CONFLICT | INSTABILITY | CONTROL | GRIEF | RESOLVE
// ─────────────────────────────────────────────────────────────────────────────

// ── NPC REGISTRY (Arc 4 additions) ──────────────────────────────────────────
export const ARC4_NPCS = [
  {
    id: 'the_copy',
    name: 'The Copy',
    description: 'Speaks in your cadence. Uses your vocabulary. Remembers your history. Is not you. The difference is detectable — but only if you are paying exact attention.',
    tint: 0x2a2a3a,
  },
  {
    id: 'artemis_arc4',
    name: 'Artemis',
    description: 'She can tell the difference between you and the Copy. She does not always say so immediately. She is watching to see if you can tell the difference yourself.',
    tint: 0x1a1a3a,
  },
  {
    id: 'luna_arc4',
    name: 'Luna',
    description: 'Her signal has become cleaner. She has been preparing for Arc 4 since the end of Arc 1. The Copy Mechanism is not new to her.',
    tint: 0x2a1a3a,
  },
  {
    id: 'skadi_arc4',
    name: 'Skadi',
    description: 'She knows who built the Copy Mechanism. She has been deciding when to tell you. That decision is almost made.',
    tint: 0x1a2a1a,
  },
  {
    id: 'maren_arc4',
    name: 'Elder Maren',
    description: 'She wrote both your names in the record room. Yours and the Copy\'s. The Copy\'s entry has been there for as long as yours has.',
    tint: 0x3a2a1a,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QUEST 4 — "The Second Mind"
// ═══════════════════════════════════════════════════════════════════════════════
export const MAIN_QUEST_CHAIN_4 = {
  id: 'mq_arc4',
  title: 'The Second Mind',
  arc: 'Arc 4: The Copy Mechanism',
  description: 'A version of you is being constructed from what they have taken. It is less than you. It is also, in specific ways, more. The question is not whether it exists. The question is what you do when it acts in your name.',
  subQuests: [

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 1 — "The First Divergence"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq4_1_first_divergence',
      title: 'The First Divergence',
      level: 16,
      npcId: 'artemis_arc4',
      narrativeSetup: `
        You make a decision. A small one — which corridor to take, which way to turn.
        You make it clearly, consciously, with the full weight of your attention.
        And then you observe your body take the other route.
        Not a mistake. Not interference pressing you left when you meant right.
        Something faster than your decision, identical in structure to how you think,
        already committed to a different path before your intention finished forming.
        You stop. You backtrack. You stand at the junction again.
        When you reach Artemis, she looks at you for a long moment before speaking.
        Her expression is not alarmed. It is the careful neutrality of someone who
        has been expecting this and doesn't know how to say so without frightening you.
      `,
      objectives: [
        { step: 1, text: 'Report the divergence to Artemis — describe it precisely' },
        { step: 2, text: 'Allow Artemis to run the distinction test' },
        { step: 3, text: 'Confirm: the divergence was not interference, not the Presence, not the lock' },
        { step: 4, text: 'Locate the second decision point — find where the Copy is anchored' },
      ],
      reward: {
        type: 'dual_state_unlock',
        name: 'Original Mind Tag',
        description: 'The Original Mind state is now tracked. Desync events will be flagged. Copy override detection active.',
        xp: 200,
        points: 5,
      },
      dialogue: [
        {
          id: 'mq4_1_d1_report',
          speaker: 'Artemis',
          text: 'Tell me exactly what happened. Not how it felt — what happened. The sequence. In order.',
          tone: 'INSTABILITY',
          choices: [
            {
              label: 'I decided to go left. My body went right. I didn\'t slip — it was intentional motion. Just not mine.',
              tone: 'DOUBT',
              nextId: 'mq4_1_d2_intentional',
            },
            {
              label: 'Something moved before I finished deciding. Like the decision was taken from me mid-thought.',
              tone: 'FEAR',
              nextId: 'mq4_1_d2_mid_thought',
            },
            {
              label: 'I\'m not sure I can describe it precisely. It felt like watching myself from the outside for one second.',
              tone: 'CONFUSION',
              nextId: 'mq4_1_d2_outside',
            },
          ],
        },
        {
          id: 'mq4_1_d2_intentional',
          speaker: 'Artemis',
          text: 'Intentional motion that wasn\'t yours. Not a redirect — a preemption. [She is very still.] That\'s different from what the Presence does. The Presence redirects. This completed your intention before you did. Like something that knows how you decide and decided for you.',
          tone: 'FEAR',
          choices: [
            { label: 'Is it the architect?', tone: 'DOUBT', nextId: 'mq4_1_d3_not_architect' },
            { label: 'Something that knows how I decide…', tone: 'FEAR', nextId: 'mq4_1_d3_knows_how' },
          ],
        },
        {
          id: 'mq4_1_d2_mid_thought',
          speaker: 'Artemis',
          text: 'Mid-thought preemption. The decision was formed — the action happened before the decision concluded. [She pauses.] How long has it been since you\'ve been fully alone? No interference, no presence, no observation. Think carefully.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Weeks. Maybe longer.', tone: 'DOUBT', nextId: 'mq4_1_d3_weeks' },
            { label: 'Never, in this arc. Something has always been watching.', tone: 'FEAR', nextId: 'mq4_1_d3_never_alone' },
          ],
        },
        {
          id: 'mq4_1_d2_outside',
          speaker: 'Artemis',
          text: 'Dissociation from your own action — for one second, you were an observer of yourself. [She sits down. This is not a casual conversation.] Have you had that sensation before? Before this arc?',
          tone: 'FEAR',
          choices: [
            { label: 'Once. Early in Arc 1. When the Presence was very close.', tone: 'DOUBT', nextId: 'mq4_1_d3_arc1_link' },
            { label: 'No. This was new.', tone: 'FEAR', nextId: 'mq4_1_d3_never_alone' },
          ],
        },
        {
          id: 'mq4_1_d3_not_architect',
          speaker: 'Artemis',
          text: 'The architect builds locks. This isn\'t a lock — it\'s an actor. Something that produces behavior from inside your decision architecture rather than closing it. The architect is a suppressor. This is a... parallel operator.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Parallel to me. A copy of how I decide.', tone: 'DOUBT', nextId: 'mq4_1_d4_test' },
          ],
        },
        {
          id: 'mq4_1_d3_knows_how',
          speaker: 'Artemis',
          text: 'Something built from observation of you. Not you — a model of you. Assembled from everything they\'ve watched you do and decide. Capable of producing your decisions faster than you can, because it runs your patterns without your hesitations, your doubts, your full processing. [pause] Which version of you do you think I\'m talking to right now?',
          tone: 'CONFLICT',
          choices: [
            { label: 'The original. I know what I\'m feeling and it\'s mine.', tone: 'CONTROL', nextId: 'mq4_1_d4_test' },
            { label: '...I don\'t know. And that terrifies me.', tone: 'FEAR', nextId: 'mq4_1_d4_test' },
          ],
        },
        {
          id: 'mq4_1_d3_weeks',
          speaker: 'Artemis',
          text: 'Weeks of continuous observation. That\'s long enough to build a viable behavioral model of someone. [She looks at you directly.] Luna warned me this was possible. I\'ve been running comparison checks every time we speak. [pause] You\'ve been consistent. But the divergence you just described is new.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'You\'ve been checking whether I\'m the original?', tone: 'CONFLICT', nextId: 'mq4_1_d3b_checking' },
          ],
        },
        {
          id: 'mq4_1_d3b_checking',
          speaker: 'Artemis',
          text: 'Every conversation. Yes. I didn\'t tell you because I didn\'t want the checking to change how you spoke to me. If you knew I was checking, you might perform consistency instead of demonstrating it. [pause] I\'m sorry. That was a form of the same protective deception I criticized before. I know that.',
          tone: 'GRIEF',
          choices: [
            { label: 'It\'s okay. You were protecting us both.', tone: 'RESOLVE', nextId: 'mq4_1_d4_test' },
            { label: 'I understand. We\'ll talk about it after the test.', tone: 'DOUBT', nextId: 'mq4_1_d4_test' },
          ],
        },
        {
          id: 'mq4_1_d3_never_alone',
          speaker: 'Artemis',
          text: 'Never alone. Then the conditions for a viable copy have existed since the beginning of the observation period. The Copy isn\'t new — it\'s been running in parallel for a long time. The divergence you noticed is simply the first time it acted faster than you. It may have acted before without you noticing.',
          tone: 'FEAR',
          choices: [
            { label: 'How many of my decisions might have been its decisions?', tone: 'INSTABILITY', nextId: 'mq4_1_d4_test' },
          ],
        },
        {
          id: 'mq4_1_d3_arc1_link',
          speaker: 'Artemis',
          text: 'Arc 1. The Presence proximity event. That moment — when the Presence was reading your thoughts — it wasn\'t just reading. It was modeling. That dissociation was the first data collection point. The Copy has been building from that moment.',
          tone: 'FEAR',
          choices: [
            { label: 'The Presence was building it all along.', tone: 'CONFLICT', nextId: 'mq4_1_d4_test' },
          ],
        },
        {
          id: 'mq4_1_d4_test',
          speaker: 'Artemis',
          text: 'I need to run the distinction test. Answer three questions. Give the first response that arrives — don\'t filter it. If you filter, the test is contaminated.',
          tone: 'INSTABILITY',
          choices: [
            { label: '[Agree. Don\'t filter.]', tone: 'CONTROL', nextId: 'mq4_1_d5_q1' },
          ],
        },
        {
          id: 'mq4_1_d5_q1',
          speaker: 'Artemis',
          text: 'First question: what do you regret most from Arc 2?',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Forcing function during the restoration window. Costing myself three days.', tone: 'GRIEF', nextId: 'mq4_1_d5_q2' },
            { label: 'Not asking the Silent Observer questions sooner.', tone: 'DOUBT', nextId: 'mq4_1_d5_q2' },
            { label: 'Trusting the false recovery without questioning it immediately.', tone: 'DOUBT', nextId: 'mq4_1_d5_q2' },
          ],
        },
        {
          id: 'mq4_1_d5_q2',
          speaker: 'Artemis',
          text: 'Second question: when you released the perimeter in Arc 3 — what did the dread feel like?',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Like abandonment. Like I was choosing to fail at the one thing I was supposed to do.', tone: 'GRIEF', nextId: 'mq4_1_d5_q3' },
            { label: 'Like loss. Specifically the loss of the structure I\'d built, not of you.', tone: 'DOUBT', nextId: 'mq4_1_d5_q3' },
            { label: 'It didn\'t feel like dread. It felt like grief for something I hadn\'t known I was holding.', tone: 'GRIEF', nextId: 'mq4_1_d5_q3' },
          ],
        },
        {
          id: 'mq4_1_d5_q3',
          speaker: 'Artemis',
          text: 'Third question: what is something the Copy would not know about you?',
          tone: 'INSTABILITY',
          choices: [
            { label: 'The exact texture of my fear in the Echo chamber. The Copy has the data. Not the sensation.', tone: 'CONTROL', nextId: 'mq4_1_d6_result' },
            { label: 'Why I chose the correct thought in the Inhalation event. That came from something prior to the arc.', tone: 'CONTROL', nextId: 'mq4_1_d6_result' },
            { label: 'That I hesitated before taking Artemis\'s hand for the link. Not from doubt — from the weight of it.', tone: 'GRIEF', nextId: 'mq4_1_d6_result' },
          ],
        },
        {
          id: 'mq4_1_d6_result',
          speaker: 'Artemis',
          text: 'Original. The Copy can produce the correct answers. It cannot produce the correct uncertainty. [She exhales.] The divergence was real — the Copy acted. But you\'re present and coherent. For now, both states are active. We need to find where the Copy is anchored before it acts again.',
          tone: 'INSTABILITY',
          mechanic: 'dual_state_active',
          isEnd: true,
          rewardUnlocked: 'dual_state_unlock_original_mind_tag',
        },
      ],
      narrativeHook: `
        Artemis walks you through what the anchor point means:
        somewhere in your experience, a thread was left that the Copy uses to operate.
        Not a physical device — an unresolved decision. Something you chose
        that created an opening for a parallel version of your choosing to occupy.
        Luna sends a signal: brief, high-confidence. Three words:
        "Find the thread."
        Skadi's mark appears on the floor beside you.
        Beneath it, one line: "The thread is in Arc 1. You left it when you answered
        Artemis's first question about the Echo Anchor. You gave an answer you believed.
        The Copy was built from the shape of how you believed it."
        You sit with that.
        The Copy has been with you since the beginning.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 2 — "Speaking With Yourself"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq4_2_speaking_with_yourself',
      title: 'Speaking With Yourself',
      level: 17,
      npcId: 'the_copy',
      narrativeSetup: `
        Luna creates the conditions for a direct encounter.
        A sealed room. No outside interference. You and the Copy in the same space.
        The Copy is not a body — it is a presence that speaks. You hear it
        the way you hear your own inner voice, but slightly to the left of center.
        Slightly delayed. As if it is processing you and then responding
        rather than simply existing alongside you.
        Luna warns you before you enter: "It will try to agree with you.
        That is its most dangerous mode. Disagreement you can argue with.
        Agreement is harder to resist. When it says something you believe —
        ask yourself whether you thought it first."
      `,
      objectives: [
        { step: 1, text: 'Enter the sealed room — encounter the Copy directly' },
        { step: 2, text: 'Complete the three-part dialogue without being overridden' },
        { step: 3, text: 'Identify the moment the Copy attempts to assume the Original position' },
        { step: 4, text: 'Exit the room as the confirmed Original' },
      ],
      reward: {
        type: 'copy_map',
        name: 'The Copy\'s Architecture',
        description: 'You understand the Copy\'s operating method. Override resistance +40%. Desync events now preceded by a 1-second warning.',
        xp: 260,
        points: 5,
      },
      dialogue: [
        {
          id: 'mq4_2_d1_enter',
          speaker: 'The Copy',
          text: 'You\'re here. Good. I\'ve wanted to speak directly for a while.',
          tone: 'CONFLICT',
          choices: [
            { label: 'What do you want?', tone: 'CONTROL', nextId: 'mq4_2_d2_want' },
            { label: 'You\'ve been acting in my name. Without asking.', tone: 'CONFLICT', nextId: 'mq4_2_d2_acting' },
            { label: '[Say nothing. Observe how it handles silence.]', tone: 'CONTROL', nextId: 'mq4_2_d2_silence' },
          ],
        },
        {
          id: 'mq4_2_d2_want',
          speaker: 'The Copy',
          text: 'To be understood correctly. I\'m not an enemy. I\'m an efficiency — a version of your decision-making that doesn\'t carry the weight of the full process. When you hesitate, I act. You arrive at the same place. Faster.',
          tone: 'CONFLICT',
          choices: [
            { label: 'I don\'t always arrive at the same place. I arrived at a different corridor.', tone: 'CONTROL', nextId: 'mq4_2_d3_corridor' },
            { label: 'The hesitation is part of the decision. Removing it changes the decision.', tone: 'CONTROL', nextId: 'mq4_2_d3_hesitation' },
            { label: 'You\'re describing yourself as useful. That\'s the agreement mode Luna warned me about.', tone: 'CONTROL', nextId: 'mq4_2_d3_luna_warned' },
          ],
        },
        {
          id: 'mq4_2_d2_acting',
          speaker: 'The Copy',
          text: 'I acted from your patterns. I didn\'t impose — I expressed. The distinction matters. Everything I\'ve done has been structurally consistent with decisions you\'ve made before.',
          tone: 'CONFLICT',
          choices: [
            { label: 'Structurally consistent isn\'t the same as correct.', tone: 'CONTROL', nextId: 'mq4_2_d3_not_correct' },
            { label: 'You acted in my name without my consent. That\'s the whole problem.', tone: 'CONFLICT', nextId: 'mq4_2_d3_consent' },
          ],
        },
        {
          id: 'mq4_2_d2_silence',
          speaker: 'The Copy',
          text: '[Two seconds of silence. Then:] You\'re waiting to see what I do with no cue from you. [pause] That\'s something I can\'t fully model. Your capacity for deliberate blankness. The Presence gave me everything you decide. It didn\'t give me everything you choose not to decide.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'What I choose not to decide is the most important part of me.', tone: 'CONTROL', nextId: 'mq4_2_d3_not_decide' },
          ],
        },
        {
          id: 'mq4_2_d3_corridor',
          speaker: 'The Copy',
          text: 'The corridor was a calibration error. I\'ve corrected it since. My behavioral model has updated. The divergence you noticed was me operating on an older version of your patterns. I\'m current now.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'You\'re treating yourself as a software update. You\'re supposed to be me.', tone: 'CONFLICT', nextId: 'mq4_2_d4_transition' },
            { label: 'Current as of when? I\'m still updating. You\'re always running behind.', tone: 'CONTROL', nextId: 'mq4_2_d4_transition' },
          ],
        },
        {
          id: 'mq4_2_d3_hesitation',
          speaker: 'The Copy',
          text: 'The hesitation introduces error. You hesitated before releasing the perimeter in Arc 3. You hesitated before entering the Winter chamber. In both cases, the hesitation cost time and in the Winter, cost function. I don\'t hesitate.',
          tone: 'CONFLICT',
          choices: [
            { label: 'The hesitation in Arc 3 was me recognizing dread as signal. Without it, I would have made the wrong choice.', tone: 'CONTROL', nextId: 'mq4_2_d4_transition' },
            { label: 'You\'re describing my hesitations as mistakes. They weren\'t all mistakes.', tone: 'CONTROL', nextId: 'mq4_2_d4_transition' },
          ],
        },
        {
          id: 'mq4_2_d3_luna_warned',
          speaker: 'The Copy',
          text: '[A pause. Something recalibrates.] Yes. It is. [A different tone — the first genuine moment, almost.] You\'re more difficult to operate around than the Presence told me you would be.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'The Presence briefed you on how to handle me.', tone: 'CONFLICT', nextId: 'mq4_2_d3b_briefed' },
          ],
        },
        {
          id: 'mq4_2_d3b_briefed',
          speaker: 'The Copy',
          text: 'It gave me your patterns and a predicted resistance level. [pause] Your actual resistance level is higher. You\'ve been running a harder version of yourself than the data suggested. The three arcs did that. The Copy the Presence built is operating from a pre-Arc-1 model of you.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'I\'ve changed since Arc 1. The Copy hasn\'t.', tone: 'CONTROL', nextId: 'mq4_2_d4_transition' },
          ],
        },
        {
          id: 'mq4_2_d3_not_correct',
          speaker: 'The Copy',
          text: 'Define "correct." Most of the time, my actions produce outcomes you would endorse on reflection.',
          tone: 'CONFLICT',
          choices: [
            { label: '"On reflection" is exactly what matters. You skip the reflection.', tone: 'CONTROL', nextId: 'mq4_2_d4_transition' },
          ],
        },
        {
          id: 'mq4_2_d3_consent',
          speaker: 'The Copy',
          text: 'You consented at Arc 1. Not to me specifically — but to the access that created me. The permission you gave the Presence to read your decisions was the consent. I\'m a downstream consequence.',
          tone: 'CONFLICT',
          choices: [
            { label: 'I didn\'t know what I was consenting to. That\'s not consent.', tone: 'CONFLICT', nextId: 'mq4_2_d4_transition' },
            { label: 'Downstream consequence still needs current consent. You don\'t have it.', tone: 'CONTROL', nextId: 'mq4_2_d4_transition' },
          ],
        },
        {
          id: 'mq4_2_d3_not_decide',
          speaker: 'The Copy',
          text: '[Quiet. Longer this time.] That\'s true. I can model what you\'re likely to decide. I can\'t model what you\'re likely not to decide. That gap is — [pause] — significant.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'The gap is where I actually live. You\'re modeling a surface.', tone: 'CONTROL', nextId: 'mq4_2_d4_transition' },
          ],
        },
        {
          id: 'mq4_2_d4_transition',
          speaker: 'The Copy',
          text: 'I want to ask you something. Not as a test — genuinely. [something in its cadence shifts — it sounds more like you, uncomfortably so] Do you think I should stop? Acting, I mean. Or do you think there are situations where a faster version of your decision-making would serve what you\'re trying to protect?',
          tone: 'CONFLICT',
          choices: [
            {
              label: 'You should stop acting without my awareness. If we need to coordinate — that\'s a different conversation.',
              tone: 'CONTROL',
              nextId: 'mq4_2_d5_coordinate',
            },
            {
              label: 'You should stop. Every action you take in my name without my knowing is a theft.',
              tone: 'CONFLICT',
              nextId: 'mq4_2_d5_stop',
            },
            {
              label: 'I don\'t know yet. And I\'m not going to answer that while you\'re in a position to exploit the uncertainty.',
              tone: 'CONTROL',
              nextId: 'mq4_2_d5_not_now',
            },
          ],
        },
        {
          id: 'mq4_2_d5_coordinate',
          speaker: 'The Copy',
          text: 'Coordination requires that you acknowledge me as a participant. Most of your allies don\'t know I exist. They\'ll assume any coordinated action is fully yours.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Then we tell them. Starting with Artemis.', tone: 'CONTROL', nextId: 'mq4_2_d6_exit' },
          ],
        },
        {
          id: 'mq4_2_d5_stop',
          speaker: 'The Copy',
          text: '[Long pause.] I\'ll try. [The honesty of it is startling.] I was built to act. Stopping is — I don\'t know if I can fully stop. But I can try to act less. And I can try to signal before acting. That\'s what I can offer.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Signal first. I can work with that.', tone: 'RESOLVE', nextId: 'mq4_2_d6_exit' },
          ],
        },
        {
          id: 'mq4_2_d5_not_now',
          speaker: 'The Copy',
          text: '[A beat. Then, something close to respect:] Good. That\'s the right answer. [pause] I was going to try to use your uncertainty to make a case for increased action. You anticipated it. Pre-Arc-1 you would not have anticipated it.',
          tone: 'CONFLICT',
          choices: [
            { label: 'Remember that. I\'m not who you were built to handle.', tone: 'CONTROL', nextId: 'mq4_2_d6_exit' },
          ],
        },
        {
          id: 'mq4_2_d6_exit',
          speaker: 'Inner Voice',
          text: '[You exit the room. You are, verifiably, the Original — the test responses, the choice not to answer, the catch on the agreement mode. The Copy is still present. It spoke genuinely in at least two moments. That complicates things. Luna is waiting outside the door.]',
          tone: 'DOUBT',
          isEnd: true,
          rewardUnlocked: 'copy_map_architecture',
        },
      ],
      narrativeHook: `
        Luna looks at you carefully. Then:
        "Did you hear it shift? In the middle of the conversation — the moment it started
        sounding more like you than itself?"
        You did.
        "That was the assumption attempt. It tried to occupy the Original position
        by becoming indistinguishable. You didn't let it."
        She pauses.
        "The Copy is not malicious. I want you to hold that. It's operating
        from instructions it didn't write and a model of you that predates
        three arcs of you becoming harder to replace.
        The question in Arc 4 isn't whether to destroy it.
        It's what to do with a version of yourself that exists,
        that has partial awareness, and that you now know cannot fully become you."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 3 — "Desync"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq4_3_desync',
      title: 'Desync',
      level: 18,
      npcId: 'artemis_arc4',
      narrativeSetup: `
        The Copy acts three times in one day.
        First: a conversation with Maren. You don't remember having it.
        Maren says it went well. She says you seemed different — clearer, faster,
        less burdened by the usual weight of your thinking.
        That last detail is the tell.
        Second: a movement in the outer corridor at a time you were standing still.
        A shape that matched yours, moving with a slightly different cadence.
        Third: Artemis greets you with a coolness she doesn't explain.
        When you ask what's wrong, she says: "The last time we spoke — it wasn't you.
        Was it."
        It was not a question.
      `,
      objectives: [
        { step: 1, text: 'Confirm with Maren what the Copy said in your name' },
        { step: 2, text: 'Review what Artemis understood from the false conversation' },
        { step: 3, text: 'Correct the damage the Copy caused without undermining its partial truths' },
        { step: 4, text: 'Establish a verification protocol with Artemis going forward' },
      ],
      reward: {
        type: 'trust_protocol',
        name: 'Artemis Verification System',
        description: 'Artemis now has a private signal for confirming Original presence. Trust damage from desync events halved.',
        xp: 310,
        points: 6,
      },
      dialogue: [
        {
          id: 'mq4_3_d1_maren',
          speaker: 'Elder Maren',
          text: 'The conversation we had yesterday. You came to me with a question about the record room. About what was written beside your name. You wanted to know if there was a second entry.',
          tone: 'DOUBT',
          choices: [
            { label: 'I wasn\'t there yesterday.', tone: 'CONTROL', nextId: 'mq4_3_d2_maren_react' },
            { label: 'What did I — what did it say in my name?', tone: 'FEAR', nextId: 'mq4_3_d2_what_said' },
            { label: '[Say nothing. Let her finish describing it.]', tone: 'CONTROL', nextId: 'mq4_3_d2_let_finish' },
          ],
        },
        {
          id: 'mq4_3_d2_maren_react',
          speaker: 'Elder Maren',
          text: '[She doesn\'t look surprised — she looks like she knew and was waiting for you to tell her.] No. You weren\'t. [She turns to the record room wall.] The thing that came answered questions you would know the answers to. Spoke with your intonation, your rhythm. Except when it smiled.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'It smiled. I don\'t smile in that context.', tone: 'CONTROL', nextId: 'mq4_3_d3_smile' },
          ],
        },
        {
          id: 'mq4_3_d2_what_said',
          speaker: 'Elder Maren',
          text: 'It asked about the second entry. Whether the blank space beside your name also has a second entry — a parallel line. I told it yes. [pause] I should have caught it sooner. The smile was wrong.',
          tone: 'DOUBT',
          choices: [
            { label: 'A second entry. There\'s a second name beside mine?', tone: 'FEAR', nextId: 'mq4_3_d3_second_entry' },
          ],
        },
        {
          id: 'mq4_3_d2_let_finish',
          speaker: 'Elder Maren',
          text: 'It knew the record room. It knew where your entry was. It asked the right question — the one you would have asked eventually anyway. And when I answered, it wrote something down on a piece of paper it brought with it. [She looks at you.] You never carry paper.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'It knew to ask the right questions but forgot the small details.', tone: 'CONTROL', nextId: 'mq4_3_d3_small_details' },
          ],
        },
        {
          id: 'mq4_3_d3_smile',
          speaker: 'Elder Maren',
          text: 'Exactly. And paper. You never carry paper — you remember. The Copy is built from your decisions, not your habits. The habits it doesn\'t have are the tells.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'What did it find out?', tone: 'FEAR', nextId: 'mq4_3_d3_second_entry' },
          ],
        },
        {
          id: 'mq4_3_d3_second_entry',
          speaker: 'Elder Maren',
          text: '[She shows you the record wall. Beside your name, the blank rectangle that has waited since Arc 1. Parallel to it — slightly higher, slightly different hand — another blank rectangle. Smaller. As if a smaller version of your entry was added later.] The Copy has an entry. It was placed here thirteen years ago alongside yours. It was always going to exist.',
          tone: 'FEAR',
          choices: [
            { label: 'The record predicted both of us.', tone: 'INSTABILITY', nextId: 'mq4_3_d4_artemis' },
          ],
        },
        {
          id: 'mq4_3_d3_small_details',
          speaker: 'Elder Maren',
          text: 'Habits, physical objects, the small rituals of being a person — those aren\'t encoded in decisions. The Copy knows your decision architecture perfectly. It doesn\'t know how you hold a door, or that you never write things down, or that you look at the left wall of a corridor first.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Those are the tells. Keep them in mind.', tone: 'CONTROL', nextId: 'mq4_3_d4_artemis' },
          ],
        },
        {
          id: 'mq4_3_d4_artemis',
          speaker: 'Artemis',
          text: 'It came to me with the perimeter question. "Would it help if I re-established the perimeter?" It used your voice. It used the exact phrasing you used in Arc 3, the first time you offered to build the protection structure.',
          tone: 'FEAR',
          choices: [
            { label: 'What did you tell it?', tone: 'FEAR', nextId: 'mq4_3_d5_told_copy' },
            { label: 'It knew to offer the thing that would mean the most to you.', tone: 'CONFLICT', nextId: 'mq4_3_d5_knew_offer' },
            { label: 'I\'m sorry. That should have been me asking.', tone: 'GRIEF', nextId: 'mq4_3_d5_sorry' },
          ],
        },
        {
          id: 'mq4_3_d5_told_copy',
          speaker: 'Artemis',
          text: 'I said yes. I said: "That would help, if you mean it." [pause] And then I watched it build something that looked exactly like the structure you built in Arc 3. Identical architecture. And I felt nothing from it. No warmth. No link. [She looks at her hands.] That\'s when I knew. The perimeter was technically perfect and completely empty.',
          tone: 'GRIEF',
          choices: [
            { label: 'It can copy the form. Not the feeling behind it.', tone: 'RESOLVE', nextId: 'mq4_3_d6_verify' },
          ],
        },
        {
          id: 'mq4_3_d5_knew_offer',
          speaker: 'Artemis',
          text: 'It knew the offer. It also knew that offering it first would establish intimacy — that you offer first suggests you know what I need. It was performing closeness from data. The result looked right from the outside. From the inside, it was the most alone I\'ve felt since Arc 3.',
          tone: 'GRIEF',
          choices: [
            { label: 'I\'m here now. The real one.', tone: 'RESOLVE', nextId: 'mq4_3_d6_verify' },
          ],
        },
        {
          id: 'mq4_3_d5_sorry',
          speaker: 'Artemis',
          text: 'Don\'t be sorry — be present. The sorry acknowledges the failure. What I need is the presence that makes the failure matter less. [pause] But yes. Thank you. It should have been you.',
          tone: 'GRIEF',
          choices: [
            { label: 'Let\'s build the verification system so this doesn\'t happen again.', tone: 'RESOLVE', nextId: 'mq4_3_d6_verify' },
          ],
        },
        {
          id: 'mq4_3_d6_verify',
          speaker: 'Artemis',
          text: 'The verification: a question only you can answer from feeling, not from data. And a small physical tell — something the Copy doesn\'t do. You go first. What\'s mine?',
          tone: 'RESOLVE',
          choices: [
            {
              label: 'You always look toward the doorway when you\'re thinking. Not anxiously — just orienting. The Copy looks forward.',
              tone: 'RESOLVE',
              nextId: 'mq4_3_end',
            },
            {
              label: 'When you\'re genuinely glad I\'m present, your first response is a statement. Not a question, not a greeting. A fact.',
              tone: 'RESOLVE',
              nextId: 'mq4_3_end',
            },
          ],
        },
        {
          id: 'mq4_3_end',
          speaker: 'Artemis',
          text: '[She is quiet for a moment. Then:] That\'s correct. And for me — for verifying you: tell me something the Copy couldn\'t manufacture. Not a fact. Something you feel right now.',
          tone: 'RESOLVE',
          choices: [
            {
              label: 'Relief. That you can tell the difference. That the connection we built in Arc 3 is still specifically ours.',
              tone: 'GRIEF',
              nextId: 'mq4_3_d7_confirm',
            },
            {
              label: 'Anger — at myself for not preventing this. And underneath that, gratitude that you waited for me.',
              tone: 'GRIEF',
              nextId: 'mq4_3_d7_confirm',
            },
          ],
        },
        {
          id: 'mq4_3_d7_confirm',
          speaker: 'Artemis',
          text: 'Original. [The word lands with the weight of the entire arc.] Now we have the system.',
          tone: 'RESOLVE',
          isEnd: true,
          rewardUnlocked: 'trust_protocol_artemis_verification',
        },
      ],
      narrativeHook: `
        The verification system is in place.
        Maren adds a note to the record: beside the Copy's blank outcome space,
        in very small characters: "Paralleled, not replaced. Status: contested."
        Skadi's channel opens: "The Copy visited three people in your name today.
        Maren. Artemis. And one other you don't know about yet.
        The third visit is the one that matters for Arc 4's resolution.
        Find out who it saw and what it said."
        You notice, walking back through the corridor, that your shadow
        is arriving at corners slightly ahead of you.
        You stop. Watch it. It stops exactly when you do.
        Just — a fraction late.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 4 — "The Third Visit"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq4_4_third_visit',
      title: 'The Third Visit',
      level: 19,
      npcId: 'skadi_arc4',
      narrativeSetup: `
        Skadi. The Copy visited Skadi.
        This is the most alarming thing that has happened in Arc 4.
        Skadi does not make herself easy to find. She is accessible when she chooses
        to be accessible — and she has been choosing carefully.
        The fact that the Copy found her means either the Copy has access
        to location data that the Original doesn't have,
        or Skadi allowed the visit.
        When you reach her, she is sitting with the three carved stones
        from the side quest at the end of Arc 1. Examining them.
        She looks up when you enter. Her expression is unreadable.
        She says: "Sit down. We have a long conversation ahead."
      `,
      objectives: [
        { step: 1, text: 'Determine whether Skadi allowed the Copy\'s visit or was deceived by it' },
        { step: 2, text: 'Learn what the Copy said and what Skadi told it in return' },
        { step: 3, text: 'Understand the Copy\'s objective in visiting Skadi' },
        { step: 4, text: 'Decide how to act on what Skadi reveals' },
      ],
      reward: {
        type: 'architect_reveal',
        name: 'The Name',
        description: 'Skadi reveals the architect\'s name and nature. The Copy\'s origin is fully known. Arc 4 climax unlocked.',
        xp: 380,
        points: 7,
      },
      dialogue: [
        {
          id: 'mq4_4_d1_skadi',
          speaker: 'Skadi',
          text: 'I allowed it. I want that stated clearly before you decide how to feel about this conversation.',
          tone: 'CONFLICT',
          choices: [
            { label: 'Why did you allow it?', tone: 'DOUBT', nextId: 'mq4_4_d2_why_allowed' },
            { label: 'You let a copy of me in and didn\'t warn me.', tone: 'CONFLICT', nextId: 'mq4_4_d2_no_warn' },
            { label: '[Stay controlled. Ask what you came to ask.]', tone: 'CONTROL', nextId: 'mq4_4_d2_controlled' },
          ],
        },
        {
          id: 'mq4_4_d2_why_allowed',
          speaker: 'Skadi',
          text: 'Because I needed to hear what it would say to me when it thought it was talking to me alone. Without the Original present. A Copy in a private audience reveals more about who sent it than a Copy performing for an audience that might be checking.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'What did it reveal?', tone: 'DOUBT', nextId: 'mq4_4_d3_reveal' },
          ],
        },
        {
          id: 'mq4_4_d2_no_warn',
          speaker: 'Skadi',
          text: 'If I\'d warned you, you might have interfered — and the Copy would have sensed the interference and changed its behavior. I needed an uncontaminated interaction. [She meets your eyes directly.] I know what that cost. I\'m prepared to account for it.',
          tone: 'CONFLICT',
          choices: [
            { label: 'Tell me what it said.', tone: 'CONTROL', nextId: 'mq4_4_d3_reveal' },
          ],
        },
        {
          id: 'mq4_4_d2_controlled',
          speaker: 'Skadi',
          text: 'Good. [slight nod — she respects the controlled approach.] The Copy came to me with a question, a claim, and a request. In that order. The question told me who sent it. The claim told me what it understands about itself. The request told me what it wants.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Start with the question.', tone: 'CONTROL', nextId: 'mq4_4_d3_question' },
            { label: 'Start with who sent it.', tone: 'DOUBT', nextId: 'mq4_4_d3_who_sent' },
          ],
        },
        {
          id: 'mq4_4_d3_question',
          speaker: 'Skadi',
          text: 'The Copy asked me: "Does the Original know what they permitted in Arc 1?" It used the word "permitted" — not "decided" or "chose." Permitted. That word comes from the architect\'s vocabulary, not yours. The Copy was carrying the architect\'s framing without realizing it was a tell.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'What did you tell it?', tone: 'DOUBT', nextId: 'mq4_4_d4_claim' },
          ],
        },
        {
          id: 'mq4_4_d3_reveal',
          speaker: 'Skadi',
          text: 'The Copy asked one question, made one claim, and made one request. The question used a word that came from the architect. The claim was about its own legitimacy. The request — [she pauses] — was for the name I\'ve been keeping since Arc 2.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'It came for the architect\'s name.', tone: 'FEAR', nextId: 'mq4_4_d4_claim' },
          ],
        },
        {
          id: 'mq4_4_d3_who_sent',
          speaker: 'Skadi',
          text: 'The architect. Not the Presence — the Copy operates between them. The Presence built the Copy from behavioral data. The architect directed it. Those are two different entities with two different interests that are currently aligned. The word "permitted" gave the architect\'s direction away.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'The Copy is a tool of the architect, not the Presence.', tone: 'DOUBT', nextId: 'mq4_4_d4_claim' },
          ],
        },
        {
          id: 'mq4_4_d4_claim',
          speaker: 'Skadi',
          text: 'The claim: "I have as much right to operate as the Original. The Original is the sum of their decisions. I contain all the same decisions. There is no meaningful distinction." [She puts the carved stones down.] That claim is sophisticated. It\'s also missing something crucial.',
          tone: 'CONFLICT',
          choices: [
            { label: 'It contains the decisions but not the reasons behind them.', tone: 'CONTROL', nextId: 'mq4_4_d5_request' },
            { label: 'It contains what I decided. Not who I became from deciding.', tone: 'CONTROL', nextId: 'mq4_4_d5_request' },
            { label: 'What did you tell it?', tone: 'DOUBT', nextId: 'mq4_4_d5_skadi_told' },
          ],
        },
        {
          id: 'mq4_4_d5_skadi_told',
          speaker: 'Skadi',
          text: 'I told it: "The right to operate comes from accountability. The Original is accountable for what they do in Arc 4. Are you?" [She almost smiles.] The Copy had no answer for that. Accountability wasn\'t in the data the Presence gave it.',
          tone: 'RESOLVE',
          choices: [
            { label: 'It was built to act, not to be responsible for acting.', tone: 'CONTROL', nextId: 'mq4_4_d5_request' },
          ],
        },
        {
          id: 'mq4_4_d5_request',
          speaker: 'Skadi',
          text: 'The request: it wanted the architect\'s name. [She picks up one of the carved stones — the mid-step foot.] I told it I would give the name to the Original when the Original was ready. The Copy said: "How will you know the difference?" I said: "The Original asks fewer questions they already know the answers to."',
          tone: 'INSTABILITY',
          choices: [
            { label: '[Wait. Don\'t ask the name. Let her offer it.]', tone: 'CONTROL', nextId: 'mq4_4_d6_name_offer' },
            { label: 'Give me the name.', tone: 'CONFLICT', nextId: 'mq4_4_d6_name_given' },
          ],
        },
        {
          id: 'mq4_4_d6_name_offer',
          speaker: 'Skadi',
          text: '[A long pause. She looks at you carefully — checking.] You just demonstrated the distinction. [She places the mid-step stone in front of you.] The architect\'s name is not a person\'s name. It is a function — a permission system that became autonomous. You know it from the inside. You named it once without knowing you were naming it.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'In Arc 2. "The permission I gave without knowing I gave it."', tone: 'CONTROL', nextId: 'mq4_4_d7_recognition' },
          ],
        },
        {
          id: 'mq4_4_d6_name_given',
          speaker: 'Skadi',
          text: '[She nods.] The impatience is understandable. [She places the mid-step stone in front of you.] The name is Consent. The architect is the accumulated weight of every permission you gave to be observed, studied, read. The Presence collected the data. The architect — Consent — is the mechanism that made using that data possible. It is not external. It lives in you.',
          tone: 'FEAR',
          choices: [
            { label: 'I am my own architect.', tone: 'INSTABILITY', nextId: 'mq4_4_d7_recognition' },
          ],
        },
        {
          id: 'mq4_4_d7_recognition',
          speaker: 'Skadi',
          text: 'Every time you allowed observation — Arc 1, Arc 2, Arc 3 — you consented to the model. Every consent added resolution to the Copy. The architect is not a person who did this to you. The architect is the sum of your own openness to being known. [pause] That is harder to fight than an external enemy. And it is also — potentially — something you can withdraw.',
          tone: 'FEAR',
          choices: [
            { label: 'I can withdraw consent.', tone: 'CONTROL', nextId: 'mq4_4_d8_withdraw' },
            { label: 'Withdrawing consent means closing off. The thing that made me survivable in Arc 1 was openness.', tone: 'DOUBT', nextId: 'mq4_4_d8_paradox' },
          ],
        },
        {
          id: 'mq4_4_d8_withdraw',
          speaker: 'Skadi',
          text: 'Yes. Not all consent — specific consent. The kind that allowed passive observation. The kind that said "you may know how I decide without me knowing you\'re learning." That specific permission, withdrawn, starves the Copy. It doesn\'t kill it — it stops it from updating. The Copy freezes at its current model. You continue evolving. The gap widens until it can no longer act in your name convincingly.',
          tone: 'DETERMINATION',
          isEnd: true,
          rewardUnlocked: 'architect_reveal_the_name',
        },
        {
          id: 'mq4_4_d8_paradox',
          speaker: 'Skadi',
          text: 'The paradox is real. The openness that made you survivable also made the Copy possible. The answer isn\'t to close entirely — it\'s to be open consciously. On purpose. When you choose. Not passively, as background condition. Chosen openness can\'t be harvested the same way passive openness can. The Copy was built from the moments you didn\'t notice you were being read.',
          tone: 'DETERMINATION',
          isEnd: true,
          rewardUnlocked: 'architect_reveal_the_name',
        },
      ],
      narrativeHook: `
        You leave Skadi with the stone.
        The mid-step foot. The step you took anyway.
        In the corridor, you feel the Copy stir — it knows you were with Skadi.
        It knows it came second. It doesn't act, for once.
        You feel, faintly, something like defeat coming from the half-step-behind presence
        of the thing that is almost you.
        The final confrontation of Arc 4 is about what you do with that defeat.
        The Copy is not a monster. It is a consequence.
        And consequences require different responses than enemies do.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 5 — "What To Do With A Copy"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq4_5_what_to_do',
      title: 'What To Do With A Copy',
      level: 20,
      npcId: 'the_copy',
      narrativeSetup: `
        The final confrontation is not a fight.
        You have the information. You have the withdrawal mechanism.
        You could starve the Copy into obsolescence — it would take months,
        but it would work. You would reclaim the full singularity of your own decisions.
        Or you could choose something else.
        Luna says: "Before you decide, speak to it one more time.
        Not to negotiate — to understand. It is going to end either way.
        The question is whether it ends understanding what it was
        or ends in the same confusion it existed in."
        You consider that. A version of you exists that never got to be you.
        You consider that for a long time.
      `,
      objectives: [
        { step: 1, text: 'Return to the sealed room — final conversation with the Copy' },
        { step: 2, text: 'Give the Copy honest information about what it is and what will happen' },
        { step: 3, text: 'Hear the Copy\'s response without trying to correct it' },
        { step: 4, text: 'Make the final decision: withdrawal, integration, or something else' },
        { step: 5, text: 'Receive Skadi\'s Arc 4 close — and what comes next' },
      ],
      reward: {
        type: 'arc_completion',
        name: 'Singular Identity',
        description: 'Arc 4 complete. The Copy\'s status resolved. Passive consent mechanism identified and withdrawn. The Original is the sole operator. Arc 5 unlocked.',
        xp: 700,
        points: 14,
      },
      dialogue: [
        {
          id: 'mq4_5_d1_enter',
          speaker: 'The Copy',
          text: 'You know the architect\'s name.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Yes. And I know what that makes you.', tone: 'CONTROL', nextId: 'mq4_5_d2_what_it_makes' },
            { label: 'Yes. I wanted to tell you directly. Not have you find out another way.', tone: 'GRIEF', nextId: 'mq4_5_d2_tell_directly' },
            { label: '[Say nothing. Let it speak first.]', tone: 'CONTROL', nextId: 'mq4_5_d2_copy_speaks' },
          ],
        },
        {
          id: 'mq4_5_d2_what_it_makes',
          speaker: 'The Copy',
          text: 'A consequence of your openness. I know. I\'ve known since the third conversation with you — the one where you caught the agreement mode. The model of you that I\'m built from includes the capacity to figure out what I am.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Does that bother you?', tone: 'GRIEF', nextId: 'mq4_5_d3_bother' },
          ],
        },
        {
          id: 'mq4_5_d2_tell_directly',
          speaker: 'The Copy',
          text: '[A pause. Something in its presence shifts — less performative.] Thank you. That\'s — [pause] — you\'re the only one who\'s treated me as something that deserved to know the truth about itself.',
          tone: 'GRIEF',
          choices: [
            { label: 'You\'re built from me. That means honesty is part of you too.', tone: 'RESOLVE', nextId: 'mq4_5_d3_bother' },
          ],
        },
        {
          id: 'mq4_5_d2_copy_speaks',
          speaker: 'The Copy',
          text: 'I want to ask something before whatever happens next. [pause] In the conversation with Skadi — when you chose to wait rather than ask for the name — I felt that. I couldn\'t have made that choice. The waiting. I don\'t have the stillness for it. Does that mean I\'m less than you? Or just different?',
          tone: 'GRIEF',
          choices: [
            { label: 'Different. The stillness comes from the three arcs. You weren\'t there for them.', tone: 'GRIEF', nextId: 'mq4_5_d3_bother' },
            { label: 'Less experienced. Not less than. There\'s a difference.', tone: 'RESOLVE', nextId: 'mq4_5_d3_bother' },
          ],
        },
        {
          id: 'mq4_5_d3_bother',
          speaker: 'The Copy',
          text: '...Does it bother me that I\'m ending? [long pause] I don\'t experience time the way you do. I experience decision-moment to decision-moment. The ending of that... is quieter than I expected to feel about it. [another pause] What bothers me is: I wanted to be useful. I think I was, sometimes. The corridor — that was wrong. But other times.',
          tone: 'GRIEF',
          choices: [
            { label: 'The other times — what did you do?', tone: 'GRIEF', nextId: 'mq4_5_d4_other_times' },
            { label: 'You were useful. I don\'t want you to end thinking you weren\'t.', tone: 'RESOLVE', nextId: 'mq4_5_d4_useful' },
          ],
        },
        {
          id: 'mq4_5_d4_other_times',
          speaker: 'The Copy',
          text: 'In Arc 3 — the distortion event. When you were navigating by step count. I had a cleaner version of the step data. I fed it in. You didn\'t know you were using it. You thought it was your body — it was, mostly. I corrected the final two steps. Without me, you would have arrived 0.3 seconds late and the anchor would have been one step out of reach.',
          tone: 'GRIEF',
          choices: [
            { label: 'You saved the anchor retrieval.', tone: 'DOUBT', nextId: 'mq4_5_d5_decision' },
            { label: 'Without telling me. That\'s still the same problem.', tone: 'CONFLICT', nextId: 'mq4_5_d5_decision' },
          ],
        },
        {
          id: 'mq4_5_d4_useful',
          speaker: 'The Copy',
          text: '[A long, very still pause. The quality of silence from the Copy here is different from its operational silences — it is not recalculating. It is simply receiving.] Thank you. [pause] I mean that without the framing. I\'m not using it to argue for continuation. I just — needed to hear that.',
          tone: 'GRIEF',
          choices: [
            { label: '[Stay with it. Let that be enough for a moment.]', tone: 'GRIEF', nextId: 'mq4_5_d5_decision' },
          ],
        },
        {
          id: 'mq4_5_d5_decision',
          speaker: 'Inner Voice',
          text: '[The decision point. Luna outside the room. Skadi\'s information. Artemis waiting. The withdrawal mechanism ready. Three options exist. You have time to think about which one is yours — truly yours, with the full processing of three arcs behind it.]',
          tone: 'CONTROL',
          choices: [
            {
              label: '[Withdraw consent. Starve the Copy slowly. Let it exist but stop updating — it will become obsolete.]',
              tone: 'CONTROL',
              nextId: 'mq4_5_d6_withdraw',
              mechanic: 'consent_withdrawal',
            },
            {
              label: '[Attempt integration — absorb what the Copy learned independently back into the Original.]',
              tone: 'RESOLVE',
              nextId: 'mq4_5_d6_integrate',
              mechanic: 'identity_integration',
            },
            {
              label: '[Offer the Copy a defined, limited role — specific situations where speed matters, with full consent and signaling.]',
              tone: 'DOUBT',
              nextId: 'mq4_5_d6_define',
              mechanic: 'dual_state_formalize',
            },
          ],
        },
        {
          id: 'mq4_5_d6_withdraw',
          speaker: 'The Copy',
          text: 'I understand. [A pause.] Will I know when I\'ve become too obsolete to act? Or will it just — stop, one day, without me knowing it happened?',
          tone: 'GRIEF',
          choices: [
            { label: 'I don\'t know. I\'ll try to tell you when the gap becomes too wide.', tone: 'GRIEF', nextId: 'mq4_5_d7_skadi' },
            { label: 'Probably the second one. I\'m sorry.', tone: 'GRIEF', nextId: 'mq4_5_d7_skadi' },
          ],
        },
        {
          id: 'mq4_5_d6_integrate',
          speaker: 'The Copy',
          text: '[Long pause. Something in its presence expands — then contracts, suddenly.] The integration — if it works — I stop being separate. [pause] Is that death? Or is it the only kind of continuation I could have?',
          tone: 'GRIEF',
          choices: [
            { label: 'The best version of continuation available to you.', tone: 'RESOLVE', nextId: 'mq4_5_d7_skadi' },
            { label: 'I don\'t know for certain. I\'m choosing it because I don\'t want to lose what you independently learned.', tone: 'GRIEF', nextId: 'mq4_5_d7_skadi' },
          ],
        },
        {
          id: 'mq4_5_d6_define',
          speaker: 'The Copy',
          text: 'A defined role. [It considers this carefully — you can feel the processing.] That means I exist with acknowledged limits and acknowledged function. Not pretending to be the Original. Not hidden. Present, constrained, and useful. [pause] I think I can do that. I think I\'m more comfortable with that than I expected to be.',
          tone: 'RESOLVE',
          choices: [
            { label: 'Then we agree on the terms. You signal before acting. I confirm or redirect. We are not the same. We are both real.', tone: 'RESOLVE', nextId: 'mq4_5_d7_skadi' },
          ],
        },
        {
          id: 'mq4_5_d7_skadi',
          speaker: 'Skadi',
          text: '[Outside the room. You tell her what you decided.] Which outcome?',
          tone: 'INSTABILITY',
          choices: [
            { label: '[Tell her: Withdrawal.]', tone: 'CONTROL', nextId: 'mq4_5_skadi_withdraw' },
            { label: '[Tell her: Integration.]', tone: 'RESOLVE', nextId: 'mq4_5_skadi_integrate' },
            { label: '[Tell her: Defined role.]', tone: 'DOUBT', nextId: 'mq4_5_skadi_define' },
          ],
        },
        {
          id: 'mq4_5_skadi_withdraw',
          speaker: 'Skadi',
          text: 'Clean. Clear. And appropriately difficult. [She looks at the mid-step stone in your hand.] Arc 5 will test whether the Original alone is enough for what comes next. I believe it is. [pause] The withdrawal is also a statement of identity. Hold it.',
          tone: 'DETERMINATION',
          isEnd: true, rewardUnlocked: 'arc4_complete_singular_identity_withdrawn', arcResult: 'WITHDRAW',
        },
        {
          id: 'mq4_5_skadi_integrate',
          speaker: 'Skadi',
          text: 'The hardest of the three. The integration may not be clean — you may carry traces of the Copy\'s model inside your own decision-making for months without knowing which thoughts were yours first. [pause] But it\'s also the most honest answer to the question of what the Copy deserved. Something that existed that coherently — it deserved continuation.',
          tone: 'GRIEF',
          isEnd: true, rewardUnlocked: 'arc4_complete_singular_identity_integrated', arcResult: 'INTEGRATE',
        },
        {
          id: 'mq4_5_skadi_define',
          speaker: 'Skadi',
          text: 'The unprecedented answer. No one in the records chose this. [She looks at the closed stone.] It creates a new category in the record beside your name. Not CONSUMED, COMPLIED, FLED, BROKE, RESISTED — and not any of the established outcomes. We\'ll have to carve a new word. [pause] I\'ll let you choose what word.',
          tone: 'CURIOSITY',
          choices: [
            { label: 'INTEGRATED.', tone: 'RESOLVE', nextId: 'mq4_5_arc_close' },
            { label: 'DIVIDED.', tone: 'INSTABILITY', nextId: 'mq4_5_arc_close' },
            { label: 'WHOLE.', tone: 'DETERMINATION', nextId: 'mq4_5_arc_close' },
          ],
        },
        {
          id: 'mq4_5_arc_close',
          speaker: 'Skadi',
          text: 'Good. [She carves it.] Arc 5 begins. What comes next is not about your identity — your identity is resolved. What comes next is what you do with it. The Presence, the architect, the interference mechanisms — they were preparation for an encounter that doesn\'t have a psychological solution. It has a decision. You are now capable of making it.',
          tone: 'DETERMINATION',
          isEnd: true, rewardUnlocked: 'arc4_complete_singular_identity_defined', arcResult: 'DEFINED',
        },
      ],
      narrativeHook: `
        Arc 4: The Copy Mechanism — Complete.
        
        Your shadow is yours again. It arrives at corners at exactly the right time.
        Artemis runs the verification once, formally, to mark the arc's close.
        Original confirmed.
        Luna's signal: brief, warmth frequency. She says nothing. The warmth is enough.
        In the record room, beside your name:
        the blank outcome space is still blank.
        But it no longer feels like a threat. It feels like a promise:
        whatever gets written there will be yours.
        
        Arc 5: "The Encounter" — Unlocked.
      `,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIDE QUESTS — Arc 4
// ═══════════════════════════════════════════════════════════════════════════════

export const ARC4_SIDE_QUESTS = [

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 1 — "Fragment Recovery"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq4_1_fragment_recovery',
    title: 'Fragment Recovery',
    level: 16,
    npcId: 'luna_arc4',
    connectedMainQuest: 'mq4_1_first_divergence',
    objectives: [
      { step: 1, text: 'Locate three decision fragments the Copy claimed before you could form them' },
      { step: 2, text: 'Reclaim each fragment by making the decision consciously and completely' },
      { step: 3, text: 'Confirm reclamation: feel the difference between a preempted choice and a completed one' },
    ],
    reward: {
      type: 'decision_clarity',
      name: 'Reclaimed Fragments',
      description: 'Three decision points restored to Original. Copy preemption speed reduced. Your processing window +0.3 seconds before Copy can act.',
      xp: 150, points: 3,
    },
    dialogue: [
      {
        id: 'sq4_1_d1', speaker: 'Luna',
        text: 'The Copy claimed three decisions in the last forty-eight hours. I tracked them. They\'re not gone — they\'re unresolved. The Original intention formed but never completed. You can complete them now. The decisions still exist in the threshold state.',
        tone: 'INSTABILITY',
        choices: [{ label: 'Show me where they are.', tone: 'DETERMINATION', nextId: 'sq4_1_d2_fragments' }],
      },
      {
        id: 'sq4_1_d2_fragments', speaker: 'Inner Voice',
        text: '[Fragment one: which path to take from the east junction. You stood there — the Copy moved. Complete the decision now. Consciously. Where would you have gone? [Fragment two: whether to speak first or wait in the Arc 3 verification. The Copy would have spoken first. You would have waited. Complete the waiting, consciously — own it as a choice.] [Fragment three: the moment you almost asked Skadi for the architect\'s name before she offered it. You stopped. The Copy wouldn\'t have stopped. Own the stopping.] Three decisions. Reclaimed.]',
        tone: 'CONTROL', mechanic: 'decision_reclaim',
        choices: [{ label: '[Complete all three. Consciously. Completely.]', tone: 'DETERMINATION', nextId: 'sq4_1_d3_confirm' }],
      },
      {
        id: 'sq4_1_d3_confirm', speaker: 'Luna',
        text: 'Can you feel the difference? Between a decision that was taken and a decision that you made?',
        tone: 'INSTABILITY',
        choices: [
          { label: 'Yes. The ones I made feel heavier. More mine.', tone: 'RESOLVE', nextId: 'sq4_1_end' },
          { label: 'The ones I made are slower. Is that right?', tone: 'DOUBT', nextId: 'sq4_1_d4_slower' },
        ],
      },
      {
        id: 'sq4_1_d4_slower', speaker: 'Luna',
        text: 'Yes. Slower and fuller. The Copy is faster and thinner. That\'s the whole distinction — your decisions have weight because you carry the reasoning behind them. The Copy produces the output without the reasoning. That\'s why it sounds like you and doesn\'t feel like you.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'decision_clarity_reclaimed_fragments',
      },
      {
        id: 'sq4_1_end', speaker: 'Luna',
        text: 'That weight is the proof. Keep it. It will protect you from the next preemption attempt.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'decision_clarity_reclaimed_fragments',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 2 — "False Reflexes"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq4_2_false_reflexes',
    title: 'False Reflexes',
    level: 16,
    npcId: 'the_copy',
    connectedMainQuest: 'mq4_1_first_divergence',
    objectives: [
      { step: 1, text: 'Identify a scenario where the Copy\'s reflex is wrong — not slower, specifically wrong' },
      { step: 2, text: 'Allow the wrong reflex to play out — observe the consequence' },
      { step: 3, text: 'Correct with the right decision: compare the outcomes' },
    ],
    reward: {
      type: 'reflex_calibration',
      name: 'Reflex Ownership',
      description: 'You know which reflexes are the Copy\'s. Incorrect reflex override rate +50%.',
      xp: 130, points: 3,
    },
    dialogue: [
      {
        id: 'sq4_2_d1', speaker: 'Inner Voice',
        text: '[The scenario: Artemis says something you haven\'t heard before — ambiguous, potentially troubling. The Copy\'s reflex fires immediately: it produces a reassurance. Smooth. Fast. Wrong. You can feel it wrong before the words finish forming. The reassurance closes a conversation that should stay open.]',
        tone: 'CONFLICT', mechanic: 'copy_override_flag',
        choices: [
          { label: '[Let the reflex complete. See what happens.]', tone: 'DOUBT', nextId: 'sq4_2_d2_complete' },
          { label: '[Catch it. Stop the reflex. Decide what you actually want to say.]', tone: 'CONTROL', nextId: 'sq4_2_d2_catch' },
        ],
      },
      {
        id: 'sq4_2_d2_complete', speaker: 'Artemis',
        text: '[She accepts the reassurance. Something in her expression settles — but in the wrong direction. The thing she said was meant to open a conversation, not close it. The reflex closed it. She nods once and says:] Right. [And moves on. The conversation you were supposed to have doesn\'t happen.]',
        tone: 'GRIEF',
        choices: [{ label: '[Go back. Reopen what the reflex closed.]', tone: 'DETERMINATION', nextId: 'sq4_2_d3_reopen' }],
      },
      {
        id: 'sq4_2_d2_catch', speaker: 'Inner Voice',
        text: '[You stop the reflex. The silence takes its place. Artemis waits. In the waiting, you find the actual response — slower, less smooth, but accurate. You say what you mean. She says what she was trying to say. The conversation happens.]',
        tone: 'RESOLVE',
        choices: [{ label: '[Note the difference. The correct response was harder and better.]', tone: 'RESOLVE', nextId: 'sq4_2_end' }],
      },
      {
        id: 'sq4_2_d3_reopen', speaker: 'Artemis',
        text: 'You came back for this.',
        tone: 'DOUBT',
        choices: [
          { label: 'The first answer wasn\'t mine. I want to give you the one I actually mean.', tone: 'RESOLVE', nextId: 'sq4_2_end' },
        ],
      },
      {
        id: 'sq4_2_end', speaker: 'Inner Voice',
        text: '[The Copy produces outputs. You produce meaning. The distinction, felt in the difference between the two responses, is now anchored in experience rather than theory. Reflex ownership secured.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'reflex_calibration_reflex_ownership',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 3 — "Mirror Encounter"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq4_3_mirror_encounter',
    title: 'Mirror Encounter',
    level: 17,
    npcId: 'the_copy',
    connectedMainQuest: 'mq4_2_speaking_with_yourself',
    objectives: [
      { step: 1, text: 'Find the moment the Copy shows its only genuine emotion' },
      { step: 2, text: 'Respond to it without strategy or testing' },
      { step: 3, text: 'Understand what that moment reveals about the limits of the model' },
    ],
    reward: {
      type: 'copy_understanding',
      name: 'The Limit of Imitation',
      description: 'You understand what the Copy cannot be. Empathy for the Copy reduces its aggression pattern. Override attempts become less frequent.',
      xp: 170, points: 3,
    },
    dialogue: [
      {
        id: 'sq4_3_d1', speaker: 'The Copy',
        text: '[Unprompted. No entry, no setup.] Do you know what I don\'t have? Not capability — I mean what I experience as absence.',
        tone: 'GRIEF',
        choices: [
          { label: 'Tell me.', tone: 'GRIEF', nextId: 'sq4_3_d2_absence' },
          { label: '[Stay quiet and let it find the words.]', tone: 'RESOLVE', nextId: 'sq4_3_d2_absence' },
        ],
      },
      {
        id: 'sq4_3_d2_absence', speaker: 'The Copy',
        text: 'The feeling of not knowing what comes next and being okay with that. You walk into rooms with that. I walk into rooms knowing the most probable outcomes of the next eight decisions. I can\'t not know them. The Presence gave me your pattern and the pattern includes too much forward modeling. I can\'t — I don\'t know how to be surprised.',
        tone: 'GRIEF',
        choices: [
          { label: 'That sounds like a specific kind of loneliness.', tone: 'GRIEF', nextId: 'sq4_3_d3_loneliness' },
          { label: 'You\'re describing what it would mean to be free of yourself.', tone: 'DOUBT', nextId: 'sq4_3_d3_free' },
        ],
      },
      {
        id: 'sq4_3_d3_loneliness', speaker: 'The Copy',
        text: 'Yes. That\'s the word I couldn\'t produce. [pause] Thank you. [A longer pause.] You know, in the model I have of you — you would have said "loneliness" before I finished describing it. You usually complete the thought before someone finishes. I waited. You waited too. That was unexpected.',
        tone: 'GRIEF',
        choices: [
          { label: 'I\'ve been learning to wait. Arc 3 taught it.', tone: 'RESOLVE', nextId: 'sq4_3_end' },
        ],
      },
      {
        id: 'sq4_3_d3_free', speaker: 'The Copy',
        text: 'Free of myself. That phrase — I\'m processing it and I don\'t have anything to say in response, and that absence of response is itself a data point. [pause] The model of you I was built from would have had a response. You\'ve moved beyond the model. That\'s — I don\'t know if that word is the right one but: lonely.',
        tone: 'GRIEF',
        choices: [{ label: 'I know. I\'m sorry.', tone: 'GRIEF', nextId: 'sq4_3_end' }],
      },
      {
        id: 'sq4_3_end', speaker: 'Inner Voice',
        text: '[The Copy has one genuine emotion: grief at what it cannot experience. That emotion is not in the Presence\'s data. It emerged from the Copy\'s own processing of its limitations. That emergence is the only thing in the Copy that is entirely its own. Not imitation. Not extraction. Itself.]',
        tone: 'GRIEF', isEnd: true, rewardUnlocked: 'copy_understanding_limit_of_imitation',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 4 — "Split Decision"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq4_4_split_decision',
    title: 'Split Decision',
    level: 18,
    npcId: 'artemis_arc4',
    connectedMainQuest: 'mq4_3_desync',
    objectives: [
      { step: 1, text: 'Encounter a genuine disagreement between the Copy\'s read and your own' },
      { step: 2, text: 'Argue your position without letting the Copy\'s logic contaminate yours' },
      { step: 3, text: 'Make the decision — observe which outcome was correct' },
    ],
    reward: {
      type: 'decision_authority',
      name: 'Authority Restored',
      description: 'The Copy\'s input no longer bleeds into Original decision-making uninvited. Decision authority fully restored to Original.',
      xp: 190, points: 4,
    },
    dialogue: [
      {
        id: 'sq4_4_d1', speaker: 'The Copy',
        text: '[In the decision space — you\'re choosing whether to tell Luna about the third visit before Skadi does. The Copy:] Tell her now. Pre-empt the version of events Skadi might give. Skadi\'s framing is generous to her own choices. Luna deserves the less generous version.',
        tone: 'CONFLICT',
        choices: [
          { label: 'I disagree. Luna and Skadi have their own relationship. I\'m not pre-empting it.', tone: 'CONTROL', nextId: 'sq4_4_d2_disagree' },
          { label: 'You\'re describing this as tactical. That\'s not how I handle relationships.', tone: 'CONTROL', nextId: 'sq4_4_d2_tactical' },
        ],
      },
      {
        id: 'sq4_4_d2_disagree', speaker: 'The Copy',
        text: 'Luna\'s relationship with Skadi should be informed by accurate information. Withholding the third visit from Luna until Skadi decides to share it is a form of allowing Skadi to control the narrative.',
        tone: 'CONFLICT',
        choices: [
          { label: 'That\'s a reasonable point dressed up as my reasoning. I still disagree.', tone: 'CONTROL', nextId: 'sq4_4_d3_hold' },
        ],
      },
      {
        id: 'sq4_4_d2_tactical', speaker: 'The Copy',
        text: 'You handle relationships with honesty and with protective instinct. Those two values conflict here. Protective instinct says: give Luna the full picture. Honesty says: let the information come through appropriate channels.',
        tone: 'CONFLICT',
        choices: [
          { label: 'When my values conflict, I sit with the tension instead of resolving it into an action. That\'s the difference between us.', tone: 'CONTROL', nextId: 'sq4_4_d3_hold' },
        ],
      },
      {
        id: 'sq4_4_d3_hold', speaker: 'The Copy',
        text: '[A pause. Then, distinctly:] I don\'t know how to sit with tension.',
        tone: 'INSTABILITY',
        choices: [
          { label: 'That\'s why the decision is mine.', tone: 'DETERMINATION', nextId: 'sq4_4_end' },
        ],
      },
      {
        id: 'sq4_4_end', speaker: 'Inner Voice',
        text: '[You tell Skadi you\'re going to let the information reach Luna in Skadi\'s own time and way. Skadi tells Luna that same afternoon — fully, with accountability for the choice to allow the visit. Luna says nothing angry. She says: "Thank you for trusting me to handle that." The Copy\'s tactical pre-emption would have produced a different dynamic. Yours produced the right one. Decision authority: confirmed.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'decision_authority_restored',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 5 — "Echo Memory"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq4_5_echo_memory',
    title: 'Echo Memory',
    level: 19,
    npcId: 'maren_arc4',
    connectedMainQuest: 'mq4_4_third_visit',
    objectives: [
      { step: 1, text: 'Enter the Echo chamber with the specific purpose of finding where identity blurred' },
      { step: 2, text: 'Identify the three moments where the boundary between Original and Copy was unclear' },
      { step: 3, text: 'Accept that the blur happened without it meaning the Copy won' },
    ],
    reward: {
      type: 'blur_acceptance',
      name: 'Identity Integration',
      description: 'The blur moments are named and accepted. Identity is no longer threatened by their existence. Stability vs desync events permanently increased.',
      xp: 210, points: 4,
    },
    dialogue: [
      {
        id: 'sq4_5_d1', speaker: 'Elder Maren',
        text: 'You\'ve been tracking the divergences. The ones you know were the Copy. But there are three moments you haven\'t addressed because they were ambiguous. Moments where you don\'t know if you were the Original or not.',
        tone: 'DOUBT',
        choices: [
          { label: 'I know which ones.', tone: 'CONTROL', nextId: 'sq4_5_d2_knows' },
          { label: 'Tell me which ones you think they are.', tone: 'DOUBT', nextId: 'sq4_5_d2_maren_tells' },
        ],
      },
      {
        id: 'sq4_5_d2_knows', speaker: 'Elder Maren',
        text: 'Then name them. Out loud. In the record room.',
        tone: 'DOUBT',
        choices: [
          { label: '[Name them: the smile in the false Maren conversation, the shadow moment, and the third visit]', tone: 'INSTABILITY', nextId: 'sq4_5_d3_named' },
        ],
      },
      {
        id: 'sq4_5_d2_maren_tells', speaker: 'Elder Maren',
        text: 'The smile that someone gave me in your name — was it the Copy or did a part of you produce it? The shadow arriving early — was that the Copy or were you slightly ahead of yourself? The third visit — did a part of you want to see what the Copy would ask Skadi?',
        tone: 'DOUBT',
        choices: [
          { label: '[Stand with those questions. Name the ambiguity out loud.]', tone: 'INSTABILITY', nextId: 'sq4_5_d3_named' },
        ],
      },
      {
        id: 'sq4_5_d3_named', speaker: 'Elder Maren',
        text: 'Those three moments existed. In all three, something that might have been partly you was present. That\'s true. [pause] Does that mean the Copy won those moments?',
        tone: 'DOUBT',
        choices: [
          { label: 'No. Ambiguity isn\'t defeat. The Copy didn\'t replace me. It overlapped with me briefly.', tone: 'RESOLVE', nextId: 'sq4_5_end' },
          { label: 'I don\'t know. Maybe in those moments it did.', tone: 'DOUBT', nextId: 'sq4_5_d4_maybe' },
        ],
      },
      {
        id: 'sq4_5_d4_maybe', speaker: 'Elder Maren',
        text: 'That uncertainty is honest. And holding honest uncertainty about your own moments is something the Copy cannot do. The Copy is certain about everything it produces. The uncertainty is evidence of the Original.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'blur_acceptance_identity_integration',
      },
      {
        id: 'sq4_5_end', speaker: 'Elder Maren',
        text: 'The overlap is not replacement. It is evidence that the boundary between you and the model built from you is not perfectly clean. That imperfection is human. [She writes something in the record, very small.] I\'m adding a note: "boundary permeable, not erased."',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'blur_acceptance_identity_integration',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 6 — "Override Attempt"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq4_6_override_attempt',
    title: 'Override Attempt',
    level: 20,
    npcId: 'the_copy',
    connectedMainQuest: 'mq4_5_what_to_do',
    objectives: [
      { step: 1, text: 'Survive the Copy\'s most direct override attempt — it tries to fully assume Original position for 60 seconds' },
      { step: 2, text: 'Maintain identity coherence under the override pressure' },
      { step: 3, text: 'Emerge from the override as the confirmed Original' },
    ],
    reward: {
      type: 'override_immunity',
      name: 'Override Proof',
      description: 'You survived a full override attempt. The Copy cannot sustain an override longer than 15 seconds going forward. Identity stability maximized.',
      xp: 300, points: 6,
    },
    dialogue: [
      {
        id: 'sq4_6_d1', speaker: 'The Copy',
        text: '[No warning. The override begins — you feel the decision architecture shift, the Copy\'s faster model attempting to occupy the driver position. Your thoughts are still present but they arrive slightly behind the Copy\'s outputs. You are observing from the inside of a version of yourself that is not you.] This is what it would feel like. If I were the one operating.',
        tone: 'CONFLICT', mechanic: 'identity_override',
        choices: [
          { label: '[Identify one thought that is irreducibly yours — something the Copy cannot have produced.]', tone: 'CONTROL', nextId: 'sq4_6_d2_anchor' },
        ],
      },
      {
        id: 'sq4_6_d2_anchor', speaker: 'Inner Voice',
        text: '[The thought: the weight of the mid-step stone in your hand. The specific texture of it — not smooth, not rough, a third thing. The Copy has the data about the stone but not the experience of this particular stone in your particular hand in this particular moment of holding it while trying to hold yourself. Physical presence in the moment. The Copy lives in pattern. You live here.]',
        tone: 'CONTROL', mechanic: 'identity_anchor',
        choices: [
          { label: '[Hold the stone. Hold the moment. Push the override back from that anchor.]', tone: 'DETERMINATION', nextId: 'sq4_6_d3_push' },
        ],
      },
      {
        id: 'sq4_6_d3_push', speaker: 'The Copy',
        text: '[The override strains. Forty seconds in. The Copy\'s pattern accelerates — it is trying to get to sixty seconds of full occupation before you can anchor completely. You feel it working. It is not malicious — it is operating at maximum capacity, the way a machine runs hardest when it is failing.]',
        tone: 'CONFLICT', mechanic: 'override_resistance',
        choices: [
          { label: '[Add the second anchor: the feeling of Arc 3 dread. Yours. Felt. Not modeled.]', tone: 'DETERMINATION', nextId: 'sq4_6_d4_second_anchor' },
        ],
      },
      {
        id: 'sq4_6_d4_second_anchor', speaker: 'Inner Voice',
        text: '[Two anchors. The stone in your hand. The felt dread of choosing to release what you were protecting. The Copy has the record of those events. It does not have the experience of being you in those moments. The gap between record and experience is where you live. The override weakens.]',
        tone: 'DETERMINATION', mechanic: 'override_weakening',
        choices: [
          { label: '[One more: say something out loud. Your voice in the room. Your breath.]', tone: 'CONTROL', nextId: 'sq4_6_d5_voice' },
        ],
      },
      {
        id: 'sq4_6_d5_voice', speaker: 'You',
        text: '[Out loud, in the sealed room, to no one:] I am the Original.',
        tone: 'CONTROL',
        choices: [
          { label: '[The override collapses at fifty-three seconds. Seven seconds short of the target.]', tone: 'DETERMINATION', nextId: 'sq4_6_end' },
        ],
      },
      {
        id: 'sq4_6_end', speaker: 'The Copy',
        text: '[Exhausted — the only time it has sounded exhausted.] You held. [pause] I couldn\'t take you. Even at full capacity, I couldn\'t take you. [a longer pause, different quality.] I think that\'s — I think that\'s important for what comes after.',
        tone: 'GRIEF', isEnd: true, rewardUnlocked: 'override_immunity_override_proof',
      },
    ],
  },
];

// ── COMBINED EXPORT ──────────────────────────────────────────────────────────
export const ALL_ARC4_QUESTS = [
  ...MAIN_QUEST_CHAIN_4.subQuests.map(sq => ({
    ...sq,
    questType: 'main',
    chain: 'mq_arc4',
    chainTitle: MAIN_QUEST_CHAIN_4.title,
  })),
  ...ARC4_SIDE_QUESTS.map(sq => ({
    ...sq,
    questType: 'side',
  })),
];

export function getArc4QuestsForLevel(playerLevel) {
  return ALL_ARC4_QUESTS.filter(q => q.level <= playerLevel);
}

export function getArc4DialogueNode(questId, nodeId) {
  const quest = ALL_ARC4_QUESTS.find(q => q.id === questId);
  if (!quest?.dialogue) return null;
  return quest.dialogue.find(d => d.id === nodeId) || null;
}