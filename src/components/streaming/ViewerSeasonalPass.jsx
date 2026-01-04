import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Lock, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ViewerSeasonalPass() {
  // Mock progress state
  const currentXP = 3250;
  const maxXP = 5000;
  const totalNodes = 50;
  // Calculate progress relative to total nodes
  const progressPercent = (currentXP / maxXP) * 100;
  const currentLevel = Math.floor((currentXP / maxXP) * totalNodes);

  return (
    <div 
      className="relative w-full rounded-t-3xl overflow-hidden mt-8"
      style={{
        // Thick Beveled Acrylic Sheet (#4) Implementation - Full Width Bottom Bar style
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(15,23,42,0.95) 100%)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        borderTop: '2px solid rgba(255,255,255,0.25)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
      }}
    >
      <div className="p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                    <Crown className="text-cyan-300" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-white tracking-wide uppercase leading-none">Season 2: Neon Nights</h3>
                    <p className="text-xs text-cyan-200/60 font-medium tracking-wider mt-1">XP PROGRESSION TRACK</p>
                </div>
            </div>
            <Badge className="bg-black/40 text-white border border-white/10 px-3 py-1">
                <span className="text-cyan-400 mr-1 font-bold">{currentXP.toLocaleString()}</span> / {maxXP.toLocaleString()} XP
            </Badge>
        </div>

        {/* The Track Container */}
        <div className="relative w-full h-16 md:h-20 bg-black/40 rounded-full border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] overflow-hidden p-1">
            
            {/* Liquid XP Fill with Chromatic Aberration */}
            <motion.div 
                className="absolute top-1 left-1 bottom-1 rounded-l-full z-0 overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 2, ease: "easeOut" }}
                style={{
                    // Refracting Cyan Light Fill (#5)
                    background: 'linear-gradient(90deg, rgba(6,182,212,0.8), rgba(34,211,238,0.9), rgba(6,182,212,0.8))',
                    boxShadow: '0 0 30px rgba(34,211,238,0.5), inset 0 0 15px rgba(255,255,255,0.4)',
                }}
            >
                {/* Bubbles / Flow Texture */}
                <div className="absolute inset-0 opacity-30" 
                     style={{ 
                         backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', 
                         backgroundSize: '10px 10px',
                         transform: 'scale(1.5)'
                     }} 
                />
                
                {/* Chromatic Edge Effect */}
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-transparent to-white/50 blur-sm mix-blend-overlay" />
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-purple-500/30 blur-md mix-blend-screen" style={{ transform: 'translateX(2px)' }} />
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-yellow-500/30 blur-md mix-blend-screen" style={{ transform: 'translateX(-2px)' }} />
            </motion.div>

            {/* Nodes Layer */}
            <div className="absolute inset-0 flex items-center justify-between px-2 md:px-4 z-10 pointer-events-none">
                {Array.from({ length: totalNodes }).map((_, index) => {
                    const isReached = index < currentLevel;
                    const isNext = index === currentLevel;
                    // Only show icons for every 5th node to avoid clutter, but render dots for all
                    const isMajorNode = (index + 1) % 5 === 0;
                    
                    return (
                        <div 
                            key={index} 
                            className="relative flex items-center justify-center group"
                            style={{ width: `${100 / totalNodes}%` }}
                        >
                            {/* Node Marker */}
                            <div 
                                className={`rounded-full transition-all duration-500 ${
                                    isMajorNode 
                                        ? 'w-3 h-3 md:w-4 md:h-4' 
                                        : 'w-1 h-1 md:w-1.5 md:h-1.5'
                                }`}
                                style={{
                                    background: isReached 
                                        ? 'rgba(255,255,255,0.9)' 
                                        : 'rgba(255,255,255,0.1)',
                                    boxShadow: isReached 
                                        ? '0 0 10px rgba(255,255,255,0.8)' 
                                        : 'none',
                                    border: isReached 
                                        ? 'none' 
                                        : '1px solid rgba(255,255,255,0.1)'
                                }}
                            />

                            {/* Active Pulsing Drop Effect (#9) for the next claimable reward */}
                            {isNext && (
                                <motion.div
                                    className="absolute"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.4, 0.8] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <div className="w-6 h-6 rounded-full bg-red-500/40 blur-md" />
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400 to-yellow-400 opacity-80 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                                </motion.div>
                            )}
                            
                            {/* Tooltip for Major Nodes */}
                            {isMajorNode && (
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded border border-white/10 whitespace-nowrap pointer-events-auto">
                                    Lvl {index + 1}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>

        <div className="mt-4 flex justify-between text-xs text-white/40 font-mono uppercase tracking-wider">
            <span>Start</span>
            <span>Season Progress</span>
            <span>Mastery</span>
        </div>
      </div>
    </div>
  );
}