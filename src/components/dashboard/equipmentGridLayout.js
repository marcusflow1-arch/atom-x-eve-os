// The visual grid has exactly seven columns. Items are never capped on the
// client: every seven owned equipment entries creates another scrollable row.
export const EQUIPMENT_GRID_COLUMNS = 7;
export const MIN_VISIBLE_EQUIPMENT_ROWS = 5;

export function equipmentGridPlaceholders(itemCount) {
  const total = Math.max(0, Math.floor(Number(itemCount) || 0));
  const rowCount = Math.max(MIN_VISIBLE_EQUIPMENT_ROWS, Math.ceil(total / EQUIPMENT_GRID_COLUMNS));
  return rowCount * EQUIPMENT_GRID_COLUMNS - total;
}
