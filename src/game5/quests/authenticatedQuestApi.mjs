/**
 * Game 5 only — authenticated server-side integration seam.
 *
 * Intended to run INSIDE a trusted backend (for example a Base44 Function).
 * No client imports. Deliberately no production persistence implementation:
 * supply an independently verified atomic repository, never the dev adapter.
 *
 * The request body cannot provide identity, state, position, or inventory
 * receipts. Base44 auth.me() and server movement are separate required inputs.
 */
import { createLostCardQuestService } from './lostCardQuest.mjs';
import { DEV_WORLD, requireNearby, GameplayInputError } from '../gameplay/world.mjs';

export class QuestApiError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.name = 'QuestApiError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Inject the ACTUAL Base44 SDK createClientFromRequest from the hosted backend.
 * user identity comes ONLY from auth.me's server-verified result, never JSON.
 * This adapter does not itself implement identity proof or deploy a function.
 */
export function createBase44SessionAuthenticator({ createClientFromRequest } = {}) {
  if (typeof createClientFromRequest !== 'function') {
    throw new TypeError('Verified Base44 createClientFromRequest required');
  }
  return async (request) => {
    let base44;
    try {
      base44 = createClientFromRequest(request);
      const user = await base44?.auth?.me();
      if (!user?.id || typeof user.id !== 'string' || !user.id.trim()) {
        throw new QuestApiError('UNAUTHORIZED', 401);
      }
      return Object.freeze({ authenticated: true, playerId: `base44:${user.id}` });
    } catch (error) {
      if (error instanceof QuestApiError) throw error;
      if (error?.status === 401 || error?.status === 403) {
        throw new QuestApiError('UNAUTHORIZED', 401);
      }
      throw new QuestApiError('AUTH_BACKEND_UNAVAILABLE', 503);
    }
  };
}

const paths = Object.freeze({
  '/api/game5/quest/state': 'state',
  '/api/game5/quest/accept': 'accept',
  '/api/game5/quest/pickup': 'pickup',
  '/api/game5/quest/complete': 'complete',
});
const forbidden = new Set([
  'playerId', 'userId', 'actor', 'authenticated', 'receipt', 'event',
  'cardId', 'cardInstanceId', 'inventory', 'position', 'quest', 'state',
  'reward', 'wallet', 'progress', 'testWallet', 'coordinates',
]);

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
      'x-content-type-options': 'nosniff', 'vary': 'authorization' },
  });
}

async function safeJson(request) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new QuestApiError('JSON_REQUIRED', 415);
  }
  const raw = await request.text();
  if (raw.length > 2048) throw new QuestApiError('REQUEST_TOO_LARGE', 413);
  let data;
  try { data = JSON.parse(raw); }
  catch { throw new QuestApiError('INVALID_JSON', 400); }
  if (data === null || Array.isArray(data) || typeof data !== 'object') {
    throw new QuestApiError('INVALID_JSON', 400);
  }
  if (Object.keys(data).some((key) => forbidden.has(key))) {
    throw new QuestApiError('FORBIDDEN_CLIENT_FIELDS', 400);
  }
  return data;
}

function exactFields(input, allowed) {
  if (Object.keys(input).some((key) => !allowed.includes(key))) {
    throw new QuestApiError('UNEXPECTED_FIELDS', 400);
  }
}

function assertTrustedLocation(location, target, { world, now, maxPositionAgeMs }) {
  // No user-supplied position is ever passed to this function.
  if (!location || location.authoritative !== true ||
      !Number.isFinite(location.observedAt) ||
      location.observedAt > now || now - location.observedAt > maxPositionAgeMs ||
      location.worldId !== 'game5-lost-card-world') {
    throw new QuestApiError('AUTHORITATIVE_POSITION_UNAVAILABLE', 503);
  }
  try { requireNearby(location.position, target, world); }
  catch (error) {
    if (error instanceof GameplayInputError && error.status === 403) {
      throw new QuestApiError('NOT_NEAR_TARGET', 403);
    }
    throw new QuestApiError('AUTHORITATIVE_POSITION_UNAVAILABLE', 503);
  }
}

/**
 * Framework-neutral Request -> Response handler for a future server route.
 * It does NOT attach itself to the existing development server or Base44.
 * Movement authority must obtain player position from trusted server state and
 * validate speed/time/path/teleports; never reflect a browser position claim.
 */
