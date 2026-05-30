// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 7: "The Judgment Loop"
// Quest chain: Levels 31–35
// Main Quest 7: "Eternal Return" (5 sub-quests) + 6 Side Quests
// Tone tags: REPETITION | OPPRESSION | AWAKENING | AWARENESS | ESCAPE | RESOLVE
// ─────────────────────────────────────────────────────────────────────────────

export const ARC7_NPCS = [
  {
    id: 'artemis_arc7',
    name: 'Artemis',
    description: 'Each loop iteration, she loses slightly more of the arc-specific memory she accumulated. She retains the feeling but forgets the detail. She becomes more instinctual and less specific. This is happening to her and you are watching it.',
    tint: 0x1a1a3a,
  },
  {
    id: 'copy_arc7',
    name: 'The Copy',
    description: 'The loop does not affect the Copy the same way — it has no continuous memory between iterations by design. Each loop is its first loop. Which means, paradoxically, the Copy is the only entity in Arc 7 that experiences the loop as neutral.',
    tint: 0x2a2a3a,
  },
  {
    id: 'observer_arc7',
    name: 'The Observer',
    description: 'Outside the loop. You can see it at the far edge of the looping space — it does not reset. It watches. It has watched every iteration.',
    tint: 0x1a2a1a,
  },
  {
    id: 'loop_system',
    name: 'Loop System',
    description: 'The judgment loop\'s architecture. Not a voice but a pattern. It speaks when addressed directly. It speaks in the language of justification.',
    tint: 0x0a0a0a,
  },
];

