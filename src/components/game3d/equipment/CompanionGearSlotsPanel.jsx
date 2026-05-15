import React from 'react';
import { Anchor, Shield, Gem } from 'lucide-react';
import { getActiveCompanion } from './companionFusionStore';

const SLOT_ICONS = {
  saddle: Anchor,
  armor:  Shield,
  charm:  Gem,
};

const SLOT_LABELS = {
  saddle: 'Saddle',
  armor:  'Armor',
  charm:  'Charm',
};

/**
 * Slot picker for companion gear — mirrors GearSlotsPanel but uses companion
 * gear slot ids (saddle/armor/charm) from the active companion definition.
 */
export default function CompanionGearSlotsPanel({ selectedSlotId, equippedGear, onSelectSlot }) {
  const companion = getActiveCompanion();
  const slots = companion?.gearSlots || ['saddle', 'armor', 'charm'];

  return (
    <div className="grid grid-cols-5 gap-2">
      {slots.map((slotId) => {
        const Icon = SLOT_ICONS[slotId] || Gem;
        const isSelected = slotId === selectedSlotId;
        const equipped = !!equippedGear?.[slotId];
        return (
          <button
            key={slotId}
            onClick={() => onSelectSlot(slotId)}
            title={SLOT_LABELS[slotId] || slotId}
            className={`relative aspect-square rounded-sm transition-all flex items-center justify-center ${
              isSelected
                ? 'border-2 border-blue-300/80 bg-white/[0.08]'
                : 'border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/25'
            }`}
          >
            <Icon className={`w-6 h-6 ${equipped ? 'text-white/80' : 'text-white/25'}`} />
            {equipped && (
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
    </div>
  );
}