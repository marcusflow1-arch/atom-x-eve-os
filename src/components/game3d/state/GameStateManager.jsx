// ─── GameStateManager ──────────────────────────────────────────────────
// The single source of truth for a real, networked game session.
//
// This is the "world simulation" layer. GameWorld3D is becoming a thin
// renderer that READS from this manager and SENDS intents to it — it no
// longer owns gameplay state.
//
// Authority model: HYBRID HOST-AUTHORITATIVE
//   • Exactly one client per room is elected "host" (lowest player_id).
//   • Host runs the simulation tick, resolves combat / loot / death.
//   • Non-host clients render interpolated state and send INTENTS only.
//   • All authoritative mutations go through resolveIntent() — which today
//     runs locally on the host, but tomorrow will route to backend functions
//     (combatDamage, attachEnemyAI, etc.) once the plan is upgraded.
//
// State shape:
//   {
//     tick: number,           // monotonic simulation tick
//     hostId: string|null,    // user id of current host
//     players: { [id]: { id, x,y,z, rotY, hp, maxHp, anim, lastSeen } },
//     enemies: { [id]: { id, type, x,y,z, rotY, hp, maxHp, tier, state, ownerHostId } },
//     loot:    { [id]: { id, kind, x,y,z, droppedBy, claimedBy?, expiresAt } },
//     events:  [ { id, kind, ...payload } ]  // ring buffer of recent events
//   }
//
// Subscriptions: subscribe(fn) -> unsubscribe. Fn is called after every tick
// AND every authoritative event.

const TICK_HZ = 20;
const TICK_MS = 1000 / TICK_HZ;
const EVENT_BUFFER = 64;

function newId(prefix = 'e') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

class GameStateManager {
  constructor() {
    this._state = {
      tick: 0,
      hostId: null,
      myId: null,
      players: {},
      enemies: {},
      loot: {},
      events: [],
    };
    this._subscribers = new Set();
    this._intentHandlers = new Map(); // kind -> async (state, intent) => stateMutation
    this._tickTimer = null;
    this._tickListeners = new Set();
    this._transport = null; // injected later (Base44 realtime entity subscription bridge)
  }

  // ─── Public API ─────────────────────────────────────────────────────
  getState() { return this._state; }
  isHost() { return this._state.hostId && this._state.hostId === this._state.myId; }
  setMyId(id) { this._state.myId = id; this._maybeElectHost(); this._emit(); }

  subscribe(fn) {
    this._subscribers.add(fn);
    return () => this._subscribers.delete(fn);
  }

  /**
   * Register a handler for an intent kind. Handlers receive (state, intent)
   * and return a list of authoritative mutations to apply + events to emit.
   * Today: runs on the host's browser.
   * Future: host calls backend function instead (e.g. combatDamage), receives
   *         the same shape of mutations back, and applies them identically.
   */
  registerIntentHandler(kind, handler) {
    this._intentHandlers.set(kind, handler);
  }

  /**
   * Submit an intent. If we're the host, resolve immediately. If we're a
   * client, forward to host via transport (which is added by NetworkBridge).
   */
  async submitIntent(intent) {
    if (!intent || !intent.kind) return;
    intent.id = intent.id || newId('int');
    intent.from = intent.from || this._state.myId;
    intent.ts = Date.now();

    if (this.isHost()) {
      await this._resolveIntent(intent);
    } else if (this._transport) {
      this._transport.sendIntent(intent);
    } else {
      // No host & no transport yet — buffer? For now, log & drop.
      console.warn('[GameState] intent dropped (no host, no transport):', intent.kind);
    }
  }

  // Host-only: actually resolve an intent into state mutations.
  async _resolveIntent(intent) {
    const handler = this._intentHandlers.get(intent.kind);
    if (!handler) {
      console.warn('[GameState] no handler for intent:', intent.kind);
      return;
    }
    try {
      const result = await handler(this._state, intent);
      if (result) this._applyMutations(result);
    } catch (err) {
      console.error('[GameState] intent resolution failed:', err);
    }
  }

