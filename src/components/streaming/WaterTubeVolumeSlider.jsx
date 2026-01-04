import React from "react";
import { Volume2, VolumeX } from "lucide-react";

export default function WaterTubeVolumeSlider({ value = 0.7, onChange, onToggleMute }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 30px rgba(0,0,0,0.35)",
        backdropFilter: "blur(12px) saturate(160%)",
        WebkitBackdropFilter: "blur(12px) saturate(160%)",
      }}
    >
      <button
        onClick={onToggleMute}
        className="w-9 h-9 rounded-full grid place-items-center hover:bg-white/10 transition-colors"
        title="Toggle mute"
      >
        {pct === 0 ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
      </button>

      {/* Water tube */}
      <div className="relative h-3 w-40 rounded-full" style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.2)" }}>
        {/* Tube glass */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
            backdropFilter: "blur(4px)",
          }}
        />
        {/* Water fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-l-full relative"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, #06b6d4, #3b82f6)", // Cyan to Blue neon
            boxShadow: "0 0 15px rgba(6, 182, 212, 0.6)",
            transition: "width 0.1s linear"
          }}
        >
           {/* Trapped Bubble Handle */}
           <div 
             className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.9)] z-10 border-2 border-cyan-400"
             style={{
               background: "radial-gradient(circle at 30% 30%, white, #cffafe)",
               boxShadow: "0 0 12px rgba(34, 211, 238, 0.8), inset 0 0 4px rgba(0,0,0,0.1)"
             }}
           />
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => onChange?.(Number(e.target.value) / 100)}
        className="opacity-0 absolute w-full h-full inset-0 cursor-pointer z-20"
        aria-label="Volume"
      />
    </div>
  );
}