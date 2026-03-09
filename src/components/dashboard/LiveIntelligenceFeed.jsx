import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, X, Check } from 'lucide-react';
import ActionCenterDrawer from './ActionCenterDrawer';

export default function LiveIntelligenceFeed() {
  const [actionCenterOpen, setActionCenterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setActionCenterOpen(true);
  };

  if (isCollapsed) {
     return (
        <div 
           className="w-[340px] rounded-xl flex justify-between items-center px-4 py-3 font-sans cursor-pointer flex-shrink-0 border border-white/10"
           style={{
             background: 'rgba(15, 23, 42, 0.65)',
             backdropFilter: 'blur(20px)',
             WebkitBackdropFilter: 'blur(20px)',
             boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
           }}
           onClick={() => setIsCollapsed(false)}
        >
           <span className="text-white text-sm font-semibold tracking-wider">Mini-Feed Menu</span>
           <ChevronUp className="w-4 h-4 text-white/50 rotate-180" />
        </div>
     )
  }

  return (
    <>
      <div
        className="w-[340px] rounded-xl flex flex-col font-sans relative overflow-hidden flex-shrink-0"
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-white/[0.04] border-b border-white/10">
          <span className="text-white text-sm font-semibold tracking-wider">Mini-Feed Menu</span>
          <div className="flex items-center gap-2">
            <ChevronUp 
               className="w-4 h-4 text-white/50 cursor-pointer hover:text-white transition-colors" 
               onClick={() => setIsCollapsed(true)}
            />
            <X className="w-4 h-4 text-white/50 cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
           <style>{`
              .intel-scrollbar::-webkit-scrollbar { display: none; }
           `}</style>
           
           {/* LIVE FEED | INTEL */}
           <div className="text-cyan-400 text-xs font-bold tracking-widest mb-4 flex items-center gap-1.5">
              LIVE FEED <span className="text-white/30 font-light">|</span> INTEL
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
                 <div className="h-1.5 bg-white/10 rounded-full overflow-hidden ml-3 group-hover:bg-white/20 transition-colors">
                    <div className="h-full bg-[#9d4edd] rounded-full" style={{ width: '84%' }} />
                 </div>
              </div>

              {/* Item 2 */}
              <div className="space-y-1.5 cursor-pointer hover:bg-white/5 p-1.5 -mx-1.5 rounded transition-colors group" onClick={() => handleItemClick({ type: 'achievement', title: "Collect 'Phantom Edge'", status: '1/1' })}>
                 <div className="flex justify-between items-start text-[11px] text-white">
                    <span className="flex-1 leading-relaxed">
                       <span className="opacity-60 mr-1">•</span>
                       [Card Hunt] Collect 'Phantom Edge' - <span className="text-cyan-300">(1/1)</span>
                    </span>
                    <Check className="w-3.5 h-3.5 text-green-400 ml-2 flex-shrink-0 mt-0.5" />
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
                 <div className="h-1.5 bg-white/10 rounded-full overflow-hidden ml-3 group-hover:bg-white/20 transition-colors">
                    <motion.div 
                       className="h-full bg-cyan-500 rounded-full" 
                       style={{ width: '84%' }} 
                       animate={{ opacity: [0.8, 1, 0.8] }}
                       transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                 </div>
              </div>
           </div>

           {/* MARKET ALERT */}
           <div className="mt-5 pt-4 border-t border-white/10">
              <h4 className="text-cyan-400 text-[10px] font-bold tracking-wider mb-3">MARKET ALERT</h4>
              
              <div className="space-y-2.5">
                 <div className="text-[11px] text-white leading-relaxed cursor-pointer hover:bg-white/5 p-1.5 -mx-1.5 rounded transition-colors" onClick={() => handleItemClick({ type: 'market', title: "Neural Shock", status: 'Price Dropped' })}>
                    <span className="opacity-60 mr-1">•</span>
                    [Black Market] 'Neural Shock' Ability Card price <span className="text-green-400 font-bold">DROP!</span> (10 min left)
                 </div>
                 
                 <div className="text-[11px] text-white leading-relaxed cursor-pointer hover:bg-white/5 p-1.5 -mx-1.5 rounded transition-colors" onClick={() => handleItemClick({ type: 'market', title: "Phoenix Companion", status: 'New Release' })}>
                    <span className="opacity-60 mr-1">•</span>
                    [New Release] Cyberpunk 20XX 'Phoenix Companion' - ...
                 </div>
                 
                 <div className="text-[11px] text-white leading-relaxed cursor-pointer hover:bg-white/5 p-1.5 -mx-1.5 rounded transition-colors" onClick={() => handleItemClick({ type: 'market', title: "Soul Reaver Raid", status: 'Upcoming Event' })}>
                    <span className="opacity-60 mr-1">•</span>
                    [Upcoming Event] Soul Reaver Raid (7h 15m left)
                 </div>
              </div>
           </div>
        </div>
      </div>
      <ActionCenterDrawer open={actionCenterOpen} onClose={() => setActionCenterOpen(false)} item={selectedItem} />
    </>
  );
}