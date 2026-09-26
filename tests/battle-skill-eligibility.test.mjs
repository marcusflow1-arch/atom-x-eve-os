import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { buildSync } from 'esbuild';

const tables = new Map();
let writes = [], reads = [], failure = null, serial = 0;
const clone = (value) => structuredClone(value);
const rows = (name) => { if (!tables.has(name)) tables.set(name, []); return tables.get(name); };
const users = { a: { id: 'a', full_name: 'Player A' }, b: { id: 'b', full_name: 'Player B' } };
function matches(row, query) {
  return Object.entries(query).every(([key, expected]) => {
    if (expected && typeof expected === 'object' && '$in' in expected) {
      return (Array.isArray(row[key]) ? row[key] : [row[key]]).some((value) => expected.$in.includes(value));
    }
    return row[key] === expected;
  });
}
const entities = new Proxy({}, { get: (_, name) => ({
  filter: async (query = {}, sort = '', limit = 1000, skip = 0) => {
    reads.push({ name, query: clone(query), limit });
    if (failure?.(name, 'filter')) throw new Error('Simulated database failure');
    const found = rows(name).filter((row) => matches(row, query));
    const key = sort.replace(/^-/, '');
    if (key) found.sort((a, b) => String(a[key] || '').localeCompare(String(b[key] || '')) * (sort.startsWith('-') ? -1 : 1));
    return clone(found.slice(skip, skip + limit));
  },
  list: async () => clone(rows(name)),
  get: async (id) => {
    const row = rows(name).find((item) => item.id === id);
    if (!row) throw new Error('Not found');
    return clone(row);
  },
  create: async (data) => {
    const row = { ...clone(data), id: name + '-' + (++serial), created_date: new Date().toISOString() };
    rows(name).push(row); writes.push({ name, id: row.id, data: clone(data) }); return clone(row);
  },
  update: async (id, data) => {
    const row = rows(name).find((item) => item.id === id);
    assert.ok(row, name + ' ' + id + ' must exist');
    Object.assign(row, clone(data));
    writes.push({ name, id, data: clone(data) }); return clone(row);
  },
}) });
const handlers = {};
for (const name of ['skillBookLoadout', 'aiBattleMatchmaker']) {
  const { outputFiles } = buildSync({
    entryPoints: ['base44/functions/' + name + '/entry.ts'],
    bundle: true, write: false, platform: 'node', format: 'cjs', external: ['npm:*'],
  });
  vm.runInNewContext(outputFiles[0].text, {
    Response, Date, crypto: webcrypto, console: { error() {} },
    Deno: { serve: (handler) => { handlers[name] = handler; } },
    require: (id) => {
      assert.match(id, /^npm:@base44\/sdk/);
      return { createClientFromRequest: (req) => ({
        auth: { me: async () => users[req.headers.get('test-user')] || null },
        asServiceRole: { entities },
      }) };
    },
  });
}
async function call(name, action, data = {}, user = 'a', status = 200) {
  const response = await handlers[name](new Request('https://test.local', {
    method: 'POST', headers: { 'test-user': user }, body: JSON.stringify({ action, data }),
  }));
  const body = await response.json();
  assert.equal(response.status, status, JSON.stringify(body));
  return body;
}
const book = (action, data, user, status) => call('skillBookLoadout', action, data, user, status);
const battle = (action, data, user, status) => call('aiBattleMatchmaker', action, data, user, status);
const effects = ['artemis_call_of_the_husky', 'artemis_rain_of_arrows', 'artemis_lunar_beam'];
function ownedCard(id, effect = 'getsuga_tensho', patch = {}) {
  const row = { id, user_id: 'a', card_type: 'Ability', card_name: id, game_name: 'Test Game',
    card_rarity: 'Unique', trade_status: 'available', animation_effect: { id: effect }, ...patch };
  rows('UserCard').push(row); return row;
}
function loadouts(userId) {
  return [0, 1, 2].map((index) => ({
    id: userId + '-set-' + index, user_id: userId, name: 'Genre ' + index,
    loadout_type: 'skills', skill_set_id: 'skill-set-' + (index + 1),
    skill_set_name: 'Genre ' + index, skill_set_genre: '', skill_set_order: index,
    jawan_id: 'jawan-' + (index + 1), jawan_name: 'Jawan', jawan_role: 'Balanced',
    skill_slots: {}, is_active: index === 0, created_date: '2026-09-26T00:00:0' + index + 'Z',
  }));
}
function savedSlots(slots) { rows('Loadout').find((row) => row.id === 'a-set-0').skill_slots = slots; }
beforeEach(() => {
  tables.clear(); writes = []; reads = []; failure = null; serial = 0;
  tables.set('Loadout', [...loadouts('a'), ...loadouts('b')]);
  tables.set('Avatar', ['a', 'b'].map((id) => ({ id: 'avatar-' + id, user_id: id, gender: 'male', updated_date: new Date().toISOString() })));
});
function setGender(gender) { rows('Avatar')[0].gender = gender; }

