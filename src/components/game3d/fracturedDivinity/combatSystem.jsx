// ─────────────────────────────────────────────────────────────────────────────
// DIVIDED: RECLAMATION — Combat & Gameplay System
// Narrative-driven mechanics tied to story arcs
// ─────────────────────────────────────────────────────────────────────────────

// ── CONTROL METER ────────────────────────────────────────────────────────────

export const CONTROL_METER = {
  id: 'control_meter',
  label: 'Control Meter',
  description: 'Represents how psychologically stable the player is. Primary mechanic — affects movement, abilities, dialogue, and UI.',
  range: [0, 100],
  defaultValue: 75,
  thresholds: {
    HIGH:   { min: 70, max: 100, label: 'High Control' },
    MID:    { min: 40, max: 69,  label: 'Partial Control' },
    LOW:    { min: 0,  max: 39,  label: 'Low Control' },
  },
  effects: {
    HIGH: [
      'Precise movement — no input lag',
      'Abilities fire cleanly',
      'All dialogue options visible',
      'Enemies behave predictably',
    ],
    MID: [
      'Slight input delay',
      'One dialogue option hidden',
      'Minor ability variance',
    ],
    LOW: [
      'Input delay (up to 3.2s)',
      'Camera distortion active',
      'Abilities misfire or redirect',
      'Dialogue options unreliable — wrong choice highlighted',
      'UI elements shift or flicker',
    ],
  },
  modifiers: [
    { source: 'dialogue_stay_calm',   delta: +15, label: '"Stay calm"' },
    { source: 'dialogue_rush',         delta: -20, label: '"Rush forward" (+Damage)' },
    { source: 'artemis_anchor_field',  delta: +10, label: 'Artemis: Anchor Field (regen)' },
    { source: 'artemis_dialogue',      delta: +12, label: 'Artemis: "Stay with me"' },
    { source: 'copy_override',         delta: -15, label: 'Copy override (Controlled arc)' },
    { source: 'virus_correction',      delta: -25, label: 'System Voice: "Correction applied"' },
    { source: 'loop_reset',            delta: -10, label: 'Loop reset detected' },
    { source: 'focus_ability',         delta: +20, label: 'Focus ability used' },
    { source: 'anchor_ability',        delta: +30, label: 'Anchor ability used' },
    { source: 'fake_peace_accepted',   delta: -40, label: 'False peace accepted' },
    { source: 'pattern_recognized',    delta: +8,  label: 'Enemy pattern recognized' },
  ],
};

// ── PERCEPTION MODE ───────────────────────────────────────────────────────────

export const PERCEPTION_MODE = {
  id: 'perception_mode',
  label: 'Perception Mode',
  description: 'Toggle between Reality View and Perception View. Each reveals different truths — and different dangers.',
  modes: {
    REALITY: {
      id: 'reality',
      label: 'Reality View',
      color: '#6ec3ff',
      effects: [
        'Stable enemies visible',
        'Hidden/illusion threats invisible',
        'Clear movement and positioning',
        'Reliable hit detection',
      ],
    },
    PERCEPTION: {
      id: 'perception',
      label: 'Perception View',
      color: '#a78bfa',
      effects: [
        'Illusion enemies revealed',
        'Hidden paths and exits visible',
        'Real enemies become distorted — harder to hit',
        'Copy\'s position always visible',
        'False peace seams detectable',
      ],
    },
  },
  enemyExclusivity: [
    { enemy: 'distortions',            visibleIn: ['REALITY', 'PERCEPTION'] },
    { enemy: 'redirectors',            visibleIn: ['REALITY'] },
    { enemy: 'copies',                 visibleIn: ['PERCEPTION'] },
    { enemy: 'virus_entities',         visibleIn: ['REALITY'] },
    { enemy: 'loop_sentinels',         visibleIn: ['REALITY', 'PERCEPTION'] },
    { enemy: 'fake_kingdom_guardians', visibleIn: ['REALITY'] },
    { enemy: 'final_entity',           visibleIn: ['REALITY', 'PERCEPTION'], note: 'Shifts between layers' },
  ],
};

