// BossBrain — top-level orchestrator for a single world boss.
//
// Owns: state machine, threat table, skill controller, summoner.
// Receives: per-frame `tick(dt, world)` from GameWorld3D.
// Emits: bossAction events (consumed by GameWorld3D event listener).
//
// World contract passed each tick:
//   {
//     bossEntity:  { id, group, hp, maxHp, alive, dying },
//     players:     Array<{ id, x, z, hp, maxHp, isLocal }>,
//     enemies:     Array<{ id, group, alive, isSummonOf? }>,
//     terrainY:    (x,z) => number|null,
//     dt:          number,
//   }
//
// Movement: the brain *requests* movement by setting bossEntity.aiTarget
// (a THREE.Vector3 stored on the entity). GameWorld3D handles actual
// position update + animation blending in its existing loop.

import * as THREE from 'three';
import { createStateMachine, BOSS_STATES, DETECTION_RANGE, MELEE_RANGE, RANGED_THRESHOLD, ENRAGE_HP_FRAC } from './BossStateMachine';
import { createThreatTable } from './BossThreatSystem';
import { createSkillController, BOSS_ABILITIES } from './BossSkillController';
import { createSummoner } from './BossSummoner';
import { BossPhaseController } from './BossPhaseController';
import { emitAdaptiveAction } from './adaptiveBossEvents';

const PATROL_RADIUS = 6;
const ARENA_RADIUS = 36.5;

function clampToArena(position) {
  const dist = Math.sqrt(position.x * position.x + position.z * position.z);
  if (dist > ARENA_RADIUS) {
    const scale = ARENA_RADIUS / dist;
    position.x *= scale;
    position.z *= scale;
  }
  return position;
}

