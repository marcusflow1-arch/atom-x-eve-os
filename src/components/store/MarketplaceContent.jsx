import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Search, Star, ChevronRight, ChevronDown, X, Grid, List, Package, Ghost, Shield, Zap, Gem, Footprints, Truck, DollarSign, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Reuse marketplace items data
const MARKETPLACE_ITEMS = [
  { id: 'c1', name: 'Phoenix Familiar - Legendary Fire Companion with Auto-Revive Ability', price: 45000, originalPrice: 52000, rarity: 'Legendary', game: 'Mage Wars Online', category: 'Companions', subcategory: 'Mythical', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'PetMaster', rating: 4.9, sales: 1250 }, views: 3421, description: 'A blazing phoenix companion that automatically revives you once per battle. Includes flame aura effect.', stats: { Power: 85, Loyalty: 95 }, reviews: 234, prime: true, sponsored: true },
  { id: 'c2', name: 'Shadow Wolf Pack - Triple Beast Companion Set with Stealth Bonus', price: 28000, rarity: 'Epic', game: 'Elder Scrolls: Reborn', category: 'Companions', subcategory: 'Beast', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'WildTamer', rating: 4.7, sales: 890 }, views: 2156, description: 'Three shadow wolves that hunt alongside you with +25% stealth bonus when active.', stats: { Power: 70, Loyalty: 80 }, reviews: 156, prime: true },
  { id: 'c3', name: 'Quantum AI Drone MK-X - Advanced Combat Assistant with Neural Link', price: 52000, rarity: 'Mythic', game: 'Cyberpunk 2088', category: 'Companions', subcategory: 'Mechanical', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop', seller: { name: 'TechDealer', rating: 5.0, sales: 2100 }, views: 4521, description: 'Military-grade AI companion with combat assistance, hacking support, and tactical analysis.', stats: { Power: 90, Intelligence: 100 }, reviews: 312, prime: true, sponsored: true },
  { id: 'g1', name: 'Void Reaper Scythe - Soul Harvesting Legendary Weapon', price: 78000, rarity: 'Legendary', game: 'Elder Scrolls: Reborn', category: 'Gear', subcategory: 'Weapons', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', seller: { name: 'VoidForge', rating: 4.9, sales: 1890 }, views: 5678, description: 'Harvests souls with each killing blow. 15% life steal on hit.', stats: { Attack: 120, CritChance: 25 }, reviews: 445, prime: true },
  { id: 'a1', name: 'Time Warp Mastery - Ultimate Time Manipulation Ability', price: 95000, rarity: 'Mythic', game: 'Mage Wars Online', category: 'Abilities', subcategory: 'Magic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop', seller: { name: 'ArcaneTrader', rating: 5.0, sales: 890 }, views: 6789, description: 'Manipulate time in a 50m radius for 10 seconds.', stats: { Power: 100, Cooldown: 300 }, reviews: 456, prime: true },
];

const CATEGORIES = [
  { id: 'all', name: 'All Departments', icon: Grid },
  { id: 'Companions', name: 'Companions', icon: Ghost },
  { id: 'Gear', name: 'Gear & Equipment', icon: Shield },
  { id: 'Abilities', name: 'Abilities & Skills', icon: Zap },
  { id: 'Materials', name: 'Crafting Materials', icon: Gem },
  { id: 'Mounts', name: 'Mounts & Vehicles', icon: Footprints },
];

const rarityStyles = {
  Common: { text: 'text-slate-400', bg: 'bg-slate-500/20' },
  Uncommon: { text: 'text-green-400', bg: 'bg-green-500/20' },
  Rare: { text: 'text-blue-400', bg: 'bg-blue-500/20' },
  Epic: { text: 'text-purple-400', bg: 'bg-purple-500/20' },
  Legendary: { text: 'text-orange-400', bg: 'bg-orange-500/20' },
  Mythic: { text: 'text-red-400', bg: 'bg-red-500/20' }
};

// Liquid Card with wave animation
const LiquidCard = ({ children, className = "", onClick }) => {
  const x = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const waveX = useTransform(mouseX, [0, 1], ["-100%", "200%"]);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl bg-slate-900/60 backdrop-blur-xl border border-white/10 transition-all duration-300 hover:border-white/20 hover:bg-slate-800/60 cursor-pointer ${className}`}
      onMouseMove={({ currentTarget, clientX }) => {
        const { left, width } = currentTarget.getBoundingClientRect();
        x.set((clientX - left) / width);
      }}
      onMouseLeave={() => x.set(0.5)}
      onClick={onClick}
    >
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
        style={{ left: waveX, width: "60%", height: "100%" }}
      />
      {children}
    </motion.div>
  );
};

// Horizontal scroll product row
const ProductRow = ({ title, items, onItemClick }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-white font-bold text-lg">{title}</h2>
      <button className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
        See more <ChevronRight className="w-4 h-4" />
      </button>
    </div>
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {items.slice(0, 6).map((item) => (
        <LiquidCard key={item.id} onClick={() => onItemClick(item)} className="w-[180px] flex-shrink-0">
          <div className="aspect-square rounded-lg overflow-hidden bg-slate-950 mb-2">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          </div>
          <div className="p-3">
            <h3 className="text-blue-400 text-sm font-medium line-clamp-2 mb-1 hover:text-blue-300">{item.name}</h3>
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.floor(item.seller.rating) ? 'text-orange-400 fill-current' : 'text-slate-600'}`} />
              ))}
              <span className="text-white/50 text-xs ml-1">{item.reviews}</span>
            </div>
            <span className="text-white font-bold">{item.price.toLocaleString()}</span>
            <span className="text-white/40 text-xs ml-1">AGP</span>
          </div>
        </LiquidCard>
      ))}
    </div>
  </div>
);

