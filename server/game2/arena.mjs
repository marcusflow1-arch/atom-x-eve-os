import { createServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';

// All Game 2 viewers connect to this server. Every map is its own arena (room): players only see and reach the players
// in theirs. Messages are relayed directly over WebSockets; no Base44 entity polls or WebRTC peer establishment.
// Character simulation remains client-owned; authoritative anti-cheat is future work.
export const GAME2_VERSION = 2;
// the arenas; a join that names none (clients from before rooms) goes to 'training', the original Lightsaber Training
export const ARENA_ROOMS = Object.freeze(['training', 'skybridge', 'hangar', 'carbon']);
// a safety ceiling per arena, not a game rule (the free-for-all has no player limit); GAME2_MAX_PLAYERS overrides it
export const MAX_PLAYERS = 200;
const MAX_PACKET_BYTES = 64 * 1024;
const MAX_TOKEN_LENGTH = 8192;
const ALLOWED_KINDS = new Set(['s', 'rpc', 'fx']);
const PING_INTERVAL_MS = 15000;
const HELLO_TIMEOUT_MS = 12000;

const cleanName = value => String(value || 'Jedi').trim().slice(0, 20) || 'Jedi';
const validPeer = (peer, userId) =>
  typeof peer === 'string' && typeof userId === 'string' &&
  peer.startsWith(userId + '~') && /^[a-z0-9]{4,16}$/.test(peer.slice(userId.length + 1));

export function createGame2ArenaServer({ authenticate, host = '0.0.0.0', port = 0, now = Date.now, maxPlayers = MAX_PLAYERS } = {}) {
  if (typeof authenticate !== 'function') throw new TypeError('Game 2 requires an account token verifier');
  const clients = new Map(); // every connected player by peer id; each also belongs to one room
  const rooms = new Map(ARENA_ROOMS.map(id => [id, { id, clients: new Map(), hostPeer: null, aiCount: 0 }]));
  const entryList = R => [...R.clients.values()].map(c => ({ ...c.player, host: c.player.id === R.hostPeer }));
  const stats = R => {
    const roster = entryList(R);
    return {
      players: roster.length,
      light: roster.filter(p => p.side === 'light').length,
      dark: roster.filter(p => p.side === 'dark').length,
      ai: R.aiCount, host_name: roster.find(p => p.host)?.name || '',
    };
  };
  // the top-level numbers are the training arena's (what clients from before rooms read); `arenas` has every map
  const report = () => ({
    ready: true, protocol: GAME2_VERSION, room: 'lightsaber-training', rooms: true, max_players: maxPlayers,
    ...stats(rooms.get('training')), arenas: Object.fromEntries([...rooms].map(([id, R]) => [id, stats(R)])),
  });
  const send = (ws, value, reliable = true) => {
    if (ws.readyState !== WebSocket.OPEN) return false;
    if (ws.bufferedAmount > (reliable ? 4 * 1024 * 1024 : 1024 * 1024)) {
      if (reliable) ws.close(1013, 'Slow receiving connection');
      return false;
    }
    try { ws.send(JSON.stringify(value)); return true; } catch { return false; }
  };
  const broadcast = (R, payload, skipPeer = null, reliable = true) => {
    for (const [peer, client] of R.clients) if (peer !== skipPeer) send(client.ws, payload, reliable);
  };
  const rosterChanged = R => broadcast(R, { t: 'roster', roster: entryList(R), host: R.hostPeer, ai: R.aiCount });
  const disconnect = ws => {
    const client = ws.game2Client;
    if (!client || clients.get(client.player.id) !== client) return;
    const R = client.room;
    clients.delete(client.player.id); R.clients.delete(client.player.id);
    ws.game2Client = null;
    if (R.hostPeer === client.player.id) {
      R.hostPeer = R.clients.keys().next().value || null;
    }
    if (!R.clients.size) R.aiCount = 0;
    rosterChanged(R);
  };
  const reject = (ws, reason, closeCode = 1008) => {
    send(ws, { t: 'error', message: reason });
    ws.close(closeCode, reason.slice(0, 100));
  };
  const onPacket = (ws, client, message) => {
    const t = message.t;
    if (t === 'ping') {
      if (typeof message.id === 'number' && Number.isFinite(message.id)) {
        send(ws, { t: 'pong', id: message.id, serverTime: now() }, false);
      }
      return;
    }
    if (t === 'leave') { ws.close(1000, 'Left arena'); return; }
    if (t !== 'packet' || !message.body || !ALLOWED_KINDS.has(message.body.k)) return;
    const body = message.body;
    const reliable = message.reliable !== false;
    if (body.k === 's') {
      // Only the player who owns a fighter may publish its transform/animations.
      if (!Array.isArray(body.f) || body.f.length > 5 ||
          body.f.some(f => !Array.isArray(f) || typeof f[0] !== 'string' ||
            !f[0].startsWith(client.player.id + ':'))) return;
    }
    const out = { t: 'packet', from: client.player.id, body, reliable };
    const target = typeof message.to === 'string' ? message.to : null;
    if (target) {
      const dest = client.room.clients.get(target); // only within the same arena
      if (dest) send(dest.ws, out, reliable);
    } else {
      broadcast(client.room, out, client.player.id, reliable);
    }
  };
  const handle = async (ws, raw) => {
    if (raw.length > MAX_PACKET_BYTES) { reject(ws, 'Message too large', 1009); return; }
    let data;
    try { data = JSON.parse(raw.toString()); } catch { reject(ws, 'Invalid JSON'); return; }
    if (!data || typeof data !== 'object') return;
    if (!ws.game2Client) {
      if (data.t !== 'join' || ws.authenticating) { reject(ws, 'Join first'); return; }
      if (data.version !== GAME2_VERSION ||
        typeof data.token !== 'string' || !data.token.length || data.token.length > MAX_TOKEN_LENGTH ||
        typeof data.peer !== 'string' || data.peer.length > 200) {
        reject(ws, 'Invalid multiplayer join request');
        return;
      }
      ws.authenticating = true;
      let user = null;
      try { user = await authenticate(data.token); } catch { /* reject without leaking token or auth server errors */ }
      ws.authenticating = false;
      if (ws.readyState !== WebSocket.OPEN) return;
      const userId = String(user?.id || '');
      if (!userId || !validPeer(data.peer, userId)) { reject(ws, 'Game 2 account authentication failed'); return; }
      if (clients.has(data.peer)) { reject(ws, 'This session is already connected'); return; }
      const R = rooms.get(ARENA_ROOMS.includes(data.room) ? data.room : 'training');
      if (R.clients.size >= maxPlayers) { reject(ws, 'The arena is full'); return; }
      const player = {
        id: data.peer, name: cleanName(data.name),
        side: data.side === 'dark' ? 'dark' : 'light', at: now(), host: false,
      };
      const client = { ws, player, room: R, windowMs: now(), messages: 0 };
      ws.game2Client = client;
      clients.set(data.peer, client); R.clients.set(data.peer, client);
      clearTimeout(ws.helloTimer);
      if (!R.hostPeer) {
        R.hostPeer = data.peer;
        R.aiCount = Number.isInteger(data.ai) ? Math.min(3, Math.max(0, data.ai)) : 0;
      }
      send(ws, { t: 'welcome', you: { ...player, host: R.hostPeer === data.peer }, room: R.id,
        roster: entryList(R), host: R.hostPeer, ai: R.aiCount, serverTime: now() });
      rosterChanged(R);
      return;
    }
    const client = ws.game2Client;
    const stamp = now();
    if (stamp - client.windowMs > 1000) { client.windowMs = stamp; client.messages = 0; }
    client.messages++;
    if (client.messages > 300) { reject(ws, 'Excessive network traffic'); return; }
    if (client.messages > 150 && data.t === 'packet' && data.body?.k === 's') return;
    onPacket(ws, client, data);
  };
  const server = createServer((req, res) => {
    const path = new URL(req.url || '/', 'http://localhost').pathname;
    const status = path === '/health' ? { status: 'ok', protocol: GAME2_VERSION } : report();
    if (path !== '/health' && path !== '/status') {
      res.writeHead(404, { 'Content-Type': 'application/json' }); res.end('{"error":"Not found"}'); return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(status));
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PACKET_BYTES });
  server.on('upgrade', (req, socket, head) => {
    if (new URL(req.url || '/', 'http://localhost').pathname !== '/ws/game2') {
      socket.destroy(); return;
    }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  });
  wss.on('connection', ws => {
    ws.alive = true; ws.authenticating = false; ws.game2Client = null;
    ws.helloTimer = setTimeout(() => { if (!ws.game2Client) reject(ws, 'Game 2 authentication timeout'); }, HELLO_TIMEOUT_MS);
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', raw => { void handle(ws, raw).catch(() => reject(ws, 'Game 2 networking error')); });
    ws.on('close', () => { clearTimeout(ws.helloTimer); disconnect(ws); });
    ws.on('error', () => { /* close will clean up membership */ });
  });
  const pingTimer = setInterval(() => {
    for (const client of clients.values()) {
      if (!client.ws.alive) { client.ws.terminate(); continue; }
      client.ws.alive = false;
      client.ws.ping();
    }
  }, PING_INTERVAL_MS);
  pingTimer.unref?.();
  const listen = () => new Promise((resolve, rejectStart) => {
    server.once('error', rejectStart);
    server.listen(port, host, () => { server.off('error', rejectStart); resolve(server.address()); });
  });
  const close = async () => {
    clearInterval(pingTimer);
    for (const client of [...clients.values()]) client.ws.terminate();
    for (const client of wss.clients) client.terminate();
    await new Promise(resolve => wss.close(resolve));
    await new Promise(resolve => server.close(resolve));
  };
  return { listen, close, server, wss, report };
}
