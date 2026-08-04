import React from 'react';
import { Eye } from 'lucide-react';
import { formatViewers } from '../aura/streamerMockData';

/** Horizontal category (game) rail — the way people browse on Twitch. */
export default function DiscoverCategoryRail({ categories = [], activeCategory, onSelect }) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
      <button
        onClick={() => onSelect?.(null)}
        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
          !activeCategory
            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
        }`}
      >
        All Categories
      </button>

      {categories.map((c) => {
        const active = activeCategory === c.title;
        return (
          <button
            key={c.title}
            onClick={() => onSelect?.(c.title)}
            className={`group flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl border whitespace-nowrap transition-all ${
              active
                ? 'bg-cyan-500/20 border-cyan-400/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <img src={c.image} alt={c.title} className="w-9 h-12 rounded-lg object-cover border border-white/10" />
            <span className="text-left">
              <span className={`block text-xs font-bold ${active ? 'text-cyan-200' : 'text-white'}`}>{c.title}</span>
              <span className="block text-[10px] text-white/50 inline-flex items-center gap-1">
                <Eye className="w-2.5 h-2.5" /> {formatViewers(c.viewers)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}