import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

const Model = ({ modelPath }) => {
  try {
    const { scene } = useGLTF(modelPath);
    return scene ? <primitive object={scene} /> : null;
  } catch (error) {
    console.warn('Failed to load model:', modelPath, error);
    return null;
  }
};

const LoadingFallback = () => (
  <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
    Loading 3D Model...
  </div>
);

export default function ModelViewer3D({ modelPath = '/models/lara.glb' }) {
  return (
    <Canvas camera={{ position: [0, 1, 2], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Suspense fallback={<LoadingFallback />}>
        <Model modelPath={modelPath} />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={4} />
    </Canvas>
  );
}