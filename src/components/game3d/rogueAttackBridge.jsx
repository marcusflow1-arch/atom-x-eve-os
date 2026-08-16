// ─── Rogue Attack Bridge ─────────────────────────────────────────────
// Bridges player attacks from GameWorld3D into hostile rogue AIs AND the
// real world-boss entities exposed by GameWorld3D.
//
// This module is imported by GameWorld3D, so the boss bridge is installed as
// part of the actual /gameview runtime without requiring another page mount.
// Boss damage is applied to the same live boss objects that drive the HUD.

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
    if (!target || target.kind !== 'boss') return;

    const baseDamage = lastRangedBaseDamage || calculateOutgoingDamage(null, lastRangedSkillMultiplier);
    // 1.3s = 2x base damage. Beyond 1.3s, add another 25% per second held.
    const fullCharge = Math.min(1, heldSeconds / 1.3);
    const overcharge = Math.max(0, heldSeconds - 1.3) * 0.25;
    const chargeMultiplier = 1 + fullCharge + overcharge;
    applyBossDamage(target.id, baseDamage * chargeMultiplier, 'charged_bow');
  }, true);

  // GameWorld3D already dispatches this event for every normal player attack.
  // For melee, immediately route a locked boss through the real boss HP object.
  // For ranged, defer boss damage until mouse-up so the bow actually charges.
  window.addEventListener('rogueAITakeDamage', (event) => {
    const target = getAbilityState().target;
    if (!target || target.kind !== 'boss') return;

    if (isRangedWeapon()) {
      if (!rangedChargeActive) return;
      lastRangedBaseDamage = Math.max(1, Number(event.detail?.damage) || 1);
      return;
    }

    applyBossDamage(target.id, Number(event.detail?.damage) || 1, 'player_attack');
  });

  // Expose a tiny diagnostic API so the in-game debug console can verify that
  // the actual runtime bridge is installed and which bosses are live.
  window.__atomXeBossCombat = {
    isInstalled: () => true,
    getBosses: () => (Array.isArray(window.__gw3dBosses) ? window.__gw3dBosses : []),
    damageBoss: (bossId, amount = 1) => applyBossDamage(bossId, amount, 'diagnostic'),
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
