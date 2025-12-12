import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, PerspectiveCamera } from '@react-three/drei';

function Model() {
  const modelRef = useRef();
  
  try {
    const gltf = useGLTF('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/33919fb7e_Sines.glb');
    
    useFrame(() => {
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.005;
      }
    });
    
    if (!gltf || !gltf.scene) {
      return null;
    }
    
    return <primitive ref={modelRef} object={gltf.scene} scale={1} position={[0, 0, 0]} />;
  } catch (error) {
    console.error('Error loading 3D model:', error);
    return null;
  }
}

export default function Luna3DBackground() {
  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 1, 3]} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={1}
        />
      </Canvas>
    </div>
  );
}