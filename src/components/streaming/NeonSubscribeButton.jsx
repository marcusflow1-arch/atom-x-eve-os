import React from "react";
import { BellPlus } from "lucide-react";

export default function NeonSubscribeButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-2 rounded-full text-white font-bold tracking-wide relative overflow-hidden group transition-all duration-300 hover:scale-105"
      style={{
        background: "linear-gradient(135deg, #ec4899, #8b5cf6, #d946ef)", // Pink to Purple
        boxShadow: "0 0 30px rgba(236, 72, 153, 0.6), 0 0 15px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
        border: "1px solid rgba(255,255,255,0.2)",
        textShadow: "0 2px 4px rgba(0,0,0,0.3)"
      }}
    >
      <span className="relative z-10 flex items-center gap-2">
        <BellPlus className="w-4 h-4" /> Subscribe
      </span>
      <span
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px 200px at -10% -10%, rgba(255,255,255,0.6), transparent 60%), radial-gradient(600px 200px at 110% 120%, rgba(255,255,255,0.6), transparent 60%)",
          mixBlendMode: "screen",
        }}
      />
    </button>
  );
}