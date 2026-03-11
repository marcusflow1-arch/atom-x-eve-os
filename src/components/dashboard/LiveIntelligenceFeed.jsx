import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, X, Check, Activity, FileText, Gift, Info, Target, ShoppingCart } from 'lucide-react';
import ActionCenterDrawer from './ActionCenterDrawer';

export default function LiveIntelligenceFeed() {
  const [actionCenterOpen, setActionCenterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('missions');

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setActionCenterOpen(true);
  };

  // Use window events to listen to toggle from outside
  React.useEffect(() => {
     const handleToggle = () => setIsCollapsed(prev => !prev);
     window.addEventListener('toggleLiveFeed', handleToggle);
     return () => window.removeEventListener('toggleLiveFeed', handleToggle);
  }, []);

  if (isCollapsed) {
    return null; // When collapsed, it's completely hidden, toggled via external button
  }

  return (
    <div className="flex flex-col items-end gap-3 pointer-events-auto h-full">
      {/* Removed icons here to move them inside the layout closer to calendar */}

      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-[360px] flex flex-col font-sans relative overflow-hidden flex-shrink-0 rounded-2xl h-full"
        style={{
          background: 'rgba(20, 26, 38, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Header - Removed as requested, toggle icons moved above */}

        {/* Scrollable Content Area */}
        <div className="p-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
           <style>{`
              .intel-scrollbar::-webkit-scrollbar { width: 6px; }
              .intel-scrollbar::-webkit-scrollbar-track { background: transparent; }
              .intel-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.2); border-radius: 10px; }
           `}</style>
           
           {/* LIVE FEED | INTEL */}
           <div className="text-[#64B5F6] text-sm font-bold tracking-widest mb-4">
              LIVE FEED | INTEL
           </div>

           {/* Tabs */}
           <div className="flex gap-2 mb-4">
             <button
               onClick={() => setActiveTab('missions')}
               className={`flex-1 py-2.5 text-[10px] font-bold tracking-widest rounded-lg border transition-all ${
                 activeTab === 'missions' 
                   ? 'bg-[#64B5F6]/20 border-[#64B5F6]/50 text-[#64B5F6]' 
                   : 'bg-black/20 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5'
               }`}
             >
               <Target className="w-3 h-3 inline mr-1 -mt-0.5" /> MISSIONS
             </button>
             <button
               onClick={() => setActiveTab('market')}
               className={`flex-1 py-2.5 text-[10px] font-bold tracking-widest rounded-lg border transition-all ${
                 activeTab === 'market' 
                   ? 'bg-[#64B5F6]/20 border-[#64B5F6]/50 text-[#64B5F6]' 
                   : 'bg-black/20 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5'
               }`}
             >
               <ShoppingCart className="w-3 h-3 inline mr-1 -mt-0.5" /> MARKET
             </button>
           </div>

           <AnimatePresence mode="wait">
             {activeTab === 'missions' && (
               <motion.div 
                 key="missions"
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 10 }}
                 transition={{ duration: 0.2 }}
                 className="rounded-xl border border-white/10 p-3 flex-1" 
                 style={{ background: 'rgba(0, 0, 0, 0.2)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}
               >
                  <div className="space-y-4">
                     {/* Item 1 */}
                     <div className="cursor-pointer group" onClick={() => handleItemClick({ type: 'achievement', title: "Jedi Outcast: 'Force Adept'", status: '42/50' })}>
                        <div className="flex text-xs text-white mb-2">
                           <span className="text-white/50 mr-2">•</span> 
                           <span className="leading-tight">
                             [Achievement Progress] Jedi Outcast:<br/>
                             'Force Adept' - <span className="text-white/60">(42/50)</span>
                           </span>
                        </div>
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden ml-4">
                           <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" style={{ width: '84%' }} />
                        </div>
                     </div>

                     <div className="h-px bg-white/5 ml-4"></div>

                     {/* Item 2 */}
                     <div className="cursor-pointer group" onClick={() => handleItemClick({ type: 'achievement', title: "Collect 'Phantom Edge'", status: '1/1' })}>
                        <div className="flex items-start text-xs text-white">
                           <span className="text-white/50 mr-2 mt-0.5">•</span>
                           <span className="flex-1 leading-tight">
                             [Card Hunt] Collect 'Phantom Edge'<br/>
                             <span className="text-[#64B5F6] flex items-center gap-1 mt-1">
                               <FileText className="w-3 h-3" /> (1/1)
                             </span>
                           </span>
                           <Check className="w-4 h-4 text-[#64B5F6] mt-0.5" />
                        </div>
                     </div>

                     <div className="h-px bg-white/5 ml-4"></div>

                     {/* Item 3 */}
                     <div className="cursor-pointer group" onClick={() => handleItemClick({ type: 'achievement', title: "Reach Lvl 50", status: '4,200/5,000 EXP' })}>
                        <div className="flex text-xs text-white mb-2">
                           <span className="text-white/50 mr-2">•</span>
                           <span className="leading-tight">
                             [Street Cred] Reach Lvl 50 -<br/>
                             <span className="text-white/60">(4,200/5,000 EXP)</span>
                           </span>
                        </div>
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden ml-4">
                           <motion.div 
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                              style={{ width: '84%' }} 
                              animate={{ opacity: [0.8, 1, 0.8] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                           />
                        </div>
                     </div>
                  </div>
               </motion.div>
             )}

             {activeTab === 'market' && (
               <motion.div 
                 key="market"
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 transition={{ duration: 0.2 }}
                 className="rounded-xl border border-[#64B5F6]/20 p-3 flex-1" 
                 style={{ background: 'rgba(100, 181, 246, 0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}
               >
                  <div className="space-y-4">
                     <div className="flex items-start text-xs text-white cursor-pointer group" onClick={() => handleItemClick({ type: 'market', title: "Neural Shock", status: 'Price Dropped' })}>
                        <span className="text-white/50 mr-2 mt-0.5">•</span>
                        <span className="leading-tight">
                          [Black Market] 'Neural Shock' Ability<br/>
                          Card price <span className="text-green-400 font-bold">DROP!</span> <span className="text-white/60">(10 min left)</span>
                        </span>
                     </div>
                     
                     <div className="h-px bg-white/5 ml-4"></div>
                     
                     <div className="flex items-start text-xs text-white cursor-pointer group" onClick={() => handleItemClick({ type: 'market', title: "Phoenix Companion", status: 'New Release' })}>
                        <span className="text-white/50 mr-2 mt-0.5">•</span>
                        <span className="leading-tight">
                          [New Release] Cyberpunk 20XX<br/>
                          'Phoenix Companion' - <Gift className="w-3 h-3 inline text-amber-400" />
                        </span>
                     </div>
                     
                     <div className="h-px bg-white/5 ml-4"></div>
                     
                     <div className="flex items-start text-xs text-white cursor-pointer group" onClick={() => handleItemClick({ type: 'market', title: "Soul Reaver Raid", status: 'Upcoming Event' })}>
                        <span className="text-white/50 mr-2 mt-0.5">•</span>
                        <span className="leading-tight">
                          [Upcoming Event] Soul Reaver Raid<br/>
                          <span className="text-white/60">(7h 15m left)</span>
                        </span>
                     </div>

                     <div className="h-px bg-white/5 ml-4"></div>
                     
                     <div className="flex items-start text-xs text-white cursor-pointer group" onClick={() => handleItemClick({ type: 'market', title: "Card Drop", status: 'New Cards' })}>
                        <span className="text-white/50 mr-2 mt-0.5">•</span>
                        <span className="leading-tight flex flex-col gap-1">
                          <span>[Card Drop] New Cards Coming Soon!</span>
                          <span className="text-purple-400 font-semibold">Epic 'Plasma Shield' <span className="text-white/60 text-[10px] font-normal">(Releases tmrw)</span></span>
                          <span className="text-amber-400 font-semibold">Legendary 'Shadow Step' <span className="text-white/60 text-[10px] font-normal">(In 2 days)</span></span>
                        </span>
                     </div>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </motion.div>
      <ActionCenterDrawer open={actionCenterOpen} onClose={() => setActionCenterOpen(false)} item={selectedItem} />
    </div>
  );
}