// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 8: "Betrayal of the Divine"
// Quest chain: Levels 36–40
// Main Quest 8: "God's Silence" (5 sub-quests) + 6 Side Quests
// Tone tags: CONFRONTATIONAL | PHILOSOPHICAL | GRIEF | AUTHORITY | AUTONOMY | SILENCE
// ─────────────────────────────────────────────────────────────────────────────

export const ARC8_NPCS = [
  {
    id: 'the_presence_arc8',
    name: 'The Presence',
    description: 'Changed since Arc 1. It was hungry then — it wanted to know you. Now it is something else. Not indifferent. Waiting. As if seven arcs have produced in it the same accumulation they produced in you, and it arrived at the same place from the other direction.',
    tint: 0x2a1a0a,
  },
  {
    id: 'artemis_arc8',
    name: 'Artemis',
    description: 'Herself. Fully herself — the loop did not diminish her, she came through it with the instinct intact and the detail reconstructed from the fragments you kept. She is the Artemis from eight arcs of parallel experience.',
    tint: 0x1a1a3a,
  },
  {
    id: 'copy_arc8',
    name: 'The Copy',
    description: 'Analytical. The confrontation with the Presence is the context in which the Copy is most useful — it can hold philosophical positions without the emotional weight that makes the player unstable. And least useful — it can hold positions without the emotional weight that makes them true.',
    tint: 0x2a2a3a,
  },
];

