// Diagnostic-only WebSocket probe. No gameplay events or player data are relayed.
const ENDPOINT = 'wss://pvp-diagnostic-gateway-test.up.railway.app/ws';
export function startPvPPingProbe({ matchId }) {
  if (typeof window === 'undefined' || localStorage.getItem('atomxe_pvp_latency_debug') !== '1') return () => {};
  let ws;
  try { ws = new WebSocket(ENDPOINT); } catch (error) { console.warn('[PvP probe] unavailable', error); return () => {}; }
  const pending = new Map();
  const timer = window.setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) return;
    const id = crypto.randomUUID();
    pending.set(id, performance.now());
    ws.send(JSON.stringify({ t: 'ping', id }));
    if (pending.size > 20) pending.delete(pending.keys().next().value);
  }, 2000);
  ws.addEventListener('message', event => {
    let msg; try { msg = JSON.parse(event.data); } catch { return; }
    if (msg.t !== 'pong' || !pending.has(msg.id)) return;
    const elapsedMs = performance.now() - pending.get(msg.id);
    pending.delete(msg.id);
    window.dispatchEvent(new CustomEvent('atomxePvPLatency', { detail: { kind: 'railway_rtt', matchId: String(matchId), elapsedMs, at: performance.now() } }));
    console.debug('[PvP probe] Railway round-trip ms:', Math.round(elapsedMs));
  });
  ws.addEventListener('error', () => console.warn('[PvP probe] WebSocket error'));
  return () => { clearInterval(timer); ws.close(); };
}
