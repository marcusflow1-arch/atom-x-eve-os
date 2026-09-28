import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichLibraryCards, filterLibraryCards, filterLibraryGames, genreOptions, libraryScrollFrame } from '../src/components/dashboard/gamehub/libraryDiscovery.js';

const games = [
  { id:'z',title:'zebra',genre:'Action / RPG' },
  { id:'a',title:'Alpha',genre:'rpg' },
  { id:'b',title:'Beta 10',genre:'Shooter' },
  { id:'c',title:'Beta 2',genre:'Shooter' },
  { id:'xe',title:'Adam XE',genre:'Action' },
];
test('games sort alphabetically and naturally, with case-insensitive shared search and genre filters',()=>{
  assert.deepEqual(filterLibraryGames(games).map(x=>x.title),['Adam XE','Alpha','Beta 2','Beta 10','zebra']);
  assert.deepEqual(filterLibraryGames(games,{search:' A ',genre:'RPG'}).map(x=>x.title),['Alpha','zebra']);
  assert.equal(games[0].title,'zebra','filtering does not reorder the catalog cache');
});
test('card search spans games, uses the parent genre, and keeps owned/locked cards',()=>{
  const cards=enrichLibraryCards([
    {id:'1',title:'Zephyr',gameId:'z',isOwned:true},
    {id:'2',title:'Aether',gameId:'z',isOwned:false},
    {id:'3',title:'Arc wave',gameId:'a',isOwned:false},
    {id:'4',title:'Chidori',gameId:'xe',isOwned:true},
  ],games);
  assert.deepEqual(filterLibraryCards(cards,{genre:'RPG'}).map(x=>x.title),['Aether','Arc wave','Zephyr']);
  assert.deepEqual(filterLibraryCards(cards,{genre:'RPG',search:'arc'}).map(x=>x.id),['3']);
  assert.deepEqual(filterLibraryCards(cards,{gameId:'z'}).map(x=>x.id),['2','1']);
  assert.equal(filterLibraryCards(cards,{genre:'AdamXE'})[0].title,'Chidori');
  assert.equal(genreOptions(games).filter(x=>x.toLowerCase()==='rpg').length,1);
});
test('the unfolding leaf stops at the actual Environment Hub right edge and above the footer',()=>{
  const frame=libraryScrollFrame({right:330,top:390,bottom:900,width:330,height:510},{right:577},{width:1400,height:900});
  assert.equal(frame.left+frame.width,577);
  assert.equal(frame.top+frame.height,836);
  assert.equal(frame.inline,false);
});
test('a narrow viewport uses an inline leaf instead of extending beyond the screen',()=>{
  const frame=libraryScrollFrame({right:330,top:390,bottom:800,width:330,height:410},{right:577},{width:470,height:850});
  assert.equal(frame.inline,true);
  assert.ok(frame.left+frame.width<=470-16);
  assert.equal(libraryScrollFrame({width:0,height:0},null,{width:470,height:850}),null);
});
