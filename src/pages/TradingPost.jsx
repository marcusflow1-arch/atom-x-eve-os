import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Search, Filter, Mic, MicOff, X, Plus, Eye, Clock, Coins, Gavel, ArrowLeftRight,
  Package, Star, Zap, Shield, Sword, Users, Bot, TrendingUp, Calendar, MessageSquare,
  Grid, List, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Tag, Gamepad2, Diamond, Heart, Share2, AlertCircle,
  CheckCircle, Timer, DollarSign, Sparkles, Crown, Flame, Rocket, Globe, Orbit, Info,
  Home, ShoppingBag, Library, Trophy, Layers, Hammer, Swords, Lightbulb, Settings, LogIn, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAuth } from '../components/auth/AuthContext';
import CreateTradeModal from '../components/trading/CreateTradeModal'; 
import { ThemeBackground, ThemeToggle } from '../components/shared/ThemeSystem';

const GalacticCard = ({ children, className = "", hoverEffect = true }) => (
  <div className={`
    relative bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden
    ${hoverEffect ? 'hover:bg-slate-800/50 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300' : ''}
    ${className}
  `}>
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

// --- Mock Data ---

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
    item: userInventory[0], // Same item (Dragonscale Armor)
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
    item: userInventory[0], // Same item (Dragonscale Armor)
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

// Helper Icon Components
const SwordsIcon = ({ className }) => <Sword className={className} />;
const TrophyIcon = ({ className }) => <Crown className={className} />;

// --- Specialized Components ---

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
      {/* Holographic Sheen Layer */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-30 z-20 pointer-events-none transition-opacity duration-500 mix-blend-overlay" />
      
      {/* Card Header (Top Bar) */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-slate-950/90 z-10 flex items-center justify-between px-2 border-b border-white/10">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate max-w-[60%]">{item.type}</span>
        <div className="flex items-center gap-1">
           {item.quantity > 1 && <span className="text-[10px] font-mono text-cyan-400">x{item.quantity}</span>}
           <div className={`w-2 h-2 rounded-full ${item.rarity === 'Legendary' || item.rarity === 'Mythic' ? 'bg-yellow-400 animate-pulse' : 'bg-slate-600'}`} />
        </div>
      </div>

      {/* Main Image Area */}
      <div className="absolute top-8 left-1 right-1 bottom-[35%] rounded-lg overflow-hidden border border-white/5 bg-black">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
      </div>

      {/* Card Stats/Info Area (Bottom) */}
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

const GalacticItemGroupSummary = ({ item, offers, onSelect, isSelected }) => {
  const lowestPrice = offers
    .filter(o => o.type === 'sale' || o.type === 'bid')
    .map(o => o.price || o.currentBid || Infinity)
    .sort((a, b) => a - b)[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onSelect(item.name)}
      className={`
        group relative p-3 rounded-xl cursor-pointer border transition-all duration-300 mb-3
        ${isSelected 
          ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
          : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10'}
      `}
    >
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          {isSelected && <div className="absolute inset-0 bg-blue-500/20 mix-blend-overlay" />}
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold truncate text-base ${isSelected ? 'text-blue-400' : 'text-white'}`}>{item.name}</h3>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <RarityBadge rarity={item.rarity} />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{item.type}</span>
            <Badge variant="outline" className="text-[9px] border-white/10 text-slate-400 ml-auto">
               <Globe className="w-3 h-3 mr-1 inline" /> Cross-Platform
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-slate-400">
              <Users className="w-3 h-3" />
              <span>{offers.length} Offers</span>
            </div>
            <div className="font-mono text-green-400">
               {lowestPrice && lowestPrice !== Infinity ? `${lowestPrice.toLocaleString()} AGP` : 'Trade'}
            </div>
          </div>
        </div>
        
        {isSelected && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500 rounded-l-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        )}
      </div>
    </motion.div>
  );
};

const TradeOffersPanel = ({ item, offers, onTrade }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('lowest_price');

  const filteredOffers = offers.filter(offer => 
    offer.owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.description.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'lowest_price') {
      const priceA = a.price || a.currentBid || Infinity;
      const priceB = b.price || b.currentBid || Infinity;
      return priceA - priceB;
    }
    if (sortBy === 'highest_price') {
      const priceA = a.price || a.currentBid || -1;
      const priceB = b.price || b.currentBid || -1;
      return priceB - priceA;
    }
    return 0;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header Area */}
      <div className="mb-6 flex items-start gap-6 p-6 bg-slate-900/40 rounded-2xl border border-white/5">
        <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl flex-shrink-0">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 pt-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold text-white">{item.name}</h2>
            <RarityBadge rarity={item.rarity} />
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
            <span className="flex items-center gap-1"><Gamepad2 className="w-4 h-4" /> {item.game}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="capitalize">{item.genre}</span>
          </div>
          <p className="text-slate-300 italic border-l-2 border-slate-700 pl-4">{item.description}</p>
        </div>
      </div>

      {/* Search & Sort Toolbar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search traders..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px] bg-slate-800/50 border-white/10">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lowest_price">Lowest Price</SelectItem>
            <SelectItem value="highest_price">Highest Price</SelectItem>
            <SelectItem value="newest">Newest Listed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Offers List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {filteredOffers.map((offer) => (
          <div key={offer.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all hover:bg-slate-800/50 group">
            {/* Offer Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className={`
                  ${offer.type === 'trade' ? 'text-blue-400 border-blue-500/30' : 
                    offer.type === 'bid' ? 'text-purple-400 border-purple-500/30' : 
                    'text-green-400 border-green-500/30'}
                  bg-transparent text-[10px] uppercase
                `}>
                  {offer.type}
                </Badge>
                
                {(offer.type === 'sale' || offer.type === 'bid') && (
                  <span className="text-lg font-bold text-green-400">
                    {offer.price?.toLocaleString() || offer.currentBid?.toLocaleString()} AGP
                  </span>
                )}
                {offer.type === 'trade' && (
                  <span className="text-sm text-blue-300 font-medium">Item Trade</span>
                )}
              </div>

              {offer.type === 'trade' && offer.seekingItems && (
                <div className="text-xs text-slate-400 mb-1">
                  <span className="text-blue-400 font-medium">Seeking:</span> {offer.seekingItems.join(', ')}
                </div>
              )}
              
              <p className="text-sm text-slate-300">{offer.description}</p>
            </div>

            {/* Vertical Divider Line */}
            <div className="w-px h-12 bg-white/10 mx-6" />

            {/* Trader Info (Right Side as requested) */}
            <div className="flex items-center gap-4 min-w-[200px] justify-end">
              <div className="text-right">
                <div className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{offer.owner.name}</div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" /> 
                  <span>4.9 (128 Trades)</span>
                </div>
              </div>
              <img src={offer.owner.avatar} alt={offer.owner.name} className="w-10 h-10 rounded-full border border-white/10" />
              
              <Button 
                size="sm"
                className={`
                  ${offer.type === 'bid' ? 'bg-purple-600 hover:bg-purple-700' : 
                    offer.type === 'sale' ? 'bg-green-600 hover:bg-green-700' : 
                    'bg-blue-600 hover:bg-blue-700'} 
                  text-white shadow-lg ml-2
                `}
                onClick={() => onTrade(offer, offer.type === 'bid' ? 'bid' : offer.type === 'sale' ? 'buy' : 'offer')}
              >
                  {offer.type === 'bid' ? 'Bid' : offer.type === 'sale' ? 'Buy' : 'Trade'}
              </Button>
            </div>
          </div>
        ))}
        
        {filteredOffers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Search className="w-12 h-12 mb-2 opacity-20" />
            <p>No offers found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

const GalacticGameSummary = ({ gameName, itemCount, image, onSelect }) => (
  <motion.div
    layout
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    onClick={() => onSelect(gameName)}
    className={`
      group relative p-3 rounded-xl cursor-pointer border transition-all duration-300 mb-3
      bg-slate-900/40 border-white/5 hover:bg-slate-800/60 hover:border-blue-500/30
    `}
  >
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
        <img src={image} alt={gameName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
      </div>
      
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-white truncate text-base group-hover:text-blue-400 transition-colors">{gameName}</h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-[10px] bg-slate-800/50 border-white/10 text-slate-400">
            {itemCount} Items
          </Badge>
          <span className="text-[10px] text-slate-500">Click to browse</span>
        </div>
      </div>
      
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
    </div>
  </motion.div>
);

// --- Main Page ---

export default function TradingPost() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const location = useLocation();
  
  // States
  const [activeTab, setActiveTab] = useState('board');
  const [inventory] = useState(userInventory);
  const [listings, setListings] = useState(tradeListings);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [modalInitialType, setModalInitialType] = useState('trade');
  const [selectedListingGroup, setSelectedListingGroup] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('cosmic_library');
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // New states for game-first navigation
  const [viewMode, setViewMode] = useState('games'); // 'games' or 'items'
  const [selectedGame, setSelectedGame] = useState(null);
  
  // Sub-Tab States
  const [subTabGenre, setSubTabGenre] = useState(null);
  const [subTabGame, setSubTabGame] = useState(null);

  const allNavItems = [
    { name: 'Dashboard', icon: Home, path: createPageUrl('Dashboard') },
    { name: 'Store', icon: ShoppingBag, path: createPageUrl('Store') },
    { name: 'Library', icon: Library, path: createPageUrl('Library') },
    { name: 'Achievements', icon: Trophy, path: createPageUrl('Achievements') },
    { name: 'Trading Cards', icon: Layers, path: createPageUrl('TradingCards') },
    { name: 'Blacksmith', icon: Hammer, path: createPageUrl('Blacksmith') },
    { name: 'Events', icon: Trophy, path: createPageUrl('Events') },
    { name: 'Forums', icon: MessageSquare, path: createPageUrl('Community') },
    { name: 'Clans', icon: Users, path: createPageUrl('Clan') },
    { name: 'Game Dev Hub', icon: Rocket, path: createPageUrl('GameDevHub') },
    { name: 'Challenges', icon: Swords, path: createPageUrl('Challenges') },
    { name: 'AI Console', icon: Bot, path: createPageUrl('AIConsole') },
    { name: 'Trading Post', icon: ArrowLeftRight, path: createPageUrl('TradingPost') },
    { name: 'Marketplace', icon: Gavel, path: createPageUrl('Marketplace') },
    { name: 'My Profile', icon: Shield, path: createPageUrl('Profile') },
    { name: 'Ideals', icon: Lightbulb, path: createPageUrl('Ideals') },
    { name: 'Support', icon: Heart, path: createPageUrl('AdamXEve') },
    { name: 'Admin', icon: Settings, path: createPageUrl('Admin') },
  ];

  const getDisplayName = () => {
    if (!user) return null;
    return user.username || user.full_name || user.email?.split('@')[0] || 'User';
  };

  const getUserInitial = () => {
    const name = getDisplayName();
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // Sub-Tab Mock Data
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

  const getGameDetails = (gameName) => {
    return {
      items: [
        { id: 1, name: "Void Walker's Blade", type: "Weapon", rarity: "Legendary", level: 60, power: 850, marketPrice: 4500, demand: "High", description: "A blade forged from the essence of the void itself. Vibrates with dark energy." },
        { id: 2, name: "Cybernetic Core", type: "Material", rarity: "Epic", level: 1, power: 0, marketPrice: 1200, demand: "Medium", description: "Essential component for high-grade cyberware upgrades." },
        { id: 3, name: "Ancient Scroll", type: "Consumable", rarity: "Rare", level: 1, power: 0, marketPrice: 350, demand: "Low", description: "Contains forgotten knowledge of the old world." },
        { id: 4, name: "Steel Plated Armor", type: "Armor", rarity: "Uncommon", level: 25, power: 150, marketPrice: 80, demand: "Low", description: "Standard issue plating for frontline infantry." },
        { id: 5, name: "Health Potion XL", type: "Consumable", rarity: "Common", level: 1, power: 0, marketPrice: 15, demand: "High", description: "Restores a large amount of health instantly." },
        { id: 6, name: "Dragon Scale", type: "Material", rarity: "Legendary", level: 1, power: 0, marketPrice: 8000, demand: "Very High", description: "A pristine scale from an Elder Dragon." },
      ],
      currency: { name: "Gold", amount: 14520 }
    };
  };

  // Helper to get unique games from listings
  const gamesList = useMemo(() => {
    const games = {};
    listings.forEach(listing => {
      const game = listing.item.game;
      if (!games[game]) {
        games[game] = {
          name: game,
          count: 0,
          image: listing.item.image // Use first item's image as game cover
        };
      }
      games[game].count++;
    });
    return Object.values(games);
  }, [listings]);

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
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen text-white relative">
        <ThemeBackground themeId={selectedTheme} />
        
        <div className="relative z-10 max-w-7xl mx-auto p-6 pb-20">
          
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
              <ThemeToggle selectedTheme={selectedTheme} onThemeSelect={setSelectedTheme} />
              
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
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
            <div className="flex justify-center mb-8">
              <TabsList className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-1 rounded-full">
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

            <TabsContent value="board" className="space-y-6 h-[calc(100vh-300px)]">
              {/* Filter Bar */}
              <GalacticCard className="p-4 flex flex-wrap gap-4 items-center justify-between mb-6">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg border border-white/5 px-3 py-2 flex-1 min-w-[200px]">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search items..." 
                    className="bg-transparent border-none outline-none text-white placeholder:text-slate-500 w-full text-sm"
                  />
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                   <Select defaultValue="newest">
                    <SelectTrigger className="w-[140px] bg-slate-800/50 border-white/10"><SelectValue placeholder="Sort" /></SelectTrigger>
                    <SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="price">Price</SelectItem></SelectContent>
                  </Select>
                </div>
              </GalacticCard>

              {/* Split View Layout */}
              <div className="grid grid-cols-12 gap-6 h-full">
                {/* Left Side: Games / Items List */}
                <div className="col-span-12 md:col-span-5 lg:col-span-4 h-full overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-4 px-2">
                    {viewMode === 'items' ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setViewMode('games'); setSelectedGame(null); setSelectedListingGroup(null); }}
                        className="text-slate-400 hover:text-white -ml-2 hover:bg-white/10"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Games
                      </Button>
                    ) : (
                      <h3 className="text-slate-400 uppercase text-xs font-bold tracking-wider">Select Game</h3>
                    )}
                    <Badge variant="outline" className="text-xs bg-slate-800/50">
                        {viewMode === 'games' ? `${gamesList.length} Games` : selectedGame}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2">
                     {viewMode === 'games' ? (
                       gamesList.map(game => (
                         <GalacticGameSummary 
                           key={game.name}
                           gameName={game.name}
                           itemCount={game.count}
                           image={game.image}
                           onSelect={(name) => { setSelectedGame(name); setViewMode('items'); }}
                         />
                       ))
                     ) : (
                       (() => {
                         // Filter listings by selected game
                         const gameListings = listings.filter(l => l.item.game === selectedGame);
                         
                         // Group listings by Item Name
                         const groupedListings = gameListings.reduce((groups, listing) => {
                           const key = listing.item.name;
                           if (!groups[key]) {
                             groups[key] = {
                               item: listing.item,
                               offers: []
                             };
                           }
                           groups[key].offers.push(listing);
                           return groups;
                         }, {});

                         return Object.values(groupedListings).map((group) => (
                          <GalacticItemGroupSummary
                            key={group.item.id}
                            item={group.item}
                            offers={group.offers}
                            isSelected={selectedListingGroup?.item.name === group.item.name}
                            onSelect={() => setSelectedListingGroup(group)}
                          />
                        ));
                       })()
                     )}
                  </div>
                </div>

                {/* Vertical Divider Line */}
                <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-white/10 to-transparent h-full" />

                {/* Right Side: Traders & Details */}
                <div className="col-span-12 md:col-span-6 lg:col-span-7 h-full overflow-hidden">
                  {selectedListingGroup ? (
                    <TradeOffersPanel 
                      item={selectedListingGroup.item} 
                      offers={selectedListingGroup.offers} 
                      onTrade={(offer, type) => console.log("Trade", offer, type)}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-white/5 rounded-2xl bg-slate-900/20">
                      <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        <ArrowLeftRight className="w-10 h-10 text-slate-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-300 mb-2">Select an Item to View Offers</h3>
                      <p className="text-slate-500 max-w-xs">
                        Choose an item from the list on the left to see all available traders, bids, and sale listings.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>



            <TabsContent value="subtab" className="h-[calc(100vh-300px)]">
               <div className="flex h-full w-full bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
                  {/* Left Column (20%) */}
                  <div className="w-[20%] h-full border-r border-white/10 bg-slate-950/30 flex flex-col">
                      <div className="p-6 border-b border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Grid className="w-4 h-4 text-cyan-500" />
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Game Genres</h3>
                        </div>
                        <p className="text-[10px] text-slate-500">Select a category</p>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-1">
                        {[
                          "MMORPG", "Sci-Fi", "Fantasy", "Shooter", "RPG", "Action", "Adventure", 
                          "Strategy", "Sports", "Racing", "Simulation", "Puzzle", "Horror", 
                          "Survival", "MOBA", "Battle Royale", "Sandbox", "Stealth", "Fighting", "Platformer"
                        ].map((genre) => (
                          <button 
                            key={genre}
                            onClick={() => { setSubTabGenre(genre); setSubTabGame(null); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${subTabGenre === genre ? 'bg-cyan-900/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                          >
                            {genre}
                            {(subTabGenre === genre) && <ChevronRight className="w-3 h-3 text-cyan-500" />}
                          </button>
                        ))}
                      </div>
                  </div>
                  
                  {/* Right Column (80%) */}
                  <div className="w-[80%] h-full p-6 overflow-y-auto bg-slate-900/20">
                      {!subTabGenre ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                          <Gamepad2 className="w-16 h-16 mb-4 opacity-20" />
                          <p className="text-lg font-medium">Select a Genre to View Games</p>
                          <p className="text-sm opacity-60">Choose from the list on the left</p>
                        </div>
                      ) : !subTabGame ? (
                        /* Game List for Genre */
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
                        /* Game Details (Items + Achievements) */
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
                              {/* Inventory Grid (Backpack Style) */}
                              <div className="w-2/3 flex flex-col gap-4">
                                  {/* Filter Tabs */}
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

                                  {/* Grid Area */}
                                  <div className="flex-1 bg-slate-950/50 rounded-xl border border-white/10 p-4 overflow-y-auto custom-scrollbar shadow-inner">
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
                                                  <SwordsIcon type={item.type} className={`w-8 h-8 ${
                                                      item.rarity === 'Legendary' ? 'text-orange-400' :
                                                      item.rarity === 'Epic' ? 'text-purple-400' :
                                                      item.rarity === 'Rare' ? 'text-blue-400' : 'text-slate-500'
                                                  }`} />
                                                  
                                                  {/* Level Indicator */}
                                                  <div className="absolute top-1 left-1 text-[9px] font-mono text-slate-500">
                                                      Lv.{item.level}
                                                  </div>

                                                  {/* Market Indicator (Storefront Feature) */}
                                                  <div className="absolute bottom-1 right-1">
                                                      {item.demand === "High" || item.demand === "Very High" ? (
                                                          <TrendingUp className="w-3 h-3 text-green-500" />
                                                      ) : null}
                                                  </div>
                                              </div>
                                          ))}
                                          {/* Empty Slots */}
                                          {[...Array(20 - getGameDetails(subTabGame).items.length)].map((_, i) => (
                                              <div key={`empty-${i}`} className="aspect-square rounded-lg border border-white/5 bg-slate-900/20 flex items-center justify-center opacity-30">
                                                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              </div>

                              {/* Inspector Panel (Storefront + MMO Details) */}
                              <div className="w-1/3 bg-slate-900/80 rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
                                  {selectedInventoryItem ? (
                                      <>
                                          {/* Item Header / Visual */}
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

                                          {/* Stats & Info */}
                                          <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
                                              <div>
                                                  <h3 className="text-xl font-bold text-white leading-tight">{selectedInventoryItem.name}</h3>
                                                  <p className="text-xs text-slate-400 mt-1">{selectedInventoryItem.type} • Item Level {selectedInventoryItem.level}</p>
                                              </div>

                                              <div className="text-sm text-slate-300 italic border-l-2 border-white/10 pl-3 py-1">
                                                  "{selectedInventoryItem.description}"
                                              </div>

                                              {/* Stats Grid */}
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

                                              {/* Market Data (Storefront Feature) */}
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

          {/* Trade Modal (Using Internal or Imported one) */}
          <InternalTradePostModal
            item={selectedItem}
            isOpen={showTradeModal}
            initialType={modalInitialType}
            onClose={() => { setShowTradeModal(false); setSelectedItem(null); }}
            onPost={handleTradePost}
          />

        </div>
      </div>
    </ProtectedRoute>
  );
}

// Internal Modal Component (Copy from previous file, slightly updated styles)
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

          {/* Simplified Trade Type Selection for Demo */}
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

             {/* Dynamic Inputs based on Type */}
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