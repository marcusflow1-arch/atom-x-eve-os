import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Zap, Shield, User, Trees, ChevronLeft, ChevronRight, Trophy, Package } from 'lucide-react';

const TYPE_CONFIG = {
  ability:     { icon: Zap,    color: '#22d3ee' },
  equipment:   { icon: Shield, color: '#a78bfa' },
  companion:   { icon: User,   color: '#4ade80' },
  environment: { icon: Trees,  color: '#fbbf24' },
  standard:    { icon: Trophy, color: '#94a3b8' },
};

const FILTERS = ['ALL', 'ABILITY', 'EQUIPMENT', 'COMPANION', 'ENVIRONMENT'];
const FILTER_COLORS = { ALL: '#fff', ABILITY: '#22d3ee', EQUIPMENT: '#a78bfa', COMPANION: '#4ade80', ENVIRONMENT: '#fbbf24' };

function AchCard({ ach }) {
  const key = (ach.category || 'standard').toLowerCase();
  const cfg = TYPE_CONFIG[key] || TYPE_CONFIG.standard;
  const Icon = cfg.icon;

  return (
    <motion.div whileHover={{ scale: 1.06, y: -2 }} className="flex-shrink-0 w-[68px] cursor-default">
      <div
        className="flex flex-col items-center justify-between rounded-xl overflow-hidden transition-all px-1 py-1.5"
        style={{ height: 82, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
      >
        <p className="text-[7px] font-bold text-white/80 leading-tight text-center w-full truncate">{ach.title || '—'}</p>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: `${cfg.color}18`, boxShadow: `0 0 8px ${cfg.color}28` }}
        >
          {ach.icon
            ? <span className="text-sm leading-none">{ach.icon}</span>
            : <Icon style={{ color: cfg.color }} className="w-3.5 h-3.5" />
          }
        </div>
        <p className="text-[6px] font-semibold leading-tight text-center w-full truncate" style={{ color: cfg.color }}>
          {ach.rarity || 'Standard'}
        </p>
      </div>
    </motion.div>
  );
}

export default function StoreAchievementsStrip() {
  const [achievements, setAchievements] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showDlc, setShowDlc] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    base44.entities.Achievement.list('-created_date', 20).then(res => {
      setAchievements(res?.data || res || []);
    }).catch(() => {});
  }, []);

  const handleWheel = useCallback((e) => {
    if (!scrollRef.current) return;
    e.preventDefault();
    scrollRef.current.scrollBy({ left: e.deltaY < 0 ? 200 : -200, behavior: 'smooth' });
  }, []);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  const placeholders = Array.from({ length: 10 }).map((_, i) => ({
    id: `ph-${i}`, title: '—', category: ['ability','equipment','companion','environment'][i % 4], rarity: 'Common', _ph: true
  }));

  const source = achievements.length > 0 ? achievements : placeholders;

  const filtered = activeFilter === 'ALL'
    ? source
    : source.filter(a => (a.category || '').toLowerCase() === activeFilter.toLowerCase());

  const row1 = filtered.filter((_, i) => i % 2 === 0);
  const row2 = filtered.filter((_, i) => i % 2 === 1);

  return (
    <div className="h-full flex flex-col overflow-hidden px-1 pt-2 pb-1">
      {/* Title */}
      <div className="flex flex-col items-center gap-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="text-[11px] font-bold text-white tracking-wider">Achievement Cards</h3>
        </div>
        <div className="w-20 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)' }} />
      </div>

      {/* DLC toggle */}
      <div className="flex items-center justify-center mb-1.5">
        <button
          onClick={() => setShowDlc(v => !v)}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider transition-all"
          style={showDlc
            ? { background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.4)', color: '#fb923c' }
            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
          }
        >
          <Package className="w-2 h-2" />
          DLC
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center justify-center flex-wrap gap-1 mb-2">
        {FILTERS.map(f => {
          const isActive = activeFilter === f;
          const c = FILTER_COLORS[f];
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider transition-all"
              style={isActive
                ? { background: `${c}20`, border: `1px solid ${c}50`, color: c }
                : { background: 'transparent', border: '1px solid transparent', color: 'rgba(255,255,255,0.3)' }
              }
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Two-row scrollable grid */}
      <div className="relative flex-1 min-h-0 group/strip" onWheel={handleWheel}>
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover/strip:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ChevronLeft className="w-3 h-3 text-white/70" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover/strip:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ChevronRight className="w-3 h-3 text-white/70" />
        </button>

        <div
          ref={scrollRef}
          className="flex flex-col gap-1.5 overflow-x-auto px-3 h-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-2">
            {row1.map((ach, i) => (
              ach._ph
                ? <div key={ach.id} className="flex-shrink-0 w-[68px] h-[82px] rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
                : <AchCard key={ach.id || i} ach={ach} />
            ))}
          </div>
          <div className="flex gap-2">
            {row2.map((ach, i) => (
              ach._ph
                ? <div key={ach.id} className="flex-shrink-0 w-[68px] h-[82px] rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
                : <AchCard key={ach.id || i} ach={ach} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-4 text-white/25 text-[10px]">No cards found</div>
          )}
        </div>
      </div>
    </div>
  );
}