// List item card
const ListItemCard = ({ item, onClick }) => {
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
  const discountPercent = hasDiscount ? Math.round((1 - item.price / item.originalPrice) * 100) : 0;

  return (
    <LiquidCard onClick={() => onClick(item)} className="p-4 mb-3">
      <div className="flex gap-4">
        <div className="w-[140px] h-[140px] flex-shrink-0 rounded-lg overflow-hidden bg-slate-950">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-blue-400 hover:text-blue-300 font-medium text-base leading-snug mb-1 line-clamp-2 transition-colors">
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
              <span className="text-2xl font-bold text-white">{item.price.toLocaleString()}</span>
              <span className="text-white/50 text-sm">AGP</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className={`${rarity.text} text-xs font-medium`}>{item.rarity}</span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-white/50 text-xs">{item.category}</span>
          </div>

          <p className="text-white/60 text-sm line-clamp-2">{item.description}</p>
        </div>
      </div>
    </LiquidCard>
  );
};

// Filter sidebar
const FilterSidebar = ({ filters, setFilters }) => {
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
      className="w-[220px] flex-shrink-0 p-4 rounded-2xl h-fit"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      <FilterSection title="Department">
        <div className="space-y-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                filters.category === cat.id ? 'text-blue-400 font-medium' : 'text-white/70 hover:text-white'
              }`}
            >
              {filters.category === cat.id && <ChevronRight className="w-3 h-3" />}
              {cat.name}
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
              className={`flex items-center gap-2 w-full text-left ${filters.rating === r ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
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
        <Slider
          value={filters.priceRange}
          onValueChange={(val) => setFilters(prev => ({ ...prev, priceRange: val }))}
          max={200000}
          min={0}
          step={5000}
          className="mb-3"
        />
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>{filters.priceRange[0].toLocaleString()}</span>
          <span>{filters.priceRange[1].toLocaleString()}</span>
        </div>
      </FilterSection>
    </div>
  );
};

// Item detail modal
const ItemDetailModal = ({ item, isOpen, onClose }) => {
  if (!item) return null;
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-2xl border-white/10 max-w-4xl text-white p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-[350px] flex-shrink-0 bg-slate-800 p-6">
            <img src={item.image} alt={item.name} className="w-full aspect-square object-cover rounded-lg" />
          </div>

          <div className="flex-1 p-6 overflow-y-auto max-h-[80vh]">
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <X className="w-4 h-4" />
            </button>

            <h1 className="text-xl font-bold text-white mb-2 pr-8">{item.name}</h1>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-orange-400 font-medium">{item.seller.rating}</span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(item.seller.rating) ? 'text-orange-400 fill-current' : 'text-slate-600'}`} />
                ))}
              </div>
              <span className="text-blue-400 text-sm">{item.reviews} ratings</span>
            </div>

            <div className="border-t border-b border-white/10 py-4 mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{item.price.toLocaleString()}</span>
                <span className="text-white/50">AGP</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-white font-bold mb-2">About this item</h3>
              <p className="text-white/70 text-sm leading-relaxed">{item.description}</p>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-full">
                <Plus className="w-4 h-4 mr-2" /> Add to Cart
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-11 rounded-full">
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function MarketplaceContent() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: [0, 200000],
    rarities: [],
    rating: null,
  });

  const filteredItems = useMemo(() => {
    return MARKETPLACE_ITEMS.filter(item => {
      const categoryMatch = filters.category === 'all' || item.category === filters.category;
      const priceMatch = item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1];
      const ratingMatch = !filters.rating || item.seller.rating >= filters.rating;
      return categoryMatch && priceMatch && ratingMatch;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return (b.views || 0) - (a.views || 0);
    });
  }, [filters, sortBy]);

  const sponsoredItems = MARKETPLACE_ITEMS.filter(i => i.sponsored);

  return (
    <div className="min-h-screen">
      <ProductRow title="Sponsored • Top rated in Gaming Items" items={sponsoredItems} onItemClick={setSelectedItem} />

      <div className="flex gap-6">
        <aside className="hidden lg:block">
          <FilterSidebar filters={filters} setFilters={setFilters} />
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
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
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-800 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-white font-bold mb-4">Results</h2>
            {viewMode === 'list' ? (
              <div className="space-y-1">
                {filteredItems.map(item => (
                  <ListItemCard key={item.id} item={item} onClick={setSelectedItem} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map(item => (
                  <LiquidCard key={item.id} onClick={() => setSelectedItem(item)}>
                    <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden mb-2">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <h3 className="text-blue-400 text-sm line-clamp-2 mb-1">{item.name}</h3>
                      <span className="text-white font-bold">{item.price.toLocaleString()} AGP</span>
                    </div>
                  </LiquidCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ItemDetailModal item={selectedItem} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}