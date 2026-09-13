import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type AnyObj = Record<string, any>;

const ACTIVE = ['accepted', 'pending'];

function cardSnapshot(card: AnyObj, progression?: AnyObj | null) {
  return {
    id: card.id,
    trading_card_id: card.trading_card_id || '',
    card_name: card.card_name || 'Card',
    card_type: card.card_type || 'Achievement',
    card_rarity: card.card_rarity || 'Common',
    card_image: card.card_image || '',
    game_name: card.game_name || 'Unknown Game',
    game_id: card.game_id || '',
    genre: card.genre || '',
    acquisition_method: card.acquisition_method || 'unlocked',
    level: Number(progression?.level || 1),
    stars: Number(progression?.stars || 1),
    ascension: Number(progression?.ascension || 0),
    power_score: Number(progression?.power_score || 0),
  };
}

async function getSessionForPair(base44: any, a: string, b: string) {
  for (const status of ACTIVE) {
    const rows = await base44.asServiceRole.entities.TradeSession.filter({ status }, '-created_date', 100);
    const found = (rows || []).find((s: AnyObj) =>
      (s.initiator_id === a && s.recipient_id === b) ||
      (s.initiator_id === b && s.recipient_id === a)
    );
    if (found) return found;
  }
  return null;
}

async function requireFriend(base44: any, userId: string, partnerId: string) {
  const mine = await base44.asServiceRole.entities.Friend.filter({ user_id: userId, friend_id: partnerId }, '-created_date', 1);
  if (mine?.length) return;
  const mirrored = await base44.asServiceRole.entities.Friend.filter({ user_id: partnerId, friend_id: userId }, '-created_date', 1);
  if (mirrored?.length) return;
  const social = await base44.asServiceRole.entities.SocialFriendship.filter({}, '-created_date', 500).catch(() => []);
  const linked = (social || []).some((row: AnyObj) =>
    (row.user_a_id === userId && row.user_b_id === partnerId) ||
    (row.user_a_id === partnerId && row.user_b_id === userId)
  );
  if (!linked) throw new Error('Card trading is available between friends only');
}

async function getTradeableCards(base44: any, userId: string, sessionId?: string) {
  const rows = await base44.asServiceRole.entities.UserCard.filter({ user_id: userId }, '-created_date', 500);
  const visible = (rows || []).filter((card: AnyObj) =>
    !card.is_equipped && (card.trade_status !== 'locked_in_trade' || card.last_trade_id === sessionId)
  );
  const result: AnyObj[] = [];
  for (const card of visible) {
    const progression = (await base44.asServiceRole.entities.CardProgression.filter({ user_card_id: card.id }, '-created_date', 1))[0] || null;
    result.push(cardSnapshot(card, progression));
  }
  return result;
}

async function unlockSessionCards(base44: any, session: AnyObj) {
  const ids = [...(session.initiator_offer_card_ids || []), ...(session.recipient_offer_card_ids || [])];
  for (const id of ids) {
    const card = await base44.asServiceRole.entities.UserCard.get(id).catch(() => null);
    if (card?.last_trade_id === session.id) {
      await base44.asServiceRole.entities.UserCard.update(id, { trade_status: 'available' });
    }
  }
}

