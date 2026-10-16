// The in-game social actions go through the server (docs/game3d/BACKEND_AUDIT.md): since
// 2026-09-26 the request, friendship and duel tables refuse browser writes, so the game's
// own writes failed for every player but admins. These tests hold the game to the server
// functions and check it never writes those tables itself.
import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/GameView' });
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'CustomEvent', 'MouseEvent', 'localStorage', 'navigator']) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// the stores start intervals; clear them so the run can end
const intervals = [];
const nativeSetInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const timer = nativeSetInterval(...args); intervals.push(timer); return timer; };
after(() => { intervals.forEach(clearInterval); globalThis.setInterval = nativeSetInterval; dom.window.close(); });
globalThis.Audio = class { play() { return Promise.resolve(); } pause() {} };
const { act, createElement } = await import('react');
const { createRoot } = await import('react-dom/client');

const fixtures = {
  base44Client: `export const base44 = {
    functions: { invoke: (fn, body) => globalThis.__social.invoke(fn, body) },
    entities: new Proxy({}, { get: (_, name) => ({
      filter: async (q) => globalThis.__social.filter(name, q),
      list: async () => [],
      get: async () => null,
      subscribe: () => () => {},
      create: async (d) => { globalThis.__social.writes.push('create ' + name); return d; },
      update: async () => { globalThis.__social.writes.push('update ' + name); },
      delete: async () => { globalThis.__social.writes.push('delete ' + name); },
    }) }),
    auth: { me: async () => ({ id: 'bob' }), updateMe: async () => ({}) },
  };`,
  'react-hot-toast': `const t = (m) => globalThis.__social.toasts.push(String(m)); t.success = t; t.error = t;
    export default t; export const toast = t; export const Toaster = () => null;`,
  'framer-motion': `import { createElement } from 'react';
    const clean = ({ initial, animate, exit, transition, ...rest }) => rest;
    export const motion = new Proxy({}, { get: (_, tag) => (props) => createElement(tag, clean(props)) });
    export const AnimatePresence = ({ children }) => children;`,
};
const result = await build({
  stdin: { contents: `export { default as IncomingRequestToast } from './src/components/game3d/social/IncomingRequestToast.jsx';
    export * as friends from './src/components/game3d/social/friendRequest.jsx';
    export * as party from './src/components/game3d/social/partyInvite.jsx';
    export * as duel from './src/components/game3d/social/duelChallenge.jsx';
    export * as hud from './src/components/game3d/playerHUDStore.jsx';`, resolveDir: process.cwd(), loader: 'jsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', loader: { '.css': 'empty' },
  external: ['react', 'react-dom', 'react/jsx-runtime'], alias: { '@': process.cwd() + '/src' }, define: { 'import.meta.env': '{}' },
  plugins: [{ name: 'social-fixtures', setup(b) {
    b.onResolve({ filter: /^lucide-react$/ }, () => ({ path: process.cwd() + '/node_modules/lucide-react/dist/esm/lucide-react.js' }));
    b.onResolve({ filter: /api\/base44Client|^react-hot-toast$|^framer-motion$/ }, (args) => ({
      path: args.path.includes('base44Client') ? 'base44Client' : args.path, namespace: 'fixture',
    }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({ contents: fixtures[args.path], loader: 'js', resolveDir: process.cwd() }));
  } }],
  logLevel: 'silent',
});
const mod = new Module(process.cwd() + '/social-routing-test.cjs');
mod.paths = Module._nodeModulePaths(process.cwd());
mod._compile(result.outputFiles[0].text, process.cwd() + '/social-routing-test.cjs');
const { IncomingRequestToast, friends, party, duel, hud } = mod.exports;

let S;
beforeEach(() => {
  S = globalThis.__social = {
    calls: [], writes: [], toasts: [], tables: {}, replies: {},
    invoke: async (fn, body) => {
      S.calls.push([fn, body.action, body.data]);
      const reply = S.replies[`${fn}.${body.action}`];
      if (typeof reply === 'function') return reply(body);
      return { data: reply ?? { success: true } };
    },
    filter: async (name, q) => (S.tables[name] || []).filter((r) => Object.entries(q).every(([k, v]) => r[k] === v)),
  };
});
const httpError = (status, data) => Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data } });

