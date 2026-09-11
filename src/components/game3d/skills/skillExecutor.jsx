import { getSkillById, scaleStat } from './skillRegistry';
import { canCastWithEquippedWeapon, describeWeaponMismatch } from './weaponValidator';
import { activateBuff } from './buffEngine';
import { SKILL_TYPE, CAST_TYPE } from './skillTypes';
import { getLoadout } from './loadoutStore';
import { applyMasteryToSkillMultiplier, getActiveWeaponId } from '../progression/weaponMastery/WeaponScalingPipeline';
import { reportSkillCast } from '../progression/weaponMastery/WeaponMasteryEngine';
import { primeCriticalFocus, consumeCriticalFocusForSingleHit } from './twelveSkyFocusState';
import { armForcedCriticalHit } from '../combat/forcedCriticalBridge';
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
  const multiplier = applyMasteryToSkillMultiplier(baseMult);
  const forceCritical = skill.cast_type === CAST_TYPE.SINGLE_HIT
    ? consumeCriticalFocusForSingleHit()
    : false;
  if (forceCritical) armForcedCriticalHit(1);

  window.dispatchEvent(new CustomEvent('playerSkillStrike', {
    detail: {
      skillId: skill.skill_id,
      multiplier,
      hitIndex,
      hitsTotal: skill.hit_count,
      castType: skill.cast_type,
      weaponType: skill.weapon_type,
      forceCritical,
    },
  }));
}

function scheduleSequential(skill, level) {
  const isTripleSlash = skill.skill_id === 'sword_triple_slash';
  if (isTripleSlash) onTripleSlashCast();
  for (let i = 0; i < skill.hit_count; i += 1) {
    setTimeout(() => {
      dispatchStrike(skill, i, level);
      if (isTripleSlash && i === skill.hit_count - 1) onTripleSlashFinalHit();
    }, i * skill.hit_delay * 1000);
  }
}

function scheduleGuardianBurst(skill, level) {
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
  if (isDoubleShot) setTimeout(() => onDoubleShotCastEnd(), (skill.hit_delay * 1000) + 800);
}

function scheduleRangedBarrage(skill, level) {
  const castDurationMs = ((skill.hit_count - 1) * skill.hit_delay * 1000) + 350;
  window.dispatchEvent(new CustomEvent('playerSkillCastStart', {
    detail: { skillId: skill.skill_id, castType: skill.cast_type, duration: castDurationMs / 1000 },
  }));
  for (let i = 0; i < skill.hit_count; i += 1) {
    setTimeout(() => { dispatchStrike(skill, i, level); onDoubleShotHit(); }, i * skill.hit_delay * 1000);
  }
  setTimeout(() => onDoubleShotCastEnd(), castDurationMs + 300);
}

export function castSkill(skillId, ctx = {}) {
  const skill = getSkillById(skillId);
  if (!skill) return { ok: false, reason: 'unknown_skill' };

  if (skill.skill_type === SKILL_TYPE.PASSIVE) {
    toast('Passive skills activate automatically');
    return { ok: false, reason: 'passive_cannot_cast' };
  }

  const weaponCheck = canCastWithEquippedWeapon(skillId);
  if (!weaponCheck.ok) {
    toast(describeWeaponMismatch(weaponCheck));
    return { ok: false, reason: weaponCheck.reason };
  }

  const level = ctx.level || 1;
  const inferredSlot = Number.isInteger(ctx.slotIndex)
    ? ctx.slotIndex
    : getLoadout().activeSlots.indexOf(skillId);

  if (inferredSlot === 1) {
    primeCriticalFocus(inferredSlot);
    if (skill.skill_type === SKILL_TYPE.ACTIVE_BUFF) activateBuff(skillId, level, { maxHP: ctx.maxHP });
    reportSkillCast(getActiveWeaponId());
    toast(`${skill.icon || '⚡'} Critical Focus armed`);
    return { ok: true, charge: true };
  }

  if (skill.skill_type === SKILL_TYPE.ACTIVE_BUFF) {
    activateBuff(skillId, level, { maxHP: ctx.maxHP });
    reportSkillCast(getActiveWeaponId());
    toast(`${skill.icon} ${skill.skill_name} activated`);
    return { ok: true };
  }

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

  reportSkillCast(getActiveWeaponId());
  toast(`${skill.icon} ${skill.skill_name}`);
  return { ok: true };
}
