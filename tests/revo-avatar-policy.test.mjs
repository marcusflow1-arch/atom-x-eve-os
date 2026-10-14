import test from 'node:test';
import assert from 'node:assert/strict';
import { sharedRevoIdentity, revoEnabledForGame } from '../src/lib/revoAvatarPolicy.mjs';

test('all supported games reuse the exact same saved Revo identity', () => {
 const avatar = { id: 'saved-avatar-123', name: 'Artemis', gender: 'female' };
 for (const game of ['game1','game3','game5','aibattle','pve','world','future-game']) {
   assert.equal(sharedRevoIdentity(avatar, game).avatarId, avatar.id);
   assert.equal(sharedRevoIdentity(avatar, game).name, 'Artemis');
 }
});
test('Game 2 remains exempt from shared-avatar replacement', () => {
 for(const key of ['game2','Game 2','jedioutcast','jedi-outcast']) {
   assert.equal(revoEnabledForGame(key), false);
   assert.equal(sharedRevoIdentity({id:'existing'}, key), null);
 }
});
test('missing avatar cannot silently turn into a new random character', () => {
 assert.equal(sharedRevoIdentity(null, 'game5'), null);
 assert.equal(sharedRevoIdentity({name:'Unnamed'}, 'game1'), null);
 assert.equal(sharedRevoIdentity({id:'   '}, 'game3'), null);
});
