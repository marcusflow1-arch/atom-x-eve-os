import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game5 = readFileSync(new URL('../src/game5/client/Game5QuestPreview.jsx', import.meta.url), 'utf8');
const game3 = readFileSync(new URL('../src/pages/Game3.jsx', import.meta.url), 'utf8');
const game2 = readFileSync(new URL('../src/pages/Game2.jsx', import.meta.url), 'utf8');

test('Game 5 player uses Luna Revo body, NPC retains separate model', () => {
 assert.match(game5, /useRevoAvatar\('game5'\)/);
 assert.match(game5, /loadAvatarModel\(revo\.appearance/);
 assert.match(game5, /const player = new THREE\.Group\(\)/);
 assert.doesNotMatch(game5, /const player = createCharacter\(/);
 assert.match(game5, /const elder = createCharacter\(/);
});
test('Game 3 racing HUD identifies the saved Revo driver', () => {
 assert.match(game3, /useRevoAvatar\('game3'\)/);
 assert.match(game3, /driverName=\{revo\?\.name\}/);
});
test('Game 2 remains untouched and keeps its original gameplay import', () => {
 assert.match(game2, /Game2Duel/);
 assert.doesNotMatch(game2, /useRevoAvatar/);
});
