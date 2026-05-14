import React from 'react';
import { GEAR_CATEGORIES, setSelected, unequipItem } from './equipmentStore';
import { CATEGORY_ICONS, getEquippedItem, getAllEquippedInCategory } from './inventoryData';

/**
 * Vertical column of one slot per gear category, displayed between the
 * detail panel and the 3D model. Shows the currently equipped item for
 * each category. Left-click selects the category in the gear tab.
 * Right-click on a filled slot unequips the item.
 */
export default function EquipmentSlotsColumn({ selectedCategoryId, onSelectCategory }) {
  return (
    <div className="flex flex-col gap-2 items-center">
      {GEAR_CATEGORIES.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.id];
        const equipped = getEquippedItem(cat.id);
        const allEquipped = getAllEquippedInCategory(cat.id);
        const isActive = cat.id === selectedCategoryId;

        const handleContext = (e) => {
          e.preventDefault();
          if (equipped) {
            unequipItem(cat.id, equipped.id);
          }
        };

        return (
          <button
            key={cat.id}
            onClick={() => {
              setSelected('selectedGearCategory', cat.id);
              onSelectCategory?.(cat.id);
            }}
            onContextMenu={handleContext}
            title={equipped ? `${cat.label}: ${equipped.name} (right-click to unequip)` : `${cat.label} — empty`}
            className={`relative w-12 h-12 rounded-md flex items-center justify-center transition-all ${
              isActive
                ? 'border-2 border-amber-300/80 bg-white/[0.10]'
                : equipped
                ? 'border border-white/25 bg-white/[0.08] hover:bg-white/[0.14] hover:border-white/40'
                : 'border border-dashed border-white/15 bg-white/[0.03] hover:bg-white/[0.06]'
            }`}
          >
            {Icon && (
              <Icon
                className={`w-5 h-5 ${
                  equipped ? 'text-white/90' : 'text-white/30'
                }`}
              />
            )}
            {/* Equipped indicator */}
            {equipped && (
              <span
                className="absolute top-0.5 right-0.5 w-0 h-0"
                style={{
                  borderLeft: '3px solid transparent',
                  borderRight: '3px solid transparent',
                  borderBottom: '4px solid #4ade80',
                }}
              />
            )}
            {/* Multi-slot count (e.g. 2/3 rings) */}
            {cat.slots > 1 && (
              <span className="absolute bottom-0 right-0.5 text-[9px] text-white/50">
                {allEquipped.length}/{cat.slots}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}