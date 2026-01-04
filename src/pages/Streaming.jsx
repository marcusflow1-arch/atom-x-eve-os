import React, { useMemo, useState } from "react";
import { MOCK_STREAMERS } from "@/components/streaming/mockData";
import StreamerCard from "@/components/streaming/StreamerCard";

import GlassPanel from "@/components/shared/GlassPanel";
import LiquidCarousel from "@/components/streaming/LiquidCarousel";
import RealLifeGallerySlide from "@/components/streaming/RealLifeGallerySlide";
import InterestsSlide from "@/components/streaming/InterestsSlide";
import HighRefractionVideoPlayer from "@/components/streaming/HighRefractionVideoPlayer";
import LiveChatPanel from "@/components/streaming/LiveChatPanel";
import VerticalGameNav from "@/components/streaming/VerticalGameNav";
import LiquidMetalToggle from "@/components/creator/LiquidMetalToggle"; // Reusing the toggle
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search } from "lucide-react";

// Streaming page with High Refraction Player and Liquid Carousel
export default function Streaming() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const isLive = params.get('mode') === 'live';

  const [filter, setFilter] = useState("all");

  const streamers = MOCK_STREAMERS || [];
  const filtered = useMemo(() => {
    if (filter === "live") return streamers.filter((s) => s.is_live);
    if (filter === "new") return streamers.filter((s) => (s.followers || s.follower_count || 0) < 2000);
    return streamers;
  }, [filter, streamers]);

  const handleLiveToggle = () => {
    if (isLive) {
      navigate(createPageUrl('Streaming'));
    } else {
      navigate(createPageUrl('Streaming') + '?mode=live');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 relative">
      {/* Active Gold Glow Background Transition - Vibrant Shift */}
      {isLive && (
        <>
          <div
            className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.4) 0%, rgba(234, 179, 8, 0.1) 60%, transparent 90%)",
              mixBlendMode: "screen",
            }}
          />
          <div
            className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
            style={{
              background: "conic-gradient(from 0deg at 50% 50%, rgba(255, 215, 0, 0.1) 0deg, transparent 60deg, rgba(255, 215, 0, 0.1) 120deg, transparent 180deg, rgba(255, 215, 0, 0.1) 240deg, transparent 300deg, rgba(255, 215, 0, 0.1) 360deg)",
              mixBlendMode: "overlay",
              filter: "blur(60px)",
              opacity: 0.6
            }}
          />
        </>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[10%_70%_20%] gap-4">
        {/* Left 10% - Vertical Game Library with Glass Spheres (#23) */}
        <div className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)]">
          <GlassPanel variant="left">
            <VerticalGameNav />
          </GlassPanel>
        </div>

        {/* Center 70% - clearest panel for high color accuracy media */}
        <div className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)]">
          <GlassPanel variant="center">
            {/* Top Bar: Search & Toggle */}
            <div className="flex justify-between items-center p-4 md:p-6 pb-2">
                 {/* Etched Search Bar (#10) */}
                 <div className="relative group w-1/3">
                    <div className="absolute inset-0 bg-white/5 rounded-full blur-[1px] group-hover:bg-white/10 transition-colors" />
                    <div className="relative flex items-center px-4 py-2 rounded-full border border-white/10 bg-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
                        <Search className="w-4 h-4 text-white/40 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Search creators..." 
                            className="bg-transparent border-none outline-none text-sm text-white/80 placeholder-white/30 w-full"
                        />
                    </div>
                 </div>

                 {/* Liquid Metal Switch (#12) for Live Mode */}
                 <div className="w-48">
                    <LiquidMetalToggle 
                        label={isLive ? "Live Mode" : "Discovery"} 
                        isOn={isLive} 
                        onToggle={handleLiveToggle} 
                    />
                 </div>
            </div>

            {isLive ? (
              <div className="p-4 md:p-6 pt-2">
                <HighRefractionVideoPlayer />
              </div>
            ) : (
              <LiquidCarousel intervalMs={15000}>
                {/* Home */}
                <div className="p-4 md:p-6 pt-2">
                  {/* Hero */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                        <span
                          className="bg-clip-text text-transparent"
                          style={{
                            backgroundImage:
                              "linear-gradient(135deg, #a5b4fc 0%, #60a5fa 40%, #22d3ee 100%)",
                          }}
                        >
                          Streaming
                        </span>
                      </h1>
                    </div>

                    {/* Filters - Liquid Tile Grid */}
                    <div className="flex gap-3">
                      {[
                        { key: "all", label: "All" },
                        { key: "live", label: "Live Now" },
                        { key: "new", label: "New Voices" },
                      ].map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setFilter(t.key)}
                          className={`relative px-6 py-3 rounded-xl overflow-hidden transition-all duration-300 group ${
                             filter === t.key ? 'scale-105' : 'hover:scale-105'
                          }`}
                          style={{
                              // Liquid Tile Styling
                              background: filter === t.key 
                                ? 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(6,182,212,0.1))' 
                                : 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              boxShadow: filter === t.key
                                ? '0 8px 20px rgba(34,211,238,0.15), inset 0 1px 0 rgba(255,255,255,0.2)'
                                : '0 4px 10px rgba(0,0,0,0.1)'
                          }}
                        >
                          {/* Glossy sheen */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className={`relative z-10 text-sm font-medium tracking-wide ${filter === t.key ? 'text-cyan-300' : 'text-white/60'}`}>
                            {t.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((s) => (
                      <StreamerCard key={s.id} streamer={s} onClick={() => {}} />
                    ))}
                    {filtered.length === 0 && (
                      <div className="col-span-full text-center text-white/60 py-20">
                        No streamers found.
                      </div>
                    )}
                  </div>
                </div>

                {/* Real Life Gallery */}
                <RealLifeGallerySlide />

                {/* Interests */}
                <InterestsSlide streamers={streamers} />
              </LiquidCarousel>
            )}
          </GlassPanel>
        </div>

        {/* Right 20% - Live Chat Feed (Holographic Layer #27) */}
        <div className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)]">
          <GlassPanel variant="right" className="!p-0">
             <LiveChatPanel />
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}