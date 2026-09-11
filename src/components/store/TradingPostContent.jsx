import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, BadgeDollarSign, Boxes, ChevronRight, Coins, Gem, Loader2, Search, ShoppingBag, Sparkles, Store, Tag, Ticket, Users, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const rarityOrder = ['Common','Uncommon','Rare','Epic','Legendary','Mythic','Mythical','Unique','Limitless'];
const rarityTone = {
  Common:'text-slate-300', Uncommon:'text-emerald-300', Rare:'text-cyan-300', Epic:'text-violet-300', Legendary:'text-amber-300', Mythic:'text-rose-300', Mythical:'text-rose-300', Unique:'text-fuchsia-300', Limitless:'text-white'
};

function invoke(action, payload = {}) {
  return base44.functions.invoke('tradePostMarket', { action, payload });
}

function BoothCard({ listing, mine, onBuy, onTrade, onCancel, busy }) {
  const card = listing.card_snapshot || {};
  return <article className="group relative overflow-hidden border border-white/[0.08] bg-[#080c14] min-h-[335px] flex flex-col">
    <div className="relative h-44 overflow-hidden bg-[#0d1320]">
      {card.image ? <img src={card.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,.14),transparent_35%),linear-gradient(150deg,#101827,#05070c)]"/>}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-transparent to-black/10"/>
      <div className="absolute top-3 left-3 flex items-center gap-2"><span className="bg-black/55 backdrop-blur px-2 py-1 text-[8px] uppercase tracking-[.16em] text-white/65">Booth #{String(listing.id || '').slice(-4).toUpperCase()}</span>{mine && <span className="bg-cyan-300 text-slate-950 px-2 py-1 text-[8px] uppercase tracking-[.16em] font-black">Your Booth</span>}</div>
      <div className="absolute bottom-3 left-3 right-3"><p className={`text-[9px] uppercase tracking-[.17em] font-bold ${rarityTone[card.rarity] || rarityTone.Common}`}>{card.rarity || 'Common'} · Lv {card.level || 1} · {card.stars || 1}★</p><h3 className="text-lg font-black text-white mt-1 truncate">{card.name || 'Achievement Card'}</h3></div>
    </div>
    <div className="p-4 flex-1 flex flex-col">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="text-[8px] uppercase tracking-[.18em] text-white/25">Exhibitor</span><p className="text-xs text-white/70 truncate mt-1">{listing.seller?.name || 'Player'}</p></div><div className="text-right"><span className="text-[8px] uppercase tracking-[.18em] text-white/25">Asking</span><strong className="block text-base text-cyan-200 mt-1">{Number(listing.asking_price || 0).toLocaleString()} AGP</strong></div></div>
      <div className="grid grid-cols-3 gap-px bg-white/[0.06] mt-4"><div className="bg-[#080c14] p-2"><span className="block text-[7px] uppercase text-white/25">Stage</span><strong className="text-[11px] text-white">{card.stars || 1}</strong></div><div className="bg-[#080c14] p-2"><span className="block text-[7px] uppercase text-white/25">Ascend</span><strong className="text-[11px] text-white">{card.ascension || 0}</strong></div><div className="bg-[#080c14] p-2"><span className="block text-[7px] uppercase text-white/25">Power</span><strong className="text-[11px] text-white">{Number(listing.market_value_score || 0).toLocaleString()}</strong></div></div>
      <div className="mt-auto pt-4 flex gap-2">{mine ? <button disabled={busy} onClick={() => onCancel(listing)} className="h-9 flex-1 border border-rose-300/20 bg-rose-300/[0.05] text-rose-200 text-[9px] uppercase tracking-wider disabled:opacity-30">Close Booth</button> : <><button disabled={busy} onClick={() => onTrade(listing)} className="h-9 px-3 border border-white/10 text-white/55 hover:text-white text-[9px] uppercase tracking-wider disabled:opacity-30"><ArrowLeftRight className="w-3 h-3 inline mr-1"/>Trade</button><button disabled={busy} onClick={() => onBuy(listing)} className="h-9 flex-1 bg-cyan-300 text-slate-950 text-[9px] font-black uppercase tracking-wider disabled:opacity-30"><ShoppingBag className="w-3 h-3 inline mr-1"/>Buy</button></>}</div>
    </div>
  </article>;
}

function ListCardPanel({ state, onClose, onListed, busy }) {
  const [cardId, setCardId] = useState('');
  const [price, setPrice] = useState('');
  return <motion.aside initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{duration:.25}} className="absolute z-40 inset-y-0 right-0 w-full max-w-md bg-[#070b12]/98 backdrop-blur-2xl border-l border-white/[0.10] shadow-[-30px_0_70px_rgba(0,0,0,.45)] p-6 overflow-y-auto">
    <div className="flex items-start justify-between"><div><span className="text-[8px] uppercase tracking-[.24em] text-cyan-300/65">Exhibitor Setup</span><h2 className="text-2xl font-black text-white mt-2">Open a booth</h2><p className="text-xs text-white/40 mt-2">List one unequipped, unlocked card. The card is reserved while your booth is open.</p></div><button onClick={onClose} className="w-9 h-9 grid place-items-center text-white/35 hover:text-white"><X className="w-4 h-4"/></button></div>
    <div className="mt-6 space-y-2">{state.ownedCards?.length ? state.ownedCards.map(card => <button key={card.id} onClick={() => setCardId(card.id)} className={`w-full flex items-center gap-3 p-3 border text-left ${cardId === card.id ? 'border-cyan-300/35 bg-cyan-300/[0.06]' : 'border-white/[0.07] bg-white/[0.018]'}`}><div className="w-10 h-12 bg-black overflow-hidden">{card.card_image && <img src={card.card_image} alt="" className="w-full h-full object-cover"/>}</div><div className="min-w-0 flex-1"><strong className="text-xs text-white block truncate">{card.card_name}</strong><span className={`text-[8px] uppercase tracking-wider ${rarityTone[card.card_rarity] || rarityTone.Common}`}>{card.card_rarity} · {card.game_name || 'Collection'}</span></div>{cardId === card.id && <ChevronRight className="w-4 h-4 text-cyan-200"/>}</button>) : <div className="p-5 border border-dashed border-white/10 text-xs text-white/30">No cards are currently available to list. Equipped cards and cards already locked in trades do not appear here.</div>}</div>
    <label className="block mt-5"><span className="text-[8px] uppercase tracking-[.18em] text-white/30">Asking price</span><div className="mt-2 flex items-center border border-white/10 bg-black/20 px-3"><Coins className="w-4 h-4 text-amber-300"/><input type="number" min="1" value={price} onChange={e=>setPrice(e.target.value)} placeholder="AGP" className="h-11 flex-1 bg-transparent px-3 outline-none text-sm text-white"/></div></label>
    <button disabled={busy || !cardId || !price} onClick={() => onListed(cardId, price)} className="mt-5 w-full h-12 bg-white text-slate-950 font-black text-xs uppercase tracking-[.16em] disabled:opacity-25">Open Booth</button>
  </motion.aside>;
}

