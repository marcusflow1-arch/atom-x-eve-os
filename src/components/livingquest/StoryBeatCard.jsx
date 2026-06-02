// StoryBeatCard.jsx — Narrative card for the Living Quest (AI Story / Storyline beats)
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy } from 'lucide-react';

export default function StoryBeatCard({ beat, onAdvance }) {
  const isEnding = beat.type === 'ending';
  const accent = beat.tone || '#a855f7';

  return (
    <motion.div
      key={beat.id}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl rounded-3xl overflow-hidden"
      style={{ background: 'rgba(8,12,20,0.96)', border: `1px solid ${accent}40`, boxShadow: `0 0 60px ${accent}20` }}
    >
      <div className="relative h-44">
        <img src={beat.media} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(8,12,20,1), transparent)` }} />
        <div className="absolute bottom-3 left-5">
          <div className="text-[10px] tracking-[0.4em] uppercase font-bold" style={{ color: accent }}>{beat.chapter}</div>
        </div>
      </div>

      <div className="px-6 pt-4 pb-6">
        <h2 className="text-2xl font-serif font-bold text-white mb-3">{beat.headline}</h2>
        <p className="text-sm leading-relaxed text-white/65 mb-5">{beat.body}</p>

        {isEnding && beat.reward && (
          <div className="flex items-center gap-4 mb-5 px-4 py-3 rounded-xl"
            style={{ background: `${accent}12`, border: `1px solid ${accent}30` }}>
            <Trophy className="w-5 h-5" style={{ color: accent }} />
            <span className="text-sm font-bold text-yellow-400">+{beat.reward.xp} XP</span>
            <span className="text-xs tracking-[0.2em] uppercase" style={{ color: accent }}>{beat.reward.path} Path</span>
          </div>
        )}

        <button
          onClick={() => onAdvance(beat)}
          className="w-full py-3 rounded-xl text-sm font-bold tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-2"
          style={{ background: `${accent}20`, border: `1px solid ${accent}50`, color: accent }}
        >
          {isEnding ? 'Replay Scenario' : 'Continue'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}