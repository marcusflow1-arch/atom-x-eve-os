const lower = (value) => String(value || '').trim().toLowerCase();

export const EQUIPMENT_SLOT_DEFINITIONS = [
  { id: 'helmet', label: 'Helmet', group: 'armor', kind: 'helmet' },
  { id: 'armor', label: 'Armor', group: 'armor', kind: 'armor' },
  { id: 'pants', label: 'Pants', group: 'armor', kind: 'pants' },
  { id: 'boots', label: 'Boots', group: 'armor', kind: 'boots' },
  { id: 'gloves', label: 'Gloves', group: 'armor', kind: 'gloves' },
  { id: 'ring-left', label: 'Left Ring', group: 'armor', kind: 'ring' },
  { id: 'ring-right', label: 'Right Ring', group: 'armor', kind: 'ring' },
  { id: 'earring-left', label: 'Left Earring', group: 'armor', kind: 'earring' },
  { id: 'earring-right', label: 'Right Earring', group: 'armor', kind: 'earring' },
  { id: 'weapon-1', label: 'Weapon I', group: 'weapon', kind: 'weapon' },
  { id: 'weapon-2', label: 'Weapon II', group: 'weapon', kind: 'weapon' },
  { id: 'weapon-3', label: 'Weapon III', group: 'weapon', kind: 'weapon' },
  { id: 'aspect-1', label: 'Aspect I', group: 'aspect', kind: 'aspect' },
  { id: 'aspect-2', label: 'Aspect II', group: 'aspect', kind: 'aspect' },
  { id: 'aspect-3', label: 'Aspect III', group: 'aspect', kind: 'aspect' },
  { id: 'genre-1', label: 'Genre I', group: 'genre', kind: 'genre' },
  { id: 'genre-2', label: 'Genre II', group: 'genre', kind: 'genre' },
  { id: 'genre-3', label: 'Genre III', group: 'genre', kind: 'genre' },
  { id: 'genre-4', label: 'Genre IV', group: 'genre', kind: 'genre' },
  { id: 'artifact-1', label: 'Artifact I', group: 'artifact', kind: 'artifact' },
  { id: 'artifact-2', label: 'Artifact II', group: 'artifact', kind: 'artifact' },
  { id: 'artifact-3', label: 'Artifact III', group: 'artifact', kind: 'artifact' },
  { id: 'artifact-4', label: 'Artifact IV', group: 'artifact', kind: 'artifact' },
  { id: 'artifact-5', label: 'Artifact V', group: 'artifact', kind: 'artifact' },
];

const SLOT_BY_ID = new Map(EQUIPMENT_SLOT_DEFINITIONS.map((slot) => [slot.id, slot]));

export const getEquipmentSlotDefinition = (slotId) => SLOT_BY_ID.get(slotId) || null;
export const getEquipmentSlotLabel = (slotId) => getEquipmentSlotDefinition(slotId)?.label
  || String(slotId || '').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const accessoryText = (item) => lower([
  item?.type,
  item?.itemType,
  item?.inventoryCategory,
  item?.subtype,
  item?.slot,
  item?.equip_slot,
  item?.name,
].filter(Boolean).join(' '));

export function itemFitsSlot(item, slotId) {
  if (!item || !slotId) return false;

  const definition = getEquipmentSlotDefinition(slotId);

  // Preserve older callers that still use legacy/unregistered slot names.
  // All new Luna inventory slots are registered above and therefore use strict rules.
  if (!definition) return true;

  const type = lower(item?.type || item?.itemType || item?.inventoryCategory);
  const subtype = lower(item?.subtype || item?.slot || item?.equip_slot);
  const text = accessoryText(item);

  switch (definition.kind) {
    case 'weapon':
      return /weapon/.test(type)
        || /sword|blade|bow|rifle|pistol|staff|wand|axe|spear|gun|cannon|dagger|mace/.test(text);

    case 'helmet':
      return /helmet|helm|head|cowl|hood|circlet/.test(subtype || text);

    case 'armor':
      if (/boots|shoe|feet|foot|glove|hand|ring|earring|ear|pants|trouser|legs?|greaves|helmet|helm|head|cowl|hood/.test(subtype)) return false;
      return /armor/.test(type)
        || /chest|body|torso|cuirass|breastplate|cape|cloak|robe/.test(subtype || text);

    case 'pants':
      return /pants|trouser|legs?|greaves|leggings/.test(subtype || text);

    case 'boots':
      return /boots?|shoes?|feet|foot|treads?/.test(subtype || text);

    case 'gloves':
      return /gloves?|hands?|gauntlets?/.test(subtype || text);

    case 'ring':
      return /rings?/.test(subtype || text);

    case 'earring':
      return /earrings?|ear[- ]?piece|ear jewel/.test(subtype || text);

    case 'aspect':
      return /aspect/.test(type) || /aspect/.test(text);

    case 'artifact':
      return /artifact/.test(type) || /artifact/.test(text);

    case 'genre':
      return /genre/.test(type)
        || Boolean(item?.genreCard)
        || Boolean(item?.genre_id)
        || Boolean(item?.genre_slot);

    default:
      return true;
  }
}
