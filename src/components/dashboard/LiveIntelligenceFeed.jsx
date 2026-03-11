import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, X, Check, Activity, FileText, Gift, Info, Target, ShoppingCart, ChevronLeft, ChevronRight, Settings, Bookmark, Search, Filter, Shield, Zap, Image, Bot, Sword, CheckCircle2, List, Gamepad2, AlertTriangle, MessageSquare } from 'lucide-react';
import ActionCenterDrawer from './ActionCenterDrawer';

// Mock Data
const MOCK_GAMES = [
  { id: 'cp2088', name: 'Cyberpunk 2088', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200' },
  { id: 'nl', name: 'Neon Legends', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200' },
  { id: 'so', name: 'Stellar Odyssey', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200' },
  { id: 'sr', name: 'Shadow Realm', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200' },
  { id: 'er', name: 'Elden Ring: Nightreign', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200' },
];

const MISSION_CATEGORIES = ['Ability', 'Equipment', 'Weapon', 'Companion', 'Cosmetic'];

const MOCK_MISSIONS = [
  { id: 1, gameId: 'cp2088', category: 'Ability', title: 'Unlock Cyber Dash', progress: '42/50', description: 'Perform 50 perfect dodges in combat to unlock the Cyber Dash ability.', objective: 'Dodge perfectly 50 times.', reward: 'Cyber Dash Ability', conditions: 'Must be in combat.' },
  { id: 2, gameId: 'cp2088', category: 'Equipment', title: 'Obtain Neural Implant', progress: '0/1', description: 'Defeat the corpo boss in sector 4 to acquire the experimental neural implant.', objective: 'Kill Sector 4 Boss.', reward: 'Neural Implant', conditions: 'Level 10+' },
  { id: 3, gameId: 'nl', category: 'Weapon', title: 'Neon Blade Blueprint', progress: '10/100', description: 'Collect 100 neon shards scattered across the city to forge the Neon Blade.', objective: 'Loot 100 shards.', reward: 'Neon Blade', conditions: 'None' },
  { id: 4, gameId: 'so', category: 'Companion', title: 'Rescue Astro-Dog', progress: '0/1', description: 'Find the lost pod on Mars to rescue your new companion.', objective: 'Locate Pod.', reward: 'Astro-Dog Companion', conditions: 'Mars unlocked.' },
  { id: 5, gameId: 'sr', category: 'Cosmetic', title: 'Shadow Skybox', progress: '5/5', description: 'Defeat 5 shadow wraiths to unlock the Shadow Realm skybox for your environment.', objective: 'Kill 5 wraiths.', reward: 'Shadow Realm Skybox', conditions: 'Night time.' },
  { id: 6, gameId: 'er', category: 'Weapon', title: 'Forge the Night Blade', progress: '1/3', description: 'Gather 3 rare moonstones to forge the ultimate weapon.', objective: 'Find 3 moonstones.', reward: 'Night Blade', conditions: 'None' },
];

const MOCK_MARKET_UPDATES = [
  { id: 1, type: 'drop', title: 'Plasma Shield', rarity: 'Epic', game: 'Cyberpunk 2088', tag: 'Price Drop', time: '10 min ago', desc: 'Price dropped by 20%!' },
  { id: 2, type: 'event', title: 'Winter Sale Campaign', rarity: 'Legendary', game: 'All Games', tag: 'New Campaign', time: '1 hr ago', desc: 'Exclusive items available.' },
  { id: 3, type: 'limited', title: 'Voidtech Core', rarity: 'Rare', game: 'Elden Ring: Nightreign', tag: 'Limited Time', time: 'Ends in 2h', desc: 'Only 50 remaining in stock.' },
  { id: 4, type: 'featured', title: 'Shadow Step', rarity: 'Legendary', game: 'Neon Legends', tag: 'Featured', time: 'New Listing', desc: 'Highly requested ability card.' },
];

function SettingsExpandedView({ feedSettings, setFeedSettings }) {
  return (
    <div className="p-6 h-full overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
      <h2 className="text-xl font-bold text-white mb-6 tracking-wider flex items-center gap-2">
        <Settings className="w-5 h-5 text-[#64B5F6]" /> FEED SETTINGS
      </h2>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-4">Visible Categories</h3>
          <div className="space-y-3">
            {Object.keys(feedSettings).map(key => (
              <label key={key} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <span className="text-white text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <input 
                  type="checkbox" 
                  checked={feedSettings[key]} 
                  onChange={(e) => setFeedSettings({...feedSettings, [key]: e.target.checked})}
                  className="rounded bg-black/50 border-white/20 text-[#64B5F6] focus:ring-[#64B5F6] w-4 h-4"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#64B5F6]" /> Wanted List
            </h3>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <p className="text-xs text-white/50 mb-2">Track specific items you want to obtain.</p>
              <div className="flex justify-between items-center p-2 rounded-lg bg-black/30 border border-[#64B5F6]/20">
                <span className="text-white text-sm">Neon Blade Blueprint</span>
                <span className="text-[#64B5F6] text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-[#64B5F6]/10">Tracking</span>
              </div>
              <button className="w-full py-2 border border-dashed border-white/20 rounded-lg text-white/50 text-xs hover:text-white hover:border-white/40 transition-colors">
                + Add Item
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-purple-400" /> Notification Archive
            </h3>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg bg-black/30 border border-white/10">
                <span className="text-white/70 text-xs truncate mr-2">Maintenance completed on 10/24</span>
                <span className="text-white/40 text-[10px]">Read</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-black/30 border border-white/10">
                <span className="text-white/70 text-xs truncate mr-2">Cyberpunk 2088 Patch 2.1 Released</span>
                <span className="text-white/40 text-[10px]">Read</span>
              </div>
              <button className="w-full py-2 text-white/50 text-xs hover:text-white transition-colors">
                View All Archives
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketExpandedView() {
  return (
    <div className="p-6 h-full overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
      <h2 className="text-xl font-bold text-white mb-6 tracking-wider flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-[#64B5F6]" /> MARKETPLACE INTELLIGENCE
      </h2>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#64B5F6] flex items-center gap-2">
            <Gift className="w-4 h-4" /> Upcoming Card Drops & Content
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

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[#64B5F6] flex items-center gap-2 mb-3">
               <Activity className="w-4 h-4" /> Customization Events
            </h3>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
               <div className="flex justify-between items-center">
                 <div>
                   <h4 className="text-white text-sm font-semibold">Neon Overdrive Theme</h4>
                   <p className="text-white/50 text-xs">Unlock exclusive UI colors.</p>
                 </div>
                 <button className="text-[10px] bg-[#64B5F6]/20 text-[#64B5F6] px-2 py-1 rounded">Active Now</button>
               </div>
               <div className="flex justify-between items-center">
                 <div>
                   <h4 className="text-white text-sm font-semibold">Winter Avatar Pack</h4>
                   <p className="text-white/50 text-xs">New outfits dropping soon.</p>
                 </div>
                 <button className="text-[10px] bg-white/10 text-white/50 px-2 py-1 rounded border border-white/10">In 3 Days</button>
               </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
               <AlertTriangle className="w-4 h-4" /> System Announcements
            </h3>
            <div className="p-4 rounded-xl bg-black/30 border border-amber-500/20 space-y-3">
              <p className="text-xs text-white/80 leading-relaxed">
                <span className="text-amber-400 font-bold">Maintenance Notice:</span> Servers will be down for 2 hours on Nov 5th for a major platform update.
              </p>
              <p className="text-xs text-white/80 leading-relaxed">
                <span className="text-[#64B5F6] font-bold">Update 3.2:</span> New full-screen mission management interface is now live!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MissionsExpandedView({ selectedGame, onSelectGame }) {
  const [expandedMissionId, setExpandedMissionId] = useState(null);

  const selectedGameObj = MOCK_GAMES.find(g => g.id === selectedGame) || MOCK_GAMES[0];
  const missions = MOCK_MISSIONS.filter(m => m.gameId === selectedGameObj.id);

  return (
    <div className="flex flex-col h-full">
      {/* Top: Game Selection */}
      <div className="p-4 border-b border-white/10 flex gap-3 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
        {MOCK_GAMES.map(game => (
          <div 
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            className={`flex-shrink-0 flex items-center gap-3 p-2 pr-4 rounded-xl cursor-pointer transition-all ${selectedGame === game.id ? 'bg-[#64B5F6]/20 border border-[#64B5F6]/50' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
          >
            <img src={game.image} alt={game.name} className="w-10 h-10 rounded-lg object-cover" />
            <span className={`text-sm whitespace-nowrap ${selectedGame === game.id ? 'text-[#64B5F6] font-bold' : 'text-white'}`}>{game.name}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
         <div className="flex justify-between items-start mb-6">
            <div>
               <h2 className="text-2xl font-bold text-white mb-1">{selectedGameObj.name} Missions</h2>
               <p className="text-[#64B5F6] text-sm">Comprehensive Mission Management</p>
            </div>
         </div>

         {MISSION_CATEGORIES.map(category => {
           const categoryMissions = missions.filter(m => m.category === category);
           if (categoryMissions.length === 0) return null;

           return (
             <div key={category} className="mb-8">
               <h3 className="text-white/60 font-bold tracking-widest text-xs uppercase mb-3 flex items-center gap-2">
                 {category === 'Ability' && <Zap className="w-4 h-4 text-purple-400" />}
                 {category === 'Equipment' && <Shield className="w-4 h-4 text-blue-400" />}
                 {category === 'Weapon' && <Sword className="w-4 h-4 text-red-400" />}
                 {category === 'Companion' && <Bot className="w-4 h-4 text-green-400" />}
                 {category === 'Cosmetic' && <Image className="w-4 h-4 text-amber-400" />}
                 {category} Missions
               </h3>

               <div className="space-y-3">
                 {categoryMissions.map(mission => (
                   <div key={mission.id} className="rounded-xl bg-black/20 border border-white/10 overflow-hidden">
                     <div 
                       className="p-4 cursor-pointer hover:bg-white/5 transition-colors flex justify-between items-center"
                       onClick={() => setExpandedMissionId(expandedMissionId === mission.id ? null : mission.id)}
                     >
                       <div className="flex items-center gap-3">
                         <Target className={`w-5 h-5 ${expandedMissionId === mission.id ? 'text-[#64B5F6]' : 'text-white/40'}`} />
                         <div>
                           <h4 className="text-white font-semibold text-sm">{mission.title}</h4>
                           <div className="text-[10px] text-white/50 mt-0.5">{mission.progress} Completed</div>
                         </div>
                       </div>
                       {expandedMissionId === mission.id ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronRight className="w-4 h-4 text-white/50" />}
                     </div>

                     <AnimatePresence>
                       {expandedMissionId === mission.id && (
                         <motion.div 
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           className="border-t border-white/10 bg-white/5"
                         >
                           <div className="p-4 grid grid-cols-2 gap-6">
                             <div>
                               <p className="text-sm text-white/80 mb-4 leading-relaxed">{mission.description}</p>
                               <div className="text-sm text-white/60">
                                 <span className="font-bold text-white/80 block mb-1">Objective:</span> {mission.objective}
                               </div>
                             </div>
                             <div className="space-y-3">
                               <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                                 <span className="text-xs text-[#64B5F6] uppercase tracking-wider block mb-1 font-bold">Reward</span>
                                 <span className="text-base font-semibold text-white">{mission.reward}</span>
                               </div>
                               <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                                 <span className="text-xs text-amber-400 uppercase tracking-wider block mb-1 font-bold">Conditions</span>
                                 <span className="text-sm text-white/80">{mission.conditions}</span>
                               </div>
                             </div>
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 ))}
               </div>
             </div>
           )
         })}
      </div>
    </div>
  );
}

export default function LiveIntelligenceFeed() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('missions'); // missions, market, settings
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMissionGame, setSelectedMissionGame] = useState('cp2088');

  // State for standard view (right panel)
  const [standardExpandedMission, setStandardExpandedMission] = useState(null);

  const [feedSettings, setFeedSettings] = useState({
    missions: true,
    marketUpdates: true,
    cardDrops: true,
    systemAnnouncements: true,
    customizationEvents: true,
    communityActivity: true
  });

  // Use window events to listen to toggle from outside
  React.useEffect(() => {
     const handleToggle = () => setIsCollapsed(prev => !prev);
     window.addEventListener('toggleLiveFeed', handleToggle);
     return () => window.removeEventListener('toggleLiveFeed', handleToggle);
  }, []);

  if (isCollapsed) {
    return null; 
  }

  return (
    <div className="flex flex-col items-end gap-3 pointer-events-auto h-full">
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
        {/* Expanded Content Area */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'calc(100% - 360px)' }}
              exit={{ opacity: 0, width: 0 }}
              className="border-r border-white/10 flex flex-col h-full bg-black/20 overflow-hidden flex-shrink-0"
            >
              {activeTab === 'market' ? (
                <MarketExpandedView />
              ) : activeTab === 'settings' ? (
                <SettingsExpandedView feedSettings={feedSettings} setFeedSettings={setFeedSettings} />
              ) : (
                <MissionsExpandedView selectedGame={selectedMissionGame} onSelectGame={setSelectedMissionGame} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Original Feed Content (Standard View) */}
        <div className="w-[360px] flex flex-col h-full flex-shrink-0 relative">
          {/* Expand Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute top-1/2 left-0 -translate-y-1/2 z-10 w-4 h-12 bg-white/10 hover:bg-white/20 border-y border-r border-white/10 rounded-r-xl flex items-center justify-center backdrop-blur-md transition-colors"
          >
            {isExpanded ? <ChevronRight className="w-3 h-3 text-white" /> : <ChevronLeft className="w-3 h-3 text-white" />}
          </button>

          {/* Scrollable Content Area */}
          <div className="p-4 pl-6 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
           <style>{`
              .intel-scrollbar::-webkit-scrollbar { width: 6px; }
              .intel-scrollbar::-webkit-scrollbar-track { background: transparent; }
              .intel-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.2); border-radius: 10px; }
           `}</style>

           {/* LIVE FEED | INTEL Header */}
           <div className="text-[#64B5F6] text-sm font-bold tracking-widest mb-4 flex justify-between items-center">
              <span>LIVE FEED | INTEL</span>
           </div>

           {/* Tabs */}
           <div className="flex gap-2 mb-4">
             <button
               onClick={() => setActiveTab('missions')}
               className={`flex-1 py-2 text-[10px] font-bold tracking-widest rounded-lg border transition-all ${
                 activeTab === 'missions' 
                   ? 'bg-[#64B5F6]/20 border-[#64B5F6]/50 text-[#64B5F6]' 
                   : 'bg-black/20 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5'
               }`}
             >
               MISSIONS
             </button>
             <button
               onClick={() => setActiveTab('market')}
               className={`flex-1 py-2 text-[10px] font-bold tracking-widest rounded-lg border transition-all ${
                 activeTab === 'market' 
                   ? 'bg-[#64B5F6]/20 border-[#64B5F6]/50 text-[#64B5F6]' 
                   : 'bg-black/20 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5'
               }`}
             >
               MARKET
             </button>
             <button
               onClick={() => setActiveTab('settings')}
               className={`p-2 rounded-lg border transition-all ${
                 activeTab === 'settings' 
                   ? 'bg-[#64B5F6]/20 border-[#64B5F6]/50 text-[#64B5F6]' 
                   : 'bg-black/20 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5'
               }`}
             >
               <Settings className="w-4 h-4" />
             </button>
           </div>

           <AnimatePresence mode="wait">
             {activeTab === 'missions' && feedSettings.missions && (
               <motion.div 
                 key="missions"
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 10 }}
                 transition={{ duration: 0.2 }}
                 className="flex-1" 
               >
                 <div className="space-y-4">
                    {MISSION_CATEGORIES.map(category => {
                      const categoryMissions = MOCK_MISSIONS.filter(m => m.category === category);
                      if (categoryMissions.length === 0) return null;

                      return (
                        <div key={category} className="mb-2">
                          <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                             {category === 'Ability' && <Zap className="w-3 h-3 text-purple-400" />}
                             {category === 'Equipment' && <Shield className="w-3 h-3 text-blue-400" />}
                             {category === 'Weapon' && <Sword className="w-3 h-3 text-red-400" />}
                             {category === 'Companion' && <Bot className="w-3 h-3 text-green-400" />}
                             {category === 'Cosmetic' && <Image className="w-3 h-3 text-amber-400" />}
                             {category}
                          </h4>
                          <div className="space-y-2">
                            {categoryMissions.map(mission => {
                               const gameObj = MOCK_GAMES.find(g => g.id === mission.gameId);
                               return (
                               <div key={mission.id} className="rounded-lg bg-black/40 border border-white/10 overflow-hidden group">
                                  <div 
                                    className="flex justify-between items-start p-3 cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => setStandardExpandedMission(standardExpandedMission === mission.id ? null : mission.id)}
                                  >
                                     <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex text-xs text-white mb-1.5 font-semibold">
                                           <span className="truncate">{mission.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                                             <div className="h-full bg-gradient-to-r from-[#64B5F6] to-blue-400 rounded-full" style={{ width: mission.progress.split('/')[0] / mission.progress.split('/')[1] * 100 + '%' }} />
                                          </div>
                                          <span className="text-[9px] text-white/50">{mission.progress}</span>
                                        </div>
                                     </div>
                                     {standardExpandedMission === mission.id ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white" />}
                                  </div>

                                  <AnimatePresence>
                                    {standardExpandedMission === mission.id && (
                                      <motion.div
                                         initial={{ height: 0, opacity: 0 }}
                                         animate={{ height: 'auto', opacity: 1 }}
                                         exit={{ height: 0, opacity: 0 }}
                                         className="bg-white/5 border-t border-white/5"
                                      >
                                         <div className="p-3 space-y-3">
                                            <p className="text-[10px] text-white/70 leading-relaxed">{mission.description}</p>
                                            <div className="text-[10px] text-white/50 flex items-center gap-1">
                                              <Gamepad2 className="w-3 h-3" /> {gameObj?.name}
                                            </div>
                                            <div className="bg-black/30 rounded p-2 border border-white/5">
                                              <span className="text-[9px] text-[#64B5F6] uppercase font-bold block mb-1">Reward</span>
                                              <span className="text-xs text-white">{mission.reward}</span>
                                            </div>
                                         </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                               </div>
                               );
                            })}
                          </div>
                        </div>
                      );
                    })}
                 </div>
               </motion.div>
             )}

             {activeTab === 'market' && feedSettings.marketUpdates && (
               <motion.div 
                 key="market"
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 transition={{ duration: 0.2 }}
                 className="flex-1" 
               >
                  <div className="space-y-3">
                    {MOCK_MARKET_UPDATES.map(update => (
                       <div key={update.id} className="p-3 rounded-xl bg-black/40 border border-[#64B5F6]/20 cursor-pointer hover:bg-white/5 transition-colors group">
                          <div className="flex justify-between items-start mb-1.5">
                             <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                               update.type === 'drop' ? 'bg-green-500/20 text-green-400' :
                               update.type === 'event' ? 'bg-purple-500/20 text-purple-400' :
                               update.type === 'limited' ? 'bg-amber-500/20 text-amber-400' :
                               'bg-blue-500/20 text-blue-400'
                             }`}>{update.tag}</span>
                             <span className="text-[9px] text-white/40">{update.time}</span>
                          </div>
                          <h4 className="text-white text-xs font-semibold mb-1 group-hover:text-[#64B5F6] transition-colors">{update.title}</h4>
                          <p className="text-[10px] text-white/60 mb-2">{update.desc}</p>
                          <div className="text-[9px] text-white/30 flex items-center gap-1">
                            <Gamepad2 className="w-3 h-3" /> {update.game}
                          </div>
                       </div>
                    ))}
                  </div>
               </motion.div>
             )}

             {activeTab === 'settings' && (
               <motion.div 
                 key="settings"
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 transition={{ duration: 0.2 }}
                 className="flex-1 text-center py-8" 
               >
                  <Settings className="w-8 h-8 text-white/20 mx-auto mb-3" />
                  <p className="text-white/60 text-xs">Expand the panel to access<br/>full Feed Settings.</p>
               </motion.div>
             )}
           </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}