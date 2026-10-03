import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Store, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CardScrollActions({ userCard, onChanged, disabled }) {
  const navigate = useNavigate();
  const [listing, setListing] = useState(false);
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const blocked = disabled || !userCard?.id || userCard?.is_equipped || userCard?.trade_status === 'locked_in_trade' || Boolean(userCard?.starter_grant_user_id);
  const publish = async event => {
    event.preventDefault();
    if (busy || blocked) return;
    setBusy(true); setMessage(null);
    try {
      const response = await base44.functions.invoke('tradePostMarket', { action: 'listCard', payload: { userCardId: userCard.id, price: Number(price), market: 'black_market' } });
      const data = response?.data || response;
      if (data?.error || !data?.success) throw new Error(data?.error || 'Your listing could not be published.');
      setMessage({ text: 'Listed on the Black Market.', success: true }); setListing(false);
      onChanged?.();
      window.dispatchEvent(new CustomEvent('cardProgressionChanged', { detail: { user_card_id: userCard.id } }));
    } catch (error) { setMessage({ text: error?.response?.data?.error || error?.message || 'Listing failed.' }); }
    finally { setBusy(false); }
  };
  return <aside className="card-scroll-actions" aria-label="Card trading">
    <span className="card-scroll-eyebrow">Exchange</span>
    <button type="button" disabled={blocked || busy} onClick={() => setListing(v => !v)}><Store size={16} />Post to Black Market</button>
    <button type="button" disabled={blocked || busy} onClick={() => navigate('/Store?mode=trading&offerCard=' + encodeURIComponent(userCard.id))}><ArrowLeftRight size={16} />Trade Card</button>
    {blocked && <p>{userCard?.starter_grant_user_id ? 'Starter cards stay with your avatar.' : userCard?.is_equipped ? 'Unequip this card to trade it.' : userCard?.trade_status === 'locked_in_trade' ? 'Reserved by a listing or trade.' : 'Load an owned card to trade.'}</p>}
    {listing && <form onSubmit={publish}>
      <div className="card-scroll-form-title"><strong>Instant purchase</strong><button type="button" aria-label="Cancel listing" onClick={() => setListing(false)}><X size={14} /></button></div>
      <label>Price in AGP<input type="number" min="1" max="1000000000" step="1" required value={price} onChange={e => setPrice(e.target.value)} /></label>
      <p>Your seller name is hidden on the Black Market. This card is reserved while listed.</p>
      <button type="submit" disabled={busy || blocked || !price}>{busy ? 'Publishing…' : 'Publish listing'}</button>
    </form>}
    {message && <p role={message.success ? 'status' : 'alert'}>{message.text}</p>}
    <button type="button" className="card-scroll-market-link" onClick={() => navigate('/Store?mode=blackmarket')}>Browse Black Market</button>
  </aside>;
}
