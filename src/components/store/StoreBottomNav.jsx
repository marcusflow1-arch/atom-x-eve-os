import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Store, ShoppingBag, ArrowRightLeft, Library } from 'lucide-react';

export default function StoreBottomNav({ activeTab, onTabChange, libraryActive, onLibraryToggle }) {
  const tabs = [
    { id: 'store', label: 'Store', icon: Store },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'trading', label: 'Trading Post', icon: ArrowRightLeft },
    { id: 'overview', label: 'Overview', icon: Eye },
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

      {/* Library button — same style as LunaBottomNav */}
      <div className="w-px h-5 bg-white/10 mx-1" />
      <button
        onClick={onLibraryToggle}
        className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
          libraryActive
            ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]'
            : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
        }`}
      >
        {libraryActive && (
          <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full -z-10 pointer-events-none" />
        )}
        <Library className="w-4 h-4" />
        <span>Library</span>
      </button>
    </div>
  );
}