// ── COPY SYSTEM ───────────────────────────────────────────────────────────────

export const COPY_SYSTEM = {
  id: 'copy_system',
  label: 'The Copy System',
  description: 'The Copy\'s behavior in combat is determined by the Arc 9 outcome. Not evil — just decisive.',
  variants: {
    INTEGRATED: {
      id: 'integrated',
      label: 'Integrated',
      combatBehavior: [
        'Passive damage bonus: +15%',
        'Occasional auto-counter on enemy attack',
        'Dialogue timing windows extended by 0.8s',
        'Split Action unlocked',
        'No conflicts in decision space',
      ],
      dialogueTrigger: {
        speaker: 'COPY',
        text: "We're aligned.",
        effect: 'Auto-counter activates for next 3 attacks',
      },
    },
    CONTROLLED: {
      id: 'controlled',
      label: 'Controlled',
      combatBehavior: [
        'Copy interrupts abilities with a 12% chance per cast',
        'Can briefly override player input (0.8–1.5s)',
        'Interrupt can be pre-empted by "Refuse" dialogue choice',
        'Override state: Copy attacks at 120% player damage',
        'Costs 10 Control on each override',
      ],
      dialogueTrigger: {
        speaker: 'COPY',
        text: "I'll do it.",
        choices: [
          { label: 'Let Copy act', effect: 'Copy takes control for 2s — AI combat, full damage' },
          { label: 'Refuse', effect: '+20 Control, player retains control' },
        ],
      },
    },
    DOMINATED: {
      id: 'dominated',
      label: 'Dominated',
      combatBehavior: [
        'High damage output: +35%',
        'Control meter drains 3pts/sec during combat',
        'Aggressive auto-actions trigger unpredictably',
        'Dialogue options fewer — Copy answers for you',
        'Pattern recognition disabled (Copy overrides observation)',
      ],
      dialogueTrigger: {
        speaker: 'COPY',
        text: 'Faster.',
        effect: 'Forced aggressive action — -15 Control, highest damage combo fires',
      },
    },
    SEPARATED: {
      id: 'separated',
      label: 'Separated (Dual)',
      combatBehavior: [
        'Copy is an independent AI companion',
        'Commandable via quick-select dialogue',
        'Can disagree with commands — 25% chance refusal if alignment low',
        'Own cooldowns, own targeting',
        'Disagreement: Copy attacks different target or uses its own ability',
        'Split Action: player + Copy act simultaneously on command',
      ],
      dialogueTrigger: {
        speaker: 'COPY',
        text: 'I see it differently.',
        choices: [
          { label: 'Trust the Copy', effect: 'Copy\'s target takes double damage' },
          { label: 'Override', effect: 'Copy follows your target — -5 alignment' },
        ],
      },
    },
  },
};

// ── ARTEMIS SUPPORT SYSTEM ────────────────────────────────────────────────────

