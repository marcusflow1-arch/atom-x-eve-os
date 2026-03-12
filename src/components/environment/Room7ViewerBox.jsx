import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Maximize2, X, Loader2, Box as BoxIcon, Link as LinkIcon } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

function DynamicModel({ url, setLoading, setError }) {
  const [model, setModel] = useState(null);

  useEffect(() => {
    if (!url) {
      setModel(null);
      return;
    }
    
    let isMounted = true;
    setLoading(true);
    setError(null);

    const isFbx = url.toLowerCase().endsWith('.fbx');
    const loader = isFbx ? new FBXLoader() : new GLTFLoader();
    
    loader.load(
      url,
      (loadedAsset) => {
        if (!isMounted) return;
        const scene = isFbx ? loadedAsset : loadedAsset.scene;
        
        // Auto scale and center
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scale = 10 / maxDim;
          scene.scale.setScalar(scale);
          scene.position.sub(center.multiplyScalar(scale));
          // adjust so it sits on the ground
          scene.position.y += (size.y * scale) / 2;
        }
        
        // Fix materials
        scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // Provide a default material if missing
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((m, i) => {
              if (!m || (m.type === 'ShaderMaterial' && (!m.vertexShader || !m.fragmentShader))) {
                const replacement = new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide });
                if (Array.isArray(child.material)) {
                  child.material[i] = replacement;
                } else {
                  child.material = replacement;
                }
              } else if (m) {
                m.side = THREE.DoubleSide;
                m.needsUpdate = true;
              }
            });
          }
        });

        setModel(scene);
        setLoading(false);
      },
      undefined,
      (err) => {
        if (!isMounted) return;
        console.error("Failed to load model", err);
        setError("Failed to load model. Please check the URL and format.");
        setLoading(false);
      }
    );
    
    return () => { isMounted = false; };
  }, [url]);

  if (!model) return null;
  return <primitive object={model} />;
}

export default function Room7ViewerBox() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customModelUrl, setCustomModelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div className={`relative transition-all duration-500 mb-6 flex-shrink-0 ${
      isExpanded 
        ? 'fixed inset-4 z-[100] bg-slate-950 rounded-3xl border border-white/20 shadow-2xl' 
        : 'w-full h-72 bg-slate-900 rounded-xl border border-cyan-500/30 overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.1)]'
    }`}>
       {/* Header / UI Controls */}
       <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
            <BoxIcon className="w-5 h-5 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-white font-black tracking-widest text-sm leading-tight">ROOM 7</span>
              <span className="text-cyan-400 text-[10px] font-bold tracking-wider leading-none">CUSTOM ASSET VIEWER</span>
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

       {/* URL Input Overlay */}
       <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-center pointer-events-none">
          <div className="bg-black/70 backdrop-blur-xl p-2.5 rounded-2xl border border-white/15 flex items-center gap-3 w-full max-w-2xl shadow-2xl pointer-events-auto transition-all focus-within:border-cyan-500/50 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <LinkIcon className="w-5 h-5 text-slate-400 ml-2" />
            <input 
              type="text" 
              placeholder="Paste custom GLTF/GLB/FBX URL from Asset Files..." 
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-500 font-medium"
              value={customModelUrl}
              onChange={(e) => setCustomModelUrl(e.target.value)}
            />
            {customModelUrl && (
              <button 
                onClick={() => setCustomModelUrl('')} 
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
       </div>

       {/* Status Indicators */}
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          {loading && (
            <div className="bg-black/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-white font-medium text-sm">Processing 3D Asset...</span>
            </div>
          )}
          {error && !loading && (
            <div className="bg-red-500/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-red-500/30 flex flex-col items-center gap-2 max-w-sm text-center">
              <span className="text-red-400 font-bold">Import Failed</span>
              <span className="text-red-300/80 text-xs">{error}</span>
            </div>
          )}
          {!customModelUrl && !loading && (
            <div className="bg-black/30 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
              <BoxIcon className="w-12 h-12 text-white/20 mb-1" />
              <span className="text-white/50 font-medium text-sm">Room 7 is empty</span>
              <span className="text-white/30 text-xs">Load an asset to build this environment</span>
            </div>
          )}
       </div>

       {/* 3D Canvas */}
       <Canvas shadows camera={{ position: [0, 5, 12], fov: 45 }}>
         <color attach="background" args={['#080C11']} />
         <fog attach="fog" args={['#080C11', 10, 50]} />
         
         <ambientLight intensity={0.6} />
         <directionalLight 
           position={[10, 20, 10]} 
           intensity={1.5} 
           castShadow 
           shadow-mapSize-width={2048}
           shadow-mapSize-height={2048}
         />
         <pointLight position={[-10, 5, -10]} intensity={0.5} color="#4488ff" />
         <pointLight position={[10, 5, -10]} intensity={0.5} color="#ff4488" />

         <DynamicModel url={customModelUrl} setLoading={setLoading} setError={setError} />
         
         {/* Grid Floor */}
         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
           <planeGeometry args={[100, 100]} />
           <meshStandardMaterial color="#111827" depthWrite={true} />
         </mesh>
         <gridHelper args={[100, 100, '#22d3ee', '#1e293b']} position={[0, 0, 0]} opacity={0.2} transparent />
         
         <OrbitControls 
           makeDefault 
           autoRotate={!isExpanded && !!customModelUrl} 
           autoRotateSpeed={0.5} 
           maxPolarAngle={Math.PI / 2 + 0.1}
           minDistance={2}
           maxDistance={30}
         />
       </Canvas>
    </div>
  );
}