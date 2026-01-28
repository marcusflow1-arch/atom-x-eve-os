import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Layers, Sparkles, TrendingUp, Zap, Shield, Crown, Star, ArrowUp, Info, Activity, Box, ArrowLeft } from 'lucide-react';
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
  <div className="h-full flex gap-6 p-6">
    {/* Left: Card Visual */}
    <div className="w-[240px] flex-shrink-0 flex flex-col gap-4">
      <div className="relative group perspective-1000">
         <ShinyCard className="w-full aspect-[2/3] border border-white/10 bg-slate-900 shadow-2xl rounded-xl overflow-hidden relative z-10">
            {/* Card Art Placeholder */}
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1627856014759-2a5713c54d65?q=80&w=1000&auto=format&fit=crop')` }}>
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            </div>
            
            {/* Card Content Overlay */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
               <div className="flex justify-between items-start">
                  <Badge variant="outline" className="bg-black/60 backdrop-blur-md border-white/20 text-white/90">
                     Lv. 1
                  </Badge>
                  <div className="flex gap-0.5 bg-black/40 p-1 rounded-full backdrop-blur-md">
                     <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                     <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                     <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  </div>
               </div>

               <div>
                  <h2 className="text-white font-black text-xl leading-none mb-1 drop-shadow-lg font-heading">
                     RENEGADES
                  </h2>
                  <div className="flex items-center gap-2 mb-2">
                     <Badge className="bg-orange-500 text-white border-none text-[10px] py-0 h-4">Legendary</Badge>
                     <span className="text-white/70 text-xs font-medium">Destiny 2</span>
                  </div>
               </div>
            </div>
         </ShinyCard>
         {/* Background Glow */}
         <div className="absolute inset-0 bg-orange-500/20 blur-3xl -z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </div>

      {/* Active Perks */}
      <div className="space-y-2">
         <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest text-center">Active Perks</h4>
         <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
               <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors cursor-help group relative">
                  <div className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center">
                     <Sparkles className="w-3 h-3 text-white/60 group-hover:text-yellow-400 transition-colors" />
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>

    {/* Right: Info */}
    <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
      <div className="space-y-2">
        <h3 className="text-white text-2xl font-bold flex items-center gap-3">
          <Info className="w-6 h-6 text-cyan-400" /> Card Record
        </h3>
        <p className="text-white/50 text-sm">Detailed information and history of this card.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
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

        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-4">
            <h4 className="text-white/40 text-[10px] uppercase tracking-wider">Stats Overview</h4>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Strength</span>
                    <div className="flex items-center gap-2">
                        <Progress value={85} className="w-24 h-2" />
                        <span className="text-white font-bold text-xs">85</span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Magic</span>
                    <div className="flex items-center gap-2">
                        <Progress value={62} className="w-24 h-2" />
                        <span className="text-white font-bold text-xs">62</span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">Defense</span>
                    <div className="flex items-center gap-2">
                        <Progress value={90} className="w-24 h-2" />
                        <span className="text-white font-bold text-xs">90</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-3">
        <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Technical Details</h4>
        <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
                <span className="text-white/50 text-xs block">Card ID</span>
                <span className="text-white/80 font-mono text-xs">card-b93b3ba6</span>
            </div>
            <div className="space-y-1">
                <span className="text-white/50 text-xs block">Type</span>
                <span className="text-white/80 text-xs">Trading Card</span>
            </div>
            <div className="space-y-1">
                <span className="text-white/50 text-xs block">Mint Date</span>
                <span className="text-white/80 text-xs">Jan 12, 2026</span>
            </div>
        </div>
      </div>
    </div>
  </div>
);

