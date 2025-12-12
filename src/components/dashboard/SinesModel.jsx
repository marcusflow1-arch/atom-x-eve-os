import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerspectiveCamera } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

function Model() {
  try {
    const { scene } = useGLTF(
      'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/33919fb7e_Sines.glb'
    );
    
    if (!scene) return null;
    
    return <primitive object={scene} scale={1} />;
  } catch (error) {
    console.error('Error loading 3D model:', error);
    return null;
  }
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
    </div>
  );
}

export default function SinesModel() {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-auto">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Model />
          <OrbitControls enableZoom={true} enablePan={true} />
        </Canvas>
      </Suspense>
    </div>
  );
}