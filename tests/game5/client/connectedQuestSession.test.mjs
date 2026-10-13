import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createConnectedQuestSession, assertServerSnapshot, isAuthoritativelyCollected,
  GAME5_MODES,
} from '../../../src/game5/client/connectedQuestSession.mjs';

const snap = (status, current, testWallet = 0) => ({
  quest: { questId: 'G5-0001', status, objective: { id: 'collect-lost-card', current, required: 1 } },
  testWallet,
  cardCollected: current === 1,
  isolatedTestOnly: true,
});

test('modes are explicit and missing backend never silently uses browser demo', async () => {
  assert.equal(GAME5_MODES.DEMO, 'demo');
  assert.equal(GAME5_MODES.CONNECTED, 'connected');
  const session = createConnectedQuestSession();
  const load = await session.refresh();
  assert.equal(load.ok, false);
  assert.equal(load.reason, 'backend_unavailable');
  assert.equal(session.getState().snapshot, null);
  assert.equal(session.getState().phase, 'disconnected');
  assert.match(session.getState().error, /authenticated backend is not connected/);
  const action = await session.dispatch('pickup', { pickupId: 'card' });
  assert.equal(action.ok, false);
  assert.equal(action.reason, 'not_loaded');
});

test('server snapshots exclusively control progress, collection visibility and reload', async () => {
  let server = snap('not_started', 0);
  let rewardCount = 0;
  const transport = {
    load: async () => ({ snapshot: server }),
    accept: async () => {
      server = snap('active', 0); return { snapshot: server, notice: 'Accepted by backend' };
    },
    pickup: async () => {
      server = snap('ready_to_complete', 1); return { snapshot: server, notice: 'Verified pickup' };
    },
    complete: async () => {
      if (server.quest.status === 'ready_to_complete') rewardCount += 1;
      server = snap('completed', 1, rewardCount);
      return { snapshot: server, notice: 'Reward settled by backend' };
    },
  };
  const session = createConnectedQuestSession({ transport });
  assert.equal(isAuthoritativelyCollected(session.getState().snapshot), false);
  assert.equal((await session.refresh()).ok, true);
  assert.equal(session.getState().snapshot.quest.status, 'not_started');
  await session.dispatch('accept', { npcId: 'elder' });
  assert.equal(session.getState().snapshot.quest.objective.current, 0);
  assert.equal(isAuthoritativelyCollected(session.getState().snapshot), false);
  await session.dispatch('pickup', { pickupId: 'card' });
  assert.equal(session.getState().snapshot.quest.objective.current, 1);
  assert.equal(isAuthoritativelyCollected(session.getState().snapshot), true);
  await session.dispatch('complete', { npcId: 'elder' });
  assert.equal(session.getState().snapshot.testWallet, 1);
  const restarted = createConnectedQuestSession({ transport });
  await restarted.refresh();
  assert.equal(restarted.getState().snapshot.quest.status, 'completed');
  assert.equal(restarted.getState().snapshot.testWallet, 1);
  await restarted.dispatch('complete', { npcId: 'elder' });
  assert.equal(rewardCount, 1, 'test transport simulates idempotent backend once-only award');
  session.dispose();
  restarted.dispose();
});

test('duplicate in-flight requests do not invoke transport more than once', async () => {
  let release;
  const deferred = new Promise(resolve => { release = resolve; });
  let requestCount = 0;
  const session = createConnectedQuestSession({
    transport: {
      load: async () => ({ snapshot: snap('active', 0) }),
      pickup: async () => { requestCount += 1; await deferred; return { snapshot: snap('ready_to_complete', 1) }; },
    },
  });
  await session.refresh();
  const first = session.dispatch('pickup', {});
  const duplicate = await session.dispatch('pickup', {});
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.reason, 'busy_or_disposed');
  assert.equal(requestCount, 1);
  assert.equal(session.getState().snapshot.quest.objective.current, 0);
  release();
  assert.equal((await first).ok, true);
  assert.equal(session.getState().snapshot.quest.objective.current, 1);
});

test('rejected pickup and backend failures do not falsely advance or hide card', async () => {
  let shouldFail = true;
  const session = createConnectedQuestSession({
    transport: {
      load: async () => ({ snapshot: snap('active', 0) }),
      pickup: async () => {
        if (shouldFail) throw Object.assign(new Error('Item out of range'), { status: 409 });
        return { snapshot: snap('ready_to_complete', 1) };
      },
    },
  });
  await session.refresh();
  const rejected = await session.dispatch('pickup', {});
  assert.equal(rejected.ok, false);
  assert.equal(session.getState().phase, 'rejected');
  assert.match(session.getState().error, /Item out of range/);
  assert.equal(isAuthoritativelyCollected(session.getState().snapshot), false);
  shouldFail = false;
  await session.refresh();
  assert.equal((await session.dispatch('pickup', {})).ok, true);
  assert.equal(isAuthoritativelyCollected(session.getState().snapshot), true);
  const invalid = createConnectedQuestSession({ transport: { load: async () => ({ snapshot: snap('active', 1) }) } });
  assert.equal((await invalid.refresh()).ok, false);
  assert.equal(invalid.getState().phase, 'backend_failure');
  assert.equal(invalid.getState().snapshot, null);
});

test('unauthorized clears stale snapshots; disconnect and 503 are explicit', async () => {
  let fail = false;
  let err = new Error('Unauthorized');
  err.status = 401;
  const session = createConnectedQuestSession({
    transport: { load: async () => { if (fail) throw err; return { snapshot: snap('ready_to_complete', 1) }; } },
  });
  await session.refresh();
  assert.equal(isAuthoritativelyCollected(session.getState().snapshot), true);
  fail = true;
  assert.equal((await session.refresh()).ok, false);
  assert.equal(session.getState().phase, 'unauthorized');
  assert.equal(session.getState().snapshot, null);
  err = Object.assign(new Error('Backend down'), { status: 503 });
  assert.equal((await session.refresh()).ok, false);
  assert.equal(session.getState().phase, 'backend_failure');
  err = new TypeError('Failed to fetch');
  assert.equal((await session.refresh()).ok, false);
  assert.equal(session.getState().phase, 'disconnected');
});

test('malformed, optimistic and unrelated results cannot be displayed as authoritative', () => {
  assert.throws(() => assertServerSnapshot({ snapshot: snap('active', 1) }), /Invalid authoritative/);
  assert.throws(() => assertServerSnapshot({ snapshot: snap('ready_to_complete', 0) }), /Invalid authoritative/);
  assert.throws(() => assertServerSnapshot({ snapshot: { quest: { status: 'completed' } } }), /Invalid authoritative/);
  assert.throws(() => assertServerSnapshot({ notice: 'You won!' }), /Invalid authoritative/);
  const valid = assertServerSnapshot({ snapshot: snap('completed', 1, 2) });
  assert.equal(valid.testWallet, 2);
});
