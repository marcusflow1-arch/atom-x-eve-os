import React from 'react';
import { Anchor, Shield, Gem } from 'lucide-react';
import { getActiveCompanion, setSelectedCompanionSlot, equipCompanionGear, getCompanionItem } from './companionFusionStore';

const SLOT_ICONS  = { saddle: Anchor, armor: Shield, charm: Gem };
const SLOT_LABELS = { saddle: 'Saddle', armor: 'Armor', charm: 'Charm' };

/**
 * Vertical column of companion equipment slots — mirrors EquipmentSlotsColumn
 * but for companion gear (saddle / armor / charm).
 * Left-click selects the slot in the gear tab.
 * Right-click on a filled main slot unequips the item.
 */
export default function CompanionEquipmentSlotsColumn({ selectedSlotId, equippedGear, onSelectSlot }) {
  const companion = getActiveCompanion();
  const slots = companion?.gearSlots || ['saddle', 'armor', 'charm'];

  return (
    <div className="flex flex-col gap-2">
      {slots.map((slotId) => {
        const Icon = SLOT_ICONS[slotId] || Gem;
        const label = SLOT_LABELS[slotId] || slotId;
        const equippedId = equippedGear?.[slotId] || null;
        const equipped = equippedId ? getCompanionItem(slotId, equippedId) : null;
        const isActive = slotId === selectedSlotId;

        const handleContext = (e) => {
          e.preventDefault();
          if (equipped) equipCompanionGear(slotId, equipped.id);
        };

        return (
          <div key={slotId} className="flex items-end gap-2">
            <button
              onClick={() => {
                setSelectedCompanionSlot(slotId);
                onSelectSlot?.(slotId);
              }}
              onContextMenu={handleContext}
              title={equipped ? `${label}: ${equipped.name} (right-click to unequip)` : `${label} — empty`}
              className={`relative w-12 h-12 rounded-md flex items-center justify-center transition-all ${
                isActive
                  ? 'border-2 border-blue-300/80 bg-white/[0.10]'
                  : equipped
                  ? 'border border-white/25 bg-white/[0.08] hover:bg-white/[0.14] hover:border-white/40'
                  : 'border border-dashed border-white/15 bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              <Icon className={`w-5 h-5 ${equipped ? 'text-white/90' : 'text-white/30'}`} />
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
            </button>

            <div className="flex flex-col items-center">
              <div
                className="flex items-center gap-1 mb-0.5"
                style={{ width: '100px' }}
              >
                <span className="h-px flex-1 bg-white/15" />
                <span className="text-[9px] tracking-widest uppercase text-white/45">{label}</span>
                <span className="h-px flex-1 bg-white/15" />
              </div>
              <div className="flex gap-1.5">
                <div
                  title={equipped ? equipped.name : `${label} slot — empty`}
                  className={`w-12 h-12 rounded-md flex items-center justify-center ${
                    equipped
                      ? 'border border-white/25 bg-white/[0.08]'
                      : 'border border-dashed border-white/15 bg-white/[0.03]'
                  }`}
                >
                  {equipped && <Icon className="w-5 h-5 text-white/90" />}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}