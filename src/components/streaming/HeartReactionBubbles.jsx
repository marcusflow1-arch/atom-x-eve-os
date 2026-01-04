import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Bubble = ({ id, x, scale, duration, delay, onComplete }) => {
  return (
    <motion.div
      initial={{ y: 0, opacity: 0, scale: 0 }}
      animate={{ 
        y: -400, 
        opacity: [0, 0.8, 0],
        scale: [0, scale, scale * 1.2],
        x: [x, x + (Math.random() * 40 - 20), x - (Math.random() * 40 - 20), x]
      }}
      transition={{ duration: duration, delay: delay, ease: "easeOut" }}
      onAnimationComplete={() => onComplete(id)}
      className="absolute bottom-0 pointer-events-none z-10"
      style={{ left: `${x}%` }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
          fill="url(#heart-gradient)" 
          stroke="rgba(255,255,255,0.4)" 
          strokeWidth="1"
        />
        <defs>
          <linearGradient id="heart-gradient" x1="2" y1="3" x2="22" y2="21.35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ec4899" stopOpacity="0.4" />
            <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* Soap bubble reflection */}
        <ellipse cx="8" cy="7" rx="3" ry="1.5" fill="rgba(255,255,255,0.6)" transform="rotate(-45 8 7)" />
      </svg>
    </motion.div>
  );
};

export default function HeartReactionBubbles({ trigger }) {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    if (trigger) {
      // Spawn a burst of bubbles
      const newBubbles = Array.from({ length: 3 + Math.floor(Math.random() * 3) }).map((_, i) => ({
        id: Date.now() + i,
        x: 20 + Math.random() * 60, // Random horizontal position 20-80%
        scale: 0.8 + Math.random() * 0.7,
        duration: 2 + Math.random() * 2,
        delay: i * 0.1
      }));
      setBubbles(prev => [...prev, ...newBubbles]);
    }
  }, [trigger]);

  const removeBubble = (id) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <AnimatePresence>
        {bubbles.map(bubble => (
          <Bubble 
            key={bubble.id} 
            {...bubble} 
            onComplete={removeBubble} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}