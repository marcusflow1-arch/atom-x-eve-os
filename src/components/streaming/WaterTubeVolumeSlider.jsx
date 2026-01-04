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
      <div className="relative h-3 w-40 rounded-full overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
        {/* Tube glass */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1)), linear-gradient(90deg, rgba(34,211,238,0.25), rgba(99,102,241,0.25))",
            backdropFilter: "blur(8px)",
          }}
        />
        {/* Water fill */}
        <div
          className="absolute left-0 top-0 h-full"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, rgba(56,189,248,0.9), rgba(34,211,238,0.9))",
            boxShadow: "0 0 18px rgba(56,189,248,0.75)",
          }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => onChange?.(Number(e.target.value) / 100)}
        className="opacity-0 absolute w-40 h-3 -ml-[156px]"
        aria-label="Volume"
      />
    </div>
  );
}