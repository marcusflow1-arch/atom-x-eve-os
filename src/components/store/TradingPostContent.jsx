import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Mic, MicOff, X, Plus, Eye, Clock, Coins, Gavel, ArrowLeftRight,
  Package, Star, Zap, Shield, Sword, Users, Bot, TrendingUp, Calendar, MessageSquare,
  Grid, List, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Tag, Gamepad2, Diamond, Heart, Share2, AlertCircle,
  CheckCircle, Timer, DollarSign, Sparkles, Crown, Flame, Rocket, Globe, Orbit, Info,
  SlidersHorizontal, ScrollText, Database, Hammer, Crosshair
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
import { useAuth } from '../auth/AuthContext';
import { Game } from '@/entities/Game';
import { aiGamesList, otherSampleGames } from './mockData';

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

const HollowCard = ({ children, className = "" }) => (
  <div className={`
    relative w-48 h-72 flex-shrink-0 rounded-xl border-2 border-white/10 
    bg-transparent hover:border-cyan-400/50 transition-all duration-300 group
    overflow-hidden cursor-pointer ${className}
  `}>
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
    <div className="p-5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-lg sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
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
  
  const [activeTab, setActiveTab] = useState('board');
  const [inventory] = useState(userInventory);
  const [listings, setListings] = useState(tradeListings);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [modalInitialType, setModalInitialType] = useState('trade');
  const [selectedListingGroup, setSelectedListingGroup] = useState(null);
  
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

  // Cross Interface State
  const [activeGenreIndex, setActiveGenreIndex] = useState(0);
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const [crossViewLevel, setCrossViewLevel] = useState(0); // 0: Nav (Games), 1: Game Items, 2: Offers
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
        // Filter Logic:
        // - Category: 'weapon' -> checks item.type
        // - Rarity: checks item.rarity
        // - Price: checks item.marketPrice
        
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

        // Only include game if it has matching items (or no filters active)
        // If filtering is active, we only want games that contain relevant items.
        // If no specific item filters, show all games.
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
                // Map the game's listings to the structure expected by the offers view
                // We construct a "group" object similar to what the old UI used
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


  const handleTradePost = (postData) => {
    const newListing = {
        id: `trade_${Date.now()}`,
        item: postData.item,
        owner: { name: user?.full_name || 'Player', avatar: user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=face' },
        type: postData.type,
        description: postData.description,
        seekingItems: postData.seekingItems,
        minBid: postData.minBid,
        buyoutPrice: postData.buyoutPrice,
        price: postData.salePrice,
        postedDate: new Date().toISOString().split('T')[0],
        expiresDate: new Date(Date.now() + (postData.expirationDays * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        status: 'active',
        views: 0,
        offers: 0
      };
      
      setListings(prev => [newListing, ...prev]);
  };

  return (
    <div className="relative z-10 max-w-[1920px] mx-auto px-4 md:px-6 py-8 pb-20">
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2 flex items-center gap-3">
            <Orbit className="w-10 h-10 text-cyan-400" />
            GALACTIC EXCHANGE
          </h1>
          <p className="text-slate-400 text-lg flex items-center gap-2">
            Interstellar Trading Post <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span> Live Network
          </p>
        </div>
        
        <div className="flex gap-3">
          <div 
            className="px-4 py-2 rounded-2xl flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Your Balance</p>
              <p className="text-xl font-bold text-white font-mono">24,500 AGP</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-start mb-8">
          <TabsList 
            className="p-1 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
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
        </div>

        <TabsContent value="board" className="h-[calc(100vh-280px)]">
          <div className="flex gap-6 h-full">
            {/* Sidebar - Custom Categories for Trading Post */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <TradingFilterSidebar filters={filters} setFilters={setFilters} />
            </aside>

            {/* Content Area */}
            <div className="flex-1 min-w-0 h-full flex flex-col">
            
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {selectedListingGroup && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedListingGroup(null)}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <ChevronLeft className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">Back</span>
                  </motion.button>
                )}
                <h2 className="text-2xl font-bold text-white">
                  {selectedListingGroup ? selectedListingGroup.item.name : 'Global Market'}
                </h2>
              </div>
              
              {/* Search Pill */}
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
                  id="trading-search-input"
                  placeholder={window.tradingListening ? "Listening..." : "Search..."}
                  className="bg-transparent border-none outline-none text-white placeholder:text-white/40 text-sm w-48"
                />
                <button
                  onClick={() => {
                    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                        if (window.tradingRecognition && window.tradingListening) {
                            window.tradingRecognition.stop();
                            return;
                        }
                        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                        const recognition = new SpeechRecognition();
                        recognition.lang = 'en-US';
                        recognition.interimResults = false;
                        recognition.onstart = () => {
                            window.tradingListening = true;
                            // Force update
                            const input = document.getElementById('trading-search-input');
                            if(input) input.placeholder = "Listening...";
                        };
                        recognition.onend = () => {
                            window.tradingListening = false;
                            window.tradingRecognition = null;
                            const input = document.getElementById('trading-search-input');
                            if(input) input.placeholder = "Search...";
                        };
                        recognition.onresult = (event) => {
                            const transcript = event.results[0][0].transcript;
                            const input = document.getElementById('trading-search-input');
                            if(input) {
                                input.value = transcript;
                                // Trigger change event manually if needed by react state in future, for now just DOM update
                            }
                        };
                        window.tradingRecognition = recognition;
                        recognition.start();
                    } else {
                        alert("Voice search not supported");
                    }
                  }}
                  className={`p-1 rounded-full transition-colors hover:bg-white/10 ${window.tradingListening ? 'text-purple-400 animate-pulse' : 'text-white/40 hover:text-white'}`}
                >
                    <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {!selectedListingGroup ? (
                  <motion.div
                    key="cross-interface"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative w-full h-full"
                  >
                    {/* NEW HOLLOW CARD LIST VIEW */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative p-6 h-full">
                        {crossData.length > 0 ? crossData.map((genre) => (
                            <div key={genre.id} className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-3 mb-4 sticky left-0">
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                        <genre.icon className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">{genre.label}</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4" />
                                </div>
                                
                                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
                                    {(() => {
                                        // Collect items from games in this genre
                                        const genreItems = genre.games.flatMap(g => g.filteredItems);
                                        const displayItems = genreItems.slice(0, 10);
                                        const placeholders = Math.max(0, 10 - displayItems.length);
                                        
                                        return (
                                            <>
                                                {displayItems.map((item, i) => (
                                                    <HollowCard key={item.id + i} className="snap-start" onClick={() => {
                                                        // Show details (using existing structure)
                                                        const group = {
                                                            item: item,
                                                            offers: [/* Mock offer for direct item click */ {
                                                                id: 'offer_1',
                                                                type: 'sale',
                                                                price: item.marketPrice,
                                                                owner: { name: 'MarketBot', avatar: item.image },
                                                                description: 'Direct market listing'
                                                            }]
                                                        };
                                                        setSelectedListingGroup(group);
                                                    }}>
                                                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 group-hover:opacity-100 transition-opacity">
                                                            <div className="w-24 h-24 mb-4 relative">
                                                                <img src={item.image} alt={item.name} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" />
                                                                <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                            <h4 className="text-sm font-bold text-white mb-1 line-clamp-2">{item.name}</h4>
                                                            <Badge variant="outline" className="border-white/10 text-[10px] text-slate-400">{item.rarity}</Badge>
                                                        </div>
                                                        <div className="mt-auto pt-4 w-full border-t border-white/10 flex justify-between items-center">
                                                            <span className="text-[10px] text-slate-500 truncate max-w-[60%]">{item.game}</span>
                                                            <span className="text-cyan-400 font-mono text-xs">{item.marketPrice} G</span>
                                                        </div>
                                                    </HollowCard>
                                                ))}
                                                
                                                {/* Placeholders */}
                                                {[...Array(placeholders)].map((_, i) => (
                                                    <HollowCard key={`placeholder-${genre.id}-${i}`} className="opacity-30 snap-start border-dashed border-white/5">
                                                        <div className="flex-1 flex items-center justify-center">
                                                            <Plus className="w-8 h-8 text-white/20" />
                                                        </div>
                                                    </HollowCard>
                                                ))}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )) : (
                            <div className="flex items-center justify-center h-full text-white/30">
                                No listings found matching your filters.
                            </div>
                        )}
                    </div>
                  </motion.div>
                ) : (
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
                      <h3 className="text-white font-bold text-lg mb-4">Available Offers</h3>
                      
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {selectedListingGroup.offers.map((offer, idx) => (
                          <motion.div
                            key={offer.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group"
                          >
                            <div 
                              className="p-4 rounded-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                              style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <img 
                                  src={offer.owner.avatar} 
                                  alt={offer.owner.name}
                                  className="w-12 h-12 rounded-full border-2 border-white/20"
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-bold">{offer.owner.name}</span>
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                      <span className="text-white/60 text-xs">4.9</span>
                                    </div>
                                  </div>
                                  <p className="text-white/40 text-sm truncate">{offer.description}</p>
                                </div>

                                <div className="text-right">
                                  <div className={`text-xs font-bold uppercase mb-1 ${
                                    offer.type === 'sale' ? 'text-green-400' :
                                    offer.type === 'bid' ? 'text-purple-400' :
                                    'text-blue-400'
                                  }`}>
                                    {offer.type === 'sale' ? 'BUY NOW' : offer.type === 'bid' ? 'AUCTION' : 'TRADE'}
                                  </div>
                                  {(offer.price || offer.currentBid) && (
                                    <div className="text-xl font-bold text-white">
                                      {(offer.price || offer.currentBid).toLocaleString()}
                                      <span className="text-xs text-white/40 ml-1">AGP</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2">
                                  {offer.type === 'sale' && (
                                    <button className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors">
                                      Buy
                                    </button>
                                  )}
                                  {offer.type === 'bid' && (
                                    <button className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold transition-colors">
                                      Bid
                                    </button>
                                  )}
                                  {offer.type === 'trade' && (
                                    <button className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold transition-colors">
                                      Offer
                                    </button>
                                  )}
                                  <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </div>
        </TabsContent>

        <TabsContent value="subtab" className="h-[calc(100vh-280px)]">
           <div className="flex gap-6 h-full">
              {/* Category Menu Box (Left Side) */}
              <aside className="w-64 flex-shrink-0 h-full flex flex-col gap-4">
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
              </aside>
              
              {/* Content Area (Right Side) */}
              <div className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar">
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
                                              onClick={() => setSelectedInventoryItem(item)}
                                              className={`
                                                  aspect-square rounded-lg border-2 relative group cursor-pointer transition-all
                                                  flex flex-col items-center justify-center bg-slate-900/80
                                                  ${selectedInventoryItem?.id === item.id 
                                                      ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-105 z-10' 
                                                      : item.rarity === 'Legendary' ? 'border-orange-500/30 hover:border-orange-400'
                                                      : item.rarity === 'Epic' ? 'border-purple-500/30 hover:border-purple-400'
                                                      : item.rarity === 'Rare' ? 'border-blue-500/30 hover:border-blue-400'
                                                      : 'border-slate-700 hover:border-slate-500'
                                                  }
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

                          <div className="w-1/3 bg-slate-900/80 rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
                              {selectedInventoryItem ? (
                                  <>
                                      <div className="h-48 relative bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden group">
                                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                                          <SwordsIcon className={`w-24 h-24 drop-shadow-2xl transition-transform duration-500 group-hover:scale-110 ${
                                              selectedInventoryItem.rarity === 'Legendary' ? 'text-orange-500' :
                                              selectedInventoryItem.rarity === 'Epic' ? 'text-purple-500' :
                                              selectedInventoryItem.rarity === 'Rare' ? 'text-blue-500' : 'text-slate-400'
                                          }`} />
                                          
                                          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                                              <Badge className={`
                                                  ${selectedInventoryItem.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                                                  selectedInventoryItem.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' :
                                                  selectedInventoryItem.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-slate-700 text-slate-300'}
                                              `}>
                                                  {selectedInventoryItem.rarity}
                                              </Badge>
                                          </div>
                                      </div>

                                      <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
                                          <div>
                                              <h3 className="text-xl font-bold text-white leading-tight">{selectedInventoryItem.name}</h3>
                                              <p className="text-xs text-slate-400 mt-1">{selectedInventoryItem.type} • Item Level {selectedInventoryItem.level}</p>
                                          </div>

                                          <div className="text-sm text-slate-300 italic border-l-2 border-white/10 pl-3 py-1">
                                              "{selectedInventoryItem.description}"
                                          </div>

                                          <div className="grid grid-cols-2 gap-2">
                                              <div className="bg-slate-950/50 p-2 rounded border border-white/5">
                                                  <div className="text-[10px] text-slate-500 uppercase">Power</div>
                                                  <div className="text-lg font-mono text-white">{selectedInventoryItem.power}</div>
                                              </div>
                                              <div className="bg-slate-950/50 p-2 rounded border border-white/5">
                                                  <div className="text-[10px] text-slate-500 uppercase">Weight</div>
                                                  <div className="text-lg font-mono text-white">2.5kg</div>
                                              </div>
                                          </div>

                                          <div className="mt-auto bg-cyan-950/20 rounded-xl p-4 border border-cyan-500/20">
                                              <div className="flex items-center justify-between mb-3">
                                                  <div className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1">
                                                      <TrendingUp className="w-3 h-3" /> Market Value
                                                  </div>
                                                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">
                                                      {selectedInventoryItem.demand} Demand
                                                  </Badge>
                                              </div>
                                              
                                              <div className="flex items-end justify-between mb-4">
                                                  <div>
                                                      <div className="text-[10px] text-slate-400">Average Price</div>
                                                      <div className="text-2xl font-black text-white flex items-center gap-1">
                                                          <Coins className="w-4 h-4 text-amber-400" /> {selectedInventoryItem.marketPrice}
                                                      </div>
                                                  </div>
                                                  <div className="text-right">
                                                      <div className="text-[10px] text-slate-400">Last Sold</div>
                                                      <div className="text-xs text-white">2 mins ago</div>
                                                  </div>
                                              </div>

                                              <div className="grid grid-cols-3 gap-2">
                                                  <Button 
                                                    onClick={() => { setSelectedItem(selectedInventoryItem); setModalInitialType('trade'); setShowTradeModal(true); }}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-1"
                                                  >
                                                      <ArrowLeftRight className="w-3 h-3 mr-1" /> Trade
                                                  </Button>
                                                  <Button 
                                                    onClick={() => { setSelectedItem(selectedInventoryItem); setModalInitialType('sale'); setShowTradeModal(true); }}
                                                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-1"
                                                  >
                                                      <DollarSign className="w-3 h-3 mr-1" /> Sell
                                                  </Button>
                                                  <Button 
                                                    onClick={() => { setSelectedItem(selectedInventoryItem); setModalInitialType('bid'); setShowTradeModal(true); }}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-1"
                                                  >
                                                      <Gavel className="w-3 h-3 mr-1" /> Bid
                                                  </Button>
                                              </div>
                                          </div>
                                      </div>
                                  </>
                              ) : (
                                  <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                                      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 animate-pulse">
                                          <Info className="w-8 h-8 opacity-50" />
                                      </div>
                                      <h4 className="text-lg font-bold text-slate-400 mb-1">Item Inspector</h4>
                                      <p className="text-xs">Select an item from your inventory to view details, market analytics, and listing options.</p>
                                  </div>
                              )}
                          </div>
                      </div>
                    </div>
                  )}
              </div>
           </div>
        </TabsContent>
      </Tabs>

      <InternalTradePostModal
        item={selectedItem}
        isOpen={showTradeModal}
        initialType={modalInitialType}
        onClose={() => { setShowTradeModal(false); setSelectedItem(null); }}
        onPost={handleTradePost}
      />
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