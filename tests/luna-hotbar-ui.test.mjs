import assert from 'node:assert/strict';
import Module from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { SKILL_KEYS, skillSlotFromKey } from '../src/components/luna/skillSlots.js';

for (const [index, key] of SKILL_KEYS.entries()) {
  assert.equal(skillSlotFromKey({ code: 'Digit' + key }), index);
  assert.equal(skillSlotFromKey({ code: 'Numpad' + key }), index);
  assert.equal(skillSlotFromKey({ key }), index);
}
assert.equal(skillSlotFromKey({ code: 'Digit0', shiftKey: true }), -1);
assert.equal(skillSlotFromKey({ key: 'a' }), -1);
const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/LunaTemplate' });
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'CustomEvent']) globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react'), { act } = React;
const { createRoot } = await import('react-dom/client');
const calls = [];
const lastCard = { id: 'last', user_card_id: 'last', title: 'Final skill' };
globalThis.hotbarFixture = {
  store: { hotbar: { 9: lastCard } },
  loadout: {
    skillSets: [0,1,2,3].map(i => ({skill_set_id:'set-'+i, skill_set_order:i})),
    activeSkillSetId: 'set-0', isSaving: false,
    equip: async (index, id) => calls.push(['equip', index, id]),
    selectSkillSet: async id => calls.push(['prefab', id]),
  },
};
const built = await build({
  entryPoints: ['src/components/dashboard/LunaSkillXpHud.jsx'],
  bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic',
  alias: { '@': process.cwd() + '/src' }, loader: { '.css':'empty' },
  plugins: [{name:'hotbar-fixture', setup(b) {
    b.onResolve({filter:/^lucide-react$/}, () => ({path:process.cwd()+'/node_modules/lucide-react/dist/esm/lucide-react.js'}));
    b.onResolve({filter:/useSkillBookLoadout$|useLunaStore$|ErrorToast$/}, args => ({path:args.path,namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'}, args => ({contents:
      args.path.endsWith('useSkillBookLoadout') ? 'export default ()=>globalThis.hotbarFixture.loadout;' :
      args.path.endsWith('useLunaStore') ? 'export default select=>select(globalThis.hotbarFixture.store);' :
      'export const showError=error=>{throw error};',loader:'js'}));
  }}],
});
const filename = process.cwd() + '/tests/__hotbar_bundle.cjs', mod = new Module(filename);
mod.paths = Module._nodeModulePaths(process.cwd());
mod._compile(built.outputFiles[0].text,filename);
const Hud = mod.exports.default;
const root = createRoot(document.getElementById('root'));
const run = fn => act(async () => { await fn(); });
await run(() => root.render(React.createElement(Hud,{currentXp:71,nextXp:100,level:3})));
assert.deepEqual([...document.querySelectorAll('[data-hotkey]')].map(el=>el.dataset.hotkey),SKILL_KEYS);
assert.equal(document.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'),'71');
const prefabs = [...document.querySelectorAll('nav[aria-label="Skill prefabs"] button')];
assert.equal(prefabs.length,4);
await run(() => prefabs[3].click());
assert.deepEqual(calls.pop(),['prefab','set-3']);
await run(() => window.dispatchEvent(new CustomEvent('lunaShowcaseCardSelected',{detail:{card:lastCard}})));
await run(() => document.querySelector('[data-hotkey="0"]').click());
assert.deepEqual(calls.pop(),['equip',9,'last']);
assert.match(document.querySelector('[role="status"]').textContent,/Press 0/);
let cast;
window.addEventListener('lunaRequestSkillSlotActivation',event=>{cast=event.detail;});
await run(() => root.render(React.createElement(Hud,{combatMode:true})));
await run(() => document.querySelector('[data-hotkey="0"]').click());
assert.equal(cast.slotIndex,9);
assert.ok([...document.querySelectorAll('nav button')].every(button=>button.disabled));
await run(() => root.unmount());
dom.window.close();
console.log('PASS: keys 1–0, numpad, modifier safety, ten hotkeys, fourth prefab, real equip ID, key-0 casting and EXP.');
