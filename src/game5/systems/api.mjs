import { createHash, randomInt } from 'node:crypto';
import { applyCommand, snapshot, validate } from './engine.mjs';
import { check, RuleError } from './rules.mjs';
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
async function readBody(request) {
  const reader = request.body?.getReader();
  check(reader, 'BODY_REQUIRED');
  let size = 0; const chunks = [];
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.length;
      check(size <= 4096, 'BODY_TOO_LARGE', 'Request exceeds 4 KB.', 413);
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new RuleError('INVALID_JSON'); }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
/** Host must inject verified account authentication and trusted movement/visibility adapters. */
export function createSystemsHandler({ repository, authenticate, getPosition, lineOfSight, allowedOrigins, clock = Date.now, random = () => randomInt(0, 2 ** 32) / 2 ** 32 }) {
  if (!repository || typeof authenticate !== 'function' || !allowedOrigins?.length) throw new Error('Repository, account authentication and explicit origins are required');
  const origins = new Set(allowedOrigins), rate = new Map();
  return async request => {
    try {
      const url = new URL(request.url);
      check(url.pathname === '/api/game5/systems' && !url.search, 'NOT_FOUND', 'Unknown route.', 404);
      check(['GET', 'POST'].includes(request.method), 'METHOD_NOT_ALLOWED', undefined, 405);
      const origin = request.headers.get('origin');
      check(request.method === 'GET' && !origin || origins.has(origin), 'ORIGIN_FORBIDDEN', undefined, 403);
      const identity = await authenticate(request);
      check(identity?.authenticated === true && /^base44:[a-zA-Z0-9_-]{1,100}$/.test(identity.playerId), 'UNAUTHENTICATED', 'Sign in to a verified account.', 401);
      const now = clock(), id = identity.playerId;
      for (const [key, bucket] of rate) if (now - bucket.start >= 1000) rate.delete(key);
      const bucket = rate.get(id) || { start: now, count: 0 }; bucket.count++; rate.set(id, bucket);
      check(bucket.count <= 20, 'RATE_LIMIT', 'Please slow down.', 429);
      if (request.method === 'GET') return json(repository.transaction(id, player => ({ player, response: snapshot(player, now) })).response);
      check(request.headers.get('content-type')?.split(';')[0] === 'application/json', 'CONTENT_TYPE_REQUIRED');
      const body = await readBody(request);
      check(body && Object.keys(body).length === 4 && ['id', 'sequence', 'expectedRevision', 'command'].every(k => Object.hasOwn(body, k)), 'INVALID_ENVELOPE');
      check(typeof body.id === 'string' && /^[a-zA-Z0-9_-]{8,80}$/.test(body.id), 'INVALID_REQUEST_ID');
      check(Number.isSafeInteger(body.sequence) && body.sequence > 0 && Number.isSafeInteger(body.expectedRevision) && body.expectedRevision >= 0, 'INVALID_SEQUENCE');
      validate(body.command);
      const hash = createHash('sha256').update(JSON.stringify(body)).digest('hex');
      // Async external reads happen before acquiring the SQLite write transaction.
      const observed = typeof getPosition === 'function' ? await getPosition({ playerId: id }) : null;
      const position = observed?.authoritative === true && Number.isFinite(observed.observedAt) && observed.observedAt <= now && now - observed.observedAt <= 2500 ? observed.position : null;
      const result = repository.transaction(id, current => {
        const receipt = current.receipts[body.id];
        if (receipt) {
          check(receipt.hash === hash, 'IDEMPOTENCY_CONFLICT', 'Request ID was reused with different contents.', 409);
          return { player: current, response: { ...snapshot(current, now), message: receipt.message, replayed: true } };
        }
        check(body.expectedRevision === current.revision && body.sequence === current.sequence + 1, 'STALE_STATE', 'Refresh before submitting another action.', 409);
        const result = applyCommand(current, body.command, { now, random, position, lineOfSight });
        result.player.sequence = body.sequence;
        result.player.receipts[body.id] = { hash, message: result.message };
        const keys = Object.keys(result.player.receipts);
        for (const old of keys.slice(0, Math.max(0, keys.length - 128))) delete result.player.receipts[old];
        return { player: result.player, response: { ...snapshot(result.player, now), message: result.message, events: result.events } };
      });
      return json(result.response);
    } catch (error) {
      return json({ code: error instanceof RuleError ? error.code : 'SERVICE_UNAVAILABLE', message: error instanceof RuleError ? error.message : 'Systems service is unavailable.' }, error instanceof RuleError ? error.status : 503);
    }
  };
}
