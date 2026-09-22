import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ChevronLeft,
  Gamepad2,
  GraduationCap,
  Layers3,
  Lock,
  Package,
  Search,
  Shield,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react';
import { libraryGames } from '@/components/dashboard/gamehub/mockLibraryData';
import { getEquipmentSlotLabel, itemFitsSlot } from './equipmentSlotRules';

const FILTERS = [
  { id: 'all', label: 'All', icon: Package },
  { id: 'companion', label: 'Companion', icon: UserRound },
  { id: 'ability', label: 'Ability', icon: Sparkles },
  { id: 'equipment', label: 'Equipment', icon: Shield },
  { id: 'aspect', label: 'Aspect', icon: Layers3 },
  { id: 'teacher', label: 'Teacher', icon: GraduationCap },
  { id: 'asc', label: 'A.S.C.', icon: Wrench },
];

const ASC_FILTERS = [
  { id: 'all', label: 'All A.S.C.' },
  { id: 'materials', label: 'Materials' },
];

const FALLBACK_GAME_META = {
  'Elder Scrolls: Reborn': {
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/306130/header.jpg',
    genre: 'RPG / Fantasy',
  },
  'Atom X Eve': {
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=900&h=500&fit=crop',
    genre: 'Action RPG',
  },
  'Vanguard Ops': {
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&h=500&fit=crop',
    genre: 'Shooter',
  },
  'Cyberpunk 2088': {
    image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=900&h=500&fit=crop',
    genre: 'Sci-Fi',
  },
};

const rarityClass = {
  Mythic: 'border-red-300/20 text-red-200/70',
  Mythical: 'border-red-300/20 text-red-200/70',
  Legendary: 'border-amber-300/20 text-amber-100/70',
  Epic: 'border-violet-300/20 text-violet-100/70',
  Rare: 'border-cyan-300/20 text-cyan-100/70',
  Uncommon: 'border-emerald-300/16 text-emerald-100/65',
  Common: 'border-white/[0.07] text-white/70',
};

const itemIdOf = (item) => item?.id || item?.itemId || item?.name;

const normalizeGame = (item) => {
  if (item?.game) return item.game;
  const compatibility = item?.genreCompatibility || [];
  if (compatibility.some((genre) => /mmo|fantasy|rpg/i.test(genre))) return 'Elder Scrolls: Reborn';
  if (compatibility.some((genre) => /shooter/i.test(genre))) return 'Vanguard Ops';
  if (compatibility.some((genre) => /sci-fi|scifi/i.test(genre))) return 'Cyberpunk 2088';
  return 'Atom X Eve';
};

const normalizeCategory = (item) => {
  const type = String(item?.inventoryCategory || item?.itemType || item?.type || '').toLowerCase();
  if (/companion|pet/.test(type)) return 'companion';
  if (/ability|skill/.test(type)) return 'ability';
  if (/aspect/.test(type)) return 'aspect';
  if (/teacher|trainer|mentor/.test(type)) return 'teacher';
  if (/material|resource|currency|consumable|artifact/.test(type)) return 'asc';
  if (/weapon|armor|equipment|gear/.test(type)) return 'equipment';
  return 'asc';
};

const normalizeAscKind = (item) => {
  const raw = `${item?.ascKind || ''} ${item?.type || ''} ${item?.itemType || ''} ${item?.subtype || ''}`.toLowerCase();
  if (/material|resource|ore|crystal|essence|catalyst|shard/.test(raw)) return 'materials';
  return 'other';
};

const normalizeItem = (item) => ({
  ...item,
  game: normalizeGame(item),
  inventoryCategory: normalizeCategory(item),
  ascKind: normalizeAscKind(item),
});

const gameTitleOf = (game) => game?.title || game?.name || game?.game_name || '';
const gameImageOf = (game) => game?.image || game?.banner_image || game?.cover_image || game?.cover || game?.thumb || '';
const gameGenreOf = (game) => game?.genre || game?.genres?.[0] || '';