// Blacksmith UI (Screenshot 3)
const BlacksmithView = ({ card }) => {
  const [activeTab, setActiveTab] = useState('levelup');

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
               <Hammer className="w-6 h-6 text-orange-400" />
            </div>
            <div>
               <h3 className="text-white font-bold text-2xl">Blacksmith Forge</h3>
               <p className="text-white/50 text-sm">Enhance your equipment and craft new power.</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <Badge variant="outline" className="h-8 px-3 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-2 text-sm">
               <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" /> 25,000 Gold
            </Badge>
            <Badge variant="outline" className="h-8 px-3 bg-white/5 text-white/70 border-white/10 text-sm">
               45 Shards
            </Badge>
         </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
          {/* Sidebar Menu */}
          <div className="w-48 flex flex-col gap-2">
             {['Level Up', 'Enhance', 'Combine', 'Ascend', 'Trade'].map((tab) => {
                const isActive = activeTab === tab.toLowerCase().replace(' ', '');
                return (
                    <button
                       key={tab}
                       onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))}
                       className={`w-full text-left py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
                          isActive
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 border-orange-400'
                          : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10 hover:text-white'
                       }`}
                    >
                       {tab}
                    </button>
                );
             })}
          </div>

          {/* Main Work Area */}
          <div className="flex-1 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 p-6 overflow-y-auto custom-scrollbar relative">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
             
             <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-end mb-6">
                   <div>
                       <h4 className="text-white font-bold text-xl">Level Up Card</h4>
                       <p className="text-white/50 text-sm">Increase base stats by feeding materials.</p>
                   </div>
                   <div className="text-right">
                       <span className="text-white/40 text-xs block">Current Level</span>
                       <span className="text-white font-bold text-xl">1 <span className="text-white/40 text-sm">/ 10</span></span>
                   </div>
                </div>
                
                <div className="space-y-2 mb-8">
                   <div className="flex justify-between text-xs text-white/70">
                      <span>Progress to Level 2</span>
                      <span>150 / 1000 XP</span>
                   </div>
                   <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full w-[15%] bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                   <div className="bg-black/40 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                      <div className="relative z-10">
                          <span className="text-white/40 text-xs uppercase font-bold tracking-wider">Attack</span>
                          <div className="text-white font-black text-3xl mt-1">115</div>
                          <div className="text-green-400 text-sm font-bold flex items-center mt-1">
                              <ArrowUp className="w-3 h-3 mr-1" /> +15
                          </div>
                      </div>
                      <div className="absolute right-0 bottom-0 opacity-10">
                          <TrendingUp className="w-16 h-16 text-white" />
                      </div>
                   </div>
                   <div className="bg-black/40 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                      <div className="relative z-10">
                          <span className="text-white/40 text-xs uppercase font-bold tracking-wider">Defense</span>
                          <div className="text-white font-black text-3xl mt-1">92</div>
                          <div className="text-green-400 text-sm font-bold flex items-center mt-1">
                              <ArrowUp className="w-3 h-3 mr-1" /> +12
                          </div>
                      </div>
                      <div className="absolute right-0 bottom-0 opacity-10">
                          <Shield className="w-16 h-16 text-white" />
                      </div>
                   </div>
                   <div className="bg-black/40 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                      <div className="relative z-10">
                          <span className="text-white/40 text-xs uppercase font-bold tracking-wider">Magic</span>
                          <div className="text-white font-black text-3xl mt-1">100</div>
                          <div className="text-green-400 text-sm font-bold flex items-center mt-1">
                              <ArrowUp className="w-3 h-3 mr-1" /> +10
                          </div>
                      </div>
                      <div className="absolute right-0 bottom-0 opacity-10">
                          <Zap className="w-16 h-16 text-white" />
                      </div>
                   </div>
                </div>

                <div className="mt-auto">
                    <h4 className="text-white/60 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                        <Box className="w-4 h-4" /> Required Materials
                    </h4>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[
                           { name: 'Precision Shard', count: 45, req: 10, icon: '🎯', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
                           { name: 'Combat Core', count: 28, req: 5, icon: '⚔️', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                           { name: 'Ascension Core', count: 8, req: 1, icon: '👑', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
                        ].map((mat) => (
                           <div key={mat.name} className={`flex flex-col p-3 rounded-xl border ${mat.border} ${mat.bg}`}>
                              <div className="flex items-center justify-between mb-2">
                                  <span className="text-2xl">{mat.icon}</span>
                                  <span className={`text-xs font-mono ${mat.count >= mat.req ? 'text-green-400' : 'text-red-400'}`}>{mat.count}/{mat.req}</span>
                              </div>
                              <span className={`text-xs font-medium ${mat.color}`}>{mat.name}</span>
                           </div>
                        ))}
                    </div>

                    <Button className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold rounded-xl shadow-[0_4px_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-3 transition-all hover:scale-[1.02]">
                       <Hammer className="w-5 h-5" /> 
                       <span>Level Up</span>
                       <span className="text-white/60 text-sm font-normal ml-2">100 G</span>
                    </Button>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};

// Skill Tree UI (Screenshot 4)
const SkillTreeView = ({ card }) => (
  <div className="h-full flex flex-col p-6">
    <div className="flex items-center justify-between mb-6">
       <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
             <Layers className="w-6 h-6 text-purple-400" />
          </div>
          <div>
             <h3 className="text-white font-bold text-2xl">Ability Matrix</h3>
             <p className="text-white/50 text-sm">Unlock new abilities and passive bonuses.</p>
          </div>
       </div>
       <div className="flex items-center gap-3">
            <Badge variant="outline" className="h-8 px-4 bg-purple-500/10 text-purple-400 border-purple-500/20 gap-2 text-sm">
                <Zap className="w-3 h-3" /> 2,450 SP Available
            </Badge>
       </div>
    </div>

    <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
       {/* Power Path */}
       <div className="flex flex-col gap-4 relative h-full">
          <div className="text-center p-3 rounded-t-xl bg-purple-500/10 border-t border-x border-purple-500/20">
             <h4 className="text-purple-400 font-bold text-sm uppercase tracking-wider">Power Path</h4>
             <p className="text-white/30 text-[10px]">Raw strength & combat</p>
          </div>
          
          <div className="flex-1 rounded-b-xl rounded-t-sm bg-gradient-to-b from-purple-900/10 to-transparent border border-purple-500/20 p-6 relative overflow-hidden flex flex-col items-center gap-12">
             <div className="absolute top-0 bottom-0 w-px bg-purple-500/10 z-0" />
             
             {/* Root Node */}
             <div className="w-16 h-16 rounded-2xl bg-purple-600 shadow-[0_0_25px_rgba(168,85,247,0.6)] z-10 flex items-center justify-center border-2 border-white/20 relative group cursor-pointer hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded text-[10px] text-white">
                    Thunder Strike (Active)
                </div>
             </div>

             {/* Branches */}
             <div className="grid grid-cols-2 gap-x-12 gap-y-12 w-full z-10 px-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                   <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer relative">
                      <div className="w-12 h-12 rounded-xl bg-black/60 border border-purple-500/30 flex items-center justify-center group-hover:border-purple-500 group-hover:bg-purple-500/20 transition-all shadow-lg hover:shadow-purple-500/20">
                         <div className="w-5 h-5 rounded-full bg-purple-500/20" />
                      </div>
                      <Badge className="bg-black/50 text-purple-300 border-purple-500/20 text-[9px] font-mono">100 SP</Badge>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* Neutral Path */}
       <div className="flex flex-col gap-4 relative h-full">
          <div className="text-center p-3 rounded-t-xl bg-yellow-500/10 border-t border-x border-yellow-500/20">
             <h4 className="text-yellow-400 font-bold text-sm uppercase tracking-wider">Neutral Path</h4>
             <p className="text-white/30 text-[10px]">Defense & Utility</p>
          </div>
          
          <div className="flex-1 rounded-b-xl rounded-t-sm bg-gradient-to-b from-yellow-900/10 to-transparent border border-yellow-500/20 p-6 relative overflow-hidden flex flex-col items-center gap-12">
             <div className="absolute top-0 bottom-0 w-px bg-yellow-500/10 z-0" />
             
             <div className="w-16 h-16 rounded-2xl bg-black/60 border-2 border-yellow-500/50 z-10 flex items-center justify-center relative group cursor-pointer hover:border-yellow-500 transition-colors">
                <Shield className="w-8 h-8 text-yellow-500" />
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded text-[10px] text-white">
                    Iron Skin (Passive)
                </div>
             </div>

             <div className="grid grid-cols-2 gap-x-12 gap-y-12 w-full z-10 px-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                   <div key={i} className="flex flex-col items-center gap-2 opacity-40">
                      <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center">
                         <div className="w-5 h-5 rounded-full bg-white/10" />
                      </div>
                      <Badge className="bg-black/50 text-white/30 border-white/10 text-[9px] font-mono">LOCKED</Badge>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* AI Path */}
       <div className="flex flex-col gap-4 relative h-full">
          <div className="text-center p-3 rounded-t-xl bg-cyan-500/10 border-t border-x border-cyan-500/20">
             <h4 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">AI Path</h4>
             <p className="text-white/30 text-[10px]">Adaptation & Tactics</p>
          </div>
          
          <div className="flex-1 rounded-b-xl rounded-t-sm bg-gradient-to-b from-cyan-900/10 to-transparent border border-cyan-500/20 p-6 relative overflow-hidden flex flex-col items-center gap-12">
             <div className="absolute top-0 bottom-0 w-px bg-cyan-500/10 z-0" />
             
             <div className="w-16 h-16 rounded-2xl bg-black/60 border-2 border-cyan-500/50 z-10 flex items-center justify-center relative group cursor-pointer hover:border-cyan-500 transition-colors">
                <Activity className="w-8 h-8 text-cyan-500" />
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded text-[10px] text-white">
                    Neural Link (Passive)
                </div>
             </div>

             <div className="grid grid-cols-2 gap-x-12 gap-y-12 w-full z-10 px-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                   <div key={i} className="flex flex-col items-center gap-2 opacity-40">
                      <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center">
                         <div className="w-5 h-5 rounded-full bg-white/10" />
                      </div>
                      <Badge className="bg-black/50 text-white/30 border-white/10 text-[9px] font-mono">LOCKED</Badge>
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
    <div className="h-full flex flex-col gap-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between shrink-0 bg-black/20 p-2 rounded-xl border border-white/5">
         <div className="flex items-center gap-4 pl-2">
             <Button variant="ghost" size="sm" onClick={onBack} className="text-white/50 hover:text-white hover:bg-white/10 h-8 w-8 p-0 rounded-full">
                <ArrowLeft className="w-4 h-4" />
             </Button>
             
             <div className="h-6 w-px bg-white/10" />

             {/* Total Power Stat */}
             <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Total Power</span>
                <div className="text-2xl font-black text-white tracking-tight flex items-center">
                   <Zap className="w-5 h-5 text-yellow-400 mr-1 fill-yellow-400" />
                   {MOCK_CARD_STATS.power}
                </div>
                <Badge className="bg-blue-600 text-white border border-blue-400 shadow-sm text-[10px] h-5 ml-2">
                   Rare
                </Badge>
             </div>
         </div>

         {/* Navigation Tabs */}
         <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
            <button
               onClick={() => setViewMode('overview')}
               className={`py-1.5 px-4 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  viewMode === 'overview' 
                  ? 'bg-slate-700 text-white shadow-md' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
               }`}
            >
               <Info className="w-3.5 h-3.5" /> Record
            </button>
            <button
               onClick={() => setViewMode('blacksmith')}
               className={`py-1.5 px-4 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  viewMode === 'blacksmith' 
                  ? 'bg-orange-600 text-white shadow-md' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
               }`}
            >
               <Hammer className="w-3.5 h-3.5" /> Forge
            </button>
            <button
               onClick={() => setViewMode('skilltree')}
               className={`py-1.5 px-4 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  viewMode === 'skilltree' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
               }`}
            >
               <Layers className="w-3.5 h-3.5" /> Skills
            </button>
         </div>
      </div>

      {/* Main Content Area (Full Width/Height) */}
      <div className="flex-1 min-h-0 bg-slate-900/40 rounded-2xl border border-white/10 relative overflow-hidden shadow-inner">
          <AnimatePresence mode="wait">
            {viewMode === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full"
              >
                <CardRecordView card={card} />
              </motion.div>
            )}

            {viewMode === 'blacksmith' && (
              <motion.div 
                key="blacksmith"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full"
              >
                <BlacksmithView card={card} />
              </motion.div>
            )}

            {viewMode === 'skilltree' && (
              <motion.div 
                key="skilltree"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full"
              >
                <SkillTreeView card={card} />
              </motion.div>
            )}
          </AnimatePresence>
      </div>
    </div>
  );
}