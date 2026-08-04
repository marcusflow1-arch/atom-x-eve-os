import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Radio, Play } from 'lucide-react';
import { formatViewers } from '../aura/streamerMockData';

/** Big featured channel spotlight at the top of Discover. */
export default function DiscoverHero({ streamer, onWatch }) {
  if (!streamer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full h-[280px] md:h-[360px] rounded-3xl overflow-hidden border border-white/10 bg-black"
    >
      <img src={streamer.thumbnail} alt={streamer.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />

      <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end max-w-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[11px] font-bold">LIVE</span>
          <span className="px-2 py-0.5 rounded bg-black/60 text-white/90 text-[11px] font-semibold inline-flex items-center gap-1">
            <Eye className="w-3 h-3" /> {formatViewers(streamer.viewers)}
          </span>
          <span className="text-cyan-300 text-[11px] font-bold uppercase tracking-widest inline-flex items-center gap-1">
            <Radio className="w-3 h-3" /> Featured Channel
          </span>
        </div>

        <h1 className="text-white font-black text-2xl md:text-4xl leading-tight">{streamer.title}</h1>
        <p className="text-white/70 mt-2 text-sm md:text-base">
          <span className="font-bold text-white">{streamer.name}</span> · Playing {streamer.game}
        </p>

        <button
          onClick={() => onWatch?.(streamer)}
          className="mt-5 self-start px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold text-sm inline-flex items-center gap-2 shadow-[0_0_24px_rgba(6,182,212,0.4)] hover:brightness-110 transition"
        >
          <Play className="w-4 h-4" /> Watch Now
        </button>
      </div>
    </motion.div>
  );
}