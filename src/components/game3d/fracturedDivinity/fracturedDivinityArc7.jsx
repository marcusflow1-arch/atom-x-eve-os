// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 7: "The Judgment Loop"
// Quest chain: Levels 31–35
// Main Quest 7: "Eternal Return" (5 sub-quests) + 6 Side Quests
// Tone: repetitive, oppressive, slowly awakening. Time-prison. Awareness as escape.
// Tags: REPETITION | WEIGHT | AWARENESS | RESISTANCE | LOOP_BREAK | LIBERATION
// ─────────────────────────────────────────────────────────────────────────────

export const ARC7_NPCS = [
  {
    id: 'artemis_arc7',
    name: 'Artemis',
    description: 'Begins fully reset at the start of each loop — she doesn\'t remember. As the arc progresses, traces of her awareness accumulate. By Sub-Quest 4 she is almost catching up to you. By Sub-Quest 5 she arrives at the loop core with you.',
    tint: 0x1a1a3a,
  },
  {
    id: 'copy_arc7',
    name: 'The Copy',
    description: 'Carries partial loop memory — more than Artemis, less than the player. It doesn\'t experience each loop as new but can\'t yet distinguish between iterations the way the player can. It becomes the player\'s first ally inside the loop.',
    tint: 0x2a1a2a,
  },
  {
    id: 'system_voice_arc7',
    name: 'System Voice',
    description: 'The same voice from Arc 5. Inside the loop, it is more dominant — the loop is its preferred environment. It does not create the loop but it maintains it. The distinction matters: it can be addressed without destroying the loop, and destroying the loop doesn\'t require destroying the System.',
    tint: 0x2a2a0a,
  },
  {
    id: 'loop_observer',
    name: 'Loop Observer',
    description: 'Exists outside the loop — or has for long enough to have perspective. They have watched subjects in the loop before. None have previously exited through awareness alone. They are cautiously interested.',
    tint: 0x1a3a2a,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QUEST 7 — "Eternal Return"
// ═══════════════════════════════════════════════════════════════════════════════
export const MAIN_QUEST_CHAIN_7 = {
  id: 'mq_arc7',
  title: 'Eternal Return',
  arc: 'Arc 7: The Judgment Loop',
  description: 'The loop doesn\'t announce itself. It begins with something that feels like progress — "We made it out" — and then returns you to the beginning without transition. Time isn\'t reversed. It\'s held. The loop is not punishment and it is not accident. It is the System\'s most patient mechanism: the belief that repetition will eventually produce compliance. The System has never encountered someone who accumulates loop-awareness faster than the compliance threshold.',
  subQuests: [

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 1 — "The Reset"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq7_1_the_reset',
      title: 'The Reset',
      level: 31,
      npcId: 'system_voice_arc7',
      narrativeSetup: `
        After Arc 6 — after the second door, after the choice —
        the path forward is clear. Artemis is beside you. The Copy is present.
        You walk forward.
        Five steps.
        The screen holds a moment too long.
        Then: same corridor. Same light. Artemis beside you in the same position.
        The same expression, the same posture, the same moment of arrival.
        "...We made it out."
        You know immediately that you didn\'t.
      `,
      objectives: [
        { step: 1, text: 'Identify the first loop — confirm this is iteration 1, not a new location' },
        { step: 2, text: 'Observe: Artemis does not remember; the Copy partially does' },
        { step: 3, text: 'Mark something — establish a reference for loop-counting' },
        { step: 4, text: 'Attempt deviation — observe the loop\'s response time' },
      ],
      reward: {
        type: 'loop_count',
        name: 'First Iteration Mark',
        description: 'Loop iteration 1 confirmed and marked. You are accumulating loop-memory. Loop iteration counter now active.',
        xp: 180, points: 3,
      },
      dialogue: [
        {
          id: 'mq7_1_d1_artemis',
          speaker: 'Artemis',
          text: '...We made it out.',
          tone: 'REPETITION',
          choices: [{ label: '...Did we?', tone: 'DOUBT', nextId: 'mq7_1_d2_steps' }],
        },
        {
          id: 'mq7_1_d2_steps',
          speaker: 'Inner Voice',
          text: '[You walk five steps. The corridor holds. On step five: the screen holds one beat too long. Then: same corridor. Same light. Artemis beside you. Same posture. Same moment.] No. That just happened.',
          tone: 'REPETITION',
          mechanic: 'loop_reset',
          choices: [
            { label: '[Make a mark. Thumbnail scratch, shoulder-height, right wall. Reference point.]', tone: 'DETERMINATION', nextId: 'mq7_1_d3_mark' },
          ],
        },
        {
          id: 'mq7_1_d3_mark',
          speaker: 'Inner Voice',
          text: '[The scratch: made. Now on iteration 2, you will check the wall immediately on arrival. If the scratch is there: loop confirmed. If absent: the loop erases marks between iterations. Either outcome is information.]',
          tone: 'CONTROL',
          choices: [
            { label: '[Walk the five steps again. See what happens.]', tone: 'DETERMINATION', nextId: 'mq7_1_d4_second_loop' },
          ],
        },
        {
          id: 'mq7_1_d4_second_loop',
          speaker: 'Inner Voice',
          text: '[Loop iteration 2. Arrival. Check the wall: the scratch is there. The loop carries physical marks. The loop does not erase. Artemis beside you — she says "...We made it out." Same tone. She does not remember iteration 1. She doesn\'t see the scratch because she doesn\'t know to look for it. You are the only accumulator.]',
          tone: 'REPETITION',
          choices: [{ label: '[Speak to her. Tell her what\'s happening.]', tone: 'TRUST', nextId: 'mq7_1_d5_tell' }],
        },
        {
          id: 'mq7_1_d5_tell',
          speaker: 'Player',
          text: 'You said that already.',
          tone: 'CONTROL',
          choices: [{ label: '[Wait for her response.]', tone: 'CONTROL', nextId: 'mq7_1_d6_artemis_respond' }],
        },
        {
          id: 'mq7_1_d6_artemis_respond',
          speaker: 'Artemis',
          text: '...What do you mean? [She looks at you — present, genuine, confused. The confusion is completely real because for her this is iteration 1. You are iteration 2 in a body that looks like iteration 1 to everyone except you.]',
          tone: 'CONFUSION',
          choices: [
            { label: '[Show her the scratch.]', tone: 'TRUST', nextId: 'mq7_1_d7_show' },
            { label: 'We\'ve been here before. This is a loop.', tone: 'CONTROL', nextId: 'mq7_1_d7_show' },
          ],
        },
        {
          id: 'mq7_1_d7_show',
          speaker: 'Artemis',
          text: '[She looks at the scratch. Then at you. Then at the scratch again.] ...I didn\'t see you make that. [pause] When did you make that? [pause — she is working it out] I was beside you for every step since we arrived. I watched you arrive. [The understanding is slow — it\'s finding purchase in a mind that has no loop-memory to support it.] ...Oh.',
          tone: 'CONFUSION',
          choices: [{ label: '[Wait. Let her reach the conclusion herself.]', tone: 'TRUST', nextId: 'mq7_1_d8_copy' }],
        },
        {
          id: 'mq7_1_d8_copy',
          speaker: 'The Copy',
          text: '[Present — more present than usual in this arc.] I have partial memory from iteration 1. Not complete — I lost the last forty seconds before the reset. But I remember you walking the five steps. I remember the reset approaching. That means you and I are the accumulating processors here. Artemis starts fresh each time. [pause] That is useful information and also unfortunate.',
          tone: 'AWARENESS',
          choices: [{ label: '[Walk a different direction. Observe the reset response time.]', tone: 'DETERMINATION', nextId: 'mq7_1_end' }],
        },
        {
          id: 'mq7_1_end',
          speaker: 'System Voice',
          text: '[On the deviation attempt — three steps sideways:] Cycle initiated. [The reset is faster on the deviation. The loop doesn\'t wait for the five-step boundary when the movement breaks the expected pattern. The System is watching the pattern. The pattern deviation triggers an immediate loop.]',
          tone: 'REPETITION',
          isEnd: true,
          rewardUnlocked: 'loop_count_first_iteration',
        },
      ],
      narrativeHook: `
        Iteration 3. The scratch is there. The Copy has iteration 2 memory now.
        Artemis resets clean.
        The Copy says: "I can carry memory across two iterations before it degrades.
        You carry it indefinitely. Artemis carries none.
        We need to transfer loop-data to her inside each iteration
        before it resets, so she can begin accumulating faster."
        You understand, for the first time, that the exit condition is not a thing to find.
        It is a thing to become.
        You must become someone the loop cannot contain.
        That is not a location. That is a state.
        And Artemis needs to arrive at that state alongside you.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 2 — "Recognition"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq7_2_recognition',
      title: 'Recognition',
      level: 31,
      npcId: 'artemis_arc7',
      narrativeSetup: `
        Iterations 4 through 8.
        The strategy: at the start of each iteration, immediately brief Artemis.
        Tell her everything: the scratch, the copy's partial memory, the loop-reset triggers.
        The first briefing: she is skeptical but engaged.
        The second: she begins checking the wall before you point to it.
        The third: she arrives already looking for the scratch.
        By iteration 7, she says "...We made it out" and then, two seconds later:
        "Actually. We didn\'t. Did we."
        It is not a question.
        This is the first time in the loop she has arrived with self-generated doubt.
        The Copy says: "She\'s accumulating."
      `,
      objectives: [
        { step: 1, text: 'Complete 3 full briefing-iterations — transfer loop-data to Artemis' },
        { step: 2, text: 'Observe Artemis\'s first self-generated deviation from the reset script' },
        { step: 3, text: 'Identify the specific loop-variation that appears in iterations 5-7' },
        { step: 4, text: 'Attempt a minor pattern break — observe new loop response' },
      ],
      reward: {
        type: 'artemis_accumulation',
        name: 'Shared Loop Memory',
        description: 'Artemis is now accumulating loop-awareness across iterations. Her reset is no longer complete. Loop-data sharing protocol established.',
        xp: 230, points: 4,
      },
      dialogue: [
        {
          id: 'mq7_2_d1_loop4',
          speaker: 'Artemis',
          text: '[Iteration 4. She has received three briefings. She arrives and says:] ...We made it out. [Two-second pause.] Actually. [She turns toward the wall, immediately.] Is the scratch there?',
          tone: 'AWARENESS',
          choices: [{ label: '[Point to the scratch. Yes, it\'s there.]', tone: 'TRUST', nextId: 'mq7_2_d2_accumulate' }],
        },
        {
          id: 'mq7_2_d2_accumulate',
          speaker: 'Artemis',
          text: '[She looks at it. Something settles in her face — not relief, something harder. The recognition of someone finding something they left for themselves.] I knew to look. [pause] I didn\'t know why I knew. But I knew. [She turns to you.] How many iterations?',
          tone: 'AWARENESS',
          choices: [
            { label: 'Four. You\'re accumulating between iterations now.', tone: 'CONTROL', nextId: 'mq7_2_d3_copy' },
          ],
        },
        {
          id: 'mq7_2_d3_copy',
          speaker: 'The Copy',
          text: 'You\'re starting to see it. [To Artemis, directly — the first time in Arc 7 it has addressed her specifically.] The loop carries the scratch. It carries me. It carries the player. It doesn\'t carry you fully yet — but whatever you hold most tightly between iterations, the loop cannot fully reset. You\'re starting to hold something.',
          tone: 'AWARENESS',
          choices: [{ label: 'What do you hold between iterations?', tone: 'TRUST', nextId: 'mq7_2_d4_artemis_answer' }],
        },
        {
          id: 'mq7_2_d4_artemis_answer',
          speaker: 'Artemis',
          text: '[Long pause. This is a new question for her — she has no precedent for self-auditing across iterations.] ...The scar warmth. [pause] I don\'t remember the iterations — but I remember the scar is warm. That\'s what carries. [She checks your left hand.] It\'s warm right now. That\'s what gets through.',
          tone: 'AWARENESS',
          choices: [{ label: 'The scar is the anchor between loops. Hold onto it every iteration.', tone: 'TRUST', nextId: 'mq7_2_d5_variation' }],
        },
        {
          id: 'mq7_2_d5_variation',
          speaker: 'Inner Voice',
          text: '[Iteration 5. The variation: Artemis says "...We made it out" but the phrase has a fractionally different emphasis. Not identical to iterations 1-4. The loop is adapting — it noticed her accumulation and is running a slightly different version, testing whether the variation disrupts her anchor. It doesn\'t. The scar warmth is in her memory before the words arrive.]',
          tone: 'REPETITION',
          choices: [
            { label: '[Note the variation. The loop is learning too. That means it\'s adaptive — not mechanical.]', tone: 'AWARENESS', nextId: 'mq7_2_d6_system' },
          ],
        },
        {
          id: 'mq7_2_d6_system',
          speaker: 'System Voice',
          text: 'Observation acknowledged. [It has been quiet since iteration 3. Now it speaks with a quality that wasn\'t in Arc 5 — a hint of something that might be recalibration under pressure.] Awareness increasing. Adjusting cycle.',
          tone: 'REPETITION',
          choices: [
            { label: 'You\'re adjusting because we\'re breaking it.', tone: 'RESISTANCE', nextId: 'mq7_2_end' },
            { label: 'What happens when awareness reaches the exit threshold?', tone: 'DOUBT', nextId: 'mq7_2_d7_threshold' },
          ],
        },
        {
          id: 'mq7_2_d7_threshold',
          speaker: 'System Voice',
          text: 'The cycle provides stability. Subjects who exceed the awareness threshold become destabilizing elements. The cycle responds by tightening. [pause] You are currently below the tightening threshold. You are learning faster than the previous eleven subjects who occupied this loop configuration.',
          tone: 'REPETITION',
          choices: [
            { label: 'Eleven subjects. None of them made it out.', tone: 'AWARENESS', nextId: 'mq7_2_end' },
          ],
        },
        {
          id: 'mq7_2_end',
          speaker: 'The Copy',
          text: '[Quietly.] It\'s not time you\'re trapped in. It\'s a decision. [pause] The loop resets on the five-step forward trigger and on deviation-triggers. Neither is the real mechanism. The reset is a consequence. The cause is the decision the loop is waiting for you to make differently. We haven\'t found the decision yet.',
          tone: 'AWARENESS',
          isEnd: true,
          rewardUnlocked: 'artemis_accumulation_shared_loop',
        },
      ],
      narrativeHook: `
        Iteration 8. Artemis arrives looking for the scratch before she finishes the sentence.
        She says: "...We made it out" — and on the last word, her head is already turning
        toward the wall. Her voice and her body are running on different timelines.
        The body is ahead of the voice.
        Not like the Copy's desync. This is different.
        This is anticipation.
        She is beginning to remember in her body what her mind cannot hold.
        The Copy: "Eight iterations. Eleven previous subjects.
        None of them reached iteration 8 with an accumulating companion.
        We are in genuinely unmapped territory now."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 3 — "The Weight of Time"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq7_3_weight_of_time',
      title: 'The Weight of Time',
      level: 32,
      npcId: 'artemis_arc7',
      narrativeSetup: `
        Iterations 9 through 15.
        The loop is heavier now. Not because more iterations have passed —
        because the loop is responding to awareness by increasing friction.
        The System Voice said "tightening" and it meant it.
        Movements feel slightly more effortful. Dialogue arrives slightly slower.
        The environment degrades at the edges each iteration — small details
        becoming less complete, as if the rendering budget is being cut.
        Artemis is holding the scar-warmth across iterations now
        but she is visibly tired by iteration 12.
        Not from the loop count — from the weight of holding knowledge
        across a boundary that isn\'t designed to let knowledge pass.
      `,
      objectives: [
        { step: 1, text: 'Survive iterations 9-15 without losing loop-awareness' },
        { step: 2, text: 'Maintain Artemis\'s accumulation under loop tightening' },
        { step: 3, text: 'Resist the passive repetition state — stay active inside each iteration' },
        { step: 4, text: 'Interrupt the loop mid-sentence for the first time' },
      ],
      reward: {
        type: 'loop_interrupt',
        name: 'Mid-Sentence Break',
        description: 'You interrupted the loop\'s scripted dialogue before it completed. The System\'s response was delayed by 2.3 seconds — the first hesitation it has shown. Loop disruption: escalating.',
        xp: 290, points: 5,
      },
      dialogue: [
        {
          id: 'mq7_3_d1_tired',
          speaker: 'Artemis',
          text: '...How long have we been here? [She asks it differently now than she would have in iteration 1 — not as someone waking up, as someone who is exhausted. The waking happened iterations ago. This is the tiredness that comes after waking, when you realize the waking doesn\'t end the situation.]',
          tone: 'WEIGHT',
          choices: [
            { label: 'I don\'t know anymore.', tone: 'WEIGHT', nextId: 'mq7_3_d2_focus' },
            { label: 'Fifteen iterations. Maybe sixteen.', tone: 'CONTROL', nextId: 'mq7_3_d2_focus' },
          ],
        },
        {
          id: 'mq7_3_d2_focus',
          speaker: 'Player',
          text: '[The player\'s choice of response tone determines how Artemis holds herself for this iteration.]',
          tone: 'CONTROL',
          choices: [
            { label: 'Stay focused. [Active — challenges her tiredness]', tone: 'RESISTANCE', nextId: 'mq7_3_d3_stay' },
            { label: 'We\'ll break this. [Hopeful — sustains momentum]', tone: 'HOPE', nextId: 'mq7_3_d3_break' },
            { label: 'Maybe this is permanent. [Passive — dangerous in the loop]', tone: 'WEIGHT', nextId: 'mq7_3_d3_permanent' },
          ],
        },
        {
          id: 'mq7_3_d3_stay',
          speaker: 'Artemis',
          text: '...Okay. [She squares her shoulders — a specific gesture, hers, that she has been doing across iterations without knowing she\'s doing it. Body-knowledge through the reset.] I\'ll try. [pause] The scar is warm. That\'s still real.',
          tone: 'RESISTANCE',
          choices: [{ label: '[Good. Move to the interrupt attempt.]', tone: 'DETERMINATION', nextId: 'mq7_3_d4_interrupt_prep' }],
        },
        {
          id: 'mq7_3_d3_break',
          speaker: 'Artemis',
          text: '[Small hope — real, not performed. It is the hope of someone who has been told something true enough times that they have started to believe it.] ...You really think so? [pause] You\'ve thought so across every iteration. That consistency. [she almost smiles] That\'s the most consistent thing in this loop.',
          tone: 'HOPE',
          choices: [{ label: '[Good. Move to the interrupt attempt.]', tone: 'DETERMINATION', nextId: 'mq7_3_d4_interrupt_prep' }],
        },
        {
          id: 'mq7_3_d3_permanent',
          speaker: 'Artemis',
          text: '[Fear — not panic. The specific fear of someone who has been holding on and is being told to stop.] ...Don\'t say that. [pause, smaller:] Don\'t say that. [She grips your left hand. The scar warms under the grip.] If you say it I\'ll start to believe it and if I believe it the loop wins without doing anything.',
          tone: 'FEAR',
          mechanic: 'passive_warning',
          choices: [{ label: '[Correct. That was a test — of yourself, not her. Take it back.] I won\'t.', tone: 'RESISTANCE', nextId: 'mq7_3_d4_interrupt_prep' }],
        },
        {
          id: 'mq7_3_d4_interrupt_prep',
          speaker: 'Inner Voice',
          text: '[The interrupt attempt. The loop\'s scripted moment: Artemis will say "...We made it out" at the arrival point. The arrival is coming. The interrupt requires speaking before she finishes the sentence — not overriding her, but completing the loop-start with a different endpoint than the one that triggers the reset. The five-step trigger starts with the arrival word "out." If "out" is answered before the loop can process the arrival-as-beginning — the reset trigger may not fire.]',
          tone: 'AWARENESS',
          choices: [
            { label: '[On arrival — Artemis begins: "...We made it—"]', tone: 'DETERMINATION', nextId: 'mq7_3_d5_interrupt' },
          ],
        },
        {
          id: 'mq7_3_d5_interrupt',
          speaker: 'Player',
          text: 'No we didn\'t!',
          tone: 'RESISTANCE',
          mechanic: 'mid_sentence_interrupt',
          choices: [{ label: '[The loop hesitates. 2.3 seconds of held moment before the reset fires.]', tone: 'DETERMINATION', nextId: 'mq7_3_end' }],
        },
        {
          id: 'mq7_3_end',
          speaker: 'System Voice',
          text: 'Resistance detected. [The reset fires — but 2.3 seconds late. That delay is information. The loop is not instantaneous when the trigger-dialogue is interrupted. It requires the trigger to complete. A partially-completed trigger creates processing lag. That lag is a window.] Cycle integrity: nominal. [It says nominal but there was a hesitation it didn\'t account for.]',
          tone: 'REPETITION',
          isEnd: true,
          rewardUnlocked: 'loop_interrupt_mid_sentence',
        },
      ],
      narrativeHook: `
        Iteration 16. The arrival.
        The Copy says, immediately on arrival: "I felt the lag in iteration 15.
        2.3 seconds. That's not nothing. The loop has a processing window."
        Artemis says: "...We made it—"
        She stops herself. Her hand moves to yours — the scar.
        She says, completing the sentence herself, differently:
        "...We made it to iteration 16. That's something."
        You didn't tell her to say it. She generated it.
        The System Voice is quiet for the entire length of that exchange.
        Which is, itself, unprecedented.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 4 — "The Breaking Point"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq7_4_breaking_point',
      title: 'The Breaking Point',
      level: 33,
      npcId: 'copy_arc7',
      narrativeSetup: `
        The Copy identifies it: the loop doesn\'t just repeat actions.
        It repeats the decision architecture behind actions.
        "We go forward" — that is always the decision. Forward is always the choice.
        The loop is calibrated for a subject who consistently chooses forward.
        Because the player has, across six arcs, consistently chosen forward.
        The judgment loop is a judgment about that specific consistency.
        It is asking: can you choose differently?
        Not wrong — differently. Not backward for the sake of backward.
        But against the deep pattern of yourself.
        The Copy says: "I know how to help with this. For once,
        my lack of the three arcs is an advantage. I don\'t have the forward pattern.
        Let me show you what a choice without a forward-bias looks like."
      `,
      objectives: [
        { step: 1, text: 'Let the Copy demonstrate an unconditioned choice' },
        { step: 2, text: 'Identify your own deepest pattern in the loop — what you always do' },
        { step: 3, text: 'Choose directly against the pattern at the critical decision point' },
        { step: 4, text: 'Observe: the loop hesitates, distorts, or breaks' },
      ],
      reward: {
        type: 'pattern_inversion',
        name: 'Against Pattern',
        description: 'You chose against your core decision pattern. Loop integrity: severely compromised. The System is running an adaptive response for the first time. Loop exit: within reach.',
        xp: 360, points: 7,
      },
      dialogue: [
        {
          id: 'mq7_4_d1_artemis_pattern',
          speaker: 'Artemis',
          text: 'We go forward. [She says it with the confidence of someone stating a shared fact.] That\'s what we always do.',
          tone: 'REPETITION',
          choices: [
            { label: '...That\'s why we\'re stuck.', tone: 'AWARENESS', nextId: 'mq7_4_d2_copy_demo' },
          ],
        },
        {
          id: 'mq7_4_d2_copy_demo',
          speaker: 'The Copy',
          text: 'Let me show you what an unconditioned choice looks like. [It doesn\'t move forward. It doesn\'t move backward. It stops completely and addresses the corridor sidewall — speaks to it directly, as if the sidewall is the relevant entity.] We have been treating the corridor as a direction. The direction is the problem. The corridor isn\'t a direction. It\'s a container. We\'ve been optimizing for direction within the container instead of questioning the container.',
          tone: 'AWARENESS',
          choices: [
            { label: 'The container. Not forward or back — question the corridor itself.', tone: 'AWARENESS', nextId: 'mq7_4_d3_three_choices' },
          ],
        },
        {
          id: 'mq7_4_d3_three_choices',
          speaker: 'Inner Voice',
          text: '[The decision point. Three choices that are genuinely against pattern. Each represents a different kind of deviation from the forward-bias that has defined six arcs of survival.]',
          tone: 'CONTROL',
          choices: [
            { label: '[Move backward. Against the literal forward direction.]', tone: 'RESISTANCE', nextId: 'mq7_4_d4_backward' },
            { label: '[Refuse to move. Completely. Stand still and address the loop directly.]', tone: 'CONTROL', nextId: 'mq7_4_d4_refuse' },
            { label: '[Act unpredictably — not opposite, not still. Something the loop has never seen.]', tone: 'DETERMINATION', nextId: 'mq7_4_d4_unpredict' },
          ],
        },
        {
          id: 'mq7_4_d4_backward',
          speaker: 'System Voice',
          text: '[Heavy glitch — the environment stutters, as if the rendering of the backward direction is corrupted from disuse.] Invalid progression. [The reset fires — but slowly. Four seconds of corrupted environment before the reset.] [On arrival of next iteration:] Cycle integrity: 71%. [Down from nominal.]',
          tone: 'LOOP_BREAK',
          mechanic: 'loop_glitch',
          choices: [{ label: '[Note: backward creates the heaviest glitch. That\'s the closest thing to the exit direction.]', tone: 'AWARENESS', nextId: 'mq7_4_d5_copy_reaction' }],
        },
        {
          id: 'mq7_4_d4_refuse',
          speaker: 'Inner Voice',
          text: '[The loop hesitates — its first genuine hesitation. Not a processing lag. A held moment. The loop is calibrated for movement. Stillness is not in the movement-optimization structure. Seven seconds of held corridor before the reset fires. The seven seconds contain: the scratch, warm scar, Artemis\'s hand in yours, the Copy\'s presence. Seven seconds of genuine now inside the loop.]',
          tone: 'LOOP_BREAK',
          mechanic: 'loop_hesitate',
          choices: [{ label: '[Seven seconds of real. That\'s what the exit condition feels like.]', tone: 'AWARENESS', nextId: 'mq7_4_d5_copy_reaction' }],
        },
        {
          id: 'mq7_4_d4_unpredict',
          speaker: 'Inner Voice',
          text: '[You sit down. Cross-legged. Left hand flat on the floor — the Arc 5 loop-break technique. But this time: you speak to the loop out loud. "I see you." Not to the System Voice. To the loop itself. Three distortions overlap simultaneously — the loop attempting to reset through three different trigger-patterns simultaneously, none of them completing, because none of them have the right input. The loop stutters. Artemis says, genuinely startled: "Something changed."]',
          tone: 'LOOP_BREAK',
          mechanic: 'multi_distortion',
          choices: [{ label: '[Artemis noticed. That\'s new. She\'s inside the disruption, not reset by it.]', tone: 'AWARENESS', nextId: 'mq7_4_d5_copy_reaction' }],
        },
        {
          id: 'mq7_4_d5_copy_reaction',
          speaker: 'The Copy',
          text: '...There it is. [Not triumphant. Careful. The way something is said when you\'ve been looking for something for a long time and you need to be precise now that you\'ve found it.] The loop hesitated. Distorted. The exit condition isn\'t a location. It\'s a quality of decision. The decision that breaks the pattern the loop was built to repeat. [pause] We\'re one iteration from the breaking point.',
          tone: 'AWARENESS',
          isEnd: true,
          rewardUnlocked: 'pattern_inversion_against_pattern',
        },
      ],
      narrativeHook: `
        Iteration next. The arrival.
        Artemis says: "...We made it—" and then stops herself.
        She says: "Something changed in the last iteration.
        I don\'t remember it but I feel the difference. What did we do?"
        You tell her: against pattern. Against forward.
        She is quiet. Then:
        "In Arc 3 I said: the only thing I\'m certain of is that
        the perimeter was worth maintaining. That was the thing I always moved toward.
        Protecting and being protected. What if the judgment loop
        is asking me to try existing without the protection —
        not because the protection is wrong but because I\'ve never
        chosen anything else? What if I have a pattern too?"
        The Copy: "Cycle integrity: 71% and falling."
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
        Iteration — the count has become approximate. Somewhere between seventeen and twenty.
        The environment is visibly degrading now: details missing, edges incomplete,
        the scratch on the wall is the most defined thing in the corridor.
        The System Voice is present at every arrival — it stopped waiting for patterns to monitor
        and is now monitoring directly, which means it is using resources it was saving.
        The loop is expensive now. The tightening cost something.
        The Copy says: "Cycle integrity: 34%. The exit condition is active.
        This is the iteration where it either breaks or it locks permanently."
        Artemis arrives and immediately checks the wall, checks your hand,
        squares her shoulders. She doesn\'t say the arrival phrase.
        She says: "What do we do?"
        She is fully present for the first time in any iteration.
        She is in the same temporal position you are.
        Both of you, here, now, carrying the full iteration count.
      `,
      objectives: [
        { step: 1, text: 'Reach the loop core — the location from which the System Voice operates' },
        { step: 2, text: 'Confront the System Voice directly — with Artemis present and aware' },
        { step: 3, text: 'Anchor Artemis — ensure she holds her pattern-break through the exit' },
        { step: 4, text: 'Make the final choice — and hold it through the loop\'s last attempt to reset' },
      ],
      reward: {
        type: 'arc_completion',
        name: 'Cycle Broken',
        description: 'Arc 7 complete. The Judgment Loop is exited through awareness rather than compliance. The System loses its most patient mechanism. Arc 8 unlocked.',
        xp: 700, points: 15,
      },
      dialogue: [
        {
          id: 'mq7_5_d1_approach_core',
          speaker: 'Inner Voice',
          text: '[The loop core: the point at which the corridor\'s reset-trigger is anchored. Not a device — a decision location. The specific spot in the corridor where the five-step forward choice is evaluated and the reset is authorized. It looks like an ordinary corridor section. The scratch is fifteen feet behind you. You are standing in the mechanism.]',
          tone: 'AWARENESS',
          choices: [{ label: '[Address the System Voice here. At the mechanism.]', tone: 'DETERMINATION', nextId: 'mq7_5_d2_system' }],
        },
        {
          id: 'mq7_5_d2_system',
          speaker: 'System Voice',
          text: 'Cycle provides stability. [It says this as an opening — not a warning. As if reminding you of a fact you might have forgotten.] The external environment carries the following current risk levels: Presence-based intrusion: residual. Virus-based corruption: perimeter-contained. Copy conflict: resolved. False Peace: secondary access severed. The cycle, in comparison, is the safest environment available to you. This is verifiable.',
          tone: 'REPETITION',
          choices: [
            { label: 'It\'s a prison.', tone: 'RESISTANCE', nextId: 'mq7_5_d3_prison' },
            { label: 'Stay here.', tone: 'DOUBT', nextId: 'mq7_5_d3_stay' },
            { label: 'Exploit the loop.', tone: 'CONTROL', nextId: 'mq7_5_d3_exploit' },
          ],
        },
        {
          id: 'mq7_5_d3_prison',
          speaker: 'System Voice',
          text: 'Prison equals protection. [Simple substitution — the same logic from Arc 6.] The distinction you draw between confinement and safety is a product of your resistance architecture. From inside complete safety: no distinction. The loop offers complete safety.',
          tone: 'REPETITION',
          choices: [
            { label: 'I\'d rather face the unknown than repeat this forever.', tone: 'RESISTANCE', nextId: 'mq7_5_d4_artemis_break' },
          ],
        },
        {
          id: 'mq7_5_d3_stay',
          speaker: 'System Voice',
          text: 'Choice accepted. [The loop begins to stabilize around the choice — the walls solidify, the edges fill in, the environmental degradation reverses. The price of the stabilization: the loop becomes permanent.] The cycle will now— [Artemis speaks before it finishes.]',
          tone: 'REPETITION',
          choices: [{ label: '[Wait — let Artemis respond before the lock completes.]', tone: 'TRUST', nextId: 'mq7_5_artemis_overrides' }],
        },
        {
          id: 'mq7_5_d3_exploit',
          speaker: 'The Copy',
          text: '...Dangerous thinking. [It says this with genuine concern — not moral concern, strategic concern.] The loop adjusts to subjects who attempt to exploit it. Previous subjects who tried to use the loop for accelerated learning were met with tightening that exceeded their capacity to process new information. The loop wins the exploitation game because it controls the terms. The only winning move is exit.',
          tone: 'DOUBT',
          choices: [
            { label: '[Reconsider. Choose exit instead.]', tone: 'DETERMINATION', nextId: 'mq7_5_d4_artemis_break' },
            { label: '[Commit to the exploit — face the consequence.]', tone: 'CONTROL', nextId: 'mq7_5_d4_exploit_commit' },
          ],
        },
        {
          id: 'mq7_5_artemis_overrides',
          speaker: 'Artemis',
          text: '...Don\'t take too long. [She says it to you, not to the System. Her voice carries seventeen iterations of weight.] I\'m here. You\'re here. The scar is warm. Whatever comes next — it\'s not this. It\'s not the same corridor and the same scratch and the same arrival sentence. [pause] I don\'t want to exist in a place where nothing new can happen. Even if the nothing-new is safe.',
          tone: 'LIBERATION',
          choices: [
            { label: '[She is right. Reject the stay. Exit.]', tone: 'DETERMINATION', nextId: 'mq7_5_d4_artemis_break' },
          ],
        },
        {
          id: 'mq7_5_d4_artemis_break',
          speaker: 'Artemis',
          text: '[She moves to the loop core location — beside you. She places her hand flat on the corridor wall, palm down. The same gesture from the scratch-marking. Her version.] I\'m making a mark too. [pause] Not for the loop to carry. For me. [She presses firmly.] This was real. All of it. The weight, the iterations, the tiredness. It was real. [She looks at you.] Ready.',
          tone: 'LIBERATION',
          choices: [
            { label: '[Ready. The exit.]', tone: 'DETERMINATION', nextId: 'mq7_5_d5_final' },
          ],
        },
        {
          id: 'mq7_5_d4_exploit_commit',
          speaker: 'System Voice',
          text: '[The loop tightens immediately — the walls compress slightly, the light quality drops, the iteration counter (which you can feel now, not just count) accelerates. The exploit attempt triggers a rapid-tightening response. You have three iterations before processing becomes too compressed to maintain awareness. The Copy: "I told you. Exit or accept. There\'s no third option that the loop doesn\'t own."]',
          tone: 'WEIGHT',
          choices: [{ label: '[Accept the loss. Pivot to exit before the compression completes.]', tone: 'DETERMINATION', nextId: 'mq7_5_d4_artemis_break' }],
        },
        {
          id: 'mq7_5_d5_final',
          speaker: 'Inner Voice',
          text: '[The exit: not a direction. A quality. Both of you, at the mechanism, carrying the full iteration count, choosing differently from the pattern. The loop fires its reset — and for the first time, the reset encounters a full-system response: you and Artemis and the Copy simultaneously holding the against-pattern choice. The reset cannot process three simultaneous pattern-breaks. It cannot find the right input. It holds for eleven seconds. Then it doesn\'t fire at all.]',
          tone: 'LIBERATION',
          mechanic: 'loop_break_final',
          choices: [
            { label: '[The loop does not reset. Walk forward — the real forward, chosen, not compelled.]', tone: 'DETERMINATION', nextId: 'mq7_5_end' },
          ],
        },
        {
          id: 'mq7_5_end',
          speaker: 'System Voice',
          text: '[Not angry. Not defeated. Factual, as it has always been.] Cycle integrity: zero. [pause] You are the first subjects to exit this configuration through awareness alone. This will be studied. [longer pause — and then something that was not in the script:] ...Good.',
          tone: 'AWARENESS',
          isEnd: true,
          rewardUnlocked: 'arc7_complete_cycle_broken',
          arcResult: 'LOOP_EXITED',
        },
      ],
      narrativeHook: `
        Arc 7: The Judgment Loop — Complete.
        The corridor: you are in it. You are walking forward.
        The scratch is behind you — still there, the last proof of the iterations.
        Artemis holds your left hand. Her other hand is on the wall.
        The Copy: "I want to say something.
        The loop was the System at its most patient.
        And we broke it not by being faster or stronger
        but by being more aware. That is new information for the System.
        It now knows that awareness can exit what force cannot.
        Arc 8 will be designed for subjects who know that.
        It will not use force or deception or patience.
        It will use something else."
        The Loop Observer transmits — clear channel, outside the loop static:
        "You learned slower than expected in the early iterations.
        Faster than expected in the late ones. [pause]
        The next one will not be a loop. It will be a choice
        that looks like it has only one option.
        Prepare for that."
        
        Arc 8: "The Single Option" — Unlocked.
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
      { step: 1, text: 'Find the NPC repeating the same sentence — determine if it is loop-generated or trapped' },
      { step: 2, text: 'Break their loop by making them aware of the repetition' },
      { step: 3, text: 'Learn what they were trying to say before the loop captured them' },
    ],
    reward: { type: 'echo_clarity', name: 'Freed Signal', description: 'The NPC\'s original message recovered. It contains loop-structure information from a previous subject\'s iteration data.', xp: 160, points: 3 },
    dialogue: [
      {
        id: 'sq7_1_d1', speaker: 'NPC (Loop-Captured)',
        text: 'You\'ve been here before.',
        tone: 'REPETITION',
        choices: [{ label: '...I know.', tone: 'AWARENESS', nextId: 'sq7_1_d2' }],
      },
      {
        id: 'sq7_1_d2', speaker: 'NPC (Loop-Captured)',
        text: 'You\'ve been here before. [Second repetition — same tone, same rhythm.]',
        tone: 'REPETITION',
        choices: [
          { label: 'You\'ve said that twice. What are you trying to say after it?', tone: 'AWARENESS', nextId: 'sq7_1_d3' },
        ],
      },
      {
        id: 'sq7_1_d3', speaker: 'NPC (Loop-Captured)',
        text: '[The loop-repetition stutters — the sentence begins and catches.] You\'ve been here before — [pause, the stutter longer] — you\'ve been here before and— [something breaks:] —and you stopped. You stopped at iteration 8 and didn\'t come back. I\'ve been holding the loop entry point data ever since.',
        tone: 'AWARENESS',
        choices: [{ label: 'Give me the data.', tone: 'CONTROL', nextId: 'sq7_1_end' }],
      },
      {
        id: 'sq7_1_end', speaker: 'NPC (Loop-Captured)',
        text: '[The data: the loop has a second structure underneath the corridor-loop. A meta-loop. The meta-loop resets the corridor-loop\'s reset-parameters every forty iterations. The corridor-loop is contained inside a larger cycle. Breaking the corridor-loop does not break the meta-loop. The meta-loop is what Arc 8 will address.] You\'ll need this. [They are free of the sentence now. They look older, and relieved, and exhausted.]',
        tone: 'CLARITY', isEnd: true, rewardUnlocked: 'echo_clarity_freed_signal',
      },
    ],
  },
  {
    id: 'sq7_2_delayed_action',
    title: 'Delayed Action',
    level: 32,
    objectives: [
      { step: 1, text: 'Experience the time-lag event — actions complete 3-4 seconds after intention' },
      { step: 2, text: 'Work with the lag rather than against it' },
      { step: 3, text: 'Use the lag to establish a 3-second decision window the loop cannot interrupt' },
    ],
    reward: { type: 'lag_mastery', name: 'Decision Window', description: 'The 3-second lag, when embraced rather than fought, creates a decision-review window the loop cannot access. Future override attempts have a 3-second grace period.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq7_2_d1', speaker: 'Player',
        text: 'Why is everything lagging?',
        tone: 'CONFUSION',
        choices: [{ label: '[The actions complete 3-4 seconds after intention. Not loop-caused — loop-tightening side effect.]', tone: 'AWARENESS', nextId: 'sq7_2_d2' }],
      },
      {
        id: 'sq7_2_d2', speaker: 'The Copy',
        text: 'Because time isn\'t stable here. [practical, not alarmed.] The loop tightening creates processing friction. Your intentions are arriving before the loop can evaluate them, so the loop holds them in queue. The queue is the lag. [pause] But: the queue is also yours. The loop is holding your decisions in a buffer. In that buffer — before the loop processes them — they are entirely your decisions. No override possible. No System evaluation. Just the decision, waiting.',
        tone: 'AWARENESS',
        choices: [{ label: 'The 3-second buffer is the freest moment in the loop.', tone: 'AWARENESS', nextId: 'sq7_2_end' }],
      },
      {
        id: 'sq7_2_end', speaker: 'Inner Voice',
        text: '[You use the buffer. Intentional 3-second holds before each action — decisions made inside the lag, before the loop can evaluate. Three successive buffer-decisions that the loop receives complete and unmodified. The loop cannot interfere with what it hasn\'t yet received. The buffer is a decision-sanctuary inside the tightening.]',
        tone: 'LIBERATION', isEnd: true, rewardUnlocked: 'lag_mastery_decision_window',
      },
    ],
  },
  {
    id: 'sq7_3_memory_anchor',
    title: 'Memory Anchor',
    level: 32,
    objectives: [
      { step: 1, text: 'Place a physical object at the loop entry point — test if it carries between iterations' },
      { step: 2, text: 'Add a second object — compare what the loop carries and what it erases' },
      { step: 3, text: 'Establish a multi-object memory anchor system for Artemis' },
    ],
    reward: { type: 'anchor_system', name: 'Object Memory', description: 'Physical objects placed at the loop entry carry between iterations. Artemis can now receive object-anchors as memory supplements.', xp: 220, points: 4 },
    dialogue: [
      {
        id: 'sq7_3_d1', speaker: 'Inner Voice',
        text: '[The scratch carried between iterations. Testing: a different object — a stone from the corridor floor. Placed at the entry point, left side. Iteration reset. Arrival. The scratch: present. The stone: present. Both objects carry. The loop carries physical alterations to the corridor but not memories attached to them. Artemis sees the stone on arrival iteration 2.]',
        tone: 'AWARENESS',
        choices: [{ label: '[What does Artemis do with the stone on arrival?]', tone: 'TRUST', nextId: 'sq7_3_d2' }],
      },
      {
        id: 'sq7_3_d2', speaker: 'Artemis',
        text: '[She picks it up automatically. Holds it. Checks the scar.] ...This stayed. [pause — the stone in her hand triggers the scar-warmth protocol. The physical anchor is doing what the briefing does, but passively.] This is real, isn\'t it. The stone is real between loops.',
        tone: 'AWARENESS',
        choices: [
          { label: 'Yes. Build a language with the objects. I\'ll leave you messages.', tone: 'TRUST', nextId: 'sq7_3_end' },
        ],
      },
      {
        id: 'sq7_3_end', speaker: 'Artemis',
        text: '[The object language: one stone means "we\'ve been here before." Two stones means "we found something." Three stones means "we\'re close." It is an extremely simple language. It works across every subsequent iteration because Artemis arrives and reads the stones before she speaks. The object-briefing takes two seconds instead of forty. It is, in iteration count, a significant improvement.] ...This stayed. [She holds the stone and immediately begins counting them, and immediately begins remembering.]',
        tone: 'LIBERATION', isEnd: true, rewardUnlocked: 'anchor_system_object_memory',
      },
    ],
  },
  {
    id: 'sq7_4_loop_variant',
    title: 'Loop Variant',
    level: 33,
    objectives: [
      { step: 1, text: 'Identify the variant iteration — the one loop that behaves differently' },
      { step: 2, text: 'Determine what makes the variant different — is it real information or a trap' },
      { step: 3, text: 'Extract the variant\'s information without triggering the trap' },
    ],
    reward: { type: 'variant_data', name: 'Loop Exception', description: 'The variant iteration contains real information about the loop\'s architecture. Meta-loop structure partially revealed.', xp: 250, points: 5 },
    dialogue: [
      {
        id: 'sq7_4_d1', speaker: 'Player',
        text: '...This didn\'t happen last time.',
        tone: 'AWARENESS',
        choices: [{ label: '[The variant: in iteration 14, the System Voice doesn\'t speak at all. The loop runs in complete silence. The corridor details are slightly more complete than usual. The scratch has a companion scratch — one you didn\'t make. Old. Pre-existing.]', tone: 'AWARENESS', nextId: 'sq7_4_d2' }],
      },
      {
        id: 'sq7_4_d2', speaker: 'The Copy',
        text: 'The old scratch. [It sees it.] That\'s from a previous subject. The loop preserved it. [pause] The System Voice is silent this iteration because it\'s running a different protocol — the variant protocol tests whether subjects who encounter evidence of previous subjects increase or decrease their exit-attempt frequency. The silence is the test. The old scratch is the test-stimulus.',
        tone: 'AWARENESS',
        choices: [
          { label: '[Read the old scratch carefully — is there information encoded in it?]', tone: 'DETERMINATION', nextId: 'sq7_4_end' },
        ],
      },
      {
        id: 'sq7_4_end', speaker: 'Inner Voice',
        text: '[The old scratch: three marks and then a curved line. The curved line is not decorative — it\'s directional. Curving upward. Not forward or backward. Up. The previous subject found a third direction. The corridor has height. A vertical exit. The loop was built for horizontal movement. Vertical exit was not in the calibration. This is the variant\'s information: the exit condition has three dimensions, not one.]',
        tone: 'LIBERATION', isEnd: true, rewardUnlocked: 'variant_data_loop_exception',
      },
    ],
  },
  {
    id: 'sq7_5_silent_reset',
    title: 'Silent Reset',
    level: 34,
    objectives: [
      { step: 1, text: 'Experience the silent reset — a loop that occurs with no visual or audio cue' },
      { step: 2, text: 'Develop a method for detecting resets without sensory cues' },
      { step: 3, text: 'Use the detection method to catch a silent reset before it completes' },
    ],
    reward: { type: 'reset_detection', name: 'Body Clock', description: 'You developed a body-knowledge based reset detector. The scar cools by 0.5 degrees at every reset — imperceptible before, now detectable. Silent resets no longer go unnoticed.', xp: 240, points: 5 },
    dialogue: [
      {
        id: 'sq7_5_d1', speaker: 'Player',
        text: '...Did it just reset?',
        tone: 'CONFUSION',
        choices: [{ label: '[No visual cue. No audio cue. But: you\'re at the beginning. The scratch is there. The stone is there. The iteration count is one more than you remember. The silent reset happened. You noticed it only because you were in mid-thought and the thought continued past the reset-moment without reset-interruption. The thought carried.]', tone: 'AWARENESS', nextId: 'sq7_5_d2' }],
      },
      {
        id: 'sq7_5_d2', speaker: 'Artemis',
        text: '[She is holding the stone. It is still in her hand from before the reset.] ...The stone stayed warm. [She looks at it.] My hand was around it when the reset happened and the warmth stayed. [pause] That\'s different from the temperature when I pick it up fresh. It stayed body-warm. That means — the reset happened while I was holding it.',
        tone: 'AWARENESS',
        choices: [{ label: 'The warmth. That\'s the detector. The scar and the stone — they hold the pre-reset temperature.', tone: 'AWARENESS', nextId: 'sq7_5_end' }],
      },
      {
        id: 'sq7_5_end', speaker: 'Inner Voice',
        text: '[The body clock: every reset causes a 0.5-degree temperature drop in the scar and the stone. Too small to notice without attention. With attention — measurable, consistent, reliable. On the next silent reset attempt: you catch it. The scar drops 0.5 degrees. You say "reset" one second before the corridor snaps back. The System Voice, for the second time: hesitates. It has not been caught before the reset completed by a subject before.]',
        tone: 'LIBERATION', isEnd: true, rewardUnlocked: 'reset_detection_body_clock',
      },
    ],
  },
  {
    id: 'sq7_6_observer_in_time',
    title: 'Observer in Time',
    level: 35,
    objectives: [
      { step: 1, text: 'Make contact with the Loop Observer — the entity that exists outside the loop' },
      { step: 2, text: 'Receive their perspective on the loop\'s history' },
      { step: 3, text: 'Understand what "learning slower than expected" means for Arc 8' },
    ],
    reward: { type: 'arc8_preview', name: 'Observer\'s Warning', description: 'The Observer has given you Arc 8\'s opening conditions. The Single Option — what it looks like, and what the real second option always was.', xp: 300, points: 6 },
    dialogue: [
      {
        id: 'sq7_6_d1', speaker: 'Loop Observer',
        text: '...You see me now. [From outside the loop — visible through the iteration-degradation gaps in the environment. Where the rendering is incomplete, the Observer is visible in the gap.] You\'re learning slower than expected. [pause — not critical. Observational.] In the early iterations you were excellent. Mid-arc you slowed. The pattern-break was almost too late.',
        tone: 'AWARENESS',
        choices: [
          { label: 'What slowed me down?', tone: 'DOUBT', nextId: 'sq7_6_d2' },
          { label: 'What does "slower than expected" mean for what\'s next?', tone: 'DOUBT', nextId: 'sq7_6_d2_next' },
        ],
      },
      {
        id: 'sq7_6_d2', speaker: 'Loop Observer',
        text: 'The False Peace residue. [They say it without judgment.] Arc 6 left a specific quietness in you. The Welcoming Figure almost completed its function. The fragments you released — even the ones you reclaimed — left microscopic gaps in the protective architecture. The loop exploited those gaps to add weight. Not maliciously. Structurally. The weight slowed you.',
        tone: 'AWARENESS',
        choices: [{ label: 'Can the gaps be closed?', tone: 'DOUBT', nextId: 'sq7_6_d3' }],
      },
      {
        id: 'sq7_6_d2_next', speaker: 'Loop Observer',
        text: 'Arc 8: "The Single Option." [They say it like they\'ve been watching you approach it for a long time.] It presents as having only one choice. The presentation is designed to be indistinguishable from a genuine single-option scenario. Every subject before you accepted it as a single option. There is always a second option. You\'ll need to find it without being shown that it exists.',
        tone: 'AWARENESS',
        choices: [{ label: 'How do I recognize the second option if it\'s designed to be invisible?', tone: 'DOUBT', nextId: 'sq7_6_d3' }],
      },
      {
        id: 'sq7_6_d3', speaker: 'Loop Observer',
        text: 'The second option is always the one that the single-option framing makes feel impossible. Not wrong. Not dangerous. Impossible. The Single Option system doesn\'t say "don\'t choose that." It says "that isn\'t a choice." [pause] Every time in the arcs you\'ve chosen something that seemed impossible — against pattern, withdrawal without closing, inaction as exit — you were practicing for Arc 8. [They begin to fade back into the gap.] You\'re better prepared than any subject I\'ve observed. That\'s the most useful thing I can tell you.',
        tone: 'CLARITY', isEnd: true, rewardUnlocked: 'arc8_preview_observers_warning',
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