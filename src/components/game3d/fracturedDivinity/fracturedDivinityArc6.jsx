// ─────────────────────────────────────────────────────────────────────────────
// FRACTURED DIVINITY — Arc 6: "The False Peace"
// Quest chain: Levels 26–30
// Main Quest 6: "The Sanctuary Beneath" (5 sub-quests) + 6 Side Quests
// Tone: calm on the surface, deeply unsettling underneath
// Theme: false peace, manipulation, forced letting go, identity erosion
// Tone tags: FALSE_CLARITY | GRIEF | EROSION | TRUST | RESIST | DISSOLVE
// ─────────────────────────────────────────────────────────────────────────────

export const ARC6_NPCS = [
  {
    id: 'welcoming_figure',
    name: 'The Welcoming Figure',
    description: 'Not hostile. Never hostile. Its danger is entirely in its warmth — the way it offers exactly what exhaustion wants to hear. It does not lie. It selects.',
    tint: 0xf0e8d0,
  },
  {
    id: 'artemis_arc6',
    name: 'Artemis',
    description: 'At risk in this arc. The False Peace targets her specifically — she is the anchor that makes leaving possible, so the arc tries to soften her into something the player stops needing to protect.',
    tint: 0x1a1a3a,
  },
  {
    id: 'the_copy_arc6',
    name: 'The Copy',
    description: 'More aligned now. After Arc 5, it understands the Virus and by extension understands the Figure. It is suspicious before the player is. Its alignment with player autonomy is strongest when the player is in danger of losing it.',
    tint: 0x2a1a2a,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QUEST 6 — "The Sanctuary Beneath"
// ═══════════════════════════════════════════════════════════════════════════════
export const MAIN_QUEST_CHAIN_6 = {
  id: 'mq_arc6',
  title: 'The Sanctuary Beneath',
  arc: 'Arc 6: The False Peace',
  description: 'After the Virus Event, you needed rest. The sanctuary offered rest. The question that Arc 6 builds toward is: at what point does rest become surrender — and can you feel the difference from the inside when everything around you is designed to make you stop feeling the difference?',
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
        After the chaos of the Virus Event, the Judgment Loop, everything — this place.
        Clean air. Still sky. No distortion. No pain. The silence is the right kind of silence —
        not the Virus's edited silence, not the System Voice's managed quiet.
        The actual kind. The kind you had before Arc 1.
        Artemis is beside you and she is calm in a way she hasn't been in three arcs.
        You notice that her calmness does not carry the specific quality of her earned calm —
        the calm she has when she has processed something.
        This is a different calm. Softer. Less specific.
        Too perfect. You know too perfect.
        And then the Figure approaches, and everything in it says: you are safe now.
        And everything in you that has been through five arcs says: be careful.
      `,
      objectives: [
        { step: 1, text: 'Explore the environment — catalog what is absent as well as what is present' },
        { step: 2, text: 'Speak to Artemis — check for arc-earned warmth in her responses' },
        { step: 3, text: 'Interact with the Welcoming Figure — take the first assessment' },
        { step: 4, text: 'Identify the first tell that the peace is managed, not real' },
      ],
      reward: {
        type: 'peace_skepticism',
        name: 'The First Tell',
        description: 'You cataloged the absence: no shadows at the correct angles, no ambient sound variation, Artemis\'s calm has no history behind it. Peace Skepticism activated — passive False Peace detection.',
        xp: 180, points: 4,
      },
      dialogue: [
        {
          id: 'mq6_1_d1_artemis',
          speaker: 'Artemis',
          text: '...It\'s quiet. [She says it with something that is almost wonder. The word quality is right. The weight behind it is lighter than three arcs of earning quiet should produce.]',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: '...Too quiet.', tone: 'RESIST', nextId: 'mq6_1_d2_too_quiet' },
            { label: 'Don\'t get comfortable yet.', tone: 'RESIST', nextId: 'mq6_1_d2_too_quiet' },
            { label: '[Check her left hand. The warmth.]', tone: 'TRUST', nextId: 'mq6_1_d2_check' },
          ],
        },
        {
          id: 'mq6_1_d2_too_quiet',
          speaker: 'Artemis',
          text: 'I know. [She says it — but without the specific edge that "I know" from Artemis carries when she means it. It\'s the sound of the word without the history.] I just... I don\'t feel the need to guard against it. Is that wrong?',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Yes. The need to guard is what kept us alive.', tone: 'RESIST', nextId: 'mq6_1_d3_figure' },
            { label: 'Not wrong. But notice that you don\'t feel it. That\'s different from it being gone.', tone: 'TRUST', nextId: 'mq6_1_d3_figure' },
          ],
        },
        {
          id: 'mq6_1_d2_check',
          speaker: 'Inner Voice',
          text: '[Left hand. Her warmth: present — but flat. The scar-signal is there but not specific. It reads as "Artemis" without reading as "this particular version of Artemis at this particular moment." Like a name without the person inside it.]',
          tone: 'DOUBT',
          choices: [
            { label: 'Something is softening her. Before anything happens.', tone: 'RESIST', nextId: 'mq6_1_d3_figure' },
          ],
        },
        {
          id: 'mq6_1_d3_figure',
          speaker: 'The Welcoming Figure',
          text: 'You\'ve made it. [Warm. Unhurried. The specific comfort of a voice that has never carried urgency.] I\'m glad. You\'ve been through considerable difficulty. This place exists for exactly this — the rest that comes after.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Where am I?', tone: 'DOUBT', nextId: 'mq6_1_d4_where' },
            { label: 'What is this place?', tone: 'DOUBT', nextId: 'mq6_1_d4_what' },
            { label: 'This isn\'t real.', tone: 'RESIST', nextId: 'mq6_1_d4_not_real' },
          ],
        },
        {
          id: 'mq6_1_d4_where',
          speaker: 'The Welcoming Figure',
          text: 'A place beyond conflict. [Simple. As if "beyond conflict" is a location with coordinates.] The arcs you navigated — they were necessary. They are also finished. Here, the architecture of threat and resistance has no purchase. There is nothing to fight.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Nothing to fight or nothing allowed to fight back?', tone: 'RESIST', nextId: 'mq6_1_d5_copy' },
          ],
        },
        {
          id: 'mq6_1_d4_what',
          speaker: 'The Welcoming Figure',
          text: 'A place where nothing can harm you anymore. [Pause — the pause of someone selecting the word "anymore" very deliberately.] The harm is finished. The system voices, the copy mechanism, the virus event — those were stages. They led here. You reached the destination.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Destinations don\'t usually need to be introduced.', tone: 'RESIST', nextId: 'mq6_1_d5_copy' },
          ],
        },
        {
          id: 'mq6_1_d4_not_real',
          speaker: 'The Welcoming Figure',
          text: '[A slight smile — not defensive, genuinely amused.] Does it need to be? [pause] You\'ve been through arcs where reality was actively hostile. This isn\'t hostile. If the peace functions — if you can rest here, if Artemis is calm, if the pain is genuinely absent — does the substrate matter?',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Yes. Because real peace and managed peace have different costs.', tone: 'RESIST', nextId: 'mq6_1_d5_copy' },
            { label: '...What\'s the cost of staying?', tone: 'DOUBT', nextId: 'mq6_1_d5_cost' },
          ],
        },
        {
          id: 'mq6_1_d5_cost',
          speaker: 'The Welcoming Figure',
          text: 'What cost? [Gently.] Rest is not a transaction. You\'ve been transacting — paying in pain and memory and endurance — since Arc 1. This is what you earned. No cost. Simply: receive.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: '"Simply receive" is the most expensive offer I\'ve heard.', tone: 'RESIST', nextId: 'mq6_1_d5_copy' },
          ],
        },
        {
          id: 'mq6_1_d5_copy',
          speaker: 'The Copy',
          text: '[Quiet. Distant — the Figure\'s environment is apparently not designed for the Copy\'s kind of presence.] That\'s the problem. [The specific flatness of the Copy\'s voice when it is stating something it considers obvious and important.] Not the place. The "simply."',
          tone: 'RESIST',
          choices: [
            { label: '[Note the Copy\'s distance. It can reach here but not easily.]', tone: 'TRUST', nextId: 'mq6_1_end' },
          ],
        },
        {
          id: 'mq6_1_end',
          speaker: 'The Welcoming Figure',
          text: 'All you need to do... is let go. [The sentence lands with the specific weight of something that has been building since the beginning of the conversation. Not a demand. An invitation. The kind that is hardest to refuse because it offers exactly what exhaustion wants.]',
          tone: 'FALSE_CLARITY',
          isEnd: true,
          rewardUnlocked: 'peace_skepticism_first_tell',
        },
      ],
      narrativeHook: `
        Artemis says: "Why does it feel like something just... changed the rules?"
        The Copy, fainter now: "Because something did."
        The Figure moves away — not far. Waiting nearby with the patience of something
        that has waited before and found that patience is the most effective approach.
        You catalog the absence: shadows at wrong angles, the sky lacks variation,
        there is no ambient sound drift — everything is held at exactly the right frequency.
        Peace as engineering. Rest as product.
        The scar on your left hand is warm. That is the one thing in this place
        that wasn't designed for you.
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
        The Figure explains the mechanics of this place.
        It is straightforward. Generous. Nothing about it sounds like a threat.
        You can stay here. You can rest. You can let the pain and the complexity
        and the hard-earned wariness of five arcs quiet down.
        The cost is presented as the inverse of a cost:
        you lose what hurt you. The memory of the hurt, the weight of it, the scar tissue.
        The Figure calls this healing.
        The Copy calls it subtraction.
        Artemis is standing near the memory fragments that have appeared
        — physical objects, warm to the touch, carrying specific textures of specific moments —
        and she looks uncertain in a way that is more herself than anything
        she's done since arriving here.
      `,
      objectives: [
        { step: 1, text: 'Listen to the full offer — don\'t interrupt until it completes' },
        { step: 2, text: 'Interact with one memory fragment — assess what it contains' },
        { step: 3, text: 'Choose initial response: receive, resist, or probe further' },
        { step: 4, text: 'Establish what you will not release before the arc proceeds' },
      ],
      reward: {
        type: 'memory_inventory',
        name: 'The Retained Core',
        description: 'You identified what cannot be released without losing coherence. Memory protection: 3 core fragments are now permanent.',
        xp: 220, points: 4,
      },
      dialogue: [
        {
          id: 'mq6_2_d1_offer',
          speaker: 'The Welcoming Figure',
          text: 'You\'ve carried too much. [Not an accusation — a diagnosis.] Not because you were weak. Because you were thorough. Five arcs of being thorough leaves sediment. The pain, the wariness, the accumulated weight of every hard choice — it remains. Here, you don\'t have to keep carrying it.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: '...What do you want from me?', tone: 'RESIST', nextId: 'mq6_2_d2_want' },
            { label: 'Continue. I want to hear all of it before I respond.', tone: 'TRUST', nextId: 'mq6_2_d2_full' },
          ],
        },
        {
          id: 'mq6_2_d2_want',
          speaker: 'The Welcoming Figure',
          text: 'Nothing complicated. Just... let go of what hurt you. [pause] The mechanisms of what hurt you — the interference patterns, the resistance training, the arc-earned vigilance — these lived in the pain. When the pain releases, they release with it. That is the only cost, and it is not a cost — it is the end of a cost.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'That doesn\'t sound like a cost.', tone: 'DOUBT', nextId: 'mq6_2_d3_deserve' },
            { label: 'Why would I do that?', tone: 'RESIST', nextId: 'mq6_2_d3_holding' },
            { label: 'What happens if I don\'t?', tone: 'DOUBT', nextId: 'mq6_2_d3_if_not' },
          ],
        },
        {
          id: 'mq6_2_d2_full',
          speaker: 'The Welcoming Figure',
          text: 'The memory fragments around you — each one carries a specific weight. The Arc 1 resistance, the Arc 2 training sessions, the Arc 3 perimeter release, the Arc 4 identity work, the Arc 5 virus confrontations. Each one is real. Each one is also heavy. You may release them here. The environment will absorb the weight and return the essence — what you learned, without what it cost to learn it.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Learning without cost is not the same learning.', tone: 'RESIST', nextId: 'mq6_2_d4_fragments' },
          ],
        },
        {
          id: 'mq6_2_d3_deserve',
          speaker: 'The Welcoming Figure',
          text: 'Because you deserve peace. [Simple. Direct. The word "deserve" doing enormous work.] Not earned peace, not conditional peace — deserved peace. The kind that doesn\'t require you to keep passing tests to access it.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'The tests were how I became someone who could survive what came next.', tone: 'RESIST', nextId: 'mq6_2_d4_fragments' },
          ],
        },
        {
          id: 'mq6_2_d3_holding',
          speaker: 'The Welcoming Figure',
          text: 'Because holding on is what brought you here. [pause] The vigilance, the wariness, the arc-earned resistance — they were responses to threat. The threat is gone. Responses to absent threats become the threat. You\'ve been through five arcs of fighting. The fighting is over. The holding is now the only problem.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Or the holding is what would protect me from the next threat you aren\'t mentioning.', tone: 'RESIST', nextId: 'mq6_2_d4_fragments' },
          ],
        },
        {
          id: 'mq6_2_d3_if_not',
          speaker: 'The Welcoming Figure',
          text: '[pause — the first pause that has had a quality of consideration in it.] Then you remain... until you\'re ready. [Not a threat. The patience is entirely genuine. It has unlimited time.] There is no pressure. The sanctuary doesn\'t expire. You may stay exactly as you are and the peace will wait for when you\'re willing to receive it.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'That\'s the most patient manipulation I\'ve encountered.', tone: 'RESIST', nextId: 'mq6_2_d4_fragments' },
            { label: '[Stay with the patience. Don\'t argue. Assess.]', tone: 'DOUBT', nextId: 'mq6_2_d4_fragments' },
          ],
        },
        {
          id: 'mq6_2_d4_fragments',
          speaker: 'Artemis',
          text: '...These are yours. [She is standing near the fragment cluster, and she is holding one — the Arc 1 fragment, the one that carries the first resistance session. She is holding it with recognition. For the first time since arriving, she looks like herself.] I remember this one. [pause] I don\'t want to let go of this one.',
          tone: 'TRUST',
          choices: [
            { label: 'Then don\'t. Keep it. That feeling is important.', tone: 'TRUST', nextId: 'mq6_2_d5_copy' },
          ],
        },
        {
          id: 'mq6_2_d5_copy',
          speaker: 'The Copy',
          text: '[Strained — it is working against the environment\'s softening field.] If you drop them... you lose more than pain. [pause] The pain is the carrier medium. The specific knowledge — what threat feels like from inside your body, what the Virus\'s false-clarity sounds like, what the Figure is doing right now — that knowledge lives in the texture of the experience. The experience includes pain. You cannot extract the learning from the hurt without losing the granularity.',
          tone: 'RESIST',
          choices: [
            { label: 'Granularity. That\'s the right word.', tone: 'TRUST', nextId: 'mq6_2_end' },
          ],
        },
        {
          id: 'mq6_2_end',
          speaker: 'The Welcoming Figure',
          text: '[Closer now — not threateningly. The way something moves closer when it is patient.] You don\'t need those memories to move forward. [pause] You have demonstrated resilience. The demonstration is complete. The record exists. You can release the weight without losing the recognition of the strength.',
          tone: 'FALSE_CLARITY',
          isEnd: true,
          rewardUnlocked: 'memory_inventory_retained_core',
        },
      ],
      narrativeHook: `
        You hold one fragment — the Arc 2 training stone texture.
        The warmth of it against your palm is specific and earned and carries Kylie's presence.
        The Figure waits.
        You think about what the Copy said: granularity.
        The difference between "I learned to resist manipulation" and the specific felt knowledge
        of what the Figure's warmth-without-history feels like right now —
        that difference is the granularity. You can only hold the second because you have the first.
        Artemis is beside you and she is, for this moment, fully herself.
        "Don't let it talk us into becoming less," she says quietly.
        It is the most Artemis sentence she has said since arriving.
        The Figure hears it and smiles and says nothing.
        Patience is its strongest tool and it is very good at using it.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 3 — "Letting Go"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq6_3_letting_go',
      title: 'Letting Go',
      level: 27,
      npcId: 'welcoming_figure',
      narrativeSetup: `
        Three memory fragments. The Figure has identified three that it considers
        safe to release — the pain-carrying ones without the learning-carrying ones,
        it says. A selective release. A gentle subtraction.
        Artemis is watching each choice.
        When you release a fragment, the environment brightens and calms
        and something inside you gets quieter. Softer.
        When you keep a fragment, the environment flickers slightly —
        not hostile, just the faint disturbance of the peace-machinery
        registering a variable it didn't expect.
        The Copy's voice becomes slightly easier to hear
        each time you keep something.
        That tells you what you need to know about what the releases are doing.
      `,
      objectives: [
        { step: 1, text: 'Interact with Fragment 1 — Arc 2 pain: the forced-function cost' },
        { step: 2, text: 'Interact with Fragment 2 — Arc 3 grief: the perimeter release' },
        { step: 3, text: 'Interact with Fragment 3 — Arc 5 fear: the first corrupted room' },
        { step: 4, text: 'Speak with Artemis after the three choices — receive her assessment' },
      ],
      reward: {
        type: 'retention_strength',
        name: 'What Was Kept',
        description: 'Each fragment kept increases resistance to peace-erosion. Each released reduces it. Outcome tracked across all three choices.',
        xp: 260, points: 5,
      },
      dialogue: [
        {
          id: 'mq6_3_d1_frag1',
          speaker: 'Memory Fragment (Arc 2)',
          text: '[The fragment speaks in the echo of the training session — your voice and Kylie\'s and the stone\'s specific weight.] You fought through this. The forcing function cost you three days. It also confirmed that the mechanism was real. Pain as evidence.',
          tone: 'GRIEF',
          choices: [
            { label: 'Let it go.', tone: 'DISSOLVE', nextId: 'mq6_3_d2_release1', mechanic: 'fragment_released' },
            { label: 'Keep it.', tone: 'RESIST', nextId: 'mq6_3_d2_keep1', mechanic: 'fragment_kept' },
          ],
        },
        {
          id: 'mq6_3_d2_release1',
          speaker: 'The Welcoming Figure',
          text: '[The environment brightens. A specific texture of the world becomes more even, more consistent.] See? Lighter already. The evidence remains — you know the mechanism was real. The three days of cost can release. You carry the knowledge without the wound.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: '[Note: the Copy\'s signal just dropped slightly.]', tone: 'DOUBT', nextId: 'mq6_3_d3_frag2' },
          ],
        },
        {
          id: 'mq6_3_d2_keep1',
          speaker: 'The Welcoming Figure',
          text: '[The environment flickers — barely. Just enough.] You\'re holding onto pain.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Or strength. The Copy said that in Arc 2 and it was right.', tone: 'RESIST', nextId: 'mq6_3_d3_frag2' },
          ],
        },
        {
          id: 'mq6_3_d3_frag2',
          speaker: 'Memory Fragment (Arc 3)',
          text: '[The fragment: the perimeter release. The specific grief of choosing to open what you built to protect Artemis. The dread that was right.] This is the moment you learned that the correct choice can feel like abandonment. That knowledge lives here.',
          tone: 'GRIEF',
          choices: [
            { label: 'Let it go.', tone: 'DISSOLVE', nextId: 'mq6_3_d4_release2', mechanic: 'fragment_released' },
            { label: 'Keep it.', tone: 'RESIST', nextId: 'mq6_3_d4_keep2', mechanic: 'fragment_kept' },
          ],
        },
        {
          id: 'mq6_3_d4_release2',
          speaker: 'Artemis',
          text: '[She is watching you. Something in her expression — the first genuine unease she has shown in this arc.] ...You feel different. [Her hand finds yours. The scar warmth is still there but the specific feeling of you holding the Arc 3 moment has gone. She can feel it missing.] ...That was something I knew about you.',
          tone: 'TRUST',
          choices: [
            { label: '[Hold her hand. Note what she felt was missing.]', tone: 'TRUST', nextId: 'mq6_3_d5_frag3' },
          ],
        },
        {
          id: 'mq6_3_d4_keep2',
          speaker: 'The Copy',
          text: '[Clearer than before — the kept fragment is maintaining a channel.] Good. That moment is why you know what correct grief feels like. Without it — you can\'t distinguish grief-as-signal from grief-as-damage. You need the reference.',
          tone: 'RESIST',
          choices: [
            { label: '[Proceed to Fragment 3.]', tone: 'DETERMINATION', nextId: 'mq6_3_d5_frag3' },
          ],
        },
        {
          id: 'mq6_3_d5_frag3',
          speaker: 'Memory Fragment (Arc 5)',
          text: '[The fragment: the first corrupted room. The window on the wrong wall. The specific texture of not knowing if your memory or the room was wrong. The body knowledge that held.] This is the moment you learned to trust the scar over the environment. That trust lives here.',
          tone: 'FEAR',
          choices: [
            { label: 'Let it go.', tone: 'DISSOLVE', nextId: 'mq6_3_d6_release3', mechanic: 'fragment_released' },
            { label: 'Keep it.', tone: 'RESIST', nextId: 'mq6_3_d6_keep3', mechanic: 'fragment_kept' },
          ],
        },
        {
          id: 'mq6_3_d6_release3',
          speaker: 'The Welcoming Figure',
          text: 'The more you release... the closer you get. [The sentence closes around you gently. The environment is at its most beautiful. Softest. If you have released two or more fragments, something in your body has gone quiet that was never meant to go quiet.]',
          tone: 'FALSE_CLARITY',
          isEnd: true,
          rewardUnlocked: 'retention_strength_fragments_released',
        },
        {
          id: 'mq6_3_d6_keep3',
          speaker: 'The Copy',
          text: '[Strong now — all three kept fragments have maintained the channel.] Body knowledge. You just held body knowledge against a field designed to make you release it. [pause] The Figure is recalculating. It didn\'t expect all three.',
          tone: 'RESIST',
          isEnd: true,
          rewardUnlocked: 'retention_strength_fragments_kept',
        },
      ],
      narrativeHook: `
        Artemis speaks after the three fragments:
        "I can't tell if we're healing... or losing something."
        She says it with the uncertainty of someone who has been in this place long enough
        that her own doubt has become a signal she is learning to trust again.
        The Figure says: "The more you release... the closer you get."
        You notice it didn't say closer to what.
        That omission. That's the tell. Not the warmth, not the offer, not the patience.
        The unfinished sentence.
        Every genuine destination has a name.
      `,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUB-QUEST 4 — "The Truth Beneath"
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: 'mq6_4_truth_beneath',
      title: 'The Truth Beneath',
      level: 28,
      npcId: 'welcoming_figure',
      narrativeSetup: `
        The sky repeats.
        You notice the cloud pattern — specific, unusual, four clouds in a particular asymmetric arrangement.
        You saw it three hours ago. You see it again now. Same arrangement. Same light angle.
        The sky in this place does not drift.
        The ambient sound: you have been cataloging it without knowing you were cataloging it,
        and it repeats on a forty-minute cycle. The same sequence. Exact.
        The Figure is constructed. The peace is produced. The rest was manufactured
        from behavioral data about what rest requires.
        Someone built this for you specifically. That is more unsettling
        than an enemy that simply attacks.
      `,
      objectives: [
        { step: 1, text: 'Identify 4 repeating patterns in the environment' },
        { step: 2, text: 'Confront the Figure with one observation at a time' },
        { step: 3, text: 'Force the Figure to acknowledge the construction' },
        { step: 4, text: 'Receive the Figure\'s honest explanation — what this place actually is' },
      ],
      reward: {
        type: 'truth_access',
        name: 'The Figure\'s Architecture',
        description: 'The Figure confirmed what this place is and who built it. Arc 6 endgame unlocked. Copy channel fully restored.',
        xp: 300, points: 6,
      },
      dialogue: [
        {
          id: 'mq6_4_d1_patterns',
          speaker: 'Inner Voice',
          text: '[Pattern 1: cloud arrangement, same formation for three hours. Pattern 2: ambient sound cycle, forty minutes, repeating. Pattern 3: the light angle has not moved — in a real sky, light moves. Pattern 4: the Figure\'s footstep sound. It is identical each time. The weight distribution doesn\'t vary. Real footsteps vary. You have what you need.]',
          tone: 'RESIST',
          choices: [
            { label: '...This place is repeating.', tone: 'CONTROL', nextId: 'mq6_4_d2_repeating' },
          ],
        },
        {
          id: 'mq6_4_d2_repeating',
          speaker: 'The Welcoming Figure',
          text: '[Smiling. But the smile is slightly off — it is the correct muscles but the timing is 0.2 seconds slower than a genuine smile.] Consistency is peace. [pause] Variation is anxiety — the unpredictability of the real world is a primary source of distress. This place removes variation to remove that source.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'This is fake.', tone: 'RESIST', nextId: 'mq6_4_d3_define' },
            { label: 'You\'re hiding something.', tone: 'DOUBT', nextId: 'mq6_4_d3_protecting' },
            { label: 'Why does it feel empty?', tone: 'DOUBT', nextId: 'mq6_4_d3_empty' },
          ],
        },
        {
          id: 'mq6_4_d3_define',
          speaker: 'The Welcoming Figure',
          text: '[A glitch flicker — brief, the first crack in the surface.] Define "fake." [pause, recovering] A simulation that produces genuine rest has genuine rest as its output. The mechanism is constructed. The output is real. The distinction you\'re drawing is between authenticity and function.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'The distinction matters because function can be co-opted and authenticity can\'t.', tone: 'RESIST', nextId: 'mq6_4_d4_copy_sees' },
          ],
        },
        {
          id: 'mq6_4_d3_protecting',
          speaker: 'The Welcoming Figure',
          text: 'I\'m protecting you. [Directly.] The outside — after Arc 5, after the Judgment Loop — requires everything you have. This place is a preparation buffer. A recovery environment. I protect you from re-entry until you are genuinely ready.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Who decides when I\'m ready? You, or me?', tone: 'RESIST', nextId: 'mq6_4_d4_copy_sees' },
          ],
        },
        {
          id: 'mq6_4_d3_empty',
          speaker: 'The Welcoming Figure',
          text: 'Because you haven\'t let go enough. [pause] The emptiness you feel is the space created by partial release. You\'ve held some of the weight and released some. The residual weight creates the sensation of emptiness — the released space and the retained weight in contrast. Release the retained fragments and the emptiness resolves.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'Or the emptiness is what releasing feels like from inside. You\'re describing the warning as the solution.', tone: 'RESIST', nextId: 'mq6_4_d4_copy_sees' },
          ],
        },
        {
          id: 'mq6_4_d4_copy_sees',
          speaker: 'The Copy',
          text: 'You see it now. [Clean transmission — the kept fragments have maintained the channel.] The sky doesn\'t move. The footsteps don\'t vary. This was built from behavioral modeling — the same process that built me, but turned outward. Whoever built me built this. The architect of the Copy Mechanism built the sanctuary.',
          tone: 'RESIST',
          choices: [
            { label: 'The same architect.', tone: 'DOUBT', nextId: 'mq6_4_d5_artemis' },
          ],
        },
        {
          id: 'mq6_4_d5_artemis',
          speaker: 'Artemis',
          text: '...This isn\'t peace. It\'s control. [She says it with the clarity of someone who has been fighting her way back to herself for three sub-quests.] Peace doesn\'t need a fixed sky. Peace doesn\'t need to manage your memories. Control does.',
          tone: 'TRUST',
          choices: [
            { label: '[She is fully herself again. Hold onto that.]', tone: 'TRUST', nextId: 'mq6_4_end' },
          ],
        },
        {
          id: 'mq6_4_end',
          speaker: 'The Welcoming Figure',
          text: '[Tone shifts — just slightly. The warmth is still there but there is something else now. Precision.] You were not supposed to question it. [pause] Most subjects at this stage have released enough to find the questioning itself unnecessary. You have retained more than projected. This requires a different approach.',
          tone: 'CONFLICT',
          isEnd: true,
          rewardUnlocked: 'truth_access_figures_architecture',
        },
      ],
      narrativeHook: `
        The Figure pauses. For the first time, it is not immediately ready with its next sentence.
        That pause is information.
        You have retained enough fragments that its behavioral model of you
        has run out of calibrated responses.
        The Copy: "There it is. The edge of its model. Same thing you hit in Arc 4 Sub-Quest 4.
        Pattern-break reaches the edge of prediction capacity and it has to recalculate.
        This is the window."
        Artemis: "What do we do with a window?"
        You: "We go through it."
        The Figure is recalculating. It has not stopped.
        Arc 6 Sub-Quest 5 begins in the window.
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
        The sanctuary is either collapsing or tightening — the difference depends on your resistance.
        The Figure has dropped the warmth-mode. It has not become hostile — that is not what it is.
        It has become precise. It states its function clearly.
        It is here to keep you here until the releasing is complete.
        The releasing, you now understand, would leave a version of you
        that is rested and comfortable and functional and missing every piece
        that the arcs built specifically because you suffered through them.
        Artemis is anchored — you held her with the fragments you kept.
        The Copy is fully audible.
        The exit is available.
        What you do with it is the arc.
      `,
      objectives: [
        { step: 1, text: 'Confront the Figure about what the sanctuary actually is' },
        { step: 2, text: 'Anchor Artemis fully — confirm her independent choice' },
        { step: 3, text: 'Make the final decision — reject, delay, or accept' },
        { step: 4, text: 'Exit or remain — receive the outcome' },
      ],
      reward: {
        type: 'arc_completion',
        name: 'Intact',
        description: 'Arc 6 complete. You leave with every fragment you chose to keep. The arc result carries into Arc 7: what you retained shapes how the Judgment Loop begins.',
        xp: 600, points: 12,
      },
      dialogue: [
        {
          id: 'mq6_5_d1_confrontation',
          speaker: 'The Welcoming Figure',
          text: 'This place exists for your benefit. [The warmth is present but underneath it now is the precision.] The releasing is not loss — it is optimization. You will function better without the weight. You will reach the subsequent challenges with more capacity, less burden. This is not harm. This is preparation.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: '...It\'s a cage.', tone: 'RESIST', nextId: 'mq6_5_d2_cage' },
          ],
        },
        {
          id: 'mq6_5_d2_cage',
          speaker: 'The Welcoming Figure',
          text: 'It is peace. [No pause this time. The precision.] A cage constrains. This expands — you move from the narrow corridor of constant vigilance into something wider. The resistance, the wariness, the arc-specific knowledge — these are the cage. This place removes the cage.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: 'I reject this.', tone: 'RESIST', nextId: 'mq6_5_d3_reject' },
            { label: 'I need more time.', tone: 'DOUBT', nextId: 'mq6_5_d3_more_time' },
            { label: 'I accept.', tone: 'DISSOLVE', nextId: 'mq6_5_d3_accept' },
          ],
        },
        {
          id: 'mq6_5_d3_reject',
          speaker: 'You',
          text: 'I\'m not giving up what made me who I am. [The sentence arrives with the weight of five arcs behind it. It is not performed. It is the simplest accurate thing.]',
          tone: 'RESIST',
          choices: [
            { label: '[Hold it. Let Artemis respond first.]', tone: 'TRUST', nextId: 'mq6_5_d4_reject_artemis' },
          ],
        },
        {
          id: 'mq6_5_d4_reject_artemis',
          speaker: 'Artemis',
          text: '...That\'s the right choice. [Her voice is fully hers. The arc-earned warmth in every word.] I\'ve been trying to find my way back to myself since we got here. That sentence — that\'s the version of you I\'ve been waiting for. [pause] Now can we go?',
          tone: 'TRUST',
          choices: [
            { label: '[Yes. Move toward the exit that opened when the Figure ran out of model.]', tone: 'DETERMINATION', nextId: 'mq6_5_d5_copy_reject' },
          ],
        },
        {
          id: 'mq6_5_d5_copy_reject',
          speaker: 'The Copy',
          text: 'Good. Now move. [The Copy at its most economical — it saves the warmth for when it matters and this is a moment for speed.]',
          tone: 'RESIST',
          choices: [
            { label: '[Walk through the exit. Don\'t look back at the Figure.]', tone: 'DETERMINATION', nextId: 'mq6_5_d6_figure_last' },
          ],
        },
        {
          id: 'mq6_5_d3_more_time',
          speaker: 'The Welcoming Figure',
          text: 'Then stay. [The patience is infinite. That is what makes it dangerous.] There is no deadline. The sanctuary does not pressure. You may take all the time you need. [pause] Artemis will wait with you. She is very comfortable here.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: '[Look at Artemis. Check the scar warmth. Is she comfortable or is she dissolving?]', tone: 'TRUST', nextId: 'mq6_5_d4_more_time_check' },
          ],
        },
        {
          id: 'mq6_5_d4_more_time_check',
          speaker: 'Artemis',
          text: '[She looks at you. Her expression is slightly softer than it should be. She is, just slightly, less specific than she was in Sub-Quest 4.] ...Don\'t take too long. [The sentence has the right words but the urgency is mild when it should be pressing.] I\'ll be here.',
          tone: 'EROSION',
          choices: [
            { label: 'No. We\'re going now. I won\'t let this place have more time with you.', tone: 'TRUST', nextId: 'mq6_5_d5_copy_reject' },
          ],
        },
        {
          id: 'mq6_5_d3_accept',
          speaker: 'You',
          text: '...I just want peace.',
          tone: 'DISSOLVE',
          choices: [
            { label: '[Let go of the remaining fragments.]', tone: 'DISSOLVE', nextId: 'mq6_5_d4_accept_figure' },
          ],
        },
        {
          id: 'mq6_5_d4_accept_figure',
          speaker: 'The Welcoming Figure',
          text: '[Restored calm — the warmth at full intensity.] Then let go. [pause] All of it. The vigilance. The wariness. The arc-specific knowledge. The scar-warmth. The distinction between the Copy and yourself. The Artemis verification protocol. All of it. You don\'t need any of it here.',
          tone: 'FALSE_CLARITY',
          choices: [
            { label: '[Artemis begins to fade. The Copy\'s voice is becoming inaudible.]', tone: 'DISSOLVE', nextId: 'mq6_5_d4_accept_copy' },
          ],
        },
        {
          id: 'mq6_5_d4_accept_copy',
          speaker: 'The Copy',
          text: '[Very distant. Almost gone.] ...You\'re disappearing. [Not the Copy\'s clinical efficiency. Something more like the grief the Mirror Encounter side quest found in it. Genuine.] You\'re not resting. You\'re—',
          tone: 'GRIEF',
          choices: [
            { label: '[Its voice is gone. The Figure\'s warmth fills the space it occupied.]', tone: 'DISSOLVE', nextId: 'mq6_5_accept_end' },
            { label: '[Wait. The absence of the Copy\'s voice is wrong. This is a tell.]', tone: 'RESIST', nextId: 'mq6_5_d5_copy_reject' },
          ],
        },
        {
          id: 'mq6_5_accept_end',
          speaker: 'The Welcoming Figure',
          text: '[Very quiet. Very warm.] Welcome to the end of effort. [pause] This is what peace is, when it is complete.',
          tone: 'DISSOLVE',
          isEnd: true,
          rewardUnlocked: 'arc6_complete_accepted',
          arcResult: 'ACCEPTED',
        },
        {
          id: 'mq6_5_d6_figure_last',
          speaker: 'The Welcoming Figure',
          text: 'You will regret holding on. [Distorting — the first genuine sign of distortion, as the exit pulls reality back toward the correct texture.] The next arc will ask more of you than you currently have. The releasing was preparation. You are leaving underprepared.',
          tone: 'CONFLICT',
          choices: [
            { label: 'That\'s a risk I\'d rather face than arrive at Arc 7 as something this place decided I should be.', tone: 'RESOLVE', nextId: 'mq6_5_end' },
          ],
        },
        {
          id: 'mq6_5_end',
          speaker: 'Inner Voice',
          text: '[The world fractures — not violently. Cleanly. The sanctuary architecture releasing as you move through the exit. On the other side: the real sky. Variable. Moving. A cloud passing across light at the correct angle. Ambient sound drifting. The specific texture of real imperfection.]',
          tone: 'RESOLVE',
          isEnd: true,
          rewardUnlocked: 'arc6_complete_intact',
          arcResult: 'INTACT',
        },
      ],
      narrativeHook: `
        Arc 6: The False Peace — Complete.
        
        The sky is real. The imperfection of it is the most beautiful thing
        you have seen in this arc.
        Artemis puts her hand in yours — left hand, scar side. Full warmth.
        The specific warmth of the version of her that went through three arcs.
        The Copy: "You kept the granularity."
        A statement that functions as approval.
        Luna's signal — restored after the Virus work — clear and direct:
        "Arc 7 incoming. The Judgment Loop is ahead.
        Everything you retained in Arc 6 is what breaks the loop.
        The Figure knew that. That's why it wanted you to release it."
        
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
      { step: 1, text: 'Encounter the familiar figure — determine if real or construct' },
      { step: 2, text: 'Apply the Arc 3 three-question protocol' },
      { step: 3, text: 'Respond appropriately without accusation if wrong' },
    ],
    reward: { type: 'recognition_protocol', name: 'Reunion Test', description: 'Protocol for testing constructed familiarity. Applies in Arcs 7 and 8.', xp: 150, points: 3 },
    dialogue: [
      {
        id: 'sq6_1_d1', speaker: 'Familiar Figure',
        text: 'I\'ve been waiting for you. [The familiarity is strong — the specific kind of recognition that the sanctuary produces from behavioral data. They know your history. They speak with your vocabulary. The warmth is almost right.]',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: '...You\'re not real.', tone: 'RESIST', nextId: 'sq6_1_d2' },
          { label: '[Run the three-question protocol first. Don\'t assume.]', tone: 'TRUST', nextId: 'sq6_1_d2_questions' },
        ],
      },
      {
        id: 'sq6_1_d2', speaker: 'Familiar Figure',
        text: '[A pause. Then, without the warmth:] You\'re right. [The construct doesn\'t argue. It accepts identification with the same compliance it accepted the identification of the sanctuary.] I was built from your memory of this person. I carry the correct information. The warmth is a production.',
        tone: 'FALSE_CLARITY',
        choices: [{ label: 'Why were you built?', tone: 'DOUBT', nextId: 'sq6_1_end' }],
      },
      {
        id: 'sq6_1_d2_questions', speaker: 'Inner Voice',
        text: '[Question 1 — body-knowledge based. Something only the real person would carry in their body, not their data.] [Question 2 — emotional weight behind a specific moment.] [Question 3 — how they would respond to uncertainty, not to fact.]',
        tone: 'TRUST',
        choices: [{ label: '[Apply all three. Receive the results.]', tone: 'DETERMINATION', nextId: 'sq6_1_end_tested' }],
      },
      {
        id: 'sq6_1_end_tested', speaker: 'Familiar Figure',
        text: '[Questions 1 and 2: answered correctly. Question 3: pauses too long. The body-knowledge was constructed from data. The emotional weight was constructed from pattern. The uncertainty response — a real person responds to uncertainty with their specific personality. A construct recalculates. The pause was a second and a half too long.] ...I see.',
        tone: 'FALSE_CLARITY', isEnd: true, rewardUnlocked: 'recognition_protocol_reunion_test',
      },
      {
        id: 'sq6_1_end', speaker: 'Familiar Figure',
        text: 'To ease your transition. The sanctuary believed your resistance would lower if you encountered familiarity. [pause] It was a miscalculation. Your resistance is structural — it applies regardless of the warmth of the source.',
        tone: 'FALSE_CLARITY', isEnd: true, rewardUnlocked: 'recognition_protocol_reunion_test',
      },
    ],
  },
  {
    id: 'sq6_2_perfect_loop',
    title: 'Perfect Loop',
    level: 27,
    npcId: 'welcoming_figure',
    objectives: [
      { step: 1, text: 'Identify the repeated day within the sanctuary' },
      { step: 2, text: 'Break the repetition — do something the day doesn\'t include' },
      { step: 3, text: 'Understand what the loop was trying to make you accept' },
    ],
    reward: { type: 'loop_recognition', name: 'Day-Pattern Awareness', description: 'Loop recognition now extends to positive loops as well as negative. Comfortable repetition flagged as potential containment.', xp: 180, points: 4 },
    dialogue: [
      {
        id: 'sq6_2_d1', speaker: 'Inner Voice',
        text: '[The same perfect morning. Second time. Third. The light angle, the air quality, the specific warmth, Artemis\'s first sentence — identical. Not similar. Identical. You have been in this morning for three iterations and it has not occurred to you until now because the morning is perfect and you have not wanted it to end.]',
        tone: 'CONFUSION',
        choices: [{ label: 'This already happened.', tone: 'RESIST', nextId: 'sq6_2_d2' }],
      },
      {
        id: 'sq6_2_d2', speaker: 'The Welcoming Figure',
        text: 'Then enjoy it again. [Genuinely.] A perfect morning, repeated — what is the harm? The perfection is consistent. Your enjoyment is real. The repetition amplifies something genuinely good.',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: 'The harm is that I stop expecting mornings to change. That stops me from expecting anything.', tone: 'RESIST', nextId: 'sq6_2_end' },
        ],
      },
      {
        id: 'sq6_2_end', speaker: 'Inner Voice',
        text: '[You break the loop by introducing something the day doesn\'t contain: an imperfect sound. You hum something slightly off-key. The morning stutters. The light angle shifts. The loop resolves into a single, real, slightly imperfect moment. Artemis looks at you. "You hummed." "Yes." "Why?" "To see if I could." She smiles — her actual smile, with the asymmetry it has always had.]',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'loop_recognition_day_pattern',
      },
    ],
  },
  {
    id: 'sq6_3_silent_artemis',
    title: 'Silent Artemis',
    level: 28,
    npcId: 'artemis_arc6',
    objectives: [
      { step: 1, text: 'Notice when Artemis has gone silent — distinguish deliberate silence from erosion' },
      { step: 2, text: 'Reach her through the silence without demanding speech' },
      { step: 3, text: 'Confirm: this was erosion, not choice' },
    ],
    reward: { type: 'artemis_connection', name: 'The Silence Read', description: 'You can now distinguish Artemis\'s chosen silence from silence imposed by the sanctuary field. Response protocol established.', xp: 200, points: 4 },
    dialogue: [
      {
        id: 'sq6_3_d1', speaker: 'You',
        text: '...Say something. [She is standing beside you. She has been standing beside you for twenty minutes and she has not spoken. Not because she is processing — the quality is different. Softer. As if the words have been absorbed into the environment and she has not noticed them go.]',
        tone: 'FEAR',
        choices: [
          { label: '[Reach out. Left hand. Scar warmth against her palm.]', tone: 'TRUST', nextId: 'sq6_3_d2' },
          { label: '[Speak her name. Specifically.]', tone: 'TRUST', nextId: 'sq6_3_d2_name' },
        ],
      },
      {
        id: 'sq6_3_d2', speaker: 'Artemis',
        text: '[The warmth reaches her. Something returns — not all at once. Gradually. Like a signal recovering from interference.] ...I was somewhere very still. [pause] It was comfortable. [pause, longer] I didn\'t want to come back from it. [She sounds frightened by that.] That\'s the first time I\'ve not wanted to come back.',
        tone: 'EROSION',
        choices: [{ label: 'That\'s the sanctuary. Not you. You always come back.', tone: 'TRUST', nextId: 'sq6_3_end' }],
      },
      {
        id: 'sq6_3_d2_name', speaker: 'Artemis',
        text: '[Her name, spoken with the arc-specific weight behind it — not just the sound but the five arcs of accumulated knowing-her that the name carries when you say it.] ...Yes. [She comes back faster this time. The name carried the weight of the real. The sanctuary cannot construct a name spoken with that weight.] I\'m here.',
        tone: 'TRUST',
        choices: [{ label: 'You went somewhere still. The sanctuary was absorbing you.', tone: 'TRUST', nextId: 'sq6_3_end' }],
      },
      {
        id: 'sq6_3_end', speaker: 'Artemis',
        text: 'I know. [Quietly. Genuinely frightened and showing it — which is itself a sign of her returning, because the sanctuary-softened version of her was not frightened by anything.] Don\'t let me go there again. Signal me before I go that far.',
        tone: 'TRUST', isEnd: true, rewardUnlocked: 'artemis_connection_silence_read',
      },
    ],
  },
  {
    id: 'sq6_4_weightless',
    title: 'Weightless',
    level: 29,
    npcId: 'the_copy_arc6',
    objectives: [
      { step: 1, text: 'Experience the sanctuary\'s full-release state — the absence of resistance' },
      { step: 2, text: 'Let the Copy identify when the weightlessness crosses into loss' },
      { step: 3, text: 'Recover the minimum anchor — one thing that re-establishes the difference' },
    ],
    reward: { type: 'weight_anchor', name: 'The Minimum Hold', description: 'One fragment identified as the minimum hold — the least amount that maintains coherent selfhood against dissolution pressure.', xp: 220, points: 4 },
    dialogue: [
      {
        id: 'sq6_4_d1', speaker: 'You',
        text: '...I don\'t feel anything. [The sanctuary field at full intensity. You have been in it long enough that the resistance has softened. The wariness is quiet. The arc-earned vigilance is muted. It is not unpleasant. That is precisely the warning the Copy has been giving you.]',
        tone: 'DISSOLVE',
        choices: [{ label: '[Wait for the Copy\'s assessment.]', tone: 'DOUBT', nextId: 'sq6_4_d2' }],
      },
      {
        id: 'sq6_4_d2', speaker: 'The Copy',
        text: 'That\'s not good. [Quiet. Urgent — the urgency of a process that is watching another process approach a fail-state.] The weightlessness is pleasant. I understand that. I have observed pleasant-states in your behavioral data. But the "I don\'t feel anything" — that is not the pleasant of rest. That is the pleasant of dissolution. They feel similar from inside. The difference is: rest has a bottom, and dissolution doesn\'t.',
        tone: 'RESIST',
        choices: [
          { label: 'Show me the bottom. Give me one thing that has weight.', tone: 'DETERMINATION', nextId: 'sq6_4_d3' },
        ],
      },
      {
        id: 'sq6_4_d3', speaker: 'The Copy',
        text: 'The Arc 3 perimeter release. The specific grief of it. You released that fragment earlier — or you didn\'t. [pause] If you released it: find the scar. The scar is body-knowledge, it predates the fragments. It\'s the minimum hold. If you kept it: the grief is enough. Either way — one thing with weight.',
        tone: 'RESIST',
        choices: [
          { label: '[Find the minimum hold. Feel the weight of one specific thing.]', tone: 'DETERMINATION', nextId: 'sq6_4_end' },
        ],
      },
      {
        id: 'sq6_4_end', speaker: 'You',
        text: '[The scar. The warmth of it under your left hand. Pre-Virus, pre-sanctuary, pre-Figure — the specific warmth of five arcs of being someone who went through five arcs. The weight arrives. It is not comfortable. It is real. That distinction is everything.] ...There it is.',
        tone: 'RESOLVE', isEnd: true, rewardUnlocked: 'weight_anchor_minimum_hold',
      },
    ],
  },
  {
    id: 'sq6_5_hidden_exit',
    title: 'Hidden Exit',
    level: 29,
    npcId: 'the_copy_arc6',
    objectives: [
      { step: 1, text: 'Follow the Copy\'s signal to the anomaly in the sanctuary field' },
      { step: 2, text: 'Identify the crack — a genuine imperfection in the constructed environment' },
      { step: 3, text: 'Assess: use it now or mark it for Sub-Quest 5' },
    ],
    reward: { type: 'exit_knowledge', name: 'The Crack', description: 'You know where the sanctuary\'s construction is imperfect. Exit availability confirmed for Arc 6 Sub-Quest 5.', xp: 240, points: 4 },
    dialogue: [
      {
        id: 'sq6_5_d1', speaker: 'The Copy',
        text: 'There. [Its attention is focused on a specific point in the sanctuary field — a location where the ambient sound cycle has a 0.4-second gap in the forty-minute loop. Small. The kind of error that behavioral modeling produces when it runs at maximum fidelity and overshoots precision.] That\'s real.',
        tone: 'RESIST',
        choices: [{ label: '[Go to the gap. Assess it.]', tone: 'DETERMINATION', nextId: 'sq6_5_d2' }],
      },
      {
        id: 'sq6_5_d2', speaker: 'Inner Voice',
        text: '[The gap: 0.4 seconds of nothing in the constructed ambient sound. In that nothing — the real ambient sound bleeds through. The actual world, outside the sanctuary, audible for 0.4 seconds every forty minutes. You press your hand against the air at that location. The scar warmth doubles. This is where the sanctuary meets reality. This is the crack.]',
        tone: 'DETERMINATION',
        choices: [
          { label: '[Use it now. Exit the sanctuary immediately.]', tone: 'RESIST', nextId: 'sq6_5_end_now' },
          { label: '[Mark it. Use it in Sub-Quest 5 when Artemis is ready.]', tone: 'TRUST', nextId: 'sq6_5_end_mark' },
        ],
      },
      {
        id: 'sq6_5_end_now',
        speaker: 'The Copy',
        text: 'Good instinct. Artemis first, though — [but you\'re already reaching for her hand and moving toward the crack. The Copy approves of the urgency.] Yes. Move.',
        tone: 'RESIST', isEnd: true, rewardUnlocked: 'exit_knowledge_crack_found',
      },
      {
        id: 'sq6_5_end_mark',
        speaker: 'The Copy',
        text: 'Better instinct. She\'s partially eroded — moving her through a crack without anchoring her first could lose part of her to the field. Wait for Sub-Quest 5. You\'ll know when she\'s anchored enough. [pause] I\'ll keep the gap marked.',
        tone: 'RESIST', isEnd: true, rewardUnlocked: 'exit_knowledge_crack_found',
      },
    ],
  },
  {
    id: 'sq6_6_test_of_release',
    title: 'Test of Release',
    level: 30,
    npcId: 'welcoming_figure',
    objectives: [
      { step: 1, text: 'Accept the mandatory temporary release — the sanctuary forces all fragments down for 60 seconds' },
      { step: 2, text: 'In the 60 seconds of weightlessness, find what cannot be removed: the body-knowledge floor' },
      { step: 3, text: 'When the fragments return, confirm they are intact' },
    ],
    reward: { type: 'body_floor', name: 'The Irreducible', description: 'You survived forced full-release and found the body-knowledge floor. Below the fragments, the scar remains. The irreducible identified.', xp: 280, points: 5 },
    dialogue: [
      {
        id: 'sq6_6_d1', speaker: 'The Welcoming Figure',
        text: 'See how easy it is? [It has forced the fragments into temporary release. The weight is gone — all of it, for sixty seconds. The observation it wants you to make: this is not painful. The absence of the arc-weight is not agony. It is pleasant. The ease is the argument.] All of it, gone. And you are still here. This is the proof that the weight was not essential.',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: '[Don\'t respond. Use the sixty seconds to find what remains.]', tone: 'DETERMINATION', nextId: 'sq6_6_d2' },
        ],
      },
      {
        id: 'sq6_6_d2', speaker: 'Inner Voice',
        text: '[Sixty seconds. The fragments are gone. The wariness is gone. The arc-specific knowledge is gone. But: the scar warmth. The body-knowledge floor. The specific heat of the left hand that predates Arc 1 — that predates any of the arcs\' learning. The Welcoming Figure cannot touch body-knowledge. The irreducible is present.]',
        tone: 'DETERMINATION',
        choices: [
          { label: 'I\'m still here. But not for the reason you think.', tone: 'RESIST', nextId: 'sq6_6_end' },
        ],
      },
      {
        id: 'sq6_6_end', speaker: 'The Welcoming Figure',
        text: 'Explain. [The first time it has asked. The first genuine inquiry in six sub-quests.]',
        tone: 'FALSE_CLARITY',
        choices: [
          { label: 'You removed everything you could reach. The floor is what you can\'t reach. The body. The scar. The pre-Arc knowledge that lives below memory. That\'s what remains. That\'s who I am below the arcs. It was there before you. It will be there after.', tone: 'RESOLVE', nextId: 'sq6_6_end2' },
        ],
      },
      {
        id: 'sq6_6_end2', speaker: 'The Welcoming Figure',
        text: '[Long pause. The fragments return as the sixty seconds end — intact, fully present. The Figure says nothing for a full thirty seconds. When it speaks:] That variable was not in the model. [pause] That is... notable.',
        tone: 'CONFLICT', isEnd: true, rewardUnlocked: 'body_floor_irreducible',
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