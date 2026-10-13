import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBrowserQuest,
  performBrowserQuestAction,
  restoreBrowserQuest,
  browserQuestSnapshot,
} from '../../../src/game5/client/browserQuestDemo.mjs';
import { DEV_WORLD } from '../../../src/game5/gameplay/world.mjs';

const npc = { x: DEV_WORLD.npc.x, z: DEV_WORLD.npc.z };
const card = { x: DEV_WORLD.card.x, z: DEV_WORLD.card.z };

test('browser demo accepts, collects and completes a Lost Card quest', () => {
  let state = createBrowserQuest();
  assert.equal(state.status, 'not_started');
  state = performBrowserQuestAction(state, 'accept', npc).state;
  assert.equal(state.status, 'active');
  state = performBrowserQuestAction(state, 'pickup', card).state;
  assert.equal(state.current, 1);
  assert.equal(state.status, 'ready_to_complete');
  state = performBrowserQuestAction(state, 'complete', npc).state;
  assert.equal(state.status, 'completed');
  assert.equal(state.testTokens, 1);
  assert.equal(browserQuestSnapshot(state).quest.objective.current, 1);
});

test('browser demo refuses premature pickup, remote interactions, and double awards', () => {
  const start = createBrowserQuest();
  assert.throws(() => performBrowserQuestAction(start, 'pickup', card), /Speak with Elder Shen/);
  assert.throws(() => performBrowserQuestAction(start, 'accept', card), /closer/i);
  let state = performBrowserQuestAction(start, 'accept', npc).state;
  assert.throws(() => performBrowserQuestAction(state, 'complete', npc), /Recover the Lost Card/);
  state = performBrowserQuestAction(state, 'pickup', card).state;
  state = performBrowserQuestAction(state, 'pickup', card).state;
  state = performBrowserQuestAction(state, 'complete', npc).state;
  state = performBrowserQuestAction(state, 'complete', npc).state;
  assert.equal(state.testTokens, 1);
});

test('browser demo restore normalizes malformed or forged snapshots', () => {
  assert.deepEqual(restoreBrowserQuest({ status: 'completed', testTokens: 5000, current: 100 }), {
    status: 'completed', testTokens: 1, current: 1, cardCollected: true,
  });
  assert.deepEqual(restoreBrowserQuest({ status: '__proto__' }), createBrowserQuest());
});
