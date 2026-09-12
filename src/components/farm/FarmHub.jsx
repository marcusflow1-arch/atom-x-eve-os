import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crown, Flame, Gamepad2, Globe, Loader2, Mic, Search, Sparkles, Star, Swords, TrendingUp, X, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import FarmHubGameCard from './FarmHubGameCard';
import FarmHubFeaturedHero from './FarmHubFeaturedHero';

const GENRE_PILLS = [
  { id: 'all', label: 'All Games', icon: Globe },
  { id: 'mmorpg', label: 'MMORPG', icon: Crown },
  { id: 'rpg', label: 'RPG', icon: Swords },
  { id: 'shooting', label: 'Shooter', icon: Zap },
  { id: 'fighting', label: 'Fighting', icon: Flame },
  { id: 'action', label: 'Action', icon: TrendingUp },
  { id: 'adventure', label: 'Adventure', icon: Star },
  { id: 'survival', label: 'Survival', icon: Gamepad2 },
];

const normalizeGenre = (value) => String(value || 'other').trim().toLowerCase();
const imageFor = (game) => game.cover_image || game.banner_image || game.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&q=80';
const bannerFor = (game) => game.banner_image || game.cover_image || game.banner || game.image || imageFor(game);

export default function FarmHub({ games = [], onSelectGame }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('all');
  const [isListening, setIsListening] = useState(false);
  const [activityLoading, setActivityLoading] = useState(true);
  const [farmPosts, setFarmPosts] = useState([]);
  const [farmRoutes, setFarmRoutes] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [posts, routes] = await Promise.all([
          base44.entities.Post.filter({ is_farm_hub: true }, '-created_date', 500).catch(() => []),
          base44.entities.FarmRoute.list('-created_date', 500).catch(() => []),
        ]);
        if (!cancelled) {
          setFarmPosts((posts || []).filter((post) => post.status !== 'removed'));
          setFarmRoutes(routes || []);
        }
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.onresult = (event) => {
      setSearchQuery(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
    return () => recognitionRef.current?.stop?.();
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) recognitionRef.current.stop();
    else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const activityByTitle = useMemo(() => {
    const map = new Map();
    for (const post of farmPosts) {
      const key = String(post.game_title || '').trim().toLowerCase();
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [farmPosts]);

  const routesByGame = useMemo(() => {
    const map = new Map();
    for (const route of farmRoutes) {
      const key = String(route.game_id || route.gameId || '');
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [farmRoutes]);

  const displayGames = useMemo(() => games.map((game) => {
    const postCount = activityByTitle.get(String(game.title || '').trim().toLowerCase()) || 0;
    const routeCount = routesByGame.get(String(game.id)) || 0;
    return {
      ...game,
      image: imageFor(game),
      banner: bannerFor(game),
      genre: normalizeGenre(game.genre),
      postCount,
      routeCount,
      activityCount: postCount + routeCount,
    };
  }), [games, activityByTitle, routesByGame]);

  const filteredGames = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return displayGames.filter((game) => {
      const searchable = [game.title, game.genre, game.description, ...(Array.isArray(game.tags) ? game.tags : [])].join(' ').toLowerCase();
      const matchSearch = !query || searchable.includes(query);
      const matchGenre = activeGenre === 'all' || game.genre === activeGenre;
      return matchSearch && matchGenre;
    });
  }, [displayGames, searchQuery, activeGenre]);

  const rankedGames = useMemo(() => [...displayGames].sort((a, b) => {
    if (b.activityCount !== a.activityCount) return b.activityCount - a.activityCount;
    return String(a.title || '').localeCompare(String(b.title || ''));
  }), [displayGames]);

  const featuredGames = rankedGames.slice(0, 3);
  const trendingGames = rankedGames.slice(0, 6);
  const totalActivity = farmPosts.length + farmRoutes.length;
  const isLoading = !games.length && activityLoading;

  return (
    <div className="flex min-h-full flex-col pb-20">
      <div className="relative px-6 pb-8 pt-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-baseline gap-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">Farm Hub</h1>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/45 sm:inline">Community farming</span>
            </div>
            <p className="mt-1 text-base text-white/40">Find the game. Find the route. Get the grind done.</p>
          </div>

          <div className="flex items-center gap-5 text-sm text-white/45">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-300/60" />
              <span className="font-semibold text-cyan-200/80">{totalActivity}</span> farming entries
            </div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              <span className="font-semibold text-white/70">{games.length}</span> games
            </div>
          </div>
        </div>

        {!isLoading && featuredGames.length > 0 && <FarmHubFeaturedHero games={featuredGames} onSelect={onSelectGame} />}
      </div>

      <div
        className="sticky top-0 z-30 px-6 py-4 lg:px-8"
        style={{
          background: 'rgba(15, 20, 25, 0.76)',
          backdropFilter: 'blur(22px) saturate(150%)',
          WebkitBackdropFilter: 'blur(22px) saturate(150%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        }}
      >
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <Input
              className="h-10 w-full rounded-xl border-white/[0.08] bg-white/[0.06] pl-10 pr-10 text-sm text-white placeholder:text-white/25 transition-all focus:border-cyan-500/40 focus:bg-white/[0.08]"
              placeholder={isListening ? 'Listening...' : 'Search games, genres...'}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute right-10 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {recognitionRef.current && (
              <button type="button" onClick={toggleVoice} className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-all ${isListening ? 'bg-red-500/20 text-red-400' : 'text-white/30 hover:text-white/60'}`}>
                {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
          </div>

          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {GENRE_PILLS.map((pill) => {
              const Icon = pill.icon;
              const isActive = activeGenre === pill.id;
              return (
                <button
                  type="button"
                  key={pill.id}
                  onClick={() => setActiveGenre(pill.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${isActive ? 'border-white/[0.15] bg-white/[0.12] text-white shadow-[0_0_14px_rgba(100,180,255,0.06)]' : 'border-transparent text-white/40 hover:bg-white/[0.04] hover:text-white/70'}`}
                >
                  <Icon className="h-3.5 w-3.5" />{pill.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!isLoading && trendingGames.length > 0 && activeGenre === 'all' && !searchQuery && (
        <div className="px-6 pt-6 lg:px-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2"><Flame className="h-4 w-4 text-orange-400" /><h2 className="text-sm font-bold uppercase tracking-wider text-white/60">Trending Farms</h2></div>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {trendingGames.map((game) => (
              <button
                type="button"
                key={game.id}
                onClick={() => onSelectGame(game)}
                className="group flex flex-shrink-0 items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.035] px-4 py-3 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/15 hover:bg-white/[0.055] hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)]"
              >
                <img src={game.image} alt={game.title} className="h-10 w-10 rounded-lg object-cover" />
                <div>
                  <p className="max-w-[150px] truncate text-sm font-semibold text-white transition-colors group-hover:text-cyan-300">{game.title}</p>
                  <p className="mt-0.5 text-[11px] text-white/35">{game.activityCount} farming entries</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 pt-6 lg:px-8">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">
            {activeGenre === 'all' ? 'All Games' : GENRE_PILLS.find((pill) => pill.id === activeGenre)?.label || activeGenre}
            {searchQuery && ` — “${searchQuery}”`}
          </h2>
          <Badge variant="outline" className="border-white/10 text-[10px] text-white/30">{filteredGames.length}</Badge>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4"><Loader2 className="h-8 w-8 animate-spin text-white/20" /><p className="text-sm text-white/30">Loading games...</p></div>
          </div>
        ) : filteredGames.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredGames.map((game, index) => <FarmHubGameCard key={game.id} game={game} index={index} onClick={() => onSelectGame(game)} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-white/30">
            <Gamepad2 className="mb-4 h-14 w-14 opacity-30" />
            <p className="mb-1 text-lg font-semibold">No games found</p>
            <p className="mb-4 text-sm opacity-50">Try another search or genre.</p>
            <button type="button" onClick={() => { setSearchQuery(''); setActiveGenre('all'); }} className="text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
