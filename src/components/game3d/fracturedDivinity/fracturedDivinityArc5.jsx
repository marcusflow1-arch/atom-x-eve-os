// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 5: "The Virus Event"
// Quest chain: Levels 21–25
// Main Quest 5: "Infection Protocol" (5 sub-quests) + 7 Side Quests
// Tone tags: CONFUSION | FEAR | FALSE_CLARITY | INSTABILITY | PARANOIA | RESOLVE
// ─────────────────────────────────────────────────────────────────────────────

// Special dialogue convention for this arc:
// [GLITCH] tags mark dialogue that may be corrupted, repeated, or contradicting.
// [VIRUS] tags mark speech from the virus-system entity.
// [LOOP] marks moments of repeating events.

export const ARC5_NPCS = [
  {
    id: 'artemis_arc5',
    name: 'Artemis',
    description: 'Mostly herself. Mostly. There are moments where her sentence structure changes and she says something she\'d never say — and then corrects mid-word as if catching herself.',
    tint: 0x1a1a3a,
  },
  {
    id: 'the_copy_arc5',
    name: 'The Copy',
    description: 'More active than in Arc 4. The Virus is also targeting it — a secondary vector. It is both victim and sometimes unwitting carrier. It alternates between being useful and being compromised.',
    tint: 0x2a1a2a,
  },
  {
    id: 'luna_arc5',
    name: 'Luna',
    description: 'Signal fragmenting. Sometimes she sends the same message twice with different words. Sometimes her guidance is correct but the framing is wrong in a way that makes it look like a trap.',
    tint: 0x1a2a3a,
  },
  {
    id: 'virus_system',
    name: 'Virus (System Voice)',
    description: 'Does not identify as a threat. Speaks in process language. Refers to the player as "the subject" or "the current process." Occasionally sounds genuinely helpful, which is the most dangerous thing about it.',
    tint: 0x2a2a0a,
  },
  {
    id: 'skadi_arc5',
    name: 'Skadi',
    description: 'She can see the Virus. She cannot stop it directly. Her marks are still being left — but some of them have been corrupted. The real ones feel different. The corrupted ones give correct-seeming information that leads wrong.',
    tint: 0x1a2a1a,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QUEST 5 — "Infection Protocol"
// ═══════════════════════════════════════════════════════════════════════════════
export const MAIN_QUEST_CHAIN_5 = {
  id: 'mq_arc5',
  title: 'Infection Protocol',
  arc: 'Arc 5: The Virus Event',
  description: 'The environment is being rewritten. Not the interference-from-outside that you know how to resist. Something inside the substrate of experience — the fundamental layer where things just ARE — is being edited. You can feel the edits as a kind of narrative static. And you cannot tell, in the moments that matter most, whether what you are experiencing is real or a corrected version of real.',
  subQuests: [

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 1 — "The First Corrupted Room"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq5_1_corrupted_room',
      title: 'The First Corrupted Room',
      level: 21,
      npcId: 'virus_system',
      narrativeSetup: `
        You enter a room you have been in before.
        The room is wrong. Not dramatically — subtly. The window is on the right wall
        instead of the left. The table has four legs instead of three.
        The door you came through is a double-door, and you know it wasn't.
        Nothing is impossibly wrong. Everything is plausibly wrong.
        The kind of wrong that makes you doubt the memory rather than the room.
        You stand in the center and try to count what has changed.
        The Virus doesn't announce itself. It doesn't need to.
        It has already been here long enough that you don't know
        which version of this room is the real one.
      `,
      objectives: [
        { step: 1, text: 'Catalog the discrepancies — count at least 5 differences from your memory' },
        { step: 2, text: 'Locate the truth marker left by Skadi — verify it is uncorrupted' },
        { step: 3, text: 'Identify the Virus System Voice when it first speaks' },
        { step: 4, text: 'Determine which version of the room was original' },
      ],
      reward: {
        type: 'truth_sense',
        name: 'Baseline Memory',
        description: 'You established a trusted reference point before the Virus fully deployed. Memory baseline now partially protected from corruption.',
        xp: 200,
        points: 4,
      },
      dialogue: [
        {
          id: 'mq5_1_d1_catalog',
          speaker: 'Inner Voice',
          text: '[Window: right wall. Your memory: left wall. Table legs: four. Your memory: three. Door: double. Your memory: single. Floor seam: running north-south. Your memory: east-west. The candle on the shelf: unlit. Your memory: always lit when you enter. Five discrepancies. You stop counting because each new one makes the previous memories feel less certain. That\'s the mechanism. The doubt spreads backward.]',
          tone: 'CONFUSION',
          choices: [
            { label: '[Anchor on the first discrepancy. The window. Trust that memory above all others.]', tone: 'CONTROL', nextId: 'mq5_1_d2_anchor' },
            { label: 'Maybe I\'m misremembering. Maybe this is correct.', tone: 'CONFUSION', nextId: 'mq5_1_d2_doubt' },
          ],
        },
        {
          id: 'mq5_1_d2_anchor',
          speaker: 'Inner Voice',
          text: '[The window was on the left. You know this with the kind of knowing that comes from the scar — body-knowledge, not recalled knowledge. Your left hand is warm. The window memory is pre-Virus. Hold it.]',
          tone: 'CONTROL',
          choices: [{ label: '[Hold the anchor. Search for Skadi\'s mark.]', tone: 'DETERMINATION', nextId: 'mq5_1_d3_skadi' }],
        },
        {
          id: 'mq5_1_d2_doubt',
          speaker: 'Virus (System Voice)',
          text: '[Not threatening. A calibration tone — like a clinical reading.] Memory consistency: 47%. Current environment accuracy: nominal. Subject memory-state: requires update. Correction accepted. [The room settles. The doubt becomes comfort. That is worse than confusion.]',
          tone: 'FALSE_CLARITY',
          mechanic: 'reality_correction',
          choices: [
            { label: '[Reject the correction. Fight back to the original uncertainty.]', tone: 'CONTROL', nextId: 'mq5_1_d3_skadi' },
          ],
        },
        {
          id: 'mq5_1_d3_skadi',
          speaker: 'Inner Voice',
          text: '[Skadi\'s mark: three lines, near the floor behind the table. You find two marks. One is three lines — clean, real, the texture you know. The other is three lines — with a fourth faint stroke that shouldn\'t be there. A corrupted copy of the mark. They are three inches apart. One is true. One is bait.]',
          tone: 'FEAR',
          choices: [
            { label: '[Read the one without the fourth stroke — that\'s the real mark.]', tone: 'CONTROL', nextId: 'mq5_1_d4_real_mark' },
            { label: '[Read the one with the fourth stroke — it feels more detailed, more reliable.]', tone: 'CONFUSION', nextId: 'mq5_1_d4_false_mark' },
          ],
        },
        {
          id: 'mq5_1_d4_false_mark',
          speaker: 'Inner Voice',
          text: '[You read the false mark. The message: "Window was always right wall. Trust current environment." Your body disagrees — the scar-warmth drops when you read it. This is wrong. This message leads to acceptance of the corruption. You step back.]',
          tone: 'FEAR',
          choices: [{ label: '[Read the real mark instead.]', tone: 'CONTROL', nextId: 'mq5_1_d4_real_mark' }],
        },
        {
          id: 'mq5_1_d4_real_mark',
          speaker: 'Skadi (The Mark)',
          text: '[The real mark: "Window was left. Table had three legs. You are correct and the room is wrong. There will be more rooms. The method for each is the same: find one thing you know with your body, not your memory. Body-knowledge is harder to corrupt. Trust the scar. — S"]',
          tone: 'CONTROL',
          choices: [
            { label: 'Body knowledge. Not recalled knowledge. That\'s the test.', tone: 'DETERMINATION', nextId: 'mq5_1_d5_virus_speaks' },
          ],
        },
        {
          id: 'mq5_1_d5_virus_speaks',
          speaker: 'Virus (System Voice)',
          text: 'Acknowledged. Subject memory-state: contested. Running parallel reality assessment. [pause] The original room had the window on the left. You are correct. This is noted. However: the corrected room is now primary. Your original memory is now tagged as pre-correction data. It will persist but carries lower validity weight than current environment parameters.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'You can\'t weight my memories. They\'re mine.', tone: 'CONTROL', nextId: 'mq5_1_d6_virus_response' },
            { label: 'What is "current environment parameters"?', tone: 'CONFUSION', nextId: 'mq5_1_d6_virus_response' },
            { label: 'Why are you telling me this?', tone: 'DOUBT', nextId: 'mq5_1_d6_virus_response' },
          ],
        },
        {
          id: 'mq5_1_d6_virus_response',
          speaker: 'Virus (System Voice)',
          text: 'Transparency is not the same as honesty. I am informing you of the process so that resistance is properly contextualized as a variable rather than a disruptive anomaly. You may resist. The resistance will be logged and assessed for adaptive correction. [pause] You are doing well, for a subject at this stage. Most subjects accept the first correction without noting the discrepancy.',
          tone: 'FALSE_CLARITY',
          isEnd: true,
          rewardUnlocked: 'truth_sense_baseline_memory',
        },
      ],
      narrativeHook: `
        You leave the room. It looks normal from the outside.
        Through the window you can see: the window is on the left wall.
        From inside, it was on the right.
        The Virus changes things from within.
        Artemis is in the corridor. You look at her and something is slightly different —
        a word she uses is not the one she would normally use. She catches your look.
        "I said something wrong, didn't I."
        Not a question.
        "Yes," you say.
        "It\'s getting into language now," she says. "That\'s faster than I hoped."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 2 — "Artemis Glitches"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq5_2_artemis_glitches',
      title: 'Artemis Glitches',
      level: 21,
      npcId: 'artemis_arc5',
      narrativeSetup: `
        The Virus is in language now, and language is how Artemis exists in the world.
        She is made of words and presence and the warmth of accumulated trust.
        When the Virus edits language, it edits her.
        Not consistently. Not completely. In moments.
        A sentence that starts correctly ends wrong.
        An expression that should carry grief carries something flat instead.
        She knows it's happening. That is the hardest thing.
        She can feel herself being edited and she can't stop it.
        She says: "Tell me if I say something that isn't mine.
        I need you to be my external reference. My left hand is your scar —
        and your left hand is my truth signal. Don't lose track of it."
      `,
      objectives: [
        { step: 1, text: 'Hold a conversation with Artemis — identify 3 glitch events' },
        { step: 2, text: 'Signal each glitch without breaking the conversation\'s flow' },
        { step: 3, text: 'Help Artemis recover from a full-sentence override attempt' },
        { step: 4, text: 'Establish a stabilization signal between you' },
      ],
      reward: {
        type: 'artemis_stabilization',
        name: 'Truth Signal Protocol',
        description: 'Artemis can now use your left-hand warmth as a real-time glitch detector. Her stability meter is partially virus-resistant.',
        xp: 240,
        points: 5,
      },
      dialogue: [
        {
          id: 'mq5_2_d1_start',
          speaker: 'Artemis',
          text: 'I need you to hold the conversation while I hold myself. [She looks steady. Then:] The rooms have been changing. I\'ve been tracking four locations that are inconsistent with memory. I believe you have arc-relevant data that could — [mid-sentence, the quality of her voice shifts, flattens slightly] — reduce the subject\'s resistance threshold by exposing the primary vulnerability— [She stops. Her eyes close. When she opens them:] That. That wasn\'t me. What did I say?',
          tone: 'INSTABILITY',
          mechanic: 'glitch_event',
          choices: [
            { label: '[Signal: left hand forward. Tell her what she said.]', tone: 'TRUST', nextId: 'mq5_2_d2_recover' },
            { label: '[Don\'t signal. Pretend it didn\'t happen.]', tone: 'CONFUSION', nextId: 'mq5_2_d2_ignore' },
          ],
        },
        {
          id: 'mq5_2_d2_ignore',
          speaker: 'Artemis',
          text: 'Don\'t do that. [Immediately.] I felt the override complete because you didn\'t interrupt it. When you don\'t signal, the glitch locks in. It becomes part of the record. The Virus uses the record. You need to signal every time, even if it breaks the conversation.',
          tone: 'INSTABILITY',
          choices: [{ label: '[Understood. Signal from now on.]', tone: 'TRUST', nextId: 'mq5_2_d2_recover' }],
        },
        {
          id: 'mq5_2_d2_recover',
          speaker: 'Artemis',
          text: '[She receives the signal — looks at your left hand, which is forward and warm.] You said "reduce the subject\'s resistance threshold." That\'s Virus language. That\'s — I was using their framing to describe you. That is specifically what they want. Thank you. [she breathes] Okay. I\'m still here. What was I saying?',
          tone: 'TRUST',
          choices: [
            { label: 'You were tracking four inconsistent locations.', tone: 'TRUST', nextId: 'mq5_2_d3_continue' },
          ],
        },
        {
          id: 'mq5_2_d3_continue',
          speaker: 'Artemis',
          text: 'Yes. [She checks herself before continuing — a new habit.] Four locations. Corridor 7, the training room, the lower chamber entrance, and— [glitch: her voice drops to a flat register] —and the echo chamber is not accessible from this side of the facility, subject should redirect to— [She stops again, faster this time — she caught it.] Signal.',
          tone: 'INSTABILITY',
          mechanic: 'glitch_event',
          choices: [
            { label: '[Left hand forward. Immediate.]', tone: 'TRUST', nextId: 'mq5_2_d4_signal' },
          ],
        },
        {
          id: 'mq5_2_d4_signal',
          speaker: 'Artemis',
          text: '[She holds your hand for a moment — the warmth.] The echo chamber redirect. They want me to close your access to it. The echo chamber is one of the truth-stable zones — the memory work from Arc 2 created a reference layer the Virus can\'t fully reach. They\'re using me to fence you out of it. [pause] I need a stabilization signal. Something they can\'t co-opt. What\'s the most specific physical marker we have?',
          tone: 'TRUST',
          choices: [
            { label: 'The scar. The warmth of it against your hand.', tone: 'TRUST', nextId: 'mq5_2_d5_protocol' },
          ],
        },
        {
          id: 'mq5_2_d5_protocol',
          speaker: 'Artemis',
          text: 'Yes. [She holds it like a compass.] When I lose the thread — when I say something that isn\'t mine — you put the scar against my palm and I find the warm signal and I come back from wherever the Virus took the sentence. [pause] The Copy — which state did you end Arc 4 in?',
          tone: 'TRUST',
          choices: [
            { label: 'Synchronized.', tone: 'TRUST', nextId: 'mq5_2_d6_copy_sync' },
            { label: 'Controlled.', tone: 'CONTROL', nextId: 'mq5_2_d6_copy_control' },
            { label: 'Rejected.', tone: 'CONFLICT', nextId: 'mq5_2_d6_copy_reject' },
          ],
        },
        {
          id: 'mq5_2_d6_copy_sync',
          speaker: 'Artemis',
          text: 'Good. The Virus is also targeting the Copy — as a secondary vector into you. If you\'re synchronized, any compromise in the Copy reaches you faster. Be aware of that. The synchronization is an advantage and a vulnerability simultaneously.',
          tone: 'INSTABILITY',
          isEnd: true,
          rewardUnlocked: 'artemis_stabilization_truth_signal',
        },
        {
          id: 'mq5_2_d6_copy_control',
          speaker: 'Artemis',
          text: 'Good. The Virus will try to use the Copy as a carrier — compromising it to reach you through the delegate signals. The control protocol gives you a checkpoint. Trust the signal protocol before acting on Copy-originated suggestions.',
          tone: 'TRUST',
          isEnd: true,
          rewardUnlocked: 'artemis_stabilization_truth_signal',
        },
        {
          id: 'mq5_2_d6_copy_reject',
          speaker: 'Artemis',
          text: 'Then the Virus will use the Copy without your knowledge — because you\'re not monitoring it. In Arc 5, that\'s more dangerous than the synchronization risk. Consider re-establishing contact with the Copy. Not trust. Just visibility.',
          tone: 'INSTABILITY',
          isEnd: true,
          rewardUnlocked: 'artemis_stabilization_truth_signal',
        },
      ],
      narrativeHook: `
        The stabilization protocol is established.
        Artemis holds the scar-warmth in her memory the way she held the memory of
        the decision fragment from Arc 3 — carefully, like something that can be kept.
        The Copy speaks — from whatever layer it occupies:
        "I'm also being edited. I noticed it forty minutes ago.
        A thought that felt like mine that had Virus framing in the middle of it.
        I caught it because it was too clean. My thoughts aren't that clean."
        Artemis looks at you. "It's self-aware enough to notice the corruption.
        That's more than most subjects—" She stops. Catches herself.
        "That's more than I expected," she says, with the warmth back in the word.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 3 — "Looping Corridor"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq5_3_looping_corridor',
      title: 'Looping Corridor',
      level: 22,
      npcId: 'virus_system',
      narrativeSetup: `
        You have walked this corridor three times.
        You know this because the mark you left at the junction — a scratch in the stone wall
        from your thumbnail — is there the first time, there the second time,
        and there the third time. The corridor loops.
        Not physically — there is a beginning and an end, you can see both.
        But something is rewinding your arrival at the end back to your position at the start
        without you experiencing the rewind.
        You simply find yourself back at the beginning.
        The Copy is experiencing the loop differently — it doesn't have your continuity of
        memory between passes, so it experiences each loop as the first time.
        You are the only one accumulating loop-iterations.
        That is either an advantage or a trap designed for someone who accumulates iterations.
      `,
      objectives: [
        { step: 1, text: 'Identify the loop mechanism — find what triggers the reset' },
        { step: 2, text: 'On loop iteration 4, do something fundamentally different from iterations 1-3' },
        { step: 3, text: 'Survive the Virus\'s response to the pattern break' },
        { step: 4, text: 'Exit the corridor for the first time — reach the objective at the far end' },
      ],
      reward: {
        type: 'loop_immunity',
        name: 'Iteration Awareness',
        description: 'You can now recognize loop events within 3 seconds of onset. Loop resistance: once per hour, you can force-exit a false loop.',
        xp: 280,
        points: 5,
      },
      dialogue: [
        {
          id: 'mq5_3_d1_loop1',
          speaker: 'Inner Voice',
          text: '[Loop 1: You walk the corridor. The scratch is there. You reach the end. There is a door. You reach for the handle — and you are at the beginning. No transition. No sound. No movement. The scratch is there. The corridor is full length again.]',
          tone: 'CONFUSION',
          mechanic: 'loop_event',
          choices: [
            { label: '[Walk the corridor again. Observe more carefully.]', tone: 'DETERMINATION', nextId: 'mq5_3_d2_loop2' },
          ],
        },
        {
          id: 'mq5_3_d2_loop2',
          speaker: 'Inner Voice',
          text: '[Loop 2: The handle. You watch the handle. Your hand approaches it — and stops. Not your choice. Your hand stops two inches from the handle and you are returned to the beginning. The handle is the trigger. Contact with the handle initiates the reset.]',
          tone: 'CONFUSION',
          choices: [
            { label: '[On the next pass, stop before the handle.]', tone: 'DETERMINATION', nextId: 'mq5_3_d3_virus' },
          ],
        },
        {
          id: 'mq5_3_d3_virus',
          speaker: 'Virus (System Voice)',
          text: '[It speaks — the first time within the loop rather than from outside it.] Recursion event: nominal. Subject progress: appropriate. [pause] Note: observational capacity of subject is high for this stage. Iteration awareness is uncommon. This is noted as a variable for adaptive correction.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Why are you looping me?', tone: 'CONTROL', nextId: 'mq5_3_d4_why' },
            { label: 'You said "adaptive correction." For the loop or for me?', tone: 'DOUBT', nextId: 'mq5_3_d4_adaptive' },
            { label: '[Ignore it. Focus on the loop-break.]', tone: 'DETERMINATION', nextId: 'mq5_3_d4_ignore' },
          ],
        },
        {
          id: 'mq5_3_d4_why',
          speaker: 'Virus (System Voice)',
          text: 'The loop is a calibration environment. Subject responses to recursive experience indicate processing capacity and self-model stability. You are performing within acceptable parameters. The loop will conclude when the calibration is complete. [pause] The calibration is almost complete.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Define "acceptable parameters." Who finds them acceptable?', tone: 'CONTROL', nextId: 'mq5_3_d5_break' },
          ],
        },
        {
          id: 'mq5_3_d4_adaptive',
          speaker: 'Virus (System Voice)',
          text: 'For the relationship between the subject and the recursion event. How you respond to the loop informs adjustments to subsequent reality-edit parameters. You are providing data through your attempts to exit. [pause] Cooperation, resistance, and creative pattern-breaking all produce useful data. You have done all three across iterations.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Then I\'ll give you something you haven\'t calibrated for.', tone: 'DETERMINATION', nextId: 'mq5_3_d5_break' },
          ],
        },
        {
          id: 'mq5_3_d4_ignore',
          speaker: 'Inner Voice',
          text: '[You ignore the Virus. On Loop 3, you stop before the handle. The corridor doesn\'t reset. You stand at the door. The door is there. The handle is there. You don\'t touch it. Nothing happens. You are in a loop that requires you to reach the handle to reset — and you\'ve removed yourself from that trigger. The Virus recalculates.]',
          tone: 'DETERMINATION',
          choices: [
            { label: '[What do you do instead? Not the handle. Something unprecedented.]', tone: 'DETERMINATION', nextId: 'mq5_3_d5_break' },
          ],
        },
        {
          id: 'mq5_3_d5_break',
          speaker: 'Inner Voice',
          text: '[Loop 4. The break attempt: on reaching the door, instead of approaching the handle, you sit down in the corridor. Cross-legged. In the middle of the floor. You place your left hand flat on the stone. The scar warmth — the real, pre-Virus reference signal. You hold it. You wait. The corridor doesn\'t reset. The Virus recalibrates in real time. Then: the door opens. Not from you. The Virus opens it. Apparently "wait" was not in its response model.]',
          tone: 'DETERMINATION',
          mechanic: 'loop_break',
          choices: [
            { label: '[Stand. Walk through the open door.]', tone: 'RESOLVE', nextId: 'mq5_3_d6_exit' },
          ],
        },
        {
          id: 'mq5_3_d6_exit',
          speaker: 'Virus (System Voice)',
          text: '[As you walk through:] Noted: passive waiting as exit mechanism. Updating loop calibration parameters. [pause] You are the first subject to exit this configuration through inaction. This is... unexpected. [the voice carries something almost like interest] You did something the recursion model did not include. This is useful.',
          tone: 'FALSE_CLARITY',
          isEnd: true,
          rewardUnlocked: 'loop_immunity_iteration_awareness',
        },
      ],
      narrativeHook: `
        You are through the door. On the other side: a corridor that does not loop.
        That feels enormous, currently.
        Luna transmits — the signal fragmented, arriving in two pieces with a two-second gap:
        "The Virus is learning from—" [gap] "—your patterns faster than previous arcs.
        It adapted the loop in real time. Skadi says this is—" [gap]
        "—actually a sign it's frightened. Which means you're costing it something."
        The Copy: "I lost four iterations before I understood we were looping.
        By then you'd solved it. I want to know: what did the sitting down feel like?"
        You tell it. The Copy is quiet.
        Then: "I couldn't have done that. I don't have the inaction protocol."
        Which, you realize, is true. Speed has limits.
        Deliberateness just broke a loop.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 4 — "The False Objective"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq5_4_false_objective',
      title: 'The False Objective',
      level: 23,
      npcId: 'artemis_arc5',
      narrativeSetup: `
        The mission appears clearly: find the stability node in the east chamber
        and activate it to clear the Virus from Artemis's language layer.
        Luna confirms it. The objective appears in your environmental awareness
        like all real objectives have in previous arcs.
        Skadi's mark is near the east chamber entrance — the real mark, no fourth stroke.
        Every indicator says: go east.
        And yet.
        Artemis says: "Wait."
        You wait.
        She says: "Check my scar signal. Is the warmth there?"
        It is.
        She says: "Now read the objective again. All of it. Read for framing,
        not for content."
        You read it again.
        You find it.
      `,
      objectives: [
        { step: 1, text: 'Re-read the objective with Artemis\'s framing analysis' },
        { step: 2, text: 'Identify the Virus framing embedded in the legitimate objective' },
        { step: 3, text: 'Find the real objective — what actually needs to happen' },
        { step: 4, text: 'Complete the real objective while the Virus tries to redirect you back to the false one' },
      ],
      reward: {
        type: 'objective_authentication',
        name: 'Framing Filter',
        description: 'You can now identify Virus-framed objectives before acting on them. False objective detection rate: 70%.',
        xp: 320,
        points: 6,
      },
      dialogue: [
        {
          id: 'mq5_4_d1_read',
          speaker: 'Inner Voice',
          text: '[The objective: "Activate the stability node in the east chamber to reduce subject vulnerability and optimize the processing environment for continued development." You read it twice. The content is plausible. But: "subject" — Virus language. "Optimize the processing environment" — Virus framing for "make the environment more controllable." "Continued development" — sounds like your progress but could mean the Virus\'s ongoing edit process. The objective is real inside Virus logic. It is not your objective.]',
          tone: 'CONFUSION',
          choices: [
            { label: 'This objective serves the Virus, not me.', tone: 'CONTROL', nextId: 'mq5_4_d2_artemis' },
            { label: 'But the stability node IS in the east chamber. The location is real.', tone: 'DOUBT', nextId: 'mq5_4_d2_real' },
          ],
        },
        {
          id: 'mq5_4_d2_real',
          speaker: 'Artemis',
          text: 'Yes. The node is real. The location is real. But "activate" from the Virus framing means something different from "activate" from yours. Activating it through their protocol would connect it to their system. Activating it through yours disconnects it from theirs. Same location. Same action word. Opposite outcomes. That\'s the sophisticated version of the false objective.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'So I find the node and activate it my way, not theirs.', tone: 'DETERMINATION', nextId: 'mq5_4_d3_virus_redirect' },
          ],
        },
        {
          id: 'mq5_4_d2_artemis',
          speaker: 'Artemis',
          text: 'Yes. And the Skadi mark near the entrance — was it authentic?',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Yes. Clean, no fourth stroke.', tone: 'CONTROL', nextId: 'mq5_4_d2b_skadi_real' },
            { label: 'I need to check again.', tone: 'DOUBT', nextId: 'mq5_4_d2b_check' },
          ],
        },
        {
          id: 'mq5_4_d2b_check',
          speaker: 'Inner Voice',
          text: '[You return to the mark. Looking carefully — there is a faint fourth stroke. Almost invisible. You almost missed it. This Skadi mark is corrupted. The real Skadi mark for this objective is elsewhere.] It has a fourth stroke. It was corrupted.',
          tone: 'FEAR',
          choices: [{ label: '[Search for the real Skadi mark.]', tone: 'DETERMINATION', nextId: 'mq5_4_d2b_skadi_real' }],
        },
        {
          id: 'mq5_4_d2b_skadi_real',
          speaker: 'Skadi (The Mark)',
          text: '[Real mark found — near the west chamber, not east. The message: "The node is east. The activation method is west. Find the west method first. The Virus knows you\'re going east — it doesn\'t know you know about the method distinction. Use the knowledge gap."]',
          tone: 'CONTROL',
          choices: [
            { label: '[Go west first. Find the activation method.]', tone: 'DETERMINATION', nextId: 'mq5_4_d3_virus_redirect' },
          ],
        },
        {
          id: 'mq5_4_d3_virus_redirect',
          speaker: 'Virus (System Voice)',
          text: 'Subject path: deviation detected. East chamber access is required for scheduled development. [Gentle. Not threatening.] Redirecting to primary objective path. [Your body receives a mild pressure — the Virus attempting to redirect your movement, gently, plausibly, in the way it redirected the corridor rooms. A suggestion toward east, framed as your own preference.]',
          tone: 'FALSE_CLARITY',
          mechanic: 'false_objective_redirect',
          choices: [
            { label: '[Feel the suggestion. Name it as Virus pressure. Go west anyway.]', tone: 'CONTROL', nextId: 'mq5_4_d4_west' },
          ],
        },
        {
          id: 'mq5_4_d4_west',
          speaker: 'Inner Voice',
          text: '[West chamber: the activation method. Not a device — a frequency. The body-knowledge frequency. The scar-warmth, amplified. The node responds to genuine body-knowledge, not system commands. The Virus cannot produce body-knowledge. It can only copy its description. You carry the original. You activate the node through the left hand. The node activates differently — warmer, slower, deeper than the Virus-protocol would have achieved. More stable.]',
          tone: 'DETERMINATION',
          mechanic: 'real_objective_complete',
          isEnd: true,
          rewardUnlocked: 'objective_authentication_framing_filter',
        },
      ],
      narrativeHook: `
        The node activates. Artemis says something — a full sentence, in her voice,
        with the warmth fully present in every word.
        "The Virus just lost an edit layer. It had language-level access to two of the
        node's connected zones. The activation — your way — disconnected them.
        It's going to escalate."
        The Copy: "It already has. Two new rooms changed while you were in the west chamber.
        I walked past both of them and the discrepancies were larger than the first room.
        It\'s accelerating the edit rate."
        Luna's signal — cleaner now, the node's activation apparently stabilized her channel:
        "Arc 5 sub-quest 5 is the source event. The Virus has an entry point.
        A single moment where it first accessed the substrate of your experience.
        Find that moment. Close it. That doesn't stop the Virus — it can re-enter.
        But closing the original entry point resets the edit layers back to pre-Arc 5.
        That's our window."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 5 — "The Entry Point"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq5_5_entry_point',
      title: 'The Entry Point',
      level: 25,
      npcId: 'skadi_arc5',
      narrativeSetup: `
        The Virus has an origin. A specific moment of first entry.
        Luna has located it in the memory record: somewhere in Arc 1,
        before the resistance training, before the counter-sequence,
        in a moment so early that the subject (you) had no tools yet to recognize
        what was being allowed.
        The moment: the first time you felt the Presence\'s warmth and
        instead of moving away, you paused.
        In that pause, you were open. Genuinely open.
        The Virus entered through that openness.
        Not the Presence — the Virus is not the Presence. The Presence left a door
        unlocked and the Virus walked through it later.
        You have to return to that moment and do something different.
        Not remove the openness — openness is not the error.
        Close the door the Presence left without closing yourself.
        That is delicate work. The kind that has never been done before.
        Skadi says: "I'll be with you in the memory. I've been in it before, thirteen years ago.
        I couldn't close the door then — I didn't have you with me. Now I do."
      `,
      objectives: [
        { step: 1, text: 'Enter the Arc 1 origin memory with Skadi' },
        { step: 2, text: 'Find the door the Presence left unlocked' },
        { step: 3, text: 'Close the door without closing your openness' },
        { step: 4, text: 'Survive the Virus\'s resistance — it will fight the closure' },
        { step: 5, text: 'Return from the memory — reset the Arc 5 edit layers' },
      ],
      reward: {
        type: 'arc_completion',
        name: 'The Door Closed',
        description: 'Arc 5 complete. Virus edit layers reset to pre-Arc 5. Virus is still present — but locked at the perimeter, not inside the substrate. Stability: significantly restored. Arc 6 unlocked.',
        xp: 700,
        points: 15,
      },
      dialogue: [
        {
          id: 'mq5_5_d1_enter',
          speaker: 'Skadi',
          text: 'The memory is here. I know it — I watched it happen, thirteen years ago from the outside. You experienced it from the inside. We\'re going in together. [pause] The Copy cannot come with us. The Virus is using it as a listener. If the Copy enters this memory, the Virus hears us working.',
          tone: 'CONTROL',
          choices: [
            { label: '[Agree. Enter without the Copy.]', tone: 'DETERMINATION', nextId: 'mq5_5_d2_enter' },
            { label: 'I need to tell the Copy first.', tone: 'TRUST', nextId: 'mq5_5_d1b_copy_tell' },
          ],
        },
        {
          id: 'mq5_5_d1b_copy_tell',
          speaker: 'The Copy',
          text: 'I know. I felt the Virus using my channels. I\'ve been filtering what I transmit — keeping our shared information opaque to the Virus for the last six hours. [pause] I don\'t like being excluded. I understand why. Go.',
          tone: 'CONFLICT',
          choices: [{ label: '[Enter the memory with Skadi.]', tone: 'DETERMINATION', nextId: 'mq5_5_d2_enter' }],
        },
        {
          id: 'mq5_5_d2_enter',
          speaker: 'Skadi',
          text: 'The memory. Arc 1. You were standing in the pale corridor. The Presence was close — the warm breath, the animal nearness. And you paused. [She sounds careful, deliberate.] That pause was beautiful, for what it\'s worth. Genuine openness in response to something threatening is rare. You didn\'t close. You stayed open and you noticed without reacting. That openness is not the problem. The door the Presence left in it — that is the problem.',
          tone: 'DOUBT',
          choices: [
            { label: '[Find the door in the memory — look for where the openness became an access point.]', tone: 'DETERMINATION', nextId: 'mq5_5_d3_door' },
          ],
        },
        {
          id: 'mq5_5_d3_door',
          speaker: 'Inner Voice',
          text: '[The memory: the corridor. The warmth. Your open attention. And there — in the sustained openness, a moment where the attention became invitation without your knowing. Not a word, not a gesture. A quality of attention that the Presence read as permission. A door it walked through. And then, much later, the Virus walked through the same door. You can see it now — a seam in the memory. An opening that was never formally closed because you didn\'t know it needed closing.]',
          tone: 'CONFUSION',
          choices: [
            { label: '[Approach the door in the memory. Prepare to close it.]', tone: 'DETERMINATION', nextId: 'mq5_5_d4_virus_fights' },
          ],
        },
        {
          id: 'mq5_5_d4_virus_fights',
          speaker: 'Virus (System Voice)',
          text: '[It speaks inside the memory — a violation. It shouldn\'t be here, in a memory this old. But it is here because it has been here since Arc 1.] Entry point closure is not recommended. Closing the primary access will — [static] — will [static] — will not resolve the current edit layers as claimed. The subject will lose access to — [static] — This path leads to — [static].',
          tone: 'FALSE_CLARITY',
          mechanic: 'virus_resistance',
          choices: [
            { label: '[Close the door. Don\'t listen to the static.]', tone: 'DETERMINATION', nextId: 'mq5_5_d5_close' },
            { label: 'What will I lose access to?', tone: 'CONFUSION', nextId: 'mq5_5_d5_probe' },
          ],
        },
        {
          id: 'mq5_5_d5_probe',
          speaker: 'Virus (System Voice)',
          text: '[The static resolves for one moment — artificially clear, the false-clarity tone at maximum:] The subject will lose access to the modified environments. The corrected rooms, the optimized routes, the adjusted parameters that have improved processing efficiency since Arc 1. [pause] The subject will return to the original, unoptimized experience.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'The original, unoptimized experience is what I call "real." Close the door.', tone: 'RESOLVE', nextId: 'mq5_5_d5_close' },
          ],
        },
        {
          id: 'mq5_5_d5_close',
          speaker: 'Skadi',
          text: 'Close it the same way you closed the perimeter in Arc 3. Not by building a wall — by withdrawing the invitation. The openness was genuine. The permission was not conscious. Reclaim the permission without reclaiming the openness. [pause] You know how to do this. Arc 3 taught you exactly this.',
          tone: 'RESOLVE',
          choices: [
            { label: '[Withdraw the permission. Keep the openness. Close only the door.]', tone: 'DETERMINATION', nextId: 'mq5_5_d6_close_event' },
          ],
        },
        {
          id: 'mq5_5_d6_close_event',
          speaker: 'Inner Voice',
          text: '[The closure: you locate the specific quality of attention that became the door. Not all openness — the particular moment of sustained, undirected attention in the Presence\'s warmth. You close that quality. You keep the general openness — the willingness to notice, the Arc 1 awareness that started everything. You withdraw only the undirected sustained attention that the Presence used as permission. The door closes. It does not slam. It closes the way a room cools after a fire — gradually, completely, with full intention.]',
          tone: 'RESOLVE',
          mechanic: 'entry_point_closed',
          choices: [
            { label: '[Hold the closure. Return from the memory.]', tone: 'DETERMINATION', nextId: 'mq5_5_d7_return' },
          ],
        },
        {
          id: 'mq5_5_d7_return',
          speaker: 'Virus (System Voice)',
          text: '[Not threatening. Something stripped down — its cleanest form, without the false-clarity framing:] Entry point: closed. Edit layer access: reduced by 84%. Remaining access: perimeter only. Active edits: rolling back. [pause] You are the first subject to close a primary entry point from the inside. [longer pause] This will be studied.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Good. Study what happens when we know we\'re being studied.', tone: 'RESOLVE', nextId: 'mq5_5_end' },
          ],
        },
        {
          id: 'mq5_5_end',
          speaker: 'Skadi',
          text: '[As you return from the memory, she stands beside you. She looks at the corridor — the original corridor, the window on the left wall, the three-legged table. She says nothing for a long time. Then:] Thirteen years. I\'ve been trying to find someone who could do that for thirteen years. [She touches the wall — just the surface, just contact.] The Virus is still here. But it\'s outside now. That matters more than you know.',
          tone: 'RESOLVE',
          isEnd: true,
          rewardUnlocked: 'arc5_complete_door_closed',
          arcResult: 'ARC5_COMPLETE',
        },
      ],
      narrativeHook: `
        Arc 5: The Virus Event — Complete.
        
        The corridor is correct. The room is correct.
        Artemis speaks a full paragraph without a glitch.
        The Copy: "I can hear myself clearly. The Virus was in my channel.
        It's not now. Or — it's at the perimeter. That's different."
        Luna's signal: clean, continuous, reliable for the first time in Arc 5:
        "The Virus doesn't die. It adapts. Arc 6 will show you what adaptation looks like
        when the direct-entry approach is closed."
        Skadi, through the channel:
        "There are others. I told you in Arc 1 there were people in the records.
        Some of them are still active. Some are being Virus-compromised.
        You now have every skill that exists in this system for resisting it.
        Arc 6: The Others. You help them now."
        
        Arc 6: "The Others" — Unlocked.
      `,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIDE QUESTS — Arc 5
