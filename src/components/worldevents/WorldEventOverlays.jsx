import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Zap, Sword, Search, MessageSquare, UserPlus, Calendar, Clock, MapPin, Send, MoreVertical, Gift, Package, Trophy, Star, ChevronRight, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Shared Liquid Glass Container ---
const GlassContainer = ({ children, title, onClose, className = "", widthClass = "md:w-96" }) => (
  <motion.div
    initial={{ opacity: 0, y: 100, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 100, scale: 0.95 }}
    className={`fixed inset-x-4 bottom-24 top-24 md:inset-x-auto md:right-8 md:top-24 md:bottom-8 ${widthClass} rounded-3xl overflow-hidden flex flex-col z-[1500] ${className}`}
    style={{
      background: 'rgba(30, 41, 59, 0.4)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
    }}
  >
    {/* Header */}
    <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
      <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
      <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
        <X className="w-5 h-5 text-white/70" />
      </button>
    </div>
    
    {/* Content */}
    <div className="flex-1 overflow-hidden relative">
      {children}
    </div>
  </motion.div>
);

// --- Inventory Overlay (Full Screen Liquid Glass) ---
export const InventoryOverlay = ({ onClose }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Weapons', 'Armor', 'Materials', 'Consumables'];
  
  const items = Array.from({ length: 48 }).map((_, i) => ({
    id: i,
    name: `Ancient Artifact ${i + 1}`,
    category: ['Weapons', 'Armor', 'Materials', 'Consumables'][Math.floor(Math.random() * 4)],
    rarity: ['Common', 'Rare', 'Epic', 'Legendary'][Math.floor(Math.random() * 4)],
    icon: i % 3 === 0 ? Sword : (i % 3 === 1 ? Shield : Package)
  }));

  const filteredItems = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-4 md:inset-8 z-[1500] rounded-[2.5rem] overflow-hidden flex flex-col"
      style={{
        background: 'rgba(255, 255, 255, 0.05)', // Highly transparent liquid glass
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 0 100px rgba(0,0,0,0.5) inset'
      }}
    >
      {/* Liquid Header */}
      <div className="flex items-center justify-between p-8 border-b border-white/10">
        <div className="flex items-center gap-6">
          <h2 className="text-4xl font-light text-white tracking-[0.2em] uppercase">Backpack</h2>
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm tracking-wider transition-all duration-300 ${
                  activeCategory === cat 
                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]' 
                    : 'bg-black/20 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:rotate-90"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Grid Content */}
      <ScrollArea className="flex-1 p-8">
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.random() * 0.2 }}
              className="group relative aspect-square"
            >
              {/* Card Container */}
              <div className={`w-full h-full rounded-2xl flex flex-col items-center justify-center relative border backdrop-blur-md transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl ${
                item.rarity === 'Legendary' ? 'bg-yellow-500/5 border-yellow-500/20 group-hover:border-yellow-400/50 group-hover:shadow-yellow-500/20' :
                item.rarity === 'Epic' ? 'bg-purple-500/5 border-purple-500/20 group-hover:border-purple-400/50 group-hover:shadow-purple-500/20' :
                item.rarity === 'Rare' ? 'bg-blue-500/5 border-blue-500/20 group-hover:border-blue-400/50 group-hover:shadow-blue-500/20' :
                'bg-white/5 border-white/10 group-hover:border-white/30 group-hover:shadow-white/10'
              }`}>
                
                <item.icon className={`w-10 h-10 mb-2 opacity-80 group-hover:scale-110 transition-transform ${
                  item.rarity === 'Legendary' ? 'text-yellow-200' :
                  item.rarity === 'Epic' ? 'text-purple-200' :
                  item.rarity === 'Rare' ? 'text-blue-200' :
                  'text-slate-300'
                }`} />
                
                <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold">{item.rarity}</div>
                
                {/* Gloss Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              </div>

              {/* Hover Tooltip/Label */}
              <div className="absolute -bottom-8 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-xs text-white bg-black/60 px-2 py-1 rounded backdrop-blur-md">{item.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="p-6 border-t border-white/10 flex justify-between items-center text-white/40 text-sm">
        <span>Capacity: {items.length} / 100</span>
        <span>Drag items to organize</span>
      </div>
    </motion.div>
  );
};

