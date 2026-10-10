// Level builder: plain-data layout -> collision triangles (BSPCollision format), ray-test boxes and render geometry.
// Units are metres, +X east, +Y up, +Z north (Game 2 / glTF axes). No WebGL here; World uploads the meshes.
//
// Layout primitives (all optional):
//   ground   {x0, z0, x1, z1, y, mat, tile}            walkable ground, tiled (BSPCollision ignores triangles > 100 m)
//   solids   [{min:[x,y,z], max:[x,y,z], mat, walk}]   boxes you collide with; top face walkable unless walk === false
//   clips    [{min, max}]                              invisible walls that keep the player inside the play area
//   ramps    [{x0, z0, x1, z1, y0, y1, dir, mat}]      sloped floors; dir = '+z' | '-z' | '+x' | '-x' (uphill)
//   deco     [{min, max, mat | glow}]                  render-only boxes (light strips, railings, antennas)
//   doors    [{id, min, max, mat, open}]               sliding (upwards) doors
//   interiors[{x0, z0, x1, z1, ceil}]                  rooms with a ceiling: no jumping through it
//   zones    [{id, x0, z0, x1, z1}]                    trigger areas for the mission director
//   lamps    [{p, c}]                                  point light candidates + glowing fittings
//   props    [{kind: 'crate' | 'barrel', x, z}]        physics props for Force Push / Pull
//   interactables [{id, p, r, prompt}]                 'E' use points
//   playerSpawn [x, y, z], playerYaw, navBounds [x0, z0, x1, z1], env {sun / ambient / fog}

export const MATERIALS = {
  ground: [0.30, 0.28, 0.27], rock: [0.50, 0.44, 0.39], rockDark: [0.36, 0.32, 0.30], sand: [0.42, 0.37, 0.31],
  metal: [0.42, 0.44, 0.49], metalDark: [0.21, 0.22, 0.26], panel: [0.55, 0.57, 0.61], floor: [0.29, 0.30, 0.33],
  grate: [0.18, 0.19, 0.21], crate: [0.44, 0.37, 0.26], hazard: [0.78, 0.62, 0.16], pad: [0.33, 0.34, 0.37],
  console: [0.16, 0.18, 0.24], hull: [0.62, 0.61, 0.57], hullDark: [0.30, 0.30, 0.31], white: [0.86, 0.87, 0.9], door: [0.36, 0.39, 0.45],
};
export const GLOWS = { orange: [1, 0.6, 0.24], blue: [0.32, 0.68, 1], red: [1, 0.22, 0.16], green: [0.35, 1, 0.55], white: [0.95, 0.96, 1] };

const hash = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };

export function meshBuilder() {
  const pos = [], nrm = [], col = [], idx = [];
  const c8 = c => [Math.round(Math.min(1, c[0]) * 255), Math.round(Math.min(1, c[1]) * 255), Math.round(Math.min(1, c[2]) * 255), 255];
  const v = (p, n, c) => { pos.push(p[0], p[1], p[2]); nrm.push(n[0], n[1], n[2]); col.push(...c8(c)); return pos.length / 3 - 1; };
  const api = {
    // p0..p3: a closed loop; winding is fixed so the face points along n. cs: one colour or one per corner
    quad(p0, p1, p2, p3, n, cs) {
      const C = Array.isArray(cs[0]) ? cs : [cs, cs, cs, cs];
      const a = v(p0, n, C[0]), b = v(p1, n, C[1]), c = v(p2, n, C[2]), d = v(p3, n, C[3]);
      const e1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], e2 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
      const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] > 0) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c);
      return api;
    },
    // axis-aligned box; side faces get a darker foot (cheap ambient occlusion)
    box(mn, mx, c, o = {}) {
      const [x0, y0, z0] = mn, [x1, y1, z1] = mx, foot = c.map(k => k * (o.foot ?? 0.72)), top = c.map(k => k * 1.06);
      const side = (a, b, cc, d, n) => api.quad(a, b, cc, d, n, [foot, foot, c, c]);
      api.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], top);
      if (!o.noBottom) api.quad([x0, y0, z0], [x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [0, -1, 0], foot);
      side([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0]);
      side([x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [-1, 0, 0]);
      side([x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [0, 0, 1]);
      side([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1]);
      return api;
    },
    get count() { return idx.length; },
    build() { return { pos: new Float32Array(pos), nrm: new Float32Array(nrm), col: new Uint8Array(col), idx: new Uint32Array(idx) }; },
  };
  return api;
}

