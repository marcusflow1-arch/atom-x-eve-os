import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronUp, ChevronDown, X, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import { DEVELOPERS } from './devstore/devData';
import DeveloperShowcaseSection from './devstore/DeveloperShowcaseSection';
import DeveloperProfilePage from './devstore/DeveloperProfilePage';
import StudioScrollRail from './devstore/StudioScrollRail';
import DevSearchBar from './devstore/DevSearchBar';

const GENRES = ['All', ...Array.from(new Set(DEVELOPERS.flatMap((d) => [
  ...(d.releasedGames || []).map((g) => g.genre),
  ...(d.inDevelopment || []).map((g) => g.genre),
].filter(Boolean)))).sort((a, b) => a.localeCompare(b))];

export default function DevCardsContent({ onNavigateToGame }) {
  const [selectedDev, setSelectedDev] = useState(null);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [sortMode, setSortMode] = useState('alpha');
  const [activeIndex, setActiveIndex] = useState(0);
  const [browseAllOpen, setBrowseAllOpen] = useState(false);
  const railRef = useRef(null);
  const wheelTsRef = useRef(0);

  const handleSearchChange = useCallback((q) => setSearch(q), []);

  const sortedDevs = useMemo(() => {
    const list = [...DEVELOPERS];
    if (sortMode === 'popular') return list.sort((a, b) => (b.followers || 0) - (a.followers || 0));
    if (sortMode === 'games') return list.sort((a, b) => ((b.gamesReleased || 0) + (b.inDevelopment?.length || 0)) - ((a.gamesReleased || 0) + (a.inDevelopment?.length || 0)));
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [sortMode]);

  const filteredDevs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedDevs.filter((d) => {
      const matchesGenre = genre === 'All' || [...(d.releasedGames || []), ...(d.inDevelopment || [])].some((g) => g.genre === genre);
      const matchesSearch = !q || d.name.toLowerCase().includes(q) || d.tagline.toLowerCase().includes(q) || (d.inDevelopment || []).some((p) => p.title.toLowerCase().includes(q));
      return matchesGenre && matchesSearch;
    });
  }, [sortedDevs, search, genre]);

  useEffect(() => {
    setActiveIndex((prev) => Math.min(Math.max(prev, 0), Math.max(0, filteredDevs.length - 1)));
  }, [filteredDevs.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (browseAllOpen) setBrowseAllOpen(false);
      else if (selectedDev) setSelectedDev(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [browseAllOpen, selectedDev]);

  const activeDev = filteredDevs[activeIndex] || filteredDevs[0];

  const handleRailWheel = (e) => {
    if (filteredDevs.length <= 1 || selectedDev || browseAllOpen) return;
    e.preventDefault();
    const now = Date.now();
    if (now - wheelTsRef.current < 120) return;
    wheelTsRef.current = now;
    const dir = e.deltaY > 0 ? 1 : -1;
    setActiveIndex((prev) => Math.min(filteredDevs.length - 1, Math.max(0, prev + dir)));
  };

  return (
    <div className="w-full h-full pt-16 overflow-hidden">
      <AnimatePresence mode="wait">
        {selectedDev ? (
          <motion.div key={`dev-profile-${selectedDev.id}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }} className="h-full">
            <DeveloperProfilePage dev={selectedDev} onBack={() => setSelectedDev(null)} />
          </motion.div>
        ) : (
          <motion.div key="dev-storefront" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
            <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between gap-4" style={{ background: 'rgba(8, 12, 18, 0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0"><Building2 className="w-5 h-5 text-amber-400" /></div>
                <div className="min-w-0"><h1 className="text-lg font-black tracking-tight text-white">Developer Showcase</h1><p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">{DEVELOPERS.length} studios · {DEVELOPERS.reduce((s, d) => s + (d.inDevelopment?.length || 0), 0)} active projects</p></div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 border-b border-white/15 text-[9px] text-white/40 uppercase tracking-wider"><SlidersHorizontal className="w-3 h-3" /><select value={genre} onChange={(e) => { setGenre(e.target.value); setActiveIndex(0); }} className="bg-transparent text-white/60 focus:outline-none cursor-pointer">{GENRES.map((g) => <option key={g} value={g} className="bg-slate-900">{g}</option>)}</select></div>
                <select value={sortMode} onChange={(e) => { setSortMode(e.target.value); setActiveIndex(0); }} className="hidden md:block bg-transparent border-b border-white/15 px-2 py-1.5 text-[9px] text-white/50 uppercase tracking-wider focus:outline-none"><option value="alpha" className="bg-slate-900">A–Z</option><option value="popular" className="bg-slate-900">Popularity</option><option value="games" className="bg-slate-900">Game Count</option></select>
                <DevSearchBar studios={sortedDevs} onSelectStudio={(idx) => { const id = sortedDevs[idx]?.id; const next = filteredDevs.findIndex((d) => d.id === id); if (next >= 0) setActiveIndex(next); }} onSearchChange={handleSearchChange} />
                <button onClick={() => setBrowseAllOpen(true)} className="hidden sm:flex items-center gap-1.5 px-3 py-2 border border-white/10 hover:border-white/20 hover:bg-white/5 text-[9px] text-white/55 uppercase tracking-wider transition-all" title="Browse all studios"><LayoutGrid className="w-3 h-3" /> Browse All</button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {filteredDevs.length > 0 && <div ref={railRef} onWheel={handleRailWheel} className="w-[15%] min-w-[150px] max-w-[260px] flex-shrink-0 h-full"><StudioScrollRail studios={filteredDevs} activeIndex={activeIndex} onSelect={setActiveIndex} /></div>}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeDev ? <div className="w-full px-6 xl:px-10 py-8"><AnimatePresence mode="wait"><motion.div key={activeDev.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}><DeveloperShowcaseSection dev={activeDev} index={0} onSelect={setSelectedDev} /></motion.div></AnimatePresence><div className="flex items-center justify-center gap-4 mt-2 mb-6 text-white/20 text-[10px]"><button onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))} disabled={activeIndex === 0} className="flex items-center gap-1 px-3 py-1.5 border border-white/10 hover:bg-white/5 disabled:opacity-30 transition-all"><ChevronUp className="w-3 h-3" /> Prev</button><span className="font-mono">{activeIndex + 1} / {filteredDevs.length}</span><button onClick={() => setActiveIndex((prev) => Math.min(filteredDevs.length - 1, prev + 1))} disabled={activeIndex === filteredDevs.length - 1} className="flex items-center gap-1 px-3 py-1.5 border border-white/10 hover:bg-white/5 disabled:opacity-30 transition-all">Next <ChevronDown className="w-3 h-3" /></button></div></div> : <div className="flex flex-col items-center justify-center h-full text-white/30"><Building2 className="w-16 h-16 mb-4 opacity-20" /><p className="text-sm font-medium">No developers match your filters</p></div>}
              </div>
            </div>

            <AnimatePresence>{browseAllOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-xl flex flex-col">
              <div className="flex-shrink-0 px-8 py-5 border-b border-white/10 flex items-center justify-between"><div><p className="text-[9px] uppercase tracking-[0.25em] text-amber-300/60">Developer Directory</p><h2 className="text-2xl font-black text-white mt-1">All Studios</h2><p className="text-xs text-white/35 mt-1">{DEVELOPERS.length} studios · sorted by {sortMode === 'alpha' ? 'name' : sortMode === 'popular' ? 'popularity' : 'game count'}</p></div><button onClick={() => setBrowseAllOpen(false)} className="p-2 text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button></div>
              <div className="flex-1 overflow-y-auto p-8"><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-[1800px] mx-auto">{sortedDevs.map((dev) => <button key={dev.id} onClick={() => { setBrowseAllOpen(false); setSelectedDev(dev); }} className="text-left p-4 border border-white/10 bg-white/[0.025] hover:bg-white/[0.06] hover:border-white/20 transition-all group"><div className="aspect-[16/9] overflow-hidden bg-black/30 mb-3"><img src={dev.heroImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div><p className="text-sm font-bold text-white truncate">{dev.name}</p><p className="text-[9px] text-white/35 mt-1 line-clamp-2">{dev.tagline}</p><div className="flex items-center justify-between mt-3 text-[8px] uppercase tracking-wider text-white/25"><span>{dev.gamesReleased || 0} released</span><span>{dev.followers ? `${Math.round(dev.followers / 1000)}K followers` : '—'}</span></div></button>)}</div></div>
              <div className="flex-shrink-0 text-center py-3 border-t border-white/10 text-[9px] text-white/25 uppercase tracking-widest">Press Escape to return to the developer browser</div>
            </motion.div>}</AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
