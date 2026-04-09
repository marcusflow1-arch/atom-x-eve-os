import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, ChevronLeft, ChevronRight, Play } from 'lucide-react';

export default function FarmHubFeaturedHero({ games, onSelect }) {
  const [active, setActive] = useState(0);
  if (!games || games.length === 0) return null;

  const game = games[active];

  const prev = () => setActive((i) => (i - 1 + games.length) % games.length);
  const next = () => setActive((i) => (i + 1) % games.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative rounded-2xl overflow-hidden h-[260px] group cursor-pointer"
      onClick={() => onSelect(game)}
      style={{
        background: 'rgba(100, 120, 140, 0.08)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={game.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0">
          
          <img src={game.banner || game.image} alt={game.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1419]/95 via-[#0f1419]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419]/80 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full flex flex-col justify-end p-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">Featured</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">#{active + 1} Trending</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.h2 key={game.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="text-3xl font-extrabold text-white mb-3 tracking-tight">
            {game.title}
          </motion.h2>
        </AnimatePresence>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-green-400 text-xs font-semibold">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {game.activeUsers.toLocaleString()} online
          </div>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Mic2 className="w-3 h-3" /> {game.voiceRooms} rooms
          </div>
          


          
        </div>
      </div>

      {games.length > 1 &&
      <>
          <button onClick={(e) => {e.stopPropagation();prev();}} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ChevronLeft className="w-4 h-4 text-white/70" />
          </button>
          <button onClick={(e) => {e.stopPropagation();next();}} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ChevronRight className="w-4 h-4 text-white/70" />
          </button>
        </>
      }

      {games.length > 1 &&
      <div className="absolute bottom-4 right-8 flex gap-1.5 z-20">
          {games.map((_, i) =>
        <button key={i} onClick={(e) => {e.stopPropagation();setActive(i);}} className={`rounded-full transition-all duration-300 ${i === active ? 'w-6 h-1.5 bg-cyan-400' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`} />
        )}
        </div>
      }
    </motion.div>);

}