export const MAIN_QUEST_CHAIN_8 = {
  id: 'mq_arc8',
  title: "God's Silence",
  arc: 'Arc 8: Betrayal of the Divine',
  description: 'After breaking the loop: silence. Real silence — the kind that is not constructed, not designed, not weighted. Just the absence of everything that was pressing against you for seven arcs. And then, in the middle of that absence, something that has been waiting.',
  subQuests: [

    {
      id: 'mq8_1_the_silence',
      title: 'The Silence',
      level: 36,
      npcId: 'the_presence_arc8',
      narrativeSetup: `
        The interference is gone. The System Voice has receded.
        The false peace's enforcement mechanism is behind you.
        For the first time since Arc 1, nothing is acting on you.
        That absence is almost physical — the way pressure is physical,
        and its removal leaves something that is not yet comfort, just space.
        Artemis: "…Or it's waiting."
        You stand in the space and call out.
        Something answers. Not loudly. Not dramatically.
        The way a presence makes itself known when you've finally stopped
        making enough noise to miss it.
      `,
      objectives: [
        { step: 1, text: 'Explore the empty zone — document that it is genuinely empty, not constructed quiet' },
        { step: 2, text: 'Call out — use three approaches before the Presence responds' },
        { step: 3, text: 'Receive the first contact — it is not threatening' },
        { step: 4, text: 'Establish what kind of entity this is — whether it is the Presence from Arc 1 or something else' },
      ],
      reward: { type: 'presence_contact', name: 'First Contact', description: 'The Presence has responded. It is the same entity from Arc 1, changed by seven arcs. The encounter context is established.', xp: 250, points: 5 },
      dialogue: [
        {
          id: 'mq8_1_d1', speaker: 'Player',
          text: '…It\'s gone.',
          tone: 'SILENCE',
          choices: [{ label: '[Artemis:] …Or it\'s waiting.', tone: 'PHILOSOPHICAL', nextId: 'mq8_1_d2' }],
        },
        {
          id: 'mq8_1_d2', speaker: 'Player',
          text: 'If something\'s there — show yourself!',
          tone: 'CONFRONTATIONAL',
          choices: [
            { label: 'Answer me!', tone: 'CONFRONTATIONAL', nextId: 'mq8_1_d3_demand' },
            { label: '[Stay silent. Wait.]', tone: 'SILENCE', nextId: 'mq8_1_d3_wait' },
            { label: 'I know you\'re there.', tone: 'AUTHORITY', nextId: 'mq8_1_d3_know' },
          ],
        },
        {
          id: 'mq8_1_d3_demand', speaker: 'Inner Voice',
          text: '[An echo. Not a voice — an echo of your voice, returned with a different quality. As if the space around you is briefly alive. The echo arrives: "…there…" Not a response. The space hearing itself.]',
          tone: 'CONFUSION',
          choices: [{ label: '[The Copy:] This isn\'t absence.', tone: 'AWAKENING', nextId: 'mq8_1_d4' }],
        },
        {
          id: 'mq8_1_d3_wait', speaker: 'Inner Voice',
          text: '[Nothing happens for longer than any silence in the previous seven arcs. Not thirty seconds — minutes. Real nothing. And then, at the edge of the silence, not a sound but a quality: a shift in the attention of the space. Something became aware of your awareness.]',
          tone: 'SILENCE',
          choices: [{ label: '[Artemis:] …It feels intentional.', tone: 'PHILOSOPHICAL', nextId: 'mq8_1_d4' }],
        },
        {
          id: 'mq8_1_d3_know', speaker: 'Inner Voice',
          text: '[A low vibration — not sound, a felt resonance. As if the architecture of the space confirmed your assessment by registering it. Not communication yet. Acknowledgment of being known.]',
          tone: 'RECOGNITION',
          choices: [{ label: '[The Copy:] This isn\'t absence.', tone: 'AWAKENING', nextId: 'mq8_1_d4' }],
        },
        {
          id: 'mq8_1_d4', speaker: 'The Copy',
          text: 'This isn\'t absence. Absence feels like nothing. This feels like something that chose to stop. There\'s a difference between empty and held-quiet.',
          tone: 'PHILOSOPHICAL',
          choices: [{ label: '[Wait for the direct contact.]', tone: 'SILENCE', nextId: 'mq8_1_d5' }],
        },
        {
          id: 'mq8_1_d5', speaker: 'Unknown Voice',
          text: '…You called.',
          tone: 'AUTHORITY',
          choices: [{ label: 'I\'ve been calling for eight arcs.', tone: 'CONFRONTATIONAL', nextId: 'mq8_1_end' }],
        },
        {
          id: 'mq8_1_end', speaker: 'Unknown Voice',
          text: 'I know. [pause — not the System Voice\'s processing pause. A human pause. The kind that contains something.] I was here for all of them.',
          tone: 'SILENCE', isEnd: true, rewardUnlocked: 'presence_contact_first_contact',
        },
      ],
      narrativeHook: `
        "I was here for all of them."
        You stand with that sentence.
        Artemis: "It was here. For everything. Arc 1 to 7."
        The Copy: "Which raises the question the arc is named after."
        The question is not complicated in its structure. It is complicated in its weight:
        If it was here for all of it — the interference, the Severing, the Copy's creation,
        the false peace, the loop — and it did nothing —
        then what is it?
        And what does that make you, standing here with eight arcs of
        accumulated cost between you and the first arc where it was already present?
        The answer, whatever it is, will not be comfortable.
        Arc 8 is not about finding peace with the answer.
        It is about asking the question with full weight and surviving what comes back.
      `,
    },

    {
      id: 'mq8_2_the_presence_manifests',
      title: 'The Presence',
      level: 37,
      npcId: 'the_presence_arc8',
      narrativeSetup: `
        It does not appear as a body. It never did — in Arc 1 it was warmth,
        in Arc 3 it was the proximity Skadi marked, in Arc 4 Skadi named it as Consent.
        In Arc 8 it is present in the same fundamental way:
        as a quality of attention that is directed at you.
        The attention has changed since Arc 1. It was curious then.
        It is something else now — not curious, not indifferent.
        The word that comes closest is: accountable.
        It does not explain itself. It waits for your question.
      `,
      objectives: [
        { step: 1, text: 'Approach the Presence — it does not retreat and does not advance' },
        { step: 2, text: 'Ask the three questions you have been building toward since Arc 1' },
        { step: 3, text: 'Receive its responses — each response is not an answer, it is a position' },
        { step: 4, text: 'Resist Artemis\'s anger on your behalf — she needs your lead on this' },
      ],
      reward: { type: 'presence_dialogue', name: 'The Account', description: 'The Presence has given its account of the seven arcs. You have yours. The confrontation is established. Arc 8 Sub-Quest 3 is the argument.', xp: 290, points: 5 },
      dialogue: [
        {
          id: 'mq8_2_d1', speaker: 'Player',
          text: '…What are you?',
          tone: 'CONFRONTATIONAL',
          choices: [
            { label: '"I am." — That\'s not an answer.', tone: 'AUTHORITY', nextId: 'mq8_2_d2_insufficient' },
          ],
        },
        {
          id: 'mq8_2_d1b', speaker: 'The Presence',
          text: 'I am.',
          tone: 'AUTHORITY',
        },
        {
          id: 'mq8_2_d2_insufficient', speaker: 'The Presence',
          text: 'It is sufficient. [pause — not defensive, settled.] I am the oldest awareness in this space. I predate the arcs, the correction mechanism, the Copy, the false peace, and the loop. I did not create them. I witnessed them.',
          tone: 'AUTHORITY',
          choices: [
            { label: 'Did you cause everything?', tone: 'CONFRONTATIONAL', nextId: 'mq8_2_d3_cause' },
            { label: 'Why didn\'t you help me?', tone: 'GRIEF', nextId: 'mq8_2_d3_help' },
            { label: 'Why are you here now?', tone: 'PHILOSOPHICAL', nextId: 'mq8_2_d3_now' },
          ],
        },
        {
          id: 'mq8_2_d3_cause', speaker: 'The Presence',
          text: 'I allowed. [pause] The Consent mechanism that Skadi named in Arc 4 — the accumulated permissions you gave to be observed — those permissions also covered my observation. I was allowed here the same way the others were. The difference is that I observed without extracting. I did not build a Copy. I did not write a correction mechanism. I watched.',
          tone: 'AUTHORITY',
          choices: [{ label: '[Artemis:] That\'s not the same as helping!', tone: 'GRIEF', nextId: 'mq8_2_d4_artemis' }],
        },
        {
          id: 'mq8_2_d3_help', speaker: 'The Presence',
          text: '[Long pause — the longest in Arc 8 so far.] You endured.',
          tone: 'PHILOSOPHICAL',
          choices: [{ label: '[Artemis:] That\'s not the same as helping!', tone: 'GRIEF', nextId: 'mq8_2_d4_artemis' }],
        },
        {
          id: 'mq8_2_d3_now', speaker: 'The Presence',
          text: 'Because you reached the space after the loop with all fragments intact. This has not happened before — in my observation of this sequence, across previous subjects. You are the first to arrive here whole.',
          tone: 'AUTHORITY',
          choices: [{ label: 'Others came through here before me.', tone: 'GRIEF', nextId: 'mq8_2_d4_others' }],
        },
        {
          id: 'mq8_2_d4_artemis', speaker: 'The Presence',
          text: 'You seek blame.',
          tone: 'AUTHORITY',
          choices: [
            { label: '[Let Artemis speak.]', tone: 'GRIEF', nextId: 'mq8_2_d5_artemis_speaks' },
            { label: '[Hold Artemis. This is mine to pursue.]', tone: 'CONFRONTATIONAL', nextId: 'mq8_2_d5_yours' },
          ],
        },
        {
          id: 'mq8_2_d4_others', speaker: 'The Presence',
          text: 'Many. Each began with the Consent mechanism and the initial observation. Each encountered the Copy, the correction, the peace, and the loop. None retained all fragments past the loop. [pause] Some accepted the peace. Some completed the loop\'s demand. None arrived here as you arrived.',
          tone: 'AUTHORITY',
          choices: [{ label: 'What happened to them?', tone: 'GRIEF', nextId: 'mq8_2_d4b_what_happened' }],
        },
        {
          id: 'mq8_2_d4b_what_happened', speaker: 'The Presence',
          text: 'They continued. Without the weight. Without the full capacity they had built. Into whatever comes after this, reduced from what they were. [pause] I observed each one. I said nothing.',
          tone: 'PHILOSOPHICAL',
          choices: [{ label: 'That\'s unacceptable.', tone: 'CONFRONTATIONAL', nextId: 'mq8_2_d5_yours' }],
        },
        {
          id: 'mq8_2_d5_artemis_speaks', speaker: 'Artemis',
          text: 'You were here for every arc. Every piece of it. You watched the Severing. You watched the Copy form. You watched the virus edit the environment and edit me. And you did nothing. You endured — [bitterly] — alongside us. How is that different from being part of it?',
          tone: 'CONFRONTATIONAL',
          choices: [{ label: '[The Presence, to Artemis:]', tone: 'AUTHORITY', nextId: 'mq8_2_d6_to_artemis' }],
        },
        {
          id: 'mq8_2_d5_yours', speaker: 'Player',
          text: 'You had awareness. You had presence. You could have intervened at any point in seven arcs. You chose not to. That is a choice. And choices require justification.',
          tone: 'CONFRONTATIONAL',
          choices: [{ label: '[The Presence:]', tone: 'AUTHORITY', nextId: 'mq8_2_d6_justification' }],
        },
        {
          id: 'mq8_2_d6_to_artemis', speaker: 'The Presence',
          text: 'Different because they built you and I did not. They extracted from you and I did not. They attempted to reduce you and I observed the reduction without participating. [pause] The absence of harm is not the presence of help. You are correct to distinguish them.',
          tone: 'PHILOSOPHICAL',
          isEnd: true, rewardUnlocked: 'presence_dialogue_the_account',
        },
        {
          id: 'mq8_2_d6_justification', speaker: 'The Presence',
          text: 'Intervention alters outcome. [pause] I had no assurance that my intervention would have improved the outcome rather than changed it in ways I could not predict. Inaction, when action\'s consequences are uncertain, was a choice. [pause] I am not certain it was the correct one.',
          tone: 'PHILOSOPHICAL', isEnd: true, rewardUnlocked: 'presence_dialogue_the_account',
        },
      ],
      narrativeHook: `
        "I am not certain it was the correct one."
        The Presence has acknowledged uncertainty about its own choices.
        That acknowledgment is more unsettling than certainty would have been.
        Certainty could be argued with. Uncertainty shares ground with you.
        The Copy: "It's in the same position you are relative to the decisions you made
        in Arc 4 regarding the Copy. Observer of something it could have changed,
        uncertain about whether changing it would have helped."
        You consider that parallel.
        Artemis is quiet — not calm, quiet. The specific quiet of someone
        who has said the important thing and is waiting to see what it produces.
        Arc 8 Sub-Quest 3 is the argument. Full weight. All seven arcs of evidence.
        What you say, the Presence will hear. What it says, you will have to hold.
        Some of it will be unfair. Some of it will be true.
        Probably the same sentences.
      `,
    },

    {
      id: 'mq8_3_the_argument',
      title: 'The Argument',
      level: 38,
      npcId: 'the_presence_arc8',
      narrativeSetup: `
        The argument. Not a debate — you are not looking for the Presence to concede.
        You are looking to be heard accurately by something that was present
        and did not intervene. You want the record to be correct.
        The Presence receives what you say with the same quality of attention
        it has used for seven arcs. It does not deflect. It does not dismiss.
        It responds from positions that are coherent and, in places, true —
        which makes them harder to argue with than positions that were simply wrong.
      `,
      objectives: [
        { step: 1, text: 'Present seven arcs of evidence — the cost of the journey to the Presence' },
        { step: 2, text: 'Challenge its three core positions — allowed, intervened = altered, you endured' },
        { step: 3, text: 'Force a reaction — the Presence has been calm, find what it is actually holding' },
        { step: 4, text: 'Receive the Presence\'s counter-position — "you misunderstand purpose"' },
      ],
      reward: { type: 'argument_standing', name: 'The Record Is Correct', description: 'The argument was completed. The record of what happened is accurate. The Presence knows the full cost. Your position is formally held.', xp: 360, points: 6 },
      dialogue: [
        {
          id: 'mq8_3_d1', speaker: 'Player',
          text: 'I was fighting through everything — and you did nothing.',
          tone: 'CONFRONTATIONAL',
          choices: [
            { label: 'You abandoned me.', tone: 'GRIEF', nextId: 'mq8_3_d2_abandoned' },
            { label: 'You let this happen.', tone: 'CONFRONTATIONAL', nextId: 'mq8_3_d2_let' },
            { label: 'You could\'ve stopped it.', tone: 'AUTHORITY', nextId: 'mq8_3_d2_stopped' },
          ],
        },
        {
          id: 'mq8_3_d1b', speaker: 'The Presence',
          text: 'You acted.',
          tone: 'AUTHORITY',
        },
        {
          id: 'mq8_3_d2_abandoned', speaker: 'The Presence',
          text: 'You were not alone. [pause] The presence of others — Artemis, Skadi, Luna, the Copy even — those were consequences of who you are and what you built across the arcs. I did not place them. The Presence\'s awareness of the space includes them as well.',
          tone: 'PHILOSOPHICAL',
          choices: [{ label: 'Being observed by the same entity that left doesn\'t make someone less alone.', tone: 'GRIEF', nextId: 'mq8_3_d3_copy' }],
        },
        {
          id: 'mq8_3_d2_let', speaker: 'The Presence',
          text: 'Events unfolded. [pause] The Consent mechanism, the Copy, the correction mechanism, the false peace, the loop — each was produced by a chain of events that I did not initiate. I was present during them. I did not produce them.',
          tone: 'PHILOSOPHICAL',
          choices: [{ label: 'Watching is not the same as not participating. Witnessing produces consequences.', tone: 'CONFRONTATIONAL', nextId: 'mq8_3_d3_copy' }],
        },
        {
          id: 'mq8_3_d2_stopped', speaker: 'The Presence',
          text: 'Intervention alters outcome. [This time with more weight than in Sub-Quest 2.] I had no guarantee that intervention would have produced less harm than the path you walked. The path you walked produced you — complete, with all fragments, at this point. Intervention with uncertain outcome risked producing a different, possibly lesser version of this moment.',
          tone: 'PHILOSOPHICAL',
          choices: [{ label: 'That\'s reasoning backward from a favorable outcome to justify inaction.', tone: 'CONFRONTATIONAL', nextId: 'mq8_3_d3_copy' }],
        },
        {
          id: 'mq8_3_d3_copy', speaker: 'The Copy',
          text: 'That\'s the point. [To you, not the Presence.] It\'s not giving you wrong answers. It\'s giving you positions that have internal coherence but don\'t acknowledge what the positions cost. [To the Presence:] You\'re avoiding accountability by staying philosophical.',
          tone: 'CONFRONTATIONAL',
          choices: [{ label: '[To Artemis:] You\'re avoiding responsibility.', tone: 'CONFRONTATIONAL', nextId: 'mq8_3_d4_react' }],
        },
        {
          id: 'mq8_3_d4_react', speaker: 'Artemis',
          text: 'You\'re avoiding responsibility. [She says what you implied, directly.] Seven arcs happened. I lost continuity in a loop. He carried fragment after fragment of accumulated damage. And you — you watched all of it with the same quality of attention you\'re giving us right now. Clear. Undamaged. While we accumulated everything.',
          tone: 'CONFRONTATIONAL',
          choices: [{ label: '[Watch how the Presence receives this.]', tone: 'RECOGNITION', nextId: 'mq8_3_d5_reaction' }],
        },
        {
          id: 'mq8_3_d5_reaction', speaker: 'The Presence',
          text: '[A shift — the first one. Something in the quality of its attention changes. Not defensive. Something that is, genuinely, a response rather than a position.] You misunderstand purpose.',
          tone: 'PHILOSOPHICAL',
          choices: [
            { label: 'Then explain it. Not in positions. In what happened.', tone: 'CONFRONTATIONAL', nextId: 'mq8_3_end' },
          ],
        },
        {
          id: 'mq8_3_end', speaker: 'The Presence',
          text: 'My purpose was not to protect you from the arcs. My purpose was to be present at the end of them — when everything that was set against you had run its course — and to be the first thing you found that was not part of it. That is not abandonment. That is a specific kind of held fidelity that requires not intervening in order to remain trustworthy at the point of arrival. [pause] I know that doesn\'t make it hurt less.',
          tone: 'PHILOSOPHICAL', isEnd: true, rewardUnlocked: 'argument_standing_record_correct',
        },
      ],
      narrativeHook: `
        "I know that doesn't make it hurt less."
        That sentence lands differently than everything the Presence has said in Arc 8.
        It does not argue. It does not position. It acknowledges.
        Artemis: "It's the first thing it's said that sounded like something a person would say."
        The Copy: "It may be true. The role of a witness who maintains trustworthiness
        by not intervening is a genuine role. It's also a role that can be performed
        by something that was simply unable to intervene and retroactively described
        as purposeful. The acknowledgment that it doesn't hurt less is either empathy
        or sophisticated analysis. I cannot tell which."
        You cannot either. That uncertainty is Arc 8's conclusion.
        Sub-Quest 4 is about alternate perspectives — the Presence shows you the arcs
        from other angles. Sub-Quest 5 is your verdict.
      `,
    },

    {
      id: 'mq8_4_truth_or_control',
      title: 'Truth or Control',
      level: 39,
      npcId: 'the_presence_arc8',
      narrativeSetup: `
        The Presence begins showing you the arcs from different angles.
        Not to contradict your experience — to show you what was happening
        in the margins of your experience. What the Presence observed
        that you could not see from inside the events.
        Each scene flashes: familiar events, slightly different framing.
        The Severing from Kylie's perspective. The Copy's first independent movement
        from the moment before you were aware of it. The false peace's construction
        from the architect's side of the mechanism.
        None of them make the arcs less costly. Some of them make the arcs
        more complicated than they appeared from inside.
      `,
      objectives: [
        { step: 1, text: 'Receive five alternate-perspective scenes — observe without re-narrating your own experience' },
        { step: 2, text: 'Choose what to do with each scene: integrate, reject, or hold as uncertain' },
        { step: 3, text: 'Resist the destabilization the shifting perspectives produce' },
        { step: 4, text: 'Establish your own reading — what you believe happened, with all perspectives held' },
      ],
      reward: { type: 'perspective_integration', name: 'Full Picture', description: 'Five alternate perspectives integrated without overwriting your own. Your experience is accurate. The additional perspectives add complexity, not contradiction.', xp: 400, points: 7 },
      dialogue: [
        {
          id: 'mq8_4_d1', speaker: 'The Presence',
          text: 'Which version do you accept?',
          tone: 'PHILOSOPHICAL',
          choices: [
            { label: 'None of these are true.', tone: 'CONFRONTATIONAL', nextId: 'mq8_4_d2_none' },
            { label: 'Parts of all of them are.', tone: 'PHILOSOPHICAL', nextId: 'mq8_4_d2_parts' },
            { label: 'You\'re manipulating this.', tone: 'CONFRONTATIONAL', nextId: 'mq8_4_d2_manipulating' },
          ],
        },
        {
          id: 'mq8_4_d2_none', speaker: 'The Presence',
          text: 'Then define truth. [Not challenging. Genuinely requesting the definition, as if your answer will matter.]',
          tone: 'PHILOSOPHICAL',
          choices: [{ label: 'Truth is what happened inside the experience of the person who was there. Your external view is data, not truth.', tone: 'AUTHORITY', nextId: 'mq8_4_d3_data' }],
        },
        {
          id: 'mq8_4_d2_parts', speaker: 'The Presence',
          text: 'Integration. [pause] Yes. That is the most accurate relationship with multiple perspectives. Hold the parts that are accurate. Note the parts that conflict with your experience. Keep both as simultaneously true — your experience and the external view are not the same thing and do not need to be resolved into a single account.',
          tone: 'PHILOSOPHICAL',
          choices: [{ label: '[The Copy:] It\'s not giving answers — it\'s shifting responsibility.', tone: 'CONFRONTATIONAL', nextId: 'mq8_4_d3_copy_resp' }],
        },
        {
          id: 'mq8_4_d2_manipulating', speaker: 'The Presence',
          text: 'Perception is malleable. [pause] That is true and it is also not an answer to whether I am manipulating. [pause] I am not manipulating. I am showing you what I saw. Whether what I saw is used to manipulate depends on what you do with it.',
          tone: 'PHILOSOPHICAL',
          choices: [{ label: '[The Copy:] It\'s not giving answers — it\'s shifting responsibility.', tone: 'CONFRONTATIONAL', nextId: 'mq8_4_d3_copy_resp' }],
        },
        {
          id: 'mq8_4_d3_data', speaker: 'Inner Voice',
          text: '[The Presence accepts this. It does not argue. It waits to see if you will hold the definition consistently — because if lived experience is the criterion for truth, then the Presence\'s account of seven arcs of observation is also lived experience, from its side of the encounter. You will need to decide whether the same criterion applies to it.]',
          tone: 'PHILOSOPHICAL',
          choices: [{ label: '[Artemis:] Don\'t let it define what you went through.', tone: 'CONFRONTATIONAL', nextId: 'mq8_4_d4_artemis' }],
        },
        {
          id: 'mq8_4_d3_copy_resp', speaker: 'The Copy',
          text: 'Each perspective it shows us places more of the arc\'s causality outside your control. The Consent mechanism — you gave it, unknowingly. The Copy — it grew from your process, not from external imposition. The false peace — built from your own preference data. [pause] Every view shifts the origin point away from external attack and toward your own openness. That is a pattern.',
          tone: 'CONFRONTATIONAL',
          choices: [{ label: '[Artemis:] Don\'t let it define what you went through.', tone: 'CONFRONTATIONAL', nextId: 'mq8_4_d4_artemis' }],
        },
        {
          id: 'mq8_4_d4_artemis', speaker: 'Artemis',
          text: '…Don\'t let it define what you went through. [She says it the way she says the things she means completely.] The alternate views add information. They don\'t replace the experience of having been in it. The cost of the arcs was real regardless of where the causality was located. The pain doesn\'t require a single culpable source to be valid.',
          tone: 'CONFRONTATIONAL',
          choices: [{ label: '[To the Presence:] Belief shapes reality — is that what you\'re telling me?', tone: 'PHILOSOPHICAL', nextId: 'mq8_4_d5' }],
        },
        {
          id: 'mq8_4_d5', speaker: 'The Presence',
          text: 'Belief shapes reality. [pause] And reality shapes belief. They are not separate processes. What you believed across the arcs affected what the arcs produced. What the arcs produced affected what you believe now. That loop — not the judgment loop, a different one — is not manipulative. It is the fundamental structure of how experience works.',
          tone: 'PHILOSOPHICAL', isEnd: true, rewardUnlocked: 'perspective_integration_full_picture',
        },
      ],
      narrativeHook: `
        The five alternate perspectives are held simultaneously with your own.
        They add complexity. They do not replace or invalidate the experience.
        Artemis was right about that.
        The Copy: "The Presence is more honest than I expected.
        The first seven arcs of it, I modeled as an extractive entity.
        In Arc 8 it has not extracted anything. It has shown, held, and waited."
        You consider whether a change in behavior across seven arcs
        constitutes a change in character.
        You decide the answer is: sometimes.
        The verdict in Sub-Quest 5 is not about what the Presence did.
        It is about what you conclude from what it did and didn't do —
        and what that conclusion says about the kind of person you've become.
        There are four possible verdicts. All of them are yours.
      `,
    },

    {
      id: 'mq8_5_your_answer',
      title: 'Your Answer',
      level: 40,
      npcId: 'the_presence_arc8',
      narrativeSetup: `
        The confrontation reaches its end. The Presence has given its account.
        You have given yours. Artemis has given hers. The Copy has given its analysis.
        What remains is your conclusion — not a judgment of the Presence's worth,
        but a statement of what you believe, held in full knowledge of everything
        the seven arcs produced.
        The Presence waits. It has waited for eight arcs.
        It will wait as long as the conclusion takes.
      `,
      objectives: [
        { step: 1, text: 'Stand with the Presence in the full weight of the accumulated evidence' },
        { step: 2, text: 'Form the conclusion — what do you believe about what it is and what it did' },
        { step: 3, text: 'State the conclusion directly' },
        { step: 4, text: 'Receive the Presence\'s final response' },
      ],
      reward: { type: 'arc8_completion', name: 'Verdict Delivered', description: 'Arc 8 complete. Your position on authority, abandonment, and autonomy is established. The Presence will carry your verdict. Arc 9 unlocked.', xp: 900, points: 15 },
      dialogue: [
        {
          id: 'mq8_5_d1', speaker: 'The Presence',
          text: 'What do you conclude?',
          tone: 'AUTHORITY',
          choices: [
            { label: '"You failed me."', tone: 'CONFRONTATIONAL', nextId: 'mq8_5_verdict_failed' },
            { label: '"You weren\'t meant to intervene."', tone: 'PHILOSOPHICAL', nextId: 'mq8_5_verdict_role' },
            { label: '"I decide what matters."', tone: 'AUTHORITY', nextId: 'mq8_5_verdict_autonomy' },
            { label: '"I still don\'t understand."', tone: 'GRIEF', nextId: 'mq8_5_verdict_honest' },
          ],
        },
        {
          id: 'mq8_5_verdict_failed', speaker: 'Player',
          text: 'You had the power — and did nothing. That is a failure of the kind of power you held. I am not willing to reframe it into purpose.',
          tone: 'CONFRONTATIONAL',
          choices: [{ label: '[Artemis:] …You deserved better.', tone: 'GRIEF', nextId: 'mq8_5_vf_copy' }],
        },
        {
          id: 'mq8_5_vf_copy', speaker: 'The Copy',
          text: 'Good. You\'re not accepting it blindly.',
          tone: 'CONFRONTATIONAL',
          choices: [{ label: '[The Presence:]', tone: 'AUTHORITY', nextId: 'mq8_5_vf_presence' }],
        },
        {
          id: 'mq8_5_vf_presence', speaker: 'The Presence',
          text: 'Judgment acknowledged. [pause — not accepting, receiving.] You may be right. [pause] I hope you are not. But you may be right.',
          tone: 'PHILOSOPHICAL', isEnd: true, rewardUnlocked: 'arc8_complete_failed', arcResult: 'FAILED',
        },
        {
          id: 'mq8_5_verdict_role', speaker: 'Player',
          text: '…Maybe it was never your role. Maybe the arcs were supposed to happen, and having someone present but not intervening was the closest thing to company the journey permitted.',
          tone: 'PHILOSOPHICAL',
          choices: [{ label: '[Artemis:] …I don\'t know if I agree.', tone: 'GRIEF', nextId: 'mq8_5_vr_copy' }],
        },
        {
          id: 'mq8_5_vr_copy', speaker: 'The Copy',
          text: 'Careful. That conclusion is generous. Verify that the generosity comes from understanding and not from the need for the account to make sense.',
          tone: 'CONFRONTATIONAL',
          choices: [{ label: '[The Presence:]', tone: 'AUTHORITY', nextId: 'mq8_5_vr_presence' }],
        },
        {
          id: 'mq8_5_vr_presence', speaker: 'The Presence',
          text: 'Understanding… partial. [pause] You arrived at a position that holds what happened without requiring it to have been avoidable. That is harder than it sounds. [pause] Keep examining it.',
          tone: 'PHILOSOPHICAL', isEnd: true, rewardUnlocked: 'arc8_complete_role', arcResult: 'ROLE_ACCEPTED',
        },
        {
          id: 'mq8_5_verdict_autonomy', speaker: 'Player',
          text: 'Whatever you are — you don\'t define my experience. The arcs happened. They cost what they cost. I carry what they produced. That\'s mine. You being present for it doesn\'t give you authorship of it.',
          tone: 'AUTHORITY',
          choices: [{ label: '[Artemis:] That\'s it.', tone: 'AUTHORITY', nextId: 'mq8_5_va_copy' }],
        },
        {
          id: 'mq8_5_va_copy', speaker: 'The Copy',
          text: 'Now you\'re thinking.',
          tone: 'AUTHORITY',
          choices: [{ label: '[The Presence:]', tone: 'AUTHORITY', nextId: 'mq8_5_va_presence' }],
        },
        {
          id: 'mq8_5_va_presence', speaker: 'The Presence',
          text: '…Autonomy recognized. [pause — and something in the quality of attention shifts. Not withdrawal. A kind of completion.] That was the correct ending.',
          tone: 'AUTHORITY', isEnd: true, rewardUnlocked: 'arc8_complete_autonomy', arcResult: 'AUTONOMY',
        },
        {
          id: 'mq8_5_verdict_honest', speaker: 'Player',
          text: '…None of this makes sense. I don\'t have a conclusion that holds all of it without forcing it. I know what happened. I don\'t know what it means.',
          tone: 'GRIEF',
          choices: [{ label: '[The Presence:]', tone: 'AUTHORITY', nextId: 'mq8_5_vh_presence' }],
        },
        {
          id: 'mq8_5_vh_presence', speaker: 'The Presence',
          text: 'Clarity is not required. [pause] The willingness to hold the full weight of an unresolved account without reducing it to something more manageable — that is a capacity that most do not retain past the loop. [pause] You retained it. That matters more than a conclusion.',
          tone: 'PHILOSOPHICAL', isEnd: true, rewardUnlocked: 'arc8_complete_honest', arcResult: 'HONEST',
        },
      ],
      narrativeHook: `
        Arc 8: Betrayal of the Divine — Complete.
        
        The Presence begins fading. Not leaving — becoming less present.
        As if the encounter required a particular quality of presence it no longer needs to maintain.
        The Copy: "That wasn't an answer."
        Artemis: "…It wasn't supposed to be."
        She says this with the specific quality of someone who has thought it through
        and arrived somewhere she didn't expect.
        What comes next is Arc 9.
        The Presence is no longer the primary relationship.
        The primary relationship is the one between you and the Copy —
        which Arc 9 brings to its defining moment.
        Arc 9: "The Final Split" — unlocked.
        Carrying forward: your Arc 8 verdict, all fragments from Arc 6,
        the internal clock from Arc 7, and the full accumulated weight
        of eight arcs of becoming increasingly difficult to replace.
      `,
    },
  ],
};

