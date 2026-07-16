import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';

const PLACEHOLDER_COUNT = 8;
const ITEM_WIDTH = 56;
const STRIDE = ITEM_WIDTH + 6;

export default function FriendHighlightsSlideshow() {
  const [index, setIndex] = useState(0);
  const maxIndex = PLACEHOLDER_COUNT - 3;

  return (
    <div className="flex items-center gap-1.5 mb-2">
      <button
        onClick={() => setIndex((p) => Math.max(0, p - 1))}
        disabled={index === 0}
        className="flex-shrink-0 w-6 h-11 rounded-md flex items-center justify-center transition-all border border-white/10 disabled:opacity-40"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <ChevronLeft className="w-4 h-4 text-white/60" />
      </button>

      <div className="flex-1 overflow-hidden">
        <div
          className="flex gap-1.5 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * STRIDE}px)` }}
        >
          {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 rounded-md border border-white/10 flex flex-col items-center justify-center gap-0.5"
              style={{ width: `${ITEM_WIDTH}px`, height: '44px', background: 'rgba(255,255,255,0.02)' }}
            >
              <User className="w-3 h-3 text-white/15" />
              <div className="w-8 h-1 rounded-full bg-white/8" />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIndex((p) => Math.min(maxIndex, p + 1))}
        disabled={index >= maxIndex}
        className="flex-shrink-0 w-6 h-11 rounded-md flex items-center justify-center transition-all border border-white/10 disabled:opacity-40"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <ChevronRight className="w-4 h-4 text-white/60" />
      </button>
    </div>
  );
}