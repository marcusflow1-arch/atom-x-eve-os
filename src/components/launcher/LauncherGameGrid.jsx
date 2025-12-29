import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Cloud, HardDrive, Settings, AlertCircle, Loader2 } from 'lucide-react';

export default function LauncherGameGrid({ games, onLaunch }) {
  const [hoveredGame, setHoveredGame] = useState(null);

  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-2xl font-light text-white mb-6">Installed Games</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {games.map((game) => (
            <motion.div
              key={game.id}
              className="relative group aspect-[2/3] bg-white/5 rounded-xl cursor-pointer border border-white/5 hover:border-cyan-500/50 transition-colors"
              onMouseEnter={() => setHoveredGame(game.id)}
              onMouseLeave={() => setHoveredGame(null)}
              onClick={() => onLaunch(game)}
              whileHover={{ y: -5 }}
            >
              {/* Cover Image */}
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <img 
                  src={game.cover_image || game.cover} 
                  alt={game.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
              </div>

              {/* Status Indicators */}
              <div className="absolute top-2 right-2 flex gap-1">
                {game.installed ? (
                  <div className="p-1 rounded bg-black/60 backdrop-blur text-green-400" title="Installed">
                    <HardDrive className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="p-1 rounded bg-black/60 backdrop-blur text-white/40" title="In Library">
                    <Cloud className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Hover Overlay */}
              <AnimatePresence>
                {hoveredGame === game.id && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-4 z-10"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-2"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </motion.button>
                    <span className="text-white font-bold text-sm tracking-wide">LAUNCH</span>
                    <div className="mt-4 flex gap-2">
                        <button className="p-2 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors" title="Settings">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-bold text-sm truncate mb-1">{game.title}</h3>
                <div className="flex items-center justify-between text-[10px] text-white/50">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 12h
                  </span>
                  {game.installed && <span className="text-green-400">Ready</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Non-Installed / Cloud */}
      <div>
        <h2 className="text-lg font-light text-white/60 mb-6">Cloud Library</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 opacity-60 hover:opacity-100 transition-opacity">
            {/* Placeholders for cloud games */}
            {[1, 2, 3].map(i => (
                <div key={i} className="aspect-[2/3] bg-white/5 rounded-xl border border-white/5 flex flex-col items-center justify-center p-4 text-center">
                    <Cloud className="w-8 h-8 text-white/20 mb-2" />
                    <span className="text-white/40 text-xs">Game {i}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}