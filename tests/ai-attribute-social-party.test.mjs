import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPartySlots, filterSocialPlayers } from '../src/components/dashboard/socialDiscoverySelectors.mjs';

const players = [
  { id: 'action-1', name: 'Action Friend', friend: true, genres: ['Action', 'Shooter'] },
  { id: 'rpg-2', name: 'RPG Friend', friend: true, genres: ['RPG'] },
  { id: 'rpg-3', name: 'Other RPG Player', friend: false, genres: ['RPG'] },
  { id: 'blank-4', name: 'Genre Unknown', friend: false, genres: [] },
];

test('five party slots show only confirmed members, not general presence', () => {
  assert.deepEqual(buildPartySlots(), [null, null, null, null, null]);
  assert.deepEqual(buildPartySlots([{ user_id: 'owner' }, { user_id: 'accepted' }]).map(item => item?.user_id || null),
    ['owner', 'accepted', null, null, null]);
  assert.equal(buildPartySlots([...players, ...players]).length, 5);
});

test('people online can be filtered by shared genre and searched by name', () => {
  assert.deepEqual(filterSocialPlayers(players, { mode: 'online', genreFilter: 'rPg' }).map(p => p.id), ['rpg-2', 'rpg-3']);
  assert.deepEqual(filterSocialPlayers(players, { mode: 'online', genreFilter: 'Action', search: 'FRIEND' }).map(p => p.id), ['action-1']);
  assert.deepEqual(filterSocialPlayers(players, { mode: 'online', genreFilter: 'MMORPG' }), []);
});

test('friends online excludes all nonfriends without artificially limiting to five', () => {
  assert.deepEqual(filterSocialPlayers(players, { mode: 'friends' }).map(p => p.id), ['action-1', 'rpg-2']);
  const more = Array.from({ length: 12 }, (_, index) => ({ id: String(index), name: 'Friend', friend: true }));
  assert.equal(filterSocialPlayers(more, { mode: 'friends' }).length, 12);
});

test('party picker offers friends only and excludes accepted party members', () => {
  const picked = filterSocialPlayers(players, { mode: 'party', partyMemberIds: new Set(['action-1']) });
  assert.deepEqual(picked.map(p => p.id), ['rpg-2']);
});

test('no-genre metadata is never interpreted as matching a genre', () => {
  const result = filterSocialPlayers(players, { genreFilter: 'RPG' });
  assert.ok(!result.some(row => row.id === 'blank-4'));
});
