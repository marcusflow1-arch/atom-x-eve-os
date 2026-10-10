// Opt-in authenticated transport. Existing WebRTC and Base44 polling remain active.
export const PVP_GATEWAY = 'wss://pvp-diagnostic-gateway-test.up.railway.app/ws';
export function combatAnimations(state, seen, observedAt) {
  const actions = [];
  const add = (kind, cast, time) => {
    if (!cast?.cast_id || !cast.attacker_id) return;
    const key = `${cast.attacker_id}:${cast.cast_id}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (seen.size > 256) seen.delete(seen.values().next().value);
    // Reconciliation must not replay an entire old battle on reconnect.
    const at = Date.parse(time || '');
    if (!Number.isFinite(at) || Math.abs(observedAt - at) > 5000) return;
    actions.push({ ...cast, kind, player_id: cast.attacker_id, sourcePlayerId: cast.attacker_id,
      targetPlayerId: cast.target_id, resolves_at: cast.resolves_at || cast.resolved_at });
  };
  add('pvp_cast', state?.last_cast, state?.last_cast?.cast_at);
  for (const hit of state?.hit_log || []) add(Number(hit.slot) === -1 ? 'pvp_melee' : 'pvp_cast', hit, hit.resolved_at);
  return actions;
}

export function startPvPDiagnosticSocket({ matchId, playerId, getTicket, onAction, onSync = () => {} }) {
  if (typeof window === 'undefined') return () => {};
  let endpoint;
  try {
    if (localStorage.getItem('atomxe_pvp_wss_enabled') !== '1') return () => {};
    endpoint = localStorage.getItem('atomxe_pvp_wss_url') || PVP_GATEWAY;
  } catch { return () => {}; }
  // A mutable localStorage URL must never receive signed credentials for another host.
  if (endpoint !== PVP_GATEWAY || typeof getTicket !== 'function') return () => {};
  const match = String(matchId), player = String(playerId), seen = new Set(), pending = new Map();
  let socket, stopped = false, ready = false, attempts = 0, renewTimer, retryTimer, authTimer;
  let latestReceipt = null, lastSeq = 0, lastEpoch = '', pingTimer;
  const stamp = (kind, detail = {}) => window.dispatchEvent(new CustomEvent('atomxePvPLatency', {
    detail: { kind, at: performance.now(), ...detail },
  }));
  const sendReceipt = () => {
    if (ready && latestReceipt && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ t: 'combat.receipt', receipt: latestReceipt })); latestReceipt = null;
    }
  };
  const receipt = (event) => {
    const d = event.detail;
    if (String(d?.matchId) !== match || typeof d?.receipt !== 'string') return;
    latestReceipt = d.receipt; sendReceipt();
  };
  async function authenticate(ws) {
    ready = false;
    clearTimeout(authTimer);
    authTimer = setTimeout(() => ws.close(4000, 'Authentication timeout'), 10000);
    try {
      const result = await getTicket(match);
      if (stopped || socket !== ws || ws.readyState !== WebSocket.OPEN) return;
      if (!result?.ticket) throw new Error('Ticket unavailable');
      ws.send(JSON.stringify({ t: 'auth', ticket: result.ticket }));
    } catch {
      stamp('wss_relay_unavailable', { reason: 'ticket_unavailable' });
      if (socket === ws) ws.close(4000, 'Ticket unavailable');
    }
  }
  const connect = () => {
    if (stopped) return;
    let ws;
    try { ws = socket = new WebSocket(endpoint); } catch { scheduleRetry(); return; }
    ws.addEventListener('open', () => { stamp('wss_connected'); authenticate(ws); });
    ws.addEventListener('error', () => stamp('wss_error'));
    ws.addEventListener('message', (event) => {
      if (stopped || socket !== ws) return;
      let msg; try { msg = JSON.parse(event.data); } catch { return; }
      if (msg?.t === 'pong' && pending.has(msg.id)) {
        stamp('wss_rtt', { elapsedMs: performance.now() - pending.get(msg.id) }); pending.delete(msg.id); return;
      }
      if (msg?.t === 'error') {
        stamp('wss_relay_unavailable', { reason: msg.code });
        if (['AUTH_INVALID', 'AUTH_NOT_CONFIGURED'].includes(msg.code)) { stopped = true; ws.close(); }
        return;
      }
      if (String(msg.matchId) !== match) return;
      if (msg.t === 'auth.ok' && String(msg.playerId) === player) {
        clearTimeout(authTimer); clearTimeout(renewTimer);
        ready = true; attempts = 0;
        if (lastEpoch !== msg.epoch) { lastEpoch = msg.epoch; lastSeq = 0; }
        // Renew against current match membership, not just the old identity.
        renewTimer = setTimeout(() => authenticate(ws), 60000);
        stamp('wss_authenticated'); sendReceipt(); onSync(); return;
      }
      if (!ready || msg.t !== 'combat.sync' || msg.epoch !== lastEpoch
        || !Number.isSafeInteger(msg.seq) || msg.seq <= lastSeq) return;
      lastSeq = msg.seq;
      const actions = combatAnimations(msg.state, seen, msg.observedAt);
      if (!msg.replay) for (const action of actions) {
        if (String(action.sourcePlayerId) !== player) onAction({ ...action, matchId: match });
      }
      // Wake the existing, coalesced authoritative reader. Never set HP from a peer.
      if (msg.replay || String(msg.sourcePlayerId) !== player) onSync();
      stamp('wss_combat_sync', { sequence: msg.seq });
    });
    ws.addEventListener('close', (event) => {
      if (socket !== ws) return;
      ready = false; clearTimeout(renewTimer); clearTimeout(authTimer); pending.clear();
      stamp('wss_closed', { code: event.code });
      if ([4002, 4003].includes(event.code)) stopped = true;
      scheduleRetry();
    });
  };
  const scheduleRetry = () => {
    if (stopped || attempts >= 5) return;
    clearTimeout(retryTimer);
    retryTimer = setTimeout(connect, Math.min(15000, 500 * 2 ** attempts++) + Math.random() * 250);
  };
  window.addEventListener('atomxePvPReceipt', receipt);
  pingTimer = setInterval(() => {
    if (stopped || socket?.readyState !== WebSocket.OPEN) return;
    if ([...pending.values()].some(at => performance.now() - at > 10000)) { socket.close(4000, 'Heartbeat timeout'); return; }
    const id = crypto.randomUUID(); pending.set(id, performance.now());
    socket.send(JSON.stringify({ t: 'ping', id }));
  }, 2000);
  connect();
  return () => {
    stopped = true; ready = false; latestReceipt = null; pending.clear();
    clearInterval(pingTimer); clearTimeout(renewTimer); clearTimeout(retryTimer); clearTimeout(authTimer);
    window.removeEventListener('atomxePvPReceipt', receipt); socket?.close();
  };
}