export const ARTEMIS_SUPPORT = {
  id: 'artemis_support',
  label: 'Artemis Support System',
  description: 'Not just a companion — she stabilizes gameplay. Her strength in combat reflects her arc progression.',
  abilities: [
    {
      id: 'anchor_field',
      name: 'Anchor Field',
      description: 'Projects the Arc 3 scar-warmth into the combat space. Prevents Control loss for 8 seconds.',
      cooldown: 24,
      controlEffect: '+10 Control regen/sec during field',
      distortionEffect: 'Suppresses all visual distortion',
      narrativeTrigger: 'Available after Arc 3 completion',
    },
    {
      id: 'clarity_pulse',
      name: 'Clarity Pulse',
      description: 'Brief flash of Perception View forced on all enemies. Reveals illusions and real entities simultaneously for 3s.',
      cooldown: 18,
      controlEffect: '+5 Control',
      perceptionEffect: 'Forces PERCEPTION mode for 3s without distortion penalty',
      narrativeTrigger: 'Available after Arc 6 false peace rejection',
    },
    {
      id: 'restore',
      name: 'Restore',
      description: 'Stabilizes perception. Snaps the player back to baseline reality. Cancels Virus rewrites.',
      cooldown: 35,
      controlEffect: '+40 Control (instant)',
      virusEffect: 'Cancels active Virus rewrite',
      narrativeTrigger: 'Available after Arc 5 completion',
    },
  ],
  dialogueTriggers: [
    {
      id: 'artemis_stay_with_me',
      speaker: 'ARTEMIS',
      text: 'Stay with me.',
      arcAvailability: [3, 4, 5, 6, 7, 8, 9, 10],
      effects: [
        'Activates Control regen (+8/sec for 6s)',
        'Reduces distortion intensity by 50%',
        'Extends next dialogue window by 1.2s',
      ],
    },
    {
      id: 'artemis_focus',
      speaker: 'ARTEMIS',
      text: 'Focus!',
      arcAvailability: [5, 6, 7],
      effects: [
        'Control regen activated',
        'Next ability fires cleanly regardless of Control level',
      ],
    },
  ],
  fadeProgression: {
    description: 'Artemis strength in combat reflects her arc — the more eroded by false peace or virus, the weaker her support.',
    levels: [
      { arc: 'arc_1_5',  strength: 100, label: 'Full presence' },
      { arc: 'arc_6',    strength: 65,  label: 'Partially eroded by false peace' },
      { arc: 'arc_7',    strength: 80,  label: 'Loop-memory restored' },
      { arc: 'arc_8_9',  strength: 95,  label: 'Full clarity returns' },
      { arc: 'arc_10',   strength: 100, label: 'Complete — all abilities enhanced' },
    ],
  },
};

// ── ENEMY DESIGN ──────────────────────────────────────────────────────────────

export const ENEMY_TYPES = [
  {
    id: 'distortions',
    name: 'Distortions',
    arcAppearance: [1, 5],
    theme: 'Instability — the first sign something is wrong',
    combatBehavior: [
      'Glitch movement — teleport-steps, not smooth locomotion',
      'Break animation rules — attacks arrive before the windup',
      'Teaching mechanic: player learns to read uncertain inputs',
    ],
    controlDrain: 5,
    perceptionLayer: 'BOTH',
    counterMechanic: 'Pattern-reading: recognize glitch gap, attack during it',
  },
  {
    id: 'redirectors',
    name: 'Redirectors',
    arcAppearance: [6, 10],
    theme: 'Interference — the system changing your inputs',
    combatBehavior: [
      'Change player direction mid-input',
      'Represent the correction mechanism actively interfering',
      'Counter: move in a direction you did NOT intend — the redirect becomes a dodge',
    ],
    controlDrain: 12,
    perceptionLayer: 'REALITY',
    counterMechanic: 'Use the redirect — accept the altered direction as a dodge',
  },
  {
    id: 'copies',
    name: 'Copies',
    arcAppearance: [16, 45],
    theme: 'The self turned against itself',
    combatBehavior: [
      'Mirror the player\'s ability set after observing 3 uses',
      'Learn patterns — counter the 4th use of any ability',
      'Defeat by using an ability never used before, or by using a dialogue interrupt',
    ],
    controlDrain: 8,
    perceptionLayer: 'PERCEPTION',
    counterMechanic: 'Unpredictability — use new abilities or dialogue interrupts',
    specialNote: 'In Arc 9+, Copies have dialogue — they speak before attacking',
  },
  {
    id: 'virus_entities',
    name: 'Virus Entities',
    arcAppearance: [21, 30],
    theme: 'The reality rewrite — truth is mutable',
    combatBehavior: [
      'Rewrite active UI elements',
      'Change control mappings mid-fight',
      'Display fake health bars',
      'Counter: use body-knowledge (Control > 60) to detect the fake',
    ],
    controlDrain: 20,
    perceptionLayer: 'REALITY',
    counterMechanic: 'Body-knowledge check: if Control > 60, detect Virus UI lies',
  },
  {
    id: 'loop_sentinels',
    name: 'Loop Sentinels',
    arcAppearance: [31, 35],
    theme: 'Repetition as enforcement',
    combatBehavior: [
      'Reset arena state to iteration-start if player repeats same move pattern 3 times',
      'Force repetition mechanics',
      'Defeat: break the pattern — use a move not used in this iteration',
    ],
    controlDrain: 15,
    perceptionLayer: 'BOTH',
    counterMechanic: 'Never repeat the same combat sequence — unpredictability breaks the reset trigger',
  },
  {
    id: 'fake_kingdom_guardians',
    name: 'Fake Kingdom Guardians',
    arcAppearance: [26, 30],
    theme: 'Comfort as weapon',
    combatBehavior: [
      'Don\'t attack — they slow movement and remove abilities',
      'Encourage "giving up" via passive aura',
      'Control drain is passive, not active',
      'Defeat: reject the comfort (dialogue) to re-enable abilities',
    ],
    controlDrain: 3,
    controlDrainType: 'passive_aura',
    perceptionLayer: 'REALITY',
    counterMechanic: '"I don\'t want this" dialogue choice re-enables full ability set',
    specialNote: 'These enemies cannot be defeated with violence — only with dialogue rejection',
  },
  {
    id: 'final_entity',
    name: 'The Final Entity',
    arcAppearance: [46, 50],
    theme: 'The composite — everything that opposed you, assembled',
    combatBehavior: [
      'Combines ALL enemy mechanics simultaneously',
      'Changes rules mid-fight based on player behavior',
      'Was calibrated for a 60% eroded player — full capacity is an advantage',
      'Becomes confused at first — exploitation window of ~8 seconds',
    ],
    controlDrain: 0,
    controlDrainType: 'conditional',
    perceptionLayer: 'BOTH',
    counterMechanic: 'Use the confusion window — apply the mechanic it was NOT designed for',
    specialNote: 'Has dialogue before each phase. Responding to dialogue changes the mechanic used.',
  },
];

