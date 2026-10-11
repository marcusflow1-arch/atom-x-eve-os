import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
  assert.match(inventory, /gridTemplateColumns: 'repeat\(auto-fill, minmax\(52px, 1fr\)\)'/);
  assert.match(inventory, /aspect-square/);
  assert.match(inventory, /empty-\$\{i\}/);
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
