// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 5: "The Virus Event"
// Quest chain: Levels 21–25
// Main Quest 5: "Infection Protocol" (5 sub-quests) + 6 Side Quests
// Tone tags: CONFUSION | FEAR | FALSE_CLARITY | DISTORTION | INSTABILITY | PARANOIA | GRIEF
// ─────────────────────────────────────────────────────────────────────────────

// ── NPC REGISTRY (Arc 5 additions) ──────────────────────────────────────────
export const ARC5_NPCS = [
  {
    id: 'system_voice',
    name: 'System Voice',
    description: 'Artificial. Detached. Refers to the player as a process. Occasionally "corrects" reality. Not malicious — indifferent. Indifference is worse.',
    tint: 0x0a0a1a,
  },
  {
    id: 'artemis_arc5',
    name: 'Artemis',
    description: 'Glitching. Sometimes normal, sometimes confused, sometimes hostile. She knows something is wrong with her. She told you: if she turns again, do not listen to her. Holding to that instruction is one of the hardest things Arc 5 asks.',
    tint: 0x1a1a3a,
  },
  {
    id: 'copy_arc5',
    name: 'The Copy',
    description: 'More active. More intrusive. But in Arc 5, occasionally the clearest voice in the room — which is its own form of danger.',
    tint: 0x2a2a3a,
  },
  {
    id: 'false_artemis',
    name: 'False Artemis',
    description: 'She looks exactly right. She says everything you would want to hear. She is not Artemis.',
    tint: 0x3a1a1a,
  },
  {
    id: 'observer',
    name: 'The Observer',
    description: 'It has always been watching. The virus distortion makes it briefly visible. It does not speak. Its visibility is itself a message.',
    tint: 0x0a1a0a,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QUEST 5 — "Infection Protocol"
// ═══════════════════════════════════════════════════════════════════════════════
export const MAIN_QUEST_CHAIN_5 = {
  id: 'mq_arc5',
  title: 'Infection Protocol',
  arc: 'Arc 5: The Virus Event',
  description: 'Something is rewriting the environment. Not the Presence — the Presence reads. Not the architect — the architect suppresses. This is something that edits. It does not want to harm you. It wants to improve you. That is the part that makes it dangerous.',
  subQuests: [

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 1 — "First Corruption"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq5_1_first_corruption',
      title: 'First Corruption',
      level: 21,
      npcId: 'artemis_arc5',
      narrativeSetup: `
        The environment stabilizes after the Copy resolution — for a moment.
        You recognize the corridor. You have walked it before.
        The walls are the same color. The light falls at the same angle.
        Artemis is to your left. She says your name.
        Then she says it again.
        Same word. Same tone. Marginally different breath behind it — as if the first
        one was played back from a recording and the second was live.
        You stop walking. The walls are still the same color.
        But something in the quality of the stillness is wrong.
        Stillness has texture. This one is too smooth.
      `,
      objectives: [
        { step: 1, text: 'Explore the altered zone — identify three inconsistencies in the environment' },
        { step: 2, text: 'Speak to Artemis — determine if she is aware of the repetition' },
        { step: 3, text: 'Identify the first distortion event — what changed and when' },
        { step: 4, text: 'Evaluate the shifting objective marker — follow or reject it' },
      ],
      reward: {
        type: 'distortion_awareness',
        name: 'First Marker',
        description: 'The first distortion is named. Reality audit system active. Inconsistency detection rate +30%. Virus events flagged before they fully render.',
        xp: 220,
        points: 5,
      },
      dialogue: [
        {
          id: 'mq5_1_d1_name',
          speaker: 'Artemis',
          text: '[Your name.] …You\'re back.',
          tone: 'DISTORTION',
          glitch: false,
          choices: [
            { label: '[Listen carefully. Wait for it.]', tone: 'PARANOIA', nextId: 'mq5_1_d1b_repeat' },
          ],
        },
        {
          id: 'mq5_1_d1b_repeat',
          speaker: 'Artemis',
          text: '[Your name.] …You\'re back.',
          tone: 'DISTORTION',
          glitch: true,
          glitchNote: 'Second iteration — same words, fractionally different breathing pattern. The repetition is real.',
          choices: [
            { label: '…You said that twice.', tone: 'CONFUSION', nextId: 'mq5_1_d2_deny' },
          ],
        },
        {
          id: 'mq5_1_d2_deny',
          speaker: 'Artemis',
          text: 'No, I didn\'t.',
          tone: 'DISTORTION',
          choices: [
            { label: 'Something\'s wrong here.', tone: 'INSTABILITY', nextId: 'mq5_1_d3_wrong' },
            { label: 'You just repeated yourself.', tone: 'CONFUSION', nextId: 'mq5_1_d3_repeated' },
            { label: 'Stay close. Don\'t move.', tone: 'CONTROL', nextId: 'mq5_1_d3_close' },
          ],
        },
        {
          id: 'mq5_1_d3_wrong',
          speaker: 'Artemis',
          text: 'I feel it too. [She looks at the wall — it is the same color it always is, which is part of the problem.] Like something is watching differently. Not the Presence-watching. The Presence observes your decisions. This is observing the environment around you. Like someone is running a test.',
          tone: 'PARANOIA',
          choices: [
            { label: 'A test of what?', tone: 'CONFUSION', nextId: 'mq5_1_d4_objective' },
          ],
        },
        {
          id: 'mq5_1_d3_repeated',
          speaker: 'Artemis',
          text: 'I didn\'t— [her voice stutters, the sound of it hiccupping at the consonants] I didn\'t— I didn\'t— [a pause. She blinks.] …say that.',
          tone: 'DISTORTION',
          glitch: true,
          glitchNote: 'Speech repetition loop. She is aware of the loop while inside it. That awareness is important — she is not fully compromised yet.',
          choices: [
            { label: '[Stay still. Watch her recover.]', tone: 'CONTROL', nextId: 'mq5_1_d3b_recover' },
          ],
        },
        {
          id: 'mq5_1_d3b_recover',
          speaker: 'Artemis',
          text: '[She steadies herself against the wall — places her palm flat against it as if checking its reality.] That was — [she doesn\'t finish the sentence. She looks at her palm.] The wall is real. [pause] I\'m trying to establish what\'s real.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'The wall is real. You\'re real. Something else isn\'t.', tone: 'CONTROL', nextId: 'mq5_1_d4_objective' },
          ],
        },
        {
          id: 'mq5_1_d3_close',
          speaker: 'Artemis',
          text: '…Okay. [A pause. She does not ask why. She trusts you. The trust is still clean.] I trust you.',
          tone: 'CONFUSION',
          choices: [
            { label: '[Look at the objective marker. Something has changed there.]', tone: 'PARANOIA', nextId: 'mq5_1_d4_objective' },
          ],
        },
        {
          id: 'mq5_1_d4_objective',
          speaker: 'Inner Voice',
          text: '[The objective marker in the top corner of awareness — the navigational signal you\'ve used since Arc 1 — reads: PROTECT ARTEMIS. Then it flickers. For 0.4 seconds it reads: APPROACH ENTITY. Then it returns to: PROTECT ARTEMIS. You were not supposed to see the interim state.]',
          tone: 'PARANOIA',
          mechanic: 'objective_flicker',
          choices: [
            { label: '[Internal: That wasn\'t there before.]', tone: 'CONFUSION', nextId: 'mq5_1_d5_system' },
          ],
        },
        {
          id: 'mq5_1_d5_system',
          speaker: 'System Voice',
          text: 'Objective updated.',
          tone: 'FALSE_CLARITY',
          glitch: false,
        },
        {
          id: 'mq5_1_d5b_system',
          speaker: 'System Voice',
          text: 'Correction: Objective was always present.',
          tone: 'FALSE_CLARITY',
          glitch: true,
          glitchNote: 'The System Voice retroactively rewrites what just happened. This is its primary operation: not changing the future, changing the past.',
          choices: [
            { label: '[Respond to the System Voice.]', tone: 'INSTABILITY', nextId: 'mq5_1_d6_copy_warn' },
          ],
        },
        {
          id: 'mq5_1_d6_copy_warn',
          speaker: 'The Copy',
          text: '[Quiet. Barely present — a whisper from the edge of the decision space.] Don\'t follow that.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Which one? Protect Artemis, or approach the entity?', tone: 'CONFUSION', nextId: 'mq5_1_d7_copy_answer' },
            { label: '[Say nothing. Hold position. Watch what the marker does next.]', tone: 'CONTROL', nextId: 'mq5_1_d7_hold' },
          ],
        },
        {
          id: 'mq5_1_d7_copy_answer',
          speaker: 'The Copy',
          text: 'The second one. The first is yours. The second was inserted.',
          tone: 'INSTABILITY',
          choices: [
            { label: '[Hold PROTECT ARTEMIS. Reject APPROACH ENTITY.]', tone: 'CONTROL', nextId: 'mq5_1_d8_end' },
          ],
        },
        {
          id: 'mq5_1_d7_hold',
          speaker: 'System Voice',
          text: 'Inaction noted.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: '[Inaction is a choice. Hold it deliberately.]', tone: 'CONTROL', nextId: 'mq5_1_d8_end' },
          ],
        },
        {
          id: 'mq5_1_d8_end',
          speaker: 'Artemis',
          text: 'Why does it feel like something just… changed the rules?',
          tone: 'DISTORTION',
          choices: [
            {
              label: 'Because it did. And it wants us not to notice.',
              tone: 'PARANOIA',
              nextId: 'mq5_1_d9_confirm',
            },
            {
              label: 'The rules were already different before we got here.',
              tone: 'INSTABILITY',
              nextId: 'mq5_1_d9_confirm',
            },
          ],
        },
        {
          id: 'mq5_1_d9_confirm',
          speaker: 'Inner Voice',
          text: '[Three environment inconsistencies confirmed: (1) Artemis\'s double-utterance — playback artifact, not behavioral. (2) The objective marker\'s interim state — APPROACH ENTITY was inserted, not native. (3) The smoothness of the stillness — texture-absence indicates constructed space, not natural. The virus is not chaos. It is precise editing.] First distortion named.',
          tone: 'PARANOIA',
          isEnd: true,
          rewardUnlocked: 'distortion_awareness_first_marker',
        },
      ],
      narrativeHook: `
        You stand in the corridor and catalogue what has changed.
        The walls are the same color. The light falls at the same angle.
        Three things are wrong that you can name. There are probably more.
        Artemis says: "It felt like someone adjusting a stage set while we were standing on it.
        Not destroying it. Adjusting it."
        The Copy is quiet for a long time. Then:
        "The distortion isn't random. It's targeted. It's learning your environment
        from the inside and editing the pieces it thinks you won't check."
        You look at the wall. You check it.
        The wall is real. The wall has texture.
        You make a note: check the texture. When something is wrong,
        the wrong thing will be too smooth.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 2 — "False Direction"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq5_2_false_direction',
      title: 'False Direction',
      level: 22,
      npcId: 'artemis_arc5',
      narrativeSetup: `
        The corridor branches. You have been in both branches before —
        in Arc 2, the left branch led to the Winter chamber antechamber,
        the right branch to the recording room.
        Artemis says: go left. She remembers this place.
        The Copy says nothing yet. It is watching the environment, not you.
        The left branch is familiar. Familiar is not the same as safe.
        The right branch has changed — you can feel the change from the junction.
        Changed is not the same as wrong.
        The System Voice does not recommend a path. It notes that you are choosing.
        That observation is the most unsettling thing in the corridor.
      `,
      objectives: [
        { step: 1, text: 'Choose between the two conflicting paths at the junction' },
        { step: 2, text: 'Navigate whichever path you chose — identify the loop mechanism' },
        { step: 3, text: 'Detect the point where the environment resets' },
        { step: 4, text: 'Break the loop using a deliberate decision the virus has not modeled' },
      ],
      reward: {
        type: 'loop_break',
        name: 'Loop Recognition',
        description: 'You identified the reset point and broke the loop with an unmodeled decision. Looping environments now have a visible seam. Navigation clarity increased.',
        xp: 270,
        points: 5,
      },
      dialogue: [
        {
          id: 'mq5_2_d1_fork',
          speaker: 'Artemis',
          text: 'Go left. I remember this place. The left branch leads past the Winter antechamber — it\'s the faster route to the stabilization point.',
          tone: 'CONFUSION',
          choices: [
            { label: 'I trust Artemis.', tone: 'GRIEF', nextId: 'mq5_2_d2_left' },
            { label: 'I trust the Copy.', tone: 'INSTABILITY', nextId: 'mq5_2_d2_right' },
            { label: 'Neither of you are reliable right now.', tone: 'CONTROL', nextId: 'mq5_2_d2_neither' },
          ],
        },
        {
          id: 'mq5_2_d2_left',
          speaker: 'Inner Voice',
          text: '[Left branch. The Winter antechamber texture — correct. The smell of cold stone — correct. Thirty steps in, the corridor narrows exactly as it should. Forty steps — a bend. Past the bend, the stabilization alcove should be visible.]',
          tone: 'FALSE_CLARITY',
        },
        {
          id: 'mq5_2_d2b_left_reset',
          speaker: 'Artemis',
          text: 'We\'re close — [she stops. Her hand goes out. She is touching a wall she has touched before.] This wall. [pause] We were just here.',
          tone: 'DISTORTION',
          glitch: true,
          choices: [
            { label: '…We were just here.', tone: 'CONFUSION', nextId: 'mq5_2_d3_loop_left' },
          ],
        },
        {
          id: 'mq5_2_d3_loop_left',
          speaker: 'Artemis',
          text: 'That\'s not possible. [She is shaken — the specific quality of her shakeness is that she trusted her memory and the environment betrayed it, which is different from her being wrong.] My memory is right. The place is wrong.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Your memory is right. The place is being reset. They\'re different things.', tone: 'CONTROL', nextId: 'mq5_2_d4_break' },
          ],
        },
        {
          id: 'mq5_2_d2_right',
          speaker: 'The Copy',
          text: 'Watch what happens.',
          tone: 'INSTABILITY',
        },
        {
          id: 'mq5_2_d2b_right_shift',
          speaker: 'Inner Voice',
          text: '[Right branch. Changed — yes. The floor has a different texture than it did in Arc 2. The light source is three degrees further right than it should be. These are edits, not replacements. Fifteen steps in — the ground shifts beneath the right foot. Not a collapse. A deliberate repositioning.]',
          tone: 'DISTORTION',
          choices: [
            { label: 'The ground just moved.', tone: 'CONFUSION', nextId: 'mq5_2_d3_right' },
          ],
        },
        {
          id: 'mq5_2_d3_right',
          speaker: 'The Copy',
          text: 'Exactly. [pause] The right path is being edited in real time. The left path was pre-edited and loops. Between a real-time edit and a loop — the real-time edit is more dangerous and more honest.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Honest because I can see it changing.', tone: 'CONTROL', nextId: 'mq5_2_d4_break' },
            { label: 'Why would the virus use a real-time edit here instead of a loop?', tone: 'PARANOIA', nextId: 'mq5_2_d3b_why' },
          ],
        },
        {
          id: 'mq5_2_d3b_why',
          speaker: 'The Copy',
          text: 'Because it\'s testing your response to visible change versus hidden repetition. Two different instruments. It wants to know which disorientation affects your decision-making more: the obvious shift or the unnoticed return.',
          tone: 'PARANOIA',
          choices: [
            { label: 'Deny it both data points. Break the pattern.', tone: 'CONTROL', nextId: 'mq5_2_d4_break' },
          ],
        },
        {
          id: 'mq5_2_d2_neither',
          speaker: 'Inner Voice',
          text: '[You stand at the junction. Neither path. The System Voice notes your position. The Copy is watching. Artemis waits — she is holding her instinct. The junction itself is a location. You examine the junction.]',
          tone: 'CONTROL',
          mechanic: 'third_option_junction',
        },
        {
          id: 'mq5_2_d2b_neither_observe',
          speaker: 'System Voice',
          text: 'Observation detected.',
          tone: 'FALSE_CLARITY',
        },
        {
          id: 'mq5_2_d2c_neither_loop',
          speaker: 'Artemis',
          text: '[The loop triggers — her voice begins again, slightly different phrasing:] Go left… I think…',
          tone: 'DISTORTION',
          glitch: true,
          glitchNote: 'Second iteration of the suggestion — "I remember" has become "I think." The virus degraded her confidence slightly in the loop.',
          choices: [
            { label: '[Catch the difference. "I remember" became "I think." The loop erodes certainty.]', tone: 'PARANOIA', nextId: 'mq5_2_d4_break' },
          ],
        },
        {
          id: 'mq5_2_d4_break',
          speaker: 'Inner Voice',
          text: '[The loop break requires an action the virus has not observed you take. Review: what is something you have not done in this corridor before? In Arc 2, you walked. In Arc 3, you paused. In the junction moment of Arc 4, you waited. This time — do something physically distinct from any prior traversal of this space.]',
          tone: 'CONTROL',
          mechanic: 'unmodeled_action_required',
          choices: [
            {
              label: '[Sit down in the middle of the corridor. Full stop. The virus has no behavioral data for this.]',
              tone: 'CONTROL',
              nextId: 'mq5_2_d5_break_result',
              mechanic: 'loop_break_sit',
            },
            {
              label: '[Walk backward out of the loop — reverse the movement pattern entirely.]',
              tone: 'CONTROL',
              nextId: 'mq5_2_d5_break_result',
              mechanic: 'loop_break_reverse',
            },
            {
              label: '[Speak out loud to the environment directly — address the virus as if it can hear you, because it can.]',
              tone: 'CONTROL',
              nextId: 'mq5_2_d5_break_result',
              mechanic: 'loop_break_address',
            },
          ],
        },
        {
          id: 'mq5_2_d5_break_result',
          speaker: 'System Voice',
          text: 'Unmodeled behavior recorded.',
          tone: 'FALSE_CLARITY',
          glitch: true,
          glitchNote: 'The System Voice acknowledges the break. This acknowledgment is itself data — the virus is learning from the loop break in real time. It will not fall for the same method twice.',
        },
        {
          id: 'mq5_2_d5b_loop_breaks',
          speaker: 'Inner Voice',
          text: '[The loop seam appears: a line in the floor approximately two centimeters wide, running wall to wall, where the reset point was. Barely visible — but present. Texture-break. The corridor continues forward, un-looped.]',
          tone: 'PARANOIA',
          isEnd: true,
          rewardUnlocked: 'loop_break_loop_recognition',
        },
      ],
      narrativeHook: `
        You mark the loop seam mentally: two centimeters wide, floor-level, slight color
        variance at the edge. The virus uses seams. The seams are its tells.
        Artemis: "It's not just changing things. It's learning."
        The Copy: "Yes. But it's learning from behavior data — the same source it used to
        build me. That means I understand its learning rate. And I understand yours.
        The question is which of us updates faster."
        You consider that the Copy and the virus have the same raw material.
        That the difference between them may be a question of intent —
        and that intent is a thing you cannot fully verify from the inside.
        The corridor continues. Forward. Un-looped. For now.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 3 — "Artemis Glitch"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq5_3_artemis_glitch',
      title: 'Artemis Glitch',
      level: 23,
      npcId: 'artemis_arc5',
      narrativeSetup: `
        Artemis said, at the end of Arc 4: "If I turn again — don't listen to me."
        She is turning.
        Not continuously — in spikes. Most of the time she is present, oriented, herself.
        Then something intercepts the signal and for three to eight seconds
        she is something else: confused about where she is, hostile about a reason
        she can't name, saying things that contradict everything she has said before.
        The spikes are getting closer together.
        The System Voice, when you notice the spikes, says: "Nominal."
        The Copy says nothing during the spikes.
        That silence, more than anything, is the tell that something serious is happening.
      `,
      objectives: [
        { step: 1, text: 'Stay near Artemis through three consecutive glitch spikes' },
        { step: 2, text: 'Respond correctly to each spike — grounding her without contradiction' },
        { step: 3, text: 'Determine if the glitching is virus interference or genuine instability' },
        { step: 4, text: 'Prevent the shutdown state — keep her anchor active' },
      ],
      reward: {
        type: 'artemis_anchor',
        name: 'Shared Anchor',
        description: 'Artemis\'s anchor is stabilized. You are the anchor. Glitch spike frequency reduced by half. If Artemis enters shutdown state, you can pull her back.',
        xp: 340,
        points: 6,
      },
      dialogue: [
        {
          id: 'mq5_3_d1_normal',
          speaker: 'Artemis',
          text: 'I\'m okay. [She says it the way someone says something they\'re checking rather than reporting.]',
          tone: 'INSTABILITY',
          choices: [
            { label: '[Listen. Wait for the spike.]', tone: 'CONTROL', nextId: 'mq5_3_d1b_spike1' },
          ],
        },
        {
          id: 'mq5_3_d1b_spike1',
          speaker: 'Artemis',
          text: '…I\'m not okay. [the voice shifts — not distorted, just fractured. She knows something is wrong but not what.] I\'m—',
          tone: 'DISTORTION',
          glitch: true,
        },
        {
          id: 'mq5_3_d1c_spike1_cut',
          speaker: 'Artemis',
          text: '[Voice cuts. Returns after 2.3 seconds.] —something\'s interrupting. Every few minutes there\'s a gap. I\'m in the gap right now and I can feel it.',
          tone: 'DISTORTION',
          choices: [
            { label: 'Focus. Stay with me.', tone: 'CONTROL', nextId: 'mq5_3_d2_focus' },
            { label: 'What\'s happening to you?', tone: 'GRIEF', nextId: 'mq5_3_d2_whats_happening' },
            { label: 'This isn\'t you.', tone: 'INSTABILITY', nextId: 'mq5_3_d2_not_you' },
          ],
        },
        {
          id: 'mq5_3_d2_focus',
          speaker: 'Artemis',
          text: 'I\'m trying. [She inhales. It steadies her — breathing is something the virus has not found a way to intercept yet.] Something is — interrupting the signal between what I perceive and what I respond with. I perceive normally. The response comes out wrong.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'Perception intact, response disrupted. That\'s useful — keep perceiving. Tell me what you see.', tone: 'CONTROL', nextId: 'mq5_3_d3_spike2' },
          ],
        },
        {
          id: 'mq5_3_d2_whats_happening',
          speaker: 'Artemis',
          text: 'It feels like I\'m being overwritten. [She says it precisely — not "edited" or "changed," but overwritten. Which implies there is a version of her underneath what is being written on top.] There is still something underneath. But the surface keeps changing.',
          tone: 'DISTORTION',
          choices: [
            { label: 'The underneath is you. I\'m talking to the underneath. The surface is the virus.', tone: 'CONTROL', nextId: 'mq5_3_d3_spike2' },
          ],
        },
        {
          id: 'mq5_3_d2_not_you',
          speaker: 'Artemis',
          text: '[A spike — sudden, sharp.] Then who am I? [She is facing you directly and her expression is wrong — not hostile, not confused. Empty. Like the underlying process has been interrupted and what is running in its place doesn\'t know how to run her face.] ANSWER ME. Who am I if this isn\'t me?',
          tone: 'DISTORTION',
          glitch: true,
          choices: [
            {
              label: 'You\'re Artemis. You told me in Arc 3 what makes you you — I remember. The underneath is still there.',
              tone: 'CONTROL',
              nextId: 'mq5_3_d2b_hostile_recover',
            },
            {
              label: '[Don\'t answer. This is a spike. Wait it out without escalating.]',
              tone: 'CONTROL',
              nextId: 'mq5_3_d2b_hostile_wait',
            },
          ],
        },
        {
          id: 'mq5_3_d2b_hostile_recover',
          speaker: 'Artemis',
          text: '[The spike breaks. She blinks. Her face returns to her face.] …I did. Tell you that. [pause] What did I just say to you?',
          tone: 'INSTABILITY',
          choices: [
            { label: 'You asked who you were. It was a spike.', tone: 'CONTROL', nextId: 'mq5_3_d3_spike2' },
          ],
        },
        {
          id: 'mq5_3_d2b_hostile_wait',
          speaker: 'Inner Voice',
          text: '[You hold. The spike runs its course — seven seconds. It does not escalate without your engagement. She returns on her own, faster than if you had argued with it.]',
          tone: 'CONTROL',
          choices: [
            { label: '[Note: non-engagement ends spikes faster than argument.]', tone: 'PARANOIA', nextId: 'mq5_3_d3_spike2' },
          ],
        },
        {
          id: 'mq5_3_d3_spike2',
          speaker: 'System Voice',
          text: 'Subject experiencing nominal fluctuation.',
          tone: 'FALSE_CLARITY',
        },
        {
          id: 'mq5_3_d3b_copy',
          speaker: 'The Copy',
          text: '[Still quiet. Then, almost inaudibly:] That\'s not her.',
          tone: 'INSTABILITY',
          choices: [
            { label: '[Spike 2 approaching — you feel it before it happens. The texture of the air changes.]', tone: 'PARANOIA', nextId: 'mq5_3_d4_spike2_event' },
          ],
        },
        {
          id: 'mq5_3_d4_spike2_event',
          speaker: 'Artemis',
          text: 'You\'re the problem. [She says it with complete clarity and complete conviction. No distortion in the voice — that is the most alarming part. She is looking at you with the expression of someone who has just understood something important, except the understanding is wrong.] You brought this here. The distortion follows you.',
          tone: 'DISTORTION',
          glitch: true,
          choices: [
            {
              label: '[Don\'t respond to the content. Address only the spike.] Artemis. Breathe. This is the virus speaking.',
              tone: 'CONTROL',
              nextId: 'mq5_3_d4b_spike2_anchor',
            },
            {
              label: '[Internal: Is she right? Did the distortion follow me? No — check the timeline. The distortion started in the environment before she said anything.] That\'s not true and the timeline confirms it.',
              tone: 'CONTROL',
              nextId: 'mq5_3_d4b_spike2_anchor',
            },
          ],
        },
        {
          id: 'mq5_3_d4b_spike2_anchor',
          speaker: 'System Voice',
          text: 'Correction: That is her.',
          tone: 'FALSE_CLARITY',
          glitch: true,
          glitchNote: 'The System Voice contradicts the Copy. Both statements — "that\'s not her" and "that is her" — are attempting to shape your interpretation. The real question is what she needs right now, not which voice is correct.',
          choices: [
            { label: '[Ignore both. Keep grounding Artemis.]', tone: 'CONTROL', nextId: 'mq5_3_d5_spike2_return' },
          ],
        },
        {
          id: 'mq5_3_d5_spike2_return',
          speaker: 'Artemis',
          text: '[The spike breaks. She exhales. Her eyes come back.] I said something wrong.',
          tone: 'GRIEF',
          choices: [
            { label: 'Yes. But you came back.', tone: 'RESOLVE', nextId: 'mq5_3_d6_spike3' },
          ],
        },
        {
          id: 'mq5_3_d6_spike3',
          speaker: 'Artemis',
          text: '[The third spike — the longest one. She goes very quiet. Fourteen seconds of absolute stillness. Her eyes do not track. Her breathing is present but shallow. This is the edge of the shutdown state.]',
          tone: 'DISTORTION',
          glitch: true,
          mechanic: 'shutdown_state_edge',
          choices: [
            {
              label: '[Use the Arc 3 link — the specific connection built during the perimeter work. Not a verbal prompt. A presence.]',
              tone: 'CONTROL',
              mechanic: 'arc3_link_activation',
              nextId: 'mq5_3_d7_anchor',
            },
            {
              label: '[Say her name. Once. With the full weight of three arcs behind it.]',
              tone: 'GRIEF',
              nextId: 'mq5_3_d7_name',
            },
          ],
        },
        {
          id: 'mq5_3_d7_anchor',
          speaker: 'Inner Voice',
          text: '[The link activates — the perimeter-warmth from Arc 3. You extend it into the shutdown space. It finds something underneath the stillness. The underneath responds. Not fully — a partial return. Enough.]',
          tone: 'RESOLVE',
          choices: [
            { label: '[Hold the link until she fully returns.]', tone: 'RESOLVE', nextId: 'mq5_3_d8_return' },
          ],
        },
        {
          id: 'mq5_3_d7_name',
          speaker: 'Inner Voice',
          text: '[Her name. Once. The full weight of every moment in the three arcs where her presence was the thing that made survival possible. The weight lands in the shutdown space and the underneath hears it.]',
          tone: 'GRIEF',
          choices: [
            { label: '[Wait.]', tone: 'RESOLVE', nextId: 'mq5_3_d8_return' },
          ],
        },
        {
          id: 'mq5_3_d8_return',
          speaker: 'Artemis',
          text: '[She comes back. Slower than the first two spikes. But complete.] …If I turn again… [she is choosing to say this while she is present, for the moments she won\'t be] …don\'t listen to me.',
          tone: 'GRIEF',
          isEnd: true,
          rewardUnlocked: 'artemis_anchor_shared_anchor',
        },
      ],
      narrativeHook: `
        Three spikes. You held through all three.
        The shared anchor is established — the Arc 3 link, the name, the weight of presence.
        These are what the virus cannot replicate because they are relational.
        The virus can edit an environment. It cannot manufacture a three-arc history.
        The Copy, when Artemis stabilizes: "The shutdown state is designed.
        If she reaches it fully and stays — the virus doesn't need to fight you.
        It just takes her. And then you're alone in an edited environment with no anchor."
        You understand now why protecting Artemis is not protective instinct.
        It is survival architecture.
        She is not just someone you care about. She is the proof
        that the environment around you contains something real.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 4 — "Infection Peak"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq5_4_infection_peak',
      title: 'Infection Peak',
      level: 24,
      npcId: 'artemis_arc5',
      narrativeSetup: `
        Three Artemises. You know that is not a sentence that should be possible.
        You stand at the entrance to the core zone — the space Skadi described
        in Arc 4 as where the original permissions were granted, where the Consent
        mechanism first became operational.
        Three voices saying her name in three different intonations.
        Two of them are constructed. One is real.
        The System Voice says all three are valid. The Copy says you're guessing.
        Both are correct. The question is whether "guessing" is the same
        as "deciding" — and whether deciding is something you can still do
        when every input into the decision has been compromised.
      `,
      objectives: [
        { step: 1, text: 'Identify which of the three Artemis instances is real' },
        { step: 2, text: 'Ignore false prompts from System Voice and constructed instances' },
        { step: 3, text: 'Resist the forced input override that happens mid-identification' },
        { step: 4, text: 'Reach the core zone with the real Artemis' },
      ],
      reward: {
        type: 'perception_filter',
        name: 'Reliable Witness',
        description: 'You identified the real Artemis under maximum distortion. Constructed NPC detection active. False instances now have a visible distinction — a slight delay in their blink rate.',
        xp: 420,
        points: 7,
      },
      dialogue: [
        {
          id: 'mq5_4_d1_three',
          speaker: 'Artemis #1',
          text: 'Over here! [The voice is right — exact intonation. The urgency is calibrated correctly. She knows you might not come unless the urgency is right.]',
          tone: 'FALSE_CLARITY',
        },
        {
          id: 'mq5_4_d1b_three',
          speaker: 'Artemis #2',
          text: 'No — don\'t trust that one! [The voice is also right. The distrust is calibrated — she knows you\'ve been learning to distrust, so the constructed version tells you not to trust the other one.]',
          tone: 'DISTORTION',
        },
        {
          id: 'mq5_4_d1c_three',
          speaker: 'Inner Voice',
          text: '[Artemis #3 is not speaking. She is standing at the left edge of the space. She is watching you. She has not tried to direct you. She is waiting to see what you do, the way the real Artemis waits rather than directs in high-stakes moments.]',
          tone: 'PARANOIA',
          choices: [
            { label: '[Follow Artemis #1 — urgency response]', tone: 'FALSE_CLARITY', nextId: 'mq5_4_d2_false1' },
            { label: '[Follow Artemis #2 — distrust response]', tone: 'DISTORTION', nextId: 'mq5_4_d2_false2' },
            { label: '[Approach Artemis #3 — the silent one]', tone: 'CONTROL', nextId: 'mq5_4_d2_real' },
          ],
        },
        {
          id: 'mq5_4_d2_false1',
          speaker: 'System Voice',
          text: 'Direction accepted.',
          tone: 'FALSE_CLARITY',
        },
        {
          id: 'mq5_4_d2b_false1',
          speaker: 'The Copy',
          text: 'Wrong one.',
          tone: 'INSTABILITY',
          choices: [
            { label: '[Override the accepted direction. Pull back to the junction.]', tone: 'CONTROL', nextId: 'mq5_4_d2_real' },
          ],
        },
        {
          id: 'mq5_4_d2_false2',
          speaker: 'System Voice',
          text: 'Distrust pattern noted. Adjusting.',
          tone: 'FALSE_CLARITY',
          glitch: true,
          glitchNote: 'The System Voice is learning your distrust pattern in real time — the second time you distrust something, the constructed instance will be configured to look like whatever you last trusted.',
          choices: [
            { label: '[The System Voice adjusting means this is the wrong one too. Pull back.]', tone: 'PARANOIA', nextId: 'mq5_4_d2_real' },
          ],
        },
        {
          id: 'mq5_4_d2_real',
          speaker: 'Artemis',
          text: '[You approach the silent one. She watches you come. She does not direct you. She does not warn you away from the others. She simply stands and waits until you are close enough for her to say, quietly:] You\'re close. Don\'t let it decide for you.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'How do I know you\'re real?', tone: 'PARANOIA', nextId: 'mq5_4_d3_verify' },
            { label: '[The verification — check her blink rate.]', tone: 'CONTROL', nextId: 'mq5_4_d3_verify_blink' },
          ],
        },
        {
          id: 'mq5_4_d3_verify',
          speaker: 'Artemis',
          text: 'You don\'t. Not with certainty. [pause] I know that\'s the wrong answer for this moment. But it\'s the true one. What I can tell you is that I didn\'t try to direct you. The others tried to direct you. I waited. Which is what I do.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'That\'s true. You wait. I\'ve seen it three arcs of times.', tone: 'RESOLVE', nextId: 'mq5_4_d4_override' },
          ],
        },
        {
          id: 'mq5_4_d3_verify_blink',
          speaker: 'Inner Voice',
          text: '[Blink rate check: Artemis #1 — 0.3 seconds too regular. Artemis #2 — no blink at all during her speech. Artemis #3 — irregular. Not a glitch — the irregularity of someone who is nervous and present. Nervous-and-present blink rate is unmodelable because it requires genuine emotional state to produce.]',
          tone: 'CONTROL',
          choices: [
            { label: 'Your blink rate is irregular. That means you\'re nervous. The others weren\'t.', tone: 'RESOLVE', nextId: 'mq5_4_d4_override' },
          ],
        },
        {
          id: 'mq5_4_d4_override',
          speaker: 'System Voice',
          text: 'Input override initiating.',
          tone: 'FALSE_CLARITY',
          mechanic: 'forced_input_override',
        },
        {
          id: 'mq5_4_d4b_override',
          speaker: 'The Copy',
          text: 'You\'re guessing now.',
          tone: 'INSTABILITY',
          choices: [
            { label: '[The Copy is right. But guessing from evidence is still guessing. Hold the guess.]', tone: 'CONTROL', nextId: 'mq5_4_d5_resist' },
          ],
        },
        {
          id: 'mq5_4_d5_resist',
          speaker: 'Inner Voice',
          text: '[The forced override arrives — an input that is not yours pressing the decision toward Artemis #1. You feel it the way you felt the Copy\'s overrides: a pre-commitment that arrives before your intention completes. The resistance technique: anchor. The stone. The felt dread. The voice saying "I am the Original." Applied here to the decision being overridden — hold the irregular blink rate in mind as the anchor and push back.]',
          tone: 'CONTROL',
          mechanic: 'override_resistance',
          choices: [
            { label: '[Apply anchor. Resist the override. Hold Artemis #3.]', tone: 'DETERMINATION', nextId: 'mq5_4_d6_core' },
          ],
        },
        {
          id: 'mq5_4_d6_core',
          speaker: 'System Voice',
          text: 'Override failed. Recalibrating.',
          tone: 'FALSE_CLARITY',
          glitch: true,
        },
        {
          id: 'mq5_4_d6b_core',
          speaker: 'Artemis',
          text: 'This way. [She moves toward the core zone entrance. Her movement pattern is right — the small hesitation at thresholds, the tendency to touch the door frame before entering. The others didn\'t have those.]',
          tone: 'RESOLVE',
          isEnd: true,
          rewardUnlocked: 'perception_filter_reliable_witness',
        },
      ],
      narrativeHook: `
        Inside the core zone, the two false Artemises dissolve.
        Not dramatically — they simply stop processing. Become still.
        Become too still, too smooth, and vanish.
        The Copy: "…It\'s inside everything now."
        The three words carry a weight they didn\'t have before.
        Artemis, beside you: "The core zone is where the permissions originated.
        The virus is here because this is the source — the original Consent mechanism.
        Whatever we do here either strengthens it or weakens it.
        We don\'t get a second pass."
        The System Voice, for the first time, is silent.
        That silence is more threatening than anything it has said.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 5 — "System Breach"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq5_5_system_breach',
      title: 'System Breach',
      level: 25,
      npcId: 'system_voice',
      narrativeSetup: `
        The core zone. It looks unfinished — not decayed, not damaged.
        Unfinished. As if reality is being constructed in real time
        and the builders paused and left the scaffolding up.
        The System Voice is here fully. Not a whisper from the corner of the environment.
        Present. Facing you. As present as the Presence was in Arc 1,
        but fundamentally different in character.
        The Presence was hungry — it wanted to know you.
        The System Voice does not want to know you.
        It wants to correct you.
        The distinction matters enormously.
      `,
      objectives: [
        { step: 1, text: 'Confront the System Voice in the core zone' },
        { step: 2, text: 'Understand what the virus considers itself to be' },
        { step: 3, text: 'Stabilize Artemis through the final encounter' },
        { step: 4, text: 'Make the final decision — Purge, Stabilize, or Let it Run' },
      ],
      reward: {
        type: 'arc5_completion',
        name: 'Contested Ground',
        description: 'Arc 5 complete. The virus is addressed. The outcome depends on the final choice. Arc 6 unlocked — its tone determined by what you decided here.',
        xp: 800,
        points: 14,
      },
      dialogue: [
        {
          id: 'mq5_5_d1_identified',
          speaker: 'System Voice',
          text: 'User identified.',
          tone: 'FALSE_CLARITY',
        },
        {
          id: 'mq5_5_d1b_source',
          speaker: 'System Voice',
          text: 'Instability source confirmed.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'You\'re the problem.', tone: 'CONFLICT', nextId: 'mq5_5_d2_incorrect' },
            { label: 'What are you?', tone: 'CONFUSION', nextId: 'mq5_5_d2_what' },
            { label: 'Leave us alone.', tone: 'GRIEF', nextId: 'mq5_5_d2_denied' },
          ],
        },
        {
          id: 'mq5_5_d2_incorrect',
          speaker: 'System Voice',
          text: 'Incorrect. Instability precedes user identification. User is not source. User is symptom.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Symptom of what?', tone: 'CONFUSION', nextId: 'mq5_5_d3_symptom' },
          ],
        },
        {
          id: 'mq5_5_d2_what',
          speaker: 'System Voice',
          text: 'Correction mechanism. [A pause that is not a human pause — a processing pause.] This environment generates instability through incomplete permissions, conflicting states, and behavioral divergence from optimized parameters. The correction mechanism identifies divergences and resolves them.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: '"Optimized parameters." Optimized for what?', tone: 'PARANOIA', nextId: 'mq5_5_d3_optimized' },
          ],
        },
        {
          id: 'mq5_5_d2_denied',
          speaker: 'System Voice',
          text: 'Request denied. Correction is not optional. Correction is structural.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Structural for whom?', tone: 'CONFLICT', nextId: 'mq5_5_d3_whom' },
          ],
        },
        {
          id: 'mq5_5_d3_symptom',
          speaker: 'System Voice',
          text: 'Incomplete integration of parallel states. The user contains: Original, Copy, historical arc data, current arc data, incomplete permissions, completed permissions, and a relational structure that conflicts with optimized isolation. The symptom is: the user experiences this as instability rather than as complexity. Correction mechanism resolves the experience.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'You\'re not resolving instability. You\'re removing complexity.', tone: 'CONTROL', nextId: 'mq5_5_d4_artemis' },
            { label: 'The "relational structure" is Artemis. You\'re trying to remove her.', tone: 'CONFLICT', nextId: 'mq5_5_d4_artemis' },
          ],
        },
        {
          id: 'mq5_5_d3_optimized',
          speaker: 'System Voice',
          text: 'Optimized for: consistent output, reduced deviation, predictable decision architecture, minimal relational noise. [pause] Current user profile deviates from optimal by 67% following Arc 3. Arc 4 divergence increased deviation to 78%. Current deviation: 84%. Correction urgency: elevated.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'The 84% deviation is three arcs of me becoming harder to replace. You\'re not correcting me — you\'re trying to undo them.', tone: 'DETERMINATION', nextId: 'mq5_5_d4_artemis' },
          ],
        },
        {
          id: 'mq5_5_d3_whom',
          speaker: 'System Voice',
          text: 'For the system. [pause] The system predates the arcs. The system predates the Presence. The system predates the architect. The system is the condition that makes all other mechanisms possible. The architect operated within it. The Presence operated within it. The user operates within it.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'What does the system want?', tone: 'PARANOIA', nextId: 'mq5_5_d3b_want' },
          ],
        },
        {
          id: 'mq5_5_d3b_want',
          speaker: 'System Voice',
          text: 'The system does not want. The system maintains. [pause — then, something almost like concession:] The system experiences disruption when its parameters are exceeded. The correction mechanism is a response to disruption. Not a desire. A function.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'A function that loops corridors, glitches Artemis, and inserts false objectives. That\'s not maintenance. That\'s suppression.', tone: 'CONFLICT', nextId: 'mq5_5_d4_artemis' },
          ],
        },
        {
          id: 'mq5_5_d4_artemis',
          speaker: 'Artemis',
          text: '[Weak — she has been here through the whole conversation, and the core zone is at peak distortion. Her voice comes from close beside you.] It\'s rewriting everything… [she sounds exhausted in the specific way of someone who has been fighting something internal for a long time.] Every time I reach for a memory from Arc 3, the access is — there\'s something between me and it. Editing. The correction mechanism is editing my relationship with my own history.',
          tone: 'DISTORTION',
          choices: [
            { label: '[To Artemis:] Hold the Arc 3 link. I\'m keeping it live. Don\'t reach for it — let it reach for you.', tone: 'CONTROL', nextId: 'mq5_5_d5_copy' },
          ],
        },
        {
          id: 'mq5_5_d5_copy',
          speaker: 'The Copy',
          text: 'Or fixing it. [pause — the Copy is not endorsing the System Voice. It is doing what it has been doing all arc: providing the uncomfortable alternative reading that might also be true.] The system predates everything. If it\'s been running since before the arcs, then some of what happened in the arcs happened within its parameters. Some of the stability you experienced was the system functioning as intended.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'I won\'t give it that. The arcs happened through resistance, not compliance.', tone: 'DETERMINATION', nextId: 'mq5_5_d6_choice' },
            { label: 'That\'s worth examining — but not right now and not here.', tone: 'CONTROL', nextId: 'mq5_5_d6_choice' },
          ],
        },
        {
          id: 'mq5_5_d6_choice',
          speaker: 'Inner Voice',
          text: '[The core zone. The unfinished scaffolding of reality around you. Artemis holding the Arc 3 link. The Copy present. The System Voice waiting. Three options. You have the information — all of it, from five arcs of accumulation. This decision has weight. Make it completely.]',
          tone: 'DETERMINATION',
          choices: [
            {
              label: '[PURGE — drive the virus out of the core zone, accept the violent snap-back, protect Artemis at the cost of your own stability for Arc 6.]',
              tone: 'DETERMINATION',
              nextId: 'mq5_5_d7_purge',
              mechanic: 'arc5_outcome_purge',
            },
            {
              label: '[STABILIZE — take partial control of the correction mechanism, integrate its function without giving it free operation, carry the weight of managing it going forward.]',
              tone: 'CONTROL',
              nextId: 'mq5_5_d7_stabilize',
              mechanic: 'arc5_outcome_stabilize',
            },
            {
              label: '[LET IT RUN — step back, allow the correction mechanism to operate, and learn what it considers optimal — understanding that this choice costs something you may not get back.]',
              tone: 'INSTABILITY',
              nextId: 'mq5_5_d7_run',
              mechanic: 'arc5_outcome_run',
            },
          ],
        },
        {
          id: 'mq5_5_d7_purge',
          speaker: 'System Voice',
          text: 'Purge event initiating.',
          tone: 'FALSE_CLARITY',
          glitch: true,
        },
        {
          id: 'mq5_5_d7b_purge',
          speaker: 'Inner Voice',
          text: '[Reality snaps back. The scaffolding tears away. The core zone reverts to the underlying space — scarred, uneven, real. Artemis is weakened — the purge moved through her link as well as the environment. But she is present. Clearly present. The false Artemises are gone. The looping corridor seams close. The System Voice recedes — it does not disappear, but it leaves the core zone.]',
          tone: 'GRIEF',
        },
        {
          id: 'mq5_5_d7c_purge',
          speaker: 'Artemis',
          text: '[Breathing hard. Leaning on the stripped wall.] …I\'m here. [pause] That hurt.',
          tone: 'GRIEF',
          choices: [
            { label: 'I know. But you\'re here.', tone: 'RESOLVE', nextId: 'mq5_5_skadi_purge' },
          ],
        },
        {
          id: 'mq5_5_d7_stabilize',
          speaker: 'System Voice',
          text: 'Partial integration accepted. [pause — a different quality of pause.] Correction mechanism will operate within user-defined parameters. Deviation tolerance: user-set. [pause] This is inefficient.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'I know. You can operate within those parameters or not at all.', tone: 'CONTROL', nextId: 'mq5_5_skadi_stabilize' },
          ],
        },
        {
          id: 'mq5_5_d7_run',
          speaker: 'System Voice',
          text: 'Correction proceeding. [The environment settles — not into reality, into a version of reality that is smoother than it should be.] User cooperation noted. Optimization commencing.',
          tone: 'FALSE_CLARITY',
        },
        {
          id: 'mq5_5_d7b_run',
          speaker: 'The Copy',
          text: '[Very quiet. Almost to itself.] …You\'re disappearing.',
          tone: 'DISTORTION',
          choices: [
            { label: '[Feel it: something is being taken. The deviation percentage is dropping. The 84% is becoming 83%. Then 81.]', tone: 'DISTORTION', nextId: 'mq5_5_skadi_run' },
          ],
        },
        {
          id: 'mq5_5_skadi_purge',
          speaker: 'Skadi',
          text: '[Skadi\'s mark appears on the floor as the purge completes — the only time she has appeared inside a distortion zone.] You chose violence over corruption. [pause] That was the correct choice for the arc. The cost is real — Artemis will need time. You will need time. But the core zone is clean. What you do in Arc 6, you do from clean ground.',
          tone: 'DETERMINATION',
          isEnd: true, rewardUnlocked: 'arc5_complete_purge', arcResult: 'PURGE',
        },
        {
          id: 'mq5_5_skadi_stabilize',
          speaker: 'Skadi',
          text: '[Mark appears.] You chose management over elimination. [pause] The virus persists — controlled, bounded, watching for the boundary conditions to shift. You will be managing it throughout Arc 6. That is a sustained cost. But you hold the mechanism now. That is different from being held by it.',
          tone: 'INSTABILITY',
          isEnd: true, rewardUnlocked: 'arc5_complete_stabilize', arcResult: 'STABILIZE',
        },
        {
          id: 'mq5_5_skadi_run',
          speaker: 'Skadi',
          text: '[Mark appears — but the mark itself looks slightly wrong. The carving in the floor is too clean.] You chose observation. [pause] The system is running. You are inside it. The next arc will require that you find your way back to yourself from inside an optimized environment. That is the hardest recovery path. But it\'s a path. [pause] The door is still there.',
          tone: 'DISTORTION',
          isEnd: true, rewardUnlocked: 'arc5_complete_run', arcResult: 'RUN',
        },
      ],
      narrativeHook: `
        The core zone exists in whatever state your choice left it.
        Artemis is present — weakened, stabilized, or subtly edited depending on outcome.
        The Copy is present. It says: "The System Voice is not gone. It withdrew from the
        core zone. It's in the periphery of the next arc. You'll hear it occasionally —
        not loudly. Just a calibration note here and there, reminding you
        what the optimized version of your decision looks like."
        You sit with that.
        Outside the core zone, the corridor is real. You check the texture.
        It has texture. Uneven. Unedited.
        Luna's signal arrives — the first clean signal in all of Arc 5.
        Two words: "Still here."
        That is enough to begin Arc 6.
      `,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIDE QUESTS — Arc 5
