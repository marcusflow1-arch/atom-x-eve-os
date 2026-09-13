import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import {
  ArrowLeftRight, Check, CheckCircle2, Clock, Gamepad2, Package,
  Search, ShieldCheck, X,
} from 'lucide-react';

const SLOT_LIMIT = 8;
const rarityTone = {
  Common: 'text-slate-300 bg-slate-300/5',
  Uncommon: 'text-emerald-200 bg-emerald-300/5',
  Rare: 'text-sky-200 bg-sky-300/5',
  Epic: 'text-violet-200 bg-violet-300/5',
  Legendary: 'text-amber-200 bg-amber-300/5',
  Mythic: 'text-fuchsia-200 bg-fuchsia-300/5',
  Unique: 'text-cyan-100 bg-cyan-200/5',
};

const resultData = (result) => result?.data || result || {};

function CardTile({ card, selected = false, disabled = false, onClick, compact = false }) {
  const rarity = card?.card_rarity || card?.rarity || 'Common';
  const name = card?.card_name || card?.name || 'Card';
  const image = card?.card_image || card?.image || '';
  const game = card?.game_name || card?.origin_game || '';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative overflow-hidden text-left transition-all ${compact ? 'min-h-[72px] p-2' : 'aspect-[3/4] p-2.5'} ${selected ? 'bg-white/[0.11]' : 'bg-white/[0.035] hover:bg-white/[0.07]'} ${disabled ? 'opacity-35 cursor-not-allowed' : ''}`}
      style={{
        border: selected ? '1px solid rgba(190,240,255,.34)' : '1px solid rgba(255,255,255,.075)',
        boxShadow: selected ? 'inset 0 1px 0 rgba(255,255,255,.14), 0 0 24px rgba(125,211,252,.08)' : 'inset 0 1px 0 rgba(255,255,255,.05)',
        clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)',
      }}
    >
      {image ? <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 transition-opacity group-hover:opacity-35" /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070b11] via-[#070b11]/72 to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-end">
        <span className={`mb-auto w-fit px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[.16em] ${rarityTone[rarity] || rarityTone.Common}`}>{rarity}</span>
        <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-white/90">{name}</p>
        {game && <p className="mt-1 truncate text-[7px] uppercase tracking-[.12em] text-white/28">{game}</p>}
        {selected && <span className="mt-1.5 flex items-center gap-1 text-[7px] font-bold uppercase tracking-[.12em] text-cyan-100/75"><Check className="h-2.5 w-2.5" /> In offer</span>}
      </div>
    </button>
  );
}

function OfferColumn({ title, cards, confirmed, mine, onRemove }) {
  return (
    <section className="min-h-0 flex-1">
      <header className="mb-2 flex items-center gap-2">
        <span className="text-[8px] font-bold uppercase tracking-[.18em] text-white/42">{title}</span>
        <span className="text-[8px] text-white/20">{cards.length}/{SLOT_LIMIT}</span>
        <span className={`ml-auto flex items-center gap-1 text-[8px] ${confirmed ? 'text-emerald-200/75' : 'text-white/24'}`}>
          {confirmed ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}{confirmed ? 'Confirmed' : 'Open'}
        </span>
      </header>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: SLOT_LIMIT }).map((_, index) => {
          const card = cards[index];
          return card ? (
            <CardTile key={card.id || index} card={card} compact onClick={mine ? () => onRemove?.(card) : undefined} />
          ) : (
            <div key={index} className="grid min-h-[72px] place-items-center border border-dashed border-white/[0.055] bg-white/[0.015] text-white/10"><Package className="h-3.5 w-3.5" /></div>
          );
        })}
      </div>
    </section>
  );
}

export default function FriendTradePanel({ friend, onClose, currentUser: providedUser }) {
  const { user: signedInUser } = useAuth();
  const currentUser = providedUser || signedInUser;
  const partnerId = friend?.friend_id || friend?.id;
  const [state, setState] = useState({ session: null, ownedCards: [], partner: null });
  const [selectedIds, setSelectedIds] = useState([]);
  const [gameFilter, setGameFilter] = useState('All Games');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const invoke = useCallback(async (action, extra = {}) => {
    if (!partnerId) throw new Error('This friend is not linked to a player account');
    const response = await base44.functions.invoke('friendCardTrade', { action, payload: { partnerId, ...extra } });
    const next = resultData(response);
    if (next?.error) throw new Error(next.error);
    setState(next);
    return next;
  }, [partnerId]);

  const refresh = useCallback(async () => {
    if (!currentUser?.id || !partnerId) return;
    try {
      const next = await invoke('getState');
      const session = next.session;
      const mine = session
        ? (session.initiator_id === currentUser.id ? session.initiator_offer_card_ids : session.recipient_offer_card_ids) || []
        : [];
      setSelectedIds(mine);
      setError('');
    } catch (e) {
      setError(e?.message || 'Trade data could not be loaded');
    }
  }, [currentUser?.id, partnerId, invoke]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!partnerId) return undefined;
    const unsubscribe = base44.entities.TradeSession.subscribe((event) => {
      const row = event?.data;
      if (!row) return;
      if ([row.initiator_id, row.recipient_id].includes(currentUser?.id) && [row.initiator_id, row.recipient_id].includes(partnerId)) refresh();
    });
    return unsubscribe;
  }, [partnerId, currentUser?.id, refresh]);

  const session = state.session;
  const isInitiator = session?.initiator_id === currentUser?.id;
  const myOffer = session ? (isInitiator ? session.initiator_offer_snapshot : session.recipient_offer_snapshot) || [] : [];
  const theirOffer = session ? (isInitiator ? session.recipient_offer_snapshot : session.initiator_offer_snapshot) || [] : [];
  const myConfirmed = session ? Boolean(isInitiator ? session.initiator_confirmed : session.recipient_confirmed) : false;
  const theirConfirmed = session ? Boolean(isInitiator ? session.recipient_confirmed : session.initiator_confirmed) : false;
  const pendingForMe = session?.status === 'pending' && session?.recipient_id === currentUser?.id;
  const waitingForFriend = session?.status === 'pending' && session?.initiator_id === currentUser?.id;
  const active = session?.status === 'accepted';
  const completed = session?.status === 'completed';

  const games = useMemo(() => ['All Games', ...Array.from(new Set((state.ownedCards || []).map((c) => c.game_name).filter(Boolean))).sort()], [state.ownedCards]);
  const cards = useMemo(() => (state.ownedCards || []).filter((card) => {
    if (gameFilter !== 'All Games' && card.game_name !== gameFilter) return false;
    if (search && !`${card.card_name} ${card.card_type} ${card.card_rarity}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [state.ownedCards, gameFilter, search]);

  const run = async (action, extra = {}) => {
    setBusy(true); setError('');
    try {
      const next = await invoke(action, extra);
      const nextSession = next.session;
      const mine = nextSession
        ? (nextSession.initiator_id === currentUser?.id ? nextSession.initiator_offer_card_ids : nextSession.recipient_offer_card_ids) || []
        : [];
      setSelectedIds(mine);
    } catch (e) { setError(e?.message || 'Trade action failed'); }
    finally { setBusy(false); }
  };

  const toggleCard = async (card) => {
    if (!active || myConfirmed || busy) return;
    const exists = selectedIds.includes(card.id);
    const next = exists ? selectedIds.filter((id) => id !== card.id) : [...selectedIds, card.id].slice(0, SLOT_LIMIT);
    setSelectedIds(next);
    await run('syncOffer', { cardIds: next });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
      className="fixed bottom-[52px] left-[320px] right-0 top-[64px] z-[71] flex min-h-0 flex-col overflow-hidden text-white"
      style={{ background: 'rgba(6,10,16,.72)', backdropFilter: 'blur(34px) saturate(135%)', WebkitBackdropFilter: 'blur(34px) saturate(135%)' }}
    >
      <header className="flex h-[66px] flex-shrink-0 items-center gap-3 border-b border-white/[0.065] px-5">
        <div className="grid h-8 w-8 place-items-center bg-white/[0.055]"><ArrowLeftRight className="h-3.5 w-3.5 text-cyan-100/70" /></div>
        <div><p className="text-[8px] font-bold uppercase tracking-[.22em] text-white/28">Friend Card Trade</p><h2 className="mt-0.5 text-sm font-semibold text-white/90">{friend?.name || state.partner?.name || 'Friend'}</h2></div>
        <div className="ml-auto flex items-center gap-2 text-[8px] uppercase tracking-[.14em] text-white/28"><ShieldCheck className="h-3.5 w-3.5" /> Live Card Inventory</div>
        <button onClick={onClose} className="ml-2 grid h-8 w-8 place-items-center text-white/35 transition hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4" /></button>
      </header>

      {error && <div className="mx-5 mt-3 border-l border-red-300/35 bg-red-300/[0.035] px-3 py-2 text-[10px] text-red-100/75">{error}</div>}

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)] gap-0">
        <section className="flex min-h-0 flex-col border-r border-white/[0.055] px-5 py-4">
          <div className="mb-3 flex items-center gap-2"><Gamepad2 className="h-3.5 w-3.5 text-white/35" /><span className="text-[9px] font-bold uppercase tracking-[.18em] text-white/44">Your Cards</span><span className="text-[9px] text-white/20">{state.ownedCards?.length || 0} tradeable</span></div>
          <div className="mb-4 flex gap-2">
            <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)} className="h-9 min-w-[190px] bg-white/[0.04] px-3 text-[10px] text-white/70 outline-none ring-1 ring-white/[0.07]">{games.map((game) => <option key={game} value={game} className="bg-[#0a0f17]">{game}</option>)}</select>
            <label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cards" className="h-9 w-full bg-white/[0.035] pl-9 pr-3 text-[10px] text-white/75 outline-none ring-1 ring-white/[0.065] placeholder:text-white/20" /></label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {!active ? (
              <div className="grid h-full min-h-[240px] place-items-center text-center"><div><ArrowLeftRight className="mx-auto h-7 w-7 text-white/12" /><p className="mt-3 text-sm font-medium text-white/55">{pendingForMe ? 'Trade request received' : waitingForFriend ? 'Trade request sent' : completed ? 'Trade complete' : 'Start a card trade'}</p><p className="mx-auto mt-1 max-w-sm text-[10px] leading-relaxed text-white/25">Cards come from the same UserCard inventory used by the Trading Post, Rewards inventory, purchases, and achievement unlocks.</p></div></div>
            ) : cards.length ? (
              <div className="grid grid-cols-4 gap-2 xl:grid-cols-5 2xl:grid-cols-6">{cards.map((card) => <CardTile key={card.id} card={card} selected={selectedIds.includes(card.id)} disabled={myConfirmed} onClick={() => toggleCard(card)} />)}</div>
            ) : <div className="py-16 text-center text-[10px] text-white/25">No tradeable cards match this filter.</div>}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col px-4 py-4">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-[8px] font-bold uppercase tracking-[.18em] text-white/28">Exchange</p><p className="mt-1 text-xs text-white/62">Both players confirm the same locked offer.</p></div><span className={`text-[8px] uppercase tracking-[.16em] ${active ? 'text-emerald-200/60' : 'text-white/20'}`}>{active ? 'Live' : session?.status || 'Idle'}</span></div>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto [scrollbar-width:thin]"><OfferColumn title="Your offer" cards={myOffer} confirmed={myConfirmed} mine onRemove={toggleCard} /><div className="h-px bg-white/[0.055]" /><OfferColumn title={`${friend?.name || 'Friend'}'s offer`} cards={theirOffer} confirmed={theirConfirmed} /></div>
          <div className="mt-4 border-t border-white/[0.055] pt-3">
            <AnimatePresence mode="wait">{completed && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 flex items-center gap-2 bg-emerald-200/[0.055] px-3 py-2 text-[9px] text-emerald-100/70"><CheckCircle2 className="h-3.5 w-3.5" /> Ownership transferred. Both inventories are updated.</motion.div>}</AnimatePresence>
            <div className="flex gap-2">
              {session && !completed && <button disabled={busy} onClick={() => run('cancel')} className="h-9 flex-1 bg-white/[0.035] text-[9px] font-bold uppercase tracking-[.14em] text-white/40 ring-1 ring-white/[0.065] transition hover:bg-white/[0.06] hover:text-white/70">Cancel</button>}
              {!session && <button disabled={busy || !partnerId} onClick={() => run('start')} className="h-9 flex-[2] bg-cyan-100/[0.09] text-[9px] font-bold uppercase tracking-[.14em] text-cyan-50/80 ring-1 ring-cyan-100/20 transition hover:bg-cyan-100/[0.14]">{busy ? 'Starting…' : 'Start Trade'}</button>}
              {pendingForMe && <button disabled={busy} onClick={() => run('accept')} className="h-9 flex-[2] bg-cyan-100/[0.09] text-[9px] font-bold uppercase tracking-[.14em] text-cyan-50/80 ring-1 ring-cyan-100/20">Accept Trade</button>}
              {waitingForFriend && <button disabled className="h-9 flex-[2] bg-white/[0.025] text-[9px] font-bold uppercase tracking-[.14em] text-white/24 ring-1 ring-white/[0.05]">Waiting for Friend</button>}
              {active && !myConfirmed && <button disabled={busy || !myOffer.length} onClick={() => run('confirm')} className="h-9 flex-[2] bg-emerald-200/[0.09] text-[9px] font-bold uppercase tracking-[.14em] text-emerald-50/80 ring-1 ring-emerald-100/20 disabled:opacity-30">Confirm Offer</button>}
              {active && myConfirmed && <button disabled={busy} onClick={() => run('unconfirm')} className="h-9 flex-[2] bg-white/[0.045] text-[9px] font-bold uppercase tracking-[.14em] text-white/55 ring-1 ring-white/[0.07]">{theirConfirmed ? 'Finalizing…' : 'Confirmed · Undo'}</button>}
              {completed && <button onClick={onClose} className="h-9 flex-1 bg-white/[0.04] text-[9px] font-bold uppercase tracking-[.14em] text-white/55 ring-1 ring-white/[0.07]">Close</button>}
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
