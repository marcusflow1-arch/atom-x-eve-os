import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Zap } from 'lucide-react';

const BASE_XP = 100;
const XP_EXPONENT = 1.35;
const GENRE_TO_GLOBAL_RATIO = 0.3;
const GAMEPLAY_TO_KNOWLEDGE_RATIO = 0.12;
const KNOWLEDGE_LEVEL_CAP = 300;

function xpToNextLevel(level) {
  return Math.round(BASE_XP * Math.pow(Math.max(1, level || 1), XP_EXPONENT));
}

function xpToNextKnowledgeLevel(level) {
  return Math.round(140 * Math.pow(Math.max(1, level || 1), 1.18));
}

/**
 * CombatXPHandler — listens for 'combatXPReward' events from the 3D combat system,
 * updates the AvatarProgression entity (genre + global XP/levels),
 * and shows a floating "+XP" notification on screen.
 */
export default function CombatXPHandler() {
  const [floaters, setFloaters] = useState([]);
  const nextId = useRef(0);

  useEffect(() => {
    const handleXP = async (e) => {
      const { xp, genre, source } = e.detail || {};
      if (!xp || xp <= 0) return;

      // Show floating notification immediately
      const id = nextId.current++;
      setFloaters(prev => [...prev, { id, xp, genre, source }]);
      setTimeout(() => {
        setFloaters(prev => prev.filter(f => f.id !== id));
      }, 2500);

      // Browser combat events are presentation only. Verified backend rewards
      // own avatar XP; an editable CustomEvent must never grant levels or points.
      window.dispatchEvent(new CustomEvent('syncPlayerStats'));
    };

    window.addEventListener('combatXPReward', handleXP);
    return () => window.removeEventListener('combatXPReward', handleXP);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <AnimatePresence>
        {floaters.map(f => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -80, scale: 1 }}
            exit={{ opacity: 0, y: -160, scale: 0.6 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="absolute flex items-center gap-2 px-4 py-2 rounded-full pointer-events-none"
            style={{
              left: '50%',
              top: '45%',
              transform: 'translateX(-50%)',
              background: 'rgba(34, 197, 94, 0.25)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)',
            }}
          >
            <Zap className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-bold text-lg">Practice +{f.xp} XP</span>
            {f.genre && <span className="text-green-400/60 text-sm font-medium ml-1">({f.genre})</span>}
            {f.source && <span className="text-white/40 text-xs ml-1">— {f.source}</span>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}