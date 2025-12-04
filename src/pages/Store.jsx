import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, Filter, Star, Trophy, Play, Gamepad2, Coins, Crown, 
  ChevronLeft, ChevronRight, Heart, Share2, Monitor, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/auth/AuthContext';
import { Game } from '@/entities/Game';
import { createPageUrl } from '@/utils';
import { aiGames, otherSampleGames } from '../components/store/mockData';
import HeroScrollBox from '../components/store/HeroScrollBox';

// --- Luna-style Components ---

const GameCard = ({ game, addToCart, className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div
      className={`relative flex-shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group ${className}`}
      style={{ width: '280px', height: '160px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(createPageUrl(`GameDetail?id=${game.id}`))}
      whileHover={{ scale: 1.05, zIndex: 10 }}
    >
      <img
        src={game.cover_image || game.image}
        alt={game.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
      
      {/* Default View */}
      <div className="absolute bottom-0 left-0 p-4 w-full transition-opacity duration-300 group-hover:opacity-0">
        <h3 className="text-white font-bold text-base truncate">{game.title}</h3>
        <div className="flex items-center justify-between mt-1">
             <span className="text-xs text-slate-300">{game.genre}</span>
             {game.rating && (
                 <div className="flex items-center gap-1 text-xs text-yellow-400">
                     <Star className="w-3 h-3 fill-current" /> {game.rating}
                 </div>
             )}
        </div>
      </div>

      {/* Hover View */}
      <div className="absolute inset-0 flex flex-col justify-center items-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 backdrop-blur-[2px]">
        <h3 className="text-white font-bold text-lg text-center mb-2 leading-tight">{game.title}</h3>
        <div className="flex gap-2">
           <Button 
             size="sm" 
             className="bg-purple-600 hover:bg-purple-500 text-white rounded-full"
             onClick={(e) => { e.stopPropagation(); addToCart(game); }}
           >
             <ShoppingCart className="w-4 h-4" />
           </Button>
           <Button 
             size="sm" 
             variant="outline" 
             className="border-white/30 hover:bg-white/20 text-white rounded-full"
             onClick={(e) => { e.stopPropagation(); navigate(createPageUrl(`GameDetail?id=${game.id}`)); }}
           >
             <Play className="w-4 h-4" />
           </Button>
        </div>
        <span className="absolute bottom-3 right-4 font-mono text-green-400 font-bold">
            ${game.price}
        </span>
      </div>
    </motion.div>
  );
};

const GameRow = ({ title, games, addToCart }) => {
    const rowRef = useRef(null);

    const scroll = (direction) => {
        if (rowRef.current) {
            const { current } = rowRef;
            const scrollAmount = direction === 'left' ? -800 : 800;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!games || games.length === 0) return null;

    return (
        <div className="mb-10 relative group/row">
            <div className="flex items-center justify-between mb-4 px-12">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {title} <ChevronRight className="w-5 h-5 text-slate-500" />
                </h2>
            </div>

            <div className="relative px-12">
                <button 
                    onClick={() => scroll('left')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/50 hover:bg-purple-600/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 backdrop-blur-sm border border-white/10"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div 
                    ref={rowRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {games.map((game) => (
                        <GameCard key={game.id} game={game} addToCart={addToCart} />
                    ))}
                    {/* Spacer for right padding */}
                    <div className="w-8 flex-shrink-0" />
                </div>

                <button 
                    onClick={() => scroll('right')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/50 hover:bg-purple-600/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 backdrop-blur-sm border border-white/10"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

// --- Gamified Header Components (Mini) ---
const MiniLevelBar = ({ level, xp, nextLevelXp }) => (
    <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/20">
            {level}
        </div>
        <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-purple-400 to-indigo-400" 
                style={{ width: `${(xp / nextLevelXp) * 100}%` }} 
            />
        </div>
    </div>
);

export default function Store() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { cartCount, addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const fetchedGames = await Game.list();
        const enhancedGames = fetchedGames.length > 0 ? fetchedGames : [
          ...Object.values(aiGames),
          ...Object.values(otherSampleGames)
        ];
        setGames(enhancedGames);
      } catch (error) {
        console.error("Error fetching games:", error);
        setGames([...Object.values(aiGames), ...Object.values(otherSampleGames)]);
      }
      setLoading(false);
    };
    fetchGames();
  }, []);

  const filteredGames = useMemo(() => {
    return games.filter(game => {
      return game.title.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [games, searchTerm]);

  // Categorized Games
  const categories = useMemo(() => {
      const cats = {
          'Featured & Trending': filteredGames.filter(g => g.rating >= 4.7).slice(0, 8),
          'AI Enhanced': filteredGames.filter(g => g.aiEnhanced),
          'Action & RPG': filteredGames.filter(g => ['Action', 'RPG', 'Adventure'].includes(g.genre)),
          'Strategy & Sim': filteredGames.filter(g => ['Strategy', 'Simulation'].includes(g.genre)),
          'New Releases': filteredGames.slice(0, 6), // Mock 'new'
      };
      return cats;
  }, [filteredGames]);

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white overflow-x-hidden font-sans selection:bg-purple-500/30">
      {/* Global Styles for hiding scrollbar */}
      <style>{`
          .scrollbar-hide::-webkit-scrollbar {
              display: none;
          }
          .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
          }
      `}</style>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#0f0f13]/95 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">LUNA<span className="text-purple-400">STORE</span></span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
                <button className="text-white hover:text-purple-400 transition-colors">Home</button>
                <button className="hover:text-purple-400 transition-colors">Library</button>
                <button className="hover:text-purple-400 transition-colors">Channels</button>
                <button className="hover:text-purple-400 transition-colors">Playlists</button>
            </nav>
        </div>

        <div className="flex items-center gap-6">
            <div className="relative hidden md:block w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Search games..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800/50 border-none rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/50"
                />
            </div>

            <MiniLevelBar level={7} xp={2450} nextLevelXp={3000} />
            
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs font-mono font-bold">12,500</span>
                 </div>

                <Link to={createPageUrl('Cart')}>
                    <Button size="icon" variant="ghost" className="relative hover:bg-white/10 rounded-full">
                        <ShoppingCart className="w-5 h-5 text-slate-300" />
                        {cartCount > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#0f0f13]">
                                {cartCount}
                            </span>
                        )}
                    </Button>
                </Link>
            </div>
        </div>
      </header>

      <main className="pb-20">
          {/* Hero Section */}
          <div className="px-6 pt-6 pb-8">
               <HeroScrollBox />
          </div>

          {/* Game Rows */}
          <div className="space-y-2">
              {Object.entries(categories).map(([title, categoryGames]) => (
                  categoryGames.length > 0 && (
                      <GameRow 
                        key={title} 
                        title={title} 
                        games={categoryGames} 
                        addToCart={addToCart} 
                      />
                  )
              ))}
          </div>

          {/* All Games Grid (Fallback/Complete List) */}
          <div className="px-12 mt-12">
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <h2 className="text-2xl font-bold text-white">All Games</h2>
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-white/10 text-slate-300">
                          <Filter className="w-4 h-4 mr-2" /> Filter
                      </Button>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredGames.map(game => (
                      <GameCard 
                        key={game.id} 
                        game={game} 
                        addToCart={addToCart} 
                        className="w-full h-auto aspect-video" 
                      />
                  ))}
              </div>
              
              {filteredGames.length === 0 && (
                 <div className="text-center py-20">
                    <p className="text-slate-500">No games found matching your search.</p>
                 </div>
              )}
          </div>
      </main>
    </div>
  );
}