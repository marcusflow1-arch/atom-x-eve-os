import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function DevSpotlightRibbon({ onOpenOverlay }) {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      onClick={onOpenOverlay}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }); }}
      onMouseMove={handleMouseMove}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="relative w-full rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, rgba(180, 195, 215, 0.10) 0%, rgba(140, 160, 185, 0.07) 40%, rgba(200, 210, 225, 0.09) 100%)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: isHovered
          ? '0 12px 40px rgba(0,0,0,0.35), 0 0 20px rgba(200,210,230,0.06), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.03)'
          : '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.02)',
        transition: 'box-shadow 0.4s ease'
      }}
    >
      {/* Liquid-glass shine effect */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0.4,
          background: `radial-gradient(ellipse 120% 80% at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,255,255,0.08) 0%, transparent 60%)`
        }}
      />

      {/* Sweep shine on hover */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `linear-gradient(${110 + (mousePos.x - 0.5) * 50}deg, transparent ${mousePos.x * 100 - 20}%, rgba(255,255,255,0.07) ${mousePos.x * 100}%, transparent ${mousePos.x * 100 + 20}%)`
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center gap-4 px-6 py-5">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(59,130,246,0.10) 100%)',
            border: '1px solid rgba(34,211,238,0.25)',
            boxShadow: '0 0 12px rgba(34,211,238,0.1)'
          }}
        >
          <Sparkles className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.5))' }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm tracking-wide">Developer Spotlight</h3>
          <p className="text-white/30 text-[11px] mt-0.5">Recently released cards from studios</p>
        </div>

        {/* Arrow hint */}
        <div className="flex-shrink-0 text-white/20 group-hover:text-white/40 transition-colors">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="opacity-40">
            <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Bottom edge highlight */}
      <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </motion.div>
  );
}