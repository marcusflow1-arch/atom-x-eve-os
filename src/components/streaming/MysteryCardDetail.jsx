import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Layers, Sparkles, TrendingUp, Zap, Shield, Crown, Star, ArrowUp, Info, Activity, Box } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import ShinyCard from '@/components/shared/ShinyCard';

// Mock Data
const MOCK_CARD_STATS = {
  attack: 115,
  defense: 92,
  magic: 100,
  power: 337
};

// Overview / Card Record UI (Screenshot 1)
const CardRecordView = ({ card }) => (
  <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar">
    <div className="space-y-2">
      <h3 className="text-white text-lg font-bold flex items-center gap-2">
        <Info className="w-5 h-5 text-cyan-400" /> Card Record
      </h3>
      <p className="text-white/50 text-xs">Detailed information about this card</p>
    </div>

    <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-4">
      <div>
        <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Description</h4>
        <p className="text-white/80 text-sm italic">"A collectible trading card from Destiny 2: Renegades."</p>
      </div>
      
      <div className="grid grid-cols-2 gap-8 pt-2">
        <div>
          <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Series</h4>
          <p className="text-white font-semibold">Destiny 2: Renegades</p>
        </div>
        <div>
          <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Rarity</h4>
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none">Rare</Badge>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <h4 className="text-white/40 text-[10px] uppercase tracking-wider">Stats</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/30 p-3 rounded-lg border border-white/5">
          <span className="text-white/40 text-[10px] uppercase block mb-1">Strength</span>
          <span className="text-2xl font-bold text-white">3</span>
        </div>
        <div className="bg-black/30 p-3 rounded-lg border border-white/5">
          <span className="text-white/40 text-[10px] uppercase block mb-1">Magic</span>
          <span className="text-2xl font-bold text-white">8</span>
        </div>
      </div>
    </div>

    <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-3">
      <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Card Details</h4>
      <div className="flex justify-between text-xs">
        <span className="text-white/50">Card ID</span>
        <span className="text-white/80 font-mono">card-b93b3ba6092520948af/1004-1</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-white/50">Type</span>
        <span className="text-white/80">Trading Card</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-white/50">Collection</span>
        <span className="text-white/80">Destiny 2: Renegades</span>
      </div>
    </div>
  </div>
);

