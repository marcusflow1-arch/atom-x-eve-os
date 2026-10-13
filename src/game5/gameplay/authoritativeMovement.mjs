/**
 * G5-0004-B: SERVER-ONLY, single-process authoritative movement prototype.
 * Never import into a browser. Never deploy this Map as distributed state.
 * The only movement input is intent (direction, sprint, sequence) and an opaque
 * session nonce; position and elapsed time come entirely from this server.
 */
import { randomUUID } from 'node:crypto';
import { DEV_WORLD } from './world.mjs';

export const GAME5_WORLD_ID = 'game5-lost-card-world';
export const GAME5_WALK_SPEED = 5;
export const GAME5_SPRINT_SPEED = 8;
export const GAME5_INPUT_INTERVAL_MS = 100;

export class MovementAuthorityError extends Error {
  constructor(code, status = 400) { super(code); this.name = 'MovementAuthorityError'; this.code = code; this.status = status; }
}

const wall = Object.freeze([
  { x: -10, z: -17, halfX: 3.5, halfZ: 3 },
  { x: 9, z: -19, halfX: 3.5, halfZ: 3 },
]);
const trees = Object.freeze([[-7, 2], [7, 4], [-16, -8], [17, 7], [16, -10]]);
const radius = 0.4;

function collisionFree(x, z, world) {
  if (x < -world.bounds + radius || x > world.bounds - radius ||
      z < -world.bounds + radius || z > world.bounds - radius) return false;
  // Swept-circle approximated by sub-steps ≤ 0.1m, no tunneling through walls.
  for (const box of wall) {
    const nearX = Math.max(box.x-box.halfX, Math.min(x, box.x+box.halfX));
    const nearZ = Math.max(box.z-box.halfZ, Math.min(z, box.z+box.halfZ));
    if (Math.hypot(x-nearX, z-nearZ) < radius) return false;
  }
  for (const [tx, tz] of trees) if (Math.hypot(x-tx,z-tz) < radius + 0.32) return false;
  if (Math.hypot(x-world.npc.x,z-world.npc.z) < radius + 0.48) return false;
  return true;
}

function integrate(record, elapsedMs, world) {
  const { moveX, moveZ, sprint } = record.intent;
  const norm = Math.hypot(moveX, moveZ);
  if (!norm || !elapsedMs) return;
  const distance = (sprint ? GAME5_SPRINT_SPEED : GAME5_WALK_SPEED) * elapsedMs/1000;
  const totalX = moveX/norm * distance;
  const totalZ = moveZ/norm * distance;
  const steps = Math.max(1, Math.ceil(distance/0.1));
  for (let i=0; i<steps; i++) {
    const x = record.position.x + totalX/steps;
    if (collisionFree(x, record.position.z, world)) record.position.x = x;
    const z = record.position.z + totalZ/steps;
    if (collisionFree(record.position.x, z, world)) record.position.z = z;
  }
}

function assertPlayerId(playerId) {
  if (typeof playerId !== 'string' || !/^base44:[^\s]{1,200}$/.test(playerId)) {
    throw new MovementAuthorityError('UNAUTHORIZED', 401);
  }
}
function assertIntent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).some(key => !['sessionId','seq','moveX','moveZ','sprint'].includes(key)) ||
      typeof input.sessionId !== 'string' || input.sessionId.length < 20 ||
      !Number.isSafeInteger(input.seq) || input.seq < 1 ||
      !Number.isFinite(input.moveX) || !Number.isFinite(input.moveZ) ||
      Math.abs(input.moveX)>1 || Math.abs(input.moveZ)>1 || typeof input.sprint !== 'boolean') {
    throw new MovementAuthorityError('INVALID_MOVEMENT_INTENT');
  }
}

