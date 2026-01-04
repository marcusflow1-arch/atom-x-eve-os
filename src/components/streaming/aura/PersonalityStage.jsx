import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Instagram, Twitter, Gamepad2, Mic, Activity } from 'lucide-react';
import LiquidMetalToggle from '@/components/creator/LiquidMetalToggle'; // Reusing
import RefractivePlayer from './RefractivePlayer';

export default function PersonalityStage({ isLive, toggleLive }) {
  // Streamer Identity Data
  const streamer = {
      name: "NeonRider",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
      bio: "Digital explorer & Cyberpunk lore historian. I play RPGs, create synthwave music, and talk about the future of tech.",
      tags: ["RPG", "Lore", "Synthwave"]
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Top Navigation Bar (#13 - Liquid Toggle) */}
      <div className="flex items-center justify-between px-2">
           {/* Etched Search Bar (#10) */}
           <div className="relative w-64 group">
               <div className="absolute inset-0 bg-white/5 rounded-full blur-[1px]" />
               <div className="relative flex items-center px-4 py-2.5 rounded-full border border-white/10 bg-black/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                   <Search className="w-4 h-4 text-white/30 mr-2" />
                   <input 
                       type="text" 
                       placeholder="Find creators..." 
                       className="bg-transparent border-none outline-none text-sm text-white/90 placeholder-white/20 w-full"
                   />
               </div>
           </div>

           {/* The Toggle */}
           <div className="w-48">
               <LiquidMetalToggle label={isLive ? "LIVE" : "OFFLINE"} isOn={isLive} onToggle={toggleLive} />
           </div>
      </div>

      {/* Main Stage Content */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[250px_1fr] gap-6">
          
          {/* Streamer Identity Sidebar (Embedded in Center 70% per prompt instructions "Streamer Identity Sidebar") 
              Wait, user prompt said Left 10% is Game Lib, Center 70% is Personality Stage. 
              Inside Personality Stage, we have Bio + Player.
          */}
          
          {/* Identity Column */}
          <div className="hidden xl:flex flex-col gap-6">
               {/* Streamer Card (#21) */}
               <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col items-center text-center shadow-xl">
                    {/* Water Ripple Frame (#22) */}
                    <div className="relative w-28 h-28 mb-4">
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-pulse" />
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/10 scale-110 animate-ping" />
                        <img src={streamer.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-black/50 shadow-2xl relative z-10" />
                        {isLive && (
                            <div className="absolute bottom-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-black z-20 animate-bounce">
                                LIVE
                            </div>
                        )}
                    </div>
                    
                    <h2 className="text-xl font-black text-white mb-1">{streamer.name}</h2>
                    <p className="text-xs text-white/50 mb-4 font-mono uppercase tracking-widest">Lvl 42 Netrunner</p>

                    {/* Glass Sphere Socials (#24) */}
                    <div className="flex gap-3 mb-6">
                        {[Twitter, Instagram, Globe].map((Icon, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-transparent border border-white/20 shadow-inner flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                        ))}
                    </div>

                    {/* About Me Overlay */}
                    <div className="w-full bg-black/40 rounded-xl p-4 text-left border border-white/5">
                        <h3 className="text-xs font-bold text-white/70 mb-2 uppercase">About Me</h3>
                        <p className="text-xs text-white/50 leading-relaxed">
                            {streamer.bio}
                        </p>
                    </div>
               </div>

               {/* Tags */}
               <div className="flex flex-wrap gap-2 justify-center">
                   {streamer.tags.map(tag => (
                       <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                           #{tag}
                       </span>
                   ))}
               </div>
          </div>

          {/* Video Player Area */}
          <div className="flex-1 flex flex-col min-h-0">
               <RefractivePlayer isLive={isLive} />
          </div>
      </div>
    </div>
  );
}