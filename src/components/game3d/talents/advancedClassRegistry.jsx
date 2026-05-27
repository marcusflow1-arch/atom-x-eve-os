// ─── Advanced Class Registry ────────────────────────────────────────────────
// Canonical source of truth for all advanced weapon specialization classes.
// Architecture supports: legendary, hidden, subclass, dual-spec, prestige, PvP classes.

export const WEAPON_TYPES = {
  SWORD:    'sword',
  GUARDIAN: 'guardian',
  RANGED:   'ranged',
};

// ── CLASS TIERS ──────────────────────────────────────────────────────────────
export const CLASS_TIER = {
  BASE:      'base',
  ADVANCED:  'advanced',
  LEGENDARY: 'legendary',
  HIDDEN:    'hidden',
  PRESTIGE:  'prestige',
  PVP:       'pvp',
};

// ── AURA / VFX KEYS ──────────────────────────────────────────────────────────
// Referenced by advancedClassEffects.js — extend freely
export const AURA_FX = {
  BLUE_PRECISION:  'blue_precision',
  GREEN_TACTICAL:  'green_tactical',
  RED_EXPLOSIVE:   'red_explosive',
  PURPLE_SHADOW:   'purple_shadow',
  CRIMSON_RAGE:    'crimson_rage',
  CYAN_DANCE:      'cyan_dance',
  DARK_EXECUTE:    'dark_execute',
  BLOOD_CRIMSON:   'blood_crimson',
  GOLD_FORTRESS:   'gold_fortress',
  SILVER_COUNTER:  'silver_counter',
  IRON_JUGGERNAUT: 'iron_juggernaut',
  HOLY_PALADIN:    'holy_paladin',
};

