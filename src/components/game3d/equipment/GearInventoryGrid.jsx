import React from 'react';
import { CATEGORY_ICONS, INVENTORY } from './inventoryData';

/**
 * The private inventory grid for the currently selected category.
 * Each category has its OWN slots — rings live with rings, weapons with weapons.
 *
 * Left-click selects (inspects) an item.
 * Right-click opens a context menu (handled by parent via onContextItem).
 */
export default function GearInventoryGrid({
  categoryId,
  categoryLabel,
  selectedItemId,
  onSelectItem,
  onContextItem,
}) {
  const items = INVENTORY[categoryId] || [];
  const Icon = CATEGORY_ICONS[categoryId];
  const totalSlots = 35;

  return (
    <div>
      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-white/60 text-[12px] tracking-[0.25em] uppercase">{categoryLabel}</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid grid-cols-7 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
        {Array.from({ length: totalSlots }).map((_, i) => {
          const item = items[i];
          const isSelected = item && item.id === selectedItemId;
          return (
            <button
              key={i}
              onClick={() => item && onSelectItem(item.id)}
              onContextMenu={(e) => {
                if (!item) return;
                e.preventDefault();
                onContextItem?.(item, e.clientX, e.clientY);
              }}
              disabled={!item}
              className={`relative aspect-square rounded-sm transition-all flex items-center justify-center ${
                isSelected
                  ? 'border-2 border-amber-300/80 bg-white/[0.10]'
                  : item
                  ? 'border border-white/15 bg-white/[0.06] hover:bg-white/[0.10] hover:border-white/30 cursor-pointer'
                  : 'border border-white/10 bg-white/[0.03]'
              }`}
            >
              {item && Icon && <Icon className="w-5 h-5 text-white/70" />}
              {item?.equipped && (
                <span
                  className="absolute top-0.5 right-0.5 w-0 h-0"
                  style={{
                    borderLeft: '3px solid transparent',
                    borderRight: '3px solid transparent',
                    borderBottom: '4px solid #4ade80',
                  }}
                />
              )}
              {item?.locked && (
                <span className="absolute bottom-0.5 right-0.5 text-[8px] text-amber-300">🔒</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}