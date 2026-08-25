// QuickAccessPanel.jsx — Quick access toggles for the game slide panel
import React from 'react';
import { Star, Sparkles, Clock, Tag, ChevronRight } from 'lucide-react';
import { QUICK_ACCESS } from './storefrontData';

const ICONS = { Star, Sparkles, Clock, Tag };

export default function QuickAccessPanel({ onSelect, activeId }) {
  return (
    <div className="relative h-full flex flex-col rounded-2xl p-4 border border-white/[0.12] overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
      }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <h3 className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3">Quick Access</h3>
      <div className="flex flex-col gap-2 flex-1">
        {QUICK_ACCESS.map(item => {
          const Icon = ICONS[item.icon] || Star;
          const active = activeId === item.id;
          return (
            <button key={item.id} onClick={() => onSelect?.(item.id)}
              aria-pressed={active}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left flex-1 overflow-hidden ${active ? 'bg-white/[0.07] border-white/[0.16]' : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07]'}`}
              style={{ boxShadow: active ? `0 0 16px ${item.color}22, inset 0 1px 0 rgba(255,255,255,0.06)` : 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${item.color}55`; e.currentTarget.style.boxShadow = `0 0 16px ${item.color}33, inset 0 1px 0 rgba(255,255,255,0.06)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = active ? 'rgba(255,255,255,0.16)' : ''; e.currentTarget.style.boxShadow = active ? `0 0 16px ${item.color}22, inset 0 1px 0 rgba(255,255,255,0.06)` : 'inset 0 1px 0 rgba(255,255,255,0.06)'; }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}24`, border: `1px solid ${item.color}55`, boxShadow: `0 0 12px ${item.color}40` }}>
                <Icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-sm font-semibold truncate">{item.label}</div>
                <div className="text-white/40 text-[10px] truncate">{item.sub}</div>
              </div>
              <ChevronRight className={`w-4 h-4 transition-colors ${active ? 'text-white/60' : 'text-white/20 group-hover:text-white/50'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}