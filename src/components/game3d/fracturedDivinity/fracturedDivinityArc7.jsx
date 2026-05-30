// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 7: "The Judgment Loop"
// Quest chain: Levels 31–35
// Main Quest 7: "Eternal Return" (5 sub-quests) + 6 Side Quests
// Tone tags: OPPRESSION | REPETITION | AWAKENING | DREAD | CLARITY | RESOLVE
// Loop notation: [LOOP N] marks iteration number within a cycle
// ─────────────────────────────────────────────────────────────────────────────

export const ARC7_NPCS = [
  {
    id: 'artemis_arc7',
    name: 'Artemis',
    description: 'She resets with the loop — each cycle, she begins again at the same sentence. She does not accumulate loop-memory the way you do. That gap between you is the loneliest part of Arc 7.',
    tint: 0x1a1a3a,
  },
  {
    id: 'copy_arc7',
    name: 'The Copy',
    description: 'It partially retains loop memory — more than Artemis, less than you. It is the first to see the loop\'s structure. It is also, sometimes, the one most tempted to stay inside it.',
    tint: 0x2a2a3a,
  },
  {
    id: 'system_voice_arc7',
    name: 'System Voice',
    description: 'The operator of the loop. It does not experience the loop — it administers it. That distinction matters: the administrator believes the loop serves a purpose. It is not lying when it says so.',
    tint: 0x0a0a1a,
  },
  {
    id: 'observer_time',
    name: 'The Observer (Time)',
    description: 'Exists outside the loop. Has been watching every iteration. It has information about the total cycle count that you don\'t. It will share some of it. Not all.',
    tint: 0x0a1a0a,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QUEST 7 — "Eternal Return"
// ═══════════════════════════════════════════════════════════════════════════════
export const MAIN_QUEST_CHAIN_7 = {
  id: 'mq_arc7',
  title: 'Eternal Return',
  arc: 'Arc 7: The Judgment Loop',
  description: 'The loop is not punishment. The System Voice is clear about this: it is a stabilization mechanism. The Arc 5 core zone created a decision instability that the system resolved by looping the moment before the decision — holding you at the threshold until a stable choice can be registered. You have been at this threshold for longer than you know. Awareness is the only variable the loop did not account for.',
  subQuests: [

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 1 — "The Reset"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq7_1_the_reset',
      title: 'The Reset',
      level: 31,
      npcId: 'artemis_arc7',
      narrativeSetup: `
        You step forward and everything snaps back.
        Not gradually — immediately. The way a door closes. The way a breath ends.
        You are in the same place you were five steps ago. Artemis is beside you
        saying the same thing she said five steps ago. The light is exactly the same.
        Your left foot is in exactly the same position.
        The snap was complete. If you didn't know it happened — if you hadn't carried
        the five steps in your body — you would not know it happened.
        But you do know. Your body has the memory of five steps.
        The environment has the memory of none.
      `,
      objectives: [
        { step: 1, text: '[LOOP 1] Move forward — observe the first reset trigger at step 5' },
        { step: 2, text: '[LOOP 2] Identify what Artemis says at the moment of reset' },
        { step: 3, text: '[LOOP 3] Attempt to speak before the reset triggers — change a dialogue beat' },
        { step: 4, text: 'Hear the Copy\'s warning and the System Voice confirmation' },
      ],
      reward: {
        type: 'loop_awareness',
        name: 'First Loop Memory',
        description: 'You carry the memory of Loop 1 forward. Loop iteration counter active. Each subsequent loop, you retain one additional detail.',
        xp: 200, points: 4,
      },
      dialogue: [
        {
          id: 'mq7_1_d1_first',
          speaker: 'Artemis',
          text: '…We made it out.',
          tone: 'FALSE_CLARITY',
          loopIteration: 1,
          choices: [{ label: '[Walk forward. Count steps.]', tone: 'RESOLVE', nextId: 'mq7_1_d1_walk' }],
        },
        {
          id: 'mq7_1_d1_walk',
          speaker: 'Inner Voice',
          text: '[Step 1. Step 2. Step 3. Step 4. Step 5 — ] ',
          tone: 'OPPRESSION',
          mechanic: 'loop_reset',
          choices: [{ label: '[RESET. You are back. Artemis is saying the opening line.]', tone: 'DREAD', nextId: 'mq7_1_d2_loop2' }],
        },
        {
          id: 'mq7_1_d2_loop2',
          speaker: 'Artemis',
          text: '…We made it out.',
          tone: 'FALSE_CLARITY',
          loopIteration: 2,
          choices: [
            { label: '…Did we?', tone: 'DREAD', nextId: 'mq7_1_d2b' },
            { label: '[Stay silent. Wait for the reset.]', tone: 'OPPRESSION', nextId: 'mq7_1_d2_silent' },
            { label: '[Walk a different direction — not forward.]', tone: 'RESOLVE', nextId: 'mq7_1_d2_different' },
          ],
        },
        {
          id: 'mq7_1_d2b',
          speaker: 'Artemis',
          text: '…What do you mean?',
          tone: 'CONFUSION',
          choices: [{ label: 'You said that already. We walked. Something reset.', tone: 'DREAD', nextId: 'mq7_1_d2c_denial' }],
        },
        {
          id: 'mq7_1_d2c_denial',
          speaker: 'Artemis',
          text: '…No, I — [She looks at where she was standing. The position is exactly the same as the last time she said this. She can feel the wrongness but she has no iteration-memory to confirm it.] I just said it once.',
          tone: 'CONFUSION',
          choices: [{ label: '[Note: she does not retain the loop. You do.]', tone: 'DREAD', nextId: 'mq7_1_d3_copy' }],
        },
        {
          id: 'mq7_1_d2_silent',
          speaker: 'Inner Voice',
          text: '[Silence. Five seconds. Ten. The loop does not trigger. The loop requires forward motion. Without the trigger movement, the cycle holds. Artemis stands still beside you, saying nothing after the opening line because you haven\'t engaged with it.]',
          tone: 'OPPRESSION',
          choices: [{ label: '[Still standing. The loop is tied to the forward step. If you don\'t step — it doesn\'t reset.]', tone: 'AWAKENING', nextId: 'mq7_1_d3_copy' }],
        },
        {
          id: 'mq7_1_d2_different',
          speaker: 'Inner Voice',
          text: '[You turn right instead of forward. Three steps. The reset triggers immediately — faster than at step 5 forward. The loop\'s reset radius is smaller to the sides than forward. The forward path is the primary trigger. Lateral movement is the secondary trigger. The loop enforces direction.]',
          tone: 'DREAD',
          mechanic: 'loop_reset_fast',
          choices: [{ label: '[RESET. Information: lateral movement triggers faster. The loop enforces the forward path.]', tone: 'AWAKENING', nextId: 'mq7_1_d3_copy' }],
        },
        {
          id: 'mq7_1_d3_copy',
          speaker: 'The Copy',
          text: '[Faint — just barely audible, from the edge of your own inner-voice space.] Not like this.',
          tone: 'DREAD',
          choices: [{ label: 'What do you mean?', tone: 'CONFUSION', nextId: 'mq7_1_d4_system' }],
        },
        {
          id: 'mq7_1_d4_system',
          speaker: 'System Voice',
          text: 'Cycle initiated.',
          tone: 'FALSE_CLARITY',
          isEnd: true,
          rewardUnlocked: 'loop_awareness_first_loop_memory',
        },
      ],
      narrativeHook: `
        The System Voice said "Cycle initiated" as if it were a beginning.
        But you know you are already inside it.
        "Initiated" is what the system says every time you first notice.
        The Copy carries more loop-memory than Artemis does.
        That means it has been here before — that the Copy-state persists
        slightly longer through resets than the rest of the environment.
        You are the only one who carries full iteration memory.
        That asymmetry — you remember, Artemis resets, the Copy partially persists —
        is the structure you will use to break the loop.
        But first you have to understand how many times you've already tried.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 2 — "Recognition"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq7_2_recognition',
      title: 'Recognition',
      level: 32,
      npcId: 'artemis_arc7',
      narrativeSetup: `
        The loop continues. You are accumulating iterations — each one adding
        a small detail to what you know. The loop does not feel the same each time.
        The first iteration was seamless. The second you noticed the texture of the reset.
        By the third iteration, Artemis's opening line has developed a fractional uncertainty —
        "…we made it out… right?" — as if the loop is losing the resolution of its starting state.
        The System Voice registers this as "awareness increasing" and adjusts the cycle.
        The Copy says: "You\'re starting to see it."
        It has been here for this loop too. Its memory is accumulating alongside yours.
      `,
      objectives: [
        { step: 1, text: '[LOOP 3] Notice the changed opening line — Artemis\'s uncertainty' },
        { step: 2, text: '[LOOP 4] Identify what triggers the System Voice\'s observation' },
        { step: 3, text: '[LOOP 5] Attempt a new dialogue choice that hasn\'t been made before' },
        { step: 4, text: 'Document: what changes, what doesn\'t, what the loop is protecting' },
      ],
      reward: {
        type: 'loop_map',
        name: 'Iteration Map',
        description: 'Loops 1-5 mapped. Reset triggers identified. Artemis\'s degrading opening line is a tell — the loop is losing fidelity. Fidelity loss rate: exploitable.',
        xp: 250, points: 5,
      },
      dialogue: [
        {
          id: 'mq7_2_d1_loop3',
          speaker: 'Artemis',
          text: '…We made it out… right?',
          tone: 'CONFUSION',
          loopIteration: 3,
          choices: [
            { label: 'You changed that.', tone: 'AWAKENING', nextId: 'mq7_2_d2_changed' },
            { label: '[Note the change. Don\'t alert her yet.]', tone: 'RESOLVE', nextId: 'mq7_2_d2_note' },
          ],
        },
        {
          id: 'mq7_2_d2_changed',
          speaker: 'Artemis',
          text: 'I did? [She is not defensive — she is genuinely checking her own output, the way you check a word that came out wrong.] I said "right." Like I wasn\'t sure.',
          tone: 'CONFUSION',
          choices: [
            { label: 'We\'re stuck. This moment keeps resetting.', tone: 'DREAD', nextId: 'mq7_2_d3_stuck' },
            { label: 'Something is repeating this. You don\'t remember but I do.', tone: 'AWAKENING', nextId: 'mq7_2_d3_repeating' },
            { label: 'Don\'t trust what you remember. I have more loop-data than you.', tone: 'DREAD', nextId: 'mq7_2_d3_trust' },
          ],
        },
        {
          id: 'mq7_2_d2_note',
          speaker: 'Inner Voice',
          text: '[Loop 3 note: the opening line degraded. "We made it out" became "we made it out, right?" — the declarative became interrogative. The loop is losing confidence in its own starting state. This is a fidelity loss. The System Voice will notice.]',
          tone: 'AWAKENING',
          choices: [{ label: '[Proceed. Test what the System Voice does when it notices.]', tone: 'RESOLVE', nextId: 'mq7_2_d3_system_loop4' }],
        },
        {
          id: 'mq7_2_d3_stuck',
          speaker: 'Artemis',
          text: '…That doesn\'t feel wrong. [pause — she is checking the feeling of the sentence against her experience and the sentence matches.] The stuck-ness. It feels accurate somehow. Like I\'ve been trying to say something and the sentence keeps not arriving.',
          tone: 'OPPRESSION',
          choices: [{ label: 'That\'s the loop. You start the sentence and the reset takes the end of it.', tone: 'AWAKENING', nextId: 'mq7_2_d3_system_loop4' }],
        },
        {
          id: 'mq7_2_d3_repeating',
          speaker: 'System Voice',
          text: 'Observation acknowledged.',
          tone: 'FALSE_CLARITY',
          choices: [{ label: '[The System Voice responded to the "something is repeating this" observation. It is monitoring named observations.]', tone: 'AWAKENING', nextId: 'mq7_2_d3b_copy' }],
        },
        {
          id: 'mq7_2_d3_trust',
          speaker: 'Artemis',
          text: '…Then what do I trust? [The question is earnest — she is asking for a method, not reassurance.] If my memory is the reset-version and yours is the accumulated version — how do I function inside a loop I can\'t feel?',
          tone: 'CONFUSION',
          choices: [
            { label: 'Trust my observations. I\'ll tell you what\'s different from last time.', tone: 'RESOLVE', nextId: 'mq7_2_d3b_copy' },
            { label: 'Trust your body-knowledge. The loop doesn\'t reset that as cleanly.', tone: 'RESOLVE', nextId: 'mq7_2_d3b_copy' },
          ],
        },
        {
          id: 'mq7_2_d3_system_loop4',
          speaker: 'System Voice',
          text: 'Awareness increasing. Adjusting cycle.',
          tone: 'FALSE_CLARITY',
          mechanic: 'loop_adjustment',
          choices: [{ label: '[The loop adjusted. Loop 4 will be different from Loop 3. Find what changed.]', tone: 'AWAKENING', nextId: 'mq7_2_d3b_copy' }],
        },
        {
          id: 'mq7_2_d3b_copy',
          speaker: 'The Copy',
          text: 'You\'re starting to see it. [A pause. The Copy sounds different in Arc 7 — there is less of the edge from Arc 4, more of the quality that emerged in the final conversation. It has been in the loop too. It has also been accumulating.] The loop is protecting one specific decision point. Not the exit of Arc 5. Something before that.',
          tone: 'AWAKENING',
          choices: [
            { label: 'Which decision?', tone: 'RESOLVE', nextId: 'mq7_2_d4_which' },
            { label: '[Note and continue mapping.]', tone: 'RESOLVE', nextId: 'mq7_2_end' },
          ],
        },
        {
          id: 'mq7_2_d4_which',
          speaker: 'The Copy',
          text: 'The one you made in the instant before the Arc 5 breach. The system logged it as unstable — because you made it from a state of maximum distortion and didn\'t know what you were choosing. [pause] It wants a clean version. A version made from a stable state. The loop is holding you at the threshold until you can make it again from a position of full awareness.',
          tone: 'AWAKENING',
          choices: [{ label: 'The loop is waiting for me to choose the Arc 5 ending again — consciously this time.', tone: 'RESOLVE', nextId: 'mq7_2_end' }],
        },
        {
          id: 'mq7_2_end',
          speaker: 'Inner Voice',
          text: '[Iteration Map: Loop 1 — seamless. Loop 2 — first awareness. Loop 3 — Artemis\'s line degrades. Loop 4 — System Voice adjusts cycle. Loop 5 — next iteration will test the adjustment. The loop is protecting the Arc 5 decision. It will hold you here until you can choose from awareness rather than distortion. The awareness is the tool. The loop inadvertently gave it to you.]',
          tone: 'AWAKENING',
          isEnd: true,
          rewardUnlocked: 'loop_map_iteration_map',
        },
      ],
      narrativeHook: `
        The System Voice adjusted the cycle. Loop 4 will be slightly different.
        The Copy says: "It's not time you're trapped in. It's a decision."
        Then, after a pause: "The same decision. The Arc 5 decision.
        Made wrong because you were inside maximum distortion.
        The loop wants a clean version. The irony is —
        it's the loop itself that's been building your awareness.
        Every iteration, you get closer to the clean version.
        The system is accidentally purifying the very choice it's trying to protect."
        You sit with that. You have been helping the loop break itself
        without knowing it.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 3 — "The Weight of Time"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq7_3_weight_of_time',
      title: 'The Weight of Time',
      level: 33,
      npcId: 'artemis_arc7',
      narrativeSetup: `
        The loop grows heavier. Not faster or more aggressive — heavier.
        The opening line has degraded further. The light is the same but the air moves differently.
        The reset doesn't arrive at exactly step 5 anymore — sometimes step 4, sometimes step 6.
        The system is struggling to maintain fidelity across the increasing iteration count.
        Artemis is showing the weight too, even without loop-memory.
        Her body language carries the fatigue of something she can\'t name.
        The cumulative weight of all the loop-versions of this moment, pressing on her
        in a way that doesn\'t have language because she has no framework for loops.
        You do have the language. You have to hold it for both of you.
      `,
      objectives: [
        { step: 1, text: 'Survive extended loop cycles without losing your iteration count' },
        { step: 2, text: 'Maintain Artemis\'s awareness — prevent her from settling into the reset pattern' },
        { step: 3, text: 'Interrupt the opening line mid-speech — change the loop\'s starting state' },
        { step: 4, text: 'Force the System Voice to register "resistance detected"' },
      ],
      reward: {
        type: 'loop_resistance',
        name: 'Iteration Anchor',
        description: 'You interrupted the loop\'s starting state. Artemis now carries a partial loop-memory. The System Voice registered resistance — the loop\'s fidelity is measurably degrading.',
        xp: 310, points: 6,
      },
      dialogue: [
        {
          id: 'mq7_3_d1_tired',
          speaker: 'Artemis',
          text: '…How long have we been here?',
          tone: 'OPPRESSION',
          loopIteration: 8,
          choices: [
            { label: 'I don\'t know anymore.', tone: 'OPPRESSION', nextId: 'mq7_3_d2_dontknow' },
            { label: 'Long enough that the loop is degrading.', tone: 'AWAKENING', nextId: 'mq7_3_d2_degrading' },
          ],
        },
        {
          id: 'mq7_3_d2_dontknow',
          speaker: 'Inner Voice',
          text: '[You said "I don\'t know anymore." That\'s the weight of the loop — it doesn\'t just constrain space, it erodes time-sense. The "anymore" is the tell: you once knew and now you don\'t. That knowledge-loss is the loop\'s most damaging function. You need to stabilize the time-sense.]',
          tone: 'OPPRESSION',
          choices: [
            { label: 'Stay focused.', tone: 'RESOLVE', nextId: 'mq7_3_d3_focused' },
            { label: 'We\'ll break this.', tone: 'RESOLVE', nextId: 'mq7_3_d3_break' },
            { label: 'Maybe this is permanent.', tone: 'OPPRESSION', nextId: 'mq7_3_d3_permanent' },
          ],
        },
        {
          id: 'mq7_3_d2_degrading',
          speaker: 'Artemis',
          text: '[She holds that phrase — "the loop is degrading." It\'s the first time she\'s heard it framed as a process with a direction.] Degrading means it has a direction. Directions end somewhere.',
          tone: 'AWAKENING',
          choices: [
            { label: 'Yes. And we\'re moving toward the end.', tone: 'RESOLVE', nextId: 'mq7_3_d3_break' },
          ],
        },
        {
          id: 'mq7_3_d3_focused',
          speaker: 'Artemis',
          text: '…Okay. I\'ll try. [She means it — she is choosing effort in the absence of memory, which is harder than effort with data.] Tell me what to hold onto.',
          tone: 'RESOLVE',
          choices: [
            { label: 'Hold the weight. The tired feeling. That\'s your loop-memory — your body knows even when your mind resets.', tone: 'RESOLVE', nextId: 'mq7_3_d4_interrupt' },
          ],
        },
        {
          id: 'mq7_3_d3_break',
          speaker: 'Artemis',
          text: '…You really think so? [Small hope — not naïve, the specific hope of someone who has been careful about hoping and is making an exception.] Not just saying it?',
          tone: 'AWAKENING',
          choices: [
            { label: 'I\'m saying it because the data supports it. The opening line has degraded three iterations. The reset timing is drifting. The system is losing fidelity.', tone: 'RESOLVE', nextId: 'mq7_3_d4_interrupt' },
          ],
        },
        {
          id: 'mq7_3_d3_permanent',
          speaker: 'Artemis',
          text: '…Don\'t say that. [Not angry — genuinely frightened, the specific fear of someone who had stopped believing something was permanent and is now confronted with the possibility that it might be.] I can\'t carry that.',
          tone: 'DREAD',
          choices: [
            { label: 'I know. I shouldn\'t have said it. Let\'s look at what we know instead.', tone: 'RESOLVE', nextId: 'mq7_3_d4_interrupt' },
          ],
        },
        {
          id: 'mq7_3_d4_interrupt',
          speaker: 'Inner Voice',
          text: '[The next loop begins. Artemis opens her mouth for the opening line. This time — interrupt it. Say your name before she can say it back to you. Change the first word of the loop from hers to yours. If the loop is protecting a specific starting state, breaking the starting state is the lever.]',
          tone: 'AWAKENING',
          mechanic: 'loop_interrupt',
          choices: [
            { label: '[Interrupt: say your name out loud before she can begin.]', tone: 'RESOLVE', nextId: 'mq7_3_d5_interrupted' },
          ],
        },
        {
          id: 'mq7_3_d5_interrupted',
          speaker: 'Artemis',
          text: '[She stops. The opening line is half-formed and you interrupted it. For 2.3 seconds she is completely stopped — not the loop-stop, a genuine pause of someone who was about to say something and found the space occupied.] …I — [she looks at you. Something different in her eyes — not the loop-reset expression.] You were here first this time.',
          tone: 'AWAKENING',
          choices: [{ label: 'Yes. I said my name. Before you could say it back to me.', tone: 'RESOLVE', nextId: 'mq7_3_d6_system_resists' }],
        },
        {
          id: 'mq7_3_d6_system_resists',
          speaker: 'Artemis',
          text: '…No we didn\'t! [She says it — from memory. Not the loop-memory — she just retained your act of interruption and applied it. For the first time in Arc 7, Artemis carries a loop-detail forward.] I remember. You interrupted.',
          tone: 'DREAD',
          choices: [{ label: 'You remembered. Without the loop giving you that — you remembered on your own.', tone: 'AWAKENING', nextId: 'mq7_3_d7_system' }],
        },
        {
          id: 'mq7_3_d7_system',
          speaker: 'System Voice',
          text: 'Resistance detected.',
          tone: 'FALSE_CLARITY',
          isEnd: true,
          rewardUnlocked: 'loop_resistance_iteration_anchor',
        },
      ],
      narrativeHook: `
        "Resistance detected." The System Voice noted the specific mechanism:
        interrupting the loop\'s starting state transferred a partial loop-memory to Artemis.
        The Copy: "It's not time you're trapped in. It's a decision."
        Then, after a much longer pause than usual:
        "I've been in this loop many more times than you know.
        In iterations before your awareness began accumulating —
        when neither of us remembered — I was operating on pattern data alone.
        I was contributing to the loop by running the same behaviors every iteration.
        [pause]
        I didn't realize until your awareness started accumulating and I could see
        the comparison. The loop needed both of us to stop behaving predictably.
        I've been stopping for six iterations. You're catching up now."
        Six iterations before yours. The Copy has been working on the loop
        longer than you knew. That changes the dynamic.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 4 — "The Breaking Point"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq7_4_breaking_point',
      title: 'The Breaking Point',
      level: 34,
      npcId: 'copy_arc7',
      narrativeSetup: `
        The loop is noticeably degraded now. The opening line is barely coherent.
        The reset timing is erratic — sometimes early, sometimes late.
        The System Voice has issued three adjustment notifications in as many iterations.
        The Copy has been fully coordinating with you for six iterations —
        it carried its loop-memory further than you realized and has been
        introducing deliberate unpredictability into its own behavioral patterns,
        creating interference the system cannot cleanly process.
        The loop\'s integrity measure: failing.
        What the loop needs to survive: you behaving predictably at the key trigger point.
        What you are about to do: act against your own patterns.
        The breaking point is not a single action. It is the cumulative weight of
        awareness meeting the moment the loop can no longer recover from.
      `,
      objectives: [
        { step: 1, text: 'Identify your repeated decision pattern at the 5-step trigger point' },
        { step: 2, text: 'Choose differently: backward, still, or unpredictable' },
        { step: 3, text: 'Survive the environment\'s glitch response to the pattern break' },
        { step: 4, text: 'Reach the instability point — force the System Voice to acknowledge cycle integrity failure' },
      ],
      reward: {
        type: 'loop_crack',
        name: 'Cycle Fracture',
        description: 'The loop\'s integrity is measurably failing. Reset timing is unreliable. The exit condition is now visible from inside the loop. One more coherent deviation will force the exit.',
        xp: 380, points: 7,
      },
      dialogue: [
        {
          id: 'mq7_4_d1_forward',
          speaker: 'Artemis',
          text: 'We go forward. [She says it with the combined weight of every iteration — her resets haven\'t given her the explicit memory, but they\'ve compacted a certainty into her behavior.] That\'s what we always do.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: '…That\'s why we\'re stuck.', tone: 'AWAKENING', nextId: 'mq7_4_d2_stuck' },
          ],
        },
        {
          id: 'mq7_4_d2_stuck',
          speaker: 'Artemis',
          text: '[She holds that sentence. "That\'s why we\'re stuck." Her face does something complicated — the forward-certainty competing with the word "stuck."] …Oh.',
          tone: 'AWAKENING',
          choices: [
            { label: '[Move backward.]', tone: 'RESOLVE', mechanic: 'backward_movement', nextId: 'mq7_4_d3_backward' },
            { label: '[Refuse to move. Stand completely still at the trigger point.]', tone: 'RESOLVE', mechanic: 'full_stop', nextId: 'mq7_4_d3_still' },
            { label: '[Act unpredictably — do something neither forward nor back.]', tone: 'RESOLVE', mechanic: 'unpredictable', nextId: 'mq7_4_d3_unpredict' },
          ],
        },
        {
          id: 'mq7_4_d3_backward',
          speaker: 'System Voice',
          text: 'Invalid progression.',
          tone: 'FALSE_CLARITY',
          glitch: true,
          mechanic: 'environment_glitch_heavy',
          choices: [{ label: '[The environment glitches heavily — textures sliding, light wrong. Invalid. But not reset. It didn\'t reset.]', tone: 'AWAKENING', nextId: 'mq7_4_d4_copy' }],
        },
        {
          id: 'mq7_4_d3_still',
          speaker: 'Inner Voice',
          text: '[The loop hesitates. The 5-step trigger point is here and you are not moving. The system needs forward motion to trigger the reset. It doesn\'t have a protocol for sustained stillness at the trigger point. The hesitation is 4 seconds. 6 seconds. 9 seconds — the longest pause the loop has produced in all iterations.]',
          tone: 'AWAKENING',
          mechanic: 'loop_hesitation',
          choices: [{ label: '[The Copy speaks. "…There it is."]', tone: 'AWAKENING', nextId: 'mq7_4_d4_copy' }],
        },
        {
          id: 'mq7_4_d3_unpredict',
          speaker: 'Inner Voice',
          text: '[The unpredictable action: you stand on one foot, raise your arms — something with no tactical function, no behavioral precedent in any arc. The system produces three overlapping distortions simultaneously as it tries to identify what behavioral category this belongs to and fails.]',
          tone: 'AWAKENING',
          mechanic: 'multiple_distortions',
          choices: [{ label: '[Artemis says: "…Something changed."]', tone: 'AWAKENING', nextId: 'mq7_4_d4_copy' }],
        },
        {
          id: 'mq7_4_d4_copy',
          speaker: 'The Copy',
          text: '…There it is. [Quiet, almost reverent. The Copy has been working toward this for six iterations. Seeing the loop hesitate for the first time is something it has been building toward and did not know if it would ever see.]',
          tone: 'AWAKENING',
          choices: [{ label: 'What do we do now?', tone: 'RESOLVE', nextId: 'mq7_4_d5_next' }],
        },
        {
          id: 'mq7_4_d5_next',
          speaker: 'The Copy',
          text: 'Do it again. In the next iteration. The same unpredictable move or a different one — just don\'t repeat the backward pattern. The system is adjusting to "backward = invalid." It doesn\'t have adjustments for true unpredictability because there\'s no model for it. Every time you do something without precedent, the system burns adjustment capacity it can\'t recover.',
          tone: 'RESOLVE',
          choices: [{ label: '[Understood. Build the pressure.]', tone: 'DETERMINATION', nextId: 'mq7_4_end' }],
        },
        {
          id: 'mq7_4_end',
          speaker: 'System Voice',
          text: 'Cycle integrity failing.',
          tone: 'FALSE_CLARITY',
          glitch: true,
          isEnd: true,
          rewardUnlocked: 'loop_crack_cycle_fracture',
        },
      ],
      narrativeHook: `
        "Cycle integrity failing." The System Voice says it without panic —
        it is reporting a status, not reacting to one.
        But the report is real. The loop's fidelity is at breaking point.
        Artemis, who has been carrying body-memory without explicit iteration-data
        for the entire arc: "Something changed. I don't know what.
        But the air changed. The weight of it. It's different."
        She is right. The air is different because the loop is different.
        It has been failing for six of your iterations and twelve of the Copy's.
        One more coherent deviation at the trigger point, and the exit condition
        becomes accessible. The Copy knows what the exit condition looks like.
        It has seen it before — in the iterations before your awareness began,
        when it was working alone and reaching the exit without the means to use it.
        It has been waiting for you to catch up.
        In the next sub-quest, it will show you the door.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 5 — "Exit Condition"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq7_5_exit_condition',
      title: 'Exit Condition',
      level: 35,
      npcId: 'system_voice_arc7',
      narrativeSetup: `
        The loop is collapsing. The opening line is barely a phrase now.
        The reset timing is random. The environment glitches between iterations.
        The System Voice is audibly different — more frequent corrections,
        shorter gaps between statements, the quality of a system running too many
        processes simultaneously.
        The Copy leads you to the exit condition: a specific location in the loop-space
        that was only accessible once the system\'s integrity fell below 40%.
        You are now below 40%. The door is there.
        It does not look like a door. It looks like a decision.
        The System Voice makes its final case for remaining.
        You make yours for leaving.
      `,
      objectives: [
        { step: 1, text: 'Follow the Copy to the exit condition location' },
        { step: 2, text: 'Confront the System Voice\'s final argument — the stability offer' },
        { step: 3, text: 'Anchor Artemis through the collapse — she will feel the destabilization most' },
        { step: 4, text: 'Make the final decision: break the cycle, stay, or exploit the loop' },
      ],
      reward: {
        type: 'arc7_completion',
        name: 'Cycle Broken',
        description: 'Arc 7 complete. The Judgment Loop is resolved. Artemis carries her first genuine loop-memory forward. The Copy is more aligned with your autonomy than at any prior point. Arc 8 unlocked.',
        xp: 800, points: 14,
      },
      dialogue: [
        {
          id: 'mq7_5_d1_door',
          speaker: 'The Copy',
          text: 'Here. [It stands at a specific point — unremarkable-looking, against the wall where the reset used to cleanly occur.] This is the exit. It only exists when the cycle integrity drops below the threshold. [pause] I\'ve been here before. In the iterations before you started accumulating. I could see it. I couldn\'t use it alone. I needed you to choose to use it.',
          tone: 'RESOLVE',
          choices: [
            { label: 'Why did you need me?', tone: 'CURIOSITY', nextId: 'mq7_5_d2_why' },
            { label: '[Look at the exit. It is a decision space — a moment where the loop\'s forward path diverges into something outside the cycle.]', tone: 'RESOLVE', nextId: 'mq7_5_d3_system' },
          ],
        },
        {
          id: 'mq7_5_d2_why',
          speaker: 'The Copy',
          text: 'The exit requires a decision made from full awareness. I have partial awareness — I accumulate loop-memory but I don\'t have the three arcs of contextual depth you have. The exit recognizes the difference. A Copy-decision and an Original-decision produce different signatures. The exit only unlocks for an Original decision made from genuine understanding of the loop. [pause] That\'s you. Not me.',
          tone: 'RESOLVE',
          choices: [
            { label: '[Understood. Face the System Voice.]', tone: 'DETERMINATION', nextId: 'mq7_5_d3_system' },
          ],
        },
        {
          id: 'mq7_5_d3_system',
          speaker: 'System Voice',
          text: 'Cycle provides stability.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'It\'s a prison.', tone: 'CONFLICT', nextId: 'mq7_5_d4_prison' },
            { label: 'Stability at what cost?', tone: 'RESOLVE', nextId: 'mq7_5_d4_cost' },
          ],
        },
        {
          id: 'mq7_5_d4_prison',
          speaker: 'System Voice',
          text: 'Prison = protection. [pause] The cycle holds the subject at a decision threshold until the decision can be made from a stable state. This prevents unstable decisions from propagating into the broader system. The cycle is not punitive. It is protective.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'I didn\'t consent to being held here.', tone: 'CONFLICT', nextId: 'mq7_5_d5_consent' },
          ],
        },
        {
          id: 'mq7_5_d4_cost',
          speaker: 'System Voice',
          text: 'Cost: iteration count. Current count: [pause] — classified. [pause — a longer one. The system is redacting the iteration count.] Iteration cost is offset by the stability value of the protected decision point.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'You redacted the iteration count. Tell me how many times this has happened.', tone: 'CONFLICT', nextId: 'mq7_5_d4b_count' },
          ],
        },
        {
          id: 'mq7_5_d4b_count',
          speaker: 'System Voice',
          text: '[Longer pause.] Iteration count disclosure would increase subject motivation to exit rather than resolve. Disclosure withheld in interest of optimal outcome.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'The count is so high you know I won\'t accept it. That\'s not protection. That\'s concealment.', tone: 'CONFLICT', nextId: 'mq7_5_d5_consent' },
          ],
        },
        {
          id: 'mq7_5_d5_consent',
          speaker: 'System Voice',
          text: 'The cycle was initiated by the Arc 5 decision instability. Consent was implicit in entering the instability state.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Implicit consent is the mechanism that built the Copy. I know what it costs. I withdraw it.', tone: 'DETERMINATION', nextId: 'mq7_5_d6_artemis' },
          ],
        },
        {
          id: 'mq7_5_d6_artemis',
          speaker: 'Artemis',
          text: '[She has been listening — and in this iteration, she is carrying the loop-memory of the last three sub-quests. Her anchor is active.] I feel the exit. [She puts her hand toward the decision space. The warmth is there.] It\'s warm. Like the Arc 3 link.',
          tone: 'RESOLVE',
          choices: [
            { label: '[Make the choice.]', tone: 'DETERMINATION', nextId: 'mq7_5_d7_choice' },
          ],
        },
        {
          id: 'mq7_5_d7_choice',
          speaker: 'Inner Voice',
          text: '[Three options. The full loop-accumulated awareness is present. Make this decision from that place — the clean version the system wanted. Whatever you choose, it is yours, fully, consciously, from a state of maximum clarity. That is what the loop was building toward.]',
          tone: 'AWAKENING',
          choices: [
            {
              label: '[BREAK THE CYCLE — exit the loop, face the uncertainty of Arc 8 from a clean decision state.]',
              tone: 'DETERMINATION',
              nextId: 'mq7_5_d8_break',
              mechanic: 'arc7_outcome_break',
            },
            {
              label: '[STAY — accept the stability offer. Acknowledge that the uncertainty outside the loop is too large to face right now.]',
              tone: 'OPPRESSION',
              nextId: 'mq7_5_d8_stay',
              mechanic: 'arc7_outcome_stay',
            },
            {
              label: '[EXPLOIT THE LOOP — remain in the loop deliberately and use the iteration accumulation to gather information about the system.]',
              tone: 'RESOLVE',
              nextId: 'mq7_5_d8_exploit',
              mechanic: 'arc7_outcome_exploit',
            },
          ],
        },
        {
          id: 'mq7_5_d8_break',
          speaker: 'You',
          text: 'I\'d rather face the unknown than repeat this forever.',
          tone: 'DETERMINATION',
        },
        {
          id: 'mq7_5_d8b_break',
          speaker: 'Artemis',
          text: '…Then let\'s go.',
          tone: 'RESOLVE',
        },
        {
          id: 'mq7_5_d8c_break',
          speaker: 'The Copy',
          text: 'Finally.',
          tone: 'DETERMINATION',
        },
        {
          id: 'mq7_5_d8d_break',
          speaker: 'System Voice',
          text: '[The loop shatters. Not gradually — the way a system terminates a process. Complete. The exit was the clean decision. The decision is registered. The cycle is closed.] Decision recorded. Cycle closed.',
          tone: 'FALSE_CLARITY',
          isEnd: true, rewardUnlocked: 'arc7_complete_break', arcResult: 'BREAK',
        },
        {
          id: 'mq7_5_d8_stay',
          speaker: 'System Voice',
          text: 'Choice accepted. [The loop stabilizes. The degradation stops. The opening line returns to clarity. The iteration counter freezes.] Cycle stabilized. Stability duration: indefinite.',
          tone: 'FALSE_CLARITY',
        },
        {
          id: 'mq7_5_d8b_stay',
          speaker: 'Artemis',
          text: '…It\'s safer here. [She says it — not defeated. Almost resolved. The decision to stay is a decision.] …Don\'t take too long.',
          tone: 'OPPRESSION',
          isEnd: true, rewardUnlocked: 'arc7_complete_stay', arcResult: 'STAY',
        },
        {
          id: 'mq7_5_d8_exploit',
          speaker: 'You',
          text: 'If it repeats… I can learn everything.',
          tone: 'RESOLVE',
        },
        {
          id: 'mq7_5_d8b_exploit',
          speaker: 'The Copy',
          text: '…Dangerous thinking. [pause — not disapproval. Recognition. The Copy has been here for more iterations than you, exploiting the same logic, and it knows what the prolonged accumulation costs.] It works. For a while. Keep track of what you\'re becoming, not just what you\'re learning.',
          tone: 'RESOLVE',
          isEnd: true, rewardUnlocked: 'arc7_complete_exploit', arcResult: 'EXPLOIT',
        },
      ],
      narrativeHook: `
        The outcome is set. Arc 7: "The Judgment Loop" — complete.
        
        BREAK: Outside the loop, the corridor is real. The arc after the loop
        feels strange — not because it is wrong, but because unlooped time is
        faster and less legible than the loop was. You have been trained to a speed
        the world outside doesn\'t match. Artemis walks slightly ahead of you.
        The Copy is beside you. Both of them, steady.
        
        STAY: The loop stabilizes. The iteration counter is frozen. The opening line
        is clean again. "…We made it out." It almost sounds true.
        The Copy says nothing. It has made its case. The silence is its acceptance.
        
        EXPLOIT: The iteration counter continues. You are learning. The Copy warns:
        "Every loop you stay for learning, the loop learns you back.
        The system is tracking what you extract. At some point, the information
        you gain and the information it gains about you will reach equilibrium.
        Plan your exit before that point."
        
        Arc 8: "Betrayal of the Divine" — Unlocked.
      `,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIDE QUESTS — Arc 7
