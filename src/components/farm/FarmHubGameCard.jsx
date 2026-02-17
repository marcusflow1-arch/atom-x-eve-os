import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mic2, ChevronRight } from 'lucide-react';

export default function FarmHubGameCard({ game, index, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.3 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(100, 120, 140, 0.08)',
        backdropFilter: 'blur(16px) saturate(130%)',
        WebkitBackdropFilter: 'blur(16px) saturate(130%)',
        border: `1px solid ${isHovered ? 'rgba(100, 180, 255, 0.2)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isHovered
          ? '0 8px 32px rgba(0,0,0,0.5), 0 0 40px rgba(100,150,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
    >
      <div className="relative h-36 overflow-hidden">
        <img src={game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] via-[#0f1419]/30 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400">{game.activeUsers.toLocaleString()}</span>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase text-white/50 capitalize" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {game.genre}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm truncate group-hover:text-cyan-300 transition-colors duration-200">{game.title}</h3>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-white/30 text-[11px]">
                <Mic2 className="w-3 h-3" /> {game.voiceRooms} rooms
              </div>
              <div className="flex items-center gap-1.5 text-white/30 text-[11px]">
                <Users className="w-3 h-3" /> {Math.floor(game.activeUsers / 100)} squads
              </div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 group-hover:bg-white/10" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-cyan-400 transition-colors" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}