test('both handlers require an authenticated player', async () => {
  await book('getState', {}, 'missing', 401);
  await battle('join', { mode: 'pvp' }, 'missing', 401);
  assert.equal(writes.length, 0);
});

for (const effect of effects) {
  test(effect + ': male cannot equip; female can equip and reload it', async () => {
    ownedCard('ability', effect);
    const blocked = await book('equip', { slot: 0, user_card_id: 'ability', gender: 'female' }, 'a', 409);
    assert.match(blocked.error, /female avatar/);
    assert.equal(writes.length, 0);
    setGender('female');
    await book('equip', { slot: 0, user_card_id: 'ability' });
    const state = await book('getState');
    assert.equal(state.loadout.slots[0].user_card_id, 'ability');
    assert.equal(state.skills[0].can_equip, true);
  });
}

test('collection retains incompatible cards, but effective hotbar hides stale selections without deleting them', async () => {
  ownedCard('artemis', effects[0]);
  ownedCard('locked', 'getsuga_tensho', { trade_status: 'locked_in_trade' });
  savedSlots({ '0': 'artemis', '1': 'locked' });
  const state = await book('getState');
  assert.equal(state.skills.length, 2);
  assert.equal(state.skills.find((s) => s.user_card_id === 'artemis').required_avatar_gender, 'female');
  assert.ok(state.skills.every((skill) => skill.owned && !skill.can_equip && skill.equip_error));
  assert.equal(state.loadout.slots.length, 4);
  assert.ok(state.loadout.slots.every((slot) => slot.card === null));
  assert.deepEqual(state.loadout.skill_slots, {});
  assert.equal(rows('Loadout')[0].skill_slots['0'], 'artemis');
  setGender('female');
  assert.equal((await book('getState')).loadout.slots[0].user_card_id, 'artemis');
});

test('foreign, trade-locked, and non-Ability cards cannot be equipped', async () => {
  ownedCard('foreign', 'getsuga_tensho', { user_id: 'b' });
  ownedCard('locked', 'getsuga_tensho', { trade_status: 'locked_in_trade' });
  ownedCard('equipment', 'getsuga_tensho', { card_type: 'Equipment' });
  for (const [id, status] of [['foreign', 404], ['locked', 409], ['equipment', 400]]) {
    await book('equip', { slot: 0, user_card_id: id }, 'a', status);
  }
  assert.equal(writes.length, 0);
});

test('removing a stale foreign assignment never modifies the other owner card', async () => {
  ownedCard('foreign', 'getsuga_tensho', { user_id: 'b', is_equipped: true });
  savedSlots({ '0': 'foreign' });
  await book('unequip', { slot: 0 });
  assert.equal(rows('UserCard')[0].is_equipped, true);
  assert.ok(!writes.some((write) => write.name === 'UserCard'));
});

const actions = [
  ['equip', { slot: 0, user_card_id: 'normal' }],
  ['unequip', { slot: 0 }], ['clear', {}],
  ['selectSkillSet', { skill_set_id: 'skill-set-2' }],
  ['selectJawan', { jawan_id: 'jawan-2' }],
];
for (const status of ['matched', 'countdown', 'fighting']) {
  test(status + ': all loadout mutations stay locked behind 550 newer unrelated matches', async () => {
    ownedCard('normal');
    tables.set('AIBattleMatch', [
      { id: 'mine', player_ids: ['a', 'b'], status, created_date: '2026-09-01' },
      ...Array.from({ length: 550 }, (_, i) => ({ id: 'other-' + i, player_ids: ['other-1', 'other-2'], status: 'fighting', created_date: '2026-09-26' })),
    ]);
    for (const [action, data] of actions) await book(action, data, 'a', 409);
    assert.equal(writes.length, 0);
    assert.ok(reads.filter((read) => read.name === 'AIBattleMatch').every((read) =>
      read.query.player_ids?.$in?.includes('a') && read.query.status?.$in?.includes(status) && read.limit === 1));
  });
}

test('failed match lookups block every loadout mutation without a write', async () => {
  failure = (name, op) => name === 'AIBattleMatch' && op === 'filter';
  for (const [action, data] of actions) {
    const result = await book(action, data, 'a', 503);
    assert.match(result.error, /verify your match status/);
  }
  assert.equal(writes.length, 0);
});

test('ended matches and unrelated live matches do not lock the player', async () => {
  tables.set('AIBattleMatch', [
    { id: 'ended', player_ids: ['a', 'b'], status: 'ended' },
    { id: 'other', player_ids: ['other-1', 'other-2'], status: 'fighting' },
  ]);
  ownedCard('normal');
  assert.equal((await book('equip', { slot: 3, user_card_id: 'normal' })).loadout.slots[3].user_card_id, 'normal');
  await book('equip', { slot: 4, user_card_id: 'normal' }, 'a', 400);
});

test('unavailable avatar data cannot authorize Artemis equip', async () => {
  ownedCard('artemis', effects[0]);
  failure = (name) => name === 'Avatar';
  await book('equip', { slot: 0, user_card_id: 'artemis' }, 'a', 500);
  assert.equal(writes.length, 0);
});

