import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Check,
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
  Mythic: 'border-red-300/25 text-red-200/80',
  Mythical: 'border-red-300/25 text-red-200/80',
  Legendary: 'border-amber-300/25 text-amber-100/80',
  Epic: 'border-violet-300/25 text-violet-100/80',
  Rare: 'border-cyan-300/25 text-cyan-100/80',
  Uncommon: 'border-emerald-300/20 text-emerald-100/75',
  Common: 'border-white/10 text-white/45',
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
  onEquip,
  onUpgrade,
  onPreviewItem,
}) {
  const [browseMode, setBrowseMode] = useState('all');
  const [filter, setFilter] = useState('all');
  const [ascFilter, setAscFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [pinnedPreviewId, setPinnedPreviewId] = useState(null);

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

  const categoryFilteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter !== 'all' && item.inventoryCategory !== filter) return false;
      if (filter === 'asc' && ascFilter !== 'all' && item.ascKind !== ascFilter) return false;
      return true;
    });
  }, [items, filter, ascFilter]);

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

  useEffect(() => {
    if (!visibleItems.length) {
      setSelectedItemId(null);
      return;
    }
    if (!visibleItems.some((item) => itemIdOf(item) === selectedItemId)) {
      setSelectedItemId(itemIdOf(visibleItems[0]));
    }
  }, [visibleItems, selectedItemId]);

  useEffect(() => {
    if (browseMode !== 'game') setSelectedGame(null);
  }, [browseMode]);

  useEffect(() => {
    if (selectedGame && !games.some((game) => game.title === selectedGame)) {
      setSelectedGame(null);
    }
  }, [games, selectedGame]);

  const selectedItem = visibleItems.find((item) => itemIdOf(item) === selectedItemId) || null;
  const pinnedPreviewItem = visibleItems.find((item) => itemIdOf(item) === pinnedPreviewId) || null;
  const selectedGameMeta = selectedGame
    ? games.find((game) => game.title === selectedGame)
      || { title: selectedGame, ...(gameMeta.get(selectedGame.toLowerCase()) || {}) }
    : null;

  const targetLabel = selectedSlotId
    ? getEquipmentSlotLabel(selectedSlotId)
    : 'Choose a loadout slot';

  const selectedItemFitsTarget = Boolean(
    selectedSlotId && selectedItem && itemFitsSlot(selectedItem, selectedSlotId)
  );

  const resetGameBrowse = () => {
    setSelectedGame(null);
    setSelectedItemId(null);
    setPinnedPreviewId(null);
    onPreviewItem?.(null);
  };

  const previewItem = (item) => {
    onPreviewItem?.(item || null);
  };

  const pinItemPreview = (item) => {
    const id = itemIdOf(item);
    setSelectedItemId(id);
    setPinnedPreviewId(id);
    previewItem(item);
  };

  const restorePinnedPreview = () => {
    previewItem(pinnedPreviewItem);
  };

  return (
    <div className={`h-full w-full overflow-hidden ${narrow ? 'p-3' : 'p-5'}`}>
      <div
        className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-white/[0.09]"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.072), rgba(86,116,145,0.045) 44%, rgba(255,255,255,0.025))',
          backdropFilter: 'blur(34px) saturate(155%)',
          WebkitBackdropFilter: 'blur(34px) saturate(155%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(255,255,255,.025), 0 22px 70px rgba(0,0,0,.24)',
        }}
      >
        <div className="pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-cyan-200/[0.035] blur-3xl" />
        <div className="pointer-events-none absolute -right-12 bottom-8 h-48 w-48 rounded-full bg-blue-300/[0.03] blur-3xl" />

        <header className="relative z-10 flex items-start justify-between gap-3 border-b border-white/[0.055] px-5 pb-3 pt-5">
          <div>
            <div className="flex items-center gap-2">
              <Layers3 className="h-3.5 w-3.5 text-cyan-100/55" />
              <span className="text-[8px] font-black uppercase tracking-[0.24em] text-cyan-100/38">Inventory</span>
            </div>
            <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-white/90">
              {selectedGame ? selectedGame : 'Collection'}
            </h2>
            <p className="mt-1 text-[9px] text-white/28">
              {selectedGame ? `${gameItems.length} items from this game` : `${items.length} owned items`}
            </p>
          </div>

          <div className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-right">
            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-white/25">Target Slot</p>
            <p className={`mt-0.5 max-w-32 truncate text-[9px] font-semibold ${selectedSlotId ? 'text-cyan-100/75' : 'text-white/35'}`}>
              {targetLabel}
            </p>
          </div>
        </header>

        <div className="relative z-10 px-5 pt-3">
          <div className="grid grid-cols-2 rounded-xl border border-white/[0.06] bg-black/15 p-1">
            <button
              type="button"
              onClick={() => { setBrowseMode('all'); resetGameBrowse(); setQuery(''); }}
              className={`h-8 rounded-lg text-[9px] font-bold uppercase tracking-[0.12em] transition-all ${browseMode === 'all'
                ? 'bg-white/[0.09] text-white/80 shadow-inner'
                : 'text-white/28 hover:text-white/55'}`}
            >
              All Items
            </button>
            <button
              type="button"
              onClick={() => { setBrowseMode('game'); resetGameBrowse(); setQuery(''); }}
              className={`h-8 rounded-lg text-[9px] font-bold uppercase tracking-[0.12em] transition-all ${browseMode === 'game'
                ? 'bg-white/[0.09] text-white/80 shadow-inner'
                : 'text-white/28 hover:text-white/55'}`}
            >
              Browse by Game
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={browseMode === 'game' ? 'Search games — e.g. Elder Scrolls' : 'Search all items'}
                className="h-9 w-full rounded-xl border border-white/[0.07] bg-black/15 pl-9 pr-3 text-[10px] text-white/80 outline-none placeholder:text-white/22 focus:border-cyan-200/20 focus:bg-black/20"
              />
            </div>
            {selectedGame && (
              <button
                type="button"
                onClick={resetGameBrowse}
                className="flex h-9 items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-white/45 hover:bg-white/[0.05]"
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
                onClick={() => { setFilter(id); if (id !== 'asc') setAscFilter('all'); }}
                className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[8px] font-bold transition-all ${filter === id
                  ? 'border-cyan-200/20 bg-cyan-200/[0.08] text-cyan-100/75'
                  : 'border-white/[0.05] bg-white/[0.02] text-white/28 hover:bg-white/[0.05] hover:text-white/55'}`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>

          {filter === 'asc' && (
            <div className="mt-1 flex gap-1.5 border-t border-white/[0.045] pt-2">
              {ASC_FILTERS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setAscFilter(entry.id)}
                  className={`rounded-full border px-2.5 py-1 text-[7px] font-bold uppercase tracking-[0.1em] transition-all ${ascFilter === entry.id
                    ? 'border-amber-200/20 bg-amber-200/[0.07] text-amber-100/65'
                    : 'border-white/[0.05] text-white/25 hover:text-white/50'}`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 min-h-0 flex-1 px-5 pb-5 pt-3">
          {browseMode === 'game' && !selectedGame ? (
            <div className="h-full overflow-y-auto pr-1">
              {games.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {games.map((game) => (
                    <motion.button
                      key={game.title}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => { setSelectedGame(game.title); setQuery(''); }}
                      className="group relative h-28 overflow-hidden rounded-2xl border border-white/[0.07] bg-black/15 text-left transition-all hover:border-white/[0.15]"
                    >
                      {game.image ? (
                        <img src={game.image} alt={game.title} className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-60" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02]">
                          <Gamepad2 className="h-8 w-8 text-white/15" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080b10] via-[#080b10]/58 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="truncate text-[10px] font-semibold text-white/88">{game.title}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-[7px] uppercase tracking-[0.12em] text-white/35">{game.genre}</span>
                          <span className="rounded-full border border-white/[0.08] bg-black/30 px-2 py-0.5 text-[7px] text-white/50">{game.items.length} items</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.07] text-center">
                  <Gamepad2 className="h-7 w-7 text-white/16" />
                  <p className="mt-3 text-[10px] font-semibold text-white/38">No games match that search</p>
                  <p className="mt-1 text-[8px] text-white/20">Try a different game title or filter.</p>
                </div>
              )}
            </div>
          ) : (
            <div className={narrow ? 'flex h-full min-h-0 flex-col gap-2' : 'grid h-full min-h-0 grid-cols-[minmax(0,1fr)_176px] gap-3'}>
              <div className={narrow ? 'min-h-0 flex-1 overflow-y-auto pr-1' : 'min-h-0 overflow-y-auto pr-1'}>
                {selectedGameMeta && (
                  <div className="relative mb-3 h-24 overflow-hidden rounded-2xl border border-white/[0.07] bg-black/15">
                    {selectedGameMeta.image && <img src={selectedGameMeta.image} alt={selectedGameMeta.title} className="absolute inset-0 h-full w-full object-cover opacity-45" />}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#080b10]/95 via-[#080b10]/60 to-transparent" />
                    <div className="relative flex h-full items-center px-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-[7px] font-black uppercase tracking-[0.18em] text-cyan-100/38">
                          <BookOpen className="h-3 w-3" /> Game Collection
                        </div>
                        <p className="mt-1 text-[13px] font-semibold text-white/90">{selectedGameMeta.title}</p>
                        <p className="mt-1 text-[8px] text-white/35">{gameItems.length} matching items</p>
                      </div>
                    </div>
                  </div>
                )}

                {visibleItems.length ? (
                  <div className={narrow ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-3 gap-2.5'}>
                    {visibleItems.map((item) => {
                      const id = itemIdOf(item);
                      const selected = id === selectedItemId;
                      const rarity = rarityClass[item.rarity] || rarityClass.Common;
                      const compatibleWithTarget = !selectedSlotId || itemFitsSlot(item, selectedSlotId);
                      return (
                        <motion.button
                          key={id}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => setSelectedItemId(id)}
                          className={`group relative aspect-[1/1.08] overflow-hidden rounded-2xl border p-2.5 text-left transition-all ${selected
                            ? 'border-cyan-200/30 bg-cyan-200/[0.075] shadow-[0_0_24px_rgba(103,232,249,.07)]'
                            : 'border-white/[0.065] bg-black/15 hover:border-white/[0.12] hover:bg-white/[0.035]'} ${compatibleWithTarget ? '' : 'opacity-45'}`}
                        >
                          <div className="relative flex h-[62%] items-center justify-center rounded-xl border border-white/[0.04] bg-black/15">
                            {item.icon_url || item.icon ? (
                              <img src={item.icon_url || item.icon} alt={item.name} className="h-[72%] w-[72%] object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,.35)]" />
                            ) : (
                              <Package className="h-7 w-7 text-white/20" />
                            )}
                            {item.quantity != null && (
                              <span className="absolute bottom-1 right-1 rounded-md border border-white/[0.07] bg-black/55 px-1.5 py-0.5 text-[7px] font-mono text-white/55">x{item.quantity}</span>
                            )}
                            {!compatibleWithTarget && selectedSlotId && (
                              <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-md border border-white/[0.07] bg-black/55 text-white/35" title={`Does not fit ${targetLabel}`}>
                                <Lock className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </div>
                          <div className="mt-2 min-w-0">
                            <p className="truncate text-[9px] font-semibold text-white/78">{item.name}</p>
                            <div className="mt-1 flex items-center justify-between gap-1">
                              <span className={`truncate rounded-full border px-1.5 py-0.5 text-[6px] font-black uppercase tracking-[.12em] ${rarity}`}>{item.rarity || 'Common'}</span>
                              <span className="text-[7px] uppercase text-white/22">{item.inventoryCategory === 'asc' ? 'A.S.C.' : item.inventoryCategory}</span>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.07] text-center">
                    <Package className="h-7 w-7 text-white/16" />
                    <p className="mt-3 text-[10px] font-semibold text-white/38">No matching items</p>
                    <p className="mt-1 text-[8px] text-white/20">Change the category or search.</p>
                  </div>
                )}
              </div>

              {narrow ? (
                <aside
                  className="shrink-0 rounded-xl border border-white/[0.07] p-2.5"
                  style={{
                    background: 'linear-gradient(155deg, rgba(255,255,255,.052), rgba(255,255,255,.018))',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.055)',
                  }}
                >
                  {selectedItem ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/[0.055] bg-black/15">
                        {selectedItem.icon_url || selectedItem.icon ? (
                          <img src={selectedItem.icon_url || selectedItem.icon} alt={selectedItem.name} className="h-9 w-9 object-contain" />
                        ) : (
                          <Package className="h-5 w-5 text-white/20" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[9px] font-semibold text-white/78">{selectedItem.name}</p>
                        <p className="mt-0.5 truncate text-[7px] text-white/28">{selectedItem.rarity || 'Common'} · {selectedItem.level || selectedItem.levelRequirement || 1}</p>
                      </div>
                      {selectedItem.inventoryCategory === 'equipment' && (
                        <button
                          type="button"
                          onClick={() => onUpgrade?.(selectedItem)}
                          className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-violet-200/12 bg-violet-200/[0.055] px-2 text-[7px] font-black uppercase tracking-[.1em] text-violet-100/62"
                        >
                          <Wrench className="h-3 w-3" /> Upgrade
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-12 items-center justify-center text-[8px] text-white/25">Select an item</div>
                  )}
                </aside>
              ) : (
                <aside
                  className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.07] p-3"
                  style={{
                    background: 'linear-gradient(155deg, rgba(255,255,255,.052), rgba(255,255,255,.018))',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.055)',
                  }}
                >
                  {selectedItem ? (
                    <>
                      <div className="flex h-28 items-center justify-center rounded-xl border border-white/[0.055] bg-black/15">
                        {selectedItem.icon_url || selectedItem.icon ? (
                          <img src={selectedItem.icon_url || selectedItem.icon} alt={selectedItem.name} className="h-20 w-20 object-contain" />
                        ) : (
                          <Package className="h-8 w-8 text-white/20" />
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold leading-4 text-white/85">{selectedItem.name}</p>
                        <p className="mt-1 text-[8px] uppercase tracking-[.14em] text-white/28">
                          {selectedItem.inventoryCategory === 'asc' ? 'A.S.C.' : selectedItem.inventoryCategory}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-1.5">
                        <div className="rounded-lg border border-white/[0.05] bg-black/10 p-2">
                          <p className="text-[6px] uppercase tracking-[.15em] text-white/20">Rarity</p>
                          <p className="mt-1 truncate text-[8px] font-semibold text-white/60">{selectedItem.rarity || 'Common'}</p>
                        </div>
                        <div className="rounded-lg border border-white/[0.05] bg-black/10 p-2">
                          <p className="text-[6px] uppercase tracking-[.15em] text-white/20">Level</p>
                          <p className="mt-1 text-[8px] font-semibold text-white/60">{selectedItem.level || selectedItem.levelRequirement || 1}</p>
                        </div>
                      </div>

                      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                        <p className="text-[7px] font-black uppercase tracking-[.18em] text-white/22">Game</p>
                        <p className="mt-1 text-[8px] leading-3 text-white/50">{selectedItem.game}</p>
                        {selectedItem.inventoryCategory === 'asc' && selectedItem.ascKind === 'materials' && (
                          <div className="mt-3 rounded-xl border border-amber-200/[0.08] bg-amber-200/[0.025] p-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[7px] font-black uppercase tracking-[.16em] text-amber-100/40">Upgrade Material</p>
                              {selectedItem.quantity != null && <span className="text-[8px] font-mono text-amber-100/55">x{selectedItem.quantity}</span>}
                            </div>
                            <p className="mt-1 text-[7px] leading-3 text-white/30">Used by equipment upgrade systems.</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 grid gap-1.5">
                        {selectedSlotId && !selectedItemFitsTarget && (
                          <div className="flex items-center gap-1.5 rounded-lg border border-amber-200/[0.08] bg-amber-200/[0.025] px-2 py-2 text-[7px] leading-3 text-amber-100/45">
                            <Lock className="h-3 w-3 shrink-0" />
                            This item cannot be equipped in {targetLabel}.
                          </div>
                        )}
                        {selectedItem.inventoryCategory === 'equipment' && (
                          <button
                            type="button"
                            onClick={() => onUpgrade?.(selectedItem)}
                            className="flex h-9 items-center justify-center gap-2 rounded-xl border border-violet-200/15 bg-violet-200/[0.065] text-[8px] font-black uppercase tracking-[.13em] text-violet-100/70 transition-all hover:bg-violet-200/[0.11]"
                          >
                            <Wrench className="h-3 w-3" /> Upgrade
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!selectedSlotId || !selectedItemFitsTarget}
                          onClick={() => selectedSlotId && selectedItemFitsTarget && onEquip?.(selectedItem)}
                          className="flex h-9 items-center justify-center gap-2 rounded-xl border border-cyan-200/15 bg-cyan-200/[0.085] text-[8px] font-black uppercase tracking-[.13em] text-cyan-100/75 transition-all hover:bg-cyan-200/[0.13] disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-white/[0.025] disabled:text-white/22"
                        >
                          {selectedSlotId && !selectedItemFitsTarget ? <Lock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                          {!selectedSlotId ? 'Select Slot' : selectedItemFitsTarget ? 'Equip' : 'Wrong Slot'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <Package className="h-7 w-7 text-white/15" />
                      <p className="mt-3 text-[9px] text-white/28">Select an inventory item.</p>
                    </div>
                  )}
                </aside>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
