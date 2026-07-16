import React from 'react';
import { User } from 'lucide-react';

export default function FriendHighlightsSlideshow() {
  return (
    <div className="flex items-stretch mb-2 rounded-xl overflow-hidden border border-white/8"
      style={{
        height: '200px',
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
      {/* Left 25% — 3D viewer of friend */}
      <div className="relative flex-shrink-0 flex items-center justify-center"
        style={{ width: '25%' }}>
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 50% 55%, rgba(99,102,241,0.10) 0%, rgba(10,14,22,0.5) 70%)' }} />
        <div className="relative w-16 h-16 rounded-full border border-white/15 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <User className="w-7 h-7 text-white/25" />
        </div>
      </div>

      {/* Center vertical divider — short, centered, spaced from top & bottom */}
      <div className="flex items-center justify-center flex-shrink-0">
        <div className="w-px bg-white/15" style={{ height: '55%' }} />
      </div>

      {/* Right 75% — recent activities */}
      <div className="flex-1 flex flex-col justify-center gap-2.5 px-4">
        <div className="w-full h-2 rounded-full bg-white/8" />
        <div className="w-4/5 h-2 rounded-full bg-white/6" />
        <div className="w-3/5 h-2 rounded-full bg-white/5" />
        <div className="w-2/3 h-2 rounded-full bg-white/5" />
        <div className="w-1/2 h-2 rounded-full bg-white/4" />
      </div>
    </div>
  );
}