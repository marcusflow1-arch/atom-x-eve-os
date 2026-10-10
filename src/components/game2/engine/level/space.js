// Physical space of an authored mission level. Walking collision is the same BSPCollision the imported Raven arena
// uses (floor triangles + wall segments), so characters move exactly as they do in the duel. On top of it:
// sliding doors, ceilings, trigger zones and box ray tests for line of sight, blaster bolts and the camera.
// Pure maths (no WebGL) so the unit tests can load a level headless.
import { BSPCollision } from '../rbsp.js';

const DOOR_SPEED = 1.15;   // fraction of the door height per second
const DOOR_PASS = 0.82;    // a door this far up no longer blocks people

export class LevelSpace {
  constructor(level) {
    this.level = level;
    this.collision = new BSPCollision({ tris: level.tris, spawns: [] });
    this.solids = level.solids;      // visible boxes: block rays (sight, bolts, camera)
    this.clips = level.clips;        // invisible play-area clip: blocks walking only
    this.interiors = level.interiors;
    this.zones = new Map(level.zones.map(z => [z.id, z]));
    this.doors = new Map(level.doors.map(d => [d.id, { ...d, want: !!d.open, lift: d.open ? 1 : 0 }]));
    this.interactables = new Map(level.interactables.map(i => [i.id, i]));
  }
  // ---------- doors
  setDoor(id, open) { const d = this.doors.get(id); if (!d) throw new Error('unknown door ' + id); d.want = !!open; }
  snapDoor(id, open) { const d = this.doors.get(id); d.want = !!open; d.lift = open ? 1 : 0; }
  doorOpen(id) { const d = this.doors.get(id); return !!d && d.lift >= DOOR_PASS; }
  doorBox(d) { const h = d.max[1] - d.min[1], dy = d.lift * h * 0.96; return { min: [d.min[0], d.min[1] + dy, d.min[2]], max: [d.max[0], d.max[1] + dy, d.max[2]] }; }
  update(dt) {
    let moved = false;
    for (const d of this.doors.values()) { const t = d.want ? 1 : 0; if (d.lift !== t) { const s = DOOR_SPEED * dt; d.lift = Math.abs(t - d.lift) <= s ? t : d.lift + Math.sign(t - d.lift) * s; moved = true; } }
    return moved;
  }
  // ---------- walking
  floorAt(x, z, top = Infinity) { return this.collision.floorAt(x, z, top); }
  collide(pos, r) {
    this.collision.collide(pos, r);
    for (const d of this.doors.values()) {
      if (d.lift >= DOOR_PASS) continue;
      const b = this.doorBox(d); if (pos[1] + 1.6 < b.min[1] || pos[1] > b.max[1]) continue;
      pushOutOfRect(pos, r, b.min[0], b.min[2], b.max[0], b.max[2]);
    }
    for (const it of this.interiors) { // no jumping through ceilings
      if (pos[0] < it.x0 || pos[0] > it.x1 || pos[2] < it.z0 || pos[2] > it.z1) continue;
      const lim = it.ceil - 1.85; if (pos[1] > lim && pos[1] < it.ceil) pos[1] = lim;
    }
  }
  // ---------- rays: returns the hit fraction along a->b, or null when the segment is clear
  raycast(a, b, o = {}) {
    let best = null; const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const test = (mn, mx) => { const t = rayBox(a[0], a[1], a[2], dx, dy, dz, mn, mx); if (t !== null && (best === null || t < best)) best = t; };
    for (const s of this.solids) test(s.min, s.max);
    if (!o.ignoreDoors) for (const d of this.doors.values()) { if (d.lift >= 0.98) continue; const bx = this.doorBox(d); test(bx.min, bx.max); }
    return best;
  }
  lineOfSight(a, b) { return this.raycast(a, b) === null; }
  cameraClip(target, eye) {
    const t = this.raycast(target, eye); if (t === null) return eye;
    const len = Math.hypot(eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]) || 1, k = Math.max(0, t * len - 0.3) / len;
    return [target[0] + (eye[0] - target[0]) * k, target[1] + (eye[1] - target[1]) * k, target[2] + (eye[2] - target[2]) * k];
  }
  insideSolid(x, y, z, pad = 0) {
    for (const s of this.solids) if (x > s.min[0] - pad && x < s.max[0] + pad && z > s.min[2] - pad && z < s.max[2] + pad && y > s.min[1] && y < s.max[1]) return true;
    for (const s of this.clips) if (x > s.min[0] - pad && x < s.max[0] + pad && z > s.min[2] - pad && z < s.max[2] + pad && y > s.min[1] && y < s.max[1]) return true;
    return false;
  }
  // ---------- zones / interactables
  inZone(id, p) { const z = this.zones.get(id); if (!z) throw new Error('unknown zone ' + id); return p[0] >= z.x0 && p[0] <= z.x1 && p[2] >= z.z0 && p[2] <= z.z1; }
  interiorAt(p) { for (const it of this.interiors) if (p[0] >= it.x0 && p[0] <= it.x1 && p[2] >= it.z0 && p[2] <= it.z1 && p[1] < it.ceil) return it; return null; }
}

function pushOutOfRect(pos, r, x0, z0, x1, z1) {
  const cx = Math.max(x0, Math.min(pos[0], x1)), cz = Math.max(z0, Math.min(pos[2], z1));
  const dx = pos[0] - cx, dz = pos[2] - cz, d = Math.hypot(dx, dz);
  if (d > 1e-5) { if (d < r) { pos[0] = cx + dx / d * r; pos[2] = cz + dz / d * r; } return; }
  // centre inside the rectangle: leave through the nearest side
  const l = pos[0] - x0, rr = x1 - pos[0], b = pos[2] - z0, t = z1 - pos[2], m = Math.min(l, rr, b, t);
  if (m === l) pos[0] = x0 - r; else if (m === rr) pos[0] = x1 + r; else if (m === b) pos[2] = z0 - r; else pos[2] = z1 + r;
}

// slab test; t in [0, 1] along the segment, null when missed (a start point inside the box counts as t = 0)
export function rayBox(ox, oy, oz, dx, dy, dz, mn, mx) {
  let t0 = 0, t1 = 1;
  const o = [ox, oy, oz], d = [dx, dy, dz];
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]) < 1e-9) { if (o[k] < mn[k] || o[k] > mx[k]) return null; continue; }
    let a = (mn[k] - o[k]) / d[k], b = (mx[k] - o[k]) / d[k]; if (a > b) { const s = a; a = b; b = s; }
    if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) return null;
  }
  return t0;
}
