import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KEJIM_POST_MISSION, KEJIM_POST_TEST_SPAWNS, STAR_WARS_ANIMATION_ALIASES } from './kejimPostMission';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const length2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const pickClip=(clips,state)=>{
  const aliases=STAR_WARS_ANIMATION_ALIASES[state]||[state];
  return clips.find(c=>aliases.some(a=>c.name.toLowerCase().includes(a)))||null;
};

function makeHumanoid(color=0xffffff){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,1.45,12),new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.08}));
  body.position.y=1.05; body.castShadow=true; body.receiveShadow=true; g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.28,16,12),new THREE.MeshStandardMaterial({color:0xd8c2a6,roughness:.85}));
  head.position.y=1.95; head.castShadow=true; g.add(head);
  const gun=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.65),new THREE.MeshStandardMaterial({color:0x20252b,metalness:.75,roughness:.28}));
  gun.position.set(.42,1.25,-.36); g.add(gun);
  return g;
}

function makeFallbackOutpost(scene){
  const root=new THREE.Group(); root.name='KejimPostFallbackHarness';
  const floorMat=new THREE.MeshStandardMaterial({color:0x39414b,roughness:.82,metalness:.18});
  const wallMat=new THREE.MeshStandardMaterial({color:0x232a31,roughness:.72,metalness:.32});
  const accentMat=new THREE.MeshStandardMaterial({color:0x6d7682,roughness:.62,metalness:.4});
  const floor=new THREE.Mesh(new THREE.BoxGeometry(40,.5,90),floorMat); floor.position.set(0,-.3,-32); floor.receiveShadow=true; root.add(floor);
  const walls=[
    [-20,3,-32,.7,7,90],[20,3,-32,.7,7,90],
    [0,3,-77,40,7,.7],[0,3,13,40,7,.7],
    [-10,2.5,-25,8,5,.5],[10,2.5,-45,8,5,.5],
    [0,2.5,-58,14,5,.6],
  ];
  walls.forEach(([x,y,z,w,h,d],i)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),i>3?accentMat:wallMat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);});
  for(let i=0;i<8;i++){
    const light=new THREE.PointLight(i%2?0x8cc8ff:0xffc977,4,12,2);
    light.position.set(i%2?14:-14,4,-4-i*10); root.add(light);
    const fixture=new THREE.Mesh(new THREE.BoxGeometry(.25,.25,.8),new THREE.MeshStandardMaterial({color:0x111318,emissive:i%2?0x4f9fd8:0xc98432,emissiveIntensity:3}));
    fixture.position.copy(light.position); fixture.position.y=3.7; root.add(fixture);
  }
  scene.add(root); return root;
}

function addTracer(scene,a,b,color=0xff4d32){
  const geo=new THREE.BufferGeometry().setFromPoints([a,b]);
  const mat=new THREE.LineBasicMaterial({color,transparent:true,opacity:.95});
  const line=new THREE.Line(geo,mat); scene.add(line);
  const born=performance.now();
  return {update:()=>{const t=(performance.now()-born)/170;line.material.opacity=1-t;if(t>=1){scene.remove(line);geo.dispose();mat.dispose();return false;}return true;}};
}

async function upgradeActor(loader, actor, url, scene){
  if(!url)return;
  try{
    const gltf=await loader.loadAsync(url);
    const visual=gltf.scene;
    visual.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    const box=new THREE.Box3().setFromObject(visual), size=new THREE.Vector3(); box.getSize(size);
    if(size.y>0){const s=2.15/size.y;visual.scale.setScalar(s);}
    actor.group.remove(actor.fallback); scene.remove(actor.fallback);
    actor.group.add(visual); actor.visual=visual;
    actor.mixer=gltf.animations?.length?new THREE.AnimationMixer(visual):null;
    actor.clips=gltf.animations||[];
  }catch{
    // Private/converted retail pack is optional in source control. Primitive fallback remains playable.
  }
}

