import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {companionModel,applyCompanionAppearance} from './genesisAssets';
export async function loadAvatarModel(config={},height=1.8){
 const url=typeof config==='string'?config:companionModel(config);
 const asset=/\.fbx(?:\?|$)/i.test(url)?await new FBXLoader().loadAsync(url):await new GLTFLoader().loadAsync(url);
 const model=asset.scene||asset;model.animations=asset.animations||[];let box=new THREE.Box3().setFromObject(model);
 model.scale.multiplyScalar(height/(box.max.y-box.min.y||1));box=new THREE.Box3().setFromObject(model);const center=box.getCenter(new THREE.Vector3());model.position.set(-center.x,-box.min.y,-center.z);
 model.traverse(n=>{if(n.isSkinnedMesh)n.frustumCulled=false;});applyCompanionAppearance(model,typeof config==='string'?{}:config);return model;
}
export function disposeAvatarModel(model){const textures=new Set(),materials=new Set(),geometries=new Set();model?.traverse(n=>{if(n.geometry)geometries.add(n.geometry);if(n.material)(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>materials.add(m));n.skeleton?.dispose();});for(const m of materials){Object.values(m).forEach(t=>{if(t?.isTexture)textures.add(t);});m.dispose();}textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());}
export {applyCompanionAppearance as applyPlayerAppearance};