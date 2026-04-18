import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Radio, Users, Layers, X, Gamepad2, Lightbulb, Search } from 'lucide-react';
import { MOCK_DEVELOPERS } from './devEdition/mockDevData';
import DevStudioHero from './devEdition/DevStudioHero';
import DevCurrentProject from './devEdition/DevCurrentProject';
import DevLogFeed from './devEdition/DevLogFeed';
import DevGamesAndCards from './devEdition/DevGamesAndCards';

const RARITY_PALETTE = {
  Solo: { bg: 'from-violet-900/60 to-indigo-900/40', border: 'border-violet-400/30', glow: 'rgba(139,92,246,0.25)', badge: 'bg-violet-500/20 text-violet-300' },
  'Indie (2-5)': { bg: 'from-cyan-900/60 to-blue-900/40', border: 'border-cyan-400/30', glow: 'rgba(34,211,238,0.25)', badge: 'bg-cyan-500/20 text-cyan-300' },
  'Small Studio (6-20)': { bg: 'from-amber-900/60 to-orange-900/40', border: 'border-amber-400/30', glow: 'rgba(245,158,11,0.25)', badge: 'bg-amber-500/20 text-amber-300' },
  'Mid Studio (21-100)': { bg: 'from-emerald-900/60 to-green-900/40', border: 'border-emerald-400/30', glow: 'rgba(52,211,153,0.25)', badge: 'bg-emerald-500/20 text-emerald-300' },
  'AAA (100+)': { bg: 'from-rose-900/60 to-pink-900/40', border: 'border-rose-400/30', glow: 'rgba(251,113,133,0.25)', badge: 'bg-rose-500/20 text-rose-300' },
};

const TABS = [
  { id: 'cards', label: 'Cards', icon: Layers },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'insight', label: 'Developer Insight', icon: Lightbulb },
];

function DeveloperCard({ dev, isSelected, onClick }) {
  const palette = RARITY_PALETTE[dev.team_size] || RARITY_PALETTE['Indie (2-5)'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-2xl border-2 overflow-hidden flex flex-col transition-all duration-300 bg-gradient-to-b ${palette.bg} ${palette.border} ${
        isSelected ? 'ring-2 ring-offset-1 ring-offset-transparent ring-cyan-400 shadow-2xl' : 'hover:border-opacity-60'
      }`}
      style={{
        boxShadow: isSelected
          ? `0 0 0 2px rgba(34,211,238,0.6), 0 12px 40px ${palette.glow}`
          : `0 4px 20px ${palette.glow}`,
        aspectRatio: '3/4',
      }}
    >
      {/* Banner image top half */}
      <div className="relative flex-1 overflow-hidden">
        <img
          src={dev.banner_url}
          alt={dev.studio_name}
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />

        {/* Live badge */}
        {dev.is_live && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}

        {/* Verified */}
        {dev.verified && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="w-4 h-4 text-cyan-400 drop-shadow-lg" />
          </div>
        )}

        {/* Avatar centered */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
          <div className="w-12 h-12 rounded-xl border-2 border-white/20 overflow-hidden shadow-xl">
            <img src={dev.avatar_url} alt={dev.studio_name} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Info bottom section */}
      <div className="pt-8 pb-3 px-3 text-center space-y-1 bg-black/40 backdrop-blur-sm">
        <p className="text-white font-bold text-xs leading-tight truncate">{dev.studio_name}</p>
        <p className="text-white/40 text-[9px] truncate">{dev.tagline}</p>
        <div className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full ${palette.badge}`}>
          {dev.team_size}
        </div>
        <div className="flex items-center justify-center gap-2 text-[9px] text-white/40 pt-0.5">
          <span>{dev.total_games}🎮</span>
          <span>{dev.total_cards}🃏</span>
          <span>{(dev.followers / 1000).toFixed(1)}k</span>
        </div>
      </div>

      {/* Selected glow border overlay */}
      {isSelected && (
        <motion.div
          layoutId="devCardSelected"
          className="absolute inset-0 border-2 border-cyan-400 rounded-2xl pointer-events-none"
        />
      )}
    </motion.div>
  );
}

export default function DevEditionContent() {
  const [selectedDev, setSelectedDev] = useState(null);
  const [activeTab, setActiveTab] = useState('cards');
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? MOCK_DEVELOPERS.filter(d =>
        d.studio_name.toLowerCase().includes(search.toLowerCase()) ||
        d.genres?.some(g => g.toLowerCase().includes(search.toLowerCase()))
      )
    : MOCK_DEVELOPERS;

  const handleSelect = (dev) => {
    setSelectedDev(prev => prev?.id === dev.id ? null : dev);
    setActiveTab('cards');
  };

  return (
    <div className="flex h-full min-h-0 gap-0 relative">

      {/* ── LEFT: Full-page Developer Card Grid ── */}
      <div
        className={`transition-all duration-500 flex flex-col h-full overflow-hidden ${
          selectedDev ? 'w-[320px] flex-shrink-0' : 'flex-1'
        }`}
      >
        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search developers..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X className="w-3.5 h-3.5 text-white/40 hover:text-white" />
            </button>
          )}
        </div>

        {/* Card Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className={`grid gap-4 ${
            selectedDev
              ? 'grid-cols-2'
              : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
          }`}>
            {filtered.map((dev, idx) => (
              <DeveloperCard
                key={dev.id}
                dev={dev}
                isSelected={selectedDev?.id === dev.id}
                onClick={() => handleSelect(dev)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Dev Detail Panel (slides in) ── */}
      <AnimatePresence>
        {selectedDev && (
          <motion.div
            key={selectedDev.id}
            initial={{ opacity: 0, x: 40, width: 0 }}
            animate={{ opacity: 1, x: 0, width: '100%' }}
            exit={{ opacity: 0, x: 40, width: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="flex-1 min-w-0 flex flex-col h-full overflow-hidden border-l border-white/10"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Panel Header with tabs + close */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <img src={selectedDev.avatar_url} alt={selectedDev.studio_name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">{selectedDev.studio_name}</p>
                  <p className="text-white/40 text-xs truncate">{selectedDev.tagline}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Close */}
              <button
                onClick={() => setSelectedDev(null)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all flex-shrink-0"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedDev.id}-${activeTab}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {activeTab === 'cards' && (
                    <DevGamesAndCards
                      games={selectedDev.games}
                      developerName={selectedDev.studio_name}
                      showCardsOnly
                    />
                  )}
                  {activeTab === 'games' && (
                    <DevGamesAndCards
                      games={selectedDev.games}
                      developerName={selectedDev.studio_name}
                      showGamesOnly
                    />
                  )}
                  {activeTab === 'insight' && (
                    <>
                      <DevStudioHero developer={selectedDev} />
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        <DevCurrentProject project={selectedDev.current_project} />
                        <DevLogFeed logs={selectedDev.devlog} />
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}