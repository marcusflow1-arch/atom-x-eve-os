import React from 'react';
import { motion } from 'framer-motion';
import { X, Play, Settings, Trash2, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { libraryGames } from '../dashboard/gamehub/mockLibraryData';

export default function GameDetailView({ game, showFullLibrary, onClose, onSelectGame }) {
  if (!game && !showFullLibrary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-16 bottom-12 z-[76] shadow-2xl flex flex-col overflow-hidden ${
        showFullLibrary && !game ? 'left-[348px] right-0' : 'left-[348px] right-0 lg:w-[800px] lg:right-auto'
      }`}
      style={{
        background: 'rgba(15, 20, 26, 0.65)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(165, 243, 252, 0.08)',
        borderLeft: '1px solid rgba(165, 243, 252, 0.15)',
        borderRight: showFullLibrary && !game ? 'none' : '1px solid rgba(165, 243, 252, 0.15)'
      }}
    >
      {/* FULL LIBRARY VIEW */}
      {showFullLibrary && !game && (
        <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#0c1018]/95 backdrop-blur-xl z-10 py-4 -mt-4 border-b border-white/5">
            <div>
              <h2 className="text-2xl font-bold text-white">Full Library</h2>
              <p className="text-sm text-white/40">{libraryGames.length} titles</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {libraryGames.map((libGame, i) => (
              <motion.div
                key={`full_lib_${libGame.id || i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelectGame(libGame)}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
              >
                <img 
                  src={libGame.cover || libGame.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'} 
                  alt={libGame.title || libGame.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h4 className="text-white font-bold text-sm leading-tight mb-1">{libGame.title || libGame.name}</h4>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px] px-1.5 h-5">Info</Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* INDIVIDUAL GAME DETAIL VIEW */}
      {game && (
        <>
          {/* Banner Header */}
          <div className="relative h-64 w-full flex-shrink-0">
            <img 
              src={game.banner || game.cover_image || game.cover || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80'} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#0f141a]" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-white/10 text-white/60 hover:text-white transition-colors backdrop-blur-md border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Game Box Art */}
            <div className="absolute -bottom-12 left-8 w-32 aspect-[3/4] rounded-lg shadow-2xl border-2 border-white/10 overflow-hidden z-10 group">
              <img 
                src={game.cover || game.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'} 
                alt="Box Art" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content Below Banner */}
          <div className="flex-1 p-8 pt-16 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
            
            {/* Header Info */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{game.title || game.name}</h2>
              <div className="flex items-center gap-3 text-sm text-white/50">
                <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70">RPG</Badge>
                <span>•</span>
                <span>Last Played: 2d ago</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 text-base">
                <Play className="w-4 h-4 mr-2 fill-current" /> Play
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-12 w-12 border-white/10 bg-white/5 hover:bg-white/10">
                  <Settings className="w-5 h-5 text-white/70" />
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12 border-white/10 bg-white/5 hover:bg-white/10 hover:text-red-400">
                  <Trash2 className="w-5 h-5 text-white/70" />
                </Button>
              </div>
            </div>

            {/* Updates Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  Latest Updates
                </h3>
                <Button variant="ghost" size="sm" className="text-xs text-cyan-400 h-auto p-0 hover:bg-transparent hover:text-cyan-300">View All</Button>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">Patch 1.2.0</Badge>
                  <span className="text-xs text-white/40">Today</span>
                </div>
                <h4 className="text-white font-bold text-sm mb-1">Season of the Witch</h4>
                <p className="text-xs text-white/50 line-clamp-2">New raid content, 5 new weapons, and balance changes for all classes.</p>
              </div>
            </div>

            {/* DLC Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-purple-400" />
                  DLC & Add-ons
                </h3>
                <Button variant="ghost" size="sm" className="text-xs text-purple-400 h-auto p-0 hover:bg-transparent hover:text-purple-300">Store</Button>
              </div>
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                    <div className="w-12 h-12 bg-black/40 rounded-md overflow-hidden">
                      <img src={`https://source.unsplash.com/random/100x100?expansion,${i}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="DLC" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">Expansion Pack {i}</h4>
                      <p className="text-xs text-white/40">Installed</p>
                    </div>
                    <div className="pr-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </motion.div>
  );
}