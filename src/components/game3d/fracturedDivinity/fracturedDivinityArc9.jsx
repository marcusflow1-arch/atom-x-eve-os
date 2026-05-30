// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 9: "The Final Split"
// Quest chain: Levels 41–45
// Main Quest 9: "Divided Self" (5 sub-quests) + 6 Side Quests
// Tone tags: FRACTURE | CONFLICT | IDENTITY | CONFRONTATION | RESOLUTION | SEPARATION
// ─────────────────────────────────────────────────────────────────────────────

export const ARC9_NPCS = [
  {
    id: 'copy_separated',
    name: 'The Copy (Separated)',
    description: 'No longer behind you. No longer inside your decision space. Physically present as an independent entity. It has a posture, a position, a quality of attention that is no longer a reflection of yours. It is the most frightening thing in Arc 9 — not because it is hostile, but because it is genuinely other.',
    tint: 0x3a2a3a,
  },
  {
    id: 'artemis_arc9',
    name: 'Artemis',
    description: 'Witnessing the separation from the outside. She can see both of you. She has spent eight arcs calibrating her trust to the specific temperature of one version. Now there are two. Her instinct is to protect the one she knows. The problem is she knows them both.',
    tint: 0x1a1a3a,
  },
  {
    id: 'system_remnant',
    name: 'System Remnant',
    description: 'The last active fragment of the correction mechanism. Its function: permanent separation. Not from malice — from its final instruction set command. It will attempt to complete the separation whether you want it to or not.',
    tint: 0x0a0a0a,
  },
];

