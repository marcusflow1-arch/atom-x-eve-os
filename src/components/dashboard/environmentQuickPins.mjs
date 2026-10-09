// Four independent quick-environment pins per account. Store only the real
// catalog IDs, not stale 3D URLs or user-owned assets from another account.
export const MAX_ENVIRONMENT_PINS = 4;
export const environmentPinsKey = userId => 'atomxe.luna.environment-pins.v1.' + String(userId || 'guest');

export function normalizeEnvironmentPins(value) {
  if (!Array.isArray(value)) return [];
  const ids = [];
  for (const raw of value) {
    if (typeof raw !== 'string') continue;
    const id = raw.trim();
    if (!id || id.length > 160 || ids.includes(id)) continue;
    ids.push(id);
    if (ids.length === MAX_ENVIRONMENT_PINS) break;
  }
  return ids;
}
export function readEnvironmentPins(userId, storage = typeof window === 'undefined' ? null : window.localStorage) {
  try { return normalizeEnvironmentPins(JSON.parse(storage?.getItem(environmentPinsKey(userId)) || '[]')); }
  catch { return []; }
}
export function writeEnvironmentPins(userId, ids, storage = typeof window === 'undefined' ? null : window.localStorage, notify = true) {
  const next = normalizeEnvironmentPins(ids);
  try { storage?.setItem(environmentPinsKey(userId), JSON.stringify(next)); }
  catch { return { ok: false, pins: readEnvironmentPins(userId, storage) }; }
  if (notify && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lunaEnvironmentPinsChanged', { detail: { userId: String(userId || 'guest'), ids: next } }));
  }
  return { ok: true, pins: next };
}
export function toggleEnvironmentPin(userId, id, storage) {
  const itemId = String(id || '');
  if (!itemId) return { ok: false, pins: readEnvironmentPins(userId, storage) };
  const existing = readEnvironmentPins(userId, storage);
  if (existing.includes(itemId)) return writeEnvironmentPins(userId, existing.filter(value => value !== itemId), storage);
  if (existing.length >= MAX_ENVIRONMENT_PINS) return { ok: false, full: true, pins: existing };
  return writeEnvironmentPins(userId, [...existing, itemId], storage);
}
