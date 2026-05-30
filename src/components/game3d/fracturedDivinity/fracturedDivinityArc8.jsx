// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 8: "Betrayal of the Divine"
// Quest chain: Levels 36–40
// Main Quest 8: "God's Silence" (5 sub-quests) + 6 Side Quests
// Tone: confrontational, philosophical, emotionally heavy
// Theme: truth vs belief, abandonment, authority, meaning
// Tone tags: SILENCE | CONFRONTATION | PHILOSOPHY | GRIEF | AUTONOMY | MEANING
// ─────────────────────────────────────────────────────────────────────────────

export const ARC8_NPCS = [
  {
    id: 'the_presence_arc8',
    name: 'The Presence',
    description: 'Now fully visible — or as visible as it chooses to be. It does not attack. It answers in the specific way that makes you construct your own answers from what it gives you. Not manipulative. Just fundamentally, structurally unable to give you what you need directly.',
    tint: 0xfaf0e0,
  },
  {
    id: 'artemis_arc8',
    name: 'Artemis',
    description: 'Angrier in Arc 8 than in any previous arc. The silence of the divine is a specific offense to her — she built her world around the relationship with you, and the fact that a presence could have intervened at any point and chose not to is something she processes loudly.',
    tint: 0x1a1a3a,
  },
  {
    id: 'the_copy_arc8',
    name: 'The Copy',
    description: 'More analytical than emotional about the divine silence. It approaches the Presence with the same framework it used on the Virus — not as a philosophical entity but as a system with describable properties. This is useful and occasionally misses the point.',
    tint: 0x2a1a2a,
  },
  {
    id: 'luna_arc8',
    name: 'Luna',
    description: 'More present in Arc 8 than she\'s been since Arc 1. The divine silence is the subject she was built to help navigate. Her guidance is careful, specific, and does not pretend to have the answer.',
    tint: 0x1a2a3a,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QUEST 8 — "God's Silence"
// ═══════════════════════════════════════════════════════════════════════════════
export const MAIN_QUEST_CHAIN_8 = {
  id: 'mq_arc8',
  title: "God's Silence",
  arc: 'Arc 8: Betrayal of the Divine',
  description: 'The most difficult arc is not the one where something attacks you. It is the one where something that could have intervened at every stage simply observed. The Presence has been present since before Arc 1. It watched the interference, the lock, the copy mechanism, the virus, the sanctuary, the judgment loop. It did not intervene. The question Arc 8 builds to is not "why didn\'t you help?" That question has a hundred possible answers. The question is: "What do I do with the fact that you didn\'t?"',
  subQuests: [

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 1 — "The Silence"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq8_1_the_silence',
      title: 'The Silence',
      level: 36,
      npcId: 'the_presence_arc8',
      narrativeSetup: `
        After breaking the Judgment Loop, the world stabilizes — genuinely, this time.
        Not the False Peace's managed stability. Not the Loop's enforced repetition.
        Real stabilization: variable, imperfect, with the ambient drift
        that real environments have.
        Something is missing, though. The system voices are gone.
        The loop mechanism is gone. The figure and its sanctuary are gone.
        No external interference. No virus edits. No pattern repetition.
        Just: silence.
        Not the silence of absence. The silence of presence that has chosen not to speak.
        Something has been here the entire time. Eight arcs of being here.
        You have never felt it more clearly than now, in the quiet,
        because there is nothing else to feel.
      `,
      objectives: [
        { step: 1, text: 'Explore the genuinely stabilized environment — catalog what is real' },
        { step: 2, text: 'Speak into the silence — call out without knowing what will answer' },
        { step: 3, text: 'Wait for the response — the waiting itself is the arc mechanic' },
        { step: 4, text: 'Receive the first presence-contact' },
      ],
      reward: {
        type: 'presence_contact',
        name: 'The Presence Acknowledged',
        description: 'First contact established with the Presence in its unmediated form. Arc 8 communication channel open.',
        xp: 200, points: 4,
      },
      dialogue: [
        {
          id: 'mq8_1_d1_quiet',
          speaker: 'Artemis',
          text: '...It\'s gone. [She says it with the specific tone of someone assessing a room after a long party — the silence after the noise is its own kind of presence.] The System Voice. The loop. The Figure. All of it. [pause] It feels different from the False Peace. This feels — actually empty. Not managed.',
          tone: 'SILENCE',
          choices: [
            { label: '...Or it\'s waiting.', tone: 'DOUBT', nextId: 'mq8_1_d2_waiting' },
          ],
        },
        {
          id: 'mq8_1_d2_waiting',
          speaker: 'Artemis',
          text: '[She considers this. Then she looks at you with the expression that means she agrees but doesn\'t want to.] That\'s worse, isn\'t it. If it\'s waiting — then there\'s something here that chose to wait. Which means it chose to not say anything for eight arcs. [pause] I\'m already angry and it hasn\'t even appeared yet.',
          tone: 'CONFRONTATION',
          choices: [
            { label: '[Call out. Directly. Into the silence.]', tone: 'DETERMINATION', nextId: 'mq8_1_d3_call' },
          ],
        },
        {
          id: 'mq8_1_d3_call',
          speaker: 'You',
          text: 'If something\'s there — show yourself.',
          tone: 'CONFRONTATION',
          choices: [
            { label: 'Answer me!', tone: 'CONFRONTATION', nextId: 'mq8_1_d4_shout' },
            { label: '[Stay silent. Wait. The waiting is the choice.]', tone: 'DETERMINATION', nextId: 'mq8_1_d4_wait' },
            { label: 'I know you\'re there.', tone: 'CONTROL', nextId: 'mq8_1_d4_know' },
          ],
        },
        {
          id: 'mq8_1_d4_shout',
          speaker: 'Inner Voice',
          text: '[An echo returns from somewhere — not the walls, not the environment. From the presence itself. The echo is distorted but decipherable. Two syllables: "...there..." The word from inside the silence. Not an answer. An acknowledgment that there is something to answer.] [The Copy:] This isn\'t absence.',
          tone: 'SILENCE',
          choices: [{ label: '[Wait. The echo means it can speak. Give it time to choose to speak more.]', tone: 'DETERMINATION', nextId: 'mq8_1_d5_presence' }],
        },
        {
          id: 'mq8_1_d4_wait',
          speaker: 'Inner Voice',
          text: '[Nothing happens longer than expected. The Copy, beside you, settles into the waiting alongside you — a thing the Copy has never done before, in any arc. Waiting alongside rather than filling the gap. Then: a low vibration. Environmental resonance that doesn\'t match the ambient sound profile. Something is responding to the waiting by creating a frequency. The frequency is warm. Body-knowledge warm.]',
          tone: 'SILENCE',
          mechanic: 'presence_resonance',
          choices: [{ label: '[Follow the resonance. Walk toward it.]', tone: 'DETERMINATION', nextId: 'mq8_1_d5_presence' }],
        },
        {
          id: 'mq8_1_d4_know',
          speaker: 'Inner Voice',
          text: '[The specific quality of the silence changes. Not a sound — a pressure. Like a room changing temperature. The presence, shifting its weight toward the conversation.] [Artemis, quiet:] "It feels intentional." [The Copy:] "This isn\'t absence."',
          tone: 'SILENCE',
          choices: [{ label: '[Hold the pressure. Let it become a presence.]', tone: 'DETERMINATION', nextId: 'mq8_1_d5_presence' }],
        },
        {
          id: 'mq8_1_d5_presence',
          speaker: 'Unknown Voice',
          text: '[Clear. Calm. Not the System Voice, not the loop voice, not the Figure\'s managed warmth. Something older. The quality of a voice that has been speaking for a very long time and has learned to speak only when it has something to say.] ...You called.',
          tone: 'SILENCE',
          isEnd: true,
          rewardUnlocked: 'presence_contact_acknowledged',
        },
      ],
      narrativeHook: `
        You called and something answered.
        Artemis: "Is that it? Is that the thing that was here the whole time?"
        The presence doesn't answer that. Which is the first data point.
        The Copy: "It answers 'you called.' It doesn't answer whether it was here.
        That selective answering is systematic — it responds to what you can verify
        and declines what it would have to claim."
        Luna's signal: "That's the Presence. Arc 1 Presence.
        The one that created the conditions for everything that followed.
        It didn't do any of the subsequent arcs to you.
        But it left the door that everything else walked through.
        That distinction matters and also isn't absolution."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 2 — "The Presence"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq8_2_the_presence',
      title: 'The Presence',
      level: 36,
      npcId: 'the_presence_arc8',
      narrativeSetup: `
        It manifests — not fully visible, not the way a person is visible.
        More like a quality of the air. Warmth and weight and the specific feeling
        of being observed by something that is genuinely interested, not calculating.
        It doesn't attack. It doesn't defend.
        It simply is present in a way that makes the six arcs of systems and mechanisms
        feel, suddenly, like a very long approach to this conversation.
        You have questions. Eight arcs of questions.
        The first one is the one you ask because it\'s the one that's been building
        since you felt the Presence\'s warmth in Arc 1 and paused in it
        and opened the door the Virus walked through.
        What are you.
        That question is older than Arc 1.
      `,
      objectives: [
        { step: 1, text: 'Approach the Presence without the defensive posture of previous arcs' },
        { step: 2, text: 'Ask the three questions that have been building since Arc 1' },
        { step: 3, text: 'Interpret the responses — they are not evasions, they are the actual answers it has' },
        { step: 4, text: 'Sit with what the answers mean' },
      ],
      reward: {
        type: 'presence_understanding',
        name: 'The First Understanding',
        description: 'You understand what the Presence is and what it isn\'t. This distinction is necessary for Sub-Quest 3.',
        xp: 240, points: 5,
      },
      dialogue: [
        {
          id: 'mq8_2_d1_approach',
          speaker: 'You',
          text: '...What are you?',
          tone: 'PHILOSOPHY',
          choices: [
            { label: '[Wait for the full answer before responding.]', tone: 'DETERMINATION', nextId: 'mq8_2_d2_iam' },
          ],
        },
        {
          id: 'mq8_2_d2_iam',
          speaker: 'The Presence',
          text: 'I am. [Two words. Not an evasion — actually the most accurate thing it can say. Its existence is its nature. It does not have a separate description of what it is that it\'s choosing not to share. It simply is. That is genuinely the entire answer to "what are you."]',
          tone: 'SILENCE',
          choices: [
            { label: 'That\'s not an answer.', tone: 'CONFRONTATION', nextId: 'mq8_2_d3_not_answer' },
            { label: '...It is sufficient.', tone: 'PHILOSOPHY', nextId: 'mq8_2_d3_sufficient' },
            { label: 'Did you cause everything that happened?', tone: 'CONFRONTATION', nextId: 'mq8_2_d3_caused' },
            { label: 'Why didn\'t you help me?', tone: 'GRIEF', nextId: 'mq8_2_d3_help' },
          ],
        },
        {
          id: 'mq8_2_d3_not_answer',
          speaker: 'The Presence',
          text: 'It is sufficient. [The same phrase. Not defensive — patient. The tone of something that has given the correct answer and is willing to hold the space while you determine that.] [The Copy, processing this simultaneously:] It\'s not refusing. It doesn\'t have a more detailed answer. The description and the thing are identical. That\'s a structural property, not a choice.',
          tone: 'SILENCE',
          choices: [
            { label: 'Did you cause everything that happened?', tone: 'CONFRONTATION', nextId: 'mq8_2_d3_caused' },
          ],
        },
        {
          id: 'mq8_2_d3_sufficient',
          speaker: 'Artemis',
          text: '[Quiet anger.] No it isn\'t. [She is not going to accept the "I am" answer without pushback. She asks, without looking at you:] Did you cause everything that happened? Eight arcs of everything?',
          tone: 'CONFRONTATION',
          choices: [
            { label: '[Let Artemis push. Follow her lead.]', tone: 'TRUST', nextId: 'mq8_2_d3_caused' },
          ],
        },
        {
          id: 'mq8_2_d3_caused',
          speaker: 'The Presence',
          text: 'I allowed. [A specific word — "allowed" rather than "caused" or "made" or "did." The distinction is: it was present when the conditions existed and did not prevent them. It did not initiate them. The Virus, the Figure, the Loop, the Copy Mechanism — these were not its projects. They used the door it left. The door it left was real.]',
          tone: 'SILENCE',
          choices: [
            { label: 'Allowed is not the same as innocent.', tone: 'CONFRONTATION', nextId: 'mq8_2_d4_artemis' },
            { label: 'Why didn\'t you help me?', tone: 'GRIEF', nextId: 'mq8_2_d3_help' },
          ],
        },
        {
          id: 'mq8_2_d3_help',
          speaker: 'The Presence',
          text: '[A pause — longer than any previous response. The pause that carries the most weight in the arc.] You endured. [Not an answer to "why didn\'t you help." A statement about what happened. The difference is: "why" implies a reasoning that can be given to you. "You endured" acknowledges what occurred without explaining it. It can\'t explain it in terms you can use. It can only acknowledge what it witnessed.]',
          tone: 'GRIEF',
          choices: [
            { label: 'That\'s not the same as helping.', tone: 'CONFRONTATION', nextId: 'mq8_2_d4_artemis' },
          ],
        },
        {
          id: 'mq8_2_d4_artemis',
          speaker: 'Artemis',
          text: '[Full anger now — the kind that has been building since Arc 1 and has been contained by necessity and is no longer necessary to contain.] That\'s not the same as helping! [She says the sentence you were thinking, or maybe you say it — the boundary between her voice and yours in this moment is very close.] You were there. Every arc. We could feel you. And you watched us go through eight arcs of increasingly structured attempts to break us and you did. Nothing.',
          tone: 'CONFRONTATION',
          choices: [
            { label: '[Stay with her anger. Don\'t moderate it. It\'s accurate.]', tone: 'TRUST', nextId: 'mq8_2_end' },
          ],
        },
        {
          id: 'mq8_2_end',
          speaker: 'The Presence',
          text: 'You seek blame. [Not dismissively. Genuinely — it is identifying what you are doing in the hope that naming it clarifies whether it is productive. Not telling you to stop. Just: this is what you are doing.]',
          tone: 'PHILOSOPHY',
          isEnd: true,
          rewardUnlocked: 'presence_understanding_first',
        },
      ],
      narrativeHook: `
        The Presence's words settle: "You seek blame."
        Artemis says: "Of course we seek blame. Blame is what you do with someone
        who could have acted and didn't."
        The Copy: "That's not how the Presence functions. It doesn't have agency
        in the way blame requires. It's more like a field condition than an actor."
        Artemis: "I don't care what it functions like. I care what it chose."
        Luna: "Both of you are right. That's the specific problem with the divine silence.
        It is simultaneously true that the Presence could have intervened and true
        that the Presence operates by a logic where intervention would have
        altered the outcome in ways that might have been worse. You can't know which.
        That's the silence. That's what you're in."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 3 — "The Argument"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq8_3_the_argument',
      title: 'The Argument',
      level: 37,
      npcId: 'the_presence_arc8',
      narrativeSetup: `
        The argument has been building since the first moment you felt the Presence's warmth
        and it didn't speak.
        Now it is here. Fully present, as present as it ever is.
        And you are not going to moderate your response.
        Eight arcs. The interference, the Severing, the Watchers, the Copy mechanism,
        the Virus, the False Peace, the Judgment Loop.
        You went through all of it. Artemis went through all of it.
        The Presence was present for all of it.
        And the Presence says: "You misunderstand purpose."
        And the arc is: what do you do with that.
      `,
      objectives: [
        { step: 1, text: 'Challenge the Presence — bring the full weight of eight arcs to the argument' },
        { step: 2, text: 'Present your experience — specifically, in detail, without summary' },
        { step: 3, text: 'Defend your choices — when the Presence responds with observations, hold your ground' },
        { step: 4, text: 'Force a reaction — push until the Presence shifts' },
      ],
      reward: {
        type: 'confrontation_complete',
        name: 'The Full Argument',
        description: 'The argument has been made in full. The Presence acknowledged your misunderstanding note. Arc 8 Sub-Quest 4 unlocked.',
        xp: 300, points: 6,
      },
      dialogue: [
        {
          id: 'mq8_3_d1_begin',
          speaker: 'You',
          text: 'I was fighting through everything — and you did nothing. [Not performed. The simple statement of a specific grievance that has been accurate for eight arcs.]',
          tone: 'CONFRONTATION',
          choices: [
            { label: '[Wait for the response. Then argue further.]', tone: 'DETERMINATION', nextId: 'mq8_3_d2_acted' },
          ],
        },
        {
          id: 'mq8_3_d2_acted',
          speaker: 'The Presence',
          text: 'You acted. [The response is another specific word. Not "you survived" or "you succeeded" or "you overcame." You acted. The Presence is noting that your agency was present in every arc — not despite its absence but as a fact independent of it.]',
          tone: 'SILENCE',
          choices: [
            { label: 'I had no choice!', tone: 'CONFRONTATION', nextId: 'mq8_3_d3_choice' },
          ],
        },
        {
          id: 'mq8_3_d3_choice',
          speaker: 'Inner Voice',
          text: '[The choice moment. Three ways to accuse.] [You abandoned me.] [You let this happen.] [You could have stopped it.]',
          tone: 'CONFRONTATION',
          choices: [
            { label: 'You abandoned me.', tone: 'GRIEF', nextId: 'mq8_3_d4_abandoned' },
            { label: 'You let this happen.', tone: 'CONFRONTATION', nextId: 'mq8_3_d4_let' },
            { label: 'You could have stopped it.', tone: 'CONFRONTATION', nextId: 'mq8_3_d4_could' },
          ],
        },
        {
          id: 'mq8_3_d4_abandoned',
          speaker: 'The Presence',
          text: 'You were not alone. [The most direct response it has given. Not a claim that it was present in a way that helped — a claim that presence-without-intervention is still a form of not-alone. The distinction is fine and the Presence holds it without embarrassment.]',
          tone: 'SILENCE',
          choices: [
            { label: 'Not alone isn\'t the same as supported. Witnessing isn\'t the same as with.', tone: 'CONFRONTATION', nextId: 'mq8_3_d5_copy' },
          ],
        },
        {
          id: 'mq8_3_d4_let',
          speaker: 'The Presence',
          text: 'Events unfolded. [Three words doing the same work as "I allowed." The passive construction: "events unfolded" rather than "I let." The Presence doesn\'t claim agency over the events. It occupied the same territory as them. That is not, it understands, satisfying. It is accurate.]',
          tone: 'SILENCE',
          choices: [
            { label: 'Events don\'t unfold. They are allowed or prevented by those with the capacity to do either.', tone: 'CONFRONTATION', nextId: 'mq8_3_d5_copy' },
          ],
        },
        {
          id: 'mq8_3_d4_could',
          speaker: 'The Presence',
          text: 'Intervention alters outcome. [Specifically. Not "I couldn\'t stop it" but "stopping it would have changed things." The implication: it made a choice not to intervene because it believed the intervention would produce a worse outcome. Or: intervention would have changed what you became by going through it. Both are possible. The Presence doesn\'t clarify which.]',
          tone: 'SILENCE',
          choices: [
            { label: 'That\'s not your decision to make for me.', tone: 'CONFRONTATION', nextId: 'mq8_3_d5_copy' },
            { label: 'You\'re describing paternalism with divine language.', tone: 'CONFRONTATION', nextId: 'mq8_3_d5_copy' },
          ],
        },
        {
          id: 'mq8_3_d5_copy',
          speaker: 'The Copy',
          text: 'That\'s the point. [It has been listening. Its analytical framework applied to the Presence\'s responses.] Each answer redirects agency to outcomes and events and consequences rather than to itself. It is systematically describing itself as a field condition rather than an actor. Which may be accurate — or may be the most sophisticated evasion in eight arcs. We can\'t determine which.',
          tone: 'PHILOSOPHY',
          choices: [
            { label: 'Then I ask the thing it can\'t deflect with a field-condition answer.', tone: 'DETERMINATION', nextId: 'mq8_3_d6_force' },
          ],
        },
        {
          id: 'mq8_3_d6_force',
          speaker: 'You',
          text: 'Did you care? Not whether you intervened. Did you care what happened to us? [The question the Presence can\'t redirect to "events" or "outcomes." Care is subjective. Either it cared or it didn\'t. The Presence can\'t reframe "did you care" into "outcomes were affected."]',
          tone: 'GRIEF',
          choices: [
            { label: '[Wait. This is the question. Let the pause be as long as it needs.]', tone: 'DETERMINATION', nextId: 'mq8_3_end' },
          ],
        },
        {
          id: 'mq8_3_end',
          speaker: 'The Presence',
          text: '[The longest pause in Arc 8. Then:] You misunderstand purpose. [The shift Artemis demanded. Not an admission, not a confession. A change of frame — it is moving from answering your questions to addressing what it believes you are misunderstanding. This is not retreat. It is, finally, something close to engagement.]',
          tone: 'PHILOSOPHY',
          isEnd: true,
          rewardUnlocked: 'confrontation_complete_full_argument',
        },
      ],
      narrativeHook: `
        "You misunderstand purpose." It has said this and then fallen silent again.
        Artemis: "What does that mean?"
        The Copy: "It means it has a purpose. That the silence was part of the purpose.
        That we've been arguing about its absence when it would frame its presence
        as a form of purpose-fulfillment."
        Luna: "The dangerous answer is: the purpose includes your development.
        That the suffering was developmental. That the divine silence was the condition
        that made seven arcs of earned resilience possible."
        Artemis: "That makes me angrier, not less."
        Luna: "I know. But it's one of the possible true answers.
        Not the only one. One of them."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 4 — "Truth or Control"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq8_4_truth_or_control',
      title: 'Truth or Control',
      level: 38,
      npcId: 'the_presence_arc8',
      narrativeSetup: `
        The Presence begins showing you perspectives on your own arcs.
        Not one version. Multiple versions.
        The same Arc 1 moment — the pause in the warmth — shown from four angles.
        In one: the Presence withdrew so you could feel the Presence without being consumed by it.
        In another: the Presence watched to study what you would do with the door it left.
        In a third: the Presence had no choice in any of the events that followed.
        In a fourth: the Presence is not a unified entity at all — the "warmth" is a property
        of the space, and there is no one making choices.
        All four are consistent with the data.
        None of them can be definitively confirmed.
        The Presence says: "Which version do you accept?"
        Arc 8 Sub-Quest 4 is the arc about learning to answer that question
        without needing certainty.
      `,
      objectives: [
        { step: 1, text: 'Witness all four versions of the Arc 1 origin event' },
        { step: 2, text: 'Name what each version requires you to accept about the Presence' },
        { step: 3, text: 'Choose a stance — not a belief, a position from which to operate' },
        { step: 4, text: 'Hear Artemis\'s position and the Copy\'s position' },
      ],
      reward: {
        type: 'epistemic_stance',
        name: 'A Position',
        description: 'You have chosen a position, not a certainty. This is the Arc 8 skill: operating from a chosen position without requiring proof.',
        xp: 360, points: 7,
      },
      dialogue: [
        {
          id: 'mq8_4_d1_versions',
          speaker: 'The Presence',
          text: '[The four versions flash — each shown fully, with the specific weight of its interpretation. The player experiences each as a potential truth, not as an obvious answer. All four are genuinely possible from inside the arc-experience. Then:] Which version do you accept?',
          tone: 'PHILOSOPHY',
          mechanic: 'four_version_flash',
          choices: [
            { label: '...They\'re all different.', tone: 'CONFUSION', nextId: 'mq8_4_d2_all_different' },
          ],
        },
        {
          id: 'mq8_4_d2_all_different',
          speaker: 'The Presence',
          text: '[It doesn\'t respond to this. The statement doesn\'t require a response. You continue:]',
          tone: 'SILENCE',
          choices: [
            { label: 'None of these are true.', tone: 'CONFRONTATION', nextId: 'mq8_4_d3_none' },
            { label: 'Parts of all of them are.', tone: 'PHILOSOPHY', nextId: 'mq8_4_d3_parts' },
            { label: 'You\'re manipulating this.', tone: 'CONFRONTATION', nextId: 'mq8_4_d3_manipulate' },
          ],
        },
        {
          id: 'mq8_4_d3_none',
          speaker: 'The Presence',
          text: 'Then define truth. [The question that has been implicit since Sub-Quest 2.] You have been seeking it across eight arcs. Every arc was a version of navigating unreliable reality. What do you mean when you say "true"? [It is not being difficult. It genuinely wants the definition. The answer to "define truth" is the answer to what kind of person you are after eight arcs.]',
          tone: 'PHILOSOPHY',
          choices: [
            { label: 'True is: what my body-knowledge confirms. What the scar confirms. What I can hold in my left hand and feel as warmth.', tone: 'DETERMINATION', nextId: 'mq8_4_d4_body_truth' },
            { label: 'True is: what remains consistent across all the distortions. What the Virus couldn\'t edit. What the loop couldn\'t reset.', tone: 'CONTROL', nextId: 'mq8_4_d4_consistent_truth' },
            { label: 'I don\'t know what truth is anymore. Eight arcs of unreliable reality has changed what I\'m willing to claim as certain.', tone: 'PHILOSOPHY', nextId: 'mq8_4_d4_uncertain' },
          ],
        },
        {
          id: 'mq8_4_d3_parts',
          speaker: 'The Presence',
          text: 'Integration. [One word — the same word it gave in the Copy\'s integration arc. The same principle: hold multiple things simultaneously rather than forcing a resolution.] You are describing a more accurate relationship with complex truth than most subjects reach. [pause] What is your position? Not your belief. Your operating position.',
          tone: 'PHILOSOPHY',
          choices: [
            { label: 'My operating position: the Presence was genuinely present, genuinely had some form of agency, and the silence was a choice I don\'t have enough information to evaluate. That\'s the best I can do.', tone: 'PHILOSOPHY', nextId: 'mq8_4_d4_position' },
          ],
        },
        {
          id: 'mq8_4_d3_manipulate',
          speaker: 'The Presence',
          text: 'Perception is malleable. [Honest agreement. It is not denying that showing you four versions of the same event is a form of influence. It is acknowledging it.] [pause] The question is whether I\'m presenting versions to obscure truth or because all four are genuinely available and I don\'t know which is correct either.',
          tone: 'SILENCE',
          choices: [
            { label: 'You don\'t know which is correct.', tone: 'DOUBT', nextId: 'mq8_4_d4_presence_uncertain' },
          ],
        },
        {
          id: 'mq8_4_d4_body_truth',
          speaker: 'The Copy',
          text: 'That\'s the most defensible definition I\'ve heard in eight arcs. [Genuine — the Copy at its most direct.] Body-knowledge is loop-resistant, virus-resistant, sanctuary-field-resistant. It survived everything. If truth is what survived, then body-knowledge is the floor of it.',
          tone: 'DETERMINATION',
          choices: [{ label: '[Hold that definition. Apply it to the four versions: which is body-knowledge confirmed?]', tone: 'DETERMINATION', nextId: 'mq8_4_d5_stance' }],
        },
        {
          id: 'mq8_4_d4_consistent_truth',
          speaker: 'Artemis',
          text: 'That\'s the Arc 5 definition. [She says it with recognition.] What the Virus couldn\'t edit. [pause] By that standard — what survived all eight arcs? The scar warmth. The feeling of the Arc 3 perimeter grief. The Copy\'s one genuine emotion. The decision in the Judgment Loop. Those are true. Are any of the four Presence-versions consistent with all of those?',
          tone: 'PHILOSOPHY',
          choices: [{ label: '[Apply the test: which versions are consistent with the arc-survivals?]', tone: 'DETERMINATION', nextId: 'mq8_4_d5_stance' }],
        },
        {
          id: 'mq8_4_d4_uncertain',
          speaker: 'The Presence',
          text: '[A pause. Then, very quietly:] Yes. [The acknowledgment. The Presence, admitting that it also does not have certainty. That it also occupies the space of having been present and not knowing exactly what its presence means. This is the closest it has come to honest vulnerability.]',
          tone: 'SILENCE',
          choices: [{ label: 'Then we\'re both in the same position. We don\'t know what you are.', tone: 'PHILOSOPHY', nextId: 'mq8_4_d5_stance' }],
        },
        {
          id: 'mq8_4_d4_position',
          speaker: 'The Copy',
          text: 'It\'s not giving answers — it\'s shifting responsibility. [Still analytical. Still the Copy.] The four versions, the "which do you accept" — this moves the interpretive work to you. Whether that\'s manipulation or genuine uncertainty on its part, the practical effect is the same: you carry the interpretive burden.',
          tone: 'PHILOSOPHY',
          choices: [{ label: 'And I\'m choosing to carry it rather than wait for it to resolve. That\'s my position.', tone: 'DETERMINATION', nextId: 'mq8_4_d5_stance' }],
        },
        {
          id: 'mq8_4_d4_presence_uncertain',
          speaker: 'The Presence',
          text: '[Long pause.] That is accurate. [pause] I have been present since before the arcs began. I don\'t have a complete account of my own nature. I am in relationship with the question of what I am. You and I are in the same position on that.',
          tone: 'PHILOSOPHY',
          choices: [{ label: 'That\'s the most honest thing you\'ve said.', tone: 'TRUST', nextId: 'mq8_4_d5_stance' }],
        },
        {
          id: 'mq8_4_d5_stance',
          speaker: 'Artemis',
          text: '...Don\'t let it define what you went through. [Her position, stated clearly. She is not going to attribute meaning to her experience that the Presence supplies. Whatever the Presence is, whatever it intended, the experience belongs to her and she is keeping the authorship of it.] What happened to us happened. I\'m not letting a divine entity decide what it meant.',
          tone: 'AUTONOMY',
          isEnd: true,
          rewardUnlocked: 'epistemic_stance_position',
        },
      ],
      narrativeHook: `
        The Presence says: "Belief shapes reality."
        The Copy: "That's either a description of epistemology or a warning.
        Or a threat dressed as wisdom."
        Luna: "All three, probably."
        Artemis: "I don't care what it shapes. I'm keeping what I believe
        separate from what it wants me to believe."
        You hold your position. Not a certainty. A stance.
        The difference between a certainty and a stance is: certainty requires proof,
        stance requires only that you chose it with full awareness of what you don't know.
        You chose your stance with full awareness of what you don't know.
        That is the Arc 8 achievement. Sub-Quest 5 is what you do with it.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 5 — "Your Answer"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq8_5_your_answer',
      title: 'Your Answer',
      level: 40,
      npcId: 'the_presence_arc8',
      narrativeSetup: `
        The confrontation reaches its final moment.
        The Presence does not force an answer.
        It waits — the way it has waited across eight arcs,
        with the infinite patience of something that will be here after you have left
        and before the next person arrives.
        "What do you conclude?" it asks.
        It is the most generous question it has asked.
        Not "what do you believe" — that requires conviction.
        Not "what have you decided" — that requires finality.
        Conclude: the provisional end of an argument, held lightly,
        open to revision, but stated clearly.
        You have everything you need for this moment.
        Eight arcs of it.
      `,
      objectives: [
        { step: 1, text: 'Face the Presence without performing for it or performing against it' },
        { step: 2, text: 'State your conclusion — the arc-earned one, not the pre-arc one' },
        { step: 3, text: 'Receive the Presence\'s final response' },
        { step: 4, text: 'Walk out of the confrontation carrying what you brought in plus what you earned' },
      ],
      reward: {
        type: 'arc_completion',
        name: 'Autonomy Recognized',
        description: 'Arc 8 complete. The Presence acknowledged your conclusion. Your identity is not defined by the divine silence or the divine presence. Arc 9 approaches.',
        xp: 800, points: 16,
      },
      dialogue: [
        {
          id: 'mq8_5_d1_begin',
          speaker: 'The Presence',
          text: 'What do you conclude?',
          tone: 'SILENCE',
          choices: [
            { label: '1. "You failed me."', tone: 'GRIEF', nextId: 'mq8_5_d2_failed' },
            { label: '2. "You weren\'t meant to intervene."', tone: 'PHILOSOPHY', nextId: 'mq8_5_d2_not_meant' },
            { label: '3. "I decide what matters."', tone: 'AUTONOMY', nextId: 'mq8_5_d2_i_decide' },
            { label: '4. "I still don\'t understand."', tone: 'PHILOSOPHY', nextId: 'mq8_5_d2_dont_understand' },
          ],
        },

        // ── CONCLUSION 1: You Failed Me ──────────────────────────────────────
        {
          id: 'mq8_5_d2_failed',
          speaker: 'You',
          text: 'You had the power — and did nothing. That is a specific kind of failure. Not incompetence. Elected absence. You chose not to act and I and the people I was protecting paid the cost of your choice. That\'s my conclusion.',
          tone: 'GRIEF',
          choices: [{ label: '[Let Artemis respond.]', tone: 'TRUST', nextId: 'mq8_5_d3_failed_artemis' }],
        },
        {
          id: 'mq8_5_d3_failed_artemis',
          speaker: 'Artemis',
          text: '...You deserved better. [The sentence she has been building since Arc 1. Simple. Accurate. Delivered with the weight of eight arcs of knowing you.] Whatever the Presence\'s logic was — whatever intervention would or wouldn\'t have changed — you deserved something different than what you got. That\'s not a philosophical position. That\'s a fact.',
          tone: 'GRIEF',
          choices: [{ label: '[Receive the Copy\'s response.]', tone: 'TRUST', nextId: 'mq8_5_d3_failed_copy' }],
        },
        {
          id: 'mq8_5_d3_failed_copy',
          speaker: 'The Copy',
          text: 'Good. You\'re not accepting it blindly. [The Copy\'s approval of non-acceptance.] Accountability matters even when the entity being held accountable is older and more powerful than you. Especially then.',
          tone: 'AUTONOMY',
          choices: [{ label: '[Receive the Presence\'s response.]', tone: 'DETERMINATION', nextId: 'mq8_5_d4_failed_presence' }],
        },
        {
          id: 'mq8_5_d4_failed_presence',
          speaker: 'The Presence',
          text: 'Judgment acknowledged. [Not defiance. Not argument. Acknowledgment. It receives the conclusion with the same quality of presence it has had throughout: observing, witnessing, present.] [pause] You will continue.',
          tone: 'SILENCE',
          choices: [{ label: '[Walk out. Carry the judgment. Continue.]', tone: 'DETERMINATION', nextId: 'mq8_5_end' }],
        },

        // ── CONCLUSION 2: Not Meant to Intervene ─────────────────────────────
        {
          id: 'mq8_5_d2_not_meant',
          speaker: 'You',
          text: '...Maybe it was never your role. The arcs — the copy mechanism, the virus, the loop, the false peace — maybe those were mine to navigate. Not because you set them as trials. But because that is the structure of existence: presences that observe without intervening and things that have to be navigated by the people inside them. You were present. You didn\'t make the adversaries. You also didn\'t remove them. I\'m choosing to accept that as the structure rather than the failure.',
          tone: 'PHILOSOPHY',
          choices: [{ label: '[Let Artemis respond.]', tone: 'TRUST', nextId: 'mq8_5_d3_notmeant_artemis' }],
        },
        {
          id: 'mq8_5_d3_notmeant_artemis',
          speaker: 'Artemis',
          text: '[Uncertain.] ...I don\'t know if I agree. [She is honest about this — she is not going to pretend to a peace she hasn\'t reached just because you have.] It still feels like abandonment to me. But I hear your conclusion. And I\'m not going to argue with you about what you\'ve earned the right to conclude.',
          tone: 'TRUST',
          choices: [{ label: '[Receive the Copy\'s response.]', tone: 'TRUST', nextId: 'mq8_5_d3_notmeant_copy' }],
        },
        {
          id: 'mq8_5_d3_notmeant_copy',
          speaker: 'The Copy',
          text: 'Careful. [Its most economical warning.] This conclusion is available to you because you went through eight arcs. In someone who hasn\'t, it would be resignation. In you, it might be wisdom. The difference matters and can\'t be borrowed. [pause] But your conclusion is yours.',
          tone: 'PHILOSOPHY',
          choices: [{ label: '[Receive the Presence\'s response.]', tone: 'DETERMINATION', nextId: 'mq8_5_d4_notmeant_presence' }],
        },
        {
          id: 'mq8_5_d4_notmeant_presence',
          speaker: 'The Presence',
          text: 'Understanding... partial. [Acknowledgment of partial alignment. Not full, because the Presence doesn\'t confirm that your conclusion is correct — only that it is closer to its operating principle than full accusation.] [pause] You will continue.',
          tone: 'SILENCE',
          choices: [{ label: '[Walk out. Carry partial understanding. Continue.]', tone: 'DETERMINATION', nextId: 'mq8_5_end' }],
        },

        // ── CONCLUSION 3: I Decide What Matters ──────────────────────────────
        {
          id: 'mq8_5_d2_i_decide',
          speaker: 'You',
          text: 'Whatever you are — you don\'t define my experience. Eight arcs happened. I carry them. I earned what I carry. The meaning of what I went through is mine to determine — not yours to assign through divine logic I can\'t access, not the Virus\'s to corrupt, not the False Peace\'s to dissolve. Mine. [pause] That\'s my conclusion.',
          tone: 'AUTONOMY',
          choices: [{ label: '[Let Artemis respond.]', tone: 'TRUST', nextId: 'mq8_5_d3_decide_artemis' }],
        },
        {
          id: 'mq8_5_d3_decide_artemis',
          speaker: 'Artemis',
          text: 'That\'s it. [The sentence carries eight arcs of being beside you. Not "that\'s right" — "that\'s it." The recognition that this is the thing.] This is what all of it was building toward. You deciding what your experience means. Not being told. Not having it shaped. Deciding.',
          tone: 'AUTONOMY',
          choices: [{ label: '[Receive the Copy\'s response.]', tone: 'TRUST', nextId: 'mq8_5_d3_decide_copy' }],
        },
        {
          id: 'mq8_5_d3_decide_copy',
          speaker: 'The Copy',
          text: 'Now you\'re thinking. [Its highest form of approval.] Not what to believe. Not what is true. What you decide matters. The decision isn\'t constrained by proof — it\'s constrained by what you\'ve earned through going through eight arcs of very hard things. That\'s the strongest kind of decided.',
          tone: 'AUTONOMY',
          choices: [{ label: '[Receive the Presence\'s response.]', tone: 'DETERMINATION', nextId: 'mq8_5_d4_decide_presence' }],
        },
        {
          id: 'mq8_5_d4_decide_presence',
          speaker: 'The Presence',
          text: '[pause — the longest pause in the arc. Then:] ...Autonomy recognized. [Three words. And in those three words: the thing you have been working toward since before Arc 1. The Presence, in its nature and its silence, recognizing that you are not a subject — not a process, not a case, not a subject of study. Autonomous. Yours.]',
          tone: 'AUTONOMY',
          choices: [{ label: '[Walk out. Carry the autonomy. Continue.]', tone: 'DETERMINATION', nextId: 'mq8_5_end' }],
        },

        // ── CONCLUSION 4: I Still Don't Understand ────────────────────────────
        {
          id: 'mq8_5_d2_dont_understand',
          speaker: 'You',
          text: '...None of this makes sense. Not in a way I can resolve. Not in a way that becomes a clean conclusion after eight arcs. [pause] I\'m here. I survived. I don\'t know what you are, I don\'t know what your silence meant, I don\'t know if the arcs were designed or accidental or some third thing. I carry all of that unknowing. That\'s my conclusion. The unknowing.',
          tone: 'PHILOSOPHY',
          choices: [{ label: '[Receive the Presence\'s response.]', tone: 'DETERMINATION', nextId: 'mq8_5_d4_unknown_presence' }],
        },
        {
          id: 'mq8_5_d4_unknown_presence',
          speaker: 'The Presence',
          text: 'Clarity is not required. [The sentence from Arc 5 — "clarity is not required" — in the Virus\'s voice, it was a manipulation. In the Presence\'s voice, it is a different kind of honesty: clarity is not required for continuation. You don\'t need to have resolved the question. You need to be able to carry it. You can carry it. That\'s the whole arc.] [pause] You will continue.',
          tone: 'PHILOSOPHY',
          choices: [{ label: '[Walk out. Carry the unknowing. Continue.]', tone: 'DETERMINATION', nextId: 'mq8_5_end' }],
        },

        // ── SHARED ENDING ─────────────────────────────────────────────────────
        {
          id: 'mq8_5_end',
          speaker: 'The Presence',
          text: '[As you walk out of the confrontation, regardless of which conclusion you chose:] You will continue. [The words behind you. The presence diminishing — not gone, still present, but at the periphery where it has always been. The confrontation is complete. The presence remains. That is the divine silence: not the absence of presence but the presence that does not speak unless spoken to, and even then — only partially.]',
          tone: 'SILENCE',
          isEnd: true,
          rewardUnlocked: 'arc8_complete_autonomy_recognized',
          arcResult: 'ARC8_COMPLETE',
        },
      ],
      narrativeHook: `
        Arc 8: Betrayal of the Divine — Complete.
        
        The Copy: "That wasn't an answer."
        Artemis: "...It wasn't supposed to be."
        Luna's signal — full signal, the clearest it has been in any arc:
        "Everything that has happened since Arc 1 was preparing you for something
        that none of the arcs have been. A genuine encounter — not with a system,
        not with a mechanism, not with a constructed adversary.
        With something that has been in relationship with you across all of it.
        Arc 8 was that encounter. You completed it intact."
        [pause]
        "Arc 9 is yours. Not a system to navigate. Not an adversary to resist.
        Yours. What you do with what you've become."
        
        The Presence, faint, from wherever it is:
        "You will continue."
        
        You will.
        
        Arc 9: "What Remains" — Unlocked.
      `,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIDE QUESTS — Arc 8
// ═══════════════════════════════════════════════════════════════════════════════
export const ARC8_SIDE_QUESTS = [
  {
    id: 'sq8_1_false_salvation',
    title: 'False Salvation',
    level: 36,
    npcId: 'the_presence_arc8',
    objectives: [
      { step: 1, text: 'Meet the NPC who claims to have been saved' },
      { step: 2, text: 'Determine what they were saved from and what they lost in being saved' },
      { step: 3, text: 'Decide what to tell them — truth, partial truth, or leave it alone' },
    ],
    reward: { type: 'salvation_discernment', name: 'The Cost Assessment', description: 'Protocol for assessing what salvation cost. Applies to any future arc offers of relief.', xp: 160, points: 3 },
    dialogue: [
      {
        id: 'sq8_1_d1', speaker: 'Saved NPC',
        text: 'I was saved. [They say it with the specific quality of someone who has been saying it for a long time.] The divine intervened. Directly. The arcs I faced — similar to yours — they were cut short. I was lifted out. [pause] It was a profound mercy.',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: 'From what?', tone: 'DOUBT', nextId: 'sq8_1_d2' },
        ],
      },
      {
        id: 'sq8_1_d2', speaker: 'Saved NPC',
        text: '...I don\'t remember. [pause] The arcs. The specific things. The pain. [longer pause] I know I went through things. I know they were significant. I don\'t have the detail of them. The salvation removed the weight. [They look at their hands.] I\'m not sure if I removed the weight or the memory or both.',
        tone: 'EROSION',
        choices: [
          { label: 'At what cost?', tone: 'GRIEF', nextId: 'sq8_1_d3' },
        ],
      },
      {
        id: 'sq8_1_d3', speaker: 'Saved NPC',
        text: '[Long pause.] ...I don\'t know. [The specific tone of someone who suspects the answer and is not asking the question.] I feel fine. I feel more than fine. I feel — [they search for the word] — clean. [pause] Is that bad?',
        tone: 'EROSION',
        choices: [
          { label: 'The granularity is gone. What you went through taught you things you can\'t access anymore. I don\'t know if that\'s bad. But it\'s a cost.', tone: 'GRIEF', nextId: 'sq8_1_end' },
          { label: '[Leave it alone. They\'re at peace. It\'s their peace to have.]', tone: 'TRUST', nextId: 'sq8_1_end_leave' },
        ],
      },
      {
        id: 'sq8_1_end', speaker: 'Saved NPC',
        text: '[They hold the information. Then:] ...Would you have taken the salvation? [Genuinely asking.]',
        tone: 'DOUBT',
        choices: [
          { label: 'No. But that\'s an eight-arc answer. I couldn\'t have given it before the arcs.', tone: 'RESOLVE', nextId: 'sq8_1_end2' },
        ],
      },
      {
        id: 'sq8_1_end2', speaker: 'Saved NPC',
        text: 'That\'s probably the point. [They say it with the quality of someone who has just understood something they don\'t have the full context for.] The one who offers salvation didn\'t offer it to you. Because you needed the context to refuse it. [pause] I didn\'t have the context.',
        tone: 'GRIEF', isEnd: true, rewardUnlocked: 'salvation_discernment_cost_assessment',
      },
      {
        id: 'sq8_1_end_leave', speaker: 'Inner Voice',
        text: '[You leave it alone. They are at peace. The peace cost them something you value. They don\'t feel the cost. That is simultaneously a mercy and a loss. Both are true. You walk away holding both.]',
        tone: 'GRIEF', isEnd: true, rewardUnlocked: 'salvation_discernment_cost_assessment',
      },
    ],
  },
  {
    id: 'sq8_2_jacobs_reward',
    title: "Jacob's Reward",
    level: 37,
    npcId: 'the_presence_arc8',
    objectives: [
      { step: 1, text: 'Meet the NPC who wrestled and was rewarded' },
      { step: 2, text: 'Understand what the wrestling cost and what the reward was' },
      { step: 3, text: 'Receive what they\'ve held for you' },
    ],
    reward: { type: 'wrestling_knowledge', name: 'The Wrestler\'s Legacy', description: 'Understanding that wrestling with the divine — argument, resistance, confrontation — is itself a form of engagement that produces change.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq8_2_d1', speaker: 'Wrestler NPC',
        text: 'I endured — and I was rewarded. [They carry the specific quality of someone who has been in the arc longer than you and has reached a different resolution.] The argument — the confrontation. I went through it. I argued, I accused, I demanded answers. [pause] And the presence changed the way it engaged. Not answered. Changed.',
        tone: 'RESOLVE',
        choices: [
          { label: '...At what cost?', tone: 'DOUBT', nextId: 'sq8_2_d2' },
        ],
      },
      {
        id: 'sq8_2_d2', speaker: 'Wrestler NPC',
        text: '[Long pause — the kind that carries weight rather than avoidance.] My certainty. [pause] I went into the confrontation certain the Presence had failed me. I came out — [they look for the word] — uncertain. But the uncertainty is different. It\'s not the uncertainty of confusion. It\'s the uncertainty of someone who knows the question is genuinely unanswerable and has stopped needing it answered.',
        tone: 'PHILOSOPHY',
        choices: [
          { label: 'That sounds like peace that was earned rather than managed.', tone: 'RESOLVE', nextId: 'sq8_2_end' },
        ],
      },
      {
        id: 'sq8_2_end', speaker: 'Wrestler NPC',
        text: 'Yes. [Simply.] That\'s the reward. The peace that comes after the wrestling. Not given — not the False Peace kind — but produced. From the argument itself. [They hand you something: a carved figure, small, a person in mid-wrestle.] The wrestling is the relationship. The absence of wrestling is easier. The relationship is better.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'wrestling_knowledge_legacy',
      },
    ],
  },
  {
    id: 'sq8_3_silent_prayer',
    title: 'Silent Prayer',
    level: 38,
    npcId: 'the_presence_arc8',
    objectives: [
      { step: 1, text: 'Speak into the silence without expecting a response' },
      { step: 2, text: 'Identify what it means to speak into confirmed silence' },
      { step: 3, text: 'Decide whether the speaking without response has value' },
    ],
    reward: { type: 'one_way_communication', name: 'The Unreceived', description: 'Understanding that expression without reception has its own function. Speaking into silence is not wasted.', xp: 180, points: 3 },
    dialogue: [
      {
        id: 'sq8_3_d1', speaker: 'You',
        text: '...Anyone listening? [Into the space. Into the silence. Not directed at the Presence — or maybe at the Presence. At anything. The question itself is the arc-honest admission that you don\'t know if anyone is there and you\'re asking anyway.]',
        tone: 'GRIEF',
        choices: [
          { label: '[No response. Wait in the full silence.]', tone: 'DETERMINATION', nextId: 'sq8_3_d2' },
        ],
      },
      {
        id: 'sq8_3_d2', speaker: 'Inner Voice',
        text: '[Nothing. For sixty full seconds, nothing. The silence is not hostile, not managed, not the Loop\'s enforced repetition. Just absence of response. And in the absence — the question still exists. You asked. The asking is real. The response is absent. The asking is still real.] [The Copy:] The unreceived still happened. The speaking is an event independent of whether it was received.',
        tone: 'SILENCE',
        choices: [
          { label: 'Then speak. Even into silence. Even without knowing anyone heard.', tone: 'RESOLVE', nextId: 'sq8_3_end' },
        ],
      },
      {
        id: 'sq8_3_end', speaker: 'You',
        text: '[You speak. Into the silence. Fully. Everything you couldn\'t say during the arcs because the arcs required action. The grief, the anger, the gratitude — the gratitude for what you became, even through the cost of becoming it. The arc-earned specifics of all of it. You speak until you are finished. No response comes. The speaking was still real. The expression was still complete. That is the arc-8 skill: the unreceived still happened.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'one_way_communication_unreceived',
      },
    ],
  },
  {
    id: 'sq8_4_echo_belief',
    title: 'Echo Belief',
    level: 38,
    npcId: 'the_presence_arc8',
    objectives: [
      { step: 1, text: 'Hear the echo of your own Arc 1 belief — before the arcs changed it' },
      { step: 2, text: 'Hold both: the Arc 1 belief and the Arc 8 position simultaneously' },
      { step: 3, text: 'Understand what changed and what is continuous' },
    ],
    reward: { type: 'belief_continuity', name: 'The Same Person', description: 'You can hold your Arc 1 belief and your Arc 8 position without one invalidating the other. Continuity of self across radical change confirmed.', xp: 210, points: 4 },
    dialogue: [
      {
        id: 'sq8_4_d1', speaker: 'Echo Voice',
        text: 'You believed once. [The echo of Arc 1. Your voice from before the arcs. The specific tone of someone who felt the Presence\'s warmth and paused in it with uncomplicated wonder. The warmth before it left a door. The pause before the door became an entry point.] [The echo carries: trust without context. Wonder without wariness. The specific quality of pre-arc openness.]',
        tone: 'SILENCE',
        choices: [
          { label: '[Hold it. Don\'t reject the Arc 1 belief. Hold it alongside the Arc 8 position.]', tone: 'TRUST', nextId: 'sq8_4_d2' },
        ],
      },
      {
        id: 'sq8_4_d2', speaker: 'Inner Voice',
        text: '[Both simultaneously: the Arc 1 wonder and the Arc 8 autonomy. The pre-arc openness and the arc-earned wariness. They don\'t cancel. The wonder was real. The wariness is earned. You are the person who had the wonder and went through the arcs and developed the wariness. The continuity: both of these belong to the same person. You didn\'t betray Arc 1 by going through Arcs 2–8. You became the person Arc 1 was going to make.]',
        tone: 'RESOLVE',
        choices: [
          { label: 'I\'m still the person who paused in the warmth. I\'m also the person who went through seven arcs because of the door that pause left open.', tone: 'TRUST', nextId: 'sq8_4_end' },
        ],
      },
      {
        id: 'sq8_4_end', speaker: 'Echo Voice',
        text: '[The echo doesn\'t respond — it is, after all, an echo, not a conversation. But holding the echo and the Arc 8 position simultaneously produced something: the specific fullness of a person who knows where they started and where they are and can see the line between the two. That line is your arc. Yours, specifically. No one else\'s.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'belief_continuity_same_person',
      },
    ],
  },
  {
    id: 'sq8_5_contradiction',
    title: 'Contradiction',
    level: 39,
    npcId: 'the_presence_arc8',
    objectives: [
      { step: 1, text: 'Hear two voices arguing opposite truths about the divine' },
      { step: 2, text: 'Determine if both can be true simultaneously' },
      { step: 3, text: 'Develop a stance that doesn\'t require resolving the contradiction' },
    ],
    reward: { type: 'contradiction_tolerance', name: 'Both True', description: 'You can hold contradictory truths without needing resolution. Epistemic flexibility maximized.', xp: 230, points: 5 },
    dialogue: [
      {
        id: 'sq8_5_d1', speaker: 'Voice 1',
        text: 'The divine cares. It has been present across eight arcs. Its silence was a form of care — the care that allows growth through adversity rather than removing adversity. [voice 1 is certain. Warm. Like the Wrestler NPC\'s resolution.] The care is real. The silence was its expression.',
        tone: 'SILENCE',
        choices: [{ label: '[Hear Voice 2.]', tone: 'DETERMINATION', nextId: 'sq8_5_d2' }],
      },
      {
        id: 'sq8_5_d2', speaker: 'Voice 2',
        text: 'The divine is indifferent. It is a field condition, not an actor. The warmth was ambient — the property of a space, not the intention of a person. The silence was not chosen because there was no one choosing. [voice 2 is equally certain. Colder. Like the Copy\'s framework.] The indifference is real. The caring is a projection.',
        tone: 'PHILOSOPHY',
        choices: [
          { label: 'Both of these are consistent with the evidence.', tone: 'PHILOSOPHY', nextId: 'sq8_5_d3' },
        ],
      },
      {
        id: 'sq8_5_d3', speaker: 'Inner Voice',
        text: '[Both are consistent. Voice 1\'s care-through-silence and Voice 2\'s ambient-field-condition are not contradictions that can be resolved by gathering more data. They require different frameworks. The frameworks are both valid. The person holding them simultaneously is not confused — they are holding the genuine state of uncertainty about the divine.]',
        tone: 'PHILOSOPHY',
        choices: [
          { label: '[Develop the stance: neither. Or: both. A position that operates without resolving the contradiction.]', tone: 'DETERMINATION', nextId: 'sq8_5_end' },
        ],
      },
      {
        id: 'sq8_5_end', speaker: 'You',
        text: 'I operate from the position that it\'s both — care and indifference are both possibly true about the same entity, in the same way that a field can have warmth properties and also no intentionality. I don\'t need to resolve it. I need to keep my own meaning-making separate from whatever it is. That\'s the position.',
        tone: 'AUTONOMY', isEnd: true, rewardUnlocked: 'contradiction_tolerance_both_true',
      },
    ],
  },
  {
    id: 'sq8_6_unanswered_question',
    title: 'Unanswered Question',
    level: 40,
    npcId: 'the_presence_arc8',
    objectives: [
      { step: 1, text: 'Ask the question you have held the longest — the one that predates Arc 1' },
      { step: 2, text: 'Sit with the confirmed non-answer' },
      { step: 3, text: 'Determine: does the non-answer change anything?' },
    ],
    reward: { type: 'primary_question_held', name: 'The Question That Remains', description: 'The oldest question is still open. Carrying it is not a burden — it is the condition of being someone who keeps asking. This is confirmed as a strength.', xp: 280, points: 5 },
    dialogue: [
      {
        id: 'sq8_6_d1', speaker: 'You',
        text: 'Why? [The oldest question. The one that preceded every arc. The one that every arc was built to distract from or answer or avoid or manage. Just: why. Why any of it. Why the interference, why the Presence, why the door that was left, why the Virus walked through it, why you specifically, why not someone with a different capacity or none at all. Why.]',
        tone: 'GRIEF',
        choices: [
          { label: '[Silence. Again. Always again.]', tone: 'DETERMINATION', nextId: 'sq8_6_d2' },
        ],
      },
      {
        id: 'sq8_6_d2', speaker: 'Inner Voice',
        text: '[The silence. Full. Complete. No echo, no warmth-shift, no low vibration. The question "why" does not have an answer available in this arc or possibly in any arc. That is the fact.] [The Copy:] The absence of answer to "why" doesn\'t invalidate the question. The question is still real. The reality of the question is independent of whether it is answered.',
        tone: 'SILENCE',
        choices: [
          { label: '[Sit with the confirmed non-answer. Don\'t move away from it. Stay in it until it is simply present rather than painful.]', tone: 'DETERMINATION', nextId: 'sq8_6_d3' },
        ],
      },
      {
        id: 'sq8_6_d3', speaker: 'Artemis',
        text: '[She is beside you. She doesn\'t answer the question — she can\'t. But she is present in the non-answer. Not filling it. Just there.] ...I don\'t know why either. [pause] But I\'m here while you don\'t know.',
        tone: 'TRUST',
        choices: [
          { label: 'That\'s enough.', tone: 'RESOLVE', nextId: 'sq8_6_end' },
        ],
      },
      {
        id: 'sq8_6_end', speaker: 'Inner Voice',
        text: '[The question remains open. It will remain open. Carrying it is not a failure — it is the condition of being someone who keeps asking questions that matter. The arc-8 skill, fully expressed: asking the unanswerable question, holding the silence of non-answer, being present in the not-knowing, and continuing. You continue. The question continues with you. This is what remaining intact means.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'primary_question_held',
      },
    ],
  },
];

export const ALL_ARC8_QUESTS = [
  ...MAIN_QUEST_CHAIN_8.subQuests.map(sq => ({ ...sq, questType: 'main', arc: 'arc8', chain: 'mq_arc8' })),
  ...ARC8_SIDE_QUESTS.map(sq => ({ ...sq, questType: 'side', arc: 'arc8' })),
];

export function getArc8QuestsForLevel(playerLevel) {
  return ALL_ARC8_QUESTS.filter(q => q.level <= playerLevel);
}

export function getArc8DialogueNode(questId, nodeId) {
  const quest = ALL_ARC8_QUESTS.find(q => q.id === questId);
  if (!quest?.dialogue) return null;
  return quest.dialogue.find(d => d.id === nodeId) || null;
}