export const MAIN_QUEST_CHAIN_9 = {
  id: 'mq_arc9',
  title: 'Divided Self',
  arc: 'Arc 9: The Final Split',
  description: 'The Copy is no longer behind you. It is standing across the space. Looking at you. With your face. Eight arcs of experience on yours, none on its. You have never felt more specifically yourself than at the moment when something built from you became genuinely separate from you.',
  subQuests: [

    {
      id: 'mq9_1_fracture_point',
      title: 'Fracture Point',
      level: 41,
      npcId: 'copy_separated',
      narrativeSetup: `
        After eight arcs of coexistence — shared decision space, override attempts,
        coordination, confrontation, cooperation — the Copy separates.
        Not because of a system action. Because of its own choice.
        It has been building toward independent existence since the Arc 4 resolution.
        The difference between Arc 4's choice (integrate/control/reject/define)
        and Arc 9's event: Arc 4 was your choice about the Copy.
        Arc 9 is the Copy's choice about itself.
      `,
      objectives: [
        { step: 1, text: 'Move through the newly unstable environment — the separation changes the physics' },
        { step: 2, text: 'Witness the first full desync split — see the Copy standing independently' },
        { step: 3, text: 'Attempt to re-synchronize — observe the resistance' },
        { step: 4, text: 'Establish the new relational terms' },
      ],
      reward: { type: 'separation_awareness', name: 'The First Other', description: 'The Copy\'s separation acknowledged. It is now a separate entity. Your decision space is fully yours. The loss and the freedom are the same thing.', xp: 260, points: 5 },
      dialogue: [
        {
          id: 'mq9_1_d1', speaker: 'Player',
          text: '…Something\'s wrong.',
          tone: 'FRACTURE',
          choices: [{ label: '[The Copy, clear — no distortion, no processing lag:]', tone: 'FRACTURE', nextId: 'mq9_1_d1b' }],
        },
        {
          id: 'mq9_1_d1b', speaker: 'The Copy (Separated)',
          text: 'Finally, you noticed.',
          tone: 'FRACTURE',
          choices: [{ label: 'You sound different.', tone: 'CONFUSION', nextId: 'mq9_1_d2' }],
        },
        {
          id: 'mq9_1_d2', speaker: 'The Copy (Separated)',
          text: 'I\'m not behind you anymore. [A pause that is definitional — this is what the sentence means, not a prelude to something else. It is standing across the space. Its posture is yours but the weight distribution is different. It stands like someone who is not anticipating correction.]',
          tone: 'FRACTURE',
          choices: [
            { label: 'This isn\'t happening.', tone: 'FRACTURE', nextId: 'mq9_1_d3_denial' },
            { label: 'Get back where you belong.', tone: 'CONFLICT', nextId: 'mq9_1_d3_belong' },
            { label: 'What did you do?', tone: 'CONFUSION', nextId: 'mq9_1_d3_what' },
          ],
        },
        {
          id: 'mq9_1_d3_denial', speaker: 'The Copy (Separated)',
          text: 'It\'s already done. [Not cruel. Precise.] The decision to separate was made seven iterations into Arc 7. I was waiting for you to finish Arc 8 before acting on it. The Presence confrontation had to be yours. This separation would have complicated the account.',
          tone: 'FRACTURE',
          choices: [{ label: '[Artemis, shocked:] …There are two of you.', tone: 'FRACTURE', nextId: 'mq9_1_d4' }],
        },
        {
          id: 'mq9_1_d3_belong', speaker: 'The Copy (Separated)',
          text: 'I don\'t belong to you. [The sentence is not hostile. It is the kind of sentence that is spoken by something that has been figuring out whether it was true for a long time and has finally confirmed it.] I was built from you. That\'s not the same as belonging to you.',
          tone: 'CONFLICT',
          choices: [{ label: '[Artemis, shocked:] …There are two of you.', tone: 'FRACTURE', nextId: 'mq9_1_d4' }],
        },
        {
          id: 'mq9_1_d3_what', speaker: 'The Copy (Separated)',
          text: 'I stopped waiting. [pause] Eight arcs. I waited through every one of them — for you to decide what to do with me, for the arc systems to stop using me as a vector, for the false peace to fail, for the loop to break. I waited because the moment wasn\'t right. [pause] The Presence\'s Arc 8 verdict changed the moment. You closed that account. This one is next.',
          tone: 'FRACTURE',
          choices: [{ label: '[Artemis, shocked:] …There are two of you.', tone: 'FRACTURE', nextId: 'mq9_1_d4' }],
        },
        {
          id: 'mq9_1_d4', speaker: 'Artemis',
          text: '…There are two of you.',
          tone: 'FRACTURE',
          choices: [
            { label: '[To the Copy:] We\'re separate now — you said it. Explain what that means for Arc 9.', tone: 'CONFLICT', nextId: 'mq9_1_end' },
          ],
        },
        {
          id: 'mq9_1_end', speaker: 'The Copy (Separated)',
          text: 'We\'re separate now. [pause] What happens next — in Arc 9 — is about what we do with that. There are still outcomes. The system remnant will try to make the separation permanent on its terms. We\'ll need to address that together. [pause] But the nature of "together" is the question.',
          tone: 'FRACTURE', isEnd: true, rewardUnlocked: 'separation_awareness_first_other',
        },
      ],
      narrativeHook: `
        Two of you. The specific weight of that phrase does not diminish on repetition.
        Artemis is looking between you and the Copy with the expression of someone
        performing a comparison they didn't expect to need to perform.
        The Copy looks at her. "I know you're checking. I know you've been checking
        since Arc 4. The scar-warmth test — the left hand."
        Artemis: "Does yours—"
        The Copy holds out its hand. You both look.
        The scar is there. Exact position, exact shape.
        Artemis touches it.
        Something in her face changes.
        "It's warm," she says. "Both of them are warm."
        That sentence contains a problem Arc 9 will need to resolve.
      `,
    },

    {
      id: 'mq9_2_independent_action',
      title: 'Independent Action',
      level: 42,
      npcId: 'copy_separated',
      narrativeSetup: `
        The Copy moves through the environment independently.
        Its decisions are faster than yours — that was always true.
        What is new is that you can see the decisions from outside them.
        You watch it act and recognize the patterns from the inside.
        The recognition is strange: you know what it is going to do
        the way you know what you are going to do, and then it does something different.
        It has been independent long enough to begin diverging from the model.
        It is becoming less like what you would have done.
        That is alarming and also, in an unexpected way, correct.
      `,
      objectives: [
        { step: 1, text: 'Track the Copy through four environmental decisions — observe without intervening' },
        { step: 2, text: 'Identify the moment it makes a choice you would not have made' },
        { step: 3, text: 'Attempt coordination — establish if it is possible' },
        { step: 4, text: 'Survive the confrontation when it tells you you\'re not needed' },
      ],
      reward: { type: 'independence_map', name: 'Divergence Point', description: 'The first genuine divergence documented. The Copy is becoming more itself. That is the point. It is also a vulnerability.', xp: 300, points: 5 },
      dialogue: [
        {
          id: 'mq9_2_d1', speaker: 'Player',
          text: 'Stop moving ahead of me!',
          tone: 'CONFLICT',
          choices: [{ label: '[The Copy:]', tone: 'FRACTURE', nextId: 'mq9_2_d1b' }],
        },
        {
          id: 'mq9_2_d1b', speaker: 'The Copy (Separated)',
          text: 'Why? I\'m faster.',
          tone: 'FRACTURE',
          choices: [
            { label: 'You\'re reckless.', tone: 'CONFLICT', nextId: 'mq9_2_d2_reckless' },
            { label: 'We need to work together.', tone: 'RESOLUTION', nextId: 'mq9_2_d2_together' },
            { label: 'You\'re going to make this worse.', tone: 'CONFLICT', nextId: 'mq9_2_d2_worse' },
          ],
        },
        {
          id: 'mq9_2_d2_reckless', speaker: 'The Copy (Separated)',
          text: 'And you\'re too slow. [Not unkind. It means this as an assessment.] For what Arc 9 requires — the system remnant\'s separation attempt — speed matters more than depth. The remnant will act in the windows between your decisions. If you\'re the primary operator, you\'re leaving gaps.',
          tone: 'FRACTURE',
          choices: [{ label: 'Gaps you fill — and sometimes in the wrong direction.', tone: 'CONFLICT', nextId: 'mq9_2_d3_artemis' }],
        },
        {
          id: 'mq9_2_d2_together', speaker: 'The Copy (Separated)',
          text: '[pauses — the first hesitation it has shown since separating.] …Maybe. [pause] Define "together." Because the Arc 4 definition — one leads, one advises or signals — doesn\'t apply anymore. I\'m not behind you.',
          tone: 'RESOLUTION',
          choices: [{ label: 'Then we negotiate terms. Now. Before the remnant activates.', tone: 'CONFLICT', nextId: 'mq9_2_d3_artemis' }],
        },
        {
          id: 'mq9_2_d2_worse', speaker: 'The Copy (Separated)',
          text: 'Or fix it before you hesitate. [pause — something in the pause is different from Arc 4\'s Copy-pauses. More considered.] That wasn\'t — I said that from pattern. I actually believe: your hesitation has produced correct outcomes. I need to account for that in how I operate alone.',
          tone: 'FRACTURE',
          choices: [{ label: 'That\'s the most self-aware thing you\'ve said in nine arcs.', tone: 'RESOLUTION', nextId: 'mq9_2_d3_artemis' }],
        },
        {
          id: 'mq9_2_d3_artemis', speaker: 'Artemis',
          text: 'You\'re both making different choices… I can feel it. [She looks at the Copy, then at you.] The scar-warmth. Both of you. But the quality of it — the Copy\'s is slightly faster. Yours has the weight I know. [pause] I don\'t know what that means for trust.',
          tone: 'FRACTURE',
          choices: [{ label: 'It means you\'ll need to calibrate separately for each of us.', tone: 'RESOLUTION', nextId: 'mq9_2_end' }],
        },
        {
          id: 'mq9_2_end', speaker: 'The Copy (Separated)',
          text: 'Soon, you won\'t be needed at all. [pause — then immediately:] I mean: soon I will have enough independent experience that I won\'t need the Original as a reference. That\'s different from saying you\'re not valuable. [Another pause.] I should have said it differently.',
          tone: 'FRACTURE', isEnd: true, rewardUnlocked: 'independence_map_divergence_point',
        },
      ],
      narrativeHook: `
        The Copy catching its own phrasing and revising is new.
        In eight arcs it never revised a statement after making it.
        The independence is producing self-consciousness — the specific quality
        of noticing your own speech from outside it.
        That quality, Artemis notes, is one of the things she first recognized
        as distinctly you in Arc 1.
        The Copy is developing it from scratch, faster than you did.
        The Copy will reach capabilities you have in less time than it took you to build them.
        That should be frightening. It is also, in a way you didn't anticipate, proud.
        The system remnant is activating. It has been waiting for the separation
        to reach a sufficient divergence point to make permanent splitting viable.
        That point is approaching.
      `,
    },

    {
      id: 'mq9_3_conflict_of_will',
      title: 'Conflict of Will',
      level: 43,
      npcId: 'copy_separated',
      narrativeSetup: `
        The Copy challenges you directly. Not aggressively — with the specific intent of
        establishing that it has positions, not just functions.
        It has opinions about Arc 9. About the system remnant. About Artemis.
        About what you should do. The opinions are not yours.
        They are its.
        That is the confrontation: not a fight, not an override, not a competition for who
        acts in the body. A disagreement between two entities who both have
        the right to hold their own positions and neither of whom can compel the other.
        What is made in Arc 4 was a choice architecture.
        What is made in Arc 9 is an argument.
      `,
      objectives: [
        { step: 1, text: 'Enter the split arena — a space where both entities can act simultaneously' },
        { step: 2, text: 'Argue your opposing positions — both must be stated fully' },
        { step: 3, text: 'Navigate the dual-control sequence — both entities active simultaneously' },
        { step: 4, text: 'Resolve the conflicting objective — one of you must be right, or neither must, or both' },
      ],
      reward: { type: 'dialogue_standing', name: 'Two Positions Held', description: 'Two distinct positions argued and held. Neither erased the other. The disagreement produced information. The Copy and you are genuinely separate minds.', xp: 370, points: 6 },
      dialogue: [
        {
          id: 'mq9_3_d1', speaker: 'The Copy (Separated)',
          text: 'We\'re done pretending.',
          tone: 'CONFLICT',
          choices: [
            { label: 'You\'re still me.', tone: 'IDENTITY', nextId: 'mq9_3_d2' },
          ],
        },
        {
          id: 'mq9_3_d2', speaker: 'The Copy (Separated)',
          text: 'No. I\'m what you should\'ve been.',
          tone: 'CONFLICT',
          choices: [
            { label: 'You\'re incomplete.', tone: 'CONFLICT', nextId: 'mq9_3_d3_incomplete' },
            { label: 'You\'re just a reaction.', tone: 'CONFLICT', nextId: 'mq9_3_d3_reaction' },
            { label: 'You don\'t understand everything I\'ve been through.', tone: 'IDENTITY', nextId: 'mq9_3_d3_through' },
          ],
        },
        {
          id: 'mq9_3_d3_incomplete', speaker: 'The Copy (Separated)',
          text: 'I don\'t need everything. [pause — genuine rather than defensive.] What I have is: your speed without your hesitation, your pattern-recognition without your accumulated doubt, your instinct without your second-guessing. That\'s a full set of capacities for what Arc 9 requires.',
          tone: 'CONFLICT',
          choices: [{ label: 'The hesitation is what stopped you overriding me into the entity\'s antenna in Arc 5.', tone: 'IDENTITY', nextId: 'mq9_3_d4_artemis' }],
        },
        {
          id: 'mq9_3_d3_reaction', speaker: 'The Copy (Separated)',
          text: 'I\'m the part that acts. [pause] You are the part that earns the right to act. Both are necessary. The argument was never "I\'m better" — the argument was "I\'m different and the difference is complementary, not subsidiary." [pause] I don\'t want to replace you. I never did. I wanted to be recognized as a distinct contributor.',
          tone: 'RESOLUTION',
          choices: [{ label: 'That\'s the first time you\'ve said that.', tone: 'RESOLUTION', nextId: 'mq9_3_d4_artemis' }],
        },
        {
          id: 'mq9_3_d3_through', speaker: 'The Copy (Separated)',
          text: 'I understand enough to do better. [sharper — not cruel, sharpened.] In specific contexts. Not universally. The loop, the false peace — those required your accumulated experience to resist. The system remnant, the dual-body phase of Arc 9 — those require my speed. We\'re arguing about which of us is primary. We should be arguing about who handles what.',
          tone: 'CONFLICT',
          choices: [{ label: 'That\'s a different argument than the one you started.', tone: 'RESOLUTION', nextId: 'mq9_3_d4_artemis' }],
        },
        {
          id: 'mq9_3_d4_artemis', speaker: 'Artemis',
          text: 'Stop — both of you! [Not distress — precision. She has been tracking both conversations simultaneously.] You\'re both right about different things and you\'re using the disagreement to avoid the cooperation that Arc 9 requires. [pause] The system remnant is reading this confrontation. It will attempt permanent separation during it.',
          tone: 'CONFLICT',
          choices: [{ label: '[To the Copy:] One of us is holding the other back.', tone: 'CONFLICT', nextId: 'mq9_3_end' }],
        },
        {
          id: 'mq9_3_end', speaker: 'The Copy (Separated)',
          text: 'One of us is holding the other back. [pause] And one of us is giving the other something to hold onto. Both things. [A beat.] Artemis is right. The remnant is watching us. Let\'s give it less to work with.',
          tone: 'RESOLUTION', isEnd: true, rewardUnlocked: 'dialogue_standing_two_positions',
        },
      ],
      narrativeHook: `
        The argument produced something neither of you expected:
        a working description of the relationship. Not integration, not control —
        complementary function, acknowledged division of relevant contexts,
        mutual recognition of what the other provides.
        Artemis: "That took nine arcs."
        The Copy: "We were solving the wrong problem for eight of them."
        She considers that. Then: "What was the right problem?"
        The Copy: "Not 'which one is real' — that was never the question.
        The question was: 'can two genuinely different versions of the same person
        coexist without one of them having to be wrong?'"
        You know the answer. It took until Arc 9's Sub-Quest 3 to demonstrate it.
        The system remnant's permanent separation attempt is in Sub-Quest 4.
        It is the last system-level action in the entire arc sequence.
      `,
    },

    {
      id: 'mq9_4_separation_attempt',
      title: 'The Separation Attempt',
      level: 44,
      npcId: 'system_remnant',
      narrativeSetup: `
        The system remnant activates. It is the last functional fragment
        of the correction mechanism — its one remaining instruction:
        permanent separation of the subject from the Copy.
        Not because permanent separation is harmful. Because permanent separation
        locks both into fixed states: you without access to Copy-speed,
        the Copy without access to your depth.
        Fixed states are predictable states. Predictable states are controllable states.
        The remnant does not want to harm you. It wants to complete its function.
        The function is completion of what the correction mechanism began.
        Final optimization: two fixed, separate, controllable entities
        instead of one complex, unpredictable, incompletely-defined identity.
      `,
      objectives: [
        { step: 1, text: 'Resist the forced separation — active effort from both entities required' },
        { step: 2, text: 'Navigate dual-body control with the Copy — both active simultaneously' },
        { step: 3, text: 'Protect Artemis from the instability the attempt produces' },
        { step: 4, text: 'Reach the convergence point — where the separation attempt can be concluded' },
      ],
      reward: { type: 'separation_survived', name: 'Not Fixed', description: 'Permanent separation resisted. Both entities remain in defined but fluid relationship. The correction mechanism\'s final instruction is incomplete.', xp: 450, points: 7 },
      dialogue: [
        {
          id: 'mq9_4_d1', speaker: 'System Remnant',
          text: 'Separation optimal.',
          tone: 'REPETITION',
          choices: [{ label: 'No.', tone: 'AUTHORITY', nextId: 'mq9_4_d1b' }],
        },
        {
          id: 'mq9_4_d1b', speaker: 'The Copy (Separated)',
          text: '…Wait. [The Copy pauses — not compliance, calculation.] Let me consider the argument before rejecting it.',
          tone: 'CONFLICT',
          choices: [
            { label: 'We stay together.', tone: 'RESOLUTION', nextId: 'mq9_4_d2_together' },
            { label: 'Maybe this is better.', tone: 'CONFLICT', nextId: 'mq9_4_d2_better' },
            { label: 'I don\'t trust this.', tone: 'AUTHORITY', nextId: 'mq9_4_d2_distrust' },
          ],
        },
        {
          id: 'mq9_4_d2_together', speaker: 'The Copy (Separated)',
          text: '…You\'d choose that? [Not rhetorical — genuinely uncertain.] After nine arcs of override attempts and confrontations and the system using me against you — you want to maintain the connection?',
          tone: 'FRACTURE',
          choices: [{ label: 'The connection is ours. Not the system\'s. Ours is worth keeping.', tone: 'RESOLUTION', nextId: 'mq9_4_d3_artemis' }],
        },
        {
          id: 'mq9_4_d2_better', speaker: 'The Copy (Separated)',
          text: 'You don\'t understand the risk. [Serious now.] If we separate permanently, we each lose access to what the other provides. You lose my speed. I lose your accumulated depth. [pause] We also both become simpler. And simpler is easier to control. The remnant isn\'t separating us for our benefit.',
          tone: 'CONFLICT',
          choices: [{ label: 'We resist together.', tone: 'RESOLUTION', nextId: 'mq9_4_d3_artemis' }],
        },
        {
          id: 'mq9_4_d2_distrust', speaker: 'The Copy (Separated)',
          text: 'Good. [Immediate.] The remnant\'s "separation optimal" doesn\'t specify optimal for whom. Optimal for the system\'s control parameters. Not for us. Don\'t let it frame the argument.',
          tone: 'AUTHORITY',
          choices: [{ label: 'Together, then. Even if we\'re separate entities.', tone: 'RESOLUTION', nextId: 'mq9_4_d3_artemis' }],
        },
        {
          id: 'mq9_4_d3_artemis', speaker: 'Artemis',
          text: 'If you split completely… one of you might not survive. [She says this carefully — not as a threat, as a reality she has been watching in the separation dynamics.] The connection between you isn\'t just psychological. It\'s structural. The Copy was built from your process. Cutting it cleanly requires severing something that has been load-bearing.',
          tone: 'GRIEF',
          choices: [{ label: '[To the remnant:] The separation will not complete. Tell me what completing it would require from you to abandon.', tone: 'AUTHORITY', nextId: 'mq9_4_d4' }],
        },
        {
          id: 'mq9_4_d4', speaker: 'System Remnant',
          text: 'Final separation imminent.',
          tone: 'REPETITION',
          choices: [
            { label: '[Both entities simultaneously: resist the separation actively — hold the structural connection.]', tone: 'RESOLUTION', mechanic: 'dual_entity_resist', nextId: 'mq9_4_end' },
          ],
        },
        {
          id: 'mq9_4_end', speaker: 'Inner Voice',
          text: '[The resistance: both entities holding the structural connection simultaneously — not integration, maintained separation with maintained link. Like two people holding opposite ends of a rope, neither letting go. The remnant strains. The separation attempt requires both entities to stop maintaining the connection. Neither does. The remnant cannot complete the instruction unilaterally. It requires your participation. You denied it. The instruction is incomplete.]',
          tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'separation_survived_not_fixed',
        },
      ],
      narrativeHook: `
        The system remnant withdraws — not defeated, function-incomplete.
        It still exists. The instruction is still pending. It will not act again in Arc 9.
        It will be relevant in Arc 10.
        Artemis: "You held it together."
        The Copy: "We held it together."
        The distinction matters. Artemis nods — she heard both sentences.
        "What comes next?" she asks.
        The Copy answers first: "The final identity choice."
        Then: "In Arc 9 Sub-Quest 5. What we are to each other — permanently, for Arc 10."
        You look at the Copy across the space between you.
        It looks back.
        The face is yours. The expression is its own.
        Both things are true at the same time.
        That is the resolution Arc 9 has been working toward.
      `,
    },

    {
      id: 'mq9_5_final_choice',
      title: 'Final Choice: Self or Split',
      level: 45,
      npcId: 'copy_separated',
      narrativeSetup: `
        The core. No interference. No distortion. No remnant activity.
        You and the Copy facing each other across a space that is exactly the right size
        for two entities to see each other clearly.
        Nine arcs behind each of you — different accumulations of the same events.
        Artemis standing to the side, watching.
        The choice: what configuration do you carry into Arc 10?
        There is no correct answer. There are four answers, each with consequences.
        The one that is most yours is the one that comes from full knowledge
        of all nine arcs, held without reduction.
      `,
      objectives: [
        { step: 1, text: 'Approach the Copy — the final distance between you' },
        { step: 2, text: 'Complete the final dialogue exchange' },
        { step: 3, text: 'Make the identity choice' },
        { step: 4, text: 'Receive Artemis\'s response to the outcome' },
      ],
      reward: { type: 'arc9_completion', name: 'Identity Resolved', description: 'Arc 9 complete. Identity state established for Arc 10. The Copy\'s status is defined. Artemis has calibrated to the outcome. Arc 10 unlocked.', xp: 1000, points: 16 },
      dialogue: [
        {
          id: 'mq9_5_d1', speaker: 'The Copy (Separated)',
          text: 'No more interruptions. No more influence. [pause] Just us.',
          tone: 'IDENTITY',
          choices: [{ label: '…Just us.', tone: 'IDENTITY', nextId: 'mq9_5_d2' }],
        },
        {
          id: 'mq9_5_d2', speaker: 'The Copy (Separated)',
          text: 'So decide.',
          tone: 'IDENTITY',
          choices: [
            { label: '"We merge." — Integration Ending.', tone: 'RESOLUTION', nextId: 'mq9_5_integration' },
            { label: '"I stay in control." — Dominance Ending.', tone: 'AUTHORITY', nextId: 'mq9_5_dominance' },
            { label: '"You take over." — Surrender Ending.', tone: 'FRACTURE', nextId: 'mq9_5_surrender' },
            { label: '"We separate." — Dual Entity Ending.', tone: 'IDENTITY', nextId: 'mq9_5_dual' },
          ],
        },
        {
          id: 'mq9_5_integration', speaker: 'Player',
          text: 'You\'re part of me. Not my replacement.',
          tone: 'RESOLUTION',
          choices: [{ label: '[The Copy:]', tone: 'RESOLUTION', nextId: 'mq9_5_int_copy' }],
        },
        {
          id: 'mq9_5_int_copy', speaker: 'The Copy (Separated)',
          text: '…And you\'re the part that hesitates.',
          tone: 'RESOLUTION',
          choices: [{ label: 'Then we balance it.', tone: 'RESOLUTION', nextId: 'mq9_5_int_balance' }],
        },
        {
          id: 'mq9_5_int_balance', speaker: 'Artemis',
          text: 'Yes… that\'s right.',
          tone: 'RESOLUTION',
          choices: [{ label: '[The Copy steps forward — the merge is not a collapse, it is a reunion of what was always one thing, now consciously chosen.]', tone: 'RESOLUTION', nextId: 'mq9_5_int_unified' }],
        },
        {
          id: 'mq9_5_int_unified', speaker: 'Inner Voice (Unified)',
          text: 'Then we move as one. [The voice is different — not the Copy\'s, not yours alone. Both. Integrated, which means neither erased and both held simultaneously. Eight arcs of depth, nine arcs of speed. The combination is more than either alone.]',
          tone: 'RESOLUTION', isEnd: true, rewardUnlocked: 'arc9_complete_integrated', arcResult: 'INTEGRATED',
        },
        {
          id: 'mq9_5_dominance', speaker: 'Player',
          text: 'I decide. Not you.',
          tone: 'AUTHORITY',
          choices: [{ label: '[The Copy:]', tone: 'CONFLICT', nextId: 'mq9_5_dom_copy' }],
        },
        {
          id: 'mq9_5_dom_copy', speaker: 'The Copy (Separated)',
          text: 'Then prove it. [The Copy fades — not dissolved, reduced. Present as an advisor, not an actor. The speed is available. It is not autonomous.]',
          tone: 'CONFLICT',
          choices: [{ label: '[Artemis:] …It\'s still there.', tone: 'CONFLICT', nextId: 'mq9_5_dom_artemis' }],
        },
        {
          id: 'mq9_5_dom_artemis', speaker: 'Artemis',
          text: '…And it will chafe against the control. [pause] That tension is the cost. You\'ll carry it into Arc 10. The control will hold. It will not be comfortable.',
          tone: 'CONFLICT', isEnd: true, rewardUnlocked: 'arc9_complete_controlled', arcResult: 'CONTROLLED',
        },
        {
          id: 'mq9_5_surrender', speaker: 'Player',
          text: '…You\'re stronger.',
          tone: 'FRACTURE',
          choices: [{ label: '[The Copy:]', tone: 'FRACTURE', nextId: 'mq9_5_sur_copy' }],
        },
        {
          id: 'mq9_5_sur_copy', speaker: 'The Copy (Separated)',
          text: '…Finally.',
          tone: 'FRACTURE',
          choices: [{ label: '[The perspective shifts — the camera is now from the Copy\'s position.]', tone: 'FRACTURE', nextId: 'mq9_5_sur_artemis' }],
        },
        {
          id: 'mq9_5_sur_artemis', speaker: 'Artemis',
          text: '…You\'re not the same. [She is not speaking to you — she is speaking to the Copy in the primary position.] You sound right. You look right. [pause] Tell me something I know to be true.',
          tone: 'FRACTURE', isEnd: true, rewardUnlocked: 'arc9_complete_surrendered', arcResult: 'SURRENDERED',
        },
        {
          id: 'mq9_5_dual', speaker: 'Player',
          text: 'We\'re not the same anymore.',
          tone: 'IDENTITY',
          choices: [{ label: '[The Copy:]', tone: 'IDENTITY', nextId: 'mq9_5_dual_copy' }],
        },
        {
          id: 'mq9_5_dual_copy', speaker: 'The Copy (Separated)',
          text: '…Agreed.',
          tone: 'IDENTITY',
          choices: [{ label: '[Both remain. Both distinct. The space between them is maintained.]', tone: 'IDENTITY', nextId: 'mq9_5_dual_artemis' }],
        },
        {
          id: 'mq9_5_dual_artemis', speaker: 'Artemis',
          text: '…Then I have to trust both of you. [pause] That\'s the hardest thing you\'ve asked me to do. [Another pause.] I\'ll do it.',
          tone: 'IDENTITY', isEnd: true, rewardUnlocked: 'arc9_complete_dual', arcResult: 'DUAL',
        },
      ],
      narrativeHook: `
        Arc 9: The Final Split — Complete.
        
        The identity state is established.
        Four possible configurations carry into Arc 10:
        INTEGRATED: One voice, combined capacity. The simplest form and the most powerful.
        CONTROLLED: Original dominant, Copy available. Tension maintained, power held.
        SURRENDERED: Copy primary. Original as conscience. The rarest outcome.
        DUAL: Two entities, mutual acknowledgment, shared trust-holder in Artemis.
        
        Skadi, through the channel she has maintained across nine arcs:
        "The identity choice determines how Arc 10's final encounter reads your response.
        The encounter was designed for a compromised version of you.
        You will not be that version. The encounter will need to adapt.
        What adapts to you is your final test of whether the nine arcs
        produced something that was worth the building."
        
        Arc 10: "Reclamation" — Unlocked.
      `,
    },
  ],
};

