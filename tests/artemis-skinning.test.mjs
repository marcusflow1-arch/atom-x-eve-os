import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {readGLB} from '../tools/hi3d-avatar/glb.mjs';
const original=readGLB('public/models/characters/Artemis_Character_v2.glb');
const repaired=readGLB('public/models/characters/Artemis_Character_v3.glb');
const hash=v=>crypto.createHash('sha256').update(Buffer.from(v.buffer,v.byteOffset,v.byteLength)).digest('hex');
test('female repair changes only skin influences; mesh, face, rig, textures, FX and every animation sample are preserved',()=>{
 assert.deepEqual(repaired.json,original.json);
 const attributes=repaired.json.meshes.find(m=>m.name==='Artemis_Body').primitives[0].attributes;
 const allowed=new Set([attributes.JOINTS_0,attributes.WEIGHTS_0]);
 for(let i=0;i<original.json.accessors.length;i++) {
  // Some facial targets use sparse-only accessors; they are covered by the
  // complete binary comparison excluding the two known influence views below.
  if(original.json.accessors[i].bufferView===undefined)continue;
  if(!allowed.has(i))assert.equal(hash(original.accessor(i)),hash(repaired.accessor(i)),'accessor '+i);
 }
 const a=original.bin.slice(),b=repaired.bin.slice();
 for(const index of allowed){const view=original.json.bufferViews[original.json.accessors[index].bufferView];a.fill(0,view.byteOffset,view.byteOffset+view.byteLength);b.fill(0,view.byteOffset,view.byteOffset+view.byteLength);}
 assert.equal(hash(a),hash(b));
 assert.equal(repaired.json.animations.length,9);
});
test('normalized skin weights, connected body seams and finite poses through all nine clips',async()=>{
 globalThis.self=globalThis;
 const loader=new GLTFLoader();loader.register(()=>({name:'NO_IMAGE_DECODE',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
 const bytes=fs.readFileSync('public/models/characters/Artemis_Character_v3.glb');
 const asset=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const group=asset.scene.getObjectByName('Artemis_Body'),mesh=group.children.find(n=>n.isSkinnedMesh);
 const g=mesh.geometry,p=g.attributes.position,w=g.attributes.skinWeight,j=g.attributes.skinIndex;
 const groups=new Map();
 for(let i=0;i<p.count;i++){
  const weight=[w.getX(i),w.getY(i),w.getZ(i),w.getW(i)];assert(Math.abs(weight.reduce((a,b)=>a+b,0)-1)<2e-6);
  for(let k=0;k<4;k++)assert(j.array[i*4+k]<mesh.skeleton.bones.length);
  if(p.getY(i)>=1.43)continue;
  const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);
 }
 const seams=[...groups.values()].filter(ids=>ids.length>1);
 assert(seams.length>100);
 const mixer=new THREE.AnimationMixer(asset.scene);let maxGap=0,frames=0;
 for(const clip of asset.animations){
  assert(clip.validate());const action=mixer.clipAction(clip).setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
  for(let k=0;k<=12;k++){
   mixer.setTime(Math.min(clip.duration-1e-5,clip.duration*k/12));asset.scene.updateMatrixWorld(true);mesh.skeleton.update();frames++;
   for(const ids of seams){
    const first=mesh.getVertexPosition(ids[0],new THREE.Vector3());
    assert(first.toArray().every(Number.isFinite));
    for(const i of ids.slice(1)){const next=mesh.getVertexPosition(i,new THREE.Vector3());maxGap=Math.max(maxGap,first.distanceTo(next));}
   }
  }
  mixer.stopAllAction();
 }
 assert(maxGap<.0001,'Duplicate surface seams must stay closed: '+maxGap);
 console.log(JSON.stringify({femaleClips:asset.animations.length,frames,seams:seams.length,maxSeamGapMetres:maxGap}));
});
