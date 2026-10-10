import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CARS,makeRaceState,applyPerfectLaunch,shiftGear,activateGhost,stepRace} from '../src/components/game3/physics.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const asset=(p)=>path.join(root,'public',p);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/components/game3/mediaManifest.json'),'utf8'));
test('all five provided vehicles have real imported geometry',()=>{
 assert.equal(CARS.length,5);
 for(const car of CARS){
  const file=asset('game3/models/'+car.file);
  assert.ok(fs.statSync(file).size>1000000,car.name+' model missing');
  const magic=fs.readFileSync(file).subarray(0,25).toString('ascii');
  assert.ok(car.file.endsWith('.glb')?magic.startsWith('glTF'):magic.startsWith('Kaydara FBX Binary'),car.name+' is not valid model format');
 }
});
test('eleven songs, two videos and provider file references resolve',()=>{
 assert.equal(manifest.filter(i=>i.kind==='music').length,11);
 assert.equal(manifest.filter(i=>i.kind==='video').length,2);
 for(const file of manifest){
  assert.ok(fs.statSync(asset(file.url.slice(1))).size>1000000,file.title);
 }
});
test('environment and material texture assets are present',()=>{
 for(const [folder,count] of [['dam_textures',21],['alfa_textures',37],['porsche_textures',35]]){
  const dir=asset('game3/'+folder);
  assert.equal(fs.readdirSync(dir).filter(f=>f.endsWith('.png')).length,count,folder);
 }
 assert.ok(fs.statSync(asset('game3/sources/glendam.fbx')).size>40000000);
 assert.ok(fs.statSync(asset('game3/sources/alfa_romeo_33_stradale.zip')).size>10000000);
});
test('perfect launch, perfect shift, slipstream ghost and high-speed shake',()=>{
 const s=makeRaceState();
 assert.equal(applyPerfectLaunch(s,.7),'PERFECT START');
 s.rpm=.87;
 assert.equal(shiftGear(s),true);
 assert.ok(s.perfectShift>0);
 s.perfectShift=0;
 s.slipSeconds=0;s.slipLevel=0;s.opponentDistance=20;
 for(let i=0;i<270;i++){s.opponentDistance=20;stepRace(s,{forward:true},1/30,CARS[0]);}
 assert.equal(s.slipLevel,2);
 assert.equal(activateGhost(s),true);
 assert.ok(s.ghost>0);
});
