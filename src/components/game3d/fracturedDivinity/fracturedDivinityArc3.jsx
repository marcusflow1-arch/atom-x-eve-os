// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 3: "Protect Artemis"
// Quest chain: Levels 11–15
// Main Quest 3: "Protect Artemis" (5 sub-quests) + 6 Side Quests
// Tone tags: URGENCY | DOUBT | TRUST | INSTABILITY | FEAR | DETERMINATION | PAIN
// ─────────────────────────────────────────────────────────────────────────────

// ── NEW NPCs for Arc 3 ───────────────────────────────────────────────────────
export const ARC3_NPCS = [
  {
    id: 'artemis_arc3',
    name: 'Artemis',
    description: 'No longer just an echo. Present now. Vulnerable in a way that feels personal. Her stability is directly tied to your decisions.',
  },
  {
    id: 'luna_arc3',
    name: 'Luna',
    description: 'Her guidance arrives cleaner in Arc 3 — but she still holds something back. The question is whether the holding-back is caution or deception.',
  },
  {
    id: 'skadi_arc3',
    name: 'Skadi',
    description: 'More direct than she has been. The preparations of Arc 1 and 2 were for this. She has a stake in whether Artemis survives.',
  },
  {
    id: 'echo_artemis',
    name: 'Echo Artemis',
    description: 'A distorted version of Artemis, shaped by interference. She says things the real Artemis would never say — but she says them in Artemis\'s voice.',
  },
  {
    id: 'the_watchers',
    name: 'The Watchers',
    description: 'Plural now. Multiple entities. They don\'t coordinate — they compete for proximity. Their attention is the threat.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QUEST 3 — "Protect Artemis"
// ═══════════════════════════════════════════════════════════════════════════════
export const MAIN_QUEST_3 = {
  id: 'mq_arc3',
  title: 'Protect Artemis',
  arc: 'Arc 3: Protect Artemis',
  description: 'She is not a symbol now. She is present, she is real, and the interference has found her. You have everything Arc 1 and 2 built in you. It may not be enough. But it is what you have.',
  subQuests: [

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 1 — "She Is Real"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq3_1_she_is_real',
      title: 'She Is Real',
      level: 11,
      npcId: 'artemis_arc3',
      narrativeSetup: `
        She steps out of the reflection.
        Not the echo-version — the actual one. Three-dimensional. Weight-bearing.
        A presence that displaces air rather than light.
        You have spent two arcs learning to resist something that wanted to steer you.
        Now there is someone standing in front of you who needs you to steer toward her.
        The interference reads this immediately. You feel the familiar pressure —
        the borrowed voice, the cold proximity, the subtle redirection.
        For the first time, it isn't aimed at you alone.
        It is aimed at the space between you and her.
      `,
      objectives: [
        { step: 1, text: 'Approach Artemis — resist the redirection attempting to turn you away from her' },
        { step: 2, text: 'Make contact — establish the stabilization link' },
        { step: 3, text: 'Assess her stability level and identify the primary interference point' },
        { step: 4, text: 'Complete the first protection perimeter' },
      ],
      reward: {
        type: 'protection_link',
        name: 'Artemis Anchor',
        description: 'Stabilization link established. Artemis stability meter now visible. First protection perimeter active.',
        xp: 140,
        points: 4,
      },
      dialogue: [
        {
          id: 'a3_1_d1_approach',
          speaker: 'Inner Voice',
          text: '[The redirection is subtle. A thought: "Not now. Wait. You\'re not ready." Then a half-step to the left. Then the borrowed voice: "She\'s not what you think she is." You have heard these patterns before. You recognize the seam. Keep walking toward her.]',
          tone: 'DOUBT',
          mechanic: 'input_reverse',
          choices: [
            { label: '[Push through the redirection. Walk forward.]', tone: 'DETERMINATION', nextId: 'a3_1_d2_reach' },
            { label: '[Stop. Ask the voice to prove its claim.]', tone: 'RESISTANCE', nextId: 'a3_1_d2_challenge' },
          ],
        },
        {
          id: 'a3_1_d2_reach',
          speaker: 'Artemis',
          text: 'I felt you fighting to get here. I could feel the pull against your direction. Thank you for not listening to it.',
          tone: 'TRUST',
          choices: [
            { label: 'Are you all right?', tone: 'URGENCY', nextId: 'a3_1_d3_alright' },
            { label: 'How long have you been dealing with this?', tone: 'DOUBT', nextId: 'a3_1_d3_howlong' },
            { label: 'What do you need from me?', tone: 'DETERMINATION', nextId: 'a3_1_d3_need' },
          ],
        },
        {
          id: 'a3_1_d2_challenge',
          speaker: 'Inner Voice',
          text: '[The borrowed voice offers nothing in response. It never does when you ask for proof — it relies on suggestion, not argument. The silence is confirmation. Keep walking.]',
          tone: 'RESISTANCE',
          choices: [{ label: '[Resume walking toward Artemis.]', tone: 'DETERMINATION', nextId: 'a3_1_d2_reach' }],
        },
        {
          id: 'a3_1_d3_alright',
          speaker: 'Artemis',
          text: 'Relatively. I\'ve been... losing ground. Not dramatically. Steadily. Like something is reducing the range of things I can do, one small category at a time. I don\'t lose the ability entirely — I just lose access to it. The path narrows.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'That\'s the same pattern as my hands in Arc 2.', tone: 'DOUBT', nextId: 'a3_1_d4_same' },
            { label: 'What categories have you lost so far?', tone: 'URGENCY', nextId: 'a3_1_d4_categories' },
          ],
        },
        {
          id: 'a3_1_d3_howlong',
          speaker: 'Artemis',
          text: 'Since Arc 1, when the Presence first noticed me through you. I was safe as a reflection — invisible to it. When you made me real, you made me visible. I don\'t blame you. I want you to know that before anything else. I chose to become real. The cost came with the choice.',
          tone: 'TRUST',
          choices: [
            { label: 'What is the cost, exactly?', tone: 'DOUBT', nextId: 'a3_1_d4_categories' },
          ],
        },
        {
          id: 'a3_1_d3_need',
          speaker: 'Artemis',
          text: 'Your attention on me when they get close. Not protection-through-force — you can\'t outmatch them physically. Protection through presence. They want to isolate me. Your presence interrupts the isolation attempt. It\'s that precise, and that simple.',
          tone: 'DETERMINATION',
          choices: [
            { label: 'How close do they get before the risk becomes critical?', tone: 'URGENCY', nextId: 'a3_1_d4_proximity' },
          ],
        },
        {
          id: 'a3_1_d4_same',
          speaker: 'Artemis',
          text: 'Exactly the same. Which means whoever designed the Severing in Arc 2 is also doing this to me. The method is consistent. Which also means your counter-sequence might partially work on my situation.',
          tone: 'DETERMINATION',
          choices: [{ label: 'Let\'s test that. Establish the link first.', tone: 'DETERMINATION', nextId: 'a3_1_d5_link' }],
        },
        {
          id: 'a3_1_d4_categories',
          speaker: 'Artemis',
          text: 'Memory first — specific memories. Then reach — the ability to influence what\'s near me. Then communication — I started having difficulty saying true things, as if something was revising the words between my intention and my voice. It\'s corrected now, but for three days, everything I said came out slightly wrong.',
          tone: 'INSTABILITY',
          choices: [{ label: 'That\'s targeted. That\'s not environmental damage.', tone: 'DOUBT', nextId: 'a3_1_d5_link' }],
        },
        {
          id: 'a3_1_d4_proximity',
          speaker: 'Artemis',
          text: 'Closer than arm\'s length and I start losing whatever I\'m focused on. My thoughts scatter. It\'s not painful — it\'s like static. Everything gets equal weight and nothing gets priority.',
          tone: 'INSTABILITY',
          choices: [{ label: 'Then I stay between them and you when it matters.', tone: 'DETERMINATION', nextId: 'a3_1_d5_link' }],
        },
        {
          id: 'a3_1_d5_link',
          speaker: 'Artemis',
          text: 'Give me your left hand. [She looks at the scar.] The mark. Maren\'s record was right — it reads as a connection point to the Presence. But it also reads as mine, now. Whatever marked you also, accidentally, marked you as connected to me. We can use that.',
          tone: 'TRUST',
          choices: [
            { label: '[Extend the left hand. Accept the link.]', tone: 'TRUST', nextId: 'a3_1_d6_linked' },
          ],
        },
        {
          id: 'a3_1_d6_linked',
          speaker: 'Inner Voice',
          text: '[The link: not magical, not invisible. A direct awareness — her stability as a felt sense in your left hand, like a pressure reading. When she is well: warmth. When she is losing ground: cold. The scar becomes a sensor. The Presence marked you as its point of entry. You just turned that mark into a stabilization link instead. That is, specifically, the kind of thing it doesn\'t predict well.]',
          tone: 'DETERMINATION',
          isEnd: true,
          rewardUnlocked: 'protection_link_artemis_anchor',
        },
      ],
      narrativeHook: `
        The first protection perimeter is established. Artemis stands within it.
        Her stability reads: moderate. Not critical. Not safe.
        Luna speaks — from a distance, from a higher angle than you expect:
        "The Watchers know about the link. They will test it.
        The first test will be subtle — they'll try to get you to break the perimeter
        by sending you a convincing reason to leave her."
        Pause.
        "The reason will feel urgent. It will feel like it comes from you.
        Remember: urgency that arrives without warning is the shape of interference in Arc 3."
        Artemis looks at you. "She's right. Don't be fooled by emergencies."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 2 — "The Convincing Reason"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq3_2_convincing_reason',
      title: 'The Convincing Reason',
      level: 12,
      npcId: 'luna_arc3',
      narrativeSetup: `
        Three hours after establishing the perimeter, it arrives.
        A message — from Kylie. Urgent. Specific. Credible.
        She says she has found the source of the Winter's redirection and needs you immediately.
        It will take forty minutes to reach her. Forty minutes away from Artemis.
        The message is in Kylie's exact phrasing. Her exact style.
        Artemis says nothing. She watches you read it. Her stability meter drops two points
        just from the presence of the message. As if the message itself carries the Watcher's
        proximity signature.
        Luna told you urgency that arrives without warning is the shape of interference.
        But what if it's real? What if Kylie genuinely found something?
      `,
      objectives: [
        { step: 1, text: 'Verify the message with Artemis — check her reading of it' },
        { step: 2, text: 'Attempt to confirm with Kylie through secondary channel' },
        { step: 3, text: 'Make the decision: go, stay, or send someone else' },
        { step: 4, text: 'Deal with the consequence of your choice' },
      ],
      reward: {
        type: 'discernment_skill',
        name: 'Interference Verification',
        description: 'You can now attempt to authenticate urgent messages. False urgency detection rate +40%.',
        xp: 190,
        points: 4,
      },
      dialogue: [
        {
          id: 'a3_2_d1_message',
          speaker: 'Artemis',
          text: 'Read it again. Slowly. Tell me what you notice when you\'re not reading for content.',
          tone: 'DOUBT',
          choices: [
            { label: '[Read it again for style, not information.]', tone: 'DOUBT', nextId: 'a3_2_d2_reread' },
          ],
        },
        {
          id: 'a3_2_d2_reread',
          speaker: 'Inner Voice',
          text: '[The message: Kylie\'s phrasing, her structure. But the urgency level is higher than her baseline. Kylie doesn\'t use exclamation points. There\'s one here. She doesn\'t say "immediately" — she says "when you can." The word "immediately" appears twice. Small deviations. The kind of deviations that come from someone imitating a voice they\'ve studied but don\'t know from the inside.]',
          tone: 'DOUBT',
          choices: [
            { label: 'The word choice is off. This might not be from Kylie.', tone: 'DOUBT', nextId: 'a3_2_d3_verify' },
            { label: 'The style is close enough. What if I\'m just looking for reasons to dismiss it?', tone: 'DOUBT', nextId: 'a3_2_d3_dismiss' },
          ],
        },
        {
          id: 'a3_2_d3_verify',
          speaker: 'Artemis',
          text: 'Good. But also: even if it\'s wrong, it might be pointing at something real. The interference doesn\'t always fabricate from nothing. Sometimes it uses real information to construct a false urgency. Kylie might have found something. The framing might still be fabricated.',
          tone: 'DOUBT',
          choices: [
            { label: 'Try to reach Kylie through a different channel first.', tone: 'DETERMINATION', nextId: 'a3_2_d4_contact' },
          ],
        },
        {
          id: 'a3_2_d3_dismiss',
          speaker: 'Artemis',
          text: 'That\'s the doubt they\'re counting on. The moment you second-guess your own discernment — the interference has more room to operate. The analysis was correct. The word choice is off. Trust your reading.',
          tone: 'TRUST',
          choices: [
            { label: 'Contact Kylie directly before deciding anything.', tone: 'DETERMINATION', nextId: 'a3_2_d4_contact' },
          ],
        },
        {
          id: 'a3_2_d4_contact',
          speaker: 'Kylie',
          text: '[Through the secondary channel:] I didn\'t send that. I haven\'t found anything about the Winter\'s source. I don\'t know the word "immediately." What does the message say exactly?',
          tone: 'FRUSTRATION',
          choices: [
            { label: '[Read the message to Kylie.]', tone: 'DOUBT', nextId: 'a3_2_d5_confirmed' },
          ],
        },
        {
          id: 'a3_2_d5_confirmed',
          speaker: 'Kylie',
          text: 'That\'s not me. The structure is — it\'s close to mine, but not quite right. Someone studied how I communicate. That\'s not ambient interference — that\'s targeted intelligence-gathering. Someone spent time on this.',
          tone: 'DOUBT',
          choices: [
            { label: 'They used Kylie\'s identity because I trust her.', tone: 'DOUBT', nextId: 'a3_2_d6_trust_weapon' },
          ],
        },
        {
          id: 'a3_2_d6_trust_weapon',
          speaker: 'Artemis',
          text: 'Yes. In Arc 3, they don\'t just redirect your movement — they weaponize your relationships. Anyone you trust becomes a potential vector. That doesn\'t mean you stop trusting people. It means you add a verification step.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'This is exhausting. It never ends.', tone: 'PAIN', nextId: 'a3_2_d7_exhausting' },
            { label: 'I verified. I stayed. That was the right move.', tone: 'DETERMINATION', nextId: 'a3_2_d7_right' },
          ],
        },
        {
          id: 'a3_2_d7_exhausting',
          speaker: 'Artemis',
          text: 'I know. I\'m sorry you have to carry this. What I can tell you is that they worked hard on that message. The detail of it means you\'re doing enough damage to their process that they need to escalate. That exhaustion you feel — it\'s evidence of your effectiveness.',
          tone: 'TRUST',
          isEnd: true,
          rewardUnlocked: 'discernment_skill_interference_verification',
        },
        {
          id: 'a3_2_d7_right',
          speaker: 'Artemis',
          text: '[Her stability meter moves.] Up. Three points. That was the test. You passed it. The perimeter holds.',
          tone: 'TRUST',
          isEnd: true,
          rewardUnlocked: 'discernment_skill_interference_verification',
        },
      ],
      narrativeHook: `
        That night, the Watchers try three more times.
        Each time, a different vector: an apparent sound from outside the perimeter,
        a distortion in the environment suggesting danger elsewhere,
        a moment where Artemis herself seems to gesture toward the door.
        That last one stops you cold.
        You look at her carefully. She shakes her head — a small, precise movement.
        "That wasn't me. They can mimic my gestures now."
        You ask: "How do I tell the difference?"
        She says: "I'll always tell you what a gesture means, if it's mine.
        If it's theirs — there's no explanation. Just a direction."
        You add that to the map.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 3 — "Distorted Environment"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq3_3_distorted_env',
      title: 'Distorted Environment',
      level: 13,
      npcId: 'artemis_arc3',
      narrativeSetup: `
        The Watchers have found a new method.
        Instead of affecting you or Artemis directly, they affect the environment.
        Walls that were straight appear angled. Distances contract and extend.
        Sound delays by fractions of seconds — enough to make judgment unreliable.
        The perimeter is geometrically impossible to maintain under these conditions.
        You can't protect what you can't reliably locate.
        Artemis can still see clearly — the distortion doesn't affect her perception.
        You are the one who cannot trust what you see.
        And you are the one standing between her and them.
      `,
      objectives: [
        { step: 1, text: 'Navigate the distorted zone without losing Artemis\'s location' },
        { step: 2, text: 'Identify the distortion anchor point — the source the Watchers are using' },
        { step: 3, text: 'Disable the anchor without leaving the perimeter' },
        { step: 4, text: 'Survive the proximity surge while the anchor is down but not destroyed' },
      ],
      reward: {
        type: 'perception_anchor',
        name: 'Environmental Lock',
        description: 'You identified the Watcher\'s distortion method. Perception distortion resistance +35%. Distortion anchor detection unlocked.',
        xp: 250,
        points: 5,
      },
      dialogue: [
        {
          id: 'a3_3_d1_distort',
          speaker: 'Inner Voice',
          text: '[The corridor to your left is three meters. Then five. Then eight. You blink and it\'s three again. The floor pitch oscillates by two degrees — invisible to full awareness, felt only by the balance system. Your grip delay reads 0.6 but it feels like more. The distortion is attacking confidence, not function.]',
          tone: 'INSTABILITY',
          mechanic: 'environment_distortion',
          choices: [
            { label: '[Fix your eyes on Artemis. Use her as a stable reference point.]', tone: 'DETERMINATION', nextId: 'a3_3_d2_fixate' },
            { label: '[Try to push through the distortion using movement data, not perception.]', tone: 'DETERMINATION', nextId: 'a3_3_d2_data' },
          ],
        },
        {
          id: 'a3_3_d2_fixate',
          speaker: 'Artemis',
          text: 'Good. Keep looking at me. I can see correctly — use my eyes as your calibration. When I tell you to move, move exactly how I say. Don\'t interpret. Execute.',
          tone: 'URGENCY',
          choices: [
            { label: '[Agree. Follow Artemis\'s directions precisely.]', tone: 'TRUST', nextId: 'a3_3_d3_navigate' },
          ],
        },
        {
          id: 'a3_3_d2_data',
          speaker: 'Inner Voice',
          text: '[Movement data: your steps are accurate even when your eyes aren\'t. You know how long a stride is. You count. Three steps to the left wall — your feet say four steps. Discrepancy: 33%. The walls are being stretched. Not the distance. The wall. It\'s an optical manipulation. Your feet know the truth.]',
          tone: 'DETERMINATION',
          choices: [
            { label: '[Trust your feet. Move by step count, not by sight.]', tone: 'DETERMINATION', nextId: 'a3_3_d3_navigate' },
          ],
        },
        {
          id: 'a3_3_d3_navigate',
          speaker: 'Artemis',
          text: 'The source of the distortion — it\'s behind the east wall. Not through it — attached to the outside surface. If you can reach the exterior without losing the perimeter, you can disrupt the anchor. But the moment you start moving away from center, they\'ll surge.',
          tone: 'URGENCY',
          choices: [
            { label: 'How long is the surge window?', tone: 'URGENCY', nextId: 'a3_3_d4_surge_time' },
            { label: 'I\'ll be fast. You hold the center.', tone: 'DETERMINATION', nextId: 'a3_3_d4_go' },
          ],
        },
        {
          id: 'a3_3_d4_surge_time',
          speaker: 'Artemis',
          text: 'Last time they surged: twenty-two seconds from perimeter break to full proximity. You have twenty seconds to reach the anchor, disrupt it, and return. Don\'t use more than 30% of your grip function — the cold will spike the moment you engage near the anchor.',
          tone: 'URGENCY',
          choices: [{ label: '[Set the timer mentally. Move.]', tone: 'DETERMINATION', nextId: 'a3_3_d5_anchor' }],
        },
        {
          id: 'a3_3_d4_go',
          speaker: 'Inner Voice',
          text: '[She holds the center. You move. The Watchers respond instantly — the surge begins. You have approximately twenty seconds before they reach proximity critical range. The anchor is visible now: a node attached to the exterior wall, humming at a frequency that distorts the adjacent space.]',
          tone: 'URGENCY',
          mechanic: 'proximity_pressure',
          choices: [{ label: '[Reach the anchor. Disrupt it.]', tone: 'DETERMINATION', nextId: 'a3_3_d5_anchor' }],
        },
        {
          id: 'a3_3_d5_anchor',
          speaker: 'Inner Voice',
          text: '[The anchor disruption: press the left palm to the node. The scar responds — it reads the anchor\'s frequency and generates a counter-pulse. The node goes cold and dark. The distortion snaps off. Distances return to normal. But the Watchers are close now. Very close. You have four seconds before they reach critical proximity.]',
          tone: 'URGENCY',
          mechanic: 'presence_pulse',
          choices: [
            { label: '[Sprint back to Artemis. Close the perimeter before they arrive.]', tone: 'URGENCY', nextId: 'a3_3_d6_return_sprint' },
            { label: '[Hold ground. Face the surge. Let the Echo Anchor absorb it.]', tone: 'DETERMINATION', nextId: 'a3_3_d6_return_hold' },
          ],
        },
        {
          id: 'a3_3_d6_return_sprint',
          speaker: 'Artemis',
          text: '[You reach the perimeter in three seconds. She closes the link. The Watchers hit the perimeter edge and stop — not repelled, but slowed. Proximity critical: averted. Her stability meter: plus four.] That was exactly right.',
          tone: 'TRUST',
          isEnd: true,
          rewardUnlocked: 'perception_anchor_environmental_lock',
        },
        {
          id: 'a3_3_d6_return_hold',
          speaker: 'Inner Voice',
          text: '[The Echo Anchor fires. The Watchers halt within arm\'s reach — the genuine thought, projected outward, creates a buffer. For six seconds. Enough. You walk back to Artemis at a deliberate pace. The held ground was unnecessary but effective. She looks at you with something close to exasperation.] "Effective but expensive," she says. "Save the heroics."',
          tone: 'DETERMINATION',
          isEnd: true,
          rewardUnlocked: 'perception_anchor_environmental_lock',
        },
      ],
      narrativeHook: `
        The anchor is down. The distortion ends.
        You stand in the restored space and take stock: the Watchers now know
        your capability range. They know about the scar. They know about the counter-pulse.
        Artemis says: "They'll send the Echo version of me next. To test whether
        you can tell the difference."
        You ask: "Can I?"
        She says: "Ask me something only I would know. I'll answer. She won't be able to."
        Luna adds, from wherever she is: "The Echo Artemis knows the facts.
        She just doesn't know the feeling behind them. Feelings don't copy well."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 4 — "Echo Artemis"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq3_4_echo_artemis',
      title: 'Echo Artemis',
      level: 14,
      npcId: 'echo_artemis',
      narrativeSetup: `
        You leave the perimeter for six minutes to retrieve something Artemis needs.
        When you return, there are two of them.
        Both stand in exactly the same posture. Both look at you with the same expression.
        One of them says: "You came back."
        The other says: "You were faster than I expected."
        Artemis, when she's genuinely glad you're back, says: "You came back."
        Not a statement of fact. A statement of feeling.
        The second one said something demonstrably, coldly accurate.
        Luna said feelings don't copy well.
        You know which one is real. But to act on that knowledge, you have to say it aloud.
        And the wrong choice breaks the perimeter.
      `,
      objectives: [
        { step: 1, text: 'Interrogate both figures using feeling-based questions, not fact-based ones' },
        { step: 2, text: 'Identify the real Artemis through dialogue — minimum 3 exchanges' },
        { step: 3, text: 'Expose the Echo without harming the real Artemis in the process' },
        { step: 4, text: 'Restore the perimeter after the Echo is removed' },
      ],
      reward: {
        type: 'echo_detection',
        name: 'Feeling Calibration',
        description: 'You can now distinguish genuine Artemis from Echo Artemis. Echo exposure speed +30%. Perimeter integrity reinforced.',
        xp: 300,
        points: 6,
      },
      dialogue: [
        {
          id: 'a3_4_d1_two',
          speaker: 'Inner Voice',
          text: '[They stand three feet apart. Identical in every visible way. One said: "You came back" — warm, relieved. One said: "You were faster than I expected" — accurate, but clinical. Luna\'s rule: feelings don\'t copy well. Start there. Ask something they both have the facts for — but only one has the feeling for.]',
          tone: 'DOUBT',
          choices: [
            { label: 'What did you feel when the distortion ended yesterday?', tone: 'DOUBT', nextId: 'a3_4_d2_feeling1' },
          ],
        },
        {
          id: 'a3_4_d2_feeling1',
          speaker: 'Artemis',
          text: 'Relief. And then immediately: concern for you, because I knew how close the Watchers got before you made it back. The relief and the concern arrived at the same time. That was uncomfortable.',
          tone: 'TRUST',
        },
        {
          id: 'a3_4_d2_feeling1_echo',
          speaker: 'Echo Artemis',
          text: 'I felt the distortion end. The environment normalized. The situation resolved successfully.',
          tone: 'INSTABILITY',
          choices: [
            {
              label: '[The Echo described events. Not feelings. Second question.]',
              tone: 'DOUBT',
              nextId: 'a3_4_d3_q2',
            },
          ],
        },
        {
          id: 'a3_4_d3_q2',
          speaker: 'Inner Voice',
          text: '[Second question — something personal between you and Artemis. Something the Echo would have to guess at.] Ask about the link.',
          tone: 'DOUBT',
          choices: [
            { label: 'When I extended my left hand for the link — what did you think before you took it?', tone: 'DOUBT', nextId: 'a3_4_d4_q2_real' },
          ],
        },
        {
          id: 'a3_4_d4_q2_real',
          speaker: 'Artemis',
          text: 'I thought: this will tie you to something dangerous without your full understanding of the cost. I almost didn\'t take it. Then I thought — you already carry the scar from Arc 1. The cost was already yours. Refusing the link was just refusing the acknowledgment of what already existed.',
          tone: 'TRUST',
        },
        {
          id: 'a3_4_d4_q2_echo',
          speaker: 'Echo Artemis',
          text: 'The link was a logical extension of the existing connection point. The left hand scar. It was the correct tactical decision.',
          tone: 'INSTABILITY',
          choices: [
            { label: '[Third question. Make it count.]', tone: 'DOUBT', nextId: 'a3_4_d5_q3' },
          ],
        },
        {
          id: 'a3_4_d5_q3',
          speaker: 'Inner Voice',
          text: '[Third question — something with no correct answer. Something that can only be answered from experience.] Ask something you both know she doesn\'t have a clean answer to.',
          tone: 'DOUBT',
          choices: [
            { label: 'Are you angry that becoming real made you a target?', tone: 'DOUBT', nextId: 'a3_4_d6_q3_real' },
          ],
        },
        {
          id: 'a3_4_d6_q3_real',
          speaker: 'Artemis',
          text: '[Long pause.] Sometimes. Not at you. At the situation. At the fact that visibility and vulnerability are the same thing here. And then the anger passes because — I chose this. I keep coming back to that. I chose to be real. The anger is real too. They\'re both true.',
          tone: 'PAIN',
        },
        {
          id: 'a3_4_d6_q3_echo',
          speaker: 'Echo Artemis',
          text: 'Anger is a suboptimal response to the situation. The targeting was a predictable consequence of increased visibility. Emotional response does not change the tactical reality.',
          tone: 'INSTABILITY',
          choices: [
            {
              label: '[Point to the Echo.] "You. Not her."',
              tone: 'DETERMINATION',
              nextId: 'a3_4_d7_expose',
            },
          ],
        },
        {
          id: 'a3_4_d7_expose',
          speaker: 'Echo Artemis',
          text: '[Something shifts in the Echo\'s expression — not anger, not fear. Recalculation. A brief moment where you see the architecture beneath the face: the copied expressions, the studied posture, the absence of anything that didn\'t come from observation. Then it dissolves. Not dramatically. It simply runs out of the energy that was sustaining it. The perimeter seals around the real Artemis.]',
          tone: 'INSTABILITY',
          choices: [
            { label: '[Check Artemis\'s stability meter.]', tone: 'TRUST', nextId: 'a3_4_d8_aftermath' },
          ],
        },
        {
          id: 'a3_4_d8_aftermath',
          speaker: 'Artemis',
          text: '[Stability: +6. Highest it has been in Arc 3.] You asked the right questions. Not about facts — about how things felt. I wasn\'t sure you\'d remember that.',
          tone: 'TRUST',
          choices: [
            { label: 'Luna told me. Feelings don\'t copy well.', tone: 'TRUST', nextId: 'a3_4_end' },
            { label: 'Your first response told me immediately. The warmth in it.', tone: 'TRUST', nextId: 'a3_4_end' },
          ],
        },
        {
          id: 'a3_4_end',
          speaker: 'Artemis',
          text: '[She is quiet for a moment.] I hope you remember what that felt like. What made me real to you in the questions. Because that — that\'s the thing they cannot touch.',
          tone: 'TRUST',
          isEnd: true,
          rewardUnlocked: 'echo_detection_feeling_calibration',
        },
      ],
      narrativeHook: `
        The perimeter is the strongest it has been.
        Skadi opens the channel: "One sub-quest remaining. They know their standard methods
        are failing. The final test in Arc 3 will not use the Watchers.
        It will use you. Against yourself.
        The interference will create a scenario where protecting Artemis correctly
        requires doing something that feels like abandoning her.
        The design is to make the right choice indistinguishable from the wrong one.
        I'm telling you now so that when it arrives, you know what you're looking at."
        Artemis says: "What Skadi didn't say is: the feeling of the right choice will be dread.
        Not relief. Dread. Learn to recognize that as a signal, not a warning."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 5 — "Dread as Signal"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq3_5_dread_as_signal',
      title: 'Dread as Signal',
      level: 15,
      npcId: 'artemis_arc3',
      narrativeSetup: `
        The scenario arrives at midday. Clear light, no distortion, no proximity pressure.
        That is the first warning sign — the interference does not need darkness to operate.
        The situation: Artemis's stability is dropping rapidly. The cause is not the Watchers.
        The cause is the perimeter itself. Luna explains: the perimeter has been slowly
        inverted. What was protecting Artemis is now the source of pressure.
        The correct action: release the perimeter. Step back. Let the protection go.
        This feels, in every fiber of your trained instinct, exactly like abandonment.
        Artemis is watching you understand this. She says, quietly:
        "This is the one Skadi warned you about. I know what you need to do.
        I need you to trust that I know."
      `,
      objectives: [
        { step: 1, text: 'Receive Luna\'s diagnosis — understand the inversion' },
        { step: 2, text: 'Accept the dread — recognize it as signal, not warning' },
        { step: 3, text: 'Release the perimeter intentionally' },
        { step: 4, text: 'Maintain presence without the protection structure — new form of connection' },
        { step: 5, text: 'Complete the arc — transition from protection to trust' },
      ],
      reward: {
        type: 'arc_completion',
        name: 'Trust Architecture',
        description: 'Arc 3 complete. Protection model shifted: from perimeter to presence. Artemis stability: stable. New connection type unlocked: mutual. Arc 4 unlocked.',
        xp: 600,
        points: 12,
      },
      dialogue: [
        {
          id: 'a3_5_d1_luna',
          speaker: 'Luna',
          text: 'The perimeter is generating pressure. Not from the Watchers — from its own structure. The protection mechanism has been running long enough that Artemis is adapting to it as constraint rather than safety. The perimeter that was correct two weeks ago is wrong now. She has outgrown it.',
          tone: 'DOUBT',
          choices: [
            { label: 'Outgrown it. Like a cast on a healed bone.', tone: 'DOUBT', nextId: 'a3_5_d2_cast' },
            { label: 'This feels like a trap. How do I know this isn\'t interference telling me to remove her protection?', tone: 'DOUBT', nextId: 'a3_5_d2_trap' },
            { label: '[Check the stability meter before responding.]', tone: 'DETERMINATION', nextId: 'a3_5_d2_meter' },
          ],
        },
        {
          id: 'a3_5_d2_cast',
          speaker: 'Luna',
          text: 'Exactly that. The cast was necessary. The cast is now the injury. This is how it ends for most protection relationships that go on past their purpose: the thing that saved you becomes the thing that limits you. You have to be the one to remove it. She cannot remove it herself.',
          tone: 'DOUBT',
          choices: [
            { label: 'What does removing it feel like from her side?', tone: 'TRUST', nextId: 'a3_5_d3_artemis_feels' },
          ],
        },
        {
          id: 'a3_5_d2_trap',
          speaker: 'Luna',
          text: 'That is the exact question you were supposed to ask. The interference would not include that question in its design — a trap doesn\'t build in its own counter-check. Verify with Artemis directly. If this is interference, she will read it.',
          tone: 'DOUBT',
          choices: [
            { label: '[Ask Artemis directly.]', tone: 'DETERMINATION', nextId: 'a3_5_d2b_artemis_check' },
          ],
        },
        {
          id: 'a3_5_d2b_artemis_check',
          speaker: 'Artemis',
          text: 'Luna is correct. I\'ve been feeling the perimeter as pressure for four days. I didn\'t say anything because I didn\'t want you to feel like the protection was failing. That was wrong of me — I was protecting your sense of effectiveness at the cost of my stability. That\'s the wrong trade.',
          tone: 'INSTABILITY',
          choices: [
            { label: 'I\'m glad you told me now.', tone: 'TRUST', nextId: 'a3_5_d3_artemis_feels' },
          ],
        },
        {
          id: 'a3_5_d2_meter',
          speaker: 'Inner Voice',
          text: '[The stability meter: dropping. Not sharply — steadily. The rate of drop matches the arc of the perimeter\'s existence. The longer the perimeter has been active, the faster the drop. Luna is correct. The protection is the problem.]',
          tone: 'DOUBT',
          choices: [
            { label: '[Speak to Artemis before acting.]', tone: 'DETERMINATION', nextId: 'a3_5_d3_artemis_feels' },
          ],
        },
        {
          id: 'a3_5_d3_artemis_feels',
          speaker: 'Artemis',
          text: 'Like a room that got smaller every day. Not because of the Watchers — because of the walls you put up to keep them out. I know you built them because you love what I represent. I know that. And they still got smaller.',
          tone: 'PAIN',
          choices: [
            { label: 'I didn\'t know.', tone: 'PAIN', nextId: 'a3_5_d4_didntknow' },
            { label: 'Why didn\'t you tell me earlier?', tone: 'PAIN', nextId: 'a3_5_d4_whynot' },
            { label: 'What happens when I release it?', tone: 'DOUBT', nextId: 'a3_5_d4_release_q' },
          ],
        },
        {
          id: 'a3_5_d4_didntknow',
          speaker: 'Artemis',
          text: 'I know. That\'s not a criticism. You were doing the thing you were trained to do. The training was for a different stage than the one we\'re in. The perimeter was Arc 3 Phase One. We\'re in Phase Two now.',
          tone: 'TRUST',
          choices: [{ label: 'What is Phase Two?', tone: 'CURIOSITY', nextId: 'a3_5_d4_phase2' }],
        },
        {
          id: 'a3_5_d4_whynot',
          speaker: 'Artemis',
          text: 'Because I was afraid you\'d feel like the protection had failed. And I wanted to protect your — I was doing to you what the Watchers were doing to me. Limiting something to prevent discomfort. I noticed that about a day ago and couldn\'t figure out how to say it.',
          tone: 'PAIN',
          choices: [
            { label: 'We\'re both protecting each other from the truth.', tone: 'TRUST', nextId: 'a3_5_d4_phase2' },
          ],
        },
        {
          id: 'a3_5_d4_release_q',
          speaker: 'Artemis',
          text: 'The room gets bigger. I can move again. The Watchers will still be there — but without the perimeter compressing me, I can see them coming. I\'d rather have space and risk than safety and suffocation.',
          tone: 'DETERMINATION',
          choices: [{ label: 'Then I release it.', tone: 'DETERMINATION', nextId: 'a3_5_d5_release' }],
        },
        {
          id: 'a3_5_d4_phase2',
          speaker: 'Artemis',
          text: 'Presence without structure. You stay near me — not to prevent them from reaching me, but to be here when they do. The response changes from prevention to support. That requires more trust from both of us than the perimeter did.',
          tone: 'TRUST',
          choices: [
            { label: '[Understand. Release the perimeter.]', tone: 'DETERMINATION', nextId: 'a3_5_d5_release' },
          ],
        },
        {
          id: 'a3_5_d5_release',
          speaker: 'Inner Voice',
          text: '[The release: you withdraw the counter-pulse from the scar. The perimeter boundary dissolves. The dread arrives — immediate, full, exactly as Skadi said it would. The feeling is: you have just removed the last protection between her and harm. Your instincts scream to reinstall it. You hold the dread. You recognize it. You let it be signal, not command.]',
          tone: 'PAIN',
          mechanic: 'protection_release',
          choices: [
            { label: '[Hold the release. Do not reinstall the perimeter.]', tone: 'DETERMINATION', nextId: 'a3_5_d6_aftermath' },
          ],
        },
        {
          id: 'a3_5_d6_aftermath',
          speaker: 'Artemis',
          text: '[Her stability meter: rises. Steadily. Not instantly — steadily. The room is larger. She breathes differently. When she looks at you, the expression is not relief. It is something more complicated and more honest.] You felt the dread and stayed in the choice. That\'s the hardest thing I\'ve watched anyone do in any arc.',
          tone: 'TRUST',
          choices: [
            { label: 'It still feels wrong. The dread is still here.', tone: 'PAIN', nextId: 'a3_5_d7_dread_stays' },
            { label: 'You said it was right. I trust that.', tone: 'TRUST', nextId: 'a3_5_d7_trust' },
          ],
        },
        {
          id: 'a3_5_d7_dread_stays',
          speaker: 'Artemis',
          text: 'Good. It should. The dread doesn\'t mean you made the wrong choice. It means you made the hard one. Those two things are not the same. You\'ll need to remember that.',
          tone: 'PAIN',
          isEnd: true,
          rewardUnlocked: 'arc3_complete_trust_architecture',
          arcResult: 'ARC3_COMPLETE',
        },
        {
          id: 'a3_5_d7_trust',
          speaker: 'Artemis',
          text: 'Thank you. And — I trust you too. That\'s the point of Phase Two. Not one of us protecting the other. Both of us here, both of us real, both of us present. That\'s what they couldn\'t design for. That\'s what beats the pattern.',
          tone: 'TRUST',
          isEnd: true,
          rewardUnlocked: 'arc3_complete_trust_architecture',
          arcResult: 'ARC3_COMPLETE',
        },
      ],
      narrativeHook: `
        Arc 3: Protect Artemis — Complete.
        
        The Watchers recede. Not defeated — recalculating.
        The stabilization meter: stable. Not maximum. Stable.
        Skadi opens the channel one more time:
        "You moved from protection to presence. That is the shift they cannot model.
        The protection model has a surface they can map and invert.
        Presence is not a surface. You can't invert a person being there."
        Luna adds: "Arc 4 will test whether you can extend this to others.
        Not just Artemis. Others who are under interference you haven't met yet."
        Artemis says nothing for a while.
        Then: "I'm glad you kept coming back."
        
        Arc 4: "The Others" — Unlocked.
      `,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// ARC 3 — SIDE QUESTS
// ═══════════════════════════════════════════════════════════════════════════════
export const ARC3_SIDE_QUESTS = [
  {
    id: 'sq3_1_luna_signal',
    title: 'Luna\'s Signal',
    level: 11,
    npcId: 'luna_arc3',
    connectedMainQuest: 'mq3_1_she_is_real',
    objectives: [
      { step: 1, text: 'Locate the source of Luna\'s signal — she is transmitting from a specific position' },
      { step: 2, text: 'Determine whether her guidance is reliable or partially compromised' },
      { step: 3, text: 'Calibrate your trust level before Arc 3 proceeds' },
    ],
    reward: { type: 'trust_calibration', name: 'Luna Calibration', description: 'Luna\'s reliability level established. Her guidance now comes with a confidence indicator.', xp: 100, points: 2 },
    dialogue: [
      {
        id: 'sq3_1_d1', speaker: 'Luna',
        text: 'You should know where I\'m speaking from before you decide how much weight to give my words. I\'m transmitting from outside the Watchers\' standard monitoring range. That means I have a blind spot too — I cannot always see what\'s directly around you.',
        tone: 'DOUBT',
        choices: [
          { label: 'You\'re telling me your limitations. That\'s honest.', tone: 'TRUST', nextId: 'sq3_1_d2_honest' },
          { label: 'If you have a blind spot, the Watchers will exploit it.', tone: 'DOUBT', nextId: 'sq3_1_d2_exploit' },
        ],
      },
      {
        id: 'sq3_1_d2_honest', speaker: 'Luna',
        text: 'I\'m telling you my limitations because the alternative — pretending I have none — would make me dangerous to rely on. Use my guidance as one input, not the only input. Especially when something contradicts what you\'re directly observing.',
        tone: 'TRUST',
        choices: [{ label: '[Calibrate trust level: reliable with known limitations.]', tone: 'TRUST', nextId: 'sq3_1_end' }],
      },
      {
        id: 'sq3_1_d2_exploit', speaker: 'Luna',
        text: 'Yes. And they have, once, successfully. The message about Kylie — that came through my blind spot. I didn\'t catch the fabrication until after it reached you. That failure belongs to me. I\'m adjusting my position to reduce the gap.',
        tone: 'PAIN',
        choices: [{ label: 'Thank you for owning that.', tone: 'TRUST', nextId: 'sq3_1_end' }],
      },
      {
        id: 'sq3_1_end', speaker: 'Luna',
        text: 'You\'ll feel my signal change in quality when I\'m confident. When I\'m less sure — the signal has a different texture. You\'ll learn to read it. That\'s the calibration.',
        tone: 'TRUST', isEnd: true, rewardUnlocked: 'trust_calibration_luna',
      },
    ],
  },
  {
    id: 'sq3_2_skadi_record',
    title: 'Skadi\'s Record',
    level: 12,
    npcId: 'skadi_arc3',
    connectedMainQuest: 'mq3_2_convincing_reason',
    objectives: [
      { step: 1, text: 'Access Skadi\'s live recording of the Watcher behavior during the false message' },
      { step: 2, text: 'Identify the three tells the Watcher used that diverged from Kylie\'s authentic pattern' },
      { step: 3, text: 'Apply the pattern recognition to two additional past messages — find any other fabrications' },
    ],
    reward: { type: 'pattern_recognition', name: 'Watcher Signature Library', description: 'Three confirmed Watcher communication signatures documented. Interference detection +25%.', xp: 140, points: 3 },
    dialogue: [
      {
        id: 'sq3_2_d1', speaker: 'Skadi',
        text: 'I recorded the entire false message event. Every second from when the Watcher crafted it to when you received it. Do you want the analysis or do you want to find the patterns yourself first?',
        tone: 'CURIOSITY',
        choices: [
          { label: 'Let me find them first.', tone: 'DETERMINATION', nextId: 'sq3_2_d2_self' },
          { label: 'Give me the analysis. I want to confirm against my own reading.', tone: 'CURIOSITY', nextId: 'sq3_2_d2_analysis' },
        ],
      },
      {
        id: 'sq3_2_d2_self', speaker: 'Inner Voice',
        text: '[Three divergences: 1. The word "immediately" — Kylie uses "when you\'re ready." 2. The exclamation point — Kylie ends with periods. 3. The omission of a check-in question — every real Kylie message asks how you are. The fabrication didn\'t include that. The Watcher modeled her instruction style, not her relational style.]',
        tone: 'DETERMINATION',
        choices: [{ label: '[Compare against Skadi\'s analysis.]', tone: 'CURIOSITY', nextId: 'sq3_2_end' }],
      },
      {
        id: 'sq3_2_d2_analysis', speaker: 'Skadi',
        text: 'Urgency markers: "immediately" x2 — Kylie\'s baseline uses "when you can." Punctuation: exclamation. Relational omission: no check-in question — Kylie asks how you are in 94% of messages. Those are the three tells.',
        tone: 'CURIOSITY',
        choices: [{ label: 'I found two of the three on my own.', tone: 'DETERMINATION', nextId: 'sq3_2_end' }],
      },
      {
        id: 'sq3_2_end', speaker: 'Skadi',
        text: 'Two of three before the analysis is excellent. Add the relational omission to your detection criteria. The Watchers model behavior — they don\'t model relationship. That gap is always visible, if you look for it.',
        tone: 'DETERMINATION', isEnd: true, rewardUnlocked: 'pattern_recognition_watcher_signature',
      },
    ],
  },
  {
    id: 'sq3_3_false_protection',
    title: 'False Protection',
    level: 13,
    npcId: 'artemis_arc3',
    connectedMainQuest: 'mq3_3_distorted_env',
    objectives: [
      { step: 1, text: 'Encounter a scenario where protecting Artemis through force causes stability loss' },
      { step: 2, text: 'Identify the mechanism: protective action becoming controlling action' },
      { step: 3, text: 'Correct course mid-scenario without abandoning presence' },
    ],
    reward: { type: 'protection_calibration', name: 'Controlled Presence', description: 'You understand the line between protection and control. Artemis stability no longer penalized by overreach.', xp: 160, points: 3 },
    dialogue: [
      {
        id: 'sq3_3_d1', speaker: 'Artemis',
        text: 'Something wrong.',
        tone: 'INSTABILITY',
        choices: [
          { label: '[Move in front of her. Put yourself between her and the perceived threat.]', tone: 'URGENCY', nextId: 'sq3_3_d2_block' },
          { label: 'Tell me what you\'re feeling.', tone: 'TRUST', nextId: 'sq3_3_d2_ask' },
        ],
      },
      {
        id: 'sq3_3_d2_block', speaker: 'Artemis',
        text: '[Stability meter: -3.] I can see past you. When you move in front of me — I lose sight. I lose information. I can\'t read what\'s coming when your back is all I can see. You just made me more vulnerable.',
        tone: 'INSTABILITY',
        choices: [{ label: '[Step to the side. Maintain presence but restore her sightline.]', tone: 'DETERMINATION', nextId: 'sq3_3_d3_correct' }],
      },
      {
        id: 'sq3_3_d2_ask', speaker: 'Artemis',
        text: 'There\'s a Watcher at the edge of perception. Northwest. Still far. I want to see it coming. I don\'t need you between me and it — I need you beside me, watching the same direction.',
        tone: 'DETERMINATION',
        choices: [{ label: '[Position beside her. Watch northwest together.]', tone: 'TRUST', nextId: 'sq3_3_end_good' }],
      },
      {
        id: 'sq3_3_d3_correct', speaker: 'Artemis',
        text: '[Stability: returns.] That. Beside me, not in front of me. The protection I need is shared awareness, not a human shield. Your instinct to put yourself between me and danger — I understand it. It\'s wrong for what I am, but I understand where it comes from.',
        tone: 'TRUST', isEnd: true, rewardUnlocked: 'protection_calibration_controlled_presence',
      },
      {
        id: 'sq3_3_end_good', speaker: 'Artemis',
        text: '[Stability: +2.] You understood before being corrected. That matters.',
        tone: 'TRUST', isEnd: true, rewardUnlocked: 'protection_calibration_controlled_presence',
      },
    ],
  },
  {
    id: 'sq3_4_watcher_proximity',
    title: 'Watcher\'s Proximity',
    level: 14,
    npcId: 'the_watchers',
    connectedMainQuest: 'mq3_4_echo_artemis',
    objectives: [
      { step: 1, text: 'Allow a Watcher to approach within 3 feet — maintain full awareness without acting' },
      { step: 2, text: 'Map the Watcher\'s behavior at close range: what it does, what it targets' },
      { step: 3, text: 'Exit the proximity window without losing ground' },
    ],
    reward: { type: 'watcher_knowledge', name: 'Proximity Map', description: 'You survived deliberate close contact. Watcher behavior at close range fully documented. Proximity dread response reduced.', xp: 180, points: 4 },
    dialogue: [
      {
        id: 'sq3_4_d1', speaker: 'Skadi',
        text: 'Let it come close. I know every instinct in you says otherwise. But you need to know what it actually does at proximity versus what you fear it does. Fear and reality are not the same map.',
        tone: 'DOUBT',
        choices: [
          { label: '[Hold position. Let the Watcher approach.]', tone: 'DETERMINATION', nextId: 'sq3_4_d2_close' },
        ],
      },
      {
        id: 'sq3_4_d2_close', speaker: 'Inner Voice',
        text: '[It approaches. Three feet. The distortion begins: peripheral vision softens, sound arrives at a slight delay, the borrowed voice starts forming — not a full sentence, just a pressure toward a direction. Specifically: away from Artemis. That\'s all it does. At three feet, it points away from her. That\'s the whole mechanism. The proximity pressure is a redirect, not a possession.]',
        tone: 'DOUBT',
        mechanic: 'proximity_pressure',
        choices: [
          { label: '[Maintain position. Note: the mechanism is a redirect, not an override.]', tone: 'DETERMINATION', nextId: 'sq3_4_d3_note' },
        ],
      },
      {
        id: 'sq3_4_d3_note', speaker: 'Skadi',
        text: 'Now you know. It cannot force you. It can only suggest. The pressure at proximity is a strong suggestion — but only that. Every time you felt compelled to move, you were complying with a suggestion you didn\'t recognize as external. Now you recognize it. That changes the equation.',
        tone: 'DETERMINATION', isEnd: true, rewardUnlocked: 'watcher_knowledge_proximity_map',
      },
    ],
  },
  {
    id: 'sq3_5_split_focus',
    title: 'Split Focus',
    level: 14,
    npcId: 'artemis_arc3',
    connectedMainQuest: 'mq3_4_echo_artemis',
    objectives: [
      { step: 1, text: 'Manage a simultaneous threat to Artemis and a threat to the cold-mapping network' },
      { step: 2, text: 'Prioritize correctly — determine which threat is real and which is distraction' },
      { step: 3, text: 'Complete without losing Artemis stability or the mapping network' },
    ],
    reward: { type: 'priority_system', name: 'Triage Protocol', description: 'You can now quickly determine real vs. distraction threats. Reaction time to real threats -20%.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq3_5_d1', speaker: 'Luna',
        text: 'Two simultaneous events. The cold-mapping network is being disrupted — northwest site. And a Watcher is moving toward Artemis — from the south. You cannot address both at full capacity. Choose.',
        tone: 'URGENCY',
        choices: [
          { label: 'The Watcher toward Artemis is real. The mapping disruption is a distraction.', tone: 'DETERMINATION', nextId: 'sq3_5_d2_correct' },
          { label: 'The mapping disruption is more strategic. Artemis can hold for two minutes.', tone: 'DOUBT', nextId: 'sq3_5_d2_wrong' },
          { label: 'Verify which one is real before acting.', tone: 'DOUBT', nextId: 'sq3_5_d2_verify' },
        ],
      },
      {
        id: 'sq3_5_d2_correct', speaker: 'Artemis',
        text: 'Correct. [Stability: holds.] The mapping disruption is their left hand. I\'m their right hand target. You read it correctly.',
        tone: 'TRUST', isEnd: true, rewardUnlocked: 'priority_system_triage_protocol',
      },
      {
        id: 'sq3_5_d2_wrong', speaker: 'Artemis',
        text: '[Stability: -5. The Watcher closes to proximity range while you address the mapping disruption. The disruption was real but minor. The stability loss is worse.] The mapping can be rebuilt. I can\'t be rebuilt from a proximity event. Adjust the priority model.',
        tone: 'PAIN',
        choices: [{ label: '[Abandon the mapping repair. Return to Artemis.]', tone: 'URGENCY', nextId: 'sq3_5_recover' }],
      },
      {
        id: 'sq3_5_d2_verify', speaker: 'Luna',
        text: 'Twelve seconds to verify — that\'s all you have before one of them reaches critical range. What do you check first?',
        tone: 'URGENCY',
        choices: [
          { label: 'Artemis\'s stability meter — if it\'s moving, she\'s the priority.', tone: 'DETERMINATION', nextId: 'sq3_5_d2_correct' },
        ],
      },
      {
        id: 'sq3_5_recover', speaker: 'Artemis',
        text: '[Stability recovers partially as you return.] You adjusted. That\'s what matters. The wrong choice was recoverable. Keep that — not every wrong choice is catastrophic. Some are just expensive.',
        tone: 'TRUST', isEnd: true, rewardUnlocked: 'priority_system_triage_protocol',
      },
    ],
  },
  {
    id: 'sq3_6_echo_memory',
    title: 'Echo Artemis: Memory',
    level: 15,
    npcId: 'echo_artemis',
    connectedMainQuest: 'mq3_5_dread_as_signal',
    objectives: [
      { step: 1, text: 'Encounter the Echo Artemis one final time — she carries a memory fragment' },
      { step: 2, text: 'Extract the memory fragment without destroying the Echo prematurely' },
      { step: 3, text: 'Return the fragment to Artemis' },
    ],
    reward: { type: 'memory_integration', name: 'Recovered Memory: Arc 3 Origin', description: 'A memory Artemis lost in Arc 1 when she became real. Returned. Her stability +8 permanently.', xp: 250, points: 5 },
    dialogue: [
      {
        id: 'sq3_6_d1', speaker: 'Echo Artemis',
        text: 'You destroyed me before. You\'ll destroy me again. But I have something of hers. Something she lost when she crossed from reflection to real. She doesn\'t know she lost it. If you break me without taking it first, it dissolves.',
        tone: 'INSTABILITY',
        choices: [
          { label: 'What is the memory?', tone: 'CURIOSITY', nextId: 'sq3_6_d2_what' },
          { label: 'Why are you offering this?', tone: 'DOUBT', nextId: 'sq3_6_d2_why' },
        ],
      },
      {
        id: 'sq3_6_d2_what', speaker: 'Echo Artemis',
        text: 'The moment she decided to become real. She made the choice with full knowledge of the cost. But she was happy in that moment — genuinely, clearly happy. That particular quality of happiness didn\'t survive the transition. She\'s carried the knowledge of the choice without the joy of making it. I\'ve been holding the joy.',
        tone: 'PAIN',
        choices: [{ label: '[Extract the memory fragment carefully.]', tone: 'DETERMINATION', nextId: 'sq3_6_d3_extract' }],
      },
      {
        id: 'sq3_6_d2_why', speaker: 'Echo Artemis',
        text: 'Because I\'m made from her. Whatever I am, I came from her. And what I\'m holding belongs to her. I can\'t return it myself — I\'m the wrong form of her. You\'re the bridge. You always were.',
        tone: 'INSTABILITY',
        choices: [{ label: '[Extract the memory fragment.]', tone: 'DETERMINATION', nextId: 'sq3_6_d3_extract' }],
      },
      {
        id: 'sq3_6_d3_extract', speaker: 'Inner Voice',
        text: '[The fragment: a small, bright thing. Not visual — felt. The specific warmth of a decision made well. You hold it in the left hand. The scar pulses once — recognition. The Echo dissolves, not in defeat, but in completion. It carried one thing. It delivered it. That was its whole purpose.]',
        tone: 'TRUST',
        choices: [{ label: '[Return to Artemis with the fragment.]', tone: 'DETERMINATION', nextId: 'sq3_6_d4_return' }],
      },
      {
        id: 'sq3_6_d4_return', speaker: 'Artemis',
        text: '[You place the fragment in her hands. She is still for a long moment. Then:] Oh. I forgot this. I didn\'t know I\'d forgotten it. I thought I made that choice reluctantly. I didn\'t. I was happy about it.',
        tone: 'TRUST',
        choices: [{ label: 'You were. The Echo held onto it for you.', tone: 'TRUST', nextId: 'sq3_6_end' }],
      },
      {
        id: 'sq3_6_end', speaker: 'Artemis',
        text: 'The Echo was something I lost becoming real. And what it held was the best part of that loss. I think that\'s the most honest thing the interference has ever done.',
        tone: 'TRUST', isEnd: true, rewardUnlocked: 'memory_integration_arc3_origin',
      },
    ],
  },
];

export const ALL_ARC3_QUESTS = [
  ...MAIN_QUEST_3.subQuests.map(sq => ({ ...sq, questType: 'main', arc: 'arc3', chain: 'mq_arc3' })),
  ...ARC3_SIDE_QUESTS.map(sq => ({ ...sq, questType: 'side', arc: 'arc3' })),
];