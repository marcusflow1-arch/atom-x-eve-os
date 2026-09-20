import React, { useEffect, useState } from 'react';
import { GEAR_CATEGORIES } from './equipmentStore';
import { CATEGORY_ICONS } from './inventoryData';
import { getLootInventory, subscribeLootInventory } from '../lootStore';
import {
  getEquippedAXEItemInCategory,
  subscribeAXEEquipmentInventory,
} from '../axe/equipment/AXEEquipmentInventoryStore';

const EXTRA_SLOTS = [
  { id: '__skills', label: 'Skills', icon: '⚔️' },
  { id: '__materials', label: 'Materials', icon: '💠' },
];

export default function GearSlotsPanel({ selectedCategoryId, onSelectCategory }) {
  const [inv, setInv] = useState(getLootInventory());
  const [, setEquipmentVersion] = useState(0);

  useEffect(() => subscribeLootInventory(setInv), []);
  useEffect(() => subscribeAXEEquipmentInventory(() => {
    setEquipmentVersion((v) => v + 1);
  }), []);

  const skillCount = (inv.skill || []).length;
  const materialCount = (inv.material || []).length;

  return (
    <div className="grid grid-cols-5 gap-2">
      {GEAR_CATEGORIES.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.id];
        const equipped = getEquippedAXEItemInCategory(cat.id);
        const isSelected = cat.id === selectedCategoryId;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            title={equipped ? `${cat.label}: ${equipped.name}` : cat.label}
            className={`relative aspect-square rounded-sm transition-all flex items-center justify-center ${
              isSelected
                ? 'border-2 border-white/70 bg-white/[0.10]'
                : 'border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/25'
            }`}
          >
            {Icon && (
              <Icon className={`w-6 h-6 ${equipped ? 'text-white/80' : 'text-white/25'}`} />
            )}
            {equipped && (
              <span
                className="absolute top-1 right-1 w-0 h-0"
                style={{
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderBottom: '5px solid #86efac',
                }}
              />
            )}
          </button>
        );
      })}

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
                ? 'border-2 border-white/65 bg-white/[0.09]'
                : 'border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/25'
            }`}
          >
            <span className="text-base leading-none">{slot.icon}</span>
            {count > 0 && (
              <span className="text-[8px] font-bold leading-none text-white/55">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
