import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function StoreBottomNav({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = new URLSearchParams(location.search).get('mode');
  const effectiveTab = mode === 'trading' ? 'trading' : mode === 'devcards' ? 'devcards' : activeTab;
  const isDevCardActive = effectiveTab === 'devcards';
  const isStoreActive = effectiveTab === 'store';
  const isTradingActive = effectiveTab === 'trading';

  const changeTab = (tabId) => {
    const storeUrl = createPageUrl('Store');

    if (tabId === 'store') {
      // Returning to Store also clears a lingering market/dev-card mode from the URL.
      navigate(storeUrl);
    } else if (tabId === 'trading') {
      navigate(`${storeUrl}?mode=trading`);
    } else if (tabId === 'devcards') {
      navigate(`${storeUrl}?mode=devcards`);
    }

    onTabChange?.(tabId);
  };

  return (
    <div className="relative flex w-full items-center">
      <div className="flex flex-1 items-center gap-5" />

      <div className="flex flex-shrink-0 items-center">
        <div className="mx-4 h-5 w-px bg-white/20" />

        <motion.button
          type="button"
          onClick={() => changeTab('store')}
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
              className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-blue-500"
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
        </motion.button>

        <div className="mx-4 h-5 w-px bg-white/20" />
      </div>

      <div className="flex flex-1 items-center">
        <div className="flex items-center gap-4">
          <motion.button
            type="button"
            onClick={() => changeTab('trading')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className={`relative text-[11px] font-bold uppercase tracking-wider transition-all ${
              isTradingActive ? 'text-white' : 'text-white/45 hover:text-white'
            }`}
          >
            Trading Post
            {isTradingActive && (
              <motion.div
                layoutId="store-tab-underline"
                className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-blue-500"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={() => changeTab('devcards')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className={`relative text-[11px] font-black uppercase tracking-wider transition-all ${
              isDevCardActive ? 'text-amber-300' : 'text-amber-500/50 hover:text-amber-300'
            }`}
          >
            Dev Cards
            {isDevCardActive && (
              <motion.div
                layoutId="store-tab-underline"
                className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-amber-400"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </motion.button>
        </div>

        <div className="flex-1" />
      </div>
    </div>
  );
}
