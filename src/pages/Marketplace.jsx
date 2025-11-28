import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel, Search, Filter, X, Zap, Shield, Sword, Bot, Mic, Send, Coins, Clock, ChevronDown, Tag, Gamepad2, Diamond, Store, TrendingUp, Flame, ArrowUp, ArrowLeft, Eye, Users, Star, Plus, Heart, Sparkles, Ghost, Skull, AlertTriangle, Lock, Unlock, Radio, Package
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

// --- Mock Data (Preserved & Enhanced) ---
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

const liveAuctions = [
  {
    id: 'a1',
    name: 'Dragonscale Helm of Ancient Wisdom',
    category: 'Helmet',
    currentBid: 45000,
    buyoutPrice: 75000,
    timeLeft: '2h 15m',
    bidders: 23,
    views: 156,
    image: 'https://images.unsplash.com/photo-1534944652934-245f95a7c93c?w=300&h=300&fit=crop',
    featured: true,
    rarity: 'Mythic',
    enchantments: ['+10 Wisdom', 'Dragon Sight'],
    activeBidding: true,
    game: 'Elder Scrolls: Reborn',
    level: 99,
    seller: 'SkyrimLord',
    gender: 'Male',
    faction: 'Vanguard',
    description: 'A legendary helm said to grant its wearer glimpses into forgotten knowledge and ancient power.',
    requirements: { level: 99, faction: 'Vanguard', gender: 'Male' },
    stats: { defense: 150, wisdom: 25, magic_resist: 30 },
    rating: 4.8,
    reviews: 23,
    origin_event: 'Dragon Lords Expansion',
    biddingHistory: [
      { bidder: 'PlayerOne', amount: 45000, time: '2 min ago' },
      { bidder: 'GamerTwo', amount: 43000, time: '5 min ago' },
      { bidder: 'DragonHunter', amount: 41000, time: '8 min ago' }
    ]
  },
  {
    id: 'a2',
    name: "The Butcher's Crimson Cleaver",
    category: 'Weapon',
    currentBid: 35000,
    buyoutPrice: 55000,
    timeLeft: '1h 43m',
    bidders: 18,
    views: 121,
    image: 'https://images.unsplash.com/photo-1608935436184-339c336b85a1?w=300&h=300&fit=crop',
    hot: true,
    rarity: 'Legendary',
    enchantments: ['Lifesteal', 'Sunder Armor'],
    activeBidding: false,
    game: 'Diablo II: Eternal',
    level: 92,
    seller: 'DiabloFan',
    gender: 'Unisex',
    faction: 'Vanguard',
    description: 'A gruesome cleaver, still dripping with the blood of countless demons. Its edge yearns for more.',
    requirements: { level: 92, faction: 'Vanguard', gender: 'Unisex' },
    stats: { attack: 200, lifesteal: 15, crit_chance: 12 },
    rating: 4.9,
    reviews: 47,
    origin_event: 'Hell Invasion Event',
    biddingHistory: [
      { bidder: 'OrcSlayer', amount: 35000, time: '10 min ago' },
      { bidder: 'WarriorQueen', amount: 33000, time: '15 min ago' }
    ]
  }
];

