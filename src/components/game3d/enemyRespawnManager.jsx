// Enemy death + respawn synchronization across all players in the channel.
//
// FLOW:
//  1. When the local player kills an enemy, GameWorld3D calls reportEnemyKill()
//     which broadcasts via WebRTC + schedules a 10s respawn locally.
//  2. When ANY remote player kills an enemy, we receive a 'enemy_killed' action
//     and kill the same enemy on this client.
//  3. After 10 seconds, the enemy respawns at its home position with full HP.
//
// All clients have IDENTICAL enemy IDs (deterministic spawn list), so the
// kill broadcast just needs to carry the enemy id.
import * as THREE from 'three';
import { ENEMY_RESPAWN_SECONDS } from './enemySpawnConfig';

/**
 * Kills an enemy on the local client — starts death animation + 10s respawn timer.
 * Does NOT broadcast (caller decides whether this is a local or remote kill).
 *
 * @param {object} enemy - enemy entry from the enemies[] array in GameWorld3D
 * @param {object} ctx - { scene, cachedDeathClip, onAliveCountChange }
 */
export function killEnemyLocal(enemy, ctx) {
  if (!enemy || !enemy.alive || enemy.dying) return;
  const { cachedDeathClip, onAliveCountChange } = ctx;

  enemy.hp = 0;
  enemy.dying = true;
  enemy.deathTimer = 0;
  enemy.respawnAt = performance.now() + ENEMY_RESPAWN_SECONDS * 1000;

  if (enemy.walkAction) enemy.walkAction.fadeOut(0.15);
  if (enemy.idleAction) enemy.idleAction.fadeOut(0.15);
  if (cachedDeathClip && enemy.mixer) {
    const da = enemy.mixer.clipAction(cachedDeathClip);
    da.setLoop(THREE.LoopOnce);
    da.clampWhenFinished = true;
    da.reset().fadeIn(0.15).play();
    enemy.deathAction = da;
  }
  if (onAliveCountChange) onAliveCountChange();
}

/**
 * Respawns an enemy at its home position. Called by GameWorld3D's animate loop
 * once `performance.now() >= enemy.respawnAt`.
 */
export function respawnEnemy(enemy, ctx) {
  if (!enemy) return;
  const { scene, onAliveCountChange } = ctx;

  // Reset state
  enemy.alive = true;
  enemy.dying = false;
  enemy.deathTimer = 0;
  enemy.respawnAt = null;
  enemy.hp = enemy.maxHp;
  enemy.state = 'idle';
  enemy.stateTimer = 0;
  enemy.target = null;
  enemy.attacking = false;
  enemy.attackWindupTimer = 0;
  enemy.attackCooldown = 0;
  enemy.hitCooldown = 0;

  // Restore visibility — death-fade may have lowered opacity
  if (enemy.tintMaterials) {
    enemy.tintMaterials.forEach((m) => { m.opacity = 1; m.transparent = false; });
  }

  // Move back to home position
  if (enemy.group && enemy.home) {
    enemy.group.position.set(enemy.home[0], enemy.home[1], enemy.home[2]);
    if (!enemy.group.parent && scene) scene.add(enemy.group);
    enemy.group.visible = true;
  }

  // Play idle anim
  if (enemy.idleAction) enemy.idleAction.reset().fadeIn(0.2).play();
  if (onAliveCountChange) onAliveCountChange();
}

/**
 * Broadcast a kill so other players in the channel see the same enemy die.
 * Uses the existing WebRTC `multiplayerLocalAction` channel.
 */
export function broadcastEnemyKill(enemyId, lootCtx) {
  window.dispatchEvent(new CustomEvent('multiplayerLocalAction', {
    detail: { kind: 'enemy_killed', enemy_id: enemyId },
  }));
  // Fire loot drop event so GameWorldLootLayer can roll drops
  if (lootCtx) {
    window.dispatchEvent(new CustomEvent('enemyLootDrop', {
      detail: {
        enemyId,
        tier: lootCtx.tier || 'normal',
        isBoss: !!lootCtx.isBoss,
        x: lootCtx.x ?? 0,
        y: lootCtx.y ?? 0,
        z: lootCtx.z ?? 0,
      },
    }));
  }
}