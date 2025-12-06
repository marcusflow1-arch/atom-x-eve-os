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
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
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