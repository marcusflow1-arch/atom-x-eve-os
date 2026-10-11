import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EQUIPMENT_GRID_COLUMNS, MIN_VISIBLE_EQUIPMENT_ROWS, equipmentGridPlaceholders } from '../src/components/dashboard/equipmentGridLayout.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const inventory = read('src/components/dashboard/LunaElderScrollsInventory.jsx');
const loadout = read('src/components/dashboard/InventoryGrid.jsx');
const ownedHook = read('src/components/luna/hooks/useOwnedEquipment.js');
const dashboard = read('src/components/dashboard/DashboardAvatarOverview.jsx');
const luna = read('src/pages/LunaTemplate.jsx');

test('Luna inventory retains the equal 50/50 split with the original slot component', () => {
  assert.match(inventory, /data-luna-elder-inventory/);
  assert.match(inventory, /aria-label="Equipment slots"[^\n]+w-1\/2/);
  assert.match(inventory, /aria-label="Equipment inventory"[^\n]+w-1\/2/);
  assert.match(inventory, /import InventoryGrid from '\.\/InventoryGrid'/);
  assert.match(inventory, /<InventoryGrid[\s\S]*?compact[\s\S]*?gearOnly/);
});

test('original loadout styling is reused and non-equipment slots are hidden only in this view', () => {
  assert.match(loadout, /gearOnly = false/);
  assert.match(loadout, /boxes-compact/);
  assert.match(loadout, /\{!gearOnly && <div/);
  assert.match(loadout, /\[1,2,3\]\.map\(\(i\) => compactSlot\(`weapon-/);
  assert.match(loadout, /slot\.group === 'armor'/);
  assert.match(loadout, /compactSlot\(`artifact-/);
});

test('right inventory is a traditional square grid rather than item rows', () => {
  assert.match(inventory, /aria-label="Equipment item grid"/);
  assert.match(inventory, /grid grid-cols-7 content-start gap-1\.5/);
  assert.match(inventory, /data-inventory-grid-scroll/);
  assert.match(inventory, /overflow-y-auto overscroll-contain/);
  assert.match(inventory, /aspect-square/);
  assert.match(inventory, /empty-\$\{i\}/);
  assert.match(inventory, /equipmentGridPlaceholders\(visibleItems\.length\)/);
  assert.match(inventory, /\{visibleItems\.map\(\(item\) =>/);
  assert.match(inventory, /setSelectedItemId\(id\)/);
  assert.doesNotMatch(inventory, /space-y-1\.5[^\n]*\n\s*\{visibleItems\.map/);
});

test('only owned equipment cards load; no ability, aspect or skill inventory sources', () => {
  assert.match(inventory, /useOwnedEquipment\(\)/);
  assert.match(ownedHook, /useCardCollection\(\{ card_type: 'equipment' \}\)/);
  assert.match(ownedHook, /card\.owned && card\.user_card_id/);
  assert.doesNotMatch(inventory, /\['powers',\s*'Abilities'\]/);
  assert.doesNotMatch(inventory, /useCardCollection\(\)/);
  assert.match(inventory, /\['accessories', 'Accessories'\]/);
});

test('equip and unequip preserve the existing equipment persistence and slot validation', () => {
  assert.match(inventory, /itemFitsSlot\(selectedItem, equipTarget\)/);
  assert.match(inventory, /onEquipItem\?\.\(selectedItem, equipTarget\)/);
  assert.match(inventory, /onUnequipSlot\?\.\(chosenSlot\)/);
  assert.match(inventory, /isSaving/);
  assert.match(inventory, /aria-label="Search equipment"/);
  assert.match(inventory, /aria-label="Equipment categories"/);
});

test('both dashboard inventory surfaces use the same restored slot and grid component', () => {
  assert.match(dashboard, /<LunaElderScrollsInventory/);
  assert.match(luna, /<LunaElderScrollsInventory/);
  assert.match(dashboard, /onUnequipSlot=\{unequipItem\}/);
  assert.match(luna, /onUnequipSlot=\{unequipItem\}/);
  assert.match(dashboard, /title="Inventory" width=\{990\} height=\{670\}/);
});

test('seven slots per row and no client-side row cap even for very large gear collections', () => {
  assert.equal(EQUIPMENT_GRID_COLUMNS, 7);
  assert.equal(MIN_VISIBLE_EQUIPMENT_ROWS, 5);
  for (const count of [0, 1, 7, 8, 21, 34, 35, 36, 41, 42, 43, 140, 1000, 100001]) {
    const placeholders = equipmentGridPlaceholders(count);
    const minimum = Math.max(35, count);
    assert.equal((placeholders + count) % 7, 0, 'every row contains exactly seven squares');
    assert.ok(placeholders >= 0 && placeholders < 7 || (count < 35 && count + placeholders === 35));
    assert.ok(count + placeholders >= minimum, 'every owned item is included');
  }
  assert.equal(equipmentGridPlaceholders(35), 0);
  assert.equal(equipmentGridPlaceholders(36), 6);
  assert.equal(equipmentGridPlaceholders(42), 0);
  assert.equal(equipmentGridPlaceholders(1000), 1);
});

test('restored equipment slots use tighter spacing only for this equipment panel', () => {
  assert.match(loadout, /gearOnly \? 'h-11 w-11' : 'h-\[60px\] w-\[60px\]'/);
  assert.match(loadout, /gearOnly \? 'gap-2' : 'gap-3'/);
  assert.match(loadout, /gearOnly \? 'gap-3' : 'gap-5'/);
  assert.match(loadout, /compactSlot\(`artifact-\$\{i\}\`\)/);
});
