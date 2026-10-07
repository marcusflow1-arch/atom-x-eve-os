import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { File } from 'node:buffer';
import { inspectGameFiles, readPakDirectory, REQUIRED_FILES, RETAIL_PAKS } from '../public/games/jedi-outcast/asset-validation.mjs';

// Tiny, nonplayable format fixtures only. No game models or maps are generated.
function formatHeader(magic, version) {
  const data = Buffer.alloc(8); data.write(magic); data.writeInt32LE(version, 4); return data;
}
function coreEntries() {
  const entries = Object.fromEntries(REQUIRED_FILES.map(([name]) => [name,
    name.endsWith('.bsp') ? formatHeader('RBSP', 1) : name.endsWith('.glm') ? formatHeader('2LGM', 6) : name.endsWith('.gla') ? formatHeader('2LGA', 6) : Buffer.from('fixture')]));
  return { ...entries, 'textures/test/test.tga': Buffer.from('fixture'), 'shaders/test.shader': Buffer.from('fixture'), 'sound/test.wav': Buffer.from('fixture'), 'ui/main.menu': Buffer.from('fixture') };
}
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}
function makePak(entries, compressed = false, fileName = 'assets0.pk3') {
  const local = [], central = []; let offset = 0;
  for (const [path, original] of Object.entries(entries)) {
    const name = Buffer.from(path), data = Buffer.from(original), packed = compressed ? deflateRawSync(data) : data;
    const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(compressed ? 8 : 0, 8);
    header.writeUInt32LE(crc32(data), 14); header.writeUInt32LE(packed.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(name.length, 26);
    const dir = Buffer.alloc(46); dir.writeUInt32LE(0x02014b50, 0); dir.writeUInt16LE(20, 6); dir.writeUInt16LE(compressed ? 8 : 0, 10);
    dir.writeUInt32LE(crc32(data), 16); dir.writeUInt32LE(packed.length, 20); dir.writeUInt32LE(data.length, 24); dir.writeUInt16LE(name.length, 28); dir.writeUInt32LE(offset, 42);
    local.push(header, name, packed); central.push(dir, name); offset += header.length + name.length + packed.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length / 2, 8); end.writeUInt16LE(central.length / 2, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return new File([Buffer.concat([...local, directory, end])], fileName);
}

function retailPakSet(entries, compressed = false) {
  return RETAIL_PAKS.map(([name], index) =>
    makePak(index === 0 ? entries : {}, index === 0 ? compressed : false, name)
  );
}

test('complete ordinary and deflated retail PK3 sets pass format inspection', async () => {
  for (const compressed of [false, true]) {
    const report = await inspectGameFiles(retailPakSet(coreEntries(), compressed));
    assert.equal(report.ready, true); assert.equal(report.entryCount, 14);
  }
});

test('partial packed installs cannot masquerade as the whole original game', async () => {
  const report = await inspectGameFiles([makePak(coreEntries())]);
  assert.equal(report.ready, false);
  for (const [path] of RETAIL_PAKS.slice(1)) assert.ok(report.missing.includes(path));
});
test('NAV, scripts and reference images cannot masquerade as a playable level', async () => {
  const file = new File(['navigation fixture'], 'kejim_post.nav');
  Object.defineProperty(file, 'webkitRelativePath', { value: 'base/maps/kejim_post.nav' });
  const report = await inspectGameFiles([file]);
  assert.equal(report.ready, false);
  for (const path of ['maps/kejim_post.bsp', 'models/players/kyle/model.glm', 'models/players/_humanoid/_humanoid.gla']) assert.ok(report.missing.includes(path));
  await assert.rejects(inspectGameFiles([new File(['screenshot'], 'frame.jpg')]), /No game data/);
});
test('extracted GameData/base folder mounts original paths and omits user saves', async () => {
  const files = Object.entries(coreEntries()).map(([name, data]) => {
    const file = new File([data], name.split('/').at(-1));
    Object.defineProperty(file, 'webkitRelativePath', { value: `Install/GameData/base/${name}` }); return file;
  });
  const save = new File(['private save'], 'save.sav'); Object.defineProperty(save, 'webkitRelativePath', { value: 'Install/GameData/base/saves/save.sav' });
  const report = await inspectGameFiles([...files, save]);
  assert.equal(report.ready, true); assert.equal(report.loose.length, 14); assert.equal(report.paks.length, 0);
});
test('wrong engine formats and empty original-file names are rejected', async () => {
  const wrong = coreEntries(); wrong['maps/kejim_post.bsp'] = formatHeader('IBSP', 46);
  await assert.rejects(inspectGameFiles(retailPakSet(wrong)), /not the original Jedi Outcast format/);
  const empty = coreEntries(); empty['models/players/kyle/model.glm'] = Buffer.alloc(0);
  assert.ok((await inspectGameFiles(retailPakSet(empty))).missing.includes('models/players/kyle/model.glm'));
});
test('truncated ZIP, path traversal and duplicate selected archives are rejected', async () => {
  const pak = makePak(coreEntries());
  await assert.rejects(readPakDirectory(new File([await pak.slice(0, pak.size - 9).arrayBuffer()], 'assets0.pk3')), /incomplete ZIP/);
  await assert.rejects(readPakDirectory(makePak({ '../models/kyle': Buffer.from('bad') })), /Invalid game-file path/);
  await assert.rejects(inspectGameFiles([pak, pak]), /Duplicate file/);
});
test('runtime bytes match the pinned GPL release and both modules are valid WASM', () => {
  const root = new URL('../public/games/jedi-outcast/', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('SOURCE.json', root)));
  for (const [name, sha] of Object.entries(manifest.files_sha256)) {
    const bytes = readFileSync(new URL(name, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), sha);
    if (name.endsWith('.wasm')) assert.equal(WebAssembly.validate(bytes), true, name);
  }
  assert.equal(manifest.retail_data_included, false);
});
