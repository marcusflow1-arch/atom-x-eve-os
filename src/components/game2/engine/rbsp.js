/* eslint-disable */
// Game 2 native Jedi Outcast RBSP (Raven BSP v1) geometry + walkable surfaces.
// Source: Drive map archive /maps/duel_training.bsp ("Lightsaber Training").
// Quake coords: X/Y horizontal, Z up. Game coords: X/Z horizontal, Y up.
import { v3 } from './math.js';

const SCALE = 1 / 48;
const ORIGIN = [-64, -928, 64];
const CELL = 3.5;
const toGame = (x, y, z) => [(x - ORIGIN[0]) * SCALE, (z - ORIGIN[2]) * SCALE, (y - ORIGIN[1]) * SCALE];
const F = (view, offset) => view.getFloat32(offset, true);
const I = (view, offset) => view.getInt32(offset, true);

function shaderColor(name) {
  const key = name.toLowerCase();
  if (/gold/.test(key)) return [169, 143, 89];
  if (/vine|rockwall|rockblock/.test(key)) return [81, 94, 69];
  if (/metal|met_|stock|impdetention/.test(key)) return [92, 106, 117];
  if (/floor|tile/.test(key)) return [114, 105, 87];
  if (/trim|block/.test(key)) return [139, 116, 92];
  if (/light_blue/.test(key)) return [126, 172, 210];
  if (/stonepanel/.test(key)) return [123, 114, 104];
  return [128, 119, 108];
}
const visible = name => !/caulk|noshader|\/clip|\/trigger|\/nodraw|\/sky|\/fog|\/glass|\/hint|\/skip/.test(name.toLowerCase());
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function parseRBSP(buffer) {
  const raw = buffer instanceof ArrayBuffer ? buffer : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const d = new DataView(raw), bytes = new Uint8Array(raw);
  if (d.byteLength < 152 || String.fromCharCode(...bytes.slice(0, 4)) !== 'RBSP' || I(d, 4) !== 1) throw new Error('Game 2 map: invalid Raven RBSP v1 file');
  const lumps = Array.from({length: 18}, (_, n) => {
    const off = d.getUint32(8 + 8 * n, true), len = d.getUint32(12 + 8 * n, true);
    if (off > d.byteLength || len > d.byteLength - off) throw new Error('Game 2 map: corrupt BSP lump ' + n);
    return { off, len };
  });
  if (lumps[1].len % 72 || lumps[10].len % 80 || lumps[11].len % 4 || lumps[13].len % 148) throw new Error('Game 2 map: unrecognized BSP surface layout');
  const utf = new TextDecoder();
  const mat = Array.from({length: lumps[1].len / 72}, (_, n) => {
    const off = lumps[1].off + n * 72, rawName = bytes.slice(off, off + 64);
    return utf.decode(rawName.slice(0, rawName.indexOf(0) >= 0 ? rawName.indexOf(0) : rawName.length));
  });
  const nverts = lumps[10].len / 80;
  const vertexNormals = Array.from({length: nverts}, (_, n) => { const o = lumps[10].off + n * 80 + 52; return [F(d,o),F(d,o+8),F(d,o+4)]; });
  const vertices = Array.from({length: nverts}, (_, n) => {
    const o = lumps[10].off + n * 80;
    return toGame(F(d, o), F(d, o + 4), F(d, o + 8));
  });
  const indexes = new Int32Array(lumps[11].len / 4);
  for (let i = 0; i < indexes.length; i++) indexes[i] = I(d, lumps[11].off + i * 4);

  const positions = [], normals = [], colors = [], tris = [], outIdx = [];
  const textured = new Map();
  const textureUV = Array.from({ length: nverts }, (_, n) => {
    const o = lumps[10].off + n * 80;
    return [F(d, o + 12), F(d, o + 16)];
  });
  let surfaces = 0;
  function addTri(a, b, c, rgb, light = 0.85, expected = null, shaderName = '', texcoords = null) {
    const cr = v3.cross(v3.sub(b, a), v3.sub(c, a));
    if (v3.len(cr) < 1e-7) return;
    let n = v3.norm(cr);
    // Use Raven's authored per-vertex face normals to restore winding after
    // converting the BSP coordinate system, not arbitrary front-face reversal.
    if (expected && v3.dot(n, expected) < 0) {
      [b, c] = [c, b];
      if (texcoords) [texcoords[1], texcoords[2]] = [texcoords[2], texcoords[1]];
      n = v3.scale(n, -1);
    }
    const idx = positions.length / 3;
    const tint = rgb.map(v => clamp(Math.round(v * light), 0, 255));
    for (const p of [a, b, c]) {
      positions.push(...p); normals.push(...n); colors.push(...tint, 255);
    }
    outIdx.push(idx, idx + 1, idx + 2);
    tris.push({ a, b, c, normal: n });
    if (shaderName && texcoords) {
      const group = textured.get(shaderName) || { pos: [], nrm: [], col: [], uv: [], idx: [] };
      const offset = group.pos.length / 3;
      for (let k = 0; k < 3; k++) {
        const p = [a, b, c][k];
        group.pos.push(...p); group.nrm.push(...n); group.col.push(...tint, 255);
        group.uv.push(...texcoords[k]);
        group.idx.push(offset + k);
      }
      textured.set(shaderName, group);
    }
  }
  const interp = (a,b,c,t) => a*(1-t)*(1-t)+2*b*t*(1-t)+c*t*t;
  const quad = (grid,u,v) => {
    const a = [0,1,2].map(row => [0,1,2].map(col => grid[row*3+col]));
    return Array.from({length: grid[0].length},(_,axis) => interp(
      interp(a[0][0][axis],a[0][1][axis],a[0][2][axis],u),
      interp(a[1][0][axis],a[1][1][axis],a[1][2][axis],u),
      interp(a[2][0][axis],a[2][1][axis],a[2][2][axis],u), v));
  };
  for (let n = 0; n < lumps[13].len / 148; n++) {
    const off = lumps[13].off + n * 148;
    const shader = I(d, off), type = I(d, off + 8), firstV = I(d, off + 12), numV = I(d, off + 16);
    const firstI = I(d, off + 20), numI = I(d, off + 24);
    const name = mat[shader] || '';
    if (!visible(name) || firstV < 0 || firstV + numV > vertices.length) continue;
    const rgb = shaderColor(name);
    const lm = I(d, off + 36); // first lightmap index in the Raven multi-style record
    let light = 0.9;
    if (lm >= 0 && lm * 128 * 128 * 3 < lumps[14].len) {
      // Per-surface sample from the map's own baked lightmap; source textures are
      // not shipped, so keep map geometry/lighting with material-specific albedo.
      const sample = lumps[14].off + lm * 128 * 128 * 3 + 3 * (64 * 128 + 64);
      light = clamp((bytes[sample] + bytes[sample + 1] + bytes[sample + 2]) / (255 * 3) * 1.25, 0.42, 1.0);
    }
    if ((type === 1 || type === 3) && firstI >= 0 && numI >= 0 && firstI + numI <= indexes.length && numI % 3 === 0) {
      for (let j = firstI; j < firstI + numI; j += 3) {
        const a = indexes[j], b = indexes[j + 1], c = indexes[j + 2];
        if (Math.min(a, b, c) < 0 || Math.max(a, b, c) >= numV) continue;
        addTri(vertices[firstV + a], vertices[firstV + b], vertices[firstV + c], rgb, light, vertexNormals[firstV + a], name, [textureUV[firstV+a].slice(),textureUV[firstV+b].slice(),textureUV[firstV+c].slice()]);
      }
      surfaces++;
    } else if (type === 2) {
      const width = I(d, off + 140), height = I(d, off + 144);
      if (width < 3 || height < 3 || width * height > numV || width > 33 || height > 33) continue;
      for (let y = 0; y + 2 < height; y += 2) for (let x = 0; x + 2 < width; x += 2) {
        const grid = Array.from({length: 9}, (_, j) => vertices[firstV + (y + Math.floor(j / 3)) * width + x + j % 3]);
        const uvGrid = Array.from({length: 9}, (_, j) => textureUV[firstV + (y + Math.floor(j / 3)) * width + x + j % 3]);
        for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
          const q1 = quad(grid,b/4,a/4), q2 = quad(grid,(b+1)/4,a/4),
                q3 = quad(grid,(b+1)/4,(a+1)/4), q4 = quad(grid,b/4,(a+1)/4);
          const uv1 = quad(uvGrid,b/4,a/4), uv2 = quad(uvGrid,(b+1)/4,a/4),
                uv3 = quad(uvGrid,(b+1)/4,(a+1)/4), uv4 = quad(uvGrid,b/4,(a+1)/4);
          addTri(q1,q2,q3,rgb,light,vertexNormals[firstV],name,[uv1,uv2,uv3]);
          addTri(q1,q3,q4,rgb,light,vertexNormals[firstV],name,[uv1,uv3,uv4]);
        }
      }
      surfaces++;
    }
  }
  if (tris.length < 100 || tris.length > 300000) throw new Error('Game 2 map: no usable world geometry');
  const text = utf.decode(bytes.slice(lumps[0].off, lumps[0].off + lumps[0].len));
  const entities = [];
  for (const hit of text.matchAll(/\{([^{}]*)\}/g)) {
    const e = {}, regex = /"([^"]+)"\s*"([^"]*)"/g;
    for (const kv of hit[1].matchAll(regex)) e[kv[1]] = kv[2];
    entities.push(e);
  }
  const world = entities.find(e => e.classname === 'worldspawn') || {};
  const spawns = entities.filter(e => ['info_player_start', 'info_player_deathmatch'].includes(e.classname) && e.origin)
    .map(e => {
      const a = e.origin.split(/\s+/).map(Number);
      if (a.length !== 3 || !a.every(Number.isFinite)) return null;
      const pos = toGame(a[0], a[1], a[2] - 24); // quake spawn origin is 24 units above feet
      return { pos, kind: e.classname, angle: Number(e.angle) || 0 };
    }).filter(Boolean);
  return {
    name: world.mapname || 'Lightsaber Training', source: 'duel_training.bsp', originalSurfaceCount: surfaces,
    mesh: { pos: new Float32Array(positions), nrm: new Float32Array(normals), col: new Uint8Array(colors), idx: new Uint32Array(outIdx) },
    tris, spawns, materials: mat,
    texturedMeshes: Array.from(textured, ([shader, g]) => ({
      shader,
      mesh: { pos: new Float32Array(g.pos), nrm: new Float32Array(g.nrm), col: new Uint8Array(g.col), uv: new Float32Array(g.uv), idx: new Uint32Array(g.idx) }
    })),
  };
}

