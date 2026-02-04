import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
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
  
  // Safe store access with fallback
  const equipped = useAvatarStore((state) => state?.equipped) || { 
    head: 'none', body: 'base', accessory: 'none', hand: 'none' 
  };
  const equipItem = useAvatarStore((state) => state?.equipItem) || (() => {});
  const resetAll = useAvatarStore((state) => state?.resetAll) || (() => {});
  
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-8 top-8 bottom-8 w-80 rounded-3xl overflow-hidden shadow-2xl z-50 flex flex-col"
      style={{
        background: 'rgba(25, 25, 25, 0.6)', // Slightly darker for better contrast
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Header Area */}
      <div className="p-6 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Customize Avatar</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/5"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        
        {/* Category Tabs - Scrollable if needed */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {Object.entries(categories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 min-w-[80px] px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Scrollable Items List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 pb-4"
          >
            {categories[activeTab].items.map((item) => {
              const isEquipped = equipped[activeTab] === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => equipItem(activeTab, item.id)}
                  className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all group ${
                    isEquipped
                      ? 'bg-blue-500/20 border-2 border-blue-500/50 shadow-lg shadow-blue-900/20'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors ${
                      isEquipped ? 'bg-blue-500/20' : 'bg-black/20 group-hover:bg-black/30'
                  }`}>
                    {item.icon}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold text-sm">{item.name}</p>
                    {isEquipped ? (
                      <p className="text-blue-300 text-[10px] font-medium uppercase tracking-wider mt-0.5">Equipped</p>
                    ) : (
                        <p className="text-white/30 text-[10px] uppercase tracking-wider mt-0.5 group-hover:text-white/50">Select</p>
                    )}
                  </div>
                  
                  {isEquipped && (
                    <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Footer Actions */}
      <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
        <button
          onClick={resetAll}
          className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-200 font-semibold transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-red-500/30"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Default
        </button>
      </div>
    </motion.div>
  );
}