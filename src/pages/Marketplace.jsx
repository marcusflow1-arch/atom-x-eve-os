import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Gavel, Search, Filter, X, Zap, Shield, Sword, Bot, Mic, Send, Coins, Clock, ChevronDown, Tag, Gamepad2, Diamond, Store, TrendingUp, Flame, ArrowUp, ArrowLeft, Eye, Users, Star, Plus, Heart, Sparkles, Ghost, Skull, AlertTriangle, Lock, Unlock, Radio, Package, User, Fingerprint, AlertOctagon, Siren, Grid, List, Home, ShoppingBag, Library, Trophy, Layers, Hammer, MessageSquare, Rocket, Swords, ArrowLeftRight, Lightbulb, Settings, LogIn, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAuth } from '../components/auth/AuthContext';
import { ThemeBackground, ThemeToggle } from '../components/shared/ThemeSystem';

// --- Mock Data (Preserved) ---
const featuredItems = [
  {
    id: 'f1',
    name: 'Dragonscale Helm of Ancient Wisdom',
    game: 'Elder Scrolls: Reborn',
    category: 'Helmet',
    rarity: 'Mythic',
    level: 99,
    price: 45000,
    image: 'https://images.unsplash.com/photo-1534944652934-245f95a7c93c?w=600&h=600&fit=crop',
    description: 'A legendary helm forged from the scales of ancient dragons, imbued with arcane knowledge.',
    requirements: { level: 99, faction: 'Vanguard', gender: 'Male' },
    stats: { defense: 150, wisdom: 25, magic_resist: 30 },
    trending: true,
    seller: 'SkyrimLord',
    rating: 4.8,
    reviews: 23,
    origin_event: 'Dragon Lords Expansion',
    upvotes: 95, downvotes: 5, views: 7200, gender: 'Male', faction: 'Vanguard'
  },
  {
    id: 'f2',
    name: "The Butcher's Crimson Cleaver",
    game: 'Diablo II: Eternal',
    category: 'Weapon',
    rarity: 'Legendary',
    level: 92,
    price: 35000,
    image: 'https://images.unsplash.com/photo-1608935436184-339c336b85a1?w=600&h=600&fit=crop',
    description: 'A gruesome cleaver still dripping with demon blood. Its cursed edge grows stronger with each kill.',
    requirements: { level: 92, faction: 'Vanguard', gender: 'Unisex' },
    stats: { attack: 200, lifesteal: 15, crit_chance: 12 },
    hot: true,
    seller: 'DiabloFan',
    rating: 4.9,
    reviews: 47,
    origin_event: 'Hell Invasion Event',
    upvotes: 90, downvotes: 10, views: 4800, gender: 'Unisex', faction: 'Vanguard'
  }
];

