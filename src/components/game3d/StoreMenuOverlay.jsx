import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Coins, X, ShoppingBag, Package, Check } from 'lucide-react';
import { SHOP_CATEGORIES, SHOP_ITEMS, getItemsByCategory, RARITY_COLORS } from './shop/shopItems';
import { getShopState, subscribeShop, purchaseItem, consumeItem, equipCosmetic, unequipCosmetic } from './shop/shopStore';
import toast from 'react-hot-toast';

/**
 * MMORPG Merchant Shop — liquid-glass redesign.
 * Categories: Consumables, Materials, Companion Gear, Cosmetics.
 * Buy items with gold, use consumables to fire real combat buffs.
 */
export default function StoreMenuOverlay({ isOpen, onClose }) {
  const [activeCat, setActiveCat] = useState('consumables');
  const [search, setSearch] = useState('');
  const [shop, setShop] = useState(() => getShopState());
  const [selected, setSelected] = useState(null);

  useEffect(() => subscribeShop(setShop), []);

  const items = getItemsByCategory(activeCat).filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );
  const activeCatDef = SHOP_CATEGORIES.find((c) => c.id === activeCat);

  const handleBuy = (item) => {
    const res = purchaseItem(item);
    if (res.ok) toast.success(`Purchased ${item.name}`, { icon: '🛒' });
    else toast.error(res.reason);
  };

  const handleUse = (item) => {
    if (item.category === 'cosmetics') {
      const slot = item.effect?.slot || 'aura';
      const equipped = shop.equippedCosmetics[slot];
      if (equipped === item.id) {
        unequipCosmetic(slot);
        toast(`${item.name} unequipped`, { icon: '✕' });
      } else {
        equipCosmetic(slot, item.id);
        toast.success(`${item.name} equipped`, { icon: '👑' });
      }
      return;
    }
    if (item.effect?.kind === 'companion_stat') {
      // Permanent — uses one charge and applies forever.
      const res = consumeItem(item);
      if (!res.ok) toast.error(res.reason);
      return;
    }
    const res = consumeItem(item);
    if (!res.ok) toast.error(res.reason);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
        >
          <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onClose} />

          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            className="relative flex gap-3 pointer-events-auto"
          >
            {/* LEFT — Category sidebar */}
            <GlassPanel className="w-[240px] h-[640px] flex flex-col">
              <div className="p-4 border-b border-white/10 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span className="text-white font-bold tracking-wider text-sm">MERCHANT</span>
              </div>
              <div className="flex-1 py-3">
                {SHOP_CATEGORIES.map((cat) => {
                  const active = activeCat === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCat(cat.id); setSelected(null); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-2 ${
                        active
                          ? 'bg-amber-500/15 border-amber-400 text-white'
                          : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-sm font-semibold">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="p-3 border-t border-white/10 flex items-center justify-between"
                   style={{ background: 'rgba(20,15,8,0.55)' }}>
                <span className="text-white/50 text-xs">Your Gold</span>
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 text-sm font-bold tabular-nums">{shop.gold.toLocaleString()}</span>
                </div>
              </div>
            </GlassPanel>

            {/* MIDDLE — Item grid */}
            <GlassPanel className="w-[440px] h-[640px] flex flex-col">
              <div className="p-3 border-b border-white/10 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/40 border border-white/10">
                  <Search className="w-3.5 h-3.5 text-white/40" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search items..."
                    className="flex-1 bg-transparent text-white text-xs placeholder-white/40 outline-none"
                  />
                </div>
              </div>
              <div className="px-4 py-3 border-b border-white/5">
                <div className="text-white font-bold text-base">{activeCatDef?.label}</div>
                <div className="text-white/55 text-xs mt-0.5">{activeCatDef?.desc}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2 content-start">
                {items.length === 0 && (
                  <div className="col-span-3 text-center text-white/40 text-xs py-12">No items match your search.</div>
                )}
                {items.map((item) => (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    selected={selected?.id === item.id}
                    onClick={() => setSelected(item)}
                  />
                ))}
              </div>
            </GlassPanel>

            {/* RIGHT — Detail + inventory */}
            <GlassPanel className="w-[300px] h-[640px] flex flex-col">
              {selected ? (
                <ItemDetail
                  item={selected}
                  shop={shop}
                  onBuy={() => handleBuy(selected)}
                  onUse={() => handleUse(selected)}
                />
              ) : (
                <InventoryPanel shop={shop} onPickItem={setSelected} />
              )}
            </GlassPanel>

            <button
              onClick={onClose}
              className="absolute -top-10 right-0 flex items-center gap-2 px-3 py-1.5 rounded bg-black/60 backdrop-blur-sm border border-white/15 text-white/70 text-xs hover:text-white transition-all"
            >
              <X className="w-3.5 h-3.5" /><span>TAB or ESC to close</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GlassPanel({ children, className = '' }) {
  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(15, 20, 30, 0.72)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(180, 140, 80, 0.28)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {children}
    </div>
  );
}

function ShopItemCard({ item, selected, onClick }) {
  const rc = RARITY_COLORS[item.rarity] || '#9ca3af';
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center p-2 rounded-lg transition-all ${
        selected ? 'ring-2 ring-amber-400 bg-white/5' : 'hover:bg-white/5'
      }`}
      style={{ border: `1px solid ${rc}55`, background: selected ? 'rgba(245,158,11,0.08)' : 'rgba(0,0,0,0.25)' }}
    >
      <div
        className="w-12 h-12 rounded-md flex items-center justify-center text-2xl"
        style={{
          background: `radial-gradient(circle, ${rc}33 0%, ${rc}11 70%)`,
          boxShadow: `0 0 12px ${rc}40, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        {item.icon}
      </div>
      <div className="mt-1.5 text-white text-[10px] font-semibold leading-tight text-center line-clamp-2">{item.name}</div>
      <div className="flex items-center gap-0.5 mt-1">
        <Coins className="w-2.5 h-2.5 text-amber-400" />
        <span className="text-amber-300 text-[10px] font-bold tabular-nums">{item.price}</span>
      </div>
    </button>
  );
}

function ItemDetail({ item, shop, onBuy, onUse }) {
  const rc = RARITY_COLORS[item.rarity] || '#9ca3af';
  const owned = shop.inventory[item.id] || 0;
  const canAfford = shop.gold >= item.price;
  const isCosmetic = item.category === 'cosmetics';
  const equippedSlot = item.effect?.slot;
  const isEquipped = isCosmetic && equippedSlot && shop.equippedCosmetics[equippedSlot] === item.id;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start gap-3">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl shrink-0"
            style={{
              background: `radial-gradient(circle, ${rc}44 0%, ${rc}11 70%)`,
              boxShadow: `0 0 20px ${rc}50`,
              border: `1px solid ${rc}66`,
            }}
          >
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm leading-tight">{item.name}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: rc }}>{item.rarity}</div>
            <div className="flex items-center gap-1 mt-1">
              <Coins className="w-3 h-3 text-amber-400" />
              <span className="text-amber-300 text-xs font-bold tabular-nums">{item.price.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="text-white/70 text-xs leading-relaxed">{item.desc}</div>
        {owned > 0 && (
          <div className="mt-4 px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-400/30">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>You own {owned}</span>
            </div>
          </div>
        )}
        {isEquipped && (
          <div className="mt-3 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            Currently equipped
          </div>
        )}
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <button
          onClick={onBuy}
          disabled={!canAfford}
          className="flex-1 py-2.5 rounded-md text-white text-xs font-bold tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
          style={{
            background: canAfford
              ? 'linear-gradient(180deg, rgba(245,158,11,0.85), rgba(180,100,20,0.9))'
              : 'rgba(60,50,40,0.6)',
            border: '1px solid rgba(245,158,11,0.45)',
            boxShadow: canAfford ? '0 4px 14px rgba(245,158,11,0.35)' : 'none',
          }}
        >
          Buy {item.price}
        </button>
        {owned > 0 && (
          <button
            onClick={onUse}
            className="flex-1 py-2.5 rounded-md text-white text-xs font-bold tracking-wider hover:brightness-110 transition-all"
            style={{
              background: 'linear-gradient(180deg, rgba(34,197,94,0.85), rgba(20,140,70,0.9))',
              border: '1px solid rgba(34,197,94,0.45)',
              boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
            }}
          >
            {isCosmetic ? (isEquipped ? 'Unequip' : 'Equip') : 'Use'}
          </button>
        )}
      </div>
    </div>
  );
}

function InventoryPanel({ shop, onPickItem }) {
  const entries = Object.entries(shop.inventory).filter(([, c]) => c > 0);
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center gap-2">
        <Package className="w-4 h-4 text-amber-400" />
        <span className="text-white font-bold tracking-wider text-sm">YOUR INVENTORY</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {entries.length === 0 ? (
          <div className="text-center text-white/40 text-xs py-12">Select an item to see details.<br/>Items you buy appear here.</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {entries.map(([id, count]) => {
              const item = SHOP_ITEMS.find((i) => i.id === id);
              if (!item) return null;
              const rc = RARITY_COLORS[item.rarity] || '#9ca3af';
              return (
                <button
                  key={id}
                  onClick={() => onPickItem(item)}
                  className="relative aspect-square rounded-md flex items-center justify-center text-2xl hover:scale-105 transition-transform"
                  style={{
                    background: `radial-gradient(circle, ${rc}33 0%, ${rc}11 70%)`,
                    border: `1px solid ${rc}55`,
                  }}
                >
                  {item.icon}
                  <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-white bg-black/70 rounded px-1">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}