for (const gender of ['male', 'female']) {
  test(gender + ': real queue pairing freezes only owned, available, compatible Ability cards', async () => {
    setGender(gender);
    ownedCard('artemis', effects[0]);
    ownedCard('locked', 'getsuga_tensho', { trade_status: 'locked_in_trade' });
    ownedCard('equipment', 'getsuga_tensho', { card_type: 'Equipment' });
    ownedCard('foreign', 'getsuga_tensho', { user_id: 'b' });
    savedSlots({ '0': 'artemis', '1': 'locked', '2': 'equipment', '3': 'foreign' });
    await battle('join', { mode: 'pvp' }, 'b');
    const { match } = await battle('join', { mode: 'pvp', gender: 'female' });
    const me = match.players.find((p) => p.id === 'a');
    assert.equal(me.gender, gender);
    assert.deepEqual(me.skills.map((skill) => skill.user_card_id), gender === 'female' ? ['artemis'] : []);
  });
}

function fightingMatch(gender = 'male', skillPatch = {}) {
  const now = Date.now(), stamp = new Date(now).toISOString();
  const skill = { slot: 0, effect_id: effects[0], animation_effect: { id: effects[0] },
    atb_cost: 50, cooldown_ms: 7000, range_m: 18, base_damage: 110, hit_ms: 1500, level: 1, ...skillPatch };
  tables.set('AIBattleMatch', [{
    id: 'fight', status: 'fighting', player_ids: ['a', 'b'], host_id: 'a',
    players: [{ id: 'a', gender, hp: 1000, max_hp: 1000, skills: [skill] }, { id: 'b', gender: 'male', hp: 1000, max_hp: 1000, skills: [] }],
    positions: { a: { x: 0, z: 5 }, b: { x: 0, z: -5 } },
    atb: { a: { value: 100, at: stamp } }, cooldowns: {}, pending_hits: [], hit_log: [],
    fight_starts_at: stamp, fight_ends_at: new Date(now + 180000).toISOString(),
  }]);
  tables.set('AIBattleQueueEntry', ['a', 'b'].map((id) => ({ id: 'queue-' + id, user_id: id, status: 'matched', mode: 'pvp', match_id: 'fight', last_seen_at: stamp, created_date: stamp })));
}

test('legacy male frozen Artemis loadouts cannot cast or spend ATB', async () => {
  fightingMatch();
  setGender('female'); // Editing today's avatar cannot change the frozen battle avatar.
  const result = await battle('use_skill', { match_id: 'fight', slot: 0, gender: 'female' }, 'a', 409);
  assert.match(result.error, /female avatar/);
  assert.equal(writes.length, 0);
  assert.equal(rows('AIBattleMatch')[0].atb.a.value, 100);
});

test('female frozen Artemis skill still casts after profile edits; cooldown remains enforced', async () => {
  fightingMatch('female');
  const result = await battle('use_skill', { match_id: 'fight', slot: 0, cast_id: 'cast-1' });
  assert.equal(result.cast.effect_id, effects[0]);
  assert.equal(rows('AIBattleMatch')[0].pending_hits.length, 1);
  assert.equal(rows('AIBattleMatch')[0].atb.a.value, 50);
  await battle('use_skill', { match_id: 'fight', slot: 0, cast_id: 'cast-2' }, 'a', 409);
  assert.equal(rows('AIBattleMatch')[0].pending_hits.length, 1);
});

test('legacy extra slots cannot cast, and unowned matches cannot be accessed', async () => {
  fightingMatch('female', { slot: 4 });
  await battle('use_skill', { match_id: 'fight', slot: 4 }, 'a', 400);
  rows('AIBattleMatch')[0].player_ids = ['b', 'other'];
  await battle('use_skill', { match_id: 'fight', slot: 0 }, 'a', 404);
  assert.equal(writes.length, 0);
});

for (const action of ['ready', 'dodge']) {
  test(action + ' rejects non-members before any match settlement', async () => {
    fightingMatch();
    rows('AIBattleMatch')[0].player_ids = ['b', 'other'];
    await battle(action, { match_id: 'fight' }, 'a', 404);
    assert.equal(writes.length, 0);
  });
}

for (const action of ['cancel', 'reset']) {
  test(action + ' before combat ends the match and releases both players loadout locks', async () => {
    await battle('join', { mode: 'pvp' }, 'b');
    await battle('join', { mode: 'pvp' });
    await book('clear', {}, 'a', 409);
    await battle(action);
    assert.equal(rows('AIBattleMatch')[0].status, 'ended');
    await book('clear', {}, 'a');
    await book('clear', {}, 'b');
  });
}

test('existing female starter-card behavior remains available and repeat bootstrap does not duplicate it', async () => {
  setGender('female');
  const first = await book('bootstrap');
  assert.equal(first.skills.filter((s) => effects.includes(s.card?.animation_effect?.id)).length, 3);
  assert.ok(first.skills.every((s) => s.can_equip));
  await book('bootstrap');
  assert.equal(rows('UserCard').length, 4);
});
