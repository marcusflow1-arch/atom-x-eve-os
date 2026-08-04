import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search, Compass, Flame, Sparkles, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StreamerTile from '../aura/StreamerTile';
import GameStreamerHub from '../aura/GameStreamerHub';
import DiscoverHero from './DiscoverHero';
import DiscoverCategoryRail from './DiscoverCategoryRail';
import { getStreamersForGame, getDiscoverStreamers } from '../aura/streamerMockData';

const SORTS = [
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'viewers', label: 'Most Viewers', icon: Users },
  { id: 'rising', label: 'Rising', icon: Sparkles },
];

/** Ground-up Discover experience: featured channel, categories, live channel grid. */
export default function DiscoverHub() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [activeCategory, setActiveCategory] = useState(null);
  const [openGame, setOpenGame] = useState(null);

  useEffect(() => {
    let mounted = true;
    base44.entities.Game.list()
      .then((res) => {
        if (mounted) setGames(res?.data || res || []);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const categories = useMemo(() => {
    const source = games.slice(0, 14);
    return source.map((g) => {
      const list = getStreamersForGame(g, 4);
      return {
        title: g.title,
        image: g.cover_image || g.image || list[0]?.thumbnail,
        viewers: list.reduce((s, x) => s + x.viewers, 0),
        game: g,
      };
    });
  }, [games]);

  const channels = useMemo(() => {
    let list = games.length ? getDiscoverStreamers(games.slice(0, 14), 3) : getDiscoverStreamers([], 4);
    if (activeCategory) list = list.filter((s) => s.game === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) || s.game.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'viewers') return [...list].sort((a, b) => b.viewers - a.viewers);
    if (sortBy === 'rising') return [...list].sort((a, b) => a.uptimeMinutes - b.uptimeMinutes);
    return [...list].sort((a, b) => b.viewers + b.followers / 100 - (a.viewers + a.followers / 100));
  }, [games, activeCategory, search, sortBy]);

  const featured = channels[0];

  const openStreamer = (streamer) => {
    const match = categories.find((c) => c.title === streamer.game);
    setOpenGame(match?.game || { id: streamer.game, title: streamer.game, image: streamer.gameImage });
  };

  return (
    <div className="w-full min-h-full pt-20 pb-24 px-4 md:px-8 text-white">
      <div className="max-w-[1800px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-black tracking-wide">Discover</h1>
              <p className="text-white/40 text-xs">Find your next favourite channel</p>
            </div>
          </div>

          <div className="relative ml-auto w-full sm:w-[320px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels, games, tags..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-white/30 outline-none focus:border-cyan-400/40 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-28">
            <div className="w-8 h-8 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <DiscoverHero streamer={featured} onWatch={openStreamer} />

            {/* Categories */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-3">Browse Categories</h2>
              <DiscoverCategoryRail
                categories={categories}
                activeCategory={activeCategory}
                onSelect={setActiveCategory}
              />
            </section>

            {/* Live channels */}
            <section>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">
                  {activeCategory ? `Live · ${activeCategory}` : 'Live Channels'}
                </h2>
                <span className="text-white/30 text-xs">{channels.length} streaming now</span>
                <div className="ml-auto flex items-center gap-2">
                  {SORTS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setSortBy(id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition-all ${
                        sortBy === id
                          ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                          : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {channels.length === 0 ? (
                <div className="text-center py-20 text-white/50">No live channels match your search.</div>
              ) : (
                <div className="grid gap-x-5 gap-y-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {channels.map((s) => (
                    <StreamerTile key={s.id} streamer={s} onClick={openStreamer} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <AnimatePresence>
        {openGame && <GameStreamerHub game={openGame} onClose={() => setOpenGame(null)} />}
      </AnimatePresence>
    </div>
  );
}