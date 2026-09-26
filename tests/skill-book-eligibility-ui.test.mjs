import assert from 'node:assert/strict';
import Module from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/Luna' });
for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'CustomEvent']) globalThis[name] = dom.window[name];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { act } = React, { createRoot } = await import('react-dom/client');
const calls = [], notices = [];
const skill = {
  id: 'owned:artemis', owned: true, can_equip: false,
  equip_error: 'Artemis abilities require a female avatar. Switch to your female avatar to equip and use this skill.',
  required_avatar_gender: 'female', user_card_id: 'artemis', title: 'Artemis — Lunar Beam',
  game_name: 'Atom X Eve', rarity: 'Unique',
  card: { user_card_id: 'artemis', animation_effect: { id: 'artemis_lunar_beam' } },
};
globalThis.skillBookFixture = {
  games: [{ key: 'atom', title: 'Atom X Eve', genre: 'Action RPG', owned_skills: 1, total_skills: 1 }],
  skills: [skill], slots: Array.from({ length: 4 }, (_, index) => ({ index, card: null })),
  isLoading: false, isSaving: false,
  equip: async (slot, id) => { calls.push({ slot, id }); },
};
globalThis.skillBookNotices = notices;
const code = await build({
  entryPoints: ['src/components/dashboard/LunaCardsPanel.jsx'],
  bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external',
  jsx: 'automatic', alias: { '@': process.cwd() + '/src' },
  plugins: [{ name: 'skill-book-fixtures', setup(b) {
    b.onResolve({ filter: /^lucide-react$/ }, () => ({ path: process.cwd() + '/node_modules/lucide-react/dist/esm/lucide-react.js' }));
    b.onResolve({ filter: /useSkillBookLoadout$|ErrorToast$|CombatPrefabManager$/ }, (args) => ({ path: args.path, namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
      loader: 'js',
      contents: args.path.includes('useSkillBookLoadout')
        ? 'export default () => globalThis.skillBookFixture;'
        : args.path.includes('ErrorToast')
          ? 'export const showError=(e)=>globalThis.skillBookNotices.push(e.message); export const showSuccess=(m)=>globalThis.skillBookNotices.push(m);'
          : 'export default () => null;',
    }));
  } }],
});
const module = new Module(process.cwd() + '/tests/__skill_book_ui_bundle.cjs');
module.paths = Module._nodeModulePaths(process.cwd());
module._compile(code.outputFiles[0].text, process.cwd() + '/tests/__skill_book_ui_bundle.cjs');
const Panel = module.exports.default;
const root = createRoot(document.getElementById('root'));
const render = () => act(async () => { root.render(React.createElement(Panel)); });
const slotButtons = () => [...document.querySelectorAll('button')].filter((button) => button.querySelector('span')?.textContent === 'Slot');
function drag(node) {
  const payload = {};
  const event = new dom.window.Event('dragstart', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { setData: (type, value) => { payload[type] = value; } } });
  node.dispatchEvent(event);
  return { event, payload };
}
try {
  await render();
  assert.match(document.body.textContent, /0 \/ 4 equipped/);
  const collectible = document.querySelector('button[title="Artemis — Lunar Beam"]');
  assert.ok(collectible);
  assert.equal(collectible.draggable, false);
  const blockedDrag = drag(collectible);
  assert.equal(blockedDrag.event.defaultPrevented, true);
  assert.deepEqual(blockedDrag.payload, {});
  await act(async () => { collectible.click(); });
  assert.match(document.getElementById('skill-equip-reason').textContent, /female avatar/);
  assert.equal(slotButtons().length, 4);
  assert.ok(slotButtons().every((button) => button.disabled && button.getAttribute('aria-describedby') === 'skill-equip-reason'));
  await act(async () => { slotButtons()[0].click(); });
  assert.equal(calls.length, 0);

  // The same owned card becomes usable after the server reports a compatible avatar.
  globalThis.skillBookFixture.skills = [{ ...skill, can_equip: true, equip_error: null }];
  await render();
  assert.equal(document.getElementById('skill-equip-reason'), null);
  assert.ok(slotButtons().every((button) => !button.disabled));
  await act(async () => { slotButtons()[3].click(); });
  assert.deepEqual(calls, [{ slot: 3, id: 'artemis' }]);
  const usable = document.querySelector('[draggable="true"]');
  assert.ok(usable);
  const { payload } = drag(usable);
  assert.equal(JSON.parse(payload['application/json']).user_card_id, 'artemis');
  assert.match(document.body.textContent, /one of the 4 Luna skill slots/);
  console.log('PASS: four-slot counter; incompatible cards stay visible; explanation, disabled equip and blocked dragging; compatible avatar enables owned-card equip and dragging.');
} finally {
  await act(async () => { root.unmount(); });
  dom.window.close();
  delete globalThis.skillBookFixture;
  delete globalThis.skillBookNotices;
}
