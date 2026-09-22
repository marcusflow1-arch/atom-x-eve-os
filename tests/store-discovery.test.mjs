import assert from 'node:assert/strict';
import {filterGames,priceOf,priceLabel,queryScore,suggestions,comingSoon,discoveryOrder,rotateGames,recommendations} from '../src/components/store/redesign/discovery.js';
const games=[
 {id:'a',title:'Skybound',genre:'rpg',price:20,tags:['co-op'],release_date:'2025-02-01',description:'Explore the open world'},
 {id:'b',title:'Skybound II',genre:'rpg',price:30,sale_price:10,single_player:true,release_date:'2025-03-01'},
 {id:'c',title:'City Lights',genre:'simulation',price:0,multiplayer:true,release_date:'2025-04-01'},
 {id:'d',title:'Untitled Adventure',genre:'adventure',release_date:'2099-01-01'},
 {id:'e',title:'Night Racer',genre:'racing',price:15,status:'planned'},
 {id:'f',title:'RPG Workshop',genre:'simulation',price:40}
];
assert.equal(priceOf(games[3]),null);
assert.notEqual(priceLabel(games[3]),'Free to play');
assert.equal(priceOf(games[1]),10);
assert.deepEqual(filterGames(games,{price:'free'}).map(g=>g.id),['c']);
assert.deepEqual(filterGames(games,{genres:['RPG'],price:'10'}).map(g=>g.id),['b']);
assert.deepEqual(filterGames(games,{genres:['rpg'],mode:'Co-op'}).map(g=>g.id),['a']);
assert.deepEqual(filterGames(games,{genres:['racing'],mode:'Co-op'}),[]);
assert.deepEqual(filterGames(games,{query:'no such game'}),[]);
assert.deepEqual(filterGames(games,{hideOwned:true},['a','b']).map(g=>g.id),['c','d','e','f']);
assert.equal(comingSoon(games[3]),true);
assert.equal(comingSoon(games[4]),true);
assert.deepEqual(filterGames(games,{availability:'soon'}).map(g=>g.id),['d','e']);
assert.ok(queryScore(games[0],'Skybound')>queryScore(games[1],'Skybound'));
assert.ok(queryScore(games[0],'open co-op')>0);
assert.equal(queryScore(games[0],'open racing'),0);
assert.equal(suggestions(games,'sky')[0].game.id,'a');
assert.ok(suggestions(games,'rpg').some(s=>s.kind==='genre'));
assert.deepEqual(suggestions(games,''),[]);
const deck=discoveryOrder(games,'test-day');
assert.deepEqual(deck,discoveryOrder(games,'test-day'));
assert.equal(new Set(deck.map(g=>g.id)).size,games.length);
assert.equal(new Set(deck.slice(0,4).map(g=>g.genre)).size,4);
const seen=new Set();
for(let i=0;i<games.length;i++)for(const g of rotateGames(deck,i,2))seen.add(g.id);
assert.equal(seen.size,games.length);
assert.deepEqual(rotateGames([],10),[]);
assert.deepEqual(rotateGames(deck,-1,1),deck.slice(-1));
const recs=recommendations(games,{genres:['rpg'],played_game_ids:['a']});
assert.equal(recs[0].game.id,'b');
assert.ok(!recs.some(r=>r.game.id==='a'));
assert.deepEqual(recommendations(games,{genres:[],use_play_history:false},['a']),[]);
assert.ok(recommendations(games,{},['c']).some(r=>r.game.id==='f'&&r.reason.includes('City Lights')));
console.log('PASS: store prices, combined filters, search/suggestions, release availability, fair rotation, and personalized recommendations.');
