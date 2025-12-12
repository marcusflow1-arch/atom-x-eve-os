import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, PerspectiveCamera } from '@react-three/drei';

function Model() {
  const modelRef = useRef();
  
  try {
    const { scene } = useGLTF('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/33919fb7e_Sines.glb');
    
    useFrame(() => {
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.002;
      }
    });
    
    return <primitive ref={modelRef} object={scene} scale={1.5} position={[0, 0, 0]} />;
  } catch (error) {
    console.error('Error loading 3D model:', error);
    return null;
  }
}

export default function Luna3DBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas>
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