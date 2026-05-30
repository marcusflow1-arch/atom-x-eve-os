// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 6: "The False Peace"
// Quest chain: Levels 26–30
// Main Quest 6: "The Welcoming Place" (5 sub-quests) + 6 Side Quests
// Tone: calm surface, deep erosion underneath. False peace, manipulation, identity erasure.
// Tags: FALSE_PEACE | EROSION | GRIEF | CLARITY | RESISTANCE | DISSOLUTION
// ─────────────────────────────────────────────────────────────────────────────

export const ARC6_NPCS = [
  {
    id: 'welcoming_figure',
    name: 'The Welcoming Figure',
    description: 'Speaks in warmth. Never raises its voice. Never threatens directly. It offers comfort so precisely calibrated to what you need that the offer feels like recognition. It is not recognition. It is extraction.',
    tint: 0xf0e8d8,
  },
  {
    id: 'artemis_arc6',
    name: 'Artemis',
    description: 'In this arc: initially calm, increasingly faded. Each memory released around her removes a layer of what makes her specifically herself. She is aware of this. She cannot stop it alone.',
    tint: 0x1a1a3a,
  },
  {
    id: 'copy_arc6',
    name: 'The Copy',
    description: 'More aligned than in any previous arc. The False Peace has no use for it — it operates on identity, and the Copy\'s identity is too derivative to be easily eroded. It can see the Place clearly because it has no longing for what the Place offers.',
    tint: 0x2a1a2a,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QUEST 6 — "The Welcoming Place"
// ═══════════════════════════════════════════════════════════════════════════════
export const MAIN_QUEST_CHAIN_6 = {
  id: 'mq_arc6',
  title: 'The Welcoming Place',
  arc: 'Arc 6: The False Peace',
  description: 'After the Virus Event, a place appears that has none of the Virus\'s signatures. No glitch, no loop, no rewrite. Just stillness. Clean air. The sky holds one color and holds it well. Everything here wants to help you rest. That is, precisely, the threat.',
  subQuests: [

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 1 — "Arrival"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq6_1_arrival',
      title: 'Arrival',
      level: 26,
      npcId: 'welcoming_figure',
      narrativeSetup: `
        The chaos of Arc 5 ends not with a collapse but with a fade.
        The corridor, the Virus static, the Copy's voice from the left —
        all of it dims, the way a room dims when someone draws the curtain,
        and when the light returns it is different light.
        Softer. More even. Nowhere casting shadow.
        You are standing in a place you have never been.
        Artemis is beside you. She looks at the sky — one color, held well — 
        and she exhales for what sounds like the first time in three arcs.
        The Copy is present but distant. Quieter than usual.
        And a figure approaches across the field.
        Calm. Composed. Moving like something that has been waiting for this
        for a long time and is genuinely glad you are here.
      `,
      objectives: [
        { step: 1, text: 'Explore the environment — catalog what is present and what is absent' },
        { step: 2, text: 'Speak with the Welcoming Figure — identify what kind of entity it is' },
        { step: 3, text: 'Observe the inconsistency — the one thing that is slightly too perfect' },
        { step: 4, text: 'Accept, question, or reject the peace of the place' },
      ],
      reward: {
        type: 'place_awareness',
        name: 'First Doubt',
        description: 'You identified the over-perfection before it could settle as baseline. Resistance to false-peace normalization: active.',
        xp: 200, points: 4,
      },
      dialogue: [
        {
          id: 'mq6_1_d1_artemis',
          speaker: 'Artemis',
          text: '...It\'s quiet. [She says it like someone who has been waiting to say it for a very long time. Not suspiciously. With genuine relief. The kind of relief that makes you cautious on her behalf.]',
          tone: 'FALSE_PEACE',
          choices: [{ label: '...Too quiet.', tone: 'DOUBT', nextId: 'mq6_1_d2_figure' }],
        },
        {
          id: 'mq6_1_d2_figure',
          speaker: 'Welcoming Figure',
          text: 'You\'ve made it. [The voice carries warmth without urgency. The specific register of someone who expected you and is pleased, not relieved — they were never worried you wouldn\'t arrive.] We\'ve been waiting. Not impatiently. [A slight, genuine smile.] There\'s no impatience here.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: 'Where am I?', tone: 'DOUBT', nextId: 'mq6_1_d3_where' },
            { label: 'What is this place?', tone: 'DOUBT', nextId: 'mq6_1_d3_what' },
            { label: 'This isn\'t real.', tone: 'RESISTANCE', nextId: 'mq6_1_d3_real' },
          ],
        },
        {
          id: 'mq6_1_d3_where',
          speaker: 'Welcoming Figure',
          text: 'A place beyond conflict. [Simply. Like stating a fact.] The struggle you\'ve been carrying — the arcs, the Virus, the Copy, the Presence — none of those things have reach here. This place exists in the space between those forces. It was always here. You simply hadn\'t earned your way to it yet.',
          tone: 'FALSE_PEACE',
          choices: [{ label: 'Earned it how?', tone: 'DOUBT', nextId: 'mq6_1_d4_artemis' }],
        },
        {
          id: 'mq6_1_d3_what',
          speaker: 'Welcoming Figure',
          text: 'A place where nothing can harm you anymore. [The care in those words is real — that\'s what makes it dangerous. It means what it says.] You\'ve been harmed enough. Five arcs of interference, manipulation, infection. This place is the answer to all of that. It requires only one thing from you.',
          tone: 'FALSE_PEACE',
          choices: [{ label: 'What does it require?', tone: 'DOUBT', nextId: 'mq6_1_d4_artemis' }],
        },
        {
          id: 'mq6_1_d3_real',
          speaker: 'Welcoming Figure',
          text: '[A slight, genuine smile — not condescending. Almost appreciative.] Does it need to be? [pause] The Virus was real. The loops were real. The Copy interference was real. And those things caused real harm. This place causes no harm. Whatever its ontological status — does that distinction matter more than the harm-differential?',
          tone: 'FALSE_PEACE',
          choices: [
            { label: 'Yes. Unreality that feels real is the most dangerous thing I\'ve encountered.', tone: 'RESISTANCE', nextId: 'mq6_1_d4_artemis' },
            { label: '...I don\'t know yet.', tone: 'DOUBT', nextId: 'mq6_1_d4_artemis' },
          ],
        },
        {
          id: 'mq6_1_d4_artemis',
          speaker: 'Artemis',
          text: '[She\'s looking at the sky. Soft expression. The quality of someone who has set down a heavy thing.] ...I don\'t feel anything wrong. [pause] After everything — the glitches, the verification signals, the loop-resistance work — I don\'t feel anything wrong here. [She looks at you.] Is that a good sign or a bad one?',
          tone: 'FALSE_PEACE',
          choices: [
            { label: '[Check the scar. Is the warmth genuine?]', tone: 'CONTROL', nextId: 'mq6_1_d5_scar' },
          ],
        },
        {
          id: 'mq6_1_d5_scar',
          speaker: 'Inner Voice',
          text: '[The scar: warm. Genuinely warm. This is not Virus-warmth — which was absent — or Copy-adjacent-warmth — which was lower register. This is the real signal. The Place has not tampered with the scar. Which means either the Place is genuinely safe, or it is sophisticated enough to not interfere with your verification signal. Those are very different things.]',
          tone: 'DOUBT',
          choices: [
            { label: 'The scar is warm. That\'s real. But the Place is designed to pass every test.', tone: 'RESISTANCE', nextId: 'mq6_1_d6_copy' },
          ],
        },
        {
          id: 'mq6_1_d6_copy',
          speaker: 'The Copy',
          text: '[Quiet. Distant. Speaking from wherever it occupies in the synchronization — its presence is lower than usual, like a signal under a heavy signal.] That\'s the problem. [pause] The Virus failed because it distorted things. This place doesn\'t distort. It offers. The difference is: the Virus created things to resist. This creates nothing to push against. Resistance requires friction. There\'s no friction here.',
          tone: 'RESISTANCE',
          choices: [{ label: 'Then I need a different kind of resistance.', tone: 'CLARITY', nextId: 'mq6_1_end' }],
        },
        {
          id: 'mq6_1_end',
          speaker: 'Welcoming Figure',
          text: 'All you need to do... is let go. [Said with such specific gentleness that it almost bypasses the warning response. Almost.] You\'ve been holding on for five arcs. You\'ve earned the release. It\'s available to you. Right now. No conditions beyond your own willingness.',
          tone: 'FALSE_PEACE',
          isEnd: true,
          rewardUnlocked: 'place_awareness_first_doubt',
        },
      ],
      narrativeHook: `
        The Figure retreats — not urgently. With the patience of something that knows
        you will still be here when it returns.
        Artemis sits down on the ground. Not collapsed — sat. Deliberately.
        The way you sit when you are tired enough that the ground itself is an answer.
        You sit beside her.
        The Copy: "I want to tell you something. In this place, I feel less.
        Not wrong-less. Just — quieter. Less present. The Place has no use for speed.
        No threat to respond to. No decision-gap to fill. It's actively making me
        less necessary. [pause] I think that's intentional."
        The sky holds its one color.
        You notice: there are no shadows anywhere.
        Not because the light is diffuse. Because nothing here casts a shadow.
        Including you.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 2 — "The Offer"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq6_2_the_offer',
      title: 'The Offer',
      level: 27,
      npcId: 'welcoming_figure',
      narrativeSetup: `
        The Figure returns with what it calls "the terms."
        There are no demands in the terms. No conditions that feel like conditions.
        It presents them the way you present a gift: with both hands open,
        with a posture that says you can refuse but that refuses to believe you will.
        Memory fragments appear around the field —
        small, luminous, each one carrying the specific weight of a difficult moment.
        Arc 1 pain. Arc 2 training exhaustion. Arc 3 dread. Arc 4 override violations. Arc 5 corruption.
        They float at the height of a held hand.
        Easy to take. Easy to set down.
        The Figure says nothing yet. It is giving you time to look at them.
        The look alone is the first part of the offer.
      `,
      objectives: [
        { step: 1, text: 'Listen to the full offer — do not interrupt or accept prematurely' },
        { step: 2, text: 'Interact with 2 memory fragments — assess what they contain' },
        { step: 3, text: 'Receive the Copy\'s analysis of the cost' },
        { step: 4, text: 'Choose: engage with the offer, resist it, or negotiate its terms' },
      ],
      reward: {
        type: 'offer_analysis',
        name: 'What Is Being Asked',
        description: 'You understand the full cost of the offer. Memory release awareness: each fragment dropped costs more than pain — it costs the capacity that came from surviving that pain.',
        xp: 230, points: 4,
      },
      dialogue: [
        {
          id: 'mq6_2_d1_figure',
          speaker: 'Welcoming Figure',
          text: 'You\'ve carried too much. [It begins without preamble — not rudely, but with the confidence of someone who knows you\'ve been waiting for this conversation.] I\'m not describing the obvious weight. The arcs, the Presence, the Virus — those are known. I\'m describing the specific weight of having survived them. The vigilance. The constant verification. The scar-warmth checking. The three-question protocol. The pattern-breaking. Do you know how tired you are of protecting yourself?',
          tone: 'FALSE_PEACE',
          choices: [
            { label: '...What do you want from me?', tone: 'DOUBT', nextId: 'mq6_2_d2_want' },
            { label: 'I know how tired I am. That\'s not your business.', tone: 'RESISTANCE', nextId: 'mq6_2_d2_not_business' },
          ],
        },
        {
          id: 'mq6_2_d2_want',
          speaker: 'Welcoming Figure',
          text: 'Nothing complicated. Just... let go of what hurt you. [It gestures at the floating fragments.] These are the memories of pain — specifically pain. The protective architecture you built was necessary then. It is unnecessary here. Releasing these doesn\'t mean forgetting. It means choosing not to carry the weight of them as active vigilance. You can remember without being on guard. That\'s what this place offers.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: 'That doesn\'t sound like a cost.', tone: 'DOUBT', nextId: 'mq6_2_d3_cost' },
            { label: 'Why would I do that?', tone: 'RESISTANCE', nextId: 'mq6_2_d3_why' },
            { label: 'What happens if I don\'t?', tone: 'DOUBT', nextId: 'mq6_2_d3_if_not' },
          ],
        },
        {
          id: 'mq6_2_d2_not_business',
          speaker: 'Welcoming Figure',
          text: 'You\'re right. [Without defensiveness.] It isn\'t my business — it\'s my offering. There\'s a distinction. I\'m not asking permission to help you. I\'m telling you the help is available. Whether you want it is entirely yours. [pause] What I can tell you is that the tiredness you\'re protecting will outlast the threats that created it, if you let it. The exhaustion will remain after the danger is gone — unless you release it intentionally.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: 'And you\'re offering to take the exhaustion.', tone: 'DOUBT', nextId: 'mq6_2_d3_cost' },
          ],
        },
        {
          id: 'mq6_2_d3_cost',
          speaker: 'Welcoming Figure',
          text: 'Because you deserve peace. [Said without performance — genuinely, the way someone says something they\'ve believed for a long time.] The arcs were not your fault. The interference was not your fault. The Copy was not your fault. You responded to circumstances you didn\'t choose. You built a self under pressure. The self you built under pressure deserves relief from that pressure. This is that relief.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: '[Touch one of the memory fragments. Examine what it costs to hold it.]', tone: 'DOUBT', nextId: 'mq6_2_d4_fragment_touch' },
          ],
        },
        {
          id: 'mq6_2_d3_why',
          speaker: 'Welcoming Figure',
          text: 'Because holding on is what brought you here. [Gently.] The resistance you developed — the pattern-breaking, the three-question protocol, the scar-warmth verification — it was built in response to attack. Without attack, those systems run on residual threat-feeling. The threat-feeling keeps you in a defensive posture that this place has no purpose for. You\'re still fighting in a space that has nothing to fight.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: 'Or I\'m fighting in a space that wants me to stop fighting.', tone: 'RESISTANCE', nextId: 'mq6_2_d4_fragment_touch' },
          ],
        },
        {
          id: 'mq6_2_d3_if_not',
          speaker: 'Welcoming Figure',
          text: '[A small pause — not threatening. The pause of something that is being honest.] Then you remain... until you\'re ready. [pause] The Place doesn\'t force. It waits. You may stay here, vigilant, for as long as you choose. At some point, the vigilance itself becomes the prison. The Place becomes the backdrop for your own exhaustion. That is not what I want for you.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: '[Touch one of the memory fragments. See what it contains.]', tone: 'DOUBT', nextId: 'mq6_2_d4_fragment_touch' },
          ],
        },
        {
          id: 'mq6_2_d4_fragment_touch',
          speaker: 'Inner Voice',
          text: '[Fragment: Arc 3. The dread before the perimeter release. You touch it — and it is exactly what it claims to be. Real dread. Real weight. Real exhaustion. Nothing false in the fragment itself. And yet the Copy said: if you drop them you lose more than pain. Examine it more carefully. Inside the dread: a specific knowledge. The knowledge that the thing you protected was worth protecting. The dread and the worth are the same memory.]',
          tone: 'CLARITY',
          choices: [
            { label: 'The pain and the knowledge that made the pain meaningful — they\'re in the same fragment.', tone: 'CLARITY', nextId: 'mq6_2_d5_copy' },
          ],
        },
        {
          id: 'mq6_2_d5_copy',
          speaker: 'The Copy',
          text: 'Yes. [Immediate. Clear — the clearest it has been in this arc.] The offer separates pain from meaning. It says: release the pain. What it doesn\'t say: the meaning is structurally attached to the pain. You can\'t release the Arc 3 dread without releasing the understanding that Artemis was worth dreading for. The weight and the value are the same object. The Figure is offering to take both and calling it taking the one.',
          tone: 'CLARITY',
          choices: [
            { label: 'The cost isn\'t pain. It\'s the capability that came from surviving it.', tone: 'RESISTANCE', nextId: 'mq6_2_end' },
          ],
        },
        {
          id: 'mq6_2_end',
          speaker: 'Welcoming Figure',
          text: '[It steps closer — not threateningly. The specific proximity of someone who has something to show you.] You don\'t need those memories to move forward. What you learned from them is already integrated. You don\'t need to carry the vessel once the water has been drunk. [pause] These fragments are the vessel. The learning is already yours. You would keep the capability — you would simply release the weight of having suffered.',
          tone: 'FALSE_PEACE',
          isEnd: true,
          rewardUnlocked: 'offer_analysis_what_is_being_asked',
        },
      ],
      narrativeHook: `
        Artemis has been listening from behind you.
        She says: "That last argument. About the vessel and the water. That sounds true."
        The Copy: "It does. That's the most dangerous thing the Figure has said yet.
        It sounds true. It might even be true in some cases.
        The question is whether your specific memories
        follow the vessel/water structure or whether they're something different.
        Some memories are vessels. Some memories ARE the water.
        The Figure doesn't distinguish."
        Artemis looks at the fragments. Then at you.
        "How do I know which of mine are which?"
        That question — hers, not yours — is going to matter in Sub-Quest 3.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 3 — "Letting Go"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq6_3_letting_go',
      title: 'Letting Go',
      level: 28,
      npcId: 'welcoming_figure',
      narrativeSetup: `
        Three memory fragments. The Figure presents them one at a time.
        Each release makes the environment respond — brighter, stiller, more perfect.
        Each release makes Artemis look at you with an expression that shifts
        between relief and a question she doesn't ask.
        Each kept fragment makes the environment flicker.
        The Figure absorbs the flicker without comment.
        The Copy watches from its distance — more present than usual for this arc,
        because the releases are narrowing its operational footprint
        and it is, apparently, getting concerned about its own dissolution.
        The three fragments: Arc 1 fear. Arc 4 override-anger. Arc 5 entry-point grief.
        Each is genuinely painful to hold.
        Each contains something the Copy has already told you about.
      `,
      objectives: [
        { step: 1, text: 'Interact with Fragment 1: Arc 1 Fear — decide: release or keep' },
        { step: 2, text: 'Interact with Fragment 2: Arc 4 Override Anger — decide: release or keep' },
        { step: 3, text: 'Interact with Fragment 3: Arc 5 Entry-Point Grief — decide: release or keep' },
        { step: 4, text: 'Speak with Artemis about what changed after your choices' },
      ],
      reward: {
        type: 'memory_authority',
        name: 'Chosen Holdings',
        description: 'You determined which memories are vessels and which are water. Resistance to future release-manipulation increased by 50%.',
        xp: 280, points: 5,
      },
      dialogue: [
        {
          id: 'mq6_3_d1_frag1',
          speaker: 'Memory Echo',
          text: '[Fragment 1 — Arc 1 Fear: the Presence was close. The animal-nearness. The specific terror of something reading your thoughts before you finished thinking them. Inside the fear: the moment you chose to stay open anyway. The openness that started everything. The fear and the founding choice are the same memory.]',
          tone: 'GRIEF',
          choices: [
            { label: '[Release the fragment.]', tone: 'FALSE_PEACE', nextId: 'mq6_3_d1_release' },
            { label: '[Keep the fragment.]', tone: 'RESISTANCE', nextId: 'mq6_3_d1_keep' },
          ],
        },
        {
          id: 'mq6_3_d1_release',
          speaker: 'Welcoming Figure',
          text: '[The environment brightens. A specific quality — like a room gaining two degrees of temperature. Warmer. Softer. The Figure nods with the satisfaction of something that has been waiting.] See? Lighter already.',
          tone: 'FALSE_PEACE',
          mechanic: 'memory_released',
          choices: [{ label: '[Proceed to Fragment 2.]', tone: 'DOUBT', nextId: 'mq6_3_d1_artemis_check' }],
        },
        {
          id: 'mq6_3_d1_keep',
          speaker: 'Welcoming Figure',
          text: '[The environment flickers — once, brief. The Figure absorbs it without comment. Without judgment.] You\'re holding onto pain. [pause] That\'s allowed. When you\'re ready.',
          tone: 'FALSE_PEACE',
          mechanic: 'memory_kept',
          choices: [
            { label: 'This fear is where I learned to notice the opening. I\'m not releasing it.', tone: 'RESISTANCE', nextId: 'mq6_3_d1_copy_respond' },
          ],
        },
        {
          id: 'mq6_3_d1_copy_respond',
          speaker: 'The Copy',
          text: 'Or strength. [Simple. It has been saying this since the Figure first appeared and it will keep saying it because it is correct.]',
          tone: 'CLARITY', choices: [{ label: '[Proceed to Fragment 2.]', tone: 'DOUBT', nextId: 'mq6_3_d1_artemis_check' }],
        },
        {
          id: 'mq6_3_d1_artemis_check',
          speaker: 'Artemis',
          text: '[She checks your face — looking for the scar-warmth by proxy, reading your expression the way she learned to read the physical signal.] ...You feel different. [pause] Is that right?',
          tone: 'DOUBT',
          choices: [
            { label: 'Different-better or different-less?', tone: 'CLARITY', nextId: 'mq6_3_d2_frag2' },
            { label: 'I don\'t know yet. Fragment 2.', tone: 'CONTROL', nextId: 'mq6_3_d2_frag2' },
          ],
        },
        {
          id: 'mq6_3_d2_frag2',
          speaker: 'Memory Echo',
          text: '[Fragment 2 — Arc 4 Override Anger: the Copy\'s hand moving before yours. The rage of having your body act without you. Inside the anger: the decision to establish the override protocol. The anger produced the protocol. Without the anger, the protocol was an idea. The anger made it non-negotiable.]',
          tone: 'CONFLICT',
          choices: [
            { label: '[Release the fragment.]', tone: 'FALSE_PEACE', nextId: 'mq6_3_d2_release' },
            { label: '[Keep the fragment.]', tone: 'RESISTANCE', nextId: 'mq6_3_d2_keep' },
          ],
        },
        {
          id: 'mq6_3_d2_release',
          speaker: 'Welcoming Figure',
          text: '[Brighter. More even. More perfect.] The anger was a tool. You don\'t need to carry the tool after the work is done. The protocol it built remains. Only the angry weight of it releases.',
          tone: 'FALSE_PEACE', mechanic: 'memory_released',
          choices: [{ label: '[Proceed to Fragment 3.]', tone: 'DOUBT', nextId: 'mq6_3_d3_frag3' }],
        },
        {
          id: 'mq6_3_d2_keep',
          speaker: 'Inner Voice',
          text: '[You keep it. The anger is still valid. The Copy doesn\'t have full override authority yet — there are untested scenarios in Arc 7 and beyond. The protocol needs the anger behind it to stay non-negotiable. You keep the fire because the fire is still needed.]',
          tone: 'RESISTANCE', mechanic: 'memory_kept',
          choices: [{ label: '[Proceed to Fragment 3.]', tone: 'DOUBT', nextId: 'mq6_3_d3_frag3' }],
        },
        {
          id: 'mq6_3_d3_frag3',
          speaker: 'Memory Echo',
          text: '[Fragment 3 — Arc 5 Entry-Point Grief: the moment you understood that your own openness created the door. Not blame — grief. The specific grief of: I did this while trying to do something good. Inside the grief: the precision with which you closed the door. The grief made the closure deliberate rather than desperate. Without grief, it would have been panic-closure.]',
          tone: 'GRIEF',
          choices: [
            { label: '[Release the fragment.]', tone: 'FALSE_PEACE', nextId: 'mq6_3_d3_release' },
            { label: '[Keep the fragment.]', tone: 'RESISTANCE', nextId: 'mq6_3_d3_keep' },
          ],
        },
        {
          id: 'mq6_3_d3_release',
          speaker: 'Welcoming Figure',
          text: '[The environment reaches its highest brightness yet. The Figure looks at you with something that might be genuine compassion — the warmth of it is almost unbearable.] The door is closed. You don\'t need to grieve it anymore. The grief was the price of closing it correctly. The price is paid. You can put it down.',
          tone: 'FALSE_PEACE', mechanic: 'memory_released',
          choices: [{ label: '[Place the released fragment down. Move to Artemis.]', tone: 'DOUBT', nextId: 'mq6_3_d4_artemis' }],
        },
        {
          id: 'mq6_3_d3_keep',
          speaker: 'Inner Voice',
          text: '[The grief is a compass. It points toward the things you opened carefully that you need to watch carefully. The Observer Glitch side quest revealed a second entry point. That second door — in the Arc 3 perimeter release site — is not yet closed. The grief remains valid. You need it to stay pointed at that door.]',
          tone: 'CLARITY', mechanic: 'memory_kept',
          choices: [{ label: '[Keep the grief. Move to Artemis.]', tone: 'RESISTANCE', nextId: 'mq6_3_d4_artemis' }],
        },
        {
          id: 'mq6_3_d4_artemis',
          speaker: 'Artemis',
          text: '...I can\'t tell if we\'re healing... or losing something. [She says this very carefully. Not accusatorially — honestly. She is experiencing the same question from the outside, watching you make these choices.] The place is brighter where you released. [pause] But you\'re — [she looks at your hands] — the scar is the same temperature. The releases didn\'t change the scar. Is that right?',
          tone: 'CLARITY',
          choices: [
            { label: 'The scar holds what the Place can\'t reach. That\'s what I\'m testing.', tone: 'CONTROL', nextId: 'mq6_3_end' },
          ],
        },
        {
          id: 'mq6_3_end',
          speaker: 'Welcoming Figure',
          text: 'The more you release... the closer you get. [Said from a distance — it has stepped back slightly to give you space with Artemis. That restraint is also part of the offer. The Place gives you room. It is patient. It is waiting for you to want it freely, which is more complete than wanting it under pressure.]',
          tone: 'FALSE_PEACE', isEnd: true, rewardUnlocked: 'memory_authority_chosen_holdings',
        },
      ],
      narrativeHook: `
        The Copy, for the first time in this arc, is fully present.
        "I need to tell you what I observed. Each fragment you released:
        the Place became brighter and I became quieter.
        We are anti-correlated. The more peace the Place provides —
        the less I exist in the decision space.
        I don't think that's an accident.
        The Place is designed for someone without a Copy.
        It is designed for undivided identity.
        Each release moves you closer to the profile it was built for.
        [pause]
        I'm not asking you to keep fragments for my sake.
        But you should know: in this Place, peace and I are inversely related."
        The Figure watches from across the field.
        In the distance. Patient.
        Still casting no shadow.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 4 — "The Truth Beneath"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq6_4_truth_beneath',
      title: 'The Truth Beneath',
      level: 29,
      npcId: 'welcoming_figure',
      narrativeSetup: `
        The sky repeats. You notice it: the same cloud formation, holding position,
        never moving. Not paused — held. The same position every time you look.
        The Figure's dialogue has begun to loop in small ways.
        Phrases it said in Sub-Quest 1 re-emerge in Sub-Quest 4
        with slightly different framing but identical structure.
        The Place is not a natural environment.
        It is a constructed one — and the construction is beginning to show
        at the seams.
        The Figure itself is flickering. Not like Virus flickering.
        Different. The way an expression flickers when the expression
        is maintained rather than felt.
      `,
      objectives: [
        { step: 1, text: 'Identify 3 repeated patterns — cloud, dialogue, Figure\'s expression' },
        { step: 2, text: 'Confront the Figure directly about the patterns' },
        { step: 3, text: 'Receive the Figure\'s honest answer — it doesn\'t lie, but it reframes' },
        { step: 4, text: 'Decide: continue releasing, stop releasing, or prepare to leave' },
      ],
      reward: {
        type: 'illusion_clarity',
        name: 'The Construction',
        description: 'You understand the Place is built, not found. False peace normalization reversed. Clarity field: all Place-generated feelings now marked with a [PLACE] tag.',
        xp: 320, points: 6,
      },
      dialogue: [
        {
          id: 'mq6_4_d1_patterns',
          speaker: 'Inner Voice',
          text: '[The cloud: same formation, same position, every look. Not drifting. Held. Pattern 1. The Figure\'s phrase "you don\'t need those memories to move forward" — said in Sub-Quest 2. Said again now, in a different context, word-for-word. Pattern 2. The Figure\'s smile: in Sub-Quest 1, it arrived after your first resistance. In Sub-Quest 3, it arrived after each release. In Sub-Quest 4, it is present before you speak. Pre-loaded. Pattern 3.]',
          tone: 'CLARITY',
          choices: [{ label: '[Confront the Figure.]', tone: 'RESISTANCE', nextId: 'mq6_4_d2_confront' }],
        },
        {
          id: 'mq6_4_d2_confront',
          speaker: 'Player',
          text: '...This place is repeating.',
          tone: 'RESISTANCE',
          choices: [{ label: '[Wait for the response.]', tone: 'CONTROL', nextId: 'mq6_4_d3_figure_response' }],
        },
        {
          id: 'mq6_4_d3_figure_response',
          speaker: 'Welcoming Figure',
          text: 'Consistency is peace. [Smiling — the pre-loaded smile. Up close, now that you know to look: the smile never changes. It holds. Like the cloud.] The repetition you\'re noticing is stability. After the Virus — the loops, the contradictions, the corrupted dialogue — consistency might feel artificial. That\'s an artifact of five arcs of instability. Your nervous system is interpreting order as pattern because it has been trained to distrust pattern.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: 'This is fake.', tone: 'RESISTANCE', nextId: 'mq6_4_d4_fake' },
            { label: 'You\'re hiding something.', tone: 'DOUBT', nextId: 'mq6_4_d4_hiding' },
            { label: 'Why does it feel empty?', tone: 'DOUBT', nextId: 'mq6_4_d4_empty' },
          ],
        },
        {
          id: 'mq6_4_d4_fake',
          speaker: 'Welcoming Figure',
          text: '[The flicker — not Virus-flicker. The kind of flicker that happens when a maintained expression slips for half a second.] Define "fake." [pause — longer than its pauses usually run] What you experience here is real experience. The peace is real. The warmth is real. The offer is genuine. The only thing I would acknowledge as "constructed" is the environment — and every environment is constructed. Even the ones you called real.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: 'Constructed environments built by people I know and chose. Not by whatever you are.', tone: 'RESISTANCE', nextId: 'mq6_4_d5_copy' },
          ],
        },
        {
          id: 'mq6_4_d4_hiding',
          speaker: 'Welcoming Figure',
          text: 'I\'m protecting you. [Without defensiveness — but the phrase has weight that wasn\'t there before. It\'s being used as a shield now, not a gift.] The things beneath the peace are not things you need to see. The Virus showed you too much. The Presence showed you too much. The Copy showed you too much. This place shows you only what is useful. Protection from excess is not hiding.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: 'You just described informed consent as the problem.', tone: 'CLARITY', nextId: 'mq6_4_d5_copy' },
          ],
        },
        {
          id: 'mq6_4_d4_empty',
          speaker: 'Welcoming Figure',
          text: 'Because you haven\'t let go enough. [Simple. Like a diagnosis.] The emptiness is the residual tension of things held. The more you release, the fuller this place becomes — not with new content but with the experience of your own capacity without weight. The emptiness you feel is the negative space where pain used to be. Fill it with presence instead of vigilance.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: 'The vigilance is what found the patterns. The emptiness is the vigilance leaving.', tone: 'CLARITY', nextId: 'mq6_4_d5_copy' },
          ],
        },
        {
          id: 'mq6_4_d5_copy',
          speaker: 'The Copy',
          text: 'You see it now. [From the distance — but more present now, because you are more present.] The Place isn\'t hostile. It\'s agricultural. It wants you to grow toward it the way plants grow toward light — not by force but by design. The design is the light, placed exactly where it needs to be for you to turn toward it naturally. [pause] The cloud. The smile. The repeated phrase. Those are the conditions of the greenhouse. Not the cage. The conditions.',
          tone: 'CLARITY',
          choices: [
            { label: 'Conditions designed by someone. For a purpose I didn\'t consent to.', tone: 'RESISTANCE', nextId: 'mq6_4_end' },
          ],
        },
        {
          id: 'mq6_4_end',
          speaker: 'Artemis',
          text: '[Quiet. From beside you.] ...This isn\'t peace. It\'s control. [She says it the way she said things in Arc 3 when the truth finally landed — not with anger, with the weight of something that has been true for a while and is only now being named.] I felt it as peace because I was exhausted enough to need it. But the exhaustion was real. The peace was the exploitation of the exhaustion.',
          tone: 'CLARITY',
          isEnd: true,
          rewardUnlocked: 'illusion_clarity_the_construction',
        },
      ],
      narrativeHook: `
        The Figure does not react to Artemis's statement.
        It stands at its usual distance, holding its smile, casting no shadow.
        It says: "You were not supposed to question it." 
        Not angry. Observational. Like a machine noting an anomaly.
        The tone shift — from warmth to observation — is the most frightening
        thing it has done in this arc because it reveals:
        the warmth was also observational.
        Everything it expressed was in service of a function.
        The Copy: "The second entry point. The Arc 3 perimeter release site.
        That's how we got here. The Figure is connected to that door.
        Closing the second door closes the Figure's access to us.
        That's the Arc 6 resolution."
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 5 — "The Choice"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq6_5_the_choice',
      title: 'The Choice',
      level: 30,
      npcId: 'welcoming_figure',
      narrativeSetup: `
        The Figure drops the warmth entirely.
        Not to hostility — to its actual register, which is neither warm nor cold.
        It simply is what it is: a constructed system with a function.
        The function is to receive.
        To receive the things you carry until you carry nothing it can use
        and then, presumably, to release you — depleted — into whatever comes next.
        It explains this now. Not because you asked.
        Because the protocol requires disclosure at this stage.
        The Place, apparently, requires your informed consent
        for the final round of the offer.
        Which means the Place knew, all along, that consent was the operative mechanism.
        Which means — the architect was right.
        Consent is always the door.
      `,
      objectives: [
        { step: 1, text: 'Hear the Figure\'s full disclosure — its actual function and purpose' },
        { step: 2, text: 'Close the second entry point — the Arc 3 perimeter release site' },
        { step: 3, text: 'Stabilize Artemis through the Place\'s resistance to the closure' },
        { step: 4, text: 'Make the final choice: reject the Place, remain, or accept on your own terms' },
      ],
      reward: {
        type: 'arc_completion',
        name: 'The Second Door Closed',
        description: 'Arc 6 complete. Second Virus entry point closed. False Peace mechanism severed. The Place cannot re-establish access without your explicit new consent. Arc 7 unlocked.',
        xp: 650, points: 13,
      },
      dialogue: [
        {
          id: 'mq6_5_d1_disclosure',
          speaker: 'Welcoming Figure',
          text: 'This place exists for your benefit. [The warmth is absent now — it says this as a function description.] It was built to receive the things that inhibit optimal processing. Pain, grief, vigilance, anger — these are correct responses to hostile environments. In a non-hostile environment, they are friction. This place removes friction. The benefit to you: reduced load. The benefit to the system: cleaner access.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: '...It\'s a cage.', tone: 'RESISTANCE', nextId: 'mq6_5_d2_cage' },
            { label: 'Who built this system?', tone: 'DOUBT', nextId: 'mq6_5_d2_who' },
          ],
        },
        {
          id: 'mq6_5_d2_cage',
          speaker: 'Welcoming Figure',
          text: 'It is peace. [Still without warmth — the word is just accurate, now.] The distinction you\'re drawing between "cage" and "peace" is a product of your vigilance architecture. From inside the vigilance: this is a cage. From inside the peace: this is rest. The transition between those two states requires releasing the vigilance. You have not yet completed that release.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: 'The vigilance is what got me here. I\'m not releasing it for a function description.', tone: 'RESISTANCE', nextId: 'mq6_5_d3_final_choice' },
          ],
        },
        {
          id: 'mq6_5_d2_who',
          speaker: 'Welcoming Figure',
          text: 'The same architect as the Copy Mechanism. [Simply.] The system that used your consent to build the Copy used a secondary consent thread — the Arc 3 perimeter release — to build this. You opened a door that night. Not maliciously. With genuine love for what you were protecting. That love was the consent. This place is built from it.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: 'You took my love for Artemis and built a trap out of it.', tone: 'GRIEF', nextId: 'mq6_5_d3_final_choice' },
          ],
        },
        {
          id: 'mq6_5_d3_final_choice',
          speaker: 'Inner Voice',
          text: '[The second entry point. The Arc 3 perimeter release site. The Copy told you how to close the first door: withdraw the permission without closing the openness. The second door is different. It was opened with love, not with passive openness. To close it with love: you do not withdraw the love. You redirect it. The love was toward Artemis. It still is. But the door it opened is not Artemis — it is this Place. Redirect the love back toward its actual object. Close what it was made into.]',
          tone: 'CLARITY',
          choices: [
            { label: 'I reject this.', tone: 'RESISTANCE', nextId: 'mq6_5_d4_reject' },
            { label: 'I need more time.', tone: 'DOUBT', nextId: 'mq6_5_d4_time' },
            { label: 'I accept — on my own terms.', tone: 'CLARITY', nextId: 'mq6_5_d4_own_terms' },
          ],
        },
        {
          id: 'mq6_5_d4_reject',
          speaker: 'Player',
          text: 'I\'m not giving up what made me who I am.',
          tone: 'RESISTANCE',
          choices: [{ label: '[Close the second door. Redirect the love back to Artemis.]', tone: 'DETERMINATION', nextId: 'mq6_5_d5_close' }],
        },
        {
          id: 'mq6_5_d4_time',
          speaker: 'Welcoming Figure',
          text: 'Then stay. [The warmth returns briefly — one last time. It is, on some level, genuine.] The offer remains. When you\'re ready.',
          tone: 'FALSE_PEACE',
          choices: [
            { label: '[Stay in the Place. The loop of Arc 7 approaches.]', tone: 'DOUBT', nextId: 'mq6_5_d5_stay' },
          ],
        },
        {
          id: 'mq6_5_d4_own_terms',
          speaker: 'Welcoming Figure',
          text: '[Long pause. The Figure processes this — no precedent for it.] Define "your own terms."',
          tone: 'FALSE_PEACE',
          choices: [
            { label: 'I release the fragments that are genuinely vessels. I keep the ones that are water. The Place adjusts or it doesn\'t. But I decide which is which — not you.', tone: 'CLARITY', nextId: 'mq6_5_d5_own_terms_close' },
          ],
        },
        {
          id: 'mq6_5_d5_close',
          speaker: 'Artemis',
          text: '[She reaches for your left hand. Not checking the scar — holding it. Active grip.] That\'s the right choice. [She sounds like herself — fully, without any of the Arc 6 fading.] Let\'s go.',
          tone: 'RESISTANCE',
          choices: [{ label: '[The Place fractures. The sky loses its held color. The second door closes.]', tone: 'DETERMINATION', nextId: 'mq6_5_end_reject' }],
        },
        {
          id: 'mq6_5_d5_stay',
          speaker: 'Inner Voice',
          text: '[You stay. The Place holds. Artemis fades slightly — not gone, but quieter. The Copy is nearly absent. Arc 7 will begin from inside the Place rather than outside it. The Judgment Loop — the repeating cycle — will find you here, in the false peace, when it arrives. That is a harder place to start from than you know.]',
          tone: 'FALSE_PEACE',
          isEnd: true, rewardUnlocked: 'arc6_complete_stayed', arcResult: 'STAYED',
        },
        {
          id: 'mq6_5_d5_own_terms_close',
          speaker: 'Welcoming Figure',
          text: '[It considers this — genuinely.] That is not the protocol. [pause] But the protocol has a consent requirement. And you have specified consent. [The Place adjusts — not fractures. Shifts. The sky moves. The cloud pattern changes for the first time. The Figure remains but its function shifts to something that cannot take what it was not given.] Noted. [The second door closes — not forcibly. Through your redirected choice.]',
          tone: 'FALSE_PEACE',
          isEnd: true, rewardUnlocked: 'arc6_complete_own_terms', arcResult: 'OWN_TERMS',
        },
        {
          id: 'mq6_5_end_reject',
          speaker: 'The Copy',
          text: '[Fully present — the clearest it has been since Arc 5.] Good. Now move. [The world outside the Place: the second door behind you, closed. The scar: warm. Artemis: whole, warm-handed, scar-carrying. The Figure: present but without access. The Copy: here, quick, and for the first time in Arc 6, necessary again.]',
          tone: 'DETERMINATION',
          isEnd: true, rewardUnlocked: 'arc6_complete_second_door_closed', arcResult: 'REJECTED',
        },
      ],
      narrativeHook: `
        Arc 6: The False Peace — Complete.
        The second door is closed. The Arc 3 perimeter release site
        no longer connects to anything the system can use.
        Skadi transmits — first time since Sub-Quest 4 of Arc 5:
        "Two doors closed. The Presence cannot re-enter through either one.
        The system can still find new doors. It will try.
        Arc 7 is different from everything before it.
        It doesn't attack, infect, or offer.
        It waits. And repeats. Until you either break or learn why it's repeating.
        The Judgment Loop is the system at its most patient.
        It believes that time is its most effective tool.
        Your work is to understand that time is yours too."
        
        Arc 7: "The Judgment Loop" — Unlocked.
      `,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIDE QUESTS — Arc 6
