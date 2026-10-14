/** Browser-only Game 5 quest sandbox.
 * Does not call the authenticated quest service or grant real game rewards.
 */
import { DEV_WORLD, requireNearby } from '../gameplay/world.mjs';

export const GAME5_BROWSER_DEMO_KEY = 'atomxe.game5.browser-quest.v1';

export function createBrowserQuest() {
  return { status: 'not_started', current: 0, cardCollected: false, testTokens: 0 };
}

export function restoreBrowserQuest(candidate) {
  const initial = createBrowserQuest();
  if (!candidate || typeof candidate !== 'object') return initial;
  const status = candidate.status;
  if (!['not_started', 'active', 'ready_to_complete', 'completed'].includes(status)) return initial;
  if (status === 'not_started') return initial;
  if (status === 'active') return { ...initial, status: 'active' };
  if (status === 'ready_to_complete') return { status, current: 1, cardCollected: true, testTokens: 0 };
  return { status: 'completed', current: 1, cardCollected: true, testTokens: 1 };
}

export function browserQuestSnapshot(state) {
  const clean = restoreBrowserQuest(state);
  return {
    quest: { status: clean.status, objective: { current: clean.current, required: 1 } },
    cardCollected: clean.cardCollected,
    testWallet: clean.testTokens,
  };
}

export function performBrowserQuestAction(state, action, position) {
  const current = restoreBrowserQuest(state);
  if (action === 'accept') {
    requireNearby(position, DEV_WORLD.npc);
    if (current.status !== 'not_started') return { state: current, notice: 'Quest already accepted.' };
    return { state: { ...current, status: 'active' }, notice: 'Quest accepted: Retrieve the Lost Card.' };
  }
  if (action === 'pickup') {
    requireNearby(position, DEV_WORLD.card);
    if (current.status === 'not_started') throw new Error('Speak with Elder Shen to accept the quest first.');
    if (current.cardCollected) return { state: current, notice: 'You already recovered this card.' };
    if (current.status !== 'active') throw new Error('The Lost Card is not available.');
    return { state: { ...current, status: 'ready_to_complete', cardCollected: true, current: 1 }, notice: 'Lost Card recovered! Return to Elder Shen.' };
  }
  if (action === 'complete') {
    requireNearby(position, DEV_WORLD.npc);
    if (current.status === 'completed') return { state: current, notice: 'Quest already completed.' };
    if (current.status !== 'ready_to_complete') throw new Error('Recover the Lost Card before completing the quest.');
    return { state: { ...current, status: 'completed', testTokens: 1 }, notice: 'Quest complete — one browser-demo test token.' };
  }
  throw new Error('Unknown browser demo action.');
}
