// Shared by the arena, queue popup and background heartbeat. No React dependency.
export const aiBattleQueryKey = (userId) => ['ai-battle-matchmaking', userId];
export const RETRYABLE_BATTLE_ACTIONS = new Set(['join', 'cancel', 'reset', 'reconnect']);

export function mergeBattleSnapshot(previous, next) {
  if (!next) return previous;
  if (Number(next._battle_sequence || 0) < Number(previous?._battle_sequence || 0)) return previous;
  return { ...previous, ...next };
}

// NTP-style clock sample: exclude server processing time instead of treating it
// as network latency. Keep this offset fixed until another response arrives.
export function battleClockOffset(body, sentAt, receivedAt) {
  const end = Number(body?.server_time);
  const start = Number(body?.server_received_at);
  if (!Number.isFinite(end) || end <= 0) return 0;
  if (Number.isFinite(start) && start > 0 && end >= start && end - start <= receivedAt - sentAt) {
    return ((start - sentAt) + (end - receivedAt)) / 2;
  }
  return end - receivedAt;
}

export function createBattleTransport({ invoke, read, write, now = Date.now, sanitize = (body) => body }) {
  const sessions = new Map();
  const stateFor = (id) => {
    if (!sessions.has(id)) sessions.set(id, { sequence: Number(read(id)?._battle_sequence || 0), epoch: 0, pending: new Set(), status: null });
    return sessions.get(id);
  };
  const commit = (userId, body, sequence, sentAt) => {
    const receivedAt = now();
    const next = sanitize({
      ...body, _battle_sequence: sequence, _received_at: receivedAt,
      _server_offset_ms: battleClockOffset(body, sentAt, receivedAt),
    });
    const value = mergeBattleSnapshot(read(userId), next);
    write(userId, value);
    return value;
  };
  function request(userId, action, data = {}, { afterCurrent = false } = {}) {
    if (!userId) return Promise.reject(new Error('Sign in to use AI Battle.'));
    const state = stateFor(userId);
    if (action === 'status') {
      // Do not send a second status from the popup/heartbeat, or read the match
      // midway through this client's own action.
      if (state.status) return afterCurrent
        ? state.status.then(() => request(userId, action, data))
        : state.status;
      if (state.pending.size) return Promise.allSettled([...state.pending]).then(() => request(userId, action, data));
      const epoch = state.epoch, sequence = ++state.sequence, sentAt = now();
      const promise = (async () => {
        const body = await invoke(action, data);
        if (state.epoch !== epoch) {
          await Promise.allSettled([...state.pending]);
          // A poll that began before an action must never undo its HP/turn/queue.
          const current = read(userId);
          if (current) return current;
        }
        return commit(userId, body, sequence, sentAt);
      })();
      state.status = promise;
      promise.finally(() => { if (state.status === promise) state.status = null; }).catch(() => {});
      return promise;
    }
    const sequence = ++state.sequence, sentAt = now();
    state.epoch += 1;
    const promise = (async () => {
      const body = await invoke(action, data);
      commit(userId, body, sequence, sentAt);
      // Retain action-specific fields (cast, ready) even if a newer action won.
      return { ...body, ...read(userId), cast: body.cast };
    })();
    state.pending.add(promise);
    promise.finally(() => { state.epoch += 1; state.pending.delete(promise); }).catch(() => {});
    return promise;
  }
  return { request };
}

// Realtime events are wake-up signals, never peer-provided damage. Ignore the
// heartbeat and movement writes that would otherwise make an endless fetch loop.
export const queueSignal = (row) => JSON.stringify([
  row?.id, row?.status, row?.match_id || '', row?.connected_at || '', row?.ready_at || '',
]);
export const matchSignal = (row) => JSON.stringify([
  row?.id, row?.status, row?.attack_revision || 0, row?.last_cast?.cast_id,
  row?.turn_player_id || Object.entries(row?.atb || {}).find(([, value]) => value?.turn)?.[0] || row?.host_id || '',
  row?.fight_starts_at || '', row?.fight_ends_at || '', row?.pause_started_at || '',
  row?.cooldowns || {}, row?.dodges || {}, row?.stuns || {}, row?.disconnects || {},
  (row?.pending_hits || []).map((hit) => [hit.cast_id, hit.resolves_at]),
]);

export function battleDeadline(match) {
  if (!match || Object.keys(match.disconnects || {}).length) return null;
  if (match.status === 'countdown') return match.fight_starts_at || null;
  if (match.status !== 'fighting') return null;
  const times = (match.pending_hits || []).map((hit) => Date.parse(hit.resolves_at || '')).filter(Number.isFinite);
  return times.length ? new Date(Math.min(...times)).toISOString() : null;
}

export function createBattleRefresh({ refresh, setTimer = setTimeout, clearTimer = clearTimeout, delay = 60 }) {
  let timer = null, flight = null, again = false, stopped = false;
  const run = () => {
    timer = null;
    if (stopped) return;
    if (flight) { again = true; return; }
    flight = Promise.resolve().then(refresh).catch(() => {}).finally(() => {
      flight = null;
      if (again && !stopped) { again = false; schedule(); }
    });
  };
  const schedule = (wait = delay) => {
    if (stopped) return;
    if (flight) { again = true; return; }
    if (timer === null) timer = setTimer(run, wait);
  };
  return { schedule, stop() { stopped = true; if (timer !== null) clearTimer(timer); } };
}

// Fire at the hit deadline, then make at most two small clock-jitter retries.
// Normal polling remains the recovery path after an error or a hidden tab.
export function scheduleBattleDeadline({ match, offset = 0, refresh, now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout }) {
  const deadline = battleDeadline(match);
  if (!deadline) return () => {};
  let stopped = false, timer, attempts = 0;
  const run = async () => {
    attempts += 1;
    try {
      const body = await refresh();
      if (!stopped && attempts < 3 && battleDeadline(body?.match) === deadline) timer = setTimer(run, 200 * attempts);
    } catch { /* Polling reports failures and backs off on rate limits. */ }
  };
  timer = setTimer(run, Math.max(20, Date.parse(deadline) - (now() + offset) + 20));
  return () => { stopped = true; clearTimer(timer); };
}
