// Every progression system's attribute bonus must reach the hero's live stats, whichever
// name the system uses for it (constitution / vitality, focus / spirit). Before the fix,
// Vitality and Spirit from gear, titles, elixirs and costumes were silently dropped.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), 'axe-stat-routing-'));
const dom = new JSDOM('', { url: 'http://localhost/', virtualConsole: new VirtualConsole() });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent });
const intervals = [];
const nativeSetInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const timer = nativeSetInterval(...args); intervals.push(timer); return timer; };
const modules = {
  storage: 'characterStorage.jsx', hud: 'playerHUDStore.jsx', stats: 'statsSystem.jsx',
  inv: 'axe/equipment/AXEEquipmentInventoryStore.js', titles: 'progression/titleStore.jsx',
  elixirs: 'axe/progression/AXEElixirStore.js', halo: 'progression/haloStore.jsx', haloData: 'progression/haloData.jsx',
};
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
const { storage, hud, stats, inv, titles, elixirs, halo, haloData } = await import(pathToFileURL(path.join(temp, 'stores.mjs')));
after(async () => { intervals.forEach(clearInterval); globalThis.setInterval = nativeSetInterval; dom.window.close(); await rm(temp, { recursive: true, force: true }); });

let user = 0;
const fresh = () => {
  storage.setStorageUser(`stat-routing-${++user}`);
  inv.resetAXEEquipmentInventoryToStarter();
  for (const item of inv.getEquippedAXEItems()) inv.unequipAXEInventoryItem(item.instanceId);
};
const derived = () => hud.getPlayerHUD().derived;
const HP_PER_VIT = stats.STAT_RATES.vitalityHP;
const CHI_PER_SPI = stats.STAT_RATES.spiritChi;

test('gear Vitality adds HP and gear Spirit adds chi under either name', () => {
  for (const [key, field, perPoint] of [['constitution', 'maxHP', HP_PER_VIT], ['vitality', 'maxHP', HP_PER_VIT], ['focus', 'chi', CHI_PER_SPI], ['spirit', 'chi', CHI_PER_SPI]]) {
    fresh();
    const before = derived()[field];
    assert.ok(inv.addAXEEquipmentItem({ id: `routing_${key}`, name: key, slot: 'chest', category: 'chest', rarity: 'common', baseStats: { [key]: 10 } }, { equipped: true }).ok);
    assert.ok(Math.abs(derived()[field] - before - 10 * perPoint) <= 1, `+10 ${key} on gear: ${field} ${before} -> ${derived()[field]}`);
  }
});

test('a title path keyed constitution adds its Vitality', () => {
  fresh();
  const before = derived().maxHP;
  titles.setTitleLevel('vitality', 15); titles.equipTitle('vitality');
  const flatHP = titles.getEquippedTitleBonuses().hp || 0;
  const attrVit = titles.getEquippedTitleAttributeBonuses().constitution || 0;
  assert.ok(attrVit > 0, 'the Path of Vitality grants Vitality');
  assert.equal(derived().maxHP - before, flatHP + attrVit * HP_PER_VIT, 'flat HP plus the Vitality it grants');
});

test('Vitality and Spirit elixirs add HP and chi', () => {
  fresh();
  const before = derived();
  elixirs.grantAXEElixirs('vitality', 5); assert.ok(elixirs.useAXEElixir('vitality', 5).ok);
  elixirs.grantAXEElixirs('spirit', 5); assert.ok(elixirs.useAXEElixir('spirit', 5).ok);
  assert.ok(Math.abs(derived().maxHP - before.maxHP - 5 * HP_PER_VIT) <= 1, `HP ${before.maxHP} -> ${derived().maxHP}`);
  assert.ok(Math.abs(derived().chi - before.chi - 5 * CHI_PER_SPI) <= 1, `chi ${before.chi} -> ${derived().chi}`);
});

test('switching characters never copies one character\'s level, points or stats into another', () => {
  storage.setStorageUser('switch-alt'); hud.setPlayerHUD({ level: 5, unspentPoints: 2 });
  storage.setStorageUser('switch-main');
  hud.setPlayerHUD({ level: 50, unspentPoints: 9, baseStats: { ...hud.getPlayerHUD().baseStats, strength: 77 } });
  const snapshot = () => { const s = hud.getPlayerHUD(); return [s.level, s.unspentPoints, s.baseStats.strength]; };
  storage.setStorageUser('switch-alt');
  assert.deepEqual(snapshot(), [5, 2, 3], 'the alt keeps its own save (it used to become a copy of the main)');
  storage.setStorageUser('switch-main');
  assert.deepEqual(snapshot(), [50, 9, 77]);
  storage.setStorageUser('switch-brand-new');
  assert.deepEqual(snapshot(), [1, 0, 3], 'a new character starts fresh');
});

test('a system that names both keys (the halo) is not counted twice', () => {
  fresh();
  const before = derived().maxHP;
  halo.setHaloLevel(100); // the halo names its Vitality both ways: constitution and vitality are the same points
  const vit = haloData.getHaloBonusesForLevel(100).vitality;
  assert.equal(haloData.getHaloBonusesForLevel(100).constitution, vit);
  assert.ok(Math.abs(derived().maxHP - before - vit * HP_PER_VIT) <= 1, `HP ${before} -> ${derived().maxHP}`);
  halo.setHaloLevel(0);
});
