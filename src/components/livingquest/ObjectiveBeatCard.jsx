// ObjectiveBeatCard.jsx — The "go do the task" phase of the Living Quest loop.
// Renders an interactive objective (collect / defeat / fetch) with real progress,
// then unlocks "Return to Eve" once the goal is met.
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sword, Package, Droplet, Fish, Target, CheckCircle2, ChevronRight, MapPin } from 'lucide-react';

const TASK_ICONS = { collect: Package, defeat: Sword, fetch: Droplet, fish: Fish, default: Target };

export default function ObjectiveBeatCard({ beat, onComplete }) {
  const goal = beat.objective || {};
  const required = goal.amount || 1;
  const [progress, setProgress] = useState(0);
  const Icon = TASK_ICONS[goal.kind] || TASK_ICONS.default;
  const done = progress >= required;
  const accent = '#a855f7';

  const verb = {
    collect: 'Gather', defeat: 'Defeat', fetch: 'Collect', fish: 'Catch',
  }[goal.kind] || 'Find';

  const actionLabel = {
    collect: `Pick up ${goal.target}`,
    defeat: `Strike ${goal.target}`,
    fetch: `Collect ${goal.target}`,
    fish: `Cast for ${goal.target}`,
  }[goal.kind] || `Search for ${goal.target}`;

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
      {/* Scene image */}
      <div className="relative h-40">
        <img src={beat.media} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,12,20,1), transparent)' }} />
        <div className="absolute top-3 left-5 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(8,12,20,0.8)', border: `1px solid ${accent}40` }}>
          <MapPin className="w-3 h-3" style={{ color: accent }} />
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: accent }}>{beat.location || 'Out in the World'}</span>
        </div>
      </div>

      <div className="px-6 pt-4 pb-6">
        {/* Objective header */}
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4" style={{ color: accent }} />
          <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-white/40">Objective</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-white mb-2">{beat.headline}</h2>
        <p className="text-sm leading-relaxed text-white/60 mb-5">{beat.body}</p>

        {/* Quest task tracker */}
        <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white/85">{verb} {goal.target}</span>
            <span className="text-sm font-mono font-bold" style={{ color: done ? '#4ade80' : accent }}>{Math.min(progress, required)} / {required}</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: `${Math.min(progress / required, 1) * 100}%` }}
              transition={{ type: 'spring', stiffness: 180, damping: 22 }}
              style={{ background: done ? '#4ade80' : accent }} />
          </div>

          {!done ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setProgress(p => p + 1)}
              className="w-full py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2"
              style={{ background: `${accent}20`, border: `1px solid ${accent}50`, color: accent }}
            >
              <Icon className="w-4 h-4" /> {actionLabel}
            </motion.button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2 text-sm font-bold text-green-400">
              <CheckCircle2 className="w-4 h-4" /> Objective Complete!
            </div>
          )}
        </div>

        {/* Return button — only once task is done */}
        <button
          onClick={() => onComplete(beat)}
          disabled={!done}
          className="w-full py-3 rounded-xl text-sm font-bold tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed"
          style={{ background: done ? `${accent}25` : 'rgba(255,255,255,0.04)', border: `1px solid ${done ? accent + '60' : 'rgba(255,255,255,0.08)'}`, color: done ? accent : 'rgba(255,255,255,0.4)' }}
        >
          {beat.returnLabel || 'Return to Eve'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}