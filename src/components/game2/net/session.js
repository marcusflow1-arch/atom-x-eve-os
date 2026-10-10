// The Game 2 arena: one free-for-all arena everybody shares, up to 10 players, join and leave at any time.
// There is no game server. The first player in hosts it (keeps the arena record alive and admits newcomers); everyone
// else joins and opens a direct link to every other player. When the host leaves, the player who has been in longest
// takes over, so the arena lives as long as anyone is in it. A message for a player with no direct link (a network that
// blocks it) is relayed through the host.
import { Mesh } from './mesh.js';
import { ARENA, MAX_PLAYERS, NET_VERSION, pickArena } from './signaling.js';

const HEARTBEAT_MS = 4000;
const JOIN_TIMEOUT_MS = 12000;
const SETTLE_MS = 1500;

export function sideCounts(roster) { const c = { light: 0, dark: 0 }; for (const e of roster.values()) c[e.side === 'dark' ? 'dark' : 'light']++; return c; }

export class NetSession {
  constructor(o) {
    this.o = o; this.self = o.selfId; this.sig = o.signaling; this.max = o.maxPlayers ?? MAX_PLAYERS;
    this.isHost = false; this.hostId = null; this.room = null; this.roster = new Map(); this.me = null; this.state = 'idle'; this.ended = false; this.hb = null;
    // hooks (set by the game): onReady(me, welcome), onJoin(entry), onLeave(id, entry), onMessage(from, msg, reliable),
    // onHostChange(hostId, isMe), onRoster(list), onEnd(reason), onStatus(text), welcomeExtra(entry) -> object
    this.onReady = this.onJoin = this.onLeave = this.onMessage = this.onEnd = this.onStatus = this.onRoster = this.onHostChange = () => { }; this.welcomeExtra = () => ({});
    this.mesh = new Mesh({ selfId: this.self, signaling: this.sig, iceServers: o.iceServers, RTC: o.RTC,
      accept: (s) => this.accept(s), onOpen: (id, hello) => this.linkUp(id, hello), onClose: (id, why, reason) => this.linkDown(id, why, reason), onMessage: (id, m, r) => this.recv(id, m, r) });
  }
  status(t) { this.statusText = t; this.onStatus(t); }
  entry(id) { return this.roster.get(id); }
  list() { return [...this.roster.values()].sort((a, b) => a.at - b.at || String(a.id).localeCompare(String(b.id))); }
  hello() { return { name: this.o.name, side: this.o.side, ver: NET_VERSION }; }
  // ---- arrive: join the arena if it is open, otherwise open it
  async start() {
    this.sig.listen(ARENA); this.status('Looking for the arena');
    let arena = null; try { arena = pickArena(await this.sig.listRooms()); } catch (e) { console.warn('[game2 net] arena lookup', e?.message || e); }
    if (this.ended) return;
    if (arena && arena.host_peer !== this.self) {
      if ((arena.players || 0) >= this.max) { this.end('The arena is full (10 players)'); return; }
      if (await this.join(arena)) return;
    }
    if (!this.ended) await this.host();
  }
  join(arena) { // resolves true once welcomed (or refused as full), false if the host cannot be reached
    this.room = arena; this.hostId = arena.host_peer; this.isHost = false; this.state = 'joining'; this.status('Joining the arena');
    return new Promise((res) => {
      this.joinDone = res; clearTimeout(this.joinTimer); this.joinTimer = setTimeout(() => this.joinFailed('timeout'), JOIN_TIMEOUT_MS);
      this.mesh.connect(this.hostId, { room: ARENA, hello: this.hello() }).catch(() => this.joinFailed('error'));
    });
  }
  joinFailed(why) {
    if (this.state !== 'joining') return; clearTimeout(this.joinTimer); const h = this.hostId; this.hostId = null; this.state = 'idle';
    if (h) this.mesh.drop(h, why, true); const done = this.joinDone; this.joinDone = null; if (done) done(false);
  }
  joined(ok) { clearTimeout(this.joinTimer); const done = this.joinDone; this.joinDone = null; if (done) done(ok); }
  async host() {
    this.status('Opening the arena'); this.isHost = true; this.hostId = this.self;
    this.me = { id: this.self, name: this.o.name, side: this.o.side, host: true, at: Date.now() }; this.roster = new Map([[this.self, this.me]]);
    this.room = await this.sig.createRoom(this.roomFields());
    if (this.ended) { this.sig.deleteRoom(this.room.id); return; }
    this.state = 'live'; this.status(''); clearInterval(this.hb); this.hb = setInterval(() => this.heartbeat(), HEARTBEAT_MS);
    this.onRoster(this.list()); this.onReady(this.me, null); this.onHostChange(this.self, true);
    clearTimeout(this.settleTimer); this.settleTimer = setTimeout(() => this.mergeCheck(), this.o.settleMs ?? SETTLE_MS); // two players opening the arena at the same moment: keep one
  }
  roomFields() {
    const c = sideCounts(this.roster), n = this.roster.size;
    return { name: 'Lightsaber Training', host_name: this.o.name, players: n, max_players: this.max, light: c.light, dark: c.dark, ai: this.o.ai ?? 1, status: n >= this.max ? 'full' : 'open' };
  }
  heartbeat() {
    if (!this.isHost || this.ended || !this.room) return;
    const p = this.sig.updateRoom(this.room.id, this.roomFields()); if (p && p.catch) p.catch(() => { });
    if (this.roster.size === 1) this.mergeCheck();
  }
  async mergeCheck() { // alone in my arena while another one is the arena (more players, or older): move over to it
    if (!this.isHost || this.ended || this.roster.size !== 1 || this.merging) return;
    let best = null; try { best = pickArena(await this.sig.listRooms()); } catch { return; }
    if (!best || best.host_peer === this.self || !this.isHost || this.ended || this.roster.size !== 1 || (best.players || 0) >= this.max) return;
    this.merging = true; clearInterval(this.hb); const mine = this.room; this.isHost = false; this.onHostChange(best.host_peer, false);
    this.sig.deleteRoom(mine.id);
    const ok = await this.join(best); this.merging = false; if (!ok && !this.ended) await this.host();
  }
  // ---- links
  accept(s) {
    const p = s.payload || {}; if (this.ended) return 'ended';
    if (p.room && p.room !== ARENA) return 'wrong arena';
    if (this.isHost && p.hello) { if (this.roster.size >= this.max) return 'full'; if (p.hello.ver !== NET_VERSION) return 'version'; return true; }
    return this.state === 'live'; // a player who arrived after us opens a direct link
  }
  linkUp(id, hello) {
    if (!(this.isHost && hello && hello.hello)) return;
    if (this.roster.size >= this.max) { this.mesh.send(id, { k: 'full' }, true); this.mesh.drop(id, 'full', true); return; }
    const h = hello.hello, e = { id, name: String(h.name || 'Jedi').slice(0, 20), side: h.side === 'dark' ? 'dark' : 'light', host: false, at: Date.now() };
    this.roster.set(id, e);
    this.mesh.send(id, { k: 'welcome', you: e, roster: this.list(), host: this.self, ...this.welcomeExtra(e) }, true);
    this.mesh.broadcast({ k: 'roster', roster: this.list() }, true, id);
    this.heartbeat(); this.onRoster(this.list()); this.onJoin(e);
  }
  linkDown(id, why, reason) {
    if (this.state === 'joining' && id === this.hostId) { if (reason === 'full') { this.end('The arena is full (10 players)'); this.joined(true); } else this.joinFailed(why); return; }
    if (!this.isHost && id === this.hostId) { this.hostGone(id); return; }
    const e = this.roster.get(id);
    if (this.isHost && e) { this.roster.delete(id); this.mesh.broadcast({ k: 'roster', roster: this.list() }, true); this.heartbeat(); this.onRoster(this.list()); this.onLeave(id, e); }
  }
  hostGone(old) { // the host left: the player in longest takes over (every player works this out the same way from the roster)
    if (this.ended || this.state !== 'live' || this.hostId !== old) return;
    this.hostId = null; const e = this.roster.get(old); this.roster.delete(old); this.mesh.drop(old, 'left', true); if (e) this.onLeave(old, e);
    const next = this.list().find(x => x.id === this.self || this.mesh.isOpen(x.id)); if (!next) { this.end('Lost the arena'); return; }
    this.hostId = next.id; for (const x of this.roster.values()) x.host = x.id === next.id;
    if (next.id === this.self) this.promote(); else { this.onRoster(this.list()); this.onHostChange(next.id, false); }
  }
  async promote() {
    this.isHost = true; if (this.me) this.me.host = true;
    this.mesh.broadcast({ k: 'roster', roster: this.list() }, true);
    this.room = null; try { this.room = await this.sig.createRoom(this.roomFields()); } catch (e) { console.warn('[game2 net] arena record', e?.message || e); }
    if (this.ended) { if (this.room) this.sig.deleteRoom(this.room.id); return; } // left while taking over
    clearInterval(this.hb); this.hb = setInterval(() => this.heartbeat(), HEARTBEAT_MS);
    this.onRoster(this.list()); this.onHostChange(this.self, true);
  }
  recv(from, m, reliable) {
    switch (m.k) {
      case 'welcome':
        if (from !== this.hostId || this.state !== 'joining') return;
        this.me = m.you; this.setRoster(m.roster); this.state = 'live'; this.status('');
        for (const e of this.list()) if (e.id !== this.self && e.id !== this.hostId && !this.mesh.isOpen(e.id)) this.mesh.connect(e.id, { room: ARENA });
        this.onReady(this.me, m); this.onHostChange(this.hostId, false); this.joined(true); return;
      case 'roster':
        if (from === this.hostId) { const before = new Set(this.roster.keys()); this.setRoster(m.roster); for (const id of before) if (!this.roster.has(id)) { this.mesh.drop(id, 'left', true); this.onLeave(id, null); } }
        return;
      case 'full': if (this.state === 'joining') { this.end('The arena is full (10 players)'); this.joined(true); } return;
      case 'bye': if (this.isHost) this.mesh.drop(from, 'left'); else if (from === this.hostId) this.hostGone(from); return;
      case 'relay': if (this.isHost) { if (m.to === this.self) this.onMessage(from, m.m, reliable); else this.mesh.send(m.to, { k: 'relayed', from, m: m.m }, reliable); } return;
      case 'relayed': if (from === this.hostId) this.onMessage(m.from, m.m, reliable); return;
      default: this.onMessage(from, m, reliable);
    }
  }
  setRoster(list) { this.roster = new Map((list || []).map(e => [e.id, e])); if (this.roster.has(this.self)) this.me = this.roster.get(this.self); this.onRoster(this.list()); }
  send(to, m, reliable) {
    if (to === this.self) return true;
    if (this.mesh.send(to, m, reliable)) return true;
    if (!this.isHost && this.mesh.isOpen(this.hostId)) return this.mesh.send(this.hostId, { k: 'relay', to, m }, reliable); // no direct link: through the host
    return false;
  }
  broadcast(m, reliable) { // direct links in one go, relay for the rest
    const s = JSON.stringify(m); let n = 0;
    for (const e of this.roster.values()) {
      if (e.id === this.self) continue;
      if (this.mesh.isOpen(e.id)) { if (this.mesh.send(e.id, s, reliable)) n++; }
      else if (!this.isHost && this.mesh.isOpen(this.hostId)) { this.mesh.send(this.hostId, { k: 'relay', to: e.id, m }, reliable); n++; }
    }
    return n;
  }
  rtt(id) { return this.mesh.rtt(id); }
  direct(id) { return this.mesh.isOpen(id); }
  end(reason) { if (this.ended) return; this.ended = true; this.state = 'ended'; this.status(reason); this.cleanup(); this.onEnd(reason); }
  leave() { if (this.ended) return; this.ended = true; this.state = 'ended'; try { this.mesh.broadcast({ k: 'bye' }, true); } catch { /* closing */ } this.cleanup(); }
  cleanup() { clearInterval(this.hb); clearTimeout(this.joinTimer); clearTimeout(this.settleTimer); this.mesh.close(); if (this.isHost && this.room && this.room.host_peer === this.self) this.sig.deleteRoom(this.room.id); if (this.sig.close) this.sig.close(); } // deletes only our own arena record
}
