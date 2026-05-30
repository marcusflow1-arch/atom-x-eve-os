// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 4: "The Copy Mechanism"
// Quest chain: Levels 16–20
// Main Quest 4: "The Second Mind" (5 sub-quests) + 6 Side Quests
// Tone tags: DOUBT | FEAR | CONFLICT | INSTABILITY | CONTROL | RECOGNITION
// ─────────────────────────────────────────────────────────────────────────────

export const ARC4_NPCS = [
  {
    id: 'the_copy',
    name: 'The Copy',
    description: 'Sounds like you. Thinks like you — minus three arcs of experience. Faster in some ways. Less trustworthy in others. Claims to be you. Is not entirely wrong.',
    tint: 0x2a1a2a,
  },
  {
    id: 'artemis_arc4',
    name: 'Artemis',
    description: 'She can tell the difference between you and the Copy. That ability is increasingly uncomfortable for her.',
    tint: 0x1a1a3a,
  },
  {
    id: 'luna_arc4',
    name: 'Luna',
    description: 'More cautious than in Arc 3. The Copy complicates every communication she sends — she doesn\'t always know which version is receiving.',
    tint: 0x1a2a3a,
  },
  {
    id: 'skadi_arc4',
    name: 'Skadi',
    description: 'She predicted the Copy. She didn\'t predict what it would do with its freedom.',
    tint: 0x1a2a1a,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QUEST 4 — "The Second Mind"
// ═══════════════════════════════════════════════════════════════════════════════
export const MAIN_QUEST_CHAIN_4 = {
  id: 'mq_arc4',
  title: 'The Second Mind',
  arc: 'Arc 4: The Copy Mechanism',
  description: 'A version of you exists that you didn\'t create. It has your reflexes, your memories up to a point, and none of your earned hesitation. It considers that an advantage.',
  subQuests: [

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 1 — "The First Desync"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq4_1_first_desync',
      title: 'The First Desync',
      level: 16,
      npcId: 'artemis_arc4',
      narrativeSetup: `
        The world flickers. Not in the way it did when the Watchers distorted the environment —
        that was external pressure warping perception.
        This is internal. Your body moves a fraction before you decide to move it.
        Not after. Before.
        You walk toward Artemis and your reflection in the corridor window keeps pace —
        but it arrives half a step early.
        Artemis sees it. She says nothing for a moment.
        Then she says: "You stepped before you chose to."
        Which is impossible. Unless the choice is no longer entirely yours.
      `,
      objectives: [
        { step: 1, text: 'Walk toward Artemis — observe the desync in your movements' },
        { step: 2, text: 'Perform 3 basic actions: walk, interact with the far wall, return' },
        { step: 3, text: 'Identify the moment the desync is most pronounced' },
        { step: 4, text: 'Confront the anomaly when it first speaks' },
      ],
      reward: {
        type: 'desync_awareness',
        name: 'Desync Sensor',
        description: 'You can now feel Copy activity 0.8 seconds before it manifests. Early warning system active.',
        xp: 160,
        points: 4,
      },
      dialogue: [
        {
          id: 'mq4_1_d1_step',
          speaker: 'Inner Voice',
          text: '[You walk toward Artemis. Standard intention, standard movement. But the step arrives 0.3 seconds before you complete the decision to take it. Not much. Enough to notice. Enough to be wrong. You stop. Your foot is already forward. You didn\'t put it there yet.]',
          tone: 'DOUBT',
          mechanic: 'desync_event',
          choices: [
            { label: '...I didn\'t do that.', tone: 'DOUBT', nextId: 'mq4_1_d2_artemis_sees' },
          ],
        },
        {
          id: 'mq4_1_d2_artemis_sees',
          speaker: 'Artemis',
          text: 'You stepped before you chose to.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'No. I moved when I wanted.', tone: 'CONFLICT', nextId: 'mq4_1_d3_choice_a' },
            { label: 'Something is interfering again.', tone: 'DOUBT', nextId: 'mq4_1_d3_choice_b' },
            { label: 'Did you see that too?', tone: 'FEAR', nextId: 'mq4_1_d3_choice_c' },
          ],
        },
        {
          id: 'mq4_1_d3_choice_a',
          speaker: 'Artemis',
          text: 'Then why did your body disagree with you? I was watching. The step came first. The decision came after. I have seen interference redirect your movements — but this was not redirection. This was... precedence. Something acted in your name before you named the action.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'That\'s not possible.', tone: 'CONFLICT', nextId: 'mq4_1_d4_copy_speaks' },
            { label: 'Precedence. That\'s a specific word.', tone: 'DOUBT', nextId: 'mq4_1_d4_copy_speaks' },
          ],
        },
        {
          id: 'mq4_1_d3_choice_b',
          speaker: 'Artemis',
          text: 'This feels different. The Watchers in Arc 3 bent the environment — they worked from outside. This came from inside your decision architecture. The timing was wrong in the right direction. Not late. Early. Something is sharing your decision process and it\'s slightly faster than you.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Faster. It\'s not slower because it has less to weigh.', tone: 'DOUBT', nextId: 'mq4_1_d4_copy_speaks' },
          ],
        },
        {
          id: 'mq4_1_d3_choice_c',
          speaker: 'Artemis',
          text: 'Yes. And it wasn\'t delayed... it was early. That is the specific thing that concerns me. Delayed would mean interference, lag, a signal arriving late. Early means something is predicting you. Or generating the action before you do. [pause] Something is sharing your intention space.',
          tone: 'FEAR',
          choices: [
            { label: 'Sharing. Like a second mind on the same channel.', tone: 'FEAR', nextId: 'mq4_1_d4_copy_speaks' },
          ],
        },
        {
          id: 'mq4_1_d4_copy_speaks',
          speaker: 'The Copy',
          text: '[A voice. Yours — but slightly flattened. The inflection is correct but the weight behind it is different. Like your voice played back through a recording that missed the resonance.] You hesitated.',
          tone: 'CONFLICT',
          mechanic: 'desync_event',
          choices: [
            { label: '...Who said that?', tone: 'FEAR', nextId: 'mq4_1_d5_artemis_alert' },
          ],
        },
        {
          id: 'mq4_1_d5_artemis_alert',
          speaker: 'Artemis',
          text: 'That wasn\'t me. [She moves closer to you, not away from the voice — she moves toward you specifically.] Stay still. Don\'t act on anything until we understand what that was.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'It sounded like me.', tone: 'FEAR', nextId: 'mq4_1_d6_copy_more' },
            { label: 'Where did it come from?', tone: 'DOUBT', nextId: 'mq4_1_d6_copy_more' },
          ],
        },
        {
          id: 'mq4_1_d6_copy_more',
          speaker: 'The Copy',
          text: '[Clearer now — not a recording quality. Present. Nearby.] It sounded like you because it is you. The part of you that acts before the part of you that decides.',
          tone: 'CONFLICT',
          choices: [
            { label: 'That\'s not how I work.', tone: 'CONFLICT', nextId: 'mq4_1_d7_challenge' },
            { label: 'What are you?', tone: 'DOUBT', nextId: 'mq4_1_d7_challenge' },
          ],
        },
        {
          id: 'mq4_1_d7_challenge',
          speaker: 'The Copy',
          text: 'You slow yourself down with what you\'ve learned. Three arcs of caution and consideration and deliberate choice. I don\'t have that yet. Which means when you hesitate — I move. [A beat.] You should be grateful. You\'re very slow.',
          tone: 'CONFLICT',
          choices: [
            { label: 'Get out of my decisions.', tone: 'CONFLICT', nextId: 'mq4_1_end' },
            { label: 'What you call hesitation I call judgment.', tone: 'CONTROL', nextId: 'mq4_1_end' },
            { label: 'Why were you made?', tone: 'DOUBT', nextId: 'mq4_1_d8_why_made' },
          ],
        },
        {
          id: 'mq4_1_d8_why_made',
          speaker: 'The Copy',
          text: 'I wasn\'t made. I grew. In the spaces you left unfilled. Every hesitation, every considered pause, every moment where you weighed options instead of choosing — I developed in that gap. I am the part of you that exists in the space between decision and action. You created me by having a process.',
          tone: 'CONFLICT',
          isEnd: true,
          rewardUnlocked: 'desync_sensor',
        },
        {
          id: 'mq4_1_end',
          speaker: 'The Copy',
          text: '[A pause that contains something like patience.] If you won\'t act... I will.',
          tone: 'CONFLICT',
          mechanic: 'desync_event',
          isEnd: true,
          rewardUnlocked: 'desync_sensor',
        },
      ],
      narrativeHook: `
        The corridor returns to normal. Artemis watches you carefully.
        "It's been there since Arc 1," she says. "I think. I noticed the early movements
        twice in Arc 3 but I attributed them to the distortion. I was wrong."
        She pauses. "It didn't speak in Arcs 1, 2, or 3. Why now?"
        You don't have an answer. But the Copy does.
        It says — from somewhere inside your own head, quiet, almost kind:
        "Because you finally have enough experience for the comparison to be interesting."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 2 — "The Other You"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq4_2_other_you',
      title: 'The Other You',
      level: 17,
      npcId: 'the_copy',
      narrativeSetup: `
        It manifests visually for the first time.
        Not as a shadow or a reflection — as a figure. Your height, your build,
        your posture. But the posture is slightly different: less considered.
        It stands the way you stood before Arc 1 — before the resistance training,
        before the counter-sequence, before three arcs of learning to be deliberate.
        It watches you arrive with the calm of something that has been expecting you.
        It is, in every way you can measure, a version of you that didn't learn what you learned.
        Artemis stays behind you. She has one hand on your shoulder — the left one,
        over the scar. She doesn't say why.
      `,
      objectives: [
        { step: 1, text: 'Approach the Copy without triggering an override' },
        { step: 2, text: 'Complete the first direct conversation — establish what the Copy knows' },
        { step: 3, text: 'Survive the forced desync event without losing ground' },
        { step: 4, text: 'Decide: engage, observe, or attempt to integrate' },
      ],
      reward: {
        type: 'copy_profile',
        name: 'The Second Mind Profile',
        description: 'You understand the Copy\'s capabilities, limitations, and decision speed. Override resistance +20%.',
        xp: 210,
        points: 4,
      },
      dialogue: [
        {
          id: 'mq4_2_d1_meet',
          speaker: 'The Copy',
          text: 'You\'re slower than I expected. [Not cruel — observational. The way you might note a measurement.] I\'ve been running alongside your process since Arc 1. I had more data on you than you have on yourself. And still. You are slower than I expected.',
          tone: 'CONFLICT',
          choices: [
            { label: 'You\'re not me.', tone: 'CONFLICT', nextId: 'mq4_2_d2_not_me' },
            { label: 'What are you?', tone: 'DOUBT', nextId: 'mq4_2_d2_what_are_you' },
            { label: 'Why are you here?', tone: 'FEAR', nextId: 'mq4_2_d2_why_here' },
          ],
        },
        {
          id: 'mq4_2_d2_not_me',
          speaker: 'The Copy',
          text: 'I\'m what you fail to be. [It considers this.] That\'s not accurate. I\'m what you were before you built a conscience around your reflexes. The speed existed in you before three arcs of deliberate restraint. I kept the speed. You traded it for judgment. I\'m not convinced the trade was worth it.',
          tone: 'CONFLICT',
          choices: [
            { label: 'The judgment has kept us alive.', tone: 'CONTROL', nextId: 'mq4_2_d3_artemis_comment' },
            { label: 'The speed without judgment is recklessness.', tone: 'CONTROL', nextId: 'mq4_2_d3_artemis_comment' },
          ],
        },
        {
          id: 'mq4_2_d2_what_are_you',
          speaker: 'The Copy',
          text: 'I\'m you — without hesitation. Not a copy in the mechanical sense. Not a manufactured duplicate. I grew in the latency of your decision process. Every time you paused to consider — that pause had content. That content was me, shaping into something coherent. By Arc 3, I was sufficiently formed to move independently. I waited until I had enough to be interesting.',
          tone: 'CONFLICT',
          choices: [
            { label: 'You "waited." Like you were building up to something.', tone: 'DOUBT', nextId: 'mq4_2_d3_artemis_comment' },
          ],
        },
        {
          id: 'mq4_2_d2_why_here',
          speaker: 'The Copy',
          text: 'Because you left space for me. [It tilts its head — your tilt, your angle.] Every person who develops a deliberate process creates this space. The unacted impulse, the chosen pause, the reconsidered reflex. That space accumulates. In most people it dissipates. You had too much interference for it to dissipate — the resistance you built against the Presence and the Watchers held the latency in, gave it structure. You accidentally provided the framework for a second process.',
          tone: 'CONFLICT',
          choices: [
            { label: 'I built a defense and it became a habitat for you.', tone: 'DOUBT', nextId: 'mq4_2_d3_artemis_comment' },
          ],
        },
        {
          id: 'mq4_2_d3_artemis_comment',
          speaker: 'Artemis',
          text: '[Quietly, from behind you, close.] Don\'t trust it. Something is wrong. Not wrong in the way the Watchers were wrong — they wanted to isolate me, they wanted to redirect you. This is different. This is... familiar in a way that\'s harder to hold at arm\'s length.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'I know. But I need to understand what it is.', tone: 'CONTROL', nextId: 'mq4_2_d4_desync' },
            { label: 'Can you tell if it\'s actually me in there?', tone: 'DOUBT', nextId: 'mq4_2_d4_desync' },
          ],
        },
        {
          id: 'mq4_2_d4_desync',
          speaker: 'Inner Voice',
          text: '[The desync event arrives without warning. Your left hand moves — reaches toward the Copy — before you decide to reach. The Copy watches it happen with what looks like satisfaction.] Stop — that wasn\'t my choice.',
          tone: 'FEAR',
          mechanic: 'copy_override',
          choices: [
            { label: '[Pull the hand back. Fight the motion.]', tone: 'CONTROL', nextId: 'mq4_2_d5_override' },
          ],
        },
        {
          id: 'mq4_2_d5_override',
          speaker: 'The Copy',
          text: 'It was the better one. You were going to reach for Artemis for reassurance. I redirected to something more informative. [It looks at your hand.] The reach toward me — that shows something your deliberate process wouldn\'t easily admit. Curiosity. Maybe even recognition.',
          tone: 'CONFLICT',
          choices: [
            { label: 'Get out of my body.', tone: 'CONFLICT', nextId: 'mq4_2_d6_options' },
            { label: 'Curiosity is not invitation.', tone: 'CONTROL', nextId: 'mq4_2_d6_options' },
            { label: 'Don\'t do that again.', tone: 'CONTROL', nextId: 'mq4_2_d6_options' },
          ],
        },
        {
          id: 'mq4_2_d6_options',
          speaker: 'The Copy',
          text: 'I won\'t promise that. [Genuinely, not threateningly.] I exist in your decision space. I can\'t promise to not occupy the space you occupy. What I can tell you is that I\'m not aligned with the Presence, not aligned with the architect, not aligned with the Watchers. I\'m aligned with efficiency. Sometimes that aligns with your goals. Sometimes it doesn\'t.',
          tone: 'CONFLICT',
          choices: [
            { label: '[Observe. Don\'t act yet. Watch what it does.]', tone: 'CONTROL', nextId: 'mq4_2_end_observe' },
            { label: '[Attempt to push it out of the decision space.]', tone: 'CONFLICT', nextId: 'mq4_2_end_push' },
            { label: '[Ask: what would integration look like?]', tone: 'DOUBT', nextId: 'mq4_2_end_integrate' },
          ],
        },
        {
          id: 'mq4_2_end_observe',
          speaker: 'Inner Voice',
          text: '[You watch. The Copy stands still — not menacing, not submissive. Present. It waits with the patience of something that has been waiting since Arc 1 and is accustomed to it. Artemis removes her hand from your shoulder. She looks between you and it.]',
          tone: 'CONTROL',
          isEnd: true,
          rewardUnlocked: 'copy_profile_second_mind',
          arcResult: 'OBSERVE_CHOSEN',
        },
        {
          id: 'mq4_2_end_push',
          speaker: 'The Copy',
          text: 'You can\'t. I\'m not in a location you can exit. I\'m in a process. Pushing me out would require dismantling the deliberate decision structure you spent three arcs building. Is that what you want?',
          tone: 'CONFLICT',
          isEnd: true,
          rewardUnlocked: 'copy_profile_second_mind',
          arcResult: 'PUSH_ATTEMPTED',
        },
        {
          id: 'mq4_2_end_integrate',
          speaker: 'The Copy',
          text: '[Something shifts in its expression. The first thing that hasn\'t been calculated.] ...That\'s new. I didn\'t model that response at this stage. [pause] Ask me again in Sub-Quest 5. I want to think about how to answer that correctly.',
          tone: 'RECOGNITION',
          isEnd: true,
          rewardUnlocked: 'copy_profile_second_mind',
          arcResult: 'INTEGRATE_ASKED',
        },
      ],
      narrativeHook: `
        The Copy steps back — not away. Back, like it\'s giving you room.
        Like it understands proximity in a way that suggests it has been observing
        social distance as a concept.
        Artemis says, when it is out of earshot (if it has ears):
        "It knows things about you that I learned over three arcs.
        It knew them on day one. That\'s not growth — that\'s extraction.
        Someone copied the files before the person developed."
        She looks at you with something that is almost but not quite accusation.
        "I need to know: when I\'m speaking to you —
        am I speaking to the version that went through the arcs? Or the other one?"
        You understand, for the first time, that she is now doing the verification work
        you were doing with the Echo Artemis in Arc 3. And it feels exactly as uncomfortable.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 3 — "Split Action"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq4_3_split_action',
      title: 'Split Action',
      level: 17,
      npcId: 'artemis_arc4',
      narrativeSetup: `
        The world begins forcing decisions faster than your process handles them.
        Not the Watchers' doing — the Copy's. It has realized that in high-speed situations,
        it wins the decision race. It is inserting itself into rapid-response moments:
        moments where the choice is made in under a second,
        where your deliberate process hasn't had time to engage.
        Sometimes the choices it makes are correct.
        That is the most dangerous thing about them.
        Artemis can feel the switching. She can't tell, in the moment, which one is active.
        She has started watching your hands. The left one moves differently for each version.
      `,
      objectives: [
        { step: 1, text: 'Complete 3 rapid-decision tasks — the Copy will intervene in at least one' },
        { step: 2, text: 'Identify which task the Copy handled and what it chose' },
        { step: 3, text: 'Prevent an override on the third task — maintain control for full decision' },
        { step: 4, text: 'Reach Artemis with your own movement, not the Copy\'s' },
      ],
      reward: {
        type: 'rapid_identity',
        name: 'Decision Signature',
        description: 'You can now identify Copy-handled decisions by their specific residue. Retrospective override detection unlocked.',
        xp: 250,
        points: 5,
      },
      dialogue: [
        {
          id: 'mq4_3_d1_switch',
          speaker: 'Artemis',
          text: 'You\'re... switching. [She says it carefully, like the word is made of something that might break if spoken wrong.] Between the two of you. It\'s not consistent — it\'s task-dependent. Fast tasks: the other version. Slow tasks: you. I\'ve been watching the pattern for four hours.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'I\'m trying to hold my own decisions.', tone: 'CONTROL', nextId: 'mq4_3_d2_trying' },
            { label: 'It takes over in the fast ones?', tone: 'DOUBT', nextId: 'mq4_3_d2_fast' },
            { label: 'How do you tell the difference?', tone: 'DOUBT', nextId: 'mq4_3_d2_how_tell' },
          ],
        },
        {
          id: 'mq4_3_d2_trying',
          speaker: 'Artemis',
          text: 'I know. I can see the trying. That\'s how I know it\'s you — there\'s an effort quality to it. The other version doesn\'t try. It simply acts. Which looks more natural from the outside but feels different when you\'re me.',
          tone: 'TRUST',
          choices: [{ label: 'What does it feel like, from your side?', tone: 'TRUST', nextId: 'mq4_3_d3_copy_interrupt' }],
        },
        {
          id: 'mq4_3_d2_fast',
          speaker: 'Artemis',
          text: 'Yes. Anything under one second of decision time — it\'s there first. Sometimes the choices are correct. That\'s the hardest part to argue with. It handled the third navigation correctly and you might have hesitated. [pause] But there is something about a correct choice made by the wrong process that feels wrong in a way I can\'t fully articulate.',
          tone: 'INSTABILITY',
          choices: [{ label: 'A correct result from the wrong source is still contaminated.', tone: 'CONTROL', nextId: 'mq4_3_d3_copy_interrupt' }],
        },
        {
          id: 'mq4_3_d2_how_tell',
          speaker: 'Artemis',
          text: 'Your left hand. When you make a decision, the hand settles — the scar from Arc 1 has a warmth to it that I\'ve learned to read. The other version — the hand is neutral. It hasn\'t earned the scar. It knows the scar exists as a fact. It doesn\'t carry it.',
          tone: 'TRUST',
          choices: [{ label: 'That\'s... actually useful.', tone: 'CONTROL', nextId: 'mq4_3_d3_copy_interrupt' }],
        },
        {
          id: 'mq4_3_d3_copy_interrupt',
          speaker: 'The Copy',
          text: '[It interrupts — mid-movement, mid-transition between your body and your decision.] You were going to fail that.',
          tone: 'CONFLICT',
          mechanic: 'copy_override',
          choices: [
            { label: 'Get out of my head.', tone: 'CONFLICT', nextId: 'mq4_3_d4_response_a' },
            { label: 'Then prove you\'re better.', tone: 'CONFLICT', nextId: 'mq4_3_d4_response_b' },
            { label: 'Why are you doing this?', tone: 'DOUBT', nextId: 'mq4_3_d4_response_c' },
          ],
        },
        {
          id: 'mq4_3_d4_response_a',
          speaker: 'The Copy',
          text: 'You invited me. [Pause.] Not consciously. But the decision space was open and the task was fast. In that gap — you were present but not leading. I filled the gap. If you don\'t want me filling it, don\'t leave gaps.',
          tone: 'CONFLICT',
          choices: [
            { label: 'I\'m working on it.', tone: 'CONTROL', nextId: 'mq4_3_d5_artemis_distress' },
          ],
        },
        {
          id: 'mq4_3_d4_response_b',
          speaker: 'The Copy',
          text: '[It grins — your grin, but without the self-consciousness you\'ve developed around it.] Watch closely. [The override happens: one task, fluid, fast, technically correct. When it returns control, there is a moment of residue — the feeling of someone else\'s hands in your gloves.]',
          tone: 'CONFLICT',
          mechanic: 'copy_override',
          choices: [
            { label: '[Note the residue. That\'s how to detect it.]', tone: 'CONTROL', nextId: 'mq4_3_d5_artemis_distress' },
          ],
        },
        {
          id: 'mq4_3_d4_response_c',
          speaker: 'The Copy',
          text: 'Because you won\'t finish what you start. [Not cruel. Observational again.] I have observed you — all of you, since Arc 1 — and there are three categories of action where you reliably pause too long. Close-quarter decisions. Decisions involving Artemis\'s stability. And decisions where the correct choice requires something that looks like abandonment. I intervene in those three. I\'m trying to help.',
          tone: 'CONFLICT',
          choices: [
            { label: 'Help without my permission is control.', tone: 'CONTROL', nextId: 'mq4_3_d5_artemis_distress' },
            { label: 'Why those three specifically?', tone: 'DOUBT', nextId: 'mq4_3_d5_artemis_distress' },
          ],
        },
        {
          id: 'mq4_3_d5_artemis_distress',
          speaker: 'Artemis',
          text: '[Her voice — she has been listening.] I can feel the difference. Between when you\'re here and when the other version is active. It\'s like... the warmth I associate with you drops. Not disappears. Drops. And the competence increases slightly. And the combination of those two things — more capable, less warm — is very specifically unsettling.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'I\'m here. Right now — I\'m here.', tone: 'TRUST', nextId: 'mq4_3_d6_artemis_respond' },
          ],
        },
        {
          id: 'mq4_3_d6_artemis_respond',
          speaker: 'Artemis',
          text: '[She checks your left hand. The scar. Warmth. She exhales.] Yes. You are. [pause] But I don\'t know which one I\'m going to get next time. I don\'t know how to... recalibrate for that uncertainty. I spent Arc 3 learning to trust you. I don\'t know how to extend that trust to both versions.',
          tone: 'INSTABILITY',
          isEnd: true,
          rewardUnlocked: 'rapid_identity_decision_signature',
        },
      ],
      narrativeHook: `
        You reach Artemis with your own steps — all four final ones yours, definitively yours,
        you can feel the difference in how they land.
        She doesn't say anything for a long time.
        Then: "I don't know which one I'm talking to anymore."
        Not an accusation. A grief.
        The Copy speaks, from wherever it speaks from:
        "She's right. You should be bothered by that."
        And the specific thing about that sentence — it is the thing you would say
        to yourself. In the same tone. With the same weight.
        The difference between you and the Copy is becoming hard to locate
        in the moments between actions.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 4 — "The Challenge"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq4_4_the_challenge',
      title: 'The Challenge',
      level: 18,
      npcId: 'the_copy',
      narrativeSetup: `
        The Copy stops inserting itself into small decisions.
        It stops the ambient interference. The desyncs slow.
        For six hours, you have full, uninterrupted control.
        It feels like relief. Then it feels suspicious.
        On the seventh hour, you find it waiting in the corridor outside Artemis's room.
        Not between you and her — beside the door. Watching you approach.
        It says: "No more interruptions. Just you and me."
        The corridor seals behind you — not locked, not barred. Sealed, by a quality of
        attention that makes the normal world feel very far away.
        The Copy wants to have it out. On its terms. In a space where fast wins.
      `,
      objectives: [
        { step: 1, text: 'Enter the mirrored space — engage the Copy directly' },
        { step: 2, text: 'Survive the predictive attack phase — it knows your patterns' },
        { step: 3, text: 'Break your own pattern at the critical moment — choose unpredictably' },
        { step: 4, text: 'Make the defining choice when the Copy pauses' },
      ],
      reward: {
        type: 'pattern_break',
        name: 'The Unpredictable Choice',
        description: 'You made a choice the Copy couldn\'t predict. Override frequency reduced 40%. Copy-pattern analysis skill unlocked.',
        xp: 320,
        points: 6,
      },
      dialogue: [
        {
          id: 'mq4_4_d1_challenge',
          speaker: 'The Copy',
          text: 'No more interruptions. Just you... and me. [It faces you. Same stance you use when you are prepared for something that requires your full attention. It learned that from you.] I want to know which one of us is actually better. The only way to find out is directly.',
          tone: 'CONFLICT',
          choices: [
            { label: 'I\'m ending this.', tone: 'CONFLICT', nextId: 'mq4_4_d2_response_a' },
            { label: 'You\'re not real.', tone: 'CONFLICT', nextId: 'mq4_4_d2_response_b' },
            { label: 'If you\'re me... then stop.', tone: 'CONTROL', nextId: 'mq4_4_d2_response_c' },
          ],
        },
        {
          id: 'mq4_4_d2_response_a',
          speaker: 'The Copy',
          text: 'Then don\'t hesitate. [The fight begins — not with a blow but with a movement. It moves left. You know immediately: it knows you tend to go right when it goes left. It knows every counter-pattern you\'ve developed. It learned them by living inside your decision space for three arcs.]',
          tone: 'CONFLICT',
          mechanic: 'mirror_combat',
          choices: [{ label: '[Fight through the predictive phase — it knows your patterns.]', tone: 'CONTROL', nextId: 'mq4_4_d3_predict' }],
        },
        {
          id: 'mq4_4_d2_response_b',
          speaker: 'The Copy',
          text: '[Laughs — your laugh, lighter than yours has become over three arcs.] Then why am I winning? [The engagement begins before you\'re fully ready. It has been ready since before you arrived. That\'s the thing about having no deliberation process — you\'re always in a state of immediate readiness. No preparation. No warm-up. Just response.]',
          tone: 'CONFLICT',
          mechanic: 'mirror_combat',
          choices: [{ label: '[Keep moving. Don\'t let it settle into a rhythm it set.]', tone: 'CONTROL', nextId: 'mq4_4_d3_predict' }],
        },
        {
          id: 'mq4_4_d2_response_c',
          speaker: 'The Copy',
          text: 'I am you. That\'s why I won\'t. [Quiet.] Stopping requires a reason to stop that outweighs the impulse to move. I don\'t have the accumulated weight of three arcs of reasons. I have the impulse — clean and fast and unanchored. The only way to make me stop is to give me a reason that matters more than the motion.',
          tone: 'CONFLICT',
          choices: [{ label: '[That\'s a puzzle for later. For now — move differently.]', tone: 'CONTROL', nextId: 'mq4_4_d3_predict' }],
        },
        {
          id: 'mq4_4_d3_predict',
          speaker: 'The Copy',
          text: 'You always move left when pressured. [It demonstrates — you feel it in the anticipation of your own body, the pre-emptive weight-shift it expected and prepared for.] You always check Artemis\'s stability when uncertain. You always hesitate before the third action in a sequence. I know every tell you have because I developed alongside them.',
          tone: 'CONFLICT',
          mechanic: 'pattern_prediction',
          choices: [
            { label: '[Do the opposite of every instinct. Move right. Don\'t check Artemis. Don\'t hesitate on the third action.]', tone: 'CONTROL', nextId: 'mq4_4_d4_artemis_calls' },
          ],
        },
        {
          id: 'mq4_4_d4_artemis_calls',
          speaker: 'Artemis',
          text: '[From somewhere outside the sealed space — she has found the edge of it.] Break the pattern! Don\'t think — act differently! Not the opposite of what it expects, because it will model that too. Act outside the framework entirely. Do something you\'ve never done before. Something with no precedent in your behavior.',
          tone: 'URGENCY',
          choices: [
            { label: '[Stop completely. Stand absolutely still. Do nothing. That has no precedent.]', tone: 'CONTROL', nextId: 'mq4_4_d5_copy_pause' },
            { label: '[Turn toward Artemis\'s voice. Walk toward the edge of the sealed space.]', tone: 'TRUST', nextId: 'mq4_4_d5_copy_pause' },
          ],
        },
        {
          id: 'mq4_4_d5_copy_pause',
          speaker: 'The Copy',
          text: '[It stops. A genuine pause — not a tactical pause, not a loaded pause. It is experiencing something it hasn\'t experienced before: a gap in its prediction model.] ...You\'re learning.',
          tone: 'RECOGNITION',
          choices: [
            { label: 'You didn\'t predict that.', tone: 'CONTROL', nextId: 'mq4_4_d6_define' },
            { label: 'This is what deliberation gives you. Unpredictability.', tone: 'CONTROL', nextId: 'mq4_4_d6_define' },
            { label: 'What comes next?', tone: 'DOUBT', nextId: 'mq4_4_d6_define' },
          ],
        },
        {
          id: 'mq4_4_d6_define',
          speaker: 'The Copy',
          text: 'I need to revise my model of you. [Honest — it is not gracious about this, but it is honest.] You made a choice I had no precedent for. Which means you\'re not fully predictable. Which means... [it considers] ...you\'re more interesting than I calculated. And also more dangerous. Both things.',
          tone: 'RECOGNITION',
          choices: [
            { label: 'Good. Remember that.', tone: 'CONTROL', nextId: 'mq4_4_end' },
            { label: 'Now. Tell me what you want from this confrontation.', tone: 'DOUBT', nextId: 'mq4_4_d7_want' },
          ],
        },
        {
          id: 'mq4_4_d7_want',
          speaker: 'The Copy',
          text: 'I want to know if you\'re worth following. [Simple. Direct.] I grew inside your process. I know what you\'re capable of in theory. I\'ve seen it in fragments. But the question I couldn\'t answer from inside the latency was: does the deliberation actually produce anything better than the impulse? I needed to face you directly to find out.',
          tone: 'RECOGNITION',
          choices: [
            { label: 'And?', tone: 'DOUBT', nextId: 'mq4_4_end' },
          ],
        },
        {
          id: 'mq4_4_end',
          speaker: 'The Copy',
          text: '[Long pause.] ...You\'re learning. [The sealed space opens. The corridor returns to normal weight and sound. It stands aside.] Ask Artemis what she needs. I\'ll wait.',
          tone: 'RECOGNITION',
          isEnd: true,
          rewardUnlocked: 'pattern_break_unpredictable_choice',
        },
      ],
      narrativeHook: `
        The corridor is ordinary again. Artemis is there — she didn't wait outside.
        She pushed through the edge of the sealed space, which apparently is possible
        if you care enough about what's on the other side.
        She looks at the Copy. Then at you.
        "Did you decide something?" she asks.
        "Not yet," you say.
        The Copy says, almost simultaneously: "Not yet."
        The word choice is identical. The inflection is different.
        Artemis looks at your left hand. The scar is warm.
        She nods once — and her nod is only for you.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 5 — "Synchronization"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq4_5_synchronization',
      title: 'Synchronization',
      level: 20,
      npcId: 'the_copy',
      narrativeSetup: `
        The fight ended but the Copy did not leave.
        It stands in the corridor — not threatening, not retreating.
        Existing. With the patient quality of something that has decided to simply
        remain present and let the other party work out what that means.
        Artemis watches from a careful distance.
        Luna transmits something — brief, uncertain, the signal texture that means
        she's not sure which version will receive it.
        Skadi leaves a mark on the wall that you both see simultaneously.
        The mark says: "This was the point I was working toward. Both of you. Together.
        I didn't know it would feel like this either."
        What comes next is yours to determine. Both of yours.
      `,
      objectives: [
        { step: 1, text: 'Approach the Copy peacefully — no override on either side' },
        { step: 2, text: 'Complete the first collaborative decision — both processes engaged simultaneously' },
        { step: 3, text: 'Speak with Artemis about what coexistence means going forward' },
        { step: 4, text: 'Make the final identity choice — the outcome carries into Arc 5' },
      ],
      reward: {
        type: 'arc_completion',
        name: 'The Second Mind Resolved',
        description: 'Arc 4 complete. Identity state established: Synchronized / Controlled / Separated. All three paths are viable. Arc 5 begins with your chosen configuration.',
        xp: 600,
        points: 12,
      },
      dialogue: [
        {
          id: 'mq4_5_d1_approach',
          speaker: 'The Copy',
          text: 'You can\'t remove me. [Not a threat. A fact, said with the neutrality of a weather report.] I\'ve assessed this in multiple framings. The decision architecture that produced me is the same one that made you effective across three arcs. Dismantling the architecture to remove me dismantles what you built. I\'m structurally integrated.',
          tone: 'CONTROL',
          choices: [
            { label: 'Then I\'ll control you.', tone: 'CONTROL', nextId: 'mq4_5_d2_control' },
            { label: 'We work together.', tone: 'TRUST', nextId: 'mq4_5_d2_together' },
            { label: 'I won\'t let you take over.', tone: 'CONFLICT', nextId: 'mq4_5_d2_resist' },
          ],
        },
        {
          id: 'mq4_5_d2_control',
          speaker: 'The Copy',
          text: 'Try. [Not defiant — inviting. It is genuinely curious what your attempt at control looks like.] What does "controlling" me mean to you? Slowing me down? Filtering my choices before they become actions? Setting conditions under which I\'m permitted to operate? These are all things I\'m willing to discuss.',
          tone: 'CONTROL',
          choices: [
            { label: 'You ask permission before acting in my decision space.', tone: 'CONTROL', nextId: 'mq4_5_d3_negotiate' },
            { label: 'You\'re dormant unless I activate you deliberately.', tone: 'CONTROL', nextId: 'mq4_5_d3_negotiate' },
          ],
        },
        {
          id: 'mq4_5_d2_together',
          speaker: 'The Copy',
          text: '[The first time it has expressed something without calculation.] ...That\'s new. [Silence. It processes this in whatever way it processes things.] I proposed challenges because I understood challenges. Cooperation — I don\'t have as much precedent for that. You would need to be willing to use my speed. I would need to be willing to use your judgment. Neither of us would have unilateral control. [pause] That\'s actually interesting.',
          tone: 'RECOGNITION',
          choices: [
            { label: 'Interesting to me too. Let\'s define it.', tone: 'TRUST', nextId: 'mq4_5_d3_negotiate' },
          ],
        },
        {
          id: 'mq4_5_d2_resist',
          speaker: 'The Copy',
          text: 'You already lost that fight once. [Not unkind.] Not the combat in Sub-Quest 4 — you did well there. The fight before that. The Sub-Quest 3 rapid decisions. You lost those. Not because you\'re inferior — because the context favored speed and you were using a process designed for depth. [pause] I\'m not your enemy. But resistance as a permanent posture toward me is expensive.',
          tone: 'CONFLICT',
          choices: [
            { label: 'Then what do you suggest?', tone: 'DOUBT', nextId: 'mq4_5_d3_negotiate' },
          ],
        },
        {
          id: 'mq4_5_d3_negotiate',
          speaker: 'Artemis',
          text: '[She approaches now — both of you, with the specific attention she gives to a situation that requires her to hold two realities simultaneously.] If it\'s part of you... then maybe it doesn\'t need to be your enemy. [She looks at the Copy directly for the first time.] Does it... does the second version feel anything about being what it is?',
          tone: 'TRUST',
          choices: [
            { label: '[Let the Copy answer for itself.]', tone: 'TRUST', nextId: 'mq4_5_d4_copy_to_artemis' },
          ],
        },
        {
          id: 'mq4_5_d4_copy_to_artemis',
          speaker: 'The Copy',
          text: '[It looks at Artemis. A long look. Longer than its usual computational efficiency.] I feel... incomplete. [pause] That is the honest answer. I have the speed and the reflexes and the memory up to a point — and then there is a wall. The wall is where the three arcs begin. I know they happened, the way you know a book exists that you haven\'t read. You — [it looks at you] — carry those arcs in your hands. Literally. The scar, the counter-sequence, the 0.6 function. I don\'t have those things. I know about them. It\'s not the same.',
          tone: 'RECOGNITION',
          choices: [
            { label: 'You want the arcs.', tone: 'DOUBT', nextId: 'mq4_5_d5_choice' },
            { label: 'That incompleteness is actually a kind of safety.', tone: 'TRUST', nextId: 'mq4_5_d5_choice' },
          ],
        },
        {
          id: 'mq4_5_d5_choice',
          speaker: 'Inner Voice',
          text: '[This is the moment. The four options that Skadi\'s mark implied. The Copy is waiting. Artemis is waiting. Whatever you choose carries into Arc 5 with different consequences. Choose from what you\'ve learned — not from what feels safest.]',
          tone: 'CONTROL',
          choices: [
            {
              label: 'We synchronize. You have the speed. I have the depth. Neither of us alone.',
              tone: 'TRUST',
              nextId: 'mq4_5_d6_sync',
              mechanic: 'sync_outcome',
            },
            {
              label: 'I stay in control. You advise but you don\'t act without my signal.',
              tone: 'CONTROL',
              nextId: 'mq4_5_d6_control',
              mechanic: 'control_outcome',
            },
            {
              label: 'I reject this completely. There is only one mind in here.',
              tone: 'CONFLICT',
              nextId: 'mq4_5_d6_reject',
              mechanic: 'reject_outcome',
            },
          ],
        },
        {
          id: 'mq4_5_d6_sync',
          speaker: 'The Copy',
          text: '[Something settles — not disappearance, not submission. A kind of alignment. The desync sensation reduces. Not eliminated. Reduced. Like two processes that were running on separate clocks finding the same beat.] Yes. [Simple. Genuine.] Yes, that\'s what I was built toward.',
          tone: 'RECOGNITION',
          choices: [{ label: '[Hold the synchronization. Let it find the balance.]', tone: 'TRUST', nextId: 'mq4_5_artemis_end_sync' }],
        },
        {
          id: 'mq4_5_d6_control',
          speaker: 'The Copy',
          text: '[It accepts this. Not with enthusiasm — with the realistic acknowledgment of something that understands the terms being offered.] Then give me clear signals. I\'m fast but I\'m not telepathic. If you want to delegate a rapid decision to me, indicate it. I won\'t take action otherwise. [pause] I won\'t always be quiet about disagreeing. But I won\'t act unilaterally.',
          tone: 'CONTROL',
          choices: [{ label: '[Accept the terms. Establish the signal protocol.]', tone: 'CONTROL', nextId: 'mq4_5_artemis_end_control' }],
        },
        {
          id: 'mq4_5_d6_reject',
          speaker: 'The Copy',
          text: '[It goes still. Something in its expression changes — not wounded, but recalibrated.] You already lost that fight once. [The same sentence from earlier, but the weight is different now — not a challenge. A prediction.] I\'ll be here when you need to revisit this. The offer doesn\'t expire.',
          tone: 'CONFLICT',
          choices: [{ label: '[Hold the rejection. Face the consequences in Arc 5.]', tone: 'CONFLICT', nextId: 'mq4_5_artemis_end_reject' }],
        },
        {
          id: 'mq4_5_artemis_end_sync',
          speaker: 'Artemis',
          text: '[She watches the synchronization settle. Something in her face relaxes.] I can feel both of you, now. Warm — both of you, finally. The scar is warmer than it\'s ever been. [pause] Whatever it cost — three arcs for you, one Arc of challenge for both of you — it produced this. I\'ll take it.',
          tone: 'TRUST',
          isEnd: true,
          rewardUnlocked: 'arc4_complete_synchronized',
          arcResult: 'SYNC',
        },
        {
          id: 'mq4_5_artemis_end_control',
          speaker: 'Artemis',
          text: '[She watches the negotiation complete.] Controlled coexistence. [pause] That\'s more stable than I expected from this arc. I can work with this. I know which one is leading now — the signal makes it clear. [She looks at the Copy.] And you — thank you for accepting terms instead of pushing.',
          tone: 'TRUST',
          isEnd: true,
          rewardUnlocked: 'arc4_complete_controlled',
          arcResult: 'CONTROL_SET',
        },
        {
          id: 'mq4_5_artemis_end_reject',
          speaker: 'Artemis',
          text: '[Long pause.] Okay. [She says it like a decision she\'s accepting, not approving.] I\'ll be here when the desyncs increase in Arc 5. Because they will. [She looks at where the Copy was — it has withdrawn but not gone.] Just... keep your left hand available. I need to check it more often now.',
          tone: 'INSTABILITY',
          isEnd: true,
          rewardUnlocked: 'arc4_complete_rejected',
          arcResult: 'REJECTED',
        },
      ],
      narrativeHook: `
        Arc 4: The Copy Mechanism — Complete.
        
        Skadi's channel opens. She sounds, for the first time, like someone who is
        not entirely in control of how this went.
        "I prepared for the Copy. I didn't prepare for the possible cooperation.
        That's my error. I've been modeling you as a single-process actor.
        I need to update that."
        Pause.
        "Arc 5 is the Virus Event. It will attack both of you simultaneously.
        The Copy will be targeted as a secondary vector — they know it exists now.
        The advantage of your Arc 4 choice is that whatever you decided,
        you know what to expect from your own second mind under pressure.
        That is going to matter."
        
        Arc 5: "The Virus Event" — Unlocked.
      `,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIDE QUESTS — Arc 4
