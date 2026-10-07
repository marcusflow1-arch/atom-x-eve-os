// SPDX-License-Identifier: GPL-2.0
import { inspectGameFiles } from './asset-validation.mjs';

const byId = id => document.getElementById(id);
const note = byId('own-note'), start = byId('start-game'), checks = byId('file-checks');
let verified = null, checking = false, started = false;
const notify = (state, detail = '') => {
  if (window.parent !== window) window.parent.postMessage({ type: 'atom-jedi-status', state, detail }, location.origin);
};
const setNote = (text, error = false) => { note.textContent = text; note.className = error ? 'note error' : 'note'; };
const setChecking = active => {
  checking = active;
  byId('choose-paks').disabled = active;
  byId('choose-folder').disabled = active;
};

async function selectFiles(event) {
  if (checking || started) return;
  const files = Array.from(event.target.files || []);
  event.target.value = '';
  if (!files.length) return;
  verified = null; start.disabled = true; checks.replaceChildren(); setChecking(true);
  notify('checking');
  try {
    const result = await inspectGameFiles(files, text => setNote(text));
    for (const item of result.checks) {
      const li = document.createElement('li');
      li.className = item.present ? 'present' : 'missing';
      const status = document.createElement('span'); status.textContent = item.present ? 'Found' : 'Missing';
      const title = document.createElement('strong'); title.textContent = item.label;
      const path = document.createElement('code'); path.textContent = item.path;
      li.append(status, title, path); checks.append(li);
    }
    byId('inspection').hidden = false;
    if (!result.ready) {
      setNote('The selected files are incomplete. Add the missing original files shown below, then select the complete set again.', true);
      notify('missing-data');
      return;
    }
    verified = result;
    setNote(`${result.entryCount.toLocaleString()} game-file paths found · ${(result.totalBytes / 1048576).toFixed(0)} MB. The required starting-level files and model formats passed inspection.`);
    start.disabled = false; start.focus(); notify('files-ready');
  } catch (error) {
    setNote(error.message || 'Game files could not be checked.', true); notify('missing-data');
  } finally { setChecking(false); }
}

byId('choose-paks').addEventListener('click', () => byId('own-files').click());
byId('choose-folder').addEventListener('click', () => byId('folder-files').click());
byId('own-files').addEventListener('change', selectFiles);
byId('folder-files').addEventListener('change', selectFiles);

const originalFatal = window.Module.onFatal;
window.Module.onFatal = text => {
  notify('error', String(text));
  originalFatal?.(text);
  const error = byId('runtime-error');
  error.hidden = false; byId('runtime-error-detail').textContent = String(text);
};
window.Module.onAbort = reason => window.Module.onFatal(String(reason || 'The game engine stopped.'));
byId('reload-game').addEventListener('click', () => location.reload());

// The engine is disposable: leaving removes the iframe and its WebGL/audio context.
// Flush only saves/config, never the retail data, before the parent removes it.
window.addEventListener('message', event => {
  if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== 'atom-jedi-flush') return;
  const done = error => window.parent.postMessage({ type: 'atom-jedi-flushed', requestId: event.data.requestId, error: error ? 'Save storage could not be synchronized.' : '' }, location.origin);
  if (!window.booted || !window.FS) { done(); return; }
  try { window.__saveCfg(); window.FS.syncfs(false, done); } catch (error) { done(error); }
});

start.addEventListener('click', () => {
  if (!verified || started) return;
  if (!window.WebAssembly) { setNote('This browser does not support WebAssembly.', true); return; }
  // Check before removing the launcher, so a missing GPU cannot leave a blank screen.
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl') || probe.getContext('experimental-webgl');
  if (!gl) { setNote('WebGL is unavailable. Enable hardware acceleration and reopen the app.', true); return; }
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  started = true; start.disabled = true; notify('starting');
  window.__JK2_GAMEDIR = 'base'; window.__JK2_PAKS = [];
  const selected = verified; verified = null;
  window.Module.preRun.push(function stageOriginalData() {
    const dependency = 'atom-original-data';
    window.addRunDependency(dependency);
    (async () => {
      const files = [...selected.paks, ...selected.loose]; let loaded = 0;
      // Sequential reads avoid holding every archive's intermediate buffer at once.
      for (const { file, path } of files) {
        const split = path.lastIndexOf('/');
        const directory = '/jk2/base' + (split >= 0 ? '/' + path.slice(0, split) : '');
        const data = new Uint8Array(await file.arrayBuffer());
        window.FS.mkdirTree(directory);
        window.FS.createDataFile(directory, path.slice(split + 1), data, true, false, true);
        loaded += file.size;
        window.setProgress(loaded, selected.totalBytes, 'Loading original game data', `${(loaded / 1048576).toFixed(0)} / ${(selected.totalBytes / 1048576).toFixed(0)} MB`);
      }
      window.removeRunDependency(dependency);
    })().catch(error => window.Module.onFatal(error.message));
  });
  // Original main menu / New Game owns mission setup, spawn points, scripts and
  // progression. No devmap, cheats, fabricated stats, or custom AI are injected.
  window.boot([]);
});

notify('awaiting-files');
