// ─── Authoritative Intent Handlers ────────────────────────────────────
// These run ONLY on the host. They are the single place where damage,
// loot ownership, and enemy state get resolved.
//
// Each handler signature:  async (state, intent) => mutations
//
// Mutations shape:
//   {
//     entities: { players?, enemies?, loot? },   // upsert
//     removed:  { players?, enemies?, loot? },   // delete by id
//     events:   [ { kind, ...payload } ],
//   }
//
// MIGRATION NOTE:
//   When backend functions become available, replace the BODY of each
//   handler with a call to the corresponding backend function:
//     combat_damage_enemy    -> base44.functions.combatDamage({...})
//     pvp_damage             -> base44.functions.combatDamage({...})
//     loot_pickup            -> base44.functions.entityAccess({...})
//   The INTENT shape and the MUTATION shape stay the same, so
//   GameWorld3D and all consumers never change.

import gameState from './GameStateManager';

const LOOT_LIFETIME_MS = 60_000;
const PLAYER_INVUL_MS = 500;
const PVP_BASE_DAMAGE = 10;

// ── 1. Enemy takes damage from a player ────────────────────────────────
//    intent: { kind: 'damage_enemy', enemyId, damage, attackerId, crit? }
async function handleDamageEnemy(state, intent) {
  const enemy = state.enemies[intent.enemyId];
  if (!enemy || enemy.hp <= 0) return null;

  const dmg = Math.max(1, Math.floor(intent.damage || 1));
  const newHp = Math.max(0, enemy.hp - dmg);
  const isDeath = newHp === 0;

  const mut = {
    entities: { enemies: { [enemy.id]: { ...enemy, hp: newHp, lastHitBy: intent.attackerId, lastHitAt: Date.now() } } },
    events: [{
      kind: isDeath ? 'enemy_killed' : 'enemy_hit',
      enemyId: enemy.id,
      attackerId: intent.attackerId,
      damage: dmg,
      crit: !!intent.crit,
      hp: newHp,
      maxHp: enemy.maxHp,
    }],
  };

  if (isDeath) {
    // Schedule loot drop authoritatively
    const lootId = gameState.constructor.newId('loot');
    mut.entities.loot = {
      [lootId]: {
        id: lootId,
        kind: intent.lootKind || 'gold',
        amount: intent.lootAmount || (5 + Math.floor(Math.random() * 10)),
        x: enemy.x,
        y: enemy.y,
        z: enemy.z,
        droppedBy: enemy.id,
        droppedAt: Date.now(),
        expiresAt: Date.now() + LOOT_LIFETIME_MS,
      },
    };
    mut.events.push({ kind: 'loot_dropped', lootId, enemyId: enemy.id, attackerId: intent.attackerId });
    // Remove the dead enemy from the world (respawn handled by enemyRespawnManager).
    mut.removed = { enemies: [enemy.id] };
    // ensure we don't also upsert the same enemy
    delete mut.entities.enemies[enemy.id];
  }

  return mut;
}

// ── 2. Player vs player damage ────────────────────────────────────────
//    intent: { kind: 'pvp_damage', targetId, attackerId, weaponMult?, crit? }
async function handlePvpDamage(state, intent) {
  const target = state.players[intent.targetId];
  const attacker = state.players[intent.attackerId];
  if (!target || !attacker || target.hp <= 0) return null;

  // i-frame check (server-side validation)
  if (target.invulnUntil && target.invulnUntil > Date.now()) {
    return { events: [{ kind: 'pvp_blocked', targetId: target.id, reason: 'invuln' }] };
  }

  // Range check — anti-cheat: reject hits beyond plausible range
  const dx = target.x - attacker.x;
  const dz = target.z - attacker.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist > 4.0) {
    return { events: [{ kind: 'pvp_blocked', targetId: target.id, attackerId: attacker.id, reason: 'out_of_range', dist }] };
  }

  const mult = Math.max(0.1, Math.min(3.0, intent.weaponMult || 1));
  const baseDmg = Math.floor(PVP_BASE_DAMAGE * mult);
  const dmg = intent.crit ? Math.floor(baseDmg * 1.5) : baseDmg;
  const newHp = Math.max(0, target.hp - dmg);
  const isDeath = newHp === 0;

  const mut = {
    entities: {
      players: {
        [target.id]: {
          ...target,
          hp: newHp,
          invulnUntil: Date.now() + PLAYER_INVUL_MS,
          lastHitBy: attacker.id,
          lastHitAt: Date.now(),
        },
      },
    },
    events: [{
      kind: isDeath ? 'pvp_killed' : 'pvp_hit',
      attackerId: attacker.id,
      targetId: target.id,
      damage: dmg,
      crit: !!intent.crit,
      hp: newHp,
      maxHp: target.maxHp,
    }],
  };
  return mut;
}

