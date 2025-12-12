import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const OLA_MODEL_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/41dc2dc89_sinestrea-wave-aov.zip';

function LoadedModel({ url }) {
  try {
    const gltf = useLoader(GLTFLoader, url);
    return <primitive object={gltf.scene} scale={1} />;
  } catch (error) {
    console.error('Error loading model:', error);
    return null;
  }
}

function Model() {
  const [glbUrl, setGlbUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    extractGLB();
  }, []);

  const extractGLB = async () => {
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
      setGlbUrl(url);
      setLoading(false);
    } catch (error) {
      console.error('Failed to extract GLB:', error);
      setLoading(false);
    }
  };

  if (loading || !glbUrl) {
    return null;
  }

  return <LoadedModel url={glbUrl} />;
}

export default function OLAModel() {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-auto">
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Model />
          <OrbitControls enableZoom={true} enablePan={true} />
        </Suspense>
      </Canvas>
    </div>
  );
}