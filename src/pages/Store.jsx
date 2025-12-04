import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, Play, Gamepad2, Coins, ChevronLeft, ChevronRight, 
  Info, Plus, Volume2, VolumeX, Bell, User, Sword, Rocket, Brain, Trophy,
  Crosshair, Car, Ghost, Map, Sparkles, Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/auth/AuthContext';
import { Game } from '@/entities/Game';
import { createPageUrl } from '@/utils';
import { aiGames, otherSampleGames, trendingGames, newReleases, classicBestSellers } from '@/components/store/mockData';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// --- Liquid Glass & Apple-style Components ---

const GlassCard = ({ children, className = "", hoverEffect = true }) => (
  <div className={`
    relative overflow-hidden rounded-2xl
    bg-white/5 backdrop-blur-xl border border-white/10
    shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
    ${hoverEffect ? 'transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.6)] hover:-translate-y-1' : ''}
    ${className}
  `}>
    {children}
  </div>
);

const GameCard = ({ game, addToCart, index, onNavigate }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      className="relative flex-shrink-0 rounded-xl cursor-pointer group"
      style={{ width: '240px', height: '360px' }}
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "0px -50px 0px 0px" }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onNavigate(game.id)}
    >
      {/* Liquid Glass Container */}
      <div className={`
        absolute inset-0 rounded-xl overflow-hidden transition-all duration-500 ease-out
        ${isHovered ? 'scale-110 z-50 shadow-2xl shadow-black/80 ring-1 ring-white/20' : 'scale-100 z-0'}
      `}>
        <div className="relative w-full h-full bg-slate-900">
          <img
            src={game.cover_image || game.image}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-700"
          />
          
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-90' : 'opacity-60'}`} />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col justify-end h-full">
            <motion.div 
              animate={{ y: isHovered ? -10 : 0 }} 
              transition={{ duration: 0.3 }}
            >
              {game.aiEnhanced && (
                <Badge variant="outline" className="mb-2 border-purple-500/50 text-purple-300 bg-purple-500/10 backdrop-blur-md text-[10px]">
                  AI ENHANCED
                </Badge>
              )}
              <h3 className="text-white font-bold text-lg leading-tight mb-1 drop-shadow-md">{game.title}</h3>
              
              {/* Stats Row */}
              <div className="flex items-center justify-between text-xs text-gray-300 mb-3">
                <span className="font-medium">{game.genre}</span>
                <span className="text-green-400 font-mono font-bold">${game.price}</span>
              </div>

              {/* Action Buttons (Visible on Hover) */}
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? 'auto' : 0 }}
                className="flex gap-2 overflow-hidden"
              >
                <Button 
                  size="sm" 
                  className="flex-1 bg-white text-black hover:bg-gray-200 rounded-full font-semibold text-xs h-8"
                  onClick={(e) => { e.stopPropagation(); onNavigate(game.id); }}
                >
                  <Play className="w-3 h-3 mr-1 fill-current" /> Play
                </Button>
                <Button 
                  size="icon" 
                  variant="secondary"
                  className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/10 text-white h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); addToCart(game); }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const GameRow = ({ title, games, addToCart, onNavigate }) => {
    const rowRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleScroll = () => {
        if (rowRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction) => {
        if (rowRef.current) {
            const { current } = rowRef;
            const scrollAmount = direction === 'left' ? -window.innerWidth * 0.7 : window.innerWidth * 0.7;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!games || games.length === 0) return null;

    return (
        <div className="mb-12 relative group/row z-10">
            <div className="flex items-end justify-between mb-4 px-4 md:px-12">
                <h2 className="text-xl md:text-2xl font-bold text-white hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-2 group">
                    {title}
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-blue-400" />
                </h2>
            </div>

            <div className="relative group">
                <AnimatePresence>
                    {showLeftArrow && (
                        <motion.button 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => scroll('left')}
                            className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-center text-white hover:w-16 transition-all duration-300"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </motion.button>
                    )}
                </AnimatePresence>

                <div 
                    ref={rowRef}
                    onScroll={handleScroll}
                    className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-12 py-8 -my-8 scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {games.map((game, idx) => (
                        <GameCard key={game.id} game={game} addToCart={addToCart} index={idx} onNavigate={onNavigate} />
                    ))}
                    <div className="w-8 flex-shrink-0" />
                </div>

                <AnimatePresence>
                    {showRightArrow && (
                        <motion.button 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => scroll('right')}
                            className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-center text-white hover:w-16 transition-all duration-300"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const NetflixHero = ({ featuredGame, addToCart, heroBackgrounds = [] }) => {
    const navigate = useNavigate();
    const [isMuted, setIsMuted] = useState(true);
    const [currentBgIndex, setCurrentBgIndex] = useState(() => 
        heroBackgrounds.length > 0 ? Math.floor(Math.random() * heroBackgrounds.length) : -1
    );

    const activeBackgrounds = heroBackgrounds.filter(bg => bg.is_active);
    const currentBackground = activeBackgrounds[currentBgIndex >= 0 ? currentBgIndex % activeBackgrounds.length : 0];

    // Cycle through backgrounds
    useEffect(() => {
        if (activeBackgrounds.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBgIndex(prev => (prev + 1) % activeBackgrounds.length);
        }, 15000); // 15 seconds per background
        return () => clearInterval(interval);
    }, [activeBackgrounds.length]);

    if (!featuredGame) return null;

    return (
        <div className="relative w-full h-[85vh] mb-8">
            {/* Background Media */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
                {currentBackground?.video_url ? (
                    <video
                        key={currentBackground.id}
                        src={currentBackground.video_url}
                        autoPlay
                        muted={isMuted}
                        loop
                        playsInline
                        className="w-full h-full object-cover object-center"
                    />
                ) : (
                    <img 
                        src={featuredGame.cover_image || featuredGame.image} 
                        alt={featuredGame.title}
                        className="w-full h-full object-cover object-top"
                    />
                )}
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 z-20 flex items-center px-4 md:px-12">
                <div className="max-w-2xl pt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <Badge className="mb-4 bg-white/20 backdrop-blur-md border-none text-white px-3 py-1 rounded-md font-bold tracking-wider">
                            #{featuredGame.genre?.toUpperCase()} • TOP RATED
                        </Badge>
                        
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
                            {featuredGame.title}
                        </h1>
                        
                        <p className="text-lg md:text-xl text-gray-200 mb-8 line-clamp-3 drop-shadow-md max-w-xl font-medium">
                            {featuredGame.description}
                        </p>

                        <div className="flex flex-wrap gap-4 mb-8">
                            <Button 
                                size="lg" 
                                className="bg-white text-black hover:bg-gray-200 font-bold px-8 h-14 rounded-lg text-lg shadow-xl shadow-white/10 transition-transform hover:scale-105"
                                onClick={() => navigate(createPageUrl(`GameDetail?id=${featuredGame.id}`))}
                            >
                                <Play className="w-6 h-6 mr-2 fill-current" />
                                Play Now
                            </Button>
                            <Button 
                                size="lg" 
                                className="bg-white/20 backdrop-blur-xl hover:bg-white/30 text-white border-none font-bold px-8 h-14 rounded-lg text-lg transition-transform hover:scale-105"
                                onClick={() => navigate(createPageUrl(`GameDetail?id=${featuredGame.id}`))}
                            >
                                <Info className="w-6 h-6 mr-2" />
                                More Info
                            </Button>
                        </div>
                    </motion.view>
                </div>
            </div>

            {/* Amazon-Style Category Navigation */}
            <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent pt-12 pb-6">
                <div className="px-4 md:px-12">
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
                        {[
                            { label: 'All Games', icon: Gamepad2, color: 'from-blue-500 to-cyan-500' },
                            { label: 'Action RPG', icon: Sword, color: 'from-red-500 to-orange-500' },
                            { label: 'Sci-Fi', icon: Rocket, color: 'from-purple-500 to-pink-500' },
                            { label: 'AI Enhanced', icon: Brain, color: 'from-emerald-500 to-teal-500' },
                            { label: 'Competitive', icon: Trophy, color: 'from-yellow-500 to-amber-500' },
                            { label: 'Shooters', icon: Crosshair, color: 'from-rose-500 to-red-500' },
                            { label: 'Racing', icon: Car, color: 'from-sky-500 to-blue-500' },
                            { label: 'Horror', icon: Ghost, color: 'from-slate-500 to-zinc-500' },
                            { label: 'Adventure', icon: Map, color: 'from-lime-500 to-green-500' },
                            { label: 'New Releases', icon: Sparkles, color: 'from-fuchsia-500 to-purple-500' },
                            { label: 'Trending', icon: Flame, color: 'from-orange-500 to-red-500' },
                        ].map((cat, idx) => (
                            <motion.button
                                key={cat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05, duration: 0.3 }}
                                className="group flex-shrink-0 flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                                    <cat.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-white/80 group-hover:text-white whitespace-nowrap">{cat.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mute Toggle */}
            <div className="absolute bottom-32 right-12 z-30">
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-10 h-10 rounded-full border border-white/30 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

// --- Apple Liquid Glass Navigation ---
const FloatingNav = ({ scrollY }) => {
    const navigate = useNavigate();
    const { cartCount } = useCart();
    const { user } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const appPages = [
        { name: 'Dashboard', icon: '🏠' },
        { name: 'Store', icon: '🛒' },
        { name: 'Library', icon: '📚' },
        { name: 'Achievements', icon: '🏆' },
        { name: 'TradingCards', icon: '🃏' },
        { name: 'Challenges', icon: '⚔️' },
        { name: 'Community', icon: '👥' },
        { name: 'Clan', icon: '🏰' },
        { name: 'TradingPost', icon: '🔄' },
        { name: 'Marketplace', icon: '💰' },
        { name: 'Profile', icon: '👤' },
        { name: 'Admin', icon: '⚙️' },
    ];

    useEffect(() => {
        return scrollY.on("change", (latest) => {
            setIsScrolled(latest > 50);
        });
    }, [scrollY]);

    return (
        <>
            <motion.header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                    isScrolled 
                        ? 'bg-white/10 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/10' 
                        : 'bg-white/5 backdrop-blur-xl'
                }`}
                style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
            >
                <div className="max-w-[1920px] mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
                    {/* Left: App Drawer */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setDrawerOpen(!drawerOpen)}
                            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all"
                        >
                            <div className="flex flex-col gap-1">
                                <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
                                <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
                                <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
                            </div>
                        </button>

                        <nav className="hidden md:flex items-center gap-1">
                            {['Store', 'Library', 'Community'].map((item) => (
                                <Link
                                    key={item}
                                    to={createPageUrl(item)}
                                    className="px-4 py-1.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                >
                                    {item}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Center: Search */}
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input 
                            type="text" 
                            placeholder="Search" 
                            className="bg-white/10 border-none rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:bg-white/15 w-64 transition-all"
                        />
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        <Link 
                            to={createPageUrl('Cart')} 
                            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all relative"
                        >
                            <ShoppingCart className="w-4 h-4 text-white/80" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        <button className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all relative">
                            <Bell className="w-4 h-4 text-white/80" />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/20 cursor-pointer hover:ring-white/40 transition-all">
                            <img 
                                src={user?.avatar_url || "https://github.com/shadcn.png"} 
                                alt="User" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* App Drawer */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                            onClick={() => setDrawerOpen(false)}
                        />
                        <motion.div
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-72 bg-white/10 backdrop-blur-2xl backdrop-saturate-150 border-r border-white/10 z-50 p-6"
                            style={{ WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}
                        >
                            <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Apps</h2>
                            <div className="space-y-1">
                                {appPages.map((page) => (
                                    <button
                                        key={page.name}
                                        onClick={() => { navigate(createPageUrl(page.name)); setDrawerOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all text-left"
                                    >
                                        <span className="text-lg">{page.icon}</span>
                                        <span className="font-medium">{page.name}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default function Store() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const { scrollY } = useScroll();
  
  const handleGameNavigate = (gameId) => {
    navigate(createPageUrl(`GameDetail?id=${gameId}`));
  };

  // Fetch hero backgrounds
  const { data: heroBackgrounds = [] } = useQuery({
    queryKey: ['heroBackgrounds'],
    queryFn: () => base44.entities.HeroBackground.list(),
    initialData: [],
  });

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

  // Categories
  const categories = useMemo(() => {
      return {
          'Trending Now': trendingGames,
          'New Releases 2025': newReleases,
          'Classic Best Sellers': classicBestSellers,
          'AI Powered Adventures': aiGames,
          'Action & RPG': filteredGames.filter(g => ['Action RPG', 'RPG', 'Action', 'Action Adventure'].includes(g.genre)),
          'Strategy & Simulation': filteredGames.filter(g => ['Strategy', 'Simulation', '4X'].includes(g.genre)),
      };
  }, [filteredGames]);

  const featuredGame = useMemo(() => games.find(g => g.rating >= 4.8) || games[0], [games]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden font-sans selection:bg-blue-500/30">
      <style>{`
          .scrollbar-hide::-webkit-scrollbar {
              display: none;
          }
          .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
          }
      `}</style>

      <FloatingNav scrollY={scrollY} />

      <main className="relative pb-24">
          {/* Hero Section */}
          <NetflixHero featuredGame={featuredGame} addToCart={addToCart} heroBackgrounds={heroBackgrounds} />

          {/* Game Rows */}
          <div className="relative z-10 -mt-32 space-y-2">
              {Object.entries(categories).map(([title, categoryGames]) => (
                  categoryGames.length > 0 && (
                      <GameRow 
                        key={title} 
                        title={title} 
                        games={categoryGames} 
                        addToCart={addToCart}
                        onNavigate={handleGameNavigate}
                      />
                  )
              ))}
          </div>

          {/* Footer */}
          <footer className="mt-20 px-12 py-12 border-t border-white/10 bg-black/50 text-center text-gray-500 text-sm">
              <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-left">
                  <div>
                      <h4 className="text-white font-bold mb-4">Shop</h4>
                      <ul className="space-y-2">
                          <li><a href="#" className="hover:underline">New Releases</a></li>
                          <li><a href="#" className="hover:underline">Best Sellers</a></li>
                          <li><a href="#" className="hover:underline">On Sale</a></li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="text-white font-bold mb-4">Account</h4>
                      <ul className="space-y-2">
                          <li><a href="#" className="hover:underline">My Profile</a></li>
                          <li><a href="#" className="hover:underline">Order History</a></li>
                          <li><a href="#" className="hover:underline">Wishlist</a></li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="text-white font-bold mb-4">Support</h4>
                      <ul className="space-y-2">
                          <li><a href="#" className="hover:underline">Help Center</a></li>
                          <li><a href="#" className="hover:underline">Contact Us</a></li>
                          <li><a href="#" className="hover:underline">Returns</a></li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="text-white font-bold mb-4">Legal</h4>
                      <ul className="space-y-2">
                          <li><a href="#" className="hover:underline">Terms of Service</a></li>
                          <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                          <li><a href="#" className="hover:underline">Cookie Settings</a></li>
                      </ul>
                  </div>
              </div>
              <p>&copy; 2025 Nexus Store. All rights reserved. Designed with liquid glass aesthetics.</p>
          </footer>
      </main>
    </div>
  );
}