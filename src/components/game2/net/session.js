// A Game 2 multiplayer match above the peer links: who is in the room, which side each player fights for, the join
// handshake and the 10-player cap. The host creates the room record and keeps it alive; guests connect to the host, are
// welcomed with the roster, then open direct links to every other player. A message for a player with no direct link
// (a network that blocks it) is relayed through the host.
import { Mesh } from './mesh.js';
import { MAX_PLAYERS, NET_VERSION } from './signaling.js';

const HEARTBEAT_MS = 5000;
const JOIN_TIMEOUT_MS = 30000;
export const SIDES = ['light', 'dark'];

export function freeSlot(roster, side, max = MAX_PLAYERS) {
  const used = new Set([...roster.values()].filter(e => e.side === side).map(e => e.slot));
  for (let i = 0; i < max; i++) if (!used.has(i)) return i; return max;
}
export function sideCounts(roster) { const c = { light: 0, dark: 0 }; for (const e of roster.values()) c[e.side === 'dark' ? 'dark' : 'light']++; return c; }

export class NetSession {
  constructor(o) {
    this.o = o; this.isHost = o.role === 'host'; this.self = o.selfId; this.sig = o.signaling; this.max = o.maxPlayers ?? MAX_PLAYERS;
    this.room = o.room || null; this.hostId = this.isHost ? this.self : (o.room && o.room.host_peer);
    this.roster = new Map(); this.me = null; this.state = 'idle'; this.ended = false; this.hb = null; this.joinTimer = null;
    // hooks (set by the game): onReady(me), onJoin(entry), onLeave(id, entry), onMessage(from, msg, reliable), onEnd(reason), onStatus(text), welcomeExtra() -> object
    this.onReady = this.onJoin = this.onLeave = this.onMessage = this.onEnd = this.onStatus = this.onRoster = () => { }; this.welcomeExtra = () => ({});
    this.mesh = new Mesh({ selfId: this.self, signaling: this.sig, iceServers: o.iceServers, RTC: o.RTC,
      accept: (s) => this.accept(s), onOpen: (id, hello) => this.linkUp(id, hello), onClose: (id, why, reason) => this.linkDown(id, why, reason), onMessage: (id, m, r) => this.recv(id, m, r) });
  }
  status(t) { this.statusText = t; this.onStatus(t); }
  entry(id) { return this.roster.get(id); }
  list() { return [...this.roster.values()].sort((a, b) => a.at - b.at); }
  async start() {
    const o = this.o;
    if (this.isHost) {
      this.status('Creating room');
      this.room = await this.sig.createRoom({ name: o.roomName || (o.name + "'s arena"), host_name: o.name, players: 1, max_players: this.max, light: o.side === 'dark' ? 0 : 1, dark: o.side === 'dark' ? 1 : 0, ai: o.ai ?? 1 });
      this.sig.listen(this.room.id);
      this.me = { id: this.self, name: o.name, side: o.side, slot: 0, host: true, at: Date.now() }; this.roster.set(this.self, this.me);
      this.state = 'live'; this.status(''); this.onRoster(this.list()); this.onReady(this.me);
      this.hb = setInterval(() => this.heartbeat(), HEARTBEAT_MS);
    } else {
      if (!this.room || !this.hostId) throw new Error('No room to join');
      this.sig.listen(this.room.id); this.state = 'joining'; this.status('Connecting to ' + (this.room.host_name || 'the host'));
      this.joinTimer = setTimeout(() => { if (this.state === 'joining') this.end('Could not reach the host. Their network may block direct connections.'); }, JOIN_TIMEOUT_MS);
      await this.mesh.connect(this.hostId, { room: this.room.id, hello: { name: o.name, side: o.side, ver: NET_VERSION } });
    }
  }
  heartbeat() {
    if (!this.isHost || !this.room || this.ended) return; const c = sideCounts(this.roster), n = this.roster.size;
    this.sig.updateRoom(this.room.id, { players: n, light: c.light, dark: c.dark, status: n >= this.max ? 'full' : 'open' }).catch?.(() => { });
  }
  accept(s) {
    const p = s.payload || {}; if (this.ended) return 'ended';
    if (this.room && p.room && p.room !== this.room.id) return 'wrong room';
    if (this.isHost) { if (this.roster.size >= this.max) return 'full'; if (!p.hello || p.hello.ver !== NET_VERSION) return 'version'; return true; }
    return this.state === 'live'; // another player joining after us opens a direct link
  }
  linkUp(id, hello) {
    if (this.isHost && hello && hello.hello) {
      const h = hello.hello, side = h.side === 'dark' ? 'dark' : 'light';
      if (this.roster.size >= this.max) { this.mesh.send(id, { k: 'full' }, true); this.mesh.drop(id, 'full', true); return; }
      const e = { id, name: String(h.name || 'Jedi').slice(0, 20), side, slot: freeSlot(this.roster, side, this.max), host: false, at: Date.now() };
      this.roster.set(id, e);
      this.mesh.send(id, { k: 'welcome', you: e, roster: this.list(), host: this.self, ...this.welcomeExtra(e) }, true);
      this.mesh.broadcast({ k: 'roster', roster: this.list() }, true, id);
      this.heartbeat(); this.onRoster(this.list()); this.onJoin(e);
    }
  }
  linkDown(id, why, reason) {
    if (!this.isHost && id === this.hostId) { this.end(reason === 'full' ? 'The room is full (10 players)' : this.state === 'joining' ? 'Could not join: ' + why : 'The host left the match'); return; }
    if (this.isHost) { const e = this.roster.get(id); if (e) { this.roster.delete(id); this.mesh.broadcast({ k: 'roster', roster: this.list() }, true); this.heartbeat(); this.onRoster(this.list()); this.onLeave(id, e); } }
  }
  recv(from, m, reliable) {
    switch (m.k) {
      case 'welcome':
        if (from !== this.hostId) return; clearTimeout(this.joinTimer);
        this.me = m.you; this.setRoster(m.roster); this.state = 'live'; this.status('');
        for (const e of this.list()) if (e.id !== this.self && e.id !== this.hostId && !this.mesh.isOpen(e.id)) this.mesh.connect(e.id, { room: this.room.id });
        this.onReady(this.me, m); return;
      case 'roster': if (from === this.hostId) { const before = new Set(this.roster.keys()); this.setRoster(m.roster); for (const id of before) if (!this.roster.has(id)) this.mesh.drop(id, 'left', true); } return;
      case 'full': this.end('The room is full (10 players)'); return;
      case 'bye': if (this.isHost) this.mesh.drop(from, 'left'); else if (from === this.hostId) this.end('The host ended the match'); return;
      case 'relay': if (this.isHost) { if (m.to === this.self) this.onMessage(from, m.m, reliable); else this.mesh.send(m.to, { k: 'relayed', from, m: m.m }, reliable); } return;
      case 'relayed': if (from === this.hostId) this.onMessage(m.from, m.m, reliable); return;
      default: this.onMessage(from, m, reliable);
    }
  }
  setRoster(list) { this.roster = new Map((list || []).map(e => [e.id, e])); this.onRoster(this.list()); }
  send(to, m, reliable) {
    if (to === this.self) return true;
    if (this.mesh.send(to, m, reliable)) return true;
    if (!this.isHost && this.mesh.isOpen(this.hostId)) return this.mesh.send(this.hostId, { k: 'relay', to, m }, reliable); // no direct link: through the host
    return false;
  }
  broadcast(m, reliable) { // direct links in one go, relay for the rest
    const s = JSON.stringify(m); let n = 0;
    for (const e of this.roster.values()) { if (e.id === this.self) continue; if (this.mesh.isOpen(e.id)) { if (this.mesh.send(e.id, s, reliable)) n++; } else if (!this.isHost && this.mesh.isOpen(this.hostId)) { this.mesh.send(this.hostId, { k: 'relay', to: e.id, m }, reliable); n++; } }
    return n;
  }
  rtt(id) { return this.mesh.rtt(id); }
  direct(id) { return this.mesh.isOpen(id); }
  end(reason) { if (this.ended) return; this.ended = true; this.state = 'ended'; this.status(reason); this.cleanup(); this.onEnd(reason); }
  leave() { if (this.ended) return; this.ended = true; this.state = 'ended'; try { this.mesh.broadcast({ k: 'bye' }, true); } catch { /* closing */ } this.cleanup(); }
  cleanup() { clearInterval(this.hb); clearTimeout(this.joinTimer); this.mesh.close(); if (this.isHost && this.room) this.sig.deleteRoom(this.room.id); this.sig.close && this.sig.close(); }
}
