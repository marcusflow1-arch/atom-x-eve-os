import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, X, Check, Activity, FileText, Gift, Info, Target, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import ActionCenterDrawer from './ActionCenterDrawer';

function MarketExpandedView() {
  return (
    <div className="p-6 h-full overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
      <h2 className="text-xl font-bold text-white mb-6 tracking-wider">MARKETPLACE INTELLIGENCE</h2>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Left Col: Upcoming Cards */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#64B5F6] flex items-center gap-2">
            <Gift className="w-4 h-4" /> Upcoming Card Drops
          </h3>
          <div className="space-y-3">
             {[
               { name: "Plasma Shield", rarity: "Epic", game: "Cyberpunk 2088", date: "Releases Tomorrow" },
               { name: "Shadow Step", rarity: "Legendary", game: "Neon Legends", date: "In 2 days" },
               { name: "Voidtech Core", rarity: "Rare", game: "Elden Ring: Nightreign", date: "Next week" }
             ].map((card, i) => (
               <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                 <div className="flex justify-between items-start mb-1">
                   <span className="text-white font-bold">{card.name}</span>
                   <span className={`text-[10px] px-2 py-0.5 rounded border ${card.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : card.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-blue-500/20 text-blue-300 border-blue-500/40'}`}>{card.rarity}</span>
                 </div>
                 <div className="flex justify-between items-end">
                   <span className="text-white/50 text-xs">{card.game}</span>
                   <span className="text-[#64B5F6] text-[10px] font-semibold">{card.date}</span>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Right Col: Customization & Wanted List */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[#64B5F6] flex items-center gap-2 mb-3">
               <Activity className="w-4 h-4" /> Customization Options
            </h3>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
               <div>
                  <label className="text-xs text-white/60 mb-2 block">Tracked Genres</label>
                  <div className="flex flex-wrap gap-2">
                    {['RPG', 'Action', 'Sci-Fi', 'Strategy'].map(g => (
                      <span key={g} className="px-3 py-1 rounded-full bg-[#64B5F6]/20 text-[#64B5F6] text-xs border border-[#64B5F6]/30 cursor-pointer hover:bg-[#64B5F6]/30 transition-colors">{g}</span>
                    ))}
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/50 text-xs border border-white/10 cursor-pointer hover:bg-white/20 transition-colors">+ Add</span>
                  </div>
               </div>
               <div>
                  <label className="text-xs text-white/60 mb-2 block">Achievements to Track</label>
                  <input type="text" placeholder="Search achievements..." className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#64B5F6]/50 transition-colors" />
               </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
               <Target className="w-4 h-4" /> Wanted List / Archive
            </h3>
            <div className="space-y-2">
               {['Grand Theft Auto VI', 'Elder Scrolls 6'].map(game => (
                  <div key={game} className="flex justify-between items-center p-3 rounded-lg bg-black/30 border border-amber-500/20">
                     <span className="text-white text-sm">{game}</span>
                     <span className="text-amber-400 text-[10px] uppercase tracking-widest border border-amber-400/30 px-2 py-1 rounded">Notified</span>
                  </div>
               ))}
               <button className="w-full py-2 border border-dashed border-white/20 rounded-lg text-white/50 text-xs hover:text-white hover:border-white/40 transition-colors">
                 + Add Upcoming Game
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MissionsExpandedView({ selectedGame, onSelectGame }) {
  const games = ['Cyberpunk 2088', 'Neon Legends', 'Stellar Odyssey', 'Shadow Realm', 'Elden Ring: Nightreign'];
  
  return (
    <div className="flex h-full">
      {/* Left Col: Games List */}
      <div className="w-1/3 border-r border-white/10 p-4 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <h3 className="text-xs font-bold text-white/50 tracking-widest mb-4 uppercase">Your Games</h3>
        <div className="space-y-2">
          {games.map(game => (
            <div 
              key={game}
              onClick={() => onSelectGame(game)}
              className={`p-3 rounded-xl cursor-pointer transition-all ${selectedGame === game ? 'bg-[#64B5F6]/20 border border-[#64B5F6]/50' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
            >
              <span className={`text-sm ${selectedGame === game ? 'text-[#64B5F6] font-bold' : 'text-white'}`}>{game}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Col: Missions for Selected Game */}
      <div className="w-2/3 p-6 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
         <div className="flex justify-between items-start mb-6">
            <div>
               <h2 className="text-xl font-bold text-white">{selectedGame}</h2>
               <p className="text-[#64B5F6] text-sm">Active Missions & Achievements</p>
            </div>
            <button className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
              Manage Tracking
            </button>
         </div>

         <div className="space-y-4">
            {[1,2,3,4].map(i => (
               <div key={i} className="p-4 rounded-xl bg-black/20 border border-white/10 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                     <div>
                        <h4 className="text-white font-semibold flex items-center gap-2">
                           <Target className="w-4 h-4 text-purple-400" />
                           {selectedGame} Master #{i}
                        </h4>
                        <p className="text-white/50 text-xs mt-1">Complete main story objectives in the given region.</p>
                     </div>
                     <label className="flex items-center gap-2 cursor-pointer">
                       <span className="text-[10px] text-white/40 uppercase">Tracking</span>
                       <input type="checkbox" className="rounded bg-white/10 border-white/20 text-[#64B5F6] focus:ring-[#64B5F6]" defaultChecked={i < 3} />
                     </label>
                  </div>
                  <div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-purple-500 rounded-full" style={{ width: `${i * 20}%` }} />
                    </div>
                    <div className="text-right text-[10px] text-white/50 mt-1">{i*20}% Completed</div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}

export default function LiveIntelligenceFeed() {
  const [actionCenterOpen, setActionCenterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('missions');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMissionGame, setSelectedMissionGame] = useState('Cyberpunk 2088');

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
        animate={{ opacity: 1, y: 0, scale: 1, width: isExpanded ? 'calc(100vw - 480px)' : 360 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
        className="flex flex-row font-sans relative overflow-hidden flex-shrink-0 rounded-2xl h-full"
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