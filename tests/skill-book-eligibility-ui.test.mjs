import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/LunaTemplate', pretendToBeVisual: true });
for (const name of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement', 'Element', 'Node', 'Event', 'CustomEvent']) globalThis[name] = dom.window[name];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react'), { act } = React;
const { createRoot } = await import('react-dom/client');
const { QueryClient, QueryClientProvider } = createRequire(import.meta.url)('@tanstack/react-query');
const calls = [], notices = [];
const effects = ['getsuga_tensho', 'artemis_call_of_the_husky', 'artemis_rain_of_arrows', 'artemis_lunar_beam', 'chidori'];
const titles = ['Getsuga Tensho', 'Artemis — Husky', 'Artemis — Rain', 'Artemis — Lunar Beam', 'Chidori'];
const cards = effects.map((effect, i) => ({
  id: 'achievement-' + effect, user_card_id: 'owned-' + effect, title: titles[i],
  game_name: 'Atom X Eve', rarity: 'Unique', owned: true,
  can_equip: !effect.startsWith('artemis_'),
  equip_error: effect.startsWith('artemis_') ? 'This ability requires a female avatar.' : null,
  card: { id: 'owned-' + effect, user_card_id: 'owned-' + effect, card_name: titles[i], animation_effect: { id: effect }, quantity: 1 },
}));
cards.push({ id: 'boost', user_card_id: 'owned-boost', title: 'Boost', game_name: 'Zeta Racing', owned: true, can_equip: true, card: { quantity: 1 } });
cards.push({ id: 'unowned', title: 'Unowned reward', game_name: 'Atom X Eve', owned: false });
cards.push({ id: 'consumed', user_card_id: 'gone', title: 'Consumed card', game_name: 'Atom X Eve', owned: true, card: { quantity: 0 } });
const persisted = Array(10).fill(null);
let failEquip = false, pauseEquip = null, releaseEquip;
const snapshot = () => ({
  success: true, avatar_gender: 'male',
  games: [
    { key: 'zeta', title: 'Zeta Racing', genre: 'Racing' },
    { key: 'atom', title: 'Atom X Eve', genre: 'Action RPG' },
    { key: 'locked', title: 'Locked Game', genre: 'Adventure' },
  ],
  skills: cards,
  loadout: { skill_set_order: 0, slots: persisted.map((id, index) => ({
    index, card: id ? { ...cards.find(card => card.user_card_id === id).card, user_card_id: id, title: cards.find(card => card.user_card_id === id).title } : null,
  })) },
  skill_sets: [0, 1, 2, 3].map(i => ({ skill_set_id: 'set-' + i, skill_set_order: i })),
  active_skill_set_id: 'set-0',
});
globalThis.skillBookSdk = { functions: { invoke: async (name, request) => {
  assert.equal(name, 'skillBookLoadout');
  calls.push(structuredClone(request));
  if (request.action === 'equip') {
    if (pauseEquip) await pauseEquip;
    if (failEquip) throw { response: { data: { error: 'Finish your match first' } } };
    const { slot, user_card_id } = request.data;
    const owned = cards.find(card => card.user_card_id === user_card_id);
    assert.ok(owned?.owned && owned.can_equip, 'only a compatible owned ID reaches equip');
    for (let i = 0; i < persisted.length; i++) if (persisted[i] === user_card_id) persisted[i] = null;
    persisted[slot] = user_card_id;
  } else assert.equal(request.action, 'getState');
  return { data: structuredClone(snapshot()) };
} } };
globalThis.skillBookNotices = notices;
const built = await build({
  stdin: { contents: "export { default as Panel } from './src/components/dashboard/LunaCardsPanel.jsx'; export { default as Hud } from './src/components/dashboard/LunaSkillXpHud.jsx'; export { default as store } from './src/components/luna/useLunaStore.jsx';", resolveDir: process.cwd(), loader: 'jsx' },
  bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external',
  jsx: 'automatic', alias: { '@': process.cwd() + '/src' }, loader: { '.css': 'empty' },
  plugins: [{ name: 'skill-book-service-fixture', setup(b) {
    b.onResolve({ filter: /^lucide-react$/ }, () => ({ path: process.cwd() + '/node_modules/lucide-react/dist/esm/lucide-react.js' }));
    b.onResolve({ filter: /base44Client$|AuthContext$|CompanionIdentityContext$|characterStore$|ErrorToast$/ }, args => ({ path: args.path, namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ loader: 'js', contents:
      args.path.endsWith('base44Client') ? 'export const base44 = globalThis.skillBookSdk;' :
      args.path.endsWith('AuthContext') ? "export const useAuth=()=>({user:{id:'player'}});" :
      args.path.endsWith('CompanionIdentityContext') ? "export const useCompanionIdentity=()=>({gender:'male'});" :
      args.path.endsWith('characterStore') ? 'export const getActiveCharacter=()=>null; export const subscribeCharacters=()=>()=>{};' :
      'export const showError=(error)=>globalThis.skillBookNotices.push(error?.message || String(error));'
    }));
  } }],
});
const filename = process.cwd() + '/tests/__skill_book_ui_bundle.cjs', module = new Module(filename);
module.paths = Module._nodeModulePaths(process.cwd());
module._compile(built.outputFiles[0].text, filename);
const { Panel, Hud, store } = module.exports;
const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
let client = makeClient(), root = createRoot(document.getElementById('root'));
const run = async (fn = () => {}) => {
  await act(async () => { fn(); await new Promise(resolve => setTimeout(resolve, 30)); });
};
const render = (show = true) => root.render(React.createElement(QueryClientProvider, { client },
  React.createElement(React.Fragment, null, show && React.createElement(Panel), React.createElement(Hud))));
