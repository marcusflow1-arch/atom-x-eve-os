import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

function SceneSetup() {
  const { scene } = useThree();
  useEffect(() => {
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 5, 5);
    scene.add(ambient, dir);
    return () => {
      scene.remove(ambient, dir);
      ambient.dispose();
      dir.dispose();
    };
  }, [scene]);
  return null;
}

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
  const meshRef = useRef();
  useEffect(() => {
    if (!meshRef.current) return;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: '#4f46e5' });
    meshRef.current.geometry = geo;
    meshRef.current.material = mat;
    return () => { geo.dispose(); mat.dispose(); };
  }, []);
  return <mesh ref={meshRef} />;
}

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 1, 3);
    camera.fov = 50;
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
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
    <Canvas style={{ width: '100%', height: '100%' }}>
      <CameraSetup />
      <SceneSetup />
      <Suspense fallback={<FallbackBox />}>
        <Model url={modelUrl} />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={2} enablePan={false} />
    </Canvas>
  );
}