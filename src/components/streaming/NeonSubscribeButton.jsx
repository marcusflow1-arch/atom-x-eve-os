import React from "react";
import { BellPlus } from "lucide-react";

export default function NeonSubscribeButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2.5 rounded-full text-white font-semibold tracking-wide relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #f59e0b, #f97316)",
        boxShadow: "0 0 24px rgba(245, 158, 11, 0.5), 0 12px 40px rgba(249, 115, 22, 0.35)",
        border: "1px solid rgba(255,255,255,0.2)",
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