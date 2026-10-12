const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
// Start the reference's two windows side by side, inside the dashboard headers.
// On narrow displays each remains usable as an independently movable window.
export function skillBookWindowRect(area, prefab = false) {
  const margin = area.width >= 1100 ? 24 : 12;
  const gap = area.width >= 1400 ? 32 : 18;
  const height = Math.max(240, area.height - 20);
  const prefabWidth = Math.min(400, Math.max(310, area.width * .24));
  if (area.width < 1000) return fitWindow({
    x: prefab ? area.x + area.width - prefabWidth - margin : area.x + margin,
    y: area.y + (prefab ? 28 : 10),
    width: prefab ? prefabWidth : area.width - margin * 2, height: height - (prefab ? 18 : 0),
  }, area);
  const bookWidth = area.width - margin * 2 - gap - prefabWidth;
  return fitWindow({ x: area.x + margin + (prefab ? bookWidth + gap : 0),
    y: area.y + 10, width: prefab ? prefabWidth : bookWidth, height }, area);
}
export function fitWindow(rect, area, min = { width: 300, height: 240 }) {
  const width = Math.min(area.width, Math.max(Math.min(min.width, area.width), finite(rect.width, 640)));
  const height = Math.min(area.height, Math.max(Math.min(min.height, area.height), finite(rect.height, 480)));
  return {
    width, height,
    x: Math.max(area.x, Math.min(area.x + area.width - width, finite(rect.x, area.x))),
    y: Math.max(area.y, Math.min(area.y + area.height - height, finite(rect.y, area.y))),
  };
}
export function moveWindow(rect, dx, dy, area) {
  return fitWindow({ ...rect, x: rect.x + dx, y: rect.y + dy }, area);
}
export function resizeWindow(rect, dx, dy, area) {
  return fitWindow({ ...rect,
    width: Math.min(area.x + area.width - rect.x, rect.width + dx),
    height: Math.min(area.y + area.height - rect.y, rect.height + dy),
  }, area);
}
export function createWindowStack() {
  const items = new Map();
  let order = 1500;
  return {
    focus(id) { items.set(id, ++order); return order; },
    remove(id) { items.delete(id); },
    top() { return [...items].sort((a,b) => b[1]-a[1])[0]?.[0] || null; },
  };
}
