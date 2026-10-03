import { acquireCardMutationLock, releaseCardMutationLock } from './cardMutationLock.ts';
import { ensureCardPassport, recordOwnershipTransfer } from './cardProvenance.ts';
import { conditionalUpdate, rewardError } from './rewardJournal.ts';

type Row = Record<string, any>;

const now = () => new Date().toISOString();

function hasReceipt(user: Row | null | undefined, field: string, receipt: string) {
  return Array.isArray(user?.[field]) && user[field].includes(receipt);
}

async function applyBalanceReceipt(
  svc: any,
  userId: string,
  field: 'market_debit_receipts' | 'market_credit_receipts',
  receipt: string,
  delta: number,
) {
  let user = await svc.User.get(String(userId)).catch(() => null);
  if (!user) throw rewardError('Market participant account is unavailable', 409);
  if (hasReceipt(user, field, receipt)) return user;

  const query: Row = {
    id: String(userId),
    [field]: { $nin: [receipt] },
  };
  if (delta < 0) query.avatar_gamer_points = { $gte: Math.abs(delta) };

  const applied = await conditionalUpdate(svc.User, query, {
    $inc: { avatar_gamer_points: delta },
    $addToSet: { [field]: receipt },
  });
  user = await svc.User.get(String(userId));
  if (hasReceipt(user, field, receipt)) return user;
  if (!applied && delta < 0 && Number(user.avatar_gamer_points || 0) < Math.abs(delta)) {
    throw rewardError('Insufficient AGP balance', 409);
  }
  throw rewardError('Market balance settlement changed concurrently; retry the purchase', 503);
}

async function claimListing(svc: any, listingId: string, buyerId: string) {
  let listing = await svc.CardTrade.get(listingId).catch(() => null);
  if (!listing) throw rewardError('This listing is no longer available', 404);
  if (listing.listing_type && listing.listing_type !== 'fixed_price') {
    throw rewardError('Only fixed-price listings use this settlement path', 409);
  }
  if (String(listing.seller_id || '') === String(buyerId)) throw rewardError('You cannot buy your own listing', 409);

  if (listing.status === 'sold') {
    if (String(listing.buyer_id || '') === String(buyerId)) return listing;
    throw rewardError('This listing has already been sold', 409);
  }
  if (listing.status === 'processing') {
    if (String(listing.buyer_id || '') === String(buyerId)) return listing;
    throw rewardError('Another player is already completing this purchase', 409);
  }
  if (listing.status !== 'active') throw rewardError('This listing is no longer available', 409);

  const settlementKey = `market:${listingId}`;
  const claimed = await conditionalUpdate(svc.CardTrade, { id: listingId, status: 'active' }, {
    $set: {
      status: 'processing',
      buyer_id: String(buyerId),
      settlement_key: settlementKey,
      settlement_state: 'processing',
      settlement_started_at: now(),
      buyer_debited: false,
      seller_credited: false,
      card_transferred: false,
      provenance_recorded: false,
      transaction_recorded: false,
    },
  });
  listing = await svc.CardTrade.get(listingId);
  if (claimed) return listing;
  if (listing.status === 'processing' && String(listing.buyer_id || '') === String(buyerId)) return listing;
  if (listing.status === 'sold' && String(listing.buyer_id || '') === String(buyerId)) return listing;
  throw rewardError('Another player claimed this listing first', 409);
}

async function ensureTransaction(svc: any, listing: Row, card: Row, buyerId: string, sellerId: string, price: number) {
  const settlementKey = String(listing.settlement_key || `market:${listing.id}`);
  const rows = await svc.MarketTransaction.filter({ settlement_key: settlementKey }, '-created_date', 2).catch(() => []);
  if ((rows || []).length > 1) throw rewardError('Duplicate market transactions require reconciliation', 409);
  if (rows?.[0]) return rows[0];
  return svc.MarketTransaction.create({
    settlement_key: settlementKey,
    buyer_id: String(buyerId),
    seller_id: String(sellerId),
    item_id: String(card.id),
    item_name: card.card_name || listing.card_snapshot?.name || 'Card',
    price,
    transaction_type: 'purchase',
    timestamp: now(),
  });
}

async function markRecoveryState(svc: any, listingId: string, buyerId: string, debitReceipt: string) {
  const buyer = await svc.User.get(String(buyerId)).catch(() => null);
  const moneyMoved = hasReceipt(buyer, 'market_debit_receipts', debitReceipt);
  if (moneyMoved) {
    await conditionalUpdate(svc.CardTrade, { id: listingId, status: 'processing', buyer_id: String(buyerId) }, {
      $set: { settlement_state: 'needs_recovery' },
    }).catch(() => false);
    return;
  }
  await conditionalUpdate(svc.CardTrade, { id: listingId, status: 'processing', buyer_id: String(buyerId) }, {
    $set: {
      status: 'active',
      buyer_id: '',
      settlement_state: 'needs_recovery',
      buyer_debited: false,
      seller_credited: false,
      card_transferred: false,
      provenance_recorded: false,
      transaction_recorded: false,
    },
  }).catch(() => false);
}

