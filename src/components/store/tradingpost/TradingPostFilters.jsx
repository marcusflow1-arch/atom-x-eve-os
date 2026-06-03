import React from 'react';
import { SlidersHorizontal, Filter, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { CATEGORIES, RARITY_FILTERS } from './tradingPostMock';

// Left-hand filter rail, store-style.
export default function TradingPostFilters({ filters, setFilters, search, setSearch }) {
  const toggleRarity = (r) =>
    setFilters((prev) => ({
      ...prev,
      rarity: prev.rarity.includes(r) ? prev.rarity.filter((x) => x !== r) : [...prev.rarity, r],
    }));

  return (
    <div className="w-64 flex-shrink-0 h-full overflow-y-auto custom-scrollbar pr-1">
      <div
        className="p-5 rounded-2xl h-full"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(30px)',
        }}
      >
        {/* Search */}
        <div className="mb-5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            <Search className="w-4 h-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games..."
              className="bg-transparent border-none outline-none text-white placeholder:text-white/40 text-sm w-full"
            />
          </div>
        </div>

        {/* Categories */}
        <h3 className="text-white font-semibold text-xs mb-3 flex items-center gap-2 uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          Genres
        </h3>
        <div className="space-y-1 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilters((prev) => ({ ...prev, category: cat.id }))}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                filters.category === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="h-px bg-white/10 my-4" />

        {/* Rarity */}
        <h3 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">Rarity</h3>
        <div className="space-y-2 mb-6">
          {RARITY_FILTERS.map((r) => (
            <label key={r} className="flex items-center gap-3 cursor-pointer group p-1 rounded hover:bg-white/5">
              <Checkbox
                checked={filters.rarity.includes(r)}
                onCheckedChange={() => toggleRarity(r)}
                className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
              />
              <span className={`text-sm ${filters.rarity.includes(r) ? 'text-white font-medium' : 'text-slate-400 group-hover:text-white'}`}>
                {r}
              </span>
            </label>
          ))}
        </div>

        <div className="h-px bg-white/10 my-4" />

        {/* Price */}
        <h3 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">Price Range</h3>
        <div className="px-1 mb-2">
          <Slider
            value={filters.priceRange}
            onValueChange={(val) => setFilters((prev) => ({ ...prev, priceRange: val }))}
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

        <button
          onClick={() => setFilters({ category: 'all', rarity: [], priceRange: [0, 10000] })}
          className="w-full mt-4 py-2.5 text-sm text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all font-medium flex items-center justify-center gap-2"
        >
          <Filter className="w-3 h-3" />
          Reset Filters
        </button>
      </div>
    </div>
  );
}