// ── 3. Loot pickup (first-come, authoritative) ────────────────────────
//    intent: { kind: 'pickup_loot', lootId, playerId }
async function handlePickupLoot(state, intent) {
  const loot = state.loot[intent.lootId];
  const player = state.players[intent.playerId];
  if (!loot || !player) return null;

  // Already claimed?
  if (loot.claimedBy) {
    return { events: [{ kind: 'pickup_denied', lootId: loot.id, playerId: player.id, reason: 'already_claimed' }] };
  }

  // Range check
  const dx = loot.x - player.x;
  const dz = loot.z - player.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist > 2.5) {
    return { events: [{ kind: 'pickup_denied', lootId: loot.id, playerId: player.id, reason: 'out_of_range' }] };
  }

  return {
    removed: { loot: [loot.id] },
    events: [{
      kind: 'loot_picked',
      lootId: loot.id,
      playerId: player.id,
      lootKind: loot.kind,
      amount: loot.amount,
    }],
  };
}

// ── 4. Player joined / left (presence) ────────────────────────────────
//    intent: { kind: 'player_join', playerId, displayName, x,y,z }
async function handlePlayerJoin(state, intent) {
  if (state.players[intent.playerId]) return null;
  const p = {
    id: intent.playerId,
    displayName: intent.displayName || 'Player',
    x: intent.x || 0, y: intent.y || 0, z: intent.z || 0,
    rotY: 0,
    hp: 100, maxHp: 100,
    anim: 'idle',
    joinedAt: Date.now(),
  };
  return {
    entities: { players: { [p.id]: p } },
    events: [{ kind: 'player_joined', playerId: p.id, displayName: p.displayName }],
  };
}

async function handlePlayerLeave(state, intent) {
  if (!state.players[intent.playerId]) return null;
  return {
    removed: { players: [intent.playerId] },
    events: [{ kind: 'player_left', playerId: intent.playerId }],
  };
}

// ── 5. Player movement update (light-weight, not authoritative) ───────
//    intent: { kind: 'player_move', playerId, x,y,z, rotY, anim }
//    Host trusts the sender for position (movement isn't anti-cheat critical yet).
async function handlePlayerMove(state, intent) {
  const p = state.players[intent.playerId];
  if (!p) return null;
  return {
    entities: {
      players: {
        [p.id]: { ...p, x: intent.x, y: intent.y, z: intent.z, rotY: intent.rotY, anim: intent.anim },
      },
    },
  };
}

// ── Register all handlers with the singleton ──────────────────────────
export function registerAllIntentHandlers() {
  gameState.registerIntentHandler('damage_enemy', handleDamageEnemy);
  gameState.registerIntentHandler('pvp_damage', handlePvpDamage);
  gameState.registerIntentHandler('pickup_loot', handlePickupLoot);
  gameState.registerIntentHandler('player_join', handlePlayerJoin);
  gameState.registerIntentHandler('player_leave', handlePlayerLeave);
  gameState.registerIntentHandler('player_move', handlePlayerMove);
}

export default registerAllIntentHandlers;