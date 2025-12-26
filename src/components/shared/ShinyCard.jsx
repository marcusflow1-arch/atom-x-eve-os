1: import React from 'react';
   2: import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
   3: 
   4: export default function ShinyCard({ children, onClick, className = "" }) {
   5:   const x = useMotionValue(0);
   6:   const y = useMotionValue(0);
   7:   const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
   8:   const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
   9:   const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  10:   const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  11: 
  12:   function handleMouseMove(event) {
  13:     const rect = event.currentTarget.getBoundingClientRect();
  14:     const width = rect.width;
  15:     const height = rect.height;
  16:     const mouseXPos = event.clientX - rect.left;
  17:     const mouseYPos = event.clientY - rect.top;
  18:     const xPct = mouseXPos / width - 0.5;
  19:     const yPct = mouseYPos / height - 0.5;
  20:     x.set(xPct);
  21:     y.set(yPct);
  22:   }
  23: 
  24:   function handleMouseLeave() {
  25:     x.set(0);
  26:     y.set(0);
  27:   }
  28: 
  29:   return (
  30:     <motion.div
  31:       onMouseMove={handleMouseMove}
  32:       onMouseLeave={handleMouseLeave}
  33:       onClick={onClick}
  34:       style={{ 
  35:         rotateX, 
  36:         rotateY,
  37:         transformStyle: "preserve-3d",
  38:       }}
  39:       className={`relative rounded-xl overflow-hidden cursor-pointer group ${className}`}
  40:     >
  41:       {children}
  42: 
  43:       {/* Shine Effect Overlay */}
  44:       <motion.div 
  45:         style={{
  46:           opacity: useTransform(rotateX, (val) => Math.abs(val) / 20 + 0.1),
  47:           background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 55%, transparent 80%)",
  48:           transform: useTransform(mouseX, [-0.5, 0.5], ["translateX(-100%)", "translateX(100%)"]),
  49:         }}
  50:         className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
  51:       />
  52:     </motion.div>
  53:   );
  54: }