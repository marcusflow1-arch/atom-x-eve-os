// SPDX-License-Identifier: GPL-2.0
// Reads original game files. It never creates substitute game content.
export const RETAIL_PAKS = Object.freeze([
  ['assets0.pk3', 'Original base-game archive'],
  ['assets1.pk3', 'Original retail archive 1'],
  ['assets2.pk3', 'Original retail archive 2'],
  ['assets5.pk3', 'Original 1.04 patch archive'],
]);

export const REQUIRED_FILES = Object.freeze([
  ['productid.txt', 'Full-game data'],
  ['default.cfg', 'Original configuration'],
  ['maps/kejim_post.bsp', 'Kejim Outpost geometry'],
  ['models/players/kyle/model.glm', 'Kyle Katarn model'],
  ['models/players/jan/model.glm', 'Jan Ors model'],
  ['models/players/stormtrooper/model.glm', 'Stormtrooper model'],
  ['models/players/_humanoid/_humanoid.gla', 'Original skeletal animations'],
  ['models/players/_humanoid/animation.cfg', 'Animation sequences'],
  ['models/players/kyle/model_default.skin', 'Kyle skin mapping'],
  ['scripts/kejim_post/kejim_start.ibi', 'Kejim mission script'],
]);
const CONTENT_ROOTS = new Set(['models', 'maps', 'scripts', 'textures', 'shaders', 'sound', 'music', 'video', 'fonts', 'menu', 'ui', 'ext_data', 'gfx', 'strip', 'forcecfg', 'vm', 'botfiles', 'botroutes', 'eagle', 'fffx', 'levelshots', 'cfg']);
const MAX_BYTES = 1536 * 1024 * 1024;
const decoder = new TextDecoder();

export function safePath(value) {
  const path = String(value).replace(/\\/g, '/').toLowerCase();
  if (!path || path.startsWith('/') || /[\x00-\x1f:]/.test(path) || path.split('/').some(p => p === '..' || p === '.')) throw new Error('Invalid game-file path. Select an unmodified GameData/base folder.');
  return path;
}

export function selectedPath(file) {
  if (!file.webkitRelativePath) return safePath(file.name);
  const parts = safePath(file.webkitRelativePath).split('/');
  const base = parts.indexOf('base');
  return parts.slice(base >= 0 ? base + 1 : 1).join('/');
}

// ZIP central-directory parsing, not a text search of the tail. ZIP64 and multipart
// archives are rejected explicitly; the retail paks use ordinary single-disk ZIP.
export async function readPakDirectory(file) {
  if (file.size < 22) throw new Error(`${file.name}: not a complete PK3 archive.`);
  const tailStart = Math.max(0, file.size - 65557);
  const tail = new Uint8Array(await file.slice(tailStart).arrayBuffer());
  const endView = new DataView(tail.buffer);
  let end = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (endView.getUint32(i, true) === 0x06054b50 && i + 22 + endView.getUint16(i + 20, true) === tail.length) { end = i; break; }
  }
  if (end < 0) throw new Error(`${file.name}: incomplete ZIP directory. Copy the original file again.`);
  const count = endView.getUint16(end + 10, true);
  const size = endView.getUint32(end + 12, true);
  const offset = endView.getUint32(end + 16, true);
  if (endView.getUint16(end + 4, true) || endView.getUint16(end + 6, true) || endView.getUint16(end + 8, true) !== count || count === 65535 || offset === 0xffffffff || size === 0xffffffff) throw new Error(`${file.name}: multipart or ZIP64 archives are not supported. Use the original assets*.pk3 files.`);
  if (size > 32 * 1024 * 1024 || offset + size > tailStart + end) throw new Error(`${file.name}: invalid ZIP directory bounds.`);
  const buffer = await file.slice(offset, offset + size).arrayBuffer();
  const view = new DataView(buffer), bytes = new Uint8Array(buffer), entries = new Map();
  let pos = 0;
  for (let n = 0; n < count; n++) {
    if (pos + 46 > size || view.getUint32(pos, true) !== 0x02014b50) throw new Error(`${file.name}: damaged ZIP entry.`);
    const flags = view.getUint16(pos + 8, true), method = view.getUint16(pos + 10, true);
    const compressedSize = view.getUint32(pos + 20, true), unpackedSize = view.getUint32(pos + 24, true);
    const nameSize = view.getUint16(pos + 28, true), extra = view.getUint16(pos + 30, true), comment = view.getUint16(pos + 32, true);
    const localOffset = view.getUint32(pos + 42, true);
    const next = pos + 46 + nameSize + extra + comment;
    if (next > size || localOffset + 30 + compressedSize > offset || (flags & 1) || ![0, 8].includes(method) || unpackedSize === 0xffffffff) throw new Error(`${file.name}: unsupported or truncated ZIP entry.`);
    const path = safePath(decoder.decode(bytes.subarray(pos + 46, pos + 46 + nameSize)));
    if (!path.endsWith('/')) {
      if (entries.has(path)) throw new Error(`${file.name}: duplicate path ${path}. Use the original archive.`);
      entries.set(path, { path, file, method, compressedSize, size: unpackedSize, localOffset });
    }
    pos = next;
  }
  if (pos !== size) throw new Error(`${file.name}: unexpected data in ZIP directory.`);
  return entries;
}

