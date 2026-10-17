import test from 'node:test';
import assert from 'node:assert/strict';
import {newFleetMatch,dispatchFleetAction as act,commanderMaxHP,getSecurityState,currentObjective} from '../src/components/game2/fleetAssault/matchEngine.js';
test('fleet starts in orbit with a mission objective',()=>{const s=newFleetMatch();assert.equal(s.hull,100);assert.equal(s.theater,'orbit');assert.ok(currentObjective(s));});
test('early boarding costs tickets and guards gate Jedi and commander',()=>{
 let s=act(newFleetMatch(),{type:'GO_BOARD'});assert.equal(s.tickets.friendly,90);assert.equal(act(s,{type:'ATTACK_COMMANDER'}),s);
 for(let i=0;i<3;i++)s=act(s,{type:'CLEAR_GUARD'});
 for(let i=0;i<2;i++)s=act(s,{type:'DEFEAT_JEDI'});
 for(let i=0;i<8;i++)s=act(s,{type:'ATTACK_COMMANDER'});
 assert.equal(s.status,'victory');
});
test('planetary relay links to stronger orbital damage',()=>{
 let s=act(newFleetMatch(),{type:'GO_PLANET'});for(let i=0;i<4;i++)s=act(s,{type:'CAPTURE_RELAY'});
 assert.equal(s.relayOwner,'friendly');s=act(s,{type:'GO_ORBIT'});
 for(let i=0;i<3;i++)s=act(s,{type:'TORPEDO'});
 assert.equal(s.shields,0);assert.equal(s.hull,91);assert.ok(commanderMaxHP(s.hull)<240);
});
test('reactor sabotage wins and restart resets match',()=>{
 let s=act(newFleetMatch(),{type:'GO_BOARD'});for(let i=0;i<3;i++)s=act(s,{type:'CLEAR_GUARD'});
 for(let i=0;i<3;i++)s=act(s,{type:'SABOTAGE'});
 assert.equal(s.reactor,0);assert.equal(s.status,'victory');assert.equal(act(s,{type:'RESTART'}).status,'active');
});
test('damaged hull reduces security and commander HP cap',()=>{assert.equal(getSecurityState(100).vents,'LOCKED');assert.equal(getSecurityState(25).vents,'OPEN');assert.ok(commanderMaxHP(25)<commanderMaxHP(95));});

test('specialist roles give meaningful local combat and relay advantages',()=>{
 let a=act(newFleetMatch('breacher'),{type:'GO_BOARD'});a=act(a,{type:'CLEAR_GUARD'});assert.equal(a.guards,1);
 let b=act(newFleetMatch('ground'),{type:'GO_PLANET'});b=act(b,{type:'CAPTURE_RELAY'});assert.equal(b.relay,50);
 let c=act(newFleetMatch('saboteur'),{type:'GO_BOARD'});for(let i=0;i<3;i++)c=act(c,{type:'CLEAR_GUARD'});
 c=act(c,{type:'SABOTAGE'});assert.equal(c.reactor,50);
});
