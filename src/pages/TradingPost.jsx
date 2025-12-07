import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Search, Filter, X, Plus, Eye, Clock, Coins, Gavel, ArrowLeftRight,
  Package, Star, Zap, Shield, Sword, Users, Bot, TrendingUp, Calendar, MessageSquare,
  Grid, List, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Tag, Gamepad2, Diamond, Heart, Share2, AlertCircle,
  CheckCircle, Timer, DollarSign, Sparkles, Crown, Flame, Rocket, Globe, Orbit, Info,
  Home, ShoppingBag, Library, Trophy, Layers, Hammer, Swords, Lightbulb, Settings, LogIn, LogOut, SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAuth } from '../components/auth/AuthContext';

// --- Liquid Glass Components (From Store) ---

const LiquidCard = ({ children, className = "", onClick }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, width } = currentTarget.getBoundingClientRect();
    x.set((clientX - left) / width);
  }

  const waveX = useTransform(mouseX, [0, 1], ["-100%", "200%"]);

  return (
    <motion.div 
      className={`relative overflow-hidden rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-blue-500/20 transition-all duration-300 group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => x.set(0.5)}
      onClick={onClick}
      whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.3)" }}
    >
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
        style={{ 
          left: waveX,
          width: "80%",
          height: "100%"
        }}
      />
      {children}
    </motion.div>
  );
};

const RarityBadge = ({ rarity }) => {
  const styles = {
    Mythic: "bg-red-500/10 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]",
    Legendary: "bg-orange-500/10 text-orange-400 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)]",
    Epic: "bg-purple-500/10 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]",
    Rare: "bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]",
    Uncommon: "bg-green-500/10 text-green-400 border-green-500/50",
    Common: "bg-slate-500/10 text-slate-400 border-slate-500/50"
  };

  return (
    <Badge variant="outline" className={`${styles[rarity] || styles.Common} border px-2 py-0.5 uppercase tracking-wider text-[10px] font-bold`}>
      {rarity}
    </Badge>
  );
};

// --- Mock Data ---
// Expanded mock data with categories for horizontal rows
const userInventory = [
  { id: 'inv_1', name: 'Dragonscale Armor', type: 'Armor', game: 'Elder Scrolls', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300', price: 4500, description: 'Forged from ancient scales.' },
  { id: 'inv_2', name: 'Cyber Interface', type: 'Tech', game: 'Cyberpunk 2088', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300', price: 2500, description: 'Neural link enhancer.' },
  { id: 'inv_3', name: 'Phoenix Spell', type: 'Magic', game: 'Mage Wars', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300', price: 8000, description: 'Summons eternal fire.' },
  { id: 'inv_4', name: 'Quantum Rifle', type: 'Weapon', game: 'Galactic War', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=300', price: 1200, description: 'High precision energy weapon.' },
  { id: 'inv_5', name: 'Stealth Suit', type: 'Armor', game: 'Metal Gear', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300', price: 1500, description: 'Invisibility cloak prototype.' },
  { id: 'inv_6', name: 'Energy Shield', type: 'Tech', game: 'Halo', rarity: 'Uncommon', image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=300', price: 500, description: 'Personal portable shield.' }
];

const tradeListings = [
  // Action
  { id: 't1', category: 'Action', name: 'Dragonscale Armor', type: 'Armor', game: 'Elder Scrolls', rarity: 'Legendary', price: 4500, seller: 'SkyrimLord', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300' },
  { id: 't3', category: 'Action', name: 'Plasma Sword', type: 'Weapon', game: 'Star Conflict', rarity: 'Rare', price: 900, seller: 'JediMaster', image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300' },
  // RPG
  { id: 't6', category: 'RPG', name: 'Excalibur', type: 'Weapon', game: 'Final Fantasy', rarity: 'Mythic', price: 12000, seller: 'CloudStrife', image: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=300' },
  { id: 't4', category: 'RPG', name: 'Health Potion XL', type: 'Consumable', game: 'Fantasy World', rarity: 'Common', price: 50, seller: 'Alchemist', image: 'https://images.unsplash.com/photo-1515549832467-8783363e19b6?w=300' },
  // Shooter
  { id: 't2', category: 'Shooter', name: 'Cyber Interface', type: 'Tech', game: 'Cyberpunk 2088', rarity: 'Epic', price: 2500, seller: 'NetRunner', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300' },
  { id: 't7', category: 'Shooter', name: 'Sniper MK-II', type: 'Weapon', game: 'Call of Duty', rarity: 'Legendary', price: 3200, seller: 'Ghost', image: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=300' },
  // Trending
  { id: 't5', category: 'Trending', name: 'Void Essence', type: 'Material', game: 'Dark Souls 4', rarity: 'Legendary', price: 6000, seller: 'AbyssWalker', image: 'https://images.unsplash.com/photo-1534293507227-203d9333692e?w=300' },
  { id: 't8', category: 'Trending', name: 'Golden Key', type: 'Item', game: 'Zelda', rarity: 'Epic', price: 1500, seller: 'Link', image: 'https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?w=300' },
];

// --- Filter Sidebar ---
const TradingFilterSidebar = ({ 
  filters, setFilters
}) => {
  const categories = [
    { id: 'all', label: 'All Items', icon: Grid },
    { id: 'weapon', label: 'Weapons', icon: Sword },
    { id: 'armor', label: 'Armor', icon: Shield },
    { id: 'tech', label: 'Tech', icon: Zap },
    { id: 'magic', label: 'Magic', icon: Sparkles },
  ];

  const toggleRarity = (r) => {
    setFilters(prev => ({
      ...prev,
      rarity: prev.rarity.includes(r) ? prev.rarity.filter(x => x !== r) : [...prev.rarity, r]
    }));
  };

  return (
    <LiquidCard className="p-5 sticky top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          Item Type
        </h3>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                filters.category === cat.id 
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

      <div className="h-px bg-white/10 my-4" />

      {/* Rarity Filter */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3">Rarity</h3>
        <div className="space-y-2">
          {['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'].map((rarity) => (
            <label key={rarity} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox 
                checked={filters.rarity.includes(rarity)}
                onCheckedChange={() => toggleRarity(rarity)}
                className="border-white/30 data-[state=checked]:bg-blue-500"
              />
              <span className="text-white/70 text-sm group-hover:text-white transition-colors">
                {rarity}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3">Price Range</h3>
        <div className="px-1">
          <Slider
            value={filters.priceRange}
            onValueChange={(val) => setFilters(prev => ({ ...prev, priceRange: val }))}
            max={10000}
            min={0}
            step={100}
            className="mb-3"
          />
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>{filters.priceRange[0]} AGP</span>
            <span>{filters.priceRange[1]} AGP</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setFilters({ category: 'all', rarity: [], priceRange: [0, 10000] })}
        className="w-full mt-6 py-2 text-sm text-white/50 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all"
      >
        Reset Filters
      </button>
    </LiquidCard>
  );
};

// --- Horizontal Row Component ---
const MarketCategoryRow = ({ title, icon: Icon, items }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-4 px-1">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-blue-400" />}
        {title}
      </h3>
      <button className="text-sm text-blue-400 hover:text-white transition-colors flex items-center gap-1">
        See All <ChevronRight className="w-4 h-4" />
      </button>
    </div>
    
    <div className="relative group">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-1 pb-4 -mx-1 snap-x">
        {items.map((item) => (
          <div key={item.id} className="snap-start flex-shrink-0 w-[280px]">
            <LiquidCard className="h-full flex flex-col">
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-950">
                <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                
                {/* Top Badges */}
                <div className="absolute top-3 left-3">
                  <RarityBadge rarity={item.rarity} />
                </div>
                {item.type && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="bg-black/40 border-white/10 text-white/80 text-[10px] backdrop-blur-md">{item.type}</Badge>
                  </div>
                )}

                {/* Bottom Info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold text-lg truncate drop-shadow-md">{item.name}</h3>
                  <p className="text-white/60 text-xs flex items-center gap-1">
                    <Gamepad2 className="w-3 h-3" /> {item.game}
                  </p>
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col bg-gradient-to-b from-slate-900/80 to-slate-900/40">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Current Price</p>
                    <div className="text-xl font-mono font-bold text-green-400 leading-none">
                      {item.price.toLocaleString()} <span className="text-xs text-green-400/60">AGP</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">{item.seller}</p>
                    <div className="flex text-yellow-500">
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <Button className="w-full bg-white/10 hover:bg-white text-white hover:text-black font-bold text-xs h-9 border border-white/10 transition-all">
                    View Listing
                  </Button>
                </div>
              </div>
            </LiquidCard>
          </div>
        ))}
      </div>
      
      {/* Fade Edges */}
      <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-[#1a1f2e] to-transparent pointer-events-none z-10" />
    </div>
  </div>
);

// --- Trading Post Main ---

export default function TradingPost() {
  const [activeTab, setActiveTab] = useState('market');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    rarity: [],
    priceRange: [0, 10000]
  });

  // Filter logic for Inventory (Grid View)
  const filteredInventory = useMemo(() => {
    return userInventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.game.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filters.category === 'all' || item.type.toLowerCase().includes(filters.category);
      const matchesRarity = filters.rarity.length === 0 || filters.rarity.includes(item.rarity);
      return matchesSearch && matchesCategory && matchesRarity;
    });
  }, [searchTerm, filters]);

  // Categorized Market Listings
  const marketCategories = useMemo(() => {
    const cats = {
      'Action': tradeListings.filter(i => i.category === 'Action'),
      'Trending': tradeListings.filter(i => i.category === 'Trending'),
      'RPG': tradeListings.filter(i => i.category === 'RPG'),
      'Shooter': tradeListings.filter(i => i.category === 'Shooter'),
    };
    // Fallback for uncategorized or if empty to show something
    if (Object.values(cats).every(arr => arr.length === 0)) {
       return { 'All Listings': tradeListings };
    }
    return cats;
  }, []);

  return (
    <ProtectedRoute>
      <div 
        className="min-h-screen text-white relative font-sans selection:bg-cyan-500/30"
        style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
      >
        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-slate-300/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-[1920px] mx-auto px-4 md:px-6 py-8 pt-20">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2 flex items-center gap-3">
                <Orbit className="w-10 h-10 text-cyan-400" />
                GALACTIC EXCHANGE
              </h1>
              <p className="text-slate-400 text-lg">
                Interstellar Trading Post • Live Network
              </p>
            </div>
            
            <div className="flex gap-3">
              <div className="px-4 py-2 rounded-2xl flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Balance</p>
                  <p className="text-xl font-bold text-white font-mono">24,500 AGP</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout */}
          <div className="flex gap-6">
            {/* Sidebar - KEPT as requested */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <TradingFilterSidebar filters={filters} setFilters={setFilters} />
            </aside>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              
              {/* Tabs & Search */}
              <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                <div className="flex bg-white/5 p-1 rounded-full backdrop-blur-md border border-white/10">
                  <button 
                    onClick={() => setActiveTab('market')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'market' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                  >
                    Global Market
                  </button>
                  <button 
                    onClick={() => setActiveTab('inventory')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-green-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                  >
                    Inventory
                  </button>
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:bg-white/10 transition-all"
                  />
                </div>
              </div>

              {/* Active Filters Display */}
              {(filters.category !== 'all' || filters.rarity.length > 0 || searchTerm) && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-white/40 text-xs uppercase tracking-wider font-medium">Active Filters:</span>
                  {filters.category !== 'all' && (
                    <Badge className="bg-white/10 text-white border-none px-3 py-1 flex items-center gap-2 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))}>
                      Type: {filters.category} <X className="w-3 h-3" />
                    </Badge>
                  )}
                  {filters.rarity.map(r => (
                    <Badge key={r} className="bg-white/10 text-white border-none px-3 py-1 flex items-center gap-2 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, rarity: prev.rarity.filter(x => x !== r) }))}>
                      {r} <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Content Switching */}
              <AnimatePresence mode="wait">
                {activeTab === 'market' ? (
                  /* MARKET VIEW: Horizontal Rows */
                  <motion.div
                    key="market"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h2 className="text-2xl font-bold text-white mb-6">Global Market</h2>
                    {Object.entries(marketCategories).map(([category, items]) => (
                      items.length > 0 && (
                        <MarketCategoryRow 
                          key={category} 
                          title={category} 
                          icon={category === 'Action' ? Sword : category === 'Trending' ? TrendingUp : null} 
                          items={items} 
                        />
                      )
                    ))}
                  </motion.div>
                ) : (
                  /* INVENTORY VIEW: Clean Grid (No Outer Box) */
                  <motion.div
                    key="inventory"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">My Inventory</h2>
                      <p className="text-slate-400 text-sm">{filteredInventory.length} Items</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredInventory.map((item) => (
                        <LiquidCard key={item.id} className="flex flex-col h-full border-white/5 bg-slate-900/20">
                          <div className="relative aspect-[16/9] overflow-hidden bg-slate-950 rounded-t-2xl">
                            <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                            <div className="absolute top-3 right-3">
                              <RarityBadge rarity={item.rarity} />
                            </div>
                            <div className="absolute bottom-3 left-3 right-3">
                              <h3 className="text-white font-bold text-lg truncate drop-shadow-md">{item.name}</h3>
                              <p className="text-white/70 text-xs">{item.game}</p>
                            </div>
                          </div>
                          
                          <div className="p-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-3">
                              <Badge variant="outline" className="border-white/10 text-white/60 text-[10px]">{item.type}</Badge>
                              <div className="text-green-400 font-mono font-bold text-sm">
                                Est. {item.price.toLocaleString()} AGP
                              </div>
                            </div>
                            
                            <p className="text-white/50 text-xs mb-4 line-clamp-2 flex-1">{item.description}</p>
                            
                            <div className="flex gap-2 mt-auto">
                              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 border-0">
                                Sell
                              </Button>
                              <Button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs h-9 border border-white/10">
                                Trade
                              </Button>
                            </div>
                          </div>
                        </LiquidCard>
                      ))}
                    </div>
                    
                    {filteredInventory.length === 0 && (
                      <div className="text-center py-20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-white/20" />
                        </div>
                        <h3 className="text-white font-bold text-lg">No items found</h3>
                        <p className="text-white/40 text-sm">Try adjusting your filters</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}