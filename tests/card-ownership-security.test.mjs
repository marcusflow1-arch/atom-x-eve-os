import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { buildSync } from 'esbuild';

const tables = new Map(), schemas = new Map();
let writes = [], serial = 0, failure = null;
const users = { a: { id: 'a', role: 'user', unlocked_achievements: ['earned'] }, b: { id: 'b', role: 'user' }, admin: { id: 'admin', role: 'admin' } };
const copy = (value) => structuredClone(value);
const rows = (name) => { if (!tables.has(name)) tables.set(name, []); return tables.get(name); };
function schema(name) {
  if (!schemas.has(name)) {
    const original = 'base44/entities/' + name + '.jsonc';
    const kebab = 'base44/entities/' + name.replace(/[A-Z]/g, (c, i) => (i ? '-' : '') + c.toLowerCase()) + '.jsonc';
    schemas.set(name, JSON.parse(readFileSync(existsSync(original) ? original : kebab, 'utf8')));
  }
  return schemas.get(name);
}
function allowed(rule, actor, data) {
  if (rule === undefined || rule === true) return true;
  if (rule === false) return false;
  return Object.entries(rule).every(([key, value]) => {
    if (key === '$or') return value.some((part) => allowed(part, actor, data));
    if (key === '$and') return value.every((part) => allowed(part, actor, data));
    if (key === 'user_condition') return Object.entries(value).every(([field, expected]) => actor?.[field] === expected);
    const actual = key.startsWith('data.') ? data?.[key.slice(5)] : data?.[key];
    return actual === (value === '{{user.id}}' ? actor?.id : value);
  });
}
function check(name, op, actor, data) {
  if (!allowed(schema(name).rls?.[op], actor, data)) throw Object.assign(new Error('Forbidden ' + name + ' ' + op), { status: 403 });
}
function validate(name, data) {
  const def = schema(name);
  for (const field of def.required || []) assert.notEqual(data[field], undefined, name + '.' + field + ' is required');
  for (const [field, value] of Object.entries(data)) {
    if (value !== undefined && def.properties?.[field]?.enum) assert.ok(def.properties[field].enum.includes(value), name + '.' + field + ' rejects ' + value);
  }
}
function matches(row, query) {
  return Object.entries(query).every(([key, value]) => {
    if (value && typeof value === 'object') {
      const values = Array.isArray(row[key]) ? row[key] : [row[key]];
      if ('$in' in value) return values.some((v) => value.$in.includes(v));
      if ('$nin' in value) return values.every((v) => !value.$nin.includes(v));
      if ('$exists' in value) return (row[key] !== undefined) === value.$exists;
      if ('$ne' in value) return !values.includes(value.$ne);
    }
    return row[key] === value;
  });
}
function entities(actor) {
  return new Proxy({}, { get: (_, name) => {
    const select = async (query = {}, sort = '', limit = 1000, skip = 0) => {
      if (failure?.(name, 'filter')) throw new Error('Database unavailable');
      const selected = rows(name).filter((row) => matches(row, query) && allowed(schema(name).rls?.read, actor, row));
      const field = sort?.replace(/^-/, '');
      if (field) selected.sort((a, b) => String(a[field] || '').localeCompare(String(b[field] || '')) * (sort.startsWith('-') ? -1 : 1));
      return copy(selected.slice(skip, skip + limit));
    };
    return {
      filter: select,
      list: (sort, limit, skip) => select({}, sort, limit, skip),
      get: async (id) => {
        if (failure?.(name, 'get')) throw new Error('Database unavailable');
        const row = rows(name).find((row) => row.id === id);
        if (!row) throw Object.assign(new Error('Not found'), { status: 404 });
        check(name, 'read', actor, row); return copy(row);
      },
      create: async (data) => {
        check(name, 'create', actor, data); validate(name, data);
        const row = { ...copy(data), id: name + '-' + (++serial), created_date: new Date().toISOString() };
        rows(name).push(row); writes.push({ name, op: 'create', id: row.id, data: copy(data) }); return copy(row);
      },
      update: async (id, data) => {
        const row = rows(name).find((row) => row.id === id); assert.ok(row, name + ' ' + id);
        check(name, 'update', actor, row); validate(name, { ...row, ...data });
        Object.assign(row, copy(data)); writes.push({ name, op: 'update', id, data: copy(data) }); return copy(row);
      },
      upsert: async (records, { key }) => {
        const keys = Array.isArray(key) ? key : [key], written = [];
        let created = 0, updated = 0;
        for (const input of records) {
          const found = rows(name).find((row) => keys.every((field) => row[field] === input[field]));
          if (found) {
            check(name, 'update', actor, found); Object.assign(found, copy(input)); written.push(copy(found)); updated++;
          } else {
            const defaults = Object.fromEntries(Object.entries(schema(name).properties || {}).filter(([, prop]) => prop.default !== undefined).map(([field, prop]) => [field, copy(prop.default)]));
            const row = { ...defaults, ...copy(input), id: name + '-' + (++serial), created_date: new Date().toISOString() };
            check(name, 'create', actor, row); validate(name, row); rows(name).push(row); written.push(copy(row)); created++;
          }
          writes.push({ name, op: 'upsert', data: copy(input) });
        }
        return { created, updated, records: written };
      },
      updateMany: async (query, changes) => {
        let updated = 0;
        for (const row of rows(name).filter((row) => matches(row, query))) {
          check(name, 'update', actor, row);
          for (const [op, values] of Object.entries(changes)) for (const [field, value] of Object.entries(values)) {
            if (op === '$set') row[field] = copy(value);
            else if (op === '$inc') row[field] = (row[field] ?? 0) + value;
            else if (op === '$max') row[field] = Math.max(row[field] ?? -Infinity, value);
            else if (op === '$addToSet') row[field] = [...new Set([...(row[field] || []), value])];
            else throw new Error('Unknown update operator ' + op);
          }
          validate(name, row); updated++;
          writes.push({ name, op: 'updateMany', id: row.id, data: copy(changes) });
        }
        return { success: true, updated, has_more: false };
      },
      delete: async (id) => {
        const row = rows(name).find((row) => row.id === id); assert.ok(row);
        check(name, 'delete', actor, row);
        tables.set(name, rows(name).filter((row) => row.id !== id)); writes.push({ name, op: 'delete', id });
      },
    };
  } });
}
const handlers = {};
for (const name of ['cardProgression', 'achievementSystem', 'unlockGameSystem', 'migrateCardCatalog', 'skillBookLoadout']) {
  const code = buildSync({ entryPoints: ['base44/functions/' + name + '/entry.ts'], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['npm:*'] }).outputFiles[0].text;
  vm.runInNewContext(code, {
    Response, Date, crypto: webcrypto, console: { error() {}, warn() {} },
    Deno: { serve: (handler) => { handlers[name] = handler; } },
    require: (id) => {
      assert.match(id, /^npm:@base44\/sdk/);
      return { createClientFromRequest: (req) => {
        const actor = users[req.headers.get('test-user')] || null;
        return { auth: { me: async () => actor }, entities: entities(actor), asServiceRole: { entities: entities(users.admin) } };
      } };
    },
  });
}
async function call(name, body, expected = 200, actor = 'a') {
  const response = await handlers[name](new Request('https://test.local', { method: 'POST', headers: { 'test-user': actor }, body: JSON.stringify(body) }));
  const result = await response.json();
  assert.equal(response.status, expected, JSON.stringify(result));
  return result;
}
const progress = (body, status, actor) => call('cardProgression', { action: 'getState', ...body }, status, actor);
function seedCard(patch = {}) {
  rows('Game').push({ id: 'game', title: 'Test Game', genre: 'Action RPG' });
  rows('TradingCard').push({ id: 'catalog', name: 'Test Skill', image_url: 'https://test.local/card.png', rarity: 'Rare', status: 'live', card_type: 'ability', achievement_id: 'earned', game_id: 'game', series: 'Test Game', stats: { attack: 42, defense: 31 } });
  rows('Achievement').push({ id: 'earned', title: 'Earned Skill', description: 'Verified goal', category: 'ability', game: 'Test Game', game_id: 'game', card_id: 'catalog', rarity: 'Rare', points: 0, icon: 'test', reward: { name: 'Test Skill', stats: { attack: 42 } } });
  const card = { id: 'owned', user_id: 'a', trading_card_id: 'catalog', achievement_id: 'earned', card_type: 'ability', card_name: 'Test Skill', card_rarity: 'Rare', game_name: 'Test Game', game_id: 'game', quantity: 1, acquisition_method: 'unlocked', trade_status: 'available', animation_effect: { id: 'getsuga_tensho' }, ...patch };
  rows('UserCard').push(card); return card;
}
beforeEach(() => {
  tables.clear(); writes = []; serial = 0; failure = null;
  tables.set('Avatar', [{ id: 'avatar-a', user_id: 'a', gender: 'female' }]);
});

