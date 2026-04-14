import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, Star, TrendingUp, Clock,
  Sparkles, DollarSign, Eye, Heart, ShoppingCart,
  Gamepad2, Package, Zap, Shield, X, Grid, List,
  Ghost, Footprints, Gem, Check, ArrowUpDown, Filter,
  Crosshair, Trophy, Monitor, Car, Skull, Crown, Flame, SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../CartContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// ── Mock Data ──
const MARKETPLACE_ITEMS = [
  { id: 'c1', name: 'Phoenix Familiar', price: 45000, originalPrice: 52000, rarity: 'Legendary', game: 'Mage Wars Online', genre: 'RPG', itemType: 'Companions', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'PetMaster', rating: 4.9, sales: 1250 }, views: 3421, description: 'A blazing phoenix companion that automatically revives you once per battle.', stats: { Power: 85, Loyalty: 95 }, reviews: 234 },
  { id: 'c2', name: 'Shadow Wolf Pack', price: 28000, rarity: 'Epic', game: 'Elder Scrolls: Reborn', genre: 'RPG', itemType: 'Companions', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'WildTamer', rating: 4.7, sales: 890 }, views: 2156, description: 'Three shadow wolves that hunt alongside you with +25% stealth bonus.', stats: { Power: 70, Loyalty: 80 }, reviews: 156, isNew: true },
  { id: 'c3', name: 'Quantum AI Drone MK-X', price: 52000, rarity: 'Mythic', game: 'Cyberpunk 2088', genre: 'Sci-Fi', itemType: 'Companions', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'TechDealer', rating: 5.0, sales: 2100 }, views: 4521, description: 'Military-grade AI companion with combat assistance and hacking support.', stats: { Power: 90, Intelligence: 100 }, reviews: 312, sponsored: true },
  { id: 'c4', name: 'Elemental Sprite', price: 15000, originalPrice: 18000, rarity: 'Rare', game: 'Mage Wars Online', genre: 'RPG', itemType: 'Companions', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'SpriteTrader', rating: 4.5, sales: 567 }, views: 1234, description: 'A helpful sprite that buffs magic abilities by 15%.', stats: { Power: 45, Support: 75 }, reviews: 89 },
  { id: 'g1', name: 'Void Reaper Scythe', price: 78000, rarity: 'Legendary', game: 'Elder Scrolls: Reborn', genre: 'RPG', itemType: 'Equipment', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'VoidForge', rating: 4.9, sales: 1890 }, views: 5678, description: 'Harvests souls with each killing blow. 15% life steal on hit.', stats: { Attack: 120, CritChance: 25 }, reviews: 445, isNew: true },
  { id: 'g2', name: 'Plasma Cannon MK-X', price: 65000, originalPrice: 72000, rarity: 'Epic', game: 'Galactic Warfare', genre: 'Shooter', itemType: 'Equipment', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=400&fit=crop', seller: { name: 'GunRunner', rating: 4.6, sales: 1200 }, views: 3421, description: 'Military-grade plasma weapon with burst fire capability.', stats: { Attack: 95, FireRate: 80 }, reviews: 267, sponsored: true },
  { id: 'g3', name: 'Cyber Katana', price: 42000, rarity: 'Epic', game: 'Cyberpunk 2088', genre: 'Sci-Fi', itemType: 'Equipment', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'BladeSmith', rating: 4.8, sales: 980 }, views: 2987, description: 'Mono-molecular edge cuts through any armor.', stats: { Attack: 85, Speed: 95 }, reviews: 198 },
  { id: 'g4', name: 'Void Emperor Armor Set', price: 125000, originalPrice: 150000, rarity: 'Mythic', game: 'Elder Scrolls: Reborn', genre: 'RPG', itemType: 'Equipment', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'VoidMaster', rating: 4.9, sales: 3200 }, views: 8921, description: 'Complete 5-piece armor set. Grants immunity to shadow damage.', stats: { Defense: 150, MagicRes: 80 }, reviews: 567, sponsored: true },
  { id: 'a1', name: 'Fireball Mastery', price: 38000, rarity: 'Legendary', game: 'Mage Wars Online', genre: 'RPG', itemType: 'Abilities', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'SpellTrader', rating: 4.8, sales: 1450 }, views: 3980, description: 'Master-level fireball spell that deals devastating AoE damage.', stats: { Power: 110, CoolDown: 8 }, reviews: 289 },
  { id: 'm1', name: 'Neon Fury Motorcycle', price: 89000, rarity: 'Epic', game: 'Cyberpunk 2088', genre: 'Sci-Fi', itemType: 'Mounts', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'VehicleDealer', rating: 4.7, sales: 890 }, views: 4230, description: 'High-speed motorcycle with neon underglow and boost ability.', stats: { Speed: 145, Durability: 80 }, reviews: 198, isNew: true },
  { id: 'cm1', name: 'Void Crystals (x100)', price: 12000, rarity: 'Rare', game: 'Elder Scrolls: Reborn', genre: 'RPG', itemType: 'Materials', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'CrafterSupply', rating: 4.6, sales: 2340 }, views: 1890, description: 'High-quality void crystals used for enchanting legendary gear.', stats: { Quality: 95 }, reviews: 456 },
];