function setActorAnimation(actor,state){
  if(!actor.mixer||actor.animState===state)return;
  const clip=pickClip(actor.clips,state); if(!clip)return;
  const action=actor.mixer.clipAction(clip);
  actor.action?.fadeOut(.12); action.reset().fadeIn(.12).play();
  actor.action=action; actor.animState=state;
}

export default function StarWarsMissionRuntime({onMissionComplete}){
  const hostRef=useRef(null);
  const [hud,setHud]=useState({hp:100,enemies:KEJIM_POST_TEST_SPAWNS.length,objective:0,assetMode:'checking',status:'Click the game to capture mouse'});
  const [missionDone,setMissionDone]=useState(false);

  useEffect(()=>{
    const host=hostRef.current;if(!host)return;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x05080d);scene.fog=new THREE.Fog(0x05080d,35,105);
    const camera=new THREE.PerspectiveCamera(68,1,.05,260);
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x8fa9c8,0x14181d,1.45));
    const key=new THREE.DirectionalLight(0xc7d9ef,2.2);key.position.set(-16,30,10);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key);
    const fallback=makeFallbackOutpost(scene); fallback.visible=true;

    const loader=new GLTFLoader();
    loader.load(KEJIM_POST_MISSION.sceneUrl,gltf=>{
      gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
      scene.add(gltf.scene);fallback.visible=false;setHud(h=>({...h,assetMode:'retail-converted'}));
    },undefined,()=>setHud(h=>({...h,assetMode:'procedural-fallback'})));

    const actors=[];
    const player={id:'kyle',team:'ally',group:new THREE.Group(),fallback:makeHumanoid(0x46505b),hp:100,maxHp:100,speed:6.4,fireCd:0,clips:[]};
    player.group.add(player.fallback);player.group.position.set(0,0,5);scene.add(player.group);actors.push(player);
    const jan={id:'jan',team:'ally',group:new THREE.Group(),fallback:makeHumanoid(0x7c563d),hp:100,maxHp:100,speed:5.4,fireCd:0,clips:[]};
    jan.group.add(jan.fallback);jan.group.position.set(-2,0,7);scene.add(jan.group);actors.push(jan);

    const enemies=KEJIM_POST_TEST_SPAWNS.map((s,i)=>{
      const a={id:s.id,type:s.type,team:'enemy',group:new THREE.Group(),fallback:makeHumanoid(s.type==='officer'?0x5d646d:0xe2e5e8),hp:s.type==='officer'?70:55,maxHp:s.type==='officer'?70:55,speed:3.2+(i*.15),fireCd:Math.random()*.8,patrol:s.patrol.map(p=>new THREE.Vector3(...p)),patrolIndex:0,state:'patrol',clips:[]};
      a.group.add(a.fallback);a.group.position.set(...s.position);scene.add(a.group);actors.push(a);return a;
    });

    upgradeActor(loader,player,KEJIM_POST_MISSION.actorAssets.kyle,scene);
    upgradeActor(loader,jan,KEJIM_POST_MISSION.actorAssets.jan,scene);
    enemies.forEach(e=>upgradeActor(loader,e,KEJIM_POST_MISSION.actorAssets[e.type],scene));

    const keys=new Set(), tracers=[];let yaw=Math.PI, pitch=-.14, locked=false, lastHud=0, started=false, objective=0, reportedComplete=false;
    const forward=new THREE.Vector3(),right=new THREE.Vector3(),wish=new THREE.Vector3(),tmp=new THREE.Vector3();
    const aliveEnemies=()=>enemies.filter(e=>e.hp>0);

    const resize=()=>{const w=host.clientWidth||window.innerWidth,h=host.clientHeight||window.innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};resize();
    const onKey=e=>{if(e.type==='keydown')keys.add(e.code);else keys.delete(e.code);};
    const onMove=e=>{if(!locked)return;yaw-=e.movementX*.0022;pitch=clamp(pitch-e.movementY*.0017,-.72,.46);};
    const shoot=(shooter,targetPoint)=>{
      const now=performance.now();if(now<(shooter.nextShot||0))return false;shooter.nextShot=now+(shooter===player?220:850);
      const origin=shooter.group.position.clone().add(new THREE.Vector3(0,1.35,0));
      const end=targetPoint.clone();end.y=1.25;tracers.push(addTracer(scene,origin,end,shooter.team==='ally'?0x5fb7ff:0xff5a43));
      return true;
    };
    const playerShoot=()=>{
      if(!locked||player.hp<=0)return;
      const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),camera);
      let best=null,bestDist=Infinity;
      aliveEnemies().forEach(e=>{
        const p=e.group.position.clone().add(new THREE.Vector3(0,1.1,0));
        const t=p.clone().sub(ray.ray.origin).dot(ray.ray.direction);
        if(t<0)return;const nearest=ray.ray.origin.clone().addScaledVector(ray.ray.direction,t);const miss=nearest.distanceTo(p);
        if(miss<.9&&t<bestDist){best=e;bestDist=t;}
      });
      const end=ray.ray.origin.clone().addScaledVector(ray.ray.direction,best?bestDist:80);
      if(shoot(player,end)&&best){best.hp-=25;setActorAnimation(best,best.hp>0?'pain':'death');if(best.hp<=0){best.group.visible=false;}}
    };
    const onPointer=()=>{locked=document.pointerLockElement===renderer.domElement;setHud(h=>({...h,status:locked?'WASD move · Shift sprint · Left click fire · Esc release mouse':'Click the game to capture mouse'}));};
    const onCanvasClick=()=>{if(!locked){renderer.domElement.requestPointerLock?.();return;}playerShoot();};

    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKey);window.addEventListener('mousemove',onMove);document.addEventListener('pointerlockchange',onPointer);window.addEventListener('resize',resize);renderer.domElement.addEventListener('mousedown',onCanvasClick);

    const clock=new THREE.Clock();let raf=0;
    const loop=()=>{
      raf=requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.04), now=performance.now();
      if(player.hp>0){
        forward.set(-Math.sin(yaw),0,-Math.cos(yaw));right.set(forward.z,0,-forward.x);wish.set(0,0,0);
        if(keys.has('KeyW'))wish.add(forward);if(keys.has('KeyS'))wish.sub(forward);if(keys.has('KeyD'))wish.add(right);if(keys.has('KeyA'))wish.sub(right);
        if(wish.lengthSq()>0){wish.normalize();const speed=player.speed*(keys.has('ShiftLeft')?1.5:1);player.group.position.addScaledVector(wish,speed*dt);setActorAnimation(player,keys.has('ShiftLeft')?'run':'walk');started=true;}else setActorAnimation(player,'idle');
        player.group.position.x=clamp(player.group.position.x,-18.5,18.5);player.group.position.z=clamp(player.group.position.z,-74,11);
        player.group.rotation.y=yaw;
      }

      const desiredJan=player.group.position.clone().add(new THREE.Vector3(-1.7,0,2.2).applyAxisAngle(new THREE.Vector3(0,1,0),yaw));
      const jd=desiredJan.sub(jan.group.position);if(jd.length()>2.2){jd.normalize();jan.group.position.addScaledVector(jd,jan.speed*dt);setActorAnimation(jan,'run');}else setActorAnimation(jan,'idle');

      const live=aliveEnemies();
      live.forEach(e=>{
        const d=length2(e.group.position,player.group.position);
        if(d<24||e.state==='combat')e.state='combat';
        if(e.state==='patrol'){
          const goal=e.patrol[e.patrolIndex];tmp.copy(goal).sub(e.group.position);tmp.y=0;
          if(tmp.length()<.55)e.patrolIndex=(e.patrolIndex+1)%e.patrol.length;else{tmp.normalize();e.group.position.addScaledVector(tmp,e.speed*.45*dt);e.group.rotation.y=Math.atan2(tmp.x,tmp.z);setActorAnimation(e,'walk');}
        }else{
          tmp.copy(player.group.position).sub(e.group.position);tmp.y=0;
          if(d>8){tmp.normalize();e.group.position.addScaledVector(tmp,e.speed*dt);setActorAnimation(e,'run');}
          else{setActorAnimation(e,'fire');if(shoot(e,player.group.position)&&Math.random()<.72){player.hp=Math.max(0,player.hp-8);setActorAnimation(player,player.hp>0?'pain':'death');}}
          if(tmp.lengthSq()>0)e.group.rotation.y=Math.atan2(tmp.x,tmp.z);
        }
      });

      if(live.length){
        const target=live.reduce((a,b)=>length2(a.group.position,jan.group.position)<length2(b.group.position,jan.group.position)?a:b);
        const d=length2(jan.group.position,target.group.position);
        if(d<22){jan.group.lookAt(target.group.position.x,jan.group.position.y,target.group.position.z);if(shoot(jan,target.group.position)&&Math.random()<.76){target.hp-=18;if(target.hp<=0){target.group.visible=false;setActorAnimation(target,'death');}}}
      }

      if(started&&objective===0&&player.group.position.z<-18)objective=1;
      if(objective<2&&aliveEnemies().length===0)objective=2;
      if(objective===2&&!reportedComplete){reportedComplete=true;setMissionDone(true);onMissionComplete?.();}

      actors.forEach(a=>a.mixer?.update(dt));for(let i=tracers.length-1;i>=0;i--)if(!tracers[i].update())tracers.splice(i,1);
      const camBack=new THREE.Vector3(Math.sin(yaw)*5.4,3.6,Math.cos(yaw)*5.4);camera.position.copy(player.group.position).add(camBack);
      const look=player.group.position.clone().add(new THREE.Vector3(-Math.sin(yaw)*4,1.35+pitch*2.8,-Math.cos(yaw)*4));camera.lookAt(look);
      if(now-lastHud>120){lastHud=now;setHud(h=>({...h,hp:player.hp,enemies:aliveEnemies().length,objective}));}
      renderer.render(scene,camera);
    };loop();

    return()=>{cancelAnimationFrame(raf);window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKey);window.removeEventListener('mousemove',onMove);document.removeEventListener('pointerlockchange',onPointer);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('mousedown',onCanvasClick);if(document.pointerLockElement===renderer.domElement)document.exitPointerLock?.();renderer.dispose();renderer.domElement.remove();scene.traverse(o=>{o.geometry?.dispose?.();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.());}});};
  },[onMissionComplete]);

  const active=Math.min(hud.objective,KEJIM_POST_MISSION.retailObjectives.length-1);
  return <div className="relative h-full w-full overflow-hidden bg-black text-white">
    <div ref={hostRef} className="absolute inset-0" />
    <div className="pointer-events-none absolute left-5 top-5 max-w-md border border-cyan-100/15 bg-slate-950/72 px-4 py-3 backdrop-blur-xl">
      <div className="text-[10px] uppercase tracking-[.28em] text-cyan-200/55">Star Wars · Jedi Outcast</div>
      <div className="mt-1 text-lg font-semibold">{KEJIM_POST_MISSION.title}</div>
      <div className="mt-2 text-xs text-white/60">{missionDone?'Mission objective test complete':KEJIM_POST_MISSION.retailObjectives[active]?.text}</div>
      <div className="mt-3 flex gap-4 text-[11px] text-white/75"><span>HP {hud.hp}</span><span>Hostiles {hud.enemies}</span><span>{hud.assetMode}</span></div>
    </div>
    <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 border border-white/10 bg-black/65 px-4 py-2 text-[10px] tracking-wide text-white/65 backdrop-blur-xl">{hud.status}</div>
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2"><span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-white/75"/><span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-white/75"/></div>
  </div>;
}
