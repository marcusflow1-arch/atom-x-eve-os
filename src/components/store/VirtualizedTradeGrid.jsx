import React, { useState, useMemo } from 'react';
import { Zap, Shield, Users, Globe, Box, Cpu, ScrollText, Hammer, Search } from 'lucide-react';

const TYPE_FILTERS = [
  { id: 'all',         label: 'All',         icon: Globe },
  { id: 'Ability',     label: 'Ability',     icon: Zap },
  { id: 'Equipment',   label: 'Equipment',   icon: Shield },
  { id: 'Weapon',      label: 'Weapon',      icon: Hammer },
  { id: 'Armor',       label: 'Armor',       icon: Shield },
  { id: 'Companion',   label: 'Companion',   icon: Users },
  { id: 'Tech',        label: 'Tech',        icon: Cpu },
  { id: 'Blueprint',   label: 'Blueprint',   icon: ScrollText },
  { id: 'Consumable',  label: 'Consumable',  icon: Box },
  { id: 'Material',    label: 'Material',    icon: Box },
];

const RARITY_COLORS = {
  Mythic:    'border-red-500/60 shadow-red-500/20',
  Legendary: 'border-orange-500/60 shadow-orange-500/20',
  Epic:      'border-purple-500/60 shadow-purple-500/20',
  Rare:      'border-blue-500/60 shadow-blue-500/20',
  Uncommon:  'border-green-500/60 shadow-green-500/20',
  Common:    'border-white/10 shadow-transparent',
};

const RARITY_LABEL_COLORS = {
  Mythic:    'text-red-400',
  Legendary: 'text-orange-400',
  Epic:      'text-purple-400',
  Rare:      'text-blue-400',
  Uncommon:  'text-green-400',
  Common:    'text-white/40',
};

export default function VirtualizedTradeGrid({ items, onSelectItem }) {
  const [activeType, setActiveType] = useState('all');
  const [query, setQuery] = useState('');

  // Determine which type filters have any items
  const availableTypes = useMemo(() => {
    const typeSet = new Set((items || []).map(i => i?.type || i?.item_type || ''));
    return TYPE_FILTERS.filter(f => f.id === 'all' || typeSet.has(f.id));
  }, [items]);

  const filtered = useMemo(() => {
    let list = items || [];
    if (activeType !== 'all') {
      list = list.filter(i => (i?.type || i?.item_type || '') === activeType);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(i =>
        (i?.name || '').toLowerCase().includes(q) ||
        (i?.game || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, activeType, query]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Sub-filter bar */}
      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
        {availableTypes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveType(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              activeType === id
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                : 'bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}

        {/* Search */}
        <div className="ml-auto flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
          <Search className="w-3 h-3 text-white/40" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search items..."
            className="bg-transparent text-xs text-white placeholder:text-white/30 outline-none w-32"
          />
        </div>
      </div>

      {/* Items grid */}
      <div className="flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
        {filtered.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-white/30 text-sm">
            No items match this filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-6">
            {filtered.map((item) => {
              const rarity = item.rarity || 'Common';
              const borderCls = RARITY_COLORS[rarity] || RARITY_COLORS.Common;
              const labelCls = RARITY_LABEL_COLORS[rarity] || RARITY_LABEL_COLORS.Common;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectItem && onSelectItem(item)}
                  className={`group relative flex flex-col rounded-xl overflow-hidden border-2 ${borderCls} bg-slate-900/70 hover:scale-[1.04] hover:shadow-lg transition-all duration-200 text-left`}
                >
                  {/* Card image */}
                  <div className="aspect-square w-full overflow-hidden bg-black/40">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Card info below image */}
                  <div className="p-2">
                    <p className="text-white text-xs font-bold leading-tight truncate">{item.name || 'Unnamed'}</p>
                    <div className="flex items-center justify-between mt-1 gap-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${labelCls}`}>{rarity}</span>
                      <span className="text-[9px] text-white/30 truncate">{item.type}</span>
                    </div>
                    {item.marketPrice && (
                      <p className="text-[10px] text-cyan-400 font-mono mt-1">{item.marketPrice.toLocaleString()} AGP</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}