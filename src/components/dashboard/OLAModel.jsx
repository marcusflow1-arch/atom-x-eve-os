import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerspectiveCamera } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

const OLA_MODEL_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/41dc2dc89_sinestrea-wave-aov.zip';

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

function LoadedModel({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1} />;
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