const tint = (mat, mn) => { const c = MATERIALS[mat] || MATERIALS.metal; const j = 0.93 + 0.14 * hash(mn[0], mn[1], mn[2]); return [c[0] * j, c[1] * j, c[2] * j]; };

export function buildLevel(L) {
  const tris = [], solids = [], clips = [];
  const base = meshBuilder(), glows = new Map();
  const glowMesh = name => { if (!glows.has(name)) glows.set(name, meshBuilder()); return glows.get(name); };
  const floorTri = (a, b, c) => tris.push({ a, b, c, normal: [0, 1, 0] });
  const floorRect = (x0, z0, x1, z1, y) => { floorTri([x0, y, z0], [x1, y, z0], [x1, y, z1]); floorTri([x0, y, z0], [x1, y, z1], [x0, y, z1]); };
  const wallRect = (p, q, yb, yt, n) => { tris.push({ a: [p[0], yb, p[1]], b: [q[0], yb, q[1]], c: [q[0], yt, q[1]], normal: n }); tris.push({ a: [p[0], yb, p[1]], b: [q[0], yt, q[1]], c: [p[0], yt, p[1]], normal: n }); };
  // collision for a box: walkable top + four wall faces. Low boxes (<= 0.5 m) are steps: no walls, you walk up them.
  // Wall tops sit 0.2 m below the real top so someone standing on the box is not shoved off its edge.
  const boxCollision = (mn, mx, walk) => {
    const [x0, y0, z0] = mn, [x1, y1, z1] = mx;
    if (walk !== false) floorRect(x0, z0, x1, z1, y1);
    if (y1 - y0 <= 0.5) return;
    const yt = y1 - 0.2;
    wallRect([x0, z0], [x1, z0], y0, yt, [0, 0, -1]); wallRect([x1, z1], [x0, z1], y0, yt, [0, 0, 1]);
    wallRect([x0, z1], [x0, z0], y0, yt, [-1, 0, 0]); wallRect([x1, z0], [x1, z1], y0, yt, [1, 0, 0]);
  };

  // ground
  const G = L.ground;
  if (G) {
    const tile = G.tile || 26, y = G.y ?? 0;
    for (let x = G.x0; x < G.x1 - 1e-6; x += tile) for (let z = G.z0; z < G.z1 - 1e-6; z += tile) {
      const x1 = Math.min(G.x1, x + tile), z1 = Math.min(G.z1, z + tile); floorRect(x, z, x1, z1, y);
      const c = tint(G.mat || 'ground', [x, y, z]); base.quad([x, y, z], [x1, y, z], [x1, y, z1], [x, y, z1], [0, 1, 0], c);
    }
  }
  for (const s of L.solids || []) {
    boxCollision(s.min, s.max, s.walk);
    solids.push({ min: s.min, max: s.max });
    base.box(s.min, s.max, tint(s.mat, s.min), { noBottom: s.min[1] <= 0.01 });
  }
  for (const s of L.clips || []) { boxCollision(s.min, s.max, false); clips.push({ min: s.min, max: s.max }); }
  for (const r of L.ramps || []) {
    const { x0, z0, x1, z1, y0, y1 } = r, dir = r.dir || '+z';
    const h = (x, z) => { const k = dir === '+z' ? (z - z0) / (z1 - z0) : dir === '-z' ? (z1 - z) / (z1 - z0) : dir === '+x' ? (x - x0) / (x1 - x0) : (x1 - x) / (x1 - x0); return y0 + (y1 - y0) * k; };
    const P = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => [x, h(x, z), z]);
    const e1 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], e2 = [P[3][0] - P[0][0], P[3][1] - P[0][1], P[3][2] - P[0][2]];
    let n = [e2[1] * e1[2] - e2[2] * e1[1], e2[2] * e1[0] - e2[0] * e1[2], e2[0] * e1[1] - e2[1] * e1[0]]; const nl = Math.hypot(...n); n = n.map(k => k / nl); if (n[1] < 0) n = n.map(k => -k);
    tris.push({ a: P[0], b: P[1], c: P[2], normal: n }); tris.push({ a: P[0], b: P[2], c: P[3], normal: n });
    const c = tint(r.mat || 'metal', [x0, y0, z0]); base.quad(P[0], P[1], P[2], P[3], n, c);
    // side skirts (rendered both ways round so they show from either side)
    const along = dir === '+z' || dir === '-z';
    const sides = along ? [[P[0], P[3], -1], [P[1], P[2], 1]] : [[P[0], P[1], -1], [P[3], P[2], 1]];
    for (const [a, b, sgn] of sides) {
      const nn = along ? [sgn, 0, 0] : [0, 0, sgn]; const foot = c.map(k => k * 0.7);
      base.quad([a[0], y0, a[2]], [b[0], y0, b[2]], b, a, nn, [foot, foot, c, c]);
      base.quad([a[0], y0, a[2]], a, b, [b[0], y0, b[2]], nn.map(k => -k), [foot, c, c, foot]);
    }
  }
  for (const d of L.deco || []) {
    if (d.glow) glowMesh(d.glow).box(d.min, d.max, GLOWS[d.glow].map(k => k * 0.85), { foot: 1 });
    else base.box(d.min, d.max, tint(d.mat, d.min), { noBottom: d.min[1] <= 0.01 });
  }
  const doorMeshes = (L.doors || []).map(d => {
    const m = meshBuilder(), w = [d.max[0] - d.min[0], d.max[1] - d.min[1], d.max[2] - d.min[2]], c = MATERIALS[d.mat || 'door'];
    m.box([0, 0, 0], w, c, { foot: 0.8 });
    // hazard stripe + status light on both faces
    const thinX = w[0] < w[2], s = 0.02;
    const stripe = thinX ? [[-s, w[1] * 0.08, 0], [w[0] + s, w[1] * 0.16, w[2]]] : [[0, w[1] * 0.08, -s], [w[0], w[1] * 0.16, w[2] + s]];
    m.box(stripe[0], stripe[1], MATERIALS.hazard, { foot: 1 });
    return { id: d.id, mesh: m.build(), origin: d.min.slice() };
  });
  for (const l of L.lamps || []) glowMesh(l.glow || 'orange').box([l.p[0] - 0.14, l.p[1] - 0.1, l.p[2] - 0.14], [l.p[0] + 0.14, l.p[1] + 0.1, l.p[2] + 0.14], GLOWS[l.glow || 'orange'], { foot: 1 });

  return {
    name: L.name || 'level', tris, solids, clips,
    doors: (L.doors || []).map(d => ({ id: d.id, min: d.min, max: d.max, open: !!d.open })),
    interiors: L.interiors || [], zones: L.zones || [], props: L.props || [], interactables: L.interactables || [],
    lamps: (L.lamps || []).map(l => ({ p: l.p, c: l.c || GLOWS[l.glow || 'orange'] })),
    playerSpawn: L.playerSpawn || [0, 0, 0], playerYaw: L.playerYaw || 0, navBounds: L.navBounds, env: L.env || null,
    render: { base: base.build(), glows: [...glows].map(([name, m]) => ({ glow: GLOWS[name], mesh: m.build() })) }, doorMeshes,
  };
}
