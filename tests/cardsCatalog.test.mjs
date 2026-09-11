import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCardCatalog, gameMatchesGenre, readCardPages } from '../src/components/genremastery/cardsCatalog.js';

const games = [{ id: 'game', title: 'Example MMO', genre: 'MMORPG', cover_image: 'game.jpg' }];
const achievements = [{ id: 'achievement', game: 'Example MMO', title: 'Dragon defeated', rarity: 'Epic', reward: { name: 'Dragonblade', type: 'Weapon' } }];
const masters = [{ id: 'master', achievement_id: 'achievement', name: 'Dragonblade', image_url: 'card.jpg', rarity: 'Legendary' }];

test('linked achievement and master become one collectible with original art', () => {
  const cards = buildCardCatalog({ games, achievements, masters });
  assert.equal(cards.length, 1);
  assert.equal(cards[0].image, 'card.jpg');
  assert.equal(cards[0].gameId, 'game');
  assert.equal(cards[0].group, 'equipment');
  assert.equal(cards[0].isOwned, false);
});

test('ownership is per game and includes retired inventory records', () => {
  const owned = [
    { id: 'copy', trading_card_id: 'master', card_name: 'Dragonblade', game_name: 'Example MMO', acquisition_method: 'purchased' },
    { id: 'retired', card_name: 'Legacy card', game_name: 'Example MMO', card_type: 'Ability' },
    { id: 'other-game', card_name: 'Dragonblade', game_name: 'Another game' },
  ];
  const cards = buildCardCatalog({ games, achievements, masters, owned });
  const dragon = cards.find((card) => card.id === 'card:master');
  assert.equal(dragon.isOwned, true);
  assert.equal(dragon.isPurchased, true);
  assert.deepEqual(dragon.ownedCopies.map((copy) => copy.id), ['copy']);
  assert.equal(cards.find((card) => card.id === 'owned:retired').group, 'skill');
  assert.equal(cards.length, 3);
});

test('empty collections stay empty, and unlocks do not fabricate inventory copies', () => {
  assert.deepEqual(buildCardCatalog({ games }), []);
  const [card] = buildCardCatalog({ games, achievements, unlocked: ['achievement'] });
  assert.equal(card.isUnlocked, true);
  assert.equal(card.isOwned, true);
  assert.deepEqual(card.ownedCopies, []);
});

test('genre matches respect word boundaries and punctuation', () => {
  assert.equal(gameMatchesGenre({ genre: 'MMORPG' }, { matchGenres: ['rpg'] }), false);
  assert.equal(gameMatchesGenre({ genre: 'role-playing (rpg)' }, { matchGenres: ['rpg'] }), true);
  assert.equal(gameMatchesGenre({ genre: 'Sci-Fi' }, { matchGenres: ['sci_fi'] }), true);
});

test('catalog paging reaches later pages and stops if an API repeats a page', async () => {
  const rows = Array.from({ length: 425 }, (_, index) => ({ id: String(index) }));
  const skips = [];
  const result = await readCardPages(async (limit, skip) => { skips.push(skip); return { data: rows.slice(skip, skip + limit) }; });
  assert.equal(result.length, 425);
  assert.deepEqual(skips, [0, 200, 400]);
  let count = 0;
  const repeated = await readCardPages(async () => { count++; return rows.slice(0, 200); });
  assert.equal(repeated.length, 200);
  assert.equal(count, 2);
  await assert.rejects(() => readCardPages(async () => { throw new Error('Unavailable'); }), /Unavailable/);
});
