import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Search, Filter, ChevronRight, ChevronLeft, Star, TrendingUp, Clock, Tag,
  Sparkles, Crown, Flame, DollarSign, Eye, Heart, ShoppingCart, Play,
  Gamepad2, Package, Zap, Shield, Sword, X, SlidersHorizontal, Grid, List,
  Home, ShoppingBag, Library, Trophy, Layers, Hammer, Users, Bot, ArrowLeftRight,
  Gavel, Lightbulb, Settings, LogIn, LogOut, MessageSquare, Swords, Rocket, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '../components/auth/AuthContext';

// --- Mock Data ---
const FEATURED_ITEMS = [
  {
    id: 'f1',
    name: 'Void Emperor Armor Set',
    description: 'Legendary armor forged in the depths of the void dimension. Grants immunity to shadow damage.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    price: 125000,
    originalPrice: 150000,
    rarity: 'Legendary',
    game: 'Elder Scrolls: Reborn',
    seller: { name: 'VoidMaster', rating: 4.9 },
    discount: 17,
    views: 12453,
    watchers: 234
  },
  {
    id: 'f2',
    name: 'Quantum Neural Implant MK-X',
    description: 'The pinnacle of cybernetic enhancement. Unlocks hidden potential in any host.',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
    price: 89000,
    rarity: 'Mythic',
    game: 'Cyberpunk 2088',
    seller: { name: 'CyberDealer', rating: 5.0 },
    views: 8921,
    watchers: 189
  },
  {
    id: 'f3',
    name: 'Phoenix Resurrection Tome',
    description: 'Ancient grimoire containing the secrets of eternal rebirth.',
    image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=600&fit=crop',
    price: 75000,
    rarity: 'Mythic',
    game: 'Mage Wars Online',
    seller: { name: 'ArcaneTrader', rating: 4.8 },
    views: 6234,
    watchers: 156
  }
];

const MARKETPLACE_ITEMS = [
  { id: 'm1', name: 'Dragonscale Shield', price: 12500, rarity: 'Epic', game: 'Elder Scrolls: Reborn', category: 'Armor', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'DragonSlayer', rating: 4.7 }, views: 1234 },
  { id: 'm2', name: 'Plasma Rifle MK-V', price: 8900, rarity: 'Rare', game: 'Galactic Warfare', category: 'Weapon', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=400&fit=crop', seller: { name: 'GunRunner', rating: 4.5 }, views: 892 },
  { id: 'm3', name: 'Mystic Robes of Power', price: 15000, rarity: 'Legendary', game: 'Mage Wars Online', category: 'Armor', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'MageSupply', rating: 4.9 }, views: 2341 },
  { id: 'm4', name: 'Cyber Katana', price: 22000, rarity: 'Epic', game: 'Cyberpunk 2088', category: 'Weapon', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'BladeSmith', rating: 4.6 }, views: 1567 },
  { id: 'm5', name: 'Health Potion Bundle x100', price: 500, rarity: 'Common', game: 'Elder Scrolls: Reborn', category: 'Consumable', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'PotionMaster', rating: 4.3 }, views: 4521 },
  { id: 'm6', name: 'Stealth Cloak', price: 18500, rarity: 'Epic', game: 'Assassin Protocol', category: 'Armor', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop', seller: { name: 'ShadowDealer', rating: 4.8 }, views: 987 },
  { id: 'm7', name: 'Ancient Dragon Scale', price: 45000, rarity: 'Legendary', game: 'Elder Scrolls: Reborn', category: 'Material', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'RareMats', rating: 5.0 }, views: 3421 },
  { id: 'm8', name: 'Quantum Core', price: 32000, rarity: 'Epic', game: 'Cyberpunk 2088', category: 'Material', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'TechParts', rating: 4.4 }, views: 1123 },
  { id: 'm9', name: 'Fire Elemental Pet', price: 28000, rarity: 'Legendary', game: 'Mage Wars Online', category: 'Companion', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'PetTrader', rating: 4.7 }, views: 2156 },
  { id: 'm10', name: 'Sniper Scope Elite', price: 5500, rarity: 'Rare', game: 'Galactic Warfare', category: 'Attachment', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=400&fit=crop', seller: { name: 'GearHead', rating: 4.2 }, views: 756 },
  { id: 'm11', name: 'Enchanted Gemstone', price: 9800, rarity: 'Epic', game: 'Elder Scrolls: Reborn', category: 'Material', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'GemDealer', rating: 4.6 }, views: 1432 },
  { id: 'm12', name: 'Bionic Arm Upgrade', price: 41000, rarity: 'Legendary', game: 'Cyberpunk 2088', category: 'Cybernetics', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'CyberDoc', rating: 4.9 }, views: 2876 },
];