const button = text => [...document.querySelectorAll('button')].find(node => node.textContent.includes(text));
const search = () => document.querySelector('.luna-skill-book input[type="search"]');
const card = id => document.querySelector('[data-skill-card="owned-' + id + '"]');
const slot = key => document.querySelector('[data-hotkey="' + key + '"]');
function input(node, value) {
  Object.getOwnPropertyDescriptor(node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(node, value);
  node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
}
function drag(node) {
  const payload = {};
  const event = new Event('dragstart', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { setData: (type, value) => { payload[type] = value; } } });
  node.dispatchEvent(event);
  return { event, payload };
}
function drop(node, payload) {
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { getData: type => payload[type] || '' } });
  node.dispatchEvent(event);
}
try {
  await run(render); await run();
  assert.deepEqual([...document.querySelectorAll('.lsb-game strong')].map(n => n.textContent), ['Atom X Eve', 'Zeta Racing']);
  assert.equal(document.querySelectorAll('[data-hotkey]').length, 10, 'there is only one set of slot targets');
  await run(() => input(document.querySelector('select'), 'RPG'));
  assert.equal(document.querySelectorAll('.lsb-game').length, 1, 'basic RPG filter includes Action RPG');
  await run(() => input(document.querySelector('select'), 'Racing'));
  assert.match(document.querySelector('.lsb-game').textContent, /Zeta/);
  await run(() => input(document.querySelector('select'), 'all'));
  await run(() => input(search(), 'chidori'));
  assert.equal(document.querySelectorAll('.lsb-game').length, 1, 'card-name search also locates its game');
  await run(() => button('Atom X Eve').click());
  assert.equal(search().value, '');
  assert.equal(document.querySelectorAll('[data-skill-card]').length, 5);
  assert.doesNotMatch(document.querySelector('.lsb-results').textContent, /Unowned reward|Consumed card/);
  const blocked = card('artemis_lunar_beam');
  assert.equal(blocked.draggable, false);
  assert.match(document.getElementById(blocked.getAttribute('aria-describedby')).textContent, /female avatar/);
  const refused = drag(blocked);
  assert.equal(refused.event.defaultPrevented, true);
  assert.deepEqual(refused.payload, {});
  await run(() => blocked.click());
  assert.ok(notices.some(notice => /female avatar/.test(notice)));
  assert.equal(calls.filter(call => call.action === 'equip').length, 0);

  // Use the real Panel -> HTML drag payload -> HUD -> query mutation -> store path.
  const transfer = drag(card('chidori')).payload;
  assert.equal(JSON.parse(transfer['application/json']).user_card_id, 'owned-chidori');
  pauseEquip = new Promise(resolve => { releaseEquip = resolve; });
  await run(() => { drop(slot('1'), transfer); drop(slot('2'), transfer); });
  assert.equal(calls.filter(call => call.action === 'equip').length, 1, 'rapid drops do not overlap');
  assert.match(document.querySelector('.lsb-help').textContent, /Saving/);
  assert.ok(slot('1').disabled);
  await run(() => { releaseEquip(); pauseEquip = null; }); await run();
  assert.equal(persisted[0], 'owned-chidori');
  assert.match(slot('1').getAttribute('aria-label'), /Chidori/);
  assert.match(document.querySelector('.lsb-help').textContent, /saved to skill 1/);

  // Moving an owned card clears its old slot; a new card can replace it.
  await run(() => drop(slot('0'), transfer)); await run();
  assert.equal(persisted[0], null); assert.equal(persisted[9], 'owned-chidori');
  assert.match(slot('1').getAttribute('aria-label'), /Empty/);
  await run(() => card('getsuga_tensho').click());
  assert.match(document.querySelector('.lsb-help').textContent, /Choose a skill slot/);
  await run(() => slot('0').click()); await run();
  assert.equal(persisted[9], 'owned-getsuga_tensho');
  assert.match(slot('0').getAttribute('aria-label'), /Getsuga/);
  failEquip = true;
  await run(() => drop(slot('0'), transfer)); await run();
  assert.equal(persisted[9], 'owned-getsuga_tensho', 'a failed save preserves the previous loadout');
  assert.match(slot('0').getAttribute('aria-label'), /Getsuga/);
  assert.ok(notices.includes('Finish your match first'));
  failEquip = false;

  let speech;
  window.SpeechRecognition = class {
    constructor() { speech = this; }
    start() {} stop() { this.onend?.(); } abort() {}
  };
  await run(() => document.querySelector('[aria-label="Search cards by voice"]').click());
  await run(() => speech.onresult({ results: [[{ transcript: 'Getsuga' }]] }));
  assert.equal(search().value, 'Getsuga');
  assert.equal(document.querySelectorAll('[data-skill-card]').length, 1);
  await run(() => speech.onend());
  delete window.SpeechRecognition;
  await run(() => document.querySelector('[aria-label="Search cards by voice"]').click());
  assert.match(document.querySelector('.ll-search-note').textContent, /unavailable/);
  await run(() => input(search(), 'no such card'));
  assert.match(document.querySelector('.lsb-empty').textContent, /No matches/);
  await run(() => button('Clear filters').click());

  // Reload with an empty client/store: restore the saved server loadout.
  await run(() => root.unmount()); client.clear(); store.getState().reset();
  client = makeClient(); root = createRoot(document.getElementById('root'));
  await run(render); await run();
  assert.match(slot('0').getAttribute('aria-label'), /Getsuga/);
  assert.ok(calls.filter(call => call.action === 'getState').length >= 2);
  await run(() => button('Atom X Eve').click());
  await run(() => card('chidori').click());
  const beforeClose = calls.filter(call => call.action === 'equip').length;
  await run(() => render(false));
  await run(() => slot('1').click());
  assert.equal(calls.filter(call => call.action === 'equip').length, beforeClose, 'closing the book cancels pending placement');
  console.log('PASS: owned game/card browser, alphabetical/genre/search filters, compatibility, voice fallback, real drag-to-equip path, shared saving state, rapid-drop guard, moving/replacing cards, save errors, reload restoration and close cleanup.');
} finally {
  await act(async () => root.unmount()); client.clear(); dom.window.close();
  delete globalThis.skillBookSdk; delete globalThis.skillBookNotices;
}
