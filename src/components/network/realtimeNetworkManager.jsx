// Slice A — minimal, self-contained realtime network manager.
// Designed to run safely even with no server URL configured (returns inert state).
// Exposes: connect, disconnect, sendInput, getLocalState, getRemoteIds,
// getRemoteState, status, on(event), setServerUrl, getServerUrl.
//
// Wire protocol (JSON over WebSocket):
//   client -> server:  { t: 'hello', token }
//                      { t: 'input', seq, dt, dx, dy, dz, rotY, anim }
//                      { t: 'ping', ts }
//   server -> client:  { t: 'welcome', id }
//                      { t: 'snapshot', tick, players: [{ id, x,y,z, rotY, anim, lastSeq? }] }
//                      { t: 'pong', ts, serverTs }
//                      { t: 'kick', reason }

const DEFAULT_URL = 'ws://localhost:2567';
const URL_STORAGE_KEY = 'atomxe_network_test_url';
const PING_INTERVAL_MS = 1000;
const RECONNECT_BACKOFF_MS = [1000, 2000, 4000, 8000];
const SNAPSHOT_BUFFER_MS = 100; // interpolation delay
const MAX_BUFFER_LEN = 30;

function nowMs() { return performance.now(); }

class RealtimeNetwork {
  constructor() {
    this._listeners = new Map(); // event -> Set<fn>
    this._ws = null;
    this._state = 'idle'; // idle | connecting | authenticating | connected | reconnecting | closed
    this._serverUrl = (typeof localStorage !== 'undefined' && localStorage.getItem(URL_STORAGE_KEY)) || DEFAULT_URL;
    this._reconnectAttempt = 0;
    this._reconnectTimer = null;
    this._pingTimer = null;
    this._wantConnected = false;

    // Identity
    this._myId = null;

    // Metrics
    this._ping = 0;
    this._jitter = 0;
    this._lastPingSent = 0;
    this._pingHistory = [];
    this._snapshotsReceived = 0;
    this._snapshotRate = 0;
    this._lastSnapshotRateCalc = nowMs();
    this._snapshotCountWindow = 0;
    this._serverTickRate = 0;
    this._lastSnapshotTick = 0;
    this._lastSnapshotTime = 0;
    this._predictionError = 0;

    // Local predicted state
    this._inputSeq = 0;
    this._localState = {
      pos: { x: 0, y: 0, z: 0 },
      rot: { y: 0 },
      anim: 'idle',
    };
    // Pending inputs not yet acked by server (for reconciliation)
    this._pendingInputs = [];

    // Remote snapshot buffers: id -> [{ t, pos, rot, anim }]
    this._remoteBuffers = new Map();
    // Last known authoritative state for local player (for reconciliation)
    this._serverLocalSnapshot = null;
  }

