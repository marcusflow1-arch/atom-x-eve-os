import { getSkillById, scaleStat } from './skillRegistry';
import { canCastWithEquippedWeapon, describeWeaponMismatch } from './weaponValidator';
import { activateBuff } from './buffEngine';
import { getSkillMasteryLevel, noteBuffCast, noteSkillCharge, noteSkillStrike } from './skillMasteryStore';
import { SKILL_TYPE, CAST_TYPE } from './skillTypes';
import { getLoadout } from './loadoutStore';
import { getAXEInventoryItemsByCategory, getActiveEquippedAXEWeapon, switchAXEInventoryWeapon } from '../axe/equipment/AXEEquipmentInventoryStore';
import { resolveAXEWeaponIdentity } from '../axe/weapons/AXEWeaponIdentity';
import { getWeaponLevel } from '../progression/weaponMasteryStore';
import { applyMasteryToSkillMultiplier, getActiveWeaponId } from '../progression/weaponMastery/WeaponScalingPipeline';
  const multiplier = applyMasteryToSkillMultiplier(baseMult) * (echo?.multiplierScale ?? 1) * getAXEAscensionSkillMultiplier();
    const candidate = getAXEInventoryItemsByCategory('weapon').find(item => {
      const identity = resolveAXEWeaponIdentity(item);
        getWeaponLevel(identity.masteryWeaponId) >= 10;
import { getActiveWeaponId } from '../progression/weaponMastery/WeaponScalingPipeline';
import { reportSkillCast } from '../progression/weaponMastery/WeaponMasteryEngine';
import { primeCriticalFocus, consumeCriticalFocusForSingleHit } from './twelveSkyFocusState';
import { armForcedCriticalHit } from '../combat/forcedCriticalBridge';
import { setCombatFlag } from '../talents/advancedClassStore';
import { getAXEMountFusionState } from '../axe/progression/AXEMountStore';
import { planAXEMountSoulEchoes } from '../axe/progression/AXEMountFusionSystem';
import { getAXEAscensionSkillMultiplier, hasAXEAscensionShockwave } from '../axe/progression/AXEAscensionStore';
import {
  onTripleSlashCast,
  onTripleSlashFinalHit,
  onDoubleShotHit,
  onDoubleShotCastEnd,
} from './skillSoundEffects';

let castingUntil = 0;
let castingTimer = null;

function markCasting(durationMs = 350) {
  const now = Date.now();
  castingUntil = Math.max(castingUntil, now + Math.max(80, Number(durationMs) || 350));
  setCombatFlag('casting', true);
  if (castingTimer) clearTimeout(castingTimer);
  const release = () => {
    const remaining = castingUntil - Date.now();
    if (remaining > 0) {
      castingTimer = setTimeout(release, remaining);
      return;
    }
    castingTimer = null;
    setCombatFlag('casting', false);
  };
  castingTimer = setTimeout(release, Math.max(80, castingUntil - now));
}

function toast(text) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('skillActivatedToast', { detail: { text } }));
}

