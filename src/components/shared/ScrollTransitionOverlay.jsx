import React from 'react';
import { motion } from 'framer-motion';

export default function ScrollTransitionOverlay({ mode = 'slide', direction = 'up', duration = 0.6, topOffset = 0, onComplete }) {
  const initialY = direction === 'up' ? '100%' : '-100%';
  const animateY = '0%';
  const variants = mode === 'fade'
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { y: initialY }, animate: { y: animateY } };

  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => onComplete && onComplete()}
      className="fixed z-[100] overflow-hidden"
      style={{ top: topOffset, left: 0, right: 0, bottom: 0 }}
    >
      {/* Background base */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-black" />
      {/* Subtle stripes to imply motion */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient( to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 8px )',
        }}
      />
      {/* Soft glow accents */}
      <div className="absolute -top-24 left-1/3 w-[60vw] h-48 bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[50vw] h-40 bg-cyan-400/10 blur-3xl" />
    </motion.div>
  );
}