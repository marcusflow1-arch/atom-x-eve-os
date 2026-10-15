import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectGame1CombatTrack, game2CombatActive, Game2CombatTrack } from '../src/components/game2/engine/combatTrack.js';

test('Game 1 Combat 2 title wins over Combat, matching its original selector', () => {
  assert.equal(selectGame1CombatTrack([
    { title: 'combat', audio_url: 'https://assets.example/combat.mp3' },
    { title: '  Combat 2 ', audio_url: 'https://assets.example/combat2.mp3' },
  ]), 'https://assets.example/combat2.mp3');
  assert.equal(selectGame1CombatTrack([{ title: 'Combat', video_url: '/shared-combat.mp4' }]), '/shared-combat.mp4');
  assert.equal(selectGame1CombatTrack([{ title: 'Exploration', audio_url: 'https://a.example/a.mp3' }]), null);
  assert.equal(selectGame1CombatTrack(null), null);
});

function scene(overrides={}) {
 const player = { pos: [0,0,0], status:'normal', lastHurt:-100 };
 return { t:20, started:true, attract:false, duel:false, player, hud:{help:false},
  foesOf:()=>[{pos:[0,0,5],status:'normal'}], ...overrides };
}

test('Combat 2 only triggers for Game 2 live fighting: enemy proximity or recent hits', () => {
 assert.equal(game2CombatActive(scene()), true);
 assert.equal(game2CombatActive(scene({ foesOf:()=>[{pos:[0,0,26],status:'normal'}] })), false);
 assert.equal(game2CombatActive(scene({ foesOf:()=>[], player:{pos:[0,0,0],status:'normal',lastHurt:18} })), true);
 assert.equal(game2CombatActive(scene({ foesOf:()=>[], lastCombatMusicEventAt:19 })), true);
 assert.equal(game2CombatActive(scene({ foesOf:()=>[], lastCombatMusicEventAt:10 })), false);
 assert.equal(game2CombatActive(scene({ attract:true })), false);
 assert.equal(game2CombatActive(scene({ player:{pos:[0,0,0],status:'dead'} })), false);
 assert.equal(game2CombatActive(scene({ hud:{help:true} })), false);
 assert.equal(game2CombatActive(scene({ teamMatch:{ended:true} })), false);
 assert.equal(game2CombatActive(scene({ duel:true,round:{state:'intro'} })), false);
 assert.equal(game2CombatActive(scene({ duel:true,round:{state:'fight'} })), true);
 assert.equal(game2CombatActive(scene({ duel:true,round:{state:'won'} })), false);
});

test('Game 2 soundtrack starts in combat, fades out of combat and releases audio on exit', () => {
 const players=[];
 class AudioFake {
   constructor(src){this.src=src;this.currentTime=0;this.volume=0;this.loop=false;this.paused=true;this.played=0;this.stopped=0;players.push(this);}
   play(){this.played++;this.paused=false;return Promise.resolve();}
   pause(){this.paused=true;this.stopped++;}
   removeAttribute(k){if(k==='src')this.src='';}
   load(){}
 }
 let time=1000;
 const music = new Game2CombatTrack({AudioCtor:AudioFake,now:()=>time});
 music.setUrl('https://a.example/game1-combat.mp3');
 const a=players[0];
 assert.equal(a.played,0,'not on map load');
 for(let i=0;i<35;i++)music.update({fighting:false,volume:0.5,dt:0.05});
 assert.equal(a.played,0,'not during exploration');
 music.update({fighting:true,volume:0.5,dt:0.05});
 assert.equal(a.played,1);
 assert.equal(a.loop,true);
 assert.ok(a.volume>0 && a.volume<=0.5);
 a.currentTime=13;
 time+=1200;
 for(let i=0;i<140;i++) music.update({fighting:false,volume:0.5,dt:0.05});
 assert.equal(a.paused,true,'combat theme fades and pauses after combat');
 assert.equal(music.savedTime,13);
 time+=2000;
 music.update({fighting:true,volume:0.5,dt:0.05});
 assert.equal(a.currentTime,13,'resume music if fighting resumes within 5 minutes');
 time+=500;
 music.update({fighting:false,volume:0.5,dt:0.05});
 time+=5*60*1000+1;
 music.update({fighting:true,volume:0.5,dt:0.05});
 assert.equal(a.currentTime,0,'restart if idle for more than 5 minutes');
 music.dispose();
 assert.equal(a.paused,true);
 assert.equal(a.src,'');
 assert.equal(music.audio,null);
});

test('Mute, browser autoplay rejection, and missing URL never block fighting', async () => {
 let playbackCalls=0;
 class AudioFake {
   constructor(){this.volume=0;this.currentTime=0;this.paused=true;}
   play(){playbackCalls++;return Promise.reject(new Error('gesture required'));}
   pause(){this.paused=true;}
   removeAttribute(){}
   load(){}
 }
 const m=new Game2CombatTrack({AudioCtor:AudioFake});
 m.setUrl(null);
 assert.equal(m.update({fighting:true}),false);
 m.setUrl('/music.mp3');
 assert.equal(m.update({fighting:true,volume:0,dt:0.1}),false);
 assert.equal(m.audio.volume,0,'muted Game 2 settings must be respected');
 m.unlock();
 assert.ok(playbackCalls>=2);
 m.dispose();
 await new Promise(resolve=>setImmediate(resolve)); // rejection is handled
});

test('Game 2 session loads HeroBackground Combat 2 and engine owns cleanup', () => {
 const session=readFileSync(new URL('../src/components/game2/Game2Duel.jsx',import.meta.url),'utf8');
 const engine=readFileSync(new URL('../src/components/game2/engine/game.js',import.meta.url),'utf8');
 assert.match(session,/base44\.entities\.HeroBackground\.list\(\)/);
 assert.match(session,/\.then\(selectGame1CombatTrack\)/);
 assert.match(session,/game\.setCombatTrackUrl\(url\)/);
 assert.match(engine,/game2CombatActive\(this\)/);
 assert.match(engine,/this\.combatTrack\.update\(/);
 assert.match(engine,/this\.combatTrack\?\.dispose\(\)/);
 assert.doesNotMatch(engine,/this\.battleMusic\s*=\s*new Audio\(/);
});
