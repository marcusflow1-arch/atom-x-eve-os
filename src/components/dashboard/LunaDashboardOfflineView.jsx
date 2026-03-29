import React from 'react';
import { motion } from 'framer-motion';
import { Users, Gamepad2, Brain, Trophy, Star, Newspaper } from 'lucide-react';

export default function LunaDashboardOfflineView() {
  const boxStyle = {
    background: 'linear-gradient(135deg, rgba(15, 20, 30, 0.7) 0%, rgba(8, 12, 18, 0.85) 100%)',
    backdropFilter: 'blur(30px) saturate(150%)',
    WebkitBackdropFilter: 'blur(30px) saturate(150%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 15px 35px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="absolute z-10 flex items-center justify-center pointer-events-auto"
      style={{
        left: '460px',
        right: '360px',
        top: '200px',
        bottom: '160px'
      }}
    >
      <div className="w-full h-full max-w-[650px] max-h-[380px] grid grid-cols-3 grid-rows-2 gap-3">
        {/* Box 1: Friends News */}
        <div 
          className="col-span-1 row-span-2 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden relative group hover:border-white/20 transition-colors"
          style={boxStyle}
        >
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <h3 className="text-white font-bold tracking-wider uppercase text-[10px]">Friends Network</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {[
              { name: "Shadow_Striker", action: "Unlocked Legendary Sword", time: "10m ago", color: "text-orange-400" },
              { name: "CyberVixen", action: "Started streaming", time: "1h ago", color: "text-purple-400" },
              { name: "NovaStar", action: "Reached Level 50", time: "2h ago", color: "text-green-400" },
              { name: "IronFist", action: "Defeated the Abyss Boss", time: "5h ago", color: "text-red-400" }
            ].map((news, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white/90">{news.name}</p>
                  <p className={`text-[10px] ${news.color}`}>{news.action}</p>
                  <p className="text-[8px] text-white/40 mt-0.5">{news.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box 2: Latest Games */}
        <div 
          className="col-span-1 row-span-1 rounded-2xl p-4 relative overflow-hidden group hover:border-white/20 transition-colors flex flex-col"
          style={boxStyle}
        >
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-white font-bold tracking-wider uppercase text-xs">Store Highlights</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="aspect-video bg-black/40 rounded-lg relative overflow-hidden border border-white/10">
              <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400" className="absolute inset-0 object-cover w-full h-full opacity-60" />
              <span className="absolute bottom-1 left-1.5 text-[10px] font-bold text-white z-10 drop-shadow-md">Neon Drift</span>
            </div>
            <div className="aspect-video bg-black/40 rounded-lg relative overflow-hidden border border-white/10">
              <img src="https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400" className="absolute inset-0 object-cover w-full h-full opacity-60" />
              <span className="absolute bottom-1 left-1.5 text-[10px] font-bold text-white z-10 drop-shadow-md">Star Nexus</span>
            </div>
          </div>
        </div>

        {/* Box 3: AI Interaction */}
        <div 
          className="col-span-1 row-span-1 rounded-2xl p-4 flex flex-col hover:border-emerald-500/40 transition-colors"
          style={{
            ...boxStyle,
            background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.6) 0%, rgba(2, 44, 34, 0.8) 100%)',
            borderColor: 'rgba(16, 185, 129, 0.2)'
          }}
        >
          <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2 mb-3">
            <Brain className="w-4 h-4 text-emerald-400" />
            <h3 className="text-emerald-100 font-bold tracking-wider uppercase text-xs">AI Companion</h3>
          </div>
          <p className="text-emerald-200/70 text-xs mb-3 leading-relaxed flex-1 overflow-y-auto custom-scrollbar">
            Interact with your AI to align their personality with yours. Train them to become your perfect digital reflection.
          </p>
          <button className="mt-auto w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-bold rounded-lg border border-emerald-500/30 transition-all text-xs shadow-lg">
            Start Interaction
          </button>
        </div>

        {/* Box 4: Latest Achievement Cards */}
        <div 
          className="col-span-1 row-span-1 rounded-2xl p-4 hover:border-yellow-500/40 transition-colors flex flex-col"
          style={{
            ...boxStyle,
            background: 'linear-gradient(135deg, rgba(113, 63, 18, 0.6) 0%, rgba(66, 32, 6, 0.8) 100%)',
            borderColor: 'rgba(234, 179, 8, 0.2)'
          }}
        >
          <div className="flex items-center gap-2 border-b border-yellow-500/20 pb-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h3 className="text-white font-bold tracking-wider uppercase text-xs">New Achievements</h3>
          </div>
          <div className="flex justify-around items-center flex-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-12 h-16 rounded-lg bg-gradient-to-b from-yellow-500/30 to-orange-500/10 border border-yellow-500/40 flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
                <Star className="w-5 h-5 text-yellow-500/60 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
              </div>
            ))}
          </div>
        </div>

        {/* Box 5: AI News */}
        <div 
          className="col-span-1 row-span-1 rounded-2xl p-4 hover:border-pink-500/40 transition-colors flex flex-col"
          style={{
            ...boxStyle,
            background: 'linear-gradient(135deg, rgba(131, 24, 67, 0.6) 0%, rgba(76, 5, 25, 0.8) 100%)',
            borderColor: 'rgba(236, 72, 153, 0.2)'
          }}
        >
          <div className="flex items-center gap-2 border-b border-pink-500/20 pb-2 mb-3">
            <Newspaper className="w-4 h-4 text-pink-400" />
            <h3 className="text-white font-bold tracking-wider uppercase text-xs">System Intel</h3>
          </div>
          <ul className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
              <p className="text-xs text-pink-100/80 leading-snug">Major Engine update rolling out next week.</p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
              <p className="text-xs text-pink-100/80 leading-snug">New customizable avatars entering the marketplace.</p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
              <p className="text-xs text-pink-100/80 leading-snug">Clan matchmaking features improved by 40%.</p>
            </li>
          </ul>
        </div>

      </div>
    </motion.div>
  );
}