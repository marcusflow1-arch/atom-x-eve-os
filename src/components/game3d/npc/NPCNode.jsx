// NPCNode.jsx — Single NPC entity with trust indicator + quest state marker

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestState } from './questNetwork';
import CharacterSprite from './CharacterSprite';

const STATE_MARKER = {
  [QuestState.NONE]:           { icon: '❕', color: '#fbbf24', pulse: true  },
  [QuestState.ACTIVE]:         { icon: '📍', color: '#6ec3ff', pulse: false },
  [QuestState.READY_TO_TURN]:  { icon: '✅', color: '#34d399', pulse: true  },
  [QuestState.COMPLETED]:      { icon: '☑️',  color: '#a78bfa', pulse: false },
};

export default function NPCNode({ npc, questEntry, questId, trust, playerNearby, onInteract, hidden }) {
  const [bob, setBob] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setBob(p => p + 1), 700);
    return () => clearInterval(iv);
  }, []);

  if (hidden) return null;

  const questState = questEntry?.state || QuestState.NONE;
  const marker = STATE_MARKER[questState];
  const trustLabel = trust > 50 ? 'Ally' : trust < -20 ? 'Hostile' : 'Neutral';
  const trustColor = trust > 50 ? '#34d399' : trust < -20 ? '#f87171' : 'rgba(255,255,255,0.35)';

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Quest state marker */}
      <motion.div
        animate={{ y: marker.pulse ? [0, -3, 0] : 0 }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="text-base"
      >
        {marker.icon}
      </motion.div>

      {/* NPC body */}
      <motion.div
        animate={{ y: [0, bob % 2 === 0 ? -2 : 0, 0] }}
        transition={{ duration: 0.7 }}
        onClick={() => onInteract(npc, questId)}
        className="relative cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {(npc.id === 'npc_stranger' || npc.usesSprite) ? (
          <CharacterSprite color={npc.color} isNPC={true} glow={playerNearby} size="md" />
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: npc.accent,
              border: `2px solid ${npc.color}60`,
              boxShadow: playerNearby ? `0 0 16px ${npc.color}50` : 'none',
            }}>
            {npc.icon}
          </div>
        )}

        {/* Trust ring */}
        <div className="absolute -bottom-1 -right-1 px-1 rounded text-[8px] font-bold"
          style={{ background: 'rgba(8,12,20,0.9)', color: trustColor, border: `1px solid ${trustColor}40` }}>
          {trust > 0 ? '+' : ''}{trust}
        </div>
      </motion.div>

      {/* Name + alignment */}
      <div className="text-center">
        <div className="text-[11px] font-bold" style={{ color: npc.color }}>{npc.name}</div>
        <div className="text-[8px] uppercase tracking-[0.2em]" style={{ color: trustColor }}>{trustLabel}</div>
      </div>

      {/* Interact prompt */}
      <AnimatePresence>
        {playerNearby && questState !== QuestState.ACTIVE && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase"
            style={{
              background: `${npc.color}15`,
              border: `1px solid ${npc.color}40`,
              color: npc.color,
            }}
          >
            [E] Talk
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}