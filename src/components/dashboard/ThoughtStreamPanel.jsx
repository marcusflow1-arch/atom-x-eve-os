import React from 'react';
import { motion } from 'framer-motion';
import { X, Brain, Sparkles } from 'lucide-react';

const MOOD_LABELS = {
  joyful: 'feeling joyful', content: 'content', neutral: 'contemplating',
  melancholic: 'reflective', irritable: 'unsettled', aggressive: 'on edge',
  contemplative: 'deep in thought', energetic: 'energized', tired: 'resting', curious: 'curious'
};

const MOOD_ACCENTS = {
  joyful: 'rgba(251, 191, 36, 0.12)', content: 'rgba(52, 211, 153, 0.12)',
  neutral: 'rgba(168, 85, 247, 0.12)', melancholic: 'rgba(96, 165, 250, 0.12)',
  irritable: 'rgba(251, 113, 133, 0.12)', aggressive: 'rgba(248, 113, 113, 0.12)',
  contemplative: 'rgba(168, 85, 247, 0.12)', energetic: 'rgba(34, 211, 238, 0.12)',
  tired: 'rgba(148, 163, 184, 0.10)', curious: 'rgba(168, 85, 247, 0.12)',
};

function alignmentLabel(moral) {
  if (moral > 20) return 'benevolent';
  if (moral < -20) return 'shadowed';
  return 'balanced';
}

export default function ThoughtStreamPanel({ thoughts, mood, moralAlignment, onClose }) {
  const moodLabel = MOOD_LABELS[mood] || 'contemplating';
  const align = alignmentLabel(moralAlignment);
  const accentBg = MOOD_ACCENTS[mood] || MOOD_ACCENTS.neutral;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border overflow-hidden flex flex-col max-h-[70vh]"
        style={{
          background: 'linear-gradient(160deg, rgba(20,16,35,0.96) 0%, rgba(10,12,22,0.98) 100%)',
          borderColor: 'rgba(168, 85, 247, 0.25)',
          boxShadow: '0 0 40px rgba(168, 85, 247, 0.1)',
        }}
      >
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center transition-colors">
          <X className="w-4 h-4 text-white/60" />
        </button>

        <div className="p-5 border-b border-white/[0.08] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: accentBg }}>
            <Sparkles className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base">AI Thought Stream</h3>
            <p className="text-white/40 text-[11px] capitalize">{moodLabel} · {align}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
          {thoughts.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">Your AI is still observing…</p>
              <p className="text-white/30 text-xs mt-1">Make decisions in-game to see its thoughts here.</p>
            </div>
          ) : (
            thoughts.map((t, i) => (
              <div key={t.id || i} className="p-3 rounded-xl border" style={{ background: accentBg, borderColor: 'rgba(168, 85, 247, 0.08)' }}>
                <p className="text-white/80 text-sm leading-relaxed italic">"{t.ai_reaction}"</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-purple-300/60 text-[9px] uppercase tracking-wider">{(t.decision_type || '').replace(/_/g, ' ')}</span>
                  {t.decision_context && <span className="text-white/30 text-[9px]">· {t.decision_context}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}