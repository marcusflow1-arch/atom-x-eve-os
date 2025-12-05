import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Search, Filter, ChevronRight, ChevronLeft, Star, TrendingUp, Clock, Tag,
  Sparkles, Crown, Flame, DollarSign, Eye, Heart, ShoppingCart, Play,
  Gamepad2, Package, Zap, Shield, Sword, X, SlidersHorizontal, Grid, List,
  Home, ShoppingBag, Library, Trophy, Layers, Hammer, Users, Bot, ArrowLeftRight,
  Gavel, Lightbulb, Settings, LogIn, LogOut, MessageSquare, Swords, Rocket, Plus,
  Wand2, Ghost, Footprints, Gem, ScrollText, CircuitBoard, Shirt, Cpu, BookOpen, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '../components/auth/AuthContext';

// --- Enhanced Mock Data for Gaming Items ---
const MARKETPLACE_ITEMS = [
  // Companions
  { id: 'c1', name: 'Phoenix Familiar', price: 45000, rarity: 'Legendary', game: 'Mage Wars Online', category: 'Companions', subcategory: 'Mythical', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'PetMaster', rating: 4.9 }, views: 3421, description: 'A blazing phoenix that revives you once per battle.', stats: { Power: 85, Loyalty: 95 }, reviews: 234 },
  { id: 'c2', name: 'Shadow Wolf Pack', price: 28000, rarity: 'Epic', game: 'Elder Scrolls: Reborn', category: 'Companions', subcategory: 'Beast', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'WildTamer', rating: 4.7 }, views: 2156, description: 'Three shadow wolves that hunt alongside you.', stats: { Power: 70, Loyalty: 80 }, reviews: 156 },
  { id: 'c3', name: 'Quantum AI Drone', price: 52000, rarity: 'Mythic', game: 'Cyberpunk 2088', category: 'Companions', subcategory: 'Mechanical', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'TechDealer', rating: 5.0 }, views: 4521, description: 'Advanced AI companion with combat assistance.', stats: { Power: 90, Intelligence: 100 }, reviews: 312 },
  { id: 'c4', name: 'Elemental Sprite', price: 15000, rarity: 'Rare', game: 'Mage Wars Online', category: 'Companions', subcategory: 'Elemental', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'SpriteTrader', rating: 4.5 }, views: 1234, description: 'A helpful sprite that buffs your magic abilities.', stats: { Power: 45, Support: 75 }, reviews: 89 },
  
  // Gear - Weapons
  { id: 'g1', name: 'Void Reaper Scythe', price: 78000, rarity: 'Legendary', game: 'Elder Scrolls: Reborn', category: 'Gear', subcategory: 'Weapons', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'VoidForge', rating: 4.9 }, views: 5678, description: 'Harvests souls with each killing blow.', stats: { Attack: 120, CritChance: 25 }, reviews: 445 },
  { id: 'g2', name: 'Plasma Cannon MK-X', price: 65000, rarity: 'Epic', game: 'Galactic Warfare', category: 'Gear', subcategory: 'Weapons', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=400&fit=crop', seller: { name: 'GunRunner', rating: 4.6 }, views: 3421, description: 'Military-grade plasma weapon with burst fire.', stats: { Attack: 95, FireRate: 80 }, reviews: 267 },
  { id: 'g3', name: 'Cyber Katana', price: 42000, rarity: 'Epic', game: 'Cyberpunk 2088', category: 'Gear', subcategory: 'Weapons', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'BladeSmith', rating: 4.8 }, views: 2987, description: 'Mono-molecular edge cuts through anything.', stats: { Attack: 85, Speed: 95 }, reviews: 198 },
  
  // Gear - Armor
  { id: 'g4', name: 'Void Emperor Armor Set', price: 125000, rarity: 'Mythic', game: 'Elder Scrolls: Reborn', category: 'Gear', subcategory: 'Armor', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'VoidMaster', rating: 4.9 }, views: 8921, description: 'Full armor set forged in the void dimension.', stats: { Defense: 150, MagicRes: 80 }, reviews: 567 },
  { id: 'g5', name: 'Stealth Cloak', price: 35000, rarity: 'Epic', game: 'Assassin Protocol', category: 'Gear', subcategory: 'Armor', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop', seller: { name: 'ShadowDealer', rating: 4.7 }, views: 1876, description: 'Renders wearer nearly invisible in shadows.', stats: { Defense: 40, Stealth: 100 }, reviews: 134 },
  { id: 'g6', name: 'Exo-Suit Mk IV', price: 89000, rarity: 'Legendary', game: 'Cyberpunk 2088', category: 'Gear', subcategory: 'Armor', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'CyberDoc', rating: 5.0 }, views: 4532, description: 'Military exoskeleton with integrated weapons.', stats: { Defense: 120, Strength: 150 }, reviews: 389 },
  
  // Abilities
  { id: 'a1', name: 'Time Warp Mastery', price: 95000, rarity: 'Mythic', game: 'Mage Wars Online', category: 'Abilities', subcategory: 'Magic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'ArcaneTrader', rating: 5.0 }, views: 6789, description: 'Manipulate time in a 50m radius for 10 seconds.', stats: { Power: 100, Cooldown: 300 }, reviews: 456 },
  { id: 'a2', name: 'Neural Hack Protocol', price: 55000, rarity: 'Legendary', game: 'Cyberpunk 2088', category: 'Abilities', subcategory: 'Tech', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'Netrunner', rating: 4.8 }, views: 3456, description: 'Instantly hack any electronic system.', stats: { Power: 85, Range: 100 }, reviews: 234 },
  { id: 'a3', name: 'Dragon Soul Fusion', price: 72000, rarity: 'Legendary', game: 'Elder Scrolls: Reborn', category: 'Abilities', subcategory: 'Transformation', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'DragonBorn', rating: 4.9 }, views: 5123, description: 'Transform into a dragon for 60 seconds.', stats: { Power: 95, Duration: 60 }, reviews: 378 },
  { id: 'a4', name: 'Shadow Step', price: 22000, rarity: 'Epic', game: 'Assassin Protocol', category: 'Abilities', subcategory: 'Movement', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop', seller: { name: 'ShadowGuild', rating: 4.6 }, views: 2345, description: 'Teleport through shadows up to 30m.', stats: { Range: 30, Cooldown: 8 }, reviews: 167 },
  
  // Consumables
  { id: 'con1', name: 'Elixir of Immortality', price: 8500, rarity: 'Epic', game: 'Elder Scrolls: Reborn', category: 'Consumables', subcategory: 'Potions', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'AlchemyKing', rating: 4.7 }, views: 4567, description: 'Prevents death once. 24h cooldown.', stats: { Uses: 1 }, reviews: 312 },
  { id: 'con2', name: 'XP Boost Crystal x10', price: 12000, rarity: 'Rare', game: 'All Games', category: 'Consumables', subcategory: 'Boosters', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'BoostShop', rating: 4.5 }, views: 8901, description: 'Double XP for 2 hours per crystal.', stats: { Duration: '2h', Quantity: 10 }, reviews: 567 },
  
  // Materials
  { id: 'mat1', name: 'Void Essence x100', price: 35000, rarity: 'Legendary', game: 'Elder Scrolls: Reborn', category: 'Materials', subcategory: 'Crafting', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'RareMats', rating: 5.0 }, views: 3421, description: 'Required for crafting void-tier equipment.', stats: { Quantity: 100 }, reviews: 234 },
  { id: 'mat2', name: 'Quantum Core', price: 28000, rarity: 'Epic', game: 'Cyberpunk 2088', category: 'Materials', subcategory: 'Tech Parts', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'TechParts', rating: 4.6 }, views: 2134, description: 'Power source for advanced cybernetics.', stats: { Power: 'Unlimited' }, reviews: 156 },
  
  // Mounts
  { id: 'mt1', name: 'Cyber Dragon Mount', price: 150000, rarity: 'Mythic', game: 'Elder Scrolls: Reborn', category: 'Mounts', subcategory: 'Flying', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'MountKing', rating: 5.0 }, views: 12453, description: 'Mechanical dragon with plasma breath.', stats: { Speed: 200, Flight: true }, reviews: 678 },
  { id: 'mt2', name: 'Hoverbike Racer', price: 45000, rarity: 'Epic', game: 'Cyberpunk 2088', category: 'Mounts', subcategory: 'Vehicle', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'SpeedDealer', rating: 4.8 }, views: 5678, description: 'Fastest ground vehicle in Night City.', stats: { Speed: 350, Boost: true }, reviews: 345 },
];