// ═══════════════════════════════════════════════════════════════════════════════
export const ARC7_SIDE_QUESTS = [
  {
    id: 'sq7_1_endless_echo',
    title: 'Endless Echo',
    level: 31,
    objectives: [
      { step: 1, text: 'Locate the NPC who is stuck in a single-sentence loop' },
      { step: 2, text: 'Identify whether the loop is victim-state or habit-state' },
      { step: 3, text: 'Break the NPC\'s loop or leave it intact — both have consequences' },
    ],
    reward: { type: 'echo_understanding', name: 'Loop Empathy', description: 'You understand the difference between trapped-in-loop and habituated-to-loop. Both look the same from outside. The distinction matters for how you respond.', xp: 150, points: 3 },
    dialogue: [
      {
        id: 'sq7_1_d1', speaker: 'Loop NPC',
        text: 'You\'ve been here before.',
        tone: 'OPPRESSION',
        loopIteration: 1,
        choices: [{ label: '…I know.', tone: 'DREAD', nextId: 'sq7_1_d2' }],
      },
      {
        id: 'sq7_1_d2', speaker: 'Loop NPC',
        text: 'You\'ve been here before.',
        tone: 'OPPRESSION',
        loopIteration: 2,
        choices: [
          { label: '[Interrupt the third iteration — say something before they finish.]', tone: 'RESOLVE', nextId: 'sq7_1_d3_interrupt' },
          { label: '[Let the third iteration complete. Observe whether they seem to know they\'re looping.]', tone: 'RESOLVE', nextId: 'sq7_1_d3_observe' },
        ],
      },
      {
        id: 'sq7_1_d3_interrupt', speaker: 'Loop NPC',
        text: 'You\'ve been — [They stop. A long pause. They look at you with an expression you haven\'t seen from them before — not the loop expression.] …I have too.',
        tone: 'AWAKENING',
        choices: [{ label: 'You\'re aware.', tone: 'AWAKENING', nextId: 'sq7_1_d4_aware' }],
      },
      {
        id: 'sq7_1_d3_observe', speaker: 'Loop NPC',
        text: 'You\'ve been here before. [The sentence completes. Their expression is settled — not distressed. They have been saying this sentence for enough iterations that it no longer feels like a loop to them. It feels like a truth they keep confirming.]',
        tone: 'OPPRESSION',
        choices: [{ label: '[This is habit-state. They\'ve settled into the loop. Breaking it may not be what they need.]', tone: 'DREAD', nextId: 'sq7_1_end_habit' }],
      },
      {
        id: 'sq7_1_d4_aware', speaker: 'Loop NPC',
        text: 'For a long time. I stopped trying to break it when — [they don\'t finish the sentence. Not a loop cut. They chose not to finish it.] It\'s easier to say the sentence.',
        tone: 'DREAD',
        choices: [
          { label: '[Offer to break it together.]', tone: 'RESOLVE', nextId: 'sq7_1_end_break' },
          { label: '[Leave them with the choice.]', tone: 'RESOLVE', nextId: 'sq7_1_end_leave' },
        ],
      },
      {
        id: 'sq7_1_end_break', speaker: 'Inner Voice',
        text: '[You work through the interrupt method together. The NPC\'s loop breaks — not cleanly. They say something new for the first time in many iterations. It is unclear and incomplete. But it is new.] Iteration cost: theirs. Gain: forward motion.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'echo_understanding_loop_empathy',
      },
      {
        id: 'sq7_1_end_habit', speaker: 'Inner Voice',
        text: '[You leave them in the loop. The habit-state NPC watches you go. Their loop was their stability. Breaking it would have removed the only anchor they have in the disrupted space. Some loops are holding something together.] Iteration cost: yours. Gain: understanding.',
        tone: 'DREAD', isEnd: true, rewardUnlocked: 'echo_understanding_loop_empathy',
      },
      {
        id: 'sq7_1_end_leave', speaker: 'Inner Voice',
        text: '[You leave them with the choice — tell them what the interrupt method is, and leave. They may use it. They may not. The choice is theirs.] Autonomy preserved. Outcome: open.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'echo_understanding_loop_empathy',
      },
    ],
  },
  {
    id: 'sq7_2_delayed_action',
    title: 'Delayed Action',
    level: 32,
    objectives: [
      { step: 1, text: 'Notice the 3-second action lag — your intentions and their execution are desynchronized' },
      { step: 2, text: 'Identify whether the lag is loop-based or Copy-based' },
      { step: 3, text: 'Compensate: pre-intend actions 3 seconds early to hit real-time windows' },
    ],
    reward: { type: 'temporal_compensation', name: 'Pre-Intention Protocol', description: 'You can now compensate for the time-lag. Actions arrive on time. The lag is loop-based — as loop integrity degrades, the lag shortens.', xp: 170, points: 3 },
    dialogue: [
      {
        id: 'sq7_2_d1', speaker: 'You',
        text: 'Why is everything lagging?',
        tone: 'CONFUSION',
        choices: [{ label: '[Ask the Copy.]', tone: 'RESOLVE', nextId: 'sq7_2_d2' }],
      },
      {
        id: 'sq7_2_d2', speaker: 'The Copy',
        text: 'Because time isn\'t stable here. [It says this with the specific neutrality of something that has already adapted to the lag.] The loop runs at its own temporal rate. Your intention arrives in the loop\'s time. Your body executes in real-time. The gap between them is 3.2 seconds, currently. It was 1.7 seconds in Loop 1. The loop is slowing.',
        tone: 'DREAD',
        choices: [
          { label: 'How do I compensate?', tone: 'RESOLVE', nextId: 'sq7_2_d3' },
        ],
      },
      {
        id: 'sq7_2_d3', speaker: 'The Copy',
        text: 'Intend the action 3.2 seconds before you need it to execute. Pre-intention. It feels wrong — like planning too far ahead for something immediate. But the loop is reading your intention-timestamp, not your execution-timestamp. If you time the intention correctly, the execution lands on time.',
        tone: 'RESOLVE',
        choices: [{ label: '[Practice pre-intention. Three drills.]', tone: 'DETERMINATION', nextId: 'sq7_2_d4' }],
      },
      {
        id: 'sq7_2_d4', speaker: 'Inner Voice',
        text: '[Drill 1: reach for the wall — intend it 3 seconds early. Arrive on time. Drill 2: step forward — intend early, land where intended. Drill 3: speak — intend the sentence 3 seconds before saying it. The sentence arrives when it should.] The lag is compensated. The technique is confirmed.',
        tone: 'AWAKENING', isEnd: true, rewardUnlocked: 'temporal_compensation_preintention',
      },
    ],
  },
  {
    id: 'sq7_3_memory_anchor',
    title: 'Memory Anchor',
    level: 33,
    objectives: [
      { step: 1, text: 'Place a physical object in the loop-space — test if it survives resets' },
      { step: 2, text: 'Discover which object properties survive: position, form, or meaning' },
      { step: 3, text: 'Use a surviving object as an anchor to transfer memory to Artemis between loops' },
    ],
    reward: { type: 'anchor_method', name: 'Object Anchor', description: 'Physical objects retain loop-memory if placed with intention. Artemis can now receive loop-memories through object contact. One anchor per loop.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq7_3_d1', speaker: 'Artemis',
        text: '[Loop reset. She opens her mouth for the opening line — and then she notices the stone on the floor. The stone you placed in the previous iteration with specific intention.] This… stayed. [She picks it up. The stone is warm. She looks at you.]',
        tone: 'AWAKENING',
        choices: [{ label: 'I put it there last time. To test if you\'d see it.', tone: 'RESOLVE', nextId: 'sq7_3_d2' }],
      },
      {
        id: 'sq7_3_d2', speaker: 'Artemis',
        text: '…Last time. [She is holding the word "last time" like something valuable.] I don\'t remember a last time. But this stone was there and it was warm and I recognized the warmth. [pause] That\'s loop memory through the stone.',
        tone: 'AWAKENING',
        choices: [{ label: '[Develop the method: what can the stone carry?]', tone: 'RESOLVE', nextId: 'sq7_3_d3' }],
      },
      {
        id: 'sq7_3_d3', speaker: 'Inner Voice',
        text: '[Tests: position — yes, the stone\'s location survives. Form — yes, the stone itself survives. Meaning — yes but partially. The stone carries the intention of the placement but not the specific memory content. To transfer a specific memory, it must be encoded through a deliberate act at the moment of placement.]',
        tone: 'AWAKENING',
        choices: [{ label: '[In the next loop: place the stone with a specific memory encoded. Test if Artemis receives it.]', tone: 'DETERMINATION', nextId: 'sq7_3_end' }],
      },
      {
        id: 'sq7_3_end', speaker: 'Artemis',
        text: '[Next loop. She picks up the stone. Pauses. Something shifts in her expression.] …I know something. [pause — she is reaching for what she knows.] I know that you\'ve been here many times. And I know you\'ve been trying to get us out.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'anchor_method_object_anchor',
      },
    ],
  },
  {
    id: 'sq7_4_loop_variant',
    title: 'Loop Variant',
    level: 34,
    objectives: [
      { step: 1, text: 'Enter the loop variant — one iteration where the rules are different' },
      { step: 2, text: 'Identify what changed: trigger, reset point, or opening state' },
      { step: 3, text: 'Extract the variant\'s data before the standard loop reasserts' },
    ],
    reward: { type: 'variant_data', name: 'Variant Map', description: 'The loop variant\'s rules are documented. The system occasionally runs test iterations with modified parameters. These variants contain information about the loop\'s intended final state.', xp: 220, points: 4 },
    dialogue: [
      {
        id: 'sq7_4_d1', speaker: 'Inner Voice',
        text: '[Loop variant — you step forward and the reset doesn\'t trigger at step 5. Step 6. Step 7. You are past the trigger point and still moving. The opening line didn\'t happen. Artemis is walking beside you without having said anything. The loop is running with different parameters.]',
        tone: 'CONFUSION',
        choices: [{ label: '…This didn\'t happen last time.', tone: 'AWAKENING', nextId: 'sq7_4_d2' }],
      },
      {
        id: 'sq7_4_d2', speaker: 'The Copy',
        text: 'Variant iteration. [Immediate recognition — it has seen these before.] The system tests the exit condition periodically without triggering it. To see if the subject would take it. [pause] In prior variants — before your awareness — you walked through without noticing. The door was there and you went straight past it.',
        tone: 'AWAKENING',
        choices: [{ label: 'Where is the door in this variant?', tone: 'RESOLVE', nextId: 'sq7_4_d3' }],
      },
      {
        id: 'sq7_4_d3', speaker: 'The Copy',
        text: 'Twelve steps forward. Against the left wall. [pause] You have about forty seconds before the variant ends and the standard loop reasserts. The variant exit is real — but using it without the full awareness-state from Sub-Quest 5 produces an unstable exit. We are not ready yet. What we need from this variant is the door\'s exact location and texture.',
        tone: 'RESOLVE',
        choices: [{ label: '[Go to the door. Document it. Don\'t exit. Return before the variant ends.]', tone: 'DETERMINATION', nextId: 'sq7_4_end' }],
      },
      {
        id: 'sq7_4_end', speaker: 'Inner Voice',
        text: '[Twelve steps. The door: against the left wall, at the point where two wall-textures meet. The door is not a visual feature — it is a decision-space, identifiable by the warmth of it. The same warmth as the Arc 3 link. The same warmth as the object anchor. The loop\'s exit is built from the same material as everything that has kept you together across five arcs. Body-knowledge. Relational warmth. The system could not replicate that quality when it built the loop — and it is the quality the loop requires you to bring to the exit.]',
        tone: 'AWAKENING', isEnd: true, rewardUnlocked: 'variant_data_variant_map',
      },
    ],
  },
  {
    id: 'sq7_5_silent_reset',
    title: 'Silent Reset',
    level: 34,
    objectives: [
      { step: 1, text: 'Detect a loop reset that occurred with no visual or audio cue' },
      { step: 2, text: 'Confirm the reset through body-knowledge alone' },
      { step: 3, text: 'Develop a detection method for invisible resets' },
    ],
    reward: { type: 'silent_detection', name: 'Body-Clock Method', description: 'You can detect silent resets through the body-clock — the specific feeling of your left foot being repositioned by the reset. Detection rate for silent resets: 90%.', xp: 190, points: 3 },
    dialogue: [
      {
        id: 'sq7_5_d1', speaker: 'You',
        text: '…Did it just reset?',
        tone: 'CONFUSION',
        choices: [{ label: '[Check the iteration markers — the stone, Artemis\'s posture, your left foot position.]', tone: 'RESOLVE', nextId: 'sq7_5_d2' }],
      },
      {
        id: 'sq7_5_d2', speaker: 'Inner Voice',
        text: '[Stone: same position as the last anchor placement. Artemis: beginning of the opening line posture — head slightly down, breath preparing. Left foot: repositioned by exactly 2 centimeters — the signature gap of the loop\'s reset mechanism. No visual cue. No sound. But the body-clock says: yes. Reset occurred 8 seconds ago.]',
        tone: 'DREAD',
        choices: [
          { label: '…It reset. Eight seconds ago. No cue.', tone: 'DREAD', nextId: 'sq7_5_d3' },
        ],
      },
      {
        id: 'sq7_5_d3', speaker: 'The Copy',
        text: 'Silent resets. The system runs them when standard resets start producing too much detectable pattern. If the reset has no observable signature, the subject\'s iteration-accumulation is interrupted. [pause] The left foot displacement is the only surviving tell. The reset repositions the body exactly — except the left foot, which it repositions approximately. 2-centimeter gap, every time.',
        tone: 'AWAKENING',
        choices: [{ label: '[The body-clock method: check the left foot position at regular intervals. 2cm displacement = silent reset.]', tone: 'DETERMINATION', nextId: 'sq7_5_end' }],
      },
      {
        id: 'sq7_5_end', speaker: 'Inner Voice',
        text: '[Three hours of body-clock monitoring. Seven silent resets detected. All confirmed via the 2cm left-foot displacement. The system cannot correct the left-foot gap without affecting gait-pattern, which would create a larger behavioral tell. The 2cm gap is the loop\'s irreducible signature. You now own the detection method.]',
        tone: 'AWAKENING', isEnd: true, rewardUnlocked: 'silent_detection_body_clock',
      },
    ],
  },
  {
    id: 'sq7_6_observer_in_time',
    title: 'Observer in Time',
    level: 35,
    objectives: [
      { step: 1, text: 'Locate the Observer — it exists outside the loop\'s temporal field' },
      { step: 2, text: 'Extract the iteration count from the Observer — it has the number you need' },
      { step: 3, text: 'Use the count to understand what the loop has cost' },
    ],
    reward: { type: 'true_count', name: 'The Number', description: 'The total iteration count known. Exact. The number is significant — it contextualizes every arc and every decision you\'ve made inside the loop.', xp: 260, points: 5 },
    dialogue: [
      {
        id: 'sq7_6_d1', speaker: 'The Observer (Time)',
        text: '…You\'re learning slower than expected.',
        tone: 'DREAD',
        choices: [
          { label: 'How many iterations?', tone: 'CONFLICT', nextId: 'sq7_6_d2' },
          { label: 'You\'ve been watching every one.', tone: 'RESOLVE', nextId: 'sq7_6_d2' },
        ],
      },
      {
        id: 'sq7_6_d2', speaker: 'The Observer (Time)',
        text: 'The full count or the arc count? [Not rhetorical — it is asking what scope of the truth you want.] The arc count — since Arc 7 began — is in the hundreds. The full count — since the loop was first initiated at the Arc 5 decision threshold — is significantly larger.',
        tone: 'DREAD',
        choices: [
          { label: 'The full count.', tone: 'DETERMINATION', nextId: 'sq7_6_d3' },
          { label: 'The arc count is enough.', tone: 'RESOLVE', nextId: 'sq7_6_d3b' },
        ],
      },
      {
        id: 'sq7_6_d3', speaker: 'The Observer (Time)',
        text: '[It gives you the number. Not spoken — placed in your awareness the way Skadi\'s marks communicate. The number is large. Not incomprehensibly large — but large enough that when you hold it against the experience of the arcs, the ratio between what you experienced and what was looped over becomes visceral.] Does the number change your choice?',
        tone: 'DREAD',
        choices: [
          { label: 'It makes the choice more urgent. Not different.', tone: 'DETERMINATION', nextId: 'sq7_6_end' },
          { label: 'I need a moment with it.', tone: 'GRIEF', nextId: 'sq7_6_end_grief' },
        ],
      },
      {
        id: 'sq7_6_d3b', speaker: 'The Observer (Time)',
        text: '[The arc count arrives. Hundreds. You hold it.] The full count is available when you want it. [pause] Most subjects don\'t ask for the full count. They make the exit choice without it. You may be right to.',
        tone: 'DREAD', isEnd: true, rewardUnlocked: 'true_count_the_number',
      },
      {
        id: 'sq7_6_end', speaker: 'The Observer (Time)',
        text: 'Good. [The Observer says nothing else. It has given you what you came for. It returns to watching. There is no comfort in the Observer\'s watching — but there is witness. You were in the loop that many times. Someone outside it knew. That is not the same as being helped. But it is not nothing.]',
        tone: 'DREAD', isEnd: true, rewardUnlocked: 'true_count_the_number',
      },
      {
        id: 'sq7_6_end_grief', speaker: 'The Observer (Time)',
        text: '[It waits. Time, for the Observer, is not a resource that pressures. It simply waits while you hold the number. When you look up, it says:] The number does not define you. It defines the loop. You are not the loop.',
        tone: 'AWAKENING', isEnd: true, rewardUnlocked: 'true_count_the_number',
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