import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

function Model({ url }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh && !child.material) {
        child.material = new THREE.MeshStandardMaterial({ color: '#888888' });
      }
    });
  }, [scene]);

  if (!scene) return null;
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

function FallbackBox() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4f46e5" />
    </mesh>
  );
}

function Lights() {
  const dirLightRef = useRef();
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight ref={dirLightRef} intensity={1.2} position={[5, 5, 5]} />
    </>
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
    <Canvas camera={{ position: [0, 1, 3], fov: 50 }} style={{ width: '100%', height: '100%' }}>
      <Lights />
      <Suspense fallback={<FallbackBox />}>
        <Model url={modelUrl} />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={2} enablePan={false} />
    </Canvas>
  );
}