const CATEGORIES = [
  { id: 'all', name: 'All Items', icon: Grid },
  { id: 'Companions', name: 'Companions', icon: Ghost },
  { id: 'Gear', name: 'Gear', icon: Shield },
  { id: 'Abilities', name: 'Abilities', icon: Zap },
  { id: 'Consumables', name: 'Consumables', icon: Package },
  { id: 'Materials', name: 'Materials', icon: Gem },
  { id: 'Mounts', name: 'Mounts', icon: Footprints },
];

const SUBCATEGORIES = {
  Companions: ['All', 'Mythical', 'Beast', 'Mechanical', 'Elemental'],
  Gear: ['All', 'Weapons', 'Armor', 'Accessories'],
  Abilities: ['All', 'Magic', 'Tech', 'Transformation', 'Movement'],
  Consumables: ['All', 'Potions', 'Boosters', 'Food'],
  Materials: ['All', 'Crafting', 'Tech Parts', 'Gems'],
  Mounts: ['All', 'Flying', 'Ground', 'Vehicle'],
};

const GAMES = ['All Games', 'Elder Scrolls: Reborn', 'Cyberpunk 2088', 'Mage Wars Online', 'Galactic Warfare', 'Assassin Protocol'];

// --- Rarity Styles ---
const rarityStyles = {
  Common: { bg: 'from-slate-500/20 to-slate-600/10', border: 'border-slate-500/30', text: 'text-slate-300', glow: '', gradient: 'bg-gradient-to-r from-slate-400 to-slate-500' },
  Uncommon: { bg: 'from-green-500/20 to-green-600/10', border: 'border-green-500/30', text: 'text-green-400', glow: '', gradient: 'bg-gradient-to-r from-green-400 to-green-500' },
  Rare: { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-blue-500/10', gradient: 'bg-gradient-to-r from-blue-400 to-blue-500' },
  Epic: { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'shadow-purple-500/20', gradient: 'bg-gradient-to-r from-purple-400 to-purple-500' },
  Legendary: { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'shadow-orange-500/20', gradient: 'bg-gradient-to-r from-orange-400 to-orange-500' },
  Mythic: { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30', text: 'text-red-400', glow: 'shadow-red-500/30', gradient: 'bg-gradient-to-r from-red-400 to-pink-500' }
};

// --- Liquid Glass Card Component ---
const LiquidCard = ({ children, className = "", onClick, hover = true }) => {
  const x = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const waveX = useTransform(mouseX, [0, 1], ["-100%", "200%"]);

  function handleMouseMove({ currentTarget, clientX }) {
    const { left, width } = currentTarget.getBoundingClientRect();
    x.set((clientX - left) / width);
  }

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-lg transition-all duration-300 group ${hover ? 'hover:shadow-blue-500/20 hover:border-white/20 cursor-pointer' : ''} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => x.set(0.5)}
      onClick={onClick}
      whileHover={hover ? { scale: 1.01 } : {}}
    >
      {hover && (
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
          style={{ left: waveX, width: "80%", height: "100%" }}
        />
      )}
      {children}
    </motion.div>
  );
};

