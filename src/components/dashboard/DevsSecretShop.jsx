import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Sparkles, Lock, Sword, Shield, Trophy, Zap, Package, Crown } from 'lucide-react';
import { DEV_SPOTLIGHT_DATA } from './devSpotlightData';
import { useCart } from '@/components/CartContext';

const ITEM_TYPE_ICONS = {
  Achievement: Trophy,
  Weapon: Sword,
  Armor: Shield,
  Ability: Zap,
  Pack: Package,
  Card: Sparkles,
};

const RARITY_STYLES = {
  Common: { text: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/25', glow: '' },
  Uncommon: { text: 'text-green-300', bg: 'bg-green-500/10', border: 'border-green-500/25', glow: 'shadow-green-500/10' },
  Rare: { text: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/25', glow: 'shadow-blue-500/15' },
  Epic: { text: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/25', glow: 'shadow-purple-500/20' },
  Legendary: { text: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: 'shadow-orange-500/25' },
  Mythical: { text: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'shadow-red-500/25' },
};

// Generate exclusive shop items per developer
function generateShopItems(dev) {
  const types = ['Achievement', 'Weapon', 'Armor', 'Ability', 'Pack', 'Card'];
  const rarities = ['Rare', 'Epic', 'Legendary', 'Mythical', 'Epic', 'Rare', 'Legendary'];
  const itemNames = [
    `${dev.name} Founder's Badge`, `Exclusive ${dev.name} Sword`, `Dev Shield of ${dev.name}`,
    `Secret Ability — "${dev.name} Surge"`, `${dev.name} Ultimate Bundle`,
    `${dev.name} Mythic Card`, `Developer's Hidden Achievement`, `${dev.name} Legendary Armor`,
    `Sealed Dev Weapon Crate`, `${dev.name} Signature Series`, `Early Access Achievement Pack`,
    `${dev.name} Studio Edition Card`,
  ];

  return itemNames.map((name, i) => {
    const rarity = rarities[i % rarities.length];
    const type = types[i % types.length];
    const basePrice = rarity === 'Mythical' ? 29.99 : rarity === 'Legendary' ? 19.99 : rarity === 'Epic' ? 12.99 : 7.99;
    const game = dev.games[i % dev.games.length];
    return {
      id: `shop-${dev.id}-${i}`,
      name,
      type,
      rarity,
      game: game?.title || dev.name,
      cover: game?.cover || dev.logo,
      price: basePrice + (i * 0.50),
      description: `An exclusive ${rarity.toLowerCase()} ${type.toLowerCase()} created directly by ${dev.name}. Only available in the Dev's Secret Shop.`,
      limited: i % 3 === 0,
      remaining: Math.floor(Math.random() * 50) + 10,
    };
  });
}

function ShopItemCard({ item, onBuy }) {
  const rarity = RARITY_STYLES[item.rarity] || RARITY_STYLES.Rare;
  const Icon = ITEM_TYPE_ICONS[item.type] || Package;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.015 }}
      className={`relative rounded-2xl border overflow-hidden cursor-pointer transition-all ${rarity.border} ${rarity.glow ? `shadow-lg ${rarity.glow}` : ''}`}
      style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(12px)' }}
      onClick={() => onBuy(item)}
    >
      {/* Cover image */}
      <div className="relative w-full h-32 overflow-hidden">
        <img src={item.cover} alt={item.name} className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Type icon overlay */}
        <div className={`absolute top-2.5 left-2.5 w-8 h-8 rounded-lg flex items-center justify-center border ${rarity.bg} ${rarity.border}`}>
          <Icon className={`w-4 h-4 ${rarity.text}`} />
        </div>

        {/* Limited badge */}
        {item.limited && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
            <Lock className="w-2.5 h-2.5 text-red-400" />
            <span className="text-red-300 text-[9px] font-bold">LIMITED</span>
          </div>
        )}

        <div className="absolute bottom-2 left-2.5 right-2.5">
          <h3 className="text-white font-bold text-xs leading-tight line-clamp-2">{item.name}</h3>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={`${rarity.bg} ${rarity.text} border ${rarity.border} text-[9px] px-1.5 h-4`}>{item.rarity}</Badge>
          <Badge className="bg-white/5 text-white/40 border border-white/10 text-[9px] px-1.5 h-4">{item.type}</Badge>
        </div>
        <p className="text-white/30 text-[10px] leading-snug line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between mt-1">
          <div>
            <span className="text-white font-bold text-sm">${item.price.toFixed(2)}</span>
            <span className="text-white/25 text-[10px] ml-1">USD</span>
          </div>
          {item.limited && (
            <span className="text-orange-400/70 text-[9px]">{item.remaining} left</span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onBuy(item); }}
          className={`w-full py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${rarity.bg} ${rarity.border} ${rarity.text} hover:brightness-125`}
        >
          <ShoppingCart className="w-3 h-3" />
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
}

