// NPCEntity.jsx — Visual NPC in the world with proximity interaction

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { openDialogue } from './npcQuestStore';
import { QuestState } from './questData';

const STATE_INDICATOR = {
  [QuestState.NONE]:          { color: '#6ec3ff', icon: '❕', pulse: true  },
  [QuestState.ACTIVE]:        { color: '#fbbf24', icon: '📋', pulse: false },
  [QuestState.READY_TO_TURN]: { color: '#34d399', icon: '❗', pulse: true  },
  [QuestState.COMPLETED]:     { color: '#a78bfa', icon: '✓',  pulse: false },
};

export default function NPCEntity({ npc, questEntry, questId, playerNearby }) {
  const [bobY, setBobY] = useState(0);
  const questState = questEntry?.state || QuestState.NONE;
  const indicator = STATE_INDICATOR[questState];

  // Idle bobbing animation
  useEffect(() => {
    let t = 0;
    const id = setInterval(() => {
      t += 0.05;
      setBobY(Math.sin(t) * 3);
    }, 30);
    return () => clearInterval(id);
  }, []);

  const handleInteract = () => {
    openDialogue(npc.id, questId);
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Quest state indicator above NPC */}
      {indicator && (
        <AnimatePresence>
          <motion.div
            className="absolute -top-10 flex flex-col items-center gap-1"
            animate={indicator.pulse ? { y: [0, -4, 0] } : {}}
            transition={indicator.pulse ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : {}}
          >
            <div className="text-base">{indicator.icon}</div>
            {indicator.pulse && (
              <motion.div
                className="w-2 h-2 rounded-full"
                animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.3, 0.8] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ background: indicator.color }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* NPC avatar */}
      <motion.div
        style={{ translateY: bobY }}
        className="relative"
      >
        <div
          className="w-14 h-20 rounded-xl flex flex-col items-center justify-center text-3xl cursor-pointer transition-all"
          style={{
            background: playerNearby
              ? 'rgba(110,195,255,0.12)'
              : 'rgba(255,255,255,0.04)',
            border: playerNearby
              ? '1.5px solid rgba(110,195,255,0.45)'
              : '1px solid rgba(255,255,255,0.10)',
            boxShadow: playerNearby ? '0 0 20px rgba(110,195,255,0.15)' : 'none',
          }}
          onClick={handleInteract}
        >
          <div>{npc.icon || '🧍'}</div>
          <div className="text-[8px] tracking-[0.15em] uppercase mt-1 font-semibold"
            style={{ color: playerNearby ? '#6ec3ff' : 'rgba(255,255,255,0.3)' }}>
            {npc.name}
          </div>
        </div>

        {/* Interaction prompt */}
        <AnimatePresence>
          {playerNearby && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md"
                style={{
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(110,195,255,0.4)',
                }}>
                <kbd className="text-[9px] font-bold px-1 rounded"
                  style={{ background: 'rgba(110,195,255,0.2)', color: '#6ec3ff' }}>
                  E
                </kbd>
                <span className="text-[9px] text-white/60">Talk</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}