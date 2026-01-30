import React, { useState } from 'react';
import InventoryItemOverlay from '@/components/store/InventoryItemOverlay';

function SectionHeader({ children }) {
  return (
    <div className="mb-2">
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/60">{children}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="relative inline-flex items-center justify-center">
          <span className="w-3 h-3 rounded-full border border-white/25" />
          <span className="absolute w-1.5 h-1.5 rounded-full bg-white/40" />
        </span>
        <span className="w-6 h-px bg-white/40" />
        <span className="w-28 h-px bg-white/15" />
      </div>
    </div>
  );
}

function Squares({ count = 6, size = 'md', onSlotClick }) {
  const cls = size === 'lg' ? 'w-[52px] h-[52px]' : size === 'sm' ? 'w-[40px] h-[40px]' : 'w-[46px] h-[46px]';
  return (
    <div className="flex gap-2 flex-wrap">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          onClick={() => onSlotClick?.(i)}
          className={`${cls} rounded-md border border-black/50 bg-black/60 hover:border-white/30 hover:bg-black/70 transition-colors cursor-pointer`}
        />
      ))}
    </div>
  );
}

function Circles({ count = 5, size = 'md', onSlotClick }) {
  const cls = size === 'lg' ? 'w-[44px] h-[44px]' : size === 'sm' ? 'w-[32px] h-[32px]' : 'w-[36px] h-[36px]';
  return (
    <div className="flex gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          onClick={() => onSlotClick?.(i)}
          className={`${cls} rounded-full border border-black/50 bg-black/60 hover:border-white/30 hover:bg-black/70 transition-colors cursor-pointer`}
        />
      ))}
    </div>
  );
}

export default function InventoryGrid() {
  const [overlayItem, setOverlayItem] = useState(null);

  const openOverlay = (section, index) => {
    setOverlayItem({
      id: `${section}-${index}`,
      name: `${section} Slot ${index + 1}`,
      image: 'https://images.unsplash.com/photo-1606112219348-204d7d8b94ee?w=800',
      type: section,
      rarity: 'Common',
      game: 'Inventory',
      level: 1,
      marketPrice: 100,
      power: 10,
      description: 'Empty slot ready to equip.'
    });
  };

  return (
    <div className="w-full">
      {/* Responsive grid mimicking the provided layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left column: Armor */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Armor</SectionHeader>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                onClick={() => openOverlay('Armor', i)}
                className="w-[46px] h-[46px] rounded-md border border-black/50 bg-black/60 hover:border-white/30 hover:bg-black/70 cursor-pointer"
              />
            ))}
          </div>
        </div>

        {/* Top center: Weapons */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Weapons</SectionHeader>
          <Squares count={5} size="lg" onSlotClick={(i) => openOverlay('Weapons', i)} />
        </div>

        {/* Top right: Genre */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Genre</SectionHeader>
          <Squares count={4} onSlotClick={(i) => openOverlay('Genre', i)} />
        </div>

        {/* Aspects - bottom left */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Aspects</SectionHeader>
          <Circles count={5} onSlotClick={(i) => openOverlay('Aspects', i)} />
        </div>

        {/* Artifacts - bottom middle */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Artifacts</SectionHeader>
          <Squares count={6} onSlotClick={(i) => openOverlay('Artifacts', i)} />
        </div>

        {/* Bottom right: Genre */}
        <div className="col-span-12 sm:col-span-4">
          <SectionHeader>Genre</SectionHeader>
          <Squares count={4} onSlotClick={(i) => openOverlay('Genre', i)} />
        </div>
      </div>
    </div>
  );
}