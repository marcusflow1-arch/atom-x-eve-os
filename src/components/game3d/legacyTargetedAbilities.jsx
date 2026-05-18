// legacyTargetedAbilities — extracted verbatim from GameWorld3D's animate loop.
// Handles the three legacy targeted spells (lightning_strike, frost_tornado,
// shadow_teleport) that still flow through the old abilityStore pipeline.
//
// Kept as a standalone helper so GameWorld3D stays under the 2000-line cap
// and so the new boss subsystem can be added without further size pressure.

import * as THREE from 'three';
import { createLightningStrike } from './LightningStrikeEffect';
import { createShadowTeleport } from './ShadowTeleportEffect';
import { createFrostTornado } from './FrostTornadoEffect';
import { applySpellScaling } from './statsSystem';

/**
 * Handle a legacy targeted ability cast.
 * Mutates the enemies array, spawns VFX into activeEffectsRef, and grants XP.
 */
export function castLegacyTargetedAbility(args) {
  const {
    ab, target, enemies, scene, model, activeEffectsRef,
    playActionSound, spawnDamageFloat, spawnXPFloat,
    getPlayerHUD, playerDerivedRef, cachedDeathClip,
    awardCompanionXP, companionDefRef, reportEnemyKill, QUESTS,
    setScore, setPlayerXP, setPlayerLevel, awardXP,
    playerXPRef, playerLevelRef, xpForLevel,
    clearTarget, updateTargetHP, getAbilityState,
  } = args;

  const targetEnemy = enemies.find((e) => e.id === target.id && e.alive && !e.dying);
  if (!targetEnemy) return;

  const grantKill = (en) => {
    playActionSound('enemy_death');
    en.hp = 0; en.dying = true; en.deathTimer = 0;
    if (en.walkAction) en.walkAction.fadeOut(0.15);
    if (en.idleAction) en.idleAction.fadeOut(0.15);
    if (cachedDeathClip && en.mixer) {
      const da = en.mixer.clipAction(cachedDeathClip);
      da.setLoop(THREE.LoopOnce); da.clampWhenFinished = true;
      da.reset().fadeIn(0.15).play();
    }
    if (getAbilityState().target?.id === en.id) clearTarget();
    setScore((p) => p + 100 * (en.xpReward || 1));
    spawnXPFloat(en.xpReward || 1);
    awardCompanionXP(companionDefRef.current?.id, en.xpReward || 1);
    reportEnemyKill(QUESTS, en.tier);
    let nXP = playerXPRef.current + (en.xpReward || 1);
    let nLv = playerLevelRef.current;
    let need = xpForLevel(nLv); let gained = 0;
    while (nXP >= need) { nXP -= need; nLv++; gained++; need = xpForLevel(nLv); }
    playerXPRef.current = nXP; playerLevelRef.current = nLv;
    setPlayerXP(nXP); setPlayerLevel(nLv);
    awardXP({ newLevel: nLv, newXP: nXP, xpForNext: xpForLevel(nLv), levelsGained: gained, xpGained: en.xpReward || 1 });
    if (gained > 0) playActionSound('level_up');
  };

  if (ab.id === 'shadow_teleport') {
    const fx = createShadowTeleport(scene, model, () => ({
      x: targetEnemy.group.position.x,
      y: targetEnemy.group.position.y,
      z: targetEnemy.group.position.z,
    }));
    activeEffectsRef.current.push(fx);
    playActionSound('player_jump');
    return;
  }

  if (ab.id === 'frost_tornado') {
    const tx = targetEnemy.group.position.x;
    const tz = targetEnemy.group.position.z;
    const gy = targetEnemy.group.position.y;
    const fx = createFrostTornado(scene, tx, tz, gy);
    activeEffectsRef.current.push(fx);
    playActionSound('player_attack');
    const radius = ab.radius || 4.5;
    const liveDerived = getPlayerHUD().derived || playerDerivedRef.current;
    const baseDmg = applySpellScaling(
      ab.damage + (liveDerived.elementalDamage || 0) * 0.4,
      liveDerived, { isDoT: true },
    );
    [400, 1000, 1700].forEach((ms) => {
      setTimeout(() => {
        enemies.forEach((en) => {
          if (!en.alive || en.dying) return;
          const dx = en.group.position.x - tx;
          const dz = en.group.position.z - tz;
          if (dx * dx + dz * dz > radius * radius) return;
          en.hp -= baseDmg;
          en.hitCooldown = 0.2;
          spawnDamageFloat(en.id, baseDmg);
          updateTargetHP(en.id, Math.max(0, en.hp));
          if (en.hp <= 0) grantKill(en);
        });
      }, ms);
    });
    return;
  }

  if (ab.id === 'lightning_strike') {
    const tx = targetEnemy.group.position.x;
    const tz = targetEnemy.group.position.z;
    const gy = targetEnemy.group.position.y;
    const fx = createLightningStrike(scene, tx, tz, gy);
    activeEffectsRef.current.push(fx);
    setTimeout(() => {
      if (!targetEnemy.alive || targetEnemy.dying) return;
      const liveDerived = getPlayerHUD().derived || playerDerivedRef.current;
      const dmg = applySpellScaling(
        ab.damage + (liveDerived.elementalDamage || 0) * 0.5,
        liveDerived, { isElemental: true },
      );
      targetEnemy.hp -= dmg;
      spawnDamageFloat(targetEnemy.id, dmg);
      updateTargetHP(targetEnemy.id, Math.max(0, targetEnemy.hp));
      playActionSound('player_attack');
      if (targetEnemy.hp <= 0) grantKill(targetEnemy);
    }, 300);
  }
}