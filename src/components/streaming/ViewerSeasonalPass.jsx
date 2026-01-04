import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Lock, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ViewerSeasonalPass() {
  // Mock progress state
  const currentXP = 1250;
  const maxXP = 2000;
  const progressPercent = (currentXP / maxXP) * 100;
  const level = 45;

  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden mt-12"
      style={{
        // Beveled Acrylic Sheet (#4) Implementation
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.4)',
        borderLeft: '1px solid rgba(255,255,255,0.4)',
        borderBottom: '1px solid rgba(0,0,0,0.6)',
        borderRight: '1px solid rgba(0,0,0,0.6)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 30px rgba(255,255,255,0.05)'
      }}
    >
      {/* Refraction/Sheen Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.0) 50%)',
          mixBlendMode: 'overlay'
        }}
      />

      <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
        
        {/* Identity / Season Info */}
        <div className="flex flex-col items-center md:items-start min-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
             <Crown className="text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" size={24} />
             <h3 className="text-xl font-black text-white tracking-wide uppercase">Neon Nights</h3>
          </div>
          <Badge className="bg-cyan-900/40 text-cyan-300 border-cyan-500/30 backdrop-blur-md">
            SEASON 2 PASS
          </Badge>
        </div>

        {/* Progression Track */}
        <div className="flex-1 w-full">
          <div className="flex justify-between items-end mb-3">
             <div className="flex flex-col">
               <span className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Current Level</span>
               <span className="text-3xl font-black text-white drop-shadow-lg">{level}</span>
             </div>
             <div className="flex flex-col items-end">
               <span className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">XP Progress</span>
               <span className="text-lg font-bold text-cyan-200">{currentXP} <span className="text-white/30">/</span> {maxXP}</span>
             </div>
          </div>

          {/* Progress Bar Container - Deep Groove */}
          <div 
            className="h-6 w-full rounded-full relative overflow-hidden"
            style={{
              background: 'rgba(0,0,0,0.6)',
              boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            {/* Neon Cyan Refraction (#5) - Fluid Animation */}
            <motion.div 
              className="absolute top-0 left-0 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                background: 'linear-gradient(90deg, #06b6d4, #22d3ee, #e0f2fe)', // Cyan to bright white-cyan
                boxShadow: '0 0 20px rgba(34,211,238, 0.6), inset 0 0 10px rgba(255,255,255,0.5)'
              }}
            >
               {/* Shimmer Effect */}
               <motion.div 
                 className="absolute inset-0 w-full h-full"
                 animate={{ x: ['-100%', '100%'] }}
                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                 style={{
                   background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                   mixBlendMode: 'overlay'
                 }}
               />
            </motion.div>
          </div>
          
          <p className="text-xs text-white/30 mt-3 text-center md:text-left">
            Participate in chat and watch streams to fill your refraction gauge.
          </p>
        </div>

        {/* Rewards Section */}
        <div className="flex gap-3">
           {/* Unlocked */}
           <div className="w-16 h-16 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center relative group cursor-pointer hover:bg-cyan-500/20 transition-all">
              <Star className="text-cyan-400" size={20} />
              <div className="absolute -bottom-1 w-full text-center">
                 <span className="text-[9px] font-bold text-cyan-200 bg-cyan-900/80 px-1.5 py-0.5 rounded-full">Lvl 44</span>
              </div>
           </div>

           {/* Next Reward */}
           <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/50 flex flex-col items-center justify-center relative group cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Gift className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] animate-pulse" size={28} />
              <div className="absolute -top-2 -right-2">
                 <span className="flex h-4 w-4 relative">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                 </span>
              </div>
              <span className="text-[10px] font-bold text-white mt-1 uppercase tracking-wide">Next</span>
           </div>

           {/* Locked */}
           <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center relative opacity-50">
              <Lock className="text-white/40" size={18} />
              <div className="absolute -bottom-1 w-full text-center">
                 <span className="text-[9px] font-bold text-white/30 bg-black/60 px-1.5 py-0.5 rounded-full">Lvl 46</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}