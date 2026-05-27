// ─── Advanced Class Skills ───────────────────────────────────────────────────
// Maps advanced classes to their signature skill modifiers and special abilities.

import { getActiveSkillModifiers, getSelectedClass } from './advancedClassStore';

/**
 * Returns all active skill modifiers for the given weapon type's selected class.
 */
export const getActiveClassSkills = (weaponType) =>
  getActiveSkillModifiers(weaponType);

/**
 * Skill modifier descriptions — shown in the UI and used by the skill execution pipeline.
 */
export const SKILL_MOD_DESCRIPTIONS = {
  // Sniper
  piercing:                   { label: 'Piercing Arrows',       desc: 'Arrows pass through enemies.' },
  charge_damage:               { label: 'Charged Shot',          desc: 'Holding attack charges for bonus damage.' },
  fire_rate_penalty:           { label: 'Slow Draw',             desc: 'Attack speed reduced for power.' },

  // Tactical Expert
  can_deploy_mines:            { label: 'Mine Deployment',       desc: 'Can place explosive mines.' },
  can_deploy_traps:            { label: 'Trap Deployment',       desc: 'Can place snare traps.' },
  aoe_arrows:                  { label: 'Scatter Shot',          desc: 'Arrows deal AoE on impact.' },

  // Explosive Archer
  arrows_explode_on_impact:    { label: 'Explosive Arrows',      desc: 'Arrows explode on contact.' },
  chain_explosion:             { label: 'Chain Reaction',        desc: 'Explosions can trigger chain blasts.' },

  // Shadow Ranger
  poison_on_hit:               { label: 'Venom Tip',             desc: 'Attacks apply poison.' },
  shadow_step_available:       { label: 'Shadow Step',           desc: 'Unlocks shadow teleport ability.' },

  // Berserker
  rage_mechanic:               { label: 'Rage System',           desc: 'Build rage stacks for power boosts.' },
  life_steal_on_hit:           { label: 'Life Steal',            desc: 'Recover HP with every hit.' },
  berserker_mode_multiplier:   { label: 'Berserker Mode',        desc: 'At max rage, damage is doubled.' },

  // Blade Dancer
  combo_system:                { label: 'Combo Chains',          desc: 'Chain attacks multiply damage.' },
  dodge_counters:              { label: 'Dodge Counter',         desc: 'Dodges open counter windows.' },

  // Executioner
  execute_ability:             { label: 'Execute',               desc: 'Instantly slay enemies below threshold.' },
  death_mark:                  { label: 'Death Mark',            desc: 'Mark targets for increased damage.' },

  // Blood Knight
  blood_cost_abilities:        { label: 'Blood Cost Skills',     desc: 'Spend HP to fuel powerful attacks.' },
  blood_drain:                 { label: 'Blood Drain',           desc: 'Drain life from enemies.' },
  crimson_blade_passive:       { label: 'Crimson Edge',          desc: 'Blade deals extra bleed damage.' },

  // Fortress Tank
  taunt_aura:                  { label: 'Taunt Aura',            desc: 'Force nearby enemies to target you.' },
  reflect_on_block:            { label: 'Damage Reflect',        desc: 'Blocked damage is returned to attacker.' },
  fortify_stance:              { label: 'Fortify',               desc: 'Enter stance to gain massive defense.' },

  // Counter Fighter
  counter_system:              { label: 'Counter System',        desc: 'Perfect blocks allow devastating counters.' },
  perfect_block_stun:          { label: 'Perfect Block Stun',    desc: 'Perfect blocks stun attackers.' },

  // Juggernaut
  charge_ability:              { label: 'Battle Charge',         desc: 'Charge forward, knocking back enemies.' },
  unstoppable_passive:         { label: 'Unstoppable',           desc: 'Cannot be staggered while moving.' },

  // Paladin
  holy_smite:                  { label: 'Holy Smite',            desc: 'Strike with divine lightning.' },
  divine_shield:               { label: 'Divine Shield',         desc: 'Absorb all damage for 3 seconds.' },
  aura_heal:                   { label: 'Aura of Restoration',   desc: 'Passively heal nearby allies.' },
};

/**
 * Returns active skill modifier entries formatted for UI display.
 */
export const getSkillModSummary = (weaponType) => {
  const mods = getActiveSkillModifiers(weaponType);
  if (!mods || Object.keys(mods).length === 0) return [];

  return Object.entries(mods)
    .filter(([, v]) => v !== false && v !== undefined && v !== null)
    .map(([key, value]) => {
      const meta = SKILL_MOD_DESCRIPTIONS[key];
      return {
        key,
        label: meta?.label || key.replace(/_/g, ' '),
        desc:  meta?.desc  || '',
        value,
        isBoolean: typeof value === 'boolean',
        isNumeric: typeof value === 'number',
      };
    });
};