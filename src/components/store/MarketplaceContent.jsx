import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Search, ChevronRight, ChevronDown, Star, TrendingUp, Clock,
  Sparkles, DollarSign, Eye, Heart, ShoppingCart,
  Gamepad2, Package, Zap, Shield, X, Grid, List,
  Ghost, Footprints, Gem, Check, Truck, Award, Users, Plus,
  ArrowUpDown, Filter, Sword, Crown, Flame, Crosshair
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

// --- DATA ---

const ADAM_XE_ORIGINALS = [
  { id: 'ae1', name: 'Adam - Genesis Core', type: 'AI Companion', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', description: 'The original AI entity. Unlocks developer-tier abilities.', isNew: false, price: 500000 },
  { id: 'ae2', name: 'Eve - Synthesis', type: 'AI Companion', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', description: 'The evolved counterpart. Adaptive intelligence core.', isNew: true, price: 500000 },
  { id: 'ae3', name: 'Eden Protocol', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop', description: 'Exclusive dev-tier reality manipulation ability.', isNew: false, price: 150000 },
  { id: 'ae4', name: 'Founders Badge', type: 'Cosmetic', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', description: 'Mark of the original developers. Eternal recognition.', isNew: false, price: 75000 },
  { id: 'ae5', name: 'Void Key', type: 'Item', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop', description: 'Access to the hidden void realm.', isNew: true, price: 25000 },
];

const MARKETPLACE_ITEMS = [
  { id: 'c1', name: 'Phoenix Familiar', price: 45000, originalPrice: 52000, rarity: 'Legendary', game: 'Mage Wars Online', category: 'Companions', playstyle: 'PvE', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'PetMaster', rating: 4.9, sales: 1250 }, views: 3421, description: 'Auto-revive fire companion.', stats: { Power: 85, Loyalty: 95 }, reviews: 234, prime: true, sponsored: true, isNew: false },
  { id: 'c2', name: 'Shadow Wolf Pack', price: 28000, rarity: 'Epic', game: 'Elder Scrolls: Reborn', category: 'Companions', playstyle: 'PvP', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'WildTamer', rating: 4.7, sales: 890 }, views: 2156, description: 'Stealth bonus pack.', stats: { Power: 70, Loyalty: 80 }, reviews: 156, prime: true, isNew: true },
  { id: 'g1', name: 'Void Reaper Scythe', price: 78000, rarity: 'Legendary', game: 'Elder Scrolls: Reborn', category: 'Gear', playstyle: 'PvP', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'VoidForge', rating: 4.9, sales: 1890 }, views: 5678, description: 'Soul harvesting weapon.', stats: { Attack: 120, CritChance: 25 }, reviews: 445, prime: true, isNew: false },
  { id: 'g2', name: 'Plasma Cannon MK-X', price: 65000, originalPrice: 72000, rarity: 'Epic', game: 'Galactic Warfare', category: 'Gear', playstyle: 'PvE', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=400&fit=crop', seller: { name: 'GunRunner', rating: 4.6, sales: 1200 }, views: 3421, description: 'Heavy weapon with burst fire.', stats: { Attack: 95, FireRate: 80 }, reviews: 267, prime: true, sponsored: true, isNew: true },
  { id: 'a1', name: 'Time Warp Mastery', price: 95000, rarity: 'Mythic', game: 'Mage Wars Online', category: 'Abilities', playstyle: 'PvP', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'ArcaneTrader', rating: 5.0, sales: 890 }, views: 6789, description: 'Ultimate time manipulation.', stats: { Power: 100, Cooldown: 300 }, reviews: 456, prime: true, isNew: false },
  { id: 'mat1', name: 'Void Essence x100', price: 35000, rarity: 'Legendary', game: 'Elder Scrolls: Reborn', category: 'Materials', playstyle: 'Crafting', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'RareMats', rating: 5.0, sales: 2800 }, views: 3421, description: 'Crafting bundle.', stats: { Quantity: 100 }, reviews: 234, prime: true, isNew: false },
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

const PLAYSTYLES = ['PvE', 'PvP', 'Crafting', 'Social'];

const rarityStyles = {
  Common: { text: 'text-slate-400', bg: 'bg-slate-500/20' },
  Uncommon: { text: 'text-green-400', bg: 'bg-green-500/20' },
  Rare: { text: 'text-blue-400', bg: 'bg-blue-500/20' },
  Epic: { text: 'text-purple-400', bg: 'bg-purple-500/20' },
  Legendary: { text: 'text-orange-400', bg: 'bg-orange-500/20' },
  Mythic: { text: 'text-red-400', bg: 'bg-red-500/20' }
};

// --- COMPONENTS ---

// New: AdamXE Featured Hero Section
const AdamXEFeatured = () => {
  return (
    <div className="mb-12 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-400" />
          AdamXE Originals
        </h2>
        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/5">Platform Exclusive</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {ADAM_XE_ORIGINALS.map((card, idx) => {
          const isMythic = card.rarity === 'Mythic';
          return (
            <div key={card.id} className={`group cursor-pointer ${isMythic ? 'lg:col-span-2 md:col-span-2' : ''}`}>
              <ShinyCard className="h-full">
                <div className="relative h-full aspect-[3/4] overflow-hidden rounded-xl">
                  <img src={card.image} alt={card.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  
                  {/* Overlay Info */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {card.isNew && <Badge className="bg-blue-500 text-white border-none shadow-lg shadow-blue-500/40">NEW</Badge>}
                    <Badge className="bg-black/50 backdrop-blur-md border border-white/10 text-white">{card.type}</Badge>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className={`font-black text-white mb-1 leading-none ${isMythic ? 'text-2xl' : 'text-lg'}`}>{card.name}</h3>
                    <p className="text-white/60 text-xs mb-3 line-clamp-2">{card.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge className={`border-none ${rarityStyles[card.rarity].bg} ${rarityStyles[card.rarity].text}`}>{card.rarity}</Badge>
                      <span className="text-white font-bold font-mono">{card.price.toLocaleString()} AGP</span>
                    </div>
                  </div>
                </div>
              </ShinyCard>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Filter Sidebar
const FilterSidebar = ({ filters, setFilters }) => {
  const { category, playstyle, priceRange, rarities } = filters;

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
      className="w-[240px] flex-shrink-0 p-4 rounded-3xl h-fit sticky top-4"
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="flex items-center gap-2 mb-4 text-white/50 text-xs font-bold uppercase tracking-wider">
        <Filter className="w-3 h-3" /> Filters
      </div>

      <FilterSection title="Playstyle">
        <div className="space-y-1">
          {PLAYSTYLES.map(style => (
            <label key={style} className="flex items-center gap-2 cursor-pointer group p-1.5 rounded hover:bg-white/5">
              <Checkbox
                checked={playstyle.includes(style)}
                onCheckedChange={() => {
                  setFilters(prev => ({
                    ...prev,
                    playstyle: prev.playstyle.includes(style) 
                      ? prev.playstyle.filter(x => x !== style) 
                      : [...prev.playstyle, style]
                  }));
                }}
                className="border-white/30 w-4 h-4"
              />
              <span className="text-sm text-white/70 group-hover:text-white transition-colors">{style}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Category">
        <div className="space-y-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                category === cat.id ? 'bg-blue-500/20 text-blue-400 font-medium' : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <cat.icon className="w-3 h-3" />
              {cat.name}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Rarity">
        <div className="space-y-1">
          {['Mythic', 'Legendary', 'Epic', 'Rare', 'Common'].map(r => (
            <label key={r} className="flex items-center gap-2 cursor-pointer group p-1.5 rounded hover:bg-white/5">
              <Checkbox
                checked={rarities.includes(r)}
                onCheckedChange={() => toggleRarity(r)}
                className="border-white/30 w-4 h-4"
              />
              <span className={`text-sm ${rarityStyles[r].text}`}>{r}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <div className="px-1 pt-2">
          <Slider
            value={priceRange}
            onValueChange={(val) => setFilters(prev => ({ ...prev, priceRange: val }))}
            max={200000}
            min={0}
            step={5000}
            className="mb-3"
          />
          <div className="flex justify-between text-xs text-white/50 font-mono">
            <span>{priceRange[0]/1000}k</span>
            <span>{priceRange[1]/1000}k</span>
          </div>
        </div>
      </FilterSection>
    </div>
  );
};

// Main Component
export default function MarketplaceContent({ searchTerm: propSearchTerm }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const searchTerm = propSearchTerm !== undefined ? propSearchTerm : internalSearchTerm;
  
  const [filters, setFilters] = useState({
    category: 'all',
    playstyle: [],
    priceRange: [0, 200000],
    rarities: [],
  });

  const filteredItems = useMemo(() => {
    return MARKETPLACE_ITEMS.filter(item => {
      const searchMatch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = filters.category === 'all' || item.category === filters.category;
      const playstyleMatch = filters.playstyle.length === 0 || filters.playstyle.includes(item.playstyle);
      const priceMatch = item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1];
      const rarityMatch = filters.rarities.length === 0 || filters.rarities.includes(item.rarity);
      return searchMatch && categoryMatch && playstyleMatch && priceMatch && rarityMatch;
    });
  }, [searchTerm, filters]);

  const handleAddToCart = (item) => {
    addToCart({
      id: item.id,
      title: item.name,
      price: item.price || 0,
      image: item.image,
      type: 'marketplace'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Marketplace</h1>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text"
            placeholder="Search items, developers, or tags..."
            value={internalSearchTerm}
            onChange={(e) => setInternalSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
      </div>

      {/* AdamXE Originals */}
      <AdamXEFeatured />

      {/* Developer Limited Editions */}
      <DeveloperLimitedEdition />

      {/* Main Content Layout */}
      <div className="flex gap-8 mt-8">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <FilterSidebar filters={filters} setFilters={setFilters} />
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">All Listings</h2>
            <span className="text-white/40 text-sm">{filteredItems.length} results</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-slate-900/40 border border-white/10 rounded-xl p-4 hover:bg-slate-800/60 hover:border-white/20 transition-all group">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg bg-black/50 overflow-hidden flex-shrink-0 relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    {item.isNew && <div className="absolute top-0 left-0 bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br">NEW</div>}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between items-start">
                      <Badge className={`text-[9px] border-none px-1.5 py-0 mb-1 ${rarityStyles[item.rarity].bg} ${rarityStyles[item.rarity].text}`}>
                        {item.rarity}
                      </Badge>
                      <span className="text-[10px] text-white/40">{item.playstyle}</span>
                    </div>
                    
                    <h3 className="text-white font-bold text-sm leading-tight mb-1 truncate group-hover:text-blue-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-white/50 text-xs mb-auto line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-white font-bold font-mono">{item.price.toLocaleString()}</span>
                        <span className="text-[10px] text-white/40">AGP</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAddToCart(item)}
                        className="h-7 px-3 text-xs bg-white/10 hover:bg-white/20 text-white border border-white/10"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-white/30">
              <Package className="w-12 h-12 mb-4 opacity-50" />
              <p>No items found matching criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}