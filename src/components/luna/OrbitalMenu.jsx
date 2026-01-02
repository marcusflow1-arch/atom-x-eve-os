import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, BookOpen, Swords, Gamepad2, Layers 
} from 'lucide-react';

const ORBITAL_ITEMS = [
  {
    id: 'skill-tree',
    label: 'Skill Tree',
    icon: Layers,
    color: 'from-purple-500 to-pink-500',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    description: 'View & Unlock Abilities'
  },
  {
    id: 'battle',
    label: 'Battle Mode',
    icon: Swords,
    color: 'from-red-500 to-orange-500',
    route: 'Challenges',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    description: 'Enter Combat Arena'
  },
  {
    id: 'story',
    label: 'AI Story',
    icon: BookOpen,
    color: 'from-indigo-500 to-purple-500',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    description: 'Continue Your Journey'
  },
  {
    id: 'home',
    label: 'AI Home',
    icon: Home,
    color: 'from-green-500 to-emerald-500',
    route: 'Dashboard',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400',
    description: 'Personal Space'
  },
  {
    id: 'games',
    label: 'PINGAMES',
    icon: Gamepad2,
    color: 'from-cyan-500 to-blue-500',
    route: 'Library',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400',
    description: 'Your Game Library'
  }
];

/**
 * Orbital menu component for Luna dashboard
 * Currently unused but kept for reference
 * @param {Object} props
 * @param {number} props.activeIndex - Currently active item index
 * @param {Function} props.onItemClick - Click handler for items
 */
export default function OrbitalMenu({ activeIndex, onItemClick }) {
  const itemCount = ORBITAL_ITEMS.length;
  const angleStep = 360 / itemCount;

  const getItemPosition = (index) => {
    const angle = (index - activeIndex) * angleStep * (Math.PI / 180);
    const radius = 350;
    const x = Math.sin(angle) * radius;
    const y = Math.cos(angle) * radius;
    const scale = index === activeIndex ? 1 : 0.75;
    const opacity = index === activeIndex ? 1 : 0.5;
    const zIndex = index === activeIndex ? 20 : 10;

    return { x, y, scale, opacity, zIndex };
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {ORBITAL_ITEMS.map((item, index) => {
        const pos = getItemPosition(index);
        const Icon = item.icon;
        
        return (
          <motion.div
            key={item.id}
            animate={{
              x: pos.x,
              y: pos.y,
              scale: pos.scale,
              opacity: pos.opacity,
              zIndex: pos.zIndex
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            onClick={() => onItemClick(item)}
            className="absolute cursor-pointer"
          >
            <div 
              className="w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center backdrop-blur-md hover:scale-110 transition-transform"
            >
              <Icon className="w-8 h-8 text-white" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export { ORBITAL_ITEMS };