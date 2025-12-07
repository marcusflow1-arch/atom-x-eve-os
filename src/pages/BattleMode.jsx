import React from 'react';
import { motion } from 'framer-motion';
import { Swords, X, Flame, Shield, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function BattleMode({ onClose }) {
  const navigate = useNavigate();

  const battleModes = [
    { 
      id: 'pvp', 
      name: 'PvP Arena', 
      icon: Swords, 
      color: 'from-red-500 to-orange-500',
      desc: 'Battle against other players in real-time combat'
    },
    { 
      id: 'pve', 
      name: 'PvE Raids', 
      icon: Shield, 
      color: 'from-blue-500 to-cyan-500',
      desc: 'Team up to defeat powerful bosses and enemies'
    },
    { 
      id: 'tournament', 
      name: 'Tournaments', 
      icon: Target, 
      color: 'from-yellow-500 to-amber-500',
      desc: 'Compete in ranked tournaments for rewards'
    }
  ];

  return (
    <div className="h-full w-full bg-black text-white font-sans overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-black to-orange-900" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 blur-[150px]"
        />
      </div>

      {/* Close Button */}
      <button 
        onClick={() => onClose ? onClose() : navigate(-1)}
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 hover:border-white/20"
      >
        <X className="w-5 h-5 text-white/60" />
      </button>

      {/* Content */}
      <div className="relative z-10 h-full overflow-y-auto pb-12">
        <div className="max-w-7xl mx-auto p-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            {/* Icon */}
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-[0_0_100px_rgba(239,68,68,0.6)]">
              <Swords className="w-16 h-16 text-white" />
            </div>

            <h1 className="text-7xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-6 drop-shadow-2xl">
              Battle Mode
              <span className="block text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white/60 to-white/10 tracking-[0.5em] mt-4">
                Enter Combat Arena
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Choose your battleground and prove your skills against worthy opponents. Glory awaits those brave enough to enter the arena.
            </p>
          </motion.div>

          {/* Battle Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {[
              { label: 'Win Rate', value: '68%', icon: Target },
              { label: 'Total Battles', value: '1,240', icon: Swords },
              { label: 'Current Streak', value: '8', icon: Flame },
              { label: 'Rank', value: 'Diamond', icon: Zap }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <stat.icon className="w-8 h-8 text-red-400 mb-4" />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Battle Modes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {battleModes.map((mode, i) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all overflow-hidden"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <mode.icon className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">{mode.name}</h3>
                  <p className="text-slate-400 mb-8 leading-relaxed">{mode.desc}</p>
                  
                  <Button 
                    className="w-full bg-white text-black hover:bg-slate-200 font-bold rounded-lg h-12"
                    onClick={() => navigate('/challenges')}
                  >
                    Enter Arena
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}