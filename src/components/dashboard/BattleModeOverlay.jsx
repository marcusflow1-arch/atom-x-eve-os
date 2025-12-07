import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Swords, Shield, Trophy, Users, Target, Zap, 
  Crosshair, Skull, Crown, Flame, ArrowRight, Play 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BattleModeOverlay({ onClose }) {
  const [activeTab, setActiveTab] = useState('arena');

  const battles = [
    {
      id: 1,
      title: "Neon City Skirmish",
      type: "Team Deathmatch",
      players: "12/16",
      ping: "24ms",
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
      status: "Live",
      rewards: ["1200 XP", "Rare Crate"]
    },
    {
      id: 2,
      title: "Crystal Core Defense",
      type: "Objective",
      players: "6/10",
      ping: "32ms",
      image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
      status: "Queueing",
      rewards: ["800 XP", "Credits"]
    },
    {
      id: 3,
      title: "Void Walker Trials",
      type: "Solo Ranked",
      players: "1/1",
      ping: "18ms",
      image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&q=80",
      status: "Ready",
      rewards: ["Rank Points", "Exclusive Skin"]
    }
  ];

  return (
    <div className="h-full w-full bg-black/90 text-white p-8 md:p-12 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
                LIVE COMBAT ZONES
              </Badge>
              <Badge variant="outline" className="bg-white/5 text-slate-400 border-white/10 px-3 py-1">
                SEASON 1 RANKED
              </Badge>
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white">
              Battle Mode
              <span className="text-red-500">.</span>
            </h1>
          </div>
          
          <div className="flex gap-4">
             <div className="text-right">
                <div className="text-sm text-slate-400 font-bold uppercase tracking-wider">Global Rank</div>
                <div className="text-3xl font-black text-white">#1,249</div>
             </div>
             <div className="w-px h-12 bg-white/10" />
             <div className="text-right">
                <div className="text-sm text-slate-400 font-bold uppercase tracking-wider">K/D Ratio</div>
                <div className="text-3xl font-black text-white">2.45</div>
             </div>
          </div>
        </div>

        {/* Featured Event Hero */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 mb-12 group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="grid md:grid-cols-2">
            <div className="p-12 flex flex-col justify-center relative z-10">
              <Badge className="w-fit mb-6 bg-red-500 text-white hover:bg-red-600">FEATURED EVENT</Badge>
              <h2 className="text-4xl font-black text-white mb-4 uppercase italic">Titan's Fall Tournament</h2>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                Join the weekly championship. Squad up and dominate the arena for exclusive mythical rewards and season points.
              </p>
              <div className="flex items-center gap-4">
                <Button className="h-14 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl skew-x-[-10deg]">
                  <span className="skew-x-[10deg] flex items-center gap-2">
                    <Swords className="w-5 h-5" /> ENTER ARENA
                  </span>
                </Button>
                <div className="flex -space-x-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-slate-700" />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-black bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                    +2k
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-[400px] md:h-auto">
               <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/20 to-black/80 z-10" />
               <img 
                 src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80" 
                 alt="Battle" 
                 className="w-full h-full object-cover"
               />
            </div>
          </div>
        </div>

        {/* Match List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {battles.map((battle) => (
            <motion.div 
              key={battle.id}
              whileHover={{ y: -5 }}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-red-500/50 transition-all group"
            >
              <div className="relative h-48">
                <img src={battle.image} alt={battle.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-white">{battle.type}</Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                   <div>
                     <h3 className="text-xl font-bold text-white mb-1">{battle.title}</h3>
                     <div className="flex items-center gap-2 text-xs text-slate-300">
                       <Users className="w-3 h-3" /> {battle.players}
                       <span className="w-1 h-1 rounded-full bg-slate-500" />
                       <Zap className="w-3 h-3 text-yellow-400" /> {battle.ping}
                     </div>
                   </div>
                </div>
              </div>
              <div className="p-4 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    {battle.rewards.map((reward, i) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/5">
                        {reward}
                      </span>
                    ))}
                  </div>
                </div>
                <Button className="w-full bg-white text-black hover:bg-slate-200 font-bold">
                  JOIN MATCH
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}