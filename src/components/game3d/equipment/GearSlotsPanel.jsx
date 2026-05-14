import React from 'react';
import { GEAR_CATEGORIES } from './equipmentStore';
import { CATEGORY_ICONS, getEquippedItem } from './inventoryData';

/**
 * Top-left "equipped slots" panel — one button per gear category.
 * Clicking a category opens its private inventory grid below.
 */
export default function GearSlotsPanel({ selectedCategoryId, onSelectCategory }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {GEAR_CATEGORIES.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.id];
        const equipped = getEquippedItem(cat.id);
        const isSelected = cat.id === selectedCategoryId;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            title={cat.label}
            className={`relative aspect-square rounded-sm transition-all flex items-center justify-center ${
              isSelected
                ? 'border-2 border-amber-300/80 bg-white/[0.08]'
                : 'border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/25'
            }`}
          >
            {Icon && (
              <Icon className={`w-6 h-6 ${equipped ? 'text-white/80' : 'text-white/25'}`} />
            )}
            {equipped && (
              <span className="absolute top-1 right-1 w-0 h-0"
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
    </div>
  );
}