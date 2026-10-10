// Helpers shared by the mission brains. Brains only "press buttons": they fill Fighter.cmd and targetYaw,
// exactly like the player's input does, so every character obeys the same movement / saber / Force rules.
export const rnd = (a, b) => a + Math.random() * (b - a);
export const clearCmd = c => { c.fwd = c.right = c.up = 0; c.walk = c.crouch = c.attack = c.alt = c.jump = c.jumpPressed = c.crouchPressed = false; };
export const yawTo = (f, p) => Math.atan2(p[0] - f.pos[0], p[2] - f.pos[2]);
export const flatDist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
export const eyeOf = f => [f.pos[0], f.pos[1] + (f.ducked ? 1.0 : 1.55), f.pos[2]];

// walk along a world direction while facing wherever targetYaw points (strafing / backpedalling as needed)
export function steer(f, dir, c, k = 1) {
  const s = Math.sin(f.yaw), co = Math.cos(f.yaw);
  c.fwd = (dir[0] * s + dir[2] * co) * k; c.right = (dir[0] * -co + dir[2] * s) * k;
}

// sight: range, field of view (wider once alert) and real line of sight through the level
export function canSee(g, f, T, range, alert) {
  if (!T || T.status === 'dead') return false;
  const d = flatDist(f.pos, T.pos); if (d > range) return false;
  if (d > 3) { const dx = (T.pos[0] - f.pos[0]) / d, dz = (T.pos[2] - f.pos[2]) / d, dot = Math.sin(f.yaw) * dx + Math.cos(f.yaw) * dz; if (dot < (alert ? -0.25 : 0.34)) return false; }
  return g.world.lineOfSight(eyeOf(f), T.chest());
}
