import React, { useEffect, useState } from 'react';
import { GEAR_CATEGORIES, setSelected, equipItem, unequipItem } from './equipmentStore';
import { INVENTORY, getEquippedItem } from './inventoryData';
import GearSlotsPanel from './GearSlotsPanel';
import GearInventoryGrid from './GearInventoryGrid';
import GearDetailPanel from './GearDetailPanel';
import GearActionsBar from './GearActionsBar';
import EquipmentSlotsColumn from './EquipmentSlotsColumn';
import InventoryItemContextMenu from './InventoryItemContextMenu';
import EnchantmentPanel from './EnchantmentPanel';
import CompanionFusionCard from './CompanionFusionCard';
import CompanionGearSlotsPanel from './CompanionGearSlotsPanel';
import CompanionGearInventoryGrid from './CompanionGearInventoryGrid';
import CompanionGearDetailPanel from './CompanionGearDetailPanel';
import {
  subscribeFusion,
  getFusionState,
  setSelectedCompanionSlot,
  equipCompanionGear,
} from './companionFusionStore';
import { Sparkles } from 'lucide-react';

const COMPANION_SLOT_LABELS = { saddle: 'Saddle', armor: 'Armor', charm: 'Charm' };

/**
 * Where Winds Meet–style Gear tab:
 *  LEFT   : Equipment slot grid (top) + selected category's own inventory grid
 *  CENTER : Detail panel for the inspected item
 *  MIDDLE : Vertical equipment slots column (between detail panel and 3D model)
 *  BOTTOM : Action bar
 *
 * Each category keeps its OWN inventory slots — nothing is mixed.
 * Right-click an inventory item to Equip / Unequip / Inspect it.
 */
