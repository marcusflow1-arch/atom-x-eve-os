// GenreSidebar.jsx — Discover / genre nav column + Luna AI footer card
import React from 'react';
import {
  Swords, Crosshair, Skull, Gamepad2, Shield, Car, Sparkles, Rocket,
  Compass, Trophy, Monitor, ChevronRight, Search, Clock, Tag, Gift,
} from 'lucide-react';
import { GENRE_LIST, TOP_NAV_GENRES } from './storefrontData';

const ICONS = { Swords, Crosshair, Skull, Gamepad2, Shield, Car, Sparkles, Rocket, Compass, Trophy, Monitor };

const TOP_ICONS = {
  'Discover': Search, 'All Games': Gamepad2, 'Trending': Sparkles, 'New Releases': Gift,
  'Top Rated': Trophy, 'Coming Soon': Clock, 'Free to Play': Gift, 'Special Offers': Tag,
};

export default function GenreSidebar({ active, onSelect }) {
  return (
    <div className="relative h-full flex flex-col rounded-2xl border border-white/[0.12] overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
      }}>
      <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'none' }}>
        {/* Top nav */}
        <div className="space-y-1 mb-4">
          {TOP_NAV_GENRES.map((label, i) => {
            const Icon = TOP_ICONS[label] || Gamepad2;
            const isActive = active === label || (i === 0 && !active);
            return (
              <button key={label} onClick={() => onSelect?.(label)}
                className={`group relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-300 overflow-hidden ${
                  isActive
                    ? 'text-white border border-cyan-300/40'
                    : 'text-white/55 hover:text-white hover:bg-white/[0.05] border border-transparent'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(110deg, rgba(34,211,238,0.22) 0%, rgba(99,102,241,0.16) 55%, rgba(168,85,247,0.12) 100%)',
                  boxShadow: '0 0 18px rgba(34,211,238,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                } : undefined}
              >
                {/* Vibrant left accent bar + glow on active */}
                {isActive && (
                  <>
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-cyan-300" style={{ boxShadow: '0 0 10px rgba(34,211,238,0.9)' }} />
                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-cyan-400/20 blur-xl pointer-events-none" />
                  </>
                )}
                <Icon className={`w-4 h-4 flex-shrink-0 relative z-10 ${isActive ? 'text-cyan-200 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]' : ''}`} />
                <span className="text-xs font-semibold flex-1 relative z-10">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 relative z-10 text-cyan-200" />}
              </button>
            );
          })}
        </div>

        {/* Genres header */}
        <div className="px-3 mb-2">
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Genres</span>
        </div>
        <div className="space-y-0.5">
          {GENRE_LIST.map(g => {
            const Icon = ICONS[g.icon] || Gamepad2;
            return (
              <button key={g.id} onClick={() => onSelect?.(g.id)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left text-white/50 hover:text-white hover:bg-white/[0.04] transition-all">
                <Icon className="w-3.5 h-3.5 flex-shrink-0 text-white/30" />
                <span className="text-[11px] font-medium">{g.label}</span>
              </button>
            );
          })}
          <button className="w-full text-center py-2 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider hover:text-cyan-200">View All Genres</button>
        </div>
      </div>

      {/* Luna AI footer card */}
      <div className="p-3 flex-shrink-0">
        <button className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-purple-400/20 group"
          style={{ background: 'linear-gradient(110deg, rgba(168,85,247,0.18), rgba(99,102,241,0.1))' }}>
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
            <img src="https://images.unsplash.com/photo-1635805737707-575885ab0820?w=80&h=80&fit=crop" alt="Luna AI" className="w-full h-full object-cover" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-white text-xs font-bold">LUNA AI</div>
            <div className="text-white/45 text-[9px]">Your AI Companion</div>
          </div>
        </button>
      </div>
    </div>
  );
}