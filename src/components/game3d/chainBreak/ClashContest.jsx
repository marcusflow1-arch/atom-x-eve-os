// Clash System — Real-time input contest UI

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addClashInput, resolveClash } from './chainBreakStore';

const CLASH_DURATION = 3000; // ms
const MAX_SCORE = 20;

export default function ClashContest({ clashActive, clashScore, onResolved }) {
  const [timeLeft, setTimeLeft] = useState(100); // %
  const [shaking, setShaking] = useState(false);
  const intervalRef = useRef(null);
  const resolved = useRef(false);

  useEffect(() => {
    if (!clashActive) return;
    resolved.current = false;
    setTimeLeft(100);
    const start = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / CLASH_DURATION) * 100);
      setTimeLeft(remaining);

      if (remaining <= 0 && !resolved.current) {
        resolved.current = true;
        clearInterval(intervalRef.current);
        // Simulate opponent score for demo
        const opponentScore = Math.floor(MAX_SCORE * 0.5);
        resolveClash(opponentScore);
        onResolved?.();
      }
    }, 50);

    return () => clearInterval(intervalRef.current);
  }, [clashActive]);

  const handlePress = () => {
    if (!clashActive || resolved.current) return;
    addClashInput();
    setShaking(true);
    setTimeout(() => setShaking(false), 80);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space' || e.code === 'KeyZ') handlePress();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clashActive]);

  const pct = Math.min(100, (clashScore / MAX_SCORE) * 100);

  return (
    <AnimatePresence>
      {clashActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            animate={shaking ? { x: [-3, 3, -3, 3, 0] } : {}}
            transition={{ duration: 0.08 }}
            className="text-center pointer-events-auto"
          >
            {/* CLASH Header */}
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-3xl font-black tracking-[0.5em] uppercase mb-6"
              style={{ color: '#f59e0b', textShadow: '0 0 30px rgba(245,158,11,0.8)' }}
            >
              ⚔ CLASH ⚔
            </motion.div>

            {/* Timer bar */}
            <div className="w-64 h-2 rounded-full mb-6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${timeLeft}%` }}
                transition={{ duration: 0.05 }}
                style={{
                  background: timeLeft > 40 ? '#34d399' : timeLeft > 20 ? '#fbbf24' : '#ef4444',
                  boxShadow: `0 0 8px ${timeLeft > 40 ? '#34d39988' : '#ef444488'}`,
                }}
              />
            </div>

            {/* Score bar */}
            <div className="w-64 mb-3">
              <div className="flex justify-between text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span>Your Power</span>
                <span>{clashScore} / {MAX_SCORE}</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.1 }}
                  style={{
                    background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                    boxShadow: '0 0 10px rgba(99,102,241,0.6)',
                  }}
                />
              </div>
            </div>

            {/* Input Button */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handlePress}
              className="w-40 h-14 rounded-xl font-black text-lg tracking-widest uppercase mt-2 transition-all"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: '2px solid rgba(99,102,241,0.6)',
                color: '#fff',
                boxShadow: '0 0 20px rgba(99,102,241,0.4)',
              }}
            >
              MASH!
            </motion.button>
            <div className="text-[9px] mt-2 tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
              SPACE / Z key
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}