export function createBossBrain(bossEntity) {
  const sm = createStateMachine();
  const threat = createThreatTable();
  const skills = createSkillController(bossEntity.id);
  const summoner = createSummoner(bossEntity.id);
  const adaptive = new BossPhaseController(bossEntity);

  // Per-instance randomized think cadence — boss "thinks" 4–6 Hz, never in
  // lockstep with other bosses or enemies. This is the cornerstone of the
  // async-AI fix from Phase 5.
  let thinkInterval = 0.16 + Math.random() * 0.08;
  let thinkTimer = Math.random() * thinkInterval;
  let patrolTarget = null;
  let patrolWait = 1 + Math.random() * 3;

  // Spawn anchor — boss returns here when no players are around
  const anchor = {
    x: bossEntity.group.position.x,
    z: bossEntity.group.position.z,
  };

  function pickPatrol() {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * PATROL_RADIUS;
    patrolTarget = clampToArena(new THREE.Vector3(anchor.x + Math.cos(a) * d, 0, anchor.z + Math.sin(a) * d));
  }

  // Receive damage credit from external systems (player attacks etc.)
  function recordDamage(playerId, amount) {
    threat.addThreat(playerId, amount);
  }

  function tick(dt, world) {
    if (!bossEntity.alive || bossEntity.dying) {
      sm.evaluate({ hpFrac: 0, nearbyPlayers: 0, targetDistance: null, castingAbility: null, readyAbility: null, summonCount: 0 });
      return;
    }

    sm.tick(dt);
    threat.tick(dt);
    skills.tick(dt);
    adaptive.tickCooldowns(dt);

    // Despawn expired minions
    const expired = summoner.getExpired();
    if (expired.length) {
      expired.forEach((id) => {
        summoner.notifyDeath(id);
        window.dispatchEvent(new CustomEvent('bossAction', {
          detail: { type: 'despawn_minion', bossId: bossEntity.id, payload: { minionId: id } },
        }));
      });
    }

    thinkTimer -= dt;
    if (thinkTimer > 0) {
      // Between thinks, still run movement toward current aiTarget
      stepMovement(dt);
      return;
    }
    thinkTimer = thinkInterval;
    // Re-randomize think cadence slightly each cycle for organic feel
    thinkInterval = 0.16 + Math.random() * 0.08;

    // ─── Gather snapshot ────────────────────────────────────────────────
    const bossX = bossEntity.group.position.x;
    const bossZ = bossEntity.group.position.z;
    const bossY = bossEntity.group.position.y;

    const playersInRange = world.players
      .map((p) => {
        const dx = p.x - bossX, dz = p.z - bossZ;
        return { ...p, distance: Math.sqrt(dx * dx + dz * dz) };
      })
      .filter((p) => p.hp > 0 && p.distance < DETECTION_RANGE);

    const target = threat.pickTarget(playersInRange, {
      bossX, bossZ, rangedThreshold: RANGED_THRESHOLD,
    });

    const highestPlayerLevel = Math.max(1, ...playersInRange.map((p) => p.level || p.playerLevel || 1));
    adaptive.syncScaling(highestPlayerLevel);
    const segmentEvent = adaptive.syncSegments();
    if (segmentEvent) {
      window.dispatchEvent(new CustomEvent('bossAction', {
        detail: { type: 'phase_shift', bossId: bossEntity.id, payload: segmentEvent },
      }));
    }

    const hpFrac = bossEntity.maxHp > 0 ? bossEntity.hp / bossEntity.maxHp : 1;
    const summonCount = summoner.getCount();

    sm.evaluate({
      hpFrac,
      nearbyPlayers: playersInRange.length,
      targetDistance: target ? target.distance : null,
      castingAbility: skills.currentCastId(),
      readyAbility: null,
      summonCount,
    });

    const enraged = sm.isEnraged();
    const state = sm.getState();

    // ─── Behavior per state ─────────────────────────────────────────────
    if (skills.isCasting()) {
      // Locked while channeling — stop moving
      bossEntity.aiTarget = null;
      return;
    }

    if (state === BOSS_STATES.DEAD) {
      bossEntity.aiTarget = null;
      return;
    }

    if (state === BOSS_STATES.IDLE) {
      // Slow patrol around anchor
      patrolWait -= thinkInterval;
      if (patrolWait <= 0 || !patrolTarget) {
        pickPatrol();
        patrolWait = 2 + Math.random() * 4;
      }
      bossEntity.aiTarget = patrolTarget;
      bossEntity.aiSpeed = 0.6; // slow walk
      stepMovement(dt);
      return;
    }

    if (state === BOSS_STATES.SEARCHING) {
      // Look toward closest detected player; don't move yet
      if (playersInRange.length > 0) {
        const p = playersInRange[0];
        faceTowards(p.x, p.z);
      }
      bossEntity.aiTarget = null;
      return;
    }

    // ── Combat states — try to cast an ability, otherwise reposition ──
    if (target) {
      faceTowards(target.x, target.z);

      // Build ability-choice context
      const choiceCtx = {
        targetDistance: target.distance,
        nearbyPlayerCount: playersInRange.length,
        hpFrac,
        summonCount,
        enraged,
      };
      const adaptiveAction = adaptive.decide(dt, target);
      if (adaptiveAction && emitAdaptiveAction(bossEntity, adaptiveAction, target, adaptive)) {
        bossEntity.aiTarget = null;
      } else {
        const chosen = skills.chooseAbility(choiceCtx);
        if (chosen) {
          const cdMult = enraged ? 0.65 : 1; // enraged → 35% shorter recovery
          const payload = buildPayload(chosen, target, playersInRange, bossX, bossZ, bossY, cdMult);
          if (payload) skills.tryCast(chosen, payload);
        }
      }

      // Position management — engage / kite based on state
      if (state === BOSS_STATES.MELEE_COMBAT || state === BOSS_STATES.ENGAGING) {
        // Close to melee range; once inside, stop
        if (target.distance > MELEE_RANGE - 0.5) {
          bossEntity.aiTarget = new THREE.Vector3(target.x, 0, target.z);
          bossEntity.aiSpeed = enraged ? 2.2 : 1.4;
        } else {
          bossEntity.aiTarget = null;
        }
      } else if (state === BOSS_STATES.RANGED_COMBAT) {
        // Hold position, gently rotate around target if too close-too-far
        if (target.distance < RANGED_THRESHOLD * 0.6) {
          // Back up
          const dx = bossX - target.x, dz = bossZ - target.z;
          const d = Math.sqrt(dx*dx + dz*dz) || 1;
          bossEntity.aiTarget = new THREE.Vector3(bossX + (dx/d) * 3, 0, bossZ + (dz/d) * 3);
          bossEntity.aiSpeed = enraged ? 1.6 : 1.0;
        } else {
          bossEntity.aiTarget = null;
        }
      }
    }

    stepMovement(dt);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────
  function faceTowards(x, z) {
    const dx = x - bossEntity.group.position.x;
    const dz = z - bossEntity.group.position.z;
    const ang = Math.atan2(dx, dz);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ang);
    bossEntity.group.quaternion.slerp(q, 0.12);
  }

  function stepMovement(dt) {
    const tgt = bossEntity.aiTarget;
    if (!tgt) return;
    const dx = tgt.x - bossEntity.group.position.x;
    const dz = tgt.z - bossEntity.group.position.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.3) return;
    const speed = bossEntity.aiSpeed || 1.2;
    const nx = dx / d, nz = dz / d;
    bossEntity.group.position.x += nx * speed * dt;
    bossEntity.group.position.z += nz * speed * dt;
    clampToArena(bossEntity.group.position);
    const ang = Math.atan2(nx, nz);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ang);
    bossEntity.group.quaternion.slerp(q, 0.18);
  }

  function buildPayload(abilityId, target, players, bossX, bossZ, bossY, cdMult) {
    const yaw = Math.atan2(target.x - bossX, target.z - bossZ);
    switch (abilityId) {
      case 'meteor_rain': {
        // 3–4 impact points, weighted toward grouped players
        const impacts = [];
        const baseCount = 3 + (sm.isEnraged() ? 1 : 0);
        for (let i = 0; i < baseCount; i++) {
          const p = players[i % players.length];
          if (p) {
            impacts.push({
              x: p.x + (Math.random() - 0.5) * 2,
              z: p.z + (Math.random() - 0.5) * 2,
            });
          } else {
            impacts.push({ x: bossX + (Math.random() - 0.5) * 6, z: bossZ + (Math.random() - 0.5) * 6 });
          }
        }
        return { impacts, cdMult };
      }
      case 'shadow_charge':
        return { fromX: bossX, fromZ: bossZ, targetX: target.x, targetZ: target.z, cdMult };
      case 'summon_legion': {
        if (!summoner.canSummon()) return null;
        const count = sm.isEnraged() ? 6 : 4;
        return { x: bossX, z: bossZ, count, cdMult };
      }
      case 'world_breaker':
        return { x: bossX, z: bossZ, yaw, cdMult };
      case 'chaos_orbs': {
        const orbTargets = [];
        const baseCount = sm.isEnraged() ? 4 : 3;
        for (let i = 0; i < baseCount; i++) {
          orbTargets.push(players[i % players.length]?.id || target.id);
        }
        return { x: bossX, z: bossZ, y: bossY, orbs: orbTargets, cdMult };
      }
      default: return null;
    }
  }

  return {
    bossId: bossEntity.id,
    tick,
    recordDamage,
    onMinionSpawned: (id, role) => summoner.register(id, role),
    onMinionDied: (id) => summoner.notifyDeath(id),
    onTargetDied: (playerId) => threat.removeTarget(playerId),
    debug: () => ({
      state: sm.getState(),
      enraged: sm.isEnraged(),
      summons: summoner.getCount(),
      casting: skills.currentCastId(),
      adaptive: adaptive.debug(),
    }),
  };
}

export { BOSS_ABILITIES, BOSS_STATES };