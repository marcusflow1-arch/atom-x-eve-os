import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type AnyObj = Record<string, any>;

async function state(base44: any, user: AnyObj) {
  const [listings, ownedCards] = await Promise.all([
    base44.asServiceRole.entities.CardTrade.filter({ status: 'active' }, '-created_date', 300),
    base44.asServiceRole.entities.UserCard.filter({ user_id: user.id }, '-created_date', 300)
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
      seller: seller ? { id: seller.id, name: seller.username || seller.full_name || 'Player', avatar: seller.avatar_url || '' } : { id: listing.seller_id, name: 'Player', avatar: '' }
    };
  });
  return { listings: enriched, ownedCards: ownedCards.filter((c: AnyObj) => !c.is_equipped && c.trade_status !== 'locked_in_trade'), balance: Number(user.avatar_gamer_points || 0) };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const authed = await base44.auth.me();
    if (!authed) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const action = body?.action || 'getState';
    const payload = body?.payload || {};
    let user = await base44.asServiceRole.entities.User.get(authed.id);

    if (action === 'listCard') {
      const card = await base44.asServiceRole.entities.UserCard.get(payload.userCardId).catch(() => null);
      if (!card || card.user_id !== user.id) throw new Error('You do not own that card');
      if (card.is_equipped || card.trade_status === 'locked_in_trade') throw new Error('Card is equipped or already locked in a trade');
      const price = Math.floor(Number(payload.price));
      if (!Number.isFinite(price) || price < 1) throw new Error('Enter a valid asking price');
      const progression = (await base44.asServiceRole.entities.CardProgression.filter({ user_card_id: card.id }, '-created_date', 1))[0];
      const listing = await base44.asServiceRole.entities.CardTrade.create({
        seller_id: user.id,
        card_id: card.id,
        card_snapshot: {
          name: card.card_name,
          rarity: card.card_rarity,
          level: progression?.level || 1,
          stars: progression?.stars || 1,
          ascension: progression?.ascension || 0,
          enhanced_stats: progression?.enhanced_stats || {},
          origin_game: card.game_name,
          origin_achievement: progression?.achievement_id || '',
          image: card.card_image || ''
        },
        listing_type: 'fixed_price',
        asking_price: price,
        market_value_score: progression?.power_score || 0,
        status: 'active',
        views: 0
      });
      await base44.asServiceRole.entities.UserCard.update(card.id, { trade_status: 'locked_in_trade', last_trade_id: listing.id });
    } else if (action === 'cancelListing') {
      const listing = await base44.asServiceRole.entities.CardTrade.get(payload.listingId).catch(() => null);
      if (!listing || listing.seller_id !== user.id || listing.status !== 'active') throw new Error('Active listing not found');
      await base44.asServiceRole.entities.CardTrade.update(listing.id, { status: 'cancelled' });
      await base44.asServiceRole.entities.UserCard.update(listing.card_id, { trade_status: 'available' });
    } else if (action === 'buyListing') {
      const listing = await base44.asServiceRole.entities.CardTrade.get(payload.listingId).catch(() => null);
      if (!listing || listing.status !== 'active') throw new Error('This listing is no longer available');
      if (listing.seller_id === user.id) throw new Error('You cannot buy your own listing');
      const price = Number(listing.asking_price || 0);
      user = await base44.asServiceRole.entities.User.get(user.id);
      if (Number(user.avatar_gamer_points || 0) < price) throw new Error('Insufficient AGP balance');
      const seller = await base44.asServiceRole.entities.User.get(listing.seller_id).catch(() => null);
      if (!seller) throw new Error('Seller account unavailable');
      const card = await base44.asServiceRole.entities.UserCard.get(listing.card_id).catch(() => null);
      if (!card || card.user_id !== seller.id || card.trade_status !== 'locked_in_trade') throw new Error('Card ownership changed; listing cancelled');

      await base44.asServiceRole.entities.CardTrade.update(listing.id, { status: 'sold', buyer_id: user.id });
      await base44.asServiceRole.entities.User.update(user.id, { avatar_gamer_points: Number(user.avatar_gamer_points || 0) - price });
      await base44.asServiceRole.entities.User.update(seller.id, { avatar_gamer_points: Number(seller.avatar_gamer_points || 0) + price });
      await base44.asServiceRole.entities.UserCard.update(card.id, { user_id: user.id, acquisition_method: 'purchased', purchased_from: seller.id, purchase_price: price, trade_status: 'available', last_trade_id: listing.id });
      const progressions = await base44.asServiceRole.entities.CardProgression.filter({ user_card_id: card.id }, '-created_date', 1);
      if (progressions[0]) await base44.asServiceRole.entities.CardProgression.update(progressions[0].id, { user_id: user.id, last_action: 'market_transfer', last_action_at: new Date().toISOString(), revision: Number(progressions[0].revision || 0) + 1 });
      await base44.asServiceRole.entities.MarketTransaction.create({ buyer_id: user.id, seller_id: seller.id, item_id: card.id, item_name: card.card_name, price, transaction_type: 'purchase', timestamp: new Date().toISOString() });
    } else if (action === 'openTrade') {
      const listing = await base44.asServiceRole.entities.CardTrade.get(payload.listingId).catch(() => null);
      if (!listing || listing.status !== 'active' || listing.seller_id === user.id) throw new Error('Listing cannot be traded right now');
      const session = await base44.asServiceRole.entities.TradeSession.create({ initiator_id: user.id, recipient_id: listing.seller_id, status: 'pending', initiator_offer_card_ids: [], recipient_offer_card_ids: [listing.card_id], initiator_offer_snapshot: [], recipient_offer_snapshot: [listing.card_snapshot], initiator_confirmed: false, recipient_confirmed: false });
      return Response.json({ success: true, tradeSession: session, ...(await state(base44, await base44.asServiceRole.entities.User.get(user.id))) });
    } else if (action !== 'getState') {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const fresh = await base44.asServiceRole.entities.User.get(user.id);
    return Response.json({ success: true, ...(await state(base44, fresh)) });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
});