test('anonymous requests cannot access progression or the retired unlock endpoint', async () => {
  await progress({ userCardId: 'owned' }, 401, 'missing');
  await call('unlockGameSystem', { gameId: 'paid' }, 401, 'missing');
  assert.equal(writes.length, 0);
});

for (const status of ['locked', 'in_progress', 'pending_review', 'unlocked']) {
  test(status + ' achievement records and profile arrays cannot mint a card through progression', async () => {
    seedCard(); tables.set('UserCard', []);
    rows('UserAchievement').push({ id: 'ua', user_id: 'a', achievement_id: 'earned', status });
    await progress({ achievementId: 'earned', payload: { cardImage: 'injected', gameId: 'other' } }, 403);
    assert.equal(writes.length, 0);
    assert.equal(rows('UserCard').length, 0);
  });
}

test('unowned and foreign cards are rejected without creating progression', async () => {
  seedCard({ user_id: 'b' });
  await progress({ userCardId: 'owned' }, 404);
  await progress({ achievementId: 'earned' }, 403);
  assert.equal(writes.length, 0);
});

test('an owned card initializes progression from its canonical stats', async () => {
  seedCard();
  const result = await progress({ userCardId: 'owned', payload: { gameId: 'injected', genre: 'injected' } });
  assert.equal(result.progression.base_stats.attack, 42);
  assert.equal(result.progression.base_stats.defense, 31);
  assert.equal(result.progression.game_id, 'game');
  assert.equal(result.progression.achievement_id, 'earned');
  assert.equal(rows('UserCard').length, 1);
  assert.ok(!writes.some((w) => w.name === 'UserCard'));
});

