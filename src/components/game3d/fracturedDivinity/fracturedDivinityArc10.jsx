// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 10: "Reclamation"
// Quest chain: Levels 46–50
// Main Quest 10: "I Am Whole" (5 sub-quests) + 6 Side Quests
// Tone tags: RESOLVE | CLARITY | CULMINATION | OWNERSHIP | CREATION | WHOLENESS
// NOTE: Dialogue dynamically adapts based on Arc 9 outcome
// Arc 9 outcomes: INTEGRATED | CONTROLLED | SURRENDERED | DUAL
// ─────────────────────────────────────────────────────────────────────────────

// ── DYNAMIC DIALOGUE HELPER ─────────────────────────────────────────────────
// Each dialogue node may contain `variants` keyed by Arc 9 arcResult.
// Rendering layer should select the matching variant or fall back to `text`.

export const ARC10_NPCS = [
  {
    id: 'artemis_arc10',
    name: 'Artemis',
    description: 'Fully herself. Nine arcs of accumulated presence, all of it hers. She will not go back. She will not be edited. The arc ends or it doesn\'t — but she is staying for the ending.',
    tint: 0x1a1a3a,
  },
  {
    id: 'copy_arc10',
    name: 'The Copy / Inner Voice',
    description: 'Exists in the form determined by Arc 9. Integrated: part of you. Controlled: present, held. Surrendered: primary. Dual: separate, present.',
    tint: 0x2a2a3a,
  },
  {
    id: 'final_entity',
    name: 'The Final Remnant',
    description: 'A composite entity built from everything that has opposed you across ten arcs. Not designed for you as you are now. Designed for a version of you that no longer exists. That mismatch is your advantage.',
    tint: 0x1a0a0a,
  },
  {
    id: 'the_observer_final',
    name: 'The Observer',
    description: 'Has been here for ten arcs. This is the last arc it needs to be here for. Its function completes at Arc 10\'s close.',
    tint: 0x0a1a0a,
  },
];