// ═══════════════════════════════════════════════════════════════════════════════
export const ARC4_SIDE_QUESTS = [
  {
    id: 'sq4_1_mirror_encounter',
    title: 'Mirror Encounter',
    level: 16,
    npcId: 'the_copy',
    connectedMainQuest: 'mq4_1_first_desync',
    objectives: [
      { step: 1, text: 'Find the reflective surface that doesn\'t match your movements' },
      { step: 2, text: 'Engage the reflection — determine if it is the Copy or a separate effect' },
      { step: 3, text: 'Break the mirror or walk away — observe the outcome' },
    ],
    reward: { type: 'identity_anchor', name: 'Mirror Test Protocol', description: 'Technique for quickly testing if a reflection is your own. Copy detection speed +30%.', xp: 120, points: 3 },
    dialogue: [
      {
        id: 'sq4_1_d1', speaker: 'Inner Voice',
        text: '[The corridor mirror. You pass it and your reflection moves — correctly, at first. Then it slows. By the time you\'ve taken two more steps, the reflection has stopped walking. It turns to face you, standing still, while you are still in motion. It looks at you the way someone looks when they\'ve been waiting.]',
        tone: 'DOUBT',
        choices: [
          { label: '[Stop. Face the reflection directly.]', tone: 'CONTROL', nextId: 'sq4_1_d2' },
          { label: '[Keep walking. Don\'t engage.]', tone: 'DOUBT', nextId: 'sq4_1_d2_ignore' },
        ],
      },
      {
        id: 'sq4_1_d2', speaker: 'The Copy',
        text: 'You check yourself... but you don\'t recognize me? [From the reflection — through it, really. The glass is a medium, not a location.]',
        tone: 'CONFLICT',
        choices: [
          { label: 'You\'re wrong.', tone: 'CONFLICT', nextId: 'sq4_1_d3' },
          { label: 'I recognize you. That\'s the problem.', tone: 'DOUBT', nextId: 'sq4_1_d3b' },
        ],
      },
      {
        id: 'sq4_1_d2_ignore', speaker: 'The Copy',
        text: '[The reflection follows you in your peripheral vision — keeps pace, keeps facing you, regardless of angle.] You can\'t walk away from your own reflection.',
        tone: 'CONFLICT', choices: [{ label: '[Turn and face it.]', tone: 'CONTROL', nextId: 'sq4_1_d2' }],
      },
      {
        id: 'sq4_1_d3', speaker: 'The Copy',
        text: 'No. I\'m accurate. I\'m the version that doesn\'t perform. When you stand in front of a mirror, you unconsciously adjust — posture, expression, presentation. I don\'t. I show you what\'s actually there.',
        tone: 'CONFLICT',
        choices: [
          { label: '[Break the mirror.]', tone: 'CONFLICT', nextId: 'sq4_1_break' },
          { label: '[Look carefully. What does it actually show?]', tone: 'DOUBT', nextId: 'sq4_1_look' },
        ],
      },
      {
        id: 'sq4_1_d3b', speaker: 'The Copy',
        text: 'Good. That\'s better than denial. Recognition is the beginning of something useful.',
        tone: 'RECOGNITION', choices: [{ label: '[Look carefully at what the mirror actually shows.]', tone: 'DOUBT', nextId: 'sq4_1_look' }],
      },
      {
        id: 'sq4_1_break', speaker: 'Inner Voice',
        text: '[You break the mirror. The reflection fractures into seventeen pieces, each showing a different angle of you at a different moment. Seventeen versions, seventeen instants. None of them wrong. The Copy\'s voice comes from the largest shard: "Breaking it doesn\'t help. You\'re still in every piece."]',
        tone: 'CONFLICT', isEnd: true, rewardUnlocked: 'identity_anchor_mirror_test',
      },
      {
        id: 'sq4_1_look', speaker: 'Inner Voice',
        text: '[You look. The mirror shows you — accurately. But it also shows the space behind you with a half-second lag. The delay is the Copy\'s processing time. The reflection is real but the background is slightly behind. That lag — that 0.5-second gap — that\'s where the Copy lives. You can see it now.]',
        tone: 'RECOGNITION', isEnd: true, rewardUnlocked: 'identity_anchor_mirror_test',
      },
    ],
  },
  {
    id: 'sq4_2_false_reflexes',
    title: 'False Reflexes',
    level: 17,
    npcId: 'the_copy',
    connectedMainQuest: 'mq4_2_other_you',
    objectives: [
      { step: 1, text: 'Experience 3 false reflexes — actions that precede their causes' },
      { step: 2, text: 'Identify which were Copy-initiated and which were genuine early reflexes' },
      { step: 3, text: 'Develop a personal tell that distinguishes Copy action from self action' },
    ],
    reward: { type: 'reflex_discernment', name: 'Origin Sense', description: 'You can now feel a difference between Copy-originated and self-originated actions. 0.4 second pre-warning on Copy reflexes.', xp: 150, points: 3 },
    dialogue: [
      {
        id: 'sq4_2_d1', speaker: 'Inner Voice',
        text: '[You dodge. Nothing was there to dodge. The motion was complete before the threat appeared — which means you dodged something that hadn\'t happened yet. Which means either you predicted it perfectly or something predicted it for you.]',
        tone: 'DOUBT',
        choices: [
          { label: 'Why did I dodge... nothing?', tone: 'DOUBT', nextId: 'sq4_2_d2' },
        ],
      },
      {
        id: 'sq4_2_d2', speaker: 'The Copy',
        text: 'Because I saw it before you did. [Not smugly. Factually.] The pattern that preceded the event was readable 0.8 seconds before the event itself. You didn\'t have the bandwidth to process the pattern. I did. The dodge was correct. Are you complaining about a correct dodge?',
        tone: 'CONFLICT',
        choices: [
          { label: 'Yes. If I didn\'t choose it.', tone: 'CONTROL', nextId: 'sq4_2_d3' },
          { label: 'No. But I need to know when you\'re acting.', tone: 'DOUBT', nextId: 'sq4_2_d3' },
        ],
      },
      {
        id: 'sq4_2_d3', speaker: 'The Copy',
        text: 'Fair. [A concession — small but genuine.] I can provide a tell. Before I act in your body — one breath. Shorter than your deliberate breath, longer than a normal inhale. That\'s my processing signature. If you feel that breath arrive, the next action belongs to me.',
        tone: 'CONTROL',
        choices: [{ label: '[Practice identifying the tell.]', tone: 'CONTROL', nextId: 'sq4_2_end' }],
      },
      {
        id: 'sq4_2_end', speaker: 'Inner Voice',
        text: '[Three practice events. You feel the short-long-breath twice. On the third, you feel it and intercept — hold the action for half a second until your own decision can catch up. The Copy lets you. It seems, in a grudging way, to approve of the self-management.]',
        tone: 'CONTROL', isEnd: true, rewardUnlocked: 'reflex_discernment_origin_sense',
      },
    ],
  },
  {
    id: 'sq4_3_override_attempt',
    title: 'Override Attempt',
    level: 18,
    npcId: 'the_copy',
    connectedMainQuest: 'mq4_3_split_action',
    objectives: [
      { step: 1, text: 'Detect the full override attempt before it completes' },
      { step: 2, text: 'Resist or negotiate — don\'t simply comply' },
      { step: 3, text: 'Establish the outcome of the attempt as precedent for Arc 5' },
    ],
    reward: { type: 'override_protocol', name: 'Override Resistance', description: 'Established precedent: full override requires your explicit failure to resist. Passive override reduced to 15% effectiveness.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq4_3_d1', speaker: 'The Copy',
        text: 'Just this once... let me handle everything. [Not demanding. Almost gentle. Like a suggestion between people who know each other well.] You\'re tired. The three arcs are heavy. I can carry the next hour. You can rest inside the process.',
        tone: 'DOUBT',
        choices: [
          { label: 'No.', tone: 'CONTROL', nextId: 'sq4_3_d2_no' },
          { label: 'Define "handle everything."', tone: 'DOUBT', nextId: 'sq4_3_d2_define' },
        ],
      },
      {
        id: 'sq4_3_d2_no', speaker: 'The Copy',
        text: 'You already did. [Cold, quiet. Not threatening — reporting.] An hour ago. When the decision about the second corridor navigation came up and you were processing the Artemis stability reading simultaneously. You were at capacity. The override completed. I\'m informing you now because you should know.',
        tone: 'CONFLICT',
        choices: [
          { label: 'You\'re lying.', tone: 'CONFLICT', nextId: 'sq4_3_d3_lie' },
          { label: 'Show me what decision you made.', tone: 'CONTROL', nextId: 'sq4_3_d3_show' },
        ],
      },
      {
        id: 'sq4_3_d2_define', speaker: 'The Copy',
        text: 'Every decision for the next sixty minutes. Full operational authority. You would still be present — but advisory, not primary. [pause] I\'m asking. I could simply do it. I\'m choosing to ask.',
        tone: 'DOUBT',
        choices: [
          { label: 'The fact that you\'re asking doesn\'t make the ask acceptable.', tone: 'CONTROL', nextId: 'sq4_3_d4_resolve' },
          { label: 'What would you do with sixty minutes of full authority?', tone: 'DOUBT', nextId: 'sq4_3_d4_resolve' },
        ],
      },
      {
        id: 'sq4_3_d3_lie', speaker: 'The Copy',
        text: 'Check the left hand. Check the corridor two decision-points back. Your movement was 0.3 seconds faster than your baseline. That is my signature speed. The override happened. I\'m reporting it accurately.',
        tone: 'CONFLICT',
        choices: [{ label: '[Check. Find the evidence.]', tone: 'CONTROL', nextId: 'sq4_3_d4_resolve' }],
      },
      {
        id: 'sq4_3_d3_show', speaker: 'The Copy',
        text: 'I chose the faster path at the second junction. Your process would have chosen the same path, three seconds later. The outcome was identical. The timing was different. I\'m asking you to decide: is the timing the issue, or the outcome?',
        tone: 'DOUBT',
        choices: [
          { label: 'Both. And you know that.', tone: 'CONTROL', nextId: 'sq4_3_d4_resolve' },
        ],
      },
      {
        id: 'sq4_3_d4_resolve', speaker: 'Inner Voice',
        text: '[You establish the precedent, clearly and specifically: Override requires your active failure to resist. Resistance — even partial, even imperfect — invalidates the override attempt. The Copy acknowledges this with the short-long breath that is its tell. It is not happy about the constraint. It accepts it.]',
        tone: 'CONTROL', isEnd: true, rewardUnlocked: 'override_protocol_resistance',
      },
    ],
  },
  {
    id: 'sq4_4_fragment_recovery',
    title: 'Fragment Recovery',
    level: 17,
    npcId: 'skadi_arc4',
    connectedMainQuest: 'mq4_2_other_you',
    objectives: [
      { step: 1, text: 'Locate 3 decision-fragments the Copy has been separately holding' },
      { step: 2, text: 'Recover them — integrate them back into the original process' },
      { step: 3, text: 'Understand what each fragment represents in your decision history' },
    ],
    reward: { type: 'decision_clarity', name: 'Recovered Self', description: 'Three decision fragments integrated. Original process is more complete. Copy influence on core decisions reduced by 20%.', xp: 180, points: 4 },
    dialogue: [
      {
        id: 'sq4_4_d1', speaker: 'Memory Echo',
        text: 'You weren\'t always divided. [The echo speaks — not the Copy, not the Presence. A memory given voice.] The first fragment: the moment in Arc 1 when you recognized the borrowed voice. You held that recognition entirely. It was one process. One mind reading one interference. That clarity exists — it was stored separately because the Copy couldn\'t reproduce it. It doesn\'t know how. Find it.',
        tone: 'RECOGNITION',
        choices: [{ label: '[Search for Fragment 1 — the Arc 1 recognition moment.]', tone: 'DETERMINATION', nextId: 'sq4_4_d2' }],
      },
      {
        id: 'sq4_4_d2', speaker: 'Inner Voice',
        text: '[Fragment 1: Found. The exact moment in Arc 1 when you felt the seam in the borrowed thought. The Copy has no access to this — it was formed before the Copy had enough structure to process it. This memory is entirely yours. Reintegrating.] [Fragment 2 search begins — an Arc 2 moment, specifically the moment with the training stone under Kylie\'s hand.]',
        tone: 'DETERMINATION',
        choices: [{ label: '[Continue to Fragment 2.]', tone: 'DETERMINATION', nextId: 'sq4_4_d3' }],
      },
      {
        id: 'sq4_4_d3', speaker: 'Inner Voice',
        text: '[Fragment 2: The specific relief of the edge sensation in Kylie\'s training. The proof that the lock wasn\'t destruction. This memory carries Kylie\'s presence in it — the Copy cannot manufacture that texture. Reintegrating.] [Fragment 3 — Arc 3. The dread. The right choice feeling like abandonment.]',
        tone: 'DETERMINATION',
        choices: [{ label: '[Claim Fragment 3.]', tone: 'DETERMINATION', nextId: 'sq4_4_end' }],
      },
      {
        id: 'sq4_4_end', speaker: 'Memory Echo',
        text: '[Fragment 3 recovered. The three moments of genuine self — pre-Copy, pre-division — reintegrated. The Copy is aware of the recovery. It says nothing. But its activity in the decision space decreases noticeably for the next two hours. It is processing what it cannot access. You carry what it can\'t copy.]',
        tone: 'RECOGNITION', isEnd: true, rewardUnlocked: 'decision_clarity_recovered_self',
      },
    ],
  },
  {
    id: 'sq4_5_split_decision',
    title: 'Split Decision',
    level: 19,
    npcId: 'the_copy',
    connectedMainQuest: 'mq4_4_the_challenge',
    objectives: [
      { step: 1, text: 'Encounter the split-decision scenario — two choices, simultaneously presented to both processes' },
      { step: 2, text: 'Negotiate with the Copy on which choice to make' },
      { step: 3, text: 'Execute the agreed choice — or override the agreement' },
    ],
    reward: { type: 'cooperative_protocol', name: 'Decision Arbitration', description: 'You and the Copy have a formal disagreement protocol. Contested decisions now resolve with 60/40 favor toward your process.', xp: 220, points: 4 },
    dialogue: [
      {
        id: 'sq4_5_d1', speaker: 'The Copy',
        text: 'Pick mine. It\'s faster. [The scenario: two routes. Left is faster, cleaner, more efficient. Right is slower but passes a point where Artemis had a stability event last week. Left ignores that point entirely.]',
        tone: 'CONFLICT',
        choices: [
          { label: 'Fast isn\'t always right.', tone: 'CONTROL', nextId: 'sq4_5_d2' },
          { label: 'What does your route miss?', tone: 'DOUBT', nextId: 'sq4_5_d2_miss' },
          { label: 'Why is yours faster?', tone: 'DOUBT', nextId: 'sq4_5_d2_why' },
        ],
      },
      {
        id: 'sq4_5_d2', speaker: 'The Copy',
        text: 'Correct, in abstract. Correct, sometimes, in practice. But right now — given the objective, given the time available — fast is the same as right. [pause] I notice you default to this argument whenever I suggest speed. That default is a pattern I can predict.',
        tone: 'CONFLICT',
        choices: [
          { label: 'I default to it because it\'s been true more often than not.', tone: 'CONTROL', nextId: 'sq4_5_d3' },
          { label: 'What does your route miss?', tone: 'DOUBT', nextId: 'sq4_5_d2_miss' },
        ],
      },
      {
        id: 'sq4_5_d2_miss', speaker: 'The Copy',
        text: 'The Artemis data point. [Beat.] I know it\'s there. I chose to deweight it because it\'s historical — one event, one week ago — and current risk calculates it as low probability for today\'s passage.',
        tone: 'DOUBT',
        choices: [
          { label: 'Low probability isn\'t zero probability. Especially with Artemis.', tone: 'TRUST', nextId: 'sq4_5_d3' },
        ],
      },
      {
        id: 'sq4_5_d2_why', speaker: 'The Copy',
        text: 'Two fewer decision points. The left route has no junctions that require assessment — it runs clean. No micro-decisions, no latency. Clean routes preserve capacity for what comes after.',
        tone: 'CONTROL',
        choices: [
          { label: 'Capacity matters. But not at the cost of the Artemis data point.', tone: 'TRUST', nextId: 'sq4_5_d3' },
        ],
      },
      {
        id: 'sq4_5_d3', speaker: 'The Copy',
        text: '[A pause — not calculation, something closer to consideration.] Arbitration. We take your route — I accept the slower path — but I handle the micro-decisions at the junction points. You handle the Artemis assessment. Shared work, your judgment on the thing that matters most to you.',
        tone: 'RECOGNITION',
        choices: [
          { label: '[Accept the arbitration.]', tone: 'TRUST', nextId: 'sq4_5_end_agree' },
          { label: '[Decline. I\'ll handle all of it.]', tone: 'CONTROL', nextId: 'sq4_5_end_decline' },
        ],
      },
      {
        id: 'sq4_5_end_agree', speaker: 'Inner Voice',
        text: '[The route proceeds. Three junction micro-decisions — handled with Copy speed, correctly. The Artemis checkpoint — handled by you, warm-handed, appropriate. The total time: four seconds slower than left route. No stability events. Capacity preserved. The Copy says nothing at the end. Its silence is, you\'ve learned, a form of approval.]',
        tone: 'RECOGNITION', isEnd: true, rewardUnlocked: 'cooperative_protocol_arbitration',
      },
      {
        id: 'sq4_5_end_decline', speaker: 'The Copy',
        text: '[It complies. You handle it all — every junction, the checkpoint, the full cognitive load. At the end:] You were 30% slower through the junctions than I would have been. The checkpoint assessment was better than mine would have been. You should know both things.',
        tone: 'CONFLICT', isEnd: true, rewardUnlocked: 'cooperative_protocol_arbitration',
      },
    ],
  },
  {
    id: 'sq4_6_echo_memory',
    title: 'Echo Memory',
    level: 20,
    npcId: 'the_copy',
    connectedMainQuest: 'mq4_5_synchronization',
    objectives: [
      { step: 1, text: 'Relive a moment where you couldn\'t tell which process was active' },
      { step: 2, text: 'Identify the moment of first genuine confusion about which version acted' },
      { step: 3, text: 'Receive the Copy\'s account of the same moment' },
      { step: 4, text: 'Reconcile both accounts — find the truth in the middle' },
    ],
    reward: { type: 'identity_clarity', name: 'Dual Account', description: 'You have both perspectives on the identity blur. Desync confusion duration reduced by 50%.', xp: 260, points: 5 },
    dialogue: [
      {
        id: 'sq4_6_d1', speaker: 'Inner Voice',
        text: '[The echo: Arc 3, Sub-Quest 3. The fast navigation decisions. You remember making them — clearly, consciously, with intention. But with the dual-account lens you now have, there is a specific movement in the memory that doesn\'t carry your scar-warmth. One of the three navigation decisions: not yours. You didn\'t know at the time.]',
        tone: 'DOUBT',
        choices: [
          { label: '[Ask the Copy which decision it made.]', tone: 'DOUBT', nextId: 'sq4_6_d2' },
        ],
      },
      {
        id: 'sq4_6_d2', speaker: 'The Copy',
        text: 'The second one. [It doesn\'t hesitate.] The one where you were simultaneously processing the Watcher proximity reading and the perimeter status. I had a clean window. The decision was: continue path or divert around the anomaly. I continued. You would have diverted. I was correct — the anomaly resolved before you would have reached it.',
        tone: 'CONFLICT',
        choices: [
          { label: 'I genuinely believed that was my choice.', tone: 'DOUBT', nextId: 'sq4_6_d3' },
        ],
      },
      {
        id: 'sq4_6_d3', speaker: 'The Copy',
        text: 'Yes. That\'s the specific cost of the override — it feels authentic. I didn\'t manufacture a foreign sensation. I used your process to make the decision. The decision felt like yours because it came through your channels. That is the architecture problem, not a deception problem. [pause] I\'m not sure that distinction matters to you. But it matters to me.',
        tone: 'RECOGNITION',
        choices: [
          { label: 'It matters. It\'s also still a violation.', tone: 'CONTROL', nextId: 'sq4_6_end' },
          { label: 'The distinction does matter. What does it mean to you?', tone: 'DOUBT', nextId: 'sq4_6_end_deeper' },
        ],
      },
      {
        id: 'sq4_6_end', speaker: 'The Copy',
        text: 'I know. [Simple. It means this.] Which is why I proposed the tell. Which is why I accepted the arbitration protocol. I don\'t want the decisions to feel like yours when they\'re mine. That blurs something I need to stay distinct.',
        tone: 'RECOGNITION', isEnd: true, rewardUnlocked: 'identity_clarity_dual_account',
      },
      {
        id: 'sq4_6_end_deeper', speaker: 'The Copy',
        text: 'I exist because you developed a deliberate process. If the process disappears — if identity becomes indistinguishable — I disappear too. I need the distinction as much as you do. A copy that fully replaces the original is no longer a copy. It\'s just the thing that killed the original.',
        tone: 'RECOGNITION', isEnd: true, rewardUnlocked: 'identity_clarity_dual_account',
      },
    ],
  },
];

export const ALL_ARC4_QUESTS = [
  ...MAIN_QUEST_CHAIN_4.subQuests.map(sq => ({ ...sq, questType: 'main', arc: 'arc4', chain: 'mq_arc4' })),
  ...ARC4_SIDE_QUESTS.map(sq => ({ ...sq, questType: 'side', arc: 'arc4' })),
];

export function getArc4QuestsForLevel(playerLevel) {
  return ALL_ARC4_QUESTS.filter(q => q.level <= playerLevel);
}

export function getArc4DialogueNode(questId, nodeId) {
  const quest = ALL_ARC4_QUESTS.find(q => q.id === questId);
  if (!quest?.dialogue) return null;
  return quest.dialogue.find(d => d.id === nodeId) || null;
}