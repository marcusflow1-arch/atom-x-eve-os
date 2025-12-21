import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, X, Layers, Swords, BookOpen } from 'lucide-react';

// Menu items for AI Home
const AI_HOME_ITEMS = [
  { 
    id: 'skill-tree', 
    label: 'Skill Tree', 
    icon: Layers, 
    color: 'from-purple-500 to-pink-500', 
    description: 'View & Unlock Abilities'
  },
  { 
    id: 'battle', 
    label: 'Battle Mode', 
    icon: Swords, 
    color: 'from-red-500 to-orange-500', 
    description: 'Enter Combat Arena'
  },
  { 
    id: 'story', 
    label: 'AI Story', 
    icon: BookOpen, 
    color: 'from-indigo-500 to-purple-500', 
    description: 'Continue Your Journey'
  },
  { 
    id: 'home', 
    label: 'AI Home', 
    icon: Home, 
    color: 'from-green-500 to-emerald-500', 
    description: 'Personal Space'
  },
];

export default function AIHomeOverlay({ onClose, onSelectItem }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleItemClick = (item) => {
    if (onSelectItem) {
      onSelectItem(item);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col"
    >
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 z-[120] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI Home</h1>
        </div>

        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area - 4 Menu Boxes */}
      <div className="flex-1 w-full h-full flex items-center justify-center px-8 pb-8 pt-24">
        <div className="grid grid-cols-2 gap-8 max-w-3xl w-full">
          {AI_HOME_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isHovered = hoveredItem === item.id;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleItemClick(item)}
                className="relative cursor-pointer group"
              >
                <motion.div
                  animate={{ 
                    scale: isHovered ? 1.02 : 1,
                    y: isHovered ? -5 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="relative aspect-[4/3] rounded-3xl overflow-hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: isHovered 
                      ? '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(100, 150, 255, 0.15)' 
                      : '0 10px 30px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Gradient Background */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}
                  />
                  
                  {/* Animated Border Glow */}
                  <motion.div 
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    animate={{ 
                      boxShadow: isHovered 
                        ? `inset 0 0 0 2px rgba(255, 255, 255, 0.2)` 
                        : 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Content */}
                  <div className="relative h-full flex flex-col items-center justify-center p-8">
                    {/* Icon */}
                    <motion.div
                      animate={{ scale: isHovered ? 1.1 : 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-2xl`}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </motion.div>
                    
                    {/* Label */}
                    <h3 className="text-2xl font-bold text-white mb-2 text-center">
                      {item.label}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-white/50 text-sm text-center">
                      {item.description}
                    </p>
                  </div>

                  {/* Hover Shine Effect */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{
                      background: isHovered 
                        ? 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)'
                        : 'transparent'
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}