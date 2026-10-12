import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAME_SHELF_COLUMNS, nextGameIndex, belongsToGame, gameArtifacts, gameMedia } from '../src/components/dashboard/gameProfileSelectors.mjs';
import { buildSelfConsoleProfile, loadSelfConsoleProfile } from '../src/components/dashboard/selfConsoleProfile.mjs';

const source = name => readFileSync(new URL(name, import.meta.url), 'utf8');

test('seven across: A and D move one game; W and S move one row', () => {
  assert.equal(GAME_SHELF_COLUMNS, 7);
  assert.equal(nextGameIndex('d', 0, 21), 1);
  assert.equal(nextGameIndex('a', 1, 21), 0);
  assert.equal(nextGameIndex('s', 0, 21), 7);
  assert.equal(nextGameIndex('w', 15, 21), 8);
  assert.equal(nextGameIndex('ArrowDown', 7, 21), 14);
  assert.equal(nextGameIndex('ArrowLeft', 7, 21), 6);
  assert.equal(nextGameIndex('Home', 12, 21), 0);
  assert.equal(nextGameIndex('End', 12, 21), 20);
  assert.equal(nextGameIndex('s', 18, 21), 20);
  assert.equal(nextGameIndex('w', 0, 21), 0);
  assert.equal(nextGameIndex('d', 0, 0), -1);
});

test('game-specific rewards do not leak unrelated cards into selected title', () => {
  const game = { id: 'game-1', title: 'Moon Legacy' };
  const other = { id: 'game-2', title: 'Forest Duel' };
  const profile = {
    achievements: [
      { id: 'a1', game_id: 'game-1', title: 'Moon Master' },
      { id: 'a2', game_id: 'game-2', title: 'Forest Master' },
      { id: 'a3', game: 'Moon Legacy', title: 'Moon Bonus' },
    ],
    cards: [
      { id: 'c1', game_id: 'game-1', name: 'Moon Arrow' },
      { id: 'c2', game_id: 'game-2', name: 'Forest Blade' },
      { id: 'c3', game_name: ' moon-LEGACY ', name: 'Moon Guard' },
    ],
  };
  assert.deepEqual(gameArtifacts(profile, game).cards.map(card => card.id), ['c1','c3']);
  assert.deepEqual(gameArtifacts(profile, game).achievements.map(item => item.id), ['a1','a3']);
  assert.equal(belongsToGame(profile.cards[1], game), false);
  assert.equal(belongsToGame(profile.cards[0], other), false);
  assert.deepEqual(gameArtifacts(null, game), { achievements: [], cards: [] });
});

test('mini game montage uses actual screenshots, safe URLs and a direct video when supplied', () => {
  const game = {
    banner_image: 'https://example.org/banner.jpg',
    screenshots: ['https://example.org/scene-1.jpg','javascript:alert(1)','https://example.org/banner.jpg'],
    cover_image: '/game/covers/moon.png',
    video_urls: ['https://youtube.com/watch?v=123', 'https://example.org/trailer.webm'],
  };
  assert.deepEqual(gameMedia(game), {
    stills: ['https://example.org/banner.jpg','https://example.org/scene-1.jpg','/game/covers/moon.png'],
    video: 'https://example.org/trailer.webm',
  });
});

test('Friends and sidebar share the responsive console profile with live 3D and original social actions', () => {
  const profile = source('../src/components/dashboard/LunaGamerProfile.jsx');
  const css = source('../src/components/dashboard/gamer-profile.css');
  const friends = source('../src/components/dashboard/FriendsListContent.jsx');
  const sidebar = source('../src/components/streaming/FriendProfileOverlay.jsx');
  const backend = source('../base44/functions/friendConsoleProfile/entry.ts');
  assert.match(profile, /data-profile-layout="profile-console"/);
  assert.match(profile, /gamer-console-identity/);
  assert.match(profile, /gamer-console-feature-grid/);
  assert.match(profile, /gamer-console-avatar-viewer/);
  assert.match(profile, /<GenesisModelPreview/);
  assert.match(profile, /profile\.avatar/);
  assert.match(profile, /--gamer-wallpaper/);
  assert.match(profile, /onMouseEnter=\{\(\) => showGame\(index\)\}/);
  assert.match(profile, /gameArtifacts\(profile, selectedGame\)/);
  assert.match(profile, /gamer-carousel-arrow/);
  assert.match(css, /grid-template-rows:45px minmax\(0,1fr\) minmax\(168px,29%\)/);
  assert.match(css, /gamer-console \.gamer-profile-stage/);
  assert.match(css, /\.gamer-game-tile\.unplayed \.gamer-tile-art/);
  assert.match(profile, /Regular Chat/);
  assert.match(profile, /Voice Chat/);
  assert.match(profile, /To Party/);
  assert.match(profile, /To Dashboard/);
  assert.match(friends, /<LunaGamerProfile/);
  assert.match(sidebar, /<LunaGamerProfile/);
  assert.match(backend, /svc\.StorePlayHistory\.filter/);
  assert.match(backend, /played: played\.has\(id\)/);
  assert.match(backend, /const catalog = \[\.\.\.gameMap\.values\(\)\]/);
  assert.match(backend, /screenshots:/);
});

