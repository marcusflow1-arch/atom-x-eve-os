// Minimal GLB reader / writer for the avatar motion tools: parse the JSON and BIN chunks, read accessors, append new
// accessors (data goes to the end of the BIN chunk, existing bytes are untouched) and write the file back.
import { readFileSync, writeFileSync } from 'node:fs';

const COMPONENT = { 5120: [Int8Array, 127], 5121: [Uint8Array, 255], 5122: [Int16Array, 32767], 5123: [Uint16Array, 65535], 5125: [Uint32Array, 0], 5126: [Float32Array, 0] };
const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

export function readGlb(path) {
  const b = readFileSync(path);
  if (b.readUInt32LE(0) !== 0x46546c67) throw new Error(path + ' is not a GLB');
  const jl = b.readUInt32LE(12), json = JSON.parse(b.slice(20, 20 + jl).toString('utf8'));
  const bl = b.readUInt32LE(20 + jl), bin = Buffer.from(b.slice(28 + jl, 28 + jl + bl));
  return { json, bin, extra: [] };
}

// accessor -> array of tuples (Float32 values; normalized integer types are converted to 0..1 / -1..1)
export function readAccessor(glb, index) {
  const { json, bin } = glb, a = json.accessors[index], v = json.bufferViews[a.bufferView];
  const [Type, norm] = COMPONENT[a.componentType], n = SIZE[a.type], bytes = Type.BYTES_PER_ELEMENT;
  const stride = v.byteStride || n * bytes, base = (v.byteOffset || 0) + (a.byteOffset || 0), out = [];
  for (let i = 0; i < a.count; i++) {
    const row = [];
    for (let k = 0; k < n; k++) {
      const off = base + i * stride + k * bytes;
      let x = Type === Float32Array ? bin.readFloatLE(off) : Type === Uint8Array ? bin.readUInt8(off) : Type === Int8Array ? bin.readInt8(off)
        : Type === Uint16Array ? bin.readUInt16LE(off) : Type === Int16Array ? bin.readInt16LE(off) : bin.readUInt32LE(off);
      if (a.normalized && norm) x = Math.max(-1, x / norm);
      row.push(x);
    }
    out.push(row);
  }
  return out;
}

// overwrite a float accessor's values where they already are (same count and type; nothing else in the file moves)
export function writeAccessorInPlace(glb, index, rows) {
  const { json, bin } = glb, a = json.accessors[index], v = json.bufferViews[a.bufferView];
  const write = { 5126: [4, (x, o) => bin.writeFloatLE(x, o)], 5121: [1, (x, o) => bin.writeUInt8(x, o)], 5123: [2, (x, o) => bin.writeUInt16LE(x, o)] }[a.componentType];
  if (!write || a.normalized || rows.length !== a.count) throw new Error('in-place write needs a float or unsigned integer accessor of the same size');
  const [bytes, put] = write, n = SIZE[a.type], stride = v.byteStride || n * bytes, base = (v.byteOffset || 0) + (a.byteOffset || 0);
  rows.forEach((r, i) => { for (let k = 0; k < n; k++) put(r[k], base + i * stride + k * bytes); });
}

// append float data as a new accessor; returns its index
export function addAccessor(glb, rows, type, withMinMax = false) {
  const n = SIZE[type], f = new Float32Array(rows.length * n);
  rows.forEach((r, i) => { for (let k = 0; k < n; k++) f[i * n + k] = r[k]; });
  const pending = glb.extra.reduce((s, x) => s + x.length, 0);
  let offset = glb.bin.length + pending;
  const pad = (4 - (offset % 4)) % 4; if (pad) { glb.extra.push(Buffer.alloc(pad)); offset += pad; }
  const data = Buffer.from(f.buffer, f.byteOffset, f.byteLength); glb.extra.push(data);
  glb.json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: data.length });
  const acc = { bufferView: glb.json.bufferViews.length - 1, componentType: 5126, count: rows.length, type };
  if (withMinMax) {
    acc.min = Array.from({ length: n }, (_, k) => Math.min(...rows.map(r => r[k])));
    acc.max = Array.from({ length: n }, (_, k) => Math.max(...rows.map(r => r[k])));
  }
  glb.json.accessors.push(acc);
  return glb.json.accessors.length - 1;
}

export function writeGlb(glb, path) {
  const body = Buffer.concat([glb.bin, ...glb.extra]);
  const bin = Buffer.concat([body, Buffer.alloc((4 - (body.length % 4)) % 4)]);
  glb.json.buffers[0].byteLength = body.length;
  let js = Buffer.from(JSON.stringify(glb.json), 'utf8'); js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  const c1 = Buffer.alloc(8); c1.writeUInt32LE(js.length, 0); c1.writeUInt32LE(0x4e4f534a, 4);
  const c2 = Buffer.alloc(8); c2.writeUInt32LE(bin.length, 0); c2.writeUInt32LE(0x004e4942, 4);
  writeFileSync(path, Buffer.concat([head, c1, js, c2, bin]));
  return 12 + 8 + js.length + 8 + bin.length;
}

// value of every channel of an animation at time t (linear / step sampling); returns Map(node -> {translation, rotation, scale, weights})
export function sampleAnimation(glb, anim, t) {
  const out = new Map();
  for (const ch of anim.channels) {
    const s = anim.samplers[ch.sampler], times = readAccessor(glb, s.input).map(r => r[0]), vals = readAccessor(glb, s.output);
    let value;
    const per = ch.target.path === 'weights' ? vals.length / times.length : 1;
    const at = i => per === 1 ? vals[i] : vals.slice(i * per, i * per + per).map(r => r[0]);
    if (t <= times[0] || times.length === 1) value = at(0);
    else if (t >= times[times.length - 1]) value = at(times.length - 1);
    else {
      let i = 0; while (times[i + 1] < t) i++;
      const a = at(i), b = at(i + 1), k = s.interpolation === 'STEP' ? 0 : (t - times[i]) / (times[i + 1] - times[i]);
      value = a.map((x, j) => x + (b[j] - x) * k);
      if (ch.target.path === 'rotation') { const l = Math.hypot(...value); value = value.map(x => x / l); }
    }
    const rec = out.get(ch.target.node) || {}; rec[ch.target.path] = value; out.set(ch.target.node, rec);
  }
  return out;
}
