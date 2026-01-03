import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Search, ChevronLeft, ChevronRight, ChevronDown, Star, TrendingUp, Clock,
  Sparkles, DollarSign, Eye, Heart, ShoppingCart,
  Gamepad2, Package, Zap, Shield, X, Grid, List,
  Ghost, Footprints, Gem, Check, Truck, Award, Users, Plus,
  ArrowUpDown, Filter, PlayCircle, Video, Code
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

// Enhanced Mock Data with genre and item type
const MARKETPLACE_ITEMS = [
  { id: 'c1', name: 'Phoenix Familiar - Legendary Fire Companion', price: 45000, originalPrice: 52000, rarity: 'Legendary', game: 'Mage Wars Online', genre: 'RPG', category: 'Companions', itemType: 'Companions', subcategory: 'Mythical', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'PetMaster', rating: 4.9, sales: 1250 }, views: 3421, description: 'A blazing phoenix companion that automatically revives you once per battle. Includes flame aura effect.', stats: { Power: 85, Loyalty: 95 }, reviews: 234, prime: true, sponsored: true, playstyle: 'PvE', developer: { name: 'Arcane Studios', logo: 'A' }, isNew: false, previewUrl: 'https://cdn.coverr.co/videos/coverr-fire-burning-in-slow-motion-5358/1080p.mp4' },
  { id: 'c2', name: 'Shadow Wolf Pack - Stealth Bonus Set', price: 28000, rarity: 'Epic', game: 'Elder Scrolls: Reborn', genre: 'RPG', category: 'Companions', itemType: 'Companions', subcategory: 'Beast', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'WildTamer', rating: 4.7, sales: 890 }, views: 2156, description: 'Three shadow wolves that hunt alongside you with +25% stealth bonus when active.', stats: { Power: 70, Loyalty: 80 }, reviews: 156, prime: true, playstyle: 'Stealth', developer: { name: 'Bethesda', logo: 'B' }, isNew: true, previewUrl: null },
  { id: 'c3', name: 'Quantum AI Drone MK-X', price: 52000, rarity: 'Mythic', game: 'Cyberpunk 2088', genre: 'Sci-Fi', category: 'Companions', itemType: 'Companions', subcategory: 'Mechanical', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'TechDealer', rating: 5.0, sales: 2100 }, views: 4521, description: 'Military-grade AI companion with combat assistance, hacking support, and tactical analysis.', stats: { Power: 90, Intelligence: 100 }, reviews: 312, prime: true, sponsored: true, playstyle: 'PvP', developer: { name: 'CD Projekt Red', logo: 'CDPR' }, isNew: false, previewUrl: null },
  { id: 'c4', name: 'Elemental Sprite - Magic Buffer', price: 15000, originalPrice: 18000, rarity: 'Rare', game: 'Mage Wars Online', genre: 'RPG', category: 'Companions', itemType: 'Companions', subcategory: 'Elemental', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'SpriteTrader', rating: 4.5, sales: 567 }, views: 1234, description: 'A helpful sprite that buffs magic abilities by 15% and provides passive mana regeneration.', stats: { Power: 45, Support: 75 }, reviews: 89, prime: false, playstyle: 'Support', developer: { name: 'Arcane Studios', logo: 'A' }, isNew: false, previewUrl: null },
  { id: 'g1', name: 'Void Reaper Scythe - Soul Harvesting', price: 78000, rarity: 'Legendary', game: 'Elder Scrolls: Reborn', genre: 'RPG', category: 'Gear', itemType: 'Equipment', subcategory: 'Weapons', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'VoidForge', rating: 4.9, sales: 1890 }, views: 5678, description: 'Harvests souls with each killing blow. 15% life steal on hit. Glows with void energy.', stats: { Attack: 120, CritChance: 25 }, reviews: 445, prime: true, playstyle: 'PvP', developer: { name: 'Bethesda', logo: 'B' }, isNew: true, previewUrl: null },
  { id: 'g2', name: 'Plasma Cannon MK-X - Heavy Weapon', price: 65000, originalPrice: 72000, rarity: 'Epic', game: 'Galactic Warfare', genre: 'Shooter', category: 'Gear', itemType: 'Equipment', subcategory: 'Weapons', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=400&fit=crop', seller: { name: 'GunRunner', rating: 4.6, sales: 1200 }, views: 3421, description: 'Military-grade plasma weapon with burst fire capability. Includes thermal scope attachment.', stats: { Attack: 95, FireRate: 80 }, reviews: 267, prime: true, sponsored: true, playstyle: 'PvE', developer: { name: 'Bungie', logo: 'BG' }, isNew: false, previewUrl: null },
  { id: 'g3', name: 'Cyber Katana - Mono-Molecular Edge', price: 42000, rarity: 'Epic', game: 'Cyberpunk 2088', genre: 'Sci-Fi', category: 'Gear', itemType: 'Equipment', subcategory: 'Weapons', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'BladeSmith', rating: 4.8, sales: 980 }, views: 2987, description: 'Mono-molecular edge cuts through any armor. Electric discharge on critical hits.', stats: { Attack: 85, Speed: 95 }, reviews: 198, prime: true, playstyle: 'PvP', developer: { name: 'CD Projekt Red', logo: 'CDPR' }, isNew: false, previewUrl: null },
  { id: 'g4', name: 'Void Emperor Complete Armor Set', price: 125000, originalPrice: 150000, rarity: 'Mythic', game: 'Elder Scrolls: Reborn', genre: 'RPG', category: 'Gear', itemType: 'Equipment', subcategory: 'Armor', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'VoidMaster', rating: 4.9, sales: 3200 }, views: 8921, description: 'Complete 5-piece armor set forged in the void dimension. Grants immunity to shadow damage.', stats: { Defense: 150, MagicRes: 80 }, reviews: 567, prime: true, sponsored: true, playstyle: 'Tank', developer: { name: 'Bethesda', logo: 'B' }, isNew: false, previewUrl: null },
  { id: 'a1', name: 'Fireball Mastery - Ancient Spell', price: 38000, rarity: 'Legendary', game: 'Mage Wars Online', genre: 'RPG', category: 'Abilities', itemType: 'Abilities & Skills', subcategory: 'Magic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'SpellTrader', rating: 4.8, sales: 1450 }, views: 3980, description: 'Master-level fireball spell that deals devastating AoE damage. Ignites enemies for 5 seconds.', stats: { Power: 110, CoolDown: 8 }, reviews: 289, prime: true, playstyle: 'PvE', developer: { name: 'Arcane Studios', logo: 'A' }, isNew: false, previewUrl: null },
  { id: 'm1', name: 'Cyber Motorcycle - Neon Fury', price: 89000, rarity: 'Epic', game: 'Cyberpunk 2088', genre: 'Sci-Fi', category: 'Mounts', itemType: 'Mounts & Vehicles', subcategory: 'Vehicles', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'VehicleDealer', rating: 4.7, sales: 890 }, views: 4230, description: 'High-speed motorcycle with neon underglow. Boost ability with 200% speed increase.', stats: { Speed: 145, Durability: 80 }, reviews: 198, prime: true, playstyle: 'PvP', developer: { name: 'CD Projekt Red', logo: 'CDPR' }, isNew: true, previewUrl: null },
  { id: 'cm1', name: 'Void Crystals Bundle (x100)', price: 12000, rarity: 'Rare', game: 'Elder Scrolls: Reborn', genre: 'RPG', category: 'Materials', itemType: 'Crafting Materials', subcategory: 'Enchanting', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'CrafterSupply', rating: 4.6, sales: 2340 }, views: 1890, description: 'High-quality void crystals used for enchanting legendary gear. Stack of 100.', stats: { Quality: 95 }, reviews: 456, prime: false, playstyle: 'Crafting', developer: { name: 'Bethesda', logo: 'B' }, isNew: false, previewUrl: null },
];

