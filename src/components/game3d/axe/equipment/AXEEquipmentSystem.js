import { evaluateAXESetBonuses } from './AXESetBonusSystem';
import { collectAXEGemStats } from './AXESocketGemSystem';
import { collectAXEAuraStats } from './AXEEquipmentAuraSystem';
import { evaluateAXEAuxiliaryBonuses } from './AXEAuxiliaryGearSystem';

// AXE Prompt 018 — equipment, inventory and gear-slot foundation.
// This module is the AXE-native contract around the existing browser Game3D
// equipment UI/store. It keeps item rules data-driven while allowing the legacy
// equipmentStore/inventoryData files to remain as presentation adapters.

export const AXE_EQUIPMENT_SLOT_DEFS = Object.freeze({
  weapon:     Object.freeze({ id: 'weapon', label: 'Weapon', maxEquipped: 2, layer: 'combat' }),
  helm:       Object.freeze({ id: 'helm', label: 'Helm', maxEquipped: 1, layer: 'combat' }),
  chest:      Object.freeze({ id: 'chest', label: 'Chest', maxEquipped: 1, layer: 'combat' }),
  gloves:     Object.freeze({ id: 'gloves', label: 'Gloves', maxEquipped: 1, layer: 'combat' }),
  legs:       Object.freeze({ id: 'legs', label: 'Legs', maxEquipped: 1, layer: 'combat' }),
  boots:      Object.freeze({ id: 'boots', label: 'Boots', maxEquipped: 1, layer: 'combat' }),
  ring:       Object.freeze({ id: 'ring', label: 'Ring', maxEquipped: 2, layer: 'jewelry' }),
  necklace:   Object.freeze({ id: 'necklace', label: 'Necklace', maxEquipped: 1, layer: 'jewelry' }),
  cape:       Object.freeze({ id: 'cape', label: 'Cape', maxEquipped: 1, layer: 'prestige' }),
  wings:      Object.freeze({ id: 'wings', label: 'Wings', maxEquipped: 1, layer: 'prestige' }),
  costume:    Object.freeze({ id: 'costume', label: 'Costume', maxEquipped: 1, layer: 'appearance' }),
  accessory:  Object.freeze({ id: 'accessory', label: 'Accessory', maxEquipped: 3, layer: 'special' }),
  trinket:    Object.freeze({ id: 'trinket', label: 'Trinket', maxEquipped: 2, layer: 'special' }),
  auxiliary:  Object.freeze({ id: 'auxiliary', label: 'Auxiliary Gear', maxEquipped: 4, layer: 'auxiliary' }),
});

export const AXE_APPEARANCE_LAYERS = Object.freeze([
  'combat',
  'costume',
  'cape',
  'wings',
  'weapon',
]);

export function makeAXEItemInstance(template = {}) {
  const instanceId = template.instanceId || template.instance_id || template.id;
  if (!instanceId) throw new Error('AXE equipment item requires a stable instance id');

  return {
    instanceId,
    templateId: template.templateId || template.template_id || template.id,
    name: template.name || 'Unnamed Item',
    slot: template.slot || template.category || null,
    rarity: template.rarity || 'common',
    qualityBand: Number(template.qualityBand ?? template.quality_band ?? 0),
    itemLevel: Number(template.itemLevel ?? template.level ?? 1),
    powerRequirement: Number(template.powerRequirement ?? 0),
    factionRequirement: template.factionRequirement || null,
    weaponRequirement: template.weaponRequirement || null,
    baseStats: { ...(template.baseStats || template.stats || {}) },
    rolledStats: { ...(template.rolledStats || template.affixes || {}) },
    setId: template.setId || null,
    auxSetId: template.auxSetId || null,
    reinforcement: { ...(template.reinforcement || { level: 0, percent: 0 }) },
    enchantment: { ...(template.enchantment || { level: 0 }) },
    sockets: Array.isArray(template.sockets) ? [...template.sockets] : [],
    aura: template.aura || null,
    core: template.core || null,
    bindState: template.bindState || 'unbound',
    tradeable: template.tradeable !== false,
    appearance: template.appearance || null,
    equipped: !!template.equipped,
    locked: !!template.locked,
  };
}

