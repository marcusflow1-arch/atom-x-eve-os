/** Game 5 ONLY — development world geometry and deterministic interaction rules. */
export const DEV_WORLD = Object.freeze({
  spawn: Object.freeze({ x: 0, z: 5 }),
  npc: Object.freeze({ id: 'lost-card-elder', name: 'Elder Shen', x: 0, z: -5 }),
  card: Object.freeze({ id: 'lost-card-ground-01', x: 14, z: -8, cardId: 'game5:lost-card', cardInstanceId: 'game5-dev-lost-card-01' }),
  interactionRadius: 3.2,
  bounds: 28,
});
export class GameplayInputError extends Error {
  constructor(message, status = 400) { super(message); this.name = 'GameplayInputError'; this.status = status; }
}
export function validatePosition(position, world = DEV_WORLD) {
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.z) ||
      Math.abs(position.x) > world.bounds || Math.abs(position.z) > world.bounds) {
    throw new GameplayInputError('Invalid development player position');
  }
  return { x: position.x, z: position.z };
}
export function requireNearby(position, target, world = DEV_WORLD) {
  const p = validatePosition(position, world);
  if (Math.hypot(p.x - target.x, p.z - target.z) > world.interactionRadius) {
    throw new GameplayInputError('Move closer to interact', 403);
  }
  return p;
}
