// LivingQuestNPC.jsx — Special oversized NPC that launches the Living Quest scenario.
// Placed away from the other quest-givers, larger than them, kept inside the map,
// with a floating "LIVING QUEST" banner above its head.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const COLOR = '#a855f7';

export default function LivingQuestNPC({ playerNearby, onLaunch }) {
  const [bob, setBob] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setBob(p => p + 1), 700);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ transform: 'scale(1.5)' }}>
      {/* Floating banner above head */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap"
        style={{ background: 'rgba(8,12,20,0.95)', border: `1px solid ${COLOR}60`, boxShadow: `0 0 18px ${COLOR}40` }}
      >
        <Sparkles className="w-3 h-3" style={{ color: COLOR }} />
        <span className="text-[9px] font-bold tracking-[0.25em] uppercase" style={{ color: COLOR }}>Living Quest</span>
      </motion.div>

      {/* NPC body — larger glowing avatar */}
      <motion.div
        animate={{ y: [0, bob % 2 === 0 ? -3 : 0, 0] }}
        transition={{ duration: 0.7 }}
        onClick={onLaunch}
        className="relative cursor-pointer"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Aura ring */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          className="absolute -inset-3 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${COLOR}40 0%, transparent 70%)` }}
        />
        <div className="w-16 h-16 rounded-full overflow-hidden"
          style={{
            border: `2px solid ${COLOR}`,
            boxShadow: playerNearby ? `0 0 26px ${COLOR}80` : `0 0 14px ${COLOR}50`,
          }}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c5d34984a_ChatGPTImageJul22202503_41_59PM.png"
            alt="Eve"
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>

      {/* Name */}
      <div className="text-center">
        <div className="text-[11px] font-bold" style={{ color: COLOR }}>Eve</div>
        <div className="text-[8px] uppercase tracking-[0.2em] text-white/40">Architect</div>
      </div>

      {/* Launch prompt */}
      {playerNearby && (
        <motion.div
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase"
          style={{ background: `${COLOR}15`, border: `1px solid ${COLOR}40`, color: COLOR }}
        >
          [E] Begin
        </motion.div>
      )}
    </div>
  );
}