// --- Amazon-Style Item Card ---
const ItemCard = ({ item, onClick }) => {
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <LiquidCard onClick={() => onClick(item)} className="h-full flex flex-col">
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

        {/* Rarity Indicator */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${rarity.gradient}`} />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <Badge className={`${rarity.bg} ${rarity.text} border-none text-[10px] px-2 backdrop-blur-md`}>
            {item.rarity}
          </Badge>
          {item.views > 5000 && (
            <Badge className="bg-orange-500/80 text-white text-[10px] border-none px-2">
              <Flame className="w-2.5 h-2.5 mr-1" /> Hot
            </Badge>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'text-red-500 fill-current' : 'text-white/70'}`} />
        </button>

        {/* Quick Add */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Button
            onClick={(e) => { e.stopPropagation(); }}
            className="w-full bg-blue-600/90 hover:bg-blue-600 text-white text-xs h-9 rounded-lg backdrop-blur-md"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Add to Cart
          </Button>
        </motion.div>
      </div>

      {/* Info Section - Amazon Style */}
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-blue-400 text-xs mb-1 truncate">{item.game}</p>
        <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors leading-tight">
          {item.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < Math.floor(item.seller.rating) ? 'text-yellow-400 fill-current' : 'text-slate-600'}`} />
            ))}
          </div>
          <span className="text-white/50 text-xs">({item.reviews || 0})</span>
        </div>

        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-1">
            <span className="text-green-400 text-xl font-bold">{item.price.toLocaleString()}</span>
            <span className="text-white/40 text-xs">AGP</span>
          </div>
          <p className="text-white/30 text-[10px] mt-1">Free delivery with Prime</p>
        </div>
      </div>
    </LiquidCard>
  );
};

// --- Amazon-Style Filter Sidebar ---
const FilterSidebar = ({
  selectedCategory, setSelectedCategory,
  selectedSubcategory, setSelectedSubcategory,
  selectedGame, setSelectedGame,
  priceRange, setPriceRange,
  selectedRarities, setSelectedRarities,
  customerRating, setCustomerRating
}) => {
  const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];

  const toggleRarity = (rarity) => {
    setSelectedRarities(prev =>
      prev.includes(rarity) ? prev.filter(r => r !== rarity) : [...prev, rarity]
    );
  };

  const activeSubcats = selectedCategory !== 'all' ? SUBCATEGORIES[selectedCategory] || [] : [];

  return (
    <LiquidCard hover={false} className="p-5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Department / Category */}
      <div className="mb-5">
        <h3 className="text-white font-bold text-sm mb-3">Department</h3>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory('All'); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory */}
      {activeSubcats.length > 0 && (
        <>
          <div className="h-px bg-white/10 my-4" />
          <div className="mb-5">
            <h3 className="text-white font-bold text-sm mb-3">Subcategory</h3>
            <div className="space-y-1">
              {activeSubcats.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm transition-all ${
                    selectedSubcategory === sub ? 'text-blue-400 font-medium' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="h-px bg-white/10 my-4" />

      {/* Customer Reviews */}
      <div className="mb-5">
        <h3 className="text-white font-bold text-sm mb-3">Customer Reviews</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setCustomerRating(customerRating === rating ? null : rating)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-all ${
                customerRating === rating ? 'bg-yellow-500/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-slate-600'}`} />
                ))}
              </div>
              <span className="text-white/50 text-xs">& Up</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Game Filter */}
      <div className="mb-5">
        <h3 className="text-white font-bold text-sm mb-3">Game</h3>
        <Select value={selectedGame} onValueChange={setSelectedGame}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
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
      <div className="mb-5">
        <h3 className="text-white font-bold text-sm mb-3">Price</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={200000}
          min={0}
          step={5000}
          className="mb-3"
        />
        <div className="flex items-center gap-2 text-xs">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-center"
            placeholder="Min"
          />
          <span className="text-white/30">to</span>
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-center"
            placeholder="Max"
          />
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Rarity */}
      <div className="mb-5">
        <h3 className="text-white font-bold text-sm mb-3">Rarity</h3>
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
          setSelectedCategory('all');
          setSelectedSubcategory('All');
          setSelectedGame('All Games');
          setPriceRange([0, 200000]);
          setSelectedRarities([]);
          setCustomerRating(null);
        }}
        className="w-full mt-4 py-2 text-sm text-white/50 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all"
      >
        Clear All Filters
      </button>
    </LiquidCard>
  );
};

