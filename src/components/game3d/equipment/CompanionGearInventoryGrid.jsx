import React from 'react';
import { COMPANION_GEAR } from '../companionData';

const RARITY_COLOR = {
  common:    '#9ca3af',
  rare:      '#60a5fa',
  epic:      '#c084fc',
  legendary: '#fbbf24',
};

/**
 * Companion equivalent of GearInventoryGrid — shows the items for the
 * currently selected companion gear slot. Click an item to inspect it,
 * click an equipped item to unequip it.
 */
export default function CompanionGearInventoryGrid({
  slotId,
  slotLabel,
  equippedGear,
  selectedItemId,
  onSelectItem,
  onEquipItem,
}) {
  const items = COMPANION_GEAR[slotId] || [];
  const equippedId = equippedGear?.[slotId] || null;

  return (
    <div>
      <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/50 mb-2">
        {slotLabel} Inventory
      </div>
      <div className="grid grid-cols-5 gap-2">
        {items.map((item) => {
          const isSelected = item.id === selectedItemId;
          const isEquipped = item.id === equippedId;
          const color = RARITY_COLOR[item.rarity] || RARITY_COLOR.common;
          return (
            <button
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              onDoubleClick={() => onEquipItem(item.id)}
              title={`${item.name}\n(Double-click to equip)`}
              className={`relative aspect-square rounded-sm transition-all flex items-center justify-center ${
                isSelected
                  ? 'border-2 border-blue-300/80 bg-white/[0.08]'
                  : 'border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/25'
              }`}
              style={isEquipped ? { boxShadow: `inset 0 0 0 1px ${color}66` } : undefined}
            >
              <span
                className="text-[10px] font-bold tracking-wider px-1 text-center leading-tight"
                style={{ color }}
              >
                {item.name.split(' ')[0]}
              </span>
              {isEquipped && (
                <span
                  className="absolute top-1 right-1 w-0 h-0"
                  style={{
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderBottom: '5px solid #4ade80',
                  }}
                />
              )}
            </button>
          );
        })}
        {/* Fill empty slots for visual symmetry */}
        {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, i) => (
          <div
            key={`empty_${i}`}
            className="aspect-square rounded-sm border border-white/5 bg-white/[0.02]"
          />
        ))}
      </div>
    </div>
  );
}