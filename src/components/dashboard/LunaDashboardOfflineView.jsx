import React from 'react';
import { motion } from 'framer-motion';
import { Users, Gamepad2, Brain, Trophy, Star, Newspaper } from 'lucide-react';

export default function LunaDashboardOfflineView() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-10 flex items-center justify-center pointer-events-auto pt-[210px] pl-[390px] pr-[390px] pb-[120px]"
    >
      {/* AAA liquid glass background just around the UI */}
      <div 
        className="w-full h-full max-w-5xl max-h-[600px] rounded-3xl p-6 grid grid-cols-3 grid-rows-2 gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 25, 35, 0.4) 0%, rgba(10, 15, 25, 0.6) 100%)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)'
        }}
      >
        {/* Box 1: Friends News */}
        <div className="col-span-1 row-span-2 rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3 overflow-hidden relative group hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h3 className="text-white font-bold tracking-wider uppercase text-xs">Friends Network</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {[
              { name: "Shadow_Striker", action: "Unlocked Legendary Sword", time: "10m ago", color: "text-orange-400" },
              { name: "CyberVixen", action: "Started streaming", time: "1h ago", color: "text-purple-400" },
              { name: "NovaStar", action: "Reached Level 50", time: "2h ago", color: "text-green-400" },
              { name: "IronFist", action: "Defeated the Abyss Boss", time: "5h ago", color: "text-red-400" }
            ].map((news, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white/90">{news.name}</p>
                  <p className={`text-xs ${news.color}`}>{news.action}</p>
                  <p className="text-[10px] text-white/40 mt-1">{news.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box 2: Latest Games */}
        <div className="col-span-1 row-span-1 rounded-2xl bg-white/5 border border-white/10 p-4 relative overflow-hidden group hover:bg-white/10 transition-colors flex flex-col">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-white font-bold tracking-wider uppercase text-xs">Store Highlights</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-video bg-black/40 rounded-lg relative overflow-hidden border border-white/10">
              <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400" className="absolute inset-0 object-cover w-full h-full opacity-60" />
              <span className="absolute bottom-2 left-2 text-xs font-bold text-white z-10 drop-shadow-md">Neon Drift</span>
            </div>
            <div className="aspect-video bg-black/40 rounded-lg relative overflow-hidden border border-white/10">
              <img src="https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400" className="absolute inset-0 object-cover w-full h-full opacity-60" />
              <span className="absolute bottom-2 left-2 text-xs font-bold text-white z-10 drop-shadow-md">Star Nexus</span>
            </div>
          </div>
        </div>

        {/* Box 3: AI Interaction */}
        <div className="col-span-1 row-span-1 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-teal-900/10 border border-emerald-500/20 p-4 flex flex-col hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2 mb-3">
            <Brain className="w-4 h-4 text-emerald-400" />
            <h3 className="text-emerald-100 font-bold tracking-wider uppercase text-xs">AI Companion</h3>
          </div>
          <p className="text-emerald-200/70 text-xs mb-3 leading-relaxed flex-1 overflow-y-auto custom-scrollbar">
            Interact with your AI to align their personality with yours. Train them to become your perfect digital reflection.
          </p>
          <button className="mt-auto w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-bold rounded-lg border border-emerald-500/30 transition-all text-xs">
            Start Interaction
          </button>
        </div>

        {/* Box 4: Latest Achievement Cards */}
        <div className="col-span-1 row-span-1 rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors flex flex-col">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h3 className="text-white font-bold tracking-wider uppercase text-xs">New Achievements</h3>
          </div>
          <div className="flex justify-around items-center flex-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-14 h-20 rounded bg-gradient-to-b from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
                <Star className="w-5 h-5 text-yellow-500/50" />
              </div>
            ))}
          </div>
        </div>

        {/* Box 5: AI News */}
        <div className="col-span-1 row-span-1 rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors flex flex-col">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
            <Newspaper className="w-4 h-4 text-pink-400" />
            <h3 className="text-white font-bold tracking-wider uppercase text-xs">System Intel</h3>
          </div>
          <ul className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
              <p className="text-sm text-white/80">Major Engine update rolling out next week.</p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
              <p className="text-sm text-white/80">New customizable avatars entering the marketplace.</p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
              <p className="text-sm text-white/80">Clan matchmaking features improved by 40%.</p>
            </li>
          </ul>
        </div>

      </div>
    </motion.div>
  );
}