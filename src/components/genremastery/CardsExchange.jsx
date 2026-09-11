import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, ArrowUpRight, Gavel, Plus, Search, Store, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { sendTradeRequest } from '@/components/game3d/social/tradeRequest';
import CollectibleCard, { CardArtwork } from './CollectibleCard';
import { cardKey, readCardPages, RARITY_COLORS } from './cardsCatalog';

const priceOf = (offer) => offer.offer_type === 'bid' ? offer.current_bid : offer.price;
const priceLabel = (offer) => offer.offer_type === 'trade' ? 'Card exchange' : Number.isFinite(priceOf(offer)) ? `${priceOf(offer).toLocaleString()} AGP` : 'Price not provided';
const typeLabel = (type) => ({ sale: 'Fixed price', bid: 'Auction', trade: 'Card trade' })[type] || 'Offer';

export default function CardsExchange({ mode, selectedGame, games, cards, user }) {
  const isMarket = mode === 'blackmarket';
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [pickingCard, setPickingCard] = useState(false);
  const [listingCard, setListingCard] = useState(null);
  const [listingType, setListingType] = useState(isMarket ? 'sale' : 'trade');
  const [listingPrice, setListingPrice] = useState('');
  const [seeking, setSeeking] = useState('');
  const [listingBusy, setListingBusy] = useState(false);
  const [listingError, setListingError] = useState('');
  const [listingNotice, setListingNotice] = useState('');
  const [requestState, setRequestState] = useState('idle');
  const [requestError, setRequestError] = useState('');
  const [limit, setLimit] = useState(36);
  const offersQuery = useQuery({ queryKey: ['cards-console-offers', selectedGame?.title || 'all'], queryFn: () => readCardPages((count, skip) => base44.entities.TradeOffer.filter({ status: 'active', ...(selectedGame ? { game_name: selectedGame.title } : {}) }, '-created_date', count, skip)), staleTime: 15000, refetchInterval: 30000 });
  const gameNames = useMemo(() => new Set(games.map((game) => cardKey(game.title))), [games]);
  const offers = useMemo(() => (offersQuery.data || []).filter((offer) => gameNames.has(cardKey(offer.game_name)) && (!offer.expires_at || new Date(offer.expires_at).getTime() > Date.now()) && (isMarket ? offer.offer_type === 'sale' || offer.offer_type === 'bid' : offer.offer_type === 'trade')), [offersQuery.data, gameNames, isMarket]);
  const visible = useMemo(() => {
    const result = offers.filter((offer) => `${offer.item_name} ${offer.game_name} ${offer.trader_name} ${offer.item_rarity}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || offer.offer_type === filter) && (!selectedCard || (cardKey(offer.item_name) === cardKey(selectedCard.title) && cardKey(offer.game_name) === cardKey(selectedCard.series))));
    if (sort !== 'newest') result.sort((a, b) => (Number(priceOf(a) ?? Infinity) - Number(priceOf(b) ?? Infinity)) * (sort === 'low' ? 1 : -1));
    return result;
  }, [offers, search, filter, selectedCard, sort]);
  const tradable = cards.filter((card) => card.ownedCopies?.some((copy) => copy.trade_status !== 'locked_in_trade' && !copy.is_equipped));
  const toCard = (offer) => ({ id: offer.id, title: offer.item_name, series: offer.game_name, image: offer.item_image || games.find((game) => cardKey(game.title) === cardKey(offer.game_name))?.cover_image, rarity: offer.item_rarity || 'Common', group: offer.item_type || 'Collectible' });
  const openOffer = (card) => { setSelectedOffer(offers.find((offer) => offer.id === card.id)); setRequestState('idle'); setRequestError(''); };
  const requestTrade = async () => {
    if (!user?.id || !selectedOffer?.trader_id || requestState === 'sending' || requestState === 'sent') return;
    setRequestState('sending'); setRequestError('');
    try {
      await sendTradeRequest({ id: user.id, name: user.display_name || user.full_name || user.username || 'Collector' }, { id: selectedOffer.trader_id, name: selectedOffer.trader_name || 'Collector' });
      setRequestState('sent');
    } catch (error) { setRequestState('idle'); setRequestError(error.message || 'Your trade request could not be sent. Try again.'); }
  };
  const listCard = async (event) => {
    event.preventDefault();
    if (!user?.id || !listingCard || listingBusy) return;
    const amount = Number(listingPrice);
    if (listingType !== 'trade' && (!Number.isSafeInteger(amount) || amount <= 0)) { setListingError('Enter a positive whole-number AGP price.'); return; }
    if (listingType === 'trade' && !seeking.trim()) { setListingError('Describe the cards you are looking for.'); return; }
    setListingBusy(true); setListingError('');
    try {
      // Recheck the selected inventory copy before advertising it. This does
      // not transfer, reserve, or charge for a card; trades still use the
      // existing two-party confirmation flow.
      const inventory = await base44.entities.UserCard.filter({ user_id: user.id, id: listingCard.id });
      const copy = inventory.find((item) => item.id === listingCard.id && item.user_id === user.id);
      if (!copy || copy.is_equipped || copy.trade_status === 'locked_in_trade') throw new Error('This card is no longer available to list.');
      await base44.entities.TradeOffer.create({ trader_id: user.id, trader_name: user.display_name || user.full_name || user.username || 'Collector', trader_avatar: user.avatar_url || '', item_name: copy.card_name, item_type: copy.card_type, item_rarity: copy.card_rarity, item_image: copy.card_image || listingCard.image, game_name: copy.game_name || listingCard.game, game_genre: copy.genre || '', offer_type: listingType, ...(listingType === 'sale' ? { price: amount } : listingType === 'bid' ? { current_bid: amount } : { seeking_items: seeking.split(',').map((item) => item.trim()).filter(Boolean) }), status: 'active', expires_at: new Date(Date.now() + 7 * 86400000).toISOString() });
      setListingNotice(`${copy.card_name} is now listed. No cards or currency have been transferred.`);
      setListingCard(null); await offersQuery.refetch();
    } catch (error) { setListingError(error.message || 'The listing could not be saved. Try again.'); }
    finally { setListingBusy(false); }
  };
  return <section className="cc-view cc-exchange" aria-label={isMarket ? 'Black Market' : 'Trading Post'}>
    <header className="cc-view-heading"><div><p className="cc-eyebrow">{isMarket ? 'The collector’s exchange' : 'Cards change hands. Stories continue.'}</p><h1>{isMarket ? 'Black Market' : 'Trading Post'}</h1><p>{selectedGame?.title || 'Across your selected genre'} · {isMarket ? 'Sales & auctions' : 'Collector-to-collector trades'}</p></div><button className="cc-button cc-button-primary" onClick={() => setPickingCard(true)}><Plus size={15} />List a card</button></header>
    <div className="cc-toolbar"><label className="cc-search"><Search size={15} /><input aria-label="Search market cards" value={search} onChange={(event) => { setSearch(event.target.value); setLimit(36); }} placeholder="Search cards or collectors" /></label>{isMarket && <div className="cc-segments">{[['all', 'All offers'], ['sale', 'Fixed price'], ['bid', 'Auctions']].map(([id, label]) => <button key={id} onClick={() => { setFilter(id); setLimit(36); }} aria-pressed={filter === id}>{label}</button>)}</div>}<label className="cc-select"><select aria-label="Sort offers" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option>{isMarket && <><option value="low">Price: low to high</option><option value="high">Price: high to low</option></>}</select></label></div>
    <div className="cc-scroll">
      {listingNotice && <p className="cc-notice" role="status">{listingNotice}</p>}
      {cards.length > 0 && <div className="cc-exchange-catalog"><div className="cc-section-heading"><p className="cc-eyebrow">Browse by card</p>{selectedCard && <button className="cc-text-button" onClick={() => setSelectedCard(null)}>All cards <X size={12} /></button>}</div><div className="cc-card-strip">{cards.map((card) => <button key={card.id} onClick={() => { setSelectedCard(selectedCard?.id === card.id ? null : card); setLimit(36); }} aria-pressed={selectedCard?.id === card.id}><CardArtwork src={card.image} /><span><strong>{card.title}</strong><small style={{ color: RARITY_COLORS[card.rarity] }}>{card.rarity}</small></span></button>)}</div></div>}
      <div className="cc-section-heading"><div><p className="cc-eyebrow">{isMarket ? 'On the market' : 'Open to trade'}</p><h2>{selectedCard?.title || (isMarket ? 'Find your next collectible' : 'Find the right exchange')}</h2></div><span aria-live="polite">{visible.length} offers</span></div>
      {offersQuery.isError ? <div className="cc-empty" role="alert"><h2>Offers could not be loaded</h2><button className="cc-button" onClick={() => offersQuery.refetch()}>Try again</button></div> : offersQuery.isLoading ? <div className="cc-empty" role="status">Loading offers…</div> : visible.length ? <><div className="cc-offer-grid">{visible.slice(0, limit).map((offer) => <article key={offer.id}><CollectibleCard card={toCard(offer)} onSelect={openOffer} footer={<span>{typeLabel(offer.offer_type)}</span>} /><button className="cc-offer-caption" onClick={() => openOffer({ id: offer.id })}><span>{offer.trader_name || 'Collector'}<strong>{priceLabel(offer)}</strong></span><ArrowUpRight size={17} /></button></article>)}</div>{visible.length > limit && <button className="cc-button cc-load-more" onClick={() => setLimit(limit + 36)}>Show more offers</button>}</> : <div className="cc-empty">{isMarket ? <Store /> : <ArrowLeftRight />}<h2>{search || selectedCard || filter !== 'all' ? 'No matching offers' : 'The next offer could be yours'}</h2><p>{search || selectedCard ? 'Try another card or collector.' : 'Active listings will appear here when collectors post them.'}</p>{(search || selectedCard || filter !== 'all') && <button className="cc-button" onClick={() => { setSearch(''); setSelectedCard(null); setFilter('all'); }}>Clear filters</button>}</div>}
    </div>
    <Dialog open={Boolean(selectedOffer)} onOpenChange={(open) => { if (!open) setSelectedOffer(null); }}><DialogContent className="cc-exchange-dialog"><DialogHeader><p className="cc-eyebrow">{selectedOffer && typeLabel(selectedOffer.offer_type)}</p><DialogTitle>{selectedOffer?.item_name}</DialogTitle><DialogDescription>{selectedOffer?.game_name} · Offered by {selectedOffer?.trader_name || 'Collector'}</DialogDescription></DialogHeader>{selectedOffer && <div className="cc-offer-inspector"><CollectibleCard card={toCard(selectedOffer)} decorative footer={<span>{typeLabel(selectedOffer.offer_type)}</span>} /><div><p className="cc-eyebrow">{selectedOffer.offer_type === 'bid' ? 'Current bid' : selectedOffer.offer_type === 'trade' ? 'Looking for' : 'Asking price'}</p><h2>{selectedOffer.offer_type === 'trade' ? selectedOffer.seeking_items?.join(', ') || 'Open to offers' : priceLabel(selectedOffer)}</h2><p>{selectedOffer.item_description || selectedOffer.description || 'Contact this collector to discuss the card.'}</p>{selectedOffer.offer_type === 'bid' && Number.isFinite(selectedOffer.buyout_price) && <p><Gavel size={14} /> Buyout: {selectedOffer.buyout_price.toLocaleString()} AGP</p>}{selectedOffer.expires_at && <small>Ends {new Date(selectedOffer.expires_at).toLocaleDateString()}</small>}{selectedOffer.trader_id === user?.id ? <p className="cc-notice">This is your listing.</p> : <><button className="cc-button cc-button-primary" disabled={!user?.id || !selectedOffer.trader_id || requestState !== 'idle'} onClick={requestTrade}><ArrowLeftRight size={15} />{requestState === 'sent' ? 'Trade invitation sent' : requestState === 'sending' ? 'Sending…' : 'Invite collector to trade'}</button><p className="cc-muted">{!user?.id ? 'Sign in to trade with this collector.' : 'Start a trade conversation. Cards are exchanged after both collectors confirm.'}</p></>}{requestState === 'sent' && <p role="status">Waiting for the collector to accept your invitation.</p>}{requestError && <p role="alert">{requestError}</p>}</div></div>}</DialogContent></Dialog>
    <Dialog open={pickingCard} onOpenChange={setPickingCard}><DialogContent className="cc-exchange-dialog"><DialogHeader><DialogTitle>Choose a card to list</DialogTitle><DialogDescription>Available cards from your collection.</DialogDescription></DialogHeader>{!user ? <div className="cc-empty"><p>Sign in to list cards from your collection.</p></div> : tradable.length ? <div className="cc-picker-grid">{tradable.map((card) => <CollectibleCard key={card.id} card={card} onSelect={(item) => { const copy = item.ownedCopies.find((entry) => entry.trade_status !== 'locked_in_trade' && !entry.is_equipped); setListingCard({ id: copy.id, name: item.title, rarity: item.rarity, type: copy.card_type, image: item.image, game: item.series }); setListingType(isMarket ? 'sale' : 'trade'); setListingPrice(''); setSeeking(''); setListingError(''); setPickingCard(false); }} />)}</div> : <div className="cc-empty"><p>No available cards in this game selection.</p><small>Equipped cards and cards already in a trade stay in your collection.</small></div>}</DialogContent></Dialog>
    <Dialog open={Boolean(listingCard)} onOpenChange={(open) => { if (!open && !listingBusy) setListingCard(null); }}><DialogContent className="cc-exchange-dialog"><DialogHeader><DialogTitle>List {listingCard?.name}</DialogTitle><DialogDescription>{listingCard?.game} · Listings stay active for seven days.</DialogDescription></DialogHeader><form className="cc-listing-form" onSubmit={listCard}><label>Listing type<select aria-label="Listing type" value={listingType} onChange={(event) => setListingType(event.target.value)}>{isMarket ? <><option value="sale">Fixed price</option><option value="bid">Auction</option></> : <option value="trade">Card trade</option>}</select></label>{listingType === 'trade' ? <label>Cards you are looking for<input required maxLength={500} aria-label="Cards wanted" placeholder="Card names, separated by commas" value={seeking} onChange={(event) => setSeeking(event.target.value)} /></label> : <label>{listingType === 'bid' ? 'Opening bid (AGP)' : 'Asking price (AGP)'}<input aria-label="Listing price" required type="number" min="1" step="1" value={listingPrice} onChange={(event) => setListingPrice(event.target.value)} /></label>}<p className="cc-muted">This posts an offer. It does not transfer your card or charge another collector.</p>{listingError && <p className="cc-notice" role="alert">{listingError}</p>}<button type="submit" disabled={listingBusy} className="cc-button cc-button-primary">{listingBusy ? 'Posting…' : 'Post listing'}</button></form></DialogContent></Dialog>
  </section>;
}