// --- Loadout Overlay ---
export const LoadoutOverlay = ({ onClose }) => {
  return (
    <GlassContainer title="Loadout" onClose={onClose}>
      <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="flex justify-center">
           <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
              <span className="text-xs text-white/40">Avatar</span>
           </div>
        </div>

        <div className="space-y-4">
          {['Primary Weapon', 'Secondary Weapon', 'Armor', 'Accessory'].map((slot) => (
            <div key={slot} className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-black/20 flex items-center justify-center">
                <Sword className="w-5 h-5 text-white/30" />
              </div>
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider font-bold">{slot}</div>
                <div className="text-sm text-white font-medium">Empty Slot</div>
              </div>
              <Button size="sm" variant="ghost" className="ml-auto text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
                Equip
              </Button>
            </div>
          ))}
        </div>
      </div>
    </GlassContainer>
  );
};

// --- Messages Overlay (1/3 Page Liquid Glass) ---
export const MessagesOverlay = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('World');
  const [inputText, setInputText] = useState('');
  
  const channels = ['World', 'Area', 'Party', 'Whisper'];
  
  const messages = [
    { id: 1, channel: 'World', sender: 'SlayerX', text: 'Anyone up for the Inferno Dragon raid?', time: '2m', color: 'text-yellow-400' },
    { id: 2, channel: 'Area', sender: 'LunaFan', text: 'Rare chest spawned at the fountain!', time: '5m', color: 'text-cyan-400' },
    { id: 3, channel: 'World', sender: 'IronHeart', text: 'Selling Epic Sword, DM me offers', time: '8m', color: 'text-white' },
    { id: 4, channel: 'Party', sender: 'You', text: 'On my way!', time: 'Now', color: 'text-purple-400' },
    { id: 5, channel: 'Area', sender: 'NoobMaster', text: 'Where is the blacksmith?', time: '10m', color: 'text-white/60' },
  ];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      className="fixed top-8 bottom-8 right-8 w-full md:w-[35vw] rounded-[2rem] overflow-hidden flex flex-col z-[1500]"
      style={{
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
         <h2 className="text-2xl font-light tracking-widest text-white uppercase">CommLink</h2>
         <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-white/60" /></button>
      </div>

      {/* Tabs */}
      <div className="flex p-2 bg-black/20 gap-1">
        {channels.map(channel => (
          <button
            key={channel}
            onClick={() => setActiveTab(channel)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === channel 
                ? 'bg-white/10 text-white shadow-lg' 
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {channel}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-transparent to-black/20">
        <div className="space-y-4">
          {messages.map((msg) => (
             <motion.div 
               key={msg.id} 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className={`p-3 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm ${msg.sender === 'You' ? 'ml-12 border-purple-500/20 bg-purple-500/5' : 'mr-4'}`}
             >
                <div className="flex items-center gap-2 mb-1">
                   <span className={`text-xs font-bold ${msg.color}`}>{msg.sender}</span>
                   <span className="text-[10px] text-white/30 uppercase border border-white/10 px-1 rounded">{msg.channel}</span>
                   <span className="text-[10px] text-white/20 ml-auto">{msg.time}</span>
                </div>
                <p className="text-sm text-white/90 font-light leading-relaxed">
                  {msg.text}
                </p>
             </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white/5 border-t border-white/10">
        <div className="relative flex items-center gap-2">
           <div className="flex-1 relative">
             <input 
               type="text" 
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               placeholder={`Message [${activeTab}]...`}
               className="w-full bg-black/30 border border-white/10 rounded-full pl-5 pr-12 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all"
             />
             <Button 
               size="icon" 
               className="absolute right-1 top-1 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
             >
               <Send className="w-3 h-3" />
             </Button>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Friends Overlay (MH Now Style) ---
export const FriendsOverlay = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('Online');
  
  const onlineFriends = [
    { id: 1, name: 'SlayerKing', level: 45, status: 'Hunting Rathalos', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Slayer' },
    { id: 2, name: 'LunaMage', level: 32, status: 'In Lobby', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' },
  ];

  const nearbyHunters = [
    { id: 3, name: 'Hunter_NY', level: 50, distance: '120m away', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NY' },
    { id: 4, name: 'Draconis', level: 28, distance: '350m away', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Draco' },
  ];

  const recentAllies = [
    { id: 5, name: 'SupportMain', level: 40, lastSeen: 'Battled Inferno Dragon', time: '10m ago', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Supp' },
  ];

  const getList = () => {
    switch(activeTab) {
      case 'Online': return onlineFriends;
      case 'Nearby': return nearbyHunters;
      case 'Recent': return recentAllies;
      default: return [];
    }
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      className="fixed top-24 bottom-24 right-8 w-full md:w-96 rounded-3xl overflow-hidden flex flex-col z-[1500]"
      style={{
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(30px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div className="p-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5" /> Hunter Network</h2>
        <button onClick={onClose}><X className="w-5 h-5 text-white/50 hover:text-white" /></button>
      </div>

      <div className="flex border-b border-white/5">
        {['Online', 'Nearby', 'Recent'].map(tab => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`flex-1 py-3 text-xs font-bold uppercase transition-colors relative ${
                activeTab === tab ? 'text-cyan-400 bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'
             }`}
           >
             {tab}
             {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />}
           </button>
        ))}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {getList().map(player => (
            <motion.div 
              key={player.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center gap-3 group hover:border-white/20 transition-all"
            >
              <div className="relative">
                 <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full bg-black/20" />
                 {activeTab === 'Online' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                   <h3 className="text-white font-bold text-sm truncate">{player.name}</h3>
                   <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">LVL {player.level}</span>
                </div>
                <p className="text-xs text-white/50 truncate">
                  {player.status || player.distance || player.lastSeen}
                </p>
                {player.time && <p className="text-[10px] text-white/30">{player.time}</p>}
              </div>

              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {activeTab !== 'Online' && (
                   <Button size="icon" className="h-7 w-7 rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white" title="Add Friend">
                      <UserPlus className="w-3 h-3" />
                   </Button>
                 )}
                 <Button size="icon" className="h-7 w-7 rounded-full bg-white/10 text-white hover:bg-white/20" title="Message">
                    <MessageSquare className="w-3 h-3" />
                 </Button>
              </div>
            </motion.div>
          ))}
          
          {getList().length === 0 && (
            <div className="text-center py-10 text-white/30 text-sm">
               No hunters found in this category.
            </div>
          )}
        </div>
      </ScrollArea>
      
      {activeTab === 'Nearby' && (
         <div className="p-4 border-t border-white/10 bg-cyan-900/10">
            <div className="flex items-center gap-3 text-cyan-300 text-xs mb-3">
               <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
               Scanning for nearby signals...
            </div>
            <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white border-none shadow-lg shadow-cyan-900/20">
               Broadcast Invite
            </Button>
         </div>
      )}
    </motion.div>
  );
};

// --- Events Overlay ---
export const EventsOverlay = ({ onClose }) => {
  const challenges = [
    { id: 1, title: 'Dragon Slayer', desc: 'Defeat 5 Dragons', progress: 2, total: 5, reward: '1000 XP' },
    { id: 2, title: 'Treasure Hunter', desc: 'Open 10 Rare Chests', progress: 7, total: 10, reward: '500 Gold' },
    { id: 3, title: 'PVP Dominator', desc: 'Win 3 Duel Matches', progress: 1, total: 3, reward: 'Epic Title' },
  ];

  const leaderboard = [
    { rank: 1, name: 'SlayerKing', score: 15420, avatar: '👑' },
    { rank: 2, name: 'LunaFan99', score: 14200, avatar: '⚔️' },
    { rank: 3, name: 'VoidWalker', score: 13850, avatar: '👻' },
    { rank: 4, name: 'IronClad', score: 12100, avatar: '🛡️' },
    { rank: 5, name: 'PixelMage', score: 11500, avatar: '✨' },
  ];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-[1100px] z-[1500] flex flex-col border-l border-white/10 shadow-2xl"
      style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
        <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
          <Calendar className="w-6 h-6 text-cyan-400" />
          World Hub
        </h2>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
          <X className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-3 divide-x divide-white/10 overflow-hidden">
        
        {/* Left Column: Active Challenges */}
        <div className="flex flex-col h-full bg-white/[0.02]">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Challenges
            </h3>
            <Badge variant="outline" className="text-[10px] border-white/20 text-white/50">Daily</Badge>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {challenges.map(c => (
                <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-white">{c.title}</h4>
                    <span className="text-[10px] text-yellow-400 font-mono">{c.reward}</span>
                  </div>
                  <p className="text-xs text-white/50 mb-3">{c.desc}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>Progress</span>
                      <span>{c.progress}/{c.total}</span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" 
                        style={{ width: `${(c.progress / c.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button size="sm" variant="ghost" className="w-full text-white/40 text-xs hover:text-white mt-2">
                View All Challenges <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </ScrollArea>
        </div>

        {/* Middle Column: World Events */}
        <div className="flex flex-col h-full bg-white/[0.02]">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
             <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-400" /> Active Events
            </h3>
            <div className="flex items-center gap-1 text-[10px] text-red-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> LIVE
            </div>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-red-900/40 to-slate-900/40 rounded-xl p-4 border border-red-500/30 shadow-lg shadow-red-900/10">
                <div className="flex justify-between items-start mb-2">
                  <Badge className="bg-red-500 text-white border-none shadow-sm shadow-red-500/50">RAID BOSS</Badge>
                  <span className="text-red-300 text-xs font-mono flex items-center bg-black/20 px-2 py-0.5 rounded"><Clock className="w-3 h-3 mr-1" /> 2h 45m</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Inferno Dragon</h3>
                <p className="text-white/60 text-xs mb-3">A massive dragon has been spotted in Central Park. Gather your squad and claim legendary loot.</p>
                <div className="flex items-center gap-2 text-xs text-white/40 mb-3 bg-black/20 p-2 rounded">
                  <MapPin className="w-3 h-3" /> <span>Central Park, NYC</span>
                </div>
                <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-900/20 font-bold tracking-wide">
                  <Sword className="w-3 h-3 mr-2" /> Join Raid
                </Button>
              </div>

              <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 rounded-xl p-4 border border-blue-500/30">
                <div className="flex justify-between items-start mb-2">
                  <Badge className="bg-blue-500 text-white border-none">EVENT</Badge>
                  <span className="text-blue-300 text-xs font-mono flex items-center"><Clock className="w-3 h-3 mr-1" /> 2d left</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Double XP Weekend</h3>
                <p className="text-white/60 text-xs mb-3">Earn 2x XP from all monster battles and chest unlocks this weekend.</p>
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none">View Details</Button>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right Column: Leaderboard */}
        <div className="flex flex-col h-full bg-white/[0.02]">
           <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-400" /> Leaderboard
            </h3>
            <Badge variant="outline" className="text-[10px] border-white/20 text-white/50">Global</Badge>
          </div>
          <ScrollArea className="flex-1 p-0">
            <div className="divide-y divide-white/5">
              {leaderboard.map((player, idx) => (
                <div key={player.rank} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors">
                  <div className={`w-6 h-6 flex items-center justify-center text-sm font-bold rounded ${
                    idx === 0 ? 'bg-yellow-500 text-black' : 
                    idx === 1 ? 'bg-slate-300 text-black' : 
                    idx === 2 ? 'bg-orange-700 text-white' : 'text-white/30'
                  }`}>
                    {player.rank}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg">
                    {player.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{player.name}</div>
                    <div className="text-xs text-white/40">Level 42 • Warrior</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-cyan-400">{player.score.toLocaleString()}</div>
                    <div className="text-[10px] text-white/20">PTS</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
           <div className="p-4 border-t border-white/5 bg-white/[0.02]">
             <div className="flex items-center gap-3 opacity-60">
                <div className="text-sm font-bold text-white/50">#142</div>
                <div className="text-sm font-bold text-white">You</div>
                <div className="ml-auto text-sm font-mono text-white/50">4,250 PTS</div>
             </div>
           </div>
        </div>

      </div>
    </motion.div>
  );
};