export function validateAXEEquip(item, context = {}) {
  if (!item) return { ok: false, reason: 'ITEM_MISSING' };
  const slot = AXE_EQUIPMENT_SLOT_DEFS[item.slot];
  if (!slot) return { ok: false, reason: 'INVALID_SLOT' };

  const level = Number(context.level ?? 1);
  if (level < Number(item.itemLevel || 1)) return { ok: false, reason: 'LEVEL_REQUIRED' };

  if (item.factionRequirement && context.factionId && item.factionRequirement !== context.factionId) {
    return { ok: false, reason: 'FACTION_REQUIRED' };
  }
  if (item.weaponRequirement && context.weaponRole && item.weaponRequirement !== context.weaponRole) {
    return { ok: false, reason: 'WEAPON_ROLE_REQUIRED' };
  }
  return { ok: true, reason: null };
}

export function collectAXEEquipmentStats(items = []) {
  const total = {};
  for (const raw of items) {
    if (!raw) continue;
    const item = raw.instanceId ? raw : makeAXEItemInstance(raw);
    if (!item.equipped) continue;
    const sources = [item.baseStats, item.rolledStats, collectAXEGemStats(item), collectAXEAuraStats(item.aura)];
    for (const source of sources) {
      for (const [key, value] of Object.entries(source || {})) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) continue;
        total[key] = (total[key] || 0) + numeric;
      }
    }
  }
  const setResult = evaluateAXESetBonuses(items.map((raw) => raw?.instanceId ? raw : makeAXEItemInstance(raw || {})).filter(Boolean));
  for (const [key, value] of Object.entries(setResult.stats || {})) {
    total[key] = (total[key] || 0) + Number(value || 0);
  }
  const auxResult = evaluateAXEAuxiliaryBonuses(
    items.map((raw) => raw?.instanceId ? raw : makeAXEItemInstance(raw || {})).filter(Boolean),
  );
  for (const [key, value] of Object.entries(auxResult.setStats || {})) {
    total[key] = (total[key] || 0) + Number(value || 0);
  }
  return total;
}

export function getAXEEquipmentSetState(items = []) {
  return evaluateAXESetBonuses(items.map((raw) => raw?.instanceId ? raw : makeAXEItemInstance(raw || {})).filter(Boolean));
}

export function getAXEAuxiliarySetState(items = []) {
  return evaluateAXEAuxiliaryBonuses(items.map((raw) => raw?.instanceId ? raw : makeAXEItemInstance(raw || {})).filter(Boolean));
}

export function getAXEAppearanceLayers(items = []) {
  const result = { combat: [], costume: [], cape: [], wings: [], weapon: [] };
  for (const raw of items) {
    if (!raw?.equipped || !raw.appearance) continue;
    const slot = AXE_EQUIPMENT_SLOT_DEFS[raw.slot || raw.category];
    if (!slot) continue;
    const layer = slot.id === 'costume' ? 'costume'
      : slot.id === 'cape' ? 'cape'
      : slot.id === 'wings' ? 'wings'
      : slot.id === 'weapon' ? 'weapon'
      : 'combat';
    result[layer].push(raw.appearance);
  }
  return result;
}

export function migrateLegacyEquipmentItem(item, categoryId) {
  const slot = categoryId === 'accessory'
    ? (String(item?.type || '').toLowerCase().includes('neck') ? 'necklace' : 'ring')
    : categoryId;
  return makeAXEItemInstance({
    ...item,
    slot,
    rarity: item?.rarity || 'common',
    qualityBand: item?.qualityBand ?? 0,
    baseStats: item?.baseStats || {},
  });
}
