import { acquireCardMutationLocks, releaseCardMutationLocks } from './cardMutationLock.ts';
import { ensureCardPassport, recordOwnershipTransfer } from './cardProvenance.ts';
import { rewardError } from './rewardJournal.ts';
import {
  acquireTradeSessionMutationLock,
  assertTradeSessionMutationLock,
  releaseTradeSessionMutationLock,
} from './tradeSessionMutationLock.ts';

type Row = Record<string, any>;

const now = () => new Date().toISOString();

export type CardTradeFinalizeOptions = {
  method?: string;
  progression_action?: string;
  session_lock_token?: string;
};

export async function finalizeCardTradeSession(
  svc: any,
  sessionInput: Row,
  options: CardTradeFinalizeOptions = {},
) {
  const sessionId = String(sessionInput?.id || '');
  if (!sessionId) throw rewardError('Trade session is missing its ID', 409);
  const method = String(options.method || 'player_trade');
  const progressionAction = String(options.progression_action || 'trade_transfer');

  let ownedSessionLock: any = null;
  let sessionLock: any = null;
  if (options.session_lock_token) {
    sessionLock = await assertTradeSessionMutationLock(svc, sessionId, options.session_lock_token, `trade_finalize:${sessionId}`);
  } else {
    ownedSessionLock = await acquireTradeSessionMutationLock(svc, sessionId, `trade_finalize:${sessionId}`);
    sessionLock = ownedSessionLock;
  }

  let cardLocks: any[] = [];
  try {
    let session = await svc.TradeSession.get(sessionId).catch(() => null);
    if (!session) throw rewardError('Trade not found', 404);
    if (session.status === 'completed') return session;
    if (session.status !== 'accepted' || !session.initiator_confirmed || !session.recipient_confirmed) {
      throw rewardError('Both players must confirm before the trade can complete', 409);
    }

    const transfers = [
      { ids: session.initiator_offer_card_ids || [], from: String(session.initiator_id), to: String(session.recipient_id) },
      { ids: session.recipient_offer_card_ids || [], from: String(session.recipient_id), to: String(session.initiator_id) },
    ];
    const seen = new Set<string>();
    const lockTargets: Array<{ id: string; owner_id?: string | null }> = [];
    for (const group of transfers) {
      for (const rawId of group.ids) {
        const id = String(rawId || '');
        if (!id) throw rewardError('Trade contains an empty card identity', 409);
        if (seen.has(id)) throw rewardError('The same card cannot appear twice in one trade', 409);
        seen.add(id);
        // Owner is intentionally omitted. A retry after a partial transfer must
        // be able to re-lock a card that already moved to the receiving player.
        lockTargets.push({ id, owner_id: null });
      }
    }
    if (!lockTargets.length) throw rewardError('Trade has no cards to finalize', 409);

    cardLocks = await acquireCardMutationLocks(svc, lockTargets, `trade:${sessionId}`);
    const lockFor = (id: string) => cardLocks.find((lock) => lock.card_id === String(id));

    await assertTradeSessionMutationLock(svc, sessionId, sessionLock.token, `trade_finalize:${sessionId}`);
    session = await svc.TradeSession.get(sessionId);
    if (session.status === 'completed') return session;
    if (session.status !== 'accepted' || !session.initiator_confirmed || !session.recipient_confirmed) {
      throw rewardError('Trade changed before finalization completed', 409);
    }

    const liveTransfers = [
      { ids: session.initiator_offer_card_ids || [], from: String(session.initiator_id), to: String(session.recipient_id) },
      { ids: session.recipient_offer_card_ids || [], from: String(session.recipient_id), to: String(session.initiator_id) },
    ];
    const liveIds = liveTransfers.flatMap((group) => group.ids.map(String)).sort();
    const lockedIds = [...seen].sort();
    if (JSON.stringify(liveIds) !== JSON.stringify(lockedIds)) {
      throw rewardError('Trade offer changed while finalization was starting', 409);
    }

    for (const group of liveTransfers) {
      for (const rawId of group.ids) {
        const id = String(rawId);
        const lock = lockFor(id);
        if (!lock) throw rewardError('Trade card lease is unavailable', 409);
        let card = await svc.UserCard.get(id).catch(() => null);
        if (!card) throw rewardError('A card in this trade no longer exists', 409);
        const owner = String(card.user_id || '');
        const alreadyTransferred = owner === group.to;
        if (owner !== group.from && !alreadyTransferred) {
          throw rewardError('Card ownership changed before finalization', 409);
        }
        if (card.is_equipped || (card.equipped_to && card.equipped_to !== 'none')) {
          throw rewardError(`${card.card_name || 'A card'} is equipped and cannot be traded`, 409);
        }
        if (!alreadyTransferred && (card.trade_status !== 'locked_in_trade' || String(card.last_trade_id || '') !== sessionId)) {
          throw rewardError(`${card.card_name || 'A card'} is not reserved for this trade`, 409);
        }
        if (alreadyTransferred && String(card.last_trade_id || '') !== sessionId) {
          throw rewardError('A transferred card belongs to a different trade session', 409);
        }

        await ensureCardPassport(svc, alreadyTransferred ? { ...card, user_id: group.from } : card, {
          lock_token: lock.token,
          original_owner_id: group.from,
        });

        if (!alreadyTransferred) {
          card = await svc.UserCard.update(id, {
            user_id: group.to,
            acquisition_method: 'traded',
            acquired_at: now(),
            trade_status: 'available',
            last_trade_id: sessionId,
          });
        }

        const progressions = await svc.CardProgression.filter({ user_card_id: id }, '-updated_date', 10);
        if ((progressions || []).length > 1) {
          throw rewardError('Multiple progression records exist for a traded card and require reconciliation', 409);
        }
        for (const progression of progressions || []) {
          if (String(progression.user_id || '') !== group.to) {
            await svc.CardProgression.update(progression.id, {
              user_id: group.to,
              last_action: progressionAction,
              last_action_at: now(),
              revision: Number(progression.revision || 0) + 1,
            });
          }
        }

        await recordOwnershipTransfer(
          svc,
          { ...card, user_id: group.from },
          group.from,
          group.to,
          method,
          sessionId,
          {
            lock_token: lock.token,
            event_key: `trade:${sessionId}:${id}`,
          },
        );
      }
    }

    await assertTradeSessionMutationLock(svc, sessionId, sessionLock.token, `trade_finalize:${sessionId}`);
    session = await svc.TradeSession.get(sessionId);
    if (session.status === 'completed') return session;
    return svc.TradeSession.update(sessionId, {
      status: 'completed',
      completed_at: now(),
    });
  } finally {
    if (cardLocks.length) await releaseCardMutationLocks(svc, cardLocks);
    if (ownedSessionLock) await releaseTradeSessionMutationLock(svc, ownedSessionLock);
  }
}
