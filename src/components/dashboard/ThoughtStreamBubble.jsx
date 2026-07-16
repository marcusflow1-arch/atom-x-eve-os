import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import ThoughtStreamPanel from './ThoughtStreamPanel';

const MOOD_LABELS = {
  joyful: 'feeling joyful', content: 'content', neutral: 'contemplating',
  melancholic: 'reflective', irritable: 'unsettled', aggressive: 'on edge',
  contemplative: 'deep in thought', energetic: 'energized', tired: 'resting', curious: 'curious'
};

export default function ThoughtStreamBubble() {
  const { user } = useAuth();
  const [thoughts, setThoughts] = useState([]);
  const [mood, setMood] = useState('neutral');
  const [moralAlignment, setMoralAlignment] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const [decisions, states] = await Promise.all([
          base44.entities.AIDecisionLog.filter({ user_id: user.id }),
          base44.entities.AIBehaviorState.filter({ user_id: user.id }),
        ]);
        if (cancelled) return;
        const recent = (Array.isArray(decisions) ? decisions : decisions?.data || [])
          .filter(d => d.ai_reaction)
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
          .slice(0, 8);
        setThoughts(recent);
        const state = (Array.isArray(states) ? states : states?.data || [])[0];
        if (state) {
          setMood(state.current_mood || 'neutral');
          setMoralAlignment(state.moral_alignment || 0);
        }
      } catch (e) {
        console.error('ThoughtStream load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const latestThought = thoughts[0];
  const moodLabel = MOOD_LABELS[mood] || 'contemplating';

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
            borderColor: 'rgba(168, 85, 247, 0.25)',
            boxShadow: '0 4px 24px rgba(168, 85, 247, 0.12)',
          }}
        >
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <Brain className="w-3.5 h-3.5 text-purple-300" />
          </motion.div>
          <span className="text-white/70 text-[11px] font-medium max-w-[280px] truncate">
            {latestThought ? latestThought.ai_reaction : `AI is ${moodLabel}…`}
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