export function createAuthenticatedQuestHandler({
  repository, authenticate, getAuthoritativePosition,
  world = DEV_WORLD, clock = () => Date.now(), maxPositionAgeMs = 2500,
  allowedOrigins = [],
} = {}) {
  if (typeof repository?.read !== 'function' || typeof repository?.transact !== 'function') {
    throw new TypeError('Atomic persistent quest repository required');
  }
  if (typeof authenticate !== 'function') {
    throw new TypeError('Server-side Base44 session authenticator required');
  }
  if (!Array.isArray(allowedOrigins)) throw new TypeError('allowedOrigins must be an array');
  if (typeof clock !== 'function' || !Number.isFinite(maxPositionAgeMs) || maxPositionAgeMs <= 0) {
    throw new TypeError('Invalid server clock/position freshness configuration');
  }

  // Trusted inventory input is disabled on this route; only the server-owned
  // atomic collectTrustedCard path may issue a receipt.
  const service = createLostCardQuestService({ repository, verifyCollection: async () => false });

  async function snapshot(actor) {
    const state = await service.getQuestState({ actor });
    const record = await repository.read(actor.playerId);
    return {
      quest: state, cardCollected: state.objective.current === state.objective.required,
      testWallet: record.wallet.game5_quest_token ?? 0,
      isolatedTestOnly: true,
    };
  }

  async function requireServerProximity(actor, target) {
    if (typeof getAuthoritativePosition !== 'function') {
      throw new QuestApiError('MOVEMENT_AUTHORITY_NOT_CONFIGURED', 503);
    }
    let location;
    try {
      // Only trusted identity and target type. No request body or coordinates.
      location = await getAuthoritativePosition({ playerId: actor.playerId });
    } catch {
      throw new QuestApiError('AUTHORITATIVE_POSITION_UNAVAILABLE', 503);
    }
    assertTrustedLocation(location, target, { world, now: clock(), maxPositionAgeMs });
    return true;
  }

  return async function handleGame5QuestRequest(request) {
    try {
      const url = new URL(request.url);
      const action = paths[url.pathname];
      if (!action) return json(404, { error: 'UNKNOWN_ROUTE' });
      if (url.search) return json(400, { error: 'UNEXPECTED_QUERY' });
      if (request.method !== (action === 'state' ? 'GET' : 'POST')) {
        return json(405, { error: 'METHOD_NOT_ALLOWED' });
      }

      const origin = request.headers.get('origin');
      if (origin && !allowedOrigins.includes(origin)) {
        return json(403, { error: 'ORIGIN_FORBIDDEN' });
      }

      // SECURITY: Only a trusted backend may supply this authenticator.
      // Authentication is performed even for reads and before mutations.
      const actor = await authenticate(request);
      if (actor?.authenticated !== true ||
          typeof actor.playerId !== 'string' || !actor.playerId.startsWith('base44:') ||
          actor.playerId.length <= 7) throw new QuestApiError('UNAUTHORIZED', 401);

      if (action === 'state') {
        return json(200, { snapshot: await snapshot(actor) });
      }

      const body = await safeJson(request);
      if (action === 'pickup') {
        exactFields(body, ['pickupId']);
        if (body.pickupId !== world.card.id) throw new QuestApiError('INVALID_TARGET', 400);
        const result = await service.collectTrustedCard({
          actor,
          authorizeCollection: async () => requireServerProximity(actor, world.card),
        });
        return json(200, { snapshot: await snapshot(actor), changed: result.progressed });
      }

      exactFields(body, ['npcId']);
      if (body.npcId !== world.npc.id) throw new QuestApiError('INVALID_TARGET', 400);
      await requireServerProximity(actor, world.npc);
      if (action === 'accept') {
        const result = await service.acceptQuest({ actor });
        return json(200, { snapshot: await snapshot(actor), changed: result.accepted });
      }
      const result = await service.completeQuest({ actor });
      return json(200, { snapshot: await snapshot(actor), changed: result.rewarded });
    } catch (error) {
      if (error instanceof QuestApiError) return json(error.status, { error: error.code });
      if (error instanceof GameplayInputError) return json(error.status, { error: 'INVALID_INTERACTION' });
      return json(503, { error: 'QUEST_BACKEND_UNAVAILABLE' });
    }
  };
}
