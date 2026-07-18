import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronUp, ChevronDown } from 'lucide-react';
import { DEVELOPERS } from './devstore/devData';
import DeveloperShowcaseSection from './devstore/DeveloperShowcaseSection';
import DeveloperProfilePage from './devstore/DeveloperProfilePage';
import StudioScrollRail from './devstore/StudioScrollRail';
import DevSearchBar from './devstore/DevSearchBar';

export default function DevCardsContent({ onNavigateToGame }) {
  const [selectedDev, setSelectedDev] = useState(null);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const railRef = useRef(null);
  const wheelTsRef = useRef(0);

  // Stable callback for search changes
  const handleSearchChange = useCallback((q) => setSearch(q), []);

  // Alphabetically sorted studios
  const sortedDevs = useMemo(() => {
    return [...DEVELOPERS].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filtered list (respects search)
  const filteredDevs = useMemo(() => {
    if (!search.trim()) return sortedDevs;
    const q = search.toLowerCase();
    return sortedDevs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.tagline.toLowerCase().includes(q) ||
        d.inDevelopment.some((p) => p.title.toLowerCase().includes(q))
    );
  }, [sortedDevs, search]);

  // Clamp active index when filtered list changes
  useEffect(() => {
    if (activeIndex >= filteredDevs.length) {
      setActiveIndex(Math.max(0, filteredDevs.length - 1));
    }
  }, [filteredDevs.length, activeIndex]);

  const activeDev = filteredDevs[activeIndex] || filteredDevs[0];

  // Wheel-based studio cycling on the left rail — scroll up/down to change studio
  const handleRailWheel = (e) => {
    if (filteredDevs.length <= 1) return;
    e.preventDefault();
    const now = Date.now();
    if (now - wheelTsRef.current < 120) return;
    wheelTsRef.current = now;
    const dir = e.deltaY > 0 ? 1 : -1;
    setActiveIndex((prev) => {
      const next = Math.min(filteredDevs.length - 1, Math.max(0, prev + dir));
      return next;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (selectedDev) return;
      if (document.activeElement?.tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(filteredDevs.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedDev, filteredDevs.length]);

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
            className="h-full flex flex-col"
          >
            {/* Header bar */}
            <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between"
              style={{ background: 'rgba(8, 12, 18, 0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-white">Developer Showcase</h1>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">
                    {sortedDevs.length} studios · {sortedDevs.reduce((s, d) => s + d.inDevelopment.length, 0)} active projects
                  </p>
                </div>
              </div>

              {/* Search with voice + autocomplete */}
              <DevSearchBar
                studios={sortedDevs}
                onSelectStudio={(idx) => setActiveIndex(idx)}
                onSearchChange={handleSearchChange}
              />
            </div>

            {/* Two-column: left studio rail + right content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left rail — scrollable studio list */}
              {filteredDevs.length > 0 && (
                <div ref={railRef} onWheel={handleRailWheel} className="flex-shrink-0 h-full">
                  <StudioScrollRail
                    studios={filteredDevs}
                    activeIndex={activeIndex}
                    onSelect={(idx) => setActiveIndex(idx)}
                  />
                </div>
              )}

              {/* Right content — active studio showcase */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeDev ? (
                  <div className="max-w-5xl mx-auto px-6 py-8">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeDev.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                      >
                        <DeveloperShowcaseSection
                          dev={activeDev}
                          index={0}
                          onSelect={setSelectedDev}
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Navigation hint */}
                    <div className="flex items-center justify-center gap-4 mt-2 mb-6 text-white/20 text-[10px]">
                      <button
                        onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
                        disabled={activeIndex === 0}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronUp className="w-3 h-3" />
                        Prev
                      </button>
                      <span className="font-mono">{activeIndex + 1} / {filteredDevs.length}</span>
                      <button
                        onClick={() => setActiveIndex(prev => Math.min(filteredDevs.length - 1, prev + 1))}
                        disabled={activeIndex === filteredDevs.length - 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Next
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/30">
                    <Building2 className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-sm font-medium">No developers match your search</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}