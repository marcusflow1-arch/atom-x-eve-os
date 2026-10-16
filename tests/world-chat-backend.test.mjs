// worldChat: Game 3D world and party chat through the server (docs/game3d/BACKEND_AUDIT.md §3.E).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import vm from 'node:vm';

const tables = {};
const reset = () => {
  for (const k of Object.keys(tables)) delete tables[k];
  Object.assign(tables, {
    ChatMessage: [],
    Party: [{ id: 'p1', status: 'active' }, { id: 'old', status: 'disbanded' }],
    PartyMember: [{ id: 'm1', party_id: 'p1', user_id: 'alice' }, { id: 'm2', party_id: 'p1', user_id: 'bob' }, { id: 'm3', party_id: 'old', user_id: 'carol' }],
  });
};
let seq = 0;
const sortRows = (rows, sort) => {
  if (!sort) return rows;
  const desc = sort.startsWith('-'); const key = sort.replace(/^-/, '');
  return [...rows].sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * (desc ? -1 : 1));
};
const entities = new Proxy({}, { get: (_, name) => ({
  filter: async (filter = {}, sort, limit) => sortRows((tables[name] || []).filter((r) => Object.entries(filter).every(([k, v]) => r[k] === v)), sort).slice(0, limit || undefined).map((r) => ({ ...r })),
  get: async (id) => { const r = (tables[name] || []).find((x) => x.id === id); return r ? { ...r } : null; },
  create: async (data) => { const row = { id: `${name}-${++seq}`, created_date: new Date().toISOString(), ...data }; (tables[name] ||= []).push(row); return { ...row }; },
}) });
const users = { alice: { id: 'alice', full_name: 'Alice' }, bob: { id: 'bob', full_name: 'Bob' }, carol: { id: 'carol', full_name: 'Carol' } };

let handler;
const source = buildSync({ entryPoints: ['base44/functions/worldChat/entry.ts'], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['npm:*'] }).outputFiles[0].text;
vm.runInNewContext(source, {
  module: { exports: {} }, exports: {}, Response, Request, Date, JSON, Number, String, Object, Array, Promise, Math,
  console: { warn() {}, error() {}, log() {} },
  Deno: { serve: (fn) => { handler = fn; } },
  require: () => ({ createClientFromRequest: (req) => ({ auth: { me: async () => users[req.headers.get('test-user')] || null }, asServiceRole: { entities } }) }),
});
async function call(user, action, data = {}, status = 200) {
  const res = await handler(new Request('https://test.local', { method: 'POST', headers: { 'test-user': user }, body: JSON.stringify({ action, data }) }));
  const body = await res.json();
  assert.equal(res.status, status, `${action}: ${JSON.stringify(body)}`);
  return body;
}
// let time pass for a sender's earlier messages
const age = (ms) => { for (const m of tables.ChatMessage) m.created_date = new Date(Date.parse(m.created_date) - ms).toISOString(); };

test('signed-in players only; messages are cleaned and capped', async () => {
  reset();
  await call('nobody', 'send', { channel: 'world', content: 'hi' }, 401);
  assert.equal((await call('alice', 'send', { channel: 'world', content: ' \u0000\n\t ' }, 400)).code, 'empty');
  const { message } = await call('alice', 'send', { channel: 'world', content: '  hello\n\n  world\u0007  ' });
  assert.deepEqual([message.channel_id, message.sender_id, message.sender_name, message.content, message.type], ['game3d_world', 'alice', 'Alice', 'hello world', 'text']);
  age(5000);
  assert.equal((await call('alice', 'send', { channel: 'world', content: 'x'.repeat(500) })).message.content.length, 200);
  await call('alice', 'send', { channel: 'guild', content: 'hi' }, 400);
});

test('world history comes back oldest first, without deleted messages', async () => {
  reset();
  for (const [i, who] of ['alice', 'bob', 'alice'].entries()) { await call(who, 'send', { channel: 'world', content: `line ${i}` }); age(2000); }
  tables.ChatMessage.find((m) => m.content === 'line 1').is_deleted = true;
  const { messages } = await call('carol', 'recent', { channel: 'world' });
  assert.deepEqual(messages.map((m) => m.content), ['line 0', 'line 2']);
});

test('party chat is for the members of an active party only', async () => {
  reset();
  assert.equal((await call('carol', 'send', { channel: 'party', content: 'hi' }, 403)).code, 'no_party', 'a disbanded party does not count');
  const { message } = await call('alice', 'send', { channel: 'party', content: 'on my way' });
  assert.equal(message.channel_id, 'game3d_party_p1');
  assert.deepEqual((await call('bob', 'recent', { channel: 'party' })).messages.map((m) => m.content), ['on my way']);
  await call('carol', 'recent', { channel: 'party' }, 403);
  assert.deepEqual((await call('bob', 'recent', { channel: 'world' })).messages, [], 'party lines never show in world chat');
});

test('rate limits: one message a second, six per twenty seconds, no repeats', async () => {
  reset();
  await call('alice', 'send', { channel: 'world', content: 'one' });
  assert.equal((await call('alice', 'send', { channel: 'world', content: 'two' }, 429)).code, 'too_fast');
  age(1500);
  assert.equal((await call('alice', 'send', { channel: 'world', content: 'one' }, 409)).code, 'duplicate');
  for (const n of ['two', 'three', 'four', 'five', 'six']) { await call('alice', 'send', { channel: 'world', content: n }); age(1500); }
  assert.equal((await call('alice', 'send', { channel: 'world', content: 'seven' }, 429)).code, 'too_fast', 'six in under twenty seconds');
  await call('bob', 'send', { channel: 'world', content: 'others are not slowed down' });
  age(20_000);
  await call('alice', 'send', { channel: 'world', content: 'seven' });
});