// Spatialized solid surfaces. Both the visual mesh and terrain collision use
// triangles parsed directly from the original BSP, not placeholder blocks.
export class BSPCollision {
  constructor(map) {
    this.map = map; this.floors = new Map(); this.walls = new Map();
    const put = (cells, x, z, entry) => {
      const k = Math.floor(x / CELL) + ',' + Math.floor(z / CELL);
      const arr = cells.get(k) || []; arr.push(entry); cells.set(k, arr);
    };
    for (const t of map.tris) {
      const xs = [t.a[0],t.b[0],t.c[0]], zs = [t.a[2],t.b[2],t.c[2]];
      const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
      if (Math.abs(maxX - minX) > 100 || Math.abs(maxZ - minZ) > 100) continue;
      let dest, entry;
      if (t.normal[1] > 0.58) { dest = this.floors; entry = t; }
      else if (Math.abs(t.normal[1]) < 0.40) {
        let p=t.a,q=t.b; let max=0;
        for (const [a,b] of [[t.a,t.b],[t.b,t.c],[t.c,t.a]]) {
          const ds=(a[0]-b[0])**2+(a[2]-b[2])**2;
          if (ds>max) {max=ds;p=a;q=b;}
        }
        if (max<0.003)continue;
        dest=this.walls; entry={p,q, bottom:Math.min(t.a[1],t.b[1],t.c[1]),top:Math.max(t.a[1],t.b[1],t.c[1])};
      } else continue;
      for (let ix = Math.floor((minX - 0.55) / CELL); ix <= Math.floor((maxX + 0.55) / CELL); ix++)
        for (let iz = Math.floor((minZ - 0.55) / CELL); iz <= Math.floor((maxZ + 0.55) / CELL); iz++)
          put(dest, ix * CELL + 0.01, iz * CELL + 0.01, entry);
    }
  }
  near(grid,x,z) { return grid.get(Math.floor(x/CELL)+','+Math.floor(z/CELL)) || []; }
  floorAt(x,z,top=Infinity) {
    let best=null;
    for (const tri of this.near(this.floors,x,z)) {
      const [a,b,c]=[tri.a,tri.b,tri.c];
      const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);
      if (Math.abs(den)<1e-7)continue;
      const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den;
      const v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;
      const w=1-u-v;
      if(u < -0.007 || v < -0.007 || w < -0.007)continue;
      const y=u*a[1]+v*b[1]+w*c[1];
      if(y<=top+0.005 && (best===null || y>best))best=y;
    }
    return best;
  }
  collide(pos,r) {
    for(let pass=0;pass<2;pass++)for(const wall of this.near(this.walls,pos[0],pos[2])) {
      if (pos[1] > wall.top + 0.15 || pos[1] + 1.6 < wall.bottom) continue;
      const px=wall.p[0],pz=wall.p[2],dx=wall.q[0]-px,dz=wall.q[2]-pz;
      const len2=dx*dx+dz*dz; if(len2<1e-8)continue;
      const t=clamp(((pos[0]-px)*dx+(pos[2]-pz)*dz)/len2,0,1);
      const cx=px+dx*t,cz=pz+dz*t,wx=pos[0]-cx,wz=pos[2]-cz,dist=Math.hypot(wx,wz);
      if(dist>=r || dist<1e-5)continue;
      pos[0]+=wx/dist*(r-dist);pos[2]+=wz/dist*(r-dist);
    }
  }
  chooseSpawns() {
    // Stay inside one accessible floor section to ensure the Reborn can engage.
    const candidate = this.map.spawns.find(e=>e.kind==='info_player_deathmatch') || this.map.spawns[0];
    if(!candidate) throw new Error('Game 2 map: no player spawn');
    const start=candidate.pos.slice();
    start[1]=this.floorAt(start[0],start[2],start[1]+1.5) ?? start[1];
    for(const rad of [4.5,5.5,3.5,7]) for(let n=0;n<24;n++) {
      const angle=n*Math.PI/12, x=start[0]+Math.cos(angle)*rad, z=start[2]+Math.sin(angle)*rad;
      const floor=this.floorAt(x,z,start[1]+0.75);
      if(floor===null||Math.abs(floor-start[1])>0.7)continue;
      const other=[x,floor,z], orig=other.slice();
      this.collide(other,0.5);
      if(Math.hypot(other[0]-orig[0],other[2]-orig[2])>0.15)continue;
      // Reject enemy spawns separated by level walls.
      let clear=true;
      for(let j=1;j<=8;j++) {
        const px=start[0]+(x-start[0])*j/8,pz=start[2]+(z-start[2])*j/8;
        const y=this.floorAt(px,pz,start[1]+0.75);
        if(y===null||Math.abs(y-start[1])>0.8){clear=false;break;}
        const test=[px,y,pz], before=test.slice();this.collide(test,0.5);
        if(Math.hypot(test[0]-before[0],test[2]-before[2])>0.15){clear=false;break;}
      }
      if(clear)return {player:start,enemy:other};
    }
    throw new Error('Game 2 map: could not locate two safe spawn positions');
  }
}
