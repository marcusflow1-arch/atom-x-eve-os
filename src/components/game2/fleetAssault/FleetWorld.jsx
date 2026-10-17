import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Lightweight native 3D preview for the offline Fleet Assault vertical slice.
// It is not a substitute for Game 2's Jedi combat engine or a networked 50v50 simulation.
export default function FleetWorld({ theater, hull, guards, jedi, relay }) {
  const host = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'}); }
    catch { setError('WebGL is unavailable. Enable hardware acceleration to view the 3D battlefront.'); return undefined; }
    setError('');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.cssText='width:100%;height:100%;display:block';
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background=new THREE.Color(theater==='planet'?'#0b1927':'#030814');
    scene.fog=new THREE.FogExp2(theater==='planet'?'#203747':'#030b1b',theater==='orbit'?.0015:.014);
    const camera = new THREE.PerspectiveCamera(64,1,.1,2000);
    const hemi=new THREE.HemisphereLight(0x9acfff,0x141321,1.9);
    scene.add(hemi);
    const key=new THREE.DirectionalLight(0xaddcff,3.4);key.position.set(-35,48,24);scene.add(key);
    const steel = new THREE.MeshStandardMaterial({color:0x263952,metalness:.74,roughness:.35});
    const dark = new THREE.MeshStandardMaterial({color:0x0c1a2d,metalness:.82,roughness:.29});
    const floorMat = new THREE.MeshStandardMaterial({color:0x142638,metalness:.5,roughness:.6});
    const cyan = new THREE.MeshStandardMaterial({color:0x12b9ed,emissive:0x007aba,emissiveIntensity:2.2,metalness:.4});
    const amber = new THREE.MeshStandardMaterial({color:0xffbd52,emissive:0xef7b18,emissiveIntensity:2.5});
    const red = new THREE.MeshStandardMaterial({color:0xf75560,emissive:0xba1827,emissiveIntensity:1.7});
    const gray = new THREE.MeshStandardMaterial({color:0x829bb5,metalness:.55,roughness:.4});
    function mesh(geo,mat,at,rot) {
      const obj = new THREE.Mesh(geo,mat);
      if(at)obj.position.set(...at);
      if(rot)obj.rotation.set(...rot);
      scene.add(obj);
      return obj;
    }
    const box=(dims,at,mat=steel)=>mesh(new THREE.BoxGeometry(...dims),mat,at);
    const glow=(dims,at,mat=cyan)=>box(dims,at,mat);
    function ship(at,scale=1,enemy=false){
      const hull=box([13*scale,2*scale,30*scale],at,enemy?dark:steel);
      const nose=mesh(new THREE.ConeGeometry(6.6*scale,13*scale,4),enemy?dark:steel,[at[0],at[1],at[2]-20*scale],[-Math.PI/2,0,Math.PI/4]);
      box([34*scale,.8*scale,8*scale],[at[0],at[1]-.4*scale,at[2]+8*scale],enemy?dark:steel);
      for (const x of [-1,1]) {
        glow([1.2*scale,.2*scale,9*scale],[at[0]+x*10*scale,at[1]+.8*scale,at[2]+7*scale],enemy?red:cyan);
        glow([3*scale,1.1*scale,.4*scale],[at[0]+x*3.6*scale,at[1],at[2]+15*scale],enemy?red:cyan);
      }
      return {hull,nose};
    }
    let subject;
    if(theater==='orbit'){
      const n=950,xyz=new Float32Array(n*3);
      for(let i=0;i<n;i++){xyz[i*3]=(Math.random()-.5)*600;xyz[i*3+1]=(Math.random()-.5)*300;xyz[i*3+2]=-Math.random()*560+100;}
      const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.BufferAttribute(xyz,3));
      scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xbddfff,size:1.3,sizeAttenuation:true})));
      const planet=mesh(new THREE.SphereGeometry(43,48,32),new THREE.MeshStandardMaterial({color:0x1a4970,roughness:1,emissive:0x092036,emissiveIntensity:.15}),[-85,-55,-182]);
      mesh(new THREE.SphereGeometry(44.3,32,24),new THREE.MeshBasicMaterial({color:0x449ad8,transparent:true,opacity:.1,side:THREE.BackSide}),planet.position.toArray());
      ship([0,9,-125],2.2,true);ship([-60,-9,-90],.7,false);
      subject=new THREE.Group();
      const craft=new THREE.Mesh(new THREE.ConeGeometry(2.4,8,3),steel);craft.rotation.x=-Math.PI/2;subject.add(craft);
      const wing=new THREE.Mesh(new THREE.BoxGeometry(11,.3,2.6),dark);wing.position.z=2;subject.add(wing);
      for(const x of [-4,4]) {const jet=new THREE.Mesh(new THREE.CylinderGeometry(.58,.7,2.6,12),cyan);jet.rotation.x=Math.PI/2;jet.position.set(x,0,3.4);subject.add(jet);}
      scene.add(subject);
      subject.position.set(0,1,8);
    } else {
      const ground=theater==='planet';
      box([ground?250:33,1,ground?250:130],[0,-.55,-25],ground?new THREE.MeshStandardMaterial({color:0x2a3940,roughness:1}):floorMat);
      if(!ground){
        for(let z=-58;z<30;z+=12){
          for(const x of [-16.2,16.2]){box([1.6,9,11],[x,4,z],steel);glow([.12,6,1],[x+(x>0?-.9:.9),4,z],cyan);}
          box([33,1,11],[0,9,z],dark);
          for(const x of [-10,10])glow([.3,.12,10],[x,.06,z],amber);
        }
        box([26,8,1],[0,4,-63],dark);
        glow([14,.4,.4],[0,7,-62.6],red);
        box([5,4,5],[-9,2,-49],dark);glow([4.5,.4,1],[-9,4,-46.8],amber);
        for(let i=0;i<guards;i++)fighter(-6+i*5,-12-i*6,red,false);
        for(let i=0;i<jedi;i++)fighter(-4+i*8,-38,amber,true);
        fighter(0,-54,red,true,1.4);
      }else{
        for(let i=0;i<30;i++){
          const x=(Math.random()-.5)*145,z=(Math.random()-.5)*145-10;
          box([4+Math.random()*9,2+Math.random()*10,4+Math.random()*9],[x,3,z],i%3===0?dark:steel);
        }
        for(const x of [-14,14])box([5,24,5],[x,12,-36],steel);
        glow([28,1,1],[0,21,-36],relay>=100?cyan:amber);
        for(const x of [-14,14])glow([1,15,1],[x,13,-33],relay>=100?cyan:red);
        mesh(new THREE.SphereGeometry(16,32,22),new THREE.MeshBasicMaterial({color:0x73e2ff,transparent:true,opacity:.12,wireframe:true}),[0,17,-36]);
        for(let i=0;i<5;i++)fighter(-12+i*6,-20-i%2*8,red,false);
      }
      // An articulated silhouette and ignited blade for the player.
      subject=new THREE.Group();
      const body=new THREE.Mesh(new THREE.CapsuleGeometry(.65,1.55,5,12),gray);body.position.y=1.75;subject.add(body);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.46,16,12),gray);head.position.y=3.2;subject.add(head);
      const saber=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,3,10),cyan);saber.position.set(.9,1.75,-.5);saber.rotation.x=.45;subject.add(saber);
      scene.add(subject);subject.position.set(0,0,17);
    }
    function fighter(x,z,mat,isJedi,scale=1){
      const h=2.2*scale;
      box([1.1*scale,h,.8*scale],[x,h/2,z],mat);
      mesh(new THREE.SphereGeometry(.54*scale,12,10),gray,[x,h+.4*scale,z]);
      if(isJedi)mesh(new THREE.CylinderGeometry(.1,.1,3*scale,8),cyan,[x+1.2*scale,1.5*scale,z-1]);
      else box([1.6*scale,.3*scale,.4*scale],[x+1*scale,1.5*scale,z-1],dark);
    }
    const position={x:0,z:theater==='orbit'?8:17,y:theater==='orbit'?1:0};
    const keys=new Set();
    function down(e){
      if(e.target?.matches?.('input,textarea,select,button'))return;
      if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){keys.add(e.code);e.preventDefault();}
    }
    function up(e){keys.delete(e.code);}
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    const onBlur=()=>keys.clear();window.addEventListener('blur',onBlur);
    const clock=new THREE.Clock();
    let raf=0,active=true;
    const resize=()=>{const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    const obs=new ResizeObserver(resize);obs.observe(el);resize();
    const loop=()=>{
      if(!active)return;
      raf=requestAnimationFrame(loop);
      const dt=Math.min(clock.getDelta(),.06),boost=keys.has('ShiftLeft')||keys.has('Space');
      const speed=theater==='orbit'?(boost?28:14):(boost?11:5);
      const mx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
      const mz=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
      position.x=THREE.MathUtils.clamp(position.x+mx*speed*dt,theater==='orbit'?-65:-14,theater==='orbit'?65:14);
      position.z=THREE.MathUtils.clamp(position.z+mz*speed*dt,theater==='orbit'?-75:-55,theater==='orbit'?35:27);
      subject.position.set(position.x,position.y,position.z);
      subject.rotation.z=THREE.MathUtils.lerp(subject.rotation.z,-mx*.18,.07);
      subject.rotation.x=THREE.MathUtils.lerp(subject.rotation.x,mz*.08,.07);
      const offset=theater==='orbit'?[0,7,21]:[3.5,5.8,12];
      camera.position.lerp(new THREE.Vector3(position.x+offset[0],position.y+offset[1],position.z+offset[2]),.15);
      camera.lookAt(position.x,position.y+(theater==='orbit'?0:1.7),position.z-17);
      if(theater==='orbit')subject.children.slice(2).forEach((m,i)=>m.material.emissiveIntensity=1.3+Math.sin(clock.elapsedTime*12+i)*.5);
      renderer.render(scene,camera);
    };
    loop();
    return()=>{
      active=false;cancelAnimationFrame(raf);obs.disconnect();
      window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',onBlur);
      scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material){(Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>m.dispose());}});
      renderer.dispose();renderer.domElement.remove();
    };
  },[theater,hull,guards,jedi,relay]);
  return <div ref={host} className="absolute inset-0" aria-label={'Interactive 3D '+theater+' sector'}>
    {error&&<div className="absolute inset-0 flex items-center justify-center bg-slate-950 p-8 text-center text-sm text-amber-200">{error}</div>}
  </div>;
}