const CATEGORIES = ['All', 'Weapons', 'Armor', 'Consumables', 'Materials', 'Companions', 'Cybernetics'];
const GAMES = ['All Games', 'Elder Scrolls: Reborn', 'Cyberpunk 2088', 'Mage Wars Online', 'Galactic Warfare'];

// --- Rarity Styles ---
const rarityStyles = {
  Common: { bg: 'from-slate-500/20 to-slate-600/10', border: 'border-slate-500/30', text: 'text-slate-400', glow: '' },
  Uncommon: { bg: 'from-green-500/20 to-green-600/10', border: 'border-green-500/30', text: 'text-green-400', glow: '' },
  Rare: { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-blue-500/10' },
  Epic: { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
  Legendary: { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  Mythic: { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30', text: 'text-red-400', glow: 'shadow-red-500/30' }
};

// --- Glass Card Component with Wave Animation ---
const GlassCard = ({ children, className = "", animate = false, onClick }) => (
  <motion.div
    whileHover={{ scale: animate ? 1.02 : 1 }}
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-2xl
      bg-white/[0.03] backdrop-blur-2xl
      border border-white/[0.08]
      shadow-[0_8px_32px_rgba(0,0,0,0.3)]
      ${animate ? 'cursor-pointer' : ''}
      ${className}
    `}
    style={{ WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}
  >
    {/* Animated Wave Effect */}
    {animate && (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30">
          <div className="wave-animation absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-white/5 to-transparent" />
        </div>
      </div>
    )}
    {children}
  </motion.div>
);

// --- Featured Carousel Item ---
const FeaturedItem = ({ item, isActive }) => {
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isActive ? 1 : 0.5, scale: isActive ? 1 : 0.9 }}
      className={`relative w-full h-[400px] rounded-3xl overflow-hidden ${isActive ? '' : 'pointer-events-none'}`}
    >
      <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center p-12">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <Badge className={`${rarity.bg} ${rarity.text} border-none px-3 py-1`}>
              <Sparkles className="w-3 h-3 mr-1" /> {item.rarity}
            </Badge>
            <Badge variant="outline" className="border-white/20 text-white/70">
              <Gamepad2 className="w-3 h-3 mr-1" /> {item.game}
            </Badge>
            {item.discount && (
              <Badge className="bg-green-500 text-white border-none">-{item.discount}%</Badge>
            )}
          </div>
          
          <h2 className="text-4xl font-black text-white mb-3">{item.name}</h2>
          <p className="text-white/60 mb-6 line-clamp-2">{item.description}</p>
          
          <div className="flex items-center gap-6 mb-6">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-green-400">{item.price.toLocaleString()}</span>
                <span className="text-white/40">AGP</span>
                {item.originalPrice && (
                  <span className="text-lg text-white/30 line-through">{item.originalPrice.toLocaleString()}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {item.views.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {item.watchers}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button className="bg-white text-black hover:bg-white/90 font-bold px-8 h-12 rounded-xl">
              <ShoppingCart className="w-5 h-5 mr-2" /> Buy Now
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 rounded-xl px-6">
              <Heart className="w-5 h-5 mr-2" /> Watchlist
            </Button>
          </div>
        </div>
      </div>
      
      {/* Seller Info */}
      <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">Sold by</span>
          <span className="text-white font-semibold">{item.seller.name}</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-yellow-400 text-sm">{item.seller.rating}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Item Card ---
const ItemCard = ({ item, onClick }) => {
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
  
  return (
    <GlassCard animate onClick={() => onClick(item)} className="group h-full">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Rarity Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${rarity.bg} ${rarity.text} border-none text-[10px] px-2`}>
            {item.rarity}
          </Badge>
        </div>
        
        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all border border-white/10">
            <Heart className="w-4 h-4" />
          </button>
        </div>
        
        {/* Price */}
        <div className="absolute bottom-3 right-3">
          <div className="bg-green-500/90 backdrop-blur-md text-white font-bold text-sm px-3 py-1 rounded-full">
            {item.price.toLocaleString()} AGP
          </div>
        </div>
      </div>
      
      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-white text-sm mb-1 truncate group-hover:text-blue-400 transition-colors">
          {item.name}
        </h3>
        <p className="text-white/40 text-xs mb-3">{item.game}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-white/50">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span>{item.seller.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Eye className="w-3 h-3" />
            <span>{item.views}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// --- Filter Sidebar ---
const FilterSidebar = ({ 
  selectedCategory, setSelectedCategory,
  selectedGame, setSelectedGame,
  priceRange, setPriceRange,
  selectedRarities, setSelectedRarities
}) => {
  const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
  
  const toggleRarity = (rarity) => {
    setSelectedRarities(prev => 
      prev.includes(rarity) ? prev.filter(r => r !== rarity) : [...prev, rarity]
    );
  };
  
  return (
    <GlassCard className="p-5 sticky top-24">
      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-400" />
          Categories
        </h3>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                selectedCategory === cat 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Game Filter */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-purple-400" />
          Game
        </h3>
        <Select value={selectedGame} onValueChange={setSelectedGame}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GAMES.map(game => (
              <SelectItem key={game} value={game}>{game}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          Price Range
        </h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={100000}
          min={0}
          step={1000}
          className="mb-3"
        />
        <div className="flex justify-between text-xs text-white/50">
          <span>{priceRange[0].toLocaleString()} AGP</span>
          <span>{priceRange[1].toLocaleString()} AGP</span>
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Rarity */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          Rarity
        </h3>
        <div className="space-y-2">
          {rarities.map((rarity) => {
            const style = rarityStyles[rarity];
            return (
              <label key={rarity} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox 
                  checked={selectedRarities.includes(rarity)}
                  onCheckedChange={() => toggleRarity(rarity)}
                  className="border-white/30 data-[state=checked]:bg-blue-500"
                />
                <span className={`text-sm ${style.text} group-hover:brightness-125 transition-all`}>
                  {rarity}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Clear Filters */}
      <button 
        onClick={() => {
          setSelectedCategory('All');
          setSelectedGame('All Games');
          setPriceRange([0, 100000]);
          setSelectedRarities([]);
        }}
        className="w-full mt-6 py-2 text-sm text-white/50 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all"
      >
        Clear All Filters
      </button>
    </GlassCard>
  );
};

// --- Item Inspector Modal ---
const ItemInspector = ({ item, isOpen, onClose }) => {
  if (!item) return null;
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-2xl border-white/10 max-w-2xl text-white p-0 overflow-hidden">
        {/* Hero Image */}
        <div className="relative h-64">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/70 hover:text-white border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${rarity.bg} ${rarity.text} border-none`}>{item.rarity}</Badge>
              <Badge variant="outline" className="border-white/20 text-white/70">{item.game}</Badge>
            </div>
            <h2 className="text-3xl font-black text-white">{item.name}</h2>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price & Seller */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-sm mb-1">Price</p>
              <p className="text-3xl font-black text-green-400">{item.price.toLocaleString()} <span className="text-lg text-white/40">AGP</span></p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-sm mb-1">Seller</p>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">{item.seller.name}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-yellow-400">{item.seller.rating}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <GlassCard className="p-4 text-center">
              <Eye className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">{item.views.toLocaleString()}</p>
              <p className="text-xs text-white/40">Views</p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">+12%</p>
              <p className="text-xs text-white/40">Demand</p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <Clock className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">2h</p>
              <p className="text-xs text-white/40">Listed</p>
            </GlassCard>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl">
              <ShoppingCart className="w-5 h-5 mr-2" /> Buy Now
            </Button>
            <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10 h-12 rounded-xl">
              <Heart className="w-5 h-5 mr-2" /> Add to Watchlist
            </Button>
          </div>
          
          <Button variant="outline" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-10 rounded-xl">
            <MessageSquare className="w-4 h-4 mr-2" /> Contact Seller
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Marketplace Page ---
export default function Marketplace() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const location = useLocation();
  
  // States
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGame, setSelectedGame] = useState('All Games');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedRarities, setSelectedRarities] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState('popular');
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const getDisplayName = () => user?.username || user?.full_name || user?.email?.split('@')[0] || 'User';
  const getUserInitial = () => getDisplayName().charAt(0).toUpperCase();

  // Auto-rotate featured
  useEffect(() => {
    const interval = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % FEATURED_ITEMS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Filter items
  const filteredItems = useMemo(() => {
    return MARKETPLACE_ITEMS.filter(item => {
      const searchMatch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory;
      const gameMatch = selectedGame === 'All Games' || item.game === selectedGame;
      const priceMatch = item.price >= priceRange[0] && item.price <= priceRange[1];
      const rarityMatch = selectedRarities.length === 0 || selectedRarities.includes(item.rarity);
      return searchMatch && categoryMatch && gameMatch && priceMatch && rarityMatch;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'popular') return b.views - a.views;
      return 0;
    });
  }, [searchTerm, selectedCategory, selectedGame, priceRange, selectedRarities, sortBy]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Wave Animation Styles */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .wave-animation {
          animation: wave 3s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* Navigation Drawer */}
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
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white/[0.03] backdrop-blur-3xl border-r border-white/[0.08] z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
            >
              <div className="p-6 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-bold text-xl tracking-wider">ATOM×EVE</span>
                  <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center">
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                {isAuthenticated ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">{getUserInitial()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{getDisplayName()}</p>
                      <p className="text-white/40 text-xs truncate">{user?.email}</p>
                    </div>
                    <button onClick={logout} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-white/50 hover:text-white">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={login} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-white font-medium border border-white/[0.08]">
                    <LogIn className="w-4 h-4" /> Sign In
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Navigation</p>
                <div className="space-y-1">
                  {allNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link key={item.name} to={item.path} onClick={() => setDrawerOpen(false)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-white/[0.1] text-white border border-white/[0.1]' : 'text-white/60 hover:text-white hover:bg-white/[0.05]'}`}>
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="p-4 border-t border-white/[0.06]">
                <p className="text-white/20 text-xs text-center">© 2025 ATOM×EVE</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Menu Button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed top-4 left-4 z-40 w-11 h-11 rounded-xl bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center border border-white/[0.1] shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
      >
        <div className="flex flex-col gap-1">
          <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
          <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
          <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
        </div>
      </button>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/40 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6 pl-12">
            <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              MARKETPLACE
            </h1>
          </div>

          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text"
                placeholder="Search items, sellers, games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <GlassCard className="px-4 py-2 flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-[10px] text-white/40 uppercase">Balance</p>
                <p className="text-sm font-bold text-white">24,500 AGP</p>
              </div>
            </GlassCard>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl h-10">
              <Plus className="w-4 h-4 mr-2" /> Sell Item
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto">
        {/* Featured Carousel */}
        <section className="relative p-6">
          <div className="relative overflow-hidden rounded-3xl">
            <AnimatePresence mode="wait">
              <FeaturedItem 
                key={featuredIndex}
                item={FEATURED_ITEMS[featuredIndex]}
                isActive={true}
              />
            </AnimatePresence>
            
            {/* Carousel Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button 
                onClick={() => setFeaturedIndex(prev => prev === 0 ? FEATURED_ITEMS.length - 1 : prev - 1)}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/70 hover:text-white border border-white/20"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                {FEATURED_ITEMS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFeaturedIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${idx === featuredIndex ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/50'}`}
                  />
                ))}
              </div>
              <button 
                onClick={() => setFeaturedIndex(prev => (prev + 1) % FEATURED_ITEMS.length)}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/70 hover:text-white border border-white/20"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Browse Section */}
        <section className="px-6 pb-12">
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <FilterSidebar 
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedGame={selectedGame}
                setSelectedGame={setSelectedGame}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                selectedRarities={selectedRarities}
                setSelectedRarities={setSelectedRarities}
              />
            </aside>

            {/* Items Grid */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-white/60 text-sm">
                  <span className="text-white font-semibold">{filteredItems.length}</span> items found
                </p>
                <div className="flex items-center gap-3">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredItems.map((item) => (
                  <ItemCard 
                    key={item.id}
                    item={item}
                    onClick={setSelectedItem}
                  />
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-white/40">
                  <Package className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-lg font-semibold">No items found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Item Inspector Modal */}
      <ItemInspector 
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}