  // Apply authoritative mutations (host -> all clients via transport).
  // Shape: { entities?: {players?, enemies?, loot?}, removed?: {...}, events?: [] }
  _applyMutations(mut) {
    if (!mut) return;
    const s = this._state;

    if (mut.entities) {
      if (mut.entities.players) Object.assign(s.players, mut.entities.players);
      if (mut.entities.enemies) Object.assign(s.enemies, mut.entities.enemies);
      if (mut.entities.loot)    Object.assign(s.loot, mut.entities.loot);
    }
    if (mut.removed) {
      for (const id of mut.removed.players || []) delete s.players[id];
      for (const id of mut.removed.enemies || []) delete s.enemies[id];
      for (const id of mut.removed.loot    || []) delete s.loot[id];
    }
    if (mut.events) {
      for (const ev of mut.events) {
        ev.id = ev.id || newId('ev');
        ev.tick = s.tick;
        s.events.push(ev);
      }
      if (s.events.length > EVENT_BUFFER) {
        s.events.splice(0, s.events.length - EVENT_BUFFER);
      }
    }

    // Broadcast to other clients
    if (this.isHost() && this._transport) {
      this._transport.broadcastMutation(mut, s.tick);
    }
    this._emit();
  }

  // Called by transport when remote authoritative mutations arrive.
  ingestRemoteMutation(mut, tick) {
    if (this.isHost()) return; // we are the authority; ignore stale echoes
    if (typeof tick === 'number') this._state.tick = Math.max(this._state.tick, tick);
    this._applyMutationsAsClient(mut);
  }

  _applyMutationsAsClient(mut) {
    // Same as _applyMutations but never re-broadcasts.
    const s = this._state;
    if (mut.entities) {
      if (mut.entities.players) Object.assign(s.players, mut.entities.players);
      if (mut.entities.enemies) Object.assign(s.enemies, mut.entities.enemies);
      if (mut.entities.loot)    Object.assign(s.loot, mut.entities.loot);
    }
    if (mut.removed) {
      for (const id of mut.removed.players || []) delete s.players[id];
      for (const id of mut.removed.enemies || []) delete s.enemies[id];
      for (const id of mut.removed.loot    || []) delete s.loot[id];
    }
    if (mut.events) {
      for (const ev of mut.events) s.events.push(ev);
      if (s.events.length > EVENT_BUFFER) s.events.splice(0, s.events.length - EVENT_BUFFER);
    }
    this._emit();
  }

  // ─── Transport injection (host election + broadcast) ───────────────
  attachTransport(transport) {
    // transport: { sendIntent(intent), broadcastMutation(mut, tick),
    //              announcePresence(myId), getPeerIds() -> string[] }
    this._transport = transport;
  }

  /**
   * Called by transport whenever the set of peers changes. We re-elect host
   * deterministically as the lexicographically smallest id present.
   */
  updatePeerList(peerIds) {
    const all = new Set(peerIds || []);
    if (this._state.myId) all.add(this._state.myId);
    const sorted = Array.from(all).filter(Boolean).sort();
    const newHost = sorted[0] || null;
    if (newHost !== this._state.hostId) {
      const wasHost = this.isHost();
      this._state.hostId = newHost;
      const becameHost = this.isHost();
      if (becameHost && !wasHost) this._startTick();
      if (!becameHost && wasHost) this._stopTick();
      this._emit();
    }
  }

  _maybeElectHost() {
    // Solo case: if no transport & we have an id, we're the host of an empty room.
    if (!this._transport && this._state.myId && !this._state.hostId) {
      this._state.hostId = this._state.myId;
      this._startTick();
    }
  }

  // ─── Simulation tick (host only) ───────────────────────────────────
  _startTick() {
    if (this._tickTimer) return;
    this._tickTimer = setInterval(() => this._tick(), TICK_MS);
  }
  _stopTick() {
    if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = null; }
  }

  _tick() {
    this._state.tick++;
    // Notify per-tick listeners (used by enemy AI on host)
    for (const fn of this._tickListeners) {
      try { fn(this._state); } catch (e) { console.error('[GameState] tick listener', e); }
    }
    // Periodic broadcast snapshot for late joiners (every 1s)
    if (this._state.tick % TICK_HZ === 0 && this._transport) {
      this._transport.broadcastMutation({
        entities: {
          players: this._state.players,
          enemies: this._state.enemies,
          loot: this._state.loot,
        },
        snapshot: true,
      }, this._state.tick);
    }
  }

  onTick(fn) {
    this._tickListeners.add(fn);
    return () => this._tickListeners.delete(fn);
  }

  _emit() {
    for (const fn of this._subscribers) {
      try { fn(this._state); } catch (e) { console.error('[GameState] subscriber', e); }
    }
  }

  // ─── Convenience helpers used by intent handlers ───────────────────
  static newId = newId;
}

// Singleton — there's one game world per page.
export const gameState = new GameStateManager();
export default gameState;