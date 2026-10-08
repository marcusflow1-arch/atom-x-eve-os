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
    .map((name, index) => ({
      name,
      size: 4 + index,
      url: `https://drive.usercontent.google.com/download?id=fixture-${name}&export=download&confirm=t`,
    }));
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

test('complete canonical source boots Raven engine with no injected gameplay commands', () => {
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
    assert.equal(w.__JK2_PAKS.length, 0);
  } finally {
    dom.window.close();
  }
});

test('engine preRun stages canonical remote PK3s into /jk2/base', async () => {
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

    const payloadByUrl = new Map(records.map((record, index) => [
      record.url,
      new Uint8Array(record.size).fill(index + 1),
    ]));
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
        async arrayBuffer() { return payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength); },
      };
    };

    w.Module.preRun[0]();
    await waitFor(() => dependencies.size === 0);

    for (const name of names) {
      const row = staged.find(item => item.path === '/jk2/base/' + name);
      assert.ok(row, name);
      assert.equal(row.own, true);
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
