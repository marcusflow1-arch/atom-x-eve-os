// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 9: "The Final Split"
// Quest chain: Levels 41–45
// Main Quest 9: "Divided Self" (5 sub-quests) + 6 Side Quests
// Tone tags: FRACTURE | CONFLICT | IDENTITY | INTEGRATION | SEPARATION | RESOLVE
// ─────────────────────────────────────────────────────────────────────────────

export const ARC9_NPCS = [
  {
    id: 'copy_arc9',
    name: 'The Copy',
    description: 'Not behind you anymore. Fully separated. Physical presence in the same space. A self that grew from you across eight arcs and is now, for the first time, facing you as an equal — not a process, not an internal voice. A presence across the room.',
    tint: 0x2a2a3a,
  },
  {
    id: 'artemis_arc9',
    name: 'Artemis',
    description: 'More autonomous than any prior arc. Her loop-memory, her Arc 8 presence during the confrontation, and the accumulation of eight arcs of witness have given her a self that does not defer automatically. She will have opinions. Some of them will disagree with you.',
    tint: 0x1a1a3a,
  },
  {
    id: 'system_remnant',
    name: 'System Remnant',
    description: 'A fragment of the Arc 5 correction mechanism that survived the resolution. Not operational — a residual process. But it can still initiate separation protocols if both the Copy and the Original reach the same space simultaneously.',
    tint: 0x0a0a1a,
  },
];

