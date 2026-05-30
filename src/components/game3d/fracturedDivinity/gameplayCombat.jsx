// ─────────────────────────────────────────────────────────────────────────────
// DIVIDED: RECLAMATION — Combat System
// Enemies are narrative archetypes; combat reflects psychological state
// ─────────────────────────────────────────────────────────────────────────────

import { GameState, modifyControl, setPlayerHP, isLowControl, addMemoryFragments } from './gameplayState';

// ── Enemy Archetypes ──────────────────────────────────────────────────────────

export const ENEMY_TYPES = {
  DISTORTION: {
    id: 'DISTORTION',
    name: 'Distortion',
    description: 'Glitch movement. Breaks animation rules. Teaches instability.',
    baseHP: 40,
    baseDamage: 8,
    arc: [1, 5],
    behavior: 'glitch',
    onHitEffect: () => modifyControl(-3),
    onDeath: () => addMemoryFragments(1),
  },
  REDIRECTOR: {
    id: 'REDIRECTOR',
    name: 'Redirector',
    description: 'Changes player direction mid-input. Represents interference.',
    baseHP: 55,
    baseDamage: 6,
    arc: [6, 10],
    behavior: 'redirect',
    onHitEffect: () => modifyControl(-5),
    onDeath: () => addMemoryFragments(2),
  },
  COPY_ENEMY: {
    id: 'COPY_ENEMY',
    name: 'Mirror Copy',
    description: 'Mirrors your abilities. Learns your patterns over time.',
    baseHP: 70,
    baseDamage: 10,
    arc: [11, 20],
    behavior: 'mirror',
    onHitEffect: () => modifyControl(-4),
    onDeath: () => addMemoryFragments(3),
  },
  VIRUS_ENTITY: {
    id: 'VIRUS_ENTITY',
    name: 'Virus Entity',
    description: 'Rewrites UI. Changes controls mid-fight. Fakes health bars.',
    baseHP: 80,
    baseDamage: 12,
    arc: [21, 25],
    behavior: 'virus',
    onHitEffect: () => modifyControl(-7),
    onDeath: () => addMemoryFragments(4),
  },
  LOOP_SENTINEL: {
    id: 'LOOP_SENTINEL',
    name: 'Loop Sentinel',
    description: 'Resets arena state. Forces repetition mechanics.',
    baseHP: 90,
    baseDamage: 9,
    arc: [31, 35],
    behavior: 'loop',
    onHitEffect: () => modifyControl(-6),
    onDeath: () => addMemoryFragments(4),
  },
  FAKE_GUARDIAN: {
    id: 'FAKE_GUARDIAN',
    name: 'Fake Kingdom Guardian',
    description: "Doesn't attack aggressively. Slows you, removes abilities, encourages giving up.",
    baseHP: 60,
    baseDamage: 4,
    arc: [26, 30],
    behavior: 'pacify',
    onHitEffect: () => modifyControl(-8),
    onDeath: () => addMemoryFragments(3),
  },
  FINAL_ENTITY: {
    id: 'FINAL_ENTITY',
    name: 'The Final Entity',
    description: 'Combines ALL mechanics. Changes rules mid-fight.',
    baseHP: 300,
    baseDamage: 15,
    arc: [46, 50],
    behavior: 'adaptive',
    phases: 3,
    onHitEffect: () => modifyControl(-5),
    onDeath: () => addMemoryFragments(20),
  },
};

// ── Enemy Instance ────────────────────────────────────────────────────────────

export class Enemy {
  constructor(typeId) {
    const def = ENEMY_TYPES[typeId];
    if (!def) throw new Error(`Unknown enemy type: ${typeId}`);
    Object.assign(this, def);
    this.maxHP = def.baseHP;
    this.currentHP = def.baseHP;
    this.phase = 1;
    this.patternHistory = []; // tracks player moves for mirror behavior
    this.alive = true;
  }

