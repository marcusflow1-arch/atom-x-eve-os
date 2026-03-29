import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

function MysteryBox() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (isClicked) return;
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    setActiveIndex(prev => prev + 1);
  };

  const frontBoxStyle = {
    background: 'linear-gradient(135deg, rgba(200, 210, 225, 0.08) 0%, rgba(160, 175, 195, 0.05) 100%)',
    backdropFilter: 'blur(24px) saturate(150%)',
    WebkitBackdropFilter: 'blur(24px) saturate(150%)',
    border: '1px solid rgba(255, 255, 255, 0.10)',
    boxShadow: isHovered ?
    '0 6px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.10)' :
    '0 2px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)'
  };

  const backBoxStyle = {
    background: isClicked 
      ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%)' 
      : 'linear-gradient(135deg, rgba(15, 20, 30, 0.8) 0%, rgba(5, 10, 15, 0.9) 100%)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: isClicked ? 'inset 0 0 20px rgba(0,0,0,0.8)' : '0 15px 30px rgba(0,0,0,0.5)'
  };

  return (
    <div 
      className="relative w-[226px] h-[84px] flex-shrink-0 cursor-pointer group"
      style={{ perspective: 1200 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {setIsHovered(false);setMousePos({ x: 0.5, y: 0.5 });}}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
      }}
      onClick={handleClick}
    >
      {/* Background Box 3 (Farthest) */}
      <motion.div
        className="absolute inset-0 rounded-xl flex items-center justify-center transition-all duration-300 pointer-events-none"
        style={{ ...backBoxStyle, transformOrigin: 'top' }}
        animate={{ 
          scale: 0.75, 
          y: -44, 
          z: -120,
          rotateX: isClicked ? -4 : 0, 
          opacity: 0.2
        }}
      />

      {/* Background Box 2 (Middle) */}
      <motion.div
        className="absolute inset-0 rounded-xl flex items-center justify-center transition-all duration-300 pointer-events-none"
        style={{ ...backBoxStyle, transformOrigin: 'top' }}
        animate={{ 
          scale: 0.80, 
          y: -36, 
          z: -80,
          rotateX: isClicked ? -7 : 0, 
          opacity: 0.5
        }}
      />

      {/* Background Box 1 (The next item) */}
      <motion.div
        className="absolute inset-0 rounded-xl flex items-center justify-center transition-all duration-300 pointer-events-none"
        style={{ ...backBoxStyle, transformOrigin: 'top' }}
        animate={{ 
          scale: 0.85, 
          y: -28, 
          z: -40,
          rotateX: isClicked ? -10 : 0, 
          opacity: 0.8
        }}
      >
        <span className="text-white/30 text-xl font-bold">?</span>
      </motion.div>

      {/* Foreground Box */}
      <AnimatePresence>
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0.8, scale: 0.85, y: -28, z: -40, rotateX: 0 }}
          animate={{ 
            opacity: 1, 
            scale: isHovered ? 1.02 : 1, 
            y: isHovered ? -2 : 0, 
            z: 0,
            rotateX: 0 
          }}
          exit={{ 
            opacity: 0, 
            scale: 1.05, 
            y: 40, 
            z: 50,
            rotateX: -60, 
            filter: 'blur(8px)',
            transition: { duration: 0.4, ease: "easeIn" }
          }}
          transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
          className="absolute inset-0 rounded-xl flex items-center justify-center overflow-hidden origin-bottom"
          style={frontBoxStyle}
        >
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: isHovered ? 0.8 : 0.3,
              background: `radial-gradient(ellipse 120% 80% at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,255,255,0.06) 0%, transparent 60%)`
            }} 
          />
          <span className="text-white/20 text-xl font-bold relative z-10">?</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

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
    <div className="w-full flex flex-col items-start gap-2 pt-6">
      {/* Title above — left-aligned */}
      <div className="flex items-center gap-2 ml-1">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400/60" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Developer Spotlight</span>
      </div>

      {/* Row: Spotlight box + 3 mystery boxes — left aligned */}
      <div className="w-full flex items-center gap-2 justify-start">
        {/* Spotlight box - compact */}
        <motion.div
          onClick={onOpenOverlay}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {setIsHovered(false);setMousePos({ x: 0.5, y: 0.5 });}}
          onMouseMove={handleMouseMove}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative rounded-xl overflow-hidden cursor-pointer w-[226px] flex-shrink-0"
          style={{
            height: '56px',
            background: 'linear-gradient(135deg, rgba(180, 195, 215, 0.10) 0%, rgba(140, 160, 185, 0.07) 40%, rgba(200, 210, 225, 0.09) 100%)',
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: isHovered ?
            '0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)' :
            '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
            transition: 'box-shadow 0.4s ease'
          }}>

          {/* Shine */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0.4,
              background: `radial-gradient(ellipse 120% 80% at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,255,255,0.08) 0%, transparent 60%)`
            }} />


          {/* Content */}
          <div className="relative z-10 flex items-center justify-center h-full px-3">
            <p className="text-white/50 text-[10px] font-semibold text-center leading-tight">Developer cards released</p>
          </div>

          <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </motion.div>

        {/* 3 Mystery boxes — same flex-1 sizing as spotlight */}
        <MysteryBox />
        <MysteryBox />
        <MysteryBox />
      </div>
    </div>);

}