export default function GearTab({ state }) {
  const selectedCat = GEAR_CATEGORIES.find((c) => c.id === state.selectedGearCategory)
    || GEAR_CATEGORIES[0];

  // Track inspected item per-category; default to the equipped one
  const [inspectedByCat, setInspectedByCat] = useState({});
  const inspectedId = inspectedByCat[selectedCat.id]
    || getEquippedItem(selectedCat.id)?.id
    || null;
  const inspectedItem = (INVENTORY[selectedCat.id] || []).find((it) => it.id === inspectedId) || null;

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState(null); // { item, x, y }

  // Enchantment overlay state
  const [enchantOpen, setEnchantOpen] = useState(false);

  // Fusion mode (player vs companion view)
  const [fusion, setFusion] = useState(getFusionState());
  useEffect(() => subscribeFusion(setFusion), []);
  const isCompanionMode = fusion.mode === 'companion';

  // Track inspected companion item per-slot
  const [inspectedCompanionBySlot, setInspectedCompanionBySlot] = useState({});
  const companionSlotId = fusion.selectedSlot || 'saddle';
  const inspectedCompanionId = inspectedCompanionBySlot[companionSlotId]
    || fusion.equippedGear?.[companionSlotId]
    || null;

  const handleContextItem = (item, x, y) => {
    setContextMenu({ item, x, y });
  };

  return (
    <>
      {/* LEFT — slots panel + per-category inventory grid.
          Swaps to companion slots/inventory when fusion mode is active. */}
      <div className="absolute left-6 top-24 bottom-20 w-[380px] pointer-events-auto">
        {isCompanionMode ? (
          <>
            <CompanionGearSlotsPanel
              selectedSlotId={companionSlotId}
              equippedGear={fusion.equippedGear}
              onSelectSlot={(id) => setSelectedCompanionSlot(id)}
            />
            <div className="mt-6">
              <CompanionGearInventoryGrid
                slotId={companionSlotId}
                slotLabel={COMPANION_SLOT_LABELS[companionSlotId] || companionSlotId}
                equippedGear={fusion.equippedGear}
                selectedItemId={inspectedCompanionId}
                onSelectItem={(id) =>
                  setInspectedCompanionBySlot((prev) => ({ ...prev, [companionSlotId]: id }))
                }
                onEquipItem={(id) => equipCompanionGear(companionSlotId, id)}
              />
            </div>
          </>
        ) : (
          <>
            <GearSlotsPanel
              selectedCategoryId={selectedCat.id}
              onSelectCategory={(id) => setSelected('selectedGearCategory', id)}
            />

            <div className="mt-6">
              <GearInventoryGrid
                categoryId={selectedCat.id}
                categoryLabel={selectedCat.label}
                selectedItemId={inspectedId}
                onSelectItem={(id) =>
                  setInspectedByCat((prev) => ({ ...prev, [selectedCat.id]: id }))
                }
                onContextItem={handleContextItem}
              />
            </div>
          </>
        )}
      </div>

      {/* CENTER — item detail panel overlays directly on top of the 3D scene */}
      <div
        className="absolute top-24 bottom-32 pointer-events-auto px-5 py-4"
        style={{
          left: 410,
          width: 340,
          background:
            'linear-gradient(90deg, rgba(15,17,22,0.78) 0%, rgba(15,17,22,0.55) 70%, rgba(15,17,22,0) 100%)',
        }}
      >
        {isCompanionMode ? (
          <CompanionGearDetailPanel
            slotId={companionSlotId}
            itemId={inspectedCompanionId}
            slotLabel={COMPANION_SLOT_LABELS[companionSlotId] || companionSlotId}
          />
        ) : (
          <GearDetailPanel item={inspectedItem} />
        )}
      </div>

      {/* MIDDLE — vertical equipment slots column (player only) */}
      {!isCompanionMode && (
        <div
          className="absolute top-28 pointer-events-auto"
          style={{ left: 760 }}
        >
          <EquipmentSlotsColumn
            selectedCategoryId={selectedCat.id}
            onSelectCategory={(id) => {
              const equipped = getEquippedItem(id);
              if (equipped) {
                setInspectedByCat((prev) => ({ ...prev, [id]: equipped.id }));
              }
            }}
          />
        </div>
      )}

      {/* Companion fusion card — to the RIGHT of the 3D player model.
          Always visible; clicking ATTEND swaps the gear view to companion mode. */}
      <CompanionFusionCard />

      {/* Floating ENCHANT button above the 3D model's head */}
      <button
        onClick={() => setEnchantOpen((v) => !v)}
        className="absolute pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] tracking-widest font-semibold transition-all hover:scale-105"
        style={{
          left: '70%',
          top: 110,
          transform: 'translateX(-50%)',
          background: enchantOpen
            ? 'linear-gradient(180deg, rgba(251,191,36,0.95), rgba(217,119,6,0.9))'
            : 'rgba(15,17,22,0.55)',
          color: enchantOpen ? '#1a1208' : 'rgba(251,191,36,0.95)',
          border: '1px solid rgba(251,191,36,0.45)',
          backdropFilter: 'blur(14px) saturate(140%)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          boxShadow: enchantOpen
            ? '0 6px 18px rgba(251,191,36,0.35)'
            : '0 4px 14px rgba(0,0,0,0.4)',
        }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        ENCHANT
      </button>

      {/* Enchantment overlay — overlaps the 3D model area */}
      {enchantOpen && (
        <EnchantmentPanel
          item={inspectedItem ? { ...inspectedItem, categoryLabel: selectedCat.label } : { name: 'No Equipment', type: selectedCat.label }}
          onClose={() => setEnchantOpen(false)}
        />
      )}

      <GearActionsBar />

      {/* Right-click context menu */}
      {contextMenu && (
        <InventoryItemContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onEquip={() => equipItem(selectedCat.id, contextMenu.item.id)}
          onUnequip={() => unequipItem(selectedCat.id, contextMenu.item.id)}
          onInspect={() =>
            setInspectedByCat((prev) => ({ ...prev, [selectedCat.id]: contextMenu.item.id }))
          }
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}