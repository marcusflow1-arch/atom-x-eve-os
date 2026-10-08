// SPDX-License-Identifier: GPL-2.0
// Atom XE bridge: the embedding app supplies canonical retail PK3 chunks
// prepared by the Base44 backend. The browser never fetches Google Drive directly.

const REQUIRED_PAKS = ['assets0.pk3', 'assets1.pk3', 'assets2.pk3', 'assets5.pk3'];
let started = false;

const notify = (state, detail = '') => {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'atom-jedi-status', state, detail }, location.origin);
  }
};

const showFatal = text => {
  notify('error', String(text || 'The game engine stopped.'));
  const box = document.getElementById('runtime-error');
  const detail = document.getElementById('runtime-error-detail');
  if (box) box.hidden = false;
  if (detail) detail.textContent = String(text || 'The game engine stopped.');
};

const originalFatal = window.Module.onFatal;
window.Module.onFatal = text => {
  originalFatal?.(text);
  showFatal(text);
};
window.Module.onAbort = reason => window.Module.onFatal(String(reason || 'The game engine stopped.'));

function validateCanonicalPaks(records) {
  const byName = new Map();

  for (const record of Array.isArray(records) ? records : []) {
    const name = String(record?.name || '').toLowerCase();
    if (!REQUIRED_PAKS.includes(name) || byName.has(name)) continue;

    const size = Number(record?.size || 0);
    if (!(size > 0)) throw new Error(`${name}: canonical source size is missing.`);

    const chunks = Array.isArray(record?.chunks)
      ? [...record.chunks].sort((a, b) => Number(a?.index) - Number(b?.index))
      : [];

    if (!chunks.length) throw new Error(`${name}: Base44 chunk cache is empty.`);

    let nextOffset = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const index = Number(chunk?.index);
      const offset = Number(chunk?.offset);
      const chunkSize = Number(chunk?.size);
      const url = String(chunk?.url || '');

      if (index !== i) throw new Error(`${name}: chunk order is invalid at index ${i}.`);
      if (offset !== nextOffset) throw new Error(`${name}: chunk ${i} starts at the wrong offset.`);
      if (!(chunkSize > 0)) throw new Error(`${name}: chunk ${i} has no size.`);
      if (!/^https:\/\//i.test(url)) throw new Error(`${name}: chunk ${i} has no Base44 storage URL.`);

      nextOffset += chunkSize;
    }

    if (nextOffset !== size) {
      throw new Error(`${name}: cached chunks total ${nextOffset} bytes, expected ${size}.`);
    }

    byName.set(name, { name, size, chunks });
  }

  const missing = REQUIRED_PAKS.filter(name => !byName.has(name));
  if (missing.length) throw new Error(`Canonical Jedi Outcast archives are incomplete: ${missing.join(', ')}`);

  return REQUIRED_PAKS.map(name => byName.get(name));
}

function startCanonicalGame(records) {
  if (started) return;
  const paks = validateCanonicalPaks(records);

  if (!window.WebAssembly) throw new Error('This browser does not support WebAssembly.');

  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl') || probe.getContext('experimental-webgl');
  if (!gl) throw new Error('WebGL is unavailable. Enable hardware acceleration and reopen the app.');
  gl.getExtension('WEBGL_lose_context')?.loseContext();

  window.__JK2_GAMEDIR = 'base';
  window.__JK2_PAKS = [];
  window.__JK2_REMOTE_PAKS = paks;

  started = true;
  notify('files-ready');
  notify('starting');

  const params = new URLSearchParams(location.search);
  if (params.get('lab') === 'character') {
    // Character systems lab: boot the original single-player engine into the
    // first mission with cheats enabled, then unlock the retail player's complete
    // weapon/inventory set and every Force power at level 3. These are Raven
    // console/game commands from the released source; the normal campaign path
    // remains untouched when lab=character is absent.
    window.boot([
      '+devmap', 'kejim_post',
      '+wait', '120',
      '+give', 'all',
      '+setForceAll', '3',
      '+weapon', '1',
    ]);
    return;
  }

  // Empty arguments preserve Raven's original boot/menu/campaign flow.
  window.boot([]);
}

window.addEventListener('message', event => {
  if (event.source !== window.parent || event.origin !== location.origin) return;

  if (event.data?.type === 'atom-jedi-canonical-source') {
    try {
      startCanonicalGame(event.data.paks);
    } catch (error) {
      showFatal(error?.message || String(error));
    }
    return;
  }

  if (event.data?.type !== 'atom-jedi-flush') return;

  const done = error => window.parent.postMessage({
    type: 'atom-jedi-flushed',
    requestId: event.data.requestId,
    error: error ? 'Save storage could not be synchronized.' : '',
  }, location.origin);

  if (!window.booted || !window.FS) {
    done();
    return;
  }

  try {
    window.__saveCfg();
    window.FS.syncfs(false, done);
  } catch (error) {
    done(error);
  }
});

document.getElementById('reload-game')?.addEventListener('click', () => location.reload());

notify('awaiting-source');
if (window.parent !== window) {
  window.parent.postMessage({ type: 'atom-jedi-source-request' }, location.origin);
}
