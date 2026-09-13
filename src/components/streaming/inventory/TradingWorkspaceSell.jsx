import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, DollarSign, Lock, Store } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TradingWorkspaceSell({ item, marketPrice, onListed }) {
  const [sellPrice, setSellPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [listed, setListed] = useState(false);

  const blocked = item?.isEquipped || item?.tradeStatus === 'locked_in_trade';
  const submit = async () => {
    const price = Math.floor(Number(sellPrice));
    if (!item?.userCardId || !Number.isFinite(price) || price < 1 || blocked) return;
    setBusy(true); setError('');
    try {
      const response = await base44.functions.invoke('tradePostMarket', {
        action: 'listCard',
        payload: { userCardId: item.userCardId, price },
      });
      const data = response?.data || response || {};
      if (data.error) throw new Error(data.error);
      setListed(true);
      window.dispatchEvent(new Event('atomCardInventoryChanged'));
      onListed?.(data);
    } catch (e) {
      setError(e?.message || 'This card could not be listed.');
    } finally {
      setBusy(false);
    }
  };

  if (listed) {
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-[300px] place-items-center p-8 text-center"><div><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-200/65" /><h3 className="mt-3 text-sm font-semibold text-white/80">Listed in Trading Post</h3><p className="mt-1 text-[10px] text-white/30">The same owned card is now reserved from friend trades until the listing is sold or cancelled.</p></div></motion.div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto w-full max-w-2xl p-7">
      <div className="mb-6 flex items-center gap-3 border-b border-white/[0.055] pb-4"><Store className="h-4 w-4 text-cyan-100/55" /><div><p className="text-[8px] font-bold uppercase tracking-[.2em] text-white/25">Trading Post</p><h3 className="mt-1 text-sm font-semibold text-white/78">List this card for sale</h3></div></div>

      {blocked ? <div className="mb-5 flex items-start gap-2 bg-amber-100/[0.035] p-3 text-[10px] leading-5 text-amber-50/55 ring-1 ring-amber-100/[0.08]"><Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />{item.isEquipped ? 'Unequip this card before listing it.' : 'This card is already reserved by another trade or market listing.'}</div> : null}
      {error && <div className="mb-5 border-l border-red-200/30 bg-red-200/[0.025] px-3 py-2 text-[10px] text-red-100/65">{error}</div>}

      <label className="block text-[8px] font-bold uppercase tracking-[.18em] text-white/28">Asking price · AGP</label>
      <div className="mt-2 flex gap-2">
        <input type="number" min="1" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder={marketPrice ? `Reference ${Math.round(marketPrice).toLocaleString()}` : 'Enter price'} className="h-11 flex-1 bg-white/[0.035] px-4 text-sm text-white/80 outline-none ring-1 ring-white/[0.07] placeholder:text-white/18 focus:ring-cyan-100/20" />
        <button disabled={busy || blocked || Number(sellPrice) < 1} onClick={submit} className="flex h-11 min-w-[150px] items-center justify-center gap-2 bg-cyan-100/[0.09] px-5 text-[9px] font-bold uppercase tracking-[.14em] text-cyan-50/75 ring-1 ring-cyan-100/20 transition hover:bg-cyan-100/[0.14] disabled:opacity-30"><DollarSign className="h-3.5 w-3.5" />{busy ? 'Listing…' : 'List Card'}</button>
      </div>
      <p className="mt-3 text-[10px] leading-5 text-white/25">Listing locks this exact UserCard record. A buyer receives that same record, including its game mapping and progression.</p>
    </motion.div>
  );
}
