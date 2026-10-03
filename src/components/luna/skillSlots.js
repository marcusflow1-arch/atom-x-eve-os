export const SKILL_SLOT_COUNT = 10;
export const SKILL_SET_COUNT = 4;
export const SKILL_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export function skillSlotFromKey(event) {
  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return -1;
  const physical = /^(?:Digit|Numpad)([0-9])$/.exec(String(event.code || ''));
  return SKILL_KEYS.indexOf(physical?.[1] || String(event.key || ''));
}
