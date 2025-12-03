import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import {
  ShoppingCart, Search, Filter, Star, Trophy, Sword, Package, Zap, Bot,
  Eye, Download, Play, Gamepad2, Sparkles, Coins, Lock, Crown, Flame, ChevronRight, Shield,
  Mic, MicOff, SlidersHorizontal, Grid, List, TrendingUp, Clock, Gift, X, ArrowRight, 
  Cpu, Activity, ThumbsUp, Monitor, Share2, BarChart3, PieChart, Tag, Hash, Globe,
  Timer, Gem
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/auth/AuthContext';
import { Game } from '@/entities/Game';
import { createPageUrl } from '@/utils';
import { aiGames, otherSampleGames } from '../components/store/mockData';
import HeroScrollBox from '../components/store/HeroScrollBox';

// --- Gamified Visual Components ---

const StoreLevelBar = ({ level = 5, xp = 750, nextLevelXp = 1000 }) => (
  <div className="bg-slate-900/80 border border-slate-700 p-3 rounded-lg flex items-center gap-4 min-w-[200px]">
    <div className="relative">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center border-2 border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
        <span className="text-xl font-black text-white">{level}</span>
      </div>
      <div className="absolute -bottom-1 -right-1 bg-slate-900 text-[10px] text-slate-400 px-1 rounded border border-slate-700">
        LVL
      </div>
    </div>
    <div className="flex-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-yellow-400 font-bold uppercase tracking-wider">Store Rank</span>
        <span className="text-slate-400 font-mono">{xp} / {nextLevelXp} XP</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(xp / nextLevelXp) * 100}%` }}
          className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
        />
      </div>
    </div>
  </div>
);

const DailyMissionCard = ({ title, reward, progress, total, icon: Icon }) => (
  <div className="bg-slate-900/60 border border-slate-700/50 hover:border-blue-500/50 transition-colors p-3 rounded-lg flex items-center gap-3 group cursor-pointer">
    <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
      <Icon className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-xs font-bold text-slate-200 uppercase">{title}</h4>
        <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400 bg-yellow-500/5 px-1 py-0">
          +{reward} XP
        </Badge>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500" style={{ width: `${(progress / total) * 100}%` }} />
      </div>
    </div>
  </div>
);

const CurrencyDisplay = ({ amount, type = 'credits' }) => (
  <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-full border border-slate-800">
    {type === 'credits' ? <Coins className="w-4 h-4 text-yellow-400" /> : <Gem className="w-4 h-4 text-purple-400" />}
    <span className="font-mono font-bold text-white">{amount.toLocaleString()}</span>
  </div>
);

// --- Main Store Component ---

export default function Store() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const { cartCount, addToCart } = useCart();
  const { user } = useAuth();

  // "Holographic" tilt effect state for cards
  const [hoveredCard, setHoveredCard] = useState(null);

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
      const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === 'all' || game.genre?.toLowerCase() === selectedGenre.toLowerCase();
      return matchesSearch && matchesGenre;
    });
  }, [games, searchTerm, selectedGenre]);

  const genres = ['all', ...new Set(games.map(g => g.genre).filter(Boolean))];

  return (
    <div className="min-h-screen bg-[#050b14] text-white overflow-hidden relative font-sans selection:bg-blue-500/30">
      {/* Background Grid & Ambient Light */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-900/20 via-purple-900/10 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-[#050b14] via-[#050b14]/80 to-transparent"></div>
        
        {/* Animated Grid Lines (CSS would be ideal, mocking with divs) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      </div>

      <div className="relative z-10 max-w-[1920px] mx-auto p-6 flex flex-col h-screen">
        
        {/* Top Bar: User Stats & Cart */}
        <header className="flex items-center justify-between mb-6 bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight italic text-white">
                NEXUS<span className="text-blue-500">STORE</span>
              </h1>
            </div>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            <StoreLevelBar level={7} xp={2450} nextLevelXp={3000} />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-3 hidden md:flex">
              <DailyMissionCard icon={Search} title="Discovery" reward={50} progress={1} total={5} />
              <DailyMissionCard icon={ShoppingCart} title="Big Spender" reward={150} progress={40} total={100} />
            </div>
            
            <div className="flex items-center gap-3">
              <CurrencyDisplay amount={12500} type="credits" />
              <CurrencyDisplay amount={450} type="gems" />
            </div>

            <div className="h-8 w-px bg-white/10 mx-2"></div>

            <Link to={createPageUrl('Cart')}>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0 relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                <ShoppingCart className="w-4 h-4 mr-2" />
                <span className="font-bold">CART</span>
                {cartCount > 0 && (
                  <Badge className="ml-2 bg-yellow-500 text-black hover:bg-yellow-400 font-bold">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-6 overflow-hidden">
          
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0 flex flex-col gap-2 overflow-y-auto pb-4 custom-scrollbar">
            <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/5 p-4 mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Marketplace</h3>
              <nav className="space-y-1">
                {[
                  { id: 'browse', icon: Grid, label: 'Browse Games' },
                  { id: 'deals', icon: Tag, label: 'Flash Deals', badge: 'HOT' },
                  { id: 'ai', icon: Bot, label: 'AI Enhanced' },
                  { id: 'loot', icon: Gift, label: 'Loot Boxes' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === item.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                    {item.badge && (
                      <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-500/30 animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/5 p-4 flex-1">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Genre Filter</h3>
               <div className="space-y-1">
                 {genres.map(genre => (
                   <button
                     key={genre}
                     onClick={() => setSelectedGenre(genre)}
                     className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                       selectedGenre === genre 
                         ? 'bg-white/10 text-white border border-white/10' 
                         : 'text-slate-400 hover:text-white hover:bg-white/5'
                     }`}
                   >
                     <span className="capitalize">{genre}</span>
                   </button>
                 ))}
               </div>
            </div>
          </aside>

          {/* Main Scrollable Content */}
          <main className="flex-1 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden flex flex-col">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-white/5 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search the matrix..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="border-white/10 bg-black/30 hover:bg-white/5 text-slate-400">
                  <Filter className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="border-white/10 bg-black/30 hover:bg-white/5 text-slate-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              
              {/* Hero Carousel (Mock) - Only show on 'Browse' */}
              {activeTab === 'browse' && !searchTerm && (
                <div className="mb-10 relative group rounded-2xl overflow-hidden aspect-[21/9] border border-white/10 shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1542751371-331572b78519?w=1200&h=600&fit=crop" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    alt="Featured"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8 max-w-2xl">
                    <Badge className="bg-blue-600 text-white mb-4 hover:bg-blue-500 border-0">FEATURED RELEASE</Badge>
                    <h2 className="text-5xl font-black text-white mb-2 tracking-tight leading-tight drop-shadow-lg">
                      NEURAL RACING <span className="text-blue-500">CHAMPIONSHIP</span>
                    </h2>
                    <p className="text-slate-300 text-lg mb-6 line-clamp-2 drop-shadow-md">
                      Experience the next generation of high-speed combat racing with AI opponents that learn your every move.
                    </p>
                    <div className="flex gap-4">
                      <Button className="bg-white text-black hover:bg-slate-200 font-bold px-8 py-6 text-lg">
                        BUY NOW - $49.99
                      </Button>
                      <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-6 py-6 text-lg backdrop-blur-sm">
                        <Play className="w-5 h-5 mr-2" /> TRAILER
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  {activeTab === 'deals' ? 'Flash Deals' : activeTab === 'ai' ? 'AI Enhanced Games' : 'Trending Now'}
                </h2>
                <div className="flex gap-2">
                   <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">View All</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredGames.map((game, idx) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative bg-slate-800/30 rounded-xl border border-white/5 overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1"
                    onMouseEnter={() => setHoveredCard(game.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Image Area */}
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img 
                        src={game.cover_image || game.image} 
                        alt={game.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                      
                      {/* Quick Actions Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                         <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-lg shadow-blue-600/40" onClick={() => addToCart(game)}>
                           <ShoppingCart className="w-5 h-5" />
                         </Button>
                         <Button variant="secondary" className="bg-white text-black hover:bg-slate-200 rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-lg">
                           <Eye className="w-5 h-5" />
                         </Button>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {game.aiEnhanced && (
                          <Badge className="bg-purple-600/90 backdrop-blur-sm border-0 text-[10px] font-bold">
                            <Bot className="w-3 h-3 mr-1" /> AI
                          </Badge>
                        )}
                        {game.rating >= 4.8 && (
                          <Badge className="bg-yellow-500/90 backdrop-blur-sm text-black border-0 text-[10px] font-bold">
                            <Crown className="w-3 h-3 mr-1" /> TOP
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Info Area */}
                    <div className="p-4 relative bg-slate-900/80 backdrop-blur-md border-t border-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-white leading-tight line-clamp-1 group-hover:text-blue-400 transition-colors">
                          {game.title}
                        </h3>
                        <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded text-xs text-yellow-400 font-mono border border-white/5">
                          <Star className="w-3 h-3 fill-current" />
                          {game.rating}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
                        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{game.genre}</span>
                        {game.multiplayer && <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">MP</span>}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div>
                          {Math.random() > 0.7 && (
                            <span className="text-xs text-slate-500 line-through block -mb-1">${(game.price * 1.2).toFixed(2)}</span>
                          )}
                          <span className="text-lg font-bold text-green-400 font-mono">${game.price}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-slate-400 hover:text-white hover:bg-white/5 -mr-2"
                          onClick={() => addToCart(game)}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Progress Bar Decoration */}
                    <div className="absolute bottom-0 left-0 h-1 bg-blue-600 w-0 group-hover:w-full transition-all duration-500 ease-out"></div>
                  </motion.div>
                ))}
              </div>

              {filteredGames.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                    <Search className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No results found in the database.</p>
                    <Button variant="link" onClick={() => { setSearchTerm(''); setSelectedGenre('all'); }}>Clear Filters</Button>
                 </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}