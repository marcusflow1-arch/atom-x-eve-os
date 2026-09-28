import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/Luna' });
for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'CustomEvent']) globalThis[name] = dom.window[name];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { act } = React, { createRoot } = await import('react-dom/client');
const { QueryClient, QueryClientProvider } = createRequire(import.meta.url)('@tanstack/react-query');
const effects = ['getsuga_tensho', 'artemis_call_of_the_husky', 'artemis_rain_of_arrows', 'artemis_lunar_beam', 'chidori'];
let gender = 'male', requests = 0;
const hotbar = new Map();
globalThis.skillRefreshStore = {
  assignToHotbar: (index, card) => hotbar.set(index, card),
  clearHotbarSlot: (index) => hotbar.delete(index),
  setActiveSkillRow() {},
};
globalThis.skillRefreshSdk = { functions: { invoke: async (name, { action }) => {
  assert.equal(name, 'skillBookLoadout');
  assert.equal(action, 'getState');
  requests += 1;
  const skills = effects.map((id) => ({
    id, user_card_id: id, owned: true, title: id,
    can_equip: id === 'getsuga_tensho' || gender === 'female',
    card: { user_card_id: id, animation_effect: { id } },
  }));
  return { data: { success: true, skills, games: [], loadout: {
    skill_set_order: 0, slots: Array.from({ length: 4 }, (_, index) => ({
      index, card: index === 0 && gender === 'female' ? skills[1].card : null,
    })),
  } } };
} } };
const code = await build({
  stdin: { contents: "export { default } from './src/components/luna/hooks/useSkillBookLoadout.jsx';", resolveDir: process.cwd(), loader: 'jsx' },
  bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external',
  jsx: 'automatic', alias: { '@': process.cwd() + '/src' },
  plugins: [{ name: 'avatar-refresh-fixtures', setup(b) {
    b.onResolve({ filter: /base44Client$|AuthContext$|useLunaStore$/ }, (args) => ({ path: args.path, namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
      loader: 'js', contents: args.path.includes('base44Client')
        ? 'export const base44 = globalThis.skillRefreshSdk;'
        : args.path.includes('AuthContext')
          ? "export const useAuth = () => ({ user: { id: 'a' } });"
          : 'export default (selector) => selector(globalThis.skillRefreshStore);',
    }));
  } }],
});
const filename = process.cwd() + '/tests/__avatar_refresh_bundle.cjs';
const module = new Module(filename);
module.paths = Module._nodeModulePaths(process.cwd());
module._compile(code.outputFiles[0].text, filename);
const useBook = module.exports.default;
const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
const root = createRoot(document.getElementById('root'));
let snapshot;
function Probe() {
  snapshot = useBook();
  return React.createElement('output', null, snapshot.skills.find((s) => s.id === effects[1])?.can_equip ? 'Usable' : 'Unavailable');
}
const flush = (fn = () => {}) => act(async () => { fn(); await new Promise((resolve) => setTimeout(resolve, 30)); });
const saved = (id = 'a') => window.dispatchEvent(new CustomEvent('avatarAppearanceSaved', { detail: { avatar: { user_id: id, gender } } }));
let mounted = false;
try {
  await flush(() => { root.render(React.createElement(QueryClientProvider, { client }, React.createElement(Probe))); mounted = true; });
  await flush();
  assert.equal(requests, 1);
  assert.equal(document.querySelector('output').textContent, 'Unavailable');
  assert.equal(hotbar.size, 0);
  gender = 'female';
  await flush(() => saved('other'));
  assert.equal(requests, 1, 'another player cannot invalidate this player book');
  await flush(() => saved());
  await flush();
  assert.equal(requests, 2);
  assert.equal(document.querySelector('output').textContent, 'Usable');
  assert.equal(hotbar.get(0)?.user_card_id, effects[1]);
  gender = 'male';
  await flush(() => saved());
  await flush();
  assert.equal(requests, 3);
  assert.equal(document.querySelector('output').textContent, 'Unavailable');
  assert.equal(hotbar.size, 0, 'avatar changes clear incompatible stale hotbar cards');
  await flush(() => { root.unmount(); mounted = false; });
  await flush(() => saved());
  assert.equal(requests, 3, 'unmounted hooks remove their event listeners');
  console.log('PASS: real Skill Book query refreshes on own avatar saves, updates eligibility and hotbar in both directions, ignores other players and cleans up its listener.');
} finally {
  if (mounted) await act(async () => root.unmount());
  client.clear();
  dom.window.close();
  delete globalThis.skillRefreshStore;
  delete globalThis.skillRefreshSdk;
}
