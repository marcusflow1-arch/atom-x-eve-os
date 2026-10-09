const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
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
