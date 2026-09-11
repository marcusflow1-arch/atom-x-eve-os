// ─── Rogue Attack Bridge ─────────────────────────────────────────────
// Bridges player attacks from GameWorld3D into hostile rogue AIs AND the
// real world-boss entities exposed by GameWorld3D.
//
// This module is imported by GameWorld3D, so the combat bridge is installed as
// part of the actual /gameview runtime without requiring another page mount.
// Boss damage is applied to the same live objects that drive the HUD.

import * as THREE from 'three';
import { getPlayerHUD } from './playerHUDStore';
import { calculateHit } from './statsSystem';
import { getWeaponDamageMult, getWeaponCritChanceBonusPct } from './weaponClassCombatHelpers';
import { getActiveWeaponPath } from './weaponClassBuffStore';
import { getAbilityState, updateTargetHP } from './abilityStore';
import { updateBoss } from './bossStore';

const bossShotRaycaster = new THREE.Raycaster();

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

function getLiveBosses() {
  const bosses = typeof window !== 'undefined' ? window.__gw3dBosses : null;
  if (!Array.isArray(bosses)) return [];
  return bosses.filter((boss) => boss?.group && boss.alive !== false && !boss.dying && boss.group.visible !== false);
}

function findLiveBoss(targetId) {
  return getLiveBosses().find((boss) => boss?.id === targetId) || null;
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

  // Small hit flash so an arrow impact is visually obvious even when the boss
  // has a very large segmented HP pool.
  if (Array.isArray(boss.tintMaterials)) {
    boss.tintMaterials.forEach((material) => {
      if (!material) return;
      if (material.emissive) {
        material.userData = material.userData || {};
        if (!material.userData.__bossBaseEmissive) {
          material.userData.__bossBaseEmissive = material.emissive.clone();
        }
        material.emissive.setHex(0xffffff);
      }
    });
    setTimeout(() => {
      boss.tintMaterials?.forEach((material) => {
        const base = material?.userData?.__bossBaseEmissive;
        if (material?.emissive && base) material.emissive.copy(base);
      });
    }, 90);
  }

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

function applyLockedRogueDamage(targetId, amount, source = 'charged_bow') {
  const rogue = findLiveRogue(targetId);
  if (!rogue) return 0;

  const damage = Math.max(1, Math.round(amount));
  rogue.hp = Math.max(0, (Number(rogue.hp) || 0) - damage);
  rogue.lastDamageSource = source;
  rogue.lastDamageAt = performance.now();

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

  if (rogue.hp <= 0) {
    rogue.hp = 0;
    rogue.alive = false;
    rogue.dying = true;
    rogue.deathTimer = 0;
    rogue.respawnAt = performance.now() + 25_000;
    rogue.currentAnim = 'death';
    rogue.idleAction?.fadeOut?.(0.1);
    rogue.runAction?.fadeOut?.(0.1);
    rogue.deathAction?.reset?.().fadeIn?.(0.1).play?.();
    window.dispatchEvent(new CustomEvent('rogueBossDefeated', {
      detail: { bossId: rogue.id, bossName: rogue.name, maxHp: rogue.maxHp },
    }));
  }

  return damage;
}

function findCanvasRectForPointer(event) {
  const direct = event?.target;
  const directRect = direct?.getBoundingClientRect?.();
  if (directRect?.width > 0 && directRect?.height > 0 && direct?.tagName === 'CANVAS') {
    return directRect;
  }

  if (typeof document === 'undefined') return null;
  const x = Number(event?.clientX) || 0;
  const y = Number(event?.clientY) || 0;
  const canvases = Array.from(document.querySelectorAll('canvas'));
  for (const canvas of canvases) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return rect;
  }
  return canvases[0]?.getBoundingClientRect?.() || null;
}

function raycastBossAtNDC(ndcX, ndcY) {
  const camera = typeof window !== 'undefined' ? window.__gw3dCamera : null;
  if (!camera) return null;

  camera.updateMatrixWorld?.();
  bossShotRaycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);

  let best = null;
  let bestDistance = Infinity;
  for (const boss of getLiveBosses()) {
    boss.group.updateMatrixWorld?.(true);
    const hit = bossShotRaycaster.intersectObject(boss.group, true)?.[0];
    if (hit && hit.distance < bestDistance) {
      best = boss;
      bestDistance = hit.distance;
    }
  }
  return best;
}

function findBossUnderArrowAim(event) {
  // First use the actual mouse position when this attack came from a pointer.
  // Animation-driven attacks have no pointer event and should use the reticle.
  const clientX = Number(event?.clientX);
  const clientY = Number(event?.clientY);
  if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
    const rect = findCanvasRectForPointer(event);
    if (rect && rect.width > 0 && rect.height > 0) {
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
      const pointedBoss = raycastBossAtNDC(ndcX, ndcY);
      if (pointedBoss) return pointedBoss;
    }
  }

  // Third-person aiming and animation-triggered attacks use the center reticle.
  return raycastBossAtNDC(0, 0);
}