export default function TradingPostContent({ genreFilter, searchTerm }) {
  const [state, setState] = useState({ listings: [], ownedCards: [], balance: 0, userId: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [showList, setShowList] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [aisle, setAisle] = useState('All');

  const load = useCallback(async () => { try { const res = await invoke('getState'); setState(res?.data || res || state); } catch (e) { setMessage({type:'error',text:e?.message || 'Market unavailable'}); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); const unsub = base44.entities.CardTrade?.subscribe?.(() => load()); return () => unsub?.(); }, [load]);

  const action = async (name, payload, success) => { setBusy(true); setMessage(null); try { const res = await invoke(name,payload); setState(res?.data || res); setMessage({type:'success',text:success}); } catch(e){ setMessage({type:'error',text:e?.message || 'Trade Post action failed'}); } finally { setBusy(false); } };
  const listings = state.listings || [];
  const games = useMemo(() => [...new Set(listings.map(x => x.card_snapshot?.origin_game).filter(Boolean))], [listings]);
  const rarities = useMemo(() => [...new Set(listings.map(x => x.card_snapshot?.rarity).filter(Boolean))].sort((a,b)=>rarityOrder.indexOf(b)-rarityOrder.indexOf(a)), [listings]);
  const query = `${searchTerm || ''} ${localSearch}`.trim().toLowerCase();
  const filtered = useMemo(() => listings.filter(l => {
    const c=l.card_snapshot||{}; const hay=`${c.name||''} ${c.origin_game||''} ${c.rarity||''} ${l.seller?.name||''}`.toLowerCase();
    if(query && !hay.includes(query)) return false;
    if(genreFilter && genreFilter !== 'All' && !hay.includes(String(genreFilter).toLowerCase())) return false;
    if(aisle !== 'All' && c.origin_game !== aisle && c.rarity !== aisle) return false;
    return true;
  }), [listings, query, genreFilter, aisle]);

  return <div className="relative z-10 w-full h-[calc(100vh-80px)] overflow-hidden bg-[#05080d] text-white">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.07),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(168,85,247,.06),transparent_30%)]"/>
    <div className="relative h-full overflow-y-auto custom-scrollbar">
      <section className="border-b border-white/[0.07] px-6 lg:px-8 py-6 bg-black/10">
        <div className="max-w-[1600px] mx-auto grid xl:grid-cols-[1fr_auto] gap-6 items-end">
          <div><div className="flex items-center gap-2 text-[9px] uppercase tracking-[.26em] text-cyan-300/70"><Ticket className="w-3.5 h-3.5"/>Convention Hall · Live Card Market</div><h1 className="text-4xl lg:text-5xl font-black tracking-tight mt-3">The Trade Post</h1><p className="text-sm text-white/40 mt-3 max-w-3xl">Walk the floor. Browse player booths, find cards you did not know you needed, buy instantly with AGP, or open a direct trade with the exhibitor.</p></div>
          <div className="flex gap-2"><div className="border border-white/[0.08] bg-white/[0.02] px-4 py-3"><span className="text-[8px] uppercase tracking-widest text-white/25">Wallet</span><strong className="block text-lg text-amber-200">{Number(state.balance||0).toLocaleString()} AGP</strong></div><button onClick={()=>setShowList(true)} className="px-5 bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-[.13em]"><Store className="w-4 h-4 inline mr-2"/>Open Booth</button></div>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-5">
        <AnimatePresence>{message && <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} className={`mb-4 border px-4 py-3 text-xs ${message.type==='error'?'border-rose-300/15 bg-rose-300/[0.05] text-rose-200':'border-emerald-300/15 bg-emerald-300/[0.05] text-emerald-200'}`}>{message.text}</motion.div>}</AnimatePresence>
        <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-center border-b border-white/[0.07] pb-5">
          <div className="flex gap-2 overflow-x-auto">{['All',...games.slice(0,8),...rarities.slice(0,3)].map(value=><button key={value} onClick={()=>setAisle(value)} className={`shrink-0 px-3 py-2 text-[9px] uppercase tracking-[.13em] border ${aisle===value?'border-cyan-300/30 bg-cyan-300/[0.07] text-cyan-200':'border-white/[0.07] text-white/35 hover:text-white/65'}`}>{value==='All'?'Main Hall':value}</button>)}</div>
          <label className="flex items-center gap-2 border border-white/[0.08] bg-white/[0.02] px-3 min-w-[280px]"><Search className="w-4 h-4 text-white/25"/><input value={localSearch} onChange={e=>setLocalSearch(e.target.value)} placeholder="Search booths, cards, games, rarity..." className="h-10 flex-1 bg-transparent outline-none text-xs text-white placeholder:text-white/25"/></label>
        </div>

        <section className="grid md:grid-cols-4 gap-px bg-white/[0.06] mt-5 border border-white/[0.06]">{[[Boxes,'Open booths',listings.length],[Users,'Exhibitors',new Set(listings.map(x=>x.seller_id)).size],[Gem,'Rare finds',listings.filter(x=>rarityOrder.indexOf(x.card_snapshot?.rarity)>=3).length],[BadgeDollarSign,'Cards you can sell',state.ownedCards?.length||0]].map(([labelIcon,label,value])=>{const Icon=labelIcon;return <div key={label} className="bg-[#080c14] p-4 flex items-center gap-3"><Icon className="w-4 h-4 text-cyan-200"/><div><span className="text-[8px] uppercase tracking-widest text-white/25">{label}</span><strong className="block text-lg">{value}</strong></div></div>})}</section>

        <div className="flex items-center justify-between mt-7 mb-4"><div><span className="text-[8px] uppercase tracking-[.22em] text-white/25">Aisle Directory</span><h2 className="text-xl font-black mt-1">{aisle === 'All' ? 'Convention floor' : aisle}</h2></div><span className="text-[9px] text-white/25 uppercase tracking-wider">{filtered.length} booth{filtered.length===1?'':'s'} visible</span></div>
        {loading ? <div className="h-72 grid place-items-center text-white/30 text-xs"><Loader2 className="w-5 h-5 animate-spin mb-2"/>Loading convention floor…</div> : filtered.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-24">{filtered.map(listing=><BoothCard key={listing.id} listing={listing} mine={listing.seller_id===state.userId} busy={busy} onBuy={l=>action('buyListing',{listingId:l.id},`Purchased ${l.card_snapshot?.name || 'card'}.`)} onTrade={l=>action('openTrade',{listingId:l.id},'Trade invitation opened with this exhibitor.')} onCancel={l=>action('cancelListing',{listingId:l.id},'Your booth is closed and the card is unlocked.')}/>)}</div> : <div className="min-h-72 border border-dashed border-white/[0.08] grid place-items-center text-center p-8"><div><Sparkles className="w-7 h-7 text-white/15 mx-auto"/><h3 className="text-sm font-bold text-white/60 mt-3">This aisle is quiet.</h3><p className="text-xs text-white/25 mt-2">Open a booth with one of your cards and become the first exhibitor here.</p></div></div>}
      </div>
    </div>
    <AnimatePresence>{showList && <ListCardPanel state={state} busy={busy} onClose={()=>setShowList(false)} onListed={async(cardId,price)=>{await action('listCard',{userCardId:cardId,price:Number(price)},'Your booth is now live on the convention floor.');setShowList(false);}}/>}</AnimatePresence>
  </div>;
}
