type Row = Record<string, any>;

export type TradeOfferReservationCommit = {
  session: Row;
  user_id: string;
  card_ids: string[];
  snapshots: Row[];
  is_initiator: boolean;
};

function offerPatch(input: TradeOfferReservationCommit) {
  return input.is_initiator
    ? {
        initiator_offer_card_ids: input.card_ids,
        initiator_offer_snapshot: input.snapshots,
        initiator_confirmed: false,
        recipient_confirmed: false,
      }
    : {
        recipient_offer_card_ids: input.card_ids,
        recipient_offer_snapshot: input.snapshots,
        initiator_confirmed: false,
        recipient_confirmed: false,
      };
}

function restoreSessionPatch(input: TradeOfferReservationCommit) {
  const session = input.session;
  return input.is_initiator
    ? {
        initiator_offer_card_ids: session.initiator_offer_card_ids || [],
        initiator_offer_snapshot: session.initiator_offer_snapshot || [],
        initiator_confirmed: Boolean(session.initiator_confirmed),
        recipient_confirmed: Boolean(session.recipient_confirmed),
      }
    : {
        recipient_offer_card_ids: session.recipient_offer_card_ids || [],
        recipient_offer_snapshot: session.recipient_offer_snapshot || [],
        initiator_confirmed: Boolean(session.initiator_confirmed),
        recipient_confirmed: Boolean(session.recipient_confirmed),
      };
}

export async function commitTradeOfferReservationSet(svc: any, input: TradeOfferReservationCommit) {
  const sessionId = String(input.session?.id || '');
  const userId = String(input.user_id || '');
  if (!sessionId || !userId) throw new Error('Trade offer reservation is missing its session or owner');

  const selectedIds = [...new Set((input.card_ids || []).map(String).filter(Boolean))];
  const reserved = await svc.UserCard.filter({
    user_id: userId,
    last_trade_id: sessionId,
    trade_status: 'locked_in_trade',
  }, '-updated_date', 100).catch(() => []);
  const touchedIds = [...new Set([...selectedIds, ...(reserved || []).map((card: Row) => String(card.id))])];
  const before = new Map<string, Row>();

  for (const id of touchedIds) {
    const card = await svc.UserCard.get(id).catch(() => null);
    if (!card || String(card.user_id || '') !== userId) {
      throw new Error('Trade card ownership changed before offer reservations were committed');
    }
    before.set(id, {
      trade_status: card.trade_status || 'available',
      last_trade_id: card.last_trade_id || '',
    });
  }

  try {
    for (const id of touchedIds) {
      const card = await svc.UserCard.get(id).catch(() => null);
      if (!card || String(card.user_id || '') !== userId) {
        throw new Error('Trade card ownership changed while offer reservations were being committed');
      }
      const shouldReserve = selectedIds.includes(id);
      const nextStatus = shouldReserve ? 'locked_in_trade' : 'available';
      const nextTradeId = shouldReserve ? sessionId : '';
      if (String(card.trade_status || 'available') !== nextStatus || String(card.last_trade_id || '') !== nextTradeId) {
        await svc.UserCard.update(id, { trade_status: nextStatus, last_trade_id: nextTradeId });
      }
    }

    return await svc.TradeSession.update(sessionId, offerPatch({ ...input, card_ids: selectedIds }));
  } catch (error) {
    for (const [id, state] of before.entries()) {
      const live = await svc.UserCard.get(id).catch(() => null);
      if (live && String(live.user_id || '') === userId) {
        await svc.UserCard.update(id, {
          trade_status: state.trade_status,
          last_trade_id: state.last_trade_id,
        }).catch(() => null);
      }
    }
    await svc.TradeSession.update(sessionId, restoreSessionPatch(input)).catch(() => null);
    throw error;
  }
}
