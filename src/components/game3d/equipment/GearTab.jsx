import React, { useState } from 'react';
import { GEAR_CATEGORIES, setSelected } from './equipmentStore';
import { INVENTORY, getEquippedItem } from './inventoryData';
import GearSlotsPanel from './GearSlotsPanel';
import GearInventoryGrid from './GearInventoryGrid';
import GearDetailPanel from './GearDetailPanel';
import GearActionsBar from './GearActionsBar';

/**
 * Where Winds Meet–style Gear tab:
 *  LEFT  : Equipment slot grid (top) + selected category's own inventory grid
 *  RIGHT : Detail panel for the currently inspected item
 *  BOTTOM: Action bar (Return / Filter / Obtain More / Enhance / Repair / Replace)
 *
 * Each category (Weapon, Rings, Helm…) keeps its OWN inventory slots —
 * nothing is mixed into a single shared bag.
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
          />
        </div>
      </div>

      {/* CENTER — item detail panel overlays directly on top of the 3D scene
          with a soft gradient fade so it blends into the character backdrop instead
          of looking like a separate boxed panel. */}
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

      <GearActionsBar />
    </>
  );
}