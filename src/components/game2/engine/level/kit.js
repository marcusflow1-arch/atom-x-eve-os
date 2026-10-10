// Level kit: small helpers that write layout data (see builder.js) so a mission file reads like a floor plan.
// Everything is deterministic (seeded) so the same mission always builds the same level.
export function mulberry32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function layoutKit(name, seed = 1) {
  const L = { name, solids: [], clips: [], ramps: [], deco: [], doors: [], interiors: [], zones: [], lamps: [], props: [], interactables: [] };
  const rng = mulberry32(seed), r = (a, b) => a + rng() * (b - a);
  const k = {
    L, r,
    solid(min, max, mat = 'metal', walk = true) { L.solids.push({ min, max, mat, walk }); return k; },
    clip(min, max) { L.clips.push({ min, max }); return k; },
    deco(min, max, mat = 'metal') { L.deco.push(mat in GLOW_NAMES ? { min, max, glow: mat } : { min, max, mat }); return k; },
    ramp(o) { L.ramps.push(o); return k; },
    door(id, min, max, open = false, mat = 'door') { L.doors.push({ id, min, max, open, mat }); return k; },
    zone(id, x0, z0, x1, z1) { L.zones.push({ id, x0, z0, x1, z1 }); return k; },
    lamp(p, glow = 'orange') { L.lamps.push({ p, glow }); return k; },
    prop(kind, x, z) { L.props.push({ kind, x, z }); return k; },
    use(id, p, r, prompt) { L.interactables.push({ id, p, r, prompt }); return k; },
    // straight wall between two corners (thin along one axis). gaps run along the long axis: [{a, b, top}]
    wall({ x0, z0, x1, z1, y0 = 0, h, mat = 'metal', gaps = [] }) {
      const alongX = (x1 - x0) >= (z1 - z0), lo = alongX ? x0 : z0, hi = alongX ? x1 : z1;
      const piece = (a, b, ya, yb) => { if (b - a < 0.01 || yb - ya < 0.01) return; if (alongX) k.solid([a, ya, z0], [b, yb, z1], mat); else k.solid([x0, ya, a], [x1, yb, b], mat); };
      const gs = gaps.slice().sort((p, q) => p.a - q.a); let cur = lo;
      for (const g of gs) { piece(cur, g.a, y0, h); if (g.top != null && g.top < h) piece(g.a, g.b, g.top, h); cur = g.b; }
      piece(cur, hi, y0, h); return k;
    },
    // room by its inner rectangle; walls of thickness t outside it, ceiling slab, interior record, light strips
    room({ x0, z0, x1, z1, ceil, t = 0.5, mat = 'metal', roofMat = 'metalDark', sides = {}, skip = [], strips = 'white', floorMat }) {
      const S = n => sides[n] || {};
      if (!skip.includes('s')) k.wall({ x0: x0 - t, z0: z0 - t, x1: x1 + t, z1: z0, h: ceil, mat, gaps: S('s').gaps });
      if (!skip.includes('n')) k.wall({ x0: x0 - t, z0: z1, x1: x1 + t, z1: z1 + t, h: ceil, mat, gaps: S('n').gaps });
      if (!skip.includes('w')) k.wall({ x0: x0 - t, z0, x1: x0, z1, h: ceil, mat, gaps: S('w').gaps });
      if (!skip.includes('e')) k.wall({ x0: x1, z0, x1: x1 + t, z1, h: ceil, mat, gaps: S('e').gaps });
      k.solid([x0 - t, ceil, z0 - t], [x1 + t, ceil + 0.5, z1 + t], roofMat);
      L.interiors.push({ x0, z0, x1, z1, ceil });
      if (floorMat) k.deco([x0, 0, z0], [x1, 0.02, z1], floorMat);
      if (strips) { const alongX = (x1 - x0) >= (z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        if (alongX) for (const o of [-0.25, 0.25]) k.deco([x0 + 1, ceil - 0.08, cz + o * (z1 - z0) - 0.12], [x1 - 1, ceil, cz + o * (z1 - z0) + 0.12], strips);
        else for (const o of [-0.25, 0.25]) k.deco([cx + o * (x1 - x0) - 0.12, ceil - 0.08, z0 + 1], [cx + o * (x1 - x0) + 0.12, ceil, z1 - 1], strips); }
      return k;
    },
    // cliff block filling unreachable ground; jagged boulders on the faces that look into the play area; clip above
    rocks(x0, z0, x1, z1, h, faces = []) {
      k.solid([x0, 0, z0], [x1, h, z1], 'rock');
      k.clip([x0, h, z0], [x1, h + 30, z1]);
      for (const f of faces) {
        const alongX = f === 'n' || f === 's', lo = alongX ? x0 : z0, hi = alongX ? x1 : z1;
        for (let s = lo + r(0, 1.5); s < hi - 1; s += r(2.2, 3.6)) {
          const w = r(1.4, 3.0), out = r(0.3, 1.4), bh = r(h * 0.25, h * 0.85), mat = rng() < 0.35 ? 'rockDark' : 'rock';
          const a = s, b = Math.min(hi, s + w);
          if (f === 's') k.solid([a, 0, z0 - out], [b, bh, z0 + 0.5], mat); else if (f === 'n') k.solid([a, 0, z1 - 0.5], [b, bh, z1 + out], mat);
          else if (f === 'w') k.solid([x0 - out, 0, a], [x0 + 0.5, bh, b], mat); else k.solid([x1 - 0.5, 0, a], [x1 + out, bh, b], mat);
          if (rng() < 0.5) { const th = r(0.8, 2.5); const cx = alongX ? r(a, b) : (f === 'w' ? x0 + r(0.6, 3) : x1 - r(0.6, 3)), cz = alongX ? (f === 's' ? z0 + r(0.6, 3) : z1 - r(0.6, 3)) : r(a, b); k.deco([cx - 1, h, cz - 1], [cx + 1, h + th, cz + 1], mat); }
        }
      }
      return k;
    },
    lampPost(x, z, h = 4, glow = 'orange') { k.solid([x - 0.12, 0, z - 0.12], [x + 0.12, h, z + 0.12], 'metalDark'); k.deco([x - 0.35, h - 0.08, z - 0.35], [x + 0.35, h + 0.12, z + 0.35], 'metalDark'); return k.lamp([x, h - 0.2, z], glow); },
    crates(x, z, n = 2, s = 1.6) { for (let i = 0; i < n; i++) { const ox = (i % 2) * (s + 0.05), oy = Math.floor(i / 2) * s; k.solid([x + ox - s / 2, oy, z - s / 2], [x + ox + s / 2, oy + s, z + s / 2], 'crate'); } return k; },
  };
  return k;
}
const GLOW_NAMES = { orange: 1, blue: 1, red: 1, green: 1, white: 1 };
