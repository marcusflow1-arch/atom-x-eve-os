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

test('pending invite displays the friend in an open slot without falsely granting party membership', () => {
  const members=[{user_id:'owner',user_name:'Host'}];
  const outgoing=[
    {id:'p1',invitee_id:'nova',invitee_name:'Nova',invitee_avatar:'',status:'pending'},
    {id:'p2',invitee_id:'hostile',invitee_name:'Ignore',status:'declined'},
    {id:'p3',invitee_id:'owner',invitee_name:'Duplicate',status:'pending'},
  ];
  const slots=buildPartySlots(members,5,outgoing);
  assert.equal(slots.length,5);
  assert.equal(slots[0].user_id,'owner');
  assert.equal(slots[0].pending,undefined);
  assert.equal(slots[1].user_name,'Nova');
  assert.equal(slots[1].pending,true);
  assert.equal(slots[2],null);
  const accepted=[...members,{user_id:'nova',user_name:'Nova'}];
  const after=buildPartySlots(accepted,5,outgoing);
  assert.equal(after[1].pending,undefined,'after acceptance the same slot becomes a real party member');
  assert.equal(after.filter(member=>member?.user_id==='nova').length,1);
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
