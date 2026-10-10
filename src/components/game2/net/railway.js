// Game 2: fast global arena over a persistent Railway WebSocket.
// This replaces Base44 database signaling + per-peer WebRTC for live multiplayer.
// Human player movements, saber and Force updates stay on this one relay.
export const GAME2_RAILWAY_PROTOCOL = 2;
export const GAME2_RAILWAY_MAX = 10;

// Set by build-time configuration, or use the tested Railway service domain.
// This is a PUBLIC service URL, not an authorization secret.
export const DEFAULT_GAME2_RAILWAY_URL = 'wss://game2-arena-relay-test.up.railway.app/ws/game2';

export function game2RailwayUrl() {
  const configured = typeof import.meta.env === 'object'
    ? import.meta.env.VITE_GAME2_WS_URL : '';
  const url = String(configured || DEFAULT_GAME2_RAILWAY_URL).trim();
  if (!/^wss:\/\/[a-z0-9.-]+(?::\d+)?\/ws\/game2$/i.test(url)) {
    throw new Error('Game 2 Railway multiplayer address is not configured');
  }
  return url;
}

export async function game2RailwayStatus({ url = game2RailwayUrl(), fetchImpl = fetch } = {}) {
  const statusUrl = url.replace(/^wss:\/\//, 'https://').replace(/\/ws\/game2$/, '/status');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetchImpl(statusUrl, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error('Railway arena HTTP ' + response.status);
    const status = await response.json();
    if (!status?.ready || status.protocol !== GAME2_RAILWAY_PROTOCOL) {
      throw new Error('Incompatible Game 2 Railway multiplayer server');
    }
    return status;
  } finally { clearTimeout(timeout); }
}

