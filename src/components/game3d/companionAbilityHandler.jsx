// Companion ability handler — fires Z/X/V/B abilities inside the GameWorld3D loop.
// Keeps GameWorld3D smaller by externalizing the casting logic + effect spawning.

import * as THREE from 'three';
import {
  getCompanionAbilityState,
  getCompanionAbilityById,
  startCompanionCooldown,
} from './companionAbilityStore';
import { getAbilityState, updateTargetHP, clearTarget } from './abilityStore';
import { getPlayerHUD, setHP } from './playerHUDStore';
import { createBiteEffect } from './BiteEffect';
import { createLifeDrainEffect } from './LifeDrainEffect';
import { createCompanionTeleportDash } from './CompanionTeleportDashEffect';
import { createHealEffect } from './HealEffect';
import { playActionSound } from './combatAudioStore';
import { awardCompanionXP } from './companionProgressionStore';
import { reportEnemyKill } from './useQuestStore';
import { QUESTS } from './questData';

/**
 * Kill an enemy + award XP/quest progress. Mirrors the logic used by
 * left-click attacks and player abilities in GameWorld3D.
 *
 * @param {object} ctx — { en, enemies, cachedDeathClip, scene, companionDefId,
 *                         playerXPRef, playerLevelRef, setScore, setPlayerXP,
 *                         setPlayerLevel, spawnXPFloat, xpForLevel, awardXP }
 */
function handleEnemyKill(ctx) {
  const {
    en, cachedDeathClip, companionDefId,
    playerXPRef, playerLevelRef, setScore, setPlayerXP, setPlayerLevel,
    spawnXPFloat, xpForLevel, awardXP,
  } = ctx;
  playActionSound('enemy_death');
  en.hp = 0;
  en.dying = true;
  en.deathTimer = 0;
  if (en.walkAction) en.walkAction.fadeOut(0.15);
  if (en.idleAction) en.idleAction.fadeOut(0.15);
  if (cachedDeathClip && en.mixer) {
    const da = en.mixer.clipAction(cachedDeathClip);
    da.setLoop(THREE.LoopOnce);
    da.clampWhenFinished = true;
    da.reset().fadeIn(0.15).play();
  }
  if (getAbilityState().target?.id === en.id) clearTarget();
  setScore((prev) => prev + 100 * (en.xpReward || 1));
  spawnXPFloat(en.xpReward || 1);
  awardCompanionXP(companionDefId, en.xpReward || 1);
  reportEnemyKill(QUESTS, en.tier);
  let newXP = playerXPRef.current + (en.xpReward || 1);
  let newLevel = playerLevelRef.current;
  let needed = xpForLevel(newLevel);
  let levelsGained = 0;
  while (newXP >= needed) { newXP -= needed; newLevel++; levelsGained++; needed = xpForLevel(newLevel); }
  playerXPRef.current = newXP;
  playerLevelRef.current = newLevel;
  setPlayerXP(newXP);
  setPlayerLevel(newLevel);
  awardXP({ newLevel, newXP, xpForNext: xpForLevel(newLevel), levelsGained });
  if (levelsGained > 0) playActionSound('level_up');
}

/**
 * Fire a companion ability. Returns an effect handle to push onto activeEffects,
 * or null if the cast failed (cooldown / no target / no model).
 */
