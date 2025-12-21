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

      {/* Content Area - Header with Menu Items Below */}
      <div className="flex-1 w-full h-full flex items-center justify-center px-8 pb-8 pt-24">
        <div className="flex flex-col items-center">
          {/* AI Home Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">AI Home</h2>
          </div>

          {/* Menu Items - Vertical Stack */}
          <div className="flex flex-col gap-2">
            {AI_HOME_ITEMS.filter(item => item.id !== 'home').map((item, index) => {
              const Icon = item.icon;
              const isHovered = hoveredItem === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleItemClick(item)}
                  className="cursor-pointer"
                >
                  <motion.div
                    animate={{ 
                      scale: isHovered ? 1.05 : 1,
                      x: isHovered ? 5 : 0
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: isHovered ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: isHovered ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    
                    {/* Label */}
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {item.label}
                      </h3>
                      <p className="text-white/40 text-[10px]">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}