import fs from 'node:fs';

export function readGLB(path) {
  const bytes = fs.readFileSync(path);
  if (bytes.readUInt32LE(0) !== 0x46546c67) throw new Error('Expected a GLB');
  const length = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + length).toString());
  const bin = bytes.subarray(28 + length);
  const widths = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const types = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array };
  function accessor(index) {
    const a = json.accessors[index], v = json.bufferViews[a.bufferView], Type = types[a.componentType];
    const width = widths[a.type], start = bin.byteOffset + (v.byteOffset || 0) + (a.byteOffset || 0);
    if (!v.byteStride || v.byteStride === width * Type.BYTES_PER_ELEMENT) return new Type(bin.buffer, start, a.count * width);
    const result = new Type(a.count * width);
    for (let i = 0; i < a.count; i++) result.set(new Type(bin.buffer, start + i * v.byteStride, width), i * width);
    return result;
  }
  function view(index) { const v = json.bufferViews[index]; return bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength); }
  return { json, bin, accessor, view };
}

export function builder(json) {
  const chunks = []; let offset = 0;
  json.accessors = []; json.bufferViews = []; json.buffers = [{ byteLength: 0 }];
  function addView(data, target) {
    const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    const i = json.bufferViews.length;
    json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buffer.length, ...(target ? { target } : {}) });
    chunks.push(buffer); offset += buffer.length;
    const pad = (4 - offset % 4) % 4; if (pad) { chunks.push(Buffer.alloc(pad)); offset += pad; }
    return i;
  }
  function addAccessor(data, type, target, bounds = false) {
    const width = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
    const componentType = data instanceof Float32Array ? 5126 : data instanceof Uint32Array ? 5125 : data instanceof Uint16Array ? 5123 : 5121;
    const a = { bufferView: addView(data, target), componentType, count: data.length / width, type };
    if (bounds) {
      a.min = Array(width).fill(Infinity); a.max = Array(width).fill(-Infinity);
      for (let i = 0; i < data.length; i++) { const k = i % width; a.min[k] = Math.min(a.min[k], data[i]); a.max[k] = Math.max(a.max[k], data[i]); }
    }
    return json.accessors.push(a) - 1;
  }
  function write(path) {
    json.buffers[0].byteLength = offset;
    let j = Buffer.from(JSON.stringify(json)); j = Buffer.concat([j, Buffer.alloc((4 - j.length % 4) % 4, 0x20)]);
    const head = Buffer.alloc(20); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4);
    head.writeUInt32LE(28 + j.length + offset, 8); head.writeUInt32LE(j.length, 12); head.writeUInt32LE(0x4e4f534a, 16);
    const bh = Buffer.alloc(8); bh.writeUInt32LE(offset, 0); bh.writeUInt32LE(0x004e4942, 4);
    fs.writeFileSync(path, Buffer.concat([head, j, bh, ...chunks]));
  }
  return { addView, addAccessor, write };
}