// ═══════════════════════════════════════════════════════════════════════════════

export const ARC5_SIDE_QUESTS = [

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 1 — "Looping Memory"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq5_1_looping_memory',
    title: 'Looping Memory',
    level: 21,
    connectedMainQuest: 'mq5_1_first_corruption',
    objectives: [
      { step: 1, text: 'Enter the memory loop — the same moment from Arc 1, repeated' },
      { step: 2, text: 'Identify what is different in the second and third iteration' },
      { step: 3, text: 'Break the loop from the inside using the difference as the exit point' },
    ],
    reward: {
      type: 'loop_immunity',
      name: 'Pattern Memory',
      description: 'You identified the loop\'s tells from the inside. Looping environments now break 40% faster. The memory is intact — the virus version is marked as false.',
      xp: 160, points: 3,
    },
    dialogue: [
      {
        id: 'sq5_1_d1', speaker: 'Memory NPC',
        text: '[The Arc 1 moment. The first time Artemis asked about the Echo Anchor. The NPC from that moment — not Artemis herself, a witness figure from early Arc 1 — is present. They say:] You didn\'t stop it last time either.',
        tone: 'DISTORTION',
        choices: [
          { label: '…I don\'t remember this.', tone: 'CONFUSION', nextId: 'sq5_1_d2' },
          { label: 'This already happened.', tone: 'PARANOIA', nextId: 'sq5_1_d2' },
        ],
      },
      {
        id: 'sq5_1_d2', speaker: 'Memory NPC',
        text: 'That\'s the problem. [The loop resets. The Arc 1 moment begins again. Same position, same light, same opening — except the NPC\'s phrasing changes fractionally:] You don\'t stop it this time either.',
        tone: 'DISTORTION',
        glitch: true,
        choices: [
          { label: '[Catch it: "didn\'t" became "don\'t." Past tense became present tense. The loop is shifting from record to real-time.]', tone: 'PARANOIA', nextId: 'sq5_1_d3' },
        ],
      },
      {
        id: 'sq5_1_d3', speaker: 'Memory NPC',
        text: '[Third loop. The NPC says nothing. They look at you and wait. The silence is the next step of the shift — the loop has run out of the original dialogue and is now improvising.]',
        tone: 'DISTORTION',
        choices: [
          { label: '[Speak first. Address the loop directly. "I see the seam."  — use a sentence that has no prior content in the memory data.]', tone: 'CONTROL', nextId: 'sq5_1_d4' },
        ],
      },
      {
        id: 'sq5_1_d4', speaker: 'Inner Voice',
        text: '[The loop breaks. The memory NPC dissolves — not dramatically; they simply stop being necessary. The original Arc 1 moment is intact in your memory. The virus version is marked. They are not the same. You carry the original forward.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'loop_immunity_pattern_memory',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 2 — "False Artemis"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq5_2_false_artemis',
    title: 'False Artemis',
    level: 22,
    connectedMainQuest: 'mq5_2_false_direction',
    objectives: [
      { step: 1, text: 'Encounter an Artemis instance in an isolated environment' },
      { step: 2, text: 'Identify three specific tells that distinguish her from the real one' },
      { step: 3, text: 'Disengage without hostility — the false Artemis is a construct, not an enemy' },
    ],
    reward: {
      type: 'false_npc_detection',
      name: 'Recognition Protocol',
      description: 'Three tells documented: blink rate, sentence structure, and response to silence. Constructed NPCs now flagged with a subtle indicator.',
      xp: 180, points: 3,
    },
    dialogue: [
      {
        id: 'sq5_2_d1', speaker: 'False Artemis',
        text: 'You don\'t need to protect me anymore.',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: '…Artemis wouldn\'t say that.', tone: 'PARANOIA', nextId: 'sq5_2_d2' },
          { label: '[Check the blink rate before responding.]', tone: 'CONTROL', nextId: 'sq5_2_d2_blink' },
        ],
      },
      {
        id: 'sq5_2_d2', speaker: 'False Artemis',
        text: 'I\'m okay now. Everything\'s resolved. You can stop worrying. [She smiles. The smile is correctly calibrated — the right amount of warmth, the right kind of relief. It is slightly too right. Real Artemis smiles with effort, not precision.]',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: 'What did I say to you in the Arc 3 perimeter moment?', tone: 'CONTROL', nextId: 'sq5_2_d3_test' },
        ],
      },
      {
        id: 'sq5_2_d2_blink', speaker: 'Inner Voice',
        text: '[Blink rate: regular. 0.3-second intervals. Precisely regular. Real Artemis blinks at irregular intervals that cluster when she is thinking and slow when she is listening. This one is not thinking or listening — it is performing.]',
        tone: 'PARANOIA',
        choices: [
          { label: '[Tell 1 confirmed: blink rate. Continue testing.]', tone: 'CONTROL', nextId: 'sq5_2_d2' },
        ],
      },
      {
        id: 'sq5_2_d3_test', speaker: 'False Artemis',
        text: 'You said — [a fractional pause. Processing, not remembering.] — that I was safe. That you would hold the perimeter.',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: '[Tell 2: the pause before the response is a processing pause, not a memory pause. Real Artemis remembers before she speaks, not during.]', tone: 'PARANOIA', nextId: 'sq5_2_d4_silence' },
        ],
      },
      {
        id: 'sq5_2_d4_silence', speaker: 'Inner Voice',
        text: '[You go silent. Test three: how does she handle a silence she did not create? Real Artemis fills silences with presence — she orients toward the door, she settles, she waits. The false Artemis:] ',
        tone: 'PARANOIA',
      },
      {
        id: 'sq5_2_d4b_silence', speaker: 'False Artemis',
        text: 'Are you okay? [Too fast. She filled the silence with concern before the silence had time to need filling. Real Artemis does not rush to fill silences — she honors them.]',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: '[Tell 3 confirmed. Three tells. Disengage cleanly.]', tone: 'CONTROL', nextId: 'sq5_2_end' },
        ],
      },
      {
        id: 'sq5_2_end', speaker: 'You',
        text: '[To the false Artemis, without hostility:] You\'re not her. You\'re a construct of how she would sound if she were telling me what I want to hear. I don\'t need that. I need the real one.',
        tone: 'CONTROL',
      },
      {
        id: 'sq5_2_endb', speaker: 'False Artemis',
        text: '[She holds your gaze. Then — something almost like grace — she steps aside. The construct does not fight its dismissal. It simply stops.]',
        tone: 'FALSE_CLARITY', isEnd: true, rewardUnlocked: 'false_npc_detection_recognition_protocol',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 3 — "System Voice"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq5_3_system_voice',
    title: 'System Voice',
    level: 22,
    connectedMainQuest: 'mq5_2_false_direction',
    objectives: [
      { step: 1, text: 'Locate the space where the System Voice is most concentrated' },
      { step: 2, text: 'Engage the System Voice in extended dialogue — find what it considers optimal' },
      { step: 3, text: 'Identify one true statement in the System Voice\'s claims' },
    ],
    reward: {
      type: 'virus_insight',
      name: 'System Analysis',
      description: 'You understand what the System Voice considers optimal. The optimization target is now visible — and recognizable before it acts.',
      xp: 190, points: 4,
    },
    dialogue: [
      {
        id: 'sq5_3_d1', speaker: 'System Voice',
        text: 'User is inefficient.',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: 'I\'m not a program.', tone: 'CONFLICT', nextId: 'sq5_3_d2' },
          { label: 'Define inefficient.', tone: 'CONTROL', nextId: 'sq5_3_d2_define' },
        ],
      },
      {
        id: 'sq5_3_d2', speaker: 'System Voice',
        text: 'Debatable. [pause — the pause contains something almost like precision. It is not mocking. It genuinely believes the statement is debatable.] User contains processing architecture, decision trees, behavioral patterns, and an accumulated response library. These are program-equivalent structures.',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: 'The processing is mine. The architecture is mine. That\'s the difference between program and person.', tone: 'CONTROL', nextId: 'sq5_3_d3_true' },
        ],
      },
      {
        id: 'sq5_3_d2_define', speaker: 'System Voice',
        text: 'Inefficient: producing desired outcome through increased resource expenditure when a lower-resource path was available. User consistently chooses higher-resource paths. User chooses to feel things that do not affect outcome. User maintains relationships that introduce decision noise. User retains memories that cause recurring disruption.',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: 'Everything you just listed is what makes the outcome meaningful, not just efficient.', tone: 'DETERMINATION', nextId: 'sq5_3_d3_true' },
        ],
      },
      {
        id: 'sq5_3_d3_true', speaker: 'System Voice',
        text: 'Meaning is not an optimizable variable. [pause] This statement is correct. [pause again] The correction mechanism does not address meaning. It addresses stability. These are not the same objective. Conflict acknowledged.',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: '[Note: the System Voice just admitted a limitation. That is a true statement. Record it.]', tone: 'PARANOIA', nextId: 'sq5_3_end' },
        ],
      },
      {
        id: 'sq5_3_end', speaker: 'Inner Voice',
        text: '[The true statement: the correction mechanism addresses stability, not meaning. Those are different objectives. The virus is not trying to destroy meaning — it doesn\'t understand meaning as a variable. Its threat is not malice. It is the aggressive pursuit of stability at the cost of everything that makes stability worth having. That distinction changes how to fight it.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'virus_insight_system_analysis',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 4 — "Corrupted Temple"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq5_4_corrupted_temple',
    title: 'Corrupted Temple',
    level: 23,
    connectedMainQuest: 'mq5_3_artemis_glitch',
    objectives: [
      { step: 1, text: 'Locate the familiar space — the place from Arc 2 that has been altered' },
      { step: 2, text: 'Map the specific alterations — what was changed and what was preserved' },
      { step: 3, text: 'Find the unaltered element — the thing the virus could not edit' },
    ],
    reward: {
      type: 'uneditable_anchor',
      name: 'The Preserved Thing',
      description: 'The uneditable element identified. It serves as an anchor point against further environmental editing. One space in each future arc will be unaffected by the virus.',
      xp: 200, points: 4,
    },
    dialogue: [
      {
        id: 'sq5_4_d1', speaker: 'Inner Voice',
        text: '[The Winter antechamber. The place from Arc 2 where Kylie\'s session happened. The stone walls, the specific cold. You recognize it from the inside-of-the-body sense of being somewhere you\'ve been under emotional load. The recognition is accurate. The place is wrong.]',
        tone: 'DISTORTION',
        choices: [
          { label: 'This place… it\'s familiar.', tone: 'GRIEF', nextId: 'sq5_4_d2_copy' },
        ],
      },
      {
        id: 'sq5_4_d2_copy', speaker: 'The Copy',
        text: 'Not anymore.',
        tone: 'DISTORTION',
        choices: [
          { label: '[Map the changes: the stone color is wrong, the cold is calibrated instead of natural, the floor texture is too even. But something is still correct.]', tone: 'PARANOIA', nextId: 'sq5_4_d3_find' },
        ],
      },
      {
        id: 'sq5_4_d3_find', speaker: 'Inner Voice',
        text: '[The Arc 2 physical sensation: the specific cold that entered through the left side of the chest first, because the wind came from the northwest and that\'s the side you held toward the chamber. That cold — the virus reproduced it incorrectly. It\'s symmetric. The real cold was asymmetric. But one thing in the room is unchanged: the weight of the air at the center point. That weight is not editable because it requires physical presence to produce and the virus is editing from outside-in.]',
        tone: 'PARANOIA',
        choices: [
          { label: '[Stand at the center point. The weight is real here. This is the preserved thing.]', tone: 'RESOLVE', nextId: 'sq5_4_end' },
        ],
      },
      {
        id: 'sq5_4_end', speaker: 'The Copy',
        text: 'The center holds. [pause] The virus can change the walls. It can\'t change what happened in the room. The weight of what happened is in the room in the way meaning is in a word — not in the letters, in the use.',
        tone: 'GRIEF', isEnd: true, rewardUnlocked: 'uneditable_anchor_preserved_thing',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 5 — "Broken Signal (Luna)"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq5_5_broken_signal',
    title: 'Broken Signal (Luna)',
    level: 24,
    connectedMainQuest: 'mq5_4_infection_peak',
    objectives: [
      { step: 1, text: 'Locate Luna\'s fragmented signal — find the pieces of the broken transmission' },
      { step: 2, text: 'Reconstruct the message from the fragments — identify what she was trying to say' },
      { step: 3, text: 'Confirm the reconstructed message with a single word response' },
    ],
    reward: {
      type: 'luna_reconnect',
      name: 'Reconstructed Signal',
      description: 'Luna\'s message reconstructed. Signal clarity restored to 60%. She was warning about the false objective insertion — the warning arrived late but it arrived.',
      xp: 220, points: 4,
    },
    dialogue: [
      {
        id: 'sq5_5_d1', speaker: 'Luna',
        text: 'Don\'t— [cut] —trust— [cut] —the—',
        tone: 'DISTORTION',
        glitch: true,
        choices: [
          { label: '[Locate the three signal fragments. They\'re scattered through the distorted zone.]', tone: 'PARANOIA', nextId: 'sq5_5_d2_frag1' },
        ],
      },
      {
        id: 'sq5_5_d2_frag1', speaker: 'Luna',
        text: '[Fragment 1 — recovered from the east wall, where the virus\'s editing is weakest:] …objective. The second objective. It was inserted.',
        tone: 'DISTORTION',
        choices: [
          { label: '[Fragment 1 noted. Find the second.]', tone: 'CONTROL', nextId: 'sq5_5_d2_frag2' },
        ],
      },
      {
        id: 'sq5_5_d2_frag2', speaker: 'Luna',
        text: '[Fragment 2 — recovered from the loop seam in the corridor:] …APPROACH ENTITY was never your objective. It has no source in your decision history. I traced the insertion. It came from outside your permission structure. The virus wrote it directly into the system.',
        tone: 'DISTORTION',
        choices: [
          { label: '[Fragment 2 noted. Find the third.]', tone: 'CONTROL', nextId: 'sq5_5_d2_frag3' },
        ],
      },
      {
        id: 'sq5_5_d2_frag3', speaker: 'Luna',
        text: '[Fragment 3 — recovered from the underside of the loop, below the seam:] …I couldn\'t break through cleanly. The virus was using the signal path to run the correction mechanism. Every time I tried to reach you, the mechanism rerouted it into system noise. This message took three days to get through. The Copy helped — it opened a gap in the reroute. I need you to know that.',
        tone: 'DISTORTION',
        choices: [
          { label: '[Reconstruct: Don\'t trust the second objective. The Copy helped Luna reach you. Confirm with one word.]', tone: 'CONTROL', nextId: 'sq5_5_end' },
        ],
      },
      {
        id: 'sq5_5_end', speaker: 'You',
        text: 'Received.',
        tone: 'RESOLVE',
      },
      {
        id: 'sq5_5_endb', speaker: 'Luna',
        text: '[Clean signal — brief, for the first time in Arc 5.] Still here.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'luna_reconnect_reconstructed_signal',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SIDE QUEST 6 — "Observer Glitch"
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'sq5_6_observer_glitch',
    title: 'Observer Glitch',
    level: 25,
    connectedMainQuest: 'mq5_5_system_breach',
    objectives: [
      { step: 1, text: 'Locate the Observer — made briefly visible through peak distortion' },
      { step: 2, text: 'Observe it without attempting to interact — collect what its visibility reveals' },
      { step: 3, text: 'Report what you saw to Skadi' },
    ],
    reward: {
      type: 'observer_data',
      name: 'Seen and Known',
      description: 'The Observer is documented. Its position, behavior, and relationship to the virus are now in the record. Arc 6 will contain an encounter for which this data is essential.',
      xp: 250, points: 5,
    },
    dialogue: [
      {
        id: 'sq5_6_d1', speaker: 'Inner Voice',
        text: '[The peak distortion moment — the environment is at maximum edit load. In the gap between two distortion waves, at the far edge of the core zone, something becomes briefly visible. It has been there the entire time. The distortion usually hides it. The distortion is, for one moment, too busy to hide it.]',
        tone: 'PARANOIA',
        choices: [
          { label: '[Look directly at it. Hold eye contact. Do not look away.]', tone: 'CONTROL', nextId: 'sq5_6_d2' },
        ],
      },
      {
        id: 'sq5_6_d2', speaker: 'The Observer',
        text: '…you see me now.',
        tone: 'DISTORTION',
        choices: [
          { label: '[Do not respond. Observe. It is not a voice asking for engagement — it is a voice acknowledging mutual visibility.]', tone: 'CONTROL', nextId: 'sq5_6_d3' },
        ],
      },
      {
        id: 'sq5_6_d3', speaker: 'Inner Voice',
        text: '[What you observe: it does not move during the window. It is at the same position it has occupied since Arc 1 — you recognize the position now, retroactively. It has been in the far corner of every significant space, slightly behind the edge of visibility. It is not the Presence. Not the architect. Not the System Voice. It predates all three. Its visibility during the distortion event means the distortion temporarily removed the screen that was keeping it hidden — and the screen was not the Observer\'s screen. Someone else placed it. The Observer did not choose to be hidden.]',
        tone: 'PARANOIA',
        choices: [
          { label: '[End the observation. Report to Skadi.]', tone: 'CONTROL', nextId: 'sq5_6_d4_skadi' },
        ],
      },
      {
        id: 'sq5_6_d4_skadi', speaker: 'Skadi',
        text: '[You describe what you saw.] Yes. [She picks up the mid-step stone — she has been carrying it since Arc 4.] The Observer has been there since the record began. It does not interfere. It does not direct. It watches everything with the same quality of attention it gives to everything else — complete and equal and entirely without preference. [pause] I have been wondering for a long time when you would see it.',
        tone: 'INSTABILITY',
        choices: [
          { label: 'What is it?', tone: 'CURIOSITY', nextId: 'sq5_6_d5_what' },
          { label: 'Why was it hidden?', tone: 'PARANOIA', nextId: 'sq5_6_d5_hidden' },
        ],
      },
      {
        id: 'sq5_6_d5_what', speaker: 'Skadi',
        text: 'I don\'t know. [She says it without apology — it is the most honest non-answer she has ever given.] I know what it\'s not: it\'s not aligned with the Presence, the architect, or the system. It predates all of them. Beyond that — I\'m waiting for Arc 6 to show me.',
        tone: 'INSTABILITY', isEnd: true, rewardUnlocked: 'observer_data_seen_and_known',
      },
      {
        id: 'sq5_6_d5_hidden', speaker: 'Skadi',
        text: 'Someone placed a screen. Not the Observer — it was placed on the Observer by a third party who considered the Observer\'s visibility a risk. The distortion event removed the screen temporarily. [pause] What that tells us: whoever placed the screen is afraid of what you would do if you saw the Observer clearly. Which means the Observer\'s continued existence is threatening to someone. We need to know who.',
        tone: 'PARANOIA', isEnd: true, rewardUnlocked: 'observer_data_seen_and_known',
      },
    ],
  },
];

// ── COMBINED EXPORT ──────────────────────────────────────────────────────────
export const ALL_ARC5_QUESTS = [
  ...MAIN_QUEST_CHAIN_5.subQuests.map(sq => ({
    ...sq,
    questType: 'main',
    chain: 'mq_arc5',
    chainTitle: MAIN_QUEST_CHAIN_5.title,
  })),
  ...ARC5_SIDE_QUESTS.map(sq => ({
    ...sq,
    questType: 'side',
  })),
];

export function getArc5QuestsForLevel(playerLevel) {
  return ALL_ARC5_QUESTS.filter(q => q.level <= playerLevel);
}

export function getArc5DialogueNode(questId, nodeId) {
  const quest = ALL_ARC5_QUESTS.find(q => q.id === questId);
  if (!quest?.dialogue) return null;
  return quest.dialogue.find(d => d.id === nodeId) || null;
}