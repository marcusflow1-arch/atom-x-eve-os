import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';
import { useAIPresence } from './AIPresenceContext';
import ThoughtStreamPanel from './ThoughtStreamPanel';

const MOOD_LABELS = {
  joyful: 'feeling joyful', content: 'content', neutral: 'contemplating',
  melancholic: 'reflective', irritable: 'unsettled', aggressive: 'on edge',
  contemplative: 'deep in thought', energetic: 'energized', tired: 'resting', curious: 'curious'
};

const MOOD_COLORS = {
  joyful:        { border: 'rgba(251, 191, 36, 0.30)', shadow: 'rgba(251, 191, 36, 0.12)', icon: 'text-amber-300' },
  content:       { border: 'rgba(52, 211, 153, 0.25)',  shadow: 'rgba(52, 211, 153, 0.10)', icon: 'text-emerald-300' },
  neutral:       { border: 'rgba(168, 85, 247, 0.25)',  shadow: 'rgba(168, 85, 247, 0.12)', icon: 'text-purple-300' },
  melancholic:   { border: 'rgba(96, 165, 250, 0.25)',  shadow: 'rgba(96, 165, 250, 0.10)', icon: 'text-blue-300' },
  irritable:     { border: 'rgba(251, 113, 133, 0.25)', shadow: 'rgba(251, 113, 133, 0.12)', icon: 'text-rose-300' },
  aggressive:    { border: 'rgba(248, 113, 113, 0.30)', shadow: 'rgba(248, 113, 113, 0.15)', icon: 'text-red-300' },
  contemplative: { border: 'rgba(168, 85, 247, 0.25)',  shadow: 'rgba(168, 85, 247, 0.12)', icon: 'text-purple-300' },
  energetic:     { border: 'rgba(34, 211, 238, 0.25)',  shadow: 'rgba(34, 211, 238, 0.12)', icon: 'text-cyan-300' },
  tired:         { border: 'rgba(148, 163, 184, 0.20)', shadow: 'rgba(148, 163, 184, 0.08)', icon: 'text-slate-300' },
  curious:       { border: 'rgba(168, 85, 247, 0.25)',  shadow: 'rgba(168, 85, 247, 0.12)', icon: 'text-purple-300' },
};

export default function ThoughtStreamBubble() {
  const { thoughts, mood, moralAlignment, loading } = useAIPresence();
  const [expanded, setExpanded] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const typeTimerRef = useRef(null);

  const latestThought = thoughts[0];
  const moodLabel = MOOD_LABELS[mood] || 'contemplating';
  const moodColor = MOOD_COLORS[mood] || MOOD_COLORS.neutral;
  const fullText = latestThought ? latestThought.ai_reaction : `AI is ${moodLabel}…`;

  useEffect(() => {
    setDisplayedText('');
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    let i = 0;
    typeTimerRef.current = setInterval(() => {
      if (i <= fullText.length) {
        setDisplayedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(typeTimerRef.current);
      }
    }, 35);
    return () => { if (typeTimerRef.current) clearInterval(typeTimerRef.current); };
  }, [fullText]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: loading ? 0.5 : 1, y: 0 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto"
      >
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all hover:scale-105"
          style={{
            background: 'rgba(10, 14, 20, 0.75)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderColor: moodColor.border,
            boxShadow: `0 4px 24px ${moodColor.shadow}`,
          }}
        >
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <Brain className={`w-3.5 h-3.5 ${moodColor.icon}`} />
          </motion.div>
          <span className="text-white/70 text-[11px] font-medium max-w-[280px] truncate">
            {displayedText}
            <span className="animate-pulse ml-0.5">▋</span>
          </span>
        </button>
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <ThoughtStreamPanel
            thoughts={thoughts}
            mood={mood}
            moralAlignment={moralAlignment}
            onClose={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}