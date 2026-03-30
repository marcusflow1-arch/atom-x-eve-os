import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function MiniAchievementCard({ achievement, size = 50 }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);

  // Return null if no achievement provided
  if (!achievement) return null;

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const xPct = (event.clientX - rect.left) / rect.width - 0.5;
    const yPct = (event.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const rarityColors = {
    Common: 'from-gray-400 to-gray-600',
    Uncommon: 'from-green-400 to-green-600',
    Rare: 'from-blue-400 to-blue-600',
    Epic: 'from-purple-400 to-purple-600',
    Legendary: 'from-yellow-400 to-orange-500',
    Mythical: 'from-red-400 to-pink-500'
  };

  const rarityGlow = {
    Common: 'rgba(156, 163, 175, 0.3)',
    Uncommon: 'rgba(74, 222, 128, 0.3)',
    Rare: 'rgba(96, 165, 250, 0.4)',
    Epic: 'rgba(192, 132, 252, 0.4)',
    Legendary: 'rgba(251, 191, 36, 0.5)',
    Mythical: 'rgba(248, 113, 113, 0.5)'
  };

  const rarity = achievement?.rarity || 'Common';

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ 
        rotateX, 
        rotateY,
        transformStyle: "preserve-3d",
        width: size,
        height: size * 1.4
      }}
      className="relative cursor-pointer"
    >
      {/* Card Container */}
      <div 
        className={`w-full h-full rounded-lg overflow-hidden relative bg-gradient-to-br ${rarityColors[rarity]}`}
        style={{
          boxShadow: isHovered 
            ? `0 0 20px ${rarityGlow[rarity]}, 0 4px 15px rgba(0,0,0,0.4)`
            : '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'box-shadow 0.3s ease'
        }}
      >
        {/* Gloss Overlay */}
        <motion.div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            opacity: isHovered ? 0.6 : 0.2,
            background: useTransform(
              mouseX, 
              [-0.5, 0.5], 
              [
                "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 80%)",
                "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 80%)"
              ]
            ),
            transform: useTransform(mouseX, [-0.5, 0.5], ["translateX(-50%)", "translateX(50%)"]),
          }}
        />

        {/* Achievement Icon */}
        <div className="w-full h-full flex items-center justify-center p-1">
          <span className="text-lg">{achievement?.icon || '🏆'}</span>
        </div>

        {/* Rarity Indicator */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${rarityGlow[rarity].replace('0.', '0.8')}, transparent)`
          }}
        />
      </div>

      {/* Tooltip on hover */}
      {isHovered && achievement?.title && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 text-white text-[10px] px-2 py-1 rounded z-50"
        >
          {achievement.title}
        </motion.div>
      )}
    </motion.div>
  );
}