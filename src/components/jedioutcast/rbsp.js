const HEADER_LUMPS = 18;
const LUMP_ENTITIES = 0;
const LUMP_SHADERS = 1;
const LUMP_MODELS = 7;
const LUMP_DRAWVERTS = 10;
const LUMP_DRAWINDEXES = 11;
const LUMP_SURFACES = 13;

const DRAWVERT_SIZE = 80;
const DSURFACE_SIZE = 148;
const DSHADER_SIZE = 72;
const DMODEL_SIZE = 40;

const MST_PLANAR = 1;
const MST_PATCH = 2;
const MST_TRIANGLE_SOUP = 3;
const MST_FLARE = 4;

const decoder = new TextDecoder();

function checkRange(buffer, offset, length, label) {
  if (offset < 0 || length < 0 || offset + length > buffer.byteLength) {
    throw new Error(`${label} lump points outside the RBSP file.`);
  }
}

function lumpAt(view, index) {
  const base = 8 + index * 8;
  return { offset: view.getInt32(base, true), length: view.getInt32(base + 4, true) };
}

function cString(bytes) {
  const end = bytes.indexOf(0);
  return decoder.decode(end >= 0 ? bytes.subarray(0, end) : bytes).trim();
}

export function convertJkPoint(x, y, z) {
  // Jedi Outcast / id Tech 3 is Z-up. Three.js is Y-up.
  // X,Z,-Y preserves a right-handed coordinate system without inventing geometry.
  return [x, z, -y];
}

function convertPoint(x, y, z) {
  return convertJkPoint(x, y, z);
}

export function parseJediEntityLump(text) {
  const entities = [];
  for (const block of String(text || '').matchAll(/\{([\s\S]*?)\}/g)) {
    const entity = {};
    for (const pair of block[1].matchAll(/"([^"]*)"\s+"([^"]*)"/g)) {
      entity[pair[1]] = pair[2];
    }
    if (Object.keys(entity).length) entities.push(entity);
  }
  return entities;
}

export function parseJediVector(value) {
  const parts = String(value || '').trim().split(/\s+/).map(Number);
  if (parts.length < 3 || parts.some(v => !Number.isFinite(v))) return null;
  return parts.slice(0, 3);
}

function readVert(view, offset) {
  const xyz = convertPoint(
    view.getFloat32(offset + 0, true),
    view.getFloat32(offset + 4, true),
    view.getFloat32(offset + 8, true),
  );
  const st = [
    view.getFloat32(offset + 12, true),
    view.getFloat32(offset + 16, true),
  ];
  const normal = convertPoint(
    view.getFloat32(offset + 52, true),
    view.getFloat32(offset + 56, true),
    view.getFloat32(offset + 60, true),
  );
  return { xyz, st, normal };
}

function readSurface(view, offset) {
  return {
    shaderNum: view.getInt32(offset + 0, true),
    fogNum: view.getInt32(offset + 4, true),
    surfaceType: view.getInt32(offset + 8, true),
    firstVert: view.getInt32(offset + 12, true),
    numVerts: view.getInt32(offset + 16, true),
    firstIndex: view.getInt32(offset + 20, true),
    numIndexes: view.getInt32(offset + 24, true),
    patchWidth: view.getInt32(offset + 140, true),
    patchHeight: view.getInt32(offset + 144, true),
  };
}

function bezier2(a, b, c, t) {
  const mt = 1 - t;
  return mt * mt * a + 2 * mt * t * b + t * t * c;
}

function bezierVec3(a, b, c, t) {
  return [
    bezier2(a[0], b[0], c[0], t),
    bezier2(a[1], b[1], c[1], t),
    bezier2(a[2], b[2], c[2], t),
  ];
}

function bezierVec2(a, b, c, t) {
  return [
    bezier2(a[0], b[0], c[0], t),
    bezier2(a[1], b[1], c[1], t),
  ];
}

