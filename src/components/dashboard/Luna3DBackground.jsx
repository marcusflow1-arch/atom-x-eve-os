import React, { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

function Model() {
  const modelRef = useRef();
  const gltf = useGLTF('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/33919fb7e_Sines.glb');
  
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.002;
    }
  });
  
  if (!gltf || !gltf.scene) return null;
  
  return <primitive ref={modelRef} object={gltf.scene} scale={1.5} position={[0, 0, 0]} />;
}

function ErrorFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center text-white/40">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading 3D Model</p>
      </div>
    </div>
  );
}

export default function Luna3DBackground() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <ErrorFallback />;
  }

  return (
    <div className="w-full h-full">
      <Canvas onCreated={() => setHasError(false)} onError={() => setHasError(true)}>
        <PerspectiveCamera makeDefault position={[0, 2, 5]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={0.5} />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}