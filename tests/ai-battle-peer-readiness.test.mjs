import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyArenaMovement } from '../src/components/battle/arenaMovementSequence.js';

test('PvP accepts ordered peer movement and rejects duplicated or older packets', () => {
  const prev = { seq: 4, move_session_id: 'old', receivedAt: 1000 };
  assert.deepEqual(classifyArenaMovement(prev, { seq: 5, x: 1, z: 1, move_session_id: 'old' }, 1100), { accept: true, reset: false });
  assert.equal(classifyArenaMovement(prev, { seq: 4, x: 1, z: 1, move_session_id: 'old' }, 1100).accept, false);
  assert.equal(classifyArenaMovement(prev, { seq: 3, x: 1, z: 1, move_session_id: 'old' }, 3000).accept, false);
});

test('PvP recovers immediately if an opponent browser restarts its sequence', () => {
  const retired = new Set();
  const old = { seq: 300, move_session_id: 'session-before-refresh', receivedAt: 1000 };
  const next = { seq: 1, x: 0.2, z: 1, move_session_id: 'session-after-refresh' };
  assert.deepEqual(classifyArenaMovement(old, next, 1080, retired), { accept: true, reset: true });
  assert.equal(retired.has('session-before-refresh'), true);
  const replay = { seq: 301, x: 6, z: 1, move_session_id: 'session-before-refresh' };
  assert.equal(classifyArenaMovement({ ...next, receivedAt: 1080 }, replay, 1150, retired).accept, false);
});

test('PvP has a bounded fallback for old clients lacking a movement session', () => {
  const prev = { seq: 500, receivedAt: 1000 };
  const restart = { seq: 1, x: 0, z: -2 };
  assert.equal(classifyArenaMovement(prev, restart, 2000).accept, false);
  assert.deepEqual(classifyArenaMovement(prev, restart, 2500), { accept: true, reset: true });
});

test('Malformed movement cannot poison the interpolation buffer', () => {
  for (const sample of [
    { seq: -1, x: 0, z: 0 },
    { seq: 'bad', x: 0, z: 0 },
    { seq: 1, x: Infinity, z: 0 },
    { seq: 1, x: 0, z: NaN },
  ]) assert.equal(classifyArenaMovement(null, sample, 1000).accept, false);
});

test('PvP startup requires live WebRTC and sends a session ID with movement', () => {
  const root = new URL('../src/components/', import.meta.url);
  const arena = readFileSync(new URL('battle/PvPArenaStage.jsx', root), 'utf8');
  const peer = readFileSync(new URL('game/MultiplayerSystem.jsx', root), 'utf8');
  const webRTC = readFileSync(new URL('shared/useWebRTCVoice.jsx', root), 'utf8');
  assert.ok(arena.includes("loaded !== 2 || !peerConnected"), 'do not start countdown on a disconnected peer');
  assert.ok(arena.includes("move_session_id:moveSessionId"), 'movement must identify restarted senders');
  assert.ok(peer.includes('activeBattle.player_ids'), 'build data channel from reserved match participants');
  assert.ok(webRTC.includes('scheduleReconnect(peerId)'), 'connection failures must schedule recovery');
  assert.ok(webRTC.includes("channel.onopen = () => publishPeerState(peerId)"), 'ready requires an open channel');
});
