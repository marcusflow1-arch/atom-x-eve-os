// ─── Rogue Attack Bridge ─────────────────────────────────────────────
// Bridges player attacks from GameWorld3D into hostile rogue AIs AND the
// real world-boss entities exposed by GameWorld3D.
//
// This module is imported by GameWorld3D, so the combat bridge is installed as
// part of the actual /gameview runtime without requiring another page mount.
// Boss damage is applied to the same live objects that drive the HUD.

import { getPlayerHUD } from './playerHUDStore';
import { calculateHit } from './statsSystem';
import { getWeaponDamageMult, getWeaponCritChanceBonusPct } from './weaponClassCombatHelpers';
import { getActiveWeaponPath } from './weaponClassBuffStore';
import { getAbilityState, updateTargetHP } from './abilityStore';
import { updateBoss } from './bossStore';

function calculateOutgoingDamage(playerDerivedRef, skillStrikeMult = 1.0) {
  const liveDerived = getPlayerHUD().derived || playerDerivedRef?.current || {};
  const boosted = {
    ...liveDerived,
    critChance: (liveDerived.critChance || 0) + getWeaponCritChanceBonusPct(),
  };
  return Math.max(
    1,
    Math.round(
      calculateHit(boosted, { defense: 0 }) * getWeaponDamageMult() * skillStrikeMult,
    ),
  );
}

function findLiveBoss(targetId) {
  const bosses = typeof window !== 'undefined' ? window.__gw3dBosses : null;
  if (!Array.isArray(bosses)) return null;
  return bosses.find((boss) => boss?.id === targetId && boss.alive !== false && !boss.dying) || null;
}

function findLiveRogue(targetId) {
  const rogues = typeof window !== 'undefined' ? window.__gw3dRogues : null;
  if (!Array.isArray(rogues)) return null;
  return rogues.find((rogue) => rogue?.id === targetId && rogue.alive !== false && !rogue.dying) || null;
}

function applyBossDamage(targetId, amount, source = 'player') {
  const boss = findLiveBoss(targetId);
  if (!boss) return 0;

  const damage = Math.max(1, Math.round(amount));
  boss.hp = Math.max(0, (Number(boss.hp) || 0) - damage);
  boss.alive = boss.hp > 0;
  boss.hitCooldown = 0.25;
  boss.lastDamageSource = source;
  boss.lastDamageAt = performance.now();

  // Keep every existing HUD/target subscriber on the same source of truth.
  updateBoss(boss.id, {
    hp: boss.hp,
    alive: boss.alive,
    dying: boss.dying,
  });
  updateTargetHP(boss.id, boss.hp);

  window.dispatchEvent(new CustomEvent('bossDamageTaken', {
    detail: {
      bossId: boss.id,
      bossName: boss.name,
      damage,
      hp: boss.hp,
      maxHp: boss.maxHp,
      source,
    },
  }));

  if (!boss.alive) {
    window.dispatchEvent(new CustomEvent('bossDefeated', {
      detail: { bossId: boss.id, bossName: boss.name, maxHp: boss.maxHp },
    }));
  }

  return damage;
}

// The second boss-style target in the current world is the locked rogue
// "Arena Boss". Its existing AI listener only accepts hits inside its short
// attack range. The bridge extends ONLY ranged/locked attacks to the actual
// rogue object, preserving the existing AI/reward/respawn path for normal
// attacks whenever the target is not the locked ranged target.
function applyLockedRogueDamage(targetId, amount, source = 'charged_bow') {
  const rogue = findLiveRogue(targetId);
  if (!rogue) return 0;

  const damage = Math.max(1, Math.round(amount));
  rogue.hp = Math.max(0, (Number(rogue.hp) || 0) - damage);
  rogue.lastDamageSource = source;
  rogue.lastDamageAt = performance.now();

  // Match the existing hit feedback used by EnemyPlayerSpawner.
  rogue.tintMats?.forEach((m) => { if (m?.emissive) m.emissive.setHex(0xffffff); });
  setTimeout(() => {
    if (rogue.tintMats) rogue.tintMats.forEach((m) => { if (m?.emissive) m.emissive.setHex(rogue.color); });
  }, 100);

  updateTargetHP(rogue.id, rogue.hp);
  window.dispatchEvent(new CustomEvent('rogueBossDamageTaken', {
    detail: {
      bossId: rogue.id,
      bossName: rogue.name,
      damage,
      hp: rogue.hp,
      maxHp: rogue.maxHp,
      source,
    },
  }));

  // Let the existing rogue AI lifecycle handle death/respawn when its HP
  // reaches zero. The event is emitted so that lifecycle/reward systems can
  // subscribe without creating a second kill implementation here.
  if (rogue.hp <= 0) {
    rogue.hp = 0;
    rogue.alive = false;
    window.dispatchEvent(new CustomEvent('rogueBossDefeated', {
      detail: { bossId: rogue.id, bossName: rogue.name, maxHp: rogue.maxHp },
    }));
  }

  return damage;
}

