import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

function Model({ url }) {
  const { scene } = useGLTF(url);

  // Ensure all materials are valid before rendering
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh) {
        if (!child.material) {
          child.material = new THREE.MeshStandardMaterial({ color: '#888888' });
        }
        if (!child.geometry) return;
      }
    });
  }, [scene]);

  if (!scene) return null;
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

function ModelErrorFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.8, 16, 16]} />
      <meshStandardMaterial color="#ef4444" wireframe />
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
      gl={{ alpha: true }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <Suspense fallback={<FallbackBox />}>
        <Model url={modelUrl} />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={2} enablePan={false} />
    </Canvas>
  );
}