import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Layers, Sparkles, TrendingUp, Zap, Shield, Crown, Star, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ShinyCard from '@/components/shared/ShinyCard';

// Simplified mock data for the detailed view
const MOCK_CARD_STATS = {
  attack: 150,
  defense: 120,
  magic: 95,
  speed: 110,
  power: 475
};

// Mini version of Blacksmith UI
const MiniBlacksmith = ({ card }) => {
  return (
    <div className="space-y-4 h-full overflow-y-auto pr-2 custom-scrollbar">
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <h4 className="text-orange-400 font-bold flex items-center gap-2 mb-3">
          <Hammer className="w-4 h-4" /> Forge Upgrade
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">Level</span>
            <span className="text-white font-mono">15 <span className="text-green-400">→ 16</span></span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-[75%] bg-gradient-to-r from-orange-500 to-amber-500" />
          </div>
          <Button size="sm" className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border-orange-500/50">
            Upgrade (500 G)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {['Attack', 'Defense', 'Magic', 'Speed'].map(stat => (
          <div key={stat} className="p-3 rounded-lg bg-black/30 border border-white/5">
            <p className="text-xs text-white/40 uppercase mb-1">{stat}</p>
            <p className="text-lg font-bold text-white">{MOCK_CARD_STATS[stat.toLowerCase()]}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mini version of Skill Tree UI
const MiniSkillTree = ({ card }) => {
  return (
    <div className="space-y-4 h-full overflow-y-auto pr-2 custom-scrollbar">
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <h4 className="text-purple-400 font-bold flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4" /> Skill Progression
        </h4>
        <div className="flex gap-2 mb-4">
          {['Power', 'Neutral', 'AI'].map(path => (
            <div key={path} className="flex-1 p-2 rounded bg-white/5 text-center border border-white/5">
              <div className="text-[10px] text-white/40 uppercase">{path}</div>
              <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                path === 'Power' ? 'bg-purple-500' : path === 'Neutral' ? 'bg-yellow-500' : 'bg-cyan-500'
              }`} />
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-2 rounded bg-black/20 border border-white/5">
              <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white/40" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white font-medium">Ability Node {i}</p>
                <p className="text-[10px] text-white/40">Locked • Requires Lv. {i * 10}</p>
              </div>
              <Button size="icon" className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10">
                <ArrowUp className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function MysteryCardDetail({ card, onBack }) {
  const [viewMode, setViewMode] = useState('overview'); // overview, blacksmith, skilltree

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar with Toggles */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-white/50 hover:text-white -ml-2">
          ← Back
        </Button>
        <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('blacksmith')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
              viewMode === 'blacksmith' ? 'bg-orange-500/20 text-orange-300' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Hammer className="w-3 h-3" /> Forge
          </button>
          <div className="w-px bg-white/10 my-1" />
          <button
            onClick={() => setViewMode('skilltree')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
              viewMode === 'skilltree' ? 'bg-purple-500/20 text-purple-300' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Layers className="w-3 h-3" /> Skills
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Side: The Card */}
        <div className="w-1/2 flex flex-col items-center justify-center">
          <ShinyCard className="w-full aspect-[2/3] border border-white/10 bg-slate-900 shadow-2xl">
            {/* If we had a real image, we'd show it. For mystery, maybe we reveal it? 
                User said "It will bring up the car's UI... You see the card on the left hand side" 
                I'll assume it's a specific "Mystery Card" revealed or just the blank one if it's still blank. 
                But usually clicking reveals info. I'll show a placeholder revealed design. */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 p-4 flex flex-col">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="bg-black/40 border-white/10">Evolved</Badge>
                <div className="flex gap-0.5">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <Crown className="w-16 h-16 text-white/20" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-bold text-lg leading-tight">Ancient Artifact</h3>
                <p className="text-white/50 text-xs">Legendary Item</p>
              </div>
            </div>
          </ShinyCard>
        </div>

        {/* Right Side: Dynamic UI */}
        <div className="w-1/2 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {viewMode === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-xl font-bold text-white">General Info</h3>
                  <p className="text-white/50 text-xs">ID: #8392-AX-99</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between p-3 rounded bg-white/5">
                    <span className="text-white/60 text-sm">Power Rating</span>
                    <span className="text-white font-bold">4,250</span>
                  </div>
                  <div className="flex justify-between p-3 rounded bg-white/5">
                    <span className="text-white/60 text-sm">Rarity</span>
                    <span className="text-orange-400 font-bold">Legendary</span>
                  </div>
                  <div className="flex justify-between p-3 rounded bg-white/5">
                    <span className="text-white/60 text-sm">Owner</span>
                    <span className="text-white font-bold">PlayerOne</span>
                  </div>
                </div>

                <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20">
                  <p className="text-blue-300 text-xs leading-relaxed">
                    This ancient artifact hums with unknown energy. Unlock its potential through the Forge.
                  </p>
                </div>
              </motion.div>
            )}

            {viewMode === 'blacksmith' && (
              <motion.div 
                key="blacksmith"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="h-full"
              >
                <MiniBlacksmith card={card} />
              </motion.div>
            )}

            {viewMode === 'skilltree' && (
              <motion.div 
                key="skilltree"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="h-full"
              >
                <MiniSkillTree card={card} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}