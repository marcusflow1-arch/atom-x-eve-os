import React, { useEffect, useState } from 'react';
import { Zap, Gem } from 'lucide-react';
import { GEAR_CATEGORIES } from './equipmentStore';
import { CATEGORY_ICONS, getEquippedItem } from './inventoryData';
import { getLootInventory, subscribeLootInventory } from '../lootStore';

// Extra virtual slot definitions (not gear — loot inventory categories)
const EXTRA_SLOTS = [
  { id: '__skills',    label: 'Skills',    icon: '⚔️' },
  { id: '__materials', label: 'Materials', icon: '💠' },
];

/**
 * Top-left "equipped slots" panel — one button per gear category,
 * plus two extra slots for Skills and Materials loot inventories.
 * Clicking a category opens its private inventory grid below.
 */
export default function GearSlotsPanel({ selectedCategoryId, onSelectCategory }) {
  const [inv, setInv] = useState(getLootInventory());
  useEffect(() => subscribeLootInventory(setInv), []);

  const skillCount    = (inv['skill']    || []).length;
  const materialCount = (inv['material'] || []).length;

  return (
    <div className="grid grid-cols-5 gap-2">
      {/* Standard gear category slots */}
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

      {/* Extra loot inventory slots — Skills & Materials */}
      {EXTRA_SLOTS.map((slot) => {
        const isSelected = slot.id === selectedCategoryId;
        const count = slot.id === '__skills' ? skillCount : materialCount;
        return (
          <button
            key={slot.id}
            onClick={() => onSelectCategory(slot.id)}
            title={slot.label}
            className={`relative aspect-square rounded-sm transition-all flex flex-col items-center justify-center gap-0.5 ${
              isSelected
                ? 'border-2 border-cyan-400/80 bg-cyan-400/[0.08]'
                : 'border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/25'
            }`}
          >
            <span className="text-base leading-none">{slot.icon}</span>
            {count > 0 && (
              <span
                className="text-[8px] font-bold leading-none"
                style={{ color: isSelected ? '#67e8f9' : 'rgba(255,255,255,0.45)' }}
              >
                {count}
              </span>
            )}
            {/* Cyan corner pip when has items */}
            {count > 0 && (
              <span className="absolute top-1 right-1 w-0 h-0"
                style={{
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderBottom: '5px solid #22d3ee',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}