test('achievement-only requests resolve an existing owned canonical card without requiring the original unlock', async () => {
  seedCard({ achievement_id: '', acquisition_method: 'traded' });
  const result = await progress({ achievementId: 'earned' });
  assert.equal(result.userCard.id, 'owned');
  assert.equal(result.progression.achievement_id, 'earned');
  assert.equal(rows('UserAchievement').length, 0);
  assert.equal(rows('UserCard').length, 1);
});

test('a different achievement cannot supply stats for an owned card', async () => {
  seedCard();
  rows('Achievement').push({ id: 'stronger', reward: { stats: { attack: 999999 } } });
  await progress({ userCardId: 'owned', achievementId: 'stronger' }, 409);
  assert.equal(writes.length, 0);
});

test('legacy owned cards ignore client-supplied achievement stats and game metadata', async () => {
  seedCard({ trading_card_id: '', achievement_id: '', game_id: '', card_type: 'Ability' });
  rows('Achievement').push({ id: 'stronger', reward: { stats: { attack: 999999 } } });
  const result = await progress({ userCardId: 'owned', achievementId: 'stronger', payload: { gameId: 'injected' } });
  assert.equal(result.progression.achievement_id, '');
  assert.equal(result.progression.game_id, '');
  assert.equal(result.progression.base_stats.attack, 28);
});

test('zero quantity and a missing catalog definition fail closed', async () => {
  const card = seedCard({ quantity: 0 });
  await progress({ userCardId: 'owned' }, 409);
  card.quantity = 1;
  failure = (name, op) => name === 'TradingCard' && op === 'get';
  await progress({ userCardId: 'owned' }, 400);
  assert.equal(writes.length, 0);
});

test('unknown actions and malformed training counts cannot write anything', async () => {
  seedCard();
  await progress({ action: 'awardXP', userCardId: 'owned', payload: { amount: 999999 } }, 400);
  for (const sessions of [0, -1, 11, 0.5, 'not-a-number']) {
    await progress({ action: 'train', userCardId: 'owned', payload: { sessions } }, 400);
  }
  assert.equal(writes.length, 0);
});

test('trade-locked cards remain inspectable but cannot be upgraded', async () => {
  seedCard({ trade_status: 'locked_in_trade' });
  await progress({ userCardId: 'owned' });
  writes = [];
  await progress({ action: 'train', userCardId: 'owned', payload: { sessions: 1 } }, 409);
  assert.equal(writes.length, 0);
});

test('valid training spends only the owner materials and grants the expected XP', async () => {
  seedCard();
  rows('UserMaterial').push(
    { id: 'ma', user_id: 'a', material_id: 'catalyst', material_type: 'skill_catalyst', quantity: 4 },
    { id: 'mb', user_id: 'b', material_id: 'catalyst', material_type: 'skill_catalyst', quantity: 10 },
  );
  const result = await progress({ action: 'train', userCardId: 'owned', payload: { sessions: 2 } });
  assert.equal(rows('UserMaterial')[0].quantity, 2);
  assert.equal(rows('UserMaterial')[1].quantity, 10);
  assert.equal(result.progression.xp, 120);
});