// --- Item Detail Modal ---
const ItemDetailModal = ({ item, isOpen, onClose }) => {
  if (!item) return null;
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-2xl border-white/10 max-w-3xl text-white p-0 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative aspect-square bg-gradient-to-br from-slate-800 to-slate-900">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            <div className={`absolute top-0 left-0 right-0 h-1 ${rarity.gradient}`} />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/70 hover:text-white border border-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${rarity.bg} ${rarity.text} border-none`}>{item.rarity}</Badge>
              <Badge variant="outline" className="border-white/20 text-white/60 text-xs">{item.category}</Badge>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">{item.name}</h2>
            <p className="text-blue-400 text-sm mb-3">{item.game}</p>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(item.seller.rating) ? 'text-yellow-400 fill-current' : 'text-slate-600'}`} />
                ))}
              </div>
              <span className="text-blue-400 text-sm">{item.reviews || 0} ratings</span>
            </div>

            <p className="text-white/60 text-sm mb-4 leading-relaxed">{item.description}</p>

            {/* Stats */}
            {item.stats && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.entries(item.stats).map(([key, value]) => (
                  <div key={key} className="bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                    <p className="text-white/40 text-xs">{key}</p>
                    <p className="text-white font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="mt-auto">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-black text-green-400">{item.price.toLocaleString()}</span>
                <span className="text-white/40">AGP</span>
              </div>

              {/* Seller Info */}
              <div className="flex items-center gap-2 mb-4 text-sm">
                <span className="text-white/40">Sold by</span>
                <span className="text-white font-medium">{item.seller.name}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-yellow-400">{item.seller.rating}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-11 rounded-lg">
                  <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                </Button>
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 rounded-lg">
                  Buy Now
                </Button>
              </div>

              <Button variant="outline" className="w-full mt-3 border-white/20 text-white hover:bg-white/10 h-10 rounded-lg">
                <Heart className="w-4 h-4 mr-2" /> Add to Wishlist
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Marketplace Page ---
export default function Marketplace() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [selectedGame, setSelectedGame] = useState('All Games');
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [selectedRarities, setSelectedRarities] = useState([]);
  const [customerRating, setCustomerRating] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allNavItems = [
    { name: 'Dashboard', icon: Home, path: createPageUrl('Dashboard') },
    { name: 'Store', icon: ShoppingBag, path: createPageUrl('Store') },
    { name: 'Library', icon: Library, path: createPageUrl('Library') },
    { name: 'Achievements', icon: Trophy, path: createPageUrl('Achievements') },
    { name: 'Trading Cards', icon: Layers, path: createPageUrl('TradingCards') },
    { name: 'Blacksmith', icon: Hammer, path: createPageUrl('Blacksmith') },
    { name: 'Marketplace', icon: Gavel, path: createPageUrl('Marketplace') },
    { name: 'Trading Post', icon: ArrowLeftRight, path: createPageUrl('TradingPost') },
    { name: 'Profile', icon: Shield, path: createPageUrl('Profile') },
  ];

  const getDisplayName = () => user?.username || user?.full_name || user?.email?.split('@')[0] || 'User';
  const getUserInitial = () => getDisplayName().charAt(0).toUpperCase();

  // Filter items
  const filteredItems = useMemo(() => {
    return MARKETPLACE_ITEMS.filter(item => {
      const searchMatch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
      const subcategoryMatch = selectedSubcategory === 'All' || item.subcategory === selectedSubcategory;
      const gameMatch = selectedGame === 'All Games' || item.game === selectedGame;
      const priceMatch = item.price >= priceRange[0] && item.price <= priceRange[1];
      const rarityMatch = selectedRarities.length === 0 || selectedRarities.includes(item.rarity);
      const ratingMatch = !customerRating || item.seller.rating >= customerRating;
      return searchMatch && categoryMatch && subcategoryMatch && gameMatch && priceMatch && rarityMatch && ratingMatch;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'reviews') return (b.reviews || 0) - (a.reviews || 0);
      if (sortBy === 'newest') return b.views - a.views;
      return (b.views || 0) - (a.views || 0); // featured = popular
    });
  }, [searchTerm, selectedCategory, selectedSubcategory, selectedGame, priceRange, selectedRarities, customerRating, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
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
              className="fixed top-0 left-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-3xl border-r border-white/10 z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-bold text-xl tracking-wider">ATOM×EVE</span>
                  <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                {isAuthenticated ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">{getUserInitial()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{getDisplayName()}</p>
                      <p className="text-white/40 text-xs truncate">{user?.email}</p>
                    </div>
                    <button onClick={logout} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={login} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium border border-white/10">
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
                      <Link key={item.name} to={item.path} onClick={() => setDrawerOpen(false)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="p-4 border-t border-white/10">
                <p className="text-white/20 text-xs text-center">© 2025 ATOM×EVE</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header - Amazon Style */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
          {/* Menu + Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-all"
            >
              <div className="flex flex-col gap-[3px]">
                <span className="w-3.5 h-[2px] bg-white/80 rounded-full"></span>
                <span className="w-3.5 h-[2px] bg-white/80 rounded-full"></span>
                <span className="w-3.5 h-[2px] bg-white/80 rounded-full"></span>
              </div>
            </button>
            <span className="text-white font-semibold text-sm tracking-wide whitespace-nowrap hidden sm:block">Atom X Eve Market</span>
          </div>

          {/* Search Bar - Amazon Style */}
          <div className="flex-1 max-w-3xl">
            <div className="flex items-center bg-white/10 backdrop-blur-xl rounded-lg overflow-hidden border border-white/10 focus-within:border-blue-500/50 focus-within:bg-white/15 transition-all">
              <Select value={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setSelectedSubcategory('All'); }}>
                <SelectTrigger className="w-[140px] bg-white/5 border-none rounded-none text-white/70 text-xs h-10 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="w-px h-6 bg-white/20" />
              <input
                type="text"
                placeholder="Search companions, gear, abilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none py-2.5 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-0"
              />
              <button className="h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <LiquidCard hover={false} className="px-3 py-1.5 hidden md:flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-[9px] text-white/40 uppercase leading-none">Balance</p>
                <p className="text-sm font-bold text-white leading-tight">24,500 AGP</p>
              </div>
            </LiquidCard>
            <Button onClick={() => navigate(createPageUrl('Cart'))} variant="ghost" className="relative h-10 w-10 p-0 hover:bg-white/10">
              <ShoppingCart className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">3</span>
            </Button>
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/20 cursor-pointer hover:ring-white/40 transition-all">
              <img
                src={user?.avatar_url || "https://github.com/shadcn.png"}
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Secondary Nav - Category Quick Links */}
        <div className="bg-slate-800/50 border-t border-white/5">
          <div className="max-w-[1920px] mx-auto px-4 md:px-6 h-10 flex items-center gap-6 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory('All'); }}
                className={`flex items-center gap-1.5 text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id ? 'text-blue-400' : 'text-white/60 hover:text-white'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 md:px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedSubcategory={selectedSubcategory}
              setSelectedSubcategory={setSelectedSubcategory}
              selectedGame={selectedGame}
              setSelectedGame={setSelectedGame}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedRarities={selectedRarities}
              setSelectedRarities={setSelectedRarities}
              customerRating={customerRating}
              setCustomerRating={setCustomerRating}
            />
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl font-bold text-white mb-1">
                  {selectedCategory === 'all' ? 'All Items' : selectedCategory}
                  {selectedSubcategory !== 'All' && ` › ${selectedSubcategory}`}
                </h1>
                <p className="text-white/50 text-sm">
                  <span className="text-white font-medium">{filteredItems.length}</span> results
                  {searchTerm && <span> for "<span className="text-blue-400">{searchTerm}</span>"</span>}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-white/40 text-sm">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="reviews">Avg. Customer Review</SelectItem>
                    <SelectItem value="newest">Newest Arrivals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Pills */}
            {(selectedRarities.length > 0 || customerRating || selectedGame !== 'All Games') && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {selectedRarities.map(r => (
                  <Badge key={r} className="bg-white/10 text-white border-none rounded-full px-3 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-white/20">
                    {r}
                    <X className="w-3 h-3" onClick={() => setSelectedRarities(prev => prev.filter(x => x !== r))} />
                  </Badge>
                ))}
                {customerRating && (
                  <Badge className="bg-white/10 text-white border-none rounded-full px-3 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-white/20">
                    {customerRating}+ Stars
                    <X className="w-3 h-3" onClick={() => setCustomerRating(null)} />
                  </Badge>
                )}
                {selectedGame !== 'All Games' && (
                  <Badge className="bg-white/10 text-white border-none rounded-full px-3 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-white/20">
                    {selectedGame}
                    <X className="w-3 h-3" onClick={() => setSelectedGame('All Games')} />
                  </Badge>
                )}
              </div>
            )}

            {/* Items Grid */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ItemCard item={item} onClick={setSelectedItem} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-white text-lg font-semibold mb-2">No items found</h3>
                <p className="text-white/40 text-sm text-center max-w-md">
                  Try adjusting your search or filter criteria to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 px-6 py-8 border-t border-white/10 bg-slate-900/50">
        <div className="max-w-[1920px] mx-auto text-center text-white/30 text-sm">
          <p>© 2025 Atom X Eve Market. All rights reserved.</p>
        </div>
      </footer>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}