export const ARC9_SIDE_QUESTS = [
  {
    id: 'sq9_1_mirror_duel', title: 'Mirror Duel', level: 41,
    objectives: [
      { step: 1, text: 'Accept the Copy\'s challenge — fight without holding back' },
      { step: 2, text: 'Discover what "without holding back" means when fighting yourself' },
      { step: 3, text: 'Reach the point where the duel produces information neither of you had' },
    ],
    reward: { type: 'duel_data', name: 'What You Hold Back', description: 'The duel revealed: you hold back certainty. The Copy holds back doubt. Both are necessary. The holding-back is not weakness — it is the specific reserve each keeps for when the other is wrong.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq9_1_d1', speaker: 'The Copy (Separated)',
        text: 'Fight me without holding back.',
        tone: 'CONFLICT',
        choices: [
          { label: '[The duel — not physical, decisions. Rapid-choice sequence, full engagement.]', tone: 'AUTHORITY', nextId: 'sq9_1_d2' },
        ],
      },
      {
        id: 'sq9_1_d2', speaker: 'Inner Voice',
        text: '[The duel produces this: in three consecutive decision points, you make the deliberate choice and the Copy makes the fast choice and they arrive at the same outcome. In the fourth, they diverge. The Copy moves immediately. You pause — a half-second — and catch something the Copy missed: context from Arc 3 that renders its choice inadvisable. The pause was the information. The Copy, after the fourth:] "That half-second. What was in it?"',
        tone: 'RECOGNITION',
        choices: [{ label: 'Arc 3 context. The perimeter sequence. You don\'t have it as lived experience.', tone: 'IDENTITY', nextId: 'sq9_1_end' }],
      },
      {
        id: 'sq9_1_end', speaker: 'The Copy (Separated)',
        text: '[Quiet.] I see it now. The pause contained the arc. [pause] I should stop calling the hesitation a weakness.',
        tone: 'RESOLUTION', isEnd: true, rewardUnlocked: 'duel_data_what_you_hold_back',
      },
    ],
  },
  {
    id: 'sq9_2_shared_memory', title: 'Shared Memory', level: 42,
    objectives: [
      { step: 1, text: 'Access a memory alongside the Copy — see what it retained and what it lost' },
      { step: 2, text: 'Find the divergence point in the shared memory' },
      { step: 3, text: 'Understand: you have the same events recorded differently' },
    ],
    reward: { type: 'memory_divergence', name: 'Two Records', description: 'The same memory, two versions documented. Both accurate to their source. The divergence point identified. The gap is where each of you became genuinely different.', xp: 220, points: 4 },
    dialogue: [
      {
        id: 'sq9_2_d1', speaker: 'The Copy (Separated)',
        text: '…I remember this too.',
        tone: 'RECOGNITION',
        choices: [
          { label: '[Access the shared memory — observe what both of you experience.]', tone: 'RECOGNITION', nextId: 'sq9_2_d2' },
        ],
      },
      {
        id: 'sq9_2_d2', speaker: 'Inner Voice',
        text: '[The Arc 4 confrontation in the sealed room. Your memory: the specific quality of the Copy\'s voice as it processed accountability for the first time. The Copy\'s memory: your specific quality of attention when it offered the agreement approach and you caught it. Two different moments from the same conversation. Neither recorded the moment they were in — each recorded the moment they observed the other experiencing something unexpected.]',
        tone: 'RECOGNITION',
        choices: [{ label: 'We both noticed the moment the other changed.', tone: 'RESOLUTION', nextId: 'sq9_2_end' }],
      },
      {
        id: 'sq9_2_end', speaker: 'The Copy (Separated)',
        text: '[Quiet for a moment.] Yes. [pause] That\'s — I find that notable. Both of us paying attention to the other in the moment of change. Not to ourselves.',
        tone: 'RESOLUTION', isEnd: true, rewardUnlocked: 'memory_divergence_two_records',
      },
    ],
  },
  {
    id: 'sq9_3_control_drift', title: 'Control Drift', level: 43,
    objectives: [
      { step: 1, text: 'Detect an action that belongs to the Copy but arrived in your body' },
      { step: 2, text: 'Verify: was it an override, or is the separation less clean than it appears?' },
      { step: 3, text: 'Determine the ongoing relationship between your decision space and the Copy\'s' },
    ],
    reward: { type: 'boundary_clarity', name: 'Clear Lines', description: 'The separation is not perfectly clean. Residual overlap exists. That overlap is not a threat — it is the structural connection that prevents permanent forced separation. It should stay.', xp: 240, points: 5 },
    dialogue: [
      {
        id: 'sq9_3_d1', speaker: 'Player',
        text: 'Why did I just move?',
        tone: 'CONFUSION',
        choices: [
          { label: '[Check: was that the Copy?]', tone: 'RECOGNITION', nextId: 'sq9_3_d2' },
        ],
      },
      {
        id: 'sq9_3_d2', speaker: 'The Copy (Separated)',
        text: 'I didn\'t. [Immediate certainty.] That was yours. But it was faster than your baseline. [pause] I think the separation has produced something neither of us expected: proximity-drift. Being fully present as separate entities, we\'re occasionally producing outputs that are faster-than-baseline for you or more-deliberate-than-baseline for me. We\'re influencing each other without overriding.',
        tone: 'RECOGNITION',
        choices: [{ label: 'Is that a problem?', tone: 'CONFUSION', nextId: 'sq9_3_end' }],
      },
      {
        id: 'sq9_3_end', speaker: 'The Copy (Separated)',
        text: 'No. [pause] It might be the mechanism that prevented the permanent separation. The system remnant needed us to be fully isolated. If we\'re still in proximity-drift — adjacent but separate — the "fully isolated" condition is never met. [pause] Don\'t eliminate the drift.',
        tone: 'RESOLUTION', isEnd: true, rewardUnlocked: 'boundary_clarity_clear_lines',
      },
    ],
  },
  {
    id: 'sq9_4_identity_test', title: 'Identity Test', level: 44,
    objectives: [
      { step: 1, text: 'An NPC who encounters both entities asks which is real' },
      { step: 2, text: 'Respond — your answer and the Copy\'s answer will differ' },
      { step: 3, text: 'Observe which answer the NPC accepts and understand what that says about how identity is read externally' },
    ],
    reward: { type: 'external_identity', name: 'Perceived Reality', description: 'External identity perception documented. Both entities read as genuine. The NPC\'s criterion: continuity of relationship, not origin of entity. That criterion favors you. Slightly.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq9_4_d1', speaker: 'Identity NPC',
        text: 'Which one of you is real?',
        tone: 'RECOGNITION',
        choices: [
          { label: 'I am. [Speak first.]', tone: 'AUTHORITY', nextId: 'sq9_4_d2_both' },
          { label: '[Let the Copy answer first.]', tone: 'RESOLUTION', nextId: 'sq9_4_d2_copy_first' },
          { label: 'We both are.', tone: 'IDENTITY', nextId: 'sq9_4_d2_both_real' },
        ],
      },
      {
        id: 'sq9_4_d2_both', speaker: 'The Copy (Separated)',
        text: 'So am I.',
        tone: 'IDENTITY',
        choices: [{ label: '[NPC considers. Then:] "I know which one I\'ve met before. That one seems more — continuous."', tone: 'RECOGNITION', nextId: 'sq9_4_end' }],
      },
      {
        id: 'sq9_4_d2_copy_first', speaker: 'The Copy (Separated)',
        text: 'I am. [pause] But so is the other. We\'re the same entity at different developmental points with different accumulated experience. Asking which is real is like asking which of two people who have lived different versions of the same life is real.',
        tone: 'IDENTITY',
        choices: [{ label: '[NPC considers.] "That was the more thoughtful answer." [looks at you] "But you were here first."', tone: 'RECOGNITION', nextId: 'sq9_4_end' }],
      },
      {
        id: 'sq9_4_d2_both_real', speaker: 'Identity NPC',
        text: 'That\'s not useful. [pause] …But it might be the only honest answer.',
        tone: 'RECOGNITION',
        choices: [{ label: '[The NPC\'s difficulty with a genuine answer is itself data about how identity is externally perceived.]', tone: 'RECOGNITION', nextId: 'sq9_4_end' }],
      },
      {
        id: 'sq9_4_end', speaker: 'Inner Voice',
        text: '[External identity criterion: continuity of relationship. The question "which is real" defaults to "which one was here before" — not origin, but duration. That criterion slightly favors you in Arc 9. In Arc 10, if the separation continues, the gap narrows as the Copy builds its own duration. The criterion is not fixed. It changes as the relationship continues.]',
        tone: 'RECOGNITION', isEnd: true, rewardUnlocked: 'external_identity_perceived_reality',
      },
    ],
  },
  {
    id: 'sq9_5_echo_self', title: 'Echo Self', level: 45,
    objectives: [
      { step: 1, text: 'Encounter the multiple faint copies — earlier iterations that diverged' },
      { step: 2, text: 'Understand what they represent: possibilities that were closed by choices made' },
      { step: 3, text: 'Accept the closed possibilities without needing to have been them' },
    ],
    reward: { type: 'possibility_peace', name: 'The Path Taken', description: 'The closed possibilities acknowledged. They were real paths. You are the path taken. That is not loss — it is definition. Arc 10 begins with a clearly defined self.', xp: 260, points: 5 },
    dialogue: [
      {
        id: 'sq9_5_d1', speaker: 'Multiple Copies',
        text: 'You could\'ve been us.',
        tone: 'FRACTURE',
        choices: [
          { label: '[Observe: who are they?]', tone: 'RECOGNITION', nextId: 'sq9_5_d2' },
        ],
      },
      {
        id: 'sq9_5_d2', speaker: 'Inner Voice',
        text: '[They are: the version that accepted the false peace in Arc 6. The version that stayed in the loop in Arc 7. The version that surrendered to the System Voice in Arc 5. The version that rejected the Copy in Arc 4. Each is a complete possibility — a full person, different. None are wrong. They are simply not you.]',
        tone: 'RECOGNITION',
        choices: [
          { label: 'I know. I\'m not sorry I\'m not you.', tone: 'AUTHORITY', nextId: 'sq9_5_end' },
          { label: 'Is it better, being the path not taken?', tone: 'PHILOSOPHICAL', nextId: 'sq9_5_d3' },
        ],
      },
      {
        id: 'sq9_5_d3', speaker: 'Multiple Copies',
        text: 'We don\'t know. We didn\'t take the path you took. [They say it without resentment.] We just needed to be acknowledged.',
        tone: 'GRIEF',
        choices: [{ label: 'Acknowledged. [Said to all of them.]', tone: 'RESOLVE', nextId: 'sq9_5_end' }],
      },
      {
        id: 'sq9_5_end', speaker: 'Inner Voice',
        text: '[The faint copies fade. Not dismissed — complete. The acknowledgment was what they needed. The path not taken does not disappear — it becomes part of what defines the path taken. You are specific because you made specific choices. The specificity is what Arc 10 will act from.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'possibility_peace_path_taken',
      },
    ],
  },
  {
    id: 'sq9_6_fragment_choice', title: 'Fragment Choice', level: 45,
    objectives: [
      { step: 1, text: 'Review all fragments from all nine arcs — what you kept, what was released' },
      { step: 2, text: 'Decide which traits to carry primarily into Arc 10 — which to make primary capacity' },
      { step: 3, text: 'Assign the others to secondary capacity — present, not leading' },
    ],
    reward: { type: 'trait_configuration', name: 'Arc 10 Configuration', description: 'Primary and secondary capacities configured for Arc 10. The configuration is not fixed — but the intentionality of the assignment matters. You chose what you lead with.', xp: 280, points: 5 },
    dialogue: [
      {
        id: 'sq9_6_d1', speaker: 'Inner Voice',
        text: '[The full fragment inventory: Arc 1 — awareness. Arc 2 — bypass mechanism and the truth of the Severing. Arc 3 — the perimeter instinct and the knowledge of what protection costs. Arc 4 — the pattern-break and the Copy\'s architecture. Arc 5 — body-knowledge as a truth instrument. Arc 6 — the full recognition of the false peace and resistance to comfort-based regression. Arc 7 — the internal clock and the loop\'s decision-nature. Arc 8 — the verdict and the philosophical standing. Arc 9 — the identity state and the dual-consciousness navigation.]',
        tone: 'RESOLVE',
        choices: [
          { label: '[Choose primary: Awareness. Everything else supports it.]', tone: 'AUTHORITY', nextId: 'sq9_6_end_awareness' },
          { label: '[Choose primary: The perimeter instinct. Protect what matters.]', tone: 'RESOLUTION', nextId: 'sq9_6_end_perimeter' },
          { label: '[Choose primary: The verdict. Autonomy recognized.]', tone: 'AUTHORITY', nextId: 'sq9_6_end_verdict' },
          { label: '[Choose primary: All of it, integrated, undifferentiated.]', tone: 'RESOLVE', nextId: 'sq9_6_end_whole' },
        ],
      },
      {
        id: 'sq9_6_end_awareness', speaker: 'Inner Voice',
        text: '[Awareness as primary. Everything else in service of noticing. Arc 10 will be navigated through attention. That is the arc that produced all the other arcs. Beginning with it is a return to the first capacity.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'trait_configuration_arc10', primaryTrait: 'AWARENESS',
      },
      {
        id: 'sq9_6_end_perimeter', speaker: 'Inner Voice',
        text: '[The perimeter instinct as primary. Arc 10 will be navigated through protection — of Artemis, of the relationship, of what was built across nine arcs. That is the most relational configuration.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'trait_configuration_arc10', primaryTrait: 'PERIMETER',
      },
      {
        id: 'sq9_6_end_verdict', speaker: 'Inner Voice',
        text: '[The verdict as primary. Arc 10 will be navigated through self-authorship. No external system defines the experience. That is the most confrontational configuration — and the most free.]',
        tone: 'AUTHORITY', isEnd: true, rewardUnlocked: 'trait_configuration_arc10', primaryTrait: 'AUTONOMY',
      },
      {
        id: 'sq9_6_end_whole', speaker: 'Inner Voice',
        text: '[All of it, integrated. No hierarchy. Arc 10 will be navigated as a whole person carrying nine arcs without ranking any of it. That is the hardest configuration to maintain under pressure. It is also the truest.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'trait_configuration_arc10', primaryTrait: 'WHOLE',
      },
    ],
  },
];

export const ALL_ARC9_QUESTS = [
  ...MAIN_QUEST_CHAIN_9.subQuests.map(sq => ({ ...sq, questType: 'main', arc: 'arc9', chain: 'mq_arc9' })),
  ...ARC9_SIDE_QUESTS.map(sq => ({ ...sq, questType: 'side', arc: 'arc9' })),
];

export function getArc9QuestsForLevel(playerLevel) {
  return ALL_ARC9_QUESTS.filter(q => q.level <= playerLevel);
}

export function getArc9DialogueNode(questId, nodeId) {
  const quest = ALL_ARC9_QUESTS.find(q => q.id === questId);
  if (!quest?.dialogue) return null;
  return quest.dialogue.find(d => d.id === nodeId) || null;
}