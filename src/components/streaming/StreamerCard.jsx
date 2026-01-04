import React from "react";
import { Users, Circle } from "lucide-react";

export default function StreamerCard({ streamer, onClick }) {
  const isLive = streamer.is_live;
  return (
    <div
      onClick={onClick}
      className="relative rounded-xl overflow-hidden cursor-pointer group"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div className="aspect-[3/4] relative">
        {/* Cover / Avatar */}
        <img
          src={streamer.avatar_url}
          alt={streamer.username}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />

        {/* Live badge */}
        {isLive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-[0.625rem] font-semibold"
               style={{
                 background: "linear-gradient(135deg, rgba(244,63,94,0.9), rgba(225,29,72,0.8))",
                 border: "1px solid rgba(255,255,255,0.18)",
               }}
          >
            <Circle className="w-3 h-3 text-white animate-pulse" fill="currentColor" />
            <span className="text-white tracking-wide">LIVE</span>
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="text-white text-sm font-semibold truncate">
            {streamer.username}
          </div>
          <div className="text-white/70 text-[0.75rem] truncate">{streamer.tagline}</div>
          <div className="mt-2 flex items-center justify-between text-white/70 text-[0.7rem]">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{new Intl.NumberFormat().format(streamer.followers || streamer.follower_count || 0)}</span>
            </div>
            {Array.isArray(streamer.tags) && streamer.tags.length > 0 && (
              <div className="flex items-center gap-1 opacity-90">
                {streamer.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 rounded-full text-[0.65rem]"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}