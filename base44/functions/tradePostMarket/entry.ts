import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { cardMasteryState, normalizeProgression } from '../../shared/cardSystem.ts';
import { ensureCardPassport } from '../../shared/cardProvenance.ts';
import { finalizeFixedPriceCardPurchase } from '../../shared/cardMarketSettlement.ts';
import {
  acquireCardMutationLock,
  refreshCardMutationLock,
  releaseCardMutationLock,
} from '../../shared/cardMutationLock.ts';
import { rewardError } from '../../shared/rewardJournal.ts';

type AnyObj = Record<string, any>;

function snapshot(card: AnyObj, progression: AnyObj | null, passport: AnyObj | null) {
  const p = normalizeProgression(progression);
  return {
    user_card_id: card.id,
    trading_card_id: card.trading_card_id || '',
    passport_id: passport?.passport_id || card.passport_id || '',
    name: card.card_name,
    rarity: card.card_rarity,
    playable_tier: card.playable_tier || card.card_rarity || 'Rare',
    enhancement_percent: p.enhancement_percent,
    ascension: p.ascension,
    stack_level: p.stack_level,
    power_score: Number(progression?.power_score || 0),
    mastery_visual: p.mastery_visual,
    mastery: cardMasteryState(p),
    origin_game: card.game_name,
    origin_achievement: progression?.achievement_id || card.achievement_id || '',
    acquired_at: card.acquired_at || card.unlocked_date || '',
    image: card.card_image || '',
    provenance_event_count: Number(passport?.event_count || 0),
    provenance_head_hash: passport?.head_hash || '',
    external_ledger_status: passport?.external_ledger_status || 'not_anchored',
  };
}

async function state(base44: any, user: AnyObj) {
  const [listings, ownedCards] = await Promise.all([
    base44.asServiceRole.entities.CardTrade.filter({ status: 'active' }, '-created_date', 300),
    base44.asServiceRole.entities.UserCard.filter({ user_id: user.id }, '-created_date', 300),
  ]);
  const sellerIds = [...new Set(listings.map((x: AnyObj) => x.seller_id).filter(Boolean))];
  const sellers = new Map<string, AnyObj>();
  for (const id of sellerIds.slice(0, 100)) {
    const row = await base44.asServiceRole.entities.User.get(id).catch(() => null);
    if (row) sellers.set(id, row);
  }
  const enriched = listings.map((listing: AnyObj) => {
    const seller = sellers.get(listing.seller_id);
    return {
      ...listing,
      seller: seller
        ? { id: seller.id, name: seller.username || seller.full_name || 'Player', avatar: seller.avatar_url || '' }
        : { id: listing.seller_id, name: 'Player', avatar: '' },
    };
  });
  return {
    userId: user.id,
    system_version: 2,
    listings: enriched,
    ownedCards: ownedCards.filter((c: AnyObj) => !c.is_equipped && c.trade_status !== 'locked_in_trade'),
    balance: Number(user.avatar_gamer_points || 0),
  };
}

async function listCard(svc: any, user: AnyObj, payload: AnyObj) {
  const cardId = String(payload.userCardId || '').trim();
  if (!cardId) throw rewardError('Choose a card to list', 400);
  const price = Math.floor(Number(payload.price));
  if (!Number.isFinite(price) || price < 1) throw rewardError('Enter a valid asking price', 400);

  const lock = await acquireCardMutationLock(svc, cardId, String(user.id), 'market_list');
  try {
    let card = await svc.UserCard.get(cardId).catch(() => null);
    if (!card || String(card.user_id) !== String(user.id)) throw rewardError('You do not own that card', 404);
    if (card.is_equipped || (card.equipped_to && card.equipped_to !== 'none')) {
      throw rewardError('Unequip this card before trading it', 409);
    }

    const existing = await svc.CardTrade.filter({ card_id: cardId, status: 'active' }, '-created_date', 2).catch(() => []);
    if ((existing || []).length > 1) throw rewardError('Multiple active listings exist for this card and require reconciliation', 409);
    if (existing?.[0]) {
      if (
        String(existing[0].seller_id || '') === String(user.id)
        && String(card.last_trade_id || '') === String(existing[0].id)
        && card.trade_status === 'locked_in_trade'
      ) return existing[0];
      throw rewardError('This card already has an active listing', 409);
    }
    if (card.trade_status === 'locked_in_trade') throw rewardError('This card is reserved somewhere else', 409);

    const progressions = await svc.CardProgression.filter({ user_card_id: card.id }, '-updated_date', 2).catch(() => []);
    if ((progressions || []).length > 1) throw rewardError('Multiple progression records exist for this card and require reconciliation', 409);
    const progression = progressions?.[0] || null;
    const passport = await ensureCardPassport(svc, card, { lock_token: lock.token });
    if (String(card.passport_id || '') !== String(passport.passport_id)) {
      card = await svc.UserCard.update(card.id, { passport_id: passport.passport_id });
    }
    const cardSnapshot = snapshot(card, progression, passport);
    await refreshCardMutationLock(svc, lock);
    const listing = await svc.CardTrade.create({
      seller_id: user.id,
      card_id: card.id,
      card_snapshot: cardSnapshot,
      listing_type: 'fixed_price',
      asking_price: price,
      market_value_score: Number(progression?.power_score || 0),
      status: 'active',
      views: 0,
    });
    try {
      await svc.UserCard.update(card.id, { trade_status: 'locked_in_trade', last_trade_id: listing.id });
    } catch (error) {
      await svc.CardTrade.update(listing.id, { status: 'cancelled' }).catch(() => null);
      throw error;
    }
    return listing;
  } finally {
    await releaseCardMutationLock(svc, lock);
  }
}