test('AI Attribute header opens the signed-in player profile, not a friends directory', () => {
  const dashboard = source('../src/components/dashboard/DashboardAvatarOverview.jsx');
  const profile = source('../src/components/dashboard/LunaGamerProfile.jsx');
  const backend = source('../base44/functions/friendConsoleProfile/entry.ts');
  const aiHeading = dashboard.split('data-axe-panel-label')[1]?.split('{socialModeActive ?')[0] || '';
  assert.match(aiHeading, /aria-label="View your profile"/);
  assert.match(aiHeading, /<UserRound/);
  assert.match(aiHeading, /id: String\(user\.id\)/);
  assert.match(aiHeading, /setProfileTarget\(/);
  assert.doesNotMatch(aiHeading, /People Online|Friends Online/);
  assert.match(dashboard, /"Your Profile · You" : "Gamer Profile"/);
  assert.match(profile, /self \? ' · You'/);
  assert.match(profile, /<GenesisModelPreview/);
  assert.match(backend, /const self = targetId === String\(user\.id\)/);
});

test('owner profile uses signed-in identity, real collections, and never requires friend permission', async () => {
  const user = { id:'account-17', username:'CurrentPlayer', bio:'My account', avatar_url:'/my-avatar.png' };
  const avatar = {id:'avatar-17', name:'Artemis', gender:'female', level:19};
  const record = buildSelfConsoleProfile(user, avatar, {
    catalog:[{id:'g1',title:'My Played Game',cover_image:'/cover.png',screenshots:['/scene.png']},
      {id:'g2',title:'My Other Game'}],
    entitlements:[{game_id:'g1',item_type:'game'}],
    history:[{game_id:'g1'}],
    cards:[{id:'c1',card_name:'Artemis Bow',game_id:'g1',card_rarity:'Rare'}],
    achievements:[{id:'a1',achievement_id:'ach-1'}],
    definitions:[{id:'ach-1',title:'First Quest',game_id:'g1',points:5}],
  });
  assert.equal(record.name,'CurrentPlayer');
  assert.equal(record.avatar.name,'Artemis');
  assert.equal(record.online,true);
  assert.deepEqual(record.games.map(game => game.id),['g1','g2']);
  assert.equal(record.counts.games,1);
  assert.equal(record.counts.cards,1);
  assert.equal(record.achievements[0].title,'First Quest');
  const calls=[];
  const entity = value => ({list: async () => {calls.push('list');return value;},
    filter: async () => {calls.push('filter');return value;}});
  const client={entities:{
    Game: entity([{id:'g1',title:'My Played Game'}]),
    Entitlement: entity([{game_id:'g1',item_type:'game'}]),
    StorePlayHistory: entity([{game_id:'g1'}]),
    UserCard: entity([]), UserAchievement: entity([]),
    Achievement: entity([]), AvatarProgression: entity([]),
  }};
  const loaded=await loadSelfConsoleProfile(client,user,avatar);
  assert.equal(loaded.name,'CurrentPlayer');
  assert.equal(loaded.games[0].played,true);
  assert.equal(calls.length,7);
});

test('AI Attribute shortcut opens a fresh owner console with working controls', () => {
  const dashboard=source('../src/components/dashboard/DashboardAvatarOverview.jsx');
  const profile=source('../src/components/dashboard/LunaGamerProfile.jsx');
  const window=source('../src/components/dashboard/windows/DashboardWindow.jsx');
  assert.match(dashboard,/focusDashboardWindow\('self-gamer-profile'\)/);
  assert.match(dashboard,/id=\{String\(profileTarget\.id \|\| profileTarget\.friend_id\) === String\(user\?\.id\) \? "self-gamer-profile"/);
  assert.match(profile,/loadSelfConsoleProfile\(base44, user, ownAvatar\)/);
  assert.match(profile,/data-profile-owner=\{self \? 'you' : 'friend'\}/);
  assert.match(profile,/onClick=\{openEdit\}/);
  assert.match(profile,/View Game Details/);
  assert.match(profile,/onSelect=\{setSelectedReward\}/);
  assert.match(profile,/aria-label="Achievement details"/);
  assert.match(window,/stack\.top\(\) !== id/);
});
