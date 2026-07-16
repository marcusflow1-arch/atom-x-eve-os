import React from 'react';
import { User } from 'lucide-react';

export default function FriendHighlightsSlideshow() {
  return (
    <div className="flex items-center gap-2.5 mb-2 px-1">
      {/* Friend on far left */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <User className="w-3.5 h-3.5 text-white/30" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="w-14 h-1.5 rounded-full bg-white/12" />
          <div className="w-9 h-1 rounded-full bg-white/8" />
        </div>
      </div>

      {/* Short vertical divider — doesn't span full height */}
      <div className="self-stretch flex items-center">
        <div className="w-px h-5 bg-white/20" />
      </div>

      {/* Recent activity info on the right of the line */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="w-full h-1.5 rounded-full bg-white/8" />
        <div className="w-3/4 h-1.5 rounded-full bg-white/6" />
        <div className="w-1/2 h-1 rounded-full bg-white/5" />
      </div>
    </div>
  );
}