// echo: an extra strike from an absorbed mount's soul (Mount Soul Fusion), never the skill's own hit
function dispatchStrike(skill, hitIndex, level, echo = null) {
  if (typeof window === 'undefined') return;
  const baseMult = scaleStat(skill, 'damage_pct', level || 1) || 1;
  // Destroyer Nature (Taurus Chosen Ascension): skill damage x1.5, echoes included
  // weapon mastery's damage and ability bonuses are on the sheet (damage pool, skillDamagePct),
  // applied once by the hit resolution, not here as well
  const multiplier = baseMult * (echo?.multiplierScale ?? 1) * getAXEAscensionSkillMultiplier();
  const criticalAllowed = skill.critical_allowed !== false;
  const forceCritical = !echo && criticalAllowed && skill.cast_type === CAST_TYPE.SINGLE_HIT
    ? consumeCriticalFocusForSingleHit()
    : false;
  if (forceCritical) armForcedCriticalHit(1);
  const hitsTotal = echo?.total ?? skill.hit_count + (getAXEMountFusionState().active ? planAXEMountSoulEchoes(skill).length : 0); // the fused count on every strike of the cast

  window.dispatchEvent(new CustomEvent('playerSkillStrike', {
    detail: {
      skillId: skill.skill_id,
      multiplier,
      hitIndex,
      hitsTotal,
      castType: skill.cast_type,
      weaponType: skill.weapon_type,
      forceCritical,
      criticalAllowed,
      axeSkillNumber: skill.axe_skill_number || null,
      axeRole: skill.axe_role || null,
      axePattern: skill.axe_pattern || null,
      aoeRadius: echo?.aoeRadius ?? Number(skill.aoe_radius || 0),
      soulEcho: echo?.kind || null, // 'spectral' | 'elemental' | 'spectral_aoe'
      soulPalette: echo?.palette || null,
      ascensionShockwave: !echo && skill.cast_type === CAST_TYPE.SINGLE_HIT && hasAXEAscensionShockwave(),
      divine: Boolean(skill.divine),
      aerial: Boolean(skill.aerial),
    },
  }));
  noteSkillStrike(skill.skill_id, hitsTotal); // mastery: earned if the strike lands
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

  let weaponCheck = canCastWithEquippedWeapon(skillId);
  if (!weaponCheck.ok && skill.weapon_type && ctx.allowMasterySwap === true) {
    const candidate = getAXEInventoryItemsByCategory('weapon').find(item => {
      const identity = resolveAXEWeaponIdentity(item);
      return identity.advancedWeaponType === skill.weapon_type &&
        getWeaponLevel(identity.masteryWeaponId) >= 10;
    });
    if (candidate) {
      const swapped = switchAXEInventoryWeapon(candidate.instanceId, { level: ctx.playerLevel || 1 });
      if (!swapped.ok) return { ok: false, reason: swapped.reason };
      weaponCheck = canCastWithEquippedWeapon(skillId);
      if (weaponCheck.ok && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('axeMasteryWeaponTransition', {
          detail: { weaponInstanceId: candidate.instanceId, weaponType: skill.weapon_type, durationMs: 4000 },
        }));
      }
    }
  }
  if (!weaponCheck.ok) {
    toast(describeWeaponMismatch(weaponCheck));
    return { ok: false, reason: weaponCheck.reason };
  }

  // the skill's mastery level unless the caller fixes one (skillMasteryStore)
  const level = Number(ctx.level) || getSkillMasteryLevel(skillId);
  const inferredSlot = Number.isInteger(ctx.slotIndex)
    ? ctx.slotIndex
    : getLoadout().activeSlots.indexOf(skillId);

  if (inferredSlot === 1) {
    markCasting(180);
    primeCriticalFocus(inferredSlot);
    if (skill.skill_type === SKILL_TYPE.ACTIVE_BUFF) noteBuffCast(skillId, activateBuff(skillId, level, { maxHP: ctx.maxHP })?.expiresAt);
    else noteSkillCharge(skillId);
    reportSkillCast(getActiveWeaponId());
    toast(`${skill.icon || '⚡'} Critical Focus armed`);
    return { ok: true, charge: true };
  }

  if (skill.skill_type === SKILL_TYPE.ACTIVE_BUFF) {
    markCasting(220);
    noteBuffCast(skillId, activateBuff(skillId, level, { maxHP: ctx.maxHP })?.expiresAt);
    reportSkillCast(getActiveWeaponId());
    toast(`${skill.icon} ${skill.skill_name} activated`);
    return { ok: true };
  }

  if (skill.aerial && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeAerialSkillCast', {
      detail: { skillId: skill.skill_id, role: skill.axe_role, criticalAllowed: true },
    }));
  }

  const inferredDurationMs = Math.max(
    300,
    Math.round(
      (
        skill.cast_type === CAST_TYPE.RANGED_BARRAGE
          ? ((skill.hit_count - 1) * skill.hit_delay + 0.35)
          : skill.cast_type === CAST_TYPE.MULTI_HIT_SEQUENTIAL
            ? ((skill.hit_count - 1) * skill.hit_delay + 0.35)
            : skill.cast_type === CAST_TYPE.MULTI_HIT_BURST
              ? (skill.hit_delay + (skill.follow_up_delay || 0.4) + 0.25)
              : skill.cast_type === CAST_TYPE.RANGED_DOUBLE
                ? (skill.hit_delay + 0.25)
                : 0.45
      ) * 1000
    ),
  );
  markCasting(inferredDurationMs);

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

  // Mount Soul Fusion: the absorbed mount's soul adds its own strikes after the skill's
  const fusion = getAXEMountFusionState();
  if (fusion.active) {
    const echoes = planAXEMountSoulEchoes(skill);
    echoes.forEach((echo, i) => setTimeout(() => dispatchStrike(skill, skill.hit_count + i, level,
      { ...echo, palette: fusion.palette?.id || null, total: skill.hit_count + echoes.length }), echo.atMs));
  }

  reportSkillCast(getActiveWeaponId());
  toast(`${skill.icon} ${skill.skill_name}`);
  return { ok: true };
}