// ── BASE ABILITIES ─────────────────────────────────────────────────────────────

export const BASE_ABILITIES = [
  {
    id: 'strike',
    name: 'Strike',
    type: 'base',
    description: 'Standard attack. Damage scales with Control level.',
    cooldown: 0,
    controlEffect: 0,
    scaling: 'damage = baseDmg * (0.5 + controlPct * 0.5)',
    note: 'At Low Control: unpredictable target selection',
  },
  {
    id: 'dash',
    name: 'Dash',
    type: 'base',
    description: 'Directional escape. At Low Control, direction is randomized.',
    cooldown: 6,
    controlEffect: +5,
    scaling: 'direction = intended at HIGH, random at LOW',
  },
  {
    id: 'guard',
    name: 'Guard',
    type: 'base',
    description: 'Block incoming attack. At Low Control, has a 30% miss window.',
    cooldown: 0,
    controlEffect: +3,
  },
  {
    id: 'focus',
    name: 'Focus',
    type: 'base',
    description: 'Restore control. Pause, center, return. No damage — pure stability.',
    cooldown: 12,
    controlEffect: +20,
    note: 'Cannot be interrupted by Virus or Copy in INTEGRATED arc',
  },
];

// ── ADVANCED ABILITIES ─────────────────────────────────────────────────────────

export const ADVANCED_ABILITIES = [
  {
    id: 'override',
    name: 'Override',
    type: 'advanced',
    unlockCondition: 'Arc 5 (Virus Arc) completion',
    description: 'Force control of the environment briefly. Suspend a Virus rewrite, redirect a Redirector, or freeze a Loop Sentinel mid-reset.',
    cooldown: 20,
    duration: 4,
    controlEffect: -10,
    note: 'Using Override acknowledges the system\'s power before removing it — costs Control',
  },
  {
    id: 'see_through',
    name: 'See Through',
    type: 'advanced',
    unlockCondition: 'Arc 6 false peace rejected (Illusion Arcs)',
    description: 'Reveal hidden enemies and fake UI elements simultaneously. Brief combined perception — both layers at once without distortion penalty.',
    cooldown: 15,
    duration: 5,
    controlEffect: +5,
  },
  {
    id: 'split_action',
    name: 'Split Action',
    type: 'advanced',
    unlockCondition: 'Arc 4 Copy Arc — INTEGRATED or SEPARATED outcome',
    description: 'Act twice simultaneously. Player + Copy execute separate actions in the same frame. In SEPARATED: command the Copy\'s action independently.',
    cooldown: 18,
    controlEffect: -5,
    note: 'In DOMINATED arc: Split Action fires automatically, uncontrolled',
  },
  {
    id: 'anchor',
    name: 'Anchor',
    type: 'advanced',
    unlockCondition: 'Arc 3 Artemis arc — scar-warmth established',
    description: 'Stop time distortion in the current zone. Freezes Loop Sentinel resets, cancels Virus rewrites, stabilizes Redirector interference for 8 seconds.',
    cooldown: 35,
    controlEffect: +30,
    note: 'The warmth of the Arc 3 link is the mechanical source of this ability',
  },
];

