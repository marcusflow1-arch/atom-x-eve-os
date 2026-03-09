import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown } from 'lucide-react';
import ActionCenterDrawer from './ActionCenterDrawer';

export default function LiveIntelligenceFeed() {
  const [actionCenterOpen, setActionCenterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setActionCenterOpen(true);
  };

  return (
    <>
      <div
        className="w-[300px] h-[160px] rounded-xl flex flex-col font-mono relative overflow-hidden flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, rgba(8, 16, 24, 0.4) 0%, rgba(16, 24, 36, 0.2) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 15px rgba(34,211,238,0.1) inset',
        }}
      >
        {/* Header / scanline effect */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-cyan-400/50 opacity-50 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

        <div className="flex-1 overflow-y-auto p-3 space-y-4" style={{ scrollbarWidth: 'none' }}>
           <style>{`
              .intel-scrollbar::-webkit-scrollbar { display: none; }
           `}</style>
           {/* [LIVE INTEL] */}
           <div>
              <h3 className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.2em] mb-2 opacity-90">[Live Intel]</h3>
              <div className="cursor-pointer hover:bg-white/5 p-1.5 -mx-1.5 rounded transition-colors" onClick={() => handleItemClick({ type: 'intel', title: 'Netrunner Quest', status: '80% Complete' })}>
                 <div className="flex justify-between items-center text-[10px] text-white/90 mb-1.5">
                    <span className="truncate mr-2">Active Mission Progress</span>
                    <span className="text-cyan-300 font-bold">80%</span>
                 </div>
                 <div className="h-[2px] bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                      style={{ width: '80%' }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                 </div>
              </div>
           </div>

           {/* [MARKET ALERTS] */}
           <div>
              <h3 className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.2em] mb-2 opacity-90">[Market Alerts]</h3>
              <div className="space-y-1">
                  <div className="cursor-pointer hover:bg-white/5 p-1.5 -mx-1.5 rounded transition-colors flex items-center justify-between" onClick={() => handleItemClick({ type: 'market', title: 'Neon Blade Card', status: 'Price Dropped to 150c' })}>
                     <span className="text-[10px] text-white/90 truncate mr-2">Neon Blade Card</span>
                     <div className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-green-400" />
                        <span className="text-[10px] text-green-400 font-bold">150c</span>
                     </div>
                  </div>
              </div>
           </div>

           {/* [ACHIEVEMENT TRACKER] */}
           <div>
              <h3 className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.2em] mb-2 opacity-90">[Achievement Tracker]</h3>
              <div className="space-y-2">
                 <div className="cursor-pointer hover:bg-white/5 p-1.5 -mx-1.5 rounded transition-colors" onClick={() => handleItemClick({ type: 'achievement', title: 'Shadow Walker', status: '95% Complete' })}>
                    <div className="flex justify-between items-center text-[10px] text-white/90 mb-1.5">
                       <span className="truncate mr-2">Shadow Walker</span>
                       <span className="text-white/60">95%</span>
                    </div>
                    <div className="h-[2px] bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-purple-400" style={{ width: '95%' }} />
                    </div>
                 </div>
                 <div className="cursor-pointer hover:bg-white/5 p-1.5 -mx-1.5 rounded transition-colors" onClick={() => handleItemClick({ type: 'achievement', title: 'First Blood', status: '85% Complete' })}>
                    <div className="flex justify-between items-center text-[10px] text-white/90 mb-1.5">
                       <span className="truncate mr-2">First Blood</span>
                       <span className="text-white/60">85%</span>
                    </div>
                    <div className="h-[2px] bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-400" style={{ width: '85%' }} />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
      <ActionCenterDrawer open={actionCenterOpen} onClose={() => setActionCenterOpen(false)} item={selectedItem} />
    </>
  );
}