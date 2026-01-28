import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Gamepad2, User, Search, Play, ChevronRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { libraryGames } from '../dashboard/gamehub/mockLibraryData';

export default function LibrarySidebar() {
  const [isOpen, setIsOpen] = useState(false);

  // Mock Data
  const recentChannels = [
    { name: "NeonNinja", game: "Valorant", avatar: "https://source.unsplash.com/random/100x100?face,1", isLive: true, viewers: "12.5k" },
    { name: "CyberQueen", game: "Cyberpunk 2077", avatar: "https://source.unsplash.com/random/100x100?face,2", isLive: true, viewers: "8.2k" },
    { name: "TechRunner", game: "Apex Legends", avatar: "https://source.unsplash.com/random/100x100?face,3", isLive: false, viewers: "5.4k" },
  ];

  const recentGames = [
    { name: "Baldur's Gate 3", image: "https://source.unsplash.com/random/200x300?fantasy,game" },
    { name: "Starfield", image: "https://source.unsplash.com/random/200x300?space,game" },
    { name: "Elden Ring", image: "https://source.unsplash.com/random/200x300?dragon,game" },
  ];

  const recentSearches = [
    "Elden Ring Builds",
    "Starfield Reviews",
    "Valorant Crosshairs",
    "Minecraft Mods"
  ];

  const location = useLocation();
  const pathname = location.pathname.toLowerCase();
  const panel = new URLSearchParams(location.search).get('panel');
  const isDiscover = pathname.includes('/discover');
  const isHome = pathname.includes('/lunatemplate') || pathname.includes('/home');
  const isStreaming = pathname.includes('/streaming');
  const isEntertainment = panel === 'entertainment' || pathname.includes('/entertainment');
  const isLibraryPage = pathname.includes('/library');
  const mode = (isDiscover || isHome || isStreaming) ? 'recentStreaming' : 'library';
  const shouldShow = !(isEntertainment || isLibraryPage);

  if (!shouldShow) return null;

  return (
    <>
      {/* Trigger Button (Fixed on left) */}
      {!isOpen && (
      <motion.button
          initial={{ x: 0 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={() => setIsOpen(true)}
          className="fixed left-6 top-1/2 -translate-y-1/2 z-[70] w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5 text-white/90 backdrop-blur-lg shadow-lg hover:bg-white/10 hover:scale-105 transition-all duration-300"
      >
          <Library className="w-5 h-5" />
      </motion.button>
      )}

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? "0%" : "-100%" }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 bottom-0 w-80 sm:w-96 rounded-r-3xl border-r border-white/10 z-[70] overflow-hidden flex flex-col"
        style={{ 
          background: 'rgba(12, 16, 24, 0.88)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)'
        }}
      >
        {/* Header */}
        <div className="p-6 pt-8 border-b border-white/5 flex items-center gap-3 bg-gradient-to-r from-indigo-600/20 to-transparent relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Library className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                    {mode === 'recentStreaming' ? 'Recently Watched' : 'My Library'}
                </h2>
                <p className="text-xs text-white/40 font-medium">{mode === 'recentStreaming' ? 'Games & Streamers' : 'All Games & Recently Played'}</p>
            </div>
            <button 
                onClick={() => setIsOpen(false)}
                className="ml-auto w-6 h-6 flex items-center justify-center rounded-full text-white/50 hover:text-white transition-colors"
                style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <X className="w-3 h-3" />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {mode === 'recentStreaming' ? (
              <>
                {/* Recently Watched Games */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Gamepad2 className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Recently Watched Games</h3>
                    <span className="ml-auto text-[10px] text-white/40">{recentGames.length} items</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {recentGames.map((game, i) => (
                      <div key={i} className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition">
                        <img src={game.image} alt={game.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <h4 className="text-white font-bold text-xs leading-snug line-clamp-2">{game.name}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Recently Watched Streamers */}
                <section>
                  <div className="flex items-center gap-2 mt-6 mb-3">
                    <User className="w-4 h-4 text-pink-400" />
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Recently Watched Streamers</h3>
                    <span className="ml-auto text-[10px] text-white/40">{recentChannels.length} channels</span>
                  </div>
                  <div className="space-y-3">
                    {recentChannels.map((ch, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-pink-400/40 hover:shadow-[0_0_15px_rgba(244,114,182,0.2)] transition">
                        <div className="relative">
                          <img src={ch.avatar} alt={ch.name} className="w-10 h-10 rounded-lg object-cover" />
                          {ch.isLive && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{ch.name}</p>
                          <p className="text-white/50 text-xs truncate">{ch.game}</p>
                        </div>
                        <div className="text-white/60 text-xs font-mono flex items-center gap-1">
                          <span className="text-red-500">●</span>
                          {ch.viewers}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <>
                {/* Library Games Only */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Gamepad2 className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Library Games</h3>
                    <span className="ml-auto text-[10px] text-white/40">{libraryGames.length} total</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {libraryGames.map((game, i) => (
                      <div key={game.id || i} className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition">
                        <img src={game.cover || game.cover_image || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=800&fit=crop'} alt={game.title || game.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <h4 className="text-white font-bold text-xs leading-snug line-clamp-2">{game.title || game.name}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
            <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white/60 hover:text-white transition-all flex items-center justify-center gap-2">
                <Play className="w-3 h-3" /> {mode === 'recentStreaming' ? 'Open Stream History' : 'View Full History'}
            </button>
        </div>
      </motion.div>
    </>
  );
}