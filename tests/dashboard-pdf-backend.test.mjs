import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { makeRewardFixture } from './helpers/reward-fixture.mjs';

const f = makeRewardFixture(), handlers = {};
const users = { a: { id: 'a', role: 'user', full_name: 'Owner', avatar_gamer_points: 1000 }, b: { id: 'b', role: 'user', full_name: 'Buyer', avatar_gamer_points: 1000 } };
for (const name of ['cardProgression', 'tradePostMarket', 'clanSystem']) {
  const code = buildSync({ entryPoints: ['base44/functions/' + name + '/entry.ts'], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['npm:*'] }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, Response, Date, crypto: webcrypto, console,
    Deno: { serve: handler => { handlers[name] = handler; } },
    require: () => ({ createClientFromRequest: req => {
      const user = users[req.headers.get('test-user')];
      return { auth: { me: async () => user }, entities: f.entities(user), asServiceRole: { entities: f.entities() } };
    } }),
  });
}
async function call(name, body, status = 200, user = 'a') {
  const response = await handlers[name](new Request('https://test.local', { method: 'POST', headers: { 'test-user': user }, body: JSON.stringify(body) }));
  const data = await response.json(); assert.equal(response.status, status, JSON.stringify(data)); return data;
}
const progress = (action, payload = {}, status = 200) => call('cardProgression', { action, userCardId: 'card', payload }, status);
beforeEach(() => {
  f.reset();
  f.rows('User').push(...Object.values(users).map(user => ({ ...user })));
  f.rows('Avatar').push({ id: 'avatar', user_id: 'a', gender: 'male', level: 1 });
  f.rows('UserCard').push({ id: 'card', user_id: 'a', card_name: 'Moonstep', card_rarity: 'Rare', card_type: 'ability', game_name: 'Atom XE', quantity: 1, trade_status: 'available' });
});
test('a card level grants one spendable stat point and allocation survives reload', async () => {
  await progress('getState');
  const p = f.rows('CardProgression')[0]; p.xp = p.xp_to_next;
  const leveled = await progress('levelUp'); assert.equal(leveled.progression.stat_points, 1);
  const before = leveled.progression.effective_stats.attack;
  const allocated = await progress('allocateStat', { stat: 'attack' });
  assert.equal(allocated.progression.stat_points, 0);
  assert.ok(allocated.progression.effective_stats.attack > before);
  const reloaded = await progress('getState'); assert.equal(reloaded.progression.enhanced_stats.attack, 1);
  await progress('allocateStat', { stat: 'attack' }, 400);
  await progress('allocateStat', { stat: 'not-real' }, 400);
});
test('rune socketing spends materials, changes effective stats and validates slots and recipe kind', async () => {
  await progress('getState');
  f.rows('Enchantment').push({ id: 'rune', name: 'Ward rune', socket_type: 'rune', slot_cost: 1, element: 'holy', modifiers: { defense: 3 }, allowed_item_types: ['ability'], material_cost: { resonance_fragment: 1 } });
  f.rows('UserMaterial').push({ id: 'stack', user_id: 'a', material_id: 'fragment', material_type: 'resonance_fragment', quantity: 3 });
  await progress('enchant', { enchantmentId: 'rune', socketType: 'core' }, 400);
  assert.equal(f.rows('UserMaterial')[0].quantity, 3);
  const next = await progress('enchant', { enchantmentId: 'rune', socketType: 'rune' });
  assert.equal(next.progression.enchantments[0].socket_type, 'rune');
  assert.equal(next.progression.effective_stats.defense, next.progression.base_stats.defense + 3);
  assert.equal(f.rows('UserMaterial')[0].quantity, 2);
  await progress('enchant', { enchantmentId: 'rune', socketType: 'rune' }, 400);
  assert.equal(f.rows('UserMaterial')[0].quantity, 2);
});
test('Black Market listing reserves the owned card, masks the seller and separates the two markets', async () => {
  const listed = await call('tradePostMarket', { action: 'listCard', payload: { userCardId: 'card', price: 75, market: 'black_market' } });
  assert.equal(listed.listings.length, 1);
  assert.equal(f.rows('UserCard')[0].trade_status, 'locked_in_trade');
  const browse = await call('tradePostMarket', { action: 'getState', payload: { market: 'black_market' } }, 200, 'b');
  assert.equal(browse.listings[0].seller.name, 'Anonymous seller');
  assert.notEqual(browse.listings[0].seller_id, 'a');
  assert.deepEqual(await f.entities(users.b).CardTrade.list(), [], 'private listing owner fields are not readable via the raw entity');
  assert.equal((await call('tradePostMarket', { action: 'getState' }, 200, 'b')).listings.length, 0);
  await call('tradePostMarket', { action: 'listCard', payload: { userCardId: 'card', price: 75, market: 'black_market' } }, 400);
  await call('tradePostMarket', { action: 'buyListing', payload: { listingId: listed.listings[0].id, market: 'black_market' } }, 200, 'b');
  assert.equal(f.rows('UserCard')[0].user_id, 'b');
  assert.equal(f.rows('User')[1].avatar_gamer_points, 925);
  assert.equal(f.rows('CardTrade')[0].status, 'sold');
});
test('invalid listing price and foreign-card listing do not publish', async () => {
  await call('tradePostMarket', { action: 'listCard', payload: { userCardId: 'card', price: 2.5 } }, 400);
  await call('tradePostMarket', { action: 'listCard', payload: { userCardId: 'card', price: 20 } }, 400, 'b');
  assert.equal(f.rows('CardTrade').length, 0);
});
test('clan creation persists normalized SVG design, focus tags and leader membership', async () => {
  const data = await call('clanSystem', { action: 'create_clan', data: { name: 'Nightwatch', tag: 'NITE', playstyles: ['PvP', 'Trading'], recruitmentStatus: 'Public', emblemDesign: { shape: 'diamond', symbol: 'swords', pattern: 'stripes', primary: '#112233', accent: '#abcdef' } } });
  assert.equal(data.success, true);
  const clan = f.rows('Division')[0];
  assert.equal(clan.emblemDesign.symbol, 'swords'); assert.equal(clan.emblemDesign.shape, 'diamond');
  assert.match(decodeURIComponent(clan.icon), /<svg/); assert.match(decodeURIComponent(clan.icon), /#abcdef/);
  assert.deepEqual(clan.playstyles, ['PvP', 'Trading']);
  assert.equal(f.rows('ClanMember')[0].clan_id, data.clanId);
  assert.equal(f.rows('ClanMember')[0].user_id, 'a');
});
test('crest input is allowlisted and invite-only clans cannot receive public applications', async () => {
  await call('clanSystem', { action: 'create_clan', data: { name: 'Nightwatch', tag: 'NITE', recruitmentStatus: 'Invite Only', emblemDesign: { shape: '<script/>', symbol: 'unknown', accent: 'red" onload="bad' } } });
  const clan = f.rows('Division')[0];
  assert.equal(clan.emblemDesign.shape, 'shield'); assert.equal(clan.emblemDesign.accent, '#8ce3f4');
  assert.ok(!decodeURIComponent(clan.icon).includes('onload'));
  await call('clanSystem', { action: 'request_join', data: { divisionId: clan.id } }, 403, 'b');
  assert.equal(f.rows('ClanApplication').length, 0);
});