const allItems = [
  {
    id: 'i1',
    name: 'Cyber-Neural Interface',
    category: 'Cybernetics',
    rarity: 'Mythic',
    level: 80,
    price: 62000,
    hot: true,
    upvotes: 94,
    downvotes: 6,
    views: 3500,
    seller: 'SynthSeller',
    image: 'https://images.unsplash.com/photo-1593113646773-ae63c1a3a1e5?w=300&h=300&fit=crop',
    gender: 'Unisex',
    faction: 'Syndicate',
    game: 'Cyberpunk 2088',
    description: 'Advanced neural interface that directly connects to the user\'s nervous system.',
    requirements: { level: 80, faction: 'Syndicate' },
    stats: { hacking: 50, reaction_time: 25, data_processing: 40 },
    rating: 4.7,
    reviews: 156,
    origin_event: 'Neural Wars Update'
  },
  {
    id: 'i2',
    name: "The Butcher's Cleaver",
    category: 'Weapon',
    rarity: 'Legendary',
    level: 92,
    price: 35000,
    hot: true,
    upvotes: 88,
    downvotes: 12,
    views: 4800,
    seller: 'DiabloFan',
    image: 'https://images.unsplash.com/photo-1608935436184-339c336b85a1?w=300&h=300&fit=crop',
    gender: 'Unisex',
    faction: 'Vanguard',
    game: 'Diablo II: Eternal',
    description: 'A gruesome cleaver, still dripping with the blood of countless demons.',
    requirements: { level: 92, faction: 'Vanguard', gender: 'Unisex' },
    stats: { attack: 200, lifesteal: 15, crit_chance: 12 },
    rating: 4.9,
    reviews: 47,
    origin_event: 'Hell Invasion Event'
  },
  {
    id: 'i3',
    name: 'Dragonscale Helm',
    category: 'Helmet',
    rarity: 'Mythic',
    level: 99,
    price: 45000,
    hot: false,
    upvotes: 98,
    downvotes: 2,
    views: 7200,
    seller: 'SkyrimLord',
    image: 'https://images.unsplash.com/photo-1534944652934-245f95a7c93c?w=300&h=300&fit=crop',
    gender: 'Male',
    faction: 'Vanguard',
    game: 'Elder Scrolls: Reborn',
    description: 'Forged from the scales of an ancient dragon, this helm offers unparalleled protection.',
    requirements: { level: 99, faction: 'Vanguard', gender: 'Male' },
    stats: { defense: 150, wisdom: 25, magic_resist: 30 },
    rating: 4.8,
    reviews: 23,
    origin_event: 'Dragon Lords Expansion'
  },
  {
    id: 'i4',
    name: 'Staff of the Eternal Archmage',
    category: 'Staff',
    rarity: 'Legendary',
    level: 85,
    price: 28500,
    hot: false,
    upvotes: 91,
    downvotes: 9,
    views: 2100,
    seller: 'WizardHarry',
    image: 'https://images.unsplash.com/photo-1619572973418-73c16428615b?w=300&h=300&fit=crop',
    gender: 'Unisex',
    faction: 'Neutral',
    game: 'Fantasy Realms',
    description: 'A staff imbued with the power of forgotten arcane knowledge.',
    requirements: { level: 85, faction: 'Neutral' },
    stats: { spell_power: 180, mana_regen: 10, intelligence: 30 },
    rating: 4.5,
    reviews: 80,
    origin_event: 'Arcane Genesis Update'
  },
  {
    id: 'i5',
    name: 'Shadow Weave Robes',
    category: 'Armor',
    rarity: 'Epic',
    level: 78,
    price: 21000,
    hot: false,
    upvotes: 82,
    downvotes: 18,
    views: 1950,
    seller: 'MageGuild',
    image: 'https://images.unsplash.com/photo-1551103003-4d4b8f395e3a?w=300&h=300&fit=crop',
    gender: 'Female',
    faction: 'Neutral',
    game: 'Arcane Legends',
    description: 'Robes woven from pure shadow, granting the wearer increased stealth.',
    requirements: { level: 78, faction: 'Neutral', gender: 'Female' },
    stats: { stealth: 50, magic_resist: 60, agility: 20 },
    rating: 4.6,
    reviews: 70,
    origin_event: 'Nightfall Conspiracy'
  },
  {
    id: 'i6',
    name: 'Syndicate Datapad',
    category: 'Misc',
    rarity: 'Rare',
    level: 10,
    price: 5000,
    hot: false,
    upvotes: 60,
    downvotes: 40,
    views: 900,
    seller: 'InfoBroker',
    image: 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=300&h=300&fit=crop',
    gender: 'Unisex',
    faction: 'Syndicate',
    game: 'Neon City',
    description: 'A secure datapad containing encrypted information about Syndicate operations.',
    requirements: { level: 10, faction: 'Syndicate' },
    stats: { data_decryption: 20, network_access: 15 },
    rating: 3.9,
    reviews: 30,
    origin_event: 'Cyber Heist Season'
  }
];

