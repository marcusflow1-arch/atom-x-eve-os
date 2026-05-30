// Clan Finisher Cinematic Overlay

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CLAN_CONFIG = {
  WOLF: {
    label: '🐺 Wolf Spirit',
    subtitle: 'Fast multi-strike — Spirit wolf surges forward',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.4)',
    bg: 'rgba(30,58,138,0.85)',
    border: 'rgba(96,165,250,0.4)',
    icon: '🐺',
    strikes: 5,
  },
  BEAR: {
    label: '🐻 Bear Slam',
    subtitle: 'Heavy impact — Spirit bear crushes from above',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.4)',
    bg: 'rgba(124,45,18,0.85)',
    border: 'rgba(249,115,22,0.4)',
    icon: '🐻',
    strikes: 1,
  },
  SHADOW: {
    label: '🌑 Shadow Execution',
    subtitle: 'Silent assassin — Duplicate phases through target',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.4)',
    bg: 'rgba(46,16,101,0.85)',
    border: 'rgba(167,139,250,0.4)',
    icon: '🌑',
    strikes: 3,
  },
};

export default function ClanFinisher({ finisherActive, finisherClan }) {
  const config = CLAN_CONFIG[finisherClan] || CLAN_CONFIG.WOLF;

  return (
    <AnimatePresence>
      {finisherActive && (
        <motion.div
          key="finisher"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        >
          {/* Radial glow */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${config.glow} 0%, transparent 65%)`,
            }}
          />

          <div className="relative text-center z-10">
            {/* Clan icon pulse */}
            <motion.div
              animate={{ scale: [1, 1.3, 0.9, 1.15, 1], opacity: [0.5, 1, 0.8, 1] }}
              transition={{ duration: 0.6, times: [0, 0.2, 0.5, 0.8, 1] }}
              className="text-8xl mb-4 block"
            >
              {config.icon}
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-4xl font-black tracking-[0.3em] uppercase mb-2"
              style={{ color: config.color, textShadow: `0 0 40px ${config.glow}` }}
            >
              {config.label}
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm tracking-[0.2em] uppercase"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              {config.subtitle}
            </motion.div>

            {/* Strike indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-2 justify-center mt-5"
            >
              {Array.from({ length: config.strikes }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.12, type: 'spring', stiffness: 300 }}
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: config.color,
                    boxShadow: `0 0 8px ${config.glow}`,
                  }}
                />
              ))}
            </motion.div>

            {/* Chain Complete badge */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}
              className="inline-block mt-6 px-6 py-2 rounded-full text-sm font-bold tracking-[0.3em] uppercase"
              style={{
                background: config.bg,
                border: `1px solid ${config.border}`,
                color: config.color,
                boxShadow: `0 0 20px ${config.glow}`,
              }}
            >
              CHAIN COMPLETE
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}