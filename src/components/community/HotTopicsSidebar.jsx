import React from 'react';
import { Flame, TrendingUp, Lightbulb, Sparkles } from 'lucide-react';

const HOT_ITEMS = [
  { id: 'hot', label: 'Hot Topics', icon: Flame },
  { id: 'trending', label: 'Trending Posts', icon: TrendingUp },
  { id: 'to_know', label: 'To Know Posts', icon: Lightbulb },
  { id: 'tips', label: 'Tips & Tricks', icon: Sparkles },
];

export default function HotTopicsSidebar({ selected, onSelect }) {
  return (
    <div className="w-full space-y-3">
      <h2 className="text-sm font-bold text-white/40 tracking-wide uppercase px-2">Hot Topics</h2>
      <div className="flex flex-col gap-1">
        {HOT_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = selected === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect?.(item.id)}
              className={`flex items-center gap-3 px-2 py-3 transition-all text-left group relative rounded-md ${
                isActive ? 'text-cyan-400 bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-white/40 group-hover:text-white'}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}