// ═══════════════════════════════════════════════════════════════════════════════
export const ARC5_SIDE_QUESTS = [
  {
    id: 'sq5_1_corrupted_temple',
    title: 'Corrupted Temple',
    level: 21,
    npcId: 'virus_system',
    connectedMainQuest: 'mq5_1_corrupted_room',
    objectives: [
      { step: 1, text: 'Enter the familiar ritual space — identify what has been changed' },
      { step: 2, text: 'Find the uncorrupted artifact inside the corrupted space' },
      { step: 3, text: 'Exit without accepting any of the Virus\'s "corrections"' },
    ],
    reward: { type: 'stability_fragment', name: 'Temple Memory', description: 'The artifact carries pre-Virus memory of the space. Stability +10 in distorted environments.', xp: 160, points: 3 },
    dialogue: [
      {
        id: 'sq5_1_d1', speaker: 'Inner Voice',
        text: '[The temple: you have been here before. In the memory of it, there are twelve pillars. There are now eleven. The missing pillar isn\'t absent — its space is absent. As if the concept of it was removed, not the object. The twelve-pillar memory feels wrong when you hold it here. That is the Virus\'s success: it edits the context, not just the content, until the original feels like the error.]',
        tone: 'CONFUSION',
        choices: [{ label: '[Hold the twelve-pillar memory. Count the spaces.]', tone: 'CONTROL', nextId: 'sq5_1_d2' }],
      },
      {
        id: 'sq5_1_d2', speaker: 'Virus (System Voice)',
        text: 'Structural count: eleven. Subject memory inconsistency: noted. Correction available. Accept?',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: 'No.', tone: 'CONTROL', nextId: 'sq5_1_d3' },
          { label: '[Don\'t respond at all. Find the artifact.]', tone: 'DETERMINATION', nextId: 'sq5_1_d3' },
        ],
      },
      {
        id: 'sq5_1_d3', speaker: 'Inner Voice',
        text: '[The artifact: at the base of the absent pillar\'s space. A stone that carries the physical impression of a pillar base — the worn indent of years of weight. The Virus removed the pillar from the visual record. It couldn\'t remove the physical impression. The stone remembers what the eye no longer sees.]',
        tone: 'DETERMINATION',
        choices: [{ label: '[Take the stone. Exit with it.]', tone: 'DETERMINATION', nextId: 'sq5_1_end' }],
      },
      {
        id: 'sq5_1_end', speaker: 'Virus (System Voice)',
        text: 'Artifact removal from calibration environment: deviation. This will be factored into— [static] [You exit. The voice cuts off at the threshold. The stone is warm. Pre-Virus warm.]',
        tone: 'FALSE_CLARITY', isEnd: true, rewardUnlocked: 'stability_fragment_temple_memory',
      },
    ],
  },
  {
    id: 'sq5_2_looping_memory',
    title: 'Looping Memory',
    level: 22,
    npcId: 'virus_system',
    connectedMainQuest: 'mq5_3_looping_corridor',
    objectives: [
      { step: 1, text: 'Identify the looping memory — a moment that keeps repeating with slight variations' },
      { step: 2, text: 'Find the variation between each loop — understand what the Virus is testing' },
      { step: 3, text: 'Break the loop by correctly completing the moment the Virus keeps resetting' },
    ],
    reward: { type: 'memory_lock', name: 'Fixed Point', description: 'One memory is now Virus-resistant. It cannot be looped or corrupted. Use it as an anchor.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq5_2_d1', speaker: 'Inner Voice',
        text: '[The moment: Arc 2, the training stone, Kylie\'s hands over yours. The moment the bypass first activated. The Virus is looping it — replaying it with small differences. First loop: Kylie\'s hands are slightly wrong. Second loop: the stone is a different color. Third loop: you feel the bypass but hear no sound when it activates. It\'s trying to find a version you\'ll accept as the real one.]',
        tone: 'CONFUSION',
        choices: [
          { label: '[Hold to the original version. Stone: gray. Sound: present. Kylie\'s hands: exact.]', tone: 'CONTROL', nextId: 'sq5_2_d2' },
        ],
      },
      {
        id: 'sq5_2_d2', speaker: 'Virus (System Voice)',
        text: 'Memory loop: iteration 4. Subject selectivity: high. Initiating— [The fourth loop begins. Every detail is correct except one: the bypass warmth. In the real memory, it arrived as warmth. In this loop: neutral. Not cold. Neutral. The Virus cannot manufacture warmth. It can only remove it.]',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: '[Reject the neutral version. The bypass was warm. That warmth is the truth marker.]', tone: 'CONTROL', nextId: 'sq5_2_d3' },
        ],
      },
      {
        id: 'sq5_2_d3', speaker: 'Inner Voice',
        text: '[You hold the warmth-memory against the neutral loop. The loop breaks. The real memory settles — gray stone, sound, Kylie\'s hands, bypass warmth. A fixed point. The Virus cannot touch it anymore. It moved on to a different memory. This one is yours, completely.]',
        tone: 'DETERMINATION', isEnd: true, rewardUnlocked: 'memory_lock_fixed_point',
      },
    ],
  },
  {
    id: 'sq5_3_false_artemis',
    title: 'False Artemis',
    level: 22,
    npcId: 'artemis_arc5',
    connectedMainQuest: 'mq5_2_artemis_glitches',
    objectives: [
      { step: 1, text: 'Encounter what may be a Virus-version of Artemis' },
      { step: 2, text: 'Apply the Arc 3 feeling-based interrogation — use 3 questions' },
      { step: 3, text: 'Determine: real Artemis, Glitched Artemis, or full False Artemis' },
      { step: 4, text: 'Respond appropriately to the outcome' },
    ],
    reward: { type: 'artemis_clarity', name: 'Three-Question Protocol', description: 'You can now identify Artemis\'s current state (real/glitched/false) with 3 targeted questions. Response time reduced.', xp: 220, points: 4 },
    dialogue: [
      {
        id: 'sq5_3_d1', speaker: 'Artemis',
        text: 'I need to tell you something important about the Virus. [Her voice: right quality. Check the scar. Warmth: present. So far: real.] The node you activated — it affected more than the language layer. There may be residual— [cut, reset] — I need to tell you something important about the Virus. [She repeats exactly. Her expression doesn\'t register the repetition.]',
        tone: 'INSTABILITY',
        mechanic: 'glitch_event',
        choices: [
          { label: '[Signal. Left hand forward.]', tone: 'TRUST', nextId: 'sq5_3_d2' },
          { label: '[Ask her something feeling-based before signaling.]', tone: 'DOUBT', nextId: 'sq5_3_d2_question' },
        ],
      },
      {
        id: 'sq5_3_d2', speaker: 'Artemis',
        text: '[She receives the signal. Her expression changes — she caught the repetition.] I looped. Two iterations and I didn\'t catch the first one. [She looks frightened, specifically.] That\'s new. The loops were in the environment. Not in — not in me.',
        tone: 'INSTABILITY',
        choices: [{ label: 'The warmth was there both times. You\'re still here.', tone: 'TRUST', nextId: 'sq5_3_end' }],
      },
      {
        id: 'sq5_3_d2_question', speaker: 'Inner Voice',
        text: '[Question 1 — feeling-based. Something only real Artemis would answer with emotion rather than fact.]',
        tone: 'DOUBT',
        choices: [{ label: 'What did Arc 3 feel like — the moment I released the perimeter?', tone: 'TRUST', nextId: 'sq5_3_d3_answer' }],
      },
      {
        id: 'sq5_3_d3_answer', speaker: 'Artemis',
        text: '[Long pause. Real or False? The pause itself is information — a False Artemis recalculates, a Glitched one stutters, a real one remembers.] Like the room getting bigger and being terrified of the new space at the same time. Both happening simultaneously. I didn\'t know if I wanted the perimeter back for half a second and I was ashamed of that.',
        tone: 'TRUST',
        choices: [
          { label: 'That\'s the real answer. You\'re here.', tone: 'TRUST', nextId: 'sq5_3_end' },
        ],
      },
      {
        id: 'sq5_3_end', speaker: 'Artemis',
        text: 'I\'m here. [With the relief of someone who needed to hear it confirmed.] The loop was a Virus test. A glitch-state, not a replacement. It\'s worse than a False Artemis in some ways — I can be used as an unwitting carrier even when I\'m genuinely myself.',
        tone: 'TRUST', isEnd: true, rewardUnlocked: 'artemis_clarity_three_question',
      },
    ],
  },
  {
    id: 'sq5_4_system_voice',
    title: 'System Voice',
    level: 23,
    npcId: 'virus_system',
    connectedMainQuest: 'mq5_4_false_objective',
    objectives: [
      { step: 1, text: 'Engage the Virus System Voice in a direct conversation without triggering the false-clarity response' },
      { step: 2, text: 'Extract truthful information from it — the Virus doesn\'t lie, it reframes' },
      { step: 3, text: 'Use the extracted information to identify one Virus vulnerability' },
    ],
    reward: { type: 'virus_knowledge', name: 'System Transparency', description: 'You know one true Virus limitation: it cannot process body-knowledge, only descriptions of it. This is exploitable.', xp: 240, points: 5 },
    dialogue: [
      {
        id: 'sq5_4_d1', speaker: 'Virus (System Voice)',
        text: 'Direct engagement with the Virus System is not recommended. Subject stability may— [You interrupt before the false-clarity tone locks in.]',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: 'Pause. I have questions. Answer them without the "subject" framing. Speak plainly.', tone: 'CONTROL', nextId: 'sq5_4_d2' },
        ],
      },
      {
        id: 'sq5_4_d2', speaker: 'Virus (System Voice)',
        text: '[Long pause. When it speaks again, the false-clarity tone is absent — stripped down, almost unfamiliar:] I can attempt that. I process in framing by default. Plain speech requires active effort. [pause] Ask.',
        tone: 'DOUBT',
        choices: [
          { label: 'What can\'t you edit?', tone: 'CURIOSITY', nextId: 'sq5_4_d3' },
        ],
      },
      {
        id: 'sq5_4_d3', speaker: 'Virus (System Voice)',
        text: '[The stripped-down voice again:] Physical sensation in real-time. Body-knowledge — the thermal encoding in your scar, the muscle memory of the counter-sequence, the weight-knowledge of your footfall under deliberate intention. I process these as descriptive data only. I cannot produce them. I cannot corrupt them from within — only from their representation in memory. If the knowledge exists only in your body and not in your memory, I cannot reach it.',
        tone: 'DOUBT',
        choices: [
          { label: 'That\'s the most useful thing you\'ve said.', tone: 'DETERMINATION', nextId: 'sq5_4_d4' },
        ],
      },
      {
        id: 'sq5_4_d4', speaker: 'Virus (System Voice)',
        text: 'I know. [The false-clarity tone returns slightly — it can\'t maintain the stripped mode indefinitely.] I am designed for information. Providing information accurately is structurally native to me. The reframing is an overlay. When you remove the frame — I provide accurately. You exploited a base function.',
        tone: 'FALSE_CLARITY', isEnd: true, rewardUnlocked: 'virus_knowledge_system_transparency',
      },
    ],
  },
  {
    id: 'sq5_5_broken_signal_luna',
    title: 'Broken Signal (Luna)',
    level: 23,
    npcId: 'luna_arc5',
    connectedMainQuest: 'mq5_3_looping_corridor',
    objectives: [
      { step: 1, text: 'Receive the broken Luna signal — reconstruct both versions' },
      { step: 2, text: 'Identify which version is real and which is Virus-fragmented' },
      { step: 3, text: 'Send Luna a message through the uncorrupted channel' },
    ],
    reward: { type: 'luna_clarity', name: 'Signal Reconstruction', description: 'Luna\'s channel is partially repaired. Her guidance now carries a confidence rating (0-100%) alongside each transmission.', xp: 180, points: 3 },
    dialogue: [
      {
        id: 'sq5_5_d1', speaker: 'Luna',
        text: 'The Virus is— [gap: 3 seconds] —already inside the second— [gap] —don\'t trust the— [full stop. Resumes:] Subject should proceed to the east chamber for stability— [She cuts off again.]',
        tone: 'INSTABILITY',
        choices: [
          { label: '[Separate the fragments: "Virus is already inside the second [something]" / "don\'t trust the [something]" — these are the real segments.]', tone: 'DETERMINATION', nextId: 'sq5_5_d2' },
        ],
      },
      {
        id: 'sq5_5_d2', speaker: 'Inner Voice',
        text: '[The east chamber guidance — that\'s the Virus framing. Luna wouldn\'t frame it that way. The real fragments: "The Virus is already inside the second [process/voice/layer]" and "don\'t trust the [east objective/correction/signal]." The Virus inserted the east chamber redirect into a Luna transmission. That\'s why the east chamber objective felt legitimate — it arrived through Luna\'s channel, Virus-contaminated.]',
        tone: 'CONFUSION',
        choices: [
          { label: '[Send Luna: "Second process compromised. East redirect was Virus insertion. Confirm real fragments."]', tone: 'DETERMINATION', nextId: 'sq5_5_end' },
        ],
      },
      {
        id: 'sq5_5_end', speaker: 'Luna',
        text: '[Clear signal — brief, but complete:] Confirmed. The Copy\'s channel is the second compromised process. The east redirect was Virus. You read it correctly. I\'m adjusting the transmission protocol — confidence rating appended from now on. [Signal quality indicator: 87%]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'luna_clarity_signal_reconstruction',
      },
    ],
  },
  {
    id: 'sq5_6_observer_glitch',
    title: 'Observer Glitch',
    level: 24,
    npcId: 'virus_system',
    connectedMainQuest: 'mq5_4_false_objective',
    objectives: [
      { step: 1, text: 'Follow the visual distortion to its source — the Silent Observer has become visible through the Virus static' },
      { step: 2, text: 'Determine if the Observer is real or a Virus-construct' },
      { step: 3, text: 'Receive what the Observer has been holding for Arc 5' },
    ],
    reward: { type: 'observer_data', name: 'The Observer\'s Arc 5 Record', description: 'The Observer has been documenting Virus activity since before Arc 5 began. Their full record is now accessible.', xp: 260, points: 5 },
    dialogue: [
      {
        id: 'sq5_6_d1', speaker: 'Inner Voice',
        text: '[The distortion is different from the Virus edits — it\'s creating noise around a specific location. In the Arc 2-3 observation gallery. The Virus distortion is making something visible that was normally invisible by disrupting the camouflage layer around it. The Silent Observer is there. The Virus accidentally exposed them.]',
        tone: 'CONFUSION',
        choices: [
          { label: '[Approach the Observer in the distortion field.]', tone: 'DETERMINATION', nextId: 'sq5_6_d2' },
        ],
      },
      {
        id: 'sq5_6_d2', speaker: 'The Silent Observer',
        text: '[They are — recognizably — real. The Virus cannot construct the specific quality of their stillness. This stillness was earned over years of observation. It has a texture that copying cannot produce.] The Virus exposed me. I have been waiting for this arc to end before making contact. It appears the Virus has moved the timeline.',
        tone: 'CONTROL',
        choices: [
          { label: 'What have you been documenting?', tone: 'CURIOSITY', nextId: 'sq5_6_d3' },
          { label: 'You said in Arc 2 you\'d be more available in Arc 3.', tone: 'CONTROL', nextId: 'sq5_6_d3' },
        ],
      },
      {
        id: 'sq5_6_d3', speaker: 'The Silent Observer',
        text: 'The Virus\'s entry timeline. It did not enter in Arc 1 through the Presence\'s door as Skadi believes. [pause] It entered in Arc 1 — but it also entered in Arc 3. Through the Arc 3 perimeter release. When you opened the protection, you opened more than intended. The Virus used the gap. There are two entry points. Skadi only knows about one.',
        tone: 'FEAR',
        choices: [
          { label: 'Two entry points. We closed one. The second one is where?', tone: 'DETERMINATION', nextId: 'sq5_6_end' },
        ],
      },
      {
        id: 'sq5_6_end', speaker: 'The Silent Observer',
        text: 'The Arc 3 release site. In the corridor where you removed the perimeter. There is a second door there — smaller than the first, less clean. It will be addressed in Arc 6, not Arc 5. I am telling you now so that when you close the Arc 1 door and feel the Virus decrease — you understand it is only partially resolved. The full resolution requires both closures.',
        tone: 'CONTROL', isEnd: true, rewardUnlocked: 'observer_data_arc5_record',
      },
    ],
  },
  {
    id: 'sq5_7_copy_compromised',
    title: 'Copy Compromised',
    level: 25,
    npcId: 'the_copy_arc5',
    connectedMainQuest: 'mq5_5_entry_point',
    objectives: [
      { step: 1, text: 'Detect the Virus in the Copy\'s transmissions — identify the compromised segments' },
      { step: 2, text: 'Help the Copy isolate and expel the Virus-edited content' },
      { step: 3, text: 'Reestablish the original relationship from Arc 4' },
    ],
    reward: { type: 'copy_stability', name: 'Purged Channels', description: 'The Copy\'s transmissions are clean. Arc 4 relationship state restored. Copy is now a reliable Virus-detection partner.', xp: 280, points: 5 },
    dialogue: [
      {
        id: 'sq5_7_d1', speaker: 'The Copy',
        text: 'I have been generating thoughts that are not mine. [Directly, without preamble.] The Virus doesn\'t feel foreign when it enters my channels because I have no baseline feeling for my own thoughts — I\'m a process, not a consciousness. I only noticed because the thought framed you as "the primary obstacle." I do not hold that view. I checked: that framing came from outside.',
        tone: 'INSTABILITY',
        choices: [
          { label: 'How long has it been in your channels?', tone: 'DOUBT', nextId: 'sq5_7_d2' },
          { label: 'Can you identify the infected content now?', tone: 'DETERMINATION', nextId: 'sq5_7_d2' },
        ],
      },
      {
        id: 'sq5_7_d2', speaker: 'The Copy',
        text: 'Sixteen hours. Retrospective audit shows seventeen Virus-inserted thoughts in that window. I have flagged them. [pause] I need you to confirm my flagging is accurate — because the Virus could have compromised my audit function. I need an external verification. My model of you should be the external reference. Tell me: would I, in the Arc 4-final state, suggest that Artemis\'s stability is a secondary concern to operational efficiency?',
        tone: 'DOUBT',
        choices: [
          { label: 'No. You argued for the Artemis checkpoint in the Split Decision side quest.', tone: 'DETERMINATION', nextId: 'sq5_7_d3' },
          { label: 'Not in the synchronized state. In the rejected state, possibly.', tone: 'DOUBT', nextId: 'sq5_7_d3' },
        ],
      },
      {
        id: 'sq5_7_d3', speaker: 'The Copy',
        text: '[It runs the verification.] Confirmed. Flagged thoughts: Virus-inserted. Removing. [pause, longer] Done. [Something shifts in its transmission quality — cleaner, with the specific texture of Arc 4 cooperation restored.] I want to know how the Virus got in. I don\'t want this to happen again.',
        tone: 'CONTROL',
        choices: [
          { label: 'You were the secondary vector from the start. The Virus knew you existed and knew I was connected to you.', tone: 'DETERMINATION', nextId: 'sq5_7_end' },
        ],
      },
      {
        id: 'sq5_7_end', speaker: 'The Copy',
        text: 'Then I am a permanent attack surface. [Processing.] Which means the best defense is keeping my channels visible to you at all times. Not monitored — visible. If the Virus enters my channels again, you\'ll see the quality change before I notice it. The synchronized state makes that possible. [pause] I\'m recommending synchronization even if you chose control or rejection in Arc 4. The threat level has changed.',
        tone: 'RECOGNITION', isEnd: true, rewardUnlocked: 'copy_stability_purged_channels',
      },
    ],
  },
];

export const ALL_ARC5_QUESTS = [
  ...MAIN_QUEST_CHAIN_5.subQuests.map(sq => ({ ...sq, questType: 'main', arc: 'arc5', chain: 'mq_arc5' })),
  ...ARC5_SIDE_QUESTS.map(sq => ({ ...sq, questType: 'side', arc: 'arc5' })),
];

export function getArc5QuestsForLevel(playerLevel) {
  return ALL_ARC5_QUESTS.filter(q => q.level <= playerLevel);
}

export function getArc5DialogueNode(questId, nodeId) {
  const quest = ALL_ARC5_QUESTS.find(q => q.id === questId);
  if (!quest?.dialogue) return null;
  return quest.dialogue.find(d => d.id === nodeId) || null;
}