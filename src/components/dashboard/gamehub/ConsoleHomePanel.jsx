import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Settings, Grid3x3, Users, Trophy, Bot, ShoppingBag, ChevronLeft, Play, Radio, Star,
} from 'lucide-react';

// Featured games reused from the dashboard list
const FEATURED = [
  {
    id: 'cyberpunk', title: 'Cyberpunk 2088', tag: 'Continue Playing',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200',
    progress: 72,
  },
  {
    id: 'shadow-realm', title: 'Shadow Realm', tag: 'New Release',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200',
    progress: 0,
  },
];

// Tiles in the right column (console-style "Settings / My games & apps" style)
const SIDE_TILES = [
  { id: 'settings', label: 'Settings', icon: Settings, tint: 'from-emerald-500/25 to-emerald-700/20', iconColor: 'text-emerald-300' },
  { id: 'mygames', label: 'My Games & Apps', icon: Grid3x3, tint: 'from-emerald-500/25 to-emerald-700/20', iconColor: 'text-emerald-300' },
];

// Bottom row of quick-access tiles
const BOTTOM_TILES = [
  { id: 'friends', label: 'Friends', icon: Users, route: 'Friends' },
  { id: 'achievements', label: 'Achievements', icon: Trophy, route: 'Achievements' },
  { id: 'aimode', label: 'AI Mode', icon: Bot, route: 'AIBattle' },
  { id: 'store', label: 'Store', icon: ShoppingBag, route: 'Store' },
];

