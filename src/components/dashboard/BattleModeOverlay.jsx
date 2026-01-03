import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Target, Flame, Zap, Shield, X } from 'lucide-react';

export default function BattleModeOverlay({ onClose }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black"
    >
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(circle at center, #ef4444 0%, #7f1d1d 40%, #450a0a 80%, #000000 100%)'
        }}
      />

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative z-10 flex flex-col items-center text-center max-w-6xl w-full px-6 py-12">
        
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-orange-600 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(234,88,12,0.4)]">
          <Swords className="w-10 h-10 text-white" />
        </div>

        {/* Titles */}
        <h1 className="text-6xl font-black text-white mb-4 tracking-tight">BATTLE MODE</h1>
        <h2 className="text-xl font-bold text-orange-500/50 tracking-[0.5em] uppercase mb-8">ENTER COMBAT ARENA</h2>

        {/* Description */}
        <p className="text-slate-300 text-lg max-w-2xl mb-16 leading-relaxed">
          Choose your battleground and prove your skills against worthy opponents. Glory awaits
          those brave enough to enter the arena.
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-16">
          {[
            { value: '68%', label: 'WIN RATE', icon: Target },
            { value: '1,240', label: 'TOTAL BATTLES', icon: Swords },
            { value: '8', label: 'CURRENT STREAK', icon: Flame },
            { value: 'Diamond', label: 'RANK', icon: Zap }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-6 flex flex-col items-start text-left">
              <stat.icon className="w-6 h-6 text-orange-500 mb-4" />
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs font-bold text-white/40 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[
            { 
              title: 'PVP ARENA', 
              desc: 'Battle against other players in real time',
              icon: Swords,
              color: 'bg-orange-500'
            },
            { 
              title: 'PVE RAIDS', 
              desc: 'Team up to defeat powerful bosses',
              icon: Shield,
              color: 'bg-blue-500'
            },
            { 
              title: 'TOURNAMENTS', 
              desc: 'Compete in ranked tournaments for glory',
              icon: Target,
              color: 'bg-yellow-500'
            }
          ].map((mode, i) => (
            <motion.button
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white/5 border border-white/5 rounded-2xl p-8 flex flex-col items-start text-left h-64 relative overflow-hidden group"
            >
              <div className={`w-14 h-14 rounded-xl ${mode.color} flex items-center justify-center mb-auto shadow-lg`}>
                <mode.icon className="w-7 h-7 text-white" />
              </div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-white mb-2">{mode.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-[80%]">
                  {mode.desc}
                </p>
              </div>

              {/* Hover Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          ))}
        </div>

      </div>
    </motion.div>
  );
}