// ─────────────────────────────────────────────────────────────────────────────
// RANGED — Bow / Archery
// ─────────────────────────────────────────────────────────────────────────────
const RANGED_CLASSES = [
  {
    class_id: 'sniper',
    weapon_type: WEAPON_TYPES.RANGED,
    tier: CLASS_TIER.ADVANCED,
    display_name: 'Sniper',
    tagline: 'One Shot. One Kill.',
    description: 'Long-range precision combatant. Trades fire rate for devastating single-shot damage and guaranteed weakpoint bonuses.',
    color: '#3b82f6',
    icon: '🎯',
    passive_bonuses: {
      crit_chance: 0.15,
      crit_damage: 0.40,
      weakspot_damage: 0.25,
      attack_speed: -0.15,
      projectile_speed: 0.50,
      range_bonus: 0.30,
    },
    skill_modifiers: {
      projectile_speed: 2.0,
      charge_damage: 1.5,
      piercing: true,
      fire_rate_penalty: 0.60,
    },
    playstyle_tags: ['Precision', 'Long Range', 'High Damage', 'Slow'],
    unlock_effects: {
      aura: AURA_FX.BLUE_PRECISION,
      projectile_vfx: 'sniper_trail',
      class_title: 'Sniper',
    },
    flavor_text: '"The distance between you and your target is your greatest weapon."',
  },
  {
    class_id: 'tactical_expert',
    weapon_type: WEAPON_TYPES.RANGED,
    tier: CLASS_TIER.ADVANCED,
    display_name: 'Tactical Expert',
    tagline: 'Control the Battlefield.',
    description: 'Utility-focused ranger who controls zones with traps, mines, and AoE arrows. Excels in group content and coordinated combat.',
    color: '#10b981',
    icon: '🧭',
    passive_bonuses: {
      trap_damage: 0.35,
      explosive_damage: 0.20,
      cooldown_reduction: 0.15,
      dodge_chance: 0.10,
      utility_range: 0.25,
    },
    skill_modifiers: {
      can_deploy_mines: true,
      can_deploy_traps: true,
      aoe_arrows: true,
      trap_cooldown_reduction: 0.30,
    },
    playstyle_tags: ['Utility', 'AoE', 'Control', 'Support'],
    unlock_effects: {
      aura: AURA_FX.GREEN_TACTICAL,
      projectile_vfx: 'tactical_arrow',
      class_title: 'Tactician',
    },
    flavor_text: '"Every battlefield is a puzzle. I just solve them faster than the enemy can react."',
  },
  {
    class_id: 'explosive_archer',
    weapon_type: WEAPON_TYPES.RANGED,
    tier: CLASS_TIER.ADVANCED,
    display_name: 'Explosive Archer',
    tagline: 'Destruction at Range.',
    description: 'Chaos-specialist who fires explosive arrows with massive AoE damage. Devastating against groups but costly in stamina.',
    color: '#f97316',
    icon: '💥',
    passive_bonuses: {
      explosive_damage: 0.45,
      aoe_radius: 0.30,
      bleed_chance: 0.10,
      stamina_cost: 0.20,
      crit_chance: 0.05,
    },
    skill_modifiers: {
      arrows_explode_on_impact: true,
      chain_explosion: true,
      knockback_multiplier: 1.5,
    },
    playstyle_tags: ['AoE', 'Explosive', 'High Stamina', 'Crowd Control'],
    unlock_effects: {
      aura: AURA_FX.RED_EXPLOSIVE,
      projectile_vfx: 'explosive_bolt',
      class_title: 'Bomber',
    },
    flavor_text: '"Why shoot one when you can blow up twenty?"',
  },
  {
    class_id: 'shadow_ranger',
    weapon_type: WEAPON_TYPES.RANGED,
    tier: CLASS_TIER.ADVANCED,
    display_name: 'Shadow Ranger',
    tagline: 'Strike from Darkness.',
    description: 'Assassin-hybrid who combines archery with shadow movement. Deals massive damage from stealth and applies poison on hit.',
    color: '#8b5cf6',
    icon: '🌑',
    passive_bonuses: {
      dodge_chance: 0.20,
      bleed_chance: 0.15,
      hit_chance: 0.10,
      stealth_damage_bonus: 0.50,
      stamina_regen: 0.20,
    },
    skill_modifiers: {
      poison_on_hit: true,
      shadow_step_available: true,
      stealth_shot_multiplier: 2.0,
    },
    playstyle_tags: ['Stealth', 'Burst', 'Mobility', 'Poison'],
    unlock_effects: {
      aura: AURA_FX.PURPLE_SHADOW,
      projectile_vfx: 'shadow_bolt',
      class_title: 'Shadow Ranger',
    },
    flavor_text: '"They never see the arrow until they\'re already dead."',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SWORD — Damage
// ─────────────────────────────────────────────────────────────────────────────
const SWORD_CLASSES = [
  {
    class_id: 'berserker',
    weapon_type: WEAPON_TYPES.SWORD,
    tier: CLASS_TIER.ADVANCED,
    display_name: 'Berserker',
    tagline: 'Rage is Power.',
    description: 'High-risk damage dealer who ignores defense to deal catastrophic melee damage. Life steal and rage mechanics keep them alive.',
    color: '#ef4444',
    icon: '🔥',
    passive_bonuses: {
      crit_chance: 0.20,
      crit_damage: 0.50,
      life_steal: 0.15,
      defense: -0.20,
      attack_speed: 0.20,
      rage_gain: 0.25,
    },
    skill_modifiers: {
      rage_mechanic: true,
      life_steal_on_hit: true,
      fury_stacks: 5,
      berserker_mode_multiplier: 2.0,
    },
    playstyle_tags: ['High DPS', 'Life Steal', 'Rage', 'Glass Cannon'],
    unlock_effects: {
      aura: AURA_FX.CRIMSON_RAGE,
      projectile_vfx: null,
      class_title: 'Berserker',
    },
    flavor_text: '"Pain is fuel. Fear is weakness. Rage is everything."',
  },
  {
    class_id: 'blade_dancer',
    weapon_type: WEAPON_TYPES.SWORD,
    tier: CLASS_TIER.ADVANCED,
    display_name: 'Blade Dancer',
    tagline: 'Grace in Combat.',
    description: 'Elegant combatant who chains fluid attack combos with evasion. High dodge chance and combo multipliers reward precise play.',
    color: '#06b6d4',
    icon: '💫',
    passive_bonuses: {
      dodge_chance: 0.25,
      attack_speed: 0.25,
      combo_multiplier: 0.30,
      stamina_use: -0.15,
      crit_chance: 0.10,
    },
    skill_modifiers: {
      combo_system: true,
      dodge_counters: true,
      chain_attacks: 4,
      evasion_damage_bonus: 0.35,
    },
    playstyle_tags: ['Combo', 'Mobile', 'Dodge', 'Technical'],
    unlock_effects: {
      aura: AURA_FX.CYAN_DANCE,
      projectile_vfx: null,
      class_title: 'Blade Dancer',
    },
    flavor_text: '"Every step, every strike — a dance only I know the ending to."',
  },
  {
    class_id: 'executioner',
    weapon_type: WEAPON_TYPES.SWORD,
    tier: CLASS_TIER.ADVANCED,
    display_name: 'Executioner',
    tagline: 'Judge, Jury, Death.',
    description: 'Specializes in eliminating weakened enemies. Executes deal massively amplified damage to targets below 30% HP.',
    color: '#a855f7',
    icon: '⚖️',
    passive_bonuses: {
      execute_threshold: 0.30,
      execute_damage: 0.80,
      crit_damage: 0.35,
      cooldown_reduction: 0.10,
      bleed_chance: 0.20,
    },
    skill_modifiers: {
      execute_ability: true,
      low_hp_damage_amp: 1.8,
      death_mark: true,
    },
    playstyle_tags: ['Execute', 'Burst', 'Single Target', 'Finishing'],
    unlock_effects: {
      aura: AURA_FX.DARK_EXECUTE,
      projectile_vfx: null,
      class_title: 'Executioner',
    },
    flavor_text: '"The last 30% of a fight is where I truly begin."',
  },
  {
    class_id: 'blood_knight',
    weapon_type: WEAPON_TYPES.SWORD,
    tier: CLASS_TIER.ADVANCED,
    display_name: 'Blood Knight',
    tagline: 'Blood Fuels the Blade.',
    description: 'Dark warrior who sacrifices HP to power devastating attacks. Can drain life from enemies to sustain the blood cost.',
    color: '#dc2626',
    icon: '🩸',
    passive_bonuses: {
      life_steal: 0.25,
      hp_to_damage_ratio: 0.20,
      bleed_chance: 0.30,
      elemental_scaling: 0.20,
      crit_chance: 0.12,
    },
    skill_modifiers: {
      blood_cost_abilities: true,
      blood_drain: true,
      crimson_blade_passive: true,
      self_sacrifice_multiplier: 1.5,
    },
    playstyle_tags: ['Life Steal', 'Dark', 'Sustain', 'High Risk'],
    unlock_effects: {
      aura: AURA_FX.BLOOD_CRIMSON,
      projectile_vfx: null,
      class_title: 'Blood Knight',
    },
    flavor_text: '"My wounds are not weakness — they are ammunition."',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GUARDIAN — Double Blades / Defense
// ─────────────────────────────────────────────────────────────────────────────
const GUARDIAN_CLASSES = [
  {
    class_id: 'fortress_tank',
    weapon_type: WEAPON_TYPES.GUARDIAN,
    tier: CLASS_TIER.ADVANCED,
    display_name: 'Fortress Tank',
    tagline: 'Immovable. Unstoppable.',
    description: 'Defensive anchor who absorbs enormous damage and generates threat for allies. Taunt aura and reflect mechanics punish attackers.',
    color: '#f59e0b',
    icon: '🏰',
    passive_bonuses: {
      defense: 0.40,
      hp_scaling: 0.30,
      shield_scaling: 0.35,
      block_chance: 0.25,
      reflect_damage: 0.15,
      cc_resistance: 0.50,
    },
    skill_modifiers: {
      taunt_aura: true,
      reflect_on_block: true,
      fortify_stance: true,
      shield_wall_multiplier: 2.0,
    },
    playstyle_tags: ['Tank', 'Block', 'Reflect', 'Taunt'],
    unlock_effects: {
      aura: AURA_FX.GOLD_FORTRESS,
      projectile_vfx: null,
      class_title: 'Fortress',
    },
    flavor_text: '"Break yourself against me. I have nowhere to fall."',
  },
  {
    class_id: 'counter_fighter',
    weapon_type: WEAPON_TYPES.GUARDIAN,
    tier: CLASS_TIER.ADVANCED,
    display_name: 'Counter Fighter',
    tagline: 'Turn Defense into Death.',
    description: 'Martial technician who reads enemy attacks and delivers punishing counters. Every blocked attack becomes a lethal opportunity.',
    color: '#6366f1',
    icon: '🥊',
    passive_bonuses: {
      block_chance: 0.20,
      counter_damage: 0.50,
      dodge_chance: 0.15,
      attack_speed: 0.15,
      stamina_regen: 0.20,
    },
    skill_modifiers: {
      counter_system: true,
      parry_window: 0.3,
      counter_multiplier: 2.5,
      perfect_block_stun: true,
    },
    playstyle_tags: ['Counter', 'Parry', 'Technical', 'Reactive'],
    unlock_effects: {
      aura: AURA_FX.SILVER_COUNTER,
      projectile_vfx: null,
      class_title: 'Counter Fighter',
    },
    flavor_text: '"I don\'t dodge attacks. I redirect them."',
  },
  {
    class_id: 'juggernaut',
    weapon_type: WEAPON_TYPES.GUARDIAN,
    tier: CLASS_TIER.ADVANCED,
    display_name: 'Juggernaut',
    tagline: 'Nothing Stops the Charge.',
    description: 'Unstoppable offensive tank who combines raw defense with brutal charge attacks. Momentum builds into devastating slams.',
    color: '#78716c',
    icon: '🦏',
    passive_bonuses: {
      defense: 0.25,
      hp_scaling: 0.20,
      charge_damage: 0.45,
      cc_resistance: 0.60,
      stamina_use: 0.15,
      knockback_power: 0.40,
    },
    skill_modifiers: {
      charge_ability: true,
      unstoppable_passive: true,
      momentum_stacks: 5,
      impact_multiplier: 1.8,
    },
    playstyle_tags: ['Charge', 'CC Immune', 'Momentum', 'Brawler'],
    unlock_effects: {
      aura: AURA_FX.IRON_JUGGERNAUT,
      projectile_vfx: null,
      class_title: 'Juggernaut',
    },
    flavor_text: '"Walls don\'t stop me. Neither do you."',
  },
  {
    class_id: 'paladin',
    weapon_type: WEAPON_TYPES.GUARDIAN,
    tier: CLASS_TIER.ADVANCED,
    display_name: 'Paladin',
    tagline: 'Light is the Sharpest Blade.',
    description: 'Holy warrior who combines defense with divine offence. Heals allies, smites enemies with holy damage, and radiates protective auras.',
    color: '#fbbf24',
    icon: '⛪',
    passive_bonuses: {
      defense: 0.20,
      hp_scaling: 0.15,
      elemental_scaling: 0.35,
      block_chance: 0.15,
      cooldown_reduction: 0.15,
      summon_strength: 0.20,
    },
    skill_modifiers: {
      holy_smite: true,
      divine_shield: true,
      aura_heal: true,
      judgment_multiplier: 1.6,
    },
    playstyle_tags: ['Holy', 'Support', 'Defense', 'Hybrid'],
    unlock_effects: {
      aura: AURA_FX.HOLY_PALADIN,
      projectile_vfx: 'holy_bolt',
      class_title: 'Paladin',
    },
    flavor_text: '"Faith is armor. Righteousness is the edge."',
  },
];

// ─── MASTER REGISTRY ─────────────────────────────────────────────────────────
export const ADVANCED_CLASS_REGISTRY = [
  ...RANGED_CLASSES,
  ...SWORD_CLASSES,
  ...GUARDIAN_CLASSES,
];

// ── Lookup helpers ────────────────────────────────────────────────────────────
export const getClassesForWeapon = (weaponType) =>
  ADVANCED_CLASS_REGISTRY.filter((c) => c.weapon_type === weaponType);

export const getClassById = (classId) =>
  ADVANCED_CLASS_REGISTRY.find((c) => c.class_id === classId) || null;

// Maps mastery weapon IDs → advanced weapon type keys
// Extend this as new weapons are added
export const MASTERY_WEAPON_TO_ADVANCED_TYPE = {
  // damage weapons → sword
  sword:       WEAPON_TYPES.SWORD,
  greatsword:  WEAPON_TYPES.SWORD,
  katana:      WEAPON_TYPES.SWORD,
  spear:       WEAPON_TYPES.SWORD,
  // defense weapons → guardian
  guardian:    WEAPON_TYPES.GUARDIAN,
  shield:      WEAPON_TYPES.GUARDIAN,
  dual_blades: WEAPON_TYPES.GUARDIAN,
  // ranged weapons → ranged
  bow:         WEAPON_TYPES.RANGED,
  ranged:      WEAPON_TYPES.RANGED,
  crossbow:    WEAPON_TYPES.RANGED,
};

export const resolveAdvancedWeaponType = (masteryWeaponId) => {
  if (!masteryWeaponId) return null;
  const id = masteryWeaponId.toLowerCase();
  // Direct match
  if (MASTERY_WEAPON_TO_ADVANCED_TYPE[id]) return MASTERY_WEAPON_TO_ADVANCED_TYPE[id];
  // Fuzzy match
  if (id.includes('bow') || id.includes('range') || id.includes('arrow') || id.includes('crossbow')) return WEAPON_TYPES.RANGED;
  if (id.includes('shield') || id.includes('guardian') || id.includes('dual') || id.includes('defense')) return WEAPON_TYPES.GUARDIAN;
  if (id.includes('sword') || id.includes('blade') || id.includes('saber') || id.includes('katana')) return WEAPON_TYPES.SWORD;
  return WEAPON_TYPES.SWORD; // fallback
};