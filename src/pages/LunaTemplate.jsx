import React from 'react';
import { motion } from 'framer-motion';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';
import { Search, Bell, User, Mic } from 'lucide-react';

export default function LunaTemplate() {
  return (
    <div 
      className="min-h-screen text-white p-8 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
    >
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-300/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto h-[calc(100vh-4rem)] flex flex-col gap-6">
        
        {/* Header Section */}
        <LiquidGlassCard className="px-8 py-4 flex items-center justify-between" hover={false}>
          {/* Left: Logo/Brand */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-xl font-black">L</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-white">LUNA</h1>
              <span className="text-xs text-cyan-300 tracking-[0.2em] uppercase">Gaming</span>
            </div>
          </div>

          {/* Center: Navigation */}
          <div className="flex items-center gap-8">
            {['HOME', 'DISCUSSIONS', 'NEWS'].map((item, i) => (
              <button 
                key={item} 
                className={`text-sm font-bold tracking-wider transition-all ${i === 0 ? 'text-cyan-300 border-b-2 border-cyan-300 pb-1' : 'text-white/60 hover:text-white'}`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Right: Search & Profile */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search" 
                className="w-64 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
              />
              <Mic className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 cursor-pointer hover:text-white" />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="w-5 h-5 text-white/60 hover:text-white cursor-pointer" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 cursor-pointer">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  <User className="w-5 h-5 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
          
          {/* Left Column: Recent Discussions (Approx 25%) */}
          <div className="col-span-3 flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold text-white/80 tracking-wide">RECENT DISCUSSIONS</h2>
            </div>
            <LiquidGlassCard className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto" hover={false}>
              {/* Empty Box Placeholder */}
              <div className="flex-1 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center bg-white/5">
                <span className="text-white/30 text-sm">Box 1: List Content</span>
              </div>
            </LiquidGlassCard>
          </div>

          {/* Center Column: Trending Topics (Approx 50%) */}
          <div className="col-span-6 flex flex-col gap-6">
             <div className="flex items-center justify-center px-2">
              <h2 className="text-sm font-bold text-white/80 tracking-wide">TRENDING TOPICS</h2>
            </div>
            <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
              <LiquidGlassCard className="flex items-center justify-center" hover={true}>
                <div className="border-2 border-dashed border-white/10 w-[90%] h-[90%] rounded-xl flex items-center justify-center bg-white/5">
                   <span className="text-white/30 text-sm">Box 2: Feature Card</span>
                </div>
              </LiquidGlassCard>
              <LiquidGlassCard className="flex items-center justify-center" hover={true}>
                <div className="border-2 border-dashed border-white/10 w-[90%] h-[90%] rounded-xl flex items-center justify-center bg-white/5">
                   <span className="text-white/30 text-sm">Box 3: Feature Card</span>
                </div>
              </LiquidGlassCard>
              <LiquidGlassCard className="flex items-center justify-center" hover={true}>
                <div className="border-2 border-dashed border-white/10 w-[90%] h-[90%] rounded-xl flex items-center justify-center bg-white/5">
                   <span className="text-white/30 text-sm">Box 4: Feature Card</span>
                </div>
              </LiquidGlassCard>
              <LiquidGlassCard className="flex items-center justify-center" hover={true}>
                 <div className="border-2 border-dashed border-white/10 w-[90%] h-[90%] rounded-xl flex items-center justify-center bg-white/5">
                   <span className="text-white/30 text-sm">Box 5: Feature Card</span>
                </div>
              </LiquidGlassCard>
            </div>
          </div>

          {/* Right Column: Recommendations (Approx 25%) */}
          <div className="col-span-3 flex flex-col gap-6">
             <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold text-white/80 tracking-wide">GAME RECOMMENDATIONS</h2>
            </div>
            <LiquidGlassCard className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto" hover={false}>
               {/* Empty Box Placeholder */}
               <div className="flex-1 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center bg-white/5">
                <span className="text-white/30 text-sm">Box 6: Recommendations</span>
              </div>
            </LiquidGlassCard>
          </div>

        </div>
      </div>
    </div>
  );
}