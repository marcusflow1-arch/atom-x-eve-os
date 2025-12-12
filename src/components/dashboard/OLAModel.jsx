import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const OLA_MODEL_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/41dc2dc89_sinestrea-wave-aov.zip';

function Model() {
  const [scene, setScene] = useState(null);

  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const response = await fetch(OLA_MODEL_URL);
      const blob = await response.blob();
      const zip = await JSZip.loadAsync(blob);
      
      let glbFile = null;
      for (const [path, file] of Object.entries(zip.files)) {
        if (path.toLowerCase().endsWith('.glb') && !file.dir) {
          glbFile = file;
          break;
        }
      }
      
      if (!glbFile) {
        throw new Error('No .glb file found in ZIP');
      }
      
      const glbBlob = await glbFile.async('blob');
      const url = URL.createObjectURL(glbBlob);
      
      const loader = new GLTFLoader();
      loader.load(url, (gltf) => {
        setScene(gltf.scene);
      });
    } catch (error) {
      console.error('Failed to load model:', error);
    }
  };

  if (!scene) return null;
  
  return <primitive object={scene} scale={1} />;
}

export default function OLAModel() {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-auto">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Model />
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
}