export default function DevsSecretShop() {
  const { addToCart } = useCart();
  const [selectedDev, setSelectedDev] = useState(DEV_SPOTLIGHT_DATA[0] || null);
  const [filterType, setFilterType] = useState('all');

  const shopItems = useMemo(() => {
    if (!selectedDev) return [];
    return generateShopItems(selectedDev);
  }, [selectedDev]);

  const filteredItems = useMemo(() => {
    if (filterType === 'all') return shopItems;
    return shopItems.filter(i => i.type.toLowerCase() === filterType.toLowerCase());
  }, [shopItems, filterType]);

  const types = ['all', 'Achievement', 'Weapon', 'Armor', 'Ability', 'Card', 'Pack'];

  const handleBuy = (item) => {
    addToCart({
      id: item.id,
      title: item.name,
      image: item.cover,
      price: item.price,
      type: item.type.toLowerCase(),
    });
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* ═══ LEFT RAIL: Developer List (15%) ═══ */}
      <div
        className="flex-shrink-0 h-full flex flex-col border-r border-white/8 overflow-hidden"
        style={{ width: '15%', minWidth: '150px', background: 'rgba(6, 9, 14, 0.7)', backdropFilter: 'blur(20px)' }}
      >
        <div className="p-3 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Developers</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
          {DEV_SPOTLIGHT_DATA.map((dev) => (
            <motion.button
              key={dev.id}
              onClick={() => setSelectedDev(dev)}
              whileHover={{ x: 2 }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all border-r-2 ${
                selectedDev?.id === dev.id
                  ? 'bg-white/8 border-cyan-400/60 text-white'
                  : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/4'
              }`}
            >
              <img
                src={dev.logo}
                alt={dev.name}
                className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-white/10"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate leading-tight">{dev.name}</p>
                <p className="text-[9px] text-white/30 truncate">{dev.games?.length || 0} games</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ═══ RIGHT PANEL: Shop Items (85%) ═══ */}
      <div className="flex-1 h-full flex flex-col overflow-hidden" style={{ background: 'rgba(8, 12, 18, 0.5)', backdropFilter: 'blur(20px)' }}>
        {selectedDev ? (
          <>
            {/* Header */}
            <div className="p-5 pb-4 border-b border-white/6 flex items-center gap-4">
              <img src={selectedDev.logo} alt={selectedDev.name} className="w-12 h-12 rounded-xl border border-white/12 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-bold text-lg">{selectedDev.name}</h2>
                  <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[10px]">
                    <Crown className="w-2.5 h-2.5 mr-1" />Verified Dev
                  </Badge>
                </div>
                <p className="text-white/35 text-xs mt-0.5 line-clamp-1">{selectedDev.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white/20 text-[10px] uppercase tracking-wider">Exclusive Items</p>
                <p className="text-white font-bold text-xl">{filteredItems.length}</p>
              </div>
            </div>

            {/* Info bar */}
            <div className="px-5 py-2.5 border-b border-white/5 flex items-center gap-2" style={{ background: 'rgba(245,158,11,0.05)' }}>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <p className="text-[11px] text-amber-300/70">
                All items here are sold directly by the developer for real money. Purchases support the studio and unlock exclusive in-game content only available in the Dev's Secret Shop.
              </p>
            </div>

            {/* Type filters */}
            <div className="px-5 py-2.5 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all ${
                    filterType === type
                      ? 'bg-white/12 border-white/20 text-white'
                      : 'bg-transparent border-transparent text-white/35 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  {type === 'all' ? 'All Items' : type}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.25) }}
                  >
                    <ShopItemCard item={item} onBuy={handleBuy} />
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <Crown className="w-12 h-12 text-amber-400/30 mb-4" />
            <h2 className="text-white/40 font-bold text-lg mb-2">Dev's Secret Shop</h2>
            <p className="text-white/20 text-sm max-w-sm">Select a developer from the left to browse their exclusive items for sale.</p>
          </div>
        )}
      </div>
    </div>
  );
}