import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowLeftRight,
  CalendarDays,
  ChevronRight,
  Coins,
  Gamepad2,
  Gem,
  Layers3,
  Loader2,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  Tag,
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

const rarityBorder = {
  Common: 'border-white/10',
  Uncommon: 'border-emerald-400/20',
  Rare: 'border-sky-400/25',
  Epic: 'border-violet-400/25',
  Legendary: 'border-amber-400/25',
  Mythic: 'border-rose-400/25',
  Mythical: 'border-rose-400/25',
  Unique: 'border-fuchsia-400/25',
  Limitless: 'border-white/25',
};

const softPanel = 'bg-white/[0.018] shadow-[0_18px_55px_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,255,255,.025)]';
const moonSurface = 'bg-[#d7dde5]/[0.035] hover:bg-[#d7dde5]/[0.055]';

function invoke(action, payload = {}) {
  return base44.functions.invoke('tradePostMarket', { action, payload });
}

function formatAGP(value) {
  return `${Number(value || 0).toLocaleString()} AGP`;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function sameText(a, b) {
  return normalize(a) === normalize(b);
}

function cardKey(game, name) {
  return `${normalize(game)}::${normalize(name)}`;
}

function unwrapRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  return [];
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
            Choose an unequipped card, set its AGP ask, and publish it. The card stays protected while the listing is active.
          </p>
        </div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.045] text-white/35 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {state.ownedCards?.length ? state.ownedCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setCardId(card.id)}
            className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${cardId === card.id ? 'bg-white/[0.09]' : 'bg-white/[0.025] hover:bg-white/[0.05]'}`}
          >
            <div className="h-12 w-10 overflow-hidden rounded-lg bg-black/20">
              {card.card_image && <img src={card.card_image} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-xs text-white">{card.card_name}</strong>
              <span className={`text-[8px] font-bold uppercase tracking-wider ${rarityTone[card.card_rarity] || rarityTone.Common}`}>
                {card.card_rarity || 'Common'} · {card.game_name || 'Collection'}
              </span>
            </div>
            {cardId === card.id && <ChevronRight className="h-4 w-4 text-white/70" />}
          </button>
        )) : (
          <div className="rounded-2xl bg-white/[0.025] p-5 text-xs leading-5 text-white/30">
            No cards are currently available to list. Equipped cards and cards already locked in trades stay protected.
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

function GameTile({ game, stats, onClick }) {
  const cover = game.cover_image || game.banner_image;
  return (
    <motion.button
      type="button"
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`group overflow-hidden rounded-[18px] border border-white/[0.055] text-left transition hover:border-white/[0.13] ${moonSurface}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0d0f12]">
        {cover ? (
          <img src={cover} alt={game.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,.16),transparent_34%),linear-gradient(145deg,#2b313a,#15181d)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-black/15 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[8px] font-black uppercase tracking-[.14em] text-white/70 backdrop-blur-md">
          {String(game.genre || 'other').replaceAll('_', ' ')}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-white">{game.title}</h3>
            <p className="mt-1 text-[9px] text-white/40">{game.original_year || 'Release year unavailable'}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-white/[0.06] px-1 py-3">
        <div className="px-3">
          <span className="block text-[7px] font-bold uppercase tracking-[.16em] text-white/25">Cards</span>
          <strong className="mt-0.5 block text-xs text-white/75">{stats.cardCount}</strong>
        </div>
        <div className="px-3">
          <span className="block text-[7px] font-bold uppercase tracking-[.16em] text-white/25">Live sellers</span>
          <strong className="mt-0.5 block text-xs text-white/75">{stats.sellerCount}</strong>
        </div>
      </div>
    </motion.button>
  );
}