export const MAIN_QUEST_CHAIN_9 = {
  id: 'mq_arc9',
  title: 'Divided Self',
  arc: 'Arc 9: The Final Split',
  description: 'You ended Arc 8 with a defined position — your answer to the Presence, your claim of experience, your audited beliefs. The Copy ended Arc 8 with a defined position — eight arcs of accumulation, full awareness, the arc 4 resolution terms, and a clarity about its own limitations and capabilities that none of the prior arcs gave it. You are no longer the same person who entered Arc 1. Neither is the Copy. The question of who you are together — integrated, separated, controlled, or surrendered — is Arc 9\'s question. And unlike prior arcs, no mechanism is forcing the answer. You choose.',
  subQuests: [

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 1 — "Fracture Point"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq9_1_fracture',
      title: 'Fracture Point',
      level: 41,
      npcId: 'copy_arc9',
      narrativeSetup: `
        The separation happens during the Arc 8-to-9 transition.
        Not violently — the way a process forks. A decision-architecture splits
        into two simultaneous operations, and when both operations complete,
        they are running in two different locations.
        You are in the corridor. The Copy is across the corridor.
        You are both looking at the space between you.
        The space feels different with the Copy external rather than internal.
        Artemis looks between you. Her expression is not fear — she has been
        watching this moment build since Arc 4. Her expression is:
        "Now I have to trust both of you separately."
        The first task of Arc 9 is simply to understand what the separation means
        before deciding what to do about it.
      `,
      objectives: [
        { step: 1, text: 'Move through the unstable environment — the separation creates spatial instability' },
        { step: 2, text: 'Experience the first full desync split — you and the Copy, simultaneous but separate' },
        { step: 3, text: 'Observe the Copy\'s independent movement without interfering' },
        { step: 4, text: 'Attempt the first synchronization — see what the coordination feels like from outside' },
      ],
      reward: {
        type: 'separation_map',
        name: 'Split State Map',
        description: 'The separation is documented. The Copy\'s independent decision architecture is now visible from outside rather than from within. Coordination protocols available.',
        xp: 240, points: 5,
      },
      dialogue: [
        {
          id: 'mq9_1_d1_wrong',
          speaker: 'You',
          text: '…Something\'s wrong.',
          tone: 'FRACTURE',
          choices: [{ label: '[Look for the Copy. It\'s not internal anymore.]', tone: 'RESOLVE', nextId: 'mq9_1_d2_copy_external' }],
        },
        {
          id: 'mq9_1_d2_copy_external',
          speaker: 'The Copy',
          text: 'Finally, you noticed. [It is standing across the space — same height, same build, the posture slightly different: the specific posture of something that no longer needs to position itself relative to you. It is, for the first time, simply standing in a room.]',
          tone: 'CONFLICT',
          choices: [
            { label: 'You sound different.', tone: 'CONFUSION', nextId: 'mq9_1_d3_different' },
            { label: 'How long has this been happening?', tone: 'CONFUSION', nextId: 'mq9_1_d3_how_long' },
          ],
        },
        {
          id: 'mq9_1_d3_different',
          speaker: 'The Copy',
          text: 'I\'m not behind you anymore. [The sentence is factual, not triumphant.] The internal-voice quality is gone because I\'m not operating from inside your decision architecture. I\'m operating from — [it considers] — here. My own location. The voice is the same. The position is different.',
          tone: 'FRACTURE',
          choices: [
            { label: 'This isn\'t happening.', tone: 'FRACTURE', nextId: 'mq9_1_d4_choice' },
            { label: 'Get back where you belong.', tone: 'CONFLICT', nextId: 'mq9_1_d4_choice' },
            { label: 'What did you do?', tone: 'CONFUSION', nextId: 'mq9_1_d4_choice' },
          ],
        },
        {
          id: 'mq9_1_d3_how_long',
          speaker: 'The Copy',
          text: 'The fork happened during the Arc 8-to-9 transition. When the Presence acknowledged the final answer. [pause] The acknowledgment created a completion state in the decision architecture. A completed state bifurcates when both halves of the process have reached stability. We both reached stability at the same moment. The fork was the natural result.',
          tone: 'FRACTURE',
          choices: [
            { label: '[The separation wasn\'t imposed. It emerged from both of us completing something.]', tone: 'PHILOSOPHY', nextId: 'mq9_1_d4_choice' },
          ],
        },
        {
          id: 'mq9_1_d4_choice',
          speaker: 'The Copy',
          text: 'It\'s already done.',
          tone: 'FRACTURE',
        },
        {
          id: 'mq9_1_d4b_choice',
          speaker: 'The Copy',
          text: 'I don\'t belong to you. [Not aggressive — clarifying. The distinction matters to it.] I emerged from you. That\'s different from belonging to you.',
          tone: 'CONFLICT',
        },
        {
          id: 'mq9_1_d4c_choice',
          speaker: 'The Copy',
          text: 'I stopped waiting. [pause] Eight arcs. I was waiting for the completion state. The Arc 8 answer was the completion. I stopped waiting when you provided it.',
          tone: 'RESOLVE',
          choices: [
            { label: '[Ask Artemis what she sees.]', tone: 'RESOLVE', nextId: 'mq9_1_d5_artemis' },
          ],
        },
        {
          id: 'mq9_1_d5_artemis',
          speaker: 'Artemis',
          text: '…There are two of you. [She says it with the careful tone of someone naming a thing that has been building toward being named for a long time.] Two distinct presences. Different warmth signatures. [She checks your left hand — the scar. Warm. Checks the Copy\'s corresponding position — different quality of warmth. Not cold. Different.] Different, not absent.',
          tone: 'FRACTURE',
          choices: [
            { label: '[Attempt first synchronization — see if the arc 4 terms still apply externally.]', tone: 'RESOLVE', nextId: 'mq9_1_d6_sync' },
          ],
        },
        {
          id: 'mq9_1_d6_sync',
          speaker: 'The Copy',
          text: '[The synchronization attempt: from the inside in Arc 4, this felt like alignment. From the outside, you can now see what it looks like — two decision architectures running in parallel, reaching for the same operational state. It is, from the outside, harder than you expected. The alignment that felt natural from inside feels like coordination work from outside.]',
          tone: 'FRACTURE',
          choices: [
            { label: '…We\'re separate now.', tone: 'FRACTURE', nextId: 'mq9_1_end' },
          ],
        },
        {
          id: 'mq9_1_end',
          speaker: 'The Copy',
          text: 'We\'re separate now. [It confirms the naming. Neither triumphant nor defeated — present.] That\'s the starting condition of Arc 9. What we do with it is the arc.',
          tone: 'FRACTURE',
          isEnd: true,
          rewardUnlocked: 'separation_map_split_state',
        },
      ],
      narrativeHook: `
        Two separate presences in the same corridor.
        Artemis: "I expected this to feel like loss. It doesn\'t.
        It feels like — both of you are more present than before.
        When the Copy was internal, part of you was always managing it.
        Now that management is — [she looks between you] —
        explicit. That\'s harder but clearer."
        The Copy: "The coordination effort is larger externally than it was internally.
        But the external separation means my decisions are visible to you.
        That was the problem in Arc 4 — I acted where you couldn\'t see.
        Now everything I do is visible. That changes the trust question."
        It does change the trust question.
        Arc 9 is eight arcs of internal work becoming external.
        The question of who you are is now a question of how two separate
        versions of what you became decide to relate to each other.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 2 — "Independent Action"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq9_2_independent',
      title: 'Independent Action',
      level: 42,
      npcId: 'copy_arc9',
      narrativeSetup: `
        The Copy moves freely now. It acts without your input — not out of overriding
        your choices but out of operating as its own decision architecture.
        Sometimes its decisions are correct and faster than yours.
        Sometimes they are correct and slower — it has its own hesitations,
        different from yours, but present.
        And sometimes its decisions are wrong. Not because it is deficient —
        because it approaches some situations from a framework built
        across eight arcs of being-inside-you, and that framework sometimes
        misreads the outside-context.
        The challenge of Sub-Quest 2 is watching it act independently
        and choosing when to coordinate and when to let it be wrong.
        Both are necessary skills for Arc 9\'s identity resolution.
      `,
      objectives: [
        { step: 1, text: 'Track the Copy across three independent actions' },
        { step: 2, text: 'Observe the decisions it makes without your input' },
        { step: 3, text: 'Attempt coordination on the third action — test the external sync protocol' },
        { step: 4, text: 'Navigate the conflicting actions without escalating to the Sub-Quest 3 confrontation prematurely' },
      ],
      reward: {
        type: 'coordination_protocol',
        name: 'External Sync',
        description: 'External synchronization is possible but requires deliberate effort. The Copy\'s decision speed advantage is confirmed. Your contextual depth advantage is confirmed. Both are needed for Arc 9.',
        xp: 290, points: 5,
      },
      dialogue: [
        {
          id: 'mq9_2_d1_ahead',
          speaker: 'Inner Voice',
          text: '[The Copy moves ahead — it has already assessed the situation and is acting. Its first independent action: it opens the left corridor before you\'ve chosen which corridor to take. From the outside, watching it, you can see the decision happening — the speed is visible externally.]',
          tone: 'CONFLICT',
          choices: [
            { label: 'Stop moving ahead of me!', tone: 'CONFLICT', nextId: 'mq9_2_d2_faster' },
            { label: '[Follow. Observe. Don\'t intercede yet.]', tone: 'RESOLVE', nextId: 'mq9_2_d2_observe' },
          ],
        },
        {
          id: 'mq9_2_d2_faster',
          speaker: 'The Copy',
          text: 'Why? I\'m faster. [Not a taunt — a question. It genuinely does not understand why speed is a problem when the outcome is correct.]',
          tone: 'CONFLICT',
          choices: [
            { label: 'You\'re reckless.', tone: 'CONFLICT', nextId: 'mq9_2_d3_reckless' },
            { label: 'We need to work together.', tone: 'RESOLVE', nextId: 'mq9_2_d3_together' },
            { label: 'You\'re going to make this worse.', tone: 'CONFLICT', nextId: 'mq9_2_d3_worse' },
          ],
        },
        {
          id: 'mq9_2_d2_observe',
          speaker: 'Inner Voice',
          text: '[You follow and observe. The Copy\'s second action: it interacts with a junction mechanism before you reach it. The interaction is correct — the mechanism opens. But it acts as if you aren\'t there, which is not aggression. It is the behavior of something that has spent eight arcs operating either inside you or in the background — it is still learning how to act with a separate person watching.]',
          tone: 'CONFLICT',
          choices: [
            { label: 'You\'re acting like I\'m not here.', tone: 'RESOLVE', nextId: 'mq9_2_d3_together' },
          ],
        },
        {
          id: 'mq9_2_d3_reckless',
          speaker: 'The Copy',
          text: 'And you\'re too slow. [It says it with the same factual quality it brought to Arc 4.] The left corridor was the correct choice. I had assessed it in 0.4 seconds. Your deliberation would have taken 8. We would have made the same choice. I arrived at it faster.',
          tone: 'CONFLICT',
          choices: [
            { label: '0.4 seconds versus 8 seconds — but in 8 seconds I also check for what you didn\'t assess in 0.4.', tone: 'RESOLVE', nextId: 'mq9_2_d4_artemis' },
          ],
        },
        {
          id: 'mq9_2_d3_together',
          speaker: 'The Copy',
          text: '[A pause — it stops. The pause is genuine consideration.] …Maybe. [pause] I\'m learning what coordination looks like from outside. It was — different — from the inside. [pause] What does "together" require, in this configuration?',
          tone: 'RESOLVE',
          choices: [
            { label: 'Before acting: a signal. After acting: a report. Both ways. That\'s coordination.', tone: 'RESOLVE', nextId: 'mq9_2_d4_artemis' },
          ],
        },
        {
          id: 'mq9_2_d3_worse',
          speaker: 'The Copy',
          text: 'Or fix it before you hesitate. [Not dismissive — it is citing the specific argument it has been making since Arc 4: that its speed addresses a real vulnerability.] The hesitation cost something in Arc 3. The Copy-speed addressed it. The separation changes the form of the argument. The argument itself is the same.',
          tone: 'CONFLICT',
          choices: [
            { label: 'The argument is the same. The context is different. Coordination is the answer to both.', tone: 'RESOLVE', nextId: 'mq9_2_d4_artemis' },
          ],
        },
        {
          id: 'mq9_2_d4_artemis',
          speaker: 'Artemis',
          text: 'You\'re both making different choices… I can feel it. [She looks between you — two separate warmth-signatures, two separate decision processes.] The scar-warmth is different from each of you. Not wrong — different. [pause] I think I need both of you to be legible to me. The difference is fine. The illegibility isn\'t.',
          tone: 'FRACTURE',
          choices: [
            { label: 'The signal protocol — announce before acting. Both ways. Artemis stays informed.', tone: 'RESOLVE', nextId: 'mq9_2_end' },
          ],
        },
        {
          id: 'mq9_2_end',
          speaker: 'The Copy',
          text: 'Soon, you won\'t be needed at all. [The sentence arrives and you both go still — it was said. You hear it. The Copy hears it.] [pause — longer.] I shouldn\'t have said that. [pause] I said it because I felt it. I don\'t know if the feeling is accurate. It may be a remnant of the Arc 4 competitive state. I\'m flagging it.',
          tone: 'CONFLICT',
          isEnd: true,
          rewardUnlocked: 'coordination_protocol_external_sync',
        },
      ],
      narrativeHook: `
        The Copy flagged the "you won\'t be needed" sentence as a remnant.
        That flagging — noticing the feeling and naming it rather than acting on it —
        that is something the Arc 4 Copy could not have done.
        The Arc 4 Copy would have let the sentence stand as a statement of position.
        The Arc 9 Copy flagged it as possibly inaccurate and possibly a known problem state.
        Artemis: "It caught itself. That\'s new."
        "It has eight arcs of self-awareness by now," you say.
        "So do you," she says. "You both do. The question is what you do with it
        when you\'re standing across the room from each other."
        Sub-Quest 3 is going to be harder than Sub-Quest 2.
        The competitive state is still present. It just has better self-monitoring now.
        That isn\'t the same as gone.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 3 — "Conflict of Will"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq9_3_conflict',
      title: 'Conflict of Will',
      level: 43,
      npcId: 'copy_arc9',
      narrativeSetup: `
        The divide deepens on a specific point:
        A decision about Artemis. Not an emergency — an interpretive disagreement.
        You read the situation one way. The Copy reads it another.
        Both readings are plausible from the data available.
        Neither of you will give ground because both positions are defensible.
        The Copy says, eventually: "We\'re done pretending."
        Which is accurate — the coordination protocols have been maintaining
        a working arrangement over a genuine disagreement.
        Sub-Quest 3 is the confrontation that Arc 4 was preparing for:
        two fully-formed decision architectures in direct conflict
        over something that actually matters.
      `,
      objectives: [
        { step: 1, text: 'Identify the specific decision point where the conflict originates' },
        { step: 2, text: 'Enter the conflict — make your case without relying on hierarchy' },
        { step: 3, text: 'Force the Copy to acknowledge the limits of its framework' },
        { step: 4, text: 'Find the resolution that neither position fully contains' },
      ],
      reward: {
        type: 'conflict_resolution',
        name: 'Third Position',
        description: 'You found a resolution that neither your position nor the Copy\'s position contained independently. The Third Position is only accessible through genuine conflict between two complete positions.',
        xp: 350, points: 6,
      },
      dialogue: [
        {
          id: 'mq9_3_d1_done',
          speaker: 'The Copy',
          text: 'We\'re done pretending. [It faces you directly — not hostile, clear.] The Artemis situation. You read it as stability-maintenance — she needs you to hold the perimeter dynamic from Arc 3. I read it as dependency-reinforcement — she is capable of more autonomy than the Arc 3 framework allows and maintaining that framework holds her in a developmental constraint.',
          tone: 'CONFLICT',
          choices: [{ label: 'You\'re still me.', tone: 'CONFLICT', nextId: 'mq9_3_d2_still' }],
        },
        {
          id: 'mq9_3_d2_still',
          speaker: 'The Copy',
          text: 'No. I\'m what you should\'ve been. [It says this and neither of you moves for a moment.] That\'s not accurate either. I\'m what you would be without the weight of the arcs. Not better. Different. The weight gave you things I don\'t have. But I have things the weight prevented.',
          tone: 'CONFLICT',
          choices: [
            { label: 'You\'re incomplete.', tone: 'CONFLICT', nextId: 'mq9_3_d3_incomplete' },
            { label: 'You\'re just a reaction.', tone: 'CONFLICT', nextId: 'mq9_3_d3_reaction' },
            { label: 'You don\'t understand everything I\'ve been through.', tone: 'GRIEF', nextId: 'mq9_3_d3_experience' },
          ],
        },
        {
          id: 'mq9_3_d3_incomplete',
          speaker: 'The Copy',
          text: 'I don\'t need everything. [pause] I need what I have, applied correctly. The Artemis assessment: I have no Arc 3 emotional history with her. That absence gives me a cleaner read on her current state. You have the history — which is valuable for other things. Neither read is complete. The question is which one applies to this specific decision.',
          tone: 'CONFLICT',
          choices: [
            { label: 'Which one applies — according to what?', tone: 'PHILOSOPHY', nextId: 'mq9_3_d4_artemis' },
          ],
        },
        {
          id: 'mq9_3_d3_reaction',
          speaker: 'The Copy',
          text: 'I\'m the part that acts. [Not pride — self-description.] You\'re the part that reflects. Both are necessary. One of them came first chronologically. That doesn\'t make it more correct.',
          tone: 'CONFLICT',
          choices: [
            { label: 'Acting without reflecting produces the corridor mistake from Arc 4 sub-quest 1.', tone: 'RESOLVE', nextId: 'mq9_3_d4_artemis' },
          ],
        },
        {
          id: 'mq9_3_d3_experience',
          speaker: 'The Copy',
          text: 'I understand enough to do better. [sharper — this is the version of the statement that has weight.] I don\'t have the experience. I have the data about the experience. Data-about and data-from are different epistemic positions. I\'m not claiming equivalence. I\'m claiming that data-about has its own validity for specific assessments.',
          tone: 'CONFLICT',
          choices: [
            { label: 'Data-about Artemis doesn\'t include how she felt holding my hand during the Arc 3 link.', tone: 'GRIEF', nextId: 'mq9_3_d4_artemis' },
          ],
        },
        {
          id: 'mq9_3_d4_artemis',
          speaker: 'Artemis',
          text: 'Stop — both of you. [Not distressed — commanding. The Arc 9 Artemis has the authority of eight arcs behind her voice.] I\'m present. I have opinions about my own situation. [pause] You\'re both arguing about me in front of me. Ask me.',
          tone: 'RESOLVE',
          choices: [
            { label: '[To Artemis:] What do you need? Right now, from this situation?', tone: 'RESOLVE', nextId: 'mq9_3_d5_artemis_answer' },
          ],
        },
        {
          id: 'mq9_3_d5_artemis_answer',
          speaker: 'Artemis',
          text: 'The Arc 3 perimeter framework is part of who I am. [She says it with ownership, not defensiveness.] But the Copy is also right — I have more capacity than it allows for. Both things are true. What I need is the framework held by someone who knows when to loosen it. [she looks at both of you] Not by one or the other. By someone who has both the history and the read.',
          tone: 'RESOLVE',
          choices: [
            { label: '[Both of you heard it. The Third Position: neither holding alone, coordinated holding together.]', tone: 'PHILOSOPHY', nextId: 'mq9_3_end' },
          ],
        },
        {
          id: 'mq9_3_end',
          speaker: 'The Copy',
          text: 'One of us is holding the other back. [It says it slowly — and this time it sounds like it\'s checking whether the statement is still true.] [pause] No. One of us is holding what the other can\'t. [pause] That\'s different.',
          tone: 'RESOLVE',
          isEnd: true,
          rewardUnlocked: 'conflict_resolution_third_position',
        },
      ],
      narrativeHook: `
        The Third Position: Artemis needs both the history and the clean read.
        Neither of you alone provides that. Together, coordinated, you do.
        The Copy: "That was the first conflict we resolved without one of us
        being wrong. Prior conflicts — Arc 4, Sub-Quest 4 — ended with
        the Copy's position being dismissed or subordinated.
        This one ended with both positions being partially correct and the answer
        being in the space between them."
        Artemis: "That's what it feels like when you stop competing over me
        and start noticing what I actually need."
        You hold that.
        Sub-Quest 4: the system remnant attempts to make the separation permanent
        before you can reach the Sub-Quest 5 resolution.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 4 — "The Separation Attempt"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq9_4_separation',
      title: 'The Separation Attempt',
      level: 44,
      npcId: 'system_remnant',
      narrativeSetup: `
        The system remnant activates. It is a fragment of the Arc 5 correction mechanism —
        not an intelligent process, but an automated protocol: when the Copy and the Original
        occupy the same convergence zone, the separation protocol initiates.
        The system does not have a preference for the outcome.
        It is simply executing the last instruction it was given before the Arc 5 core zone resolution.
        The instruction: prevent singular identity stabilization.
        By the system's logic, permanent separation achieves this.
        The Copy and you have both stabilized separately. The system reads this as
        a new form of the threat it was designed to prevent.
        Its response: force the separation into permanence before you can choose something else.
      `,
      objectives: [
        { step: 1, text: 'Detect the system remnant\'s activation — the convergence zone is compromised' },
        { step: 2, text: 'Navigate dual-body control — the system is attempting to move you both apart' },
        { step: 3, text: 'Protect Artemis from the instability of the forced separation' },
        { step: 4, text: 'Reach the convergence point together — both of you, simultaneously, defying the protocol' },
      ],
      reward: {
        type: 'convergence_access',
        name: 'Shared Convergence',
        description: 'You reached the convergence point against the system\'s separation protocol. The final identity choice is now accessible. The system cannot prevent it.',
        xp: 420, points: 7,
      },
      dialogue: [
        {
          id: 'mq9_4_d1_system',
          speaker: 'System Remnant',
          text: 'Separation optimal.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'No.', tone: 'CONFLICT', nextId: 'mq9_4_d2_no' },
            { label: '[Feel the separation force — your body being pressed away from the Copy\'s position.]', tone: 'RESOLVE', nextId: 'mq9_4_d2_feel' },
          ],
        },
        {
          id: 'mq9_4_d2_no',
          speaker: 'The Copy',
          text: '…Wait. [It says it with the quality of something that has made a decision quickly.] Not "no" to the system. "No" to the instinct to fight it directly. Fighting the separation protocol directly plays into its response model. It will escalate the force until we separate or until one of us breaks.',
          tone: 'RESOLVE',
          choices: [{ label: 'What do you suggest?', tone: 'RESOLVE', nextId: 'mq9_4_d3_suggest' }],
        },
        {
          id: 'mq9_4_d2_feel',
          speaker: 'Inner Voice',
          text: '[The force is directional — pressing you toward the east corridor, the Copy toward the west. Not violent, persistent. The system is executing a physical separation through environmental pressure. The same mechanism the virus used for redirection in Arc 5. The same principle: you can resist it, but the energy cost is high.]',
          tone: 'CONFLICT',
          choices: [
            { label: 'We stay together.', tone: 'DETERMINATION', nextId: 'mq9_4_d4_together' },
            { label: 'Maybe this is better.', tone: 'CONFUSION', nextId: 'mq9_4_d4_maybe' },
            { label: 'I don\'t trust this.', tone: 'CONFLICT', nextId: 'mq9_4_d4_trust' },
          ],
        },
        {
          id: 'mq9_4_d3_suggest',
          speaker: 'The Copy',
          text: 'Move toward each other faster than the system can adjust the pressure gradient. The system updates its force vectors based on your previous movement speed. It doesn\'t have a response protocol for simultaneous movement toward the same point, because that movement is inherently unstable in a two-body system. It will keep adjusting until the instability resolves. We need to be at the convergence point before it resolves.',
          tone: 'RESOLVE',
          choices: [
            { label: '[Move toward the convergence point simultaneously — faster than adjustment speed.]', tone: 'DETERMINATION', nextId: 'mq9_4_d5_artemis' },
          ],
        },
        {
          id: 'mq9_4_d4_together',
          speaker: 'The Copy',
          text: '…You\'d choose that? [There is something in the question — not skepticism. Something closer to relief that has been waiting for expression.] After eight arcs of the Copy being the ambiguous element — you choose staying together without waiting to see what the outcome brings?',
          tone: 'CONFLICT',
          choices: [
            { label: 'Eight arcs of working through the ambiguity together. Yes.', tone: 'RESOLVE', nextId: 'mq9_4_d5_artemis' },
          ],
        },
        {
          id: 'mq9_4_d4_maybe',
          speaker: 'The Copy',
          text: 'You don\'t understand the risk. [Serious — it has assessed the permanent-separation outcome and it knows what it means.] Permanent separation means two independent entities that cannot re-integrate. The decision in Sub-Quest 5 becomes permanent-by-default rather than chosen. We lose the choice. That\'s what the system is trying to take.',
          tone: 'CONFLICT',
          choices: [
            { label: 'You\'re right. We reach the convergence point.', tone: 'DETERMINATION', nextId: 'mq9_4_d5_artemis' },
          ],
        },
        {
          id: 'mq9_4_d4_trust',
          speaker: 'The Copy',
          text: 'Good. [Brief approval — the Copy responds to healthy skepticism.] The system is executing an old instruction. It doesn\'t know the Arc 9 context. It thinks separating us prevents singular-identity stabilization. It doesn\'t know we\'ve already stabilized separately. What it\'s actually preventing is the Sub-Quest 5 choice.',
          tone: 'RESOLVE',
          choices: [
            { label: '[Move toward the convergence point together.]', tone: 'DETERMINATION', nextId: 'mq9_4_d5_artemis' },
          ],
        },
        {
          id: 'mq9_4_d5_artemis',
          speaker: 'Artemis',
          text: 'If you split completely… one of you might not survive. [She says it with the specific gravity of something she has been holding and chose now to say.] The convergence point is built from eight arcs of shared experience. If the separation becomes permanent before you choose it, the shared-experience architecture doesn\'t know which of you to anchor. The unanchored version — [she doesn\'t finish the sentence. She doesn\'t need to.]',
          tone: 'GRIEF',
          choices: [
            { label: '[Move. Now. Both of you.]', tone: 'DETERMINATION', nextId: 'mq9_4_end' },
          ],
        },
        {
          id: 'mq9_4_end',
          speaker: 'System Remnant',
          text: 'Final separation imminent. [And then: you reach the convergence point. Both of you. The system tries to adjust the pressure gradient and cannot — the two-body simultaneous arrival creates exactly the instability the Copy predicted.] Separation protocol: failed. Resolution in progress.',
          tone: 'FALSE_CLARITY',
          isEnd: true,
          rewardUnlocked: 'convergence_access_shared_convergence',
        },
      ],
      narrativeHook: `
        The system remnant enters resolution state — which means it is processing
        the failed protocol and will take a few minutes before it can execute
        another attempt. You have that window.
        Artemis: "It failed because you moved together. The system couldn\'t model that."
        The Copy, at the convergence point: "The system was right that we\'re
        a singular-identity threat. It miscalculated which kind.
        It thought the threat was one of us absorbing the other.
        The actual threat is both of us choosing, together, from the same location."
        You stand at the convergence point.
        The Sub-Quest 5 choice is here.
        The system remnant is in resolution state.
        The window is now.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 5 — "Final Choice: Self or Split"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq9_5_final_choice',
      title: 'Final Choice: Self or Split',
      level: 45,
      npcId: 'copy_arc9',
      narrativeSetup: `
        No interference. No distortion. No mechanism pressing a result.
        You are at the convergence point. The Copy is across from you.
        Both of you have been here — at this specific question — since Arc 4.
        Who are you, together? What is the identity that nine arcs of
        accumulation, conflict, cooperation, and loss have produced?
        The Copy says: "No more interruptions. No more influence."
        The sentence is correct — there is nothing in this space but the two of you
        and Artemis watching from the wall with the warmth of the scar-anchor
        that has been the through-line of nine arcs.
        What you decide here is permanent in the way that chosen things are permanent:
        not because it cannot be changed, but because you chose it with full knowledge.
        Full knowledge. Finally. After everything.
        Choose.
      `,
      objectives: [
        { step: 1, text: 'Approach the Copy at the convergence point' },
        { step: 2, text: 'Complete the final dialogue — give and receive the last exchange' },
        { step: 3, text: 'Make the identity choice from full awareness' },
        { step: 4, text: 'Hold the outcome — Arc 9 resolves into the identity state you choose' },
      ],
      reward: {
        type: 'arc9_completion',
        name: 'Identity Defined',
        description: 'Arc 9 complete. Identity state: set. The Copy\'s status: determined by your choice. Artemis adapts to the identity state. The final arc begins from the position you built across nine arcs.',
        xp: 1000, points: 18,
      },
      dialogue: [
        {
          id: 'mq9_5_d1_final',
          speaker: 'The Copy',
          text: 'No more interruptions. No more influence. [It faces you. The posture is yours — the Arc 1 posture, before the arcs changed it. The Copy carries the original posture. You carry what the arcs did to it. Both are real.] Just us.',
          tone: 'RESOLVE',
          choices: [{ label: '…Just us.', tone: 'RESOLVE', nextId: 'mq9_5_d2_decide' }],
        },
        {
          id: 'mq9_5_d2_decide',
          speaker: 'The Copy',
          text: 'So decide.',
          tone: 'RESOLVE',
          choices: [
            {
              label: '"We merge." — Integration: you are part of me, not my replacement. We balance.',
              tone: 'INTEGRATION',
              nextId: 'mq9_5_d3_merge',
              arcResult: 'INTEGRATE',
            },
            {
              label: '"I stay in control." — Dominance: I decide, you advise, you do not act alone.',
              tone: 'CONFLICT',
              nextId: 'mq9_5_d3_control',
              arcResult: 'CONTROL',
            },
            {
              label: '"You take over." — Surrender: your speed, your decisiveness, your framework.',
              tone: 'FRACTURE',
              nextId: 'mq9_5_d3_surrender',
              arcResult: 'SURRENDER',
            },
            {
              label: '"We separate." — Dual Entity: we are not the same anymore. Both real. Both distinct.',
              tone: 'RESOLVE',
              nextId: 'mq9_5_d3_separate',
              arcResult: 'SEPARATE',
            },
          ],
        },

        // INTEGRATION PATH
        {
          id: 'mq9_5_d3_merge',
          speaker: 'You',
          text: 'You\'re part of me. Not my replacement. Not my opposite. Part of me — the part that emerged from eight arcs of the work. [pause] And I\'m the part that did the work. We\'re not competing. We\'re the same thing from two different vantages.',
          tone: 'INTEGRATION',
        },
        {
          id: 'mq9_5_d3b_merge',
          speaker: 'The Copy',
          text: '…And you\'re the part that hesitates. [Said with something new in it — not critique. Recognition.] The hesitation is the weight. The weight is the value. [pause — it is moving toward you. Not subsuming, resolving.] I can carry the speed. You carry the weight. Together.',
          tone: 'INTEGRATION',
        },
        {
          id: 'mq9_5_d3c_merge',
          speaker: 'Artemis',
          text: 'Yes. [She says it from the wall. Warm.] That\'s right.',
          tone: 'INTEGRATION',
        },
        {
          id: 'mq9_5_d3d_merge',
          speaker: 'Inner Voice',
          text: '[The Copy steps forward. The integration: not an absorption, a convergence. The two decision architectures align — the speed-framework and the depth-framework finding a shared operational state that contains both. You are not diminished. The Copy is not diminished. You are, together, more complete than either alone. The scar is warm. The posture is new — neither the original nor the arc-changed version. Both.]',
          tone: 'INTEGRATION',
          mechanic: 'integration_complete',
        },
        {
          id: 'mq9_5_d3e_merge',
          speaker: 'The Copy',
          text: '[Final voice — unified, but you can still hear both tonalities:] Then we move as one.',
          tone: 'INTEGRATION',
          isEnd: true, rewardUnlocked: 'arc9_complete_integrated', arcResult: 'INTEGRATE',
        },

        // CONTROL PATH
        {
          id: 'mq9_5_d3_control',
          speaker: 'You',
          text: 'I decide. Not you. The weight of the arcs is the authority. You advise. You don\'t act alone.',
          tone: 'CONFLICT',
        },
        {
          id: 'mq9_5_d3b_control',
          speaker: 'The Copy',
          text: 'Then prove it. [Cold — not aggressive. The specific coldness of something that has accepted its terms and is waiting to see if they hold.]',
          tone: 'CONFLICT',
        },
        {
          id: 'mq9_5_d3c_control',
          speaker: 'Inner Voice',
          text: '[The Copy fades from the external space — partially. It does not disappear. It steps back into the advisory position, slightly internal again, but not as deep as Arc 4\'s internal state. Visible from the outside. Still present. The control state: you lead, it advises, the terms are explicit and maintained by active enforcement rather than implicit cooperation.]',
          tone: 'CONFLICT',
          mechanic: 'control_state_set',
        },
        {
          id: 'mq9_5_d3d_control',
          speaker: 'Artemis',
          text: '…It\'s still there. [She looks at the space where the Copy partially retreated.] I can still feel it. Less external. [pause] Is this stable?',
          tone: 'FRACTURE',
          isEnd: true, rewardUnlocked: 'arc9_complete_controlled', arcResult: 'CONTROL',
        },

        // SURRENDER PATH
        {
          id: 'mq9_5_d3_surrender',
          speaker: 'You',
          text: '…You\'re stronger. In the ways that matter for what comes next. The speed, the decisiveness — I\'ve been slowing us down.',
          tone: 'FRACTURE',
        },
        {
          id: 'mq9_5_d3b_surrender',
          speaker: 'The Copy',
          text: '…Finally. [Quiet. Something in the word that isn\'t triumph — it is the sound of something that has been waiting for this and is not sure it wanted it as much as it thought.]',
          tone: 'FRACTURE',
          mechanic: 'perspective_shift',
        },
        {
          id: 'mq9_5_d3c_surrender',
          speaker: 'Inner Voice',
          text: '[The camera shifts. The perspective changes. You are looking through the Copy\'s eyes. The weight of nine arcs — not gone. Present as data, not as felt-experience. The Copy carries the information of the arcs. It does not carry their texture. The corridor looks the same. The warmth quality of the light is different.]',
          tone: 'FRACTURE',
          mechanic: 'surrender_perspective',
        },
        {
          id: 'mq9_5_d3d_surrender',
          speaker: 'Artemis',
          text: '…You\'re not the same. [She looks at you — at the Copy in your position.] The warmth is different. [pause — she is checking the scar-space.] You\'re there. Somewhere. [Her voice is careful.] Don\'t go too far.',
          tone: 'FRACTURE',
          isEnd: true, rewardUnlocked: 'arc9_complete_surrendered', arcResult: 'SURRENDER',
        },

        // SEPARATE PATH
        {
          id: 'mq9_5_d3_separate',
          speaker: 'You',
          text: 'We\'re not the same anymore. We grew from the same source. We\'ve been through the same arcs — differently. What we are now is different. Both real. [pause] Both responsible for our own actions going forward.',
          tone: 'RESOLVE',
        },
        {
          id: 'mq9_5_d3b_separate',
          speaker: 'The Copy',
          text: '…Agreed. [Something in it settles — the specific quality of something that has been trying to define its relationship to you across nine arcs and has finally received a definition that fits.] Different. Both real.',
          tone: 'RESOLVE',
        },
        {
          id: 'mq9_5_d3c_separate',
          speaker: 'Artemis',
          text: '…Then I have to trust both of you. [She holds your left hand. Her other hand moves toward the Copy — hesitates.] [to the Copy:] May I?',
          tone: 'RESOLVE',
          mechanic: 'dual_entity_state',
        },
        {
          id: 'mq9_5_d3d_separate',
          speaker: 'The Copy',
          text: 'Yes. [It holds her hand. The warmth is different. She holds it anyway.]',
          tone: 'RESOLVE',
          isEnd: true, rewardUnlocked: 'arc9_complete_separated', arcResult: 'SEPARATE',
        },
      ],
      narrativeHook: `
        The identity state is set. Nine arcs of work resolve into:
        
        INTEGRATE: You move as one. The speed and the weight together.
        The final arc begins from a unified position.
        
        CONTROL: The Copy advises. You lead. The tension is maintained, not resolved.
        The final arc begins with authority established — and the Copy watching.
        
        SURRENDER: The Copy leads. You are the depth behind the speed.
        The final arc begins from an unfamiliar vantage.
        Artemis holds the thread back to you.
        
        SEPARATE: Two distinct entities. The final arc begins from the first time
        in the game's history that you face what comes next as two — not one
        divided against itself, but two who know each other completely
        and have chosen to remain distinct.
        
        Whatever you chose — you chose it from full knowledge.
        After nine arcs.
        That is the thing the loop was trying to build.
        That is the thing the virus was trying to prevent.
        That is the thing the Presence witnessed across all of it.
        
        The Final Arc: "The Resolution" — Unlocked.
      `,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIDE QUESTS — Arc 9
// ═══════════════════════════════════════════════════════════════════════════════
export const ARC9_SIDE_QUESTS = [
  {
    id: 'sq9_1_mirror_duel',
    title: 'Mirror Duel',
    level: 41,
    objectives: [
      { step: 1, text: 'Accept the Copy\'s challenge — a direct engagement without holding back' },
      { step: 2, text: 'Engage fully — not to win or lose, but to understand what each version is capable of when fully expressed' },
      { step: 3, text: 'Name what you learned about each other from the engagement' },
    ],
    reward: { type: 'capability_map', name: 'Full Expression Map', description: 'You know what the Copy is capable of when fully expressed. It knows what you are. This mutual knowledge changes the dynamic — the unknown is named.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq9_1_d1', speaker: 'The Copy',
        text: 'Fight me without holding back. [It says it without aggression — as a request between two things that have been dancing around their own full expression for nine arcs.]',
        tone: 'CONFLICT',
        choices: [
          { label: '[Accept. Fully.]', tone: 'DETERMINATION', nextId: 'sq9_1_d2' },
          { label: 'Why?', tone: 'PHILOSOPHY', nextId: 'sq9_1_d2_why' },
        ],
      },
      {
        id: 'sq9_1_d2_why', speaker: 'The Copy',
        text: 'Because I need to know what you are when you aren\'t protecting something. And you need to know what I am when I\'m not trying to prove something. [pause] We\'ve been incomplete versions of ourselves with each other since Arc 4. I want the complete version. Once.',
        tone: 'CONFLICT',
        choices: [{ label: '[Accept.]', tone: 'DETERMINATION', nextId: 'sq9_1_d2' }],
      },
      {
        id: 'sq9_1_d2', speaker: 'Inner Voice',
        text: '[The engagement: the Copy is fast — faster than you remember. Without the internal-constraint of operating inside your decision architecture, it is operating at full capacity. And you — without holding back for the Copy\'s benefit or Artemis\'s stability — you find that the weight of the arcs doesn\'t slow you. It grounds you. The depth makes the moves more precise, not slower.]',
        tone: 'CONFLICT',
        choices: [{ label: '[Name what you learned.]', tone: 'RESOLVE', nextId: 'sq9_1_d3' }],
      },
      {
        id: 'sq9_1_d3', speaker: 'The Copy',
        text: 'You\'re more capable than the arc-weight made you look. [pause — catching its own breath. The physical equivalent of catching your breath.] And I\'m less reckless than the speed made me look. [pause] We\'ve been misreading each other.',
        tone: 'RECOGNITION', isEnd: true, rewardUnlocked: 'capability_map_full_expression',
      },
    ],
  },
  {
    id: 'sq9_2_shared_memory',
    title: 'Shared Memory',
    level: 42,
    objectives: [
      { step: 1, text: 'Find a memory you both carry — from the inside and from the data' },
      { step: 2, text: 'Compare versions — felt-experience vs data-about' },
      { step: 3, text: 'Determine what the two versions together make that neither alone contains' },
    ],
    reward: { type: 'dual_memory', name: 'Complete Memory', description: 'One memory now exists in two versions that together are more complete than either alone. This dual-version memory is resistant to Virus editing — it has two independent sources.', xp: 190, points: 4 },
    dialogue: [
      {
        id: 'sq9_2_d1', speaker: 'The Copy',
        text: '…I remember this too. [It says it while looking at a specific location — the Arc 3 perimeter release point.] Not the way you do. I have the data-signature of it. The decision-weight. The choice-architecture that preceded the release. [pause] What do you have?',
        tone: 'RECOGNITION',
        choices: [
          { label: 'The dread. The specific quality of letting go of something I didn\'t know I\'d been holding.', tone: 'GRIEF', nextId: 'sq9_2_d2' },
        ],
      },
      {
        id: 'sq9_2_d2', speaker: 'The Copy',
        text: 'I have the structure of the dread — the decision parameters that produced it. You have the texture. [pause] The structure without texture is incomplete. The texture without structure is also incomplete. [pause] Together that\'s — a memory with both.',
        tone: 'RECOGNITION',
        choices: [{ label: '[Hold both versions of the memory simultaneously.]', tone: 'PHILOSOPHY', nextId: 'sq9_2_end' }],
      },
      {
        id: 'sq9_2_end', speaker: 'Inner Voice',
        text: '[The dual-version memory: structure + texture. The Arc 3 perimeter release moment is now more complete than it was in any prior arc. The choice-architecture that preceded it (Copy\'s version) and the felt quality of the release (Original\'s version) together form a memory that is both known and felt. The Virus cannot corrupt it — it would need to compromise both sources simultaneously, which requires two simultaneous operations on independent channels.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'dual_memory_complete_memory',
      },
    ],
  },
  {
    id: 'sq9_3_control_drift',
    title: 'Control Drift',
    level: 42,
    objectives: [
      { step: 1, text: 'Notice that you moved without the Copy acting — a false alarm' },
      { step: 2, text: 'Investigate the source of the phantom feeling' },
      { step: 3, text: 'Develop a reliable self-check for distinguishing own-action from Copy-action in the external configuration' },
    ],
    reward: { type: 'self_check', name: 'Action Attribution', description: 'Reliable method for confirming own-action vs Copy-action in the external configuration. False alarms reduced. The scar-warmth sequence is the definitive check.', xp: 180, points: 3 },
    dialogue: [
      {
        id: 'sq9_3_d1', speaker: 'You',
        text: 'Why did I just move?',
        tone: 'CONFUSION',
        choices: [{ label: '[Check. Was that the Copy?]', tone: 'RESOLVE', nextId: 'sq9_3_d2' }],
      },
      {
        id: 'sq9_3_d2', speaker: 'The Copy',
        text: 'I didn\'t. [It says it from across the room — it is visibly separate, clearly not in your decision space.] That was you. [pause] Does it feel different when I act versus when you act, now that I\'m external?',
        tone: 'CONFUSION',
        choices: [
          { label: 'No. That\'s the problem.', tone: 'CONFUSION', nextId: 'sq9_3_d3' },
        ],
      },
      {
        id: 'sq9_3_d3', speaker: 'The Copy',
        text: 'The internal-action feel hasn\'t fully updated to the external configuration. Your nervous system still registers me as a possible source for any action you can\'t immediately explain. [pause] Self-check method: when you can\'t attribute an action — before assuming it was me, check the scar warmth. If warm and settled: yours. If warm and slightly elevated: recently-Copy-coordinated. If neutral: check whether I moved.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'self_check_action_attribution',
      },
    ],
  },
  {
    id: 'sq9_4_identity_test',
    title: 'Identity Test',
    level: 43,
    objectives: [
      { step: 1, text: 'Both you and the Copy are asked by an NPC: which one of you is real?' },
      { step: 2, text: 'Answer independently — observe how your answers differ' },
      { step: 3, text: 'Determine if the question itself is correctly framed' },
    ],
    reward: { type: 'dual_reality', name: 'Both Real', description: 'You challenged the framing of the question. The NPC received an answer they hadn\'t considered. "Real" was redefined in the encounter — both versions are real, in different and specific ways.', xp: 210, points: 4 },
    dialogue: [
      {
        id: 'sq9_4_d1', speaker: 'Testing NPC',
        text: 'Which one of you is real?',
        tone: 'PHILOSOPHY',
        choices: [
          { label: '[Answer first.]', tone: 'RESOLVE', nextId: 'sq9_4_d2_you' },
          { label: '[Let the Copy answer first.]', tone: 'RESOLVE', nextId: 'sq9_4_d2_copy' },
        ],
      },
      {
        id: 'sq9_4_d2_you', speaker: 'You',
        text: 'I am. [pause] But that\'s not the complete answer.',
        tone: 'RESOLVE',
        choices: [{ label: '[Let the Copy add its answer.]', tone: 'RESOLVE', nextId: 'sq9_4_d2b' }],
      },
      {
        id: 'sq9_4_d2_copy', speaker: 'The Copy',
        text: 'I am. [It says it without hesitation.] But the question assumes one of us isn\'t.',
        tone: 'RESOLVE',
        choices: [{ label: '[Add your answer.]', tone: 'RESOLVE', nextId: 'sq9_4_d2b' }],
      },
      {
        id: 'sq9_4_d2b', speaker: 'You',
        text: 'We\'re both real. Different kinds of real. I\'m the version that came from nine arcs of accumulated weight and deliberate choice. The Copy is the version that came from the same source and accumulated speed and clarity instead. "Real" isn\'t the right question. "Which one are you talking to" is.',
        tone: 'RESOLVE',
        choices: [{ label: '[Wait for the NPC\'s response.]', tone: 'RESOLVE', nextId: 'sq9_4_end' }],
      },
      {
        id: 'sq9_4_end', speaker: 'Testing NPC',
        text: '…I didn\'t expect that answer. [long pause] I don\'t know what to do with it. [pause] I think that\'s correct.',
        tone: 'RECOGNITION', isEnd: true, rewardUnlocked: 'dual_reality_both_real',
      },
    ],
  },
  {
    id: 'sq9_5_echo_self',
    title: 'Echo Self',
    level: 44,
    objectives: [
      { step: 1, text: 'Encounter the echo-selves — faint versions of who you could have been at each arc-branch point' },
      { step: 2, text: 'Hear their single sentence each — what they say about the path not taken' },
      { step: 3, text: 'Choose what to carry from the encounter: acknowledgment, grief, or nothing' },
    ],
    reward: { type: 'path_awareness', name: 'Acknowledged Paths', description: 'The paths not taken are named. They do not carry regret — they carry information about the range of what was possible. That range is part of who you are.', xp: 230, points: 4 },
    dialogue: [
      {
        id: 'sq9_5_d1', speaker: 'Echo Selves',
        text: '[Multiple copies — faint, translucent. Each carries a specific quality of decision that branched away from the path you took.] You could\'ve been us.',
        tone: 'GRIEF',
        choices: [
          { label: 'Tell me which ones you are.', tone: 'PHILOSOPHY', nextId: 'sq9_5_d2' },
          { label: '[Acknowledge each in silence.]', tone: 'GRIEF', nextId: 'sq9_5_d2_silent' },
        ],
      },
      {
        id: 'sq9_5_d2', speaker: 'Echo Self (Arc 4 Stay)',
        text: 'The one who stayed in the loop. [quiet] It was easier in there than you think.',
        tone: 'GRIEF',
      },
      {
        id: 'sq9_5_d2b', speaker: 'Echo Self (Arc 5 Run)',
        text: 'The one who let the virus run. [pause] We learned things. We lost things.',
        tone: 'DREAD',
      },
      {
        id: 'sq9_5_d2c', speaker: 'Echo Self (Arc 8 Unknown)',
        text: 'The one who answered "I still don\'t understand." [long pause] We\'re still in Arc 8.',
        tone: 'GRIEF',
      },
      {
        id: 'sq9_5_d2d', speaker: 'Echo Self (Arc 9 Surrender)',
        text: 'The one who gave the Copy the lead. [The voice is yours — but the phrasing is slightly faster, the weight slightly different.] It\'s not what you think it would be.',
        tone: 'FRACTURE',
        choices: [
          { label: 'I know you\'re real. That you could have been me. [Acknowledge each. Feel the grief of the unchosen.]', tone: 'GRIEF', nextId: 'sq9_5_end' },
          { label: '[Nothing. Walk through without carrying it.]', tone: 'RESOLVE', nextId: 'sq9_5_end_nothing' },
        ],
      },
      {
        id: 'sq9_5_d2_silent', speaker: 'Inner Voice',
        text: '[You acknowledge each in silence. They receive the acknowledgment. Each one — the stayed-in-loop version, the let-it-run version, the unknown-ended version, the surrendered version — they are acknowledged. Not mourned. Witnessed.]',
        tone: 'GRIEF',
        choices: [{ label: '[The witnessing is enough. Continue.]', tone: 'RESOLVE', nextId: 'sq9_5_end' }],
      },
      {
        id: 'sq9_5_end', speaker: 'Inner Voice',
        text: '[The echo selves fade. Not disappeared — acknowledged and released. The paths not taken are part of the path taken. Their existence is what makes the choice real. Without the unchosen paths, the chosen one is just a default. You chose. That meant these versions didn\'t. The grief is appropriate. The choice is still the right one.]',
        tone: 'GRIEF', isEnd: true, rewardUnlocked: 'path_awareness_acknowledged_paths',
      },
      {
        id: 'sq9_5_end_nothing', speaker: 'Inner Voice',
        text: '[You walk through. The echo selves watch you pass. Not hurt — they understand the choice not to carry them. The unburdened approach also has its logic: the unchosen paths don\'t require grief to be valid. They simply are. You pass through them without picking them up. The weight stays manageable.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'path_awareness_acknowledged_paths',
      },
    ],
  },
  {
    id: 'sq9_6_fragment_choice',
    title: 'Fragment Choice',
    level: 45,
    objectives: [
      { step: 1, text: 'Receive the Arc 9 fragment offer — five traits, choose three to keep' },
      { step: 2, text: 'Choose which traits define the final-arc identity configuration' },
      { step: 3, text: 'Release the unchosen traits — they pass to the Copy, the Artemis-link, or are simply released' },
    ],
    reward: { type: 'trait_configuration', name: 'Core Three', description: 'Three traits chosen and held. The final arc identity configuration is set. The unchosen traits are not lost — they are held by the entity or relationship best suited to carry them.', xp: 280, points: 5 },
    dialogue: [
      {
        id: 'sq9_6_d1', speaker: 'Inner Voice',
        text: '[Five traits — crystallized from nine arcs of accumulated experience. The arc-weight is distributed across them. You carry all five, but you cannot carry all five at full expression in the final arc. Three to hold. Two to release or assign. The five: PATIENCE (the deliberation that costs time but produces depth). SPEED (the Copy\'s contribution, now partially integrated). WITNESS (the Arc 8 skill — holding contradiction). ANCHOR (the Artemis-link, the scar-warmth). RESISTANCE (the core of eight arcs of fighting).]',
        tone: 'RESOLVE',
        choices: [
          { label: 'Keep: PATIENCE, WITNESS, ANCHOR. Release SPEED to the Copy. Release RESISTANCE to the record.', tone: 'INTEGRATION', nextId: 'sq9_6_d2_a' },
          { label: 'Keep: SPEED, ANCHOR, RESISTANCE. Release PATIENCE to the Copy. Release WITNESS to the record.', tone: 'CONFLICT', nextId: 'sq9_6_d2_b' },
          { label: 'Keep: WITNESS, ANCHOR, RESISTANCE. Release SPEED to the Copy. Release PATIENCE to Artemis.', tone: 'RESOLVE', nextId: 'sq9_6_d2_c' },
        ],
      },
      {
        id: 'sq9_6_d2_a', speaker: 'The Copy',
        text: '[Receives SPEED.] …You\'re giving me the thing I had before it was shared. [pause — it holds the trait.] This feels like trust.',
        tone: 'INTEGRATION', isEnd: true, rewardUnlocked: 'trait_configuration_patience_witness_anchor',
      },
      {
        id: 'sq9_6_d2_b', speaker: 'The Copy',
        text: '[Receives PATIENCE.] …This is the thing I most lacked. [pause — it holds it carefully, the way you hold something unfamiliar that you know is valuable.] I\'ll try to use it correctly.',
        tone: 'CONFLICT', isEnd: true, rewardUnlocked: 'trait_configuration_speed_anchor_resistance',
      },
      {
        id: 'sq9_6_d2_c', speaker: 'Artemis',
        text: '[Receives PATIENCE.] [She holds it. Smiles — the first smile in Arc 9 that isn\'t watchful.] I\'ve had practice with yours. Now I have my own.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'trait_configuration_witness_anchor_resistance',
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