  receiveHit(damage) {
    this.currentHP = Math.max(0, this.currentHP - damage);
    if (this.currentHP <= 0) {
      this.alive = false;
      this.onDeath?.();
    }
    return { remaining: this.currentHP, killed: !this.alive };
  }

  performAttack() {
    this.onHitEffect?.();
    setPlayerHP(GameState.playerHP - this.baseDamage);
    return this.baseDamage;
  }

  advancePhase() {
    if (this.phases && this.phase < this.phases) {
      this.phase++;
      this.baseDamage = Math.round(this.baseDamage * 1.4);
      return true;
    }
    return false;
  }

  getPhaseThreshold() {
    if (!this.phases) return null;
    return Math.round(this.maxHP * (1 - (this.phase / this.phases)));
  }
}

// ── Player Combat ─────────────────────────────────────────────────────────────

export const ABILITIES = {
  strike: {
    id: 'strike',
    name: 'Strike',
    damage: 10,
    controlCost: 0,
    cooldown: 0,
    unlockArc: 1,
    description: 'Basic attack.',
  },
  dash: {
    id: 'dash',
    name: 'Dash',
    damage: 0,
    controlCost: 5,
    cooldown: 1,
    unlockArc: 1,
    description: 'Evade damage. Costs control.',
  },
  guard: {
    id: 'guard',
    name: 'Guard',
    damage: 0,
    controlCost: 0,
    cooldown: 0,
    unlockArc: 1,
    description: 'Block incoming damage.',
  },
  focus: {
    id: 'focus',
    name: 'Focus',
    damage: 0,
    controlCost: -20, // restores control
    cooldown: 3,
    unlockArc: 1,
    description: 'Restore control. Clears low-control effects.',
  },
  override: {
    id: 'override',
    name: 'Override',
    damage: 25,
    controlCost: 10,
    cooldown: 4,
    unlockArc: 5,
    description: 'Force control of environment briefly. Virus Arc unlock.',
  },
  see_through: {
    id: 'see_through',
    name: 'See Through',
    damage: 0,
    controlCost: 5,
    cooldown: 2,
    unlockArc: 3,
    description: 'Reveal hidden enemies. Illusion arc unlock.',
  },
  split_action: {
    id: 'split_action',
    name: 'Split Action',
    damage: 15,
    controlCost: 8,
    cooldown: 3,
    unlockArc: 4,
    description: 'Act twice — Player + Copy. Copy Arc unlock.',
  },
  anchor: {
    id: 'anchor',
    name: 'Anchor',
    damage: 0,
    controlCost: -10,
    cooldown: 5,
    unlockArc: 3,
    description: 'Stop time distortion. Artemis arc unlock.',
  },
};

export function calculatePlayerDamage(abilityId) {
  const ab = ABILITIES[abilityId];
  if (!ab) return 0;
  let dmg = ab.damage;

  // Copy state modifiers
  if (GameState.copyState === 'DOMINATED') dmg *= 2;
  if (GameState.copyState === 'INTEGRATED') dmg *= 1.15;

  // Control modifiers
  if (isLowControl()) dmg *= 0.5;
  if (GameState.control >= 80) dmg *= 1.1;

  return Math.round(dmg);
}

export function useAbility(abilityId, enemy) {
  if (!GameState.unlockedAbilities.includes(abilityId)) {
    return { ok: false, reason: 'not_unlocked' };
  }
  const ab = ABILITIES[abilityId];
  if (!ab) return { ok: false, reason: 'unknown_ability' };

  // Apply control cost/gain
  modifyControl(-ab.controlCost);

  if (ab.damage > 0 && enemy) {
    const dmg = calculatePlayerDamage(abilityId);
    const result = enemy.receiveHit(dmg);

    // Check phase advance
    const threshold = enemy.getPhaseThreshold();
    if (threshold !== null && enemy.currentHP <= threshold && enemy.alive) {
      enemy.advancePhase();
    }

    return { ok: true, damage: dmg, ...result };
  }

  return { ok: true, damage: 0 };
}