test('friend, party and duel requests go to the server functions, never the tables', async () => {
  await friends.sendFriendRequest({ id: 'alice' }, { id: 'bob', name: 'Bob' });
  await party.sendPartyInvite({ id: 'alice' }, { id: 'bob', name: 'Bob' });
  hud.setPlayerHUD({ level: 12 });
  await duel.sendDuelChallenge({ id: 'alice' }, { id: 'bob', name: 'Bob' });
  assert.deepEqual(S.calls.map(([fn, action]) => `${fn}.${action}`), ['socialActions.send_friend_request', 'partySystem.invite_member', 'duelSystem.challenge']);
  assert.deepEqual(S.calls[0][2], { target_user_id: 'bob' });
  assert.deepEqual(S.calls[1][2], { inviteeId: 'bob', inviteeName: 'Bob' });
  const challenge = S.calls[2][2];
  assert.equal(challenge.opponentId, 'bob');
  assert.equal(challenge.stats.level, 12, 'the duelist brings their combat stats');
  for (const k of ['damage', 'maxHP', 'defense', 'attackSuccess', 'attackBlock', 'critChance']) assert.ok(Number.isFinite(challenge.stats[k]), k);
  assert.deepEqual(S.writes, []);
});

test('server refusals become the codes the game shows', async () => {
  S.replies['socialActions.send_friend_request'] = { already_friends: true };
  await assert.rejects(friends.sendFriendRequest({}, { id: 'bob', name: 'Bob' }), { code: 'already_friends' });
  S.replies['partySystem.invite_member'] = () => { throw httpError(409, { error: 'Party is full' }); };
  await assert.rejects(party.sendPartyInvite({}, { id: 'bob' }), { code: 'party_full' });
  S.replies['duelSystem.challenge'] = () => { throw httpError(409, { error: 'Bob is already in a duel', code: 'already_dueling' }); };
  await assert.rejects(duel.sendDuelChallenge({}, { id: 'bob' }), { code: 'already_dueling', message: 'Bob is already in a duel' });
  S.replies['duelSystem.hit'] = () => { throw httpError(429, { error: 'Too fast' }); };
  await assert.rejects(duel.strikeInDuel('d1', {}), { code: 'rate_limit' });
});

test('the request popup gathers all four kinds and answers each through its server', async () => {
  S.tables.FriendRequest = [{ id: 'fr1', sender_id: 'alice', sender_name: 'Alice', receiver_id: 'bob', status: 'pending' }];
  S.tables.SocialRequest = [{ id: 'tr1', kind: 'trade', sender_id: 'dave', sender_name: 'Dave', receiver_id: 'bob', status: 'pending' }];
  S.replies['partySystem.get_state'] = { party: null, members: [], invitations: [{ id: 'pi1', inviter_id: 'carol', inviter_name: 'Carol' }] };
  S.replies['duelSystem.state'] = { active: null, incoming: [{ id: 'du1', challenger_id: 'erin', challenger_name: 'Erin' }], outgoing: [] };
  const host = document.getElementById('root');
  const root = createRoot(host);
  await act(async () => { root.render(createElement(IncomingRequestToast, { userId: 'bob' })); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  const cardOf = (name) => [...host.querySelectorAll('span')].find((s) => s.textContent === name)?.closest('.w-80');
  for (const name of ['Alice', 'Carol', 'Erin', 'Dave']) assert.ok(cardOf(name), `${name}'s request is shown`);
  const press = async (name, label) => {
    const button = [...cardOf(name).querySelectorAll('button')].find((b) => b.textContent.includes(label));
    await act(async () => { button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); await new Promise((r) => setTimeout(r, 5)); });
  };
  S.calls.length = 0;
  await press('Alice', 'Accept');
  await press('Carol', 'Accept');
  await press('Erin', 'Decline');
  const answered = S.calls.filter(([, action]) => !['get_state', 'state'].includes(action)).map(([fn, action, data]) => [fn, action, data]);
  assert.deepEqual(answered, [
    ['socialActions', 'respond_friend_request', { request_id: 'fr1', decision: 'accept' }],
    ['partySystem', 'accept_invite', { inviteId: 'pi1' }],
    ['duelSystem', 'respond', { duelId: 'du1', decision: 'decline' }],
  ]);
  assert.deepEqual(S.writes, [], 'the popup never writes the tables itself');
  await act(async () => root.unmount());
});
