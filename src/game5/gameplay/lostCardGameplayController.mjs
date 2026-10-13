/**
 * DEVELOPMENT-ONLY Game 5 gameplay-to-quest bridge. Never import in a browser.
 * Positions are browser-reported and therefore simulated, NOT authoritative.
 * Collection receipts are locally generated mock inventory records, NOT production inventory.
 */
import { createLostCardQuestService, LOST_CARD_QUEST } from '../quests/lostCardQuest.mjs';
import { DEV_WORLD, GameplayInputError, requireNearby } from './world.mjs';
const DEV_PLAYER = 'game5-dev-player';
const actor = Object.freeze({ authenticated: true, playerId: DEV_PLAYER }); // injected by LOCAL DEV server only
export function createLostCardGameplayController({ repository, world = DEV_WORLD } = {}) {
  if (!repository?.transact || !repository?.read) throw new TypeError('Development repository required');
  const service = createLostCardQuestService({
    repository,
    verifyCollection: async ({ playerId, event }) => {
      if (playerId !== DEV_PLAYER) return false;
      const record = await repository.read(playerId);
      return Object.values(record.devClaims || {}).some((claim) =>
        claim.eventId === event.eventId && claim.cardId === event.cardId &&
        claim.cardInstanceId === event.cardInstanceId && claim.playerId === playerId
      );
    },
  });
  async function snapshot() {
    const [quest, record] = await Promise.all([service.getQuestState({ actor }), repository.read(DEV_PLAYER)]);
    return { quest, testWallet: record.wallet.game5_quest_token ?? 0,
      cardCollected: Boolean(record.devClaims?.[world.card.id]),
      developmentOnly: true };
  }
  async function accept({ position, npcId }) {
    if (npcId !== world.npc.id) throw new GameplayInputError('Unknown quest NPC');
    requireNearby(position, world.npc, world);
    const result = await service.acceptQuest({ actor });
    return { snapshot: await snapshot(), notice: result.accepted ? 'Quest accepted. Find the Lost Card.' : 'Quest already accepted.' };
  }
  async function pickup({ position, pickupId }) {
    if (pickupId !== world.card.id) throw new GameplayInputError('Unknown collectible');
    requireNearby(position, world.card, world);
    const existing = await snapshot();
    if (existing.quest.status !== 'active') {
      if (existing.quest.status === 'ready_to_complete' || existing.quest.status === 'completed') {
        return { snapshot: existing, notice: 'Lost Card already collected.' };
      }
      throw new GameplayInputError('Accept the quest before collecting the Lost Card', 409);
    }
    // Simulated inventory receipt created on the local server, never supplied by browser.
    const event = await repository.transact(DEV_PLAYER, (record) => {
      const key = world.card.id;
      if (!record.devClaims[key]) {
        record.devClaims[key] = {
          type: 'game5.inventory.card_collected.v1', eventId: `game5-dev-collection:${key}`,
          cardId: LOST_CARD_QUEST.targetCardId, cardInstanceId: world.card.cardInstanceId,
          playerId: DEV_PLAYER,
        };
      }
      return structuredClone(record.devClaims[key]);
    });
    const result = await service.recordItemCollection({ actor, event });
    return { snapshot: await snapshot(), notice: result.progressed ? 'Lost Card recovered! Return to Elder Shen.' : 'Lost Card already collected.' };
  }
  async function complete({ position, npcId }) {
    if (npcId !== world.npc.id) throw new GameplayInputError('Unknown quest NPC');
    requireNearby(position, world.npc, world);
    const before = await snapshot();
    if (before.quest.status === 'completed') return { snapshot: before, notice: 'Quest already completed. Reward previously recorded.' };
    if (before.quest.status !== 'ready_to_complete') throw new GameplayInputError('Collect the Lost Card before turning in', 409);
    const result = await service.completeQuest({ actor });
    return { snapshot: await snapshot(), notice: result.rewarded ? 'Quest Complete! +1 DEVELOPMENT quest token.' : 'Quest already completed.' };
  }
  return Object.freeze({ snapshot, accept, pickup, complete });
}
