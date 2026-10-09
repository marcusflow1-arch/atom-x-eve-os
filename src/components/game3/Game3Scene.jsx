/* eslint-disable react/no-unknown-property -- React Three Fiber mesh props */
import {useEffect,useMemo,useRef,useState} from 'react';
import * as THREE from 'three';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {stepRace} from './physics';

function FallbackCar({color='#12cde4',ghost=false}){
 return <group>
  <mesh position={[0,0.56,0]} castShadow><boxGeometry args={[2,0.54,4.1]}/><meshStandardMaterial color={color} metalness={0.75} roughness={0.23} transparent={ghost} opacity={ghost?0.25:1}/></mesh>
  <mesh position={[0,1.02,-0.28]} castShadow><boxGeometry args={[1.64,0.56,1.96]}/><meshStandardMaterial color="#10253b" metalness={0.55} roughness={0.13} transparent opacity={ghost?0.2:0.94}/></mesh>
  <mesh position={[0,0.75,1.84]}><boxGeometry args={[1.65,0.12,0.1]}/><meshBasicMaterial color="#f34e69"/></mesh>
  {[-1,1].flatMap(x=>[-1.25,1.35].map(z=><mesh key={x+':'+z} position={[x*0.97,0.36,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.43,0.43,0.24,12]}/><meshStandardMaterial color="#090b0d" roughness={0.85}/></mesh>))}
 </group>;
}
function ImportedCar({src,color}){
 const [model,setModel]=useState(null);
 useEffect(()=>{
  if(!src){setModel(null);return;}
  let live=true;
  const loader=new GLTFLoader();
  loader.load(src,(g)=>{
   if(!live)return;
   const root=g.scene;
   const b=new THREE.Box3().setFromObject(root);
   const size=b.getSize(new THREE.Vector3());
   const scale=4.25/Math.max(size.x,size.z,0.001);
   const center=b.getCenter(new THREE.Vector3());
   root.position.set(-center.x,-b.min.y,-center.z);
   const wrapper=new THREE.Group();
   wrapper.add(root);wrapper.scale.setScalar(scale);
   wrapper.rotation.y=size.x>size.z ? Math.PI/2 : 0;
   wrapper.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
   setModel(wrapper);
  },undefined,()=>{if(live)setModel(null);});
  return()=>{live=false;setModel(null);};
 },[src]);
 return model?<primitive object={model}/>:<FallbackCar color={color}/>;
}
function Building({x,z,index}){
 const h=7+((index*17)%27);
 return <group position={[x,h/2,z]}>
  <mesh><boxGeometry args={[7,h,11]}/><meshStandardMaterial color={index%3===0?'#173043':'#0b1727'} metalness={0.12} roughness={0.9}/></mesh>
  {Array.from({length:4},(_,j)=><mesh key={j} position={[x>0?-3.52:3.52,j*2.2-3,0]}><planeGeometry args={[0.04,1.1]}/><meshBasicMaterial color={j%2?'#2a6d87':'#56b4c7'} transparent opacity={0.5}/></mesh>)}
 </group>;
}
function RoadObjects({distance}){
 const buildings=useMemo(()=>Array.from({length:36},(_,i)=>({x:(i%2===0?-1:1)*(13+((i*7)%9)),z:-320+Math.floor(i/2)*21,index:i})),[]);
 const offset=(distance%21);
 return <group>
  <mesh position={[0,-0.18,-95]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[300,850]}/><meshStandardMaterial color="#071019" roughness={1}/></mesh>
  <mesh position={[0,-0.07,-95]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[11.3,850]}/><meshStandardMaterial color="#1b2731" roughness={0.96}/></mesh>
  {[-5.55,5.55].map(x=><mesh key={x} position={[x,-0.045,-95]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[0.12,850]}/><meshBasicMaterial color="#83aab1"/></mesh>)}
  {[-1.82,1.82].flatMap(x=>Array.from({length:32},(_,i)=><mesh key={x+':'+i} position={[x,-0.04,(-300+i*12+distance%12)]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[0.11,5]}/><meshBasicMaterial color="#9cabad" transparent opacity={0.65}/></mesh>))}
  {buildings.map(b=><Building key={b.index} index={b.index} x={b.x} z={b.z+offset}/>)}
  {Array.from({length:15},(_,i)=><group key={i} position={[0,0,-300+i*26+distance%26]}>
    <mesh position={[-6.9,6,0]}><boxGeometry args={[0.28,12,0.28]}/><meshStandardMaterial color="#4f6972" metalness={0.4}/></mesh>
    <mesh position={[6.9,6,0]}><boxGeometry args={[0.28,12,0.28]}/><meshStandardMaterial color="#4f6972" metalness={0.4}/></mesh>
    <mesh position={[0,12,0]}><boxGeometry args={[13.8,0.22,0.22]}/><meshStandardMaterial color="#4f6972" metalness={0.4}/></mesh>
    <pointLight position={[0,11.6,0]} intensity={9} color="#a2efff" distance={15}/>
   </group>)}
  <mesh position={[0,0.03,2-(420-(distance%420))]} rotation={[-0.14,0,0]}><boxGeometry args={[10.7,0.45,7]}/><meshStandardMaterial color="#1b5e77" metalness={0.25}/></mesh>
 </group>;
}
function CameraRig({stateRef}){
 const {camera,clock}=useThree();
 const point=useMemo(()=>new THREE.Vector3(),[]);
 const target=useMemo(()=>new THREE.Vector3(),[]);
 useFrame((_,dt)=>{
  const s=stateRef.current;
  const intro=s.phase==='countdown'||s.phase==='idle';
  if(intro){
   const a=clock.elapsedTime*0.38;
   point.set(Math.sin(a)*8.6,2.9+Math.sin(a*0.5)*0.7,Math.cos(a)*8.6+2);
   target.set(0,0.8,1);
  } else if(s.jump>0.15 && s.jump<1.65){
   const angle=clock.elapsedTime*1.5;
   point.set(s.lane+Math.sin(angle)*7,4.1+s.air,3+Math.cos(angle)*7);
   target.set(s.lane,0.85+s.air,2);
  } else {
   const jitter=(s.shakeEnabled===false?0:s.shake)*0.08;
   point.set(s.lane*0.66+(Math.random()-0.5)*jitter,4.3+s.air*0.18+(Math.random()-0.5)*jitter,12.8+s.speed*0.022);
   target.set(s.lane*0.47,0.86+s.air*0.35,-15);
  }
  camera.position.lerp(point,Math.min(1,dt*4.5));
  camera.lookAt(target);
 });
 return null;
}
function WorldRuntime({stateRef,inputRef,car,carSrc,onSnapshot}){
 const roadRef=useRef(),carGroup=useRef(),enemyRef=useRef(),ghostRef=useRef();
 const time=useRef(0);
 useFrame((_,dt)=>{
  const s=stateRef.current;
  const input=inputRef.current;
  stepRace(s,input,dt,car);
  s.shakeEnabled=input.shakeEnabled;
  if(input.dodge)input.dodge=false;
  if(carGroup.current){carGroup.current.position.set(s.lane,s.air,2);carGroup.current.rotation.y=-s.yaw;carGroup.current.rotation.z=-s.yaw*0.09;}
  if(enemyRef.current){enemyRef.current.position.set(s.opponentLane,0,2-s.opponentDistance);}
  if(ghostRef.current){ghostRef.current.visible=s.ghost>0;ghostRef.current.position.set(s.lane,0,2+Math.min(3,s.ghost*2));}
  if(roadRef.current)roadRef.current.position.z=0;
  time.current+=dt;
  if(time.current>0.11){time.current=0;onSnapshot({...s});}
 });
 const fogColor='#060d1a';
 return <>
  <color attach="background" args={[fogColor]}/>
  <fog attach="fog" args={[fogColor,45,260]}/>
  <ambientLight intensity={0.85} color="#8eb7d4"/>
  <directionalLight position={[20,35,-40]} intensity={2.3} color="#bbddff" castShadow/>
  <RoadObjects distance={stateRef.current.distance}/>
  <group ref={carGroup} position={[0,0,2]}><ImportedCar src={carSrc} color={car.color}/></group>
  <group ref={enemyRef} position={[0,0,-30]}><FallbackCar color="#df4c64"/></group>
  <group ref={ghostRef} visible={false}><FallbackCar color="#9defff" ghost/></group>
  <CameraRig stateRef={stateRef}/>
 </>;
}
export default function Game3Scene({stateRef,inputRef,car,carSrc,onSnapshot}){
 return <Canvas shadows dpr={[1,1.7]} camera={{position:[0,4,13],fov:65,near:0.1,far:600}} gl={{antialias:true,powerPreference:'high-performance'}}>
  <WorldRuntime stateRef={stateRef} inputRef={inputRef} car={car} carSrc={carSrc} onSnapshot={onSnapshot}/>
 </Canvas>;
}
