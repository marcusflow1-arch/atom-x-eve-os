import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalSearchBar({ onSearch, isOpen, onClose, placeholder = "Search Store Library & Gaming Studios..." }) {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      if (onSearch) onSearch(query);
      setQuery('');
    }
  };

  const handleClose = () => {
    setQuery('');
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000]"
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[1001] w-full max-w-2xl"
          >
            <div className="mx-4 md:mx-0 p-4 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-white/50 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-lg"
                />
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick suggestion hint */}
              <div className="mt-3 text-xs text-white/40 flex items-center gap-2">
                <span>💡 Tip: Search appears on all pages — access Store Library & Gaming Studios from anywhere</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}