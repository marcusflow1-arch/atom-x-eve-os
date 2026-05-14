import React, { useState } from 'react';
import { GEAR_CATEGORIES, setSelected, equipItem, unequipItem } from './equipmentStore';
import { INVENTORY, getEquippedItem } from './inventoryData';
import GearSlotsPanel from './GearSlotsPanel';
import GearInventoryGrid from './GearInventoryGrid';
import GearDetailPanel from './GearDetailPanel';
import GearActionsBar from './GearActionsBar';
import EquipmentSlotsColumn from './EquipmentSlotsColumn';
import InventoryItemContextMenu from './InventoryItemContextMenu';

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

  const handleContextItem = (item, x, y) => {
    setContextMenu({ item, x, y });
  };

  return (
    <>
      {/* LEFT — slots panel + per-category inventory grid */}
      <div className="absolute left-6 top-24 bottom-20 w-[380px] pointer-events-auto">
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
        <GearDetailPanel item={inspectedItem} />
      </div>

      {/* MIDDLE — vertical equipment slots column between detail panel and 3D model */}
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