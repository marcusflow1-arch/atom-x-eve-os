import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Clock } from 'lucide-react';
import { formatViewers, formatUptime } from './streamerMockData';

/**
 * Twitch-sized live channel tile: 16:9 preview with the streamer name
 * and game underneath the box. Hover lifts the tile and reveals the game.
 */
export default function StreamerTile({ streamer, onClick, compact = false }) {
  return (
    <motion.button
      type="button"
      onClick={() => onClick?.(streamer)}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group w-full text-left"
    >
      {/* Preview box */}
      <div className={`relative w-full ${compact ? 'aspect-video' : 'aspect-video'} rounded-xl overflow-hidden bg-black border border-white/10 group-hover:border-cyan-400/50 transition-colors shadow-[0_8px_24px_rgba(0,0,0,0.45)]`}>
        <img
          src={streamer.thumbnail}
          alt={streamer.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Live + viewers */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold tracking-wide">LIVE</span>
          <span className="px-1.5 py-0.5 rounded bg-black/70 text-white/90 text-[10px] font-semibold inline-flex items-center gap-1">
            <Eye className="w-3 h-3" /> {formatViewers(streamer.viewers)}
          </span>
        </div>

        {/* Uptime on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="px-1.5 py-0.5 rounded bg-black/70 text-white/80 text-[10px] inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatUptime(streamer.uptimeMinutes)}
          </span>
        </div>

        {/* Game reveal on hover */}
        <div className="absolute bottom-2 left-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
          <span className="inline-block max-w-full truncate px-2 py-1 rounded-md bg-black/75 border border-white/10 text-[11px] font-semibold text-cyan-200">
            Playing {streamer.game}
          </span>
        </div>
      </div>

      {/* Name under the box */}
      <div className="flex items-start gap-2.5 mt-2.5 px-0.5">
        <img
          src={streamer.avatar}
          alt={streamer.name}
          className="w-8 h-8 rounded-full object-cover border border-white/15 group-hover:border-cyan-400/60 transition-colors flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate group-hover:text-cyan-300 transition-colors">{streamer.name}</p>
          <p className="text-white/50 text-xs truncate">{streamer.title}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {streamer.tags.slice(0, 2).map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 text-[9px] font-semibold uppercase tracking-wide">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.button>
  );
}