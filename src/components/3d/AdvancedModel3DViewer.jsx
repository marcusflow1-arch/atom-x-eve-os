import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Center } from '@react-three/drei';

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <Center><primitive object={scene} /></Center>;
}

function FallbackBox() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4f46e5" />
    </mesh>
  );
}

export default function AdvancedModel3DViewer({ modelUrl }) {
  if (!modelUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
        No model selected
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 1, 3], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Suspense fallback={<FallbackBox />}>
        <Model url={modelUrl} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={2} enablePan={false} />
    </Canvas>
  );
}