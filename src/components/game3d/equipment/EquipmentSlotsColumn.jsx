import React from 'react';
import { GEAR_CATEGORIES, setSelected, unequipItem } from './equipmentStore';
import { CATEGORY_ICONS, getEquippedItem, getAllEquippedInCategory } from './inventoryData';

/**
 * Vertical column of one slot per gear category, displayed between the
 * detail panel and the 3D model. Each row also shows two empty expansion
 * "slots" to the right with a labeled divider above them.
 *
 * Left-click the main slot selects the category in the gear tab.
 * Right-click on a filled main slot unequips the item.
 */
export default function EquipmentSlotsColumn({ selectedCategoryId, onSelectCategory }) {
  return (
    <div className="flex flex-col gap-2">
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
          <div key={cat.id} className="flex items-end gap-2">
            {/* Main equipment slot */}
            <button
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
                  className={`w-5 h-5 ${equipped ? 'text-white/90' : 'text-white/30'}`}
                />
              )}
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
              {cat.slots > 1 && (
                <span className="absolute bottom-0 right-0.5 text-[9px] text-white/50">
                  {allEquipped.length}/{cat.slots}
                </span>
              )}
            </button>

            {/* Expansion slots — one box per available slot for this category */}
            <div className="flex flex-col items-center">
              <div
                className="flex items-center gap-1 mb-0.5"
                style={{ width: `${cat.slots * 48 + (cat.slots - 1) * 6}px`, minWidth: '100px' }}
              >
                <span className="h-px flex-1 bg-white/15" />
                <span className="text-[9px] tracking-widest uppercase text-white/45">Slots</span>
                <span className="h-px flex-1 bg-white/15" />
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: cat.slots }).map((_, i) => {
                  const slotItem = allEquipped[i];
                  return (
                    <div
                      key={i}
                      title={slotItem ? slotItem.name : `${cat.label} slot ${i + 1} — empty`}
                      className={`w-12 h-12 rounded-md flex items-center justify-center ${
                        slotItem
                          ? 'border border-white/25 bg-white/[0.08]'
                          : 'border border-dashed border-white/15 bg-white/[0.03]'
                      }`}
                    >
                      {slotItem && Icon && <Icon className="w-5 h-5 text-white/90" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}