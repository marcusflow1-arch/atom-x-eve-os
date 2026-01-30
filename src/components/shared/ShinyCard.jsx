import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function ShinyCard({ children, onClick, className = "" }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

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
        scale: 0.6375,
        transformStyle: "preserve-3d",
      }}
      className={`relative rounded-xl overflow-hidden cursor-pointer group m-1 ${className}`}
      >
      {children}

      {/* Shine Effect Overlay */}
      <motion.div 
        style={{
          opacity: useTransform(rotateX, (val) => Math.abs(val) / 20 + 0.1),
          background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 55%, transparent 80%)",
          transform: useTransform(mouseX, [-0.5, 0.5], ["translateX(-100%)", "translateX(100%)"]),
        }}
        className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
      />
    </motion.div>
  );
}