import React, { useMemo, useState } from "react";
import { MOCK_STREAMERS } from "@/components/streaming/mockData";
import StreamerCard from "@/components/streaming/StreamerCard";
import { Button } from "@/components/ui/button";
import VerticalSidebar from "@/components/navigation/VerticalSidebar";

export default function Streaming() {
  const [filter, setFilter] = useState("all");

  const streamers = MOCK_STREAMERS || [];
  const filtered = useMemo(() => {
    if (filter === "live") return streamers.filter((s) => s.is_live);
    if (filter === "new") return streamers.filter((s) => (s.followers || s.follower_count || 0) < 2000);
    return streamers;
  }, [filter, streamers]);

  return (
    <>
      <VerticalSidebar />
      <div className="min-h-screen p-6 md:p-10 md:pl-[280px]">
      {/* Hero */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            <span className="bg-clip-text text-transparent"
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
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
    </>
  );
}