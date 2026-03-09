import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Check, Activity } from 'lucide-react';
import ActionCenterDrawer from './ActionCenterDrawer';

export default function LiveIntelligenceFeed() {
  const [actionCenterOpen, setActionCenterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setActionCenterOpen(true);
  };

  return (
    <div className="flex flex-col items-end gap-3 pointer-events-auto">
      {/* Toggle Icon Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 border border-white/20 shadow-lg"
      >
        <Activity className="w-4 h-4 text-cyan-400" />
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[340px] rounded-xl flex flex-col font-sans relative overflow-hidden flex-shrink-0"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(34, 211, 238, 0.2)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="p-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
               <style>{`
                  .intel-scrollbar::-webkit-scrollbar { display: none; }
               `}</style>
               
               {/* LIVE FEED | INTEL */}
               <div className="text-cyan-400 text-xs font-bold tracking-widest mb-4 flex items-center gap-1.5">
                  LIVE FEED <span className="text-white/30 font-light">|</span> INTEL
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-cyan-500/50 to-transparent ml-2"></div>
               </div>

               {/* ACTIVE MISSIONS & ACHIEVEMENTS */}
               <div className="space-y-4">
                  <h4 className="text-cyan-400 text-[10px] font-bold tracking-wider mb-2">ACTIVE MISSIONS & ACHIEVEMENTS</h4>
                  
                  {/* Item 1 */}
                  <div className="space-y-1.5 cursor-pointer hover:bg-white/5 p-1.5 -mx-1.5 rounded transition-colors group" onClick={() => handleItemClick({ type: 'achievement', title: "Jedi Outcast: 'Force Adept'", status: '42/50' })}>
                     <div className="flex justify-between text-[11px] text-white">
                        <span className="flex-1 leading-relaxed">
                           <span className="opacity-60 mr-1">•</span> 
                           [Achievement Progress] Jedi Outcast: 'Force Adept' - <span className="text-cyan-300">(42/50)</span>
                        </span>
                     </div>
                     <div className="h-1.5 bg-black/40 rounded-full overflow-hidden ml-3 group-hover:bg-black/60 transition-colors shadow-inner">
                        <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)]" style={{ width: '84%' }} />
                     </div>
                  </div>

                  {/* Item 2 */}
                  <div className="space-y-1.5 cursor-pointer hover:bg-white/5 p-1.5 -mx-1.5 rounded transition-colors group" onClick={() => handleItemClick({ type: 'achievement', title: "Collect 'Phantom Edge'", status: '1/1' })}>
                     <div className="flex justify-between items-start text-[11px] text-white">
                        <span className="flex-1 leading-relaxed">
                           <span className="opacity-60 mr-1">•</span>
                           [Card Hunt] Collect 'Phantom Edge' - <span className="text-cyan-300">(1/1)</span>
                        </span>
                        <Check className="w-3.5 h-3.5 text-cyan-400 ml-2 flex-shrink-0 mt-0.5 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                     </div>
                  </div>

                  {/* Item 3 */}
                  <div className="space-y-1.5 cursor-pointer hover:bg-white/5 p-1.5 -mx-1.5 rounded transition-colors group" onClick={() => handleItemClick({ type: 'achievement', title: "Reach Lvl 50", status: '4,200/5,000 EXP' })}>
                     <div className="flex justify-between text-[11px] text-white">
                        <span className="flex-1 leading-relaxed">
                           <span className="opacity-60 mr-1">•</span>
                           [Street Cred] Reach Lvl 50 - <span className="text-cyan-300">(4,200/5,000 EXP)</span>
                        </span>
                     </div>
                     <div className="h-1.5 bg-black/40 rounded-full overflow-hidden ml-3 group-hover:bg-black/60 transition-colors shadow-inner">
                        <motion.div 
                           className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.6)]" 
                           style={{ width: '84%' }} 
                           animate={{ opacity: [0.8, 1, 0.8] }}
                           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                     </div>
                  </div>
               </div>

               {/* INNER BOX: MARKET ALERT */}
               <div className="mt-5 rounded-lg border border-cyan-500/30 overflow-hidden" style={{ background: 'rgba(8, 14, 26, 0.6)' }}>
                  <div className="px-3 py-2 bg-gradient-to-r from-cyan-500/10 to-transparent border-b border-cyan-500/20">
                     <h4 className="text-cyan-400 text-[10px] font-bold tracking-wider">MARKET ALERT</h4>
                  </div>
                  
                  <div className="p-3 space-y-2.5">
                     <div className="text-[11px] text-white leading-relaxed cursor-pointer hover:bg-white/5 p-1 -mx-1 rounded transition-colors" onClick={() => handleItemClick({ type: 'market', title: "Neural Shock", status: 'Price Dropped' })}>
                        <span className="opacity-60 mr-1">•</span>
                        [Black Market] 'Neural Shock' Ability Card price: <span className="text-green-400 font-bold drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">DROP!</span> <span className="text-white/50">(10 min left)</span>
                     </div>
                     
                     <div className="text-[11px] text-white leading-relaxed cursor-pointer hover:bg-white/5 p-1 -mx-1 rounded transition-colors" onClick={() => handleItemClick({ type: 'market', title: "Phoenix Companion", status: 'New Release' })}>
                        <span className="opacity-60 mr-1">•</span>
                        [New Release]: Cyberpunk 20XX 'Phoenix Companion' - 🐕
                     </div>
                     
                     <div className="text-[11px] text-white leading-relaxed cursor-pointer hover:bg-white/5 p-1 -mx-1 rounded transition-colors" onClick={() => handleItemClick({ type: 'market', title: "Soul Reaver Raid", status: 'Upcoming Event' })}>
                        <span className="opacity-60 mr-1">•</span>
                        [Upcoming Event]: Soul Reaver Raid <span className="text-white/50">(7h 15m left)</span>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ActionCenterDrawer open={actionCenterOpen} onClose={() => setActionCenterOpen(false)} item={selectedItem} />
    </div>
  );
}