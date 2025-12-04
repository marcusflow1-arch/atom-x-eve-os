import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, Play, Gamepad2, ChevronLeft, ChevronRight, 
  Info, Plus, Volume2, VolumeX, Bell, Star, Filter, Grid, List,
  Sparkles, Flame, Clock, Trophy, Tag, X, SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/auth/AuthContext';
import { Game } from '@/entities/Game';
import { createPageUrl } from '@/utils';
import { aiGames, otherSampleGames, trendingGames, newReleases, classicBestSellers } from '@/components/store/mockData';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// --- Liquid Glass Components ---

const GlassPanel = ({ children, className = "" }) => (
  <div className={`
    bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl
    shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]
    ${className}
  `}
  style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
  >
    {children}
  </div>
);

const GameGridCard = ({ game, addToCart, onNavigate }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      className="group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onNavigate(game.id)}
    >
      <GlassPanel className="overflow-hidden h-full flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={game.cover_image || game.image}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {game.aiEnhanced && (
              <Badge className="bg-purple-500/80 backdrop-blur-md text-white text-[10px] border-none">
                <Sparkles className="w-3 h-3 mr-1" /> AI
              </Badge>
            )}
            {game.rating >= 4.8 && (
              <Badge className="bg-yellow-500/80 backdrop-blur-md text-black text-[10px] border-none font-bold">
                <Trophy className="w-3 h-3 mr-1" /> TOP
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <motion.div 
            className="absolute top-3 right-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
          >
            <Button 
              size="icon"
              className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/20"
              onClick={(e) => { e.stopPropagation(); addToCart(game); }}
            >
              <Plus className="w-4 h-4 text-white" />
            </Button>
          </motion.div>

          {/* Price Tag */}
          <div className="absolute bottom-3 right-3">
            <span className="bg-green-500/90 backdrop-blur-md text-white text-sm font-bold px-3 py-1 rounded-full">
              ${game.price}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
            {game.title}
          </h3>
          <p className="text-white/50 text-xs mb-2">{game.genre}</p>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mt-auto">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-yellow-400 text-xs font-medium">{game.rating || '4.5'}</span>
            <span className="text-white/30 text-xs">• {game.developer || 'Studio'}</span>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
};

// --- Hero Section ---
const HeroSection = ({ featuredGame, heroBackgrounds = [] }) => {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(true);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  const activeBackgrounds = heroBackgrounds.filter(bg => bg.is_active);
  const currentBackground = activeBackgrounds[currentBgIndex % Math.max(activeBackgrounds.length, 1)];

  useEffect(() => {
    if (activeBackgrounds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBgIndex(prev => (prev + 1) % activeBackgrounds.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [activeBackgrounds.length]);

  if (!featuredGame) return null;

  return (
    <div className="relative w-full h-[50vh] min-h-[400px] mt-0">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
        {currentBackground?.video_url ? (
          <video
            key={currentBackground.id}
            src={currentBackground.video_url}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={featuredGame.cover_image || featuredGame.image} 
            alt={featuredGame.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="absolute inset-0 z-20 flex items-center px-6 md:px-12">
        <div className="max-w-xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-3 bg-white/20 backdrop-blur-md border-none text-white text-xs">
              FEATURED • {featuredGame.genre?.toUpperCase()}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
              {featuredGame.title}
            </h1>
            <p className="text-sm md:text-base text-gray-300 mb-6 line-clamp-2 max-w-md">
              {featuredGame.description}
            </p>
            <div className="flex gap-3">
              <Button 
                className="bg-white text-black hover:bg-gray-200 font-bold px-6 h-11 rounded-lg"
                onClick={() => navigate(createPageUrl(`GameDetail?id=${featuredGame.id}`))}
              >
                <Play className="w-4 h-4 mr-2 fill-current" /> Play Now
              </Button>
              <Button 
                className="bg-white/20 backdrop-blur-xl hover:bg-white/30 text-white border-none font-medium px-6 h-11 rounded-lg"
                onClick={() => navigate(createPageUrl(`GameDetail?id=${featuredGame.id}`))}
              >
                <Info className="w-4 h-4 mr-2" /> Details
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {activeBackgrounds.length > 0 && (
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-6 right-6 z-30 w-9 h-9 rounded-full border border-white/30 bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

// --- Floating Nav with App Drawer ---
const FloatingNav = ({ scrollY, searchTerm, setSearchTerm }) => {
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-black/80 backdrop-blur-2xl border-b border-white/10' 
            : 'bg-transparent'
        }`}
        style={{ WebkitBackdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none' }}
      >
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: App Drawer Button */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all flex-shrink-0"
            >
              <div className="flex flex-col gap-1">
                <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
                <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
                <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
              </div>
            </button>

            <span className="text-white font-bold text-lg hidden md:block">NEXUS STORE</span>
          </div>

          {/* Center: Search */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search games, genres, developers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:bg-white/15 focus:border-white/20 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
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
              className="fixed top-0 left-0 bottom-0 w-72 bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 z-50 p-6"
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

// --- Amazon-style Filter Sidebar ---
const FilterSidebar = ({ 
  genres, 
  selectedGenres, 
  setSelectedGenres,
  priceRange,
  setPriceRange,
  selectedRating,
  setSelectedRating,
  selectedCategory,
  setSelectedCategory
}) => {
  const categories = [
    { id: 'all', label: 'All Games', icon: Grid },
    { id: 'trending', label: 'Trending Now', icon: Flame },
    { id: 'new', label: 'New Releases', icon: Clock },
    { id: 'top', label: 'Top Rated', icon: Trophy },
    { id: 'ai', label: 'AI Enhanced', icon: Sparkles },
    { id: 'sale', label: 'On Sale', icon: Tag },
  ];

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <GlassPanel className="p-5 sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          Categories
        </h3>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                selectedCategory === cat.id 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 my-4" />

      {/* Genre Filter */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3">Genre</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {genres.map((genre) => (
            <label key={genre} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox 
                checked={selectedGenres.includes(genre)}
                onCheckedChange={() => toggleGenre(genre)}
                className="border-white/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
              />
              <span className="text-white/70 text-sm group-hover:text-white transition-colors">
                {genre}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 my-4" />

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3">Price Range</h3>
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={100}
            min={0}
            step={5}
            className="mb-3"
          />
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 my-4" />

      {/* Rating Filter */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-3">Customer Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                selectedRating === rating 
                  ? 'bg-yellow-500/20 border border-yellow-500/30' 
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-white/20'}`} 
                  />
                ))}
              </div>
              <span className="text-white/60 text-xs">& Up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button 
        onClick={() => {
          setSelectedGenres([]);
          setPriceRange([0, 100]);
          setSelectedRating(null);
          setSelectedCategory('all');
        }}
        className="w-full mt-6 py-2 text-sm text-white/50 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all"
      >
        Clear All Filters
      </button>
    </GlassPanel>
  );
};

// --- Results Header ---
const ResultsHeader = ({ count, viewMode, setViewMode, sortBy, setSortBy }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="text-white/70 text-sm">
      <span className="text-white font-semibold">{count}</span> results
    </div>
    
    <div className="flex items-center gap-3">
      {/* Sort Dropdown */}
      <select 
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="bg-white/10 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
      >
        <option value="relevance">Sort: Relevance</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="rating">Avg. Customer Rating</option>
        <option value="newest">Newest Arrivals</option>
      </select>

      {/* View Toggle */}
      <div className="flex items-center bg-white/10 rounded-lg p-1">
        <button 
          onClick={() => setViewMode('grid')}
          className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/20' : ''}`}
        >
          <Grid className="w-4 h-4 text-white" />
        </button>
        <button 
          onClick={() => setViewMode('list')}
          className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/20' : ''}`}
        >
          <List className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  </div>
);

// --- List View Card ---
const GameListCard = ({ game, addToCart, onNavigate }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="group cursor-pointer"
    onClick={() => onNavigate(game.id)}
  >
    <GlassPanel className="p-4 flex gap-4 hover:bg-white/10 transition-all">
      <div className="w-32 h-44 flex-shrink-0 rounded-lg overflow-hidden">
        <img src={game.cover_image || game.image} alt={game.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">
              {game.title}
            </h3>
            <p className="text-white/50 text-sm">{game.developer || 'Game Studio'}</p>
          </div>
          <span className="text-green-400 font-bold text-xl">${game.price}</span>
        </div>
        <p className="text-white/60 text-sm mt-2 line-clamp-2">{game.description}</p>
        <div className="flex items-center gap-4 mt-auto pt-3">
          <Badge variant="outline" className="text-white/60 border-white/20">{game.genre}</Badge>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-yellow-400 text-sm">{game.rating || '4.5'}</span>
          </div>
          {game.aiEnhanced && (
            <Badge className="bg-purple-500/20 text-purple-400 border-none">
              <Sparkles className="w-3 h-3 mr-1" /> AI Enhanced
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button 
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={(e) => { e.stopPropagation(); addToCart(game); }}
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
          <Info className="w-4 h-4 mr-1" /> Details
        </Button>
      </div>
    </GlassPanel>
  </motion.div>
);

// --- Main Store Component ---
export default function Store() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const { scrollY } = useScroll();
  
  // Filter States
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('relevance');

  const handleGameNavigate = (gameId) => {
    navigate(createPageUrl(`GameDetail?id=${gameId}`));
  };

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

  // Get unique genres
  const genres = useMemo(() => {
    const allGenres = games.map(g => g.genre).filter(Boolean);
    return [...new Set(allGenres)].sort();
  }, [games]);

  // Filter and sort games
  const filteredGames = useMemo(() => {
    let result = [...games];

    // Category filter
    if (selectedCategory === 'trending') {
      result = trendingGames;
    } else if (selectedCategory === 'new') {
      result = newReleases;
    } else if (selectedCategory === 'top') {
      result = result.filter(g => (g.rating || 4.5) >= 4.5);
    } else if (selectedCategory === 'ai') {
      result = aiGames;
    } else if (selectedCategory === 'sale') {
      result = result.filter(g => g.price < 50);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(g => 
        g.title?.toLowerCase().includes(term) ||
        g.genre?.toLowerCase().includes(term) ||
        g.developer?.toLowerCase().includes(term) ||
        g.description?.toLowerCase().includes(term)
      );
    }

    // Genre filter
    if (selectedGenres.length > 0) {
      result = result.filter(g => selectedGenres.includes(g.genre));
    }

    // Price filter
    result = result.filter(g => g.price >= priceRange[0] && g.price <= priceRange[1]);

    // Rating filter
    if (selectedRating) {
      result = result.filter(g => (g.rating || 4.5) >= selectedRating);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
        break;
      case 'newest':
        result.sort((a, b) => (b.releaseYear || 2024) - (a.releaseYear || 2024));
        break;
      default:
        break;
    }

    return result;
  }, [games, searchTerm, selectedGenres, priceRange, selectedRating, selectedCategory, sortBy]);

  const featuredGame = useMemo(() => games.find(g => g.rating >= 4.8) || games[0], [games]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden font-sans selection:bg-blue-500/30">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <FloatingNav scrollY={scrollY} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <main className="relative">
        {/* Hero Section */}
        <HeroSection featuredGame={featuredGame} heroBackgrounds={heroBackgrounds} />

        {/* Main Content: Amazon-style Layout */}
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-8">
          <div className="flex gap-6">
            {/* Left Sidebar - Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <FilterSidebar 
                genres={genres}
                selectedGenres={selectedGenres}
                setSelectedGenres={setSelectedGenres}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                selectedRating={selectedRating}
                setSelectedRating={setSelectedRating}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            </aside>

            {/* Right Content - Results */}
            <div className="flex-1 min-w-0">
              {/* Active Filters */}
              {(selectedGenres.length > 0 || selectedRating || searchTerm) && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-white/50 text-sm">Active filters:</span>
                  {searchTerm && (
                    <Badge variant="outline" className="text-white border-white/20 flex items-center gap-1">
                      "{searchTerm}"
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                    </Badge>
                  )}
                  {selectedGenres.map(g => (
                    <Badge key={g} variant="outline" className="text-white border-white/20 flex items-center gap-1">
                      {g}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedGenres(prev => prev.filter(x => x !== g))} />
                    </Badge>
                  ))}
                  {selectedRating && (
                    <Badge variant="outline" className="text-white border-white/20 flex items-center gap-1">
                      {selectedRating}+ Stars
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedRating(null)} />
                    </Badge>
                  )}
                </div>
              )}

              <ResultsHeader 
                count={filteredGames.length} 
                viewMode={viewMode}
                setViewMode={setViewMode}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />

              {/* Games Grid/List */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : filteredGames.length === 0 ? (
                <div className="text-center py-20">
                  <Gamepad2 className="w-16 h-16 mx-auto text-white/20 mb-4" />
                  <h3 className="text-white text-xl font-semibold mb-2">No games found</h3>
                  <p className="text-white/50">Try adjusting your filters or search term</p>
                </div>
              ) : viewMode === 'grid' ? (
                <motion.div 
                  layout
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
                >
                  <AnimatePresence>
                    {filteredGames.map((game) => (
                      <GameGridCard 
                        key={game.id} 
                        game={game} 
                        addToCart={addToCart}
                        onNavigate={handleGameNavigate}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredGames.map((game) => (
                      <GameListCard 
                        key={game.id} 
                        game={game} 
                        addToCart={addToCart}
                        onNavigate={handleGameNavigate}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 px-6 md:px-12 py-12 border-t border-white/10 bg-black/50 text-center text-gray-500 text-sm">
          <p>&copy; 2025 Nexus Store. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}