// ─── Skill Executor ────────────────────────────────────────────────────
// The single entry point for casting any skill. Validates weapon lock,
// dispatches by cast_type, schedules multi-hit timings exactly per spec.
//
// Public API:
//   castSkill(skill_id, ctx) → { ok, reason? }
//     ctx: { level, maxHP, getPlayerLevel?, getDamageMult? }
//
// Side effects:
//   • For SELF_CAST buffs → activates buff via buffEngine
//   • For attack casts    → dispatches 'playerSkillStrike' window events,
//                           one per hit, with proper delays.
//   • Always dispatches a 'skillActivatedToast' for player feedback.

import { getSkillById, scaleStat } from './skillRegistry';
import { canCastWithEquippedWeapon, describeWeaponMismatch } from './weaponValidator';
import { activateBuff } from './buffEngine';
import { SKILL_TYPE, CAST_TYPE } from './skillTypes';
import { applyMasteryToSkillMultiplier, getActiveWeaponId } from '../progression/weaponMastery/WeaponScalingPipeline';
import { reportSkillCast } from '../progression/weaponMastery/WeaponMasteryEngine';
import {
  onTripleSlashCast,
  onTripleSlashFinalHit,
  onDoubleShotHit,
  onDoubleShotCastEnd,
} from './skillSoundEffects';

function toast(text) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('skillActivatedToast', { detail: { text } }));
}

function dispatchStrike(skill, hitIndex, level) {
  if (typeof window === 'undefined') return;
  const baseMult = scaleStat(skill, 'damage_pct', level || 1) || 1;
  // Weapon Mastery scales skill damage based on the equipped weapon's level.
  const mult = applyMasteryToSkillMultiplier(baseMult);
  window.dispatchEvent(new CustomEvent('playerSkillStrike', {
    detail: {
      skillId:   skill.skill_id,
      multiplier: mult,
      hitIndex,
      hitsTotal: skill.hit_count,
      castType:  skill.cast_type,
      weaponType: skill.weapon_type,
    },
  }));
}

function scheduleSequential(skill, level) {
  // Hit 1 at t=0, hit i at t = i*hit_delay
  const isTripleSlash = skill.skill_id === 'sword_triple_slash';
  if (isTripleSlash) onTripleSlashCast();
  for (let i = 0; i < skill.hit_count; i++) {
    setTimeout(() => {
      dispatchStrike(skill, i, level);
      if (isTripleSlash && i === skill.hit_count - 1) onTripleSlashFinalHit();
    }, i * skill.hit_delay * 1000);
  }
}

function scheduleGuardianBurst(skill, level) {
  // Hits 1+2 near-simultaneous (separated by burst_delay), then hit 3 after
  // hit_delay, then a final follow-up hit 4 after follow_up_delay.
  // Total hits: 4 (configurable via skill.hit_count, defaults to 4).
  const burst = skill.burst_delay ?? 0.08;
  const followUp = skill.follow_up_delay ?? 0.4;
  setTimeout(() => dispatchStrike(skill, 0, level), 0);
  setTimeout(() => dispatchStrike(skill, 1, level), burst * 1000);
  setTimeout(() => dispatchStrike(skill, 2, level), skill.hit_delay * 1000);
  if ((skill.hit_count ?? 3) >= 4) {
    setTimeout(() => dispatchStrike(skill, 3, level), (skill.hit_delay + followUp) * 1000);
  }
}

function scheduleRangedDouble(skill, level) {
  const isDoubleShot = skill.skill_id === 'ranged_double_shot';
  setTimeout(() => { dispatchStrike(skill, 0, level); if (isDoubleShot) onDoubleShotHit(); }, 0);
  setTimeout(() => { dispatchStrike(skill, 1, level); if (isDoubleShot) onDoubleShotHit(); }, skill.hit_delay * 1000);
  // Failsafe: ensure sfx is cleared shortly after the cast window ends.
  if (isDoubleShot) {
    setTimeout(() => onDoubleShotCastEnd(), (skill.hit_delay * 1000) + 800);
  }
}

function scheduleRangedBarrage(skill, level) {
  const castDurationMs = ((skill.hit_count - 1) * skill.hit_delay * 1000) + 350;
  window.dispatchEvent(new CustomEvent('playerSkillCastStart', {
    detail: { skillId: skill.skill_id, castType: skill.cast_type, duration: castDurationMs / 1000 },
  }));
  for (let i = 0; i < skill.hit_count; i++) {
    setTimeout(() => { dispatchStrike(skill, i, level); onDoubleShotHit(); }, i * skill.hit_delay * 1000);
  }
  setTimeout(() => onDoubleShotCastEnd(), castDurationMs + 300);
}

/**
 * Cast a skill. Returns { ok, reason? }.
 *   reason values: 'unknown_skill' | 'passive_cannot_cast' | 'wrong_weapon' | 'no_weapon_equipped'
 */
export function castSkill(skill_id, ctx = {}) {
  const skill = getSkillById(skill_id);
  if (!skill) return { ok: false, reason: 'unknown_skill' };

  // PASSIVES can never be cast manually. Hard rule.
  if (skill.skill_type === SKILL_TYPE.PASSIVE) {
    toast('⛔ Passive skills activate automatically');
    return { ok: false, reason: 'passive_cannot_cast' };
  }

  // Weapon-lock check.
  const w = canCastWithEquippedWeapon(skill_id);
  if (!w.ok) {
    toast(describeWeaponMismatch(w));
    return { ok: false, reason: w.reason };
  }

  const level = ctx.level || 1;

  // Buff branch.
  if (skill.skill_type === SKILL_TYPE.ACTIVE_BUFF) {
    activateBuff(skill_id, level, { maxHP: ctx.maxHP });
    toast(`${skill.icon} ${skill.skill_name} activated`);
    return { ok: true };
  }

  // Attack branch — dispatch by cast_type.
  switch (skill.cast_type) {
    case CAST_TYPE.SINGLE_HIT:
      window.dispatchEvent(new CustomEvent('playerSkillCastStart', {
        detail: { skillId: skill.skill_id, castType: skill.cast_type, duration: 0.45 },
      }));
      setTimeout(() => dispatchStrike(skill, 0, level), 120);
      break;
    case CAST_TYPE.MULTI_HIT_SEQUENTIAL:
      scheduleSequential(skill, level);
      break;
    case CAST_TYPE.MULTI_HIT_BURST:
      scheduleGuardianBurst(skill, level);
      break;
    case CAST_TYPE.RANGED_DOUBLE:
      scheduleRangedDouble(skill, level);
      break;
    case CAST_TYPE.RANGED_BARRAGE:
      scheduleRangedBarrage(skill, level);
      break;
    default:
      return { ok: false, reason: 'unsupported_cast_type' };
  }

  // Report skill cast → mastery XP for the equipped weapon.
  reportSkillCast(getActiveWeaponId());

  toast(`${skill.icon} ${skill.skill_name}`);
  return { ok: true };
}