import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuraBackground({ isLive }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    // We could do a complex canvas animation here, but for reliability and performance
    // in this environment, CSS-based complex gradients are often smoother.
    // However, the prompt asks for "Slow moving ink in water".
    // We'll use a high-fidelity CSS animation on multiple layers.
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0f172a]">
      {/* Base Layer: Deep Teal/Purple or Active Gold */}
      <motion.div
        className="absolute inset-0 transition-colors duration-[2000ms] ease-in-out"
        animate={{
          background: isLive
            ? 'linear-gradient(135deg, #1a0505 0%, #3f1808 50%, #1a0505 100%)' // Dark Red/Gold Base
            : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', // Deep Slate/Midnight Base
        }}
      />

      {/* Fluid Orbs Layer */}
      <div className="absolute inset-0 opacity-60 mix-blend-screen filter blur-[80px]">
        <motion.div
          className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full"
          animate={{
            background: isLive
              ? 'radial-gradient(circle, rgba(234,179,8,0.3) 0%, transparent 70%)' // Gold
              : 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)', // Teal
            x: [0, 50, -30, 0],
            y: [0, -40, 20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-20%] right-[-10%] w-[80vw] h-[80vw] rounded-full"
          animate={{
            background: isLive
              ? 'radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 70%)' // Red
              : 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', // Violet
            x: [0, -60, 40, 0],
            y: [0, 50, -30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Volumetric Fog (#7) */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
            backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")',
            filter: 'contrast(150%) brightness(100%)'
        }} 
      />
      
      {/* Spotlighting */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none mix-blend-overlay" />
    </div>
  );
}