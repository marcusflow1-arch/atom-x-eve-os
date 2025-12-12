import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Loader2, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

function Model({ url }) {
  const modelRef = useRef();
  const [model, setModel] = useState(null);
  const [error, setError] = useState(false);
  
  React.useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        try {
          // Traverse and fix materials
          gltf.scene.traverse((child) => {
            if (child.isMesh && child.material) {
              // Ensure material has proper properties
              if (child.material.map && !child.material.map.source) {
                child.material.map = null;
              }
            }
          });
          
          // Center and scale the model
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = maxDim > 0 ? 2 / maxDim : 1;
          
          gltf.scene.scale.multiplyScalar(scale);
          gltf.scene.position.sub(center.multiplyScalar(scale));
          
          setModel(gltf.scene);
        } catch (err) {
          console.error('Error processing model:', err);
          setError(true);
        }
      },
      undefined,
      (err) => {
        console.error('Error loading model:', err);
        setError(true);
      }
    );
  }, [url]);
  
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.005;
    }
  });
  
  if (error) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" wireframe />
      </mesh>
    );
  }
  
  if (!model) return null;
  
  return <primitive ref={modelRef} object={model} />;
}

export default function Model3DPreview({ url, onClose }) {
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-4xl h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-white font-bold">3D Model Preview</h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setResetKey(k => k + 1)}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset View
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 relative bg-gradient-to-br from-slate-950 to-slate-900">
          <Canvas key={resetKey}>
            <PerspectiveCamera makeDefault position={[0, 1, 5]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.3} />
            <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.5} />
            <Suspense fallback={null}>
              <Model url={url} />
            </Suspense>
            <OrbitControls 
              enableZoom={true}
              enablePan={true}
              minDistance={1}
              maxDistance={10}
            />
            <gridHelper args={[10, 10, '#444444', '#222222']} />
          </Canvas>
          
          {/* Loading Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          </div>
        </div>

        {/* Controls Info */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 text-xs text-slate-400">
          <div className="flex gap-6">
            <span>🖱️ Left Click + Drag: Rotate</span>
            <span>🖱️ Right Click + Drag: Pan</span>
            <span>🖱️ Scroll: Zoom</span>
          </div>
        </div>
      </div>
    </div>
  );
}