export class RailwayGameSession {
  constructor(options) {
    this.o = options;
    this.self = options.selfId;
    this.max = GAME2_RAILWAY_MAX;
    this.hostId = null;
    this.isHost = false;
    this.roster = new Map();
    this.me = null;
    this.state = 'idle';
    this.statusText = '';
    this.ended = false;
    this.ws = null;
    this.pingMs = null;
    this.pingId = 0;
    this.pingWait = new Map();
    this.ai = 0;
    this.onReady = this.onJoin = this.onLeave = this.onMessage = this.onEnd =
      this.onStatus = this.onRoster = this.onHostChange = () => {};
    this.welcomeExtra = () => ({});
  }
  status(message) { this.statusText = message; this.onStatus(message); }
  list() { return [...this.roster.values()].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)); }
  entry(id) { return this.roster.get(id); }
  direct(id) { return this.state === 'live' && this.roster.has(id); }
  rtt(id) { return this.roster.has(id) ? this.pingMs : null; }
  _write(message) {
    if (!this.ws || this.ws.readyState !== 1) return false;
    const reliable = message.reliable !== false;
    if (this.ws.bufferedAmount > (reliable ? 4 * 1024 * 1024 : 1024 * 1024)) return false;
    try { this.ws.send(JSON.stringify(message)); return true; } catch { return false; }
  }
  send(to, m, reliable = true) {
    if (!this.roster.has(to) || to === this.self) return false;
    return this._write({ t: 'packet', to, body: m, reliable });
  }
  broadcast(m, reliable = true) {
    if (this.state !== 'live') return 0;
    if (!this._write({ t: 'packet', body: m, reliable })) return 0;
    return Math.max(0, this.roster.size - 1);
  }
  _updateRoster(rows, host, ai) {
    const old = new Map(this.roster);
    const previousHost = this.hostId;
    const wasHost = this.isHost;
    this.roster = new Map((rows || []).map(entry => [entry.id, entry]));
    this.hostId = host || null;
    this.isHost = this.hostId === this.self;
    if (Number.isInteger(ai)) this.ai = ai;
    if (this.roster.has(this.self)) this.me = this.roster.get(this.self);
    this.onRoster(this.list());
    for (const [id, player] of old) if (id !== this.self && !this.roster.has(id)) this.onLeave(id, player);
    for (const [id, player] of this.roster) if (id !== this.self && !old.has(id)) this.onJoin(player);
    if (wasHost !== this.isHost || previousHost !== this.hostId) {
      this.onHostChange(this.hostId, this.isHost);
    }
  }
  _receive(raw) {
    let message;
    try { message = JSON.parse(typeof raw === 'string' ? raw : String(raw)); }
    catch { return; }
    if (message.t === 'error') {
      this.end(message.message || 'Railway arena rejected connection');
      return;
    }
    if (message.t === 'welcome') {
      if (this.state !== 'connecting' || !Array.isArray(message.roster) ||
        !message.roster.some(p => p.id === this.self)) return;
      this.state = 'live';
      this._updateRoster(message.roster, message.host, message.ai);
      this.status('');
      this.onReady(this.me, message);
      this.joined?.(true);
      return;
    }
    if (message.t === 'roster' && this.state === 'live') {
      this._updateRoster(message.roster, message.host, message.ai);
      return;
    }
    if (message.t === 'packet' && this.state === 'live') {
      if (this.roster.has(message.from) && message.body) {
        this.onMessage(message.from, message.body, message.reliable !== false);
      }
      return;
    }
    if (message.t === 'pong' && this.pingWait.has(message.id)) {
      const roundTrip = Date.now() - this.pingWait.get(message.id);
      this.pingWait.delete(message.id);
      this.pingMs = this.pingMs === null ? roundTrip : this.pingMs * 0.8 + roundTrip * 0.2;
    }
  }
  start() {
    if (this.state !== 'idle') return Promise.reject(new Error('Game 2 already connecting'));
    this.state = 'connecting'; this.status('Connecting to Railway shared arena');
    const WS = this.o.WebSocketImpl || (typeof WebSocket !== 'undefined' ? WebSocket : null);
    if (!WS) {
      this.end('This browser does not support WebSockets');
      return Promise.resolve();
    }
    let url;
    try { url = this.o.url || game2RailwayUrl(); }
    catch (error) { this.end(error.message); return Promise.resolve(); }
    return new Promise(resolve => {
      let resolved = false;
      const finish = () => { if (!resolved) { resolved = true; resolve(); } };
      this.joined = finish;
      let ws;
      try { ws = new WS(url); } catch (error) { this.end('Railway connection failed: ' + error.message); finish(); return; }
      this.ws = ws;
      const waitTimer = setTimeout(() => {
        if (this.state !== 'live' && !this.ended) this.end('Railway arena connection timed out');
        finish();
      }, 16000);
      const originalFinish = this.joined;
      this.joined = () => { clearTimeout(waitTimer); originalFinish(); };
      ws.onopen = () => {
        this.status('Authenticating with Game 2 Railway server');
        if (!this._write({ t: 'join', version: GAME2_RAILWAY_PROTOCOL,
          token: this.o.token, peer: this.self, name: this.o.name,
          side: this.o.side, ai: this.o.ai ?? 0 })) {
          this.end('Unable to join the Railway arena');
        }
        // The login token is used only for admission; never store it in logs.
        this.o.token = null;
      };
      ws.onmessage = event => this._receive(event.data);
      ws.onerror = () => { if (this.state !== 'live' && !this.ended) this.end('Cannot reach the Railway arena WebSocket'); };
      ws.onclose = event => {
        if (!this.ended) this.end('Railway connection lost' +
          (event.reason ? ': ' + event.reason : ' — return to the lobby to reconnect'));
        this.joined?.();
      };
      this.pingTimer = setInterval(() => {
        if (this.state !== 'live') return;
        const id = ++this.pingId;
        this.pingWait.set(id, Date.now());
        if (this.pingWait.size > 5) this.pingWait.delete(this.pingWait.keys().next().value);
        this._write({ t: 'ping', id });
      }, 3000);
    });
  }
  end(reason) {
    if (this.ended) return;
    this.ended = true;
    this.state = 'ended';
    this.status(reason);
    this._stop();
    this.onEnd(reason);
    this.joined?.();
  }
  _stop() {
    clearInterval(this.pingTimer);
    this.pingTimer = null;
    if (this.ws) { try { this.ws.close(); } catch { /* already disconnected */ } }
    this.ws = null;
    this.o.token = null;
  }
  leave() {
    if (this.ended) return;
    this.ended = true;
    this.state = 'ended';
    this._write({ t: 'leave' });
    this._stop();
    this.joined?.();
  }
}
