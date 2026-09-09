import React from 'react';
import { motion } from 'framer-motion';


export default function StoreBottomNav({ activeTab, onTabChange }) {
  const isDevCardActive = activeTab === 'devcards';
  const isStoreActive = activeTab === 'store';
  const isTradingActive = activeTab === 'trading';

  return (
    <div className="flex items-center w-full relative">

      {/* ── LEFT: spacer keeps the Store tab centered ── */}
      <div className="flex items-center gap-5 flex-1" />

      {/* ── CENTER: Divider | Store | Divider ── */}
      <div className="flex items-center flex-shrink-0">
        {/* Left divider */}
        <div className="w-px h-5 bg-white/20 mx-4" />

        <motion.button
          onClick={() => onTabChange('store')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className={`relative px-5 py-1.5 text-sm font-black uppercase tracking-wider transition-all ${
            isStoreActive ? 'text-white' : 'text-white/50 hover:text-white'
          }`}
        >
          Store
          {isStoreActive && (
            <motion.div
              layoutId="store-tab-underline"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full"
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
        </motion.button>

        {/* Right divider */}
        <div className="w-px h-5 bg-white/20 mx-4" />
      </div>

      {/* ── RIGHT: Trading Post + Dev Cards (close to center divider) + Search (far right) ── */}
      <div className="flex items-center flex-1">
        {/* Trading Post & Dev Cards — immediately after the center divider */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={() => onTabChange('trading')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className={`relative text-[11px] font-bold uppercase tracking-wider transition-all ${
              isTradingActive ? 'text-white' : 'text-white/45 hover:text-white'
            }`}
          >
            Trading Post
            {isTradingActive && (
              <motion.div layoutId="store-tab-underline" className="absolute -bottom-1 left-0 right-0 h-[2px] bg-blue-500 rounded-full" initial={false} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
            )}
          </motion.button>

          <motion.button
            onClick={() => onTabChange('devcards')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className={`relative text-[11px] font-black uppercase tracking-wider transition-all ${
              isDevCardActive ? 'text-amber-300' : 'text-amber-500/50 hover:text-amber-300'
            }`}
          >
            Dev Cards
            {isDevCardActive && (
              <motion.div layoutId="store-tab-underline" className="absolute -bottom-1 left-0 right-0 h-[2px] bg-amber-400 rounded-full" initial={false} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
            )}
          </motion.button>
        </div>

        {/* Spacer pushes remaining space to the right */}
        <div className="flex-1" />
      </div>
    </div>
  );
}