  // ---------- Public: subscriptions ----------
  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return () => this._listeners.get(event)?.delete(fn);
  }
  _emit(event, payload) {
    const set = this._listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      try { fn(payload); } catch (e) { console.error('[net] listener error', e); }
    }
  }

  // ---------- Public: config ----------
  getServerUrl() { return this._serverUrl; }
  setServerUrl(url) {
    this._serverUrl = (url || '').trim() || DEFAULT_URL;
    try { localStorage.setItem(URL_STORAGE_KEY, this._serverUrl); } catch {}
  }

  status() {
    return {
      state: this._state,
      id: this._myId,
      ping: Math.round(this._ping),
      jitter: Math.round(this._jitter),
      snapshotRate: Math.round(this._snapshotRate * 10) / 10,
      serverTickRate: Math.round(this._serverTickRate * 10) / 10,
      predictionError: Math.round(this._predictionError * 1000) / 1000,
      remoteCount: this._remoteBuffers.size,
      url: this._serverUrl,
    };
  }

  // ---------- Public: lifecycle ----------
  async connect(urlOverride) {
    if (urlOverride) this.setServerUrl(urlOverride);
    this._wantConnected = true;
    this._reconnectAttempt = 0;
    return this._openSocket();
  }

  disconnect() {
    this._wantConnected = false;
    this._clearTimers();
    if (this._ws) {
      try { this._ws.close(1000, 'client_disconnect'); } catch {}
      this._ws = null;
    }
    this._remoteBuffers.clear();
    this._pendingInputs = [];
    this._serverLocalSnapshot = null;
    this._setState('idle');
  }

  // ---------- Public: state queries ----------
  getLocalState() {
    return this._localState;
  }
  getRemoteIds() {
    return Array.from(this._remoteBuffers.keys());
  }
  getRemoteState(id) {
    const buf = this._remoteBuffers.get(id);
    if (!buf || buf.length === 0) return null;
    return this._interpolate(buf);
  }

  // ---------- Public: input ----------
  sendInput(input) {
    if (!input || typeof input.dt !== 'number') return;
    // Always apply locally for prediction
    this._applyInputLocal(input);

    // Send to server if connected
    if (this._state === 'connected' && this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._inputSeq++;
      const msg = {
        t: 'input',
        seq: this._inputSeq,
        dt: input.dt,
        dx: input.dx || 0,
        dy: input.dy || 0,
        dz: input.dz || 0,
        rotY: input.rotY || 0,
        anim: input.anim || 'idle',
      };
      this._pendingInputs.push({ seq: this._inputSeq, ...msg });
      // Cap pending buffer
      if (this._pendingInputs.length > 200) this._pendingInputs.shift();
      this._safeSend(msg);
    }
  }

  // ---------- Internal: state transitions ----------
  _setState(s) {
    if (this._state === s) return;
    this._state = s;
    this._emit('state', s);
  }

  _clearTimers() {
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
    if (this._pingTimer) { clearInterval(this._pingTimer); this._pingTimer = null; }
  }

  async _openSocket() {
    if (!this._serverUrl) {
      this._setState('closed');
      return;
    }
    // Validate URL
    if (!/^wss?:\/\//.test(this._serverUrl)) {
      console.warn('[net] invalid server URL (must start with ws:// or wss://):', this._serverUrl);
      this._setState('closed');
      this._emit('error', { message: 'Invalid server URL' });
      return;
    }

    this._setState('connecting');
    let ws;
    try {
      ws = new WebSocket(this._serverUrl);
    } catch (e) {
      console.error('[net] WebSocket constructor failed:', e);
      this._setState('closed');
      this._emit('error', { message: e?.message || 'WebSocket construct failed' });
      this._scheduleReconnect();
      return;
    }
    this._ws = ws;

    // Connection timeout (10s)
    const timeout = setTimeout(() => {
      if (this._state === 'connecting' || this._state === 'authenticating') {
        console.warn('[net] connection timeout');
        try { ws.close(); } catch {}
      }
    }, 10000);

    ws.onopen = () => {
      clearTimeout(timeout);
      this._setState('authenticating');
      // Send hello with a best-effort token (Base44 may not be on this page; that's OK)
      this._safeSend({ t: 'hello', token: this._getAuthToken() });
    };

    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      this._handleMessage(msg);
    };

    ws.onerror = (e) => {
      // Don't log noisy events; close handler will deal with state
      this._emit('error', { message: 'WebSocket error' });
    };

    ws.onclose = (ev) => {
      clearTimeout(timeout);
      this._clearTimers();
      this._ws = null;
      this._remoteBuffers.clear();
      this._pendingInputs = [];
      this._serverLocalSnapshot = null;
      if (this._wantConnected) {
        this._setState('reconnecting');
        this._scheduleReconnect();
      } else {
        this._setState('closed');
      }
    };
  }

  _scheduleReconnect() {
    if (!this._wantConnected) return;
    const idx = Math.min(this._reconnectAttempt, RECONNECT_BACKOFF_MS.length - 1);
    const delay = RECONNECT_BACKOFF_MS[idx];
    this._reconnectAttempt++;
    this._reconnectTimer = setTimeout(() => this._openSocket(), delay);
  }

  _getAuthToken() {
    // Best-effort: read Base44 token if available; safe to pass empty.
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('base44_token') || '';
      }
    } catch {}
    return '';
  }

  _safeSend(msg) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return;
    try { this._ws.send(JSON.stringify(msg)); } catch (e) { console.warn('[net] send failed', e); }
  }

  _handleMessage(msg) {
    if (!msg || typeof msg.t !== 'string') return;
    switch (msg.t) {
      case 'welcome': {
        this._myId = msg.id || null;
        this._setState('connected');
        this._reconnectAttempt = 0;
        // Start ping loop
        this._pingTimer = setInterval(() => this._sendPing(), PING_INTERVAL_MS);
        this._emit('auth_ok', { id: this._myId });
        break;
      }
      case 'pong': {
        const rtt = nowMs() - (msg.ts || this._lastPingSent);
        this._pingHistory.push(rtt);
        if (this._pingHistory.length > 10) this._pingHistory.shift();
        const avg = this._pingHistory.reduce((a, b) => a + b, 0) / this._pingHistory.length;
        const variance = this._pingHistory.reduce((a, b) => a + (b - avg) ** 2, 0) / this._pingHistory.length;
        this._ping = avg;
        this._jitter = Math.sqrt(variance);
        break;
      }
      case 'snapshot': {
        this._handleSnapshot(msg);
        break;
      }
      case 'kick': {
        this._emit('kick', { reason: msg.reason || 'unknown' });
        this._wantConnected = false;
        try { this._ws?.close(4000, 'kicked'); } catch {}
        break;
      }
      default:
        // Unknown message — ignore
        break;
    }
  }

  _sendPing() {
    if (this._state !== 'connected') return;
    this._lastPingSent = nowMs();
    this._safeSend({ t: 'ping', ts: this._lastPingSent });
  }

  _handleSnapshot(msg) {
    const t = nowMs();
    this._snapshotsReceived++;
    this._snapshotCountWindow++;

    // Rate calc (1s window)
    if (t - this._lastSnapshotRateCalc >= 1000) {
      this._snapshotRate = this._snapshotCountWindow * 1000 / (t - this._lastSnapshotRateCalc);
      this._snapshotCountWindow = 0;
      this._lastSnapshotRateCalc = t;
    }

    // Server tick rate from tick delta
    if (typeof msg.tick === 'number' && this._lastSnapshotTick > 0) {
      const dTick = msg.tick - this._lastSnapshotTick;
      const dTime = t - this._lastSnapshotTime;
      if (dTick > 0 && dTime > 0) {
        // tick rate = ticks-per-second roughly
        const sample = dTick * 1000 / dTime;
        this._serverTickRate = this._serverTickRate === 0 ? sample : this._serverTickRate * 0.9 + sample * 0.1;
      }
    }
    this._lastSnapshotTick = msg.tick || 0;
    this._lastSnapshotTime = t;

    const players = Array.isArray(msg.players) ? msg.players : [];
    const seenIds = new Set();
    for (const p of players) {
      if (!p || !p.id) continue;
      seenIds.add(p.id);
      const sample = {
        t,
        pos: { x: p.x || 0, y: p.y || 0, z: p.z || 0 },
        rot: { y: p.rotY || 0 },
        anim: p.anim || 'idle',
        lastSeq: p.lastSeq || 0,
      };
      if (p.id === this._myId) {
        this._serverLocalSnapshot = sample;
        this._reconcileLocal(sample);
      } else {
        let buf = this._remoteBuffers.get(p.id);
        if (!buf) {
          buf = [];
          this._remoteBuffers.set(p.id, buf);
          this._emit('player_joined', { id: p.id });
        }
        buf.push(sample);
        if (buf.length > MAX_BUFFER_LEN) buf.shift();
      }
    }
    // Remove remotes no longer present
    for (const id of Array.from(this._remoteBuffers.keys())) {
      if (!seenIds.has(id)) {
        this._remoteBuffers.delete(id);
        this._emit('player_left', { id });
      }
    }
  }

  _reconcileLocal(serverSample) {
    // Drop acked inputs
    if (serverSample.lastSeq > 0) {
      this._pendingInputs = this._pendingInputs.filter((p) => p.seq > serverSample.lastSeq);
    }
    // Start from authoritative position
    let x = serverSample.pos.x;
    let y = serverSample.pos.y;
    let z = serverSample.pos.z;
    // Re-apply pending inputs
    for (const inp of this._pendingInputs) {
      x += inp.dx; y += inp.dy; z += inp.dz;
    }
    // Compute prediction error magnitude
    const ex = x - this._localState.pos.x;
    const ey = y - this._localState.pos.y;
    const ez = z - this._localState.pos.z;
    this._predictionError = Math.sqrt(ex * ex + ey * ey + ez * ez);

    // Smooth-correct (lerp toward reconciled position to avoid snap)
    const k = this._predictionError > 2 ? 1.0 : 0.25; // snap if huge error
    this._localState.pos.x += ex * k;
    this._localState.pos.y += ey * k;
    this._localState.pos.z += ez * k;
  }

  _applyInputLocal(input) {
    this._localState.pos.x += input.dx || 0;
    this._localState.pos.y += input.dy || 0;
    this._localState.pos.z += input.dz || 0;
    if (typeof input.rotY === 'number') this._localState.rot.y = input.rotY;
    if (input.anim) this._localState.anim = input.anim;
  }

  _interpolate(buf) {
    if (buf.length === 0) return null;
    if (buf.length === 1) return { pos: buf[0].pos, rot: buf[0].rot, anim: buf[0].anim };
    const renderTime = nowMs() - SNAPSHOT_BUFFER_MS;
    // Find two samples surrounding renderTime
    let a = buf[0], b = buf[buf.length - 1];
    for (let i = 0; i < buf.length - 1; i++) {
      if (buf[i].t <= renderTime && buf[i + 1].t >= renderTime) {
        a = buf[i]; b = buf[i + 1]; break;
      }
    }
    if (b.t === a.t) return { pos: b.pos, rot: b.rot, anim: b.anim };
    const tt = Math.max(0, Math.min(1, (renderTime - a.t) / (b.t - a.t)));
    return {
      pos: {
        x: a.pos.x + (b.pos.x - a.pos.x) * tt,
        y: a.pos.y + (b.pos.y - a.pos.y) * tt,
        z: a.pos.z + (b.pos.z - a.pos.z) * tt,
      },
      rot: { y: a.rot.y + (b.rot.y - a.rot.y) * tt },
      anim: b.anim,
    };
  }
}

// Singleton — safe to import anywhere
export const realtimeNetwork = new RealtimeNetwork();
export default realtimeNetwork;