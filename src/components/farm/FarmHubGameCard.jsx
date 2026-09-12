import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, MessageSquare, Route } from 'lucide-react';

export default function FarmHubGameCard({ game, index, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.35), duration: 0.28 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group overflow-hidden rounded-xl text-left transition-all duration-300"
      style={{
        background: 'rgba(100, 120, 140, 0.08)',
        backdropFilter: 'blur(16px) saturate(130%)',
        WebkitBackdropFilter: 'blur(16px) saturate(130%)',
        border: `1px solid ${isHovered ? 'rgba(100, 180, 255, 0.24)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isHovered
          ? '0 10px 34px rgba(0,0,0,0.46), 0 0 42px rgba(100,150,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 4px 16px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
    >
      <div className="relative h-36 overflow-hidden">
        <img src={game.image} alt={game.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] via-[#0f1419]/28 to-transparent" />
        <div className="absolute left-3 top-3 rounded-md border border-white/[0.08] bg-black/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-300 backdrop-blur-md">
          {game.activityCount || 0} activity
        </div>
        <div className="absolute right-3 top-3 rounded-md border border-white/[0.06] bg-black/50 px-2 py-1 text-[10px] font-bold uppercase text-white/50 backdrop-blur-md">
          {game.genre || 'Other'}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-white transition-colors duration-200 group-hover:text-cyan-300">{game.title}</h3>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-white/35">
              <span className="flex items-center gap-1.5"><MessageSquare className="h-3 w-3" />{game.postCount || 0} posts</span>
              <span className="flex items-center gap-1.5"><Route className="h-3 w-3" />{game.routeCount || 0} routes</span>
            </div>
          </div>
          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] transition-all duration-200 group-hover:bg-white/10">
            <ChevronRight className="h-3.5 w-3.5 text-white/30 transition-colors group-hover:text-cyan-400" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
