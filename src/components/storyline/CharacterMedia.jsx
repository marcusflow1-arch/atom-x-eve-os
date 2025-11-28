import React from 'react';
import { motion } from 'framer-motion';

export default function CharacterMedia({ media, character }) {
  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="relative"
      >
        {media.type === 'image' && (
          <motion.img
            src={media.src}
            alt={media.alt}
            className="max-w-full max-h-full object-contain rounded-lg"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              filter: `drop-shadow(0 0 20px ${character.themeColor}40)`,
            }}
          />
        )}
        {media.type === 'video' && (
          <motion.video
            src={media.src}
            poster={media.poster}
            autoPlay={media.loop}
            loop={media.loop}
            muted
            className="max-w-full max-h-full object-contain rounded-lg"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              filter: `drop-shadow(0 0 20px ${character.themeColor}40)`,
            }}
          />
        )}
        
        {/* Character glow effect */}
        <div 
          className="absolute inset-0 rounded-lg opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${character.themeColor}20 0%, transparent 70%)`,
            animation: 'pulse 4s ease-in-out infinite',
          }}
        />
      </motion.div>
    </div>
  );
}