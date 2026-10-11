import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const inventory = read('src/components/dashboard/LunaElderScrollsInventory.jsx');
const dashboard = read('src/components/dashboard/DashboardAvatarOverview.jsx');
const luna = read('src/pages/LunaTemplate.jsx');

test('Luna dashboard presents equipment and owned inventory in two equal halves', () => {
  assert.match(inventory, /data-luna-elder-inventory/);
  assert.match(inventory, /aria-label="Equipped loadout"[^\n]+w-1\/2/);
  assert.match(inventory, /aria-label="Owned inventory"[^\n]+w-1\/2/);
  assert.match(inventory, /aria-expanded=\{showExtendedSlots\}/);
  assert.match(inventory, /group === 'weapon'/);
});

test('inventory uses real card collection rather than demo equipment', () => {
  assert.match(inventory, /useCardCollection\(\)/);
  assert.match(inventory, /collection\.owned/);
  assert.match(inventory, /filter\(\(card\) => card\.user_card_id\)/);
  assert.match(inventory, /onEquipItem\?\.\(selectedItem, equipTarget\)/);
  assert.match(inventory, /onUnequipSlot\?\.\(selectedSlotId\)/);
  assert.match(inventory, /itemFitsSlot\(selectedItem, equipTarget\)/);
});

test('both Luna inventory entry points share the same equipment workspace', () => {
  assert.match(dashboard, /<LunaElderScrollsInventory/);
  assert.match(luna, /<LunaElderScrollsInventory/);
  assert.match(dashboard, /onUnequipSlot=\{unequipItem\}/);
  assert.match(luna, /onUnequipSlot=\{unequipItem\}/);
  assert.match(dashboard, /width=\{990\} height=\{670\}/);
});

test('inventory keeps search, category browsing, and slot selections accessible', () => {
  assert.match(inventory, /Search inventory/);
  assert.match(inventory, /Item categories/);
  assert.match(inventory, /aria-label=\{label \+ \(equipped/);
  assert.match(inventory, /aria-pressed=\{selected\}/);
  assert.match(inventory, /aria-pressed=\{active\}/);
});
