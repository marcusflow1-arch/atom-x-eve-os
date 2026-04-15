import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Store, ShoppingBag, ArrowRightLeft, Library } from 'lucide-react';

export default function StoreBottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'store', label: 'Store', icon: Store },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'trading', label: 'Trading Post', icon: ArrowRightLeft },
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'library', label: 'Library', icon: Library },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all border ${
              isActive
                ? 'bg-white/15 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        );
      })}
    </div>
  );
}