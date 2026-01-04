import React from 'react';
import { motion } from 'framer-motion';
import { Sword, Zap, Ghost, Skull, Trophy, Gamepad2, Star, Flame } from 'lucide-react';

const GAMES = [
  { id: 'rpg', icon: Sword, label: 'RPG', color: 'from-cyan-400 to-blue-600' },
  { id: 'action', icon: Zap, label: 'Action', color: 'from-yellow-400 to-orange-600' },
  { id: 'horror', icon: Ghost, label: 'Horror', color: 'from-purple-400 to-pink-600' },
  { id: 'survival', icon: Skull, label: 'Survival', color: 'from-red-400 to-rose-700' },
  { id: 'sports', icon: Trophy, label: 'Sports', color: 'from-emerald-400 to-teal-600' },
  { id: 'retro', icon: Gamepad2, label: 'Retro', color: 'from-indigo-400 to-violet-600' },
];

export default function GlassSphereLibrary() {
  return (
    <div className="h-full w-full flex flex-col items-center py-8 gap-8 overflow-y-auto no-scrollbar">
      {/* Branding / Top Icon */}
      <div className="mb-4">
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white/50" />
        </div>
      </div>

      {GAMES.map((game, idx) => (
        <motion.div
          key={game.id}
          className="relative group cursor-pointer"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          {/* Tooltip */}
          <div className="absolute left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 shadow-xl whitespace-nowrap">
                {game.label}
            </div>
          </div>

          {/* Glass Sphere (#23) */}
          <div className="relative w-12 h-12 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
            {/* Sphere Body */}
            <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-[2px] border border-white/20 shadow-[inset_0_5px_10px_rgba(255,255,255,0.2),inset_0_-5px_10px_rgba(0,0,0,0.3)]" />
            
            {/* Inner Icon 3D */}
            <div className="absolute inset-0 flex items-center justify-center text-white/70 group-hover:text-white transition-colors duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
               <game.icon size={20} strokeWidth={1.5} />
            </div>

            {/* Specular Highlight */}
            <div className="absolute top-2 left-2 w-4 h-2 bg-white/30 rounded-[50%] blur-[1px] transform -rotate-45" />
            
            {/* Active Glow on Hover */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-500`} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}