async function readHeader(entry) {
  if (entry.loose) return new Uint8Array(await entry.file.slice(0, 8).arrayBuffer());
  const local = new DataView(await entry.file.slice(entry.localOffset, entry.localOffset + 30).arrayBuffer());
  if (local.byteLength !== 30 || local.getUint32(0, true) !== 0x04034b50) throw new Error(`${entry.path}: damaged local ZIP header.`);
  const start = entry.localOffset + 30 + local.getUint16(26, true) + local.getUint16(28, true);
  if (start + entry.compressedSize > entry.file.size) throw new Error(`${entry.path}: truncated content.`);
  const blob = entry.file.slice(start, start + entry.compressedSize);
  if (entry.method === 0) return new Uint8Array(await blob.slice(0, 8).arrayBuffer());
  if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot validate compressed game files. Open the app in current Chrome or Edge.');
  const reader = blob.stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const header = new Uint8Array(8); let total = 0;
  try {
    while (total < 8) {
      const { done, value } = await reader.read();
      if (done) break;
      const amount = Math.min(8 - total, value.length);
      header.set(value.subarray(0, amount), total); total += amount;
    }
  } finally { await reader.cancel().catch(() => {}); }
  return header.subarray(0, total);
}

export async function inspectGameFiles(selection, progress = () => {}) {
  const paks = [], loose = [], paths = new Set(); let totalBytes = 0;
  for (const selected of Array.from(selection || [])) {
    const file = selected?.file || selected;
    const path = selected?.path ? safePath(selected.path) : selectedPath(file);
    if (!path || path.startsWith('saves/') || path === 'jk2config.cfg') continue;
    const pak = /^assets\d+\.pk3$/.test(path);
    if (!pak && !CONTENT_ROOTS.has(path.split('/')[0]) && !/^[^/]+\.(cfg|txt|dat)$/.test(path)) continue;
    if (paths.has(path)) throw new Error(`Duplicate file: ${path}. Choose one installation only.`);
    paths.add(path); totalBytes += file.size;
    (pak ? paks : loose).push({ path, file });
  }
  if (totalBytes > MAX_BYTES) throw new Error('The selected set is too large for this browser loader. Select only the original GameData/base files (up to 1.5 GB).');
  if (!paks.length && !loose.length) throw new Error('No game data selected. Choose assets*.pk3 or the extracted base folder.');
  const entries = new Map();
  // Match the engine's later-pak precedence. Loose files are indexed only when
  // no pak supplied that path, matching the original search-path order.
  paks.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  for (const pak of paks) {
    progress(`Checking ${pak.path}…`);
    for (const [path, entry] of await readPakDirectory(pak.file)) entries.set(path, entry);
  }
  for (const item of loose) if (!entries.has(item.path)) entries.set(item.path, { ...item, loose: true, size: item.file.size });
  const checks = REQUIRED_FILES.map(([path, label]) => ({ path, label, present: Number(entries.get(path)?.size) > 0 }));

  // When the admin/player supplies the canonical packed installation, require the
  // complete archive set from the provided PC/GOG install. A single PK3 containing
  // Kejim is not enough to call the whole original game ready. Fully extracted
  // GameData/base folders remain supported and are validated by their actual content.
  if (paks.length) {
    const selectedPaks = new Set(paks.map(item => item.path));
    for (const [path, label] of RETAIL_PAKS) {
      checks.push({ path, label, present: selectedPaks.has(path) });
    }
  }

  const families = [
    ['Textures', path => /^(textures|models)\/.*\.(jpg|jpeg|tga|png)$/.test(path)],
    ['Shader definitions', path => /^shaders\/.*\.shader$/.test(path)],
    ['Original audio', path => /^(sound|music)\/.*\.(wav|mp3)$/.test(path)],
    ['Original menus', path => /^(ui|menu)\/.*\.menu$/.test(path)],
  ];
  for (const [label, match] of families) checks.push({ label, path: label.toLowerCase(), present: Array.from(entries).some(([path, entry]) => entry.size > 0 && match(path)) });
  const missing = checks.filter(c => !c.present).map(c => c.path);
  if (!missing.length) {
    for (const [path] of REQUIRED_FILES.filter(([path]) => /\.(bsp|glm|gla)$/.test(path))) {
      const bytes = await readHeader(entries.get(path));
      const magic = path.endsWith('.bsp') ? 'RBSP' : path.endsWith('.glm') ? '2LGM' : '2LGA';
      const version = path.endsWith('.bsp') ? 1 : 6;
      if (bytes.length < 8 || decoder.decode(bytes.subarray(0, 4)) !== magic || new DataView(bytes.buffer, bytes.byteOffset, 8).getInt32(4, true) !== version) throw new Error(`${path}: not the original Jedi Outcast format (${magic} v${version}).`);
    }
  }
  return { ready: !missing.length, checks, missing, paks, loose, totalBytes, entryCount: entries.size };
}