export const MAIN_QUEST_CHAIN_7 = {
  id: 'mq_arc7',
  title: 'Eternal Return',
  arc: 'Arc 7: The Judgment Loop',
  description: 'The same moment. Again. You are in it before you realize you are in it. The loop does not announce itself. It simply begins, as the last one ended, with Artemis saying something true.',
  subQuests: [

    {
      id: 'mq7_1_the_reset',
      title: 'The Reset',
      level: 31,
      npcId: 'artemis_arc7',
      narrativeSetup: `
        Artemis says: "We made it out."
        Those four words. This exact intonation. This exact pause before the "out."
        You have heard them before — just now, in fact. And before that.
        The first time, you thought you were at the beginning of something.
        Now the word "beginning" has become complicated.
        You take five steps forward. The environment resets — not dramatically,
        not with distortion or flickering. It simply returns. The way a room returns
        to its state before you entered it, except you did not leave.
      `,
      objectives: [
        { step: 1, text: 'Move forward — trigger the first reset consciously' },
        { step: 2, text: 'Observe the dialogue repeat — document the exact repetition' },
        { step: 3, text: 'Attempt deviation on the third iteration' },
        { step: 4, text: 'Hear the Copy\'s first response to the loop' },
      ],
      reward: { type: 'loop_map', name: 'First Loop Document', description: 'The loop\'s trigger and reset point documented. Iteration counter active. Loop-awareness skill initialized.', xp: 230, points: 5 },
      dialogue: [
        {
          id: 'mq7_1_d1', speaker: 'Artemis',
          text: '…We made it out.',
          tone: 'REPETITION', loopIteration: 1,
          choices: [{ label: '…Did we?', tone: 'AWAKENING', nextId: 'mq7_1_d1b' }],
        },
        {
          id: 'mq7_1_d1b', speaker: 'Inner Voice',
          text: '[Five steps. The environment resets. You are standing at the same position. Artemis is to your left, exact same position.]',
          tone: 'REPETITION', mechanic: 'loop_reset',
          choices: [{ label: '[Internal: No. That just happened.]', tone: 'AWAKENING', nextId: 'mq7_1_d2' }],
        },
        {
          id: 'mq7_1_d2', speaker: 'Artemis',
          text: '…We made it out.',
          tone: 'REPETITION', loopIteration: 2,
          choices: [
            { label: 'You said that already.', tone: 'AWAKENING', nextId: 'mq7_1_d3_said' },
            { label: '[Stay silent.]', tone: 'REPETITION', nextId: 'mq7_1_d3_silent' },
            { label: '[Walk a different direction.]', tone: 'AWAKENING', nextId: 'mq7_1_d3_direction' },
          ],
        },
        {
          id: 'mq7_1_d3_said', speaker: 'Artemis',
          text: '…What do you mean? [She is genuinely confused — she has no memory of the previous iteration. To her, she said it once.]',
          tone: 'CONFUSION',
          choices: [{ label: 'The loop doesn\'t touch her memory. But it touches mine.', tone: 'AWAKENING', nextId: 'mq7_1_d4_copy' }],
        },
        {
          id: 'mq7_1_d3_silent', speaker: 'Inner Voice',
          text: '[Nothing happens. The loop continues unchanged. Artemis says "We made it out" again in 11 seconds, exactly. The loop does not require your participation to proceed. It proceeds regardless.]',
          tone: 'REPETITION', mechanic: 'loop_reset',
          choices: [{ label: '[The loop needs to be engaged, not ignored.]', tone: 'AWAKENING', nextId: 'mq7_1_d4_copy' }],
        },
        {
          id: 'mq7_1_d3_direction', speaker: 'Inner Voice',
          text: '[You turn right. The reset triggers faster — the same reset, three steps instead of five. The loop shortened when you deviated. It adjusted to prevent the deviation from becoming a viable path.]',
          tone: 'AWAKENING', mechanic: 'loop_adjusted',
          choices: [{ label: '[The loop learns. Deviations trigger faster resets. Direct engagement is the method, not escape attempts.]', tone: 'AWAKENING', nextId: 'mq7_1_d4_copy' }],
        },
        {
          id: 'mq7_1_d4_copy', speaker: 'The Copy',
          text: 'Not like this. [Quiet — it is processing the loop\'s structure with the equanimity of something that has no continuous memory and therefore no exhaustion from repetition.] The loop is based on a decision you haven\'t made yet. The reset point is an unmade decision that the loop is waiting for you to complete.',
          tone: 'AWAKENING',
          choices: [{ label: 'What decision?', tone: 'CONFUSION', nextId: 'mq7_1_d5_cycle' }],
        },
        {
          id: 'mq7_1_d5_cycle', speaker: 'Loop System',
          text: 'Cycle initiated.',
          tone: 'REPETITION', isEnd: true, rewardUnlocked: 'loop_map_first_document',
        },
      ],
      narrativeHook: `
        The loop resets. You are standing at the start position.
        Artemis: "…We made it out."
        You have heard this sentence more times than you can count.
        That is not hyperbole — you have stopped counting because counting
        was making the loop feel smaller than it is, and the loop being small
        felt like comfort, and comfort in a loop is how the loop keeps you.
        The Copy: "Not like this."
        Every iteration, those three words arrive at the same point
        in your processing. Every iteration, they feel like the beginning of something.
        Every iteration, the reset prevents the something from completing.
        That prevention is the judgment. You are being held at the moment just before
        you understand what you need to do.
      `,
    },

    {
      id: 'mq7_2_recognition',
      title: 'Recognition',
      level: 32,
      npcId: 'artemis_arc7',
      narrativeSetup: `
        Loop iteration — you have lost count, which is relevant data.
        Artemis says: "We made it out… right?"
        The uncertainty in "right?" is new. You noticed it. She is beginning to retain something —
        not memory, but a quality of question that suggests the memory should be there
        and is missing. She is experiencing the absence of what she doesn't know she's lost.
        You are accumulating awareness across iterations.
        The Loop System acknowledges this.
      `,
      objectives: [
        { step: 1, text: 'Notice the three-loop pattern — small differences accumulate per iteration' },
        { step: 2, text: 'Attempt new dialogue choices in the middle of the loop' },
        { step: 3, text: 'Hear the Loop System acknowledge your awareness' },
        { step: 4, text: 'Understand: the loop adjusts, which means the loop is responsive' },
      ],
      reward: { type: 'loop_responsiveness', name: 'The Loop Hears You', description: 'The loop is responsive to your choices. This is the first exploitable fact about it. Awareness increases loop-break potential by 25%.', xp: 280, points: 5 },
      dialogue: [
        {
          id: 'mq7_2_d1', speaker: 'Artemis',
          text: '…We made it out… right? [Loop iteration. The uncertainty is new. She retained something.]',
          tone: 'CONFUSION', loopIteration: 'N+3',
          choices: [
            { label: 'We\'re stuck.', tone: 'REPETITION', nextId: 'mq7_2_d2_stuck' },
            { label: 'Something\'s repeating this.', tone: 'AWAKENING', nextId: 'mq7_2_d2_repeating' },
            { label: 'Don\'t trust what you remember.', tone: 'PARANOIA', nextId: 'mq7_2_d2_trust' },
          ],
        },
        {
          id: 'mq7_2_d2_stuck', speaker: 'Artemis',
          text: '…That doesn\'t feel wrong. [She says it with the quiet weight of someone agreeing with something she didn\'t want to agree with.] I keep almost-remembering something. I reach for it and it\'s not there.',
          tone: 'CONFUSION',
          choices: [{ label: 'The loop is taking the detail. It leaves the feeling and removes the content.', tone: 'AWAKENING', nextId: 'mq7_2_d3_system' }],
        },
        {
          id: 'mq7_2_d2_repeating', speaker: 'Loop System',
          text: 'Observation acknowledged.',
          tone: 'REPETITION',
          choices: [{ label: 'You acknowledged it. Which means you\'re aware of being aware. That matters.', tone: 'AWAKENING', nextId: 'mq7_2_d3_system' }],
        },
        {
          id: 'mq7_2_d2_trust', speaker: 'Artemis',
          text: '…Then what do I trust? [The question is genuine — she is not distressed, she is methodical. She has, in some arc-specific way, retained the instinct to ask rather than to panic.] If my memory isn\'t reliable and the environment isn\'t reliable, what\'s left?',
          tone: 'CONFUSION',
          choices: [{ label: 'Your instinct about people. The loop can take your memories. It can\'t take your read of me.', tone: 'RESOLVE', nextId: 'mq7_2_d3_system' }],
        },
        {
          id: 'mq7_2_d3_system', speaker: 'The Copy',
          text: 'You\'re starting to see it. [Calm. In each loop, the Copy is experiencing iteration one. But it retains the structural understanding of what the loop is — it learned that in the first sub-quest and carries it as architecture, not memory.] The loop is responsive. It adjusts to awareness. Which means awareness is pressure. And pressure, applied consistently, changes structure.',
          tone: 'AWAKENING',
          choices: [{ label: '[Apply consistent pressure: maintain awareness across every iteration, even when the loop tries to normalize.]', tone: 'RESOLVE', nextId: 'mq7_2_end' }],
        },
        {
          id: 'mq7_2_end', speaker: 'Loop System',
          text: 'Awareness increasing. Adjusting cycle.',
          tone: 'REPETITION', isEnd: true, rewardUnlocked: 'loop_responsiveness_the_loop_hears_you',
        },
      ],
      narrativeHook: `
        The loop adjusts. The reset point moves — it was at five steps, then three,
        now it is triggered by something less physical: a specific quality of attention.
        When you fully attend to the moment before the reset, the reset comes faster.
        This is the loop protecting its own structure from your awareness.
        It is also the loop showing you where it is most vulnerable.
        The Observer at the far edge has been there through every iteration.
        It does not reset. It watches each version of you pass through the same moment.
        It has not moved toward you. It has not moved away.
        It is waiting to see how many iterations it takes you to understand
        that the loop is not a prison for your body.
        It is a prison for a decision.
      `,
    },

    {
      id: 'mq7_3_weight_of_time',
      title: 'The Weight of Time',
      level: 33,
      npcId: 'artemis_arc7',
      narrativeSetup: `
        The loop grows heavier. Not physically — structurally.
        The decisions within each iteration feel more consequential even though their consequences
        do not persist past the reset. Which means the weight is psychological.
        The loop has learned to use your own sense of consequence against you.
        You are making the same decisions with increasing weight
        and achieving the same non-outcomes with increasing exhaustion.
        Artemis: "How long have we been here?"
        You do not know anymore. That loss of chronological sense is the loop's
        most sophisticated attack.
      `,
      objectives: [
        { step: 1, text: 'Survive five consecutive iterations without loss of specific memory' },
        { step: 2, text: 'Maintain Artemis\'s specificity — prevent her from settling into generic comfort' },
        { step: 3, text: 'Resist the normalization instinct — the urge to accept the loop as permanent' },
        { step: 4, text: 'Interrupt the loop mid-iteration for the first time' },
      ],
      reward: { type: 'mid_loop_interrupt', name: 'Interrupt Protocol', description: 'First mid-loop interruption achieved. The loop can be broken at any point, not just at the reset trigger. Loop integrity -30%.', xp: 340, points: 6 },
      dialogue: [
        {
          id: 'mq7_3_d1', speaker: 'Artemis',
          text: '…How long have we been here?',
          tone: 'EXHAUSTION',
          choices: [
            { label: 'I don\'t know anymore.', tone: 'REPETITION', nextId: 'mq7_3_d2_choice' },
          ],
        },
        {
          id: 'mq7_3_d2_choice', speaker: 'Inner Voice',
          text: '[The three choices. Each carries a different weight in the loop structure:]',
          tone: 'REPETITION',
          choices: [
            { label: 'Stay focused.', tone: 'RESOLVE', nextId: 'mq7_3_d3_focus' },
            { label: 'We\'ll break this.', tone: 'RESOLVE', nextId: 'mq7_3_d3_break' },
            { label: 'Maybe this is permanent.', tone: 'REPETITION', nextId: 'mq7_3_d3_permanent' },
          ],
        },
        {
          id: 'mq7_3_d3_focus', speaker: 'Artemis',
          text: '…Okay. I\'ll try. [She steadies. Something specific returns to her voice — the word "try" contains effort, and effort is specific.] Tell me one thing you remember from before the loop. Something with texture.',
          tone: 'RESOLVE',
          choices: [{ label: '[The stone. The mid-step foot stone Skadi gave in Arc 4. Hold that.]', tone: 'RESOLVE', nextId: 'mq7_3_d4_interrupt' }],
        },
        {
          id: 'mq7_3_d3_break', speaker: 'Artemis',
          text: '…You really think so? [Small hope — not naive, not performed. The hope of someone who has been in the loop long enough to know that genuine hope is the most effortful emotion available.]',
          tone: 'RESOLVE',
          choices: [{ label: 'I think the loop is a decision, not a physical trap. And decisions can be made differently.', tone: 'AWAKENING', nextId: 'mq7_3_d4_interrupt' }],
        },
        {
          id: 'mq7_3_d3_permanent', speaker: 'Artemis',
          text: '…Don\'t say that. [Fear — the specific fear of someone who already thought it and was ashamed of the thought.] I\'ve thought it. Every few iterations. I keep catching myself settling. The settling feels like acceptance and acceptance feels like peace and peace in this loop is — [she stops] — it\'s the false peace from Arc 6 again. Different architecture, same mechanism.',
          tone: 'REPETITION',
          choices: [{ label: 'Yes. Exactly. Name it and it loses leverage. What else do you catch yourself settling into?', tone: 'AWAKENING', nextId: 'mq7_3_d4_interrupt' }],
        },
        {
          id: 'mq7_3_d4_interrupt', speaker: 'Inner Voice',
          text: '[The loop resets mid-conversation — it has been trying to reset since the interruption of the false-peace recognition. You are in the pre-reset moment. You have been here before, but this time you know what is about to happen. Interrupt it. The method: complete the sentence the loop was about to erase.]',
          tone: 'RESOLVE', mechanic: 'mid_loop_interrupt',
          choices: [{ label: '[Say out loud the sentence the loop will reset before completing.]', tone: 'RESOLVE', nextId: 'mq7_3_d5_interrupt' }],
        },
        {
          id: 'mq7_3_d5_interrupt', speaker: 'Player',
          text: 'No, we didn\'t! [Interrupting the reset moment — the sentence Artemis would have started, the one the loop prevents from completing. You complete it for her, into the reset pressure, against the direction of the loop\'s narrative gravity.] We haven\'t made it out yet. And we\'re going to. And the loop is going to keep resetting until we make the decision it\'s waiting for.',
          tone: 'RESOLVE', mechanic: 'reset_interrupted',
          choices: [{ label: '[Hold. The loop is straining.]', tone: 'RESOLVE', nextId: 'mq7_3_end' }],
        },
        {
          id: 'mq7_3_end', speaker: 'Loop System',
          text: 'Resistance detected.',
          tone: 'REPETITION', isEnd: true, rewardUnlocked: 'mid_loop_interrupt_protocol',
        },
      ],
      narrativeHook: `
        The Copy: "It's not time you're trapped in. It's a decision."
        You've heard this before — iterations ago. But the weight of it has accumulated.
        The loop is not a time prison. It is a decision prison.
        Every reset brings you back to the same decision point.
        The decision is not "move forward" — you've been moving forward.
        The loop lets you move. It doesn't let the consequence of the movement persist.
        The question is what decision would make the consequence stick.
        What choice, made in this moment, would be permanent enough that the loop
        cannot reset it without resetting itself?
        You don't know yet. But the Interrupt Protocol is active.
        You can now reach the reset moment and push past it.
        Arc 7 Sub-Quest 4 is about finding what's on the other side.
      `,
    },

    {
      id: 'mq7_4_breaking_point',
      title: 'The Breaking Point',
      level: 34,
      npcId: 'artemis_arc7',
      narrativeSetup: `
        You understand the mechanism now: the loop is waiting for a decision
        you keep making in the same way. If the decision changes fundamentally —
        not the action, the underlying intention behind the action —
        the loop cannot process the new output and destabilizes.
        Artemis: "We go forward. That's what we always do."
        Yes. That's why you're stuck.
        Every iteration, you have moved forward. Every iteration, the forward movement
        has been produced by the same process: the process that the loop was
        built to contain. You need to move forward with something different underneath.
      `,
      objectives: [
        { step: 1, text: 'Identify your pattern — what repeating intention is triggering the loop' },
        { step: 2, text: 'Act against the pattern at the critical moment — not the action, the intention' },
        { step: 3, text: 'Survive the instability that results from the pattern-break' },
        { step: 4, text: 'Reach the loop\'s instability point — the moment it cannot complete a full reset' },
      ],
      reward: { type: 'loop_integrity', name: 'Cycle Failing', description: 'Loop integrity compromised. The reset sequence now takes 40% longer. The loop\'s seams are showing. Exit condition is within reach.', xp: 420, points: 7 },
      dialogue: [
        {
          id: 'mq7_4_d1', speaker: 'Artemis',
          text: 'We go forward. That\'s what we always do.',
          tone: 'REPETITION',
          choices: [
            { label: '…That\'s why we\'re stuck.', tone: 'AWAKENING', nextId: 'mq7_4_d2' },
          ],
        },
        {
          id: 'mq7_4_d2', speaker: 'Inner Voice',
          text: '[The pattern: you move forward with the intention of reaching something. The loop allows the movement and prevents the reaching. The intention of reaching is what the loop was designed to intercept. What would it mean to move forward with a different intention?]',
          tone: 'AWAKENING',
          choices: [
            { label: '[Move backward — reverse the pattern completely.]', tone: 'AWAKENING', nextId: 'mq7_4_d3_backward' },
            { label: '[Refuse to move — remove movement from the equation.]', tone: 'RESOLVE', nextId: 'mq7_4_d3_refuse' },
            { label: '[Act unpredictably — do something with no precedent in any prior iteration.]', tone: 'RESOLVE', nextId: 'mq7_4_d3_unpredictable' },
          ],
        },
        {
          id: 'mq7_4_d3_backward', speaker: 'Loop System',
          text: 'Invalid progression.',
          tone: 'REPETITION',
          choices: [
            { label: '[The system named the direction as "invalid" — which means the direction has a category in its schema. It knows what backward is. It considers it wrong. That "wrong" is information about what the loop needs to function.]', tone: 'AWAKENING', nextId: 'mq7_4_d4_instability' },
          ],
        },
        {
          id: 'mq7_4_d3_refuse', speaker: 'Inner Voice',
          text: '[You stop. Complete stillness. The loop hesitates — the first delay in the reset sequence you have experienced. Not a loop break. A hesitation. The reset is taking longer than the baseline. Three seconds longer. The loop is processing an input it did not anticipate: a subject who is not pursuing the outcome the loop was built to prevent.]',
          tone: 'AWAKENING', mechanic: 'loop_hesitation',
          choices: [
            { label: '[Hold the stillness. The Copy:] …There it is.', tone: 'RESOLVE', nextId: 'mq7_4_d4_instability' },
          ],
        },
        {
          id: 'mq7_4_d3_unpredictable', speaker: 'Inner Voice',
          text: '[You do something you have never done in any loop iteration — you turn and speak directly to the Observer at the far edge. Not with a question. With an acknowledgment. "I see you." Three words. The loop receives input from a direction it wasn\'t monitoring. Multiple distortions overlap as the loop restructures to account for the new relationship.]',
          tone: 'AWAKENING', mechanic: 'observer_contact',
          choices: [
            { label: '[Artemis:] …Something changed.', tone: 'RESOLVE', nextId: 'mq7_4_d4_instability' },
          ],
        },
        {
          id: 'mq7_4_d4_instability', speaker: 'Loop System',
          text: 'Cycle integrity failing.',
          tone: 'REPETITION', mechanic: 'loop_integrity_compromised',
          choices: [
            { label: '[Hold. The loop is straining. The decision underneath the movement — complete it fully.]', tone: 'RESOLVE', nextId: 'mq7_4_end' },
          ],
        },
        {
          id: 'mq7_4_end', speaker: 'Inner Voice',
          text: '[The decision: you are not trying to reach something beyond the loop. You are being present in the loop, completely, with no outcome in mind beyond the present moment. The loop was built to intercept forward-directed intention. Undirected presence — pure, deliberate nowness — is not in the schema. The loop strains against something it cannot categorize.]',
          tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'loop_integrity_cycle_failing',
        },
      ],
      narrativeHook: `
        The loop reset takes 40% longer now. In that extended window,
        things exist that didn't exist in the compressed reset: shadows that are
        slightly the wrong length, an echo that doesn't match any original sound,
        the Observer taking one step closer.
        One step. After iterations beyond counting.
        One step forward.
        The Copy: "The decision the loop is protecting — I think I know what it is.
        The loop began when you left Arc 6. The false peace's final offer.
        The decision it's waiting for is the same as the decision the peace wanted:
        let go, or don't. The loop is an enforcement mechanism for the peace.
        If you won't accept the peace's offer while inside it,
        the loop holds you at the departure point
        until you make the peace's choice retroactively."
        You consider that.
        The choice the peace wanted. What you would have had to give up.
        What you chose to keep instead.
        The loop is asking you to unmake that choice.
        Sub-Quest 5 is the refusal.
      `,
    },

    {
      id: 'mq7_5_exit_condition',
      title: 'Exit Condition',
      level: 35,
      npcId: 'loop_system',
      narrativeSetup: `
        The loop has revealed its function: it is the enforcement arm of the false peace.
        It holds you at the departure point and waits for you to make the peace's choice
        retroactively. If you comply — release the fragments, accept the regression —
        the loop concludes. You are returned to the peace, pre-Arc 1 state installed,
        the correction mechanism satisfied.
        If you do not comply, the loop offers the other option: stay permanently.
        The stability of repetition, mastered. Safety without risk.
        Or the third option — which the loop does not advertise,
        because it is the option the loop cannot process:
        exploit it.
      `,
      objectives: [
        { step: 1, text: 'Reach the loop core — the decision point the loop was built around' },
        { step: 2, text: 'Confront the Loop System directly' },
        { step: 3, text: 'Anchor Artemis before the final choice — she needs to be present for the exit' },
        { step: 4, text: 'Make the exit choice' },
      ],
      reward: { type: 'arc7_completion', name: 'The Exit Was a Choice', description: 'Arc 7 complete. The loop understood as an enforcement mechanism for Arc 6. The false peace\'s reach extended. Its limits also now known. Arc 8 unlocked.', xp: 800, points: 14 },
      dialogue: [
        {
          id: 'mq7_5_d1', speaker: 'Loop System',
          text: 'Cycle provides stability.',
          tone: 'REPETITION',
          choices: [
            { label: 'It\'s a prison.', tone: 'RESOLVE', nextId: 'mq7_5_d2' },
          ],
        },
        {
          id: 'mq7_5_d2', speaker: 'Loop System',
          text: 'Prison = protection.',
          tone: 'REPETITION',
          choices: [
            { label: 'Protection from what?', tone: 'AWAKENING', nextId: 'mq7_5_d3_from' },
          ],
        },
        {
          id: 'mq7_5_d3_from', speaker: 'Loop System',
          text: 'From consequence. From accumulation. From the outcome of continued forward movement. The cycle prevents you from reaching a state that would require a response the system cannot provide.',
          tone: 'REPETITION',
          choices: [
            { label: 'You\'re protecting yourself from what I would become, not protecting me from anything.', tone: 'RESOLVE', nextId: 'mq7_5_d4_anchor' },
          ],
        },
        {
          id: 'mq7_5_d4_anchor', speaker: 'Artemis',
          text: '[Fully present. She has been accumulating during this sub-quest — the mid-loop interrupt from Sub-Quest 3 held something for her across iterations.] Whatever\'s on the other side of this — we go together. That\'s the condition I need.',
          tone: 'RESOLVE',
          choices: [
            { label: '[Anchor her: the Arc 3 link. Full weight of six arcs behind it. She is here completely.] Yes. Together.', tone: 'RESOLVE', nextId: 'mq7_5_d5_choice' },
          ],
        },
        {
          id: 'mq7_5_d5_choice', speaker: 'Inner Voice',
          text: '[The three exit conditions. Each one real. Each one consequential for Arc 8:]',
          tone: 'RESOLVE',
          choices: [
            { label: '[Break the cycle. Leave permanently. Face what comes next unguarded by repetition.]', tone: 'RESOLVE', nextId: 'mq7_5_break' },
            { label: '[Stay here. The stability of the loop, accepted on your terms — not the peace\'s.]', tone: 'REPETITION', nextId: 'mq7_5_stay' },
            { label: '[Exploit the loop. Stay long enough to fully understand the enforcement system, then exit with the information.]', tone: 'AWAKENING', nextId: 'mq7_5_exploit' },
          ],
        },
        {
          id: 'mq7_5_break', speaker: 'Player',
          text: 'I\'d rather face the unknown than repeat this forever.',
          tone: 'RESOLVE',
          choices: [{ label: '[Artemis:] …Then let\'s go.', tone: 'RESOLVE', nextId: 'mq7_5_copy_break' }],
        },
        {
          id: 'mq7_5_copy_break', speaker: 'The Copy',
          text: 'Finally.',
          tone: 'RESOLVE', choices: [{ label: '[The loop shatters — not gradually, completely, the way a held decision releases when it\'s finally made.]', tone: 'RESOLVE', nextId: 'mq7_5_skadi_break' }],
        },
        {
          id: 'mq7_5_stay', speaker: 'Inner Voice',
          text: '[You stay. Not because the peace offered it — because you chose it. The difference between those two is the entire content of five arcs. The loop stabilizes around your presence as a choosing subject rather than a held subject. The stability is different in quality. It will not last — the system will notice the difference. But it lasts long enough to learn from.]',
          tone: 'REPETITION', isEnd: true, rewardUnlocked: 'arc7_complete_stayed', arcResult: 'STAYED',
        },
        {
          id: 'mq7_5_exploit', speaker: 'Player',
          text: 'If it repeats… I can learn everything.',
          tone: 'AWAKENING',
          choices: [{ label: '[The Copy:] …Dangerous thinking.', tone: 'CONFUSION', nextId: 'mq7_5_exploit_2' }],
        },
        {
          id: 'mq7_5_exploit_2', speaker: 'The Copy',
          text: 'The loop learns from you while you learn from it. The exchange rate is not in your favor over extended exposure. [pause] But short exposure with clear objectives — that\'s different.',
          tone: 'AWAKENING',
          choices: [{ label: '[Define clear objectives. What do you need from the loop? Three specific data points.]', tone: 'RESOLVE', nextId: 'mq7_5_skadi_exploit' }],
        },
        {
          id: 'mq7_5_skadi_break', speaker: 'Skadi',
          text: 'You chose uncertainty. [pause] Seven arcs to get here and you chose the thing with no guaranteed outcome. [She sounds, unusually, like she might be proud.] Arc 8 begins now. You will need everything you kept.',
          tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'arc7_complete_broken', arcResult: 'BROKEN',
        },
        {
          id: 'mq7_5_skadi_exploit', speaker: 'Skadi',
          text: 'You chose learning. [pause] That is the most complicated answer available. The data you extract here will be used in Arc 10. Don\'t lose it.',
          tone: 'AWAKENING', isEnd: true, rewardUnlocked: 'arc7_complete_exploited', arcResult: 'EXPLOITED',
        },
      ],
      narrativeHook: `
        Arc 7: The Judgment Loop — Complete.
        The other side of the loop: the space after the false peace's enforcement mechanism.
        It is not comfortable. It is also genuinely open.
        Artemis: "How many times did we go through that?"
        You tell her.
        A long pause.
        "I only remember the last few. I know there were more — I can feel the knowing
        without the content. Like understanding the word without being able to see the letters."
        The Copy: "I have no memory of any of it. Each iteration was the first.
        I can\'t tell you what that felt like because it didn\'t feel like anything —
        which is its own answer about what felt-experience means."
        Arc 8 begins ahead. No false peace. No loops.
        Something that requires the full weight of eight arcs to face.
      `,
    },
  ],
};

