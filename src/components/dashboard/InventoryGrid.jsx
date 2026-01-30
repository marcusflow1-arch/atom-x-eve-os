import React from 'react';
import { Book } from 'lucide-react';

function SectionHeader({ children }) {
  return (
    <div className="mb-3">
      <div className="flex flex-col items-center">
        {/* Book icon above */}
        <Book className="w-4 h-4 text-white/50 mb-1" />
        {/* Label above the lines */}
        <span className="mb-1 text-[10px] uppercase tracking-[0.35em] text-[#9A9A9A]">{children}</span>
        {/* Lines with circle between short (above) and long (below) */}
        <div className="relative h-4 w-full flex items-center justify-center">
          {/* Long line (bottom) */}
          <div className="absolute bottom-0 inset-x-0 h-px bg-white/10" />
          {/* Short line (just above long line) */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-px bg-white/30" />
          {/* Circle between lines */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border border-white/30 bg-black/50" />
        </div>
      </div>
    </div>
  );
}

function Squares({ count = 6, size = 'md', onSlotClick }) {
  const cls = size === 'lg' ? 'w-[60px] h-[60px]' : size === 'sm' ? 'w-[44px] h-[44px]' : 'w-[60px] h-[60px]';
  return (
    <div className="flex gap-3 flex-wrap">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          onClick={() => onSlotClick?.(i)}
          className={`${cls} rounded-xl border border-white/20 bg-black/70 hover:border-white/30 hover:bg-black/80 transition-colors cursor-pointer`}
        />
      ))}
    </div>
  );
}

function Circles({ count = 5, size = 'md', onSlotClick }) {
  const cls = size === 'lg' ? 'w-[60px] h-[60px]' : size === 'sm' ? 'w-[44px] h-[44px]' : 'w-[60px] h-[60px]';
  return (
    <div className="flex gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          onClick={() => onSlotClick?.(i)}
          className={`${cls} rounded-full border border-white/20 bg-black/70 hover:border-white/30 hover:bg-black/80 transition-colors cursor-pointer`}
        />
      ))}
    </div>
  );
}

export default function InventoryGrid() {
  const openPanel = (section, index) => {
    const map = { armor: 'armor', weapons: 'weapon', genre: 'genre', aspects: 'aspect', artifacts: 'artifact' };
    const prefix = map[section.toLowerCase()] || section.toLowerCase();
    const slotId = `${prefix}-${index + 1}`;
    window.dispatchEvent(new CustomEvent('openInventoryPanel', { detail: { slotId } }));
  };

  return (
    <div className="w-full">
      {/* Responsive grid mimicking the provided layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left column: Armor */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Armor</SectionHeader>
          <Squares count={9} size="lg" onSlotClick={(i) => openPanel('armor', i)} />
        </div>

        {/* Top center: Weapons */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Weapons</SectionHeader>
          <Squares count={3} size="lg" onSlotClick={(i) => openPanel('weapons', i)} />
        </div>

        {/* Top right: Genre */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Genre</SectionHeader>
          <Squares count={2} onSlotClick={(i) => openPanel('genre', i)} />
        </div>

        {/* Aspects - bottom left */}
        <div className="col-span-12 sm:col-span-4 mt-8 md:mt-12">
          <SectionHeader>Aspects</SectionHeader>
          <Circles count={3} onSlotClick={(i) => openPanel('aspects', i)} />
        </div>

        {/* Artifacts - bottom middle */}
        <div className="col-span-12 sm:col-span-4 mt-8 md:mt-12">
          <SectionHeader>Artifacts</SectionHeader>
          <Squares count={5} onSlotClick={(i) => openPanel('artifacts', i)} />
        </div>

        {/* Bottom right: Genre */}
        <div className="col-span-12 sm:col-span-4 mt-8 md:mt-12">
          <SectionHeader>Genre</SectionHeader>
          <Squares count={2} onSlotClick={(i) => openPanel('genre', i)} />
        </div>
      </div>
    </div>
  );
}