// ── Dialogue Combat Triggers ──────────────────────────────────────────────────

export const DIALOGUE_TRIGGERS = {
  virus_correction: {
    id: 'virus_correction',
    arc: 5,
    prompt: 'SYSTEM: "Correction applied."',
    effect: 'Controls invert temporarily.',
    choices: [
      { text: 'Resist', tone: 'RESOLVE',    controlDelta: +10, label: 'Stay calm → regain control' },
      { text: 'Submit', tone: 'OPPRESSION', controlDelta: -15, label: 'Rush → high damage, low stability' },
    ],
  },
  fake_kingdom_letgo: {
    id: 'fake_kingdom_letgo',
    arc: 6,
    prompt: 'FIGURE: "Let go."',
    effect: 'Acceptance removes abilities temporarily.',
    choices: [
      { text: 'Accept', tone: 'OPPRESSION', flag: 'accepted_peace',  controlDelta: -20, label: 'Lose abilities temporarily' },
      { text: 'Reject', tone: 'RESOLVE',    flag: 'rejected_peace',  controlDelta: +10, label: 'Gain damage but instability' },
    ],
  },
  judgment_loop: {
    id: 'judgment_loop',
    arc: 7,
    prompt: 'SYSTEM: "Cycle maintained."',
    effect: 'Combat resets if player repeats the same move pattern.',
    choices: [
      { text: 'Change pattern', tone: 'AWAKENING', controlDelta: +5,  label: 'Break the loop' },
      { text: 'Repeat',         tone: 'DREAD',     controlDelta: -10, label: 'Strengthen the loop' },
    ],
  },
  copy_override: {
    id: 'copy_override',
    arc: 4,
    prompt: 'COPY: "I\'ll do it."',
    effect: 'Copy takes over combat briefly, or player gains control boost.',
    choices: [
      { text: 'Let Copy act', tone: 'RESOLVE',    controlDelta: -5,  label: 'AI takes over briefly' },
      { text: 'Refuse',       tone: 'AUTHORITY',  controlDelta: +15, label: 'Control boost' },
    ],
  },
  artemis_anchor: {
    id: 'artemis_anchor',
    arc: 3,
    prompt: 'ARTEMIS: "Stay with me."',
    effect: 'Activates control regen + reduced distortion.',
    choices: [
      { text: 'Stay with her', tone: 'RESOLVE', controlDelta: +20, artemisEffect: 'anchor_active', label: 'Control regen + stability' },
      { text: 'Push forward',  tone: 'RESOLVE', controlDelta: -5,  label: 'Aggressive but costs stability' },
    ],
  },
};

// ── Boss Structure ────────────────────────────────────────────────────────────

export const BOSS_DEFINITIONS = {
  system_core: {
    id: 'system_core',
    name: 'The System Core',
    arc: [1, 10],
    phases: [
      {
        phase: 1,
        name: 'Control',
        description: 'Input delay. UI manipulation.',
        mechanics: ['input_delay', 'ui_corrupt'],
      },
      {
        phase: 2,
        name: 'Perception',
        description: 'Fake clones. Invisible attacks.',
        mechanics: ['fake_clones', 'invisible_attacks'],
      },
      {
        phase: 3,
        name: 'Identity',
        description: 'Copy fights you. Dialogue determines outcome.',
        mechanics: ['copy_fight', 'dialogue_gate'],
      },
    ],
  },
  final_remnant: {
    id: 'final_remnant',
    name: 'The Final Remnant',
    arc: [46, 50],
    phases: [
      { phase: 1, name: 'Composite', description: 'Uses all prior arc mechanics.', mechanics: ['all'] },
      { phase: 2, name: 'Rule Break', description: 'Changes rules mid-fight.', mechanics: ['rule_change'] },
      { phase: 3, name: 'Mirror', description: 'Reflects player identity configuration back.', mechanics: ['identity_mirror'] },
    ],
  },
};