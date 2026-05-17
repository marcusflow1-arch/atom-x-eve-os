// ─── Skill Registry — Single Source of Truth ───────────────────────────
// Every skill in the game is defined here, exactly once, with a strict
// schema. There are no duplicate ids, no overlapping definitions, no
// hidden fallbacks. Keyed by skill_id.
//
// REQUIRED FIELDS (every skill):
//   skill_id           string  — unique
//   skill_name         string
//   skill_type         SKILL_TYPE
//   weapon_type        WEAPON_TYPE | null   (null = no weapon lock)
//   cast_type          CAST_TYPE
//   hit_count          number  (1 for single, N for multi, 0 for self-cast / passive)
//   hit_delay          number  seconds between hits (0 if not applicable)
//   cooldown           number  seconds
//   duration           number  seconds (0 if instant/permanent)
//   max_level          number
//   scaling            object  { stat: { min, max } }  // value at level 1 → max_level
//   icon               string  emoji or asset ref
//   description        string
//
// OPTIONAL:
//   animation_ref      string  // hooks into existing animation system
//   vfx_ref            string  // hooks into existing FX system

import { SKILL_TYPE, WEAPON_TYPE, CAST_TYPE } from './skillTypes';

const SKILLS = [
  // ════════ SWORD WEAPON TYPE ════════════════════════════════════════
  {
    skill_id: 'sword_heavy_strike',
    skill_name: 'Heavy Strike',
    skill_type: SKILL_TYPE.ACTIVE_ATTACK,
    weapon_type: WEAPON_TYPE.SWORD,
    cast_type: CAST_TYPE.SINGLE_HIT,
    hit_count: 1,
    hit_delay: 0,
    cooldown: 4.0,
    duration: 0,
    max_level: 10,
    scaling: { damage_pct: { min: 1.30, max: 1.80 } },
    icon: '🗡️',
    description: 'One heavy overhead strike that scales with sword damage.',
    animation_ref: 'sword_heavy',
    vfx_ref: 'slash_heavy',
  },
  {
    skill_id: 'sword_triple_slash',
    skill_name: 'Triple Slash',
    skill_type: SKILL_TYPE.ACTIVE_ATTACK,
    weapon_type: WEAPON_TYPE.SWORD,
    cast_type: CAST_TYPE.MULTI_HIT_SEQUENTIAL,
    hit_count: 3,
    hit_delay: 0.5,                 // 0.5s between each hit
    cooldown: 8.0,
    duration: 0,
    max_level: 10,
    scaling: { damage_pct: { min: 0.90, max: 1.20 } }, // per hit
    icon: '⚔️',
    description: 'Three consecutive sword strikes, each 0.5s apart.',
    animation_ref: 'sword_combo',
    vfx_ref: 'slash_combo',
  },

  // ════════ GUARDIAN / FIST WEAPON TYPE ══════════════════════════════
  {
    skill_id: 'guardian_crushing_blow',
    skill_name: 'Crushing Blow',
    skill_type: SKILL_TYPE.ACTIVE_ATTACK,
    weapon_type: WEAPON_TYPE.GUARDIAN,
    cast_type: CAST_TYPE.SINGLE_HIT,
    hit_count: 1,
    hit_delay: 0,
    cooldown: 4.0,
    duration: 0,
    max_level: 10,
    scaling: { damage_pct: { min: 1.20, max: 1.70 }, defense_scale: { min: 0.30, max: 0.60 } },
    icon: '🛡️',
    description: 'A defense-scaled crushing strike — bonus damage from your defense stat.',
    animation_ref: 'guardian_heavy',
    vfx_ref: 'impact_heavy',
  },
  {
    skill_id: 'guardian_twin_fang',
    skill_name: 'Twin Fang Combo',
    skill_type: SKILL_TYPE.ACTIVE_ATTACK,
    weapon_type: WEAPON_TYPE.GUARDIAN,
    cast_type: CAST_TYPE.MULTI_HIT_BURST,
    hit_count: 4,
    hit_delay: 0.5,                 // delay BEFORE hit 3 (after the burst pair)
    burst_delay: 0.08,              // delay between the first two near-simultaneous hits
    follow_up_delay: 0.4,           // delay between hit 3 and the final hit 4
    cooldown: 8.0,
    duration: 0,
    max_level: 10,
    scaling: { damage_pct: { min: 0.90, max: 1.10 } }, // per hit
    icon: '👊',
    description: 'First two hits land almost simultaneously, then a third hit, then a final follow-up hit.',
    animation_ref: 'guardian_combo',
    vfx_ref: 'impact_combo',
  },

  // ════════ RANGED WEAPON TYPE ═══════════════════════════════════════
  {
    skill_id: 'ranged_double_shot',
    skill_name: 'Double Shot',
    skill_type: SKILL_TYPE.ACTIVE_ATTACK,
    weapon_type: WEAPON_TYPE.RANGED,
    cast_type: CAST_TYPE.RANGED_DOUBLE,
    hit_count: 2,
    hit_delay: 0.2,                 // brief gap between the two projectiles
    cooldown: 4.0,
    duration: 0,
    max_level: 10,
    scaling: { damage_pct: { min: 1.10, max: 1.50 } },
    icon: '🏹',
    description: 'Fires two projectiles, the second following shortly after the first.',
    animation_ref: 'ranged_double',
    vfx_ref: 'arrow_double',
  },
  {
    skill_id: 'ranged_barrage',
    skill_name: 'Barrage',
    skill_type: SKILL_TYPE.ACTIVE_ATTACK,
    weapon_type: WEAPON_TYPE.RANGED,
    cast_type: CAST_TYPE.RANGED_BARRAGE,
    hit_count: 5,
    hit_delay: 0.3,                 // 0.3s between each shot
    cooldown: 10.0,
    duration: 0,
    max_level: 10,
    scaling: { damage_pct: { min: 0.80, max: 1.10 } }, // per shot
    icon: '🌪️',
    description: 'Five rapid ranged shots, each 0.3s apart.',
    animation_ref: 'ranged_barrage',
    vfx_ref: 'arrow_barrage',
  },

  // ════════ ACTIVE BUFFS (universal — usable with any weapon) ════════
  {
    skill_id: 'heavens_riposte',
    skill_name: "Heaven's Riposte",
    skill_type: SKILL_TYPE.ACTIVE_BUFF,
    weapon_type: null,
    cast_type: CAST_TYPE.SELF_CAST,
    hit_count: 0,
    hit_delay: 0,
    cooldown: 60,
    duration: 180,
    max_level: 30,
    scaling: { reflect_chance: { min: 0.03, max: 0.07 } },  // 3% → 7%
    icon: '🪞',
    description: 'For 180s, reflects a chance of incoming damage back to attacker.',
  },
  {
    skill_id: 'aegis_shield',
    skill_name: 'AEGIS Shield',
    skill_type: SKILL_TYPE.ACTIVE_BUFF,
    weapon_type: null,
    cast_type: CAST_TYPE.SELF_CAST,
    hit_count: 0,
    hit_delay: 0,
    cooldown: 60,
    duration: 180,
    max_level: 30,
    scaling: { shield_pct_max_hp: { min: 0.05, max: 0.15 } }, // 5% → 15% of max HP
    icon: '🛡️',
    description: 'Conjures a temporary HP shield up to 15% of max HP for 180s.',
  },
  {
    skill_id: 'decisive_blow',
    skill_name: 'Decisive Blow',
    skill_type: SKILL_TYPE.ACTIVE_BUFF,
    weapon_type: null,
    cast_type: CAST_TYPE.SELF_CAST,
    hit_count: 0,
    hit_delay: 0,
    cooldown: 60,
    duration: 180,
    max_level: 30,
    scaling: { crit_chance_flat: { min: 1, max: 25 } }, // +1 → +25 flat crit chance
    icon: '🎯',
    description: 'Increases critical strike chance for 180s.',
  },
  {
    skill_id: 'focus',
    skill_name: 'Focus',
    skill_type: SKILL_TYPE.ACTIVE_BUFF,
    weapon_type: null,
    cast_type: CAST_TYPE.SELF_CAST,
    hit_count: 5,                       // empowers next 5 attacks (consumed per hit)
    hit_delay: 0,
    cooldown: 90,
    duration: 180,                      // or until 5 attacks consumed
    max_level: 30,
    scaling: { damage_bonus_pct: { min: 0.30, max: 1.00 } }, // +30% → +100%
    icon: '🧠',
    description: 'Empowers your next 5 successful attacks. Buff expires after 5 hits or 180s.',
  },
  {
    skill_id: 'gods_deflection',
    skill_name: "God's Deflection",
    skill_type: SKILL_TYPE.ACTIVE_BUFF,
    weapon_type: null,
    cast_type: CAST_TYPE.SELF_CAST,
    hit_count: 0,
    hit_delay: 0,
    cooldown: 90,
    duration: 180,
    max_level: 30,
    scaling: {
      crit_damage_reduction_pct: { min: 0.20, max: 0.60 }, // mitigates 20% → 60% of crit dmg
      crit_resist_pct:           { min: 0.05, max: 0.25 }, // chance to fully negate a crit
    },
    icon: '✨',
    description: 'Reduces and partially negates incoming critical damage for 180s.',
  },
];

// Validate at module load — duplicate ids would be a developer error.
const _byId = new Map();
for (const s of SKILLS) {
  if (_byId.has(s.skill_id)) {
    throw new Error(`[skillRegistry] duplicate skill_id: ${s.skill_id}`);
  }
  _byId.set(s.skill_id, s);
}

// ─── Public API ────────────────────────────────────────────────────────
export function getAllSkills() { return SKILLS; }
export function getSkillById(id) { return _byId.get(id) || null; }
export function getSkillsByType(type) { return SKILLS.filter((s) => s.skill_type === type); }
export function getSkillsForWeapon(weaponType) {
  // Includes universal (weapon_type=null) + weapon-specific.
  return SKILLS.filter((s) => s.weapon_type === null || s.weapon_type === weaponType);
}

// Linear scaling helper — interpolates a scaling stat by current level.
export function scaleStat(skill, statKey, level) {
  const range = skill?.scaling?.[statKey];
  if (!range) return 0;
  const lvl = Math.max(1, Math.min(skill.max_level, level || 1));
  const t = (lvl - 1) / Math.max(1, skill.max_level - 1);
  return range.min + (range.max - range.min) * t;
}

export default SKILLS;