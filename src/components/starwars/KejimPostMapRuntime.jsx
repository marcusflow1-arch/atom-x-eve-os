import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildRavenBspGroup, loadRavenBspFromUrl, parseRavenBsp } from './RavenBspLoader';

const MAP_URL='/starwars/kejim_post/kejim_post.bsp';

export default function KejimPostMapRuntime(){
  const hostRef=useRef(null);
  const fileRef=useRef(null);
  const [state,setState]=useState({status:'loading',message:'Loading Kejim Post map…',stats:null});

  useEffect(()=>{
    const host=hostRef.current;if(!host)return;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x090d12);
    const camera=new THREE.PerspectiveCamera(65,1,.02,6000);
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xdfeaff,0x14171b,1.35));
    const sun=new THREE.DirectionalLight(0xffffff,2.1);sun.position.set(100,180,70);scene.add(sun);

    const root=new THREE.Group();scene.add(root);
    let mapGroup=null,raf=0,last=performance.now();
    const keys=new Set();
    let yaw=0,pitch=-.18,speed=20,drag=false,px=0,py=0;

    const fitMap=(group)=>{
      const box=new THREE.Box3().setFromObject(group);if(box.isEmpty())return;
      const center=new THREE.Vector3(),size=new THREE.Vector3();box.getCenter(center);box.getSize(size);
      const radius=Math.max(size.x,size.y,size.z)*.6||20;
      camera.position.set(center.x+radius*.55,center.y+radius*.35,center.z+radius*.55);
      camera.lookAt(center);yaw=Math.atan2(-(center.x-camera.position.x),-(center.z-camera.position.z));
      pitch=Math.asin(Math.max(-.9,Math.min(.9,(center.y-camera.position.y)/camera.position.distanceTo(center))));
      camera.near=Math.max(.01,radius/20000);camera.far=Math.max(2000,radius*30);camera.updateProjectionMatrix();
      speed=Math.max(6,radius*.18);
    };
    const install=(group,stats,label)=>{
      if(mapGroup){root.remove(mapGroup);mapGroup.traverse(o=>{o.geometry?.dispose?.();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.());}});}
      mapGroup=group;root.add(group);fitMap(group);
      setState({status:'ready',message:label,stats:{...stats,...group.userData}});
    };
    const loadDefault=async()=>{
      try{
        const {parsed,group}=await loadRavenBspFromUrl(MAP_URL,{scale:.0254,patchSubdivisions:6});
        install(group,parsed.stats,'Kejim Post RBSP loaded');
      }catch(err){
        setState({status:'missing',message:'Kejim Post BSP is not installed in the runtime pack yet.',stats:null});
      }
    };
    loadDefault();

    const resize=()=>{const w=host.clientWidth||window.innerWidth,h=host.clientHeight||window.innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};resize();
    const onKey=e=>{if(e.type==='keydown')keys.add(e.code);else keys.delete(e.code);};
    const onDown=e=>{if(e.button===0){drag=true;px=e.clientX;py=e.clientY;}};
    const onMove=e=>{if(!drag)return;const dx=e.clientX-px,dy=e.clientY-py;px=e.clientX;py=e.clientY;yaw-=dx*.004;pitch=Math.max(-1.48,Math.min(1.48,pitch-dy*.004));};
    const onUp=()=>{drag=false;};
    const onWheel=e=>{speed=Math.max(1,Math.min(400,speed*(e.deltaY>0?1.12:.89)));};

    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKey);window.addEventListener('resize',resize);
    renderer.domElement.addEventListener('mousedown',onDown);window.addEventListener('mousemove',onMove);window.addEventListener('mouseup',onUp);renderer.domElement.addEventListener('wheel',onWheel,{passive:true});

    const fwd=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),move=new THREE.Vector3();
    const loop=()=>{
      raf=requestAnimationFrame(loop);const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
      fwd.set(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).normalize();
      right.crossVectors(fwd,up).normalize();move.set(0,0,0);
      if(keys.has('KeyW'))move.add(fwd);if(keys.has('KeyS'))move.sub(fwd);if(keys.has('KeyD'))move.add(right);if(keys.has('KeyA'))move.sub(right);
      if(keys.has('KeyE'))move.y+=1;if(keys.has('KeyQ'))move.y-=1;
      if(move.lengthSq())camera.position.addScaledVector(move.normalize(),speed*dt*(keys.has('ShiftLeft')?3:1));
      camera.lookAt(camera.position.clone().add(fwd));
      renderer.render(scene,camera);
    };loop();

    const handleLocalFile=async(file)=>{
      try{
        setState({status:'loading',message:'Parsing local Kejim Post BSP…',stats:null});
        const parsed=parseRavenBsp(await file.arrayBuffer(),{scale:.0254,patchSubdivisions:6});
        const group=buildRavenBspGroup(parsed);
        install(group,parsed.stats,`Loaded ${file.name} locally`);
      }catch(err){
        setState({status:'error',message:err?.message||'Could not parse BSP.',stats:null});
      }
    };
    host.__loadLocalBsp=handleLocalFile;

    return()=>{cancelAnimationFrame(raf);window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKey);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('mousedown',onDown);window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);renderer.dispose();renderer.domElement.remove();};
  },[]);

  const chooseFile=async e=>{
    const file=e.target.files?.[0];if(!file||!hostRef.current?.__loadLocalBsp)return;
    await hostRef.current.__loadLocalBsp(file);
  };

  return <div className="relative h-full w-full overflow-hidden bg-[#090d12] text-white">
    <div ref={hostRef} className="absolute inset-0" />
    <div className="absolute left-5 top-5 z-10 w-[min(440px,calc(100%-40px))] border border-white/10 bg-slate-950/82 p-4 backdrop-blur-xl">
      <div className="text-[10px] uppercase tracking-[.28em] text-cyan-200/55">Star Wars · Jedi Outcast</div>
      <div className="mt-1 text-lg font-semibold">Kejim Post — Map First</div>
      <div className="mt-2 text-xs leading-5 text-white/60">{state.message}</div>
      {state.stats&&<div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-white/55">
        <span>Surfaces</span><span className="text-right text-white/80">{state.stats.renderedSurfaces ?? state.stats.surfaceCount}</span>
        <span>Shaders</span><span className="text-right text-white/80">{state.stats.shaderCount}</span>
        <span>Vertices</span><span className="text-right text-white/80">{state.stats.vertCount}</span>
        <span>Entities</span><span className="text-right text-white/80">{state.stats.entityCount}</span>
      </div>}
      {state.status==='missing'&&<div className="mt-4">
        <div className="mb-2 text-[10px] text-amber-100/70">The Drive pack contains <b>kejim_post.nav</b>, scripts, textures, models and mission data, but no <b>kejim_post.bsp</b>. The actual level geometry cannot be reconstructed exactly from the NAV file alone.</div>
        <button type="button" onClick={()=>fileRef.current?.click()} className="border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-400/20">Load Kejim Post .BSP</button>
        <input ref={fileRef} type="file" accept=".bsp,application/octet-stream" className="hidden" onChange={chooseFile}/>
      </div>}
    </div>
    <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 border border-white/10 bg-black/65 px-4 py-2 text-[10px] text-white/60 backdrop-blur-xl">Map inspection only · WASD move camera · Q/E down/up · Shift fast · drag mouse to look · wheel adjusts speed</div>
  </div>;
}
