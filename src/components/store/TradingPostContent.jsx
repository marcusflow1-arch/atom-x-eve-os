import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Mic, MicOff, X, Plus, Eye, Clock, Coins, Gavel, ArrowLeftRight,
  Package, Star, Zap, Shield, Sword, Users, Bot, TrendingUp, Calendar, MessageSquare,
  Grid, List, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Tag, Gamepad2, Diamond, Heart, Share2, AlertCircle,
  CheckCircle, Timer, DollarSign, Sparkles, Crown, Flame, Rocket, Globe, Orbit, Info,
  SlidersHorizontal, ScrollText, Database, Hammer, Crosshair, ArrowUpDown
} from 'lucide-react';
import VirtualizedTradeGrid from './VirtualizedTradeGrid';
import StoreRecommendationsSidebar from './StoreRecommendationsSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../CartContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShoppingCart } from 'lucide-react';
import { Game } from '@/entities/Game';
import { aiGamesList, otherSampleGames } from './mockData';
import ShinyCard from '@/components/shared/ShinyCard';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import InventoryItemOverlay from './InventoryItemOverlay';

// --- Liquid Glass Components (Reused) ---
const LiquidCard = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 
      shadow-lg hover:shadow-blue-500/20 transition-all duration-300 group ${className}
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    {children}
  </div>
);

const HollowCard = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`
      relative w-48 h-72 flex-shrink-0 rounded-xl border-2 border-white/10 
      bg-transparent hover:border-cyan-400/50 transition-all duration-300 group
      overflow-hidden cursor-pointer ${className}
    `}
  >
    <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-white/[0.05] transition-colors" />
    {/* Inner Border/Glow */}
    <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />
    {/* Diagonal shine line */}
    <div className="absolute inset-0 -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12" />
    
    <div className="relative z-10 p-4 h-full flex flex-col">
        {children}
    </div>
  </div>
);