const rarityStyles = {
  Mythic: { text: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-950/80', glow: 'shadow-[0_0_15px_rgba(220,38,38,0.5)]' },
  Legendary: { text: 'text-orange-400', border: 'border-orange-500/50', bg: 'bg-orange-950/80', glow: 'shadow-[0_0_15px_rgba(234,88,12,0.5)]' },
  Epic: { text: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-950/80', glow: 'shadow-[0_0_15px_rgba(147,51,234,0.5)]' },
  Rare: { text: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-950/80', glow: 'shadow-[0_0_15px_rgba(37,99,235,0.5)]' },
  Uncommon: { text: 'text-green-400', border: 'border-green-500/50', bg: 'bg-green-950/80', glow: 'shadow-[0_0_15px_rgba(22,163,74,0.5)]' },
  Common: { text: 'text-slate-400', border: 'border-slate-500/50', bg: 'bg-slate-950/80', glow: 'shadow-none' }
};

// --- Core Hooks (Preserved) ---
const useAIRecommendations = (user, recentlyViewed, searchHistory) => {
  const [recommendations, setRecommendations] = useState([]);
  useEffect(() => {
    const generateRecommendations = () => {
      const mockRecommendations = allItems.slice(0, 6); // Simplified logic
      setRecommendations(mockRecommendations);
    };
    generateRecommendations();
  }, [user, recentlyViewed, searchHistory]);
  return recommendations;
};

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
  const removeFromWatchlist = useCallback((itemId) => {
    setWatchlist(prev => {
      const updated = prev.filter(i => i.id !== itemId);
      localStorage.setItem('marketplace_watchlist', JSON.stringify(updated));
      return updated;
    });
  }, []);
  const isWatched = useCallback((itemId) => watchlist.some(i => i.id === itemId), [watchlist]);
  return { watchlist, addToWatchlist, removeFromWatchlist, isWatched };
};

// --- New Vibrant UI Components ---

const NeonCard = ({ children, className = "", glowColor = "blue" }) => {
  return (
    <div className={`relative group overflow-hidden rounded-xl bg-black border border-slate-800 hover:border-${glowColor}-500/50 transition-all duration-300 ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-b from-${glowColor}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
      <div className={`absolute -inset-1 bg-gradient-to-r from-${glowColor}-500/20 via-purple-500/20 to-${glowColor}-500/20 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

const MarketFilterSidebar = ({ filters, setFilters }) => {
  return (
    <div className="w-72 flex-shrink-0 space-y-6 p-4 bg-black/40 backdrop-blur-md border-r border-white/5 h-full overflow-y-auto">
      <div className="flex items-center gap-2 text-white font-bold text-xl mb-6">
        <Filter className="w-5 h-5 text-cyan-400" />
        FILTERS
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Category</label>
          <Select value={filters.category} onValueChange={(v) => setFilters(f => ({ ...f, category: v }))}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['All', 'Weapon', 'Armor', 'Cybernetics', 'Misc'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Rarity</label>
          <div className="flex flex-wrap gap-2">
            {['All', 'Mythic', 'Legendary', 'Epic', 'Rare'].map(r => (
              <Badge
                key={r}
                onClick={() => setFilters(f => ({ ...f, rarity: r }))}
                className={`cursor-pointer transition-all ${filters.rarity === r ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {r}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Price Range</label>
          <Slider
            min={0} max={100000} step={1000}
            value={filters.price}
            onValueChange={(v) => setFilters(f => ({ ...f, price: v }))}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>{filters.price[0].toLocaleString()}</span>
            <span>{filters.price[1].toLocaleString()} AGP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ItemGridCard = ({ item, onClick }) => {
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
  
  return (
    <NeonCard glowColor={item.rarity === 'Mythic' ? 'red' : item.rarity === 'Legendary' ? 'orange' : 'blue'} className="cursor-pointer h-full flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-slate-900" onClick={() => onClick(item)}>
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        
        <div className="absolute top-2 right-2">
          <Badge className={`${rarity.bg} ${rarity.text} border ${rarity.border} backdrop-blur-md`}>
            {item.rarity}
          </Badge>
        </div>
        
        {item.hot && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-red-600 text-white border-red-500 animate-pulse">
              <Flame className="w-3 h-3 mr-1" /> HOT
            </Badge>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold truncate text-lg mb-1">{item.name}</h3>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Gamepad2 className="w-3 h-3" /> {item.game}
          </p>
        </div>
      </div>

      <div className="p-4 bg-slate-950/50 flex-grow flex flex-col justify-between border-t border-white/5">
        <div className="flex justify-between items-end mb-4">
          <div className="text-xs text-slate-500 font-mono uppercase">Current Price</div>
          <div className="text-xl font-bold text-cyan-400 font-mono tracking-tight">
            {item.price?.toLocaleString()} <span className="text-xs text-cyan-700">AGP</span>
          </div>
        </div>
        
        <Button 
          className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-cyan-500/50 transition-all group-hover:bg-cyan-600 group-hover:border-cyan-500"
          onClick={(e) => { e.stopPropagation(); onClick(item); }}
        >
          View Details
        </Button>
      </div>
    </NeonCard>
  );
};

const AuctionListRow = ({ auction, onClick }) => {
  const rarity = rarityStyles[auction.rarity] || rarityStyles.Common;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex items-center gap-4 p-3 bg-slate-900/40 border border-slate-800 rounded-xl hover:bg-slate-800/60 hover:border-orange-500/30 transition-all cursor-pointer"
      onClick={() => onClick(auction)}
    >
      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700">
        <img src={auction.image} alt={auction.name} className="w-full h-full object-cover" />
        {auction.activeBidding && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 text-white text-[10px] font-bold text-center py-0.5">
            LIVE BID
          </div>
        )}
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-white font-bold text-lg truncate group-hover:text-orange-400 transition-colors">{auction.name}</h3>
          <Badge className={`text-[10px] px-1.5 py-0 ${rarity.bg} ${rarity.text} border ${rarity.border}`}>
            {auction.rarity}
          </Badge>
        </div>
        <p className="text-sm text-slate-400 mb-2 line-clamp-1">{auction.description}</p>
        <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1 text-orange-400"><Clock className="w-3 h-3" /> {auction.timeLeft}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {auction.bidders} Bids</span>
        </div>
      </div>

      <div className="text-right min-w-[140px]">
        <div className="text-xs text-slate-500 uppercase mb-1">Highest Bid</div>
        <div className="text-2xl font-bold text-white font-mono tracking-tight mb-2">
          {auction.currentBid.toLocaleString()} <span className="text-sm text-slate-500">AGP</span>
        </div>
        <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold">
          PLACE BID
        </Button>
      </div>
    </motion.div>
  );
};

// --- Main Page Component ---

export default function MarketplacePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({ category: 'All', rarity: 'All', price: [0, 100000] });
  const [selectedTheme, setSelectedTheme] = useState('digital_matrix');
  
  // Auction State
  const [auctionSearchQuery, setAuctionSearchQuery] = useState('');
  const [selectedAuctionItem, setSelectedAuctionItem] = useState(null);

  // Hooks
  const { recentlyViewed, addToRecentlyViewed } = useRecentlyViewed();
  const watchlist = useWatchlist();

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

  // Auction Listings Generator
  const getAuctionListings = (baseItem) => {
    if (!baseItem) return [];
    return [
      { id: 'l1', seller: baseItem.seller, bid: baseItem.currentBid, time: baseItem.timeLeft, bidders: baseItem.bidders },
      { id: 'l2', seller: 'Trader_X', bid: Math.floor(baseItem.currentBid * 0.92), time: '45m', bidders: 12 },
      { id: 'l3', seller: 'VoidWalker', bid: Math.floor(baseItem.currentBid * 1.05), time: '3h 20m', bidders: 8 },
      { id: 'l4', seller: 'NexusVendor', bid: Math.floor(baseItem.currentBid * 0.98), time: '12m', bidders: 31 },
      { id: 'l5', seller: 'CyberSamurai', bid: Math.floor(baseItem.currentBid * 1.1), time: '5h', bidders: 5 },
    ].sort((a, b) => b.bid - a.bid);
  };

  const filteredAuctions = useMemo(() => {
    return liveAuctions.filter(item => 
      item.name.toLowerCase().includes(auctionSearchQuery.toLowerCase()) ||
      item.game.toLowerCase().includes(auctionSearchQuery.toLowerCase())
    );
  }, [auctionSearchQuery]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-transparent text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative">
        <ThemeBackground themeId={selectedTheme} />
        
        {/* Header Section */}
        <div className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0">
          <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-widest text-white leading-none">BLACK MARKET</h1>
                <p className="text-[10px] text-cyan-400 font-mono tracking-[0.2em] uppercase">Underground Network v9.0</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative bg-slate-900 border border-slate-700 rounded-lg flex items-center px-4 h-12">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <input 
                  type="text" 
                  placeholder="Search for illicit goods, weapons, data..." 
                  className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-600 font-mono text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex items-center gap-2 text-slate-600 text-xs font-mono border-l border-slate-800 pl-3 ml-2">
                  CMD+K
                </div>
              </div>
            </div>

            {/* User Stats */}
            <div className="flex items-center gap-6">
              <ThemeToggle selectedTheme={selectedTheme} onThemeSelect={setSelectedTheme} />
              
              <div className="text-right hidden md:block">
                <div className="text-xs text-slate-500 uppercase font-bold">Balance</div>
                <div className="text-xl font-bold text-cyan-400 font-mono">24,500 <span className="text-xs">AGP</span></div>
              </div>
              <div className="w-10 h-10 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer hover:border-cyan-500 transition-colors">
                <img src={user?.avatar_url || "https://github.com/shadcn.png"} className="w-full h-full rounded-full opacity-80 hover:opacity-100 transition-opacity" alt="User" />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="max-w-[1600px] mx-auto px-6 flex gap-8 text-sm font-medium tracking-wide border-t border-white/5">
            {[
              { id: 'browse', label: 'Browse Goods', icon: Package },
              { id: 'auctions', label: 'Live Auctions', icon: Gavel },
              { id: 'smuggler', label: "Smuggler's Den", icon: Skull }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'border-cyan-500 text-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-cyan-400' : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="relative z-10 flex h-[calc(100vh-140px)] max-w-[1600px] mx-auto">
          
          {/* Main Content */}
          <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
            
            {/* BROWSE TAB */}
            {activeTab === 'browse' && (
              <div className="space-y-8">
                {/* Featured Carousel */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-400" /> Featured Contraband
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {featuredItems.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="relative h-64 rounded-2xl overflow-hidden cursor-pointer group border border-slate-800 hover:border-yellow-500/50 transition-all"
                      >
                        <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={item.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6">
                          <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-500/50 mb-2">Featured</Badge>
                          <h3 className="text-2xl font-bold text-white mb-1">{item.name}</h3>
                          <p className="text-slate-300 text-sm line-clamp-1">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* All Items Grid */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">New Arrivals</h2>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-slate-400">View All</Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredItems.map(item => (
                      <ItemGridCard key={item.id} item={item} onClick={handleItemClick} />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* AUCTIONS TAB */}
            {activeTab === 'auctions' && (
              <div className="space-y-6">
                {!selectedAuctionItem ? (
                  // Auction Gallery View
                  <>
                    <div className="flex items-center justify-between bg-gradient-to-r from-orange-900/20 to-red-900/20 p-6 rounded-2xl border border-orange-500/20">
                      <div>
                        <h2 className="text-3xl font-black text-white mb-2">LIVE AUCTION HOUSE</h2>
                        <p className="text-slate-400">Bid on rare items in real-time. Select an item to view all sellers.</p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div className="text-sm text-slate-500 font-mono">ACTIVE AUCTIONS</div>
                        <div className="text-4xl font-mono font-bold text-orange-500">142</div>
                      </div>
                    </div>

                    {/* Auction Search */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        placeholder="Search auction items..."
                        value={auctionSearchQuery}
                        onChange={(e) => setAuctionSearchQuery(e.target.value)}
                        className="pl-12 h-12 bg-slate-900/50 border-slate-700 text-white w-full rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-3 space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Radio className="w-4 h-4 text-red-500 animate-pulse" /> Live Items
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredAuctions.map(auction => (
                            <AuctionListRow 
                              key={auction.id} 
                              auction={auction} 
                              onClick={() => setSelectedAuctionItem(auction)} 
                            />
                          ))}
                        </div>
                        {filteredAuctions.length === 0 && (
                          <div className="text-center py-12 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800">
                            <Ghost className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No active auctions found matching "{auctionSearchQuery}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  // Auction Detail View (List of Sellers)
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <Button 
                      variant="ghost" 
                      onClick={() => setSelectedAuctionItem(null)}
                      className="text-slate-400 hover:text-white pl-0 hover:bg-transparent"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back to Auctions
                    </Button>

                    {/* Item Header */}
                    <div className="flex gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                      <div className="w-32 h-32 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0">
                        <img src={selectedAuctionItem.image} alt={selectedAuctionItem.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-3xl font-bold text-white">{selectedAuctionItem.name}</h2>
                          <Badge className={`bg-slate-800 ${rarityStyles[selectedAuctionItem.rarity]?.text || 'text-white'}`}>
                            {selectedAuctionItem.rarity}
                          </Badge>
                        </div>
                        <p className="text-slate-400 mb-4 max-w-2xl">{selectedAuctionItem.description}</p>
                        <div className="flex gap-4 text-sm text-slate-500 font-mono">
                          <span className="flex items-center gap-1"><Gamepad2 className="w-4 h-4" /> {selectedAuctionItem.game}</span>
                          <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> {selectedAuctionItem.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sellers List */}
                    <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
                      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Users className="w-5 h-5 text-cyan-400" /> Active Listings
                        </h3>
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                          {getAuctionListings(selectedAuctionItem).length} Sellers
                        </Badge>
                      </div>
                      
                      <div className="divide-y divide-slate-800/50">
                        {getAuctionListings(selectedAuctionItem).map((listing, idx) => (
                          <div key={listing.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4 w-1/3">
                              <div className="text-slate-500 font-mono text-sm w-6">#{idx + 1}</div>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                                  {listing.seller.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-white font-bold">{listing.seller}</div>
                                  <div className="text-xs text-slate-500">Reputation: 98%</div>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-8 text-sm font-mono w-1/3">
                              <div>
                                <div className="text-slate-500 text-xs uppercase mb-1">Time Left</div>
                                <div className="text-orange-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {listing.time}
                                </div>
                              </div>
                              <div>
                                <div className="text-slate-500 text-xs uppercase mb-1">Bids</div>
                                <div className="text-slate-300">{listing.bidders}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 w-1/3 justify-end">
                              <div className="text-right">
                                <div className="text-slate-500 text-xs uppercase mb-1">Current Bid</div>
                                <div className="text-xl font-bold text-white">{listing.bid.toLocaleString()} AGP</div>
                              </div>
                              <Button className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6">
                                BID
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* SMUGGLER TAB */}
            {activeTab === 'smuggler' && (
              <div className="flex flex-col items-center justify-center h-full text-center p-12">
                <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800">
                  <Lock className="w-10 h-10 text-slate-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-300 mb-2">Restricted Area</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                  You need a higher reputation level to access the Smuggler's Den. Complete more trades to unlock high-tier illegal contracts.
                </p>
                <Button variant="outline" disabled className="opacity-50">Access Denied (Lvl 10 Required)</Button>
              </div>
            )}

          </div>

          {/* Sidebar Filters (Only on Browse) */}
          {activeTab === 'browse' && (
            <MarketFilterSidebar filters={filters} setFilters={setFilters} />
          )}
        </div>

        {/* Item Modal (Simplified for new design) */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl relative"
              >
                <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X /></button>
                <div className="flex flex-col md:flex-row h-[600px]">
                  <div className="w-full md:w-1/2 bg-black relative">
                    <img src={selectedItem.image} className="w-full h-full object-cover opacity-80" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6">
                      <h2 className="text-3xl font-black text-white mb-2">{selectedItem.name}</h2>
                      <div className="flex gap-2">
                        <Badge className="bg-slate-800 border-slate-600">{selectedItem.category}</Badge>
                        <Badge className="bg-slate-800 border-slate-600">{selectedItem.rarity}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 p-8 flex flex-col">
                    <div className="flex-grow">
                      <h3 className="text-slate-500 font-bold uppercase text-sm mb-4">Item Details</h3>
                      <p className="text-slate-300 leading-relaxed mb-6 text-lg">{selectedItem.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                          <div className="text-slate-500 text-xs uppercase">Seller</div>
                          <div className="text-white font-mono">{selectedItem.seller}</div>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                          <div className="text-slate-500 text-xs uppercase">Origin</div>
                          <div className="text-white font-mono">{selectedItem.game}</div>
                        </div>
                      </div>

                      {selectedItem.stats && (
                        <div className="space-y-2">
                          <div className="text-slate-500 text-xs uppercase">Stats</div>
                          {Object.entries(selectedItem.stats).map(([key, val]) => (
                            <div key={key} className="flex justify-between text-sm border-b border-slate-800 pb-1">
                              <span className="text-slate-400 capitalize">{key.replace('_', ' ')}</span>
                              <span className="text-green-400 font-mono">+{val}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-800">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-slate-400 text-sm">Total Price</div>
                        <div className="text-3xl font-bold text-cyan-400 font-mono">{selectedItem.price?.toLocaleString()} AGP</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Button className="bg-cyan-600 hover:bg-cyan-500 text-white py-6 text-lg font-bold">BUY NOW</Button>
                        <Button variant="outline" className="py-6 text-lg border-slate-700 hover:bg-slate-800">OFFER TRADE</Button>
                      </div>
                    </div>
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