export default function LunaSplitInventory({
  inventory = [],
  selectedSlotId = null,
  onEquipItem,
}) {
  const [browseMode, setBrowseMode] = useState('all');
  const [filter, setFilter] = useState('all');
  const [ascFilter, setAscFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);

  const items = useMemo(() => (inventory || []).map(normalizeItem), [inventory]);

  const gameMeta = useMemo(() => {
    const map = new Map();
    (libraryGames || []).forEach((game) => {
      const title = gameTitleOf(game);
      if (!title) return;
      map.set(title.toLowerCase(), {
        title,
        image: gameImageOf(game),
        genre: gameGenreOf(game),
      });
    });

    Object.entries(FALLBACK_GAME_META).forEach(([title, meta]) => {
      const key = title.toLowerCase();
      if (!map.has(key)) map.set(key, { title, ...meta });
    });
    return map;
  }, []);

  const categoryFilteredItems = useMemo(() => items.filter((item) => {
    if (filter !== 'all' && item.inventoryCategory !== filter) return false;
    if (filter === 'asc' && ascFilter !== 'all' && item.ascKind !== ascFilter) return false;
    return true;
  }), [items, filter, ascFilter]);

  const allItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return categoryFilteredItems.filter((item) => {
      if (!needle) return true;
      return [
        item.name,
        item.game,
        item.rarity,
        item.subtype,
        item.inventoryCategory,
        ...(item.genreCompatibility || []),
      ].filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
  }, [categoryFilteredItems, query]);

  const games = useMemo(() => {
    const byGame = new Map();
    categoryFilteredItems.forEach((item) => {
      const title = item.game || 'Unknown Game';
      if (!byGame.has(title)) byGame.set(title, []);
      byGame.get(title).push(item);
    });

    const needle = query.trim().toLowerCase();
    return [...byGame.entries()]
      .map(([title, gameItems]) => {
        const meta = gameMeta.get(title.toLowerCase()) || FALLBACK_GAME_META[title] || {};
        return {
          title,
          image: meta.image || gameItems.find((item) => item.game_image)?.game_image || '',
          genre: meta.genre || gameItems[0]?.genre || gameItems[0]?.genreCompatibility?.[0] || 'Game',
          items: gameItems,
        };
      })
      .filter((game) => !needle || game.title.toLowerCase().includes(needle))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [categoryFilteredItems, gameMeta, query]);

  const gameItems = useMemo(() => {
    if (!selectedGame) return [];
    return categoryFilteredItems.filter((item) => item.game === selectedGame);
  }, [categoryFilteredItems, selectedGame]);

  const visibleItems = selectedGame ? gameItems : allItems;
  const selectedGameMeta = selectedGame
    ? games.find((game) => game.title === selectedGame)
      || { title: selectedGame, ...(gameMeta.get(selectedGame.toLowerCase()) || {}) }
    : null;

  const targetLabel = selectedSlotId
    ? getEquipmentSlotLabel(selectedSlotId)
    : 'Choose a loadout slot';

  useEffect(() => {
    if (browseMode !== 'game') setSelectedGame(null);
  }, [browseMode]);

  useEffect(() => {
    if (selectedGame && !games.some((game) => game.title === selectedGame)) setSelectedGame(null);
  }, [games, selectedGame]);

  const resetGameBrowse = () => {
    setSelectedGame(null);
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden px-5 pb-5 pt-4"
      style={{
        background: 'linear-gradient(180deg, rgba(3,6,11,.94), rgba(6,10,17,.90))',
        backdropFilter: 'blur(14px) saturate(115%)',
        WebkitBackdropFilter: 'blur(14px) saturate(115%)',
        boxShadow: 'inset 1px 0 0 rgba(255,255,255,.035), inset -1px 0 0 rgba(255,255,255,.025)',
      }}
    >
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
      <div className="pointer-events-none absolute inset-x-12 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      <div className="pointer-events-none absolute inset-y-12 left-0 w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />
      <div className="pointer-events-none absolute inset-y-12 right-0 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-white/[0.045] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers3 className="h-3.5 w-3.5 text-white/80" />
              <span className="text-[8px] font-black uppercase tracking-[0.24em] text-white/75">Inventory</span>
            </div>
            <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-white">
              {selectedGame || 'Collection'}
            </h2>
            <p className="mt-0.5 text-[8px] text-white/60">
              {selectedGame ? `${gameItems.length} items from this game` : `${items.length} owned items`}
            </p>
          </div>

          <div className="border border-white/[0.055] bg-black/10 px-2.5 py-1.5 text-right">
            <p className="text-[6px] font-black uppercase tracking-[0.16em] text-white/55">Target</p>
            <p className={`mt-0.5 max-w-28 truncate text-[8px] font-semibold ${selectedSlotId ? 'text-cyan-100/62' : 'text-white/65'}`}>
              {targetLabel}
            </p>
          </div>
        </header>

        <div className="pt-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-[184px] grid-cols-2 border border-white/[0.05] bg-black/10 p-0.5">
              <button
                type="button"
                onClick={() => { setBrowseMode('all'); resetGameBrowse(); setQuery(''); }}
                className={`text-[7px] font-bold uppercase tracking-[0.1em] transition-all ${browseMode === 'all' ? 'bg-white/[0.065] text-white/68' : 'text-white/65 hover:text-white/85'}`}
              >
                All Items
              </button>
              <button
                type="button"
                onClick={() => { setBrowseMode('game'); resetGameBrowse(); setQuery(''); }}
                className={`text-[7px] font-bold uppercase tracking-[0.1em] transition-all ${browseMode === 'game' ? 'bg-white/[0.065] text-white/68' : 'text-white/25 hover:text-white/48'}`}
              >
                By Game
              </button>
            </div>

            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/20" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={browseMode === 'game' ? 'Search games' : 'Search items'}
                className="h-8 w-full border border-white/[0.05] bg-black/10 pl-8 pr-2 text-[9px] text-white/90 outline-none placeholder:text-white/18 focus:border-cyan-200/15"
              />
            </div>

            {selectedGame && (
              <button
                type="button"
                onClick={resetGameBrowse}
                className="flex h-8 items-center gap-1 border border-white/[0.05] bg-white/[0.02] px-2 text-[7px] font-bold uppercase tracking-[.1em] text-white/35 hover:text-white/60"
              >
                <ChevronLeft className="h-3 w-3" /> Games
              </button>
            )}
          </div>

          <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
            {FILTERS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                onClick={() => { setFilter(id); if (id !== 'asc') setAscFilter('all'); }}
                className={`flex h-7 shrink-0 items-center gap-1 border px-2 text-[7px] font-bold transition-all ${filter === id
                  ? 'border-cyan-200/16 bg-cyan-200/[0.055] text-cyan-100/65'
                  : 'border-white/[0.045] bg-white/[0.012] text-white/60 hover:bg-white/[0.035] hover:text-white/48'}`}
              >
                <Icon className="h-2.5 w-2.5" />
                {label}
              </button>
            ))}
          </div>

          {filter === 'asc' && (
            <div className="mt-1 flex gap-1.5 border-t border-white/[0.035] pt-2">
              {ASC_FILTERS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setAscFilter(entry.id)}
                  className={`border px-2 py-0.5 text-[6px] font-bold uppercase tracking-[.08em] ${ascFilter === entry.id
                    ? 'border-amber-200/16 bg-amber-200/[0.05] text-amber-100/55'
                    : 'border-white/[0.04] text-white/22'}`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pt-3 pr-1">
          {browseMode === 'game' && !selectedGame ? (
            games.length ? (
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))' }}>
                {games.map((game) => (
                  <motion.button
                    key={game.title}
                    type="button"
                    whileHover={{ y: -1 }}
                    onClick={() => { setSelectedGame(game.title); setQuery(''); }}
                    className="group relative h-[78px] overflow-hidden border border-white/[0.055] bg-black/10 text-left hover:border-white/[0.12]"
                  >
                    {game.image ? (
                      <img src={game.image} alt={game.title} className="absolute inset-0 h-full w-full object-cover opacity-38 transition-transform duration-300 group-hover:scale-[1.03] group-hover:opacity-48" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center"><Gamepad2 className="h-6 w-6 text-white/12" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080b10]/95 via-[#080b10]/55 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      <p className="truncate text-[8px] font-semibold text-white/76">{game.title}</p>
                      <p className="mt-0.5 text-[6px] uppercase tracking-[.08em] text-white/28">{game.items.length} items</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex h-full min-h-48 flex-col items-center justify-center border border-dashed border-white/[0.05] text-center">
                <Gamepad2 className="h-6 w-6 text-white/12" />
                <p className="mt-2 text-[8px] text-white/28">No games match that search.</p>
              </div>
            )
          ) : (
            <>
              {selectedGameMeta && (
                <div className="relative mb-2 h-16 overflow-hidden border border-white/[0.045] bg-black/10">
                  {selectedGameMeta.image && <img src={selectedGameMeta.image} alt={selectedGameMeta.title} className="absolute inset-0 h-full w-full object-cover opacity-32" />}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#080b10]/90 via-[#080b10]/52 to-transparent" />
                  <div className="relative flex h-full items-center px-3">
                    <div>
                      <div className="flex items-center gap-1 text-[6px] font-black uppercase tracking-[.14em] text-cyan-100/28">
                        <BookOpen className="h-2.5 w-2.5" /> Game Collection
                      </div>
                      <p className="mt-1 text-[10px] font-semibold text-white/75">{selectedGameMeta.title}</p>
                    </div>
                  </div>
                </div>
              )}

              {visibleItems.length ? (
                <div
                  className="grid justify-start gap-2"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 78px))' }}
                >
                  {visibleItems.map((item) => {
                    const id = itemIdOf(item);
                    const rarity = rarityClass[item.rarity] || rarityClass.Common;
                    const compatibleWithTarget = Boolean(selectedSlotId && itemFitsSlot(item, selectedSlotId));
                    const canEquip = compatibleWithTarget && typeof onEquipItem === 'function';

                    return (
                      <div
                        key={id}
                        className={`relative h-[104px] overflow-hidden border p-1.5 text-left ${compatibleWithTarget
                          ? 'border-white/[0.12] bg-black/35'
                          : 'border-white/[0.07] bg-black/30'}`}
                        title={item.name}
                      >
                        <div className="relative flex h-[45px] items-center justify-center border border-white/[0.06] bg-black/35">
                          {item.icon_url || item.icon ? (
                            <img src={item.icon_url || item.icon} alt={item.name} className="h-8 w-8 object-contain" />
                          ) : (
                            <Package className="h-4 w-4 text-white/55" />
                          )}
                          {item.quantity != null && (
                            <span className="absolute bottom-0.5 right-0.5 bg-black/75 px-1 text-[5px] font-mono text-white">x{item.quantity}</span>
                          )}
                          {!compatibleWithTarget && selectedSlotId && (
                            <span className="absolute left-0.5 top-0.5 flex h-4 w-4 items-center justify-center bg-black/75 text-white/70">
                              <Lock className="h-2 w-2" />
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-[7px] font-semibold text-white">{item.name}</p>
                        <div className="mt-0.5 flex items-center justify-between gap-1">
                          <span className={`truncate border px-1 py-0.5 text-[4.5px] font-black uppercase tracking-[.07em] ${rarity}`}>{item.rarity || 'Common'}</span>
                          <span className="text-[5px] uppercase text-white/70">{item.inventoryCategory === 'asc' ? 'A.S.C.' : item.inventoryCategory}</span>
                        </div>

                        <button
                          type="button"
                          disabled={!canEquip}
                          onClick={() => canEquip && onEquipItem(item)}
                          className="mt-1 flex h-[18px] w-full items-center justify-center border border-white/[0.10] bg-white/[0.06] text-[5.5px] font-black uppercase tracking-[0.10em] text-white transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:border-white/[0.04] disabled:bg-white/[0.02] disabled:text-white/30"
                          title={!selectedSlotId ? 'Choose a loadout slot first' : compatibleWithTarget ? `Equip ${item.name}` : 'Item does not fit selected slot'}
                        >
                          Equip
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full min-h-48 flex-col items-center justify-center border border-dashed border-white/[0.05] text-center">
                  <Package className="h-6 w-6 text-white/12" />
                  <p className="mt-2 text-[8px] text-white/28">No matching items.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
