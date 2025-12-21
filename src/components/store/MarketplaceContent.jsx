import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Search, ChevronRight, ChevronDown, Star, TrendingUp, Clock,
  Sparkles, DollarSign, Eye, Heart, ShoppingCart,
  Gamepad2, Package, Zap, Shield, X, Grid, List,
  Ghost, Footprints, Gem, Check, Truck, Award, Users, Plus,
  ArrowUpDown, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../CartContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ShinyCard from '@/components/shared/ShinyCard';
import DeveloperLimitedEdition from './DeveloperLimitedEdition';

// Enhanced Mock Data
const MARKETPLACE_ITEMS = [
  { id: 'c1', name: 'Phoenix Familiar - Legendary Fire Companion with Auto-Revive Ability', price: 45000, originalPrice: 52000, rarity: 'Legendary', game: 'Mage Wars Online', category: 'Companions', subcategory: 'Mythical', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'PetMaster', rating: 4.9, sales: 1250 }, views: 3421, description: 'A blazing phoenix companion that automatically revives you once per battle. Includes flame aura effect.', stats: { Power: 85, Loyalty: 95 }, reviews: 234, prime: true, sponsored: true },
  { id: 'c2', name: 'Shadow Wolf Pack - Triple Beast Companion Set with Stealth Bonus', price: 28000, rarity: 'Epic', game: 'Elder Scrolls: Reborn', category: 'Companions', subcategory: 'Beast', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'WildTamer', rating: 4.7, sales: 890 }, views: 2156, description: 'Three shadow wolves that hunt alongside you with +25% stealth bonus when active.', stats: { Power: 70, Loyalty: 80 }, reviews: 156, prime: true },
  { id: 'c3', name: 'Quantum AI Drone MK-X - Advanced Combat Assistant with Neural Link', price: 52000, rarity: 'Mythic', game: 'Cyberpunk 2088', category: 'Companions', subcategory: 'Mechanical', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'TechDealer', rating: 5.0, sales: 2100 }, views: 4521, description: 'Military-grade AI companion with combat assistance, hacking support, and tactical analysis.', stats: { Power: 90, Intelligence: 100 }, reviews: 312, prime: true, sponsored: true },
  { id: 'c4', name: 'Elemental Sprite - Magic Buffer Companion with Mana Regeneration', price: 15000, originalPrice: 18000, rarity: 'Rare', game: 'Mage Wars Online', category: 'Companions', subcategory: 'Elemental', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'SpriteTrader', rating: 4.5, sales: 567 }, views: 1234, description: 'A helpful sprite that buffs magic abilities by 15% and provides passive mana regeneration.', stats: { Power: 45, Support: 75 }, reviews: 89, prime: false },
  { id: 'g1', name: 'Void Reaper Scythe - Soul Harvesting Legendary Weapon with Life Steal', price: 78000, rarity: 'Legendary', game: 'Elder Scrolls: Reborn', category: 'Gear', subcategory: 'Weapons', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'VoidForge', rating: 4.9, sales: 1890 }, views: 5678, description: 'Harvests souls with each killing blow. 15% life steal on hit. Glows with void energy.', stats: { Attack: 120, CritChance: 25 }, reviews: 445, prime: true },
  { id: 'g2', name: 'Plasma Cannon MK-X - Military Grade Heavy Weapon with Burst Fire Mode', price: 65000, originalPrice: 72000, rarity: 'Epic', game: 'Galactic Warfare', category: 'Gear', subcategory: 'Weapons', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=400&fit=crop', seller: { name: 'GunRunner', rating: 4.6, sales: 1200 }, views: 3421, description: 'Military-grade plasma weapon with burst fire capability. Includes thermal scope attachment.', stats: { Attack: 95, FireRate: 80 }, reviews: 267, prime: true, sponsored: true },
  { id: 'g3', name: 'Cyber Katana - Mono-Molecular Edge Blade with Electric Discharge', price: 42000, rarity: 'Epic', game: 'Cyberpunk 2088', category: 'Gear', subcategory: 'Weapons', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'BladeSmith', rating: 4.8, sales: 980 }, views: 2987, description: 'Mono-molecular edge cuts through any armor. Electric discharge on critical hits.', stats: { Attack: 85, Speed: 95 }, reviews: 198, prime: true },
  { id: 'g4', name: 'Void Emperor Complete Armor Set - Full Protection with Shadow Immunity', price: 125000, originalPrice: 150000, rarity: 'Mythic', game: 'Elder Scrolls: Reborn', category: 'Gear', subcategory: 'Armor', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'VoidMaster', rating: 4.9, sales: 3200 }, views: 8921, description: 'Complete 5-piece armor set forged in the void dimension. Grants immunity to shadow damage.', stats: { Defense: 150, MagicRes: 80 }, reviews: 567, prime: true, sponsored: true },
  { id: 'g5', name: 'Stealth Cloak of Shadows - Near Invisibility in Dark Environments', price: 35000, rarity: 'Epic', game: 'Assassin Protocol', category: 'Gear', subcategory: 'Armor', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop', seller: { name: 'ShadowDealer', rating: 4.7, sales: 780 }, views: 1876, description: 'Renders wearer 95% invisible in shadows. Silent movement bonus included.', stats: { Defense: 40, Stealth: 100 }, reviews: 134, prime: false },
  { id: 'a1', name: 'Time Warp Mastery - Ultimate Time Manipulation Ability Unlock', price: 95000, rarity: 'Mythic', game: 'Mage Wars Online', category: 'Abilities', subcategory: 'Magic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'ArcaneTrader', rating: 5.0, sales: 890 }, views: 6789, description: 'Manipulate time in a 50m radius for 10 seconds. Slow enemies, speed up allies.', stats: { Power: 100, Cooldown: 300 }, reviews: 456, prime: true },
  { id: 'a2', name: 'Neural Hack Protocol - Instant System Override Netrunner Ability', price: 55000, rarity: 'Legendary', game: 'Cyberpunk 2088', category: 'Abilities', subcategory: 'Tech', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'Netrunner', rating: 4.8, sales: 670 }, views: 3456, description: 'Instantly hack any electronic system within 100m range. Bypass all firewalls.', stats: { Power: 85, Range: 100 }, reviews: 234, prime: true },
  { id: 'a3', name: 'Dragon Soul Fusion - Transform into Dragon Form for 60 Seconds', price: 72000, rarity: 'Legendary', game: 'Elder Scrolls: Reborn', category: 'Abilities', subcategory: 'Transformation', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'DragonBorn', rating: 4.9, sales: 1100 }, views: 5123, description: 'Transform into a full dragon for 60 seconds. Flight, fire breath, and massive stat boost.', stats: { Power: 95, Duration: 60 }, reviews: 378, prime: true, sponsored: true },
  { id: 'con1', name: 'Elixir of Immortality x5 Bundle - Death Prevention Potions', price: 8500, originalPrice: 10000, rarity: 'Epic', game: 'Elder Scrolls: Reborn', category: 'Consumables', subcategory: 'Potions', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'AlchemyKing', rating: 4.7, sales: 4500 }, views: 4567, description: 'Prevents death once per use. 24h cooldown between uses. Bundle of 5 potions.', stats: { Uses: 5 }, reviews: 312, prime: true },
  { id: 'mat1', name: 'Void Essence x100 - Legendary Crafting Material Bundle', price: 35000, rarity: 'Legendary', game: 'Elder Scrolls: Reborn', category: 'Materials', subcategory: 'Crafting', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'RareMats', rating: 5.0, sales: 2800 }, views: 3421, description: 'Required for crafting void-tier equipment. High purity essence bundle.', stats: { Quantity: 100 }, reviews: 234, prime: true },
  { id: 'mt1', name: 'Cyber Dragon Mount - Mechanical Flying Dragon with Plasma Breath', price: 150000, rarity: 'Mythic', game: 'Elder Scrolls: Reborn', category: 'Mounts', subcategory: 'Flying', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'MountKing', rating: 5.0, sales: 450 }, views: 12453, description: 'Mechanical dragon with plasma breath attack. 200% movement speed in air.', stats: { Speed: 200, Flight: true }, reviews: 678, prime: true, sponsored: true },
  { id: 'mt2', name: 'Hoverbike Racer X1 - Fastest Ground Vehicle in Night City', price: 45000, rarity: 'Epic', game: 'Cyberpunk 2088', category: 'Mounts', subcategory: 'Vehicle', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'SpeedDealer', rating: 4.8, sales: 1200 }, views: 5678, description: 'Fastest ground vehicle with nitro boost capability. Customizable LED lighting.', stats: { Speed: 350, Boost: true }, reviews: 345, prime: true },
];