const ITEM_TYPES = [
  { id: 'all', name: 'All Items', icon: Grid },
  { id: 'Equipment', name: 'Equipment', icon: Shield },
  { id: 'Abilities', name: 'Abilities', icon: Zap },
  { id: 'Mounts', name: 'Mounts', icon: Footprints },
  { id: 'Companions', name: 'Companions', icon: Ghost },
  { id: 'Materials', name: 'Materials', icon: Gem },
  { id: 'Environments', name: 'Environments & Skyboxes', icon: Sparkles },
];

const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-low', label: 'Price: Low → High' },
  { id: 'price-high', label: 'Price: High → Low' },
  { id: 'reviews', label: 'Most Reviewed' },
  { id: 'views', label: 'Most Viewed' },
  { id: 'newest', label: 'Newest' },
];

const RARITY_ORDER = ['Mythic', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

const rarityStyles = {
  Common: { text: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
  Uncommon: { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  Rare: { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  Epic: { text: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
  Legendary: { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  Mythic: { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
};

// ── Compact Item Card ──
function ItemCard({ item, onClick }) {
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
  const discountPct = hasDiscount ? Math.round((1 - item.price / item.originalPrice) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={() => onClick(item)}
      className="cursor-pointer group rounded-2xl border border-white/8 hover:border-white/20 transition-all relative overflow-hidden flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden relative">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Top-left badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.isNew && (
            <Badge className="bg-cyan-500 text-black text-[9px] font-bold px-1.5 h-5">NEW</Badge>
          )}
          {hasDiscount && (
            <Badge className="bg-red-500 text-white text-[9px] font-bold px-1.5 h-5">-{discountPct}%</Badge>
          )}
        </div>

        {/* Rarity bottom-left */}
        <div className="absolute bottom-2 left-2">
          <Badge className={`${rarity.bg} ${rarity.text} border-none text-[9px] backdrop-blur-md`}>{item.rarity}</Badge>
        </div>

        {/* Seller rating bottom-right */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
          <Star className="w-3 h-3 text-amber-400 fill-current" />
          <span className="text-white text-[10px] font-bold">{item.seller.rating}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-1.5">
        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 group-hover:text-cyan-300 transition-colors">{item.name}</h3>
        <p className="text-white/35 text-[11px] truncate">{item.game}</p>

        <div className="mt-auto pt-2 border-t border-white/6 flex items-end justify-between">
          <div>
            {hasDiscount && (
              <span className="text-white/30 text-[10px] line-through block">{item.originalPrice.toLocaleString()}</span>
            )}
            <span className="text-white font-bold text-base">{item.price.toLocaleString()} <span className="text-cyan-400 text-[10px] font-normal">AGP</span></span>
          </div>
          <div className="flex items-center gap-1 text-white/30 text-[10px]">
            <Eye className="w-3 h-3" />
            {item.views > 1000 ? `${(item.views / 1000).toFixed(1)}k` : item.views}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── List Row Card ──
function ListRowCard({ item, onClick }) {
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;

  return (
    <div
      onClick={() => onClick(item)}
      className="flex items-center gap-4 p-3 rounded-xl border border-white/6 hover:border-white/15 hover:bg-white/[0.03] transition-all cursor-pointer group"
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold text-sm truncate group-hover:text-cyan-300 transition-colors">{item.name}</h3>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge className={`${rarity.bg} ${rarity.text} border-none text-[9px] h-4 px-1`}>{item.rarity}</Badge>
          <span className="text-white/30 text-[10px]">{item.game}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-white font-bold text-sm block">{item.price.toLocaleString()} <span className="text-cyan-400 text-[10px]">AGP</span></span>
        {hasDiscount && <span className="text-white/25 text-[10px] line-through">{item.originalPrice.toLocaleString()}</span>}
      </div>
      <div className="flex items-center gap-1 text-white/25 text-[10px] flex-shrink-0 w-14 justify-end">
        <Star className="w-3 h-3 text-amber-400 fill-current" />
        <span>{item.seller.rating}</span>
      </div>
    </div>
  );
}

// ── Item Detail Modal ──
function ItemDetailModal({ item, isOpen, onClose, onAddToCart, onBuyNow }) {
  const rarity = item ? (rarityStyles[item.rarity] || rarityStyles.Common) : rarityStyles.Common;
  const hasDiscount = item ? (item.originalPrice && item.originalPrice > item.price) : false;

  const relatedItems = useMemo(() => {
    if (!item) return [];
    return MARKETPLACE_ITEMS.filter(i => i.id !== item.id && (i.itemType === item.itemType || i.game === item.game)).slice(0, 4);
  }, [item]);

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="border-white/10 max-w-3xl text-white p-0 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(20,25,35,0.97) 0%, rgba(15,20,30,0.98) 100%)',
          backdropFilter: 'blur(40px)',
        }}
      >
        <div className="flex flex-col md:flex-row max-h-[85vh]">
          {/* Left: Image */}
          <div className="md:w-[280px] flex-shrink-0 p-5">
            <div className="aspect-square rounded-xl overflow-hidden border border-white/10 relative">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2">
                <Badge className={`${rarity.bg} ${rarity.text} border-none`}>{item.rarity}</Badge>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1 p-5 overflow-y-auto">
            <h1 className="text-xl font-bold text-white mb-1">{item.name}</h1>
            <div className="flex items-center gap-2 text-xs mb-4">
              <span className="text-white/50">{item.game}</span>
              <span className="text-white/20">•</span>
              <span className="text-white/50">{item.itemType}</span>
              <span className="text-white/20">•</span>
              <span className="text-white/40 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-current" />{item.seller.rating} ({item.reviews} reviews)</span>
            </div>

            <p className="text-white/60 text-sm leading-relaxed mb-4">{item.description}</p>

            {/* Stats */}
            {item.stats && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.entries(item.stats).map(([key, val]) => (
                  <div key={key} className="flex justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-white/40 text-xs">{key}</span>
                    <span className="text-white font-bold text-xs">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Price & Actions */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/8 mb-4">
              <div>
                {hasDiscount && <span className="text-white/30 text-xs line-through block">{item.originalPrice.toLocaleString()} AGP</span>}
                <span className="text-2xl font-bold text-white">{item.price.toLocaleString()} <span className="text-cyan-400 text-sm">AGP</span></span>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => onAddToCart(item)} variant="outline" className="border-white/15 text-white hover:bg-white/10">
                  <ShoppingCart className="w-4 h-4 mr-1" /> Add to Cart
                </Button>
                <Button onClick={() => onBuyNow(item)} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
                  Buy Now
                </Button>
              </div>
            </div>

            {/* Related */}
            {relatedItems.length > 0 && (
              <div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">You might also like</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {relatedItems.map(r => (
                    <div key={r.id} className="w-20 flex-shrink-0 cursor-pointer" onClick={() => { onClose(); setTimeout(() => {}, 100); }}>
                      <div className="aspect-square rounded-lg overflow-hidden border border-white/8 mb-1">
                        <img src={r.image} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[10px] text-white/60 truncate">{r.name}</p>
                      <p className="text-[10px] text-cyan-400">{r.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Quick Suggestion Chips ──
const QUICK_SEARCHES = ['Legendary Weapons', 'Epic Companions', 'Under 30k AGP', 'Cyberpunk 2088', 'Elder Scrolls', 'Mythic Armor'];

// ── Main Component ──
export default function MarketplaceContent({ searchTerm: propSearchTerm, onSearchChange }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [internalSearch, setInternalSearch] = useState('');
  const searchTerm = propSearchTerm !== undefined ? propSearchTerm : internalSearch;

  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [activeType, setActiveType] = useState('all');
  const [activeRarities, setActiveRarities] = useState([]);
  const [activeGame, setActiveGame] = useState('all');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [priceMax, setPriceMax] = useState(200000);
  const sortRef = useRef(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (val) => {
    setInternalSearch(val);
    if (onSearchChange) onSearchChange(val);
  };

  const availableGames = useMemo(() => {
    return ['all', ...new Set(MARKETPLACE_ITEMS.map(i => i.game))];
  }, []);

  const toggleRarity = (r) => {
    setActiveRarities(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const filteredItems = useMemo(() => {
    let items = MARKETPLACE_ITEMS.filter(item => {
      // Quick search parsing
      const q = searchTerm.toLowerCase();
      if (q) {
        const nameMatch = item.name.toLowerCase().includes(q);
        const gameMatch = item.game.toLowerCase().includes(q);
        const rarityMatch = item.rarity.toLowerCase().includes(q);
        const typeMatch = item.itemType.toLowerCase().includes(q);
        // Support "under Xk" pattern
        const underMatch = q.match(/under\s*(\d+)k/);
        if (underMatch) {
          const maxP = parseInt(underMatch[1]) * 1000;
          if (item.price > maxP) return false;
        } else if (!nameMatch && !gameMatch && !rarityMatch && !typeMatch) {
          return false;
        }
      }

      if (activeType !== 'all' && item.itemType !== activeType) return false;
      if (activeRarities.length > 0 && !activeRarities.includes(item.rarity)) return false;
      if (activeGame !== 'all' && item.game !== activeGame) return false;
      if (item.price > priceMax) return false;
      return true;
    });

    items.sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'reviews') return (b.reviews || 0) - (a.reviews || 0);
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      // featured: sponsored first, then by views
      return (b.sponsored ? 10000 : 0) + (b.views || 0) - ((a.sponsored ? 10000 : 0) + (a.views || 0));
    });

    return items;
  }, [searchTerm, activeType, activeRarities, activeGame, priceMax, sortBy]);

  const activeFilterCount = (activeType !== 'all' ? 1 : 0) + activeRarities.length + (activeGame !== 'all' ? 1 : 0) + (priceMax < 200000 ? 1 : 0);

  const clearAllFilters = () => {
    setActiveType('all');
    setActiveRarities([]);
    setActiveGame('all');
    setPriceMax(200000);
    handleSearch('');
  };

  const handleAddToCart = (item) => {
    addToCart({
      id: item.id, title: item.name, price: (item.price || 0) / 1000,
      image: item.image, type: 'marketplace_item', rarity: item.rarity, game: item.game,
    });
    setSelectedItem(null);
  };

  const handleBuyNow = (item) => {
    handleAddToCart(item);
    navigate(createPageUrl('Checkout'));
  };

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
      {/* ─── Hero Search Bar ─── */}
      <div className="mb-6 pt-2">
        <div className="flex items-center gap-3 mb-4">
          <ShoppingCart className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-bold text-white">Marketplace</h1>
          <span className="text-white/30 text-sm">•</span>
          <span className="text-white/40 text-sm">{filteredItems.length} items</span>
        </div>

        {/* Big search input */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search items, games, rarities... (e.g. 'Legendary Weapons', 'Under 30k AGP')"
            className="w-full bg-white/5 hover:bg-white/8 focus:bg-white/8 border border-white/10 focus:border-cyan-500/40 rounded-2xl pl-12 pr-12 py-3.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
          />
          {searchTerm && (
            <button onClick={() => handleSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-white/40 hover:text-white" />
            </button>
          )}
        </div>


      </div>

      {/* ─── Filter Bar ─── */}
      <div className="flex flex-col gap-3 mb-5">
        {/* Row 1: Type filters + Sort + View toggle */}
        <div className="flex items-center justify-between gap-4">
          {/* Item type pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            {ITEM_TYPES.map(type => {
              const active = activeType === type.id;
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveType(type.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
                    active
                      ? 'bg-white/12 border-white/20 text-white'
                      : 'bg-transparent border-transparent text-white/40 hover:bg-white/5 hover:text-white/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {type.name}
                </button>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Sort dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] border border-white/10 bg-white/5 text-white/60 hover:bg-white/8 transition-all"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {SORT_OPTIONS.find(s => s.id === sortBy)?.label || 'Sort'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortBy(opt.id); setShowSortDropdown(false); }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                        sortBy === opt.id ? 'bg-cyan-500/10 text-cyan-300' : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View mode */}
            <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/8">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/30'}`}>
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/30'}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Rarity + Game + Price filters */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Rarity chips */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {RARITY_ORDER.map(r => {
              const style = rarityStyles[r];
              const active = activeRarities.includes(r);
              return (
                <button
                  key={r}
                  onClick={() => toggleRarity(r)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all flex-shrink-0 ${
                    active
                      ? `${style.bg} ${style.text} ${style.border}`
                      : 'bg-transparent border-transparent text-white/30 hover:text-white/50'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <>
              <div className="w-px h-5 bg-white/10 flex-shrink-0" />
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all flex-shrink-0"
              >
                <X className="w-3 h-3" />
                Clear ({activeFilterCount})
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Results ─── */}
      <div className="flex-1">
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <Package className="w-14 h-14 text-white/10 mb-4" />
              <h3 className="text-white/40 font-semibold mb-1">No items found</h3>
              <p className="text-white/25 text-sm mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={clearAllFilters} className="border-white/15 text-white/50 hover:text-white">
                Clear all filters
              </Button>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div
              key="grid"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
            >
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} onClick={setSelectedItem} />
              ))}
            </motion.div>
          ) : (
            <motion.div key="list" className="flex flex-col gap-1.5">
              {filteredItems.map(item => (
                <ListRowCard key={item.id} item={item} onClick={setSelectedItem} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
    </div>
  );
}