// Rarity Styles for Black Market
const rarityStyles = {
  Mythic: { text: 'text-red-500', border: 'border-red-500', bg: 'bg-red-950/90', glow: 'shadow-[0_0_30px_rgba(220,38,38,0.6)]' },
  Legendary: { text: 'text-orange-500', border: 'border-orange-500', bg: 'bg-orange-950/90', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.5)]' },
  Epic: { text: 'text-purple-500', border: 'border-purple-500', bg: 'bg-purple-950/90', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]' },
  Rare: { text: 'text-blue-500', border: 'border-blue-500', bg: 'bg-blue-950/90', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]' },
  Uncommon: { text: 'text-green-500', border: 'border-green-500', bg: 'bg-green-950/90', glow: 'shadow-[0_0_10px_rgba(34,197,94,0.2)]' },
  Common: { text: 'text-slate-400', border: 'border-slate-600', bg: 'bg-slate-900/90', glow: 'shadow-none' }
};

// --- Hooks ---
const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  useEffect(() => {
    const stored = localStorage.getItem('marketplace_recently_viewed');
    if (stored) try { setRecentlyViewed(JSON.parse(stored)); } catch (e) {}
  }, []);
  const addToRecentlyViewed = useCallback((item) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      const updated = [{ ...item, viewedAt: new Date().toISOString() }, ...filtered].slice(0, 10);
      localStorage.setItem('marketplace_recently_viewed', JSON.stringify(updated));
      return updated;
    });
  }, []);
  return { recentlyViewed, addToRecentlyViewed };
};

const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  useEffect(() => {
    const stored = localStorage.getItem('marketplace_watchlist');
    if (stored) try { setWatchlist(JSON.parse(stored)); } catch (e) {}
  }, []);
  const addToWatchlist = useCallback((item) => {
    setWatchlist(prev => {
      if (prev.find(i => i.id === item.id)) return prev;
      const updated = [...prev, item];
      localStorage.setItem('marketplace_watchlist', JSON.stringify(updated));
      return updated;
    });
  }, []);
  return { watchlist, addToWatchlist };
};

// --- Components ---

