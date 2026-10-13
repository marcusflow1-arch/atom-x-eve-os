/**
 * G5-0003-A logical v1 browser transport (integration contract only).
 * Requires an APPROVED same-origin authenticated server route to be mounted.
 * No browser-trusted user ID, position, receipt, reward, or token is sent.
 * This module is NOT an authentication provider or a mock backend.
 */
const BASE = '/api/game5/quest';
const TARGETS = Object.freeze({ npc: 'lost-card-elder', card: 'lost-card-ground-01' });

export function createGame5QuestHttpTransport({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('Fetch implementation required');
  async function request(action, input = undefined) {
    const body = action === 'state' ? undefined :
      action === 'pickup' ? { pickupId: TARGETS.card } : { npcId: TARGETS.npc };
    // Strictly fixed body; caller-provided positions, identity, receipts, etc.
    // cannot enter the request. The backend must independently validate proximity.
    if (input && action === 'pickup' && input.pickupId !== TARGETS.card) {
      throw Object.assign(new Error('Invalid Lost Card target'), { status: 400, code: 'INVALID_TARGET' });
    }
    if (input && action !== 'pickup' && action !== 'state' && input.npcId !== TARGETS.npc) {
      throw Object.assign(new Error('Invalid Elder Shen target'), { status: 400, code: 'INVALID_TARGET' });
    }
    const options = {
      method: action === 'state' ? 'GET' : 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
    };
    if (body) {
      options.headers = { 'content-type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    const response = await fetchImpl(`${BASE}/${action}`, options);
    let payload;
    try { payload = await response.json(); }
    catch { payload = null; }
    if (!response.ok) {
      const code = typeof payload?.error === 'string' ? payload.error : 'QUEST_BACKEND_UNAVAILABLE';
      const error = new Error(code);
      error.status = response.status;
      error.code = code;
      throw error;
    }
    if (!payload || typeof payload !== 'object') {
      throw Object.assign(new Error('Invalid Game 5 endpoint response'), { code: 'invalid_snapshot' });
    }
    return payload;
  }
  return Object.freeze({
    load: () => request('state'),
    accept: input => request('accept', input),
    pickup: input => request('pickup', input),
    complete: input => request('complete', input),
  });
}
