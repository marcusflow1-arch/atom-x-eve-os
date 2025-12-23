import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export const LiquidGlassCard = ({ children, className = "", hover = true, onClick }) => {
  const x = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const waveX = useTransform(mouseX, [0, 1], ["-100%", "200%"]);

  return (
    <motion.div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${hover ? 'cursor-pointer hover:shadow-[0_0_50px_rgba(100,150,255,0.15)]' : ''} ${className}`}
      style={{
        background: 'rgba(100, 120, 140, 0.12)',
        backdropFilter: 'blur(20px) saturate(130%)',
        WebkitBackdropFilter: 'blur(20px) saturate(130%)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
      onMouseMove={({ currentTarget, clientX }) => {
        const { left, width } = currentTarget.getBoundingClientRect();
        x.set((clientX - left) / width);
      }}
      onMouseLeave={() => x.set(0.5)}
      whileHover={hover ? { scale: 1.02, y: -4 } : {}}
    >
      {hover && (
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/8 to-transparent -skew-x-12"
          style={{ left: waveX, width: "60%", height: "100%" }}
        />
      )}
      {children}
    </motion.div>
  );
};

export default LiquidGlassCard;