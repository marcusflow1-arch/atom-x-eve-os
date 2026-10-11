import test from 'node:test';
import assert from 'node:assert/strict';
import {GAME3_CAMPAIGN,getFinaleBeat} from '../src/components/game3/campaignOutline.js';
import {STORY_SCENES} from '../src/components/game3/physics.js';

test('Game 3 finale has the original eight canon beats in the right order',()=>{
  assert.deepEqual(GAME3_CAMPAIGN.finale.map(x=>x.id),['F01','F02','F03','F04','F05','F06','F07','F08']);
  assert.equal(GAME3_CAMPAIGN.finale.at(-1).type,'cinematic');
  assert.match(getFinaleBeat('F07').story,/childhood/i);
  assert.match(getFinaleBeat('F06').story,/bullet/i);
});
test('final race is underpowered and skills-based, with no nitrous',()=>{
  const race=getFinaleBeat('F04');
  assert.equal(race.type,'race');
  assert.equal(race.carRules.nitrous,false);
  assert.equal(race.carRules.perfectShift,true);
  assert.equal(race.carRules.slipstream,true);
  assert.equal(race.carRules.dust,'TBD');
});
test('music prioritizes dialogue over cinematic tracks',()=>{
 assert.ok(GAME3_CAMPAIGN.musicMix.dialogue < GAME3_CAMPAIGN.musicMix.cinematic);
 assert.ok(GAME3_CAMPAIGN.musicMix.grave < GAME3_CAMPAIGN.musicMix.dialogue);
});
test('existing playable opening foreshadows the friendship without revealing finale',()=>{
 assert.ok(STORY_SCENES.length>=7);
 assert.ok(STORY_SCENES.some(s=>s.title.includes('KIDS')));
 assert.ok(STORY_SCENES.some(s=>s.title.includes('WARNING')));
 assert.ok(!STORY_SCENES.some(s=>/spirit|grave|funeral|sacrifice/i.test(s.text)));
 assert.equal(GAME3_CAMPAIGN.implementationStatus,'design_only');
});
