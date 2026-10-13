import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileNetworkPosition } from '../src/components/network/remote/positionCorrection.js';

// Shared physics-free presentation math for the 3D-world and Luna arena.
test('small and mid-size delayed updates move a remote gradually instead of teleporting', () => {
  const current = [0, 2, 0];
  const target = [2, 2, 0];
  const result = reconcileNetworkPosition(current, target, 1 / 60);
  assert.equal(result.hardSnap, false);
  assert.ok(result.pos[0] > 0 && result.pos[0] < 1);
  assert.deepEqual(current, [0, 2, 0], 'never overwrite authoritative combat coordinates');
  assert.deepEqual(target, [2, 2, 0], 'never overwrite the latest network state');
});

test('smooth correction is frame-rate independent and approaches the new position', () => {
  let a = [0, 0, 0], b = [0, 0, 0];
  for (let i = 0; i < 60; i++) a = reconcileNetworkPosition(a, [2, 0, 0], 1 / 60).pos;
  for (let i = 0; i < 30; i++) b = reconcileNetworkPosition(b, [2, 0, 0], 1 / 30).pos;
  assert.ok(Math.abs(a[0] - b[0]) < 0.00001);
  assert.ok(a[0] > 1.99 && a[0] <= 2);
});

test('hard snaps remain available for long teleports and respawns', () => {
  assert.deepEqual(reconcileNetworkPosition([0, 0, 0], [15, 0, 0], 1 / 60).pos, [15, 0, 0]);
  assert.equal(reconcileNetworkPosition([0, 0, 0], [15, 0, 0], 1 / 60).hardSnap, true);
  assert.equal(reconcileNetworkPosition([0, 0, 0], [1, 0, 0], 1 / 60, { forceSnap: true }).hardSnap, true);
});

test('a slow frame cannot jump multiple game units in one correction', () => {
  const correction = reconcileNetworkPosition([0, 0, 0], [7, 0, 0], 5);
  assert.equal(correction.hardSnap, false);
  assert.ok(correction.pos[0] <= 3.5 && correction.pos[0] > 0);
});

test('stationary, invalid, and zero-delta packets remain stable', () => {
  assert.deepEqual(reconcileNetworkPosition([0, 0, 0], [0, 0, 0], 0.02).pos, [0, 0, 0]);
  assert.deepEqual(reconcileNetworkPosition([1, 2, 3], [Infinity, 2, 3], 0.02).pos, [1, 2, 3]);
  assert.deepEqual(reconcileNetworkPosition([1, 2, 3], [2, 3, 4], 0).pos, [1, 2, 3]);
});
