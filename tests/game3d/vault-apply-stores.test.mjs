// When the server's copy of a character arrives (character/characterVault.js), every store must
// take it. Found live: the other stores reloaded first and pinged the HUD store, whose recompute
// saved its old in-memory level over the new save, and the device then uploaded level 1.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), 'axe-vault-apply-'));
const dom = new JSDOM('', { url: 'http://localhost/', virtualConsole: new VirtualConsole() });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent });
const intervals = [];
const nativeSetInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const timer = nativeSetInterval(...args); intervals.push(timer); return timer; };
const modules = { storage: 'characterStorage.jsx', hud: 'playerHUDStore.jsx', halo: 'progression/haloStore.jsx', titles: 'progression/titleStore.jsx' };
await build({ stdin: { contents: Object.entries(modules).map(([name, file]) =>
  `export * as ${name} from './src/components/game3d/${file}';`).join('\n'), resolveDir: root },
  bundle: true, jsx: 'automatic', format: 'esm', platform: 'node', outfile: path.join(temp, 'stores.mjs'),
  alias: { '@': path.join(root, 'src') }, define: { 'import.meta.env': '{}' },
  plugins: [{ name: 'offline-service-boundary', setup(b) {
    b.onResolve({ filter: /api\/base44Client/ }, () => ({ path: 'base44-test', namespace: 'offline' }));
    b.onLoad({ filter: /.*/, namespace: 'offline' }, () => ({ contents:
      'export const base44 = { auth: { updateMe: async () => ({}), me: async () => ({}) } };' }));
  } }], logLevel: 'silent',
});
const { storage, hud, halo } = await import(pathToFileURL(path.join(temp, 'stores.mjs')));
after(async () => { intervals.forEach(clearInterval); globalThis.setInterval = nativeSetInterval; dom.window.close(); await rm(temp, { recursive: true, force: true }); });

test('the server copy replaces a fresh character in every store, and nothing writes the old level back', () => {
  storage.setStorageUser('vault-apply');
  localStorage.setItem('wwm_character_active_v1::vault-apply', 'char_v');
  storage.notifyCharacterChange();
  assert.equal(hud.getPlayerHUD().level, 1, 'a fresh device');
  hud.setPlayerHUD({}); // the world saves the fresh hero, as it does on load
  const key = (base) => `${base}::vault-apply::char_v`;
  const before = JSON.parse(localStorage.getItem(key('wwm_player_progression_v1')));
  assert.equal(before.level, 1);

  // what the vault writes, then its reload (CharacterVaultSync: the HUD first)
  localStorage.setItem(key('wwm_player_progression_v1'), JSON.stringify({ level: 12, xp: 40, baseStats: { strength: 20, dexterity: 8, constitution: 8, focus: 5 }, unspentPoints: 0 }));
  localStorage.setItem(key('halo_progression_v3'), JSON.stringify({ ...JSON.parse(localStorage.getItem(key('halo_progression_v3')) || '{}'), level: 4 }));
  hud.reloadPlayerHUDFromSave();
  storage.notifyCharacterChange();

  assert.equal(hud.getPlayerHUD().level, 12);
  assert.equal(JSON.parse(localStorage.getItem(key('wwm_player_progression_v1'))).level, 12, 'the save itself still says 12');
  assert.equal(hud.getPlayerHUD().baseStats.strength, 20);
  assert.equal(halo.getHaloState().level, 4);
});
