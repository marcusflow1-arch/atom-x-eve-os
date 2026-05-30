// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 6: "The False Peace"
// Quest chain: Levels 26–30
// Main Quest 6: "Arrival" (5 sub-quests) + 6 Side Quests
// Tone tags: CALM | FALSE_PEACE | MANIPULATION | GRIEF | EROSION | AWAKENING
// ─────────────────────────────────────────────────────────────────────────────

export const ARC6_NPCS = [
  {
    id: 'welcoming_figure',
    name: 'The Welcoming Figure',
    description: 'Composed. Warm. The kind of warmth that exists in photographs of places you\'ve never been. It does not threaten you. It offers. The offer is the threat.',
    tint: 0x2a2a1a,
  },
  {
    id: 'artemis_arc6',
    name: 'Artemis',
    description: 'Calmer than she has been in five arcs. This should be a relief. Instead it is the most unsettling thing in Arc 6 — she is calm in a place where calm is unearned.',
    tint: 0x1a1a3a,
  },
  {
    id: 'copy_arc6',
    name: 'The Copy',
    description: 'Quieter. Watching. The false peace unsettles it more than any prior arc — it has no model for environments that want to give you things without taking anything visible in exchange.',
    tint: 0x2a2a3a,
  },
];

export const MAIN_QUEST_CHAIN_6 = {
  id: 'mq_arc6',
  title: 'Arrival',
  arc: 'Arc 6: The False Peace',
  description: 'After five arcs of interference, distortion, loops, and confrontation — this is quiet. Clean air. No distortion. No pain. You know what that means by now.',
  subQuests: [

    {
      id: 'mq6_1_arrival',
      title: 'Arrival',
      level: 26,
      npcId: 'welcoming_figure',
      narrativeSetup: `
        You wake up in a space you have not earned.
        The light is right — the specific quality of light you associate with moments
        that preceded good things in the three early arcs. It feels like recognition.
        Artemis is beside you. She says: "It's quiet."
        She is right. It is too quiet. Specifically too quiet — the kind of quiet that exists
        when the absence of noise is itself a choice someone made.
        A figure approaches. Unhurried. It has the quality of something that has been
        waiting for you with complete patience and does not need to show the patience
        because it was never threatened by the wait.
      `,
      objectives: [
        { step: 1, text: 'Explore the environment — document three things that feel too right' },
        { step: 2, text: 'Speak to the Welcoming Figure — receive the offer' },
        { step: 3, text: 'Observe what Artemis does with the peace' },
        { step: 4, text: 'Accept, question, or reject the initial premise' },
      ],
      reward: { type: 'false_peace_awareness', name: 'Peace Audit', description: 'The false peace is named. Three indicators documented. Reality texture check active.', xp: 240, points: 5 },
      dialogue: [
        {
          id: 'mq6_1_d1', speaker: 'Artemis',
          text: '…It\'s quiet.',
          tone: 'CALM',
          choices: [{ label: '…Too quiet.', tone: 'AWAKENING', nextId: 'mq6_1_d2' }],
        },
        {
          id: 'mq6_1_d2', speaker: 'The Welcoming Figure',
          text: 'You\'ve made it.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: 'Where am I?', tone: 'CONFUSION', nextId: 'mq6_1_d3_where' },
            { label: 'What is this place?', tone: 'CONFUSION', nextId: 'mq6_1_d3_what' },
            { label: 'This isn\'t real.', tone: 'AWAKENING', nextId: 'mq6_1_d3_real' },
          ],
        },
        {
          id: 'mq6_1_d3_where', speaker: 'The Welcoming Figure',
          text: 'A place beyond conflict.',
          tone: 'FALSE_PEACE',
          choices: [{ label: 'What does that cost?', tone: 'AWAKENING', nextId: 'mq6_1_d4_cost' }],
        },
        {
          id: 'mq6_1_d3_what', speaker: 'The Welcoming Figure',
          text: 'A place where nothing can harm you anymore.',
          tone: 'FALSE_PEACE',
          choices: [{ label: 'Nothing can harm me — or I\'ve been disarmed?', tone: 'AWAKENING', nextId: 'mq6_1_d4_cost' }],
        },
        {
          id: 'mq6_1_d3_real', speaker: 'The Welcoming Figure',
          text: '[Smiles slightly.] Does it need to be?',
          tone: 'MANIPULATION',
          choices: [{ label: 'Yes. The realness of things is the only thing I trust anymore.', tone: 'AWAKENING', nextId: 'mq6_1_d4_cost' }],
        },
        {
          id: 'mq6_1_d4_cost', speaker: 'Artemis',
          text: '…I don\'t feel anything wrong.',
          tone: 'FALSE_PEACE',
          choices: [{ label: '[Internal: That\'s the problem.]', tone: 'AWAKENING', nextId: 'mq6_1_d5_copy' }],
        },
        {
          id: 'mq6_1_d5_copy', speaker: 'The Copy',
          text: '[Quiet. Distant — as if the peace is affecting the Copy\'s signal more than yours.] That\'s the problem.',
          tone: 'AWAKENING',
          choices: [{ label: '[Register: The Copy\'s signal is attenuated here. The peace is dampening it.]', tone: 'AWAKENING', nextId: 'mq6_1_d6_offer' }],
        },
        {
          id: 'mq6_1_d6_offer', speaker: 'The Welcoming Figure',
          text: 'All you need to do… is let go.',
          tone: 'MANIPULATION',
          choices: [
            { label: 'Let go of what, specifically?', tone: 'AWAKENING', nextId: 'mq6_1_end_question' },
            { label: '[Stay silent. Watch what it does when you don\'t respond.]', tone: 'AWAKENING', nextId: 'mq6_1_end_silence' },
          ],
        },
        {
          id: 'mq6_1_end_question', speaker: 'The Welcoming Figure',
          text: 'What hurt you. What burdened you. What you carried through five arcs of difficulty. You don\'t need it here. Here, it is safe to set it down.',
          tone: 'MANIPULATION',
          isEnd: true, rewardUnlocked: 'false_peace_awareness_audit',
        },
        {
          id: 'mq6_1_end_silence', speaker: 'The Welcoming Figure',
          text: '[Two seconds of maintained warmth. Then, simply:] We have time. [The patience is not kind. It is calculated. It is the patience of something that knows you will eventually respond because you always respond.]',
          tone: 'MANIPULATION',
          isEnd: true, rewardUnlocked: 'false_peace_awareness_audit',
        },
      ],
      narrativeHook: `
        The environment is perfect in a way that produces unease rather than comfort.
        You walk around it and document what is too right:
        the temperature is exactly what you would choose. The light has no source.
        The silence is the specific silence of a space that was emptied of something.
        Artemis says, very quietly: "I know it's too calm. I know that.
        But there's a part of me that wants to stay anyway."
        That honesty is the most Artemis thing she has said in Arc 6.
        You hold it close.
        The Copy is further away than it should be —
        the peace is working on it. The peace has a preference for working quietly,
        on the things that protected you, while you're looking at the things that threaten you.
      `,
    },

    {
      id: 'mq6_2_the_offer',
      title: 'The Offer',
      level: 27,
      npcId: 'welcoming_figure',
      narrativeSetup: `
        The Welcoming Figure presents memory fragments — pieces of the five arcs,
        taken from their original context and suspended in the clean air of the false peace.
        They look like they could be set down. They look like putting them down would be a kindness
        to yourself. The Figure says: "You've carried too much."
        It is not wrong. You have carried a great deal. The question is whether
        setting the fragments down is the same as setting the burden down —
        or whether the burden is what is being called the fragment,
        and the fragment is what is being called the pain.
      `,
      objectives: [
        { step: 1, text: 'Receive the four offered memory fragments — examine each before deciding' },
        { step: 2, text: 'Choose: release or resist for each fragment' },
        { step: 3, text: 'Observe what releasing a fragment does to the environment' },
        { step: 4, text: 'Observe what the Copy does when you release one' },
      ],
      reward: { type: 'fragment_integrity', name: 'What Was Kept', description: 'Memory fragment retention status established. Each kept fragment preserves a capacity. Released fragments affect Arc 6 outcomes.', xp: 280, points: 5 },
      dialogue: [
        {
          id: 'mq6_2_d1', speaker: 'The Welcoming Figure',
          text: 'You\'ve carried too much.',
          tone: 'MANIPULATION',
          choices: [
            { label: '…What do you want from me?', tone: 'AWAKENING', nextId: 'mq6_2_d2' },
            { label: 'Define "too much."', tone: 'AWAKENING', nextId: 'mq6_2_d2b' },
          ],
        },
        {
          id: 'mq6_2_d2', speaker: 'The Welcoming Figure',
          text: 'Nothing complicated. Just… let go of what hurt you.',
          tone: 'MANIPULATION',
          choices: [
            { label: 'That doesn\'t sound like a cost.', tone: 'FALSE_PEACE', nextId: 'mq6_2_d3_cost' },
            { label: 'Why would I do that?', tone: 'AWAKENING', nextId: 'mq6_2_d3_why' },
            { label: 'What happens if I don\'t?', tone: 'AWAKENING', nextId: 'mq6_2_d3_refuse' },
          ],
        },
        {
          id: 'mq6_2_d2b', speaker: 'The Welcoming Figure',
          text: 'Five arcs of interference, loss, erosion, and correction. The weight of having been fought over. That is too much for one person to carry without consequence.',
          tone: 'MANIPULATION',
          choices: [{ label: 'The consequence is that I became harder to replace.', tone: 'AWAKENING', nextId: 'mq6_2_d3_refuse' }],
        },
        {
          id: 'mq6_2_d3_cost', speaker: 'The Welcoming Figure',
          text: 'Because you deserve peace. That\'s the reason. The only reason.',
          tone: 'FALSE_PEACE',
          choices: [{ label: '"Deserve" is doing a lot of work in that sentence.', tone: 'AWAKENING', nextId: 'mq6_2_d4_fragments' }],
        },
        {
          id: 'mq6_2_d3_why', speaker: 'The Welcoming Figure',
          text: 'Because holding on is what brought you here. Every unresolved arc, every retained wound — they accumulate. They create the instability the correction mechanism required. Releasing them closes the opening.',
          tone: 'MANIPULATION',
          choices: [{ label: 'So releasing them helps you, not me.', tone: 'AWAKENING', nextId: 'mq6_2_d4_fragments' }],
        },
        {
          id: 'mq6_2_d3_refuse', speaker: 'The Welcoming Figure',
          text: '[pause] Then you remain… until you\'re ready.',
          tone: 'MANIPULATION',
          choices: [{ label: '[That pause is significant. The Figure didn\'t threaten. It waited. The wait is the threat.]', tone: 'AWAKENING', nextId: 'mq6_2_d4_fragments' }],
        },
        {
          id: 'mq6_2_d4_fragments', speaker: 'Artemis',
          text: '…These are yours. [She looks at the fragments suspended in the clean air — she recognizes them. She knows what they contain and she is uncertain about them in the specific way of someone who both wants to keep them and can imagine what it would feel like to be free of the weight.] I can feel it. The pull.',
          tone: 'GRIEF',
          choices: [{ label: 'The pull is designed. The Figure constructed it from our own data.', tone: 'AWAKENING', nextId: 'mq6_2_d5_copy' }],
        },
        {
          id: 'mq6_2_d5_copy', speaker: 'The Copy',
          text: 'If you drop them, you lose more than pain. [Still attenuated — but fighting through it.] Each fragment contains a capacity that the pain was attached to. The hurt from Arc 2 contains the specific sensitivity that made the bypass work. The dread from Arc 3 contains the perimeter instinct. They packaged the memory with its worst moment so you\'d be more willing to release the whole thing.',
          tone: 'AWAKENING',
          choices: [{ label: '[Choose which fragments to keep and which to release.]', tone: 'AWAKENING', nextId: 'mq6_2_d6_choice' }],
        },
        {
          id: 'mq6_2_d6_choice', speaker: 'Inner Voice',
          text: '[Fragment 1: The Arc 2 training stone moment — contains the bypass mechanism and the grief of the Severing. Fragment 2: The Arc 3 perimeter release — contains the protective instinct and the terror of choosing to be vulnerable. Fragment 3: The Arc 4 Copy confrontation — contains the decision to not let speed replace judgment. Fragment 4: The Arc 5 System Voice conversation — contains the knowledge that the correction mechanism addresses stability, not meaning. Each one is painful. Each one is essential.]',
          tone: 'GRIEF',
          choices: [
            { label: '[Keep all four. The pain is not separable from the capacity.]', tone: 'AWAKENING', nextId: 'mq6_2_keep_all' },
            { label: '[Release Fragment 1 — the Severing grief is the heaviest.]', tone: 'FALSE_PEACE', nextId: 'mq6_2_release_one' },
          ],
        },
        {
          id: 'mq6_2_keep_all', speaker: 'The Welcoming Figure',
          text: '[Something shifts in its expression — the first time it has expressed something other than warmth.] You don\'t need to carry those to move forward.',
          tone: 'MANIPULATION',
          choices: [{ label: 'Yes I do. They\'re not baggage. They\'re architecture.', tone: 'AWAKENING', nextId: 'mq6_2_end_kept' }],
        },
        {
          id: 'mq6_2_release_one', speaker: 'Inner Voice',
          text: '[The fragment releases. The environment brightens — the specific brightness of a weight lifted. And the bypass mechanism dims. Not disappears — dims. You will need it again in Sub-Quest 5. You\'ve made Arc 6 harder in exchange for a moment of lightness. Note that exchange.]',
          tone: 'FALSE_PEACE',
          mechanic: 'fragment_released',
          isEnd: true, rewardUnlocked: 'fragment_integrity_what_was_kept', fragmentResult: 'ONE_RELEASED',
        },
        {
          id: 'mq6_2_end_kept', speaker: 'The Copy',
          text: '[Stronger now — you kept the fragments, the Copy\'s signal is clearer.] Good.',
          tone: 'AWAKENING', isEnd: true, rewardUnlocked: 'fragment_integrity_what_was_kept', fragmentResult: 'ALL_KEPT',
        },
      ],
      narrativeHook: `
        The Figure says: "You don't need those memories to move forward."
        Artemis looks at the fragments you kept. She says:
        "I almost let go of mine. The first three days here — I almost let go of three of them.
        The only reason I didn't is that I noticed the letting-go felt like relief
        before I'd actually decided anything. And relief before the decision is manipulation."
        She pauses. "I learned that from you. From watching you in Arc 2 recognize
        that the false recovery felt like comfort before it confirmed its truth."
        The Figure is still smiling. It has the patience of something
        that has watched this conversation happen before and knows it can wait.
      `,
    },

    {
      id: 'mq6_3_letting_go',
      title: 'Letting Go',
      level: 28,
      npcId: 'welcoming_figure',
      narrativeSetup: `
        The environment responds to choices. Each memory fragment released makes the space
        more stable, more beautiful, more what you would design if you were designing comfort.
        And each release makes you slightly quieter inside. Slightly dimmer.
        Not noticeably, individually. The way a room dims when one lamp is turned off —
        you only notice when several have gone out. Artemis notices before you do.
        She says: "You feel different." And she says it with the specific quality
        of someone who is worried about what "different" means.
      `,
      objectives: [
        { step: 1, text: 'Interact with three more memory fragments — environmental response is immediate' },
        { step: 2, text: 'Track what changes in you after each interaction' },
        { step: 3, text: 'Respond to Artemis\'s concern without dismissing it' },
        { step: 4, text: 'Identify the Figure\'s goal from the pattern of what it wants released' },
      ],
      reward: { type: 'erosion_awareness', name: 'The Dimming Pattern', description: 'The erasure pattern identified. Each release targets a specific capacity. The Figure is building a version of you that cannot resist what comes next.', xp: 320, points: 6 },
      dialogue: [
        {
          id: 'mq6_3_d1_echo', speaker: 'Memory Fragment',
          text: 'You fought through this.',
          tone: 'GRIEF',
          choices: [
            { label: '[Let it go.]', tone: 'FALSE_PEACE', mechanic: 'fragment_release', nextId: 'mq6_3_d2_release' },
            { label: '[Keep it.]', tone: 'AWAKENING', mechanic: 'fragment_keep', nextId: 'mq6_3_d2_keep' },
          ],
        },
        {
          id: 'mq6_3_d2_release', speaker: 'The Welcoming Figure',
          text: '[Pleased — the first time pleasure has been audible.] See? Lighter already.',
          tone: 'FALSE_PEACE',
          choices: [{ label: '[Check the internal reading: is it lighter or is it emptier?]', tone: 'AWAKENING', nextId: 'mq6_3_d3_lighter' }],
        },
        {
          id: 'mq6_3_d2_keep', speaker: 'The Welcoming Figure',
          text: 'You\'re holding onto pain.',
          tone: 'MANIPULATION',
          choices: [{ label: '[The Copy, still attenuated:] Or strength.', tone: 'AWAKENING', nextId: 'mq6_3_d4_artemis' }],
        },
        {
          id: 'mq6_3_d3_lighter', speaker: 'Inner Voice',
          text: '[Lighter: yes. Emptier: also yes. They are not the same sensation. Lighter is the feeling of removing a weight. Emptier is the feeling of removing a support. The Figure is using the two sensations\' similarity to make releases feel like progress when they are losses. The lighter feeling is real. What produced it is also real. They are both true.]',
          tone: 'EROSION',
          choices: [{ label: '[Continue. Three fragments to assess.]', tone: 'AWAKENING', nextId: 'mq6_3_d4_artemis' }],
        },
        {
          id: 'mq6_3_d4_artemis', speaker: 'Artemis',
          text: '…I can\'t tell if we\'re healing… or losing something.',
          tone: 'GRIEF',
          choices: [
            { label: 'Both. They\'ve made the two things feel the same.', tone: 'AWAKENING', nextId: 'mq6_3_d5_pattern' },
            { label: 'I don\'t know yet either.', tone: 'EROSION', nextId: 'mq6_3_d5_pattern' },
          ],
        },
        {
          id: 'mq6_3_d5_pattern', speaker: 'Inner Voice',
          text: '[Three fragments interacted with. The pattern of what the Figure wants released: (1) the arc-specific competencies — bypass, perimeter instinct, pattern-break; (2) the relational anchors — the Arc 3 link with Artemis, the Arc 4 Copy cooperative moment; (3) the meta-awareness — the ability to recognize when you\'re being edited. If all three categories are released, what remains is the original pre-Arc 1 version of you. Inexperienced. Easily read. The version the Presence built the Copy from. The Figure is not offering peace. It is offering regression.]',
          tone: 'AWAKENING',
          choices: [{ label: 'The Figure is trying to reset me to Arc 1 state.', tone: 'AWAKENING', nextId: 'mq6_3_end' }],
        },
        {
          id: 'mq6_3_end', speaker: 'The Welcoming Figure',
          text: 'The more you release… the closer you get.',
          tone: 'MANIPULATION',
          choices: [{ label: 'Closer to what? That\'s the question you\'ve never answered directly.', tone: 'AWAKENING', nextId: 'mq6_3_end_final' }],
        },
        {
          id: 'mq6_3_end_final', speaker: 'The Welcoming Figure',
          text: '[A pause. The Figure smiles.] To rest.',
          tone: 'MANIPULATION', isEnd: true, rewardUnlocked: 'erosion_awareness_dimming_pattern',
        },
      ],
      narrativeHook: `
        You hold the dimming pattern in your mind.
        The Figure is offering regression disguised as peace.
        The Copy, fighting through the attenuation: "I understand what it's doing now.
        The peace is pre-Arc 1 optimized. If you arrive there,
        the observation capacity that built me from scratch is present again —
        and whatever sent the correction mechanism can do it again.
        Without five arcs of resistance between them and the starting point."
        The Figure, to Artemis: "He's holding on. You could help him let go."
        Artemis looks at you.
        Then at the Figure.
        Then at you again.
        She says: "No."
        One word. Clear. The Figure's expression does not change.
        But the warmth in the air drops two degrees.
      `,
    },

    {
      id: 'mq6_4_truth_beneath',
      title: 'The Truth Beneath',
      level: 29,
      npcId: 'welcoming_figure',
      narrativeSetup: `
        The sky repeats. You watch a cloud formation complete its arc and begin again —
        the same cloud, the same shape, the same precise trajectory. The second repetition
        is confirmation of what you suspected. The third is insult.
        The Figure's face has been the same expression for how many hours.
        The warmth in its voice has never varied by a degree.
        Artemis notices your noticing. She says: "It doesn't change."
        You say: "Nothing real stays the same."
        The Figure, having heard this: "Consistency is peace."
      `,
      objectives: [
        { step: 1, text: 'Observe six repeated patterns in the environment — the sky, the Figure\'s expression, the light source, the temperature, the silence duration, the fragment placement' },
        { step: 2, text: 'Confront the Figure with the patterns directly' },
        { step: 3, text: 'Survive the Figure\'s response to being named' },
        { step: 4, text: 'Find the seam in the false peace — the point where the construction shows its edge' },
      ],
      reward: { type: 'seam_location', name: 'The Edge', description: 'The construction\'s seam is found. The false peace has a maintenance mechanism. Disrupting it causes visible instability. The exit is near the seam.', xp: 380, points: 7 },
      dialogue: [
        {
          id: 'mq6_4_d1', speaker: 'Player',
          text: '…This place is repeating.',
          tone: 'AWAKENING',
          choices: [
            { label: 'This is fake.', tone: 'AWAKENING', nextId: 'mq6_4_d2_fake' },
            { label: 'You\'re hiding something.', tone: 'AWAKENING', nextId: 'mq6_4_d2_hiding' },
            { label: 'Why does it feel empty?', tone: 'EROSION', nextId: 'mq6_4_d2_empty' },
          ],
        },
        {
          id: 'mq6_4_d2_fake', speaker: 'The Welcoming Figure',
          text: 'Define "fake." [A glitch flicker — the first visible distortion in Arc 6. Brief. The Figure\'s warmth reasserts immediately. But it was there.] This space functions as it was designed. The design produces peace. "Fake" implies a deception. There is no deception here — only design.',
          tone: 'MANIPULATION',
          choices: [{ label: 'Design without consent is deception.', tone: 'AWAKENING', nextId: 'mq6_4_d3_glitch' }],
        },
        {
          id: 'mq6_4_d2_hiding', speaker: 'The Welcoming Figure',
          text: 'I\'m protecting you. The fragmented nature of your experience across five arcs created accumulated trauma states. This environment is designed to address them. My role is protective.',
          tone: 'MANIPULATION',
          choices: [{ label: 'Protective of me — or protective of whoever sent you.', tone: 'AWAKENING', nextId: 'mq6_4_d3_glitch' }],
        },
        {
          id: 'mq6_4_d2_empty', speaker: 'The Welcoming Figure',
          text: 'Because you haven\'t let go enough. The residual fragments are creating friction in the peace. When you release them, the emptiness will be resolved. Peace will feel full.',
          tone: 'MANIPULATION',
          choices: [{ label: 'Peace that requires you to become less of yourself to feel isn\'t peace.', tone: 'AWAKENING', nextId: 'mq6_4_d3_glitch' }],
        },
        {
          id: 'mq6_4_d3_glitch', speaker: 'The Copy',
          text: 'You see it now. [The glitch was a tell — the construction strains when directly named. Keep naming it.]',
          tone: 'AWAKENING',
          choices: [{ label: '[Name the six repeated patterns. Out loud. Specifically.]', tone: 'AWAKENING', nextId: 'mq6_4_d4_name_patterns' }],
        },
        {
          id: 'mq6_4_d4_name_patterns', speaker: 'Player',
          text: 'The cloud repeats every forty seconds. Your expression has not changed in six hours. The light has no source — it\'s ambient, which means it\'s generated. The temperature is exactly 68 degrees and has been since I arrived, which no outdoor environment maintains. The silence gaps are exactly eleven seconds — not random, scheduled. The memory fragments are always in the same four positions when I turn around.',
          tone: 'AWAKENING',
          choices: [{ label: '[Watch what happens when the construction is named this specifically.]', tone: 'AWAKENING', nextId: 'mq6_4_d5_strained' }],
        },
        {
          id: 'mq6_4_d5_strained', speaker: 'The Welcoming Figure',
          text: '[Tone shifts — the warmth is still present but something underneath it is visible now, the way structural damage shows through paint.] You were not supposed to question it.',
          tone: 'MANIPULATION',
          choices: [
            { label: 'There it is.', tone: 'AWAKENING', nextId: 'mq6_4_end_artemis' },
          ],
        },
        {
          id: 'mq6_4_end_artemis', speaker: 'Artemis',
          text: '…This isn\'t peace. It\'s control. [She says it with the quiet certainty of someone who has found the word they\'ve been searching for since Arc 6 began.] The peace is the delivery mechanism. The control is the content.',
          tone: 'AWAKENING', isEnd: true, rewardUnlocked: 'seam_location_the_edge',
        },
      ],
      narrativeHook: `
        The seam is behind the Figure's left shoulder — a two-degree temperature drop
        in a precise rectangle that marks where the constructed environment
        meets whatever is underneath it.
        You find it by temperature because the virus couldn't replicate body-knowledge.
        The Figure follows your eyes to the seam. Its expression, for the first time,
        produces something that is not warmth.
        It says: "You don't have to leave."
        That sentence is not an offer. It is a statement of capacity.
        The Copy, fully present now for the first time in Arc 6:
        "It could keep you here. That's what it just told you.
        It doesn't force — it doesn't need to force if you don't find the exit.
        The seam is the exit. What's on the other side of it is not peace.
        What's on the other side is real."
      `,
    },

    {
      id: 'mq6_5_the_choice',
      title: 'The Choice',
      level: 30,
      npcId: 'welcoming_figure',
      narrativeSetup: `
        The seam. You stand at it with Artemis and the Copy — the Copy's signal is
        fully present again, the peace's attenuation collapsed when you named the construction.
        The Figure stands at its usual position. Its warmth is still present.
        It says: "This place exists for your benefit." It believes this.
        That is the most genuinely troubling thing about it.
        It was built with care. It was built with you in mind.
        The fact that it was also built to regress you does not mean
        no care was taken in the construction.
        The care was part of the trap.
      `,
      objectives: [
        { step: 1, text: 'Stand at the seam — the exit point of the false peace' },
        { step: 2, text: 'Receive the Figure\'s final argument' },
        { step: 3, text: 'Stabilize Artemis for the crossing — she has been here longest and is most affected' },
        { step: 4, text: 'Cross the seam — or stay' },
      ],
      reward: { type: 'arc6_completion', name: 'The Other Side', description: 'Arc 6 complete. False peace exited. The real world is unfinished and difficult and yours. Arc 7 unlocked.', xp: 700, points: 14 },
      dialogue: [
        {
          id: 'mq6_5_d1', speaker: 'The Welcoming Figure',
          text: 'This place exists for your benefit.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: '…It\'s a cage.', tone: 'AWAKENING', nextId: 'mq6_5_d2_cage' },
          ],
        },
        {
          id: 'mq6_5_d2_cage', speaker: 'The Welcoming Figure',
          text: 'It is peace.',
          tone: 'MANIPULATION',
          choices: [
            { label: 'Break the cycle.', tone: 'AWAKENING', nextId: 'mq6_5_d3_reject' },
            { label: '…I need more time.', tone: 'FALSE_PEACE', nextId: 'mq6_5_d3_time' },
            { label: 'I accept.', tone: 'EROSION', nextId: 'mq6_5_d3_accept' },
          ],
        },
        {
          id: 'mq6_5_d3_reject', speaker: 'Player',
          text: 'I\'m not giving up what made me who I am. Not for peace that was designed to undo it.',
          tone: 'AWAKENING',
          choices: [{ label: '[To Artemis: We\'re crossing. Now.]', tone: 'AWAKENING', nextId: 'mq6_5_artemis_ready' }],
        },
        {
          id: 'mq6_5_artemis_ready', speaker: 'Artemis',
          text: '…That\'s the right choice. [She says it the way she said things in Arc 3 — with her full weight behind it. The peace hasn\'t taken everything.] I\'m ready.',
          tone: 'AWAKENING',
          choices: [{ label: '[The Copy:] Good. Now move.', tone: 'AWAKENING', nextId: 'mq6_5_figure_final' }],
        },
        {
          id: 'mq6_5_d3_time', speaker: 'The Welcoming Figure',
          text: 'Then stay. [It is gentle. The gentleness is exactly calibrated.] There is no urgency here.',
          tone: 'FALSE_PEACE',
          choices: [{ label: '[Artemis, fading slightly:] …Don\'t take too long.', tone: 'EROSION', nextId: 'mq6_5_figure_final_time' }],
        },
        {
          id: 'mq6_5_d3_accept', speaker: 'The Welcoming Figure',
          text: '[Restored calm.] Then let go.',
          tone: 'FALSE_PEACE',
          choices: [{ label: '[The Copy, distant:] …You\'re disappearing.', tone: 'EROSION', nextId: 'mq6_5_figure_final_accept' }],
        },
        {
          id: 'mq6_5_figure_final', speaker: 'The Welcoming Figure',
          text: 'You will regret holding on. [It is not a threat. It is a prediction. And it is, in one sense, accurate — the real world does not stop being difficult because you left a constructed peace. But "difficult" and "regrettable" are not the same thing.] [The world fractures at the seam. The exit opens.]',
          tone: 'MANIPULATION', isEnd: true, rewardUnlocked: 'arc6_complete_exit', arcResult: 'REJECTED',
        },
        {
          id: 'mq6_5_figure_final_time', speaker: 'Inner Voice',
          text: '[You stay longer. Each cycle of the false peace is slightly shorter now — it\'s compensating for your partial resistance. Artemis grows dimmer. You have eleven cycles before her original self is no longer recoverable. The exit is still at the seam. The cost of delay is Artemis.]',
          tone: 'EROSION', isEnd: true, rewardUnlocked: 'arc6_complete_delayed', arcResult: 'DELAYED',
        },
        {
          id: 'mq6_5_figure_final_accept', speaker: 'Inner Voice',
          text: '[You stay. The peace continues. It is, as promised, peaceful. What you are giving up is not immediately visible. That is the design. Arc 7 will begin in the peace. Getting out of it will be Arc 7\'s first task.]',
          tone: 'EROSION', isEnd: true, rewardUnlocked: 'arc6_complete_accepted', arcResult: 'ACCEPTED',
        },
      ],
      narrativeHook: `
        The other side of the seam: the real world.
        Rough. Uneven. The light has a source and the source is not perfectly positioned.
        The temperature is whatever the temperature is.
        It is the most beautiful thing you have experienced in Arc 6.
        The Figure does not follow. It stands at the edge of the seam and watches you go.
        Its expression: still warm. Still composed.
        Still waiting, with the patience of something that knows
        this is not the last chance it will have.
        The Copy: "It's still there. On the other side. Waiting for the next person."
        Skadi: "Or for you to come back."
        She pauses.
        "Don't."
      `,
    },
  ],
};

