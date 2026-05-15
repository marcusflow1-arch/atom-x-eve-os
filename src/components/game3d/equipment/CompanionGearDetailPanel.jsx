import React from 'react';
import { getCompanionItem } from './companionFusionStore';

const RARITY_COLOR = {
  common:    '#9ca3af',
  rare:      '#60a5fa',
  epic:      '#c084fc',
  legendary: '#fbbf24',
};

/**
 * Detail panel for the inspected companion gear item.
 * Mirrors the visual treatment of GearDetailPanel.
 */
export default function CompanionGearDetailPanel({ slotId, itemId, slotLabel }) {
  const item = getCompanionItem(slotId, itemId);

  if (!item) {
    return (
      <div className="h-full flex flex-col">
        <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">
          {slotLabel}
        </div>
        <div className="text-white/30 text-sm mt-3">No item selected</div>
      </div>
    );
  }

  const color = RARITY_COLOR[item.rarity] || RARITY_COLOR.common;

  return (
    <div className="h-full flex flex-col">
      <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">
        Companion · {slotLabel}
      </div>
      <div
        className="text-xl font-bold tracking-wider mt-1"
        style={{ color }}
      >
        {item.name}
      </div>
      <div className="text-[10px] tracking-widest uppercase text-white/40 mt-0.5">
        {item.rarity}
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-white/70">
        {typeof item.speedBonus === 'number' && item.speedBonus > 0 && (
          <div>
            <span className="text-white/40">Speed</span>
            <span className="ml-2 text-emerald-300">+{Math.round(item.speedBonus * 100)}%</span>
          </div>
        )}
        {typeof item.defense === 'number' && (
          <div>
            <span className="text-white/40">Defense</span>
            <span className="ml-2 text-amber-200">+{item.defense}</span>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs leading-relaxed text-white/55 italic">
        {item.description}
      </div>
    </div>
  );
}