import React, { useState } from 'react';
import AuraBackground from '@/components/streaming/aura/AuraBackground';
import GlassSphereLibrary from '@/components/streaming/aura/GlassSphereLibrary';
import PersonalityStage from '@/components/streaming/aura/PersonalityStage';
import HolographicChat from '@/components/streaming/aura/HolographicChat';
import LiquidSeasonalBar from '@/components/streaming/aura/LiquidSeasonalBar';
import GlassPanel from '@/components/shared/GlassPanel'; // Keep for structure if needed, or use raw divs

export default function Streaming() {
  const [isLive, setIsLive] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* 1. Atmospheric Background (Layer 1) */}
      <AuraBackground isLive={isLive} />

      {/* Main Layout Grid */}
      <div className="relative z-10 w-full h-full p-4 md:p-6 grid grid-cols-[80px_1fr_300px] gap-6">
        
        {/* Left Anchor: Vertical Game Library (10% approx, fixed width for cleanliness) */}
        <div className="h-full rounded-3xl bg-black/20 backdrop-blur-md border border-white/5 shadow-2xl overflow-hidden">
             <GlassSphereLibrary />
        </div>

        {/* Center Stage: Personality & Video (70%) */}
        <div className="h-full flex flex-col gap-4 min-w-0">
             <div className="flex-1 min-h-0 rounded-[2.5rem] bg-white/5 backdrop-blur-[2px] border border-white/10 shadow-2xl overflow-hidden p-6 relative">
                 {/* Inner Glow */}
                 <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(255,255,255,0.05)] rounded-[2.5rem]" />
                 
                 <PersonalityStage isLive={isLive} toggleLive={() => setIsLive(!isLive)} />
             </div>
             
             {/* Bottom Anchor: Seasonal Pass */}
             <div className="h-20 shrink-0">
                 <LiquidSeasonalBar />
             </div>
        </div>

        {/* Right Anchor: Holographic Chat (20%) */}
        <div className="h-full pt-12 pb-4">
             <HolographicChat isLive={isLive} />
        </div>

      </div>
    </div>
  );
}