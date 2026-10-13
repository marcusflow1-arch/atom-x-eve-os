/**
 * G5-0004-A: deploy-preparation only — Base44 named-function request adapter.
 *
 * Actual hosting: approved backend function "game5Quest" invoked via
 * base44.functions.invoke('game5Quest', {action, ...targetIds}).
 *
 * This module is deliberately not mounted/deployed. Its dependencies must be
 * injected from a trusted Base44-hosted backend, never from a browser.
 * No production storage or movement provider is silently substituted.
 */
import {
  createAuthenticatedQuestHandler,
  createBase44SessionAuthenticator,
} from './authenticatedQuestApi.mjs';

const ACTIONS = Object.freeze({
  state: { method: 'GET', path: '/api/game5/quest/state' },
  accept: { method: 'POST', path: '/api/game5/quest/accept' },
  pickup: { method: 'POST', path: '/api/game5/quest/pickup' },
  complete: { method: 'POST', path: '/api/game5/quest/complete' },
});

function respond(status, error) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'vary': 'origin, authorization',
    },
  });
}

function inspectBody(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'INVALID_JSON';
  }
  if (!Object.hasOwn(ACTIONS, value.action)) return 'INVALID_ACTION';
  const keys = Object.keys(value);
  const expected = value.action === 'state' ? ['action'] :
    value.action === 'pickup' ? ['action', 'pickupId'] : ['action', 'npcId'];
  if (keys.some((key) => !expected.includes(key)) || expected.some((key) => !keys.includes(key))) {
    return 'UNEXPECTED_FIELDS';
  }
  return null;
}

/**
 * Exposed only by a separately approved deployment wrapper using
 * createClientFromRequest from the REAL Base44 SDK:
 *   import { createClientFromRequest } from 'npm:@base44/sdk';
 *   Deno.serve(createBase44QuestFunction({ createClientFromRequest, ... }));
 *
 * No runtime fallback: a shared transactional repository, server movement
 * provider, and exact deployment origin(s) must be supplied by specialists.
 */
export function createBase44QuestFunction({
  createClientFromRequest, repository, getAuthoritativePosition,
  allowedOrigins, clock, world, maxPositionAgeMs,
} = {}) {
  if (typeof createClientFromRequest !== 'function') {
    throw new TypeError('Base44 hosted createClientFromRequest is required');
  }
  if (typeof repository?.transact !== 'function' || typeof repository?.read !== 'function') {
    throw new TypeError('Approved shared transactional Game 5 repository is required');
  }
  if (repository.constructor?.name === 'FileQuestRepository' ||
      repository.constructor?.name === 'DevQuestRepository') {
    throw new TypeError('File and development repositories cannot be hosted');
  }
  if (!Array.isArray(allowedOrigins) || !allowedOrigins.length ||
      allowedOrigins.some((value) => typeof value !== 'string' || !/^https:\/\/[^/]+$/.test(value))) {
    throw new TypeError('Explicit HTTPS Origin allowlist required for hosted function');
  }
  const authenticate = createBase44SessionAuthenticator({ createClientFromRequest });
  const options = { repository, getAuthoritativePosition, allowedOrigins, clock, world, maxPositionAgeMs };
  return async function game5Quest(request) {
    try {
      if (request?.method !== 'POST') return respond(405, 'METHOD_NOT_ALLOWED');
      const origin = request.headers.get('origin');
      // Reject missing Origin. No cookie-credentialed CSRF exemption is assumed.
      // Verify SDK invoke sends Origin in real hosted testing before activation.
      if (!origin || !allowedOrigins.includes(origin)) return respond(403, 'ORIGIN_FORBIDDEN');
      if (request.headers.get('sec-fetch-site') === 'cross-site') return respond(403, 'ORIGIN_FORBIDDEN');
      if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
        return respond(415, 'JSON_REQUIRED');
      }
      const raw = await request.text();
      if (raw.length > 2048) return respond(413, 'REQUEST_TOO_LARGE');
      let data;
      try { data = JSON.parse(raw); }
      catch { return respond(400, 'INVALID_JSON'); }
      const invalid = inspectBody(data);
      if (invalid) return respond(400, invalid);
      const { action, ...params } = data;
      const operation = ACTIONS[action];
      // The internal URL is only an adapter for the verified logical API.
      // Auth MUST be checked against the ORIGINAL Base44 request, not a
      // reconstructed object lacking Base44's injected session context.
      const route = createAuthenticatedQuestHandler({
        ...options,
        authenticate: () => authenticate(request),
      });
      const logical = new Request(`https://game5.internal${operation.path}`, {
        method: operation.method,
        headers: { origin, ...(operation.method === 'POST' ? { 'content-type': 'application/json' } : {}) },
        body: operation.method === 'POST' ? JSON.stringify(params) : undefined,
      });
      return await route(logical);
    } catch {
      return respond(503, 'QUEST_BACKEND_UNAVAILABLE');
    }
  };
}
