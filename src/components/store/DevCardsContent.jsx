import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Search } from 'lucide-react';
import { DEVELOPERS } from './devstore/devData';
import DeveloperShowcaseSection from './devstore/DeveloperShowcaseSection';
import DeveloperProfilePage from './devstore/DeveloperProfilePage';

export default function DevCardsContent({ onNavigateToGame }) {
  const [selectedDev, setSelectedDev] = useState(null);
  const [search, setSearch] = useState('');

  const filteredDevs = DEVELOPERS.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.tagline.toLowerCase().includes(search.toLowerCase()) ||
      d.inDevelopment.some((p) => p.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full h-full pt-16 overflow-hidden">
      <AnimatePresence mode="wait">
        {selectedDev ? (
          <motion.div
            key={`dev-profile-${selectedDev.id}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            <DeveloperProfilePage dev={selectedDev} onBack={() => setSelectedDev(null)} />
          </motion.div>
        ) : (
          <motion.div
            key="dev-storefront"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full overflow-y-auto custom-scrollbar"
          >
            {/* Header */}
            <div className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between"
              style={{ background: 'rgba(8, 12, 18, 0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-white">Developer Showcase</h1>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">
                    {DEVELOPERS.length} studios · {DEVELOPERS.reduce((s, d) => s + d.inDevelopment.length, 0)} active projects
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input
                  type="text"
                  placeholder="Search studios or projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-white text-xs placeholder-white/40 focus:outline-none focus:border-amber-400/40 transition-all"
                />
              </div>
            </div>

            {/* Scrolling dev showcase sections */}
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
              {filteredDevs.map((dev, idx) => (
                <DeveloperShowcaseSection key={dev.id} dev={dev} index={idx} onSelect={setSelectedDev} />
              ))}

              {filteredDevs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-white/30">
                  <Building2 className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm font-medium">No developers match your search</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}