import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { cardMasteryState, normalizeProgression } from '../../shared/cardSystem.ts';
import { ensureCardPassport } from '../../shared/cardProvenance.ts';
import { finalizeCardTradeSession } from '../../shared/cardTradeFinalizer.ts';
import { acquireCardMutationLocks, releaseCardMutationLocks } from '../../shared/cardMutationLock.ts';
import {
  acquireTradeSessionMutationLock,
  releaseTradeSessionMutationLock,
} from '../../shared/tradeSessionMutationLock.ts';
import {
  acquireCardTradePairLock,
  releaseCardTradePairLock,
} from '../../shared/cardTradePairLock.ts';

type AnyObj = Record<string, any>;
const ACTIVE = ['accepted', 'pending'];

async function cardSnapshot(base44: any, card: AnyObj, progression?: AnyObj | null, passportInput?: AnyObj | null) {
  const p = normalizeProgression(progression);
  const passport = passportInput || await ensureCardPassport(base44.asServiceRole.entities, card);
  if (String(card.passport_id || '') !== String(passport.passport_id)) {
    await base44.asServiceRole.entities.UserCard.update(card.id, { passport_id: passport.passport_id });
  }
  return {
    id: card.id,
    user_card_id: card.id,
    trading_card_id: card.trading_card_id || '',
    passport_id: passport.passport_id,
    card_name: card.card_name || 'Card',
    card_type: card.card_type || 'collectible',
    card_rarity: card.card_rarity || 'Rare',
    playable_tier: card.playable_tier || card.card_rarity || 'Rare',
    card_image: card.card_image || '',
    game_name: card.game_name || 'Unknown Game',
    game_id: card.game_id || '',
    genre: card.genre || '',
    acquisition_method: card.acquisition_method || 'unlocked',
    acquired_at: card.acquired_at || card.unlocked_date || '',
    enhancement_percent: p.enhancement_percent,
    ascension: p.ascension,
    stack_level: p.stack_level,
    power_score: Number(progression?.power_score || 0),
    mastery_visual: p.mastery_visual,
    mastery: cardMasteryState(p),
    provenance_event_count: Number(passport.event_count || 0),
    provenance_head_hash: passport.head_hash || '',
    external_ledger_status: passport.external_ledger_status || 'not_anchored',
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
    !card.is_equipped
    && (!card.equipped_to || card.equipped_to === 'none')
    && (card.trade_status !== 'locked_in_trade' || card.last_trade_id === sessionId)
  );
  const result: AnyObj[] = [];
  for (const card of visible) {
    const progression = (await base44.asServiceRole.entities.CardProgression.filter({ user_card_id: card.id }, '-updated_date', 1))[0] || null;
    result.push(await cardSnapshot(base44, card, progression));
  }
  return result;
}

async function unlockSessionCards(base44: any, session: AnyObj) {
  const svc = base44.asServiceRole.entities;
  const reserved = await svc.UserCard.filter({
    last_trade_id: String(session.id),
    trade_status: 'locked_in_trade',
  }, '-updated_date', 500).catch(() => []);
  if (!reserved?.length) return;
  const locks = await acquireCardMutationLocks(
    svc,
    reserved.map((card: AnyObj) => ({ id: String(card.id), owner_id: null })),
    `trade_cancel:${session.id}`,
  );
  try {
    for (const card of reserved) {
      const live = await svc.UserCard.get(String(card.id)).catch(() => null);
      if (live?.trade_status === 'locked_in_trade' && String(live.last_trade_id || '') === String(session.id)) {
        await svc.UserCard.update(live.id, { trade_status: 'available', last_trade_id: '' });
      }
    }
  } finally {
    await releaseCardMutationLocks(svc, locks);
  }
}

async function finalize(base44: any, session: AnyObj, sessionLockToken?: string) {
  return finalizeCardTradeSession(base44.asServiceRole.entities, session, {
    method: 'friend_trade',
    progression_action: 'friend_trade_transfer',
    session_lock_token: sessionLockToken,
  });
}