const GENRES = ['All Genres', 'Action', 'RPG', 'Shooter', 'Sci-Fi', 'Strategy', 'Adventure', 'Sports', 'Racing', 'Simulation', 'Horror'];

const ITEM_TYPES = [
  { id: 'all', name: 'All Items', icon: Grid },
  { id: 'Equipment', name: 'Equipment', icon: Shield },
  { id: 'Abilities & Skills', name: 'Abilities & Skills', icon: Zap },
  { id: 'Mounts & Vehicles', name: 'Mounts & Vehicles', icon: Footprints },
  { id: 'Companions', name: 'Companions', icon: Ghost },
  { id: 'Crafting Materials', name: 'Crafting Materials', icon: Gem },
];

const rarityStyles = {
  Common: { text: 'text-slate-400', bg: 'bg-slate-500/20' },
  Uncommon: { text: 'text-green-400', bg: 'bg-green-500/20' },
  Rare: { text: 'text-blue-400', bg: 'bg-blue-500/20' },
  Epic: { text: 'text-purple-400', bg: 'bg-purple-500/20' },
  Legendary: { text: 'text-orange-400', bg: 'bg-orange-500/20' },
  Mythic: { text: 'text-red-400', bg: 'bg-red-500/20' }
};

// List Item Card with Branding and Badges
const ListItemCard = ({ item, onClick }) => {
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
  const discountPercent = hasDiscount ? Math.round((1 - item.price / item.originalPrice) * 100) : 0;

  return (
    <div 
      onClick={() => onClick(item)} 
      className="flex gap-8 p-6 cursor-pointer border-b border-white/10 items-center group/item hover:bg-white/[0.02] transition-colors relative overflow-hidden"
    >
      {/* Shiny Card */}
      <div className="w-[160px] flex-shrink-0 relative">
        <ShinyCard>
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {item.isNew && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-cyan-500 text-black font-bold text-[10px] px-2 shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse">NEW</Badge>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3">
             <Badge className={`${rarity.bg} ${rarity.text} border-none text-[10px] w-full justify-center shadow-lg backdrop-blur-md`}>{item.rarity}</Badge>
          </div>
        </ShinyCard>
      </div>

      <div className="flex-1 min-w-0 py-2">
        <div className="flex items-center gap-2 mb-1">
          {item.developer && (
            <Badge variant="outline" className="border-white/10 text-white/40 text-[10px] gap-1 px-1.5 py-0 h-5">
              <Code className="w-3 h-3" />
              {item.developer.name}
            </Badge>
          )}
          {item.playstyle && (
            <Badge variant="outline" className="border-white/10 text-white/40 text-[10px] px-1.5 py-0 h-5">
              {item.playstyle}
            </Badge>
          )}
        </div>

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

// Filter Sidebar
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

const FilterSidebar = ({ filters, setFilters, availableGames }) => {
  const { itemType, game, priceRange, rarities } = filters;

  const toggleRarity = (r) => {
    setFilters(prev => ({
      ...prev,
      rarities: prev.rarities.includes(r) ? prev.rarities.filter(x => x !== r) : [...prev.rarities, r]
    }));
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
      <FilterSection title="Item Type">
        <div className="space-y-1">
          {ITEM_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setFilters(prev => ({ ...prev, itemType: type.id }))}
              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                itemType === type.id ? 'text-orange-400 font-medium' : 'text-white/70 hover:text-white'
              }`}
            >
              {itemType === type.id && <ChevronRight className="w-3 h-3" />}
              {type.name}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Game">
        <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setFilters(prev => ({ ...prev, game: 'All Games' }))}
            className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
              game === 'All Games' ? 'text-orange-400 font-medium' : 'text-white/70 hover:text-white'
            }`}
          >
            {game === 'All Games' && <ChevronRight className="w-3 h-3" />}
            All Games
          </button>
          {availableGames.map(gameName => (
            <button
              key={gameName}
              onClick={() => setFilters(prev => ({ ...prev, game: gameName }))}
              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                game === gameName ? 'text-orange-400 font-medium' : 'text-white/70 hover:text-white'
              }`}
            >
              {game === gameName && <ChevronRight className="w-3 h-3" />}
              {gameName}
            </button>
          ))}
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
    </div>
  );
};

// Enhanced Item Detail Modal with Preview and Recommendations
const ItemDetailModal = ({ item, isOpen, onClose, onAddToCart, onBuyNow }) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'preview', 'offers'
  const [offerSort, setOfferSort] = useState('price-low');
  const [offerTypeFilter, setOfferTypeFilter] = useState('all');

  const rarity = item ? (rarityStyles[item.rarity] || rarityStyles.Common) : rarityStyles.Common;
  const hasDiscount = item ? (item.originalPrice && item.originalPrice > item.price) : false;

  const availableOffers = useMemo(() => {
    if (!item) return [];
    return [
      { id: 'o1', seller: 'TopSeller', rating: 4.9, price: item.price, type: 'buyout', condition: 'New', stock: 5, createdAt: new Date('2025-01-10') },
      { id: 'o2', seller: 'BargainDeals', rating: 4.5, price: item.price * 1.15, type: 'buyout', condition: 'Like New', stock: 2, createdAt: new Date('2025-01-09') },
      { id: 'o3', seller: 'RareCollector', rating: 5.0, price: item.price * 0.9, type: 'bid', condition: 'New', stock: 1, createdAt: new Date('2025-01-12'), currentBid: item.price * 0.7 },
    ];
  }, [item]);

  const filteredOffers = useMemo(() => {
    let offers = [...availableOffers];
    if (offerTypeFilter !== 'all') offers = offers.filter(o => o.type === offerTypeFilter);
    if (offerSort === 'price-low') offers.sort((a, b) => a.price - b.price);
    else if (offerSort === 'price-high') offers.sort((a, b) => b.price - a.price);
    return offers;
  }, [availableOffers, offerSort, offerTypeFilter]);

  // Mock Recommendations
  const relatedItems = useMemo(() => {
    if (!item) return [];
    return MARKETPLACE_ITEMS.filter(i => i.id !== item.id && (i.category === item.category || i.game === item.game)).slice(0, 3);
  }, [item]);

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-white/10 max-w-5xl text-white p-0 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}>
        <div className="flex flex-col md:flex-row h-[85vh]">
          {/* Left Media Column */}
          <div className="md:w-[350px] flex-shrink-0 bg-transparent p-6 flex flex-col gap-4">
            <div className="relative aspect-square rounded-lg overflow-hidden border border-white/10 shadow-xl group">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              {item.isNew && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-cyan-500 text-black font-bold">NEW</Badge>
                </div>
              )}
              {/* Play Overlay if preview available */}
              {item.previewUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <PlayCircle className="w-12 h-12 text-white/80" />
                </div>
              )}
            </div>

            {/* Developer Info */}
            {item.developer && (
              <div className="p-3">
                <p className="text-white/40 text-xs mb-1">Created By</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-300">
                    {item.developer.logo}
                  </div>
                  <span className="font-bold text-sm">{item.developer.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Content Column */}
          <div className="flex-1 flex flex-col overflow-hidden relative">

            {/* Header with Close */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex gap-6 border-b border-white/10 pb-3">
                {['details', 'preview', 'offers'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-sm font-bold transition-all uppercase tracking-wide ${
                      activeTab === tab 
                        ? 'text-white border-b-2 border-cyan-500' 
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {tab === 'preview' ? 'Visual Preview' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-black text-white mb-2">{item.name}</h1>
                    <div className="flex items-center gap-3 text-sm">
                      <Badge className={`${rarity.bg} ${rarity.text} border-none`}>{item.rarity}</Badge>
                      <span className="text-white/40">•</span>
                      <span className="text-white/60">{item.game}</span>
                      <span className="text-white/40">•</span>
                      <span className="text-cyan-400">{item.category}</span>
                    </div>
                  </div>

                  {/* Pricing Block */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{(item.price || 0).toLocaleString()}</span>
                        <span className="text-cyan-400 font-bold">AGP</span>
                      </div>
                      {hasDiscount && (
                        <p className="text-white/40 text-xs line-through mt-1">
                          List: {(item.originalPrice || 0).toLocaleString()} AGP
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => onAddToCart(item)} className="bg-white text-black hover:bg-gray-200 font-bold rounded-lg px-6">
                        Add to Cart
                      </Button>
                      <Button onClick={() => onBuyNow(item)} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg px-6">
                        Buy Now
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    {item.stats && Object.entries(item.stats).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-3">
                        <span className="text-white/40 text-sm">{key}</span>
                        <span className="text-white font-bold">{value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-white/70 leading-relaxed text-sm">{item.description}</p>

                  {/* Recommendations */}
                  <div className="pt-6 border-t border-white/10">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      Players also bought
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {relatedItems.map(related => (
                        <div key={related.id} className="w-32 flex-shrink-0 cursor-pointer group" onClick={() => onAddToCart(related)}>
                          <div className="aspect-square rounded-lg bg-black/40 mb-2 overflow-hidden border border-white/10 group-hover:border-white/30">
                            <img src={related.image} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-xs text-white/80 truncate">{related.name}</p>
                          <p className="text-xs text-cyan-400">{related.price.toLocaleString()} AGP</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  {item.previewUrl ? (
                    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative">
                       {/* Placeholder for video player - in real app would use a video tag */}
                       <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="w-16 h-16 text-white/20" />
                       </div>
                       <p className="absolute bottom-4 left-0 right-0 text-white/40 text-sm">Preview Loading...</p>
                    </div>
                  ) : (
                    <div className="text-white/30">
                      <Ghost className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No visual preview available for this item.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'offers' && (
                <div className="space-y-3">
                  {filteredOffers.map((offer) => (
                    <div key={offer.id} className="p-4 flex justify-between items-center border-b border-white/10">
                       <div>
                          <div className="font-bold text-white">{offer.seller}</div>
                          <div className="text-xs text-white/40">{offer.condition} • {offer.stock} in stock</div>
                       </div>
                       <div className="text-right">
                          <div className="text-xl font-bold text-white">{offer.price.toLocaleString()} AGP</div>
                          <Button size="sm" className="mt-1 h-7 bg-white/10 hover:bg-white/20 border border-white/10">Select</Button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function MarketplaceContent({ searchTerm: propSearchTerm, onSearchChange }) {
  const { user } = useAuth();
  const { addToCart, getCartCount } = useCart();
  const navigate = useNavigate();
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const searchTerm = propSearchTerm !== undefined ? propSearchTerm : internalSearchTerm;
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('list');

  const [filters, setFilters] = useState({
    genre: 'All Genres',
    game: 'All Games',
    itemType: 'all',
    priceRange: [0, 200000],
    rarities: [],
  });

  // Get available games based on selected genre
  const availableGames = useMemo(() => {
    if (filters.genre === 'All Genres') {
      return [...new Set(MARKETPLACE_ITEMS.map(item => item.game))].sort();
    }
    return [...new Set(MARKETPLACE_ITEMS.filter(item => item.genre === filters.genre).map(item => item.game))].sort();
  }, [filters.genre]);

  // Reset game filter when genre changes if selected game is not in the new genre
  React.useEffect(() => {
    if (filters.game !== 'All Games' && !availableGames.includes(filters.game)) {
      setFilters(prev => ({ ...prev, game: 'All Games' }));
    }
  }, [availableGames, filters.game]);

  const filteredItems = useMemo(() => {
    return MARKETPLACE_ITEMS.filter(item => {
      const searchMatch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const genreMatch = filters.genre === 'All Genres' || item.genre === filters.genre;
      const gameMatch = filters.game === 'All Games' || item.game === filters.game;
      const itemTypeMatch = filters.itemType === 'all' || item.itemType === filters.itemType;
      const priceMatch = item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1];
      const rarityMatch = filters.rarities.length === 0 || filters.rarities.includes(item.rarity);
      return searchMatch && genreMatch && gameMatch && itemTypeMatch && priceMatch && rarityMatch;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'reviews') return (b.reviews || 0) - (a.reviews || 0);
      return (b.views || 0) - (a.views || 0);
    });
  }, [searchTerm, filters, sortBy]);

  const popularItems = [...MARKETPLACE_ITEMS].sort((a, b) => b.views - a.views);

  const handleAddToCart = (item) => {
    addToCart({
      id: item.id,
      title: item.name,
      price: (item.price || 0) / 1000, // Convert AGP to USD
      image: item.image,
      type: 'marketplace_item',
      rarity: item.rarity,
      game: item.game
    });
    setSelectedItem(null);
  };

  const handleBuyNow = (item) => {
    addToCart({
      id: item.id,
      title: item.name,
      price: (item.price || 0) / 1000, // Convert AGP to USD
      image: item.image,
      type: 'marketplace_item',
      rarity: item.rarity,
      game: item.game
    });
    setSelectedItem(null);
    navigate(createPageUrl('Checkout'));
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent p-4 sm:p-6">
      {/* Translucent Header */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-white/60">Marketplace</h2>
        <div className="h-6 w-px bg-white/10" />
        <p className="text-white/40 text-sm">Trade items, abilities, and more</p>
      </div>

      <div className="px-2 pb-6">
        {/* Main Layout */}
        <div className="flex flex-col gap-6">
          
          {/* Developer Limited Edition Section - Full Width */}
          <DeveloperLimitedEdition />

          {/* Bottom Section: Sidebar + Results */}
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="hidden lg:block">
              <FilterSidebar filters={filters} setFilters={setFilters} availableGames={availableGames} />
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
                <div className="relative group/search">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 group-focus-within/search:text-white/80 transition-colors" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => {
                      setInternalSearchTerm(e.target.value);
                      if (onSearchChange) onSearchChange(e.target.value);
                    }}
                    placeholder="Search..." 
                    className="bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-white/30 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 w-32 focus:w-48 transition-all outline-none"
                  />
                </div>
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
                  {GENRES.map(genre => <option key={genre} value={genre}>{genre}</option>)}
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
              
              {/* Inner Scroll Container for Results */}
              <div 
                className="h-[700px] overflow-y-auto pr-2 custom-scrollbar rounded-3xl p-1"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                {viewMode === 'list' ? (
                  <div className="space-y-2 p-2">
                    {filteredItems.map(item => (
                      <ListItemCard key={item.id} item={item} onClick={setSelectedItem} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                    {filteredItems.map(item => {
                      const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className="cursor-pointer group hover:scale-[1.02] transition-all bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/10 shadow-lg relative overflow-hidden"
                        >
                          <div className="aspect-square bg-slate-800/50 rounded-xl overflow-hidden mb-3 relative">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            {item.isNew && (
                              <Badge className="absolute top-2 left-2 bg-cyan-500 text-black font-bold text-[10px] px-1.5 shadow-lg">NEW</Badge>
                            )}
                          </div>
                          <h3 className="text-blue-300 text-sm font-medium line-clamp-2 mb-2 group-hover:text-orange-400 transition-colors">{item.name}</h3>
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
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-lg">Customers frequently viewed</h2>
                <button className="text-blue-400 text-sm hover:text-orange-400 flex items-center gap-1">
                  See more <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-2 scrollbar-hide">
                {popularItems.slice(0, 6).map((item) => {
                  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
                  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedItem(item)} 
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
            </div>
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