const CATEGORIES = [
  { id: 'all', name: 'All Departments', icon: Grid },
  { id: 'Companions', name: 'Companions', icon: Ghost },
  { id: 'Gear', name: 'Gear & Equipment', icon: Shield },
  { id: 'Abilities', name: 'Abilities & Skills', icon: Zap },
  { id: 'Consumables', name: 'Consumables', icon: Package },
  { id: 'Materials', name: 'Crafting Materials', icon: Gem },
  { id: 'Mounts', name: 'Mounts & Vehicles', icon: Footprints },
];

const GAMES = ['All Games', 'Elder Scrolls: Reborn', 'Cyberpunk 2088', 'Mage Wars Online', 'Galactic Warfare', 'Assassin Protocol'];

const rarityStyles = {
  Common: { text: 'text-slate-400', bg: 'bg-slate-500/20' },
  Uncommon: { text: 'text-green-400', bg: 'bg-green-500/20' },
  Rare: { text: 'text-blue-400', bg: 'bg-blue-500/20' },
  Epic: { text: 'text-purple-400', bg: 'bg-purple-500/20' },
  Legendary: { text: 'text-orange-400', bg: 'bg-orange-500/20' },
  Mythic: { text: 'text-red-400', bg: 'bg-red-500/20' }
};

// Liquid Glass Card
const LiquidCard = ({ children, className = "", onClick, hover = true }) => {
  const x = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const waveX = useTransform(mouseX, [0, 1], ["-100%", "200%"]);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl bg-slate-900/60 backdrop-blur-xl border border-white/10 transition-all duration-300 ${hover ? 'hover:border-white/20 hover:bg-slate-800/60 cursor-pointer' : ''} ${className}`}
      onMouseMove={({ currentTarget, clientX }) => {
        const { left, width } = currentTarget.getBoundingClientRect();
        x.set((clientX - left) / width);
      }}
      onMouseLeave={() => x.set(0.5)}
      onClick={onClick}
    >
      {hover && (
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
          style={{ left: waveX, width: "60%", height: "100%" }}
        />
      )}
      {children}
    </motion.div>
  );
};

// List Item Card
const ListItemCard = ({ item, onClick }) => {
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
  const discountPercent = hasDiscount ? Math.round((1 - item.price / item.originalPrice) * 100) : 0;

  return (
    <div 
      onClick={() => onClick(item)} 
      className="flex gap-8 p-6 cursor-pointer border-b border-white/10 items-center group/item hover:bg-white/[0.02] transition-colors"
    >
      {/* Shiny Card */}
      <div className="w-[160px] flex-shrink-0">
        <ShinyCard>
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
             <Badge className={`${rarity.bg} ${rarity.text} border-none text-[10px] w-full justify-center shadow-lg backdrop-blur-md`}>{item.rarity}</Badge>
          </div>
        </ShinyCard>
      </div>

      <div className="flex-1 min-w-0 py-2">
        <h3 className="text-blue-400 hover:text-orange-400 font-medium text-base leading-snug mb-1 line-clamp-2 transition-colors">
          {item.name}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(item.seller.rating) ? 'text-orange-400 fill-current' : 'text-slate-600'}`} />
            ))}
          </div>
          <span className="text-blue-400 text-sm">{item.reviews?.toLocaleString()}</span>
          <span className="text-white/30">|</span>
          <span className="text-white/50 text-sm">{item.seller.sales?.toLocaleString()}+ bought</span>
        </div>

        <div className="mb-2">
          {hasDiscount && (
            <div className="flex items-center gap-2 mb-0.5">
              <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">-{discountPercent}%</span>
              <span className="text-red-400 text-xs">Limited time deal</span>
            </div>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{(item.price || 0).toLocaleString()}</span>
            <span className="text-white/50 text-sm">AGP</span>
            {hasDiscount && (
              <span className="text-white/40 text-sm line-through">List: {(item.originalPrice || 0).toLocaleString()}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className={`${rarity.text} text-xs font-medium`}>{item.rarity}</span>
          <span className="text-white/40 text-xs">•</span>
          <span className="text-white/50 text-xs">{item.game}</span>
          <span className="text-white/40 text-xs">•</span>
          <span className="text-white/50 text-xs">{item.category}</span>
        </div>

        <p className="text-white/60 text-sm line-clamp-2">{item.description}</p>
      </div>

      <div className="hidden xl:block w-[140px] flex-shrink-0 text-right">
        <p className="text-white/40 text-xs mb-1">Sold by</p>
        <p className="text-blue-400 text-sm font-medium mb-1">{item.seller.name}</p>
        <div className="flex items-center justify-end gap-1">
          <Star className="w-3 h-3 text-orange-400 fill-current" />
          <span className="text-white text-xs">{item.seller.rating}</span>
        </div>
      </div>
    </div>
  );
};

// Product Row
const ProductRow = ({ title, items, onItemClick }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-white font-bold text-lg">{title}</h2>
      <button className="text-blue-400 text-sm hover:text-orange-400 flex items-center gap-1">
        See more <ChevronRight className="w-4 h-4" />
      </button>
    </div>
    <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-2 scrollbar-hide">
      {items.slice(0, 6).map((item) => {
        const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
        const hasDiscount = item.originalPrice && item.originalPrice > item.price;
        return (
          <div 
            key={item.id} 
            onClick={() => onItemClick(item)} 
            className="w-[180px] flex-shrink-0 cursor-pointer group"
          >
            <div className="w-full mb-3">
              <ShinyCard>
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                   <Badge className={`${rarity.bg} ${rarity.text} border-none text-[10px] w-full justify-center shadow-lg backdrop-blur-md`}>{item.rarity}</Badge>
                </div>
              </ShinyCard>
            </div>
            
            <h3 className="text-blue-400 text-sm font-medium line-clamp-2 mb-1 group-hover:text-orange-400 transition-colors">{item.name}</h3>
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.floor(item.seller.rating) ? 'text-orange-400 fill-current' : 'text-slate-600'}`} />
              ))}
              <span className="text-white/50 text-xs ml-1">{item.reviews}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-white font-bold">{(item.price || 0).toLocaleString()}</span>
              <span className="text-white/40 text-xs">AGP</span>
            </div>
            {hasDiscount && (
              <span className="text-white/40 text-xs line-through">{(item.originalPrice || 0).toLocaleString()}</span>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// Limited Edition Rewards Data
const LIMITED_REWARDS = [
  { id: 1, name: 'Void Reaper', type: 'Ability', rarity: 'Godlike', description: 'Summon a dimensional rift that pulls enemies into the void', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop' },
  { id: 2, name: 'Celestial Guardian', type: 'Companion', rarity: 'Mythical', description: 'Ancient spirit that shields allies and provides tactical support', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop' },
  { id: 3, name: 'Plasma Katana', type: 'Equipment', rarity: 'Legendary', description: 'Energy-infused blade that cuts through armor', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/87b4c67dd_123-1239359_lightsaber-katana-sword.png' },
  { id: 5, name: 'Mech Wolf', type: 'Companion', rarity: 'Legendary', description: 'Tactical combat drone with pack hunter AI', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/8c415b4eb_bc6044b0f6806867e2f92d967579b4.png' },
];

// Limited Edition Card Component
const LimitedEditionCard = ({ card }) => {
  const rarityColors = {
    Godlike: { bg: 'bg-slate-700', border: 'border-pink-400', text: 'text-white', glow: 'shadow-pink-500/80' },
    Mythical: { bg: 'bg-red-900', border: 'border-red-500', text: 'text-red-300', glow: 'shadow-red-500/50' },
    Legendary: { bg: 'bg-yellow-900', border: 'border-yellow-500', text: 'text-yellow-300', glow: 'shadow-yellow-500/50' },
    Epic: { bg: 'bg-purple-900', border: 'border-purple-500', text: 'text-purple-300', glow: 'shadow-purple-500/50' },
    Rare: { bg: 'bg-blue-900', border: 'border-blue-500', text: 'text-blue-300', glow: 'shadow-blue-500/50' },
    Common: { bg: 'bg-slate-700', border: 'border-slate-500', text: 'text-slate-300', glow: 'shadow-slate-500/50' }
  };
  const rarity = rarityColors[card.rarity] || rarityColors.Common;

  return (
    <div className="w-64 flex-shrink-0 flex flex-col gap-4 group cursor-pointer">
      <div className="w-full">
        <ShinyCard>
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
             <Badge className={`${rarity.bg} ${rarity.text} border-none text-[10px] w-full justify-center shadow-lg backdrop-blur-md`}>{card.rarity}</Badge>
          </div>
        </ShinyCard>
      </div>

      <div className="px-1">
        <div className="flex items-center justify-between mb-2">
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] px-2 py-0.5">{card.type}</Badge>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-2.5 h-2.5 ${i < (card.rarity === 'Godlike' ? 5 : card.rarity === 'Mythical' ? 4 : card.rarity === 'Legendary' ? 3 : card.rarity === 'Epic' ? 2 : 1) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
            ))}
          </div>
        </div>
        <h3 className="text-lg font-bold text-white mb-1 leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">{card.name}</h3>
        <p className="text-xs text-white/50 line-clamp-2">{card.description}</p>
      </div>
    </div>
  );
};

// Filter Sidebar
const FilterSidebar = ({ filters, setFilters }) => {
  const { category, game, priceRange, rarities, rating, prime, deals } = filters;

  const toggleRarity = (r) => {
    setFilters(prev => ({
      ...prev,
      rarities: prev.rarities.includes(r) ? prev.rarities.filter(x => x !== r) : [...prev.rarities, r]
    }));
  };

  const FilterSection = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
      <div className="border-b border-white/10 py-4">
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full text-left">
          <h3 className="text-white font-bold text-sm">{title}</h3>
          <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && <div className="mt-3">{children}</div>}
      </div>
    );
  };

  return (
    <div 
      className="w-[220px] flex-shrink-0 p-4 rounded-3xl h-fit"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      <FilterSection title="Equipment and Items">
        <div className="space-y-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                category === cat.id ? 'text-orange-400 font-medium' : 'text-white/70 hover:text-white'
              }`}
            >
              {category === cat.id && <ChevronRight className="w-3 h-3" />}
              {cat.id === 'all' ? 'All Loot' : cat.name}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Genre">
        <div className="space-y-1">
          {['All Genres', 'Action', 'RPG', 'Shooter', 'Strategy', 'Adventure', 'Sports', 'Racing', 'Simulation', 'Horror'].map(genre => (
            <button
              key={genre}
              onClick={() => setFilters(prev => ({ ...prev, genre: genre }))}
              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                filters.genre === genre ? 'text-orange-400 font-medium' : 'text-white/70 hover:text-white'
              }`}
            >
              {filters.genre === genre && <ChevronRight className="w-3 h-3" />}
              {genre}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Customer Reviews">
        <div className="space-y-2">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setFilters(prev => ({ ...prev, rating: prev.rating === r ? null : r }))}
              className={`flex items-center gap-2 w-full text-left ${rating === r ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
            >
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < r ? 'text-orange-400 fill-current' : 'text-slate-600'}`} />
                ))}
              </div>
              <span className="text-white/60 text-sm">& Up</span>
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price">
        <div className="space-y-2">
          {[[0, 10000], [10000, 50000], [50000, 100000], [100000, 200000]].map(([min, max], i) => (
            <button
              key={i}
              onClick={() => setFilters(prev => ({ ...prev, priceRange: [min, max] }))}
              className={`text-sm w-full text-left ${priceRange[0] === min && priceRange[1] === max ? 'text-orange-400' : 'text-white/70 hover:text-white'}`}
            >
              {min === 0 ? 'Under' : ''} {min > 0 ? `${(min/1000)}k` : ''} {min > 0 ? 'to' : ''} {(max/1000)}k AGP
            </button>
          ))}
          <div className="pt-2">
            <Slider
              value={priceRange}
              onValueChange={(val) => setFilters(prev => ({ ...prev, priceRange: val }))}
              max={200000}
              min={0}
              step={5000}
              className="mb-2"
            />
            <div className="flex items-center gap-2 text-xs">
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [+e.target.value, prev.priceRange[1]] }))}
                className="w-full bg-slate-800 border border-white/20 rounded px-2 py-1 text-white text-center"
              />
              <span className="text-white/30">-</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [prev.priceRange[0], +e.target.value] }))}
                className="w-full bg-slate-800 border border-white/20 rounded px-2 py-1 text-white text-center"
              />
            </div>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Rarity">
        <div className="space-y-1.5">
          {['Mythic', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'].map(r => {
            const style = rarityStyles[r];
            return (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={rarities.includes(r)}
                  onCheckedChange={() => toggleRarity(r)}
                  className="border-white/30 data-[state=checked]:bg-orange-500 w-4 h-4"
                />
                <span className={`text-sm ${style.text}`}>{r}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Deals & Discounts">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={deals}
              onCheckedChange={() => setFilters(prev => ({ ...prev, deals: !prev.deals }))}
              className="border-white/30 data-[state=checked]:bg-orange-500 w-4 h-4"
            />
            <span className="text-white/70 text-sm">All Discounts</span>
          </label>
        </div>
      </FilterSection>
    </div>
  );
};

// Item Detail Modal
const ItemDetailModal = ({ item, isOpen, onClose, onAddToCart, onBuyNow }) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'offers'
  const [offerSort, setOfferSort] = useState('price-low'); // 'price-low', 'price-high', 'newest'
  const [offerTypeFilter, setOfferTypeFilter] = useState('all'); // 'all', 'bid', 'trade', 'buyout'

  if (!item) return null;
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;

  // Mock multiple offers for the same item
  const availableOffers = useMemo(() => {
    if (!item) return [];
    return [
      { id: 'o1', seller: 'TopSeller', rating: 4.9, price: item.price, type: 'buyout', condition: 'New', stock: 5, createdAt: new Date('2025-01-10') },
      { id: 'o2', seller: 'BargainDeals', rating: 4.5, price: item.price * 1.15, type: 'buyout', condition: 'Like New', stock: 2, createdAt: new Date('2025-01-09') },
      { id: 'o3', seller: 'RareCollector', rating: 5.0, price: item.price * 0.9, type: 'bid', condition: 'New', stock: 1, createdAt: new Date('2025-01-12'), currentBid: item.price * 0.7 },
      { id: 'o4', seller: 'TradeKing', rating: 4.7, price: item.price * 1.05, type: 'trade', condition: 'Mint', stock: 1, createdAt: new Date('2025-01-11'), wantedItems: ['Legendary Sword', 'Epic Shield'] },
      { id: 'o5', seller: 'FastShipping', rating: 4.8, price: item.price * 0.95, type: 'buyout', condition: 'New', stock: 10, createdAt: new Date('2025-01-08') },
    ];
  }, [item]);

  const filteredOffers = useMemo(() => {
    let offers = [...availableOffers];
    
    // Filter by type
    if (offerTypeFilter !== 'all') {
      offers = offers.filter(o => o.type === offerTypeFilter);
    }
    
    // Sort
    if (offerSort === 'price-low') {
      offers.sort((a, b) => a.price - b.price);
    } else if (offerSort === 'price-high') {
      offers.sort((a, b) => b.price - a.price);
    } else if (offerSort === 'newest') {
      offers.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    return offers;
  }, [availableOffers, offerSort, offerTypeFilter]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-2xl border-white/10 max-w-5xl text-white p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-[85vh]">
          <div className="md:w-[350px] flex-shrink-0 bg-slate-800 p-6">
            <img src={item.image} alt={item.name} className="w-full aspect-square object-cover rounded-lg" />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 z-10">
              <X className="w-4 h-4" />
            </button>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/10 px-6 pt-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === 'details' 
                    ? 'text-white border-b-2 border-blue-500' 
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('offers')}
                className={`px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === 'offers' 
                    ? 'text-white border-b-2 border-blue-500' 
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Available Offers ({availableOffers.length})
              </button>
            </div>

            {activeTab === 'details' ? (
              <div className="flex-1 p-6 overflow-y-auto">
                <h1 className="text-xl font-bold text-white mb-2 pr-8">{item.name}</h1>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-400 text-sm">Visit the {item.seller.name} Store</span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-orange-400 font-medium">{item.seller.rating}</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(item.seller.rating) ? 'text-orange-400 fill-current' : 'text-slate-600'}`} />
                    ))}
                  </div>
                  <span className="text-blue-400 text-sm">{item.reviews} ratings</span>
                  <span className="text-white/30">|</span>
                  <span className="text-white/50 text-sm">{item.seller.sales}+ bought in past month</span>
                </div>

                <div className="border-t border-b border-white/10 py-4 mb-4">
                  {hasDiscount && (
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-red-600 text-white text-sm border-none">-{Math.round((1 - item.price / item.originalPrice) * 100)}%</Badge>
                      <span className="text-red-400 text-sm">Limited time deal</span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{(item.price || 0).toLocaleString()}</span>
                    <span className="text-white/50">AGP</span>
                    {hasDiscount && (
                      <span className="text-white/40 text-sm line-through ml-2">List: {(item.originalPrice || 0).toLocaleString()} AGP</span>
                    )}
                  </div>
                  {item.prime && (
                    <p className="text-sm mt-2">
                      <span className="text-blue-400 flex items-center gap-1"><Truck className="w-4 h-4" /> Prime</span>
                      <span className="text-green-400">FREE delivery Tomorrow</span>
                    </p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex gap-4 text-sm">
                    <span className="text-white/50 w-24">Rarity</span>
                    <Badge className={`${rarity.bg} ${rarity.text} border-none`}>{item.rarity}</Badge>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-white/50 w-24">Category</span>
                    <span className="text-white">{item.category}</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-white/50 w-24">Game</span>
                    <span className="text-white">{item.game}</span>
                  </div>
                  {item.stats && Object.entries(item.stats).map(([key, value]) => (
                    <div key={key} className="flex gap-4 text-sm">
                      <span className="text-white/50 w-24">{key}</span>
                      <span className="text-white">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <h3 className="text-white font-bold mb-2">About this item</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{item.description}</p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => onAddToCart(item)}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-11 rounded-full"
                  >
                    Add to Cart
                  </Button>
                  <Button 
                    onClick={() => onBuyNow(item)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 rounded-full"
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Offer Filters */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-white/50" />
                    <span className="text-white/60 text-sm font-medium">Filter:</span>
                  </div>
                  
                  {/* Type Filter */}
                  <select
                    value={offerTypeFilter}
                    onChange={(e) => setOfferTypeFilter(e.target.value)}
                    className="bg-slate-700 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5"
                  >
                    <option value="all">All Types</option>
                    <option value="buyout">Buyout Only</option>
                    <option value="bid">Bids Only</option>
                    <option value="trade">Trades Only</option>
                  </select>

                  {/* Sort */}
                  <div className="flex items-center gap-2 ml-auto">
                    <ArrowUpDown className="w-4 h-4 text-white/50" />
                    <span className="text-white/60 text-sm font-medium">Sort:</span>
                  </div>
                  <select
                    value={offerSort}
                    onChange={(e) => setOfferSort(e.target.value)}
                    className="bg-slate-700 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5"
                  >
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>

                {/* Offers List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {filteredOffers.map((offer) => (
                    <div 
                      key={offer.id} 
                      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold">{offer.seller}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-orange-400 fill-current" />
                              <span className="text-white/70 text-xs">{offer.rating}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] px-2 py-0.5 ${
                              offer.type === 'buyout' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                              offer.type === 'bid' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            }`}>
                              {offer.type === 'buyout' ? 'Buy Now' : offer.type === 'bid' ? 'Auction' : 'Trade'}
                            </Badge>
                            <span className="text-white/50 text-xs">{offer.condition}</span>
                            <span className="text-white/40 text-xs">• Stock: {offer.stock}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {offer.type === 'bid' ? (
                            <div>
                              <div className="text-white/50 text-xs">Current Bid</div>
                              <div className="text-xl font-bold text-blue-400">{Math.floor(offer.currentBid).toLocaleString()} AGP</div>
                              <div className="text-white/40 text-xs">Buy Now: {Math.floor(offer.price).toLocaleString()} AGP</div>
                            </div>
                          ) : offer.type === 'trade' ? (
                            <div>
                              <div className="text-white/50 text-xs">Trade Value</div>
                              <div className="text-xl font-bold text-purple-400">{Math.floor(offer.price).toLocaleString()} AGP</div>
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-white">{Math.floor(offer.price).toLocaleString()} AGP</div>
                          )}
                        </div>
                      </div>

                      {offer.type === 'trade' && offer.wantedItems && (
                        <div className="mb-3 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                          <div className="text-white/60 text-xs mb-1">Wants in Trade:</div>
                          <div className="flex flex-wrap gap-1">
                            {offer.wantedItems.map((wanted, idx) => (
                              <Badge key={idx} variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">
                                {wanted}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => offer.type === 'buyout' ? onBuyNow({ ...item, price: offer.price, seller: { name: offer.seller } }) : null}
                          className={`flex-1 h-9 text-sm font-bold rounded-lg ${
                            offer.type === 'buyout' ? 'bg-orange-500 hover:bg-orange-600' :
                            offer.type === 'bid' ? 'bg-blue-500 hover:bg-blue-600' :
                            'bg-purple-500 hover:bg-purple-600'
                          }`}
                        >
                          {offer.type === 'buyout' ? 'Buy Now' : offer.type === 'bid' ? 'Place Bid' : 'Propose Trade'}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-9 px-4 text-sm border-white/20 hover:bg-white/10"
                        >
                          Contact
                        </Button>
                      </div>
                    </div>
                  ))}

                  {filteredOffers.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/50">No offers match your filters</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function MarketplaceContent({ searchTerm: propSearchTerm }) {
  const { user } = useAuth();
  const { addToCart, getCartCount } = useCart();
  const navigate = useNavigate();
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const searchTerm = propSearchTerm !== undefined ? propSearchTerm : internalSearchTerm;
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('list');

  const [filters, setFilters] = useState({
    category: 'all',
    game: 'All Games',
    genre: 'All Genres',
    priceRange: [0, 200000],
    rarities: [],
    rating: null,
    prime: false,
    deals: false,
  });

  const filteredItems = useMemo(() => {
    return MARKETPLACE_ITEMS.filter(item => {
      const searchMatch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = filters.category === 'all' || item.category === filters.category;
      const gameMatch = filters.game === 'All Games' || item.game === filters.game;
      const priceMatch = item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1];
      const rarityMatch = filters.rarities.length === 0 || filters.rarities.includes(item.rarity);
      const ratingMatch = !filters.rating || item.seller.rating >= filters.rating;
      const primeMatch = !filters.prime || item.prime;
      const dealsMatch = !filters.deals || (item.originalPrice && item.originalPrice > item.price);
      return searchMatch && categoryMatch && gameMatch && priceMatch && rarityMatch && ratingMatch && primeMatch && dealsMatch;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'reviews') return (b.reviews || 0) - (a.reviews || 0);
      return (b.views || 0) - (a.views || 0);
    });
  }, [searchTerm, filters, sortBy]);

  const sponsoredItems = MARKETPLACE_ITEMS.filter(i => i.sponsored);
  const popularItems = [...MARKETPLACE_ITEMS].sort((a, b) => b.views - a.views);

  const handleAddToCart = (item) => {
    addToCart({
      id: item.id,
      title: item.name,
      price: item.price || 0,
      image: item.image,
      type: 'marketplace'
    });
    setSelectedItem(null);
  };

  const handleBuyNow = (item) => {
    addToCart({
      id: item.id,
      title: item.name,
      price: item.price || 0,
      image: item.image,
      type: 'marketplace'
    });
    setSelectedItem(null);
    navigate(createPageUrl('Checkout'));
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent p-4 sm:p-6">
      {/* Secondary Navigation (moved from header) */}
      <div className="flex items-center gap-2 px-6 py-3 bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-2xl mb-8 overflow-x-auto scrollbar-hide">
        {[
          { name: 'Companions', icon: Ghost },
          { name: 'Gear & Equipment', icon: Shield },
          { name: 'Abilities & Skills', icon: Zap },
          { name: 'Consumables', icon: Package },
          { name: 'Crafting Materials', icon: Gem },
          { name: 'Mounts & Vehicles', icon: Truck },
        ].map((item) => (
          <button 
            key={item.name}
            onClick={() => {
              const target = item.name === 'Gear & Equipment' ? 'Gear' : item.name === 'Abilities & Skills' ? 'Abilities' : item.name === 'Crafting Materials' ? 'Materials' : item.name === 'Mounts & Vehicles' ? 'Mounts' : item.name;
              setFilters(prev => ({ ...prev, category: prev.category === target ? 'all' : target }));
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filters.category === (item.name === 'Gear & Equipment' ? 'Gear' : item.name === 'Abilities & Skills' ? 'Abilities' : item.name === 'Crafting Materials' ? 'Materials' : item.name === 'Mounts & Vehicles' ? 'Mounts' : item.name) ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.name}
          </button>
        ))}
      </div>

      <div className="px-2 pb-6">
        {/* Developer Limited Edition Section - Full Width */}
        <DeveloperLimitedEdition />

        {/* Results Section - Sidebar + Results */}
        <div className="flex gap-6 mt-8">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <FilterSidebar filters={filters} setFilters={setFilters} />
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <p className="text-white/50 text-sm">
                  {filteredItems.length > 0 ? `1-${Math.min(filteredItems.length, 48)} of ${filteredItems.length} results` : 'No results'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/10' : ''}`}>
                    <List className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/10' : ''}`}>
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
                <select
                  value={filters.genre}
                  onChange={(e) => setFilters(prev => ({ ...prev, genre: e.target.value }))}
                  className="bg-slate-800 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5"
                >
                  <option value="All Genres">All Genres</option>
                  <option value="Action">Action</option>
                  <option value="RPG">RPG</option>
                  <option value="Shooter">Shooter</option>
                  <option value="Strategy">Strategy</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Sports">Sports</option>
                  <option value="Racing">Racing</option>
                  <option value="Simulation">Simulation</option>
                  <option value="Horror">Horror</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-800 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5"
                >
                  <option value="featured">Sort by: Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="reviews">Avg. Customer Review</option>
                </select>
              </div>
            </div>

            {/* Results */}
            <div className="mb-8">
              <h2 className="text-white font-bold mb-4">Results</h2>
              <p className="text-white/50 text-xs mb-4">Check each product page for other buying options. Price and details may vary.</p>
              
              {/* Inner Scroll Container for Results */}
              <div className="h-[700px] overflow-y-auto pr-2 custom-scrollbar rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-1">
                {viewMode === 'list' ? (
                  <div className="space-y-2 p-2">
                    {filteredItems.map(item => (
                      <ListItemCard key={item.id} item={item} onClick={setSelectedItem} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                    {filteredItems.map(item => {
                      const rarity = rarityStyles[item.rarity];
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className="cursor-pointer hover:scale-[1.02] transition-all bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/10 shadow-lg"
                        >
                          <div className="aspect-square bg-slate-800/50 rounded-xl overflow-hidden mb-3">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <h3 className="text-blue-300 text-sm font-medium line-clamp-2 mb-2">{item.name}</h3>
                          <div className="flex items-center mb-2">
                            {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.floor(item.seller.rating) ? 'text-orange-400 fill-current' : 'text-slate-600'}`} />)}
                            <span className="text-white/50 text-xs ml-1">{item.reviews}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white font-bold">{(item.price || 0).toLocaleString()} AGP</span>
                            <Badge className={`${rarity.bg} ${rarity.text} text-[10px] border-none px-1.5`}>{item.rarity}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filteredItems.length === 0 && (
                  <div className="text-center py-16">
                    <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/50">No items found matching your criteria</p>
                  </div>
                )}
              </div>
            </div>

            {/* Customers frequently viewed */}
            <ProductRow title="Customers frequently viewed" items={popularItems} onItemClick={setSelectedItem} />
          </div>
        </div>

      <ItemDetailModal 
        item={selectedItem} 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
      </div>
    </div>
  );
}