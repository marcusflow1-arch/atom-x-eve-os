// SPDX-License-Identifier: GPL-2.0
// Atom XE bridge: the embedding app supplies the canonical retail PK3 records
// from Base44. No local-PC file picker is used by this runtime.

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
    const url = String(record?.url || '');
    const size = Number(record?.size || 0);
    if (!/^https:\/\//i.test(url)) throw new Error(`${name}: canonical source URL is invalid.`);
    if (!(size > 0)) throw new Error(`${name}: canonical source size is missing.`);
    byName.set(name, { name, url, size });
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

  // Empty arguments preserve Raven's original boot/menu/campaign flow. The
  // original New Game menu owns difficulty, map start, mission scripts,
  // objectives, NPC setup and progression.
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
