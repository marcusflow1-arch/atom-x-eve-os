import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Maximize2, X, Cpu } from 'lucide-react';
import * as THREE from 'three';

function ProceduralRoom7() {
  const coreRef = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.5;
      coreRef.current.position.y = 3 + Math.sin(t * 2) * 0.2;
    }
  });

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0a0f1a" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Grid Floor Overlay */}
      <gridHelper args={[40, 40, '#00e5ff', '#003344']} position={[0, 0.01, 0]} />

      {/* Back Wall */}
      <mesh position={[0, 10, -20]} receiveShadow castShadow>
        <boxGeometry args={[40, 20, 1]} />
        <meshStandardMaterial color="#111827" roughness={0.8} />
      </mesh>
      {/* Glowing Strips on Back Wall */}
      <mesh position={[0, 10, -19.4]}>
        <boxGeometry args={[38, 0.2, 0.1]} />
        <meshBasicMaterial color="#00e5ff" />
      </mesh>
      <mesh position={[0, 15, -19.4]}>
        <boxGeometry args={[38, 0.2, 0.1]} />
        <meshBasicMaterial color="#ff00ff" />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-20, 10, 0]} receiveShadow castShadow>
        <boxGeometry args={[1, 20, 40]} />
        <meshStandardMaterial color="#111827" roughness={0.8} />
      </mesh>
      {/* Right Wall */}
      <mesh position={[20, 10, 0]} receiveShadow castShadow>
        <boxGeometry args={[1, 20, 40]} />
        <meshStandardMaterial color="#111827" roughness={0.8} />
      </mesh>

      {/* Central Pedestal */}
      <mesh position={[0, 0.5, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3, 4, 1, 32]} />
        <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Glowing ring on pedestal */}
      <mesh position={[0, 1.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.5, 32]} />
        <meshBasicMaterial color="#ff00ff" />
      </mesh>

      {/* Floating Core */}
      <group ref={coreRef} position={[0, 3, 0]}>
        <mesh castShadow>
          <octahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.8} wireframe />
        </mesh>
        <mesh scale={0.8}>
          <octahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </mesh>
      </group>
      
      {/* Core light */}
      <pointLight position={[0, 3, 0]} color="#00e5ff" intensity={4} distance={20} />
      
      {/* Data Pillars */}
      {[-10, 10].map((x, i) => (
        <group key={i} position={[x, 0, -10]}>
          <mesh position={[0, 4, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[1, 1, 8, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Pillar Lights */}
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[1.05, 1.05, 6, 16]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.5} wireframe />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Room7ViewerBox() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`relative transition-all duration-500 mb-6 flex-shrink-0 ${
      isExpanded 
        ? 'fixed inset-4 z-[100] bg-slate-950 rounded-3xl border border-white/20 shadow-2xl' 
        : 'w-full h-72 bg-slate-900 rounded-xl border border-cyan-500/30 overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.1)]'
    }`}>
       {/* Header / UI Controls */}
       <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-white font-black tracking-widest text-sm leading-tight">ROOM 7</span>
              <span className="text-cyan-400 text-[10px] font-bold tracking-wider leading-none">PROCEDURAL ENVIRONMENT</span>
            </div>
          </div>
       </div>

       <div className="absolute top-4 right-4 z-10 flex gap-2">
          {!isExpanded && (
            <button onClick={() => setIsExpanded(true)} className="p-2.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all text-white shadow-lg">
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
          {isExpanded && (
            <button onClick={() => setIsExpanded(false)} className="p-2.5 bg-red-500/20 backdrop-blur-md rounded-xl border border-red-500/30 hover:bg-red-500/40 transition-all text-white shadow-lg">
              <X className="w-4 h-4" />
            </button>
          )}
       </div>

       {/* 3D Canvas */}
       <Canvas 
         shadows 
         camera={{ position: [0, 5, 12], fov: 45 }}
         onCreated={({ scene }) => {
           scene.background = new THREE.Color('#080C11');
           scene.fog = new THREE.Fog('#080C11', 10, 50);
         }}
       >
         <ambientLight intensity={0.6} />
         <directionalLight 
           position={[10, 20, 10]} 
           intensity={1.5} 
           castShadow 
         />
         <pointLight position={[-10, 5, -10]} intensity={0.5} color="#4488ff" />
         <pointLight position={[10, 5, -10]} intensity={0.5} color="#ff4488" />

         <ProceduralRoom7 />
         
         <OrbitControls 
           makeDefault 
           autoRotate={!isExpanded} 
           autoRotateSpeed={0.5} 
           maxPolarAngle={Math.PI / 2 + 0.1}
           minDistance={2}
           maxDistance={30}
         />
       </Canvas>
    </div>
  );
}