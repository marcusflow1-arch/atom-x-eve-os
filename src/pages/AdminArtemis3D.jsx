import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useAuth } from '../components/auth/AuthContext';

function cylinderBetween(a,b,r,material,segments=12){
  const dir=new THREE.Vector3().subVectors(b,a); const len=dir.length();
  const g=new THREE.CylinderGeometry(r,r,len,segments); const m=new THREE.Mesh(g,material);
  m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize()); return m;
}
function sphere(pos,r,material){ const m=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),material); m.position.copy(pos); return m; }
function createArtemis(){
  const root=new THREE.Group(); root.name='Artemis • Demo 3D Asset';
  const skin=new THREE.MeshStandardMaterial({color:0xb87850,roughness:.75});
  const ivory=new THREE.MeshStandardMaterial({color:0xe7e4d6,roughness:.82});
  const bronze=new THREE.MeshStandardMaterial({color:0xb8782d,metalness:.7,roughness:.3});
  const blue=new THREE.MeshStandardMaterial({color:0x173b83,roughness:.5});
  const hair=new THREE.MeshStandardMaterial({color:0x2a1710,roughness:.9});
  root.add(cylinderBetween(new THREE.Vector3(-.25,.55,0),new THREE.Vector3(-.22,1.5,0),.16,skin));
  root.add(cylinderBetween(new THREE.Vector3(.25,.55,0),new THREE.Vector3(.22,1.5,0),.16,skin));
  root.add(cylinderBetween(new THREE.Vector3(-.22,.25,.05),new THREE.Vector3(-.22,.6,.05),.22,bronze));
  root.add(cylinderBetween(new THREE.Vector3(.22,.25,.05),new THREE.Vector3(.22,.6,.05),.22,bronze));
  root.add(cylinderBetween(new THREE.Vector3(0,1.25,0),new THREE.Vector3(0,2.65,0),.52,ivory));
  root.add(cylinderBetween(new THREE.Vector3(0,1.0,0),new THREE.Vector3(0,1.5,0),.7,ivory));
  root.add(cylinderBetween(new THREE.Vector3(0,2.55,0),new THREE.Vector3(0,2.85,0),.18,skin));
  root.add(sphere(new THREE.Vector3(0,3.2,0),.42,skin)); root.add(sphere(new THREE.Vector3(0,3.3,-.08),.46,hair));
  root.add(cylinderBetween(new THREE.Vector3(-.45,2.45,0),new THREE.Vector3(-.95,1.85,.05),.13,skin));
  root.add(cylinderBetween(new THREE.Vector3(-.95,1.85,.05),new THREE.Vector3(-1.06,1.52,.12),.11,skin));
  root.add(cylinderBetween(new THREE.Vector3(.45,2.45,0),new THREE.Vector3(.88,1.98,.14),.13,skin));
  root.add(cylinderBetween(new THREE.Vector3(.88,1.98,.14),new THREE.Vector3(.98,1.63,.2),.11,skin));
  const bow=[[-1.08,1.52,.15],[-1.25,1.95,.15],[-1.18,2.45,.15],[-.95,2.72,.15]].map(p=>new THREE.Vector3(...p));
  for(let i=0;i<bow.length-1;i++) root.add(cylinderBetween(bow[i],bow[i+1],.035,bronze,8)); root.add(cylinderBetween(bow[0],bow[3],.012,skin,6));
  root.add(cylinderBetween(new THREE.Vector3(.5,2.1,-.22),new THREE.Vector3(.63,1.3,-.18),.13,blue));
  [-.03,0,.03].forEach(dx=>root.add(cylinderBetween(new THREE.Vector3(.63+dx,2.2,-.22),new THREE.Vector3(.69+dx,2.72,-.22),.015,bronze,6)));
  const ringPts=[]; for(let i=0;i<20;i++){const t=2*Math.PI*i/20;ringPts.push(new THREE.Vector3(.42*Math.cos(t),3.2+.075*Math.sin(t),.05));}
  for(let i=0;i<20;i++) root.add(cylinderBetween(ringPts[i],ringPts[(i+1)%20],.025,bronze,6));
  root.add(cylinderBetween(new THREE.Vector3(-.55,2.52,.02),new THREE.Vector3(.55,2.52,.02),.055,bronze,8)); return root;
}
export default function AdminArtemis3D(){
  const { user } = useAuth(); const ref=useRef(null);
  useEffect(()=>{ if(user?.role!=='admin') return; const el=ref.current; if(!el)return;
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x090d16);
    const camera=new THREE.PerspectiveCamera(42,el.clientWidth/el.clientHeight,.1,100); camera.position.set(0,2,6);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); renderer.setSize(el.clientWidth,el.clientHeight); renderer.outputColorSpace=THREE.SRGBColorSpace; el.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff,0x18233a,1.6)); const key=new THREE.DirectionalLight(0xffffff,2.2); key.position.set(4,7,5); scene.add(key);
    const rim=new THREE.DirectionalLight(0x7aa2ff,1.4); rim.position.set(-4,4,-5); scene.add(rim); scene.add(new THREE.GridHelper(8,32,0x31415e,0x182236));
    const model=createArtemis(); model.position.y=-.25; scene.add(model);
    const controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.target.set(0,1.7,0);
    let frame; const animate=()=>{frame=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}; animate();
    const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)}; window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);controls.dispose();renderer.dispose();el.innerHTML=''};
  },[user?.role]);
  if(user?.role!=='admin') return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold mb-2">Access Denied</h1><p className="text-slate-400">You need admin privileges to access this page.</p></div></div>;
  return <div className="min-h-screen bg-slate-950 text-white p-8"><div className="max-w-6xl mx-auto">
    <div className="mb-5"><div className="text-xs uppercase tracking-[.28em] text-slate-500">Admin • 3D Library • Demo Asset</div><h1 className="text-3xl font-semibold mt-2">Artemis</h1><p className="text-slate-400 mt-1">Atom XE procedural 3D proof-of-concept — orbit, pan and zoom.</p></div>
    <div className="rounded-3xl border border-white/10 bg-white/[.035] overflow-hidden shadow-2xl"><div ref={ref} className="w-full h-[680px]"/></div>
  </div></div>;
}
