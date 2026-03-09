import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, TrendingDown, Trophy, Activity } from 'lucide-react';

export default function ActionCenterDrawer({ open, onClose, item }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            onClick={onClose}
            style={{ pointerEvents: 'all' }}
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[420px] z-[9999] flex flex-col rounded-l-3xl overflow-hidden font-mono"
            style={{
              background: 'linear-gradient(135deg, rgba(12, 20, 30, 0.95) 0%, rgba(8, 12, 18, 0.98) 100%)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
              borderLeft: '1px solid rgba(34, 211, 238, 0.3)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(34, 211, 238, 0.2)',
              pointerEvents: 'all'
            }}
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-cyan-500/20 bg-cyan-900/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                  <Activity className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg tracking-widest uppercase drop-shadow-md">Action Center</h2>
                  <p className="text-cyan-300/80 text-[10px] uppercase tracking-widest">Detail View</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.15] flex items-center justify-center transition-all border border-white/10">
                <X className="w-4 h-4 text-white/80" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              {item ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                   <div className="flex items-center gap-4 mb-6">
                      {item.type === 'intel' && <Target className="w-8 h-8 text-cyan-400" />}
                      {item.type === 'market' && <TrendingDown className="w-8 h-8 text-green-400" />}
                      {item.type === 'achievement' && <Trophy className="w-8 h-8 text-amber-400" />}
                      <div>
                         <h3 className="text-xl font-bold text-white uppercase tracking-wide">{item.title}</h3>
                         <p className="text-cyan-400/80 text-xs mt-1 tracking-widest uppercase">{item.status}</p>
                      </div>
                   </div>

                   <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10">
                      <p className="text-white/70 text-sm leading-relaxed">
                         {item.type === 'intel' && "Target acquired. Continue to infiltrate the corporate servers. You are 80% through the main objective. Time limit: 12 minutes."}
                         {item.type === 'market' && "A significant price drop has been detected for this item. Historical average is 250c. Current listing is 40% below market value. Buy now or risk missing out."}
                         {item.type === 'achievement' && "You are extremely close to unlocking this achievement. Complete 5 more stealth takedowns to claim your reward."}
                      </p>
                   </div>

                   <button className="w-full py-4 mt-4 bg-cyan-500/20 text-cyan-300 font-bold uppercase tracking-widest rounded-xl border border-cyan-500/30 hover:bg-cyan-500/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all">
                      {item.type === 'intel' ? 'Resume Mission' : item.type === 'market' ? 'Go to Market' : 'View Requirements'}
                   </button>
                </motion.div>
              ) : (
                <div className="text-center text-white/30 text-xs py-20 uppercase tracking-widest">No active intel selected.</div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}