// --- Filter Sidebar ---
const TradingFilterSidebar = ({ 
  filters, setFilters
}) => {
  // Custom Trading Post Categories
  const categories = [
    { id: 'all', label: 'All Listings', icon: Grid },
    { id: 'global', label: 'Global Market', icon: Globe },
    { id: 'weapon', label: 'Weapons & Tools', icon: Sword },
    { id: 'armor', label: 'Armor & Suits', icon: Shield },
    { id: 'tech', label: 'Tech & Cyberware', icon: Zap },
    { id: 'magic', label: 'Spells & Tomes', icon: Sparkles },
    { id: 'blueprint', label: 'Blueprints', icon: ScrollText },
    { id: 'material', label: 'Raw Materials', icon: Hammer },
    { id: 'consumable', label: 'Consumables', icon: Database },
  ];

  const toggleRarity = (r) => {
    setFilters(prev => ({
      ...prev,
      rarity: prev.rarity.includes(r) ? prev.rarity.filter(x => x !== r) : [...prev.rarity, r]
    }));
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-lg h-full overflow-y-auto custom-scrollbar">
      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2 uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          Categories
        </h3>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                filters.category === cat.id 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <cat.icon className={`w-4 h-4 ${filters.category === cat.id ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Rarity Filter */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Rarity</h3>
        <div className="space-y-2">
          {['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'].map((rarity) => (
            <label key={rarity} className="flex items-center gap-3 cursor-pointer group p-1 rounded hover:bg-white/5">
              <Checkbox 
                checked={filters.rarity.includes(rarity)}
                onCheckedChange={() => toggleRarity(rarity)}
                className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
              />
              <span className={`text-sm transition-colors ${filters.rarity.includes(rarity) ? 'text-white font-medium' : 'text-slate-400 group-hover:text-white'}`}>
                {rarity}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Price Range</h3>
        <div className="px-1">
          <Slider
            value={filters.priceRange}
            onValueChange={(val) => setFilters(prev => ({ ...prev, priceRange: val }))}
            max={10000}
            min={0}
            step={100}
            className="mb-3"
          />
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>{filters.priceRange[0]} AGP</span>
            <span>{filters.priceRange[1]} AGP</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setFilters({ category: 'all', rarity: [], priceRange: [0, 10000] })}
        className="w-full mt-6 py-3 text-sm text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all font-medium flex items-center justify-center gap-2"
      >
        <Filter className="w-3 h-3" />
        Reset Filters
      </button>
    </div>
  );
};

const GalacticCard = ({ children, className = "", hoverEffect = true }) => (
  <div 
    className={`
      relative rounded-2xl overflow-hidden
      ${hoverEffect ? 'hover:shadow-[0_0_30px_rgba(150,180,220,0.15)] transition-all duration-300' : ''}
      ${className}
    `}
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
    }}
  >
    {children}
  </div>
);

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

// Mock Data
const userInventory = [
  {
    id: 'inv_1',
    name: 'Dragonscale Armor Set',
    type: 'Armor',
    game: 'Elder Scrolls: Reborn',
    genre: 'Fantasy RPG',
    rarity: 'Legendary',
    quantity: 1,
    dateAcquired: '2024-01-15',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    description: 'Complete armor set forged from ancient dragon scales',
    stats: { defense: 250, magic_resist: 100 },
    tradeable: true
  },
  {
    id: 'inv_2',
    name: 'Cyber Neural Interface',
    type: 'Cybernetics',
    game: 'Cyberpunk 2088',
    genre: 'Sci-Fi',
    rarity: 'Epic',
    quantity: 1,
    dateAcquired: '2024-01-12',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop',
    description: 'Advanced neural interface for enhanced hacking abilities',
    stats: { hacking: 150, reaction_time: 25 },
    tradeable: true
  },
  {
    id: 'inv_3',
    name: 'Phoenix Fire Spell',
    type: 'Ability',
    game: 'Mage Wars Online',
    genre: 'MMORPG',
    rarity: 'Mythic',
    quantity: 1,
    dateAcquired: '2024-01-10',
    image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=300&fit=crop',
    description: 'Legendary spell that summons phoenix flames',
    stats: { damage: 500, mana_cost: 100 },
    tradeable: true
  },
  {
    id: 'inv_4',
    name: 'Quantum Rifle MK-VII',
    type: 'Weapon',
    game: 'Galactic Warfare',
    genre: 'Shooter',
    rarity: 'Epic',
    quantity: 2,
    dateAcquired: '2024-01-08',
    image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=300&h=300&fit=crop',
    description: 'High-tech quantum rifle with energy burst capabilities',
    stats: { damage: 180, range: 300 },
    tradeable: true
  }
];

const tradeListings = [
  {
    id: 'trade_1',
    item: userInventory[0],
    owner: { name: 'SkyrimLord', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=face' },
    type: 'trade',
    seekingItems: ['Plasma Rifle', 'Cyber Armor'],
    description: 'Looking for sci-fi gear to complete my cyberpunk build',
    postedDate: '2024-01-16',
    expiresDate: '2024-01-23',
    status: 'active',
    views: 156,
    offers: 12
  },
  {
    id: 'trade_1_b',
    item: userInventory[0],
    owner: { name: 'DragonSlayer99', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop&crop=face' },
    type: 'sale',
    price: 45000,
    description: 'Selling my spare armor set. Gold only.',
    postedDate: '2024-01-17',
    expiresDate: '2024-01-24',
    status: 'active',
    views: 42,
    offers: 0
  },
  {
    id: 'trade_1_c',
    item: userInventory[0],
    owner: { name: 'MerchantGuild_Rep', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=64&h=64&fit=crop&crop=face' },
    type: 'bid',
    currentBid: 12000,
    buyoutPrice: 60000,
    description: 'Auctioning this legendary set. Starting low!',
    postedDate: '2024-01-18',
    expiresDate: '2024-01-25',
    status: 'active',
    bidders: 15,
    views: 300
  },
  {
    id: 'trade_2',
    item: userInventory[1],
    owner: { name: 'CyberNinja', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face' },
    type: 'bid',
    currentBid: 15000,
    buyoutPrice: 25000,
    description: 'Rare cybernetics from the Neural Wars event',
    postedDate: '2024-01-15',
    expiresDate: '2024-01-22',
    status: 'active',
    bidders: 8,
    views: 234
  },
  {
    id: 'trade_3',
    item: userInventory[2],
    owner: { name: 'MysticMage', avatar: 'https://images.unsplash.com/photo-1494790108755-2616c727e3d9?w=64&h=64&fit=crop&crop=face' },
    type: 'sale',
    price: 35000,
    description: 'Mythic spell from limited-time Phoenix Rising event',
    postedDate: '2024-01-14',
    status: 'active',
    views: 189,
    watchers: 23
  }
];

const SwordsIcon = ({ className }) => <Sword className={className} />;

const GalacticInventoryItem = ({ item, onClick }) => {
  const rarityColors = {
    Mythic: "from-red-500/20 to-red-900/20 border-red-500/50",
    Legendary: "from-orange-500/20 to-orange-900/20 border-orange-500/50",
    Epic: "from-purple-500/20 to-purple-900/20 border-purple-500/50",
    Rare: "from-blue-500/20 to-blue-900/20 border-blue-500/50",
    Uncommon: "from-green-500/20 to-green-900/20 border-green-500/50",
    Common: "from-slate-500/20 to-slate-900/20 border-slate-500/50"
  };

  const borderStyle = rarityColors[item.rarity] || rarityColors.Common;

  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02, rotateY: 5 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={() => onClick(item)}
      className={`
        relative group cursor-pointer w-full aspect-[2.5/3.5] rounded-xl overflow-hidden 
        border-[3px] ${borderStyle.split(' ')[2]} bg-slate-900
        shadow-xl hover:shadow-2xl transition-all duration-300
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-30 z-20 pointer-events-none transition-opacity duration-500 mix-blend-overlay" />
      
      <div className="absolute top-0 left-0 right-0 h-8 bg-slate-950/90 z-10 flex items-center justify-between px-2 border-b border-white/10">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate max-w-[60%]">{item.type}</span>
        <div className="flex items-center gap-1">
           {item.quantity > 1 && <span className="text-[10px] font-mono text-cyan-400">x{item.quantity}</span>}
           <div className={`w-2 h-2 rounded-full ${item.rarity === 'Legendary' || item.rarity === 'Mythic' ? 'bg-yellow-400 animate-pulse' : 'bg-slate-600'}`} />
        </div>
      </div>

      <div className="absolute top-8 left-1 right-1 bottom-[35%] rounded-lg overflow-hidden border border-white/5 bg-black">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
      </div>

      <div className={`absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-b ${borderStyle.split(' ')[0]} ${borderStyle.split(' ')[1]} p-3 flex flex-col justify-between backdrop-blur-sm`}>
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-white truncate pr-2" title={item.name}>{item.name}</h3>
            <RarityBadge rarity={item.rarity} />
          </div>
          <p className="text-[10px] text-slate-300 line-clamp-2 leading-tight italic opacity-80">
            "{item.description}"
          </p>
        </div>

        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
          <div className="flex flex-col">
             <span className="text-[8px] text-slate-400 uppercase">Game Origin</span>
             <span className="text-[10px] text-white font-medium truncate max-w-[80px]">{item.game}</span>
          </div>
          <Badge className="bg-blue-900/30 text-blue-300 text-[9px] border-0">
             <Globe className="w-2 h-2 mr-1" /> Global
          </Badge>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-white/10 hover:bg-white/20 text-white border border-white/10">
            TRADE
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default function TradingPostContent() {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('board');
  const [inventory] = useState(userInventory);
  const [listings, setListings] = useState(tradeListings);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [modalInitialType, setModalInitialType] = useState('trade');
  const [selectedListingGroup, setSelectedListingGroup] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [offerSort, setOfferSort] = useState('price-low');
  const [offerTypeFilter, setOfferTypeFilter] = useState('all');
  const [sellerAction, setSellerAction] = useState({ open: false, offer: null });
  const [offerPrice, setOfferPrice] = useState('');
  const [ultimatumText, setUltimatumText] = useState("I know you want cash, but I can offer a trade instead. Here's my proposal:");

  // Fetch trade offers from backend
  const { data: globalOffers } = useQuery({
    queryKey: ['tradeOffers'],
    queryFn: async () => {
      const result = await base44.entities.TradeOffer.filter({ status: 'active' }, '-created_date', 100);
      return result || [];
    },
    initialData: []
  });
  
  // Filter State
  const [filters, setFilters] = useState({
    category: 'all',
    rarity: [],
    priceRange: [0, 10000]
  });

  const [subTabGenre, setSubTabGenre] = useState(null);
  const [subTabGame, setSubTabGame] = useState(null);
  const [inventorySearch, setInventorySearch] = useState('');
  const [allStoreGames, setAllStoreGames] = useState([]);

  useEffect(() => {
    const fetchGames = async () => {
        try {
            const fetchedGames = await Game.list();
            const enhancedGames = fetchedGames.length > 0 ? fetchedGames : [
                ...aiGamesList,
                ...otherSampleGames
            ];
            setAllStoreGames(enhancedGames);
        } catch (error) {
            console.error("Error fetching games:", error);
            setAllStoreGames([...aiGamesList, ...otherSampleGames]);
        }
    };
    fetchGames();
  }, []);

  const GENRE_GAMES = useMemo(() => ({
    "MMORPG": ["Skyrim Online", "World of Warcraft", "Elder Scrolls Online"],
    "Sci-Fi": ["Star Wars: Galaxy", "Mass Effect", "Cyberpunk 2088"],
    "Fantasy": ["Final Fantasy XIV", "The Witcher 3", "Baldur's Gate 3"],
    "Shooter": ["Resident Evil", "Call of Duty Black Ops", "Apex Legends"],
    "RPG": ["Fire Emblem", "Sacred Swords", "Persona 5"],
    "Action": ["Street Fighter 6", "Devil May Cry 5", "Hades"],
    "Adventure": ["Legend of K", "Tomb Raider", "Uncharted"]
  }), []);

  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [showInventoryOverlay, setShowInventoryOverlay] = useState(false);

  // Cross Interface State
  const [activeGenreIndex, setActiveGenreIndex] = useState(0);
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const [crossViewLevel, setCrossViewLevel] = useState(0); // 0: Genre/Game Selection, 1: Game Items
  const [activeCrossGame, setActiveCrossGame] = useState(null);
  const [activeCrossItem, setActiveCrossItem] = useState(null);

  // Mock Item Generator
  const generateGameItems = (game) => {
    const types = ['Weapon', 'Armor', 'Ability', 'Consumable', 'Material', 'Tech', 'Blueprint'];
    const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
    
    // Deterministic pseudo-random based on game ID
    const seed = game.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const itemCount = 12 + (seed % 10); // 12-21 items per game
    
    return Array.from({ length: itemCount }).map((_, i) => {
        const typeIndex = (seed + i) % types.length;
        const rarityIndex = (seed + i * 2) % rarities.length;
        return {
            id: `${game.id}_item_${i}`,
            name: `${game.title.split(' ')[0]} ${types[typeIndex]} ${i + 1}`,
            type: types[typeIndex],
            rarity: rarities[rarityIndex],
            game: game.title,
            image: game.cover_image || game.image, // Fallback to game image for now, ideally specific item art
            description: `A ${rarities[rarityIndex]} ${types[typeIndex]} from ${game.title}.`,
            level: 1 + (i * 5),
            power: 100 + (i * 50),
            marketPrice: 100 + (i * 150),
            demand: i % 3 === 0 ? "High" : "Normal"
        };
    });
  };

  // Group Games for Cross Interface
  const crossData = useMemo(() => {
    if (!allStoreGames.length) return [];

    // 1. Group games by genre
    const groups = {};
    
    allStoreGames.forEach(game => {
        const genre = game.genre || 'Other';
        
        // Generate items for the game to check filters
        const items = generateGameItems(game);
        
        // Apply Category Filters
        const filteredItems = items.filter(item => {
            // Category Filter
            if (filters.category !== 'all' && filters.category !== 'global') {
                const cat = filters.category;
                if (cat === 'weapon' && item.type !== 'Weapon') return false;
                if (cat === 'armor' && item.type !== 'Armor') return false;
                if (cat === 'consumable' && item.type !== 'Consumable') return false;
                if (cat === 'material' && item.type !== 'Material') return false;
                if (cat === 'magic' && item.type !== 'Ability') return false;
                if (cat === 'tech' && item.type !== 'Tech') return false;
                if (cat === 'blueprint' && item.type !== 'Blueprint') return false;
            }
            
            // Rarity Filter
            if (filters.rarity.length > 0 && !filters.rarity.includes(item.rarity)) return false;
            
            // Price Filter
            if (item.marketPrice < filters.priceRange[0] || item.marketPrice > filters.priceRange[1]) return false;
            
            return true;
        });

        const hasMatchingItems = filteredItems.length > 0;
        
        if (hasMatchingItems) {
            if (!groups[genre]) {
                groups[genre] = {
                    id: genre,
                    label: genre,
                    icon: genre === 'Action' ? Rocket : 
                          genre === 'RPG' ? Shield : 
                          genre === 'Sci-Fi' ? Zap : 
                          genre === 'Fantasy' ? Sparkles : 
                          genre === 'Shooter' ? Crosshair : Grid,
                    games: []
                };
            }
            // Store game with its filtered items
            groups[genre].games.push({
                ...game,
                filteredItems: filteredItems
            });
        }
    });

    return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
  }, [allStoreGames, filters]);

  const getGameDetails = (gameName) => {
    return {
      items: [
        { id: 1, name: "Void Walker's Blade", type: "Weapon", rarity: "Legendary", level: 60, power: 850, marketPrice: 4500, demand: "High", description: "A blade forged from the essence of the void itself. Vibrates with dark energy." },
        { id: 2, name: "Cybernetic Core", type: "Material", rarity: "Epic", level: 1, power: 0, marketPrice: 1200, demand: "Medium", description: "Essential component for high-grade cyberware upgrades." },
      ],
      currency: { name: "Gold", amount: 14520 }
    };
  };

  // Keyboard Navigation for Cross Interface
  useEffect(() => {
    if (activeTab !== 'board' || selectedListingGroup) return;

    const handleKeyDown = (e) => {
        const key = e.key.toLowerCase();
        
        if (crossViewLevel === 0) {
            // Navigation Mode
            if (key === 'w' || key === 'arrowup') {
                setActiveGenreIndex(prev => Math.max(0, prev - 1));
                setActiveGameIndex(0);
            } else if (key === 's' || key === 'arrowdown') {
                setActiveGenreIndex(prev => Math.min(crossData.length - 1, prev + 1));
                setActiveGameIndex(0);
            } else if (key === 'a' || key === 'arrowleft') {
                setActiveGameIndex(prev => Math.max(0, prev - 1));
            } else if (key === 'd' || key === 'arrowright') {
                const currentGenre = crossData[activeGenreIndex];
                if (currentGenre) {
                    setActiveGameIndex(prev => Math.min(currentGenre.games.length - 1, prev + 1));
                }
            } else if (key === 'enter') {
                const genre = crossData[activeGenreIndex];
                const game = genre?.games[activeGameIndex];
                if (game) {
                    setActiveCrossGame(game);
                    setCrossViewLevel(1);
                }
            }
        } else if (crossViewLevel === 1) {
            // Idol Mode
            if (key === 'enter') {
                setCrossViewLevel(2);
                const game = crossData[activeGenreIndex].games[activeGameIndex];
                const group = {
                    item: {
                        name: game.title,
                        description: `Browse all available listings for ${game.title}`,
                        type: 'Game Hub',
                        game: game.title,
                        image: game.image,
                        rarity: 'Legendary' // Visual flare
                    },
                    offers: game.listings
                };
                setSelectedListingGroup(group);
            } else if (key === 'escape' || key === 'backspace') {
                setCrossViewLevel(0);
                setActiveCrossGame(null);
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, crossData, activeGenreIndex, activeGameIndex, crossViewLevel, selectedListingGroup]);


  // Mutation to create trade offer
  const createOfferMutation = useMutation({
    mutationFn: async (offerData) => {
      return await base44.entities.TradeOffer.create(offerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tradeOffers']);
      setShowTradeModal(false);
      setSelectedItem(null);
    }
  });

  const handleTradePost = async (postData) => {
    const expiresAt = new Date(Date.now() + (postData.expirationDays * 24 * 60 * 60 * 1000)).toISOString();
    
    const offerData = {
      trader_id: user?.id || 'anonymous',
      trader_name: user?.full_name || user?.username || 'Player',
      trader_avatar: user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=face',
      item_name: postData.item.name,
      item_type: postData.item.type,
      item_rarity: postData.item.rarity,
      item_image: postData.item.image,
      item_description: postData.item.description,
      item_level: postData.item.level,
      item_power: postData.item.power,
      game_name: postData.item.game,
      game_genre: postData.item.genre || 'General',
      offer_type: postData.type,
      price: postData.salePrice || null,
      current_bid: postData.minBid || null,
      buyout_price: postData.buyoutPrice || null,
      seeking_items: postData.seekingItems || [],
      description: postData.description,
      status: 'active',
      expires_at: expiresAt,
      last_bid_price: postData.item.marketPrice ? Math.floor(postData.item.marketPrice * 0.8) : null,
      last_sale_price: postData.item.marketPrice || null,
      views: 0,
      offers_count: 0
    };

    createOfferMutation.mutate(offerData);
  };

  return (
    <div className="relative z-10 max-w-[1920px] mx-auto px-4 md:px-6 py-4 h-[calc(100vh-80px)]">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex gap-6">
        
        {/* LEFT COLUMN: Header & Sidebar Controls */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-6">
           {/* HEADER */}
           <div>
              <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-1 flex items-center gap-2">
                <Orbit className="w-6 h-6 text-cyan-400" />
                GALACTIC EXCHANGE
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Interstellar Trading Post</p>
           </div>

           {/* BALANCE */}
           <div 
              className="px-4 py-3 rounded-2xl flex items-center gap-3 w-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Your Balance</p>
                <p className="text-lg font-bold text-white font-mono truncate">24,500 AGP</p>
              </div>
           </div>

           {/* SIDEBARS (Conditionally rendered via TabsContent) */}
           <TabsContent value="board" className="flex-1 min-h-0 data-[state=inactive]:hidden mt-0">
              <div className="h-full flex flex-col">
                {crossViewLevel === 0 ? (
                  // LEVEL 0: Genre Selection Sidebar
                  <div className="p-5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-lg h-full overflow-y-auto custom-scrollbar">
                    <div className="mb-4">
                      <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2 uppercase tracking-wider">
                        <Grid className="w-4 h-4 text-cyan-400" />
                        Game Genres
                      </h3>
                      <div className="space-y-1">
                        {crossData.map((genre, idx) => (
                          <button
                            key={genre.id}
                            onClick={() => setActiveGenreIndex(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                              activeGenreIndex === idx 
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <genre.icon className={`w-4 h-4 ${activeGenreIndex === idx ? 'text-cyan-400' : 'text-slate-500'}`} />
                            <span>{genre.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // LEVEL 1: Item Filters Sidebar
                  <TradingFilterSidebar filters={filters} setFilters={setFilters} />
                )}
              </div>
           </TabsContent>

           <TabsContent value="subtab" className="flex-1 min-h-0 data-[state=inactive]:hidden mt-0">
              <div className="h-full flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search inventory..." 
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="pl-9 bg-slate-900/40 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
                  />
                </div>

                <div className="flex-1 p-5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col overflow-hidden">
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Grid className="w-4 h-4 text-cyan-500" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Game Genres</h3>
                      </div>
                      <p className="text-[10px] text-slate-400">Select a category</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                      {[
                        "MMORPG", "Sci-Fi", "Fantasy", "Shooter", "RPG", "Action", "Adventure", 
                        "Strategy", "Sports", "Racing", "Simulation", "Puzzle", "Horror", 
                        "Survival", "MOBA", "Battle Royale", "Sandbox", "Stealth", "Fighting", "Platformer"
                      ]
                      .filter(genre => genre.toLowerCase().includes(inventorySearch.toLowerCase()))
                      .map((genre) => (
                        <button 
                          key={genre}
                          onClick={() => { setSubTabGenre(genre); setSubTabGame(null); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${subTabGenre === genre ? 'bg-cyan-900/20 text-cyan-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                          {genre}
                          {(subTabGenre === genre) && <ChevronRight className="w-3 h-3 text-cyan-500" />}
                        </button>
                      ))}
                    </div>
                </div>
              </div>
           </TabsContent>
        </div>

        {/* RIGHT COLUMN: Tabs List & Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
           {/* TOP BAR: TABS & SEARCH */}
           <div className="flex items-center justify-between mb-6">
              <TabsList 
                className="p-1 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <TabsTrigger 
                  value="board" 
                  className="rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                >
                  Global Market
                </TabsTrigger>

                <TabsTrigger 
                  value="subtab" 
                  className="rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all"
                >
                  Inventory
                </TabsTrigger>
              </TabsList>

              {/* Breadcrumb/Back & Search (Only for Board Tab usually, but depends on context) */}
              <div className="flex items-center gap-4">
                {(activeTab === 'board' && (crossViewLevel === 1 || selectedListingGroup || selectedOffer)) && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => {
                        if (selectedOffer) {
                            setSelectedOffer(null);
                        } else if (selectedListingGroup) {
                            setSelectedListingGroup(null);
                        } else {
                            setCrossViewLevel(0);
                            setActiveCrossGame(null);
                        }
                    }}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <ChevronLeft className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">Back</span>
                  </motion.button>
                )}

                {(activeTab === 'board') && (
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white mr-4 hidden xl:block">
                      {selectedOffer ? `${selectedOffer.seller.name}'s Offer` : selectedListingGroup ? selectedListingGroup.item.name : crossViewLevel === 1 ? activeCrossGame?.title : 'Market Overview'}
                    </h2>
                    
                    <div 
                      className="flex items-center gap-3 px-4 py-2 rounded-full"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <Search className="w-4 h-4 text-white/50" />
                      <input 
                        type="text" 
                        placeholder="Search market..."
                        className="bg-transparent border-none outline-none text-white placeholder:text-white/40 text-sm w-48"
                      />
                    </div>

                    <Link to={createPageUrl('Cart')} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all relative backdrop-blur-md border border-white/10">
                      <ShoppingCart className="w-4 h-4 text-white/80" />
                      {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
                    </Link>
                  </div>
                )}
              </div>
           </div>

           {/* CONTENT AREA */}
           <div className="flex-1 overflow-hidden relative">
              <TabsContent value="board" className="h-full mt-0 data-[state=inactive]:hidden">
                <AnimatePresence mode="wait">
                  {crossViewLevel === 0 ? (
                      // LEVEL 0: Game Selection View
                      <motion.div
                          key="level-0-games"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="h-full flex gap-6"
                      >
                          {/* LEFT: Game List */}
                          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
                              <div className="space-y-2">
                                  {crossData[activeGenreIndex]?.games.map((game, idx) => (
                                      <motion.button 
                                          key={game.id} 
                                          initial={{ opacity: 0, y: 20 }} 
                                          animate={{ opacity: 1, y: 0 }} 
                                          transition={{ delay: idx * 0.05 }}
                                          onClick={() => {
                                              setActiveCrossGame(game);
                                              setCrossViewLevel(1);
                                          }}
                                          className="group w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20 transition-all text-left"
                                      >
                                          <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-white/10">
                                              <img src={game.cover_image || game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <h4 className="font-semibold text-white truncate">{game.title}</h4>
                                              <div className="flex items-center gap-2 text-xs text-white/50">
                                                  <span>{game.genre}</span>
                                                  <span>•</span>
                                                  <span className="text-cyan-400 font-mono">{game.filteredItems.length} items</span>
                                              </div>
                                          </div>
                                      </motion.button>
                                  ))}
                              </div>
                          </div>

                          {/* DIVIDER */}
                          <div className="w-px bg-white/10 flex-shrink-0" />

                          {/* RIGHT: Recommendations Sidebar */}
                          <StoreRecommendationsSidebar onGameSelect={(game) => {
                              setActiveCrossGame(game);
                              setCrossViewLevel(1);
                          }} />
                      </motion.div>
                  ) : !selectedListingGroup ? (
                    // LEVEL 1: Item Listing View (Existing)
                    <motion.div
                      key="cross-interface"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="relative w-full h-full"
                    >
                      <div className="flex-1 overflow-y-auto custom-scrollbar relative pr-2 h-full pb-6">
                              {(() => {
                                const filteredItems = generateGameItems(activeCrossGame).filter(item => {
                                  if (filters.category !== 'all' && filters.category !== 'global') {
                                      const cat = filters.category;
                                      if (cat === 'weapon' && item.type !== 'Weapon') return false;
                                      if (cat === 'armor' && item.type !== 'Armor') return false;
                                      if (cat === 'consumable' && item.type !== 'Consumable') return false;
                                      if (cat === 'material' && item.type !== 'Material') return false;
                                      if (cat === 'magic' && item.type !== 'Ability') return false;
                                      if (cat === 'tech' && item.type !== 'Tech') return false;
                                      if (cat === 'blueprint' && item.type !== 'Blueprint') return false;
                                  }
                                  if (filters.rarity.length > 0 && !filters.rarity.includes(item.rarity)) return false;
                                  if (item.marketPrice < filters.priceRange[0] || item.marketPrice > filters.priceRange[1]) return false;
                                  return true;
                                });

                                return (
                                  <VirtualizedTradeGrid
                                    items={filteredItems}
                                    onSelectItem={(item) => {
                                     // Get real offers from backend for this item and game
                                     const realOffers = globalOffers.filter(offer => 
                                       offer.item_name === item.name && offer.game_name === item.game
                                     ).map(offer => ({
                                       id: offer.id,
                                       seller: { 
                                         name: offer.trader_name, 
                                         avatar: offer.trader_avatar, 
                                         rating: 4.5 
                                       },
                                       modes: [offer.offer_type],
                                       price: offer.price || offer.buyout_price || offer.current_bid,
                                       currentBid: offer.current_bid,
                                       buyoutPrice: offer.buyout_price,
                                       seeking: offer.seeking_items,
                                       description: offer.description,
                                       postedAt: new Date(offer.created_date).toLocaleString(),
                                       endsAt: offer.expires_at ? new Date(offer.expires_at).toLocaleDateString() : null,
                                       createdAt: new Date(offer.created_date)
                                     }));

                                     // Fallback mock offers if no real offers exist
                                     const mockOffers = realOffers.length > 0 ? realOffers : [
                                        {
                                            id: `offer_${item.id}_1`,
                                            seller: { name: 'MarketBot', avatar: item.image, rating: 4.5 },
                                            modes: ['sale'],
                                            price: item.marketPrice,
                                            description: 'Direct market listing. Fixed price.',
                                            postedAt: '2 hours ago',
                                            createdAt: new Date()
                                        }
                                     ];

                                     // Filter and sort offers
                                     let processedOffers = [...mockOffers];

                                      // Filter by type
                                      if (offerTypeFilter !== 'all') {
                                       processedOffers = processedOffers.filter(o => o.modes.includes(offerTypeFilter));
                                      }

                                      // Sort
                                      if (offerSort === 'price-low') {
                                       processedOffers.sort((a, b) => (a.price || a.currentBid || 0) - (b.price || b.currentBid || 0));
                                      } else if (offerSort === 'price-high') {
                                       processedOffers.sort((a, b) => (b.price || b.buyoutPrice || 0) - (a.price || a.buyoutPrice || 0));
                                      } else if (offerSort === 'newest') {
                                       processedOffers.sort((a, b) => b.createdAt - a.createdAt);
                                      }

                                      const group = {
                                          item: item,
                                          offers: processedOffers,
                                          allOffers: mockOffers // Store unfiltered for dynamic filtering
                                      };
                                      setSelectedListingGroup(group);
                                      }}
                                      />
                                      );
                                      })()}
                                      </div>
                    </motion.div>
                  ) : !selectedOffer ? (
                    // LEVEL 2: Offer List View
                    <motion.div
                      key="offers"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="h-full flex gap-6"
                    >
                      {/* Left: Item Preview */}
                      <div className="w-[320px] flex-shrink-0">
                        <div 
                          className="rounded-2xl overflow-hidden h-full"
                          style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          <div className="aspect-square relative overflow-hidden">
                            <img 
                              src={selectedListingGroup.item.image} 
                              alt={selectedListingGroup.item.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                              <RarityBadge rarity={selectedListingGroup.item.rarity} />
                            </div>
                          </div>

                          <div className="p-5">
                            <h2 className="text-xl font-bold text-white mb-2">{selectedListingGroup.item.name}</h2>
                            <p className="text-white/50 text-sm mb-4">{selectedListingGroup.item.description}</p>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white/40">Type</span>
                                <span className="text-white">{selectedListingGroup.item.type}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white/40">Game</span>
                                <span className="text-white">{selectedListingGroup.item.game}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white/40">Total Offers</span>
                                <span className="text-blue-400 font-bold">{selectedListingGroup.offers.length}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                  setSelectedListingGroup(null);
                                  setCrossViewLevel(1); // Go back to Items view
                              }}
                              className="w-full mt-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all flex items-center justify-center gap-2"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              Back to Items
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Offers List */}
                      <div className="flex-1 flex flex-col min-w-0">
                        {/* Filter & Sort Controls */}
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-white/50" />
                            <span className="text-white/60 text-sm font-medium">Type:</span>
                          </div>
                          <select
                            value={offerTypeFilter}
                            onChange={(e) => {
                              setOfferTypeFilter(e.target.value);
                              // Re-filter current offers
                              if (selectedListingGroup) {
                                const allOffers = selectedListingGroup.allOffers || selectedListingGroup.offers;
                                let filtered = [...allOffers];
                                if (e.target.value !== 'all') {
                                  filtered = filtered.filter(o => o.modes.includes(e.target.value));
                                }
                                // Apply sort
                                if (offerSort === 'price-low') {
                                  filtered.sort((a, b) => (a.price || a.currentBid || 0) - (b.price || b.currentBid || 0));
                                } else if (offerSort === 'price-high') {
                                  filtered.sort((a, b) => (b.price || b.buyoutPrice || 0) - (a.price || a.buyoutPrice || 0));
                                } else if (offerSort === 'newest') {
                                  filtered.sort((a, b) => b.createdAt - a.createdAt);
                                }
                                setSelectedListingGroup({ ...selectedListingGroup, allOffers: allOffers, offers: filtered });
                              }
                            }}
                            className="bg-slate-800 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5"
                          >
                            <option value="all">All</option>
                            <option value="sale">Cash Buy</option>
                            <option value="bid">Bid Buy</option>
                            <option value="trade">Trade Offer</option>
                          </select>

                          <div className="flex items-center gap-2 ml-auto">
                            <ArrowUpDown className="w-4 h-4 text-white/50" />
                            <span className="text-white/60 text-sm font-medium">Sort:</span>
                          </div>
                          <select
                            value={offerSort}
                            onChange={(e) => {
                              setOfferSort(e.target.value);
                              // Re-sort current offers
                              if (selectedListingGroup) {
                                const allOffers = selectedListingGroup.allOffers || selectedListingGroup.offers;
                                let filtered = [...allOffers];
                                if (offerTypeFilter !== 'all') {
                                  filtered = filtered.filter(o => o.modes.includes(offerTypeFilter));
                                }
                                // Apply new sort
                                if (e.target.value === 'price-low') {
                                  filtered.sort((a, b) => (a.price || a.currentBid || 0) - (b.price || b.currentBid || 0));
                                } else if (e.target.value === 'price-high') {
                                  filtered.sort((a, b) => (b.price || b.buyoutPrice || 0) - (a.price || a.buyoutPrice || 0));
                                } else if (e.target.value === 'newest') {
                                  filtered.sort((a, b) => b.createdAt - a.createdAt);
                                }
                                setSelectedListingGroup({ ...selectedListingGroup, allOffers: allOffers, offers: filtered });
                              }
                            }}
                            className="bg-slate-800 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5"
                          >
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="newest">Newest First</option>
                          </select>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                          {selectedListingGroup.offers.map((offer, idx) => (
                            <motion.div
                              key={offer.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group"
                              onClick={() => setSelectedOffer(offer)}
                            >
                              <div 
                                className="p-4 rounded-xl transition-all duration-300 hover:scale-[1.01] hover:bg-white/5 cursor-pointer border border-white/10 group-hover:border-blue-500/30"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                }}
                              >
                                <div className="flex items-center gap-4">
                                  <img 
                                    src={offer.seller.avatar} 
                                    alt={offer.seller.name}
                                    className="w-12 h-12 rounded-full border-2 border-white/20"
                                  />

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setSellerAction({ open: true, offer }); }}
                                        className="text-white font-bold underline decoration-white/30 hover:decoration-cyan-400"
                                      >
                                        {offer.seller.name}
                                      </button>
                                      <div className="flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                        <span className="text-yellow-200 text-xs font-bold">{offer.seller.rating}</span>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {offer.modes.map(mode => (
                                            <Badge key={mode} variant="secondary" className="text-[10px] uppercase bg-white/10 text-white/70">
                                                {mode === 'sale' ? 'Selling' : mode === 'bid' ? 'Auction' : 'Trading'}
                                            </Badge>
                                        ))}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    {(offer.price || offer.currentBid) && (
                                      <div className="text-xl font-bold text-white">
                                        {(offer.price || offer.currentBid).toLocaleString()}
                                        <span className="text-xs text-white/40 ml-1">AGP</span>
                                      </div>
                                    )}
                                    <span className="text-xs text-white/30">Click for details</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    // LEVEL 3: Transaction Detail View
                    <motion.div
                      key="transaction-detail"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="h-full flex flex-col"
                    >
                        <div className="mb-6 flex items-center gap-4">
                            <button 
                                onClick={() => setSelectedOffer(null)}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6 text-white" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-white">Transaction Details</h2>
                                <p className="text-slate-400 text-sm">Review offer terms from {selectedOffer.seller.name}</p>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
                            {/* Seller & Overview */}
                            <div className="col-span-1 bg-slate-900/50 rounded-2xl border border-white/10 p-6 flex flex-col gap-6">
                                <div className="text-center">
                                    <div className="w-24 h-24 rounded-full border-4 border-white/10 mx-auto mb-4 overflow-hidden relative">
                                        <img src={selectedOffer.seller.avatar} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 ring-1 ring-inset ring-black/20 rounded-full" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{selectedOffer.seller.name}</h3>
                                    <div className="flex items-center justify-center gap-2 mt-1 text-yellow-400">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="font-bold">{selectedOffer.seller.rating}</span>
                                        <span className="text-white/30 text-xs">(142 deals)</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/5 p-4 rounded-xl">
                                        <label className="text-xs text-white/40 uppercase font-bold tracking-wider block mb-2">Listing Types</label>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedOffer.modes.includes('sale') && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Fixed Price</Badge>}
                                            {selectedOffer.modes.includes('bid') && <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Auction</Badge>}
                                            {selectedOffer.modes.includes('trade') && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Accepts Trades</Badge>}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl">
                                        <label className="text-xs text-white/40 uppercase font-bold tracking-wider block mb-2">Description</label>
                                        <p className="text-sm text-slate-300 italic">"{selectedOffer.description}"</p>
                                    </div>
                                    <div className="flex justify-between text-xs text-white/30 px-2">
                                        <span>Posted: {selectedOffer.postedAt}</span>
                                        {selectedOffer.endsAt && <span>Ends in: {selectedOffer.endsAt}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Options */}
                            <div className="col-span-2 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                                {selectedOffer.modes.includes('sale') && (
                                    <div className="bg-gradient-to-br from-green-900/20 to-slate-900 border border-green-500/30 rounded-2xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <DollarSign className="w-32 h-32 text-green-500" />
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                                                <DollarSign className="w-5 h-5" /> Buy Now
                                            </h3>
                                            <div className="flex items-end gap-4 mb-6">
                                                <div className="text-4xl font-black text-white">{selectedOffer.price.toLocaleString()} <span className="text-lg text-white/40">AGP</span></div>
                                            </div>
                                            <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-6 text-lg rounded-xl shadow-lg shadow-green-900/50">
                                                Purchase Item
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {selectedOffer.modes.includes('bid') && (
                                    <div className="bg-gradient-to-br from-purple-900/20 to-slate-900 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Gavel className="w-32 h-32 text-purple-500" />
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                                                <Gavel className="w-5 h-5" /> Auction
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="bg-black/30 p-3 rounded-lg">
                                                    <div className="text-xs text-white/40 uppercase">Current Bid</div>
                                                    <div className="text-xl font-bold text-white">{selectedOffer.currentBid?.toLocaleString() || '---'}</div>
                                                </div>
                                                <div className="bg-black/30 p-3 rounded-lg">
                                                    <div className="text-xs text-white/40 uppercase">Buyout Price</div>
                                                    <div className="text-xl font-bold text-white">{selectedOffer.buyoutPrice?.toLocaleString() || '---'}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <Input type="number" placeholder="Enter bid amount..." className="bg-black/30 border-purple-500/30 h-12 text-white" />
                                                <Button className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 h-12 rounded-xl">
                                                    Place Bid
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedOffer.modes.includes('trade') && (
                                    <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <ArrowLeftRight className="w-32 h-32 text-blue-500" />
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                                                <ArrowLeftRight className="w-5 h-5" /> Trade Offer
                                            </h3>
                                            <div className="bg-black/30 p-4 rounded-xl mb-6">
                                                <div className="text-xs text-white/40 uppercase mb-2">Seller is looking for:</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedOffer.seeking?.map((item, i) => (
                                                        <Badge key={i} variant="outline" className="border-blue-500/40 text-blue-300 bg-blue-500/10">
                                                            {item}
                                                        </Badge>
                                                    )) || <span className="text-white/50 text-sm">Any fair offers</span>}
                                                </div>
                                            </div>
                                            <Button variant="outline" className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10 font-bold py-6 text-lg rounded-xl">
                                                Propose Trade
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              {/* INVENTORY TAB CONTENT */}
              <TabsContent value="subtab" className="h-full mt-0 data-[state=inactive]:hidden">
                  <div className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar pr-2 pb-6">
                      {!subTabGenre ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                          <Gamepad2 className="w-16 h-16 mb-4 opacity-20" />
                          <p className="text-lg font-medium">Select a Genre to View Games</p>
                          <p className="text-sm opacity-60">Choose from the list on the left</p>
                        </div>
                      ) : !subTabGame ? (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                          <div className="flex items-center gap-3 mb-8">
                            <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 px-3 py-1">{subTabGenre}</Badge>
                            <h2 className="text-2xl font-bold text-white">Available Games</h2>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-6">
                            {(GENRE_GAMES[subTabGenre] || [`Generic ${subTabGenre} Game 1`, `Generic ${subTabGenre} Game 2`, `Generic ${subTabGenre} Game 3`]).map((game) => (
                              <motion.div 
                                key={game}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSubTabGame(game)}
                                className="bg-slate-800/40 border border-white/5 rounded-xl p-4 cursor-pointer hover:bg-slate-800/60 hover:border-cyan-500/30 transition-all group h-48 flex flex-col"
                              >
                                <div className="flex-1 flex items-center justify-center bg-black/20 rounded-lg mb-4 relative overflow-hidden">
                                  <Gamepad2 className="w-12 h-12 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex items-center justify-between">
                                  <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">{game}</h3>
                                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400" />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                          <button 
                            onClick={() => setSubTabGame(null)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors w-fit"
                          >
                            <ChevronLeft className="w-4 h-4" /> Back to {subTabGenre} Games
                          </button>
                          
                          <div className="flex items-end gap-6 mb-8 border-b border-white/5 pb-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 flex items-center justify-center shadow-xl">
                               <Gamepad2 className="w-10 h-10 text-cyan-400" />
                            </div>
                            <div>
                               <Badge className="mb-2 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">{subTabGenre}</Badge>
                               <h2 className="text-4xl font-black text-white tracking-tight">{subTabGame}</h2>
                               <p className="text-slate-400 mt-1">Your Progress & Collection</p>
                            </div>
                          </div>

                          <div className="flex flex-1 gap-6 overflow-hidden">
                              <div className="w-2/3 flex flex-col gap-4">
                                  {/* Content: Filters & Items (No Box) */}
                                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                      {['All Items', 'Weapons', 'Armor', 'Consumables', 'Materials'].map((filter) => (
                                          <button key={filter} className="px-4 py-2 rounded-full bg-slate-800/50 border border-white/5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-all whitespace-nowrap">
                                              {filter}
                                          </button>
                                      ))}
                                      <div className="ml-auto text-xs text-amber-400 font-mono flex items-center gap-1 bg-amber-950/30 px-3 py-1 rounded border border-amber-500/20">
                                          <Coins className="w-3 h-3" /> {getGameDetails(subTabGame).currency.amount.toLocaleString()} G
                                      </div>
                                  </div>

                                  {/* Items Grid - Removed Outer Box Styles */}
                                  <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
                                      <div className="grid grid-cols-5 gap-3">
                                          {getGameDetails(subTabGame).items.map((item) => (
                                             <div 
                                                 key={item.id}
                                                 onClick={() => {
                                                   setSelectedInventoryItem(item);
                                                   setShowInventoryOverlay(true);
                                                 }}
                                                 className={`
                                                     aspect-square rounded-lg border-2 relative group cursor-pointer transition-all
                                                     flex flex-col items-center justify-center bg-slate-900/80
                                                     ${item.rarity === 'Legendary' ? 'border-orange-500/30 hover:border-orange-400'
                                                     : item.rarity === 'Epic' ? 'border-purple-500/30 hover:border-purple-400'
                                                     : item.rarity === 'Rare' ? 'border-blue-500/30 hover:border-blue-400'
                                                     : 'border-slate-700 hover:border-slate-500'}
                                                 `}
                                             >
                                                  <SwordsIcon className={`w-8 h-8 ${
                                                      item.rarity === 'Legendary' ? 'text-orange-400' :
                                                      item.rarity === 'Epic' ? 'text-purple-400' :
                                                      item.rarity === 'Rare' ? 'text-blue-400' : 'text-slate-500'
                                                  }`} />
                                                  
                                                  <div className="absolute top-1 left-1 text-[9px] font-mono text-slate-500">
                                                      Lv.{item.level}
                                                  </div>

                                                  <div className="absolute bottom-1 right-1">
                                                      {item.demand === "High" || item.demand === "Very High" ? (
                                                          <TrendingUp className="w-3 h-3 text-green-500" />
                                                      ) : null}
                                                  </div>
                                              </div>
                                          ))}
                                          {[...Array(20 - getGameDetails(subTabGame).items.length)].map((_, i) => (
                                              <div key={`empty-${i}`} className="aspect-square rounded-lg border border-white/5 bg-slate-900/20 flex items-center justify-center opacity-30">
                                                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          </div>
                        </div>
                      )}
                  </div>
              </TabsContent>
           </div>
        </div>
      </Tabs>

      <InternalTradePostModal
        item={selectedItem}
        isOpen={showTradeModal}
        initialType={modalInitialType}
        onClose={() => { setShowTradeModal(false); setSelectedItem(null); }}
        onPost={handleTradePost}
      />

      {sellerAction.open && sellerAction.offer && (
        <Dialog open={sellerAction.open} onOpenChange={(v) => setSellerAction({ open: v, offer: v ? sellerAction.offer : null })}>
          <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700 max-w-lg text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Interact with {sellerAction.offer.seller.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-white/60">Choose an action for "{selectedListingGroup?.item?.name}"</div>

              {sellerAction.offer.modes.includes('sale') && (
                <Button className="w-full bg-green-600 hover:bg-green-500" onClick={() => { setSelectedOffer(sellerAction.offer); setSellerAction({ open: false, offer: null }); }}>
                  Buy Now
                </Button>
              )}

              <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
                <label className="text-xs text-white/50 block mb-1">Offer Price (AGP)</label>
                <Input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className="bg-black/30 border-white/20" placeholder="Enter amount" />
                <div className="mt-2 flex justify-end">
                  <Button size="sm" className="bg-white/10 hover:bg-white/20" onClick={() => { console.log('Offer sent', offerPrice); setSellerAction({ open: false, offer: null }); }}>
                    Send Offer
                  </Button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
                <label className="text-xs text-white/50 block mb-1">Ultimatum</label>
                <Textarea value={ultimatumText} onChange={(e) => setUltimatumText(e.target.value)} className="bg-black/30 border-white/20 min-h-[80px]" />
                <div className="mt-2 flex justify-end">
                  <Button size="sm" variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10" onClick={() => { console.log('Ultimatum sent', ultimatumText); setSellerAction({ open: false, offer: null }); }}>
                    Send Ultimatum
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Inventory Item Overlay */}
      <AnimatePresence>
        {showInventoryOverlay && selectedInventoryItem && (
          <InventoryItemOverlay
            item={selectedInventoryItem}
            onClose={() => {
              setShowInventoryOverlay(false);
              setSelectedInventoryItem(null);
            }}
            onSale={(item) => {
              setSelectedItem(item);
              setModalInitialType('sale');
              setShowTradeModal(true);
            }}
            onTrade={(item) => {
              setSelectedItem(item);
              setModalInitialType('trade');
              setShowTradeModal(true);
            }}
            onBid={(item) => {
              setSelectedItem(item);
              setModalInitialType('bid');
              setShowTradeModal(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const InternalTradePostModal = ({ item, isOpen, onClose, onPost, initialType = 'trade' }) => {
  const [tradeType, setTradeType] = useState(initialType);
  
  useEffect(() => {
    if (isOpen) setTradeType(initialType);
  }, [isOpen, initialType]);

  const [description, setDescription] = useState('');
  const [seekingItems, setSeekingItems] = useState('');
  const [minBid, setMinBid] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [expirationDays, setExpirationDays] = useState('7');

  const handlePost = () => {
    const postData = {
      item,
      type: tradeType,
      description,
      seekingItems: seekingItems.split(',').map(s => s.trim()).filter(s => s),
      minBid: minBid ? parseInt(minBid) : null,
      buyoutPrice: buyoutPrice ? parseInt(buyoutPrice) : null,
      salePrice: salePrice ? parseInt(salePrice) : null,
      expirationDays: parseInt(expirationDays)
    };
    onPost(postData);
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700 max-w-2xl text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="w-6 h-6 text-blue-500" />
            Create Galactic Listing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-white/5">
            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
            <div>
              <h3 className="font-bold text-lg">{item.name}</h3>
              <RarityBadge rarity={item.rarity} />
            </div>
          </div>

          <div className="space-y-4">
             <label className="text-sm font-medium text-slate-400 uppercase">Listing Type</label>
             <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant={tradeType === 'trade' ? 'default' : 'outline'} 
                  onClick={() => setTradeType('trade')}
                  className={tradeType === 'trade' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700 text-slate-400'}
                >
                  Trade
                </Button>
                <Button 
                  variant={tradeType === 'bid' ? 'default' : 'outline'} 
                  onClick={() => setTradeType('bid')}
                  className={tradeType === 'bid' ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-700 text-slate-400'}
                >
                  Auction
                </Button>
                <Button 
                  variant={tradeType === 'sale' ? 'default' : 'outline'} 
                  onClick={() => setTradeType('sale')}
                  className={tradeType === 'sale' ? 'bg-green-600 hover:bg-green-700' : 'border-slate-700 text-slate-400'}
                >
                  Sell
                </Button>
             </div>

             {tradeType === 'trade' && (
               <div>
                 <label className="text-xs text-slate-400 mb-1 block">Seeking Items (comma separated)</label>
                 <Input value={seekingItems} onChange={e => setSeekingItems(e.target.value)} placeholder="e.g. Plasma Rifle, Cyber Armor" className="bg-slate-800 border-slate-700" />
               </div>
             )}
             {tradeType === 'sale' && (
               <div>
                 <label className="text-xs text-slate-400 mb-1 block">Price (AGP)</label>
                 <Input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="5000" className="bg-slate-800 border-slate-700" />
               </div>
             )}
             {tradeType === 'bid' && (
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs text-slate-400 mb-1 block">Min Bid (AGP)</label>
                   <Input type="number" value={minBid} onChange={e => setMinBid(e.target.value)} className="bg-slate-800 border-slate-700" />
                 </div>
                 <div>
                   <label className="text-xs text-slate-400 mb-1 block">Buyout (AGP)</label>
                   <Input type="number" value={buyoutPrice} onChange={e => setBuyoutPrice(e.target.value)} className="bg-slate-800 border-slate-700" />
                 </div>
               </div>
             )}

             <div>
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} className="bg-slate-800 border-slate-700 min-h-[80px]" placeholder="Describe your item..." />
             </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-slate-700">Cancel</Button>
            <Button onClick={handlePost} className="flex-1 bg-blue-600 hover:bg-blue-700">Post Listing</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};