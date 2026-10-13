import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileRemotePosition, REMOTE_SMOOTHING_DEFAULTS } from '../src/components/game2/net/remoteSmoothing.js';

const near = (actual, expected, epsilon = 0.000001) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} != ${expected}`);

test('late movement snapshot is caught up smoothly rather than instantly snapping at 1.5 units', () => {
  const current = [0, 0, 0], target = [2, 0, 0];
  const result = reconcileRemotePosition(current, target, 1 / 60);
  assert.equal(result.hardSnap, false);
  assert.ok(result.pos[0] > 0 && result.pos[0] < 2);
  assert.ok(result.pos[0] <= REMOTE_SMOOTHING_DEFAULTS.maxCorrectionSpeed / 60 + 1e-6);
  assert.deepEqual(current, [0, 0, 0], 'the reconciliation helper must not mutate combat position arrays');
});

test('frame-rate-independent catch-up converges without overshooting', () => {
  let current = [0, 0, 0];
  for (let i = 0; i < 60; i++) current = reconcileRemotePosition(current, [3, 0, 0], 1 / 60).pos;
  assert.ok(current[0] > 2.99 && current[0] <= 3);
});

test('large teleports and explicit respawn transitions still snap immediately', () => {
  assert.deepEqual(reconcileRemotePosition([0, 0, 0], [15, 2, 0], 1 / 60), {
    pos: [15, 2, 0], error: Math.hypot(15, 2), hardSnap: true,
  });
  assert.equal(reconcileRemotePosition([1, 0, 0], [2, 0, 0], 1 / 60, { forceSnap: true }).hardSnap, true);
});

test('long frame stalls are bounded instead of creating a giant correction', () => {
  const result = reconcileRemotePosition([0, 0, 0], [5, 0, 0], 5);
  assert.equal(result.hardSnap, false);
  assert.ok(result.pos[0] <= REMOTE_SMOOTHING_DEFAULTS.maxCorrectionSpeed * 0.1);
});

test('stationary updates, zero delta, and non-finite snapshots are safe', () => {
  near(reconcileRemotePosition([2, 3, 4], [2, 3, 4], 1 / 60).pos[0], 2);
  assert.deepEqual(reconcileRemotePosition([2, 3, 4], [4, 5, 6], 0).pos, [2, 3, 4]);
  assert.deepEqual(reconcileRemotePosition([2, 3, 4], [Infinity, 0, 0], 1 / 60).pos, [2, 3, 4]);
});
