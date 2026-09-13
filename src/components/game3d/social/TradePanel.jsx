import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, Check, Package, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { tradeStore, closeTrade } from './socialStores';
import { base44 } from '@/api/base44Client';

const dataOf = (response) => response?.data || response || {};
const nameOf = (card) => card?.card_name || card?.name || 'Card';
const rarityOf = (card) => card?.card_rarity || card?.rarity || 'Common';

function MiniCard({ card, selected, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative aspect-[3/4] overflow-hidden p-2 text-left transition ${selected ? 'bg-cyan-100/[0.09] ring-1 ring-cyan-100/25' : 'bg-white/[0.035] ring-1 ring-white/[0.07] hover:bg-white/[0.065]'} disabled:opacity-40`}
    >
      {card.card_image && <img src={card.card_image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080c13] via-[#080c13]/75 to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-end">
        <span className="mb-auto text-[7px] uppercase tracking-[.14em] text-white/28">{rarityOf(card)}</span>
        <p className="line-clamp-2 text-[9px] font-semibold text-white/82">{nameOf(card)}</p>
        <p className="mt-1 truncate text-[7px] text-white/25">{card.game_name || ''}</p>
        {selected && <span className="mt-1 flex items-center gap-1 text-[7px] text-cyan-100/65"><Check className="h-2.5 w-2.5" /> Offered</span>}
      </div>
    </button>
  );
}

export default function TradePanel() {
  const [trade, setTrade] = useState(tradeStore.get());
  const [me, setMe] = useState(null);
  const [state, setState] = useState({ session: null, ownedCards: [] });
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => tradeStore.subscribe(setTrade), []);
  useEffect(() => { base44.auth.me().then(setMe).catch(() => null); }, []);

  const partnerId = trade.partner?.id;
  const invoke = useCallback(async (action, payload = {}) => {
    if (!partnerId) throw new Error('Trade partner unavailable');
    const response = await base44.functions.invoke('friendCardTrade', { action, payload: { partnerId, ...payload } });
    const data = dataOf(response);
    if (data.error) throw new Error(data.error);
    setState(data);
    const session = data.session;
    if (session && me?.id) {
      setSelectedIds(session.initiator_id === me.id ? (session.initiator_offer_card_ids || []) : (session.recipient_offer_card_ids || []));
    }
    return data;
  }, [partnerId, me?.id]);

  const refresh = useCallback(async () => {
    if (!trade.open || !partnerId || !me?.id) return;
    try { await invoke('getState'); } catch (error) { toast.error(error?.message || 'Trade unavailable'); }
  }, [trade.open, partnerId, me?.id, invoke]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!trade.open || !partnerId) return undefined;
    const unsub = base44.entities.TradeSession.subscribe((event) => {
      const row = event?.data;
      if (row && [row.initiator_id, row.recipient_id].includes(me?.id) && [row.initiator_id, row.recipient_id].includes(partnerId)) refresh();
    });
    return unsub;
  }, [trade.open, partnerId, me?.id, refresh]);

  const session = state.session;
  const isInitiator = session?.initiator_id === me?.id;
  const myOffer = session ? (isInitiator ? session.initiator_offer_snapshot : session.recipient_offer_snapshot) || [] : [];
  const theirOffer = session ? (isInitiator ? session.recipient_offer_snapshot : session.initiator_offer_snapshot) || [] : [];
  const myConfirmed = session ? Boolean(isInitiator ? session.initiator_confirmed : session.recipient_confirmed) : false;
  const theirConfirmed = session ? Boolean(isInitiator ? session.recipient_confirmed : session.initiator_confirmed) : false;
  const active = session?.status === 'accepted';
  const cards = useMemo(() => (state.ownedCards || []).filter((card) => !search || `${card.card_name} ${card.game_name} ${card.card_rarity}`.toLowerCase().includes(search.toLowerCase())), [state.ownedCards, search]);

  const run = async (action, payload) => {
    setBusy(true);
    try {
      const data = await invoke(action, payload);
      if (data.session?.status === 'completed') {
        toast.success('Trade complete — card ownership updated');
        setTimeout(closeTrade, 900);
      }
    } catch (error) { toast.error(error?.message || 'Trade action failed'); }
    finally { setBusy(false); }
  };

  const toggleCard = async (card) => {
    if (!active || myConfirmed || busy) return;
    const next = selectedIds.includes(card.id) ? selectedIds.filter((id) => id !== card.id) : [...selectedIds, card.id].slice(0, 8);
    setSelectedIds(next);
    await run('syncOffer', { cardIds: next });
  };

  const handleClose = async () => {
    if (session && ['pending', 'accepted'].includes(session.status)) await run('cancel');
    closeTrade();
  };

  if (!trade.open || !trade.partner) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md" onClick={handleClose}>
        <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .97 }} onClick={(e) => e.stopPropagation()} className="flex max-h-[82vh] w-full max-w-5xl flex-col overflow-hidden bg-[#090d14]/95 ring-1 ring-white/[0.09]">
          <header className="flex h-14 items-center gap-3 border-b border-white/[0.07] px-5">
            <ArrowLeftRight className="h-4 w-4 text-cyan-100/60" />
            <div><p className="text-[8px] uppercase tracking-[.18em] text-white/25">Live Card Trade</p><p className="text-xs font-semibold text-white/80">{trade.partner.name}</p></div>
            <span className="ml-auto text-[8px] uppercase tracking-[.14em] text-white/22">Same inventory as Trading Post</span>
            <button onClick={handleClose} className="grid h-8 w-8 place-items-center text-white/35 hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4" /></button>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-[1.1fr_.9fr]">
            <section className="flex min-h-0 flex-col border-r border-white/[0.06] p-4">
              <label className="relative mb-3"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/22" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your cards" className="h-9 w-full bg-white/[0.035] pl-9 pr-3 text-[10px] text-white/70 outline-none ring-1 ring-white/[0.06]" /></label>
              <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
                {active ? <div className="grid grid-cols-6 gap-2">{cards.map((card) => <MiniCard key={card.id} card={card} selected={selectedIds.includes(card.id)} disabled={myConfirmed} onClick={() => toggleCard(card)} />)}</div> : <div className="grid h-full min-h-[250px] place-items-center text-center text-[10px] text-white/28">Waiting for an accepted friend trade session.</div>}
              </div>
            </section>

            <aside className="flex min-h-0 flex-col p-4">
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
                {[{ title: 'Your Offer', cards: myOffer, confirmed: myConfirmed, mine: true }, { title: `${trade.partner.name}'s Offer`, cards: theirOffer, confirmed: theirConfirmed, mine: false }].map((column) => (
                  <section key={column.title} className="min-h-0 overflow-y-auto bg-white/[0.018] p-3 ring-1 ring-white/[0.05] [scrollbar-width:thin]">
                    <div className="mb-3 flex items-center justify-between"><span className="text-[8px] font-bold uppercase tracking-[.15em] text-white/35">{column.title}</span><span className={`text-[8px] ${column.confirmed ? 'text-emerald-200/70' : 'text-white/20'}`}>{column.confirmed ? 'Confirmed' : 'Open'}</span></div>
                    <div className="space-y-1.5">{column.cards.length ? column.cards.map((card) => <button key={card.id} onClick={column.mine ? () => toggleCard(card) : undefined} className="flex w-full items-center gap-2 bg-white/[0.025] px-2 py-2 text-left ring-1 ring-white/[0.045]"><Package className="h-3.5 w-3.5 text-white/25" /><span className="min-w-0 flex-1 truncate text-[9px] text-white/65">{nameOf(card)}</span><span className="text-[7px] text-white/22">{rarityOf(card)}</span></button>) : <div className="py-8 text-center text-[9px] text-white/18">No cards offered</div>}</div>
                  </section>
                ))}
              </div>

              <footer className="mt-3 flex items-center gap-2 border-t border-white/[0.055] pt-3">
                <button disabled={busy} onClick={handleClose} className="h-9 flex-1 bg-white/[0.035] text-[9px] font-bold uppercase tracking-[.12em] text-white/40 ring-1 ring-white/[0.06]">Cancel</button>
                {active && !myConfirmed && <button disabled={busy || !myOffer.length} onClick={() => run('confirm')} className="h-9 flex-[1.5] bg-cyan-100/[0.09] text-[9px] font-bold uppercase tracking-[.12em] text-cyan-50/75 ring-1 ring-cyan-100/20 disabled:opacity-30">Confirm Trade</button>}
                {active && myConfirmed && <button disabled={busy} onClick={() => run('unconfirm')} className="h-9 flex-[1.5] bg-emerald-100/[0.07] text-[9px] font-bold uppercase tracking-[.12em] text-emerald-50/65 ring-1 ring-emerald-100/15">{theirConfirmed ? 'Finalizing…' : 'Confirmed · Undo'}</button>}
              </footer>
            </aside>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
