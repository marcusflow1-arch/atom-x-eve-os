import React from 'react';

function SectionHeader({ children }) {
  return (
    <div className="mb-2">
      <div className="text-[10px] uppercase tracking-[0.35em] text-[#9A9A9A]">{children}</div>
      <div className="relative w-48 h-4 mt-1">
        <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/20 bg-black/60"></div>
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
          <Squares count={4} onSlotClick={(i) => openPanel('genre', i)} />
        </div>

        {/* Aspects - bottom left */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Aspects</SectionHeader>
          <Circles count={3} onSlotClick={(i) => openPanel('aspects', i)} />
        </div>

        {/* Artifacts - bottom middle */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Artifacts</SectionHeader>
          <Squares count={5} onSlotClick={(i) => openPanel('artifacts', i)} />
        </div>

        {/* Bottom right: Genre */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Genre</SectionHeader>
          <Squares count={4} onSlotClick={(i) => openPanel('genre', i)} />
        </div>
      </div>
    </div>
  );
}