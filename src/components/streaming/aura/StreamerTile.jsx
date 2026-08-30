import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Clock } from 'lucide-react';
import { formatViewers, formatUptime } from './streamerMockData';

export default function StreamerTile({ streamer, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={() => onClick?.(streamer)}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group w-full text-left"
    >
      <div className="relative w-full aspect-video overflow-hidden bg-black/50 shadow-[0_10px_35px_rgba(0,0,0,.35)]">
        <img src={streamer.thumbnail} alt={streamer.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold">LIVE</span>
          <span className="px-1.5 py-0.5 bg-black/70 text-white/90 text-[10px] inline-flex items-center gap-1">
            <Eye className="w-3 h-3" /> {formatViewers(streamer.viewers)}
          </span>
        </div>
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white/80 text-[10px] inline-flex items-center gap-1">
          <Clock className="w-3 h-3" /> {formatUptime(streamer.uptimeMinutes)}
        </div>
      </div>
      <div className="flex items-start gap-2.5 mt-2.5">
        <img src={streamer.avatar} alt={streamer.name} className="w-9 h-9 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">{streamer.name}</p>
          <p className="text-white/50 text-xs truncate">{streamer.title}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {streamer.tags.slice(0, 2).map((t) => (
              <span key={t} className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[9px] uppercase">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