export function createGame5MovementAuthority({
  world = DEV_WORLD,
  now = () => Date.now(),
  maxStepMs = 150,
  maxInputGapMs = 300,
  staleAfterMs = 2500,
  reconnectGraceMs = 30000,
} = {}) {
  if (typeof now !== 'function' || !Number.isFinite(maxStepMs) || maxStepMs <= 0 || maxStepMs > 150 ||
      !Number.isFinite(maxInputGapMs) || maxInputGapMs < maxStepMs ||
      !Number.isFinite(staleAfterMs) || staleAfterMs <= maxInputGapMs ||
      !Number.isFinite(reconnectGraceMs) || reconnectGraceMs <= staleAfterMs) {
    throw new TypeError('Invalid Game 5 movement authority configuration');
  }
  // Explicitly single-process, does not pretend to persist across workers.
  const players = new Map();
  const time = () => {
    const t = now();
    if (!Number.isFinite(t) || t < 0) throw new MovementAuthorityError('SERVER_CLOCK_UNAVAILABLE', 503);
    return t;
  };
  function connect({ playerId }) {
    assertPlayerId(playerId);
    const t = time();
    let p = players.get(playerId);
    if (!p || t < p.lastSeenAt || t - p.lastSeenAt > reconnectGraceMs) {
      p = { position: {x: world.spawn.x, z: world.spawn.z}, lastSeenAt: t };
    }
    // Every connection invalidates all old sessions for THIS authenticated player.
    p.sessionId = randomUUID();
    p.seq = 0;
    p.lastInputAt = t;
    p.lastSeenAt = t;
    p.observedAt = null; // reconnect by itself cannot revive a stale quest location
    p.intent = { moveX: 0, moveZ: 0, sprint: false };
    players.set(playerId, p);
    return { sessionId: p.sessionId, seq: p.seq, position: { ...p.position }, worldId: GAME5_WORLD_ID };
  }
  function input({ playerId, intent }) {
    assertPlayerId(playerId);
    assertIntent(intent);
    const t = time();
    const p = players.get(playerId);
    if (!p || p.sessionId !== intent.sessionId || t < p.lastInputAt ||
        t - p.lastSeenAt > reconnectGraceMs) throw new MovementAuthorityError('MOVEMENT_SESSION_EXPIRED', 401);
    if (intent.seq <= p.seq) throw new MovementAuthorityError('OUT_OF_ORDER_MOVEMENT', 409);
    const gap = t - p.lastInputAt;
    // Apply PREVIOUS movement intent for elapsed trusted server time only.
    // A stale input never accumulates a backlog of time, preventing teleports.
    if (gap <= maxInputGapMs) integrate(p, Math.min(maxStepMs, gap), world);
    p.lastInputAt = t;
    p.lastSeenAt = t;
    p.observedAt = t;
    p.seq = intent.seq;
    p.intent = { moveX: intent.moveX, moveZ: intent.moveZ, sprint: intent.sprint };
    return { ackSeq: p.seq, position: { ...p.position }, observedAt: t, worldId: GAME5_WORLD_ID };
  }
  function disconnect({ playerId, sessionId }) {
    assertPlayerId(playerId);
    const p = players.get(playerId);
    if (!p || p.sessionId !== sessionId) throw new MovementAuthorityError('MOVEMENT_SESSION_EXPIRED', 401);
    p.sessionId = null;
    p.observedAt = null;
    p.intent = { moveX: 0, moveZ: 0, sprint: false };
    return { disconnected: true };
  }
  function getAuthoritativePosition({ playerId }) {
    assertPlayerId(playerId);
    const p = players.get(playerId);
    const t = time();
    if (!p || !p.sessionId || !Number.isFinite(p.observedAt) ||
        t < p.observedAt || t - p.observedAt > staleAfterMs ||
        t - p.lastSeenAt > reconnectGraceMs) return null;
    return { position: { ...p.position }, observedAt: p.observedAt,
      worldId: GAME5_WORLD_ID, authoritative: true };
  }
  return Object.freeze({ connect, input, disconnect, getAuthoritativePosition });
}