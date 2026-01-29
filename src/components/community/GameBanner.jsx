import React from 'react';

export default function GameBanner({ imageUrl, children }) {
  const fallback = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop';
  const src = imageUrl || fallback;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] mb-6">
      {/* Background image + blur + dim */}
      <div className="absolute inset-0">
        <img
          src={src}
          alt="Game banner"
          className="w-full h-full object-cover scale-105 blur-[2px] opacity-80"
        />
        {/* Extra gradient to keep content readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      </div>

      {/* Foreground glass panel for controls */}
      <div className="relative p-4 sm:p-6">
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-3 sm:p-4">
          {children}
        </div>
      </div>
    </div>
  );
}