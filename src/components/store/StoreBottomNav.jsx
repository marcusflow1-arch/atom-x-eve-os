import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Store, ShoppingBag, ArrowRightLeft } from 'lucide-react';

export default function StoreBottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'store', label: 'Store', icon: Store },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'trading', label: 'Trading Post', icon: ArrowRightLeft },
    { id: 'overview', label: 'Overview', icon: Eye },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
              isActive ? 'text-white' : 'text-white/50 hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="store-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </motion.button>
        );
      })}




    </div>
  );
}