test('invalid material quantities do not produce XP or material writes', async () => {
  seedCard();
  await progress({ userCardId: 'owned' }); writes = [];
  rows('UserMaterial').push({ id: 'ma', user_id: 'a', material_id: 'catalyst', material_type: 'skill_catalyst', quantity: -4 });
  await progress({ action: 'train', userCardId: 'owned', payload: { sessions: 1 } }, 400);
  assert.equal(writes.length, 0);
});

for (const invalid of ['foreign', 'equipped', 'duplicate', 'starter']) {
  test('fusion prevalidates the entire ' + invalid + ' selection before consuming cards', async () => {
    const base = seedCard();
    rows('UserCard').push({ ...base, id: 'one' }, { ...base, id: 'two' });
    if (invalid === 'foreign') rows('UserCard')[2].user_id = 'b';
    if (invalid === 'equipped') rows('UserCard')[2].is_equipped = true;
    if (invalid === 'starter') rows('UserCard')[2].starter_grant_user_id = 'a';
    await progress({ userCardId: 'owned' }); writes = [];
    await progress({ action: 'combine', userCardId: 'owned', payload: { sacrificeUserCardIds: invalid === 'duplicate' ? ['one', 'one'] : ['one', 'two'] } }, 400);
    assert.equal(rows('UserCard').length, 3);
    assert.equal(writes.length, 0);
  });
}

test('valid fusion still consumes two compatible cards and advances the owned card', async () => {
  const base = seedCard();
  rows('UserCard').push({ ...base, id: 'one' }, { ...base, id: 'two' });
  const result = await progress({ action: 'combine', userCardId: 'owned', payload: { sacrificeUserCardIds: ['one', 'two'] } });
  assert.equal(rows('UserCard').length, 1);
  assert.equal(result.progression.stage, 2);
});

test('normal users cannot create reward records or change material and enchantment definitions', async () => {
  const mine = entities(users.a);
  for (const [name, record] of [
    ['UserAchievement', { user_id: 'a', achievement_id: 'earned', status: 'pending_review', source: 'game_event', progress: { event_value: 999999 } }],
    ['UserMaterial', { user_id: 'a', material_id: 'gold', quantity: 999999 }],
    ['Material', { name: 'Free resources' }],
    ['Enchantment', { name: 'Unlimited power' }],
  ]) await assert.rejects(() => mine[name].create(record), /Forbidden/);
  assert.equal(writes.length, 0);
});

test('material ownership is private and only service/admin can write balances', async () => {
  rows('UserMaterial').push({ id: 'ma', user_id: 'a', material_id: 'catalyst', quantity: 4 });
  assert.equal((await entities(users.a).UserMaterial.filter({})).length, 1);
  assert.equal((await entities(users.b).UserMaterial.filter({})).length, 0);
  await assert.rejects(() => entities(users.a).UserMaterial.update('ma', { quantity: 99 }), /Forbidden/);
  await entities(users.admin).UserMaterial.update('ma', { quantity: 3 });
  assert.equal(rows('UserMaterial')[0].quantity, 3);
});

test('proof submission uses the authenticated owner and service-role writes; only admin approval grants the reward', async () => {
  seedCard(); tables.set('UserCard', []);
  const submitted = await call('achievementSystem', { action: 'submit_proof', achievementId: 'earned', user_id: 'b', status: 'unlocked', proof_media_url: 'https://test.local/proof.png' });
  assert.equal(submitted.achievement.user_id, 'a');
  assert.equal(submitted.achievement.status, 'pending_review');
  assert.equal(rows('UserCard').length, 0);
  const id = submitted.achievement.id;
  await call('achievementSystem', { action: 'review_proof', user_achievement_id: id, approve: true, role: 'admin' }, 403);
  await call('achievementSystem', { action: 'review_proof', user_achievement_id: id, approve: 'false' }, 400, 'admin');
  assert.equal(rows('UserAchievement')[0].status, 'pending_review');
  await call('achievementSystem', { action: 'review_proof', user_achievement_id: id, approve: true }, 200, 'admin');
  assert.equal(rows('UserAchievement')[0].status, 'unlocked');
  assert.equal(rows('UserCard').length, 1);
  assert.equal(rows('UserCard')[0].user_id, 'a');
  const repeatedApproval = await call('achievementSystem', { action: 'review_proof', user_achievement_id: id, approve: true }, 200, 'admin');
  assert.equal(repeatedApproval.alreadyUnlocked, true);
  assert.equal(rows('UserCard').length, 1);
});

