import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
const dir=path.resolve('node_modules/.cache/creator-tests');fs.mkdirSync(dir,{recursive:true});
await build({entryPoints:['base44/shared/avatarCustomization.ts'],outfile:dir+'/schema.mjs',bundle:true,format:'esm',platform:'node'});
await build({entryPoints:['base44/shared/normalizeAvatarAppearance.ts'],outfile:dir+'/normalize.mjs',bundle:true,format:'esm',platform:'node'});
await build({entryPoints:['src/components/onboarding/customizationRuntime.js'],outfile:dir+'/runtime.mjs',bundle:true,format:'esm',platform:'node',packages:'external'});
const schema=await import('file://'+dir+'/schema.mjs');
const {normalizeAvatarAppearance}=await import('file://'+dir+'/normalize.mjs');
const {bindCustomizationLayer,inspectCustomization,applyCustomizationAppearance,applyPersistentShapes}=await import('file://'+dir+'/runtime.mjs');
const url='https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/test/hair.glb';
test('appearance saves are bounded, do not trust asset manifests, and round trip all new settings',()=>{
 const normalized=normalizeAvatarAppearance({gender:'male',id:'victim',level:999,skin_finish:20,skin_highlight_color:'#fefefe',skin_highlight_enabled:true,shape_controls:{chest_size:.42,glute_size:.8,age:NaN},selected_assets:{hair:'hair-one',admin:'bad',tattoo:'../bad'},customization_assets:[{file_url:'https://evil.test'}],layer_colors:{hair:'#c0ffee'},layer_opacity:{tattoo:.4}});
 assert.equal(normalized.shape_controls.chest_size,.42);assert.equal(normalized.shape_controls.glute_size,.8);assert.equal(normalized.shape_controls.age,0);assert.equal(normalized.skin_finish,1);
 assert.deepEqual(normalized.selected_assets,{hair:'hair-one'});assert.equal(normalized.layer_opacity.tattoo,.4);
 for(const key of ['id','level','customization_assets'])assert(!(key in normalized));
 assert.deepEqual(normalizeAvatarAppearance(normalized),normalized);
});
test('catalog rejects foreign files, incompatible surface categories, and missing body mesh targets',()=>{
 const valid=schema.normalizeCustomizationAsset({name:'Braids',slot:'hair',gender:'female',file_url:url,binding:'skinned',published:true});
 assert.equal(valid.rig_id,'artemis-v1');assert.equal(valid.published,true);
 assert.throws(()=>schema.normalizeCustomizationAsset({...valid,file_url:'https://example.org/hair.glb'}));
 assert.throws(()=>schema.normalizeCustomizationAsset({...valid,file_url:'/models/../../secret.glb'}));
 assert.throws(()=>schema.normalizeCustomizationAsset({...valid,binding:'surface'}));
 assert.throws(()=>schema.normalizeCustomizationAsset({...valid,slot:'tattoo',binding:'surface',file_url:url.replace('glb','png')}));
});
test('server resolves only published asset IDs for the selected body and slot',async()=>{
 const row={id:'hair-one',name:'Braids',slot:'hair',gender:'female',file_url:url,binding:'skinned',published:true,rig_id:'artemis-v1'};
 const service={AvatarCustomizationAsset:{filter:async query=>query.id===row.id&&query.published?[row]:[]}};
 const good=await schema.resolveCustomizationAssets(service,{gender:'female',selected_assets:{hair:row.id}});
 assert.equal(good.customization_assets[0].file_url,url);
 await assert.rejects(schema.resolveCustomizationAssets(service,{gender:'male',selected_assets:{hair:row.id}}));
 await assert.rejects(schema.resolveCustomizationAssets(service,{gender:'female',selected_assets:{outfit:row.id}}));
 await assert.rejects(schema.resolveCustomizationAssets(service,{gender:'female',selected_assets:{hair:'missing'}}));
});
function body(){
 const root=new THREE.Group(),bone=new THREE.Bone();bone.name='head';root.add(bone);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(Array(12).fill(0),4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));
 const mesh=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial({name:'M_Skin'}));mesh.name='Body';root.add(mesh);mesh.bind(new THREE.Skeleton([bone]));
 return {root,bone,mesh};
}
test('fitted skinned layer follows the actual animated bone and rejects a different bind pose',()=>{
 const base=body(),layer=body(),asset={binding:'skinned'};
 bindCustomizationLayer(base.root,layer.root,asset);
 assert.equal(layer.mesh.skeleton.bones[0],base.bone);
 base.bone.position.x=.3;base.root.updateMatrixWorld(true);layer.mesh.skeleton.update();
 assert(Math.abs(layer.mesh.getVertexPosition(0,new THREE.Vector3()).x-.3)<1e-6);
 const wrong=body();wrong.mesh.skeleton.boneInverses[0].elements[12]=.1;
 assert.throws(()=>bindCustomizationLayer(base.root,wrong.root,asset),/bind pose/);
 const missing=body();missing.bone.name='wrong';
 assert.throws(()=>bindCustomizationLayer(base.root,missing.root,asset),/bones/);
});
test('customization keys coexist with blinking and never expose expression keys as body controls',()=>{
 const {root,mesh}=body();mesh.morphTargetDictionary={Blink_Left:0,CC_ChestSize:1,CC_Age:2};mesh.morphTargetInfluences=[.7,0,0];
 const caps=inspectCustomization(root);assert.deepEqual(caps.shapes,['chest_size','age']);assert.equal(caps.skin,true);
 applyCustomizationAppearance(root,{shape_controls:{chest_size:.4,age:.8},skin_tint_enabled:true,skin_tone:'#aa7744',skin_finish_enabled:true,skin_finish:.9});
 assert.equal(mesh.morphTargetInfluences[0],.7);assert.equal(mesh.morphTargetInfluences[1],.4);assert.equal(mesh.material.color.getHexString(),'aa7744');
 mesh.morphTargetInfluences=[.8,0,0];applyPersistentShapes(mesh);
 assert.deepEqual(mesh.morphTargetInfluences,[.8,.4,.8]);assert(mesh.material.roughness<.4);
});
test('both current models expose real iris colors; clothing atlas is never treated as skin',async()=>{
 globalThis.self=globalThis;
 const loader=new GLTFLoader();loader.register(()=>({name:'NO_IMAGE_DECODE',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
 for(const file of ['Artemis_Character_v3.glb','Getsuga_Tensho_Character_v3.glb']){
  const bytes=fs.readFileSync('public/models/characters/'+file);const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const caps=inspectCustomization(gltf.scene);assert(caps.iris,file+' must expose the iris');
  let sclera,iris,atlas;
  gltf.scene.traverse(n=>{if(!n.isMesh)return;for(const m of Array.isArray(n.material)?n.material:[n.material]){if(/sclera/i.test(m.name))sclera=m;if(/iris/i.test(m.name))iris=m;if(m.name==='M_Artemis')atlas=m;}});
  const original=sclera?.color.getHexString(),bodyColor=atlas?.color.getHexString();
  applyCustomizationAppearance(gltf.scene,{eye_tint_enabled:true,eye_color:'#aa66cc',skin_tint_enabled:true,skin_tone:'#112233'});
  assert.equal(iris.color.getHexString(),'aa66cc');if(sclera)assert.equal(sclera.color.getHexString(),original);if(atlas)assert.equal(atlas.color.getHexString(),bodyColor);
 }
});
