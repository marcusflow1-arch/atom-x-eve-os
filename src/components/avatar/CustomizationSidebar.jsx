import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import useAvatarStore from './useAvatarStore';

const categories = {
  head: {
    label: 'Head',
    items: [
      { id: 'none', name: 'None', icon: '🚫' },
      { id: 'blue_hat', name: 'Blue Hat', icon: '🎩' },
      { id: 'red_cap', name: 'Red Cap', icon: '🧢' }
    ]
  },
  body: {
    label: 'Body',
    items: [
      { id: 'base', name: 'Default', icon: '👔' },
      { id: 'red_shirt', name: 'Red Shirt', icon: '👕' },
      { id: 'blue_armor', name: 'Blue Armor', icon: '🛡️' }
    ]
  },
  accessory: {
    label: 'Accessories',
    items: [
      { id: 'none', name: 'None', icon: '🚫' },
      { id: 'cape', name: 'Cape', icon: '🦸' },
      { id: 'wings', name: 'Wings', icon: '🪽' }
    ]
  },
  hand: {
    label: 'Weapons',
    items: [
      { id: 'none', name: 'None', icon: '🚫' },
      { id: 'sword', name: 'Sword', icon: '⚔️' },
      { id: 'staff', name: 'Staff', icon: '🪄' }
    ]
  }
};

export default function CustomizationSidebar({ onClose }) {
  const [activeTab, setActiveTab] = useState('head');
  const { equipped, equipItem, resetAll } = useAvatarStore();
  
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-8 top-8 bottom-8 w-80 rounded-3xl overflow-hidden shadow-2xl z-50"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">Customize Avatar</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2">
          {Object.entries(categories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === key
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Items List */}
      <div className="p-6 overflow-y-auto h-full pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {categories[activeTab].items.map((item) => {
              const isEquipped = equipped[activeTab] === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => equipItem(activeTab, item.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    isEquipped
                      ? 'bg-blue-500/30 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold">{item.name}</p>
                    {isEquipped && (
                      <p className="text-blue-300 text-xs">Equipped</p>
                    )}
                  </div>
                  {isEquipped && (
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10 bg-black/20">
        <button
          onClick={resetAll}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
        >
          Reset All
        </button>
      </div>
    </motion.div>
  );
}