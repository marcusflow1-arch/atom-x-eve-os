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

test('browser launch pins Raven custom video mode to the Base44 viewport', () => {
  const { dom, w } = setup();
  try {
    Object.defineProperty(w, 'innerWidth', { configurable: true, value: 1366 });
    Object.defineProperty(w, 'innerHeight', { configurable: true, value: 768 });
    Object.defineProperty(w, 'devicePixelRatio', { configurable: true, value: 1 });

    const args = w.__tuneArgs();
    const pairs = new Map();
    for (let i = 0; i < args.length - 2; i++) {
      if (args[i] === '+set') pairs.set(args[i + 1], args[i + 2]);
    }

    assert.equal(pairs.get('r_mode'), '-1');
    assert.equal(pairs.get('r_customwidth'), '1366');
    assert.equal(pairs.get('r_customheight'), '768');
    assert.equal(Number(pairs.get('r_customaspect')).toFixed(4), (1366 / 768).toFixed(4));
  } finally {
    dom.window.close();
  }
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
    payloadByUrl.set('qagame.wasm', new Uint8Array([0, 97, 115, 109]));

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