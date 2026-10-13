/**
 * Game 5 / G5-0001 — server-side quest rules.
 *
 * IMPORTANT: Expose this service only behind authenticated server endpoints.
 * The supplied actor must come from server auth, never from a client payload.
 * verifyCollection must consult authoritative inventory/collection records.
 * repository.transact must commit quest state, reward ledger and wallet atomically.
 */

export const LOST_CARD_QUEST = Object.freeze({
  id: 'G5-0001',
  name: 'Retrieve the Lost Card',
  targetCardId: 'game5:lost-card',
  objectiveId: 'collect-lost-card',
  requiredCount: 1,
  reward: Object.freeze({ currency: 'game5_quest_token', amount: 1 }),
  outputContract: 'game5.quest.item_collected.v1',
});

const QUEST_ID = LOST_CARD_QUEST.id;
const REWARD_KEY = `quest:${QUEST_ID}:completion`;
const EVENT_KEY = `quest:${QUEST_ID}:item-collected`;

function requireActor(actor) {
  if (actor?.authenticated !== true || typeof actor.playerId !== 'string' || !actor.playerId.trim()) {
    throw new Error('Authenticated server player context required');
  }
  return actor.playerId;
}

function validateCollectionEvent(event) {
  if (event?.type !== 'game5.inventory.card_collected.v1' ||
      typeof event.eventId !== 'string' || !event.eventId.trim() ||
      typeof event.cardId !== 'string' || !event.cardId.trim() ||
      typeof event.cardInstanceId !== 'string' || !event.cardInstanceId.trim()) {
    throw new TypeError('A valid server inventory collection event is required');
  }
}

function initialState() {
  return {
    questId: QUEST_ID,
    status: 'not_started',
    objective: {
      id: LOST_CARD_QUEST.objectiveId,
      cardId: LOST_CARD_QUEST.targetCardId,
      current: 0,
      required: LOST_CARD_QUEST.requiredCount,
    },
    rewarded: false,
  };
}

function copyState(state) {
  return structuredClone(state ?? initialState());
}

function acceptState() {
  const state = initialState();
  state.status = 'active';
  return state;
}

function requireRepository(repository) {
  if (typeof repository?.read !== 'function' || typeof repository?.transact !== 'function') {
    throw new TypeError('Transactional quest repository with read and transact is required');
  }
}

/**
 * Inventory verification must be server-authoritative and check playerId,
 * cardId, cardInstanceId and eventId against a trusted collection record.
 * The verifier is intentionally injected; this module never reads Luna/Game 2/3 data.
 */
export function createLostCardQuestService({ repository, verifyCollection } = {}) {
  requireRepository(repository);
  if (typeof verifyCollection !== 'function') {
    throw new TypeError('Server-authoritative verifyCollection callback is required');
  }

  return Object.freeze({
    async getQuestState({ actor }) {
      const playerId = requireActor(actor);
      const player = await repository.read(playerId);
      return copyState(player.quests?.[QUEST_ID]);
    },

    async acceptQuest({ actor }) {
      const playerId = requireActor(actor);
      return repository.transact(playerId, (player) => {
        const existing = player.quests[QUEST_ID];
        if (existing) return { accepted: false, state: copyState(existing) };
        const state = acceptState();
        player.quests[QUEST_ID] = state;
        return { accepted: true, state: copyState(state) };
      });
    },

    async recordItemCollection({ actor, event }) {
      const playerId = requireActor(actor);
      validateCollectionEvent(event);
      return repository.transact(playerId, async (player) => {
        const state = player.quests[QUEST_ID];
        if (!state || state.status !== 'active') {
          return { progressed: false, state: copyState(state), emittedEvent: null };
        }
        if (event.cardId !== LOST_CARD_QUEST.targetCardId) {
          return { progressed: false, state: copyState(state), emittedEvent: null };
        }
        const verified = await verifyCollection({ playerId, event });
        if (verified !== true) {
          return { progressed: false, state: copyState(state), emittedEvent: null };
        }

        state.objective.current = LOST_CARD_QUEST.requiredCount;
        state.status = 'ready_to_complete';
        const output = {
          schema_version: LOST_CARD_QUEST.outputContract,
          eventId: `${QUEST_ID}:${playerId}:item-collected`,
          questId: QUEST_ID,
          playerId,
          sourceEventId: event.eventId,
          objectiveId: LOST_CARD_QUEST.objectiveId,
          cardId: LOST_CARD_QUEST.targetCardId,
          progress: LOST_CARD_QUEST.requiredCount,
        };
        // Transactional outbox: downstream consumers can deliver this event once.
        player.outbox[EVENT_KEY] = output;
        return { progressed: true, state: copyState(state), emittedEvent: structuredClone(output) };
      });
    },

    async completeQuest({ actor }) {
      const playerId = requireActor(actor);
      return repository.transact(playerId, (player) => {
        const state = player.quests[QUEST_ID];
        if (!state || state.status !== 'ready_to_complete' ||
            state.objective.current !== LOST_CARD_QUEST.requiredCount) {
          return { rewarded: false, state: copyState(state) };
        }

        // Both the wallet mutation and idempotency ledger are stored in the
        // SAME atomic transaction as the completed quest state.
        const alreadyGranted = Object.hasOwn(player.rewardLedger, REWARD_KEY);
        if (!alreadyGranted) {
          const { currency, amount } = LOST_CARD_QUEST.reward;
          player.wallet[currency] = (player.wallet[currency] ?? 0) + amount;
          player.rewardLedger[REWARD_KEY] = { questId: QUEST_ID, currency, amount };
        }
        state.status = 'completed';
        state.rewarded = true;
        return { rewarded: !alreadyGranted, state: copyState(state) };
      });
    },
  });
}