// Blacksmith UI (Screenshot 3)
const BlacksmithView = ({ card }) => {
  const [activeTab, setActiveTab] = useState('levelup');

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
               <Hammer className="w-5 h-5 text-orange-400" />
            </div>
            <div>
               <h3 className="text-white font-bold text-lg">Blacksmith</h3>
               <p className="text-white/50 text-xs">Forge your card's true potential</p>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-1">
               <span className="w-2 h-2 rounded-full bg-yellow-500" /> 25,000
            </Badge>
            <Badge variant="outline" className="bg-white/5 text-white/70 border-white/10">45</Badge>
         </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/10 overflow-x-auto">
         {['Level Up', 'Enhance', 'Combine', 'Ascend', 'Trade'].map((tab) => (
            <button
               key={tab}
               onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))}
               className={`flex-1 min-w-[80px] py-2 px-3 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab.toLowerCase().replace(' ', '')
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
               }`}
            >
               {tab}
            </button>
         ))}
      </div>

      {/* Main Content Area */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 space-y-6">
         <div>
            <div className="flex justify-between items-end mb-2">
               <h4 className="text-white font-bold text-base">Level Up</h4>
               <span className="text-white/40 text-xs">Max 10</span>
            </div>
            <p className="text-white/50 text-xs mb-4">Increase your card's level to boost all base stats.</p>
            
            <div className="space-y-1 mb-6">
               <div className="flex justify-between text-xs text-white/70">
                  <span>Level 1</span>
                  <span>Level 2</span>
               </div>
               <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full w-[15%] bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
               </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
               <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-white/40 text-[10px] uppercase">Attack</span>
                  <div className="text-white font-bold text-lg">115</div>
                  <div className="text-green-400 text-xs">+15</div>
               </div>
               <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-white/40 text-[10px] uppercase">Defense</span>
                  <div className="text-white font-bold text-lg">92</div>
                  <div className="text-green-400 text-xs">+12</div>
               </div>
               <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-white/40 text-[10px] uppercase">Magic</span>
                  <div className="text-white font-bold text-lg">100</div>
                  <div className="text-green-400 text-xs">+10</div>
               </div>
            </div>

            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 rounded-xl shadow-[0_4px_20px_rgba(249,115,22,0.3)]">
               <ArrowUp className="w-4 h-4 mr-2" /> Level Up (100 G)
            </Button>
         </div>
      </div>

      {/* Materials */}
      <div className="space-y-3">
         <h4 className="text-white/60 text-xs font-bold uppercase flex items-center gap-2">
            <Box className="w-3 h-3" /> Required Materials
         </h4>
         <div className="space-y-2">
            {[
               { name: 'Precision Shard', count: 45, icon: '🎯', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
               { name: 'Combat Core', count: 28, icon: '⚔️', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
               { name: 'Ascension Core', count: 8, icon: '👑', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
            ].map((mat) => (
               <div key={mat.name} className={`flex items-center justify-between p-3 rounded-xl border ${mat.border} ${mat.bg}`}>
                  <div className="flex items-center gap-3">
                     <span className="text-lg">{mat.icon}</span>
                     <span className={`text-sm font-medium ${mat.color}`}>{mat.name}</span>
                  </div>
                  <span className="text-white/60 text-xs font-mono">x{mat.count}</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

// Skill Tree UI (Screenshot 4)
const SkillTreeView = ({ card }) => (
  <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar">
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
             <Layers className="w-5 h-5 text-purple-400" />
          </div>
          <div>
             <h3 className="text-white font-bold text-lg">Skill Tree</h3>
             <p className="text-white/50 text-xs">Unlock abilities and passives</p>
          </div>
       </div>
       <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-1">
          <Zap className="w-3 h-3" /> 2000 SP
       </Badge>
    </div>

    <div className="grid grid-cols-3 gap-4 h-[500px]">
       {/* Power Path */}
       <div className="flex flex-col gap-4 relative">
          <div className="text-center mb-2">
             <h4 className="text-purple-400 font-bold text-sm">Power Path</h4>
             <p className="text-white/30 text-[10px]">Raw strength & combat</p>
          </div>
          
          <div className="flex-1 rounded-2xl bg-purple-900/10 border border-purple-500/20 p-4 relative overflow-hidden flex flex-col items-center gap-8">
             <div className="absolute top-0 bottom-0 w-px bg-purple-500/20 z-0" />
             
             {/* Root Node */}
             <div className="w-12 h-12 rounded-xl bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] z-10 flex items-center justify-center border border-white/20">
                <Zap className="w-6 h-6 text-white" />
             </div>

             {/* Branches */}
             <div className="grid grid-cols-2 gap-x-8 gap-y-8 w-full z-10">
                {[1, 2, 3, 4].map((i) => (
                   <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer">
                      <div className="w-10 h-10 rounded-lg bg-black/60 border border-purple-500/30 flex items-center justify-center group-hover:border-purple-500 group-hover:bg-purple-500/20 transition-all">
                         <div className="w-4 h-4 rounded bg-purple-500/20" />
                      </div>
                      <span className="text-[9px] text-purple-300 font-mono">100 SP</span>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* Neutral Path */}
       <div className="flex flex-col gap-4 relative">
          <div className="text-center mb-2">
             <h4 className="text-yellow-400 font-bold text-sm">Neutral Path</h4>
             <p className="text-white/30 text-[10px]">Balance & utility</p>
          </div>
          
          <div className="flex-1 rounded-2xl bg-yellow-900/10 border border-yellow-500/20 p-4 relative overflow-hidden flex flex-col items-center gap-8">
             <div className="absolute top-0 bottom-0 w-px bg-yellow-500/20 z-0" />
             
             <div className="w-12 h-12 rounded-xl bg-black/60 border border-yellow-500/50 z-10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-yellow-500" />
             </div>

             <div className="grid grid-cols-2 gap-x-8 gap-y-8 w-full z-10">
                {[1, 2, 3, 4].map((i) => (
                   <div key={i} className="flex flex-col items-center gap-1 opacity-50">
                      <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center">
                         <div className="w-4 h-4 rounded bg-white/10" />
                      </div>
                      <span className="text-[9px] text-white/30 font-mono">LOCKED</span>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* AI Adaptation Path */}
       <div className="flex flex-col gap-4 relative">
          <div className="text-center mb-2">
             <h4 className="text-cyan-400 font-bold text-sm">AI Path</h4>
             <p className="text-white/30 text-[10px]">Adaptation & behavior</p>
          </div>
          
          <div className="flex-1 rounded-2xl bg-cyan-900/10 border border-cyan-500/20 p-4 relative overflow-hidden flex flex-col items-center gap-8">
             <div className="absolute top-0 bottom-0 w-px bg-cyan-500/20 z-0" />
             
             <div className="w-12 h-12 rounded-xl bg-black/60 border border-cyan-500/50 z-10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-cyan-500" />
             </div>

             <div className="grid grid-cols-2 gap-x-8 gap-y-8 w-full z-10">
                {[1, 2, 3, 4].map((i) => (
                   <div key={i} className="flex flex-col items-center gap-1 opacity-50">
                      <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center">
                         <div className="w-4 h-4 rounded bg-white/10" />
                      </div>
                      <span className="text-[9px] text-white/30 font-mono">LOCKED</span>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  </div>
);

export default function MysteryCardDetail({ card, onBack }) {
  const [viewMode, setViewMode] = useState('overview'); // overview, blacksmith, skilltree

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Left Side: Card & Controls - Reduced Size (50%) */}
        <div className="w-[200px] flex-shrink-0 flex flex-col gap-4 pt-2">
          
          {/* Top Controls (Above Card) - Compact */}
          <div className="flex items-center gap-1">
            <button
               onClick={() => setViewMode('overview')}
               className={`flex-1 py-1.5 px-2 rounded-md text-[10px] font-bold transition-all border flex items-center justify-center gap-1 ${
                  viewMode === 'overview' 
                  ? 'bg-slate-700 text-white border-slate-600 shadow-lg' 
                  : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
               }`}
               title="Record"
            >
               <Info className="w-3 h-3" />
            </button>
            <button
               onClick={() => setViewMode('blacksmith')}
               className={`flex-1 py-1.5 px-2 rounded-md text-[10px] font-bold transition-all border flex items-center justify-center gap-1 ${
                  viewMode === 'blacksmith' 
                  ? 'bg-orange-900/80 text-orange-100 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]' 
                  : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
               }`}
               title="Forge"
            >
               <Hammer className="w-3 h-3" />
            </button>
            <button
               onClick={() => setViewMode('skilltree')}
               className={`flex-1 py-1.5 px-2 rounded-md text-[10px] font-bold transition-all border flex items-center justify-center gap-1 ${
                  viewMode === 'skilltree' 
                  ? 'bg-purple-900/80 text-purple-100 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                  : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
               }`}
               title="Skills"
            >
               <Layers className="w-3 h-3" />
            </button>
          </div>

          {/* Power Header - Scaled Down */}
          <div className="flex flex-col items-center">
             <div className="flex items-center gap-1.5 relative">
                <span className="text-white/40 text-[9px] uppercase font-bold tracking-widest absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">Total Power</span>
                <div className="text-2xl font-black text-white tracking-tight flex items-center">
                   <Zap className="w-4 h-4 text-yellow-400 mr-1 fill-yellow-400" />
                   {MOCK_CARD_STATS.power}
                </div>
                {/* Rarity Badge positioned relative to the number */}
                <Badge className="bg-blue-600 text-white border border-blue-400 shadow-[0_0_5px_rgba(37,99,235,0.4)] px-1 py-0 text-[8px] h-3.5 absolute -right-8 top-1/2 -translate-y-1/2">
                   Rare
                </Badge>
             </div>
          </div>

          {/* The Card */}
          <div className="relative group perspective-1000">
             <ShinyCard className="w-full aspect-[2/3] border border-white/10 bg-slate-900 shadow-xl rounded-xl overflow-hidden relative z-10">
                {/* Card Art Placeholder */}
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1627856014759-2a5713c54d65?q=80&w=1000&auto=format&fit=crop')` }}>
                   <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                </div>
                
                {/* Card Content Overlay */}
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                      <Badge variant="outline" className="bg-black/60 backdrop-blur-md border-white/20 text-white/90 text-[9px] h-4 px-1.5">
                         Lv. 1
                      </Badge>
                      <div className="flex gap-0.5 bg-black/40 p-0.5 rounded-full backdrop-blur-md">
                         <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                         <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                         <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                      </div>
                   </div>

                   <div>
                      <h2 className="text-white font-black text-lg leading-none mb-0.5 drop-shadow-lg font-heading">
                         RENEGADES
                      </h2>
                      <div className="flex items-center gap-1 mb-1">
                         <Badge className="bg-orange-500 text-white border-none text-[8px] py-0 h-3 px-1">Legendary</Badge>
                         <span className="text-white/70 text-[9px] font-medium">Destiny 2</span>
                      </div>
                   </div>
                </div>
             </ShinyCard>

             {/* Background Glow */}
             <div className="absolute inset-0 bg-orange-500/20 blur-2xl -z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>

          {/* Perks Section (Below Card) */}
          <div className="space-y-3">
             <h4 className="text-white/40 text-xs font-bold uppercase tracking-widest text-center">Active Perks</h4>
             <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                   <div key={i} className="aspect-square rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors cursor-help group relative">
                      <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                         <Sparkles className="w-4 h-4 text-white/60 group-hover:text-yellow-400 transition-colors" />
                      </div>
                      <span className="text-[9px] text-white/40 font-mono">LOCKED</span>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Side: Dynamic UI Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-black/20 rounded-2xl border border-white/5 p-1">
          <AnimatePresence mode="wait">
            {viewMode === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-4"
              >
                <CardRecordView card={card} />
              </motion.div>
            )}

            {viewMode === 'blacksmith' && (
              <motion.div 
                key="blacksmith"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-4"
              >
                <BlacksmithView card={card} />
              </motion.div>
            )}

            {viewMode === 'skilltree' && (
              <motion.div 
                key="skilltree"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-4"
              >
                <SkillTreeView card={card} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}