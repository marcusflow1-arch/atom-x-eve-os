export const ARENA_SIZE = 75;
export const DIRT_PATH_WIDTH = 6.5;
export const DIRT_CIRCLE = { x: 0, z: 23, radius: 12 };

export function getSPathCenterX(z) {
  const normalized = Math.max(-1, Math.min(1, z / 33));
  return Math.sin(normalized * Math.PI * 1.15) * 10;
}

export function getDistanceToSPath(x, z) {
  let closest = Infinity;

  for (let step = -34; step <= 34; step += 1) {
    const cx = getSPathCenterX(step);
    const dx = x - cx;
    const dz = z - step;
    closest = Math.min(closest, Math.sqrt(dx * dx + dz * dz));
  }

  return closest;
}

export function isDirtArea(x, z, padding = 0) {
  const pathRadius = DIRT_PATH_WIDTH * 0.5 + padding;
  const circleRadius = DIRT_CIRCLE.radius + padding;
  const circleDistance = Math.hypot(x - DIRT_CIRCLE.x, z - DIRT_CIRCLE.z);

  return getDistanceToSPath(x, z) <= pathRadius || circleDistance <= circleRadius;
}