async function cancelListing(svc: any, user: AnyObj, listingId: string) {
  let listing = await svc.CardTrade.get(listingId).catch(() => null);
  if (!listing || String(listing.seller_id || '') !== String(user.id)) throw rewardError('Listing not found', 404);
  if (listing.status === 'processing') throw rewardError('This listing is currently settling a purchase and cannot be cancelled', 409);
  if (listing.status === 'sold') throw rewardError('A sold listing cannot be cancelled', 409);
  if (!['active', 'cancelled'].includes(String(listing.status || ''))) throw rewardError('This listing cannot be cancelled', 409);

  const lock = await acquireCardMutationLock(svc, String(listing.card_id), String(user.id), `market_cancel:${listing.id}`);
  try {
    listing = await svc.CardTrade.get(listing.id);
    if (listing.status === 'processing') throw rewardError('This listing started settling a purchase before cancellation completed', 409);
    if (listing.status === 'sold') throw rewardError('A sold listing cannot be cancelled', 409);
    if (listing.status === 'active') listing = await svc.CardTrade.update(listing.id, { status: 'cancelled' });
    const card = await svc.UserCard.get(String(listing.card_id)).catch(() => null);
    if (card && String(card.user_id || '') === String(user.id) && String(card.last_trade_id || '') === String(listing.id)) {
      await svc.UserCard.update(card.id, { trade_status: 'available' });
    }
    return listing;
  } finally {
    await releaseCardMutationLock(svc, lock);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const authed = await base44.auth.me();
    if (!authed) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'getState';
    const payload = body?.payload || {};
    const svc = base44.asServiceRole.entities;
    let user = await svc.User.get(authed.id);

    if (action === 'listCard') {
      await listCard(svc, user, payload);
    } else if (action === 'cancelListing') {
      await cancelListing(svc, user, String(payload.listingId || ''));
    } else if (action === 'buyListing') {
      const listing = await svc.CardTrade.get(String(payload.listingId || '')).catch(() => null);
      if (!listing) throw rewardError('This listing is no longer available', 404);
      await finalizeFixedPriceCardPurchase(svc, listing, String(user.id));
    } else if (action === 'openTrade') {
      const listing = await svc.CardTrade.get(payload.listingId).catch(() => null);
      if (!listing || listing.status !== 'active' || listing.seller_id === user.id) throw new Error('Listing cannot be traded right now');
      const session = await svc.TradeSession.create({
        initiator_id: user.id,
        recipient_id: listing.seller_id,
        status: 'pending',
        initiator_offer_card_ids: [],
        recipient_offer_card_ids: [listing.card_id],
        initiator_offer_snapshot: [],
        recipient_offer_snapshot: [listing.card_snapshot],
        initiator_confirmed: false,
        recipient_confirmed: false,
      });
      return Response.json({ success: true, tradeSession: session, ...(await state(base44, await svc.User.get(user.id))) });
    } else if (action !== 'getState') {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    user = await svc.User.get(user.id);
    return Response.json({ success: true, ...(await state(base44, user)) });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: Number(error?.status || 400) });
  }
});
