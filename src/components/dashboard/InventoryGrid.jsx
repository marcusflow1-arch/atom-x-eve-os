import React from 'react';

function SectionHeader({ children }) {
  return (
    <div className="mb-2">
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/60">{children}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="w-2 h-2 rounded-full border border-white/30" />
        <span className="w-6 h-px bg-white/30" />
        <span className="w-24 h-px bg-white/10" />
      </div>
    </div>
  );
}

function Squares({ count = 6, size = 'md' }) {
  const cls = size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  return (
    <div className="flex gap-2 flex-wrap">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${cls} rounded-md border border-black/50 bg-black/60`} />
      ))}
    </div>
  );
}

function Circles({ count = 5, size = 'md' }) {
  const cls = size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  return (
    <div className="flex gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${cls} rounded-full border border-black/50 bg-black/60`} />
      ))}
    </div>
  );
}

export default function InventoryGrid() {
  return (
    <div className="w-full">
      {/* Responsive grid mimicking the provided layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left column: Armor */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Armor</SectionHeader>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-full aspect-square rounded-md border border-white/15 bg-white/5" />
            ))}
          </div>
        </div>

        {/* Top center: Weapons */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Weapons</SectionHeader>
          <Squares count={5} size="lg" />
        </div>

        {/* Top right: Genre */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Genre</SectionHeader>
          <Squares count={4} />
        </div>

        {/* Aspects - bottom left */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Aspects</SectionHeader>
          <Circles count={5} />
        </div>

        {/* Artifacts - bottom middle */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Artifacts</SectionHeader>
          <Squares count={6} />
        </div>

        {/* Bottom right: Genre */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Genre</SectionHeader>
          <Squares count={4} />
        </div>
      </div>
    </div>
  );
}