export async function finalizeFixedPriceCardPurchase(svc: any, listingInput: Row, buyerId: string) {
  const listingId = String(listingInput?.id || '');
  if (!listingId) throw rewardError('Listing ID is required', 400);
  const buyer = String(buyerId || '');
  if (!buyer) throw rewardError('Buyer identity is required', 400);

  let listing = await claimListing(svc, listingId, buyer);
  if (listing.status === 'sold') return listing;

  const sellerId = String(listing.seller_id || '');
  const cardId = String(listing.card_id || '');
  const price = Math.floor(Number(listing.asking_price || 0));
  if (!sellerId || !cardId || !Number.isFinite(price) || price < 1) {
    throw rewardError('Listing settlement data is invalid', 409);
  }
  const settlementKey = String(listing.settlement_key || `market:${listingId}`);
  const debitReceipt = `${settlementKey}:buyer:${buyer}:debit`;
  const creditReceipt = `${settlementKey}:seller:${sellerId}:credit`;

  let lock: any = null;
  try {
    lock = await acquireCardMutationLock(svc, cardId, null, `market_purchase:${listingId}`);
    listing = await svc.CardTrade.get(listingId);
    if (listing.status === 'sold') {
      if (String(listing.buyer_id || '') !== buyer) throw rewardError('This listing was sold to another player', 409);
      return listing;
    }
    if (listing.status !== 'processing' || String(listing.buyer_id || '') !== buyer) {
      throw rewardError('This purchase no longer belongs to the current buyer', 409);
    }

    let card = await svc.UserCard.get(cardId).catch(() => null);
    if (!card) throw rewardError('The listed card no longer exists', 409);
    const ownerId = String(card.user_id || '');
    const alreadyTransferred = ownerId === buyer;
    if (ownerId !== sellerId && !alreadyTransferred) throw rewardError('Card ownership changed before purchase settlement', 409);
    if (card.is_equipped || (card.equipped_to && card.equipped_to !== 'none')) {
      throw rewardError('The listed card became equipped before purchase settlement', 409);
    }
    if (!alreadyTransferred && (card.trade_status !== 'locked_in_trade' || String(card.last_trade_id || '') !== listingId)) {
      throw rewardError('The listed card is no longer reserved for this listing', 409);
    }
    if (alreadyTransferred && String(card.last_trade_id || '') !== listingId) {
      throw rewardError('The transferred card belongs to another settlement', 409);
    }

    const progressions = await svc.CardProgression.filter({ user_card_id: cardId }, '-updated_date', 10).catch(() => []);
    if ((progressions || []).length > 1) {
      throw rewardError('Multiple progression records exist for this card and require reconciliation', 409);
    }

    await ensureCardPassport(svc, alreadyTransferred ? { ...card, user_id: sellerId } : card, {
      lock_token: lock.token,
      original_owner_id: sellerId,
    });

    await applyBalanceReceipt(svc, buyer, 'market_debit_receipts', debitReceipt, -price);
    await svc.CardTrade.update(listingId, { buyer_debited: true, settlement_state: 'processing' });

    await applyBalanceReceipt(svc, sellerId, 'market_credit_receipts', creditReceipt, price);
    await svc.CardTrade.update(listingId, { seller_credited: true, settlement_state: 'processing' });

    if (!alreadyTransferred) {
      card = await svc.UserCard.update(cardId, {
        user_id: buyer,
        acquisition_method: 'purchased',
        purchased_from: sellerId,
        purchase_price: price,
        trade_status: 'available',
        last_trade_id: listingId,
        acquired_at: now(),
      });
    }
    for (const progression of progressions || []) {
      if (String(progression.user_id || '') !== buyer) {
        await svc.CardProgression.update(progression.id, {
          user_id: buyer,
          last_action: 'market_transfer',
          last_action_at: now(),
          revision: Number(progression.revision || 0) + 1,
        });
      }
    }
    await svc.CardTrade.update(listingId, { card_transferred: true, settlement_state: 'processing' });

    await recordOwnershipTransfer(
      svc,
      { ...card, user_id: sellerId },
      sellerId,
      buyer,
      'market_purchase',
      listingId,
      {
        lock_token: lock.token,
        event_key: `market:${listingId}:${cardId}`,
      },
    );
    await svc.CardTrade.update(listingId, { provenance_recorded: true, settlement_state: 'processing' });

    await ensureTransaction(svc, listing, card, buyer, sellerId, price);
    await svc.CardTrade.update(listingId, { transaction_recorded: true, settlement_state: 'processing' });

    listing = await svc.CardTrade.update(listingId, {
      status: 'sold',
      buyer_id: buyer,
      settlement_state: 'completed',
      settlement_completed_at: now(),
      buyer_debited: true,
      seller_credited: true,
      card_transferred: true,
      provenance_recorded: true,
      transaction_recorded: true,
    });
    return listing;
  } catch (error) {
    await markRecoveryState(svc, listingId, buyer, debitReceipt);
    throw error;
  } finally {
    if (lock) await releaseCardMutationLock(svc, lock);
  }
}
