import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, RefreshCw, ShoppingCart, Store } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const dataOf = (response) => response?.data || response || {};
const norm = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export default function TradingWorkspaceBuy({ item, onPurchased }) {
  const [state, setState] = useState({ listings: [], balance: 0, userId: '' });
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [lastPurchase, setLastPurchase] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await base44.functions.invoke('tradePostMarket', { action: 'getState', payload: {} });
      const data = dataOf(response);
      if (data.error) throw new Error(data.error);
      setState(data);
      setError('');
    } catch (e) { setError(e?.message || 'Trading Post listings could not be loaded.'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const listings = useMemo(() => {
    const targetName = norm(item?.name);
    const targetGame = norm(item?.game);
    return (state.listings || [])
      .filter((listing) => listing.seller_id !== state.userId)
      .filter((listing) => {
        const snap = listing.card_snapshot || {};
        const sameCard = item?.tradingCardId && listing.trading_card_id ? listing.trading_card_id === item.tradingCardId : norm(snap.name) === targetName;
        const sameGame = !targetGame || norm(snap.origin_game) === targetGame;
        return sameCard && sameGame;
      })
      .sort((a, b) => Number(a.asking_price || 0) - Number(b.asking_price || 0));
  }, [state, item]);

  const buy = async (listing) => {
    setBusyId(listing.id); setError(''); setLastPurchase('');
    try {
      const response = await base44.functions.invoke('tradePostMarket', { action: 'buyListing', payload: { listingId: listing.id } });
      const data = dataOf(response);
      if (data.error) throw new Error(data.error);
      setState(data);
      setLastPurchase(listing.card_snapshot?.name || item?.name || 'Card');
      window.dispatchEvent(new Event('atomCardInventoryChanged'));
      onPurchased?.(data);
    } catch (e) { setError(e?.message || 'Purchase failed.'); }
    finally { setBusyId(null); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex h-full min-h-0 flex-col p-6">
      <div className="mb-4 flex items-center gap-3 border-b border-white/[0.055] pb-4"><Store className="h-4 w-4 text-cyan-100/55" /><div><p className="text-[8px] font-bold uppercase tracking-[.18em] text-white/25">Trading Post</p><h3 className="mt-1 text-sm font-semibold text-white/78">Available copies</h3></div><div className="ml-auto text-right"><p className="text-[8px] uppercase tracking-[.14em] text-white/22">Balance</p><p className="mt-0.5 text-xs font-semibold text-white/65">{Number(state.balance || 0).toLocaleString()} AGP</p></div><button onClick={load} className="grid h-8 w-8 place-items-center text-white/25 hover:bg-white/[0.04] hover:text-white/55"><RefreshCw className="h-3.5 w-3.5" /></button></div>
      {error && <div className="mb-3 border-l border-red-200/30 bg-red-200/[0.025] px-3 py-2 text-[10px] text-red-100/65">{error}</div>}
      {lastPurchase && <div className="mb-3 flex items-center gap-2 bg-emerald-200/[0.035] px-3 py-2 text-[10px] text-emerald-100/65 ring-1 ring-emerald-100/[0.07]"><CheckCircle2 className="h-3.5 w-3.5" />{lastPurchase} was added to your card inventory.</div>}
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        {listings.length ? <div className="space-y-px bg-white/[0.045]">{listings.map((listing) => {
          const price = Number(listing.asking_price || 0);
          return <div key={listing.id} className="flex items-center gap-4 bg-[#080d14]/90 px-4 py-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-white/72">{listing.seller?.name || 'Player'}</p><p className="mt-1 text-[8px] uppercase tracking-[.12em] text-white/22">Lv {listing.card_snapshot?.level || 1} · {listing.card_snapshot?.rarity || item?.rarity || 'Common'}</p></div><div className="text-right"><p className="text-xs font-semibold text-white/70">{price.toLocaleString()} AGP</p><p className="mt-1 text-[8px] text-white/20">Fixed price</p></div><button disabled={busyId === listing.id || Number(state.balance || 0) < price} onClick={() => buy(listing)} className="flex h-8 items-center gap-1.5 bg-cyan-100/[0.08] px-3 text-[8px] font-bold uppercase tracking-[.12em] text-cyan-50/70 ring-1 ring-cyan-100/15 disabled:opacity-25"><ShoppingCart className="h-3 w-3" />{busyId === listing.id ? 'Buying…' : 'Buy'}</button></div>;
        })}</div> : <div className="grid min-h-[260px] place-items-center text-center"><div><ShoppingCart className="mx-auto h-7 w-7 text-white/10" /><p className="mt-3 text-sm text-white/35">No active listings for this card.</p><p className="mt-1 text-[10px] text-white/20">Listings shown here are the same records used by the Store Trading Post.</p></div></div>}
      </div>
    </motion.div>
  );
}