const BlackMarketCard = ({ item, onClick }) => {
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
  
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={`group relative bg-black border-2 ${rarity.border} rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:${rarity.glow}`}
      onClick={() => onClick(item)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 filter grayscale group-hover:grayscale-0" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Overlay Info */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-black/80 text-white border border-white/20 font-mono text-[10px] backdrop-blur-md">
            {item.category.toUpperCase()}
          </Badge>
        </div>
        
        {item.hot && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded border border-red-500 shadow-lg shadow-red-500/50 animate-pulse">
              <Flame className="w-3 h-3" /> HOT
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex justify-between items-end mb-1">
            <Badge className={`text-[10px] px-1.5 py-0 rounded-sm uppercase tracking-widest font-black border-none bg-black/50 ${rarity.text}`}>
              {item.rarity}
            </Badge>
          </div>
          <h3 className="text-lg font-bold text-white leading-tight mb-1 group-hover:text-cyan-400 transition-colors line-clamp-2">
            {item.name}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
            <Gamepad2 className="w-3 h-3" /> {item.game}
          </p>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="p-3 bg-slate-950 border-t border-white/10 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Seller</span>
          <span className="text-xs text-slate-300 font-mono truncate max-w-[80px]">{item.seller}</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-white font-mono tracking-tight">
            {item.price.toLocaleString()} <span className="text-xs text-cyan-500">AGP</span>
          </div>
        </div>
      </div>
      
      {/* Hover Action Overlay */}
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm">
        <Button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 py-6 border border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
          INSPECT ITEM
        </Button>
      </div>
    </motion.div>
  );
};

const FilterSidebar = ({ filters, setFilters }) => (
  <div className="w-64 bg-black/40 border-r border-white/10 p-6 hidden lg:block h-full overflow-y-auto custom-scrollbar">
    <div className="flex items-center gap-2 mb-8 text-white font-black tracking-widest uppercase text-lg">
      <Filter className="w-5 h-5 text-cyan-500" />
      Filters
    </div>

    <div className="space-y-8">
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Category</h4>
        <div className="space-y-2">
          {['All', 'Weapon', 'Armor', 'Cybernetics', 'Data', 'Misc'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilters(f => ({ ...f, category: cat }))}
              className={`w-full text-left text-sm py-1.5 px-3 rounded transition-colors ${
                filters.category === cat 
                  ? 'bg-cyan-900/30 text-cyan-400 border-l-2 border-cyan-500' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Rarity</h4>
        <div className="flex flex-wrap gap-2">
          {['Mythic', 'Legendary', 'Epic', 'Rare', 'Uncommon'].map(rarity => (
            <button
              key={rarity}
              onClick={() => setFilters(f => ({ ...f, rarity: filters.rarity === rarity ? 'All' : rarity }))}
              className={`text-[10px] px-2 py-1 rounded border uppercase font-bold transition-all ${
                filters.rarity === rarity 
                  ? `${rarityStyles[rarity].bg} ${rarityStyles[rarity].text} ${rarityStyles[rarity].border}`
                  : 'bg-black border-slate-800 text-slate-500 hover:border-slate-600'
              }`}
            >
              {rarity}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Price Range</h4>
        <Slider
          defaultValue={[0, 100000]}
          max={100000}
          step={1000}
          value={filters.price}
          onValueChange={(val) => setFilters(f => ({ ...f, price: val }))}
          className="mb-2"
        />
        <div className="flex justify-between text-xs font-mono text-cyan-500">
          <span>{filters.price[0]}</span>
          <span>{filters.price[1]} AGP</span>
        </div>
      </div>
    </div>
  </div>
);

export default function MarketplacePage() {
  const { user } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState('digital_matrix');
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ category: 'All', rarity: 'All', price: [0, 100000] });
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Hooks
  const { addToRecentlyViewed } = useRecentlyViewed();

  const handleItemClick = (item) => {
    addToRecentlyViewed(item);
    setSelectedItem(item);
  };

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filters.category === 'All' || item.category === filters.category;
      const matchesRarity = filters.rarity === 'All' || item.rarity === filters.rarity;
      const matchesPrice = item.price >= filters.price[0] && item.price <= filters.price[1];
      return matchesSearch && matchesCategory && matchesRarity && matchesPrice;
    });
  }, [searchQuery, filters]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30 relative overflow-hidden">
        <ThemeBackground themeId={selectedTheme} />
        
        {/* Overlay Texture for Grit */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
        <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />

        {/* Header */}
        <header className="relative z-20 border-b border-white/10 bg-black/60 backdrop-blur-md sticky top-0">
          <div className="max-w-[1800px] mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.6)] group-hover:shadow-[0_0_40px_rgba(220,38,38,0.8)] transition-shadow duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20" />
                  <Skull className="w-7 h-7 text-white relative z-10" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-[0.2em] text-white leading-none italic">
                    BLACK<span className="text-red-600">MARKET</span>
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Secure Connection Established</p>
                  </div>
                </div>
              </div>
              
              {/* Vertical Divider */}
              <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />
              
              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {[
                  { id: 'browse', label: 'Browse Goods', icon: Package },
                  { id: 'auctions', label: 'Live Auctions', icon: Gavel },
                  { id: 'smuggler', label: "Smuggler's Den", icon: Fingerprint }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                      activeTab === tab.id 
                        ? 'bg-white/10 text-white border border-white/10 shadow-lg' 
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className={`w-3 h-3 ${activeTab === tab.id ? 'text-red-500' : ''}`} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-6">
              {/* Theme Toggle */}
              <ThemeToggle selectedTheme={selectedTheme} onThemeSelect={setSelectedTheme} />
              
              {/* Balance Display */}
              <div className="bg-slate-900/80 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3 shadow-inner">
                <div className="text-right">
                  <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Encrypted Funds</div>
                  <div className="text-lg font-mono font-bold text-cyan-400">24,500 <span className="text-xs text-slate-500">AGP</span></div>
                </div>
                <Coins className="w-8 h-8 text-yellow-500 drop-shadow-md" />
              </div>

              {/* User Avatar */}
              <div className="relative group">
                <div className="w-10 h-10 rounded-full border-2 border-slate-700 overflow-hidden cursor-pointer group-hover:border-red-500 transition-colors">
                  <img src={user?.avatar_url || "https://github.com/shadcn.png"} className="w-full h-full object-cover" alt="User" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="relative z-10 flex h-[calc(100vh-80px)] max-w-[1800px] mx-auto">
          
          {/* Sidebar Filters (Only on Browse) */}
          {activeTab === 'browse' && (
            <FilterSidebar filters={filters} setFilters={setFilters} />
          )}

          {/* Content Area */}
          <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
            
            {activeTab === 'browse' ? (
              <div className="space-y-8 max-w-7xl mx-auto">
                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto mb-12">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 rounded-xl opacity-30 blur-lg group-hover:opacity-50 transition-opacity" />
                  <div className="relative flex items-center bg-black border border-slate-700 rounded-xl p-2 shadow-2xl">
                    <Search className="w-6 h-6 text-slate-500 ml-3" />
                    <input 
                      type="text" 
                      placeholder="Search illegal goods, contraband, and rare artifacts..." 
                      className="w-full bg-transparent border-none outline-none text-white px-4 py-3 font-mono placeholder:text-slate-600"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-2 pr-2">
                      <Badge className="bg-slate-900 text-slate-500 border border-slate-800 font-mono text-[10px]">CMD+K</Badge>
                    </div>
                  </div>
                </div>

                {/* Featured Items Row */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                      <Siren className="w-6 h-6 text-red-500 animate-pulse" />
                      High Value Targets
                    </h2>
                    <Button variant="link" className="text-red-400 text-xs hover:text-red-300">View All Hot Items</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                    {featuredItems.map(item => (
                      <div key={item.id} className="relative bg-gradient-to-r from-slate-900 to-black border border-slate-800 rounded-2xl p-1 overflow-hidden group cursor-pointer" onClick={() => handleItemClick(item)}>
                        <div className="absolute top-0 right-0 p-4 z-10">
                          <Badge className="bg-red-600 text-white border-none font-bold animate-pulse shadow-lg shadow-red-900/50">FEATURED</Badge>
                        </div>
                        <div className="flex h-full">
                          <div className="w-2/5 relative overflow-hidden rounded-l-xl">
                            <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.name} />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/90" />
                          </div>
                          <div className="w-3/5 p-6 flex flex-col justify-center relative z-10">
                            <h3 className="text-2xl font-black text-white leading-none mb-2 group-hover:text-red-500 transition-colors italic">{item.name}</h3>
                            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{item.description}</p>
                            <div className="flex items-center justify-between mt-auto">
                              <div className="text-2xl font-mono font-bold text-cyan-400">{item.price.toLocaleString()} <span className="text-xs">AGP</span></div>
                              <Button size="sm" className="bg-white/10 hover:bg-white/20 border border-white/10 text-white">Inspect</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Main Grid */}
                <section>
                  <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Grid className="w-5 h-5 text-slate-500" />
                      Market Listings
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-slate-500 font-mono">
                      <span>{filteredItems.length} Results Found</span>
                      <div className="flex gap-2">
                        <button className="hover:text-white transition-colors"><List className="w-4 h-4" /></button>
                        <button className="text-white"><Grid className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                    {filteredItems.map((item) => (
                      <BlackMarketCard key={item.id} item={item} onClick={handleItemClick} />
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-12 opacity-50">
                <Lock className="w-24 h-24 text-slate-700 mb-6" />
                <h2 className="text-3xl font-black text-slate-500 uppercase tracking-widest mb-2">Section Restricted</h2>
                <p className="text-slate-600 max-w-md mx-auto">Access to Auctions and the Smuggler's Den requires authentication level 5 or higher. Return to Browse Goods.</p>
                <Button 
                  variant="outline" 
                  className="mt-8 border-slate-700 text-slate-400 hover:text-white hover:border-white/50"
                  onClick={() => setActiveTab('browse')}
                >
                  Return to Market
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Inspector Modal */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setSelectedItem(null)}>
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-black border border-slate-800 w-full max-w-5xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col md:flex-row h-[700px]"
              >
                <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 z-50 bg-black/50 p-2 rounded-full text-white hover:bg-white hover:text-black transition-all">
                  <X className="w-6 h-6" />
                </button>

                {/* Left: Visuals */}
                <div className="w-full md:w-1/2 bg-slate-900 relative group">
                  <img src={selectedItem.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className={`text-xs font-black uppercase tracking-widest mb-2 ${rarityStyles[selectedItem.rarity]?.text || 'text-white'}`}>
                      {selectedItem.rarity} Class Item
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white leading-none mb-4 italic shadow-black drop-shadow-lg">{selectedItem.name}</h2>
                    <div className="flex gap-2">
                      <Badge className="bg-white/10 backdrop-blur text-white border-white/20 rounded px-3 py-1">{selectedItem.category}</Badge>
                      <Badge className="bg-white/10 backdrop-blur text-white border-white/20 rounded px-3 py-1">{selectedItem.game}</Badge>
                    </div>
                  </div>
                </div>

                {/* Right: Data */}
                <div className="w-full md:w-1/2 bg-black p-8 md:p-10 flex flex-col border-l border-slate-800">
                  <div className="flex-grow space-y-8 overflow-y-auto custom-scrollbar pr-2">
                    <div>
                      <h3 className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Description
                      </h3>
                      <p className="text-slate-300 text-lg leading-relaxed font-light">{selectedItem.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <div className="text-slate-500 text-xs uppercase font-bold mb-1">Seller Reputation</div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_lime]" />
                          <span className="text-white font-mono font-bold">VERIFIED (98%)</span>
                        </div>
                        <div className="text-sm text-slate-400 mt-1">{selectedItem.seller}</div>
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <div className="text-slate-500 text-xs uppercase font-bold mb-1">Security Level</div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-red-500" />
                          <span className="text-red-500 font-mono font-bold">ILLICIT GOODS</span>
                        </div>
                        <div className="text-sm text-slate-400 mt-1">Untraceable Transaction</div>
                      </div>
                    </div>

                    {selectedItem.stats && (
                      <div>
                        <h3 className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-3">Technical Specifications</h3>
                        <div className="space-y-2">
                          {Object.entries(selectedItem.stats).map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center p-3 bg-slate-900/30 rounded border border-slate-800 hover:border-slate-600 transition-colors">
                              <span className="text-slate-400 capitalize text-sm font-medium">{key.replace('_', ' ')}</span>
                              <span className="text-cyan-400 font-mono font-bold">+{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-8 mt-8 border-t border-slate-800 bg-black relative z-10">
                    <div className="flex items-end justify-between mb-6">
                      <div>
                        <div className="text-slate-500 text-xs uppercase font-bold mb-1">Current Market Value</div>
                        <div className="text-4xl font-black text-white font-mono tracking-tight">
                          {selectedItem.price?.toLocaleString()} <span className="text-lg text-cyan-500">AGP</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-500 text-xs uppercase font-bold mb-1">Stock</div>
                        <div className="text-white font-mono">1 Unit Available</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button className="h-14 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-lg shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all hover:scale-[1.02]">
                        PURCHASE NOW
                      </Button>
                      <Button variant="outline" className="h-14 border-slate-700 hover:bg-slate-900 text-slate-300 hover:text-white font-bold uppercase tracking-widest">
                        MAKE AN OFFER
                      </Button>
                    </div>
                    <p className="text-center text-[10px] text-slate-600 mt-4 font-mono">
                      WARNING: All sales are final. The Black Market is not responsible for Syndicate retaliation.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </ProtectedRoute>
  );
}