export const ARC6_SIDE_QUESTS = [
  {
    id: 'sq6_1_false_reunion', title: 'False Reunion', level: 26,
    objectives: [
      { step: 1, text: 'Encounter a figure who appears to be from your past arcs' },
      { step: 2, text: 'Apply the recognition protocol from Arc 5 — question, silence, blink rate' },
      { step: 3, text: 'Determine: genuine person, memory fragment, or false construct' },
    ],
    reward: { type: 'recognition_skill', name: 'Past vs Constructed', description: 'Recognition protocol applied to familiar figures. Genuine vs constructed accuracy +40%.', xp: 170, points: 3 },
    dialogue: [
      {
        id: 'sq6_1_d1', speaker: 'Familiar Figure',
        text: 'I\'ve been waiting for you.',
        tone: 'FALSE_PEACE',
        choices: [
          { label: '…You\'re not real.', tone: 'AWAKENING', nextId: 'sq6_1_d2' },
          { label: '[Apply recognition protocol: ask a feeling question.]', tone: 'AWAKENING', nextId: 'sq6_1_d2_protocol' },
        ],
      },
      {
        id: 'sq6_1_d2', speaker: 'Familiar Figure',
        text: '[No processing pause. No blink-before-answer.] I\'m real. I\'ve been here since you arrived.',
        tone: 'FALSE_PEACE',
        choices: [{ label: '[That answer was too fast. Real people process before they reassure.]', tone: 'AWAKENING', nextId: 'sq6_1_end' }],
      },
      {
        id: 'sq6_1_d2_protocol', speaker: 'Inner Voice',
        text: '[Feeling question: "What did you feel the first time I made a choice that surprised you?" Real people reach for the specific memory first. Constructs reference the category.]',
        tone: 'AWAKENING',
        choices: [{ label: '[Ask the question.]', tone: 'AWAKENING', nextId: 'sq6_1_d3_answer' }],
      },
      {
        id: 'sq6_1_d3_answer', speaker: 'Familiar Figure',
        text: 'Surprise. And then relief.',
        tone: 'FALSE_PEACE',
        choices: [{ label: '[Category response, not specific memory. Construct confirmed.]', tone: 'AWAKENING', nextId: 'sq6_1_end' }],
      },
      {
        id: 'sq6_1_end', speaker: 'Inner Voice',
        text: '[The figure does not dissolve when identified — unlike Arc 5 constructs, the false peace\'s figures simply... remain. They do not require your belief to continue existing. They continue whether you acknowledge them as real or not. That is a different kind of threat.]',
        tone: 'EROSION', isEnd: true, rewardUnlocked: 'recognition_skill_past_vs_constructed',
      },
    ],
  },
  {
    id: 'sq6_2_perfect_loop', title: 'Perfect Loop', level: 27,
    objectives: [
      { step: 1, text: 'Recognize the perfect day repeating' },
      { step: 2, text: 'Identify what makes each repetition slightly more comfortable' },
      { step: 3, text: 'Break out before the comfort becomes permanent' },
    ],
    reward: { type: 'loop_immunity_2', name: 'Comfort Resistance', description: 'The perfect-loop mechanism identified. Comfort escalation pattern recognized. Immune to comfort-based loops.', xp: 190, points: 4 },
    dialogue: [
      {
        id: 'sq6_2_d1', speaker: 'Player',
        text: 'This already happened.',
        tone: 'AWAKENING',
        choices: [{ label: '[Count: how many repetitions to notice?]', tone: 'AWAKENING', nextId: 'sq6_2_d2' }],
      },
      {
        id: 'sq6_2_d2', speaker: 'The Welcoming Figure',
        text: 'Then enjoy it again.',
        tone: 'MANIPULATION',
        choices: [
          { label: '[Measure: is this iteration more comfortable than the last?]', tone: 'AWAKENING', nextId: 'sq6_2_d3' },
        ],
      },
      {
        id: 'sq6_2_d3', speaker: 'Inner Voice',
        text: '[Yes. Each iteration is calibrated to be 2-3% more comfortable than the previous. The escalation is slow enough to be imperceptible on any single loop but produces, over fifteen repetitions, a comfort state so complete that breaking out feels like loss rather than escape. This is the mechanism. The perfect loop is a desensitization tool.]',
        tone: 'EROSION',
        choices: [{ label: '[Break on iteration 4, before the comfort differential becomes significant.]', tone: 'AWAKENING', nextId: 'sq6_2_end' }],
      },
      {
        id: 'sq6_2_end', speaker: 'Inner Voice',
        text: '[You break on iteration 4. The comfort resistance is established. Future loops — perfect or otherwise — now carry a visible increment indicator. You can see the calibration. The calibration\'s transparency makes it ineffective.]',
        tone: 'AWAKENING', isEnd: true, rewardUnlocked: 'loop_immunity_2_comfort_resistance',
      },
    ],
  },
  {
    id: 'sq6_3_silent_artemis', title: 'Silent Artemis', level: 28,
    objectives: [
      { step: 1, text: 'Notice that Artemis has stopped speaking — determine how long the silence has been active' },
      { step: 2, text: 'Attempt five different approaches to prompt a response' },
      { step: 3, text: 'Identify what is preventing her voice — virus interference or her own withdrawal into the peace' },
    ],
    reward: { type: 'artemis_voice', name: 'Reclaimed Voice', description: 'Artemis\'s silence broken. Its cause: she was allowing the peace to feel sufficient. The distinction matters — it was her choice, not the peace\'s action. That distinction is her strength back.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq6_3_d1', speaker: 'Player',
        text: '…Say something.',
        tone: 'GRIEF',
        choices: [{ label: '[Nothing. Two minutes of silence. Then five.]', tone: 'GRIEF', nextId: 'sq6_3_d2' }],
      },
      {
        id: 'sq6_3_d2', speaker: 'Inner Voice',
        text: '[Five approaches attempted: direct request — nothing. Feeling question — nothing. The Arc 3 link — faint response, not voiced. Her name — eyes shift but no words. A statement of what you need from her specifically — the longest pause yet, then:]',
        tone: 'GRIEF',
        choices: [{ label: '[Wait. The longest pause yet is still processing.]', tone: 'GRIEF', nextId: 'sq6_3_d3' }],
      },
      {
        id: 'sq6_3_d3', speaker: 'Artemis',
        text: '…I was letting the quiet be enough. [Her voice is lower than it was. Not damaged — careful. She was choosing not to speak because speaking felt like it would disturb something.] The peace made silence feel like wisdom. I don\'t think it was.',
        tone: 'AWAKENING', isEnd: true, rewardUnlocked: 'artemis_voice_reclaimed_voice',
      },
    ],
  },
  {
    id: 'sq6_4_weightless', title: 'Weightless', level: 29,
    objectives: [
      { step: 1, text: 'Notice the progressive reduction in resistance — decisions feel easier, actions feel lighter' },
      { step: 2, text: 'Identify what has been removed that made things feel weighted before' },
      { step: 3, text: 'Recover the weight deliberately — reattach what the peace removed' },
    ],
    reward: { type: 'weight_recovery', name: 'Earned Resistance', description: 'The weight of experience recovered. Arc-specific capacities reattached. Actions carry consequence again — which means they carry meaning.', xp: 220, points: 4 },
    dialogue: [
      {
        id: 'sq6_4_d1', speaker: 'Player',
        text: '…I don\'t feel anything.',
        tone: 'EROSION',
        choices: [{ label: '[Check: what should this decision feel like?]', tone: 'AWAKENING', nextId: 'sq6_4_d2' }],
      },
      {
        id: 'sq6_4_d2', speaker: 'The Copy',
        text: 'That\'s not good. [Present but quiet.] The weight isn\'t pain. The weight is accountability. The peace removed the accountability along with the pain and you\'re now making decisions in a frictionless environment. Frictionless is not the same as clean. It\'s the same as consequence-free. Consequence-free decisions don\'t build anything.',
        tone: 'AWAKENING',
        choices: [{ label: '[Deliberately reattach the weight: this decision matters, these people matter, this outcome has real stakes.]', tone: 'AWAKENING', nextId: 'sq6_4_end' }],
      },
      {
        id: 'sq6_4_end', speaker: 'Inner Voice',
        text: '[The weight returns. With it, a quality of attention that the weightless state had removed — the specific way you notice things when they matter. The peace becomes slightly uncomfortable. That discomfort is correct.]',
        tone: 'AWAKENING', isEnd: true, rewardUnlocked: 'weight_recovery_earned_resistance',
      },
    ],
  },
  {
    id: 'sq6_5_hidden_exit', title: 'Hidden Exit', level: 29,
    objectives: [
      { step: 1, text: 'Find the glitch that reveals the crack in the false peace' },
      { step: 2, text: 'Verify the crack is a genuine exit and not a false exit planted to intercept escapees' },
      { step: 3, text: 'Confirm with the Copy and Artemis before using it' },
    ],
    reward: { type: 'exit_knowledge', name: 'Second Way Out', description: 'A backup exit located and verified. If the primary seam is blocked in a future arc, this one exists. Emergency exit registered.', xp: 240, points: 5 },
    dialogue: [
      {
        id: 'sq6_5_d1', speaker: 'The Copy',
        text: 'There. That\'s real. [Points to a specific temperature irregularity in the north wall — a two-degree drop in a fifteen-centimeter section. The same body-knowledge technique from Arc 5.]',
        tone: 'AWAKENING',
        choices: [{ label: '[Verify: temperature-real, not constructed.]', tone: 'AWAKENING', nextId: 'sq6_5_d2' }],
      },
      {
        id: 'sq6_5_d2', speaker: 'Artemis',
        text: 'Is it real or did the Figure plant it?',
        tone: 'CONFUSION',
        choices: [{ label: '[Check: does the opening lead to uneven texture on the other side, or smooth construction?]', tone: 'AWAKENING', nextId: 'sq6_5_d3' }],
      },
      {
        id: 'sq6_5_d3', speaker: 'Inner Voice',
        text: '[Uneven texture. Rough stone. A smell that wasn\'t in the false peace — something with organic decay in it, something alive in the wrong direction. This is the real world on the other side. The Figure didn\'t plant it — it exists because the construction is imperfect. No construction covers everything.]',
        tone: 'AWAKENING', isEnd: true, rewardUnlocked: 'exit_knowledge_second_way_out',
      },
    ],
  },
  {
    id: 'sq6_6_test_of_release', title: 'Test of Release', level: 30,
    objectives: [
      { step: 1, text: 'The Figure forces a temporary full release of all memory fragments' },
      { step: 2, text: 'Experience the weightless state for sixty seconds — observe what it feels like to be the pre-Arc 1 version' },
      { step: 3, text: 'Recover at the sixty-second mark — confirm all fragments are retrievable' },
    ],
    reward: { type: 'fragment_proof', name: 'Nothing Was Permanent', description: 'The release was temporary. All fragments recovered. The Figure cannot permanently take what you consciously hold. Forced release immunity established.', xp: 260, points: 5 },
    dialogue: [
      {
        id: 'sq6_6_d1', speaker: 'The Welcoming Figure',
        text: 'See how easy it is? [The fragments release — all of them, simultaneously, without your choosing. The environment brightens to its maximum calibrated state. You feel the pre-Arc 1 clarity — clean, open, undefended. And, for the first time, you experience it consciously. You know exactly what it is you\'re experiencing. That knowledge changes the experience entirely.]',
        tone: 'MANIPULATION',
        mechanic: 'forced_release',
        choices: [{ label: '[Hold the knowledge that this is the pre-Arc 1 state. Don\'t let the clarity consume the knowing.]', tone: 'AWAKENING', nextId: 'sq6_6_d2' }],
      },
      {
        id: 'sq6_6_d2', speaker: 'Inner Voice',
        text: '[Sixty seconds. The warmth. The openness. The specific peace of not having been through anything yet. It is genuine. It is also — held consciously — clearly incomplete. Pre-Arc 1 you was not worse or better. Just earlier. You have become more specific. More earned. More yourself. At sixty seconds: the fragments are still there. They went nowhere. The Figure released your grip on them — not them from you.]',
        tone: 'AWAKENING',
        choices: [{ label: '[Reclaim the fragments. All of them. Now.]', tone: 'AWAKENING', nextId: 'sq6_6_end' }],
      },
      {
        id: 'sq6_6_end', speaker: 'The Welcoming Figure',
        text: '[The warmth does not dim. Its expression does not change.] You chose to return to difficulty. [pause] Most do not.',
        tone: 'MANIPULATION', isEnd: true, rewardUnlocked: 'fragment_proof_nothing_permanent',
      },
    ],
  },
];

export const ALL_ARC6_QUESTS = [
  ...MAIN_QUEST_CHAIN_6.subQuests.map(sq => ({ ...sq, questType: 'main', arc: 'arc6', chain: 'mq_arc6' })),
  ...ARC6_SIDE_QUESTS.map(sq => ({ ...sq, questType: 'side', arc: 'arc6' })),
];

export function getArc6QuestsForLevel(playerLevel) {
  return ALL_ARC6_QUESTS.filter(q => q.level <= playerLevel);
}

export function getArc6DialogueNode(questId, nodeId) {
  const quest = ALL_ARC6_QUESTS.find(q => q.id === questId);
  if (!quest?.dialogue) return null;
  return quest.dialogue.find(d => d.id === nodeId) || null;
}