function patchPoint(grid, width, x0, y0, u, v, field, dims) {
  const rows = [];
  for (let row = 0; row < 3; row++) {
    const a = grid[(y0 + row) * width + x0][field];
    const b = grid[(y0 + row) * width + x0 + 1][field];
    const c = grid[(y0 + row) * width + x0 + 2][field];
    rows.push(dims === 3 ? bezierVec3(a, b, c, u) : bezierVec2(a, b, c, u));
  }
  return dims === 3 ? bezierVec3(rows[0], rows[1], rows[2], v) : bezierVec2(rows[0], rows[1], rows[2], v);
}

function normalize(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function appendPatch(surface, verts, out, subdivisions = 5) {
  const width = surface.patchWidth;
  const height = surface.patchHeight;
  if (width < 3 || height < 3 || width % 2 === 0 || height % 2 === 0) return false;
  const grid = verts.slice(surface.firstVert, surface.firstVert + surface.numVerts);
  if (grid.length !== width * height) return false;

  for (let y0 = 0; y0 <= height - 3; y0 += 2) {
    for (let x0 = 0; x0 <= width - 3; x0 += 2) {
      const base = out.positions.length / 3;
      for (let y = 0; y <= subdivisions; y++) {
        const v = y / subdivisions;
        for (let x = 0; x <= subdivisions; x++) {
          const u = x / subdivisions;
          const p = patchPoint(grid, width, x0, y0, u, v, 'xyz', 3);
          const uv = patchPoint(grid, width, x0, y0, u, v, 'st', 2);
          const n = normalize(patchPoint(grid, width, x0, y0, u, v, 'normal', 3));
          out.positions.push(...p);
          out.uvs.push(...uv);
          out.normals.push(...n);
        }
      }
      const stride = subdivisions + 1;
      for (let y = 0; y < subdivisions; y++) {
        for (let x = 0; x < subdivisions; x++) {
          const a = base + y * stride + x;
          const b = a + 1;
          const c = a + stride;
          const d = c + 1;
          out.indices.push(a, c, b, b, c, d);
        }
      }
    }
  }
  return true;
}

export function parseJediOutcastRbsp(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  if (bytes.byteLength < 8 + HEADER_LUMPS * 8) throw new Error('RBSP file is too small.');
  const magic = decoder.decode(bytes.subarray(0, 4));
  const version = view.getInt32(4, true);
  if (magic !== 'RBSP' || version !== 1) {
    throw new Error(`Expected Jedi Outcast RBSP v1, received ${magic} v${version}.`);
  }

  const lumps = Array.from({ length: HEADER_LUMPS }, (_, i) => lumpAt(view, i));
  lumps.forEach((l, i) => checkRange(arrayBuffer, l.offset, l.length, `RBSP #${i}`));

  const shaderLump = lumps[LUMP_SHADERS];
  if (shaderLump.length % DSHADER_SIZE) throw new Error('Shader lump has an invalid size.');
  const shaders = [];
  for (let o = shaderLump.offset; o < shaderLump.offset + shaderLump.length; o += DSHADER_SIZE) {
    shaders.push({
      name: cString(bytes.subarray(o, o + 64)),
      surfaceFlags: view.getInt32(o + 64, true),
      contentFlags: view.getInt32(o + 68, true),
    });
  }

  const vertLump = lumps[LUMP_DRAWVERTS];
  if (vertLump.length % DRAWVERT_SIZE) throw new Error('Draw-vertex lump has an invalid size.');
  const verts = [];
  for (let o = vertLump.offset; o < vertLump.offset + vertLump.length; o += DRAWVERT_SIZE) {
    verts.push(readVert(view, o));
  }

  const indexLump = lumps[LUMP_DRAWINDEXES];
  if (indexLump.length % 4) throw new Error('Draw-index lump has an invalid size.');
  const sourceIndices = [];
  for (let o = indexLump.offset; o < indexLump.offset + indexLump.length; o += 4) {
    sourceIndices.push(view.getInt32(o, true));
  }

  const surfaceLump = lumps[LUMP_SURFACES];
  if (surfaceLump.length % DSURFACE_SIZE) throw new Error('Surface lump has an invalid size.');
  const surfaces = [];
  for (let o = surfaceLump.offset; o < surfaceLump.offset + surfaceLump.length; o += DSURFACE_SIZE) {
    surfaces.push(readSurface(view, o));
  }

  const modelLump = lumps[LUMP_MODELS];
  const models = [];
  if (modelLump.length % DMODEL_SIZE === 0) {
    for (let o = modelLump.offset; o < modelLump.offset + modelLump.length; o += DMODEL_SIZE) {
      models.push({
        mins: convertPoint(view.getFloat32(o, true), view.getFloat32(o + 4, true), view.getFloat32(o + 8, true)),
        maxs: convertPoint(view.getFloat32(o + 12, true), view.getFloat32(o + 16, true), view.getFloat32(o + 20, true)),
        firstSurface: view.getInt32(o + 24, true),
        numSurfaces: view.getInt32(o + 28, true),
        firstBrush: view.getInt32(o + 32, true),
        numBrushes: view.getInt32(o + 36, true),
      });
    }
  }

  const out = { positions: [], normals: [], uvs: [], indices: [] };
  let planar = 0;
  let triangleSoup = 0;
  let patches = 0;
  let flares = 0;
  let skipped = 0;

  for (const surface of surfaces) {
    if (surface.surfaceType === MST_PATCH) {
      if (appendPatch(surface, verts, out)) patches++;
      else skipped++;
      continue;
    }
    if (surface.surfaceType === MST_FLARE) {
      flares++;
      continue;
    }
    if (surface.surfaceType !== MST_PLANAR && surface.surfaceType !== MST_TRIANGLE_SOUP) {
      skipped++;
      continue;
    }

    if (surface.surfaceType === MST_PLANAR) planar++;
    else triangleSoup++;

    if (
      surface.firstVert < 0 ||
      surface.numVerts < 0 ||
      surface.firstVert + surface.numVerts > verts.length ||
      surface.firstIndex < 0 ||
      surface.numIndexes < 0 ||
      surface.firstIndex + surface.numIndexes > sourceIndices.length
    ) {
      throw new Error('RBSP surface references data outside its source lump.');
    }

    const base = out.positions.length / 3;
    for (let i = 0; i < surface.numVerts; i++) {
      const vert = verts[surface.firstVert + i];
      out.positions.push(...vert.xyz);
      out.normals.push(...normalize(vert.normal));
      out.uvs.push(...vert.st);
    }
    for (let i = 0; i < surface.numIndexes; i++) {
      const idx = sourceIndices[surface.firstIndex + i];
      if (idx < 0 || idx >= surface.numVerts) throw new Error('RBSP surface contains an invalid draw index.');
      out.indices.push(base + idx);
    }
  }

  const entityLump = lumps[LUMP_ENTITIES];
  const entitiesText = decoder.decode(bytes.subarray(entityLump.offset, entityLump.offset + entityLump.length)).replace(/\0+$/, '');
  const entities = parseJediEntityLump(entitiesText);
  const playerEntity = entities.find(entity => entity.classname === 'info_player_start') || null;
  let playerStart = null;
  if (playerEntity) {
    const origin = parseJediVector(playerEntity.origin);
    if (origin) {
      const point = convertJkPoint(origin[0], origin[1], origin[2]);
      const yaw = Number(playerEntity.angle || 0);
      playerStart = {
        position: point,
        yaw: Number.isFinite(yaw) ? yaw : 0,
        target: playerEntity.target || '',
        spawnflags: Number(playerEntity.spawnflags || 0) || 0,
        source: playerEntity,
      };
    }
  }

  return {
    magic,
    version,
    geometry: out,
    shaders,
    surfaces,
    models,
    entitiesText,
    entities,
    playerStart,
    stats: {
      fileBytes: bytes.byteLength,
      shaders: shaders.length,
      vertices: verts.length,
      sourceIndices: sourceIndices.length,
      surfaces: surfaces.length,
      planar,
      triangleSoup,
      patches,
      flares,
      skipped,
      entities: entities.length,
      renderVertices: out.positions.length / 3,
      renderTriangles: out.indices.length / 3,
    },
  };
}