// Ranged attacks are charged from the real mouse-down → mouse-up duration.
// 1.3 seconds reaches full charge. Holding longer continues to add damage.
let rangedChargeStartedAt = 0;
let rangedChargeActive = false;
let lastRangedBaseDamage = 0;
let lastRangedSkillMultiplier = 1;

function isRangedWeapon() {
  try {
    return getActiveWeaponPath() === 'ranged';
  } catch {
    return false;
  }
}

function installBossAndBowBridge() {
  if (typeof window === 'undefined' || window.__atomXeBossCombatBridgeInstalled) return;
  window.__atomXeBossCombatBridgeInstalled = true;

  // Capture before GameWorld3D's canvas handler so the charge timer begins
  // before the existing attack pipeline runs.
  window.addEventListener('mousedown', (event) => {
    if (event.button !== 0 || !isRangedWeapon()) return;
    rangedChargeStartedAt = performance.now();
    rangedChargeActive = true;
    lastRangedBaseDamage = 0;
  }, true);

  window.addEventListener('mouseup', (event) => {
    if (event.button !== 0 || !rangedChargeActive) return;
    const heldSeconds = Math.max(0, (performance.now() - rangedChargeStartedAt) / 1000);
    rangedChargeActive = false;

    const target = getAbilityState().target;
    if (!target || (target.kind !== 'boss' && target.kind !== 'rogue')) return;

    const baseDamage = lastRangedBaseDamage || calculateOutgoingDamage(null, lastRangedSkillMultiplier);
    // 1.3s = 2x base damage. Beyond 1.3s, add another 25% per second held.
    const fullCharge = Math.min(1, heldSeconds / 1.3);
    const overcharge = Math.max(0, heldSeconds - 1.3) * 0.25;
    const chargeMultiplier = 1 + fullCharge + overcharge;
    const damage = baseDamage * chargeMultiplier;

    if (target.kind === 'boss') {
      applyBossDamage(target.id, damage, 'charged_bow');
    } else {
      applyLockedRogueDamage(target.id, damage, 'charged_bow');
    }
  }, true);

  // GameWorld3D already dispatches this event for every normal player attack.
  // For melee, immediately route a locked world boss through the real boss HP
  // object. For ranged, capture the base damage and defer the actual hit until
  // mouse-up so the bow truly charges. stopImmediatePropagation prevents the
  // legacy short-range Arena Boss listener from applying a second hit.
  window.addEventListener('rogueAITakeDamage', (event) => {
    const target = getAbilityState().target;
    if (!target) return;

    if (isRangedWeapon()) {
      if (target.kind !== 'boss' && target.kind !== 'rogue') return;
      if (rangedChargeActive) {
        lastRangedBaseDamage = Math.max(1, Number(event.detail?.damage) || 1);
        event.stopImmediatePropagation();
      }
      return;
    }

    if (target.kind === 'boss') {
      applyBossDamage(target.id, Number(event.detail?.damage) || 1, 'player_attack');
    }
  });

  // Expose a tiny diagnostic API so the in-game debug console can verify that
  // the actual runtime bridge is installed and which targets are live.
  window.__atomXeBossCombat = {
    isInstalled: () => true,
    getBosses: () => (Array.isArray(window.__gw3dBosses) ? window.__gw3dBosses : []),
    getRogueBosses: () => (Array.isArray(window.__gw3dRogues) ? window.__gw3dRogues : []),
    damageBoss: (bossId, amount = 1) => applyBossDamage(bossId, amount, 'diagnostic'),
    damageRogueBoss: (bossId, amount = 1) => applyLockedRogueDamage(bossId, amount, 'diagnostic'),
  };
}

installBossAndBowBridge();

/**
 * Fire a rogue-damage event on the current attack click.
 * Safe to call on every left-click — rogue-AIs do their own range/target
 * filtering. World bosses are handled by the bridge above.
 */
export function dispatchRogueAttack(playerDerivedRef, skillStrikeMult = 1.0) {
  const dmg = calculateOutgoingDamage(playerDerivedRef, skillStrikeMult);
  lastRangedBaseDamage = dmg;
  lastRangedSkillMultiplier = skillStrikeMult;
  window.dispatchEvent(new CustomEvent('rogueAITakeDamage', { detail: { damage: dmg } }));
}
