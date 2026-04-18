import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChevronRight, Layers, X, Gamepad2, Lightbulb, Search } from 'lucide-react';
import { MOCK_DEVELOPERS } from './devEdition/mockDevData';
import DevStudioHero from './devEdition/DevStudioHero';
import DevCurrentProject from './devEdition/DevCurrentProject';
import DevLogFeed from './devEdition/DevLogFeed';
import DevGamesAndCards from './devEdition/DevGamesAndCards';



const TABS = [
  { id: 'cards', label: 'Cards', icon: Layers },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'insight', label: 'Developer Insight', icon: Lightbulb },
];

function DeveloperCard({ dev, isSelected, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      onClick={onClick}
      className={`group aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border shadow-lg relative bg-slate-900 transition-all ${
        isSelected
          ? 'border-cyan-400/60 shadow-cyan-500/20'
          : 'border-white/8 hover:border-cyan-400/30'
      }`}
    >
      {/* Banner as full background */}
      <img
        src={dev.banner_url}
        alt={dev.studio_name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

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

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end gap-2">
        <img
          src={dev.avatar_url}
          alt={dev.studio_name}
          className="w-8 h-8 rounded-lg object-cover border border-white/20 flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-white font-bold text-sm leading-tight truncate">{dev.studio_name}</h4>
          <div className="flex items-center justify-between text-xs mt-0.5">
            <span className="text-white/40">{dev.genres?.[0]}</span>
            <span className="text-cyan-400 font-bold">{dev.total_cards} cards</span>
          </div>
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-cyan-400 rounded-xl pointer-events-none" />
      )}

      {/* Hover chevron */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-white/60" />
      </div>
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