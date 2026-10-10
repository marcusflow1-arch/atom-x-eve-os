// Peer-to-peer links for Game 2 multiplayer. Every pair of players gets its own WebRTC connection (a full mesh, at most
// 9 links per player), so a snapshot travels straight to each other player with no server hop. Two data channels per link:
//   'u'  unordered, no retransmits  -> fighter snapshots and pings (a late packet is dropped, the next one replaces it)
//   'r'  reliable, ordered          -> hits, Force effects, rounds, roster
// Offers carry all ICE candidates (non-trickle): one signal each way, which suits a database-backed signaling channel.
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
export const PING_MS = 500;
export const PEER_TIMEOUT_MS = 6000;
const GATHER_MS = 2000;

export class Mesh {
  constructor({ selfId, signaling, iceServers, RTC, onOpen, onClose, onMessage, accept }) {
    this.self = selfId; this.sig = signaling; this.ice = Array.isArray(iceServers) ? iceServers : [{ urls: 'stun:stun.l.google.com:19302' }]; // [] = local network only
    this.RTC = RTC || (typeof RTCPeerConnection !== 'undefined' ? RTCPeerConnection : null);
    this.onOpen = onOpen || (() => { }); this.onClose = onClose || (() => { }); this.onMessage = onMessage || (() => { });
    this.accept = accept || (() => true); // accept(offerSignal) -> true | 'reason' to decline
    this.peers = new Map(); this.closed = false; this.sent = 0; this.recv = 0;
    this.sig.onSignal = (s) => this.onSignal(s);
    this.pingTimer = setInterval(() => this.tick(), PING_MS);
  }
  peer(id) { let p = this.peers.get(id); if (!p) { p = { id, pc: null, u: null, r: null, open: false, rtt: null, last: now(), hello: null }; this.peers.set(id, p); } return p; }
  isOpen(id) { const p = this.peers.get(id); return !!(p && p.open); }
  openIds() { return [...this.peers.values()].filter(p => p.open).map(p => p.id); }
  rtt(id) { const p = this.peers.get(id); return p ? p.rtt : null; }
  newPc(p) {
    const pc = new this.RTC({ iceServers: this.ice }); p.pc = pc;
    pc.onconnectionstatechange = () => { const s = pc.connectionState; if (s === 'failed' || s === 'closed') this.drop(p.id, s); };
    pc.ondatachannel = (e) => this.wire(p, e.channel);
    return pc;
  }
  wire(p, ch) {
    if (ch.label === 'u') p.u = ch; else p.r = ch;
    ch.onopen = () => this.checkOpen(p);
    ch.onclose = () => this.drop(p.id, 'channel closed');
    ch.onmessage = (e) => { p.last = now(); this.recv++; let m; try { m = JSON.parse(e.data); } catch { return; } this.handle(p, m, ch.label === 'r'); };
  }
  checkOpen(p) { if (!p.open && p.u && p.r && p.u.readyState === 'open' && p.r.readyState === 'open') { p.open = true; p.last = now(); this.onOpen(p.id, p.hello); } }
  async gathered(pc) { // wait until ICE gathering is complete (or 2 s) so the description carries the candidates
    if (pc.iceGatheringState === 'complete') return;
    await new Promise(res => { const t = setTimeout(res, GATHER_MS); pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } }); });
  }
  // initiate a link (the newer player offers to the older ones; extra = data the other side gets with the offer)
  async connect(id, extra = {}) {
    if (this.closed || id === this.self) return; const p = this.peer(id); if (p.pc) return;
    const pc = this.newPc(p); this.wire(p, pc.createDataChannel('u', { ordered: false, maxRetransmits: 0 })); this.wire(p, pc.createDataChannel('r', { ordered: true }));
    await pc.setLocalDescription(await pc.createOffer()); await this.gathered(pc);
    if (this.closed || p.pc !== pc) return;
    await this.sig.send(id, 'offer', { ...extra, sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
  }
  async onSignal(s) {
    if (this.closed || !s || s.to !== this.self) return;
    if (s.type === 'offer') {
      const ok = this.accept(s); if (ok !== true) { this.sig.send(s.from, 'decline', { reason: ok || 'refused' }); return; }
      const old = this.peers.get(s.from); if (old && old.pc) this.drop(s.from, 'reconnect', true);
      const p = this.peer(s.from); p.hello = s.payload; const pc = this.newPc(p);
      await pc.setRemoteDescription(s.payload.sdp); await pc.setLocalDescription(await pc.createAnswer()); await this.gathered(pc);
      if (this.closed || p.pc !== pc) return;
      await this.sig.send(s.from, 'answer', { sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
    } else if (s.type === 'answer') {
      const p = this.peers.get(s.from); if (p && p.pc && !p.pc.currentRemoteDescription) await p.pc.setRemoteDescription(s.payload.sdp);
    } else if (s.type === 'decline') { this.onClose(s.from, 'declined: ' + (s.payload.reason || ''), s.payload.reason); this.drop(s.from, 'declined', true); }
    else if (s.type === 'hangup') this.drop(s.from, 'hangup');
  }
  handle(p, m, reliable) {
    if (m.k === '_pi') { this.raw(p, { k: '_po', s: m.s }, false); return; }
    if (m.k === '_po') { const r = now() - m.s; p.rtt = p.rtt == null ? r : p.rtt * 0.8 + r * 0.2; p.rttLast = r; return; }
    this.onMessage(p.id, m, reliable);
  }
  raw(p, m, reliable) { const ch = reliable ? p.r : p.u; if (!ch || ch.readyState !== 'open') return false; try { ch.send(typeof m === 'string' ? m : JSON.stringify(m)); this.sent++; return true; } catch { return false; } }
  send(id, m, reliable) { const p = this.peers.get(id); return !!(p && p.open && this.raw(p, m, reliable)); }
  broadcast(m, reliable, except) { const s = JSON.stringify(m); let n = 0; for (const p of this.peers.values()) if (p.open && p.id !== except && this.raw(p, s, reliable)) n++; return n; }
  tick() {
    const t = now();
    for (const p of [...this.peers.values()]) {
      if (p.open) { this.raw(p, { k: '_pi', s: t }, false); if (t - p.last > PEER_TIMEOUT_MS) this.drop(p.id, 'timeout'); }
      else if (p.pc && t - p.last > 20000) this.drop(p.id, 'could not connect');
    }
  }
  drop(id, why, quiet) {
    const p = this.peers.get(id); if (!p) return; this.peers.delete(id);
    try { p.u && p.u.close(); } catch { /* closed */ } try { p.r && p.r.close(); } catch { /* closed */ } try { p.pc && p.pc.close(); } catch { /* closed */ }
    if (!quiet || p.open) this.onClose(id, why);
  }
  close() { if (this.closed) return; this.closed = true; clearInterval(this.pingTimer); for (const id of [...this.peers.keys()]) { this.sig.send(id, 'hangup', {}); this.drop(id, 'left', true); } }
}
