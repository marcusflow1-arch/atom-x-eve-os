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
import CompanionEquipmentSlotsColumn from './CompanionEquipmentSlotsColumn';
import CompanionSkillTreeOverlay from './CompanionSkillTreeOverlay';
import { getCompanionById } from '../companionData';
import { getCompanionState } from '../companionStore';
import {
  subscribeFusion,
  getFusionState,
  setSelectedCompanionSlot,
  equipCompanionGear,
  getCompanionItem,
} from './companionFusionStore';
import { Sparkles, GitBranch } from 'lucide-react';
import { getLootInventory, subscribeLootInventory, LOOT_RARITIES } from '../lootStore';

const COMPANION_SLOT_LABELS = { saddle: 'Saddle', armor: 'Armor', charm: 'Charm' };

// ── Inline loot inventory grid for Skills / Materials extra slots ──────────
function LootSlotInventory({ category, label, inv, selected, onSelect }) {
  const items = inv[category] || [];
  return (
    <div>
      <div className="text-[10px] text-white/40 tracking-[0.15em] uppercase mb-2 flex items-center gap-1.5">
        {label}
        <span className="text-white/25">— {items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>
      {items.length === 0 ? (
        <div className="text-white/25 text-xs text-center py-6">
          No {category === 'skill' ? 'skill scrolls' : 'materials'} collected yet.<br />
          <span className="text-[10px] opacity-70">Defeat enemies to find drops.</span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
          {items.map((item, idx) => {
            const r = LOOT_RARITIES[item.rarity] || LOOT_RARITIES.common;
            const isSel = selected?.dropId === item.dropId && selected?.collectedAt === item.collectedAt;
            return (
              <button
                key={`${item.dropId}-${idx}`}
                onClick={() => onSelect(isSel ? null : item)}
                title={item.name}
                className="aspect-square rounded-lg flex flex-col items-center justify-center text-xl border transition-all p-1 gap-0.5"
                style={isSel ? {
                  background: `${r.color}22`,
                  borderColor: `${r.color}65`,
                  boxShadow: `0 0 12px ${r.color}30`,
                } : {
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.10)',
                }}
              >
                <span>{item.icon}</span>
                <span className="text-[7px] text-white/45 truncate w-full text-center leading-tight">{item.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Detail view for a selected loot item ─────────────────────────────────
function LootItemDetail({ item }) {
  const r = LOOT_RARITIES[item.rarity] || LOOT_RARITIES.common;
  return (
    <div className="flex flex-col gap-4">
      <div
        className="p-4 rounded-xl border flex flex-col gap-3"
        style={{ background: `${r.color}0e`, borderColor: `${r.color}45`, boxShadow: `0 0 22px ${r.color}20` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl border"
            style={{ background: `${r.color}20`, borderColor: `${r.color}50` }}
          >
            {item.icon}
          </div>
          <div>
            <div className="text-white font-bold text-base">{item.name}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest border"
                style={{ color: r.color, borderColor: `${r.color}55`, background: `${r.color}18` }}>
                {r.label?.toUpperCase()}
              </span>
              <span className="text-[9px] text-white/35 border border-white/10 px-1 py-0.5 rounded capitalize">{item.category}</span>
            </div>
          </div>
        </div>
        <div className="text-white/40 text-[10px]">
          Collected {new Date(item.collectedAt).toLocaleTimeString()}
        </div>
        <div className="text-white/50 text-xs leading-relaxed">
          {item.category === 'skill' && 'A skill scroll. Open the Skills tab to equip it in your loadout.'}
          {item.category === 'material' && 'An upgrade material used for enchanting gear and evolving skills.'}
        </div>
      </div>
    </div>
  );
}

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
  const isExtraSlot = state.selectedGearCategory === '__skills' || state.selectedGearCategory === '__materials';
  const selectedCat = GEAR_CATEGORIES.find((c) => c.id === state.selectedGearCategory)
    || GEAR_CATEGORIES[0];

  // Track inspected item per-category; default to the equipped one
  const [inspectedByCat, setInspectedByCat] = useState({});
  const inspectedId = !isExtraSlot
    ? (inspectedByCat[selectedCat.id] || getEquippedItem(selectedCat.id)?.id || null)
    : null;
  const inspectedItem = !isExtraSlot
    ? ((INVENTORY[selectedCat.id] || []).find((it) => it.id === inspectedId) || null)
    : null;

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState(null); // { item, x, y }

  // Enchantment overlay state
  const [enchantOpen, setEnchantOpen] = useState(false);
  // Companion skill tree overlay state — opened by the button at the far-right
  // of the same horizontal line as the Enchant button (above the companion preview).
  const [skillTreeOpen, setSkillTreeOpen] = useState(false);

  // Fusion mode (player vs companion view)
  const [fusion, setFusion] = useState(getFusionState());
  useEffect(() => subscribeFusion(setFusion), []);
  const isCompanionMode = fusion.mode === 'companion';

  // Loot inventory for Skills / Materials extra slots
  const [lootInv, setLootInv] = useState(getLootInventory());
  useEffect(() => subscribeLootInventory(setLootInv), []);
  const [selectedLootItem, setSelectedLootItem] = useState(null);

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
              selectedCategoryId={state.selectedGearCategory}
              onSelectCategory={(id) => {
                setSelectedLootItem(null);
                setSelected('selectedGearCategory', id);
              }}
            />

            <div className="mt-6">
              {state.selectedGearCategory === '__skills' || state.selectedGearCategory === '__materials' ? (
                <LootSlotInventory
                  category={state.selectedGearCategory === '__skills' ? 'skill' : 'material'}
                  label={state.selectedGearCategory === '__skills' ? '⚔️ Skills' : '💠 Materials'}
                  inv={lootInv}
                  selected={selectedLootItem}
                  onSelect={setSelectedLootItem}
                />
              ) : (
                <GearInventoryGrid
                  categoryId={selectedCat.id}
                  categoryLabel={selectedCat.label}
                  selectedItemId={inspectedId}
                  onSelectItem={(id) =>
                    setInspectedByCat((prev) => ({ ...prev, [selectedCat.id]: id }))
                  }
                  onContextItem={handleContextItem}
                />
              )}
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
        ) : isExtraSlot && selectedLootItem ? (
          <LootItemDetail item={selectedLootItem} />
        ) : (
          <GearDetailPanel item={inspectedItem} />
        )}
      </div>

      {/* MIDDLE — vertical equipment slots column.
          Player slots in player mode, companion slots in companion mode. */}
      <div
        className="absolute top-28 pointer-events-auto"
        style={{ left: 760 }}
      >
        {isCompanionMode ? (
          <CompanionEquipmentSlotsColumn
            selectedSlotId={companionSlotId}
            equippedGear={fusion.equippedGear}
            onSelectSlot={(id) => {
              const equippedId = fusion.equippedGear?.[id];
              if (equippedId) {
                setInspectedCompanionBySlot((prev) => ({ ...prev, [id]: equippedId }));
              }
            }}
          />
        ) : (
          <EquipmentSlotsColumn
            selectedCategoryId={selectedCat.id}
            onSelectCategory={(id) => {
              const equipped = getEquippedItem(id);
              if (equipped) {
                setInspectedByCat((prev) => ({ ...prev, [id]: equipped.id }));
              }
            }}
          />
        )}
      </div>

      {/* Companion live-preview card — to the RIGHT of the 3D player model.
          Click the companion 3D model to toggle into companion mode.
          The companion card no longer owns an enchant button — the single
          enchant button above the player model handles BOTH contexts. */}
      <CompanionFusionCard />

      {/* Single ENCHANT button above the 3D player model — visible in BOTH modes.
          - Player mode    → amber/yellow, enchants the inspected player item.
          - Companion mode → blue,           enchants the inspected companion item. */}
      <button
        onClick={() => setEnchantOpen((v) => !v)}
        className="absolute pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] tracking-widest font-semibold transition-all hover:scale-105"
        style={{
          left: '70%',
          top: 110,
          transform: 'translateX(-50%)',
          background: enchantOpen
            ? isCompanionMode
              ? 'linear-gradient(180deg, rgba(96,165,250,0.95), rgba(37,99,235,0.9))'
              : 'linear-gradient(180deg, rgba(251,191,36,0.95), rgba(217,119,6,0.9))'
            : 'rgba(15,17,22,0.55)',
          color: enchantOpen
            ? isCompanionMode ? '#0a0f1e' : '#1a1208'
            : isCompanionMode ? 'rgba(147,197,253,0.95)' : 'rgba(251,191,36,0.95)',
          border: `1px solid ${
            isCompanionMode ? 'rgba(96,165,250,0.55)' : 'rgba(251,191,36,0.45)'
          }`,
          backdropFilter: 'blur(14px) saturate(140%)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          boxShadow: enchantOpen
            ? isCompanionMode
              ? '0 6px 18px rgba(96,165,250,0.4)'
              : '0 6px 18px rgba(251,191,36,0.35)'
            : '0 4px 14px rgba(0,0,0,0.4)',
        }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        ENCHANT
      </button>

      {/* Companion SKILL TREE button — far right side of the same horizontal line
          as Enchant, positioned above the companion preview/head. */}
      <button
        onClick={() => setSkillTreeOpen((v) => !v)}
        className="absolute pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] tracking-widest font-semibold transition-all hover:scale-105"
        style={{
          right: 28,
          top: 110,
          background: skillTreeOpen
            ? 'linear-gradient(180deg, rgba(251,191,36,0.95), rgba(217,119,6,0.9))'
            : 'rgba(15,17,22,0.55)',
          color: skillTreeOpen ? '#1a1208' : 'rgba(251,191,36,0.95)',
          border: '1px solid rgba(251,191,36,0.55)',
          backdropFilter: 'blur(14px) saturate(140%)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          boxShadow: skillTreeOpen
            ? '0 6px 18px rgba(251,191,36,0.4)'
            : '0 4px 14px rgba(0,0,0,0.4)',
        }}
      >
        <GitBranch className="w-3.5 h-3.5" />
        SKILL TREE
      </button>

      {/* Companion Skill Tree overlay — right side, replacing companion preview area */}
      {skillTreeOpen && (() => {
        const compState = getCompanionState();
        const activeComp = getCompanionById(compState.activeCompanionId);
        return (
          <CompanionSkillTreeOverlay
            companion={activeComp}
            onClose={() => setSkillTreeOpen(false)}
          />
        );
      })()}

      {/* Enchantment overlay — overlaps the 3D model area.
          Uses player item in player mode, companion item in companion mode. */}
      {enchantOpen && (() => {
        if (isCompanionMode) {
          const compItem = getCompanionItem(companionSlotId, inspectedCompanionId);
          const compLabel = COMPANION_SLOT_LABELS[companionSlotId] || companionSlotId;
          return (
            <EnchantmentPanel
              item={compItem
                ? { ...compItem, categoryLabel: `Companion · ${compLabel}`, type: `Companion ${compLabel}` }
                : { name: 'No Companion Gear', type: `Companion ${compLabel}` }}
              onClose={() => setEnchantOpen(false)}
            />
          );
        }
        return (
          <EnchantmentPanel
            item={inspectedItem ? { ...inspectedItem, categoryLabel: selectedCat.label } : { name: 'No Equipment', type: selectedCat.label }}
            onClose={() => setEnchantOpen(false)}
          />
        );
      })()}

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