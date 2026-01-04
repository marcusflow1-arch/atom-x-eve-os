import React from "react";

export default function WaterVortexSpinner() {
  return (
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 rounded-full border-4 border-cyan-400/30 border-t-cyan-300 animate-spin" />
      <div className="absolute inset-2 rounded-full border-4 border-blue-400/20 border-t-transparent animate-[spin_1.8s_linear_infinite]" />
      <div className="absolute inset-4 rounded-full border-4 border-teal-400/10 border-t-transparent animate-[spin_2.4s_linear_infinite]" />
    </div>
  );
}