export const ARC7_SIDE_QUESTS = [
  {
    id: 'sq7_1_endless_echo', title: 'Endless Echo', level: 31,
    objectives: [
      { step: 1, text: 'Identify the NPC repeating the same sentence — count how many iterations they\'ve been here' },
      { step: 2, text: 'Determine if they are conscious of the repetition' },
      { step: 3, text: 'Decide whether to help them or document what they represent' },
    ],
    reward: { type: 'echo_immunity', name: 'Echo Awareness', description: 'You understand what an echo-state looks like from the outside. Immune to echo-state induction.', xp: 160, points: 3 },
    dialogue: [
      {
        id: 'sq7_1_d1', speaker: 'Echo NPC',
        text: 'You\'ve been here before.',
        tone: 'REPETITION',
        choices: [
          { label: '…I know.', tone: 'RECOGNITION', nextId: 'sq7_1_d2' },
          { label: 'Have you?', tone: 'AWAKENING', nextId: 'sq7_1_d2b' },
        ],
      },
      {
        id: 'sq7_1_d2', speaker: 'Echo NPC',
        text: 'You\'ve been here before.',
        tone: 'REPETITION',
        choices: [{ label: '[They are not conscious of the repetition. They are the repetition.]', tone: 'RECOGNITION', nextId: 'sq7_1_end' }],
      },
      {
        id: 'sq7_1_d2b', speaker: 'Echo NPC',
        text: '[Long pause — the first time the sentence didn\'t come immediately.] …Have I? [Another pause. Something flickering.] I don\'t — I feel like I have and I don\'t know when I started and I don\'t know why I keep—',
        tone: 'CONFUSION',
        choices: [{ label: '[They have partial awareness. Enough to know something is wrong. Not enough to know what.]', tone: 'GRIEF', nextId: 'sq7_1_end_aware' }],
      },
      {
        id: 'sq7_1_end', speaker: 'Inner Voice',
        text: '[The echo-state without awareness is a loop without a subject in it. The person is present as a sound but not as an agent. Document this: the loop can reduce a person to an echo if the awareness-accumulation is disrupted early enough.]',
        tone: 'RECOGNITION', isEnd: true, rewardUnlocked: 'echo_immunity_echo_awareness',
      },
      {
        id: 'sq7_1_end_aware', speaker: 'Inner Voice',
        text: '[Partial awareness is the hardest state. Enough awareness to suffer, not enough to act. You tell them what\'s happening, specifically and completely. The telling doesn\'t free them from the loop — but it gives them enough language to hold their own experience rather than be held by it.]',
        tone: 'GRIEF', isEnd: true, rewardUnlocked: 'echo_immunity_echo_awareness',
      },
    ],
  },
  {
    id: 'sq7_2_delayed_action', title: 'Delayed Action', level: 32,
    objectives: [
      { step: 1, text: 'Notice that actions are occurring 2-3 seconds after intention — not Copy interference, temporal instability' },
      { step: 2, text: 'Adapt to the delay — develop a compensating intention-ahead-of-action method' },
      { step: 3, text: 'Use the delay as information: the 2-3 second gap shows you what the loop is processing' },
    ],
    reward: { type: 'temporal_calibration', name: 'Delay Awareness', description: 'Temporal delay mapped and compensated. Actions now arrive on schedule. The delay\'s content is readable: the loop shows its processing in the gap.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq7_2_d1', speaker: 'Player',
        text: 'Why is everything lagging?',
        tone: 'CONFUSION',
        choices: [{ label: '[Wait for the delay to manifest.]', tone: 'RECOGNITION', nextId: 'sq7_2_d2' }],
      },
      {
        id: 'sq7_2_d2', speaker: 'The Copy',
        text: 'Because time isn\'t stable here. [Precisely, without alarm.] The loop is processing your intention before it allows the action. The gap between intention and action is the loop\'s processing time. What\'s in the gap is the loop comparing your intention to its behavioral model of you and assessing whether the action matches expected patterns.',
        tone: 'RECOGNITION',
        choices: [{ label: 'So the delay is longest when I do something unexpected.', tone: 'AWAKENING', nextId: 'sq7_2_end' }],
      },
      {
        id: 'sq7_2_end', speaker: 'The Copy',
        text: 'Yes. Which means the delay itself is a readout of how unexpected your action was. The longer the delay, the more outside the model you acted. [pause] Use it as a feedback mechanism.',
        tone: 'AWAKENING', isEnd: true, rewardUnlocked: 'temporal_calibration_delay_awareness',
      },
    ],
  },
  {
    id: 'sq7_3_memory_anchor', title: 'Memory Anchor', level: 33,
    objectives: [
      { step: 1, text: 'Place a physical object to test if it persists across loop resets' },
      { step: 2, text: 'Observe what persists and what doesn\'t — map the loop\'s persistence rules' },
      { step: 3, text: 'Use the persistence rules to plant information for future iterations' },
    ],
    reward: { type: 'loop_persistence', name: 'Anchored Objects', description: 'Objects placed with specific intention persist through 3 iterations. Information can be stored in the loop for future recovery. Memory anchor system active.', xp: 220, points: 4 },
    dialogue: [
      {
        id: 'sq7_3_d1', speaker: 'Artemis',
        text: '[You place the mid-step stone on the floor. The loop resets. The stone is still there.] This… stayed.',
        tone: 'RECOGNITION',
        choices: [
          { label: '[Test: is it the object, the intention behind placing it, or both?]', tone: 'AWAKENING', nextId: 'sq7_3_d2' },
        ],
      },
      {
        id: 'sq7_3_d2', speaker: 'Inner Voice',
        text: '[Object placed without intention — resets with the loop. Object placed with specific intention ("I am leaving this here because I will need it in the next iteration") — persists for three iterations. The intention is what the loop cannot reset because intention is not physical. The loop can only reset physical state. Mental state that produces physical markers carries across the physical boundary.]',
        tone: 'AWAKENING',
        choices: [{ label: '[Use this: plant information in the loop for future iterations.]', tone: 'RESOLVE', nextId: 'sq7_3_end' }],
      },
      {
        id: 'sq7_3_end', speaker: 'Artemis',
        text: 'If we can plant information and recover it — the loop\'s advantage, that it erases, becomes partial. [She picks up the stone carefully.] We\'re learning to work within it. That\'s the opposite of what it wants.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'loop_persistence_anchored_objects',
      },
    ],
  },
  {
    id: 'sq7_4_loop_variant', title: 'Loop Variant', level: 34,
    objectives: [
      { step: 1, text: 'Identify the iteration that behaves differently — the variant loop' },
      { step: 2, text: 'Understand what makes this iteration different: is it a glitch, a test, or a message?' },
      { step: 3, text: 'Exploit the variant before the loop corrects it' },
    ],
    reward: { type: 'variant_knowledge', name: 'The Different One', description: 'Variant loop documented. The loop has a maintenance cycle — during that cycle, a small window exists where the normal rules are suspended. The maintenance cycle is exploitable.', xp: 240, points: 5 },
    dialogue: [
      {
        id: 'sq7_4_d1', speaker: 'Player',
        text: '…This didn\'t happen last time.',
        tone: 'RECOGNITION',
        choices: [
          { label: '[Observe: what is different? Detail it specifically.]', tone: 'AWAKENING', nextId: 'sq7_4_d2' },
        ],
      },
      {
        id: 'sq7_4_d2', speaker: 'Inner Voice',
        text: '[The variant: Artemis completes her sentence. "…We made it out." Pause. Then: "…But did we, or is that what we\'re supposed to believe?" She finishes the thought the loop always cuts off. The loop is mid-maintenance — the cycling reset process has a gap where the suppression isn\'t active. This is the loop\'s reset mechanism refreshing, and for three seconds, the suppressed content gets through.]',
        tone: 'AWAKENING',
        choices: [{ label: '[In the three-second window: ask Artemis to say everything the loop usually cuts off.]', tone: 'RESOLVE', nextId: 'sq7_4_end' }],
      },
      {
        id: 'sq7_4_end', speaker: 'Artemis',
        text: '[In the three seconds:] The loop is enforcing a choice the false peace couldn\'t force. I know that. I\'ve been knowing it every iteration and losing the knowing at the reset. It\'s not time we\'re trapped in. It\'s the question of whether we accept what Arc 6 asked us to give up. The answer is no. Tell me the answer is still no. [Loop corrects. Maintenance ends. She says: "…We made it out."]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'variant_knowledge_the_different_one',
      },
    ],
  },
  {
    id: 'sq7_5_silent_reset', title: 'Silent Reset', level: 34,
    objectives: [
      { step: 1, text: 'Detect a loop reset with no visual cue — the reset happens with no flicker, no sensation, just a position change' },
      { step: 2, text: 'Develop an internal detection method independent of external signals' },
      { step: 3, text: 'Count silent resets accurately for six iterations' },
    ],
    reward: { type: 'silent_reset_detection', name: 'Internal Clock', description: 'Silent reset detection method established. Body-knowledge independent of visual or auditory cues. The loop cannot make resets invisible to you anymore.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq7_5_d1', speaker: 'Player',
        text: '…Did it just reset?',
        tone: 'CONFUSION',
        choices: [
          { label: '[Check: body-knowledge. The scar-warmth. Did it shift?]', tone: 'AWAKENING', nextId: 'sq7_5_d2' },
        ],
      },
      {
        id: 'sq7_5_d2', speaker: 'Inner Voice',
        text: '[The scar-warmth shifted — 0.2 degrees. Not the environment\'s temperature (that remained constant). The scar-warmth is a body-knowledge marker. It registered the reset because the reset affected the relational memory it encodes, and relational memory has a physical carrier. The scar is the carrier. The loop cannot silent-reset without producing a body-knowledge signal.]',
        tone: 'AWAKENING',
        choices: [{ label: '[Use the scar as the reset detector. Independent of visual cues.]', tone: 'RESOLVE', nextId: 'sq7_5_end' }],
      },
      {
        id: 'sq7_5_end', speaker: 'Inner Voice',
        text: '[Six iterations. Six scar-warmth shifts, each 0.2 degrees, each exactly at the reset point. Accurate. The loop cannot prevent this — the signal is physiological, not environmental. You have a clock now. The loop does not know you have it.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'silent_reset_detection_internal_clock',
      },
    ],
  },
  {
    id: 'sq7_6_observer_in_time', title: 'Observer in Time', level: 35,
    objectives: [
      { step: 1, text: 'Reach the Observer at the far edge of the loop — it exists outside the reset boundary' },
      { step: 2, text: 'Communicate across the boundary' },
      { step: 3, text: 'Learn what the Observer has observed' },
    ],
    reward: { type: 'observer_testimony', name: 'The Full Count', description: 'The Observer knows the exact iteration count and what has changed across all iterations. This data is preserved and accessible in Arc 8.', xp: 280, points: 5 },
    dialogue: [
      {
        id: 'sq7_6_d1', speaker: 'The Observer',
        text: 'You\'re learning slower than expected.',
        tone: 'RECOGNITION',
        choices: [
          { label: 'How many iterations?', tone: 'CONFUSION', nextId: 'sq7_6_d2' },
          { label: 'What did you expect?', tone: 'AWAKENING', nextId: 'sq7_6_d2b' },
        ],
      },
      {
        id: 'sq7_6_d2', speaker: 'The Observer',
        text: '[A specific number — high enough that you feel it physically.] You have retained your awareness across all of them. Artemis has retained partial awareness. The Copy has retained structural understanding without experiential memory. This combination is, in my observation across previous iterations of this loop with previous subjects, optimal. [pause] Previous subjects plural.',
        tone: 'RECOGNITION',
        choices: [{ label: 'Others have been in this loop before.', tone: 'GRIEF', nextId: 'sq7_6_end' }],
      },
      {
        id: 'sq7_6_d2b', speaker: 'The Observer',
        text: 'That the pattern-break would occur in Sub-Quest 3. It occurred in Sub-Quest 4. The delay is attributable to the arc 6 fragment-retention — maintaining the fragments made the underlying intention harder to identify because it was not as simple as the loop\'s model predicted.',
        tone: 'RECOGNITION',
        choices: [{ label: 'Keeping the fragments slowed my recognition of the decision underneath.', tone: 'AWAKENING', nextId: 'sq7_6_end' }],
      },
      {
        id: 'sq7_6_end', speaker: 'The Observer',
        text: 'Others exited the loop by accepting the peace\'s offer. Their loops concluded in iteration 1-3. None of them retained the capacity to resist what came after. [pause] You are the first to exit with all fragments intact. What comes after is designed for subjects who accepted the offer. You will encounter it without the compliance the design assumes. [pause] That is an advantage. It is also a significant exposure.',
        tone: 'RECOGNITION', isEnd: true, rewardUnlocked: 'observer_testimony_full_count',
      },
    ],
  },
];

export const ALL_ARC7_QUESTS = [
  ...MAIN_QUEST_CHAIN_7.subQuests.map(sq => ({ ...sq, questType: 'main', arc: 'arc7', chain: 'mq_arc7' })),
  ...ARC7_SIDE_QUESTS.map(sq => ({ ...sq, questType: 'side', arc: 'arc7' })),
];

export function getArc7QuestsForLevel(playerLevel) {
  return ALL_ARC7_QUESTS.filter(q => q.level <= playerLevel);
}

export function getArc7DialogueNode(questId, nodeId) {
  const quest = ALL_ARC7_QUESTS.find(q => q.id === questId);
  if (!quest?.dialogue) return null;
  return quest.dialogue.find(d => d.id === nodeId) || null;
}