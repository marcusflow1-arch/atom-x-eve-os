import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function StreamerCard({ name, avatar, game, isSelected, onClick }) {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const rotateX = isHovered ? (mousePos.y - 0.5) * -12 : 0;
  const rotateY = isHovered ? (mousePos.x - 0.5) * 12 : 0;

  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer" onClick={onClick}>
      {/* Game name above card */}
      <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 truncate max-w-[140px] text-center">
        {game || 'Offline'}
      </span>

      {/* Card */}
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }); }}
        animate={{
          rotateX,
          rotateY,
          scale: isSelected ? 1.08 : isHovered ? 1.04 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ perspective: 800, transformStyle: 'preserve-3d' }}
        className={`relative w-[130px] h-[180px] rounded-2xl overflow-hidden border transition-colors duration-300 ${
          isSelected
            ? 'border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.15)]'
            : 'border-white/10 hover:border-white/25'
        }`}
      >
        {/* Background image */}
        <img
          src={avatar}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Shine effect */}
        <div
          className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300 rounded-2xl"
          style={{
            opacity: isHovered ? 0.5 : 0,
            background: `linear-gradient(105deg, transparent ${mousePos.x * 100 - 25}%, rgba(255,255,255,0.35) ${mousePos.x * 100}%, transparent ${mousePos.x * 100 + 25}%)`,
          }}
        />

        {/* Selected ring glow */}
        {isSelected && (
          <div className="absolute inset-0 rounded-2xl border-2 border-white/30 pointer-events-none z-20" />
        )}

        {/* Streamer name at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <h3 className="text-white font-bold text-sm text-center drop-shadow-lg leading-tight">
            {name}
          </h3>
        </div>
      </motion.div>
    </div>
  );
}