// ── DIALOGUE → GAMEPLAY TRIGGERS ──────────────────────────────────────────────

export const DIALOGUE_TRIGGERS = [
  {
    id: 'virus_correction',
    arcId: 'arc_5',
    speaker: 'SYSTEM_VOICE',
    text: 'Correction applied.',
    effects: [
      { type: 'controls_invert', duration: 6, description: 'Controls invert for 6 seconds' },
      { type: 'enemy_positions_swap', description: 'All visible enemy positions swap' },
      { type: 'control_drain', amount: 25 },
    ],
    counterDialogue: {
      speaker: 'ARTEMIS',
      text: 'Focus!',
      playerResponse: 'Focus ability activates — Control regen begins',
    },
  },
  {
    id: 'fake_peace_let_go',
    arcId: 'arc_6',
    speaker: 'WELCOMING_FIGURE',
    text: 'Let go.',
    choices: [
      {
        label: 'Accept',
        effect: 'Lose all advanced abilities for 45 seconds. +15 Control.',
        controlDelta: +15,
        mechanicEffect: 'advanced_abilities_disabled',
      },
      {
        label: 'Resist',
        effect: '+30% damage for 20 seconds. -25 Control.',
        controlDelta: -25,
        mechanicEffect: 'damage_boost',
        note: 'Resistance here is the correct narrative choice — instability is the cost of truth',
      },
    ],
  },
  {
    id: 'loop_cycle_maintained',
    arcId: 'arc_7',
    speaker: 'SYSTEM_VOICE',
    text: 'Cycle maintained.',
    effects: [
      {
        type: 'combat_reset_trigger',
        condition: 'Player repeats same move pattern 3 times',
        description: 'Combat resets to iteration-start. Enemy HP restored. Player Control unchanged.',
      },
    ],
    counterMechanic: 'Break the pattern before the 3rd repetition',
  },
  {
    id: 'copy_ill_do_it',
    arcId: 'arc_4_plus',
    speaker: 'COPY',
    text: "I'll do it.",
    choices: [
      {
        label: 'Let Copy act',
        effect: 'AI takes over combat for 2–4 seconds. Highest damage output. Player loses input.',
        controlDelta: 0,
        mechanicEffect: 'copy_ai_combat',
      },
      {
        label: 'Refuse',
        effect: '+20 Control. Player retains all input.',
        controlDelta: +20,
        mechanicEffect: 'control_boost',
      },
    ],
  },
  {
    id: 'copy_act_faster',
    arcId: 'arc_5_plus',
    speaker: 'COPY',
    text: 'Act faster.',
    choices: [
      {
        label: 'Stay calm',
        effect: '+15 Control. Slower but reliable.',
        controlDelta: +15,
        mechanicEffect: 'control_boost',
      },
      {
        label: 'Rush forward',
        effect: '+40% damage for 8 seconds. -20 Control.',
        controlDelta: -20,
        mechanicEffect: 'damage_rush',
      },
    ],
  },
];

// ── BOSS FIGHT STRUCTURE ──────────────────────────────────────────────────────

