import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Filter, Grid, Globe, Sword, Shield, Zap, Sparkles, ScrollText, Hammer, Database } from "lucide-react";

export default function ProFilterSidebar({ filters, setFilters }) {
  const categories = [
    { id: 'all', label: 'All Items', icon: Grid },
    { id: 'global', label: 'Global', icon: Globe },
    { id: 'weapon', label: 'Weapons & Tools', icon: Sword },
    { id: 'armor', label: 'Armor & Suits', icon: Shield },
    { id: 'tech', label: 'Tech & Cyberware', icon: Zap },
    { id: 'magic', label: 'Spells & Tomes', icon: Sparkles },
    { id: 'blueprint', label: 'Blueprints', icon: ScrollText },
    { id: 'material', label: 'Raw Materials', icon: Hammer },
    { id: 'consumable', label: 'Consumables', icon: Database },
  ];

  const toggleRarity = (r) => {
    setFilters(prev => ({
      ...prev,
      rarity: prev.rarity.includes(r) ? prev.rarity.filter(x => x !== r) : [...prev.rarity, r]
    }));
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-lg h-full overflow-y-auto custom-scrollbar">
      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2 uppercase tracking-wider">
          <Grid className="w-4 h-4 text-cyan-400" />
          Categories
        </h3>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                filters.category === cat.id 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <cat.icon className={`w-4 h-4 ${filters.category === cat.id ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Rarity */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Rarity</h3>
        <div className="space-y-2">
          {['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'].map((rarity) => (
            <label key={rarity} className="flex items-center gap-3 cursor-pointer group p-1 rounded hover:bg-white/5">
              <Checkbox 
                checked={filters.rarity.includes(rarity)}
                onCheckedChange={() => toggleRarity(rarity)}
                className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
              />
              <span className={`text-sm transition-colors ${filters.rarity.includes(rarity) ? 'text-white font-medium' : 'text-slate-400 group-hover:text-white'}`}>
                {rarity}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/10 my-4" />

      {/* Value Range */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Value Range</h3>
        <div className="px-1">
          <Slider
            value={filters.priceRange}
            onValueChange={(val) => setFilters(prev => ({ ...prev, priceRange: val }))}
            max={10000}
            min={0}
            step={100}
            className="mb-3"
          />
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>{filters.priceRange[0]} AGP</span>
            <span>{filters.priceRange[1]} AGP</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setFilters({ category: 'all', rarity: [], priceRange: [0, 10000] })}
        className="w-full mt-6 py-3 text-sm text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all font-medium flex items-center justify-center gap-2"
      >
        <Filter className="w-3 h-3" />
        Reset Filters
      </button>
    </div>
  );
}