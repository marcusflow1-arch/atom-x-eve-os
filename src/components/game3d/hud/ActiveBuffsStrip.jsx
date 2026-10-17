import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeBuffs } from '../skills/buffEngine';
import { activeBuffList, buffMeta, fmt } from './buffDisplay';

/**
 * Small horizontal strip of icons shown ABOVE the HP bar.
 * Each icon represents one active self-cast buff and displays the
 * remaining seconds. Icons appear/disappear as buffs activate / expire.
 *
 * Buffs come from the live buff engine (skills/buffEngine.jsx): the
 * ACTIVE_BUFF skills cast from the skill-slot keys 1–8 (Aegis Shield,
 * Focus, Decisive Blow, God's Deflection, Heaven's Riposte, Power Charge,
 * …). Focus also shows its empowered hits left. Passive auras are NOT
 * shown here.
 */

export default function ActiveBuffsStrip() {
  const [, force] = useState(0);
  const [buffs, setBuffs] = useState(null);

  useEffect(() => subscribeBuffs((s) => setBuffs(s.buffs || {})), []);

  // Tick once per second so seconds counters update smoothly without burning CPU
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 200);
    return () => clearInterval(id);
  }, []);

  if (!buffs) return null;
  const active = activeBuffList(buffs);

  return (
    <div className="flex items-center gap-1.5 min-h-[26px]">
      <AnimatePresence>
        {active.map(({ key, remaining, hits }) => {
          const meta = buffMeta(key);
          return (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, scale: 0.6, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.6, x: 8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="relative flex items-center justify-center w-8 h-8 rounded"
              style={{
                background: `linear-gradient(135deg, ${meta.color}33 0%, ${meta.color}11 100%)`,
                border: `1px solid ${meta.color}88`,
                boxShadow: `0 0 6px ${meta.color}55`,
              }}
              title={meta.label}
            >
              <span
                className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-black tabular-nums leading-none whitespace-nowrap"
                style={{ color: meta.color, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
              >
                {fmt(remaining)}
              </span>
              <span className="text-[14px] leading-none">{meta.icon}</span>
              {hits !== undefined && (
                <span
                  className="absolute -bottom-1 -right-1 text-[9px] font-black tabular-nums leading-none"
                  style={{ color: meta.color, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
                >
                  ×{hits}
                </span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}