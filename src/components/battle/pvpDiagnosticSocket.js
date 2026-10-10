// Opt-in diagnostic transport for PvP visual events only. Never trust this for damage.
const FLAG = 'atomxe_pvp_wss_enabled';
const URL = 'atomxe_pvp_wss_url';
export function startPvPDiagnosticSocket({ matchId, playerId, onAction }) {
  if (typeof window === 'undefined' || localStorage.getItem(FLAG) !== '1') return () => {};
  const endpoint = localStorage.getItem(URL) || '';
  if (!/^wss:\/\//i.test(endpoint)) {
    console.warn('[PvP WSS] Set a secure wss:// URL before enabling.');
    return () => {};
  }
  let socket;
  try { socket = new WebSocket(endpoint); } catch (error) {
    console.warn('[PvP WSS] Connection failed', error); return () => {};
  }
  const match = String(matchId), player = String(playerId);
  const pending = new Map();
  const stamp = (kind, castId, detail = {}) => {
    const record = { kind, castId: String(castId || ''), at: performance.now(), ...detail };
    window.dispatchEvent(new CustomEvent('atomxePvPLatency', { detail: record }));
  };
  socket.addEventListener('error', () => stamp('wss_error', '', { endpointConfigured: true }));
  socket.addEventListener('close', (event) => stamp('wss_closed', '', { code: event.code }));
  socket.addEventListener('open', () => {
    stamp('wss_connected', '');
    // The server MUST independently validate identity, authorization and match membership.
    socket.send(JSON.stringify({ t: 'join', matchId: match }));
  });
  socket.addEventListener('message', (event) => {
    let msg; try { msg = JSON.parse(event.data); } catch { return; }
    if (msg?.t === 'error' && msg.code === 'AUTH_REQUIRED') {
      stamp('wss_relay_unavailable', '', { reason: 'authentication_required' });
      return;
    }
    if (msg?.t === 'pong' && pending.has(msg.id)) {
      const started = pending.get(msg.id); pending.delete(msg.id);
      stamp('wss_rtt', msg.id, { elapsedMs: performance.now() - started });
    }
    if (msg?.t !== 'pvp_action' || String(msg.matchId) !== match) return;
    const action = msg.action || {};
    if (!['pvp_cast', 'pvp_melee', 'pvp_dodge'].includes(action.kind)) return;
    if (String(msg.sourcePlayerId) === player) return;
    stamp('wss_receive', action.cast_id, { source: 'wss' });
    onAction({ ...action, matchId: match, player_id: String(msg.sourcePlayerId), sourcePlayerId: String(msg.sourcePlayerId) });
  });
  const local = (event) => {
    const d = event.detail || {};
    if (String(d.matchId) !== match || !['pvp_cast','pvp_melee','pvp_dodge'].includes(d.kind)) return;
    if (socket.readyState !== WebSocket.OPEN) return;
    const { kind, cast_id, slot, effect_id, resolves_at, targetPlayerId } = d;
    // No damage values are sent: the authoritative Base44 matchmaker owns combat outcomes.
    socket.send(JSON.stringify({ t: 'pvp_action', matchId: match, action: { kind, cast_id, slot, effect_id, resolves_at, targetPlayerId } }));
    stamp('wss_send', cast_id);
  };
  window.addEventListener('multiplayerLocalAction', local);
  const timer = setInterval(() => {
    if (socket.readyState !== WebSocket.OPEN) return;
    const id = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    pending.set(id, performance.now());
    if (pending.size > 20) pending.delete(pending.keys().next().value);
    socket.send(JSON.stringify({ t: 'ping', id }));
  }, 2000);
  return () => {
    clearInterval(timer);
    window.removeEventListener('multiplayerLocalAction', local);
    socket.close();
  };
}
