import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Lock, Star } from 'lucide-react';

export default function LiquidSeasonalBar() {
  const progress = 65; // Mock progress

  return (
    <div className="w-full pt-4">
      {/* Label */}
      <div className="flex justify-between items-end mb-2 px-4">
        <div>
            <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest">Season Pass</h4>
            <p className="text-[10px] text-cyan-300/60 font-mono">NEON NIGHTS • LVL 24</p>
        </div>
        <div className="text-xs font-bold text-white/40">
            {progress}% COMPLETE
        </div>
      </div>

      {/* The Tube (#11) */}
      <div className="relative h-12 w-full mx-auto">
        {/* Glass Casing */}
        <div 
            className="absolute inset-0 rounded-full border border-white/20 z-20 pointer-events-none"
            style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.1) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 10px 20px rgba(0,0,0,0.3)'
            }}
        />

        {/* Liquid Fill */}
        <div className="absolute inset-1 rounded-full overflow-hidden bg-black/40 z-10">
            <motion.div 
                className="h-full rounded-r-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{
                    background: 'linear-gradient(90deg, #06b6d4, #22d3ee, #06b6d4)', // Glowing Cyan Liquid
                    boxShadow: '0 0 20px rgba(6,182,212,0.6)'
                }}
            >
                {/* Bubbles / Texture */}
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
                
                {/* Leading Edge Highlight */}
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]" />
            </motion.div>
        </div>

        {/* Floating Rewards (Above Tube) */}
        <div className="absolute -top-3 left-0 w-full h-full z-30 pointer-events-none px-1">
            <div className="relative w-full h-full flex items-center">
                {/* Mock Rewards at specific percentages */}
                {[20, 50, 80, 100].map((pos) => (
                    <div 
                        key={pos} 
                        className="absolute w-8 h-8 -mt-6 -ml-4 flex items-center justify-center pointer-events-auto cursor-pointer group"
                        style={{ left: `${pos}%` }}
                    >
                        <div className={`w-full h-full rounded-full flex items-center justify-center border border-white/20 backdrop-blur-md shadow-lg transition-all duration-300 group-hover:scale-110 ${progress >= pos ? 'bg-cyan-500 text-white' : 'bg-black/60 text-white/30'}`}>
                            {pos === 100 ? <Star size={14} fill="currentColor" /> : <Gift size={14} />}
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap">
                            Reward Lvl {pos}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}