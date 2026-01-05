import React from "react";

export default function LunarMotif({ className = "", lineColor = "rgba(255,255,255,0.25)", circleColor = "rgba(255,255,255,0.5)" }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="h-px w-16" style={{ background: lineColor }} />
      <div className="relative mt-1">
        <div className="h-[2px] w-28" style={{ background: lineColor }} />
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full"
          style={{ background: circleColor, boxShadow: "0 0 12px rgba(255,255,255,0.25)" }}
        />
      </div>
    </div>
  );
}