import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Sparkles, Gem, Flame, Trophy, X } from 'lucide-react';

const CATEGORIES = [
  { id: 'new_releases', label: 'New Releases', icon: Clock, color: 'text-cyan-400', bg: 'from-cyan-500/20 to-cyan-600/5', border: 'border-cyan-500/30' },
  { id: 'recommended', label: 'Recommended', icon: Sparkles, color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/30' },
  { id: 'hidden_gems', label: 'Hidden Gems', icon: Gem, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/30' },
  { id: 'trending', label: 'Trending', icon: Flame, color: 'text-orange-400', bg: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-500/30' },
  { id: 'top_rated', label: 'Top Rated', icon: Trophy, color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/30' },
];

export default function CategoryFloatingMenu({ isOpen, onClose, activeCategory, onCategoryChange }) {
  const handleSelect = (id) => {
    onCategoryChange?.(activeCategory === id ? null : id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dimming backdrop — covers the page above the bottom bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[40]"
            style={{ background: 'rgba(6, 8, 14, 0.65)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          />

          {/* Floating menu — slides up from the bottom header */}
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[45] flex justify-center pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-2xl mx-4 mb-16 rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(12, 16, 24, 0.92)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 -8px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Browse Categories</h3>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white/60" />
                </button>
              </div>

              {/* Category options */}
              <div className="px-4 pb-5 space-y-2">
                {CATEGORIES.map(({ id, label, icon: Icon, color, bg, border }, idx) => {
                  const isActive = activeCategory === id;
                  return (
                    <motion.button
                      key={id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => handleSelect(id)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all bg-gradient-to-r ${bg} border ${isActive ? `${border} ring-2 ring-white/10` : 'border-transparent hover:border-white/10'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 ${color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-white/80'}`}>{label}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">
                          {id === 'new_releases' && 'Latest game drops'}
                          {id === 'recommended' && 'Picked for you'}
                          {id === 'hidden_gems' && 'Undiscovered hits'}
                          {id === 'trending' && 'Hot right now'}
                          {id === 'top_rated' && 'Highest rated'}
                        </p>
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="cat-active-dot"
                          className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}