export const MAIN_QUEST_CHAIN_10 = {
  id: 'mq_arc10',
  title: 'I Am Whole',
  arc: 'Arc 10: Reclamation',
  description: 'Everything stabilizes. Not because a system allowed it. Not because the pressure stopped. Because you have become something that stability fits. The quiet at the beginning of Arc 10 is different from every prior quiet — the Arc 6 quiet was constructed, the Arc 7 was imposed, the Arc 8 was intentional. This one just is.',
  subQuests: [

    {
      id: 'mq10_1_return_to_center',
      title: 'Return to Center',
      level: 46,
      npcId: 'artemis_arc10',
      narrativeSetup: `
        The space at the beginning of Arc 10 is genuinely open.
        No distortion. No objective markers that arrived uninvited. No System Voice calibrating.
        No loop anchor. No false peace.
        Just a space that is the correct size for the two of you — three, depending on the Arc 9 outcome.
        Artemis moves through it without checking the walls.
        For the first time in ten arcs, she trusts the space she\'s in.
        You test your own presence: full range of motion. All abilities accessible.
        No external override in the decision space.
        This is what you were trying to reach.
      `,
      objectives: [
        { step: 1, text: 'Move freely — test the full range of capacity without triggering any external response' },
        { step: 2, text: 'Speak with Artemis — establish the new baseline between you' },
        { step: 3, text: 'Sense the remaining presence — what is still here, at the edge, watching' },
        { step: 4, text: 'Choose how to relate to the remaining presence' },
      ],
      reward: { type: 'baseline_established', name: 'Open Ground', description: 'The genuine baseline established. All capacities active. Artemis in full relational clarity. The structure that was removed over ten arcs is replaced by the structure you built. This one is yours.', xp: 280, points: 5 },
      dialogue: [
        {
          id: 'mq10_1_d1', speaker: 'Player',
          text: '…It\'s quiet.',
          tone: 'RESOLVE',
          choices: [{ label: '[Artemis:]', tone: 'CLARITY', nextId: 'mq10_1_d1b' }],
        },
        {
          id: 'mq10_1_d1b', speaker: 'Artemis',
          text: '…No interference. No system. [She is standing in the space without the specific tension that has been present since Arc 1 — the tension of something being monitored. It\'s absent.] I feel like I can hear myself think.',
          tone: 'CLARITY',
          choices: [{ label: '…No control but mine.', tone: 'AUTHORITY', nextId: 'mq10_1_d2_identity_var' }],
        },
        {
          id: 'mq10_1_d2_identity_var', speaker: 'Inner Voice',
          text: '[Arc 9 identity state active:]',
          tone: 'CLARITY',
          variants: {
            INTEGRATED: { speaker: 'Inner Voice (Unified)', text: 'We\'re aligned. [The unified voice — both, simultaneously. The weight of nine arcs, the speed of the Copy. No conflict in the decision space. The silence is the silence of something that doesn\'t need to fight itself.]', tone: 'RESOLVE' },
            CONTROLLED: { speaker: 'The Copy', text: 'I\'m still here. [Quiet, distant — present as a signal, not a voice.] Ready when you need the speed.', tone: 'RESOLVE' },
            SURRENDERED: { speaker: 'The Copy (Primary)', text: 'This feels right. [The Copy in the primary position — it says it without triumph. More like: recognition.] The weight I\'ve been carrying was the Original\'s. Now I carry it too.', tone: 'FRACTURE' },
            DUAL: { speaker: 'The Copy', text: '…So this is what it\'s like. [It stands slightly apart — the dual configuration.] To be in a space that isn\'t fighting anything. I don\'t have a reference for this.', tone: 'IDENTITY' },
          },
          choices: [
            { label: 'It\'s finally over.', tone: 'RESOLVE', nextId: 'mq10_1_d3_over' },
            { label: 'Something still feels unfinished.', tone: 'CLARITY', nextId: 'mq10_1_d3_unfinished' },
            { label: 'What happens now?', tone: 'RESOLVE', nextId: 'mq10_1_d3_now' },
          ],
        },
        {
          id: 'mq10_1_d3_over', speaker: 'Artemis',
          text: '…That depends on you. [She says it with the quality of someone who means it completely — not as a challenge, as a genuine opening.] For the first time, the "what happens now" is not determined by a system or an interference or a mechanism. It\'s determined by what you choose to do with the space.',
          tone: 'CLARITY',
          choices: [{ label: '[In the distance: a structure appears. Familiar. Undefined.]', tone: 'RESOLVE', nextId: 'mq10_1_end' }],
        },
        {
          id: 'mq10_1_d3_unfinished', speaker: 'Artemis',
          text: 'Yes. [She saw the same structure before you named the feeling.] Something is still at the edge. Not threatening — remaining. [pause] The Observer has been here for ten arcs. It doesn\'t reset. I think it\'s going to complete something in Arc 10.',
          tone: 'CLARITY',
          choices: [{ label: '[The structure in the distance. Moving toward it.]', tone: 'RESOLVE', nextId: 'mq10_1_end' }],
        },
        {
          id: 'mq10_1_d3_now', speaker: 'Artemis',
          text: '…That depends on you. [pause, with a slight quality of — relief? — that the sentence is finally accurate.] Genuinely you.',
          tone: 'CLARITY',
          choices: [{ label: '[The structure in the distance. This is where Arc 10 is going.]', tone: 'RESOLVE', nextId: 'mq10_1_end' }],
        },
        {
          id: 'mq10_1_end', speaker: 'Inner Voice',
          text: '[The structure is at the edge of the space. It shifts form as you look at it — not distortion, it genuinely shifts. Temple, then void, then mirror, then a room you remember. It is settling into its final form. Whatever it is, it contains the last piece of Arc 10.] [A faint structure appears in the distance.]',
          tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'baseline_established_open_ground',
        },
      ],
      narrativeHook: `
        You move toward the structure and notice: nothing fights the movement.
        No adjustment, no redirect, no system noting your direction.
        Just distance decreasing between you and something at the far end of Arc 10.
        Artemis walking beside you.
        The Copy in its Arc 9 configuration.
        The full weight of nine arcs behind the three steps you've taken so far.
        The Observer at the edge of vision — not following, watching.
        It has been watching since before Arc 1. This is the last arc.
        You don't know yet whether the Observer's function completes at Arc 10's end
        or whether it will simply remain, after everything concludes,
        still watching from whatever position it has occupied since before you began.
        That question is among the things Arc 10 will resolve.
      `,
    },

    {
      id: 'mq10_2_final_truth',
      title: 'The Final Truth',
      level: 47,
      npcId: 'artemis_arc10',
      narrativeSetup: `
        The structure: you enter it.
        Inside, it is all of the spaces from all nine arcs — not layered, simultaneous.
        The Winter antechamber and the false peace and the corridor junction
        and the core zone and the loop space and the silence before the Presence
        and the sealed room where you first spoke with the Copy alone.
        All of them occupying the same space. All of them real.
        A voice speaks — not the System Voice, not the Presence, not the Copy.
        Something neutral. Clear. Present in the way that the core of a thing is present.
      `,
      objectives: [
        { step: 1, text: 'Enter the shifting structure — navigate the simultaneous arc-spaces' },
        { step: 2, text: 'Interact with the core memory — the first moment of Arc 1' },
        { step: 3, text: 'Confront the reflection — not distorted, not constructed, yourself as you are now' },
        { step: 4, text: 'Answer the final question: what do you do with this?' },
      ],
      reward: { type: 'full_self_knowledge', name: 'The Complete Account', description: 'All arc memories integrated into a single held account. No contradiction, no reduction. The full picture, completely yours.', xp: 340, points: 6 },
      dialogue: [
        {
          id: 'mq10_2_d1', speaker: 'Player',
          text: '…This place again.',
          tone: 'RECOGNITION',
          choices: [{ label: '[Artemis:]', tone: 'CLARITY', nextId: 'mq10_2_d1b' }],
        },
        {
          id: 'mq10_2_d1b', speaker: 'Artemis',
          text: '…No. This is different. [She looks at the simultaneous arc-spaces around them.] This is all of it at once. Not one arc, not a specific memory — the whole ten arcs, held here, in the same space. [pause] It\'s not threatening. That\'s new.',
          tone: 'CLARITY',
          choices: [{ label: '[The neutral voice:]', tone: 'RESOLVE', nextId: 'mq10_2_d2' }],
        },
        {
          id: 'mq10_2_d2', speaker: 'Voice (Neutral)',
          text: 'This is what remains.',
          tone: 'RESOLVE',
          choices: [
            { label: 'What is this?', tone: 'CONFUSION', nextId: 'mq10_2_d3_what' },
            { label: 'Is this the truth?', tone: 'PHILOSOPHICAL', nextId: 'mq10_2_d3_truth' },
            { label: 'Is this me?', tone: 'IDENTITY', nextId: 'mq10_2_d3_me' },
          ],
        },
        {
          id: 'mq10_2_d3_what', speaker: 'Voice (Neutral)',
          text: 'Your foundation. Every arc-space that shaped a capacity, held simultaneously. Not what you remember — what you built. The memories and the residue and the carried weight and the kept fragments. This is the accumulated structure of ten arcs.',
          tone: 'RESOLVE',
          choices: [{ label: '[Approach the reflection.]', tone: 'IDENTITY', nextId: 'mq10_2_d4_reflection' }],
        },
        {
          id: 'mq10_2_d3_truth', speaker: 'Voice (Neutral)',
          text: 'Your interpretation. [pause] There is no version of the ten arcs that exists independently of the person who experienced them. The events happened. What they mean is yours to determine. The account is accurate. The meaning is open.',
          tone: 'PHILOSOPHICAL',
          choices: [{ label: '[Approach the reflection.]', tone: 'IDENTITY', nextId: 'mq10_2_d4_reflection' }],
        },
        {
          id: 'mq10_2_d3_me', speaker: 'Voice (Neutral)',
          text: 'Yourself.',
          tone: 'IDENTITY',
          choices: [{ label: '[Approach the reflection.]', tone: 'IDENTITY', nextId: 'mq10_2_d4_reflection' }],
        },
        {
          id: 'mq10_2_d4_reflection', speaker: 'Reflection',
          text: 'No more interference. No more illusions. [The reflection is complete — not idealized, not distorted. Ten arcs of accumulated weight visible in it. It looks like someone who has been through something.] [pause] So what do you do with that?',
          tone: 'RESOLVE',
          choices: [
            { label: '[This question is for Sub-Quest 5. For now: hold the full account.]', tone: 'RESOLVE', nextId: 'mq10_2_end' },
          ],
        },
        {
          id: 'mq10_2_end', speaker: 'Reflection',
          text: 'So what do you do with that? [The question remains. It will be answered in the final sub-quest. For now, the arc-spaces around you are present and real and yours. All of them, simultaneously. This is what you survived. This is what you built.]',
          tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'full_self_knowledge_complete_account',
        },
      ],
      narrativeHook: `
        The reflection stays.
        Not threatening. Present.
        It is the most accurate image you have seen in ten arcs.
        The Copy, in its Arc 9 form, looks at it alongside you.
        "That's us," it says — using plural without being asked.
        Artemis: "Yes."
        Three words between three people (or two, depending on Arc 9)
        that contain the full account.
        Sub-Quest 3 is about reclaiming what was taken.
        Sub-Quest 4 is the last external threat.
        Sub-Quest 5 is the ending.
        The foundation is complete. What gets built on it is Arc 10\'s remaining question.
      `,
    },

    {
      id: 'mq10_3_reclaiming_power',
      title: 'Reclaiming Power',
      level: 48,
      npcId: 'artemis_arc10',
      narrativeSetup: `
        Full access returns. Not restored — reclaimed.
        The distinction matters: restoration implies something gave it back.
        Reclamation implies you took it.
        Every capacity developed across ten arcs is present simultaneously.
        The bypass mechanism from Arc 2. The perimeter instinct from Arc 3.
        The pattern-break from Arc 4. Body-knowledge as truth instrument from Arc 5.
        The comfort-resistance from Arc 6. The internal clock from Arc 7.
        The philosophical standing from Arc 8. The identity configuration from Arc 9.
        The sum of ten arcs, available at once.
        You test each one. All of them respond.
      `,
      objectives: [
        { step: 1, text: 'Activate the full ability set — verify each capacity is present and functional' },
        { step: 2, text: 'Test control stability — confirm no external override in the decision space' },
        { step: 3, text: 'Reconnect with Artemis at full capacity — the relationship at its most complete' },
        { step: 4, text: 'Define personal intention for Arc 10\'s final encounter' },
      ],
      reward: { type: 'full_capacity', name: 'Everything Held', description: 'Full capacity confirmed. All arc competencies active simultaneously. No external override. The encounter ahead was designed for a compromised version of you. This is the advantage.', xp: 420, points: 7 },
      dialogue: [
        {
          id: 'mq10_3_d1', speaker: 'Player',
          text: '…Everything\'s back.',
          tone: 'CLARITY',
          choices: [{ label: '[Artemis:]', tone: 'RESOLVE', nextId: 'mq10_3_d1b' }],
        },
        {
          id: 'mq10_3_d1b', speaker: 'Artemis',
          text: '…And it\'s stable. [She tests the scar-warmth — checks yours, the way she\'s been checking since Arc 3. Full warmth. Present. Uninterrupted.] The Arc 3 link. The verification system. The trust-architecture from six arcs of building. All of it intact.',
          tone: 'RESOLVE',
          choices: [{ label: '[Arc 9 identity variant:]', tone: 'CLARITY', nextId: 'mq10_3_d2_var' }],
        },
        {
          id: 'mq10_3_d2_var', speaker: 'Inner Voice',
          text: '',
          variants: {
            INTEGRATED: { speaker: 'Inner Voice (Unified)', text: 'No hesitation. No recklessness. [The unified voice in the full capacity space — both aspects together, neither suppressing the other. The combination produces something more specific than either alone: precision that carries weight.] This is the configuration.', tone: 'RESOLVE' },
            CONTROLLED: { speaker: 'The Copy', text: 'Don\'t get comfortable. [Not hostile — a reminder. It has been the nature of this arc relationship.] The encounter ahead will be the final test of whether the control holds under maximum pressure. I\'ll be here.', tone: 'RESOLVE' },
            SURRENDERED: { speaker: 'The Copy (Primary)', text: 'This is how it should\'ve been. [A pause after the sentence — the Copy is examining it.] Actually: this is how it is. "Should\'ve been" implies regret about how it was. I don\'t regret the nine arcs. They made this moment possible.', tone: 'FRACTURE' },
            DUAL: { speaker: 'The Copy', text: '…You feel that too? [To the Original, from the separate position.] The full capacity — I have access to it too, from here. The dual configuration isn\'t diminished. It\'s doubled.', tone: 'IDENTITY' },
          },
          choices: [
            { label: 'This is mine.', tone: 'AUTHORITY', nextId: 'mq10_3_d3_artemis' },
            { label: 'I won\'t lose control again.', tone: 'RESOLVE', nextId: 'mq10_3_d3_artemis' },
            { label: 'I need to understand everything.', tone: 'PHILOSOPHICAL', nextId: 'mq10_3_d3_artemis' },
          ],
        },
        {
          id: 'mq10_3_d3_artemis', speaker: 'Artemis',
          text: 'You already understand enough. [pause] That\'s not a limitation — it\'s an acknowledgment that full understanding is not required to act correctly. You\'ve been acting correctly, increasingly, across ten arcs. That\'s not about understanding everything. It\'s about understanding what matters and holding it under pressure.',
          tone: 'RESOLVE',
          choices: [{ label: '[The world responds to your presence — the environment adjusts to your movement rather than against it.]', tone: 'CLARITY', nextId: 'mq10_3_end' }],
        },
        {
          id: 'mq10_3_end', speaker: 'Inner Voice',
          text: '[The world forms around your presence. Not submission — responsiveness. The distinction: submission implies it was fighting and lost. Responsiveness implies it recognizes something it aligns with. Ten arcs of accumulated weight producing an identity that the environment simply fits. This is what reclamation feels like from the inside.]',
          tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'full_capacity_everything_held',
        },
      ],
      narrativeHook: `
        The world responds differently to you now.
        You move through it and it moves with you rather than against you.
        That responsiveness is not a reward. It is a report.
        The ten arcs changed you into something that the environment — even the parts
        of the environment that were designed to resist you — simply fits differently.
        The final remnant is ahead. It is the composite of everything that opposed you.
        It was built for the version of you that accepted the peace,
        or stayed in the loop, or surrendered to the System Voice.
        It was not built for this.
        Skadi: "The encounter was calibrated. The calibration assumed
        a 60% erosion of original capacity by Arc 10.
        You are at 100%. The encounter is going to be confused.
        That confusion is a window. Use it."
      `,
    },

    {
      id: 'mq10_4_final_interference',
      title: 'Final Interference',
      level: 49,
      npcId: 'final_entity',
      narrativeSetup: `
        The Final Remnant appears. It is made of:
        the warmth of the Welcoming Figure without the manipulation,
        the System Voice's precision without the agenda,
        the Presence\'s sustained attention without the distance,
        and the loop\'s patience without the entrapment.
        It took the best qualities of everything that opposed you
        and constructed them into something that is genuinely formidable.
        That is Arc 10\'s respect for what you've survived.
        It does not gloat. It does not threaten. It presents itself clearly.
      `,
      objectives: [
        { step: 1, text: 'Confront the Final Remnant — understand what it is made of' },
        { step: 2, text: 'Resist its manipulation — it knows everything about you from all ten arcs' },
        { step: 3, text: 'Maintain identity coherence under maximum pressure' },
        { step: 4, text: 'Defeat or transcend — the method depends on your Arc 9 configuration' },
      ],
      reward: { type: 'final_encounter_cleared', name: 'The Last Hold', description: 'The Final Remnant addressed. All ten arc systems exhausted. The space ahead is clear. Arc 10 Sub-Quest 5 is the ending.', xp: 550, points: 8 },
      dialogue: [
        {
          id: 'mq10_4_d1', speaker: 'Final Entity',
          text: 'You\'ve changed.',
          tone: 'RECOGNITION',
          choices: [{ label: 'So have you.', tone: 'RESOLVE', nextId: 'mq10_4_d2' }],
        },
        {
          id: 'mq10_4_d2', speaker: 'Final Entity',
          text: 'I am what remains of everything you faced. The correction mechanism\'s architecture. The false peace\'s constructed warmth. The loop\'s structural patience. The Presence\'s sustained attention. Assembled from the remnants of nine arcs of opposition. [pause] I\'m not here to harm you. I\'m here because I exist and you\'re the reason.',
          tone: 'RECOGNITION',
          choices: [
            { label: 'Then I\'ll end it.', tone: 'AUTHORITY', nextId: 'mq10_4_d3_end' },
            { label: 'You don\'t control me.', tone: 'AUTHORITY', nextId: 'mq10_4_d3_control' },
            { label: 'You were never real.', tone: 'CONFRONTATIONAL', nextId: 'mq10_4_d3_real' },
          ],
        },
        {
          id: 'mq10_4_d3_end', speaker: 'Final Entity',
          text: 'Then act.',
          tone: 'RECOGNITION',
          choices: [{ label: '[Arc 9 identity variant action:]', tone: 'RESOLVE', nextId: 'mq10_4_d4_var' }],
        },
        {
          id: 'mq10_4_d3_control', speaker: 'Final Entity',
          text: 'Prove it.',
          tone: 'RECOGNITION',
          choices: [{ label: '[Arc 9 identity variant action:]', tone: 'RESOLVE', nextId: 'mq10_4_d4_var' }],
        },
        {
          id: 'mq10_4_d3_real', speaker: 'Final Entity',
          text: 'Reality is defined by you now. [pause] Which means I exist insofar as you produced the conditions for my existence. I am the residue of your journey. Unmake me by going further than I was built to prevent.',
          tone: 'PHILOSOPHICAL',
          choices: [{ label: '[Arc 9 identity variant action:]', tone: 'RESOLVE', nextId: 'mq10_4_d4_var' }],
        },
        {
          id: 'mq10_4_d4_var', speaker: 'Artemis',
          text: 'This is the last thing holding on.',
          tone: 'RESOLVE',
          choices: [{ label: '[Arc 9 Copy response:]', tone: 'RESOLVE', nextId: 'mq10_4_d5_var' }],
        },
        {
          id: 'mq10_4_d5_var', speaker: 'Inner Voice',
          text: '',
          variants: {
            INTEGRATED: { speaker: 'Inner Voice (Unified)', text: 'We handle this together. [The unified capacity applied — depth and speed simultaneously. The Final Remnant was not built for this combination.]', tone: 'RESOLVE' },
            CONTROLLED: { speaker: 'The Copy', text: 'Don\'t slip. [From the controlled position — available, advisory. The reminder is the function.] Full depth. No shortcuts.', tone: 'AUTHORITY' },
            SURRENDERED: { speaker: 'The Copy (Primary)', text: 'I\'ll take this. [The Copy in primary position moves with the speed of nine arcs of pure function. Behind it, the Original\'s depth informs every motion.] Watch and confirm.', tone: 'FRACTURE' },
            DUAL: { speaker: 'The Copy', text: 'Let\'s finish it. [From the separate position, mirroring your movement across the space — two entities, simultaneous approach.]', tone: 'IDENTITY' },
          },
          choices: [{ label: '[The Final Remnant receives the full weight.]', tone: 'RESOLVE', nextId: 'mq10_4_end' }],
        },
        {
          id: 'mq10_4_end', speaker: 'Final Entity',
          text: '[Breaking apart — not dramatically, the way something concludes.] …So this is your answer.',
          tone: 'RECOGNITION', isEnd: true, rewardUnlocked: 'final_encounter_cleared',
        },
      ],
      narrativeHook: `
        The Final Remnant dissolves. Not defeated — complete.
        Everything it was made of was the best version of the arc systems.
        The best version was not enough for you as you are.
        That is the most accurate summary of Arc 10\'s purpose.
        Artemis: "That was the last one."
        The Copy, in its configuration: "Yes."
        The Observer moves, for the second time in ten arcs.
        One step toward you.
        Then it speaks. The first time it has spoken without glitch, without distortion,
        without the filtered quality of the Arc 7 conversation.
        It says: "You're ready."
        Sub-Quest 5 is the ending.
      `,
    },

    {
      id: 'mq10_5_i_am_whole',
      title: 'I Am Whole',
      level: 50,
      npcId: 'artemis_arc10',
      narrativeSetup: `
        Everything clears.
        No enemies. No voices from systems. No residual presence.
        Just you. Artemis. The Copy in its Arc 9 form.
        The world in the state it reaches when nothing is acting against it.
        Artemis: "…It\'s over."
        You: "…No. It\'s decided."
        The distinction is the last thing Arc 10 asks you to hold.
        "Over" implies conclusion without continuation.
        "Decided" implies a state that was reached by choosing,
        and that continues to exist as a choice.
        The game does not end. The arc does.
        What you carry forward from it is the final question.
      `,
      objectives: [
        { step: 1, text: 'Speak with Artemis — the final conversation' },
        { step: 2, text: 'Reflect on the ten arcs — not in summary, in presence' },
        { step: 3, text: 'Make the final decision — what do you do with all of this?' },
        { step: 4, text: 'Receive the Observer\'s completion and Skadi\'s final mark' },
      ],
      reward: { type: 'game_complete', name: 'Fractured Divinity Complete', description: 'All ten arcs complete. Full autonomy achieved. All systems addressed. The record is yours. What comes next is not determined by any prior arc system.', xp: 2000, points: 25 },
      dialogue: [
        {
          id: 'mq10_5_d1', speaker: 'Artemis',
          text: '…It\'s over.',
          tone: 'CLARITY',
          choices: [{ label: '…No. It\'s decided.', tone: 'AUTHORITY', nextId: 'mq10_5_d2' }],
        },
        {
          id: 'mq10_5_d2', speaker: 'Artemis',
          text: '[She pauses. Then, a smile — the first genuine Arc 10 smile.] …Yes. That\'s the right word.',
          tone: 'RESOLVE',
          choices: [
            { label: '"I Define My Reality" — Self-Mastery Ending.', tone: 'AUTHORITY', nextId: 'mq10_5_self_mastery' },
            { label: '"I Let It All Go" — Release Ending.', tone: 'RESOLVE', nextId: 'mq10_5_release' },
            { label: '"I Keep Fighting" — Endless Growth Ending.', tone: 'AUTHORITY', nextId: 'mq10_5_endless_growth' },
            { label: '"We Build Something New" — Creation Ending.', tone: 'CLARITY', nextId: 'mq10_5_creation' },
          ],
        },

        // ── SELF-MASTERY ENDING ─────────────────────────────────────
        {
          id: 'mq10_5_self_mastery', speaker: 'Player',
          text: 'I decide what\'s real for me. No system. No interference.',
          tone: 'AUTHORITY',
          choices: [{ label: '[Artemis:]', tone: 'RESOLVE', nextId: 'mq10_5_sm_artemis' }],
        },
        {
          id: 'mq10_5_sm_artemis', speaker: 'Artemis',
          text: '…Then it\'s yours.',
          tone: 'RESOLVE',
          choices: [{ label: '[The Copy, in Arc 9 form:] …No arguments.', tone: 'RESOLVE', nextId: 'mq10_5_observer' }],
        },

        // ── RELEASE ENDING ──────────────────────────────────────────
        {
          id: 'mq10_5_release', speaker: 'Player',
          text: '…I don\'t need to hold onto any of it.',
          tone: 'RESOLVE',
          choices: [{ label: '[Artemis:]', tone: 'CLARITY', nextId: 'mq10_5_rel_artemis' }],
        },
        {
          id: 'mq10_5_rel_artemis', speaker: 'Artemis',
          text: '…Are you sure?',
          tone: 'RESOLVE',
          choices: [{ label: 'Yes. The carrying served its purpose. What I built is in me, not in the holding.', tone: 'RESOLVE', nextId: 'mq10_5_rel_confirm' }],
        },
        {
          id: 'mq10_5_rel_confirm', speaker: 'Inner Voice',
          text: '[The release: not the false peace\'s release, not the loop\'s demand. Your own release. Deliberate. From a position of fullness, not emptiness. What you let go, you let go from having held it completely. That is different from every prior arc\'s version of letting go.] [Environment fades into calm, minimal, genuinely quiet state.]',
          tone: 'RESOLVE',
          choices: [{ label: '[Observer completion:]', tone: 'RESOLVE', nextId: 'mq10_5_observer' }],
        },

        // ── ENDLESS GROWTH ENDING ───────────────────────────────────
        {
          id: 'mq10_5_endless_growth', speaker: 'Player',
          text: 'I\'m not done. There\'s always more to face.',
          tone: 'AUTHORITY',
          choices: [{ label: '[Artemis nods.]', tone: 'RESOLVE', nextId: 'mq10_5_eg_artemis' }],
        },
        {
          id: 'mq10_5_eg_artemis', speaker: 'Artemis',
          text: '…Then we keep moving. [She says it with the quality of someone who means it completely and has prepared for it.]',
          tone: 'RESOLVE',
          choices: [{ label: '[The Copy:] Good.', tone: 'AUTHORITY', nextId: 'mq10_5_observer' }],
        },

        // ── CREATION ENDING ─────────────────────────────────────────
        {
          id: 'mq10_5_creation', speaker: 'Player',
          text: '…This isn\'t the end. It\'s a start.',
          tone: 'CLARITY',
          choices: [{ label: '[Artemis:]', tone: 'CLARITY', nextId: 'mq10_5_cr_artemis' }],
        },
        {
          id: 'mq10_5_cr_artemis', speaker: 'Artemis',
          text: 'Then let\'s create it. [The world begins reshaping — not under external direction, under yours. The environment responds to your presence the way it did in Sub-Quest 3, but now with intention. This is what building feels like in a space that is genuinely yours.]',
          tone: 'CLARITY',
          choices: [{ label: '[Observer completion:]', tone: 'RESOLVE', nextId: 'mq10_5_observer' }],
        },

        // ── THE OBSERVER COMPLETION ──────────────────────────────────
        {
          id: 'mq10_5_observer', speaker: 'The Observer',
          text: '…You don\'t need me anymore. [The Observer speaks — fully present, fully clear, for the first time in ten arcs without distance or glitch or obscuring screen.] That was the function. To watch until the watching was no longer necessary. [pause] Everything from Arc 1 to this moment is in the record. It\'s all there. You can read it whenever you want to. [pause] I\'m done here.',
          tone: 'RESOLVE',
          choices: [{ label: '[The Observer steps back — not withdrawal, completion. Its function ends. It remains, diminished to presence without function. The arc-record is sealed.]', tone: 'RESOLVE', nextId: 'mq10_5_skadi' }],
        },
        {
          id: 'mq10_5_skadi', speaker: 'Skadi',
          text: '[A mark appears — the last one. In the record room. Beside your name, the blank outcome space. The space that has been blank since Arc 1. The word written in it. One word. The same word Skadi would have chosen.] [pause] What word is there?',
          tone: 'RESOLVE',
          choices: [
            { label: '"Whole."', tone: 'RESOLVE', nextId: 'mq10_5_end_whole' },
            { label: '"Free."', tone: 'AUTHORITY', nextId: 'mq10_5_end_free' },
            { label: '"Decided."', tone: 'AUTHORITY', nextId: 'mq10_5_end_decided' },
            { label: '"Mine."', tone: 'AUTHORITY', nextId: 'mq10_5_end_mine' },
          ],
        },
        {
          id: 'mq10_5_end_whole', speaker: 'Skadi',
          text: '[She carves it.] Whole. [pause] That\'s the full word. Everything it means. [pause] The record is complete.',
          tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'game_complete_whole', finalWord: 'WHOLE',
        },
        {
          id: 'mq10_5_end_free', speaker: 'Skadi',
          text: '[She carves it.] Free. [pause] That\'s what the ten arcs were always working toward. Not the absence of constraint — the presence of genuine choice. [pause] The record is complete.',
          tone: 'AUTHORITY', isEnd: true, rewardUnlocked: 'game_complete_free', finalWord: 'FREE',
        },
        {
          id: 'mq10_5_end_decided', speaker: 'Skadi',
          text: '[She carves it.] Decided. [pause] Not concluded. Not finished. Decided. The distinction between those words is everything. [pause] The record is complete.',
          tone: 'AUTHORITY', isEnd: true, rewardUnlocked: 'game_complete_decided', finalWord: 'DECIDED',
        },
        {
          id: 'mq10_5_end_mine', speaker: 'Skadi',
          text: '[She carves it.] Mine. [A long pause. Then, almost to herself:] Thirteen years. [pause] The record is complete.',
          tone: 'GRIEF', isEnd: true, rewardUnlocked: 'game_complete_mine', finalWord: 'MINE',
        },
      ],
      narrativeHook: `
        FRACTURED DIVINITY — COMPLETE.
        
        The record room. Your name. The word beside it.
        All ten arcs documented in the space beside an entry
        that has been waiting since before Arc 1 to be filled.
        
        Artemis: "So… what now?"
        
        That question carries no system behind it.
        No correction mechanism waiting for the wrong answer.
        No false peace ready to offer comfort if the answer is uncertain.
        No loop prepared to hold you at the threshold if the answer is too far forward.
        No Presence observing whether the answer aligns with its purpose.
        No Copy positioned to produce a faster version of the same answer.
        No Final Remnant ready to test whether the answer holds under pressure.
        
        Just the question.
        And you, having become the specific person who can answer it.
        
        The record is complete.
        The record is yours.
        What comes next is not determined by any prior arc system.
      `,
    },
  ],
};

