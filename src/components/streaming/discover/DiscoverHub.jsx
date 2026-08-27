import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Users, Radio } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StreamerTile from '../aura/StreamerTile';
import DiscoverCategoryRail from './DiscoverCategoryRail';
import { getStreamersForGame, getDiscoverStreamers } from '../aura/streamerMockData';
import { createPageUrl } from '@/utils';

// Stable daily seed: the five creators change once every 24 hours, not on every render.
function dailySeed() {
  return Math.floor(Date.now() / 86400000);
}
function seededShuffle(items, seed) {
  const out = [...items];
  let s = Math.abs(seed) + 17;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Discover: PlayStation-style vertical genre crossbar + daily five-creator curation. */
export default function DiscoverHub() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [seed, setSeed] = useState(dailySeed());

  useEffect(() => {
    const timer = setInterval(() => setSeed(dailySeed()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    base44.entities.Game.list()
      .then((res) => mounted && setGames(res?.data || res || []))
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const categories = useMemo(() => games.slice(0, 20).map((game) => {
    const all = getStreamersForGame(game, 50);
    return {
      title: game.title,
      image: game.cover_image || game.image || all[0]?.thumbnail,
      game,
      streamerCount: all.length,
    };
  }), [games]);

  useEffect(() => {
    if (!activeCategory && categories.length) setActiveCategory(categories[0].title);
  }, [categories, activeCategory]);

  const activeGame = categories.find((c) => c.title === activeCategory)?.game;

  const streamers = useMemo(() => {
    const source = activeGame
      ? getStreamersForGame(activeGame, 100)
      : getDiscoverStreamers(games.slice(0, 20), 100);
    // Strict maximum of five featured creators per selected genre.
    return seededShuffle(source, seed + (activeCategory || 'all').split('').reduce((a, c) => a + c.charCodeAt(0), 0)).slice(0, 5);
  }, [activeGame, games, seed, activeCategory]);

  const openStreamer = (streamer) => {
    const params = new URLSearchParams();
    if (streamer?.id) params.set('streamerId', streamer.id);
    if (activeGame?.id) params.set('gameId', activeGame.id);
    if (activeGame?.title) params.set('gameTitle', activeGame.title);
    navigate(`${createPageUrl('StreamingHome')}?${params.toString()}`);
  };

  return (
    <div className="w-full min-h-full pt-20 pb-24 px-4 md:px-8 text-white">
      <div className="max-w-[1800px] mx-auto">
        <header className="mb-8 flex items-end justify-between">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-black tracking-wide">Discover</h1>
              <p className="text-white/40 text-xs">Daily curated creators by genre</p>
            </div>
          </div>
          <div className="text-[10px] tracking-widest uppercase text-white/30">5 featured creators · refreshes daily</div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-28"><div className="w-8 h-8 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" /></div>
        ) : (
          <div className="flex min-h-[calc(100vh-250px)]">
            <DiscoverCategoryRail categories={categories} activeCategory={activeCategory} onSelect={setActiveCategory} />
            <main className="flex-1 min-w-0 pl-8 md:pl-12">
              <div className="mb-8 flex items-center gap-3">
                <Radio className="w-4 h-4 text-cyan-300" />
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider">{activeCategory || 'Live Streams'}</h2>
                  <p className="text-xs text-white/35">Five creators selected for today</p>
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs text-white/35"><Users className="w-3.5 h-3.5" /> {streamers.length} featured</div>
              </div>

              {streamers.length === 0 ? (
                <div className="py-24 text-center text-white/40">No active creators for this genre right now.</div>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                  {streamers.map((streamer) => <StreamerTile key={streamer.id} streamer={streamer} onClick={openStreamer} />)}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
