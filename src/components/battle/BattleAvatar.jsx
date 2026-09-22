import { memo, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';

// Uses the same saved appearance and canonical model loader as the dashboard.
// Motion effects move the presentation frame; they never deform the skeleton.
export const BattleAvatar=memo(function BattleAvatar({player,active,event}){
  return <div className={'ab-avatar '+(active?'is-active ':'')+(player.hp<=0?'is-down':'')} data-battle-player={player.id}>
    <div key={event?.actor===player.id?event.id:'idle'} className={'ab-avatar-model '+(event?.actor===player.id?'ab-cast':'')}>
      <GenesisModelPreview config={player.appearance} compact controls="none" idleOnly/>
    </div>
    <div className="ab-avatar-caption"><span>{player.name}</span>{active&&<small>YOUR MOVE</small>}</div>
  </div>;
});
export function RiftEnemy({enemy,event}){
  const mount=useRef(null);const [unavailable,setUnavailable]=useState(false);
  useEffect(()=>{
    let renderer,frame,observer;const root=mount.current;
    const geometries=[],materials=[];
    try{
      const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,30);
      camera.position.set(0,1.25,5.5);camera.lookAt(0,0,0);
      renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));root.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0x6fb8d1,2));
      const light=new THREE.PointLight(0xffb66c,18);light.position.set(2,2,3);scene.add(light);
      const group=new THREE.Group();scene.add(group);
      const make=(g,m)=>{geometries.push(g);materials.push(m);const mesh=new THREE.Mesh(g,m);group.add(mesh);return mesh;};
      const core=make(new THREE.IcosahedronGeometry(.7,0),new THREE.MeshStandardMaterial({color:0x14303d,emissive:0x177b96,emissiveIntensity:.8,metalness:.65,roughness:.38,flatShading:true}));core.scale.y=1.5;
      const ring=make(new THREE.TorusGeometry(1.1,.015,6,64),new THREE.MeshBasicMaterial({color:0xcdebf1}));ring.rotation.x=.9;
      const shards=Array.from({length:6},(_,i)=>{const shard=make(new THREE.OctahedronGeometry(.15,0),new THREE.MeshStandardMaterial({color:0xd2b18d,metalness:.65,roughness:.5}));shard.position.set(Math.cos(i*Math.PI/3)*1.2,Math.sin(i*Math.PI/3)*1.2,0);return shard;});
      const resize=()=>{const w=Math.max(1,root.clientWidth),h=Math.max(1,root.clientHeight);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
      observer=new ResizeObserver(resize);observer.observe(root);resize();
      const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const tick=(time)=>{if(!reduce){core.rotation.y=time*.00022;group.position.y=Math.sin(time*.001)*.07;ring.rotation.z=time*.00015;shards.forEach((s,i)=>s.rotation.y=time*.0005+i);}renderer.render(scene,camera);frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);
    }catch{setUnavailable(true);}
    return()=>{cancelAnimationFrame(frame);observer?.disconnect();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer?.dispose();root.replaceChildren();};
  },[]);
  return <div className={'ab-enemy '+(enemy.hp<=0?'is-down':'')} aria-label={enemy.name+' 3D rift construct'}>
    <div ref={mount} className="ab-enemy-canvas"/>{unavailable&&<div className="ab-enemy-fallback">◇</div>}
    <div key={event?.id} className={event?.kind==='hit'?'ab-impact':''}/>
    <div className="ab-avatar-caption"><span>{enemy.name}</span><small>RIFT CONSTRUCT</small></div>
  </div>;
}