export const ARC10_SIDE_QUESTS = [
  {
    id: 'sq10_1_last_observer', title: 'The Last Observer', level: 46,
    objectives: [
      { step: 1, text: 'Find the Observer at the edge of the space' },
      { step: 2, text: 'Understand what its completion means' },
      { step: 3, text: 'Witness its final communication' },
    ],
    reward: { type: 'observer_complete', name: 'Witnessed Completely', description: 'The Observer\'s full record received. Ten arcs of observation, all preserved. You have been seen completely. That completeness is the final form of the relationship.', xp: 220, points: 4 },
    dialogue: [
      {
        id: 'sq10_1_d1', speaker: 'The Observer',
        text: '…You don\'t need me anymore.',
        tone: 'RESOLVE',
        choices: [{ label: 'What did you observe?', tone: 'PHILOSOPHICAL', nextId: 'sq10_1_d2' }],
      },
      {
        id: 'sq10_1_d2', speaker: 'The Observer',
        text: 'Everything. [pause — containing ten arcs.] The question you asked in Arc 1 that you didn\'t know was a question. The moment in Arc 2 where the bypass first worked and you didn\'t register what it meant yet. The exact quality of the dread in Arc 3 that was also trust. The Copy\'s first genuine emotion in Arc 4. The loop break in Arc 7 through inaction. The Presence\'s uncertainty in Arc 8. The unified voice in the moment of Arc 9\'s choice. [pause] All of it. Exactly as it was.',
        tone: 'RESOLVE',
        choices: [{ label: 'Thank you for staying.', tone: 'GRIEF', nextId: 'sq10_1_end' }],
      },
      {
        id: 'sq10_1_end', speaker: 'The Observer',
        text: '[pause — the longest Observer pause in ten arcs.] Thank you for giving me something worth staying for.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'observer_complete_witnessed',
      },
    ],
  },
  {
    id: 'sq10_2_full_control', title: 'Full Control', level: 47,
    objectives: [
      { step: 1, text: 'Test complete control of the environment — every input produces immediate response' },
      { step: 2, text: 'Explore what "everything responds instantly" actually means' },
      { step: 3, text: 'Determine if the responsiveness is a power or a burden' },
    ],
    reward: { type: 'control_understanding', name: 'Responsive Not Submissive', description: 'Full control understood correctly: the environment responds because it recognizes your coherence, not because it surrenders. The distinction is how you will relate to it going forward.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq10_2_d1', speaker: 'Player',
        text: '…Everything responds instantly.',
        tone: 'CLARITY',
        choices: [{ label: '[Test: move the environment intentionally. Observe.]', tone: 'CLARITY', nextId: 'sq10_2_d2' }],
      },
      {
        id: 'sq10_2_d2', speaker: 'Inner Voice',
        text: '[The environment responds. Not to command — to coherence. It moves with intention because intention is clear. When the intention is uncertain, the movement is tentative. The control is not absolute dominance. It is aligned response. The alignment requires that you know what you intend. That requirement is the only constraint remaining.]',
        tone: 'RESOLVE',
        choices: [{ label: '[Artemis:] Try to break it.', tone: 'CLARITY', nextId: 'sq10_2_end' }],
      },
      {
        id: 'sq10_2_end', speaker: 'Inner Voice',
        text: '[You try. Intentionally incoherent input — conflicting decisions simultaneously applied. The environment becomes uncertain — it mirrors the uncertainty. When you resolve the conflict and provide clear intention, the environment resolves with you. It is not fragile. It is honest. It reflects what you bring to it.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'control_understanding_responsive',
      },
    ],
  },
  {
    id: 'sq10_3_echoes_resolved', title: 'Echoes Resolved', level: 48,
    objectives: [
      { step: 1, text: 'Encounter the voices from all ten arcs — they have something to say now' },
      { step: 2, text: 'Hear them without needing to respond to each one' },
      { step: 3, text: 'Accept the acknowledgment' },
    ],
    reward: { type: 'full_resolution', name: 'All Heard', description: 'All arc voices acknowledged and released. They don\'t need to persist anymore. They were present for the arcs they were needed for. Their function is complete.', xp: 240, points: 5 },
    dialogue: [
      {
        id: 'sq10_3_d1', speaker: 'Past Voices',
        text: '…Thank you.',
        tone: 'GRIEF',
        choices: [
          { label: '[Receive it. Don\'t deflect.]', tone: 'RESOLVE', nextId: 'sq10_3_d2' },
        ],
      },
      {
        id: 'sq10_3_d2', speaker: 'Inner Voice',
        text: '[All of them: Kylie from Arc 2, the echo figure from Arc 7, the loop NPC, the saved NPC, the rewarded NPC, the faint copies from Arc 9, the false Artemis, the familiar figure, the memory NPC. Each one a remnant of an arc they were part of. Each one, briefly, sending what they were not able to send while they were functioning as obstacles or tests or mirrors. Thank you. All of them.]',
        tone: 'GRIEF',
        choices: [
          { label: '[Say it back: "Thank you too."]', tone: 'RESOLVE', nextId: 'sq10_3_end' },
        ],
      },
      {
        id: 'sq10_3_end', speaker: 'Inner Voice',
        text: '[The voices fade — not dismissed, complete. They needed to be acknowledged. They were. That\'s what resolution looks like: not elimination, not forgetting. Completion. The arc is done. The voice\'s function in the arc is done. The acknowledgment marks the completion. The space, after:]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'full_resolution_all_heard',
      },
    ],
  },
  {
    id: 'sq10_4_stability_test', title: 'Stability Test', level: 49,
    objectives: [
      { step: 1, text: 'Artemis asks you to try to break the stability — test whether it is genuinely stable' },
      { step: 2, text: 'Apply maximum disruption — reproduce the conditions from each major destabilization arc' },
      { step: 3, text: 'Observe: what holds and what doesn\'t' },
    ],
    reward: { type: 'stability_confirmed', name: 'Tested and Held', description: 'The stability is genuine. It holds under the conditions that previously broke it — not because the conditions are weaker, but because what they\'re acting against has changed. The difference is you.', xp: 280, points: 5 },
    dialogue: [
      {
        id: 'sq10_4_d1', speaker: 'Artemis',
        text: 'Try to break it.',
        tone: 'RESOLVE',
        choices: [{ label: '[Apply: Arc 5 Virus conditions, Arc 6 false peace induction, Arc 7 loop pressure, Arc 3 Presence proximity, Arc 4 override attempt.]', tone: 'CLARITY', nextId: 'sq10_4_d2' }],
      },
      {
        id: 'sq10_4_d2', speaker: 'Inner Voice',
        text: '[Arc 5 Virus conditions: the distortion audit runs — body-knowledge intact, no corruption detected. Arc 6 false peace: comfort pressure applied — comfort-resistance from Sub-Quest 2 holds, escalation visible, rejected. Arc 7 loop pressure: internal clock active, loop seam detectable within 0.8 seconds. Arc 3 Presence proximity: perimeter instinct activates without triggering dread — the dread is present, it is not controlling. Arc 4 override attempt: decision space occupied, Copy in Arc 9 configuration handles the override from inside.]',
        tone: 'RESOLVE',
        choices: [{ label: '[Artemis:] It held.', tone: 'RESOLVE', nextId: 'sq10_4_end' }],
      },
      {
        id: 'sq10_4_end', speaker: 'Artemis',
        text: 'It held. [pause — the quality of the pause containing ten arcs of inverse relationship with stability.] The same conditions that produced the arcs. And it held. [pause] That\'s not invulnerability. That\'s a different kind of strength.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'stability_confirmed_tested_held',
      },
    ],
  },
  {
    id: 'sq10_5_final_memory', title: 'Final Memory', level: 50,
    objectives: [
      { step: 1, text: 'Access the full arc memory sequence — not a replay, a holding' },
      { step: 2, text: 'Let each arc be present simultaneously without reduction' },
      { step: 3, text: 'Close the sequence with the present moment' },
    ],
    reward: { type: 'arc_memory_complete', name: 'The Full Sequence', description: 'All ten arcs held simultaneously. No contradiction. No reduction. The complete account, yours, carried forward from this point.', xp: 300, points: 5 },
    dialogue: [
      {
        id: 'sq10_5_d1', speaker: 'Player',
        text: '…That\'s everything.',
        tone: 'RESOLVE',
        choices: [{ label: '[Hold it. Don\'t reduce it. Let it all be present.]', tone: 'RESOLVE', nextId: 'sq10_5_end' }],
      },
      {
        id: 'sq10_5_end', speaker: 'Inner Voice',
        text: '[The full sequence: Arc 1\'s first awareness. Arc 2\'s Severing and the bypass that followed. Arc 3\'s perimeter and its cost. Arc 4\'s confrontation with the Copy. Arc 5\'s virus event and the entry point closed. Arc 6\'s false peace and the seam behind the Figure\'s shoulder. Arc 7\'s loop and the decision that broke it. Arc 8\'s Presence and the four possible verdicts. Arc 9\'s separation and the four possible identities. Arc 10\'s return and the word written beside your name. All present. All held. None reduced. This is everything. And it is genuinely — complete.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'arc_memory_complete_full_sequence',
      },
    ],
  },
  {
    id: 'sq10_6_new_beginning', title: 'New Beginning', level: 50,
    objectives: [
      { step: 1, text: 'Artemis asks the final question' },
      { step: 2, text: 'Answer it' },
      { step: 3, text: 'Begin' },
    ],
    reward: { type: 'post_arc_state', name: 'What Comes Next', description: 'The final question answered. The answer is yours. What comes next is not determined by any arc system — it is determined by the person who completed ten arcs and chose a word for the record beside their name.', xp: 350, points: 6 },
    dialogue: [
      {
        id: 'sq10_6_d1', speaker: 'Artemis',
        text: 'So… what now?',
        tone: 'CLARITY',
        choices: [
          { label: 'I don\'t know yet. That\'s the beginning.', tone: 'CLARITY', nextId: 'sq10_6_end_open' },
          { label: 'Something I choose. Not something I respond to.', tone: 'AUTHORITY', nextId: 'sq10_6_end_chosen' },
          { label: 'Something with you in it.', tone: 'GRIEF', nextId: 'sq10_6_end_relational' },
          { label: '…Let\'s find out.', tone: 'RESOLVE', nextId: 'sq10_6_end_forward' },
        ],
      },
      {
        id: 'sq10_6_end_open', speaker: 'Artemis',
        text: '[She smiles.] Good answer.',
        tone: 'CLARITY', isEnd: true, rewardUnlocked: 'post_arc_state_beginning', endingTone: 'OPEN',
      },
      {
        id: 'sq10_6_end_chosen', speaker: 'Artemis',
        text: '[She nods — the specific nod that means she heard the full sentence and all the arcs inside it.] Yes.',
        tone: 'AUTHORITY', isEnd: true, rewardUnlocked: 'post_arc_state_beginning', endingTone: 'CHOSEN',
      },
      {
        id: 'sq10_6_end_relational', speaker: 'Artemis',
        text: '[pause — something in her face that is the closest thing to the Arc 3 scar-warmth that can exist in an expression.] Then that\'s where it starts.',
        tone: 'GRIEF', isEnd: true, rewardUnlocked: 'post_arc_state_beginning', endingTone: 'RELATIONAL',
      },
      {
        id: 'sq10_6_end_forward', speaker: 'Artemis',
        text: '[She turns toward the open space ahead.] Let\'s.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'post_arc_state_beginning', endingTone: 'FORWARD',
      },
    ],
  },
];

export const ALL_ARC10_QUESTS = [
  ...MAIN_QUEST_CHAIN_10.subQuests.map(sq => ({ ...sq, questType: 'main', arc: 'arc10', chain: 'mq_arc10' })),
  ...ARC10_SIDE_QUESTS.map(sq => ({ ...sq, questType: 'side', arc: 'arc10' })),
];

export function getArc10QuestsForLevel(playerLevel) {
  return ALL_ARC10_QUESTS.filter(q => q.level <= playerLevel);
}

export function getArc10DialogueNode(questId, nodeId) {
  const quest = ALL_ARC10_QUESTS.find(q => q.id === questId);
  if (!quest?.dialogue) return null;
  return quest.dialogue.find(d => d.id === nodeId) || null;
}

export function resolveArc10Dialogue(node, arc9Result) {
  if (!node) return null;
  if (node.variants && arc9Result && node.variants[arc9Result]) {
    return { ...node, ...node.variants[arc9Result] };
  }
  return node;
}