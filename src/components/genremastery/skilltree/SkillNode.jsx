import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';

export default function SkillNode({ node, accent, isNext, onClick }) {
  const { unlocked, name, requiredLevel } = node;

  return (
    <motion.button
      type="button"
      onClick={() => onClick?.(node)}
      whileHover={{ scale: 1.03 }}
      className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all"
      style={{
        background: unlocked ? `linear-gradient(90deg, ${accent}22, rgba(255,255,255,0.03))` : 'rgba(255,255,255,0.025)',
        border: `1px solid ${unlocked ? accent + '66' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: unlocked ? `0 0 18px ${accent}33, inset 0 1px 0 rgba(255,255,255,0.06)` : 'none',
      }}
    >
      <span
        className="relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: unlocked ? accent : 'rgba(255,255,255,0.06)',
          border: `1px solid ${unlocked ? '#ffffff55' : isNext ? accent + '99' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: unlocked ? `0 0 14px ${accent}aa` : isNext ? `0 0 10px ${accent}55` : 'none',
        }}
      >
        {unlocked
          ? <Check className="w-4 h-4 text-black/80" />
          : <Lock className="w-3.5 h-3.5 text-white/40" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-semibold truncate ${unlocked ? 'text-white' : 'text-white/45'}`}>{name}</span>
        <span className="block text-[10px] uppercase tracking-widest text-white/30">
          {unlocked ? 'Unlocked' : `Level ${requiredLevel}`}
        </span>
      </span>
    </motion.button>
  );
}