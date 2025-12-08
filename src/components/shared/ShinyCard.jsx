import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function ShinyCard({ index, children, onClick }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = event.clientX - rect.left;
    const mouseYPos = event.clientY - rect.top;
    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ 
        rotateX, 
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative aspect-[3/4] rounded-xl bg-slate-900/40 backdrop-blur-md border border-white/10 overflow-hidden cursor-pointer group shadow-lg"
    >
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center transform-style-3d">
        {children || <div className="w-8 h-8 rounded-full bg-white/5" />}
      </div>

      {/* Shiny Effect Overlay */}
      <motion.div 
        style={{
          opacity: useTransform(rotateX, (val) => Math.abs(val) / 30 + 0.1),
          background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 80%)",
          transform: useTransform(mouseX, [-0.5, 0.5], ["translateX(-100%)", "translateX(100%)"]),
        }}
        className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay"
      />
    </motion.div>
  );
}