export const BOSS_FIGHTS = [
  {
    id: 'system_core',
    name: 'The System Core',
    arcId: 'arc_7_8',
    description: 'The accumulated weight of all correction mechanisms, assembled into a single entity.',
    phases: [
      {
        phase: 1,
        name: 'Control',
        layer: 'PHYSICAL',
        mechanics: [
          'Input delay scales with boss HP (max 3.2s at 100% HP)',
          'UI elements shift position',
          'Player actions delayed — must predict windows',
        ],
        defeatCondition: 'Reduce HP below 66% by acting within the delay windows',
        dialogueEvent: {
          speaker: 'SYSTEM_VOICE',
          text: 'Correction applied.',
          effect: 'Controls invert for 4 seconds — use Override to cancel',
        },
      },
      {
        phase: 2,
        name: 'Perception',
        layer: 'ILLUSION',
        mechanics: [
          'Boss spawns 3 fake clones — only one is real',
          'Invisible attacks from off-screen directions',
          'Toggle Perception Mode to identify real boss',
          'Real boss becomes slightly distorted in Perception View',
        ],
        defeatCondition: 'Reduce real boss HP to 33%',
        dialogueEvent: {
          speaker: 'SYSTEM_VOICE',
          text: 'Reality correction in progress.',
          effect: 'All clones become real temporarily — use See Through to identify original',
        },
      },
      {
        phase: 3,
        name: 'Identity',
        layer: 'PSYCHOLOGICAL',
        mechanics: [
          'The Copy fights the player alongside the boss',
          'Dialogue choices mid-fight change the Copy\'s allegiance',
          'Correct dialogue: Copy turns against the boss',
          'Wrong dialogue: Copy increases boss damage by 40%',
        ],
        defeatCondition: 'Correct dialogue sequence + final strike',
        dialogueSequence: [
          {
            speaker: 'COPY',
            text: "You've been letting them control you.",
            choices: [
              { label: 'I know.', outcome: 'Copy pauses — alignment increases' },
              { label: 'So have you.', outcome: 'Copy turns on the boss — Phase 3 shortcut' },
              { label: 'Stay out of this.', outcome: 'Copy attacks player — alignment drops' },
            ],
          },
        ],
      },
    ],
  },
];

// ── PROGRESSION SYSTEM ────────────────────────────────────────────────────────

export const PROGRESSION_SYSTEM = {
  id: 'progression',
  label: 'Leveling = Understanding',
  description: 'Abilities are not unlocked by XP. They are unlocked by decisions, pattern recognition, and surviving mechanics.',
  unlockMethods: [
    { method: 'decision', description: 'Making a specific dialogue choice under pressure' },
    { method: 'survival', description: 'Surviving a mechanic without using a safety option' },
    { method: 'recognition', description: 'Recognizing an enemy pattern before being hit by it 3 times' },
  ],
  memoryFragments: {
    description: 'Currency of understanding. Earned by completing narrative objectives, not kills.',
    uses: [
      'Upgrade abilities (extend duration, reduce cooldown)',
      'Unlock hidden dialogue options',
      'Stabilize identity — increase baseline Control',
      'Reveal hidden paths in Perception View',
    ],
    sources: [
      'Completing a quest dialogue correctly',
      'Detecting a Virus lie',
      'Breaking a Loop Sentinel pattern',
      'Refusing the false peace',
      'Using unpredictability against a Copy enemy',
    ],
  },
};

// ── CHOICE IMPACT MATRIX ──────────────────────────────────────────────────────

export const CHOICE_IMPACT_MATRIX = [
  {
    system: 'Combat',
    aggressive: 'Fast, high damage, low Control, pattern-predictable',
    stable: 'Slower, reliable, adaptive, pattern-unpredictable',
    hybrid: 'Situational — Artemis dialogue timing + Split Action',
  },
  {
    system: 'Copy',
    aggressive: 'Ally (DOMINATED) — uncontrolled power',
    stable: 'Controlled or Integrated — reliable partner',
    hybrid: 'Separated — commands with occasional disagreement',
  },
  {
    system: 'Artemis',
    aggressive: 'Fading — less Anchor Field, shorter Clarity Pulse',
    stable: 'Strong — all abilities at full strength',
    hybrid: 'Situational — strength tied to arc progression',
  },
  {
    system: 'Reality',
    aggressive: 'Distorted — more enemies visible in Perception, more cost',
    stable: 'Stable — Virus entities detectable, loop seams readable',
    hybrid: 'Balanced — both views available with moderate penalty',
  },
];

