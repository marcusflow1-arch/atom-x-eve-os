import React from 'react';
import { Anchor, Zap, Crown, Shirt, Shield, Clover, Wind, Gem } from 'lucide-react';
import { getCompanionItem } from './companionFusionStore';

const RARITY_COLOR = {
  common:    '#9ca3af',
  rare:      '#60a5fa',
  epic:      '#c084fc',
  legendary: '#fbbf24',
};

const ICON_MAP = { Anchor, Zap, Crown, Shirt, Shield, Clover, Wind, Gem };

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
  const Icon = ICON_MAP[item.icon] || Gem;

  return (
    <div className="h-full flex flex-col">
      <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">
        Companion · {slotLabel}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center border"
          style={{ borderColor: `${color}66`, background: `${color}1a` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div
          className="text-xl font-bold tracking-wider"
          style={{ color }}
        >
          {item.name}
        </div>
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