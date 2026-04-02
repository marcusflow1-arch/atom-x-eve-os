import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Zap, Shield, Users, Map, Star, Package, Trophy } from 'lucide-react';

// Category icon config — outline style lucide icons
const TYPE_CONFIG = {
  ability:     { icon: Zap,     color: '#22d3ee', label: 'Ability' },
  equipment:   { icon: Shield,  color: '#a78bfa', label: 'Equip' },
  companion:   { icon: Users,   color: '#4ade80', label: 'Companion' },
  environment: { icon: Map,     color: '#fbbf24', label: 'Env' },
  standard:    { icon: Star,    color: '#94a3b8', label: 'Standard' },
  emoji:       { icon: Star,    color: '#f472b6', label: 'Emoji' },
  dance:       { icon: Zap,     color: '#fb923c', label: 'Dance' },
  hidden:      { icon: Trophy,  color: '#e879f9', label: 'Hidden' },
};

const FILTERS = ['ALL', 'ABILITY', 'EQUIPMENT', 'COMPANION', 'ENVIRONMENT'];
const FILTER_COLORS = { ALL: '#fff', ABILITY: '#22d3ee', EQUIPMENT: '#a78bfa', COMPANION: '#4ade80', ENVIRONMENT: '#fbbf24' };

function AchCard({ ach }) {
  const key = (ach.category || 'standard').toLowerCase();
  const cfg = TYPE_CONFIG[key] || TYPE_CONFIG.standard;
  const Icon = cfg.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex-shrink-0 w-full cursor-default"
    >
      <div
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'transparent', border: `1px solid ${cfg.color}55` }}
        >
          {ach.icon
            ? <span className="text-sm leading-none">{ach.icon}</span>
            : <Icon style={{ color: cfg.color }} className="w-4 h-4" strokeWidth={1.5} />
          }
        </div>
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-white/85 leading-tight truncate">{ach.title || '—'}</p>
          <p className="text-[7px] leading-tight truncate mt-0.5" style={{ color: cfg.color }}>{ach.rarity || cfg.label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function StoreAchievementsStrip({ currentGame }) {
  const [allAchievements, setAllAchievements] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showDlc, setShowDlc] = useState(false);

  useEffect(() => {
    base44.entities.Achievement.list('-created_date', 100).then(res => {
      setAllAchievements(res?.data || res || []);
    }).catch(() => {});
  }, []);

  const gameName = currentGame?.title || null;

  // Filter by current game if available
  const gameAchs = gameName
    ? allAchievements.filter(a => a.game === gameName)
    : allAchievements;

  // DLC vs base
  const baseAchs = gameAchs.filter(a => a.category !== 'hidden');
  // For DLC, show hidden/secret achievements as a proxy — or all if none
  const dlcAchs = gameAchs.filter(a => a.category === 'hidden');

  const source = showDlc ? (dlcAchs.length > 0 ? dlcAchs : gameAchs) : baseAchs.length > 0 ? baseAchs : gameAchs;

  const filtered = activeFilter === 'ALL'
    ? source
    : source.filter(a => (a.category || '').toLowerCase() === activeFilter.toLowerCase());

  // 5 per row, two rows = 10 visible, then scroll
  const row1 = filtered.filter((_, i) => i % 2 === 0).slice(0, 5);
  const row2 = filtered.filter((_, i) => i % 2 === 1).slice(0, 5);

  const displayTitle = gameName ? `${gameName} Cards` : 'Achievement Cards';

  return (
    <div className="h-full flex flex-col overflow-hidden px-2 pt-2 pb-1">
      {/* Title — animates when game changes */}
      <div className="flex flex-col items-center gap-1 mb-1.5 flex-shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={displayTitle}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5"
          >
            <Trophy className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <h3 className="text-[11px] font-bold text-white tracking-wider truncate max-w-[180px]">{displayTitle}</h3>
          </motion.div>
        </AnimatePresence>
        <div className="w-24 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)' }} />
      </div>

      {/* DLC toggle */}
      <div className="flex items-center justify-center mb-1.5 flex-shrink-0">
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
      <div className="flex items-center justify-center flex-wrap gap-1 mb-2 flex-shrink-0">
        {FILTERS.map(f => {
          const isActive = activeFilter === f;
          const c = FILTER_COLORS[f];
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-2 py-0.5 rounded-full text-[7px] font-bold tracking-wider transition-all"
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

      {/* Two columns of 5, vertically scrollable */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {/* Interleave row1 and row2 so they appear column-like */}
          {Array.from({ length: Math.max(row1.length, row2.length) }).map((_, i) => (
            <React.Fragment key={i}>
              {row1[i] ? (
                row1[i]._ph
                  ? <div className="h-[44px] rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
                  : <AchCard ach={row1[i]} />
              ) : <div />}
              {row2[i] ? (
                row2[i]._ph
                  ? <div className="h-[44px] rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
                  : <AchCard ach={row2[i]} />
              ) : <div />}
            </React.Fragment>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-4 text-white/25 text-[10px]">No achievements found</div>
          )}
        </div>
      </div>
    </div>
  );
}