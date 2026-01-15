import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GenreSelector({ genres, selectedGenre, onSelect }) {
  return (
    <div className="w-28 h-full flex flex-col items-center py-8 z-20 border-r border-white/5 bg-[#050505]/80 backdrop-blur-xl relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-purple-900/5 to-transparent pointer-events-none" />
      
      {/* Scrollable Container */}
      <div className="flex-1 w-full overflow-y-auto no-scrollbar px-3 flex flex-col gap-4">
        {genres.map((genre) => {
          const Icon = genre.icon;
          const isSelected = selectedGenre?.id === genre.id;
          
          return (
            <motion.button
              key={genre.id}
              onClick={() => onSelect(genre)}
              initial={false}
              animate={{
                scale: isSelected ? 1.05 : 1,
                opacity: isSelected ? 1 : 0.4
              }}
              whileHover={{ 
                scale: 1.05, 
                opacity: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative w-full aspect-[4/5] rounded-2xl flex flex-col items-center justify-center gap-2
                transition-all duration-300 border border-transparent
                ${isSelected ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] border-white/10' : 'hover:border-white/5'}
              `}
            >
              {/* Active Neon Glow / Indicator */}
              {isSelected && (
                <motion.div 
                  layoutId="activeGlow"
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-tr ${genre.color} opacity-20`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  exit={{ opacity: 0 }}
                />
              )}
              
              {/* Active Edge Accent */}
              {isSelected && (
                <motion.div 
                  layoutId="activeEdge"
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b ${genre.color}`}
                />
              )}

              {/* Icon */}
              <div className={`relative z-10 p-2 rounded-full transition-all duration-300 ${isSelected ? 'bg-black/20 backdrop-blur-md shadow-inner' : ''}`}>
                <Icon 
                  className={`w-6 h-6 transition-all duration-300 ${isSelected ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-white'}`} 
                />
              </div>

              {/* Label */}
              <span className={`
                text-[9px] font-bold uppercase tracking-widest relative z-10 transition-colors duration-300
                ${isSelected ? 'text-white' : 'text-white/70'}
              `}>
                {genre.short || genre.name.substring(0, 3)}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
    </div>
  );
}