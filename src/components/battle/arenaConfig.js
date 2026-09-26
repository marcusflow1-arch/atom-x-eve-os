export const COURT = Object.freeze({ halfWidth: 6, halfLength: 8, sideMargin: 0.5, netGap: 1, backMargin: 0.5 });
export const RUN_SPEED = 4.2;
export const WALK_SPEED = 2.0;
export const SPAWN_Z = 5;
export const FACING_SPEED = 10;
export const NETWORK_SEND_MS = 66;
export const INTERPOLATION_DELAY_MS = 120;
export function boxFor(side) {
  const minX = -(COURT.halfWidth - COURT.sideMargin);
  const maxX = COURT.halfWidth - COURT.sideMargin;
  return side === 'host'
    ? { minX, maxX, minZ: COURT.netGap, maxZ: COURT.halfLength - COURT.backMargin }
    : { minX, maxX, minZ: -(COURT.halfLength - COURT.backMargin), maxZ: -COURT.netGap };
}
