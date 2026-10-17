// The player auras (PassiveSkillAuraEffects) read the live buff engine (skills/buffEngine.jsx),
// the one store skills write: Power Charge lights the hand glow and Aegis Shield the barrier while
// their records are live. Repulsion and Heaven's Destruction have no castable skill, so they stay
// off (docs/game3d/BUILD_BALANCE.md, section 5).
import { test, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/game3d', pretendToBeVisual: true });
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

// Auras, engine and registry in one bundle, so they share the one engine instance.
const built = await build({
  stdin: {
    contents: [
      "export { default as PassiveSkillAuraEffects, AURA_TRIGGERS } from './src/components/game3d/PassiveSkillAuraEffects.jsx';",
      "export { activateBuff, clearBuff, getBuffs, consumeAXEPowerCharge, absorbAegis, tickBuffEngine } from './src/components/game3d/skills/buffEngine.jsx';",
      "export { getSkillById, getSkillsByType } from './src/components/game3d/skills/skillRegistry.jsx';",
    ].join('\n'),
    resolveDir: process.cwd(),
    loader: 'jsx',
  },
  bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic', loader: { '.js': 'jsx' },
});
const filename = process.cwd() + '/tests/game3d/__passive_aura_effects.cjs';
const mod = new Module(filename);
mod.paths = Module._nodeModulePaths(process.cwd());
mod._compile(built.outputFiles[0].text, filename);
const {
  PassiveSkillAuraEffects, AURA_TRIGGERS, activateBuff, clearBuff, getBuffs,
  consumeAXEPowerCharge, absorbAegis, tickBuffEngine, getSkillById, getSkillsByType,
} = mod.exports;

// The auras redraw only when the engine emits, so no UI ticks to hold here.
const root = createRoot(document.getElementById('root'));
await act(async () => root.render(React.createElement(PassiveSkillAuraEffects)));

after(async () => {
  await act(async () => root.unmount());
  dom.window.close();
});

const settle = (fn) => act(async () => { fn(); await new Promise((resolve) => setTimeout(resolve, 30)); });
const auras = () => [...document.querySelectorAll('[data-aura]')].map((el) => el.getAttribute('data-aura')).sort();

beforeEach(() => settle(() => Object.keys(getBuffs()).forEach(clearBuff)));

test('no buff, no aura', () => {
  assert.deepEqual(auras(), []);
});

test('Power Charge in the buff engine lights the hand glow until the charged hit uses it', async () => {
  await settle(() => activateBuff('axe_power_charge', 1));
  assert.deepEqual(auras(), ['power-charge']);
  await settle(() => consumeAXEPowerCharge());
  assert.deepEqual(auras(), []);
});

test('Aegis Shield in the buff engine raises the barrier until the shield is used up', async () => {
  await settle(() => activateBuff('aegis_shield', 1, { maxHP: 1000 }));
  assert.deepEqual(auras(), ['barrier']);
  await settle(() => absorbAegis(10));
  assert.deepEqual(auras(), ['barrier'], 'a partly used shield still shows');
  await settle(() => absorbAegis(1000));
  assert.deepEqual(auras(), []);
});

test('an aura goes when the engine tick drops its expired buff', async () => {
  await settle(() => activateBuff('axe_power_charge', 1));
  assert.deepEqual(auras(), ['power-charge']);
  const later = performance.now() + 21_000; // Power Charge lasts 20 s
  const clock = mock.method(performance, 'now', () => later);
  try {
    await settle(() => tickBuffEngine());
  } finally {
    clock.mock.restore();
  }
  assert.deepEqual(auras(), []);
});

test('only Power Charge and Aegis Shield light auras; repulsion and destruction have no trigger', async () => {
  const liveBuffs = getSkillsByType('ACTIVE_BUFF').map((s) => s.skill_id);
  for (const id of Object.values(AURA_TRIGGERS).flat()) assert.ok(liveBuffs.includes(id), `${id} is a live ACTIVE_BUFF`);
  assert.deepEqual(AURA_TRIGGERS.repulsion, []);
  assert.deepEqual(AURA_TRIGGERS.destruction, []);
  for (const id of ['repulsion', 'heavens_destruction', 'barrier_aura', 'guardian_wall', 'iron_fortress', 'counter_pulse']) {
    assert.equal(getSkillById(id), null, `${id} is not in the skill registry`);
    assert.equal(activateBuff(id, 1), null, `${id} cannot be cast as a buff`);
  }

  const others = liveBuffs.filter((id) => id !== 'axe_power_charge' && id !== 'aegis_shield');
  await settle(() => others.forEach((id) => activateBuff(id, 1)));
  assert.deepEqual(auras(), [], 'no other live buff lights an aura');

  await settle(() => { activateBuff('axe_power_charge', 1); activateBuff('aegis_shield', 1, { maxHP: 1000 }); });
  assert.deepEqual(auras(), ['barrier', 'power-charge']);
});
