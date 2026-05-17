// ─── GameStateProvider ─────────────────────────────────────────────────
// React mount point for the GameStateManager.
// Drop this once near the top of GameView / GameWorld3D and it:
//   1. Registers all authoritative intent handlers
//   2. Wires up the local player's id from the auth context
//   3. Renders a tiny debug HUD showing host / tick / counts
//
// It does NOT replace any rendering logic — GameWorld3D keeps drawing.
// It is purely the simulation layer.

import { useEffect, useState } from 'react';
import gameState from './GameStateManager';
import { registerAllIntentHandlers } from './intentHandlers';
import { base44 } from '@/api/base44Client';

let _handlersRegistered = false;

export default function GameStateProvider({ children, showDebugHUD = true }) {
  const [snap, setSnap] = useState(() => gameState.getState());

  useEffect(() => {
    if (!_handlersRegistered) {
      registerAllIntentHandlers();
      _handlersRegistered = true;
    }

    // Hydrate local player id from Base44 auth
    let cancelled = false;
    base44.auth.me().then((me) => {
      if (cancelled || !me?.id) return;
      gameState.setMyId(me.id);
      gameState.submitIntent({
        kind: 'player_join',
        playerId: me.id,
        displayName: me.full_name || me.email?.split('@')[0] || 'Player',
      });
    }).catch(() => { /* not logged in — solo render still works */ });

    const unsub = gameState.subscribe((s) => setSnap({ ...s }));

    return () => {
      cancelled = true;
      unsub();
      if (gameState.getState().myId) {
        gameState.submitIntent({ kind: 'player_leave', playerId: gameState.getState().myId });
      }
    };
  }, []);

  return (
    <>
      {children}
      {showDebugHUD && <GameStateDebugHUD snap={snap} />}
    </>
  );
}

function GameStateDebugHUD({ snap }) {
  const isHost = snap.hostId && snap.hostId === snap.myId;
  return (
    <div style={{
      position: 'fixed', top: 80, right: 12, zIndex: 9000,
      background: 'rgba(0,0,0,0.72)', color: '#fff',
      padding: '8px 12px', borderRadius: 8, fontFamily: 'monospace',
      fontSize: 11, lineHeight: 1.5, pointerEvents: 'none',
      border: '1px solid rgba(255,255,255,0.12)',
      minWidth: 200,
    }}>
      <div style={{ color: '#22d3ee', fontWeight: 700, marginBottom: 4 }}>
        ▣ GameState • tick {snap.tick}
      </div>
      <div>role: <span style={{ color: isHost ? '#4ade80' : '#fbbf24' }}>{isHost ? 'HOST' : 'CLIENT'}</span></div>
      <div>host: {snap.hostId ? snap.hostId.slice(0, 8) : '—'}</div>
      <div>me:   {snap.myId   ? snap.myId.slice(0, 8)   : '—'}</div>
      <div>players: {Object.keys(snap.players).length}</div>
      <div>enemies: {Object.keys(snap.enemies).length}</div>
      <div>loot:    {Object.keys(snap.loot).length}</div>
      <div style={{ marginTop: 4, color: '#94a3b8' }}>
        events: {snap.events.length}
      </div>
    </div>
  );
}