async function responseState(base44: any, user: AnyObj, partnerId: string, session?: AnyObj | null) {
  const partner = await base44.asServiceRole.entities.User.get(partnerId).catch(() => null);
  const active = session ?? await getSessionForPair(base44, user.id, partnerId);
  const cards = await getTradeableCards(base44, user.id, active?.id);
  return {
    userId: user.id,
    system_version: 2,
    partner: partner
      ? { id: partner.id, name: partner.username || partner.full_name || partner.name || 'Friend', avatar: partner.avatar_url || '' }
      : { id: partnerId, name: 'Friend', avatar: '' },
    session: active,
    ownedCards: cards,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await base44.auth.me();
    if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole.entities;
    const user = await svc.User.get(auth.id);
    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'getState';
    const payload = body?.payload || {};
    const partnerId = String(payload.partnerId || '');
    if (!partnerId || partnerId === user.id) throw new Error('A valid friend is required');
    await requireFriend(base44, user.id, partnerId);

    let session = await getSessionForPair(base44, user.id, partnerId);

    if (action === 'start') {
      const pairLease = await acquireCardTradePairLock(svc, String(user.id), partnerId, 'friend_trade_start');
      try {
        session = await getSessionForPair(base44, user.id, partnerId);
        if (!session) {
          session = await svc.TradeSession.create({
            initiator_id: user.id,
            recipient_id: partnerId,
            status: 'pending',
            initiator_offer_card_ids: [], recipient_offer_card_ids: [],
            initiator_offer_snapshot: [], recipient_offer_snapshot: [],
            initiator_confirmed: false, recipient_confirmed: false,
          });
          await svc.SocialRequest.create({
            kind: 'trade', sender_id: user.id, sender_name: user.username || user.full_name || user.name || 'Player',
            receiver_id: partnerId, status: 'pending', trade_id: session.id,
          }).catch(() => null);
        }
      } finally {
        await releaseCardTradePairLock(svc, pairLease);
      }
    } else if (action === 'accept') {
      if (!session) throw new Error('No pending trade request to accept');
      const lease = await acquireTradeSessionMutationLock(svc, session.id, `trade_accept:${session.id}`);
      try {
        session = await svc.TradeSession.get(session.id);
        if (session.status !== 'pending' || session.recipient_id !== user.id) throw new Error('No pending trade request to accept');
        session = await svc.TradeSession.update(session.id, { status: 'accepted', initiator_confirmed: false, recipient_confirmed: false });
        const requests = await svc.SocialRequest.filter({ kind: 'trade', trade_id: session.id }, '-created_date', 20).catch(() => []);
        for (const r of requests || []) await svc.SocialRequest.update(r.id, { status: 'accepted' }).catch(() => null);
      } finally {
        await releaseTradeSessionMutationLock(svc, lease);
      }
    } else if (action === 'syncOffer') {
      if (!session) throw new Error('Trade must be accepted before adding cards');
      const sessionLease = await acquireTradeSessionMutationLock(svc, session.id, `trade_offer:${session.id}:${user.id}`);
      let cardLocks: any[] = [];
      try {
        session = await svc.TradeSession.get(session.id);
        if (session.status !== 'accepted') throw new Error('Trade must be accepted before adding cards');
        if (![session.initiator_id, session.recipient_id].includes(user.id)) throw new Error('You are not part of this trade');

        const cardIds = [...new Set((payload.cardIds || []).map(String).filter(Boolean))].slice(0, 8);
        const isInitiator = session.initiator_id === user.id;
        const reserved = await svc.UserCard.filter({
          user_id: user.id,
          last_trade_id: String(session.id),
          trade_status: 'locked_in_trade',
        }, '-updated_date', 100).catch(() => []);
        const lockIds = [...new Set([...cardIds, ...(reserved || []).map((card: AnyObj) => String(card.id))])];
        cardLocks = await acquireCardMutationLocks(
          svc,
          lockIds.map((id) => ({ id, owner_id: String(user.id) })),
          `trade_offer:${session.id}:${user.id}`,
        );
        const lockFor = (id: string) => cardLocks.find((lock) => lock.card_id === String(id));

        const snapshots: AnyObj[] = [];
        const validated = new Map<string, AnyObj>();
        for (const id of cardIds) {
          const lock = lockFor(id);
          if (!lock) throw new Error('Trade card lease is unavailable');
          let card = await svc.UserCard.get(id).catch(() => null);
          if (!card || String(card.user_id) !== String(user.id)) throw new Error('You can only offer cards you own');
          if (card.is_equipped || (card.equipped_to && card.equipped_to !== 'none')) throw new Error(`${card.card_name || 'That card'} is equipped`);
          if (card.trade_status === 'locked_in_trade' && String(card.last_trade_id || '') !== String(session.id)) {
            throw new Error(`${card.card_name || 'That card'} is already reserved elsewhere`);
          }
          const listings = await svc.CardTrade.filter({
            card_id: id,
            status: { $in: ['active', 'processing'] },
          }, '-created_date', 2).catch(() => []);
          if (listings?.length) throw new Error(`${card.card_name || 'That card'} is currently listed in the Trading Post`);
          const progressions = await svc.CardProgression.filter({ user_card_id: id }, '-updated_date', 2).catch(() => []);
          if ((progressions || []).length > 1) throw new Error('Multiple progression records exist for this card and require reconciliation');
          const progression = progressions?.[0] || null;
          const passport = await ensureCardPassport(svc, card, { lock_token: lock.token });
          if (String(card.passport_id || '') !== String(passport.passport_id)) {
            card = await svc.UserCard.update(id, { passport_id: passport.passport_id });
          }
          validated.set(id, card);
          snapshots.push(await cardSnapshot(base44, card, progression, passport));
        }

        for (const oldCard of reserved || []) {
          if (!cardIds.includes(String(oldCard.id))) {
            const live = await svc.UserCard.get(String(oldCard.id)).catch(() => null);
            if (live?.trade_status === 'locked_in_trade' && String(live.last_trade_id || '') === String(session.id)) {
              await svc.UserCard.update(live.id, { trade_status: 'available', last_trade_id: '' });
            }
          }
        }
        for (const id of cardIds) {
          const card = validated.get(id);
          if (!card) throw new Error('Trade card validation was lost');
          if (card.trade_status !== 'locked_in_trade' || String(card.last_trade_id || '') !== String(session.id)) {
            await svc.UserCard.update(id, { trade_status: 'locked_in_trade', last_trade_id: session.id });
          }
        }

        const patch = isInitiator
          ? { initiator_offer_card_ids: cardIds, initiator_offer_snapshot: snapshots, initiator_confirmed: false, recipient_confirmed: false }
          : { recipient_offer_card_ids: cardIds, recipient_offer_snapshot: snapshots, initiator_confirmed: false, recipient_confirmed: false };
        session = await svc.TradeSession.update(session.id, patch);
      } finally {
        if (cardLocks.length) await releaseCardMutationLocks(svc, cardLocks);
        await releaseTradeSessionMutationLock(svc, sessionLease);
      }
    } else if (action === 'confirm') {
      if (!session) throw new Error('Trade is not active');
      const lease = await acquireTradeSessionMutationLock(svc, session.id, `trade_confirm:${session.id}:${user.id}`);
      try {
        session = await svc.TradeSession.get(session.id);
        if (session.status !== 'accepted') throw new Error('Trade is not active');
        const isInitiator = session.initiator_id === user.id;
        const myIds = isInitiator ? (session.initiator_offer_card_ids || []) : (session.recipient_offer_card_ids || []);
        if (!myIds.length) throw new Error('Add at least one card before confirming');
        session = await svc.TradeSession.update(session.id, isInitiator ? { initiator_confirmed: true } : { recipient_confirmed: true });
        if (session.initiator_confirmed && session.recipient_confirmed) {
          session = await finalize(base44, session, lease.token);
        }
      } finally {
        await releaseTradeSessionMutationLock(svc, lease);
      }
    } else if (action === 'unconfirm') {
      if (!session) throw new Error('Trade is not active');
      const lease = await acquireTradeSessionMutationLock(svc, session.id, `trade_unconfirm:${session.id}:${user.id}`);
      try {
        session = await svc.TradeSession.get(session.id);
        if (session.status !== 'accepted') throw new Error('Trade is not active');
        session = await svc.TradeSession.update(session.id, session.initiator_id === user.id ? { initiator_confirmed: false } : { recipient_confirmed: false });
      } finally {
        await releaseTradeSessionMutationLock(svc, lease);
      }
    } else if (action === 'decline') {
      if (!session) throw new Error('No pending trade request to decline');
      const lease = await acquireTradeSessionMutationLock(svc, session.id, `trade_decline:${session.id}`);
      try {
        session = await svc.TradeSession.get(session.id);
        if (session.status !== 'pending' || session.recipient_id !== user.id) throw new Error('No pending trade request to decline');
        session = await svc.TradeSession.update(session.id, { status: 'declined', initiator_confirmed: false, recipient_confirmed: false });
        const requests = await svc.SocialRequest.filter({ kind: 'trade', trade_id: session.id }, '-created_date', 20).catch(() => []);
        for (const r of requests || []) await svc.SocialRequest.update(r.id, { status: 'declined' }).catch(() => null);
      } finally {
        await releaseTradeSessionMutationLock(svc, lease);
      }
    } else if (action === 'cancel') {
      if (session && ACTIVE.includes(session.status)) {
        const lease = await acquireTradeSessionMutationLock(svc, session.id, `trade_cancel:${session.id}`);
        try {
          session = await svc.TradeSession.get(session.id);
          if (ACTIVE.includes(session.status)) {
            await unlockSessionCards(base44, session);
            session = await svc.TradeSession.update(session.id, { status: 'cancelled', initiator_confirmed: false, recipient_confirmed: false });
            const requests = await svc.SocialRequest.filter({ kind: 'trade', trade_id: session.id }, '-created_date', 20).catch(() => []);
            for (const r of requests || []) await svc.SocialRequest.update(r.id, { status: 'cancelled' }).catch(() => null);
          }
        } finally {
          await releaseTradeSessionMutationLock(svc, lease);
        }
      }
    } else if (action !== 'getState') {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const current = session?.status === 'completed' || session?.status === 'cancelled' ? session : await getSessionForPair(base44, user.id, partnerId);
    return Response.json({ success: true, ...(await responseState(base44, user, partnerId, current)) });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: Number(error?.status || 400) });
  }
});
