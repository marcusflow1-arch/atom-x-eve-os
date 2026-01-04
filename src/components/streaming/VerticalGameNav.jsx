import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Sword, Skull, Ghost, Trophy, Zap } from 'lucide-react';

export default function VerticalGameNav() {
  const games = [
    { id: 1, icon: Sword, color: 'from-blue-400 to-indigo-600', label: 'RPG' },
    { id: 2, icon: Zap, color: 'from-yellow-400 to-orange-600', label: 'Action' },
    { id: 3, icon: Ghost, color: 'from-purple-400 to-pink-600', label: 'Horror' },
    { id: 4, icon: Skull, color: 'from-red-400 to-rose-700', label: 'Survival' },
    { id: 5, icon: Trophy, color: 'from-emerald-400 to-teal-600', label: 'Sports' },
    { id: 6, icon: Gamepad2, color: 'from-cyan-400 to-blue-500', label: 'Retro' },
  ];

  return (
    <div className="flex flex-col items-center gap-6 py-6 h-full overflow-y-auto">
      {games.map((game) => (
        <motion.button
          key={game.id}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative group w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
        >
          {/* Glass Sphere (#23) Implementation */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), rgba(255,255,255,0.05) 40%, transparent 80%)`,
              boxShadow: `
                inset 0 4px 6px rgba(255,255,255,0.3), 
                inset 0 -4px 6px rgba(0,0,0,0.4), 
                0 4px 10px rgba(0,0,0,0.3)
              `,
              backdropFilter: 'blur(4px)'
            }}
          />
          
          {/* Sphere Highlight/Refraction */}
          <div className="absolute top-2 left-2 w-3 h-2 bg-white/40 rounded-[50%] blur-[2px] transform -rotate-45" />

          {/* Icon with Color Glow */}
          <div className={`relative z-10 text-white/80 group-hover:text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}>
            <game.icon size={20} />
          </div>

          {/* Active State / Hover Glow */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-md`} />
          
          {/* Label Tooltip */}
          <span className="absolute left-14 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 backdrop-blur-sm">
            {game.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}