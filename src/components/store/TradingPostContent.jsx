import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowLeftRight,
  BadgeDollarSign,
  ChevronRight,
  Coins,
  Gem,
  Loader2,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Mythical', 'Unique', 'Limitless'];
const rarityTone = {
  Common: 'text-slate-300',
  Uncommon: 'text-emerald-300',
  Rare: 'text-sky-300',
  Epic: 'text-violet-300',
  Legendary: 'text-amber-300',
  Mythic: 'text-rose-300',
  Mythical: 'text-rose-300',
  Unique: 'text-fuchsia-300',
  Limitless: 'text-white',
};

const softPanel = 'bg-white/[0.028] shadow-[0_22px_70px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.035)]';

function invoke(action, payload = {}) {
  return base44.functions.invoke('tradePostMarket', { action, payload });
}

function formatAGP(value) {
  return `${Number(value || 0).toLocaleString()} AGP`;
}

function MarketCard({ listing, mine, onBuy, onTrade, onCancel, busy }) {
  const card = listing.card_snapshot || {};
  return (
    <article className={`group relative flex min-h-[318px] flex-col overflow-hidden rounded-[26px] ${softPanel}`}>
      <div className="relative h-40 overflow-hidden bg-[#20242b]">
        {card.image ? (
          <img
            src={card.image}
            alt={card.name || 'Achievement card'}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(125,211,252,.16),transparent_38%),linear-gradient(145deg,#30353d,#181b20)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1e23] via-transparent to-black/5" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full bg-black/35 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.16em] text-white/65 backdrop-blur-md">
            {card.origin_game || 'Atom X Eve'}
          </span>
          {mine && (
            <span className="rounded-full bg-white/85 px-2.5 py-1 text-[8px] font-black uppercase tracking-[.15em] text-slate-950">
              Yours
            </span>
          )}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className={`text-[9px] font-black uppercase tracking-[.17em] ${rarityTone[card.rarity] || rarityTone.Common}`}>
            {card.rarity || 'Common'} · Lv {card.level || 1} · {card.stars || 1}★
          </p>
          <h3 className="mt-1 truncate text-lg font-black tracking-tight text-white">
            {card.name || 'Achievement Card'}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[8px] font-bold uppercase tracking-[.18em] text-white/25">Holder</span>
            <p className="mt-1 truncate text-xs text-white/60">{listing.seller?.name || 'Player'}</p>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-bold uppercase tracking-[.18em] text-white/25">Market ask</span>
            <strong className="mt-1 block text-base text-white">{formatAGP(listing.asking_price)}</strong>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 rounded-2xl bg-black/[0.13] p-1">
          <div className="px-2 py-2.5">
            <span className="block text-[7px] uppercase tracking-wider text-white/25">Stage</span>
            <strong className="text-[11px] text-white/80">{card.stars || 1}</strong>
          </div>
          <div className="px-2 py-2.5">
            <span className="block text-[7px] uppercase tracking-wider text-white/25">Ascend</span>
            <strong className="text-[11px] text-white/80">{card.ascension || 0}</strong>
          </div>
          <div className="px-2 py-2.5">
            <span className="block text-[7px] uppercase tracking-wider text-white/25">Power</span>
            <strong className="text-[11px] text-white/80">{Number(listing.market_value_score || 0).toLocaleString()}</strong>
          </div>
        </div>

        <div className="mt-auto flex gap-2 pt-4">
          {mine ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onCancel(listing)}
              className="h-10 flex-1 rounded-xl bg-white/[0.05] text-[9px] font-bold uppercase tracking-[.14em] text-rose-200 transition hover:bg-white/[0.08] disabled:opacity-30"
            >
              Remove Listing
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => onTrade(listing)}
                className="h-10 rounded-xl bg-white/[0.045] px-3.5 text-[9px] font-bold uppercase tracking-[.13em] text-white/60 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-30"
              >
                <ArrowLeftRight className="mr-1 inline h-3 w-3" /> Trade
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onBuy(listing)}
                className="h-10 flex-1 rounded-xl bg-white text-[9px] font-black uppercase tracking-[.13em] text-slate-950 transition hover:bg-slate-100 disabled:opacity-30"
              >
                <ShoppingBag className="mr-1 inline h-3 w-3" /> Acquire
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function ListCardPanel({ state, onClose, onListed, busy }) {
  const [cardId, setCardId] = useState('');
  const [price, setPrice] = useState('');

  return (
    <motion.aside
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-y-4 right-4 z-50 w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-[30px] bg-[#202328]/95 p-6 shadow-[-26px_0_90px_rgba(0,0,0,.38)] backdrop-blur-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[8px] font-black uppercase tracking-[.24em] text-sky-200/65">Create Listing</span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Put a card on the market</h2>
          <p className="mt-2 text-xs leading-5 text-white/40">
            Choose an unequipped card, set its AGP ask, and publish it to the platform market. The card stays locked while listed.
          </p>
        </div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.045] text-white/35 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {state.ownedCards?.length ? (
          state.ownedCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setCardId(card.id)}
              className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                cardId === card.id ? 'bg-white/[0.09] shadow-[0_12px_35px_rgba(0,0,0,.18)]' : 'bg-white/[0.025] hover:bg-white/[0.05]'
              }`}
            >
              <div className="h-12 w-10 overflow-hidden rounded-lg bg-black/20">
                {card.card_image && <img src={card.card_image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-xs text-white">{card.card_name}</strong>
                <span className={`text-[8px] font-bold uppercase tracking-wider ${rarityTone[card.card_rarity] || rarityTone.Common}`}>
                  {card.card_rarity} · {card.game_name || 'Collection'}
                </span>
              </div>
              {cardId === card.id && <ChevronRight className="h-4 w-4 text-white/70" />}
            </button>
          ))
        ) : (
          <div className="rounded-2xl bg-white/[0.025] p-5 text-xs leading-5 text-white/30">
            No cards are currently available to list. Equipped cards and cards already locked in trades stay protected from market actions.
          </div>
        )}
      </div>

      <label className="mt-5 block">
        <span className="text-[8px] font-bold uppercase tracking-[.18em] text-white/30">Asking price</span>
        <div className="mt-2 flex items-center rounded-2xl bg-black/15 px-3">
          <Coins className="h-4 w-4 text-amber-200" />
          <input
            type="number"
            min="1"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="AGP"
            className="h-12 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/20"
          />
        </div>
      </label>

      <button
        type="button"
        disabled={busy || !cardId || !price}
        onClick={() => onListed(cardId, price)}
        className="mt-5 h-12 w-full rounded-2xl bg-white text-xs font-black uppercase tracking-[.16em] text-slate-950 disabled:opacity-25"
      >
        Publish Listing
      </button>
    </motion.aside>
  );
}

export default function TradingPostContent({ genreFilter, searchTerm }) {
  const [state, setState] = useState({ listings: [], ownedCards: [], balance: 0, userId: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [showList, setShowList] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [aisle, setAisle] = useState('All');
  const [scope, setScope] = useState('market');

  const load = useCallback(async () => {
    try {
      const response = await invoke('getState');
      setState(response?.data || response || { listings: [], ownedCards: [], balance: 0, userId: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Market unavailable' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = base44.entities.CardTrade?.subscribe?.(() => load());
    return () => unsub?.();
  }, [load]);

  const action = async (name, payload, success) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await invoke(name, payload);
      setState(response?.data || response);
      setMessage({ type: 'success', text: success });
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Trading Post action failed' });
    } finally {
      setBusy(false);
    }
  };

  const listings = state.listings || [];
  const games = useMemo(
    () => [...new Set(listings.map((listing) => listing.card_snapshot?.origin_game).filter(Boolean))],
    [listings],
  );
  const rarities = useMemo(
    () => [...new Set(listings.map((listing) => listing.card_snapshot?.rarity).filter(Boolean))]
      .sort((a, b) => rarityOrder.indexOf(b) - rarityOrder.indexOf(a)),
    [listings],
  );
  const query = `${searchTerm || ''} ${localSearch}`.trim().toLowerCase();

  const metrics = useMemo(() => {
    const prices = listings.map((listing) => Number(listing.asking_price || 0)).filter((price) => price > 0);
    const total = prices.reduce((sum, price) => sum + price, 0);
    return {
      floor: prices.length ? Math.min(...prices) : 0,
      average: prices.length ? Math.round(total / prices.length) : 0,
      listedValue: total,
      holders: new Set(listings.map((listing) => listing.seller_id).filter(Boolean)).size,
      rare: listings.filter((listing) => rarityOrder.indexOf(listing.card_snapshot?.rarity) >= 3).length,
      mine: listings.filter((listing) => listing.seller_id === state.userId).length,
    };
  }, [listings, state.userId]);

  const filtered = useMemo(() => listings.filter((listing) => {
    const card = listing.card_snapshot || {};
    const haystack = `${card.name || ''} ${card.origin_game || ''} ${card.rarity || ''} ${listing.seller?.name || ''}`.toLowerCase();
    if (scope === 'mine' && listing.seller_id !== state.userId) return false;
    if (query && !haystack.includes(query)) return false;
    if (genreFilter && genreFilter !== 'All' && !haystack.includes(String(genreFilter).toLowerCase())) return false;
    if (aisle !== 'All' && card.origin_game !== aisle && card.rarity !== aisle) return false;
    return true;
  }), [listings, scope, state.userId, query, genreFilter, aisle]);

  const marketFilters = ['All', ...games.slice(0, 6), ...rarities.slice(0, 3)];

  return (
    <div className="relative z-10 h-[calc(100vh-80px)] w-full overflow-hidden bg-[#171a1f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(148,163,184,.13),transparent_31%),radial-gradient(circle_at_84%_12%,rgba(56,189,248,.07),transparent_30%),linear-gradient(180deg,#20242a_0%,#171a1f_48%,#14171b_100%)]" />
      <div className="pointer-events-none absolute left-[8%] top-[-18%] h-[420px] w-[420px] rounded-full bg-white/[0.035] blur-[110px]" />

      <div className="relative h-full overflow-y-auto custom-scrollbar">
        <main className="mx-auto max-w-[1680px] px-5 pb-24 pt-7 md:px-8 lg:px-10">
          <section className={`relative overflow-hidden rounded-[34px] px-6 py-7 md:px-8 lg:px-10 lg:py-9 ${softPanel}`}>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.035),transparent_40%,rgba(56,189,248,.025))]" />
            <div className="relative grid gap-8 xl:grid-cols-[1fr_330px] xl:items-end">
              <div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.26em] text-sky-200/65">
                  <Activity className="h-3.5 w-3.5" /> Atom X Eve Universal Card Market
                </div>
                <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-.035em] text-white md:text-5xl lg:text-[58px] lg:leading-[.98]">
                  Trade the achievements you earned.
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-white/45 md:text-[15px]">
                  One market for achievement cards across the entire platform. Discover cards from other games, acquire them with AGP, or open a direct player-to-player trade without leaving Atom X Eve.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => { setScope('market'); document.getElementById('trade-market-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                    className="h-11 rounded-2xl bg-white px-5 text-[10px] font-black uppercase tracking-[.15em] text-slate-950"
                  >
                    Browse Market
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowList(true)}
                    className="h-11 rounded-2xl bg-white/[0.055] px-5 text-[10px] font-black uppercase tracking-[.15em] text-white/75 transition hover:bg-white/[0.085] hover:text-white"
                  >
                    <Store className="mr-2 inline h-3.5 w-3.5" /> List a Card
                  </button>
                </div>
              </div>

              <div className="rounded-[26px] bg-black/[0.13] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-[.2em] text-white/30">Market Wallet</span>
                    <strong className="mt-1 block text-2xl font-black text-white">{formatAGP(state.balance)}</strong>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.055]">
                    <Coins className="h-4 w-4 text-amber-200" />
                  </div>
                </div>
                <div className="mt-5 space-y-2 text-[9px] uppercase tracking-[.12em]">
                  <div className="flex items-center justify-between"><span className="text-white/30">Platform settlement</span><span className="font-bold text-emerald-200/80">AGP · Live</span></div>
                  <div className="flex items-center justify-between"><span className="text-white/30">Direct card transfer</span><span className="font-bold text-emerald-200/80">Live</span></div>
                  <div className="flex items-center justify-between"><span className="text-white/30">External asset bridge</span><span className="font-bold text-white/35">Not enabled</span></div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              [BadgeDollarSign, 'Floor Ask', formatAGP(metrics.floor)],
              [Activity, 'Average Ask', formatAGP(metrics.average)],
              [Gem, 'Listed Value', formatAGP(metrics.listedValue)],
              [Users, 'Active Holders', metrics.holders.toLocaleString()],
              [ShieldCheck, 'Sellable Cards', Number(state.ownedCards?.length || 0).toLocaleString()],
            ].map(([Icon, label, value]) => (
              <div key={label} className={`rounded-[22px] px-4 py-4 ${softPanel}`}>
                <div className="flex items-center gap-2 text-white/25"><Icon className="h-3.5 w-3.5" /><span className="text-[8px] font-black uppercase tracking-[.16em]">{label}</span></div>
                <strong className="mt-2 block truncate text-lg font-black text-white/85">{value}</strong>
              </div>
            ))}
          </section>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`mt-4 rounded-2xl px-4 py-3 text-xs shadow-[0_14px_40px_rgba(0,0,0,.2)] ${
                  message.type === 'error' ? 'bg-rose-300/[0.08] text-rose-100' : 'bg-emerald-300/[0.07] text-emerald-100'
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          <section id="trade-market-grid" className={`mt-4 rounded-[30px] p-4 md:p-5 ${softPanel}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-2 rounded-2xl bg-black/[0.12] p-1">
                <button
                  type="button"
                  onClick={() => setScope('market')}
                  className={`rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-[.14em] transition ${scope === 'market' ? 'bg-white/[0.09] text-white' : 'text-white/35 hover:text-white/65'}`}
                >
                  Market
                </button>
                <button
                  type="button"
                  onClick={() => setScope('mine')}
                  className={`rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-[.14em] transition ${scope === 'mine' ? 'bg-white/[0.09] text-white' : 'text-white/35 hover:text-white/65'}`}
                >
                  My Listings {metrics.mine ? `· ${metrics.mine}` : ''}
                </button>
              </div>

              <label className="flex min-w-0 items-center gap-2 rounded-2xl bg-black/[0.12] px-3 xl:w-[360px]">
                <Search className="h-4 w-4 shrink-0 text-white/25" />
                <input
                  value={localSearch}
                  onChange={(event) => setLocalSearch(event.target.value)}
                  placeholder="Search cards, games, rarity, players..."
                  className="h-11 min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/22"
                />
              </label>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {marketFilters.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAisle(value)}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-[8px] font-black uppercase tracking-[.13em] transition ${
                    aisle === value ? 'bg-white/[0.095] text-white' : 'bg-white/[0.025] text-white/30 hover:bg-white/[0.05] hover:text-white/60'
                  }`}
                >
                  {value === 'All' ? 'All Cards' : value}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <span className="text-[8px] font-black uppercase tracking-[.2em] text-white/25">Live Exchange</span>
                <h2 className="mt-1 text-xl font-black tracking-tight text-white">{scope === 'mine' ? 'Your active market positions' : 'Platform card market'}</h2>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/25">{filtered.length} listing{filtered.length === 1 ? '' : 's'}</span>
            </div>

            {loading ? (
              <div className="grid h-72 place-items-center text-center text-xs text-white/30">
                <div><Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />Loading market…</div>
              </div>
            ) : filtered.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filtered.map((listing) => (
                  <MarketCard
                    key={listing.id}
                    listing={listing}
                    mine={listing.seller_id === state.userId}
                    busy={busy}
                    onBuy={(item) => action('buyListing', { listingId: item.id }, `Acquired ${item.card_snapshot?.name || 'card'}.`)}
                    onTrade={(item) => action('openTrade', { listingId: item.id }, 'Direct trade request opened with this player.')}
                    onCancel={(item) => action('cancelListing', { listingId: item.id }, 'Listing removed and the card is available again.')}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 grid min-h-64 place-items-center rounded-[24px] bg-black/[0.09] p-8 text-center">
                <div>
                  <Sparkles className="mx-auto h-7 w-7 text-white/15" />
                  <h3 className="mt-3 text-sm font-bold text-white/60">No cards match this market view.</h3>
                  <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/25">
                    Change the filters or publish one of your available achievement cards to create a new market listing.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className={`rounded-[24px] p-5 ${softPanel}`}>
              <ArrowLeftRight className="h-4 w-4 text-sky-200/70" />
              <h3 className="mt-4 text-sm font-black text-white/85">Trade across games</h3>
              <p className="mt-2 text-xs leading-5 text-white/35">Cards unlocked in one game can enter the same platform market as cards earned somewhere else.</p>
            </div>
            <div className={`rounded-[24px] p-5 ${softPanel}`}>
              <ShieldCheck className="h-4 w-4 text-emerald-200/70" />
              <h3 className="mt-4 text-sm font-black text-white/85">Ownership moves with the trade</h3>
              <p className="mt-2 text-xs leading-5 text-white/35">The existing backend locks listed cards, transfers ownership on purchase, and keeps equipped cards out of market actions.</p>
            </div>
            <div className={`rounded-[24px] p-5 ${softPanel}`}>
              <Coins className="h-4 w-4 text-amber-200/70" />
              <h3 className="mt-4 text-sm font-black text-white/85">Built for future settlement rails</h3>
              <p className="mt-2 text-xs leading-5 text-white/35">AGP is the active in-platform settlement currency today. External crypto conversion is intentionally shown as unavailable until a real compliant bridge exists.</p>
            </div>
          </section>
        </main>
      </div>

      <AnimatePresence>
        {showList && (
          <ListCardPanel
            state={state}
            busy={busy}
            onClose={() => setShowList(false)}
            onListed={async (cardId, price) => {
              await action('listCard', { userCardId: cardId, price: Number(price) }, 'Your card is now live on the platform market.');
              setShowList(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
