import { acquireCardMutationLock, releaseCardMutationLock } from './cardMutationLock.ts';
import {
  acquireCardTradePairLock,
  findActiveCardTradeSessionForPair,
  releaseCardTradePairLock,
} from './cardTradePairLock.ts';
import { rewardError } from './rewardJournal.ts';

type Row = Record<string, any>;

export async function openCardTradeNegotiation(svc: any, listingInput: Row, buyerId: string) {
  const listingId = String(listingInput?.id || '');
  const buyer = String(buyerId || '');
  if (!listingId || !buyer) throw rewardError('Listing and buyer are required', 400);

  let listing = await svc.CardTrade.get(listingId).catch(() => null);
  if (!listing || listing.status !== 'active') throw rewardError('Listing cannot be traded right now', 409);
  const seller = String(listing.seller_id || '');
  if (!seller || seller === buyer) throw rewardError('Listing cannot be traded right now', 409);
  const cardId = String(listing.card_id || '');
  if (!cardId) throw rewardError('Listing is missing its card identity', 409);

  const pairLock = await acquireCardTradePairLock(svc, buyer, seller, `market_open_trade_pair:${listingId}`);
  let cardLock: any = null;
  try {
    const existingSession = await findActiveCardTradeSessionForPair(svc, buyer, seller);
    if (existingSession) throw rewardError('You already have an active trade with this seller', 409);

    cardLock = await acquireCardMutationLock(svc, cardId, seller, `market_open_trade:${listingId}`);
    listing = await svc.CardTrade.get(listingId);
    if (listing.status !== 'active' || String(listing.seller_id || '') !== seller) {
      throw rewardError('Listing changed before trade negotiation could start', 409);
    }
    let card = await svc.UserCard.get(cardId).catch(() => null);
    if (!card || String(card.user_id || '') !== seller) throw rewardError('Seller no longer owns this card', 409);
    if (card.is_equipped || (card.equipped_to && card.equipped_to !== 'none')) {
      throw rewardError('The listed card is equipped and cannot enter a trade', 409);
    }
    if (card.trade_status !== 'locked_in_trade' || String(card.last_trade_id || '') !== listingId) {
      throw rewardError('The listed card is no longer reserved for this listing', 409);
    }

    const session = await svc.TradeSession.create({
      initiator_id: buyer,
      recipient_id: seller,
      status: 'pending',
      initiator_offer_card_ids: [],
      recipient_offer_card_ids: [cardId],
      initiator_offer_snapshot: [],
      recipient_offer_snapshot: [listing.card_snapshot || {}],
      initiator_confirmed: false,
      recipient_confirmed: false,
    });

    try {
      await svc.CardTrade.update(listingId, { status: 'cancelled' });
      card = await svc.UserCard.update(cardId, {
        trade_status: 'locked_in_trade',
        last_trade_id: session.id,
      });
      return session;
    } catch (error) {
      await svc.TradeSession.update(session.id, {
        status: 'cancelled',
        initiator_confirmed: false,
        recipient_confirmed: false,
      }).catch(() => null);
      const liveCard = await svc.UserCard.get(cardId).catch(() => null);
      if (liveCard && String(liveCard.user_id || '') === seller) {
        await svc.UserCard.update(cardId, {
          trade_status: 'locked_in_trade',
          last_trade_id: listingId,
        }).catch(() => null);
      }
      const liveListing = await svc.CardTrade.get(listingId).catch(() => null);
      if (liveListing?.status === 'cancelled') {
        await svc.CardTrade.update(listingId, { status: 'active' }).catch(() => null);
      }
      throw error;
    }
  } finally {
    if (cardLock) await releaseCardMutationLock(svc, cardLock);
    await releaseCardTradePairLock(svc, pairLock);
  }
}
