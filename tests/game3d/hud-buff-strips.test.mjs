// The two HUD buff strips (ActiveBuffsStrip above the HP bar, BuffDividerLine above the skill
// slots) read the live buff engine (skills/buffEngine.jsx), the one store skills write. A buff a
// skill activates shows in both with its time left, Focus also with its hits left, and goes when
// the engine drops it (docs/game3d/BUILD_BALANCE.md, section 5).
import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="above-hp"></div><div id="divider"></div>', { url: 'https://test.local/game3d', pretendToBeVisual: true });
for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'SVGElement']) globalThis[name] = dom.window[name];
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const require = createRequire(import.meta.url);
require('framer-motion').MotionGlobalConfig.skipAnimations = true;
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');

// Strips and engine in one bundle, so they share the one engine instance.
const built = await build({
  stdin: {
    contents: [
      "export { default as ActiveBuffsStrip } from './src/components/game3d/hud/ActiveBuffsStrip.jsx';",
      "export { default as BuffDividerLine } from './src/components/game3d/hud/BuffDividerLine.jsx';",
      "export { activeBuffList } from './src/components/game3d/hud/buffDisplay.js';",
      "export { activateBuff, clearBuff, consumeFocusHit, getBuffs } from './src/components/game3d/skills/buffEngine.jsx';",
    ].join('\n'),
    resolveDir: process.cwd(),
    loader: 'jsx',
  },
  bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic', loader: { '.js': 'jsx' },
});
const filename = process.cwd() + '/tests/game3d/__hud_buff_strips.cjs';
const mod = new Module(filename);
mod.paths = Module._nodeModulePaths(process.cwd());
mod._compile(built.outputFiles[0].text, filename);
const { ActiveBuffsStrip, BuffDividerLine, activeBuffList, activateBuff, clearBuff, consumeFocusHit, getBuffs } = mod.exports;

// The strips also redraw every 200 ms for their countdowns; hold those ticks so React sees
// only engine-driven updates, all inside act().
const nativeSetInterval = globalThis.setInterval;
const nativeClearInterval = globalThis.clearInterval;
const uiTicks = new Map();
globalThis.setInterval = (fn) => { const id = Symbol('uiTick'); uiTicks.set(id, fn); return id; };
globalThis.clearInterval = (id) => (uiTicks.has(id) ? uiTicks.delete(id) : nativeClearInterval(id));

const Icon = (props) => React.createElement('svg', props);
const roots = [createRoot(document.getElementById('above-hp')), createRoot(document.getElementById('divider'))];
await act(async () => {
  roots[0].render(React.createElement(ActiveBuffsStrip));
  roots[1].render(React.createElement(BuffDividerLine, { icon: Icon }));
});
globalThis.setInterval = nativeSetInterval;

after(async () => {
  await act(async () => roots.forEach((root) => root.unmount()));
  globalThis.clearInterval = nativeClearInterval;
  dom.window.close();
});

const settle = (fn) => act(async () => { fn(); await new Promise((resolve) => setTimeout(resolve, 30)); });
const shown = (id) => [...document.getElementById(id).querySelectorAll('[title]')].map((el) => ({
  name: el.getAttribute('title'),
  time: el.children[0].textContent,
  ...(el.children[2] ? { hits: el.children[2].textContent } : {}),
}));
const names = (id) => shown(id).map((b) => b.name);

beforeEach(() => settle(() => Object.keys(getBuffs()).forEach(clearBuff)));

test('no buff, no icons', () => {
  assert.deepEqual(shown('above-hp'), []);
  assert.deepEqual(shown('divider'), []);
});

test('Focus activated in the buff engine shows in both strips, with time and hits left', async () => {
  await settle(() => activateBuff('focus', 1));
  for (const id of ['above-hp', 'divider']) {
    assert.deepEqual(shown(id), [{ name: 'Focus', time: '180s', hits: '×5' }], id);
  }
  await settle(() => consumeFocusHit());
  for (const id of ['above-hp', 'divider']) assert.equal(shown(id)[0].hits, '×4', id);
});

test('every buff the engine holds shows in strip order, and a cleared buff goes', async () => {
  await settle(() => {
    for (const id of ['axe_control_protection', 'axe_power_charge', 'heavens_riposte', 'gods_deflection', 'decisive_blow', 'focus']) activateBuff(id, 1);
    activateBuff('aegis_shield', 1, { maxHP: 1000 });
  });
  const order = ['Aegis Shield', 'Focus', 'Decisive Blow', "God's Deflection", "Heaven's Riposte", 'Power Charge', 'Divine Control Guard'];
  assert.deepEqual(names('above-hp'), order);
  assert.deepEqual(names('divider').sort(), [...order].sort(), 'the divider splits them left and right');
  assert.deepEqual(shown('above-hp').find((b) => b.name === 'Power Charge'), { name: 'Power Charge', time: '20s' });
  assert.equal(shown('above-hp').filter((b) => b.hits).length, 1, 'only Focus counts hits');

  await settle(() => clearBuff('focus'));
  for (const id of ['above-hp', 'divider']) assert.ok(!names(id).includes('Focus'), id);
  assert.equal(names('above-hp').length, order.length - 1);
});

test('an expired record is left out even before the engine tick drops it', () => {
  const buffs = {
    focus: { skill_id: 'focus', expiresAt: 1000, hitsRemaining: 2, values: {} },
    aegis_shield: { skill_id: 'aegis_shield', expiresAt: 5000, values: {} },
  };
  assert.deepEqual(activeBuffList(buffs, 2000), [{ key: 'aegis_shield', remaining: 3 }]);
});