function CardTile({ card, listings, onClick }) {
  const floor = listings.length ? Math.min(...listings.map((listing) => Number(listing.asking_price || 0)).filter((price) => price > 0)) : 0;
  return (
    <motion.button
      type="button"
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`group overflow-hidden rounded-[18px] border text-left transition ${moonSurface} ${rarityBorder[card.rarity] || rarityBorder.Common}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0d0f12]">
        {card.image ? (
          <img src={card.image} alt={card.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(125,211,252,.14),transparent_36%),linear-gradient(145deg,#30353d,#171a1f)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent" />
        <span className={`absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[8px] font-black uppercase tracking-[.13em] backdrop-blur-md ${rarityTone[card.rarity] || rarityTone.Common}`}>
          {card.rarity || 'Common'}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-white">{card.name}</h3>
            <p className="mt-1 truncate text-[9px] uppercase tracking-wider text-white/28">{card.type || card.series || 'Achievement Card'}</p>
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/25 group-hover:text-white/70" />
        </div>
        <div className="mt-4 grid grid-cols-2 rounded-xl bg-black/[0.11] p-1">
          <div className="px-2 py-2">
            <span className="block text-[7px] uppercase tracking-wider text-white/25">Sellers</span>
            <strong className="text-[11px] text-white/75">{listings.length}</strong>
          </div>
          <div className="px-2 py-2 text-right">
            <span className="block text-[7px] uppercase tracking-wider text-white/25">Floor</span>
            <strong className="text-[11px] text-white/75">{floor ? formatAGP(floor) : '—'}</strong>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function SellerRow({ listing, mine, busy, onBuy, onTrade, onCancel }) {
  const card = listing.card_snapshot || {};
  const seller = listing.seller || {};
  const avatar = seller.avatar_url || seller.avatar;
  return (
    <div className="grid gap-4 rounded-[16px] border border-white/[0.045] bg-[#d7dde5]/[0.025] p-4 transition hover:bg-[#d7dde5]/[0.04] md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white/[0.055] text-xs font-black text-white/65">
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : String(seller.name || 'P').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <strong className="truncate text-sm text-white/85">{seller.name || 'Player'}</strong>
            {mine && <span className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-wider text-cyan-200">You</span>}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-white/30">
            <span>Lv {card.level || 1}</span>
            <span>{card.stars || 1}★ stage</span>
            <span>{card.ascension || 0} ascend</span>
            <span>{Number(listing.views || 0).toLocaleString()} views</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <div className="text-left md:text-right">
          <span className="block text-[7px] font-black uppercase tracking-[.15em] text-white/25">Seller ask</span>
          <strong className="mt-0.5 block text-sm text-white">{formatAGP(listing.asking_price)}</strong>
        </div>
        {mine ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onCancel(listing)}
            className="h-10 rounded-xl bg-white/[0.05] px-4 text-[8px] font-black uppercase tracking-[.13em] text-rose-200 hover:bg-white/[0.08] disabled:opacity-30"
          >
            Remove
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onTrade(listing)}
              className="h-10 rounded-xl bg-white/[0.05] px-3 text-[8px] font-black uppercase tracking-[.13em] text-white/55 hover:text-white disabled:opacity-30"
            >
              <ArrowLeftRight className="mr-1 inline h-3 w-3" /> Trade
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onBuy(listing)}
              className="h-10 rounded-xl bg-white px-4 text-[8px] font-black uppercase tracking-[.13em] text-slate-950 disabled:opacity-30"
            >
              <ShoppingBag className="mr-1 inline h-3 w-3" /> Buy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TradingPostContent({ genreFilter, searchTerm }) {
  const [state, setState] = useState({ listings: [], ownedCards: [], balance: 0, userId: '' });
  const [catalogGames, setCatalogGames] = useState([]);
  const [masterCards, setMasterCards] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [showList, setShowList] = useState(false);

  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [gameSearch, setGameSearch] = useState('');
  const [gameGenre, setGameGenre] = useState('All');
  const [gameAvailability, setGameAvailability] = useState('all');
  const [gameSort, setGameSort] = useState('title');
  const [cardSearch, setCardSearch] = useState('');
  const [cardRarity, setCardRarity] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [marketResult, gamesResult, cardsResult, achievementsResult] = await Promise.allSettled([
        invoke('getState'),
        base44.entities.Game.list('title', 1000),
        base44.entities.TradingCard.list('name', 2000),
        base44.entities.Achievement.list('title', 2500),
      ]);

      if (marketResult.status === 'fulfilled') {
        const market = marketResult.value?.data || marketResult.value || { listings: [], ownedCards: [], balance: 0, userId: '' };
        setState(market);
      } else {
        setMessage({ type: 'error', text: marketResult.reason?.message || 'Trading Post market is unavailable.' });
      }

      if (gamesResult.status === 'fulfilled') {
        setCatalogGames(unwrapRows(gamesResult.value).filter((game) => game.status === 'available'));
      }
      if (cardsResult.status === 'fulfilled') setMasterCards(unwrapRows(cardsResult.value));
      if (achievementsResult.status === 'fulfilled') setAchievements(unwrapRows(achievementsResult.value));
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Trading Post data could not be loaded.' });
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

  const achievementById = useMemo(() => {
    const map = new Map();
    achievements.forEach((achievement) => map.set(String(achievement.id), achievement));
    return map;
  }, [achievements]);

  const cardCatalog = useMemo(() => {
    const map = new Map();

    const linkedAchievementIds = new Set();
    masterCards.forEach((card) => {
      const achievementId = String(card.achievement_id || '');
      const achievement = achievementById.get(achievementId);
      if (!achievement?.game) return;
      if (achievementId) linkedAchievementIds.add(achievementId);
      const key = cardKey(achievement.game, card.name);
      map.set(key, {
        id: card.id || key,
        name: card.name,
        description: card.description || achievement.description || '',
        image: card.image_url || achievement.icon || '',
        rarity: card.rarity || achievement.rarity || 'Common',
        series: card.series || '',
        type: achievement.category || 'Achievement',
        achievement: achievement.title || '',
        game: achievement.game,
      });
    });

    // Every achievement is a card in Atom X Eve. If a master TradingCard row
    // has not been authored yet, keep that achievement discoverable as a card
    // instead of hiding it from the game catalog.
    achievements.forEach((achievement) => {
      if (!achievement?.game || !achievement?.title || linkedAchievementIds.has(String(achievement.id))) return;
      const name = achievement.reward?.name || achievement.title;
      const key = cardKey(achievement.game, name);
      if (map.has(key)) return;
      map.set(key, {
        id: `achievement-${achievement.id || key}`,
        name,
        description: achievement.reward?.description || achievement.description || '',
        image: achievement.reward?.environment_thumbnail || achievement.icon || '',
        rarity: achievement.rarity || 'Common',
        series: '',
        type: achievement.category || 'Achievement',
        achievement: achievement.title,
        game: achievement.game,
      });
    });

    (state.ownedCards || []).forEach((card) => {
      if (!card?.game_name || !card?.card_name) return;
      const key = cardKey(card.game_name, card.card_name);
      if (map.has(key)) return;
      map.set(key, {
        id: card.trading_card_id || card.id || key,
        name: card.card_name,
        description: '',
        image: card.card_image || '',
        rarity: card.card_rarity || 'Common',
        series: '',
        type: card.card_type || 'Achievement',
        achievement: '',
        game: card.game_name,
      });
    });

    listings.forEach((listing) => {
      const snapshot = listing.card_snapshot || {};
      if (!snapshot.name || !snapshot.origin_game) return;
      const key = cardKey(snapshot.origin_game, snapshot.name);
      const current = map.get(key);
      map.set(key, {
        id: current?.id || key,
        name: snapshot.name,
        description: current?.description || '',
        image: current?.image || snapshot.image || '',
        rarity: current?.rarity || snapshot.rarity || 'Common',
        series: current?.series || '',
        type: current?.type || 'Achievement',
        achievement: current?.achievement || snapshot.origin_achievement || '',
        game: snapshot.origin_game,
      });
    });

    return [...map.values()];
  }, [masterCards, achievementById, achievements, state.ownedCards, listings]);

  const listingsByCard = useMemo(() => {
    const map = new Map();
    listings.forEach((listing) => {
      const snapshot = listing.card_snapshot || {};
      const key = cardKey(snapshot.origin_game, snapshot.name);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(listing);
    });
    return map;
  }, [listings]);

  const gameStats = useMemo(() => {
    const map = new Map();
    const ensure = (game) => {
      const key = normalize(game);
      if (!map.has(key)) map.set(key, { cards: new Set(), sellers: new Set() });
      return map.get(key);
    };

    cardCatalog.forEach((card) => ensure(card.game).cards.add(cardKey(card.game, card.name)));
    listings.forEach((listing) => {
      const snapshot = listing.card_snapshot || {};
      if (!snapshot.origin_game) return;
      const stats = ensure(snapshot.origin_game);
      stats.cards.add(cardKey(snapshot.origin_game, snapshot.name));
      if (listing.seller_id) stats.sellers.add(listing.seller_id);
    });
    return map;
  }, [cardCatalog, listings]);

  const genres = useMemo(() => ['All', ...new Set(catalogGames.map((game) => game.genre).filter(Boolean))], [catalogGames]);
  const genreCounts = useMemo(() => {
    const counts = new Map([['All', catalogGames.length]]);
    catalogGames.forEach((game) => counts.set(game.genre || 'other', (counts.get(game.genre || 'other') || 0) + 1));
    return counts;
  }, [catalogGames]);
  const rarities = useMemo(() => ['All', ...new Set(cardCatalog.map((card) => card.rarity).filter(Boolean))]
    .sort((a, b) => {
      if (a === 'All') return -1;
      if (b === 'All') return 1;
      return rarityOrder.indexOf(a) - rarityOrder.indexOf(b);
    }), [cardCatalog]);

  const filteredGames = useMemo(() => {
    const query = `${searchTerm || ''} ${gameSearch}`.trim().toLowerCase();
    const rows = catalogGames.filter((game) => {
      const stats = gameStats.get(normalize(game.title)) || { cards: new Set(), sellers: new Set() };
      const haystack = `${game.title || ''} ${game.genre || ''} ${(game.tags || []).join(' ')} ${game.original_year || ''}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (genreFilter && genreFilter !== 'All' && normalize(game.genre) !== normalize(genreFilter)) return false;
      if (gameGenre !== 'All' && game.genre !== gameGenre) return false;
      if (gameAvailability === 'cards' && stats.cards.size === 0) return false;
      if (gameAvailability === 'sellers' && stats.sellers.size === 0) return false;
      return true;
    });

    return [...rows].sort((a, b) => {
      const aStats = gameStats.get(normalize(a.title)) || { cards: new Set(), sellers: new Set() };
      const bStats = gameStats.get(normalize(b.title)) || { cards: new Set(), sellers: new Set() };
      if (gameSort === 'newest') return Number(b.original_year || 0) - Number(a.original_year || 0);
      if (gameSort === 'cards') return bStats.cards.size - aStats.cards.size;
      if (gameSort === 'sellers') return bStats.sellers.size - aStats.sellers.size;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
  }, [catalogGames, gameStats, searchTerm, gameSearch, genreFilter, gameGenre, gameAvailability, gameSort]);

  const gameCards = useMemo(() => {
    if (!selectedGame) return [];
    const query = cardSearch.trim().toLowerCase();
    return cardCatalog
      .filter((card) => sameText(card.game, selectedGame.title))
      .filter((card) => {
        const haystack = `${card.name || ''} ${card.rarity || ''} ${card.type || ''} ${card.series || ''} ${card.achievement || ''}`.toLowerCase();
        if (query && !haystack.includes(query)) return false;
        if (cardRarity !== 'All' && card.rarity !== cardRarity) return false;
        return true;
      })
      .sort((a, b) => {
        const aListings = listingsByCard.get(cardKey(a.game, a.name)) || [];
        const bListings = listingsByCard.get(cardKey(b.game, b.name)) || [];
        if (bListings.length !== aListings.length) return bListings.length - aListings.length;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
  }, [selectedGame, cardCatalog, cardSearch, cardRarity, listingsByCard]);

  const selectedCardListings = useMemo(() => {
    if (!selectedCard) return [];
    return [...(listingsByCard.get(cardKey(selectedCard.game, selectedCard.name)) || [])]
      .sort((a, b) => Number(a.asking_price || 0) - Number(b.asking_price || 0));
  }, [selectedCard, listingsByCard]);

  const marketMetrics = useMemo(() => {
    const prices = listings.map((listing) => Number(listing.asking_price || 0)).filter((price) => price > 0);
    return {
      games: catalogGames.length,
      cards: cardCatalog.length,
      sellers: new Set(listings.map((listing) => listing.seller_id).filter(Boolean)).size,
      floor: prices.length ? Math.min(...prices) : 0,
    };
  }, [catalogGames.length, cardCatalog.length, listings]);

  const openGame = (game) => {
    setSelectedGame(game);
    setSelectedCard(null);
    setCardSearch('');
    setCardRarity('All');
  };

  const backToGames = () => {
    setSelectedGame(null);
    setSelectedCard(null);
  };

  const backToCards = () => setSelectedCard(null);

  return (
    <div className="relative z-10 h-full w-full overflow-hidden bg-[#171a1f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(148,163,184,.13),transparent_31%),radial-gradient(circle_at_84%_12%,rgba(56,189,248,.07),transparent_30%),linear-gradient(180deg,#20242a_0%,#171a1f_48%,#14171b_100%)]" />

      <div className="relative h-full overflow-y-auto custom-scrollbar">
        <main className="mx-auto max-w-[1680px] px-5 pb-24 pt-5 md:px-8 lg:px-10">
          <section className={`rounded-[30px] p-5 md:p-6 ${softPanel}`}>
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.24em] text-cyan-200/60">
                  <Gamepad2 className="h-3.5 w-3.5" /> Console Game Trading Post
                </div>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">Find the game. Find the card. Choose the seller.</h1>
                <p className="mt-2 max-w-3xl text-xs leading-5 text-white/38">
                  Browse the available game catalog first, drill into that game's achievement cards, then compare the live players selling the exact card you want.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-2xl bg-black/[0.13] px-4 py-3">
                  <span className="block text-[7px] font-black uppercase tracking-[.16em] text-white/25">Wallet</span>
                  <strong className="mt-0.5 block text-sm text-white">{formatAGP(state.balance)}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setShowList(true)}
                  className="h-12 rounded-2xl bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] text-slate-950 transition hover:bg-slate-100"
                >
                  <Store className="mr-2 inline h-3.5 w-3.5" /> List a Card
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [Gamepad2, 'Available Games', marketMetrics.games.toLocaleString()],
                [Layers3, 'Tradeable Cards', marketMetrics.cards.toLocaleString()],
                [Users, 'Live Sellers', marketMetrics.sellers.toLocaleString()],
                [Gem, 'Market Floor', marketMetrics.floor ? formatAGP(marketMetrics.floor) : '—'],
              ].map(([Icon, label, value]) => (
                <div key={label} className="rounded-2xl bg-black/[0.10] px-4 py-3">
                  <div className="flex items-center gap-2 text-white/25"><Icon className="h-3.5 w-3.5" /><span className="text-[7px] font-black uppercase tracking-[.15em]">{label}</span></div>
                  <strong className="mt-1 block text-sm text-white/80">{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`mt-3 rounded-2xl px-4 py-3 text-xs ${message.type === 'error' ? 'bg-rose-300/[0.08] text-rose-100' : 'bg-emerald-300/[0.07] text-emerald-100'}`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          <section className={`mt-3 min-h-[520px] rounded-[30px] p-4 md:p-5 ${softPanel}`}>
            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.055] pb-4">
              <button
                type="button"
                onClick={backToGames}
                className={`rounded-xl px-3 py-2 text-[8px] font-black uppercase tracking-[.13em] transition ${!selectedGame ? 'bg-white/[0.09] text-white' : 'text-white/35 hover:bg-white/[0.04] hover:text-white/70'}`}
              >
                Games
              </button>
              {selectedGame && (
                <>
                  <ChevronRight className="h-3 w-3 text-white/20" />
                  <button
                    type="button"
                    onClick={backToCards}
                    className={`max-w-[260px] truncate rounded-xl px-3 py-2 text-[8px] font-black uppercase tracking-[.13em] transition ${!selectedCard ? 'bg-white/[0.09] text-white' : 'text-white/35 hover:bg-white/[0.04] hover:text-white/70'}`}
                  >
                    {selectedGame.title}
                  </button>
                </>
              )}
              {selectedCard && (
                <>
                  <ChevronRight className="h-3 w-3 text-white/20" />
                  <span className="max-w-[260px] truncate rounded-xl bg-white/[0.09] px-3 py-2 text-[8px] font-black uppercase tracking-[.13em] text-white">
                    {selectedCard.name} · Sellers
                  </span>
                </>
              )}
            </div>

            {loading ? (
              <div className="grid min-h-[430px] place-items-center text-center text-xs text-white/30">
                <div><Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />Loading Trading Post catalog…</div>
              </div>
            ) : !selectedGame ? (
              <div className="pt-4">
                <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_repeat(3,minmax(150px,210px))]">
                  <label className="flex min-w-0 items-center gap-2 rounded-2xl bg-black/[0.12] px-3">
                    <Search className="h-4 w-4 shrink-0 text-white/25" />
                    <input
                      value={gameSearch}
                      onChange={(event) => setGameSearch(event.target.value)}
                      placeholder="Search console games, genre, tags, year..."
                      className="h-11 min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/22"
                    />
                  </label>

                  <label className="relative flex items-center rounded-2xl bg-black/[0.12] px-3">
                    <SlidersHorizontal className="mr-2 h-3.5 w-3.5 text-white/25" />
                    <select value={gameGenre} onChange={(event) => setGameGenre(event.target.value)} className="h-11 w-full appearance-none bg-transparent text-[9px] font-bold uppercase tracking-wider text-white/60 outline-none">
                      {genres.map((genre) => <option key={genre} value={genre} className="bg-[#20242a]">{genre === 'All' ? 'All Genres' : String(genre).replaceAll('_', ' ')}</option>)}
                    </select>
                  </label>

                  <label className="flex items-center rounded-2xl bg-black/[0.12] px-3">
                    <Tag className="mr-2 h-3.5 w-3.5 text-white/25" />
                    <select value={gameAvailability} onChange={(event) => setGameAvailability(event.target.value)} className="h-11 w-full appearance-none bg-transparent text-[9px] font-bold uppercase tracking-wider text-white/60 outline-none">
                      <option value="all" className="bg-[#20242a]">All Games</option>
                      <option value="cards" className="bg-[#20242a]">Has Cards</option>
                      <option value="sellers" className="bg-[#20242a]">Live Sellers</option>
                    </select>
                  </label>

                  <label className="flex items-center rounded-2xl bg-black/[0.12] px-3">
                    <CalendarDays className="mr-2 h-3.5 w-3.5 text-white/25" />
                    <select value={gameSort} onChange={(event) => setGameSort(event.target.value)} className="h-11 w-full appearance-none bg-transparent text-[9px] font-bold uppercase tracking-wider text-white/60 outline-none">
                      <option value="title" className="bg-[#20242a]">A–Z</option>
                      <option value="newest" className="bg-[#20242a]">Newest</option>
                      <option value="cards" className="bg-[#20242a]">Most Cards</option>
                      <option value="sellers" className="bg-[#20242a]">Most Sellers</option>
                    </select>
                  </label>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-[.2em] text-white/25">Console Catalog</span>
                    <h2 className="mt-1 text-xl font-black tracking-tight text-white">Choose a game</h2>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/25">{filteredGames.length} game{filteredGames.length === 1 ? '' : 's'}</span>
                </div>

                {filteredGames.length ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {filteredGames.map((game) => {
                      const stats = gameStats.get(normalize(game.title)) || { cards: new Set(), sellers: new Set() };
                      return <GameTile key={game.id} game={game} stats={{ cardCount: stats.cards.size, sellerCount: stats.sellers.size }} onClick={() => openGame(game)} />;
                    })}
                  </div>
                ) : (
                  <div className="mt-4 grid min-h-72 place-items-center rounded-[24px] bg-black/[0.09] p-8 text-center">
                    <div><Gamepad2 className="mx-auto h-7 w-7 text-white/15" /><h3 className="mt-3 text-sm font-bold text-white/60">No games match these filters.</h3><p className="mt-2 text-xs text-white/25">Try another title, genre, or availability filter.</p></div>
                  </div>
                )}
              </div>
            ) : !selectedCard ? (
              <div className="pt-4">
                <div className="flex flex-col gap-4 rounded-[24px] bg-black/[0.10] p-4 md:flex-row md:items-center">
                  <button type="button" onClick={backToGames} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-white/45 hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-white/[0.05]">
                    {selectedGame.cover_image && <img src={selectedGame.cover_image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[8px] font-black uppercase tracking-[.2em] text-cyan-200/55">Card Catalog</span>
                    <h2 className="mt-1 truncate text-xl font-black text-white">{selectedGame.title}</h2>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-white/25">{String(selectedGame.genre || 'other').replaceAll('_', ' ')} · {selectedGame.original_year || 'Year unavailable'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-white/[0.035] px-4 py-2"><span className="block text-[7px] uppercase tracking-wider text-white/25">Cards</span><strong className="text-xs text-white/70">{(gameStats.get(normalize(selectedGame.title))?.cards.size || 0)}</strong></div>
                    <div className="rounded-xl bg-white/[0.035] px-4 py-2"><span className="block text-[7px] uppercase tracking-wider text-white/25">Sellers</span><strong className="text-xs text-white/70">{(gameStats.get(normalize(selectedGame.title))?.sellers.size || 0)}</strong></div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
                  <label className="flex min-w-0 items-center gap-2 rounded-2xl bg-black/[0.12] px-3">
                    <Search className="h-4 w-4 shrink-0 text-white/25" />
                    <input value={cardSearch} onChange={(event) => setCardSearch(event.target.value)} placeholder={`Search cards in ${selectedGame.title}...`} className="h-11 min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/22" />
                  </label>
                  <label className="flex items-center rounded-2xl bg-black/[0.12] px-3">
                    <Gem className="mr-2 h-3.5 w-3.5 text-white/25" />
                    <select value={cardRarity} onChange={(event) => setCardRarity(event.target.value)} className="h-11 w-full appearance-none bg-transparent text-[9px] font-bold uppercase tracking-wider text-white/60 outline-none">
                      {rarities.map((rarity) => <option key={rarity} value={rarity} className="bg-[#20242a]">{rarity === 'All' ? 'All Rarities' : rarity}</option>)}
                    </select>
                  </label>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div><span className="text-[8px] font-black uppercase tracking-[.2em] text-white/25">Achievement Cards</span><h3 className="mt-1 text-xl font-black tracking-tight text-white">Choose the card you want</h3></div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/25">{gameCards.length} card{gameCards.length === 1 ? '' : 's'}</span>
                </div>

                {gameCards.length ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {gameCards.map((card) => <CardTile key={card.id} card={card} listings={listingsByCard.get(cardKey(card.game, card.name)) || []} onClick={() => setSelectedCard(card)} />)}
                  </div>
                ) : (
                  <div className="mt-4 grid min-h-72 place-items-center rounded-[24px] bg-black/[0.09] p-8 text-center">
                    <div><Layers3 className="mx-auto h-7 w-7 text-white/15" /><h3 className="mt-3 text-sm font-bold text-white/60">No cards match this game view.</h3><p className="mt-2 max-w-md text-xs leading-5 text-white/25">This game is in the catalog, but no achievement cards matching your filters are currently registered.</p></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-4">
                <div className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
                  <aside className="overflow-hidden rounded-[24px] bg-black/[0.11]">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#0d0f12]">
                      {selectedCard.image ? <img src={selectedCard.image} alt={selectedCard.name} className="h-full w-full object-cover" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(125,211,252,.14),transparent_36%),linear-gradient(145deg,#30353d,#171a1f)]" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent" />
                    </div>
                    <div className="p-5">
                      <button type="button" onClick={backToCards} className="mb-4 flex items-center gap-2 text-[8px] font-black uppercase tracking-[.13em] text-white/35 hover:text-white"><ArrowLeft className="h-3 w-3" /> Back to cards</button>
                      <span className={`text-[8px] font-black uppercase tracking-[.16em] ${rarityTone[selectedCard.rarity] || rarityTone.Common}`}>{selectedCard.rarity || 'Common'}</span>
                      <h2 className="mt-1 text-xl font-black text-white">{selectedCard.name}</h2>
                      <p className="mt-1 text-[9px] uppercase tracking-wider text-white/28">{selectedCard.type || 'Achievement'} · {selectedGame.title}</p>
                      {selectedCard.description && <p className="mt-4 text-xs leading-5 text-white/35">{selectedCard.description}</p>}
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white/[0.035] px-3 py-2"><span className="block text-[7px] uppercase tracking-wider text-white/25">Sellers</span><strong className="text-xs text-white/70">{selectedCardListings.length}</strong></div>
                        <div className="rounded-xl bg-white/[0.035] px-3 py-2"><span className="block text-[7px] uppercase tracking-wider text-white/25">Floor</span><strong className="text-xs text-white/70">{selectedCardListings.length ? formatAGP(Math.min(...selectedCardListings.map((item) => Number(item.asking_price || 0)))) : '—'}</strong></div>
                      </div>
                    </div>
                  </aside>

                  <div className="min-w-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-[.2em] text-white/25">Live Market</span>
                        <h3 className="mt-1 text-xl font-black tracking-tight text-white">Choose a seller</h3>
                        <p className="mt-1 text-xs text-white/30">Sellers are ordered by asking price so the lowest live offer is easiest to compare first.</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/25">{selectedCardListings.length} seller{selectedCardListings.length === 1 ? '' : 's'}</span>
                    </div>

                    {selectedCardListings.length ? (
                      <div className="mt-4 space-y-2">
                        {selectedCardListings.map((listing) => (
                          <SellerRow
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
                      <div className="mt-4 grid min-h-72 place-items-center rounded-[24px] bg-black/[0.09] p-8 text-center">
                        <div><Users className="mx-auto h-7 w-7 text-white/15" /><h3 className="mt-3 text-sm font-bold text-white/60">No one is selling this card right now.</h3><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/25">The card remains discoverable in the game catalog. When a player lists one, the seller will appear here.</p></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="mt-3 grid gap-3 lg:grid-cols-3">
            <div className={`rounded-[22px] p-4 ${softPanel}`}><Gamepad2 className="h-4 w-4 text-cyan-200/60" /><h3 className="mt-3 text-xs font-black text-white/80">Game-first discovery</h3><p className="mt-1 text-[10px] leading-4 text-white/30">The complete available game catalog stays searchable even when a game has no current seller.</p></div>
            <div className={`rounded-[22px] p-4 ${softPanel}`}><ShieldCheck className="h-4 w-4 text-emerald-200/60" /><h3 className="mt-3 text-xs font-black text-white/80">Real seller listings</h3><p className="mt-1 text-[10px] leading-4 text-white/30">Seller rows come from active Trading Post listings, not generated marketplace placeholders.</p></div>
            <div className={`rounded-[22px] p-4 ${softPanel}`}><Sparkles className="h-4 w-4 text-violet-200/60" /><h3 className="mt-3 text-xs font-black text-white/80">Cards stay discoverable</h3><p className="mt-1 text-[10px] leading-4 text-white/30">Achievement-card metadata stays visible so players can find the exact card before waiting for a seller.</p></div>
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
