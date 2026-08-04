import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Hammer, Layers, Zap, X } from 'lucide-react';
import CardRecordView from './cardDetail/CardRecordView';
import ForgeView from './cardDetail/ForgeView';
import AbilityMatrixView from './cardDetail/AbilityMatrixView';
import { getRarity } from './cardDetail/rarityTheme';

const TABS = [
  { id: 'overview', label: 'Record', icon: Info, accent: '#22d3ee' },
  { id: 'blacksmith', label: 'Forge', icon: Hammer, accent: '#fb923c' },
  { id: 'skilltree', label: 'Skills', icon: Layers, accent: '#c084fc' },
];

export default function CardEnhancementOverlay({ card, onClose }) {
  const [viewMode, setViewMode] = useState('overview');
  const r = getRarity(card?.rarity);
  const activeTab = TABS.find((t) => t.id === viewMode);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50"
      style={{ background: 'rgba(6,10,16,0.94)', backdropFilter: 'blur(30px) saturate(140%)' }}
    >
      {/* Ambient rarity wash */}
      <div className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: `radial-gradient(circle at 20% 0%, ${r.glow}, transparent 55%), radial-gradient(circle at 85% 100%, ${activeTab.accent}22, transparent 55%)` }} />

      <div data-card-overlay="true" className="relative w-full h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 flex-shrink-0"
          style={{ background: 'rgba(148,163,184,0.05)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Power</span>
              <span className="text-white font-black text-xl tabular-nums">337</span>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-gradient-to-r ${r.grad} text-black/80`}>
              {card?.rarity || 'Common'}
            </span>
            <span className="text-white/50 text-sm truncate hidden md:inline">{card?.title}</span>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {TABS.map((tab) => {
              const on = viewMode === tab.id;
              return (
                <button key={tab.id} onClick={() => setViewMode(tab.id)}
                  className={`relative py-2 px-5 rounded-full text-xs font-black tracking-wide flex items-center gap-2 transition-colors ${on ? 'text-black' : 'text-white/45 hover:text-white'}`}>
                  {on && <motion.div layoutId="card-tab-pill" className="absolute inset-0 rounded-full" style={{ background: tab.accent }} transition={{ type: 'spring', damping: 26, stiffness: 320 }} />}
                  <tab.icon className="w-3.5 h-3.5 relative" />
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {viewMode === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="min-h-full">
                <CardRecordView card={card} />
              </motion.div>
            )}
            {viewMode === 'blacksmith' && (
              <motion.div key="blacksmith" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                <ForgeView card={card} />
              </motion.div>
            )}
            {viewMode === 'skilltree' && (
              <motion.div key="skilltree" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                <AbilityMatrixView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}