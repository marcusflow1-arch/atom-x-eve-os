import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Gamepad2, User, Search, Play, ChevronRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

  return (
    <>
      {/* Trigger Button (Fixed on left) */}
      {!isOpen && (
        <motion.button
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={() => setIsOpen(true)}
            className="fixed left-6 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border bg-black/60 text-white border-white/20 backdrop-blur-md hover:bg-white/10 hover:scale-110 transition-all duration-300"
        >
            <Library className="w-6 h-6" />
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? "0%" : "-100%" }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 bottom-0 w-80 sm:w-96 bg-[#0f1419]/95 backdrop-blur-xl border-r border-white/10 z-50 shadow-[10px_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 pt-8 border-b border-white/5 flex items-center gap-3 bg-gradient-to-r from-indigo-600/20 to-transparent relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Library className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                    My Library
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="w-6 h-6 flex items-center justify-center rounded-full text-white/50 hover:text-white transition-colors"
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        <X className="w-3 h-3" />
                    </button>
                </h2>
                <p className="text-xs text-white/40 font-medium">Your History & Favorites</p>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
            
            {/* Live Channels */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Live Channels</h3>
                </div>
                <div className="space-y-3">
                    {recentChannels.map((channel, i) => (
                        <div key={i} className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                                    <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
                                </div>
                                {channel.isLive && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-[#0f1419] rounded-full animate-pulse" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{channel.name}</h4>
                                    {channel.isLive && <span className="text-[10px] text-red-400 font-mono">{channel.viewers}</span>}
                                </div>
                                <p className="text-xs text-white/40 truncate">{channel.game}</p>
                            </div>
                        </div>
                    ))}
                    <button className="w-full py-2 text-xs text-white/30 hover:text-white transition-colors flex items-center justify-center gap-1">
                        Show more <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </section>

            {/* Recent Games */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Gamepad2 className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Recent Games</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {recentGames.map((game, i) => (
                        <div key={i} className="group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer shadow-lg shadow-black/40">
                            <img src={game.image} alt={game.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                <span className="text-[10px] font-bold text-white leading-tight">{game.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Recent Searches */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Search className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Recent Searches</h3>
                </div>
                <div className="space-y-1">
                    {recentSearches.map((term, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-white/60 hover:text-white transition-colors group">
                            <Search className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                            <span className="text-sm">{term}</span>
                        </div>
                    ))}
                </div>
            </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
            <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white/60 hover:text-white transition-all flex items-center justify-center gap-2">
                <Play className="w-3 h-3" /> View Full History
            </button>
        </div>
      </motion.div>
    </>
  );
}