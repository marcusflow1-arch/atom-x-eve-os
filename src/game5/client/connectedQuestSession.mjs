/**
 * Game 5 Connected Test presentation boundary.
 *
 * No mock authentication, no implicit fallback and NO server quest imports.
 * G5-0003-A must supply a reviewed, authenticated transport implementing:
 *   load() -> { snapshot }, accept({position,npcId}) -> {snapshot,notice},
 *   pickup({position,pickupId}) -> {snapshot,notice},
 *   complete({position,npcId}) -> {snapshot,notice}.
 * This boundary deliberately assumes no HTTP route/token contract.
 */
export const GAME5_MODES = Object.freeze({ DEMO: 'demo', CONNECTED: 'connected' });
const STATES = new Set(['not_started', 'active', 'ready_to_complete', 'completed']);
const ACTIONS = new Set(['accept', 'pickup', 'complete']);

export function assertServerSnapshot(value) {
  const snap = value?.snapshot;
  const quest = snap?.quest;
  const objective = quest?.objective;
  if (snap?.isolatedTestOnly !== true || !quest || !STATES.has(quest.status) ||
      !objective || objective.required !== 1 ||
      !Number.isInteger(objective.current) ||
      ![0, 1].includes(objective.current) ||
      ((quest.status === 'not_started' || quest.status === 'active') && objective.current !== 0) ||
      ((quest.status === 'ready_to_complete' || quest.status === 'completed') && objective.current !== 1) ||
      (snap.cardCollected === true && objective.current !== 1) ||
      (snap.testWallet != null && (!Number.isFinite(snap.testWallet) || snap.testWallet < 0))) {
    throw Object.assign(new Error('Invalid authoritative Game 5 quest snapshot'), { code: 'invalid_snapshot' });
  }
  return structuredClone(snap);
}

function classify(error) {
  const status = Number(error?.status ?? error?.response?.status ?? 0);
  if (status === 401 || (status === 403 && error?.code !== 'NOT_NEAR_TARGET')) return 'unauthorized';
  if (status === 403 && error?.code === 'NOT_NEAR_TARGET') return 'rejected';
  if (status === 409 || status === 422 || status === 400) return 'rejected';
  if (error?.code === 'invalid_snapshot') return 'backend_failure';
  if (status >= 500) return 'backend_failure';
  return 'disconnected';
}

export function createConnectedQuestSession({ transport = null, onChange = () => {} } = {}) {
  let state = { phase: 'disconnected', snapshot: null, error: '', notice: '', busy: false };
  let inFlight = false;
  let disposed = false;
  const publish = next => {
    if (disposed) return;
    state = { ...state, ...next };
    onChange({ ...state, snapshot: state.snapshot ? structuredClone(state.snapshot) : null });
  };
  const getState = () => ({ ...state, snapshot: state.snapshot ? structuredClone(state.snapshot) : null });
  async function request(method, payload) {
    if (disposed || inFlight) return { ok: false, reason: 'busy_or_disposed' };
    if (!transport || typeof transport[method] !== 'function') {
      publish({ phase: 'disconnected', busy: false, error: 'G5-0003-A authenticated backend is not connected. Browser Demo remains available separately.', notice: '' });
      return { ok: false, reason: 'backend_unavailable' };
    }
    inFlight = true;
    publish({ phase: 'loading', busy: true, error: '', notice: '' });
    try {
      const result = await transport[method](payload);
      const snapshot = assertServerSnapshot(result);
      publish({ phase: 'ready', busy: false, snapshot, notice: typeof result.notice === 'string' ? result.notice : '', error: '' });
      return { ok: true, snapshot };
    } catch (error) {
      const phase = classify(error);
      publish({
        phase, busy: false, notice: '',
        snapshot: phase === 'unauthorized' ? null : state.snapshot,
        error: phase === 'unauthorized' ? 'Unauthorized. Sign in again or request access to Game 5 Connected Test.' :
          phase === 'rejected' ? String(error?.message || 'The Game 5 server rejected this interaction.') :
          phase === 'backend_failure' ? 'Game 5 server failed. Progress has not been assumed; retry loading state.' :
          'Cannot contact the authenticated Game 5 backend. No simulated progress was substituted.',
      });
      return { ok: false, reason: phase };
    } finally {
      inFlight = false;
    }
  }
  return Object.freeze({
    getState,
    refresh: () => request('load'),
    dispatch: (action, payload) => {
      if (inFlight || disposed) return Promise.resolve({ ok: false, reason: 'busy_or_disposed' });
      if (!ACTIONS.has(action)) return Promise.resolve({ ok: false, reason: 'invalid_action' });
      if (!state.snapshot || !['ready', 'rejected'].includes(state.phase)) return Promise.resolve({ ok: false, reason: 'not_loaded' });
      return request(action, payload);
    },
    dispose: () => { disposed = true; },
  });
}

/** Only an authoritative quest milestone may remove the visible collectible. */
export function isAuthoritativelyCollected(snapshot) {
  return snapshot?.quest?.objective?.current === 1 &&
    (snapshot.quest.status === 'ready_to_complete' || snapshot.quest.status === 'completed');
}
