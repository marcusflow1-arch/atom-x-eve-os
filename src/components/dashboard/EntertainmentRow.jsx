import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Clapperboard, Tv, Monitor, Film, Video } from "lucide-react";

export default function EntertainmentRow() {
  const scrollRef = useRef(null);

  const services = [
    { name: "Netflix", color: "bg-red-600/80", accent: "from-red-500/30 to-red-400/10", icon: Film },
    { name: "Disney+", color: "bg-blue-600/80", accent: "from-blue-500/30 to-blue-400/10", icon: Clapperboard },
    { name: "Max", color: "bg-purple-600/80", accent: "from-purple-500/30 to-purple-400/10", icon: Video },
    { name: "Showtime", color: "bg-rose-600/80", accent: "from-rose-500/30 to-rose-400/10", icon: Film },
    { name: "Starz", color: "bg-zinc-700/80", accent: "from-zinc-400/30 to-zinc-300/10", icon: Clapperboard },
    { name: "Prime Video", color: "bg-cyan-600/80", accent: "from-cyan-500/30 to-cyan-400/10", icon: Tv },
    { name: "Hulu", color: "bg-emerald-600/80", accent: "from-emerald-500/30 to-emerald-400/10", icon: Tv },
    { name: "Apple TV+", color: "bg-black/80", accent: "from-slate-500/30 to-slate-400/10", icon: Monitor },
    { name: "Paramount+", color: "bg-indigo-600/80", accent: "from-indigo-500/30 to-indigo-400/10", icon: Clapperboard },
    { name: "Peacock", color: "bg-neutral-800/80", accent: "from-amber-400/30 to-amber-300/10", icon: Video },
  ];

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = Math.min(600, scrollRef.current.clientWidth * 0.9);
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white/80 font-semibold text-sm uppercase tracking-wider">Entertainment</h3>
        <div className="flex gap-2">
          <button onClick={() => scroll("left")} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-white/70" />
          </button>
          <button onClick={() => scroll("right")} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white/70" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-4 min-w-0">
          {services.map(({ name, color, accent, icon: Icon }) => (
            <div key={name} className="flex-shrink-0 w-48">
              <button
                className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-white/10 group relative"
                style={{
                  background: "rgba(100,120,140,0.10)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
                title={`${name}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${color} text-white/90`}>{name}</div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-white/80 group-hover:scale-110 transition-transform" />
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}