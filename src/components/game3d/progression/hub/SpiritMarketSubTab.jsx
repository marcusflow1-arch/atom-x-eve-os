import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { SHOP_ITEMS, SHOP_CATEGORIES } from '../../shop/shopItems';
import {
  subscribeShop,
  purchaseItem,
  sellPurchasedItem,
  getResaleValue,
  consumeItem,
  addGold,
} from '../../shop/shopStore';
import {
  getLootInventory,
  subscribeLootInventory,
  removeLootFromInventory,
  removeLootWhere,
  LOOT_RARITIES,
} from '../../lootStore';

// Atom X Eve field-loot resale values. These are balance values, not claimed
// historical TwelveSky2 vendor prices.
const FIELD_SELL_VALUES = {
  common: 15,
  rare: 60,
  epic: 200,
  legendary: 750,
  mythic: 2000,
  divine: 5000,
};

export default function SpiritMarketSubTab() {
  const [mode, setMode] = useState('buy');
  const [category, setCategory] = useState('consumables');
  const [shop, setShop] = useState({ gold: 0, inventory: {}, equippedCosmetics: {} });
  const [loot, setLoot] = useState(() => getLootInventory());

  useEffect(() => subscribeShop(setShop), []);
  useEffect(() => subscribeLootInventory((next) => setLoot({ ...next })), []);

  const buyItems = useMemo(() => SHOP_ITEMS.filter((item) => item.category === category), [category]);
  const fieldLoot = useMemo(() => Object.values(loot).flat(), [loot]);
  const ownedMarket = useMemo(() => Object.entries(shop.inventory)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({ item: SHOP_ITEMS.find((x) => x.id === id), count }))
    .filter((row) => row.item), [shop.inventory]);

  const buy = (item) => {
    const result = purchaseItem(item);
    if (!result.ok) return toast.error(result.reason);
    toast.success(`${item.name} sent to your spirit inventory`, { icon: item.icon });
  };

  const useOwned = (item) => {
    const result = consumeItem(item);
    if (!result.ok) return toast.error(result.reason);
  };

  const sellField = (item) => {
    const removed = removeLootFromInventory(item.dropId);
    if (!removed) return toast.error('That loot item is no longer available.');
    const value = FIELD_SELL_VALUES[item.rarity] || FIELD_SELL_VALUES.common;
    addGold(value);
    toast.success(`${item.name} sold for ${value} gold`, { icon: '🪙' });
  };

  const sellOwned = (item, all = false) => {
    const count = shop.inventory[item.id] || 0;
    const result = sellPurchasedItem(item, all ? count : 1);
    if (!result.ok) return toast.error(result.reason);
    toast.success(`${result.quantity}× ${item.name} sold for ${result.value} gold`, { icon: '🪙' });
  };

  const sellCommonJunk = () => {
    const removed = removeLootWhere((item) =>
      item.rarity === 'common' && ['crafting', 'misc', 'material'].includes(item.category),
    );
    if (!removed.length) return toast('No common junk to sell.', { icon: '🧺' });
    const value = removed.reduce((sum, item) => sum + (FIELD_SELL_VALUES[item.rarity] || 0), 0);
    addGold(value);
    toast.success(`${removed.length} junk items sold · +${value} gold`, { icon: '🪙' });
  };

  return (
    <div className="h-full overflow-hidden px-8 py-7 flex flex-col">
      <div className="flex items-start justify-between gap-8 shrink-0">
        <div className="max-w-3xl">
          <div className="text-[10px] tracking-[0.35em] uppercase text-emerald-200/70">Remote Commerce</div>
          <h2 className="text-2xl text-white font-semibold mt-1">Spirit Market</h2>
          <p className="text-xs text-white/55 mt-2 leading-relaxed">
            Buy potions and materials or hand unwanted loot to your bound spirit for resale. Consumables can be used from the same screen, so routine inventory maintenance never requires a town trip.
          </p>
        </div>
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] px-5 py-3 min-w-[190px] text-right">
          <div className="text-[9px] tracking-[0.25em] uppercase text-white/40">Gold</div>
          <div className="text-2xl text-amber-200 tabular-nums mt-1">{shop.gold.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 shrink-0">
        <div className="flex gap-2">
          <Mode active={mode === 'buy'} onClick={() => setMode('buy')}>Buy / Use</Mode>
          <Mode active={mode === 'sell'} onClick={() => setMode('sell')}>Sell</Mode>
        </div>
        {mode === 'sell' && (
          <button
            onClick={sellCommonJunk}
            className="px-4 py-2 rounded-md border border-white/10 bg-white/[0.035] text-[9px] font-bold uppercase tracking-[0.16em] text-white/60 hover:text-white hover:bg-white/[0.06]"
          >
            Sell Common Junk
          </button>
        )}
      </div>

      {mode === 'buy' ? (
        <div className="flex-1 min-h-0 flex gap-4 mt-4">
          <div className="w-52 shrink-0 rounded-xl border border-white/10 bg-black/15 p-2 overflow-y-auto">
            {SHOP_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-left text-[11px] transition-all ${
                  category === cat.id ? 'bg-emerald-300/[0.09] text-white' : 'text-white/45 hover:text-white/75 hover:bg-white/[0.035]'
                }`}
              >
                <span>{cat.icon}</span><span>{cat.label}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-0 overflow-y-auto grid grid-cols-2 xl:grid-cols-3 gap-3 content-start pr-1 pb-5">
            {buyItems.map((item) => {
              const owned = shop.inventory[item.id] || 0;
              const usable = owned > 0 && item.effect?.kind !== 'cosmetic';
              return (
                <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex gap-3">
                    <div className="w-11 h-11 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center text-2xl">{item.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm text-white font-semibold truncate">{item.name}</div>
                        {owned > 0 && <span className="text-[9px] text-white/35 shrink-0">×{owned}</span>}
                      </div>
                      <div className="text-[10px] text-white/45 mt-1 line-clamp-2">{item.desc}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => buy(item)}
                      disabled={shop.gold < item.price}
                      className="flex-1 py-2 rounded-md border border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-100 text-[9px] font-bold uppercase tracking-[0.16em] disabled:opacity-25"
                    >
                      Buy · {item.price.toLocaleString()}
                    </button>
                    {usable && (
                      <button
                        onClick={() => useOwned(item)}
                        className="px-3 py-2 rounded-md border border-sky-300/25 bg-sky-300/[0.07] text-sky-100 text-[9px] font-bold uppercase tracking-[0.16em]"
                      >
                        Use
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto mt-4 pr-1 pb-6">
          <SectionTitle>Field Loot · {fieldLoot.length}</SectionTitle>
          {fieldLoot.length === 0 ? (
            <Empty text="No field loot to sell." />
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 mb-7">
              {fieldLoot.map((item) => {
                const value = FIELD_SELL_VALUES[item.rarity] || FIELD_SELL_VALUES.common;
                const rarity = LOOT_RARITIES[item.rarity] || LOOT_RARITIES.common;
                return (
                  <div key={item.dropId} className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] text-white truncate">{item.name}</div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: rarity.color }}>{rarity.label}</div>
                      </div>
                    </div>
                    <button onClick={() => sellField(item)} className="w-full mt-2 py-1.5 rounded border border-amber-300/20 bg-amber-300/[0.05] text-[9px] text-amber-100">
                      Sell · {value} Gold
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <SectionTitle>Spirit Inventory · {ownedMarket.length}</SectionTitle>
          {ownedMarket.length === 0 ? (
            <Empty text="No purchased items to resell." />
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
              {ownedMarket.map(({ item, count }) => (
                <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-white truncate">{item.name}</div>
                      <div className="text-[9px] text-white/40">Owned ×{count}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={() => sellOwned(item, false)} className="flex-1 py-1.5 rounded border border-amber-300/20 bg-amber-300/[0.05] text-[9px] text-amber-100">
                      1 · {getResaleValue(item)}
                    </button>
                    {count > 1 && (
                      <button onClick={() => sellOwned(item, true)} className="flex-1 py-1.5 rounded border border-white/10 bg-white/[0.035] text-[9px] text-white/60">
                        All · {getResaleValue(item, count)}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Mode({ active, children, onClick }) {
  return (
    <button onClick={onClick} className={`px-5 py-2 rounded-md border text-[10px] uppercase tracking-[0.2em] ${active ? 'border-emerald-300/35 bg-emerald-300/[0.08] text-emerald-100' : 'border-white/10 text-white/45'}`}>
      {children}
    </button>
  );
}
function SectionTitle({ children }) { return <div className="text-[9px] uppercase tracking-[0.25em] text-white/40 mb-2">{children}</div>; }
function Empty({ text }) { return <div className="rounded-lg border border-white/8 bg-black/15 px-4 py-6 text-center text-xs text-white/30 mb-6">{text}</div>; }