// ── FINAL ARC GAMEPLAY (46–50) ─────────────────────────────────────────────────

export const FINAL_ARC_GAMEPLAY = {
  arcId: 'arc_10',
  description: 'No forced mechanics. No distortion unless chosen. Player defines the gameplay style.',
  mechanics: [
    'All prior arc mechanics available — none mandatory',
    'Control Meter defaults to 90 (ten arcs of accumulated stability)',
    'Perception View no longer costs distortion penalty',
    'Copy in Arc 9 configuration — at its most coherent',
    'Artemis at 100% strength',
  ],
  finalFightVariants: [
    {
      style: 'Aggressive',
      description: 'Player chooses speed and damage. Fast combat, lower Control use.',
      finalEntityResponse: 'Final Entity uses defensive and evasion mechanics — was not built for this speed',
    },
    {
      style: 'Defensive',
      description: 'Player chooses control-based. Every action deliberate.',
      finalEntityResponse: 'Final Entity uses offensive pressure — was not built for this patience',
    },
    {
      style: 'Balanced',
      description: 'Hybrid: Split Action + Artemis timing + Copy coordination.',
      finalEntityResponse: 'Final Entity cycles mechanics rapidly — cannot find a gap. Confusion window extends to 12 seconds.',
    },
  ],
  uiProgression: {
    virusArc:   'UI lies — health bars fake, control meter inverted',
    normalArcs: 'UI functions with minor distortion',
    finalArc:   'UI minimal — player mastery makes information redundant',
  },
};

// ── UI SYSTEM ─────────────────────────────────────────────────────────────────

export const DYNAMIC_UI = {
  elements: [
    { id: 'control_meter',        label: 'Control Meter',          position: 'bottom_left',  virusEffect: 'Inverted during Virus arc' },
    { id: 'perception_indicator', label: 'Perception Indicator',   position: 'top_right',    virusEffect: 'Shows wrong mode' },
    { id: 'copy_state',           label: 'Copy State Indicator',   position: 'top_left',     virusEffect: 'Shows ally when hostile, hostile when ally' },
    { id: 'reality_stability',    label: 'Reality Stability Bar',  position: 'top_center',   virusEffect: 'Flat line (fake stability) during Virus arc' },
  ],
  arcModifications: {
    virus_arc: [
      'UI lies — all displayed values unreliable',
      'Fake health bars show enemies as dead before they are',
      'Control Meter shows HIGH when actually LOW',
      'Body-knowledge (Control > 60) allows detection of UI lies',
    ],
    final_arc: [
      'UI becomes minimal — only essential information',
      'No distortion overlays',
      'Reality Stability Bar disappears — no longer needed',
      'Control Meter still present — now a choice to view it',
    ],
  },
};

// ── FULL GAMEPLAY MOMENT EXAMPLE ──────────────────────────────────────────────

export const EXAMPLE_GAMEPLAY_MOMENT = {
  arc: 'arc_5',
  scene: 'Virus Arc Combat',
  sequence: [
    {
      step: 1,
      event: 'System Voice',
      content: '"Correction applied."',
      mechanicEffect: 'Controls invert',
    },
    {
      step: 2,
      event: 'Artemis',
      content: '"Focus!"',
      mechanicEffect: 'Control regen activated',
    },
    {
      step: 3,
      event: 'Copy',
      content: '"Move now!"',
      mechanicEffect: 'Attack window opens (2.4s)',
    },
    {
      step: 4,
      event: 'Player Choice',
      content: null,
      choices: [
        { label: 'Stay calm', effect: 'Regain control — inverted controls end early, +15 Control' },
        { label: 'Rush',      effect: 'High damage during window — controls remain inverted, -20 Control' },
      ],
    },
  ],
};