import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Lightweight 3D tilt + holographic shine card wrapper for inventory items.
 * Same effect as ShinyCard / achievement cards.
 */
export default function InventoryShinyCard({ children, onClick, className = '', delay = 0 }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 200, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 200, damping: 20 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.02 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative cursor-pointer ${className}`}
    >
      {children}

      {/* Holographic shine sweep */}
      <motion.div
        style={{
          opacity: useTransform(rotateX, (v) => Math.abs(v) / 16 + 0.05),
          background:
            'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.25) 55%, transparent 80%)',
          transform: useTransform(mouseX, [-0.5, 0.5], ['translateX(-100%)', 'translateX(100%)']),
        }}
        className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay rounded-xl"
      />
    </motion.div>
  );
}