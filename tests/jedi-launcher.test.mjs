import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { File } from 'node:buffer';
import { JSDOM } from 'jsdom';
import { inspectGameFiles, REQUIRED_FILES } from '../public/games/jedi-outcast/asset-validation.mjs';

const root = new URL('../public/games/jedi-outcast/', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
function setup() {
  const dom = new JSDOM(read('index.html'), { url: 'https://atom.test/games/jedi-outcast/index.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = () => ({ getExtension: () => ({ loseContext() {} }) });
  w.inspectGameFiles = inspectGameFiles;
  w.eval(read('engine-shell.js'));
  w.eval(read('atom-launcher.mjs').replace("import { inspectGameFiles } from './asset-validation.mjs';", ''));
  return { dom, w, id: name => w.document.getElementById(name) };
}
async function waitFor(fn) {
  for (let i = 0; i < 60; i++) { if (fn()) return; await new Promise(resolve => setTimeout(resolve, 5)); }
  assert.fail('Launcher state did not settle');
}
function choose(w, input, files) {
  Object.defineProperty(input, 'files', { configurable: true, value: files });
  input.dispatchEvent(new w.Event('change', { bubbles: true }));
}
function looseFixtures() {
  const paths = [...REQUIRED_FILES.map(([path]) => path), 'textures/test.tga', 'shaders/test.shader', 'sound/test.wav', 'ui/main.menu'];
  return paths.map(path => {
    const bytes = Buffer.alloc(8);
    const format = path.endsWith('.bsp') ? ['RBSP', 1] : path.endsWith('.glm') ? ['2LGM', 6] : path.endsWith('.gla') ? ['2LGA', 6] : ['test', 0];
    bytes.write(format[0]); bytes.writeUInt32LE(format[1], 4);
    const file = new File([bytes], path.split('/').at(-1));
    Object.defineProperty(file, 'webkitRelativePath', { value: 'base/' + path }); return file;
  });
}

test('launcher stays behind a file gate; missing assets never start a replacement scene', async () => {
  const { dom, w, id } = setup();
  try {
    assert.equal(id('start-game').disabled, true);
    assert.equal(w.document.querySelector('script[src*="jk2.js"]'), null);
    const f = new File(['navigation'], 'kejim_post.nav'); Object.defineProperty(f, 'webkitRelativePath', { value: 'base/maps/kejim_post.nav' });
    choose(w, id('folder-files'), [f]);
    await waitFor(() => !id('choose-folder').disabled);
    assert.equal(id('start-game').disabled, true);
    assert.match(id('own-note').textContent, /incomplete/);
    assert.match(id('file-checks').textContent, /maps\/kejim_post.bsp/);
    assert.equal(w.document.querySelector('script[src*="jk2.js"]'), null);
  } finally { dom.window.close(); }
});
test('accepted files are staged with original paths and boot gets no gameplay commands', async () => {
  const { dom, w, id } = setup();
  try {
    const calls = [], staged = [], dependencies = new Set();
    w.boot = args => calls.push(args);
    choose(w, id('folder-files'), looseFixtures());
    await waitFor(() => !id('start-game').disabled);
    id('start-game').click(); id('start-game').click();
    assert.equal(calls.length, 1); assert.equal(calls[0].length, 0);
    w.addRunDependency = name => dependencies.add(name);
    w.removeRunDependency = name => dependencies.delete(name);
    w.FS = { mkdirTree() {}, createDataFile(dir, name, bytes, read, write, own) { staged.push({ path: dir + '/' + name, bytes, own }); } };
    w.Module.preRun.at(-1)();
    await waitFor(() => dependencies.size === 0);
    assert.equal(staged.length, 14);
    assert.ok(staged.some(f => f.path === '/jk2/base/models/players/kyle/model.glm'));
    assert.ok(staged.every(f => f.bytes.length === 8 && f.own === true));
  } finally { dom.window.close(); }
});
test('engine errors remain visible after the loading splash has been removed', () => {
  const { dom, w, id } = setup();
  try {
    id('load').remove();
    w.Module.onFatal('Fixture missing texture dependency');
    assert.equal(id('runtime-error').hidden, false);
    assert.match(id('runtime-error-detail').textContent, /missing texture/);
  } finally { dom.window.close(); }
});
test('only the embedding app can request a save flush', async () => {
  const { dom, w } = setup();
  try {
    let flushes = 0; const replies = [];
    w.booted = true; w.__saveCfg = () => {};
    w.FS = { syncfs(populate, done) { assert.equal(populate, false); flushes++; done(); } };
    w.postMessage = (data, origin) => replies.push({ data, origin });
    w.dispatchEvent(new w.MessageEvent('message', { source: w, origin: 'https://unrelated.test', data: { type: 'atom-jedi-flush', requestId: 'bad' } }));
    assert.equal(flushes, 0);
    w.dispatchEvent(new w.MessageEvent('message', { source: w, origin: w.location.origin, data: { type: 'atom-jedi-flush', requestId: 'ok' } }));
    assert.equal(flushes, 1); assert.equal(replies[0].data.requestId, 'ok'); assert.equal(replies[0].data.error, '');
  } finally { dom.window.close(); }
});
