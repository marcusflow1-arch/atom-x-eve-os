// Opt-in PvP network diagnostic overlay. Never sends combat state to Railway.
const ENDPOINT = 'wss://pvp-diagnostic-gateway-test.up.railway.app/ws';
export function startPvPPingProbe({ matchId }) {
  if (typeof window === 'undefined') return () => {};
  const params = new URLSearchParams(window.location.search);
  if (params.get('pvp_debug') === '1') localStorage.setItem('atomxe_pvp_latency_debug', '1');
  if (localStorage.getItem('atomxe_pvp_latency_debug') !== '1') return () => {};
  const panel = document.createElement('div');
  panel.setAttribute('role', 'status');
  panel.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#101927ee;color:#eaf8ff;border:1px solid #6da4c2;padding:10px 14px;border-radius:9px;font:12px/1.6 monospace;max-width:280px;pointer-events:auto';
  const title = document.createElement('strong'); title.textContent = 'PvP Network Diagnostic';
  const state = document.createElement('div'); state.textContent = 'Railway: connecting…';
  const ping = document.createElement('div'); ping.textContent = 'Round-trip: waiting…';
  const peer = document.createElement('div'); peer.textContent = 'Combat peer events: 0';
  const close = document.createElement('button'); close.textContent = 'Disable'; close.style.cssText = 'margin-top:5px;cursor:pointer';
  close.onclick = () => { localStorage.removeItem('atomxe_pvp_latency_debug'); panel.remove(); };
  panel.append(title,state,ping,peer,close); document.body.append(panel);
  let ws;
  try { ws = new WebSocket(ENDPOINT); } catch (error) { state.textContent = 'Railway: unavailable'; console.warn('[PvP probe]',error); return () => panel.remove(); }
  const pending = new Map(); let peerCount = 0;
  const onLatency = (event) => {
    const detail = event.detail || {};
    if (String(detail.matchId || '') !== String(matchId)) return;
    if (detail.kind === 'peer_combat_received') {
      peerCount += 1; peer.textContent = 'Combat peer events: ' + peerCount + ' (' + (detail.actionKind || '') + ')';
    }
  };
  window.addEventListener('atomxePvPLatency',onLatency);
  ws.addEventListener('open',()=>{ state.textContent = 'Railway: connected (diagnostic only)'; });
  ws.addEventListener('close',()=>{ state.textContent = 'Railway: disconnected'; });
  ws.addEventListener('error',()=>{ state.textContent = 'Railway: connection error'; });
  ws.addEventListener('message',event=>{
    let msg; try { msg=JSON.parse(event.data); } catch { return; }
    if(msg.t!=='pong'||!pending.has(msg.id)) return;
    const elapsedMs=performance.now()-pending.get(msg.id); pending.delete(msg.id);
    ping.textContent='Round-trip: '+Math.round(elapsedMs)+' ms';
    window.dispatchEvent(new CustomEvent('atomxePvPLatency',{detail:{kind:'railway_rtt',matchId:String(matchId),elapsedMs,at:performance.now()}}));
  });
  const timer=window.setInterval(()=>{
    if(ws.readyState!==WebSocket.OPEN) return;
    const id=crypto.randomUUID(); pending.set(id,performance.now());
    ws.send(JSON.stringify({t:'ping',id}));
    if(pending.size>20) pending.delete(pending.keys().next().value);
  },2000);
  return ()=>{window.clearInterval(timer);window.removeEventListener('atomxePvPLatency',onLatency);ws.close();panel.remove();};
}