const MY_GAMES = [
  { id: 'cyberpunk', title: 'Cyberpunk 2088', thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', status: 'Playing' },
  { id: 'neon-legends', title: 'Neon Legends', thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', status: 'In Progress' },
  { id: 'stellar-odyssey', title: 'Stellar Odyssey', thumb: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', status: 'Installed' },
  { id: 'shadow-realm', title: 'Shadow Realm', thumb: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', status: 'New' },
  { id: 'apex-surge', title: 'Apex Surge', thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400', status: 'Installed' },
  { id: 'mythforge', title: 'MythForge Online', thumb: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400', status: 'Playing' },
];

const SETTINGS_ROWS = [
  { label: 'Display & Graphics', icon: Grid3x3 },
  { label: 'Account & Privacy', icon: Users },
  { label: 'Audio', icon: Radio },
  { label: 'System', icon: Settings },
];

function TileCard({ tile, onClick, active }) {
  const Icon = tile.icon;
  return (
    <button
      onClick={onClick}
      className={`relative h-24 rounded-xl overflow-hidden border transition-all duration-300 flex items-center gap-3 px-4 text-left group ${active ? 'border-emerald-400/50' : 'border-white/10 hover:border-white/25'}`}
      style={{ background: `linear-gradient(135deg, ${active ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.04)'}, rgba(8,12,18,0.5))`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${tile.tint} border border-white/10`}>
        <Icon className={`w-5 h-5 ${tile.iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-white text-sm font-bold truncate">{tile.label}</p>
        <p className="text-white/40 text-[9px] uppercase tracking-wider mt-0.5">Open</p>
      </div>
    </button>
  );
}

function SubView({ title, onBack, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center gap-2 px-1 pb-3 flex-shrink-0">
        <button onClick={onBack} className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-white/70" />
        </button>
        <h3 className="text-white text-sm font-bold tracking-wider uppercase">{title}</h3>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">{children}</div>
    </motion.div>
  );
}

export default function ConsoleHomePanel({ onOpenGame }) {
  const navigate = useNavigate();
  const [view, setView] = useState(null); // null | 'settings' | 'mygames'

  // Escape closes the active sub-view (handled locally since it's this panel's state)
  useEffect(() => {
    if (!view) return;
    const onKey = (e) => { if (e.key === 'Escape') setView(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view]);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Featured label */}
      <div className="flex items-center gap-2 px-1 flex-shrink-0">
        <Star className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Featured</span>
        <div className="flex-1 h-px bg-white/8 ml-1" />
      </div>

      <div className="flex-1 min-h-0 flex gap-3">
        {/* Hero featured game (left/center) */}
        <button
          onClick={() => onOpenGame?.(FEATURED[0])}
          className="relative flex-1 min-w-0 rounded-xl overflow-hidden border border-white/10 group text-left"
        >
          <img src={FEATURED[0].image} alt={FEATURED[0].title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,10,17,0.20) 0%, rgba(7,10,17,0.55) 55%, rgba(7,10,17,0.95) 100%)' }} />
          <div className="absolute top-3 left-3">
            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white/80 border border-white/15" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>{FEATURED[0].tag}</span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-lg truncate">{FEATURED[0].title}</h2>
              <p className="text-[10px] text-white/60 mt-1">{FEATURED[0].progress}% complete</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-black text-[10px] font-black shadow-lg"><Play className="w-2.5 h-2.5 fill-current" /> Play</span>
              <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-purple-200 border border-purple-400/40" style={{ background: 'rgba(126,34,206,0.25)', backdropFilter: 'blur(8px)' }}><Radio className="w-2.5 h-2.5" /> Stream</span>
            </div>
          </div>
        </button>

        {/* Right column: side tiles + a secondary featured card */}
        <div className="w-44 flex-shrink-0 flex flex-col gap-3">
          {SIDE_TILES.map(t => (
            <TileCard key={t.id} tile={t} active={view === t.id} onClick={() => setView(t.id)} />
          ))}
          <button
            onClick={() => onOpenGame?.(FEATURED[1])}
            className="relative flex-1 min-h-0 rounded-xl overflow-hidden border border-white/10 group text-left"
          >
            <img src={FEATURED[1].image} alt={FEATURED[1].title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,10,17,0.15) 0%, rgba(7,10,17,0.85) 100%)' }} />
            <div className="absolute bottom-2.5 left-3 right-3">
              <span className="text-[8px] font-black uppercase tracking-widest text-cyan-300">{FEATURED[1].tag}</span>
              <p className="text-white text-sm font-bold truncate drop-shadow-md">{FEATURED[1].title}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom row of quick-access tiles */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-3">
        {BOTTOM_TILES.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => navigate(createPageUrl(t.route))}
              className="h-16 rounded-xl border border-white/10 hover:border-white/25 flex flex-col items-center justify-center gap-1 transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              <Icon className="w-5 h-5 text-white/80" />
              <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* In-panel sub-views swapped by side tiles */}
      <AnimatePresence>
        {view && (
          <div className="absolute inset-0 z-20 rounded-xl overflow-hidden" style={{ background: 'rgba(8,12,18,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="h-full p-3">
              {view === 'settings' && (
                <SubView title="Settings" onBack={() => setView(null)}>
                  <div className="space-y-2">
                    {SETTINGS_ROWS.map((r) => {
                      const Icon = r.icon;
                      return (
                        <div key={r.label} className="flex items-center gap-3 p-3 rounded-lg border border-white/8 hover:border-white/20 transition-colors" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <Icon className="w-4 h-4 text-emerald-300" />
                          <span className="text-white/85 text-xs font-semibold">{r.label}</span>
                          <ChevronLeft className="w-4 h-4 text-white/30 ml-auto rotate-180" />
                        </div>
                      );
                    })}
                  </div>
                </SubView>
              )}
              {view === 'mygames' && (
                <SubView title="My Games & Apps" onBack={() => setView(null)}>
                  <div className="grid grid-cols-3 gap-2.5">
                    {MY_GAMES.map(g => (
                      <button
                        key={g.id}
                        onClick={() => onOpenGame?.(g)}
                        className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/50 transition-colors group text-left"
                      >
                        <img src={g.thumb} alt={g.title} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400" />
                        <div className="absolute bottom-1.5 left-1.5 right-1.5">
                          <p className="text-white text-[10px] font-bold truncate drop-shadow-md">{g.title}</p>
                          <p className="text-white/50 text-[8px] truncate">{g.status}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </SubView>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}