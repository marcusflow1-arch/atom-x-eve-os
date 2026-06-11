// QuickAccessPanel.jsx — Quick access tiles next to the hero
import React from 'react';
import { Star, Sparkles, Clock, Tag, ChevronRight } from 'lucide-react';
import { QUICK_ACCESS } from './storefrontData';

const ICONS = { Star, Sparkles, Clock, Tag };

export default function QuickAccessPanel({ onSelect }) {
  return (
    <div className="h-full flex flex-col rounded-2xl p-4 border border-white/10"
      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
      <h3 className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3">Quick Access</h3>
      <div className="flex flex-col gap-2 flex-1">
        {QUICK_ACCESS.map(item => {
          const Icon = ICONS[item.icon] || Star;
          return (
            <button key={item.id} onClick={() => onSelect?.(item.id)}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all text-left flex-1">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}1f`, border: `1px solid ${item.color}40` }}>
                <Icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-sm font-semibold truncate">{item.label}</div>
                <div className="text-white/40 text-[10px] truncate">{item.sub}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}