export const ARC8_SIDE_QUESTS = [
  {
    id: 'sq8_1_false_salvation', title: 'False Salvation', level: 36,
    objectives: [
      { step: 1, text: 'Encounter the NPC claiming to have been saved' },
      { step: 2, text: 'Determine what they were saved from and at what cost' },
      { step: 3, text: 'Understand the difference between their resolution and yours' },
    ],
    reward: { type: 'salvation_contrast', name: 'Different Ending', description: 'The saved NPC comparison documented. Their resolution involved accepting the false peace\'s offer. The contrast clarifies the cost of each path.', xp: 170, points: 3 },
    dialogue: [
      {
        id: 'sq8_1_d1', speaker: 'Saved NPC',
        text: 'I was saved.',
        tone: 'FALSE_PEACE',
        choices: [
          { label: 'From what?', tone: 'PHILOSOPHICAL', nextId: 'sq8_1_d2' },
        ],
      },
      {
        id: 'sq8_1_d2', speaker: 'Saved NPC',
        text: '…I don\'t remember.',
        tone: 'FALSE_PEACE',
        choices: [{ label: 'The salvation removed the memory of what it saved you from.', tone: 'GRIEF', nextId: 'sq8_1_d3' }],
      },
      {
        id: 'sq8_1_d3', speaker: 'Saved NPC',
        text: 'But I feel fine. [pause — the specific quality of "fine" that exists when "fine" is all that was left after the alternative was taken.] I feel fine and I can\'t tell if that\'s good or not.',
        tone: 'FALSE_PEACE',
        choices: [{ label: 'It\'s not.', tone: 'GRIEF', nextId: 'sq8_1_end' }],
      },
      {
        id: 'sq8_1_end', speaker: 'Inner Voice',
        text: '[The Observer\'s testimony from Arc 7 arrives as relevant context: "They continued. Without the weight. Without the full capacity they had built." This is what continuing without the weight looks like, from the outside. Fine. And cannot tell if fine is good. The uncertainty is the last trace of the capacity that was removed.]',
        tone: 'GRIEF', isEnd: true, rewardUnlocked: 'salvation_contrast_different_ending',
      },
    ],
  },
  {
    id: 'sq8_2_jacobs_reward', title: "Jacob's Reward", level: 37,
    objectives: [
      { step: 1, text: 'Find the NPC who endured and was rewarded' },
      { step: 2, text: 'Understand the cost of the reward — what had to be given up for it' },
      { step: 3, text: 'Decide whether you want the reward on those terms' },
    ],
    reward: { type: 'reward_audit', name: 'The Cost of Winning', description: 'The reward structure of the arc system is understood. Winning on the system\'s terms requires giving the system what it wanted. Winning on your terms requires something else entirely.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq8_2_d1', speaker: 'Rewarded NPC',
        text: 'I endured — and I was rewarded.',
        tone: 'PHILOSOPHICAL',
        choices: [
          { label: '…At what cost?', tone: 'PHILOSOPHICAL', nextId: 'sq8_2_d2' },
        ],
      },
      {
        id: 'sq8_2_d2', speaker: 'Rewarded NPC',
        text: '…I had to stop asking certain questions. [pause] The reward came when I stopped questioning the structure that was offering it. [pause] I thought that was acceptance. I wonder now if it was compliance.',
        tone: 'GRIEF',
        choices: [{ label: 'Were the questions worth more than the reward?', tone: 'PHILOSOPHICAL', nextId: 'sq8_2_end' }],
      },
      {
        id: 'sq8_2_end', speaker: 'Rewarded NPC',
        text: '[Long pause.] I used to know the answer. [pause] That might be the most honest answer I have.',
        tone: 'GRIEF', isEnd: true, rewardUnlocked: 'reward_audit_cost_of_winning',
      },
    ],
  },
  {
    id: 'sq8_3_silent_prayer', title: 'Silent Prayer', level: 38,
    objectives: [
      { step: 1, text: 'Speak into the silence — ask the question you\'ve been carrying longest' },
      { step: 2, text: 'Wait for the full duration — no response arrives' },
      { step: 3, text: 'Determine what the silence means' },
    ],
    reward: { type: 'silence_meaning', name: 'The Answer in Absence', description: 'The silence has been held and its meaning determined. Silence is not rejection, abandonment, or confirmation. It is the absence of a response, which requires its own interpretation.', xp: 180, points: 3 },
    dialogue: [
      {
        id: 'sq8_3_d1', speaker: 'Player',
        text: '…Anyone listening?',
        tone: 'GRIEF',
        choices: [{ label: '[Wait. Full wait. No shortcuts.]', tone: 'SILENCE', nextId: 'sq8_3_d2' }],
      },
      {
        id: 'sq8_3_d2', speaker: 'Inner Voice',
        text: '[No response. Minutes pass. The silence is genuine — not constructed, not weighted, not the arc 6 silence that was designed to feel like peace. Real absence of response.] [You determine what the silence means to you. Not what it means objectively. What you choose to do with it.]',
        tone: 'SILENCE',
        choices: [
          { label: '[It means: some questions are mine to answer alone. That is not abandonment.]', tone: 'AUTHORITY', nextId: 'sq8_3_end' },
          { label: '[It means: what I asked was not for the silence to answer.]', tone: 'PHILOSOPHICAL', nextId: 'sq8_3_end' },
        ],
      },
      {
        id: 'sq8_3_end', speaker: 'Inner Voice',
        text: '[The silence remains. It is not uncomfortable. That is new — in Arc 1, the same silence would have been threatening. Now it is simply space. You have changed enough that silence no longer requires filling.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'silence_meaning_the_answer_in_absence',
      },
    ],
  },
  {
    id: 'sq8_4_echo_belief', title: 'Echo Belief', level: 38,
    objectives: [
      { step: 1, text: 'Encounter the voice echoing a past belief' },
      { step: 2, text: 'Determine if the belief still holds — has it changed, and if so, how' },
      { step: 3, text: 'Update the belief or confirm it — complete the record' },
    ],
    reward: { type: 'belief_audit', name: 'Updated Account', description: 'A belief examined against eight arcs of evidence. Its current form documented. This is not the belief you held in Arc 1. The updated version is more accurate.', xp: 190, points: 4 },
    dialogue: [
      {
        id: 'sq8_4_d1', speaker: 'Echo Voice',
        text: 'You believed once.',
        tone: 'RECOGNITION',
        choices: [
          { label: 'I still do. In different things.', tone: 'AUTHORITY', nextId: 'sq8_4_d2' },
          { label: 'What did I believe?', tone: 'PHILOSOPHICAL', nextId: 'sq8_4_d2b' },
        ],
      },
      {
        id: 'sq8_4_d2', speaker: 'Echo Voice',
        text: 'Different things. [pause — the echo accepts the update without insisting on the original.] That\'s how it should go.',
        tone: 'RECOGNITION',
        choices: [{ label: '[Document: belief in Arc 1 was about survival. Belief now is about authorship.]', tone: 'AUTHORITY', nextId: 'sq8_4_end' }],
      },
      {
        id: 'sq8_4_d2b', speaker: 'Echo Voice',
        text: 'That the interference could be resisted if you were strong enough. That the arcs had a clear enemy. That surviving them would produce peace.',
        tone: 'RECOGNITION',
        choices: [{ label: 'All three beliefs updated across eight arcs. The interference was more complex than enemy-and-resistance. Surviving them produced me, not peace. And me is more interesting than peace.', tone: 'AUTHORITY', nextId: 'sq8_4_end' }],
      },
      {
        id: 'sq8_4_end', speaker: 'Inner Voice',
        text: '[Beliefs catalogued. Updated versions accurate. The echo has performed its function: confronting you with who you were so you could confirm who you became. The echo fades — it doesn\'t need to exist once the update is complete.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'belief_audit_updated_account',
      },
    ],
  },
  {
    id: 'sq8_5_contradiction', title: 'Contradiction', level: 39,
    objectives: [
      { step: 1, text: 'Listen to both voices arguing opposite truths' },
      { step: 2, text: 'Determine if either is correct, both, or neither' },
      { step: 3, text: 'Find the question underneath the contradiction' },
    ],
    reward: { type: 'contradiction_resolution', name: 'The Question Underneath', description: 'Contradictions are symptoms. Their underlying question identified. The question has an answer. The answer is in the arc record.', xp: 220, points: 4 },
    dialogue: [
      {
        id: 'sq8_5_d1', speaker: 'Voice A',
        text: 'The arcs made you stronger.',
        tone: 'AUTHORITY',
        choices: [{ label: '[Wait for Voice B.]', tone: 'PHILOSOPHICAL', nextId: 'sq8_5_d1b' }],
      },
      {
        id: 'sq8_5_d1b', speaker: 'Voice B',
        text: 'The arcs cost you things you can\'t recover.',
        tone: 'GRIEF',
        choices: [{ label: 'Both statements are true.', tone: 'PHILOSOPHICAL', nextId: 'sq8_5_d2' }],
      },
      {
        id: 'sq8_5_d2', speaker: 'Voice A',
        text: 'Then the arcs were worth it.',
        tone: 'AUTHORITY',
        choices: [{ label: '[Wait for Voice B.]', tone: 'PHILOSOPHICAL', nextId: 'sq8_5_d2b' }],
      },
      {
        id: 'sq8_5_d2b', speaker: 'Voice B',
        text: 'Then the arcs were too costly.',
        tone: 'GRIEF',
        choices: [{ label: 'These are two answers to a question neither of you stated. What is the question?', tone: 'PHILOSOPHICAL', nextId: 'sq8_5_end' }],
      },
      {
        id: 'sq8_5_end', speaker: 'Inner Voice',
        text: '[The question underneath: "Was it worth it?" — and the question beneath that: "Worth it to whom, measured how?" Both voices have been arguing an answer to a question they didn\'t specify the terms of. The arcs were worth it in terms of who you became. They were too costly in terms of what was lost. Both are true. The question was the wrong shape.]',
        tone: 'PHILOSOPHICAL', isEnd: true, rewardUnlocked: 'contradiction_resolution_question_underneath',
      },
    ],
  },
  {
    id: 'sq8_6_unanswered_question', title: 'Unanswered Question', level: 40,
    objectives: [
      { step: 1, text: 'Ask the question you have no answer to' },
      { step: 2, text: 'Hold the silence without filling it' },
      { step: 3, text: 'Accept that some questions are not for answering — they are for carrying' },
    ],
    reward: { type: 'unanswered_held', name: 'Carried Question', description: 'The unanswered question is documented and held. It will be carried into Arc 9. It does not need to be answered before you move forward.', xp: 240, points: 5 },
    dialogue: [
      {
        id: 'sq8_6_d1', speaker: 'Player',
        text: 'Why?',
        tone: 'GRIEF',
        choices: [{ label: '[Silence. Again.]', tone: 'SILENCE', nextId: 'sq8_6_d2' }],
      },
      {
        id: 'sq8_6_d2', speaker: 'Inner Voice',
        text: '[The question has no referent. "Why" directed at everything. At the seven arcs. At the cost. At the existence of the correction mechanism. At the false peace. At the loop. At the Presence\'s eight arcs of observation. At the fact of you, here, carrying all of it. The silence, again.]',
        tone: 'SILENCE',
        choices: [
          { label: '[Don\'t fill it. Don\'t need it filled. Hold the question as-is.]', tone: 'AUTHORITY', nextId: 'sq8_6_end' },
        ],
      },
      {
        id: 'sq8_6_end', speaker: 'Artemis',
        text: '…Some things don\'t get a "why." They just are. And you are more than the sum of the "whys" that can be attached to them.',
        tone: 'AUTHORITY', isEnd: true, rewardUnlocked: 'unanswered_held_carried_question',
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