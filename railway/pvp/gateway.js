import { verifyPvPClaims, verifyPvPTicket } from './verifyTicket.js';

// Test gateway: one replica, bounded in-memory rooms. Base44 alone resolves damage.
export function createPvPGateway({ secret = '', now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  const connections = new Map(), rooms = new Map(), consumed = new Map();
  const enabled = secret.length >= 32;
  const send = (ws, value) => { try { ws.send(JSON.stringify(value)); } catch { close(ws); } };
  const error = (ws, code) => send(ws, { t: 'error', code });
  const close = (ws) => {
    const s = connections.get(ws);
    if (!s) return;
    clearTimer(s.timer); connections.delete(ws);
    const room = rooms.get(s.auth?.matchId);
    if (room?.peers.get(s.auth.userId) === ws) {
      room.peers.delete(s.auth.userId);
      if (!room.peers.size) rooms.delete(s.auth.matchId);
    }
  };
  const terminate = (ws, code, reason) => { close(ws); ws.close(code, reason); };
  const arm = (ws, s, ms) => {
    clearTimer(s.timer);
    s.timer = setTimer(() => terminate(ws, 4001, 'Authentication expired'), ms);
    s.timer?.unref?.();
  };
  const current = (ws, s) => connections.get(ws) === s;
  const membersKey = (ids) => JSON.stringify([...ids].sort());
  async function handle(ws, s, raw) {
    if (!current(ws, s)) return;
    let msg;
    try { msg = JSON.parse(raw); } catch { return error(ws, 'INVALID_MESSAGE'); }
    if (msg?.t === 'ping' && typeof msg.id === 'string' && msg.id.length <= 100) {
      return send(ws, { t: 'pong', id: msg.id, serverTime: now() });
    }
    if (!enabled) return error(ws, 'AUTH_NOT_CONFIGURED');
    if (msg?.t === 'auth') {
      try {
        const a = await verifyPvPTicket(msg.ticket, secret, Math.floor(now() / 1000));
        if (!current(ws, s)) return;
        for (const [nonce, expiry] of consumed) if (expiry * 1000 <= now()) consumed.delete(nonce);
        if (consumed.has(a.nonce) || consumed.size >= 10000) throw new Error('Replay or capacity');
        if (s.auth && (s.auth.userId !== a.userId || s.auth.matchId !== a.matchId)) throw new Error('Identity switch');
        let room = rooms.get(a.matchId);
        if (!room) {
          if (rooms.size >= 500) throw new Error('Capacity');
          room = { peers: new Map(), members: membersKey(a.playerIds), seq: 0, latest: null, epoch: crypto.randomUUID() };
          rooms.set(a.matchId, room);
        }
        if (room.members !== membersKey(a.playerIds)) throw new Error('Membership changed');
        consumed.set(a.nonce, a.expiresAt);
        const previous = room.peers.get(a.userId);
        // Install the new connection before closing the old one, retaining room state.
        room.peers.set(a.userId, ws); s.auth = a;
        if (previous && previous !== ws) terminate(previous, 4002, 'Connection replaced');
        arm(ws, s, Math.max(1, a.expiresAt * 1000 - now()));
        send(ws, { t: 'auth.ok', matchId: a.matchId, playerId: a.userId, expiresAt: a.expiresAt * 1000, epoch: room.epoch });
        if (room.latest) send(ws, { ...room.latest, replay: true });
      } catch { error(ws, 'AUTH_INVALID'); terminate(ws, 4003, 'Invalid authentication'); }
      return;
    }
    if (!s.auth || s.auth.expiresAt * 1000 <= now()) return error(ws, 'AUTH_REQUIRED');
    if (msg?.t !== 'combat.receipt') return error(ws, 'UNSUPPORTED_MESSAGE');
    try {
      const c = await verifyPvPClaims(msg.receipt, secret, 'atomxe-railway-combat', Math.floor(now() / 1000));
      if (!current(ws, s) || s.auth.expiresAt * 1000 <= now()) return;
      if (c.sub !== s.auth.userId || c.matchId !== s.auth.matchId || membersKey(c.playerIds) !== membersKey(s.auth.playerIds)) throw new Error('Scope');
      if (!c.state || typeof c.stateKey !== 'string' || !Number.isSafeInteger(c.observedAt)
        || Math.floor(c.observedAt / 1000) !== c.iat || !Number.isSafeInteger(c.state.attack_revision)
        || c.state.attack_revision < 0) throw new Error('Invalid state');
      const room = rooms.get(c.matchId);
      if (!room || room.peers.get(c.sub) !== ws) return;
      const prev = room.latest;
      if (prev && (c.stateKey === prev.stateKey || c.observedAt < prev.observedAt
        || c.state.attack_revision < prev.state.attack_revision || prev.state.status === 'ended')) return;
      const event = { t: 'combat.sync', matchId: c.matchId, sourcePlayerId: c.sub,
        seq: ++room.seq, epoch: room.epoch, serverTime: now(), observedAt: c.observedAt,
        stateKey: c.stateKey, state: c.state };
      room.latest = event;
      for (const peer of room.peers.values()) {
        const peerState = connections.get(peer);
        if (peerState?.auth?.expiresAt * 1000 > now()) send(peer, event);
      }
    } catch { error(ws, 'RECEIPT_INVALID'); }
  }
  return {
    health: () => ({ ok: true, mode: enabled ? 'authenticated-relay' : 'auth-unconfigured',
      gameplayRelay: enabled, damageAuthority: 'base44', protocol: 2 }),
    open(ws) {
      if (connections.size >= 1000) return ws.close(1013, 'Gateway at capacity');
      const s = { auth: null, timer: null, chain: Promise.resolve(), pending: 0, start: now(), count: 0 };
      connections.set(ws, s); arm(ws, s, 15000);
    },
    message(ws, raw) {
      const s = connections.get(ws); if (!s) return Promise.resolve();
      if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > 65536) {
        terminate(ws, 1009, 'Invalid frame'); return Promise.resolve();
      }
      if (now() - s.start >= 1000) { s.start = now(); s.count = 0; }
      if (++s.count > 20 || s.pending >= 8) { terminate(ws, 1008, 'Rate limit'); return Promise.resolve(); }
      s.pending++;
      s.chain = s.chain.then(() => handle(ws, s, raw)).catch(() => terminate(ws, 1011, 'Relay unavailable'))
        .finally(() => { s.pending--; });
      return s.chain;
    },
    close,
  };
}
