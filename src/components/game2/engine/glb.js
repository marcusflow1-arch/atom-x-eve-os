/* eslint-disable */
// Tiny GLB reader: returns json, binary chunk and typed-array accessors
export async function loadGLB(url, onProgress) {
  const res = await fetch(url); if (!res.ok) throw new Error('fetch ' + url + ' ' + res.status);
  const buf = await res.arrayBuffer(); return parseGLB(buf);
}
export function parseGLB(buf) {
  const dv = new DataView(buf); if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('not a GLB');
  let off = 12, json = null, bin = null;
  while (off < buf.byteLength) {
    const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true); off += 8;
    if (type === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, off, len)));
    else if (type === 0x004E4942) bin = new Uint8Array(buf, off, len);
    off += len;
  }
  const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
  const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  function accessor(i) {
    const a = json.accessors[i], bv = json.bufferViews[a.bufferView], T = CT[a.componentType], n = NC[a.type];
    const start = (bv.byteOffset || 0) + (a.byteOffset || 0);
    const copy = bin.slice(start, start + a.count * n * T.BYTES_PER_ELEMENT); // aligned copy
    return { data: new T(copy.buffer), count: a.count, size: n, type: a.componentType, normalized: !!a.normalized };
  }
  return { json, bin, accessor };
}
