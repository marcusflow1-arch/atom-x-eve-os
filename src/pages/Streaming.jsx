import React, { useMemo, useState } from "react";
import { MOCK_STREAMERS } from "@/components/streaming/mockData";
import StreamerCard from "@/components/streaming/StreamerCard";

import GlassPanel from "@/components/shared/GlassPanel";
import LiquidCarousel from "@/components/streaming/LiquidCarousel";
import RealLifeGallerySlide from "@/components/streaming/RealLifeGallerySlide";
import InterestsSlide from "@/components/streaming/InterestsSlide";
import HighRefractionVideoPlayer from "@/components/streaming/HighRefractionVideoPlayer";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

  return (
    <div className="min-h-screen p-4 md:p-6 relative">
      {/* Active Gold Glow Background Transition */}
      {isLive && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(234, 179, 8, 0.15), transparent 70%)",
            mixBlendMode: "screen",
          }}
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[10%_70%_20%] gap-4">
        {/* Left 10% - distinct refraction */}
        <div className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)]">
          <GlassPanel variant="left">
            {/* Left column content (e.g., categories, nav) */}
          </GlassPanel>
        </div>

        {/* Center 70% - clearest panel for high color accuracy media */}
        <div className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)]">
          <GlassPanel variant="center">
            {/* Live Mode Toggle */}
            <div className="flex justify-end p-3">
              {isLive ? (
                <button
                  onClick={() => navigate(createPageUrl('Streaming'))}
                  className="px-3 py-1.5 rounded-full text-xs text-white/90 bg-white/10 border border-white/20 hover:bg-white/15"
                >
                  Exit Live Mode
                </button>
              ) : (
                <button
                  onClick={() => navigate(createPageUrl('Streaming') + '?mode=live')}
                  className="px-3 py-1.5 rounded-full text-xs text-white/90 bg-white/10 border border-white/20 hover:bg-white/15"
                >
                  Enter Live Mode
                </button>
              )}
            </div>

            {isLive ? (
              <div className="p-4 md:p-6">
                <HighRefractionVideoPlayer />
              </div>
            ) : (
              <LiquidCarousel intervalMs={15000}>
                {/* Home */}
                <div className="p-4 md:p-6">
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

                    {/* Filters */}
                    <div className="flex gap-2">
                      {[
                        { key: "all", label: "All" },
                        { key: "live", label: "Live Now" },
                        { key: "new", label: "New Voices" },
                      ].map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setFilter(t.key)}
                          className={`px-4 py-2 rounded-full text-sm transition-all border ${
                            filter === t.key
                              ? "text-white bg-white/10 border-white/20"
                              : "text-white/60 hover:text-white hover:bg-white/5 hover:border-white/10 border-transparent"
                          }`}
                          style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
                        >
                          {t.label}
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

        {/* Right 20% - distinct refraction */}
        <div className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)]">
          <GlassPanel variant="right">
            {/* Right column content (e.g., live chat, widgets) */}
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}