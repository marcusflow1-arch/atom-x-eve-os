import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { MOCK_DEVELOPERS } from './devEdition/mockDevData';
import DevSidebar from './devEdition/DevSidebar';
import DevStudioHero from './devEdition/DevStudioHero';
import DevCurrentProject from './devEdition/DevCurrentProject';
import DevLogFeed from './devEdition/DevLogFeed';
import DevGamesAndCards from './devEdition/DevGamesAndCards';

export default function DevEditionContent() {
  const [selectedDev, setSelectedDev] = useState(MOCK_DEVELOPERS[0]);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? MOCK_DEVELOPERS.filter(d =>
        d.studio_name.toLowerCase().includes(search.toLowerCase()) ||
        d.genres?.some(g => g.toLowerCase().includes(search.toLowerCase()))
      )
    : MOCK_DEVELOPERS;

  return (
    <div className="flex gap-6 min-h-0 pt-4 pb-8">
      {/* Left Sidebar — Developer List (20%) */}
      <div className="w-[20%] flex-shrink-0 space-y-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
          <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search developers..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
          />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-white/40 hover:text-white" /></button>}
        </div>

        <DevSidebar
          developers={filtered}
          selectedId={selectedDev?.id}
          onSelect={setSelectedDev}
        />

        {/* Promo blurb */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">Why buy Dev Cards?</p>
          <p className="text-white/40 text-xs leading-relaxed">
            Dev edition cards are created by the game's original developers. Owning them supports the studio directly and unlocks exclusive in-game perks.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-y-auto space-y-6 pr-1">
        <AnimatePresence mode="wait">
          {selectedDev && (
            <motion.div
              key={selectedDev.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Hero Section */}
              <DevStudioHero developer={selectedDev} />

              {/* Current Project + Dev Log side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DevCurrentProject project={selectedDev.current_project} />
                <DevLogFeed logs={selectedDev.devlog} />
              </div>

              {/* Games & Cards */}
              <DevGamesAndCards
                games={selectedDev.games}
                developerName={selectedDev.studio_name}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}