function resolveArrowBoss(event) {
  const locked = getAbilityState().target;
  if (locked?.kind === 'boss') {
    const lockedBoss = findLiveBoss(locked.id);
    if (lockedBoss) return lockedBoss;
  }
  return findBossUnderArrowAim(event);
}

// Ranged attacks are charged from the real mouse-down → mouse-up duration.
// A normal click now applies base damage immediately through dispatchRogueAttack.
// Holding the shot only adds the bonus portion on release, so the boss is never
// double-hit for the same base arrow damage.
let rangedChargeStartedAt = 0;
let rangedChargeActive = false;
let lastRangedBaseDamage = 0;
let lastRangedSkillMultiplier = 1;
let lastPointerEvent = null;
let bossDamagedThisPressId = null;

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

  // Track every left-click because GameWorld3D's player controller uses left
  // click as the bow/fire input even when the weapon-path store has not yet
  // switched to "ranged". That was one reason the world boss could appear
  // immune while the arrow animation still played.
  window.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    lastPointerEvent = {
      clientX: event.clientX,
      clientY: event.clientY,
      target: event.target,
    };
    rangedChargeStartedAt = performance.now();
    rangedChargeActive = true;
    lastRangedBaseDamage = 0;
    bossDamagedThisPressId = null;
  }, true);

  window.addEventListener('mouseup', (event) => {
    if (event.button !== 0 || !rangedChargeActive) return;
    const heldSeconds = Math.max(0, (performance.now() - rangedChargeStartedAt) / 1000);
    rangedChargeActive = false;

    const baseDamage = lastRangedBaseDamage || calculateOutgoingDamage(null, lastRangedSkillMultiplier);
    const fullCharge = Math.min(1, heldSeconds / 1.3);
    const overcharge = Math.max(0, heldSeconds - 1.3) * 0.25;
    const chargeMultiplier = 1 + fullCharge + overcharge;

    // If dispatchRogueAttack already applied the base arrow hit, only add the
    // charge bonus here. This makes a tap visibly damage the boss immediately
    // and a held shot still scale upward without double-counting base damage.
    if (bossDamagedThisPressId) {
      const bonusDamage = Math.max(0, baseDamage * (chargeMultiplier - 1));
      if (bonusDamage >= 1) applyBossDamage(bossDamagedThisPressId, bonusDamage, 'charged_bow_bonus');
      bossDamagedThisPressId = null;
      return;
    }

    // Fallback for any controller path that reaches mouse-up before the normal
    // attack dispatcher. Locked boss, mouse-on-boss, and center-reticle aiming
    // all resolve to the same live world-boss HP object.
    const boss = resolveArrowBoss(event);
    if (boss) {
      applyBossDamage(boss.id, baseDamage * chargeMultiplier, 'charged_bow');
      return;
    }

    const target = getAbilityState().target;
    if (target?.kind === 'rogue') {
      applyLockedRogueDamage(target.id, baseDamage * chargeMultiplier, 'charged_bow');
    }
  }, true);

  // GameWorld3D dispatches this event for every normal player attack. Keep the
  // legacy rogue path intact and preserve melee boss support, but ranged world
  // boss damage is handled directly by dispatchRogueAttack below.
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

  window.__atomXeBossCombat = {
    isInstalled: () => true,
    getBosses: () => getLiveBosses(),
    getRogueBosses: () => (Array.isArray(window.__gw3dRogues) ? window.__gw3dRogues : []),
    damageBoss: (bossId, amount = 1) => applyBossDamage(bossId, amount, 'diagnostic'),
    damageRogueBoss: (bossId, amount = 1) => applyLockedRogueDamage(bossId, amount, 'diagnostic'),
    bossUnderAim: () => raycastBossAtNDC(0, 0),
  };
}

installBossAndBowBridge();

/**
 * Called by the real GameWorld3D left-click attack loop.
 *
 * If the shot is aimed at a live world boss (mouse-over, center reticle, or an
 * explicit lock), apply damage to that boss immediately. Otherwise preserve the
 * existing rogue-AI event path and the normal enemy combat loop.
 */
export function dispatchRogueAttack(playerDerivedRef, skillStrikeMult = 1.0) {
  const dmg = calculateOutgoingDamage(playerDerivedRef, skillStrikeMult);
  lastRangedBaseDamage = dmg;
  lastRangedSkillMultiplier = skillStrikeMult;

  const boss = resolveArrowBoss(lastPointerEvent);
  if (boss) {
    bossDamagedThisPressId = boss.id;
    applyBossDamage(boss.id, dmg, 'arrow');
    return;
  }

  window.dispatchEvent(new CustomEvent('rogueAITakeDamage', { detail: { damage: dmg } }));
}