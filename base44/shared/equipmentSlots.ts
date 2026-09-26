type AnyObj = Record<string, any>;
const lower = (value: any) => String(value || '').trim().toLowerCase();

export const EQUIPMENT_SLOT_IDS = [
  'helmet','armor','pants','boots','gloves','ring-left','ring-right','earring-left','earring-right',
  'weapon-1','weapon-2','weapon-3','aspect-1','aspect-2','aspect-3','genre-1','genre-2','genre-3','genre-4',
  'artifact-1','artifact-2','artifact-3','artifact-4','artifact-5',
] as const;

const SLOT_SET = new Set<string>(EQUIPMENT_SLOT_IDS as unknown as string[]);
export const isEquipmentSlot = (slot: any) => SLOT_SET.has(String(slot || ''));

function semanticSlot(card: AnyObj) {
  const explicit = lower(card?.equip_slot);
  if (explicit) return explicit;
  const text = lower([card?.name, card?.card_type, card?.type, card?.subtype].filter(Boolean).join(' '));
  if (/helmet|helm|head|cowl|hood|circlet/.test(text)) return 'head';
  if (/pants|trouser|legs?|greaves|leggings/.test(text)) return 'pants';
  if (/boots?|shoes?|feet|foot|treads?/.test(text)) return 'boots';
  if (/gloves?|hands?|gauntlets?/.test(text)) return 'gloves';
  if (/rings?/.test(text)) return 'ring';
  if (/earrings?|ear[- ]?piece|ear jewel/.test(text)) return 'earring';
  if (/weapon|sword|blade|bow|rifle|pistol|staff|wand|axe|spear|gun|cannon|dagger|mace/.test(text)) return 'weapon_main';
  if (/artifact/.test(text)) return 'artifact';
  if (/cape|cloak/.test(text)) return 'cape';
  if (/armor|armour|chest|body|torso|cuirass|breastplate|robe/.test(text)) return 'chest';
  if (/aspect/.test(text)) return 'aspect';
  if (/genre/.test(text)) return 'genre';
  return '';
}

export function itemFitsSlot(card: AnyObj, slotId: string) {
  if (!card || !isEquipmentSlot(slotId)) return false;
  const semantic = semanticSlot(card);
  if (slotId === 'helmet') return semantic === 'head';
  if (slotId === 'armor') return ['chest','cape'].includes(semantic);
  if (slotId === 'pants') return semantic === 'pants';
  if (slotId === 'boots') return semantic === 'boots';
  if (slotId === 'gloves') return semantic === 'gloves';
  if (slotId.startsWith('ring-')) return semantic === 'ring';
  if (slotId.startsWith('earring-')) return semantic === 'earring';
  if (slotId.startsWith('weapon-')) return ['weapon_main','weapon_off','weapon'].includes(semantic);
  if (slotId.startsWith('artifact-')) return semantic === 'artifact';
  if (slotId.startsWith('aspect-')) return semantic === 'aspect';
  if (slotId.startsWith('genre-')) return semantic === 'genre';
  return false;
}
