import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const root = new URL('../public/games/jedi-outcast/', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const names = ['assets0.pk3', 'assets1.pk3', 'assets2.pk3', 'assets5.pk3'];

function setup() {
  const dom = new JSDOM(read('index.html'), {
    url: 'https://atom.test/games/jedi-outcast/index.html',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = () => ({ getExtension: () => ({ loseContext() {} }) });
  w.eval(read('engine-shell.js'));
  w.__ENGINE_FILES = JSON.parse(read('SOURCE.json')).files_sha256;
  w.eval(read('atom-launcher.mjs'));
  return { dom, w, id: name => w.document.getElementById(name) };
}

function sourceRecords(missing = []) {
  return names
    .filter(name => !missing.includes(name))
    .map((name, index) => {
      const first = 3 + index;
      const second = 2 + index;
      const size = first + second;
      return {
        name,
        size,
        chunks: [
          {
            index: 0,
            offset: 0,
            size: first,
            url: `https://storage.example.test/${name}.part0`,
          },
          {
            index: 1,
            offset: first,
            size: second,
            url: `https://storage.example.test/${name}.part1`,
          },
        ],
      };
    });
}

function sendSource(w, paks) {
  w.dispatchEvent(new w.MessageEvent('message', {
    source: w,
    origin: w.location.origin,
    data: { type: 'atom-jedi-canonical-source', paks },
  }));
}

async function waitFor(fn) {
  for (let i = 0; i < 80; i++) {
    if (fn()) return;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  assert.fail('Jedi runtime state did not settle');
}

test('canonical source gate refuses an incomplete retail archive set', () => {
  const { dom, w, id } = setup();
  try {
    const calls = [];
    w.boot = args => calls.push(args);
    sendSource(w, sourceRecords(['assets2.pk3']));
    assert.equal(calls.length, 0);
    assert.equal(id('runtime-error').hidden, false);
    assert.match(id('runtime-error-detail').textContent, /assets2\.pk3/i);
    assert.equal(w.document.querySelector('input[type="file"]'), null);
  } finally {
    dom.window.close();
  }
});

test('canonical source gate rejects gaps in the Base44 chunk layout', () => {
  const { dom, w, id } = setup();
  try {
    const calls = [];
    w.boot = args => calls.push(args);
    const records = sourceRecords();
    records[0].chunks[1].offset += 1;
    sendSource(w, records);
    assert.equal(calls.length, 0);
    assert.equal(id('runtime-error').hidden, false);
    assert.match(id('runtime-error-detail').textContent, /wrong offset/i);
  } finally {
    dom.window.close();
  }
});

test('browser launch requests the native 1024x768 mode without resetting controls', () => {
  const { dom, w, id } = setup();
  try {
    const args = w.__tuneArgs();
    const sets = new Map();
    for (let i = 0; i < args.length - 2; i++) {
      if (args[i] === '+set') sets.set(args[i + 1], args[i + 2]);
    }

    assert.equal(id('canvas').width, 1024);
    assert.equal(id('canvas').height, 768);
    assert.equal(sets.get('r_mode'), '-1');
    assert.equal(sets.get('r_customwidth'), '1024');
    assert.equal(sets.get('r_customheight'), '768');
    assert.equal(Number(sets.get('r_customaspect')), 1024 / 768);

    const shell = read('engine-shell.js');
    assert.doesNotMatch(shell, /\+exec['\"],?\s*['\"]default\.cfg/);
    assert.doesNotMatch(shell, /['\"]bind['\"]/i);
  } finally {
    dom.window.close();
  }
});

test('normal launch reads the persistent cache without the rate-limited status function', () => {
  const runtime = readFileSync(new URL('../src/components/jedioutcast/JediOutcastRuntime.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(runtime, /jediOutcastSource[^\n]*action:\s*['\"]status['\"]/);
  assert.match(runtime, /base44\.entities\.JediPakChunk\.filter/);
  assert.match(runtime, /base44\.entities\.JediSourceAsset\.filter/);
});

test('complete Base44 chunk source boots Raven engine with no injected gameplay commands', () => {
  const { dom, w } = setup();
  try {
    const calls = [];
    w.boot = args => calls.push(args);
    const records = sourceRecords();
    sendSource(w, records);
    sendSource(w, records);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].length, 0);
    assert.equal(w.__JK2_REMOTE_PAKS.map(item => item.name).join(','), names.join(','));
    assert.ok(w.__JK2_REMOTE_PAKS.every(item => item.chunks.length === 2));
    assert.equal(w.__JK2_PAKS.length, 0);
  } finally {
    dom.window.close();
  }
});

test('engine preRun reconstructs cached Base44 chunks into exact /jk2/base PK3 bytes', async () => {
  const { dom, w } = setup();
  try {
    const dependencies = new Set();
    const staged = [];
    const records = sourceRecords();
    w.boot = () => {};
    sendSource(w, records);

    w.addRunDependency = name => dependencies.add(name);
    w.removeRunDependency = name => dependencies.delete(name);
    w.IDBFS = {};
    w.FS = {
      mkdirTree() {},
      mount() {},
      syncfs(populate, done) { done(); },
      readFile() { throw new Error('no saved cfg'); },
      writeFile() {},
      createDataFile(dir, name, bytes, readFlag, writeFlag, own) {
        staged.push({ path: dir + '/' + name, bytes: [...bytes], own });
      },
    };

    const payloadByUrl = new Map();
    records.forEach((record, archiveIndex) => {
      record.chunks.forEach((chunk, chunkIndex) => {
        payloadByUrl.set(
          chunk.url,
          new Uint8Array(chunk.size).fill((archiveIndex + 1) * 10 + chunkIndex),
        );
      });
    });
    payloadByUrl.set(w.__runtimeFile('qagame.wasm'), new Uint8Array([0, 97, 115, 109]));

    w.fetch = async url => {
      const payload = payloadByUrl.get(String(url));
      if (!payload) return { ok: false, status: 404, headers: { get: () => null } };
      let sent = false;
      return {
        ok: true,
        status: 200,
        headers: { get: name => String(name).toLowerCase() === 'content-length' ? String(payload.length) : null },
        body: {
          getReader() {
            return {
              async read() {
                if (sent) return { done: true, value: undefined };
                sent = true;
                return { done: false, value: payload };
              },
            };
          },
        },
        async arrayBuffer() {
          return payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength);
        },
      };
    };

    w.Module.preRun[0]();
    await waitFor(() => dependencies.size === 0);

    for (let archiveIndex = 0; archiveIndex < records.length; archiveIndex++) {
      const record = records[archiveIndex];
      const row = staged.find(item => item.path === '/jk2/base/' + record.name);
      assert.ok(row, record.name);
      assert.equal(row.own, true);
      assert.equal(row.bytes.length, record.size);

      const split = record.chunks[0].size;
      assert.ok(row.bytes.slice(0, split).every(v => v === (archiveIndex + 1) * 10));
      assert.ok(row.bytes.slice(split).every(v => v === (archiveIndex + 1) * 10 + 1));
    }

    assert.ok(staged.some(item => item.path === '/jk2/qagame.wasm'));
  } finally {
    dom.window.close();
  }
});

test('engine errors remain visible after the loading splash has been removed', () => {
  const { dom, w, id } = setup();
  try {
    id('load').remove();
    w.Module.onFatal('Fixture missing texture dependency');
    assert.equal(id('runtime-error').hidden, false);
    assert.match(id('runtime-error-detail').textContent, /missing texture/);
  } finally {
    dom.window.close();
  }
});

test('only the embedding app can request a save flush', () => {
  const { dom, w } = setup();
  try {
    let flushes = 0;
    const replies = [];
    w.booted = true;
    w.__saveCfg = () => {};
    w.FS = {
      syncfs(populate, done) {
        assert.equal(populate, false);
        flushes++;
        done();
      },
    };
    w.postMessage = (data, origin) => replies.push({ data, origin });

    w.dispatchEvent(new w.MessageEvent('message', {
      source: w,
      origin: 'https://unrelated.test',
      data: { type: 'atom-jedi-flush', requestId: 'bad' },
    }));
    assert.equal(flushes, 0);

    w.dispatchEvent(new w.MessageEvent('message', {
      source: w,
      origin: w.location.origin,
      data: { type: 'atom-jedi-flush', requestId: 'ok' },
    }));
    assert.equal(flushes, 1);
    assert.equal(replies[0].data.requestId, 'ok');
    assert.equal(replies[0].data.error, '');
  } finally {
    dom.window.close();
  }
});
test('render status waits for native renderer initialization instead of reporting the default canvas', async () => {
  const { dom, w, id } = setup();
  try {
    const messages = [];
    Object.defineProperty(w, 'parent', { value: { postMessage: value => messages.push(value) } });
    const canvas = id('canvas');
    canvas.width = 300;
    canvas.height = 150;

    w.Module.onRuntimeInitialized();
    assert.equal(messages.some(value => value.type === 'atom-jedi-video'), false);
    assert.equal(messages.some(value => value.state === 'engine-ready'), false);
    // The shell must not clear/resize a buffer behind the renderer's back.
    assert.equal(canvas.width, 300);

    canvas.width = 1024;
    canvas.height = 768;
    const gl = { canvas, drawingBufferWidth: 1024, drawingBufferHeight: 768, isContextLost: () => false };
    w.GL = { currentContext: { GLctx: gl } };
    w.Module.postRun.forEach(fn => fn());
    await waitFor(() => messages.some(value => value.state === 'engine-ready'));

    const video = messages.find(value => value.type === 'atom-jedi-video');
    assert.equal(video.renderWidth, 1024);
    assert.equal(video.renderHeight, 768);
    assert.equal(id('load').classList.contains('hide'), true);
    assert.equal(messages.filter(value => value.state === 'engine-ready').length, 1);
  } finally {
    dom.window.close();
  }
});

test('render status uses actual GPU dimensions and updates after video changes without resizing the buffer', async () => {
  const { dom, w, id } = setup();
  try {
    const messages = [];
    Object.defineProperty(w, 'parent', { value: { postMessage: value => messages.push(value) } });
    const canvas = id('canvas');
    // Simulate a device/context whose actual buffer differs from the requested attributes.
    const gl = { canvas, drawingBufferWidth: 800, drawingBufferHeight: 600, isContextLost: () => false };
    w.GL = { currentContext: { GLctx: gl } };
    w.Module.postRun.forEach(fn => fn());
    await waitFor(() => messages.some(value => value.type === 'atom-jedi-video'));
    assert.equal(messages.find(value => value.type === 'atom-jedi-video').renderWidth, 800);
    assert.equal(canvas.width, 1024);
    assert.equal(canvas.height, 768);

    // The native renderer changes the target; the observer must read the new size.
    gl.drawingBufferWidth = 1024;
    gl.drawingBufferHeight = 768;
    canvas.width = 1024;
    canvas.height = 768;
    await waitFor(() => messages.some(value => value.renderWidth === 1024 && value.renderHeight === 768));

    Object.defineProperty(canvas, 'clientWidth', { value: 640, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 480, configurable: true });
    w.dispatchEvent(new w.Event('resize'));
    await waitFor(() => messages.some(value => value.clientWidth === 640));
    const last = messages.filter(value => value.type === 'atom-jedi-video').at(-1);
    assert.equal(last.renderWidth, 1024);
    assert.equal(last.renderHeight, 768);
    assert.equal(last.clientWidth, 640);
    assert.equal(canvas.width, 1024);
    assert.equal(canvas.height, 768);
    assert.equal(messages.filter(value => value.state === 'engine-ready').length, 1);
  } finally {
    dom.window.close();
  }
});

test('renderer diagnostics do not mark a fatal or lost-context game as running', () => {
  const { dom, w, id } = setup();
  try {
    const messages = [];
    Object.defineProperty(w, 'parent', { value: { postMessage: value => messages.push(value) } });
    const gl = { canvas: id('canvas'), drawingBufferWidth: 1024, drawingBufferHeight: 768, isContextLost: () => true };
    w.GL = { currentContext: { GLctx: gl } };
    w.__reportVideo();
    assert.equal(messages.length, 0);

    gl.isContextLost = () => false;
    w.Module.onFatal('Renderer failed');
    w.__reportVideo();
    assert.equal(messages.some(value => value.state === 'engine-ready'), false);
    assert.equal(id('runtime-error').hidden, false);
  } finally {
    dom.window.close();
  }
});

test('camera recovery uses Raven defaults without forcing player model or view mode', () => {
  const { dom, w } = setup();
  try {
    const args = w.__tuneArgs();
    const sets = new Map();
    for (let i = 0; i < args.length - 2; i++) {
      if (args[i] === '+set') sets.set(args[i + 1], args[i + 2]);
    }
    assert.equal(sets.get('cg_fov'), '80');
    assert.equal(sets.get('cg_thirdPersonRange'), '80');
    assert.equal(sets.get('cg_thirdPersonAngle'), '0');
    assert.equal(sets.get('cg_thirdPersonPitchOffset'), '0');
    assert.equal(sets.get('cg_thirdPersonVertOffset'), '16');
    assert.equal(sets.get('cg_thirdPersonHorzOffset'), '0');
    assert.equal(sets.get('cg_thirdPersonCameraDamp'), '0.3');
    assert.equal(sets.get('cg_thirdPersonTargetDamp'), '0.5');
    assert.equal(sets.has('cg_thirdPerson'), false);
    assert.equal(sets.has('model'), false);
    assert.equal(args.includes('+load'), false);
    assert.equal(args.includes('+map'), false);
  } finally { dom.window.close(); }
});

test('rebuilt JS and both WASM modules use the current per-file build hashes', async () => {
  const { dom, w } = setup();
  try {
    const hashes = { 'jk2.js': 'a'.repeat(64), 'jk2.wasm': 'b'.repeat(64), 'qagame.wasm': 'c'.repeat(64) };
    const calls = [];
    const fetch = async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ files_sha256: hashes }) };
    };
    w.fetch = fetch;
    await w.__loadVersionedEngine();

    assert.equal(calls[0].url, 'SOURCE.json');
    assert.equal(calls[0].options.cache, 'no-store');
    assert.equal(w.document.querySelector('script[src*="jk2.js?v="]').getAttribute('src'), 'jk2.js?v=' + hashes['jk2.js']);
    assert.equal(w.Module.locateFile('jk2.wasm', '/games/jedi-outcast/'), '/games/jedi-outcast/jk2.wasm?v=' + hashes['jk2.wasm']);
    assert.equal(w.__runtimeFile('qagame.wasm'), 'qagame.wasm?v=' + hashes['qagame.wasm']);
    assert.equal(w.Module.locateFile('other.data', '/games/jedi-outcast/'), '/games/jedi-outcast/other.data');
    assert.equal(w.fetch, fetch, 'do not globally rewrite canonical asset URLs');
  } finally { dom.window.close(); }
});

test('invalid engine build metadata stops before mixing old and new runtime artifacts', async () => {
  const { dom, w, id } = setup();
  try {
    w.fetch = async () => ({ ok: true, json: async () => ({ files_sha256: { 'jk2.js': 'old-release' } }) });
    w.boot([]);
    await waitFor(() => !id('runtime-error').hidden);
    assert.match(id('runtime-error-detail').textContent, /Invalid engine version/);
    assert.equal(w.document.querySelector('script[src*="jk2.js?v="]'), null);
  } finally { dom.window.close(); }
});