async function finalize(base44: any, session: AnyObj) {
  if (session.status !== 'accepted' || !session.initiator_confirmed || !session.recipient_confirmed) {
    throw new Error('Both players must confirm before the trade can complete');
  }

  const transfers = [
    { ids: session.initiator_offer_card_ids || [], from: session.initiator_id, to: session.recipient_id },
    { ids: session.recipient_offer_card_ids || [], from: session.recipient_id, to: session.initiator_id },
  ];

  for (const group of transfers) {
    for (const id of group.ids) {
      const card = await base44.asServiceRole.entities.UserCard.get(id).catch(() => null);
      if (!card || card.user_id !== group.from) throw new Error('A card in this trade is no longer owned by the offering player');
      if (card.is_equipped) throw new Error(`${card.card_name || 'A card'} is equipped and cannot be traded`);
      if (card.trade_status !== 'locked_in_trade' || card.last_trade_id !== session.id) {
        throw new Error(`${card.card_name || 'A card'} is not reserved for this trade`);
      }
    }
  }

  for (const group of transfers) {
    for (const id of group.ids) {
      const card = await base44.asServiceRole.entities.UserCard.get(id);
      await base44.asServiceRole.entities.UserCard.update(id, {
        user_id: group.to,
        acquisition_method: 'traded',
        trade_status: 'available',
        last_trade_id: session.id,
      });
      const progressions = await base44.asServiceRole.entities.CardProgression.filter({ user_card_id: id }, '-created_date', 10);
      for (const progression of progressions || []) {
        await base44.asServiceRole.entities.CardProgression.update(progression.id, {
          user_id: group.to,
          last_action: 'friend_trade_transfer',
          last_action_at: new Date().toISOString(),
          revision: Number(progression.revision || 0) + 1,
        });
      }
    }
  }

  return await base44.asServiceRole.entities.TradeSession.update(session.id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
}

async function responseState(base44: any, user: AnyObj, partnerId: string, session?: AnyObj | null) {
  const partner = await base44.asServiceRole.entities.User.get(partnerId).catch(() => null);
  const active = session ?? await getSessionForPair(base44, user.id, partnerId);
  const cards = await getTradeableCards(base44, user.id, active?.id);
  return {
    userId: user.id,
    partner: partner ? { id: partner.id, name: partner.username || partner.full_name || partner.name || 'Friend', avatar: partner.avatar_url || '' } : { id: partnerId, name: 'Friend', avatar: '' },
    session: active,
    ownedCards: cards,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await base44.auth.me();
    if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await base44.asServiceRole.entities.User.get(auth.id);
    const body = await req.json();
    const action = body?.action || 'getState';
    const payload = body?.payload || {};
    const partnerId = String(payload.partnerId || '');
    if (!partnerId || partnerId === user.id) throw new Error('A valid friend is required');
    await requireFriend(base44, user.id, partnerId);

    let session = await getSessionForPair(base44, user.id, partnerId);

    if (action === 'start') {
      if (!session) {
        session = await base44.asServiceRole.entities.TradeSession.create({
          initiator_id: user.id,
          recipient_id: partnerId,
          status: 'pending',
          initiator_offer_card_ids: [], recipient_offer_card_ids: [],
          initiator_offer_snapshot: [], recipient_offer_snapshot: [],
          initiator_confirmed: false, recipient_confirmed: false,
        });
        await base44.asServiceRole.entities.SocialRequest.create({
          kind: 'trade', sender_id: user.id, sender_name: user.username || user.full_name || user.name || 'Player',
          receiver_id: partnerId, status: 'pending', trade_id: session.id,
        }).catch(() => null);
      }
    } else if (action === 'accept') {
      if (!session || session.status !== 'pending' || session.recipient_id !== user.id) throw new Error('No pending trade request to accept');
      session = await base44.asServiceRole.entities.TradeSession.update(session.id, { status: 'accepted', initiator_confirmed: false, recipient_confirmed: false });
      const requests = await base44.asServiceRole.entities.SocialRequest.filter({ kind: 'trade', trade_id: session.id }, '-created_date', 20).catch(() => []);
      for (const r of requests || []) await base44.asServiceRole.entities.SocialRequest.update(r.id, { status: 'accepted' }).catch(() => null);
    } else if (action === 'syncOffer') {
      if (!session || session.status !== 'accepted') throw new Error('Trade must be accepted before adding cards');
      const cardIds = [...new Set((payload.cardIds || []).map(String))].slice(0, 8);
      const isInitiator = session.initiator_id === user.id;
      const oldIds = isInitiator ? (session.initiator_offer_card_ids || []) : (session.recipient_offer_card_ids || []);

      for (const id of oldIds.filter((id: string) => !cardIds.includes(id))) {
        const oldCard = await base44.asServiceRole.entities.UserCard.get(id).catch(() => null);
        if (oldCard?.user_id === user.id && oldCard.last_trade_id === session.id) {
          await base44.asServiceRole.entities.UserCard.update(id, { trade_status: 'available' });
        }
      }

      const snapshots: AnyObj[] = [];
      for (const id of cardIds) {
        const card = await base44.asServiceRole.entities.UserCard.get(id).catch(() => null);
        if (!card || card.user_id !== user.id) throw new Error('You can only offer cards you own');
        if (card.is_equipped) throw new Error(`${card.card_name || 'That card'} is equipped`);
        if (card.trade_status === 'locked_in_trade' && card.last_trade_id !== session.id) throw new Error(`${card.card_name || 'That card'} is already reserved elsewhere`);
        const listing = (await base44.asServiceRole.entities.CardTrade.filter({ card_id: id, status: 'active' }, '-created_date', 1))[0];
        if (listing) throw new Error(`${card.card_name || 'That card'} is currently listed in the Trading Post`);
        await base44.asServiceRole.entities.UserCard.update(id, { trade_status: 'locked_in_trade', last_trade_id: session.id });
        const progression = (await base44.asServiceRole.entities.CardProgression.filter({ user_card_id: id }, '-created_date', 1))[0] || null;
        snapshots.push(cardSnapshot(card, progression));
      }

      const patch = isInitiator
        ? { initiator_offer_card_ids: cardIds, initiator_offer_snapshot: snapshots, initiator_confirmed: false, recipient_confirmed: false }
        : { recipient_offer_card_ids: cardIds, recipient_offer_snapshot: snapshots, initiator_confirmed: false, recipient_confirmed: false };
      session = await base44.asServiceRole.entities.TradeSession.update(session.id, patch);
    } else if (action === 'confirm') {
      if (!session || session.status !== 'accepted') throw new Error('Trade is not active');
      const isInitiator = session.initiator_id === user.id;
      const myIds = isInitiator ? (session.initiator_offer_card_ids || []) : (session.recipient_offer_card_ids || []);
      if (!myIds.length) throw new Error('Add at least one card before confirming');
      session = await base44.asServiceRole.entities.TradeSession.update(session.id, isInitiator ? { initiator_confirmed: true } : { recipient_confirmed: true });
      if (session.initiator_confirmed && session.recipient_confirmed) session = await finalize(base44, session);
    } else if (action === 'unconfirm') {
      if (!session || session.status !== 'accepted') throw new Error('Trade is not active');
      session = await base44.asServiceRole.entities.TradeSession.update(session.id, session.initiator_id === user.id ? { initiator_confirmed: false } : { recipient_confirmed: false });
    } else if (action === 'decline') {
      if (!session || session.status !== 'pending' || session.recipient_id !== user.id) throw new Error('No pending trade request to decline');
      session = await base44.asServiceRole.entities.TradeSession.update(session.id, { status: 'declined', initiator_confirmed: false, recipient_confirmed: false });
      const requests = await base44.asServiceRole.entities.SocialRequest.filter({ kind: 'trade', trade_id: session.id }, '-created_date', 20).catch(() => []);
      for (const r of requests || []) await base44.asServiceRole.entities.SocialRequest.update(r.id, { status: 'declined' }).catch(() => null);
    } else if (action === 'cancel') {
      if (session && ACTIVE.includes(session.status)) {
        await unlockSessionCards(base44, session);
        session = await base44.asServiceRole.entities.TradeSession.update(session.id, { status: 'cancelled', initiator_confirmed: false, recipient_confirmed: false });
        const requests = await base44.asServiceRole.entities.SocialRequest.filter({ kind: 'trade', trade_id: session.id }, '-created_date', 20).catch(() => []);
        for (const r of requests || []) await base44.asServiceRole.entities.SocialRequest.update(r.id, { status: 'cancelled' }).catch(() => null);
      }
    } else if (action !== 'getState') {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const current = session?.status === 'completed' || session?.status === 'cancelled' ? session : await getSessionForPair(base44, user.id, partnerId);
    return Response.json({ success: true, ...(await responseState(base44, user, partnerId, current)) });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
});