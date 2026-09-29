import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { cardMasteryState, normalizeProgression } from '../../shared/cardSystem.ts';
import { ensureCardPassport, recordOwnershipTransfer } from '../../shared/cardProvenance.ts';

type AnyObj = Record<string, any>;
const now = () => new Date().toISOString();

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const authed = await base44.auth.me();
    if (!authed) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const action = body?.action || 'getState';
    const payload = body?.payload || {};
    const svc = base44.asServiceRole.entities;
    let user = await svc.User.get(authed.id);

    if (action === 'listCard') {
      let card = await svc.UserCard.get(payload.userCardId).catch(() => null);
      if (!card || card.user_id !== user.id) throw new Error('You do not own that card');
      if (card.is_equipped || card.equipped_to && card.equipped_to !== 'none' || card.trade_status === 'locked_in_trade') {
        throw new Error('Unequip this card before trading it');
      }
      const price = Math.floor(Number(payload.price));
      if (!Number.isFinite(price) || price < 1) throw new Error('Enter a valid asking price');
      const progression = (await svc.CardProgression.filter({ user_card_id: card.id }, '-updated_date', 1))[0] || null;
      const passport = await ensureCardPassport(svc, card);
      if (String(card.passport_id || '') !== String(passport.passport_id)) card = await svc.UserCard.update(card.id, { passport_id: passport.passport_id });
      const cardSnapshot = snapshot(card, progression, passport);
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
      await svc.UserCard.update(card.id, { trade_status: 'locked_in_trade', last_trade_id: listing.id });
    } else if (action === 'cancelListing') {
      const listing = await svc.CardTrade.get(payload.listingId).catch(() => null);
      if (!listing || listing.seller_id !== user.id || listing.status !== 'active') throw new Error('Active listing not found');
      await svc.CardTrade.update(listing.id, { status: 'cancelled' });
      await svc.UserCard.update(listing.card_id, { trade_status: 'available' });
    } else if (action === 'buyListing') {
      const listing = await svc.CardTrade.get(payload.listingId).catch(() => null);
      if (!listing || listing.status !== 'active') throw new Error('This listing is no longer available');
      if (listing.seller_id === user.id) throw new Error('You cannot buy your own listing');
      const price = Number(listing.asking_price || 0);
      user = await svc.User.get(user.id);
      if (Number(user.avatar_gamer_points || 0) < price) throw new Error('Insufficient AGP balance');
      const seller = await svc.User.get(listing.seller_id).catch(() => null);
      if (!seller) throw new Error('Seller account unavailable');
      const card = await svc.UserCard.get(listing.card_id).catch(() => null);
      if (!card || card.user_id !== seller.id || card.trade_status !== 'locked_in_trade' || card.last_trade_id !== listing.id) {
        throw new Error('Card ownership changed; listing cancelled');
      }

      await ensureCardPassport(svc, card);
      await svc.CardTrade.update(listing.id, { status: 'sold', buyer_id: user.id });
      await svc.User.update(user.id, { avatar_gamer_points: Number(user.avatar_gamer_points || 0) - price });
      await svc.User.update(seller.id, { avatar_gamer_points: Number(seller.avatar_gamer_points || 0) + price });
      await svc.UserCard.update(card.id, {
        user_id: user.id,
        acquisition_method: 'purchased',
        purchased_from: seller.id,
        purchase_price: price,
        trade_status: 'available',
        last_trade_id: listing.id,
        acquired_at: now(),
      });
      const progressions = await svc.CardProgression.filter({ user_card_id: card.id }, '-updated_date', 10);
      for (const progression of progressions || []) {
        await svc.CardProgression.update(progression.id, {
          user_id: user.id,
          last_action: 'market_transfer',
          last_action_at: now(),
          revision: Number(progression.revision || 0) + 1,
        });
      }
      await recordOwnershipTransfer(svc, card, seller.id, user.id, 'market_purchase', listing.id);
      await svc.MarketTransaction.create({
        buyer_id: user.id,
        seller_id: seller.id,
        item_id: card.id,
        item_name: card.card_name,
        price,
        transaction_type: 'purchase',
        timestamp: now(),
      });
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

    const fresh = await svc.User.get(user.id);
    return Response.json({ success: true, ...(await state(base44, fresh)) });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
});