function fireCompanionAbility({
  abilityId, scene, model, enemies, spawnDamageFloat, spawnHealFloat, onKill,
}) {
  const ab = getCompanionAbilityById(abilityId);
  if (!ab) return null;
  const cdLeft = getCompanionAbilityState().cooldowns[abilityId] || 0;
  if (cdLeft > 0) return null;

  // Heal — self-cast, no target needed
  if (ab.id === 'heal') {
    const hud = getPlayerHUD();
    const newHP = Math.min(hud.maxHP, hud.hp + ab.heal);
    const healed = newHP - hud.hp;
    setHP(newHP);
    if (healed > 0 && spawnHealFloat) spawnHealFloat(healed);
    startCompanionCooldown(abilityId);
    playActionSound('player_jump'); // pleasant whoosh — reuse existing soundbank
    const fx = createHealEffect(scene, () => ({
      x: model.position.x, y: model.position.y, z: model.position.z,
    }));
    return { fx };
  }

  // The other three require a target
  if (ab.requiresTarget) {
    const target = getAbilityState().target;
    if (!target) return null;
    const targetEnemy = enemies.find((e) => e.id === target.id && e.alive && !e.dying);
    if (!targetEnemy) return null;

    startCompanionCooldown(abilityId);

    if (ab.id === 'bite') {
      const dmg = ab.damage;
      targetEnemy.hp -= dmg;
      targetEnemy.hitCooldown = 0.2;
      spawnDamageFloat(targetEnemy.id, dmg);
      updateTargetHP(targetEnemy.id, Math.max(0, targetEnemy.hp));
      playActionSound('enemy_hit');
      const fx = createBiteEffect(
        scene,
        targetEnemy.group.position.x,
        targetEnemy.group.position.y,
        targetEnemy.group.position.z,
      );
      if (targetEnemy.hp <= 0) onKill(targetEnemy);
      return { fx };
    }

    if (ab.id === 'life_drain') {
      const dmg = ab.damage;
      targetEnemy.hp -= dmg;
      targetEnemy.hitCooldown = 0.2;
      spawnDamageFloat(targetEnemy.id, dmg);
      updateTargetHP(targetEnemy.id, Math.max(0, targetEnemy.hp));
      // Heal player
      const hud = getPlayerHUD();
      const newHP = Math.min(hud.maxHP, hud.hp + ab.heal);
      const healed = newHP - hud.hp;
      setHP(newHP);
      if (healed > 0 && spawnHealFloat) spawnHealFloat(healed);
      playActionSound('enemy_hit');
      const fx = createLifeDrainEffect(
        scene,
        () => ({ x: model.position.x, y: model.position.y, z: model.position.z }),
        () => ({
          x: targetEnemy.group.position.x,
          y: targetEnemy.group.position.y,
          z: targetEnemy.group.position.z,
        }),
      );
      if (targetEnemy.hp <= 0) onKill(targetEnemy);
      return { fx };
    }

    if (ab.id === 'teleport_dash') {
      const dmg = ab.damage;
      targetEnemy.hp -= dmg;
      targetEnemy.hitCooldown = 0.2;
      spawnDamageFloat(targetEnemy.id, dmg);
      updateTargetHP(targetEnemy.id, Math.max(0, targetEnemy.hp));
      playActionSound('player_attack');
      const fx = createCompanionTeleportDash(
        scene,
        () => ({ x: model.position.x, y: model.position.y, z: model.position.z }),
        () => ({
          x: targetEnemy.group.position.x,
          y: targetEnemy.group.position.y,
          z: targetEnemy.group.position.z,
        }),
      );
      if (targetEnemy.hp <= 0) onKill(targetEnemy);
      return { fx };
    }
  }

  return null;
}

/**
 * Top-level entry called from the GameWorld3D animate loop once per frame
 * when a Z/X/V/B key was pressed. Wraps cast firing + kill handling.
 *
 * Pass `ctx` containing everything fireCompanionAbility + handleEnemyKill need.
 * Pushes any resulting effect onto `ctx.activeEffectsRef.current`.
 */
export function processCompanionAbilityPress(ctx) {
  const { abilityId, scene, model, enemies, spawnDamageFloat, activeEffectsRef } = ctx;
  if (!abilityId || !model) return;
  const result = fireCompanionAbility({
    abilityId, scene, model, enemies,
    spawnDamageFloat,
    spawnHealFloat: (val) => spawnDamageFloat('player', -val),
    onKill: (en) => handleEnemyKill({ ...ctx, en }),
  });
  if (result?.fx) activeEffectsRef.current.push(result.fx);
}