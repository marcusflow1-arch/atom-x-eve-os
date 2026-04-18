import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const Model = ({ modelPath }) => {
  return null;
};

const LoadingFallback = () => (
  <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
    3D Model Ready
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