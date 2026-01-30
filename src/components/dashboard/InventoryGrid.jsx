import React from 'react';

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mt-2 mb-2">
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">{children}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

function Squares({ count = 6, size = 'md' }) {
  const cls = size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  return (
    <div className="flex gap-2 flex-wrap">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${cls} rounded-md border border-white/15 bg-white/5`} />
      ))}
    </div>
  );
}

function Circles({ count = 5, size = 'md' }) {
  const cls = size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  return (
    <div className="flex gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${cls} rounded-full border border-white/15 bg-white/5`} />
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
          <SectionLabel>Armor</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-full aspect-square rounded-md border border-white/15 bg-white/5" />
            ))}
          </div>
        </div>

        {/* Top center: Weapons */}
        <div className="col-span-12 sm:col-span-5">
          <SectionLabel>Weapons</SectionLabel>
          <Squares count={5} size="lg" />
        </div>

        {/* Top right: Genre */}
        <div className="col-span-12 sm:col-span-3">
          <SectionLabel>Genre</SectionLabel>
          <Squares count={4} />
        </div>

        {/* Aspects row */}
        <div className="col-span-12">
          <SectionLabel>Aspects</SectionLabel>
          <Circles count={5} />
        </div>

        {/* Artifacts row */}
        <div className="col-span-12">
          <SectionLabel>Artifacts</SectionLabel>
          <Squares count={6} />
        </div>

        {/* Bottom right: Genre */}
        <div className="col-span-12 sm:col-span-4 sm:col-start-9">
          <SectionLabel>Genre</SectionLabel>
          <Squares count={4} />
        </div>
      </div>
    </div>
  );
}