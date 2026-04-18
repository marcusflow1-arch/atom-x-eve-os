import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Search, Star, Sparkles, Code2, ShoppingCart, X } from 'lucide-react';
import { DEV_SPOTLIGHT_DATA } from '@/components/dashboard/devSpotlightData';
import { useCart } from '@/components/CartContext';

export default function DevEditionContent() {
  const [selectedDev, setSelectedDev] = useState(null);
  const [activeDevIndex, setActiveDevIndex] = useState(0);
  const [activeSubCategoryIndex, setActiveSubCategoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredGame, setHoveredGame] = useState(null);
  const [scrollDir, setScrollDir] = useState('down');
  const [isDevHovering, setIsDevHovering] = useState(false);
  const [devPanelFocused, setDevPanelFocused] = useState(false);

  const genreListRef = useRef(null);
  const contentScrollRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const wheelTsRef = useRef(0);

  const { addToCart } = useCart();

  // Prepare developer data
  const filteredDevs = useMemo(() => {
    const devs = DEV_SPOTLIGHT_DATA.map((dev, idx) => ({
      ...dev,
      id: `dev-${idx}`,
      icon: Code2,
      label: dev.name,
      items: dev.games || [],
    }));

    if (!searchQuery.trim()) return devs;
    const q = searchQuery.toLowerCase();
    return devs.filter(d => d.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const SUB_CATEGORIES = ['All Games', 'Latest', 'Popular', 'Top Rated', 'New Cards'];

  const handleDevWheel = (e) => {
    if (!filteredDevs || filteredDevs.length === 0) return;
    e.preventDefault();
    const now = Date.now();
    if (now - wheelTsRef.current < 120) return;
    wheelTsRef.current = now;
    const direction = e.deltaY < 0 ? -1 : 1;
    setActiveDevIndex(prev => {
      const next = Math.min(filteredDevs.length - 1, Math.max(0, prev + direction));
      if (next !== prev) { setActiveSubCategoryIndex(0); }
      return next;
    });
  };

  const handleScroll = () => {
    const el = contentScrollRef.current;
    if (el) {
      const st = el.scrollTop;
      setScrollDir(st > lastScrollTopRef.current ? 'down' : 'up');
      lastScrollTopRef.current = st <= 0 ? 0 : st;
    }
  };

  useEffect(() => {
    const el = contentScrollRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => el?.removeEventListener('scroll', handleScroll);
  }, []);

  const currentDev = filteredDevs[activeDevIndex];
  const displayedGames = currentDev?.items || [];
  const activeSubCategory = SUB_CATEGORIES[activeSubCategoryIndex] || SUB_CATEGORIES[0];

  return (
    <div className="w-full h-full flex text-white overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col">
        {/* HEADER */}
        <div className="flex-shrink-0 px-6 h-12 border-b border-white/5 flex items-center gap-4" style={{ background: 'rgba(8,12,18,0.6)', backdropFilter: 'blur(20px)' }}>
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Developer Cards</span>
          <div className="w-px h-4 bg-white/8" />
          <span className="text-white/20 text-[10px]">{filteredDevs.length} studios · {filteredDevs.reduce((s, d) => s + (d.items?.length || 0), 0)} games</span>
          <div className="flex-1" />
          
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            <Search className="w-3.5 h-3.5 text-white/30" />
            <input type="text" placeholder="Search studios..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent text-xs text-white placeholder:text-white/20 outline-none w-40" />
          </div>
        </div>

        {/* BODY: LEFT + MAIN */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* LEFT: Developer list */}
          <div className="w-[220px] flex-shrink-0 border-r border-white/5 overflow-hidden" style={{ background: 'rgba(8,12,18,0.4)' }}>
            <div className="h-full flex flex-col overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {filteredDevs.map((dev, idx) => {
                const isActive = activeDevIndex === idx;
                return (
                  <motion.button
                    key={dev.id}
                    onClick={() => setActiveDevIndex(idx)}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-left border-l-2 transition-all ${
                      isActive ? 'border-l-cyan-400 bg-white/6' : 'border-l-transparent hover:bg-white/3'
                    }`}
                    whileHover={{ x: 2 }}
                  >
                    <img src={dev.logo} alt={dev.name} className="w-8 h-8 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isActive ? 'text-cyan-200' : 'text-white/70'}`}>{dev.name}</p>
                      <p className="text-white/30 text-[10px]">{dev.items?.length || 0} games</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* MAIN: Genre list + Game grid */}
          <div className="flex-1 flex overflow-hidden">
            {/* Genre/Category list */}
            <div className="w-[160px] flex-shrink-0 border-r border-white/5 flex flex-col px-4 py-6 overflow-hidden" style={{ background: 'rgba(8,12,18,0.2)' }}>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-4">Browse</p>
              <motion.div
                ref={genreListRef}
                className="flex flex-col gap-2 overflow-y-auto flex-1"
                onWheel={handleDevWheel}
                onMouseEnter={() => setIsDevHovering(true)}
                onMouseLeave={() => setIsDevHovering(false)}
                onFocus={() => setDevPanelFocused(true)}
                onBlur={() => setDevPanelFocused(false)}
                tabIndex={0}
              >
                {SUB_CATEGORIES.map((cat, idx) => {
                  const isActive = idx === activeSubCategoryIndex;
                  return (
                    <motion.button
                      key={cat}
                      onClick={() => setActiveSubCategoryIndex(idx)}
                      className={`text-left text-xs py-1.5 px-2 rounded transition-all ${
                        isActive ? 'text-cyan-300 bg-white/8 font-semibold' : 'text-white/50 hover:text-white/70'
                      }`}
                      animate={{ x: isActive ? 4 : 0 }}
                    >
                      {cat}
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>

            {/* Game grid */}
            <div className="flex-1 overflow-y-auto" ref={contentScrollRef} style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {!currentDev ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Gamepad2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/30 text-sm">Select a developer</p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {/* Dev header */}
                  <div className="flex items-center gap-4 mb-8">
                    <img src={currentDev.logo} alt={currentDev.name} className="w-16 h-16 rounded-xl border border-white/15" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">{currentDev.name}</h2>
                      <p className="text-white/40 text-sm mt-1">{displayedGames.length} games</p>
                    </div>
                  </div>

                  {/* Category label */}
                  <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4">{activeSubCategory}</p>

                  {/* Game grid */}
                  <motion.div key={`${activeDevIndex}-${activeSubCategoryIndex}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                    {displayedGames.map((game, idx) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -8, scale: 1.05 }}
                        onMouseEnter={() => setHoveredGame(game)}
                        className="group relative aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer border border-white/8 hover:border-cyan-400/40 transition-all shadow-lg bg-slate-900"
                      >
                        <img src={game.cover || game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        
                        {/* Add to cart button */}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            addToCart({ id: game.id, title: game.title, price: game.price || 0, type: 'game', image: game.cover });
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded bg-cyan-500 flex items-center justify-center hover:bg-cyan-600 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ShoppingCart className="w-3 h-3 text-white" />
                        </button>

                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-1 group-hover:translate-y-0 transition-transform">
                          <h4 className="text-white font-bold text-xs leading-tight truncate">{game.title}</h4>
                          <div className="flex items-center justify-between text-[9px] text-white/60 mt-1">
                            <span>{game.year || '2026'}</span>
                            <div className="flex items-center gap-0.5 text-yellow-400">
                              <Star className="w-2 h-2 fill-current" />
                              <span>{game.rating || '4.5'}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}