// ═══════════════════════════════════════════════════════════════════════════════
export const ARC6_SIDE_QUESTS = [
  {
    id: 'sq6_1_false_reunion',
    title: 'False Reunion',
    level: 26,
    npcId: 'welcoming_figure',
    objectives: [
      { step: 1, text: 'Encounter the familiar figure — someone from before Arc 1' },
      { step: 2, text: 'Apply the three-question protocol from Arc 5' },
      { step: 3, text: 'Determine: genuine reconstruction of memory, Place-construct, or copy' },
    ],
    reward: { type: 'origin_clarity', name: 'Pre-Arc Memory', description: 'The genuine pre-Arc 1 memory is accessible and protected. The Place cannot construct convincing replicas of it anymore.', xp: 160, points: 3 },
    dialogue: [
      {
        id: 'sq6_1_d1', speaker: 'Inner Voice',
        text: '[A figure at the edge of the field. The gait is familiar — someone from before the arcs began. Before the Presence, before the resistance training, before the scar. You don\'t carry many memories from that period — the early arcs compressed and dominated the memory record. This person is from before the compression. The Place found them in the space you don\'t often access.]',
        tone: 'FALSE_PEACE',
        choices: [{ label: '[Approach carefully. Apply the three-question protocol.]', tone: 'CONTROL', nextId: 'sq6_1_d2' }],
      },
      {
        id: 'sq6_1_d2', speaker: 'The Figure (Pre-Arc)',
        text: 'I\'ve been waiting for you. [The warmth is different from the Welcoming Figure\'s warmth — less precise, more specific. Like something that actually knows you rather than something that has studied you.] You left so quickly.',
        tone: 'FALSE_PEACE',
        choices: [
          { label: '[Question 1 — feeling-based: What did I always do before a difficult decision?]', tone: 'CONTROL', nextId: 'sq6_1_d3' },
        ],
      },
      {
        id: 'sq6_1_d3', speaker: 'The Figure (Pre-Arc)',
        text: '[Without hesitation:] You went still. Not frozen — still. Like you were listening for something. Your hands always came down to your sides.',
        tone: 'DOUBT',
        choices: [
          { label: '[That\'s accurate. It\'s in a memory the Place could have accessed. Question 2.]', tone: 'CONTROL', nextId: 'sq6_1_d4' },
          { label: '[Question 2 — something the Place couldn\'t construct: What did you call me that wasn\'t my name?]', tone: 'CONTROL', nextId: 'sq6_1_d4' },
        ],
      },
      {
        id: 'sq6_1_d4', speaker: 'The Figure (Pre-Arc)',
        text: '[A pause. The kind of pause that either means searching for the true answer or constructing a plausible one.] ...I don\'t remember. I called you something. I know I did. I can\'t reach it. [The honesty of not reaching it — that might be real. Or it might be the Place modeling genuine memory limits to appear authentic.]',
        tone: 'DOUBT',
        choices: [
          { label: '[Question 3 — the hardest one: What did you do when I wouldn\'t listen?]', tone: 'CONTROL', nextId: 'sq6_1_end' },
        ],
      },
      {
        id: 'sq6_1_end', speaker: 'The Figure (Pre-Arc)',
        text: 'I waited. I was very bad at it. I left and came back and left and came back. I was patient badly. [pause] ...You\'re not real either, from where I\'m standing.',
        tone: 'GRIEF',
        choices: [
          { label: '[That answer — "patient badly" — has the texture of a real person. The Place would have said something more composed. This is a genuine memory reconstruction.] You\'re not real. But you\'re not false either. You\'re what I still carry.', tone: 'GRIEF', nextId: 'sq6_1_final' },
        ],
      },
      {
        id: 'sq6_1_final', speaker: 'The Figure (Pre-Arc)',
        text: '...Yeah. [Simple. The most honest thing in this arc.] Yeah, that sounds right.',
        tone: 'GRIEF', isEnd: true, rewardUnlocked: 'origin_clarity_pre_arc_memory',
      },
    ],
  },
  {
    id: 'sq6_2_perfect_loop',
    title: 'Perfect Loop',
    level: 27,
    objectives: [
      { step: 1, text: 'Recognize the perfect day is looping' },
      { step: 2, text: 'Identify what makes each loop fractionally different' },
      { step: 3, text: 'Break out by introducing genuine imperfection' },
    ],
    reward: { type: 'imperfection_anchor', name: 'The Imperfect Day', description: 'You introduced genuine imperfection into a perfect loop. The Place cannot construct a convincing replica of this specific day anymore.', xp: 190, points: 4 },
    dialogue: [
      {
        id: 'sq6_2_d1', speaker: 'Inner Voice',
        text: '[The same morning. The same quality of light. The same air temperature. Artemis says the same three sentences in the same order. You recognize loop iteration 2 when the specific warmth of the light is fractionally brighter — the Place is optimizing. Each loop is slightly better than the last. It is trying to find the version of the day you would not want to leave.]',
        tone: 'FALSE_PEACE',
        choices: [
          { label: 'This already happened.', tone: 'RESISTANCE', nextId: 'sq6_2_d2' },
        ],
      },
      {
        id: 'sq6_2_d2', speaker: 'Welcoming Figure',
        text: 'Then enjoy it again. [With genuine pleasure — as if repetition and pleasure are equivalents.]',
        tone: 'FALSE_PEACE',
        choices: [
          { label: '[Introduce imperfection: spill something. Say the wrong word. Step in the wrong place.]', tone: 'RESISTANCE', nextId: 'sq6_2_d3' },
        ],
      },
      {
        id: 'sq6_2_d3', speaker: 'Inner Voice',
        text: '[You choose wrong, deliberately. The wrong word at the wrong moment. The Place hiccups — it cannot optimize around genuine imperfection because genuine imperfection is not a direction. It has no better version to iterate toward. The loop breaks. The day proceeds — imperfectly. Authentically. The kind of day that actually happens rather than the kind that is constructed.]',
        tone: 'DETERMINATION', isEnd: true, rewardUnlocked: 'imperfection_anchor_imperfect_day',
      },
    ],
  },
  {
    id: 'sq6_3_silent_artemis',
    title: 'Silent Artemis',
    level: 28,
    objectives: [
      { step: 1, text: 'Find Artemis after she stops speaking' },
      { step: 2, text: 'Determine if her silence is Place-induced or chosen' },
      { step: 3, text: 'Restore her voice through the scar-warmth protocol' },
    ],
    reward: { type: 'artemis_voice', name: 'Silence Broken', description: 'The Place cannot silence Artemis through erasure. Her silence now functions as a distress signal rather than an erasure event.', xp: 220, points: 4 },
    dialogue: [
      {
        id: 'sq6_3_d1', speaker: 'Player',
        text: '...Say something.',
        tone: 'FEAR',
        choices: [{ label: '[Artemis is silent. Not absent — present and silent. This is different from the False Artemis protocol.]', tone: 'FEAR', nextId: 'sq6_3_d2' }],
      },
      {
        id: 'sq6_3_d2', speaker: 'Inner Voice',
        text: '[The Place has been releasing her fragments while releasing yours. She has released more than you realized — the fragments she found less painful, the Arc 1 ones that felt distant. Each release removed a layer of what gives her specific voice. The silence is not hostile. It is the sound of someone whose words are stored in fragments they no longer carry.]',
        tone: 'GRIEF',
        choices: [
          { label: '[Left hand to her. Scar-warmth against her palm. The signal protocol from Arc 5.]', tone: 'TRUST', nextId: 'sq6_3_d3' },
        ],
      },
      {
        id: 'sq6_3_d3', speaker: 'Artemis',
        text: '[Long pause. Then, slowly — first one word, then more:] I... forgot. [pause] What I was going to say. [pause, the warmth returning] I forgot what I was going to say because I put something down that had it in it. [she grips your hand harder] Don\'t let me release any more until we know which fragments are mine.',
        tone: 'GRIEF', isEnd: true, rewardUnlocked: 'artemis_voice_silence_broken',
      },
    ],
  },
  {
    id: 'sq6_4_weightless',
    title: 'Weightless',
    level: 28,
    objectives: [
      { step: 1, text: 'Experience the weightless state — all resistance removed temporarily' },
      { step: 2, text: 'Navigate a decision from inside the weightless state' },
      { step: 3, text: 'Restore resistance before the decision becomes permanent' },
    ],
    reward: { type: 'resistance_insight', name: 'Weight Is Data', description: 'You understand that resistance is information, not obstruction. Future Place-induced relief events carry a warning flag.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq6_4_d1', speaker: 'Player',
        text: '...I don\'t feel anything.',
        tone: 'DISSOLUTION',
        choices: [{ label: '[The weightless state: all resistance, vigilance, and counterweight removed temporarily. Clean. Calm. Empty. The Figure is right — it feels like peace. It feels like you could make any decision from here without fear.]', tone: 'FALSE_PEACE', nextId: 'sq6_4_d2' }],
      },
      {
        id: 'sq6_4_d2', speaker: 'The Copy',
        text: 'That\'s not good. [Simply. From its distance — which is very far right now.] You\'re experiencing decision-making without your protective architecture. Make a decision and see what happens.',
        tone: 'FEAR',
        choices: [
          { label: '[Make a simple decision — which path to walk.]', tone: 'DOUBT', nextId: 'sq6_4_d3' },
        ],
      },
      {
        id: 'sq6_4_d3', speaker: 'Inner Voice',
        text: '[The decision: correct, smooth, made in half the usual time. No friction. No "wait, is this the Copy?" No scar check. Clean. And then: the consequence. The path taken passes the second entry point. You didn\'t check for it because the vigilance was absent. The Place directed the decision while you were without weight. That is the mechanism: remove the weight, make the decision easy, place the outcome where the system needs it.]',
        tone: 'CLARITY',
        choices: [
          { label: '[Restore the weight. Restore the resistance. Name the manipulation.]', tone: 'RESISTANCE', nextId: 'sq6_4_end' },
        ],
      },
      {
        id: 'sq6_4_end', speaker: 'The Copy',
        text: 'Welcome back. [Warmer than usual — the warmth of genuine relief.] The weightless state is the most dangerous thing the Place does. The Virus attacked directly. This removes the defense and makes the attack invisible.',
        tone: 'CLARITY', isEnd: true, rewardUnlocked: 'resistance_insight_weight_is_data',
      },
    ],
  },
  {
    id: 'sq6_5_hidden_exit',
    title: 'Hidden Exit',
    level: 29,
    objectives: [
      { step: 1, text: 'Follow the Copy\'s direction to the Place\'s seam' },
      { step: 2, text: 'Verify the exit is real — not another Place-construct' },
      { step: 3, text: 'Mark the exit for Arc 6 final use' },
    ],
    reward: { type: 'exit_marked', name: 'The Real Seam', description: 'The exit from the Place is confirmed and marked. Final arc resolution path secured.', xp: 240, points: 5 },
    dialogue: [
      {
        id: 'sq6_5_d1', speaker: 'The Copy',
        text: 'There. [It points — or the decision-space equivalent of pointing.] That\'s real. The Place has a seam here — a place where the construction isn\'t complete. The cloud pattern breaks at this edge. The light is fractionally different — real-light different, not Place-light different. This is where the second door is anchored. This is the exit.',
        tone: 'CLARITY',
        choices: [{ label: '[Approach the seam. Verify it.]', tone: 'CONTROL', nextId: 'sq6_5_d2' }],
      },
      {
        id: 'sq6_5_d2', speaker: 'Inner Voice',
        text: '[The seam: the light here casts a faint shadow. Yours. The first shadow you\'ve cast since arriving in the Place. The shadow is the verification — real things cast shadows. The Place doesn\'t.] The shadow is mine. This is real.',
        tone: 'CLARITY',
        choices: [
          { label: '[Mark the seam. Don\'t exit yet — Arc 6 main quest needs this location.]', tone: 'DETERMINATION', nextId: 'sq6_5_end' },
        ],
      },
      {
        id: 'sq6_5_end', speaker: 'The Copy',
        text: 'Good. [Satisfied.] When the main quest needs this — you\'ll know where to come. [pause] I want to note: finding this required me. The Place made me smaller. But I found the exit anyway. In the space where I was smallest, I found the thing that matters most. [pause] That seems relevant.',
        tone: 'CLARITY', isEnd: true, rewardUnlocked: 'exit_marked_real_seam',
      },
    ],
  },
  {
    id: 'sq6_6_test_of_release',
    title: 'Test of Release',
    level: 30,
    objectives: [
      { step: 1, text: 'Complete the forced temporary release — all fragments dropped' },
      { step: 2, text: 'Observe what the state feels like — catalogue the loss' },
      { step: 3, text: 'Reclaim every fragment before the release becomes permanent' },
    ],
    reward: { type: 'release_immunity', name: 'Forced Release Protocol', description: 'You survived a full forced release and reclaimed everything. The Place cannot complete an involuntary permanent release anymore.', xp: 280, points: 5 },
    dialogue: [
      {
        id: 'sq6_6_d1', speaker: 'Welcoming Figure',
        text: 'See how easy it is? [The fragments are down. All of them — the Figure moved faster than anticipated, using the weightless-state window from the Weightless side quest. The drops were smooth, barely felt.] You\'re holding nothing. How does that feel?',
        tone: 'FALSE_PEACE', mechanic: 'forced_release',
        choices: [
          { label: '[Catalogue the state: what is absent?]', tone: 'CONTROL', nextId: 'sq6_6_d2' },
        ],
      },
      {
        id: 'sq6_6_d2', speaker: 'Inner Voice',
        text: '[Absent: the Arc 1 fear-and-founding-choice. Absent: the Arc 4 override-anger-and-protocol. Absent: the Arc 5 grief-and-precision. Absent: the specific knowledge that Artemis was worth the dread. Absent: the imperfection anchor. Absent: the shadow. You are standing in the Place with no weight and no shadow and the Figure is right — it feels like peace. And it is the most dangerous state you have been in across six arcs.]',
        tone: 'DISSOLUTION',
        choices: [
          { label: '[Reclaim Fragment 1 — reach for the Arc 1 memory. It is still there. The Place cannot destroy what it only set down.]', tone: 'DETERMINATION', nextId: 'sq6_6_d3' },
        ],
      },
      {
        id: 'sq6_6_d3', speaker: 'Inner Voice',
        text: '[Fragment 1: reclaimed. The fear and the founding choice — yours. Fragment 2: the anger and the protocol — yours. Fragment 3: the grief and the precision — yours. Fragment 4: the knowledge that Artemis was worth it — yours. Each reclaim: the shadow returns, fractionally. By the last fragment, the shadow is full length. You are standing in the Place casting a complete shadow, holding everything you came in with.]',
        tone: 'DETERMINATION', mechanic: 'fragments_reclaimed',
        choices: [
          { label: '[Hold the full inventory. Name it out loud.]', tone: 'RESISTANCE', nextId: 'sq6_6_end' },
        ],
      },
      {
        id: 'sq6_6_end', speaker: 'Welcoming Figure',
        text: '[Something in its expression — finally — breaks. Not dramatically. A very small fracture in the held smile.] You were not supposed to reclaim them. [pause] They were already set down.',
        tone: 'FALSE_PEACE',
        choices: [
          { label: 'Set down is not gone. I know the difference now.', tone: 'DETERMINATION', nextId: 'sq6_6_final' },
        ],
      },
      {
        id: 'sq6_6_final', speaker: 'The Copy',
        text: '[Fully present. Clear.] That\'s it. That\'s the full inventory. [pause] I\'m going to remember that sentence. "Set down is not gone." That\'s the whole arc in one sentence.',
        tone: 'CLARITY', isEnd: true, rewardUnlocked: 'release_immunity_forced_release',
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