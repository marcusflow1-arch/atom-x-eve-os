// ─── Skill Executor ────────────────────────────────────────────────────
// The single entry point for casting any skill. Validates weapon lock,
// dispatches by cast_type, schedules multi-hit timings exactly per spec.

import { getSkillById, scaleStat } from './skillRegistry';
import { canCastWithEquippedWeapon, describeWeaponMismatch } from './weaponValidator';
import { activateBuff } from './buffEngine';
import { SKILL_TYPE, CAST_TYPE } from './skillTypes';
import { getLoadout, startCooldown } from './loadoutStore';
import { getPlayerHUD } from '../playerHUDStore';
import { applyMasteryToSkillMultiplier, getActiveWeaponId } from '../progression/weaponMastery/WeaponScalingPipeline';
import { reportSkillCast } from '../progression/weaponMastery/WeaponMasteryEngine';
import { primeBurstCharge, consumeBurstCharge } from '../twelvesky/burstChargeStore';
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
  let mult = applyMasteryToSkillMultiplier(baseMult);

  // TwelveSky-style burst rule: a short charge window is consumed ONLY by a
  // single-hit attack. Multi-hit and AoE skills keep their farming/sustained
  // role and do not waste the charge.
  let burstCritical = false;
  if (skill.cast_type === CAST_TYPE.SINGLE_HIT && hitIndex === 0) {
    const charged = consumeBurstCharge();
    if (charged) {
      mult *= charged.multiplier;
      burstCritical = true;
      toast(`⚡ Charged critical — ${skill.skill_name}`);
    }
  }

  window.dispatchEvent(new CustomEvent('playerSkillStrike', {
    detail: {
      skillId: skill.skill_id,
      multiplier: mult,
      hitIndex,
      hitsTotal: skill.hit_count,
      castType: skill.cast_type,
      weaponType: skill.weapon_type,
      burstCritical,
    },
  }));
}

function scheduleSequential(skill, level) {
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

export function castSkill(skill_id, ctx = {}) {
  const skill = getSkillById(skill_id);
  if (!skill) return { ok: false, reason: 'unknown_skill' };

  if (skill.skill_type === SKILL_TYPE.PASSIVE) {
    toast('⛔ Passive skills activate automatically');
    return { ok: false, reason: 'passive_cannot_cast' };
  }

  const w = canCastWithEquippedWeapon(skill_id);
  if (!w.ok) {
    toast(describeWeaponMismatch(w));
    return { ok: false, reason: w.reason };
  }

  const level = ctx.level || 1;

  if (skill.skill_type === SKILL_TYPE.ACTIVE_BUFF) {
    activateBuff(skill_id, level, { maxHP: ctx.maxHP });

    // Focus doubles as the modernized charge setup.
    if (skill_id === 'focus') {
      primeBurstCharge({ durationMs: 5000, multiplier: 3 });
      toast('⚡ Focus charged — next single-hit skill bursts for critical damage');
    } else {
      toast(`${skill.icon} ${skill.skill_name} activated`);
    }
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

// GameWorld3D historically handled keys 1–8 inline. Keep that proven path
// untouched and add 9 + 0 here for the classic ten-skill layout (0 = slot 10).
// A global guard prevents duplicate listeners during hot reloads.
function installExtendedTenSlotHotkeys() {
  if (typeof window === 'undefined' || window.__atomTwelveSkyTenSlotHotkeys) return;
  window.__atomTwelveSkyTenSlotHotkeys = true;
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

    const slotIndex = e.key === '9' ? 8 : e.key === '0' ? 9 : -1;
    if (slotIndex < 0) return;

    const loadout = getLoadout();
    const skillId = loadout.activeSlots[slotIndex];
    if (!skillId || (loadout.cooldowns[slotIndex] || 0) > 0) return;

    const hud = getPlayerHUD();
    const result = castSkill(skillId, { level: hud.level || 1, maxHP: hud.maxHP || 1 });
    if (result.ok) {
      startCooldown(slotIndex);
      e.preventDefault();
    }
  });
}

installExtendedTenSlotHotkeys();
