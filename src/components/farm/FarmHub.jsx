import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, Filter, Users, Mic2, Gamepad2, X, Loader2, TrendingUp, Flame, Zap, Crown, ChevronRight, Globe, Swords, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import FarmHubGameCard from './FarmHubGameCard';
import FarmHubFeaturedHero from './FarmHubFeaturedHero';
import { useNavigate } from 'react-router-dom';

const GENRE_PILLS = [
{ id: 'all', label: 'All Games', icon: Globe },
{ id: 'mmorpg', label: 'MMORPG', icon: Crown },
{ id: 'rpg', label: 'RPG', icon: Swords },
{ id: 'shooting', label: 'Shooter', icon: Zap },
{ id: 'fighting', label: 'Fighting', icon: Flame },
{ id: 'action', label: 'Action', icon: TrendingUp },
{ id: 'adventure', label: 'Adventure', icon: Star },
{ id: 'survival', label: 'Survival', icon: Gamepad2 }];


export default function FarmHub({ onSelectGame }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('all');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['farmGames'],
    queryFn: async () => {
      const gamesList = await base44.entities.Game.list('-created_date', 100);
      return (gamesList || []).map((g) => ({
        id: g.id,
        title: g.title,
        genre: g.genre || 'other',
        activeUsers: Math.floor(Math.random() * 50000) + 500,
        voiceRooms: Math.floor(Math.random() * 100) + 5,
        image: g.cover_image || g.banner_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
        banner: g.banner_image || g.cover_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
        tags: g.tags || [],
        status: g.status,
        description: g.description || ''
      }));
    }
  });

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (e) => {setSearchQuery(e.results[0][0].transcript);setIsListening(false);};
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) recognitionRef.current.stop();else
    {recognitionRef.current.start();setIsListening(true);}
  };

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const matchSearch = !searchQuery || g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.genre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGenre = activeGenre === 'all' || g.genre === activeGenre;
      return matchSearch && matchGenre;
    });
  }, [games, searchQuery, activeGenre]);

  // Top 3 games by activeUsers for featured section
  const featuredGames = useMemo(() => {
    return [...games].sort((a, b) => b.activeUsers - a.activeUsers).slice(0, 3);
  }, [games]);

  const trendingGames = useMemo(() => {
    return [...games].sort((a, b) => b.voiceRooms - a.voiceRooms).slice(0, 6);
  }, [games]);

  const totalOnline = useMemo(() => games.reduce((s, g) => s + g.activeUsers, 0), [games]);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* ========== HERO SECTION ========== */}
      <div className="relative px-6 pt-6 pb-8">
        {/* Title + Stats Row */}
        <div className="flex items-end justify-between mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-baseline gap-4">
              <h1 className="text-4xl font-extrabold text-white tracking-tight">Farm Hub</h1>
              




              
            </div>
            <p className="text-white/40 text-base mt-1">Find your community. Join the harvest.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-green-400">{totalOnline.toLocaleString()}</span> online
            </div>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Gamepad2 className="w-4 h-4" />
              <span className="font-semibold text-white/70">{games.length}</span> games
            </div>
          </motion.div>
        </div>

        {/* Featured Games Carousel */}
        {!isLoading && featuredGames.length > 0 &&
        <FarmHubFeaturedHero games={featuredGames} onSelect={onSelectGame} />
        }
      </div>

      {/* ========== SEARCH + GENRE FILTERS ========== */}
      <div className="sticky top-16 z-30 px-6 py-4" style={{
        background: 'rgba(15, 20, 25, 0.7)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div className="flex items-center gap-4 max-w-[1600px] mx-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              className="w-full h-10 pl-10 pr-10 rounded-xl bg-white/[0.06] border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:border-cyan-500/40 focus:bg-white/[0.08] transition-all"
              placeholder={isListening ? 'Listening...' : 'Search games, genres...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} />
            
            {searchQuery &&
            <button onClick={() => setSearchQuery('')} className="absolute right-10 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                <X className="w-3.5 h-3.5" />
              </button>
            }
            <button onClick={toggleVoice} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-400' : 'text-white/30 hover:text-white/60'}`}>
              {isListening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Genre Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
            {GENRE_PILLS.map((pill) => {
              const isActive = activeGenre === pill.id;
              const Icon = pill.icon;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActiveGenre(pill.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive ?
                  'bg-white/[0.12] text-white border border-white/[0.15] shadow-[0_0_12px_rgba(255,255,255,0.06)]' :
                  'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent'}`
                  }>
                  
                  <Icon className="w-3.5 h-3.5" />
                  {pill.label}
                </button>);

            })}
          </div>
        </div>
      </div>

      {/* ========== TRENDING ROW ========== */}
      {!isLoading && trendingGames.length > 0 && activeGenre === 'all' && !searchQuery &&
      <div className="px-6 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider">Trending Now</h2>
            </div>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {trendingGames.map((game, i) =>
          <motion.button
            key={game.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectGame(game)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl flex-shrink-0 group transition-all duration-300 hover:shadow-[0_0_30px_rgba(100,150,255,0.1)]"
            style={{
              background: 'rgba(100, 120, 140, 0.10)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)'
            }}>
            
                <img src={game.image} alt={game.title} className="w-10 h-10 rounded-lg object-cover" />
                <div className="text-left">
                  <p className="text-white text-sm font-semibold group-hover:text-cyan-300 transition-colors truncate max-w-[140px]">{game.title}</p>
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {game.activeUsers.toLocaleString()}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors ml-2" />
              </motion.button>
          )}
          </div>
        </div>
      }

      {/* ========== MAIN GAME GRID ========== */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider">
            {activeGenre === 'all' ? 'All Games' : activeGenre}
            {searchQuery && ` — "${searchQuery}"`}
          </h2>
          <Badge variant="outline" className="text-[10px] text-white/30 border-white/10">{filteredGames.length}</Badge>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {isLoading ?
        <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
              <p className="text-white/30 text-sm">Loading games...</p>
            </div>
          </div> :
        filteredGames.length > 0 ?
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredGames.map((game, i) =>
          <FarmHubGameCard key={game.id} game={game} index={i} onClick={() => onSelectGame(game)} />
          )}
          </div> :

        <div className="flex flex-col items-center justify-center py-32 text-white/30">
            <Gamepad2 className="w-14 h-14 mb-4 opacity-30" />
            <p className="text-lg font-semibold mb-1">No games found</p>
            <p className="text-sm opacity-50 mb-4">Try adjusting your search or genre filter</p>
            <button onClick={() => {setSearchQuery('');setActiveGenre('all');}} className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
              Clear all filters
            </button>
          </div>
        }
      </div>
    </div>);

}