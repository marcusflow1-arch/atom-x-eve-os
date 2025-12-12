import React, { useRef, Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Loader2, Box } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

function Model() {
  const modelRef = useRef();
  const [model, setModel] = useState(null);
  const [error, setError] = useState(false);
  
  React.useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/33919fb7e_Sines.glb',
      (gltf) => {
        setModel(gltf.scene);
      },
      undefined,
      (err) => {
        console.error('Error loading model:', err);
        setError(true);
      }
    );
  }, []);
  
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.002;
    }
  });
  
  if (error || !model) return null;
  
  return <primitive ref={modelRef} object={model} scale={1.5} position={[0, 0, 0]} />;
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
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center text-white/40">
        <Box className="w-8 h-8 mx-auto mb-2" />
        <p className="text-xs">3D Model</p>
      </div>
    </div>
  );
}