test('the legacy unlock endpoint cannot record an unverified purchase or ownership', async () => {
  const result = await call('unlockGameSystem', { gameId: 'paid', payment_status: 'completed' }, 410);
  assert.equal(result.code, 'LEGACY_UNLOCK_RETIRED');
  assert.equal(writes.length, 0);
});

for (const apply of [undefined, false, 'false', 'true', 1]) {
  test('migration stays a dry run unless apply is boolean true: ' + String(apply), async () => {
    seedCard({ trading_card_id: '' });
    const result = await call('migrateCardCatalog', { apply }, 200, 'admin');
    assert.equal(result.dry_run, true);
    assert.equal(writes.length, 0);
  });
}

test('explicit migration preserves quantities, timestamps and equipped state', async () => {
  seedCard({ trading_card_id: '', quantity: 7, is_equipped: true, equipped_to: 'skill_book', acquired_at: '2026-01-01T00:00:00Z', source: 'trade' });
  tables.set('Achievement', []);
  await call('migrateCardCatalog', { apply: true }, 200, 'admin');
  const card = rows('UserCard')[0];
  assert.equal(card.trading_card_id, 'catalog');
  assert.equal(card.quantity, 7);
  assert.equal(card.is_equipped, true);
  assert.equal(card.equipped_to, 'skill_book');
  assert.equal(card.acquired_at, '2026-01-01T00:00:00Z');
  assert.equal(card.source, 'trade');
});

test('normal users cannot apply the catalog migration', async () => {
  seedCard({ trading_card_id: '' });
  await call('migrateCardCatalog', { apply: true }, 403);
  assert.equal(writes.length, 0);
});

for (const type of ['ability', 'Ability']) {
  test(type + ' cards remain equippable and survive a Skill Book reload', async () => {
    seedCard({ card_type: type });
    rows('Avatar')[0].gender = 'male';
    const result = await call('skillBookLoadout', { action: 'equip', data: { slot: 2, user_card_id: 'owned' } });
    assert.equal(result.loadout.slots[2].user_card_id, 'owned');
    assert.equal(result.skills.find((skill) => skill.user_card_id === 'owned').can_equip, true);
    const reloaded = await call('skillBookLoadout', { action: 'getState' });
    assert.equal(reloaded.loadout.slots[2].user_card_id, 'owned');
  });
}

test('female avatar starters are restored, tracked and not reissued after transfer', async () => {
  await call('skillBookLoadout', { action: 'bootstrap' });
  assert.equal(rows('UserCard').length, 4);
  assert.ok(rows('UserCard').every((card) => card.source === 'starter' && card.starter_grant_user_id === 'a'));
  const artemis = rows('UserCard').find((card) => card.starter_grant_key === 'artemis_lunar_beam');
  artemis.user_id = 'b';
  await call('skillBookLoadout', { action: 'bootstrap' });
  assert.equal(rows('UserCard').length, 4);
  assert.equal(rows('UserCard').filter((card) => card.starter_grant_key === 'artemis_lunar_beam').length, 1);
});

test('a client cannot request female starter grants for a male avatar', async () => {
  rows('Avatar')[0].gender = 'male';
  const result = await call('skillBookLoadout', { action: 'bootstrap', data: { gender: 'female', user_id: 'b', card_id: 'anything' } });
  assert.equal(result.avatar_gender, 'male');
  assert.equal(rows('UserCard').length, 1);
  assert.equal(rows('UserCard')[0].animation_effect.id, 'getsuga_tensho');
});

test('starter bootstrap preserves a purchased canonical card instead of relabeling it', async () => {
  seedCard({ card_name: 'Artemis — Lunar Beam', source: 'purchase', acquisition_method: 'purchased', quantity: 7, card_image: 'https://test.local/purchased.png' });
  await call('skillBookLoadout', { action: 'bootstrap' });
  const card = rows('UserCard').find((row) => row.id === 'owned');
  assert.equal(card.source, 'purchase');
  assert.equal(card.quantity, 7);
  assert.equal(card.card_image, 'https://test.local/purchased.png');
  assert.equal(card.starter_grant_user_id, undefined);
});

test('wildcard selection requires an explicit boolean before any write', async () => {
  seedCard();
  await progress({ action: 'combine', userCardId: 'owned', payload: { useWildcard: 'false' } }, 400);
  assert.equal(writes.length, 0);
});
