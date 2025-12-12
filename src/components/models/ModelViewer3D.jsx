import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import * as THREE from 'three';

function Model({ url, autoRotate = true }) {
  const modelRef = useRef();
  const [scene, setScene] = React.useState(null);
  
  React.useEffect(() => {
    useGLTF.load(url, (gltf) => {
      try {
        const clonedScene = gltf.scene.clone();
        
        clonedScene.traverse((child) => {
          if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            
            materials.forEach((mat) => {
              // Remove problematic textures
              ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap'].forEach(prop => {
                if (mat[prop] && (!mat[prop].source || !mat[prop].image)) {
                  mat[prop] = null;
                }
              });
            });
          }
        });
        
        const box = new THREE.Box3().setFromObject(clonedScene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 2 / maxDim : 1;
        
        clonedScene.scale.multiplyScalar(scale);
        clonedScene.position.sub(center.multiplyScalar(scale));
        
        setScene(clonedScene);
      } catch (err) {
        console.error('Error loading model:', err);
      }
    });
  }, [url]);
  
  useFrame(() => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += 0.005;
    }
  });
  
  if (!scene) return null;
  
  return <primitive ref={modelRef} object={scene} />;
}

export default function ModelViewer3D({ url, className = "w-full h-full", autoRotate = true }) {
  if (!url) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-900 rounded-lg`}>
        <div className="text-center text-slate-500">
          <Loader2 className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">No model selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg overflow-hidden`}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 1, 5]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.5} />
        <Suspense fallback={null}>
          <Model url={url} autoRotate={autoRotate} />
        </Suspense>
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          minDistance={1}
          maxDistance={10}
        />
        <gridHelper args={[10, 10, '#444444', '#222222']} />
      </Canvas>
    </div>
  );
}