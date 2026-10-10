// Game 2 multiplayer signaling: the arena beacon (who hosts the one free-for-all arena, how many are in) and the
// one-shot WebRTC offer / answer exchange. Game traffic never goes through here; it flows peer to peer (net/mesh.js).
//
// Base44Signaling uses two app entities (base44/entities/Game2Room.jsonc, Game2Signal.jsonc), the same pattern the app's
// voice chat uses with VoiceSignal. LocalSignaling connects tabs of one browser (BroadcastChannel) for local testing.
export const NET_VERSION = 2;          // 2 = the single free-for-all arena
export const MAX_PLAYERS = 10;
export const ROOM_STALE_MS = 15000;   // an arena record whose host has not sent a heartbeat for this long is ignored
export const ARENA = 'lightsaber-training'; // the one arena; also the channel every offer / answer is filed under
const SIGNAL_MAX_AGE_MS = 60000;

// peer id = <user id>~<session suffix>: one account can be in two tabs, and the user id addresses Base44 records
export const makePeerId = (userId) => `${userId}~${Math.random().toString(36).slice(2, 8)}`;
export const userOfPeer = (peerId) => String(peerId).split('~')[0];

const born = r => new Date(r.created_date || 0).getTime() || 0;
// live arena records, the one everybody should be in first: most players, then the oldest, then the lowest host id
export function freshRooms(rooms, now = Date.now()) {
  return (rooms || []).filter(r => r && r.status !== 'closed' && r.version === NET_VERSION && now - (r.last_seen || 0) < ROOM_STALE_MS)
    .sort((a, b) => (b.players || 0) - (a.players || 0) || born(a) - born(b) || String(a.host_peer).localeCompare(String(b.host_peer)));
}
export const pickArena = (rooms, now) => freshRooms(rooms, now)[0] || null;

export class Base44Signaling {
  constructor(base44, selfId, opts = {}) {
    this.b = base44; this.self = selfId; this.user = userOfPeer(selfId); this.onSignal = null; this.seen = new Set(); this.room = ARENA;
    this.pollMs = opts.pollMs ?? 1200; this.timer = null; this.unsub = null; this.closed = false;
  }
  get Rooms() { return this.b.entities.Game2Room; }
  get Signals() { return this.b.entities.Game2Signal; }
  // ---- lobby
  async listRooms() { return freshRooms(await this.Rooms.list('-updated_date', 60)); }
  async createRoom(fields) { return this.Rooms.create({ ...fields, host_id: this.user, host_peer: this.self, version: NET_VERSION, status: 'open', last_seen: Date.now() }); }
  async updateRoom(id, fields) { return this.Rooms.update(id, { ...fields, last_seen: Date.now() }); }
  async deleteRoom(id) { try { await this.Rooms.delete(id); } catch { /* already gone */ } }
  // ---- offer / answer
  listen(roomId = ARENA) {
    this.room = roomId; this.stopListening();
    try { this.unsub = this.Signals.subscribe(ev => { if (ev && (ev.type === 'create' || ev.type === 'update') && ev.data) this.take(ev.data); }); } catch { this.unsub = null; }
    const poll = async () => {
      if (this.closed) return;
      try { const rows = await this.Signals.filter({ target_id: this.user, room_id: this.room }, '-created_date', 40); for (const r of (rows || []).slice().reverse()) this.take(r); } catch (e) { console.warn('[game2 net] signal poll', e?.message || e); }
      if (!this.closed) this.timer = setTimeout(poll, this.pollMs);
    };
    poll();
  }
  stopListening() { if (this.timer) clearTimeout(this.timer); this.timer = null; if (typeof this.unsub === 'function') try { this.unsub(); } catch { /* ignore */ } this.unsub = null; }
  take(row) {
    if (!row || !row.id || this.seen.has(row.id)) return; const p = row.payload || {};
    if (row.target_id !== this.user || p.to !== this.self || row.room_id !== this.room) return;
    this.seen.add(row.id); if (this.seen.size > 500) this.seen = new Set([...this.seen].slice(-250));
    if (Date.now() - new Date(row.created_date || Date.now()).getTime() > SIGNAL_MAX_AGE_MS) return;
    this.Signals.delete(row.id).catch(() => { }); // handled: keep the table small
    this.onSignal && this.onSignal({ type: row.type, from: p.from, to: p.to, payload: p });
  }
  send(toPeer, type, payload) {
    return this.Signals.create({ room_id: this.room, sender_id: this.user, target_id: userOfPeer(toPeer), type, payload: { ...payload, from: this.self, to: toPeer } })
      .catch(e => console.warn('[game2 net] signal send', e?.message || e));
  }
  close() { this.closed = true; this.stopListening(); }
}

// Same browser, other tabs (local testing). Rooms are announced on the channel; nothing leaves the browser.
export class LocalSignaling {
  constructor(selfId, channel = 'atomxe-game2-net') {
    this.self = selfId; this.onSignal = null; this.room = ARENA; this.rooms = new Map(); this.closed = false;
    this.ch = new BroadcastChannel(channel);
    this.ch.onmessage = (e) => { const m = e.data || {}; if (m.k === 'room') this.rooms.set(m.room.id, m.room); else if (m.k === 'unroom') this.rooms.delete(m.id); else if (m.k === 'sig' && m.to === this.self && (!this.room || m.room === this.room)) this.onSignal && this.onSignal({ type: m.type, from: m.from, to: m.to, payload: m.payload }); else if (m.k === 'who') for (const r of this.mine()) this.ch.postMessage({ k: 'room', room: r }); };
    this.own = new Map();
  }
  mine() { return [...this.own.values()]; }
  async listRooms() { this.ch.postMessage({ k: 'who' }); await new Promise(r => setTimeout(r, 150)); return freshRooms([...this.rooms.values(), ...this.mine()].filter((r, i, a) => a.findIndex(x => x.id === r.id) === i)); }
  async createRoom(fields) { const room = { ...fields, id: 'local-' + Math.random().toString(36).slice(2, 9), host_id: this.self.split('~')[0], host_peer: this.self, version: NET_VERSION, status: 'open', last_seen: Date.now(), created_date: new Date().toISOString() }; this.own.set(room.id, room); this.ch.postMessage({ k: 'room', room }); return room; }
  async updateRoom(id, fields) { const r = this.own.get(id); if (!r) return null; Object.assign(r, fields, { last_seen: Date.now() }); this.ch.postMessage({ k: 'room', room: r }); return r; }
  async deleteRoom(id) { this.own.delete(id); this.ch.postMessage({ k: 'unroom', id }); }
  listen(roomId = ARENA) { this.room = roomId; }
  stopListening() { }
  send(toPeer, type, payload) { this.ch.postMessage({ k: 'sig', room: this.room, to: toPeer, from: this.self, type, payload: { ...payload, from: this.self, to: toPeer } }); return Promise.resolve(); }
  close() { this.closed = true; for (const id of this.own.keys()) this.ch.postMessage({ k: 'unroom', id }); this.ch.close(); }
}
