import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Blank UI shown when a game is long-pressed (>1.5s).
 * Intentionally empty — a clean canvas in place of the default game menu.
 */
export default function BlankGameUI({ game, onClose }) {
  return (
    <motion.div
      key={'blank-' + (game?.id || 'none')}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-auto mt-3 overflow-hidden flex flex-col"
      style={{
        borderRadius: '14px',
        background: 'rgba(8,12,18,0.35)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        height: 'calc(100vh - 268px)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">
          {game?.title ? `${game.title} — Blank` : 'Blank UI'}
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Intentionally blank body */}
      <div className="flex-1" />
    </motion.div>
  );
}