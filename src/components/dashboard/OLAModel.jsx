import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { base44 } from '@/api/base44Client';

function Model() {
  const [scene, setScene] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      // Fetch OLA model from database
      const models = await base44.entities.Model3D.filter({ name: 'ola' });
      
      if (models.length === 0) {
        setError('OLA model not found');
        return;
      }
      
      const model = models[0];
      const JSZip = (await import('jszip')).default;
      const response = await fetch(model.folder_url);
      const blob = await response.blob();
      const zip = await JSZip.loadAsync(blob);
      
      // Find GLB file
      let glbFile = null;
      for (const [path, file] of Object.entries(zip.files)) {
        if (path.toLowerCase().endsWith('.glb') && !file.dir) {
          glbFile = file;
          break;
        }
      }
      
      if (!glbFile) {
        setError('No .glb file found in ZIP');
        return;
      }
      
      const glbBlob = await glbFile.async('blob');
      const url = URL.createObjectURL(glbBlob);
      
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          // Ensure all materials and textures are properly initialized
          gltf.scene.traverse((child) => {
            if (child.isMesh && child.material) {
              const mat = child.material;
              // Check and fix all texture maps
              const textureProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'bumpMap', 'displacementMap', 'alphaMap'];
              
              textureProps.forEach(prop => {
                try {
                  if (mat[prop] && (!mat[prop].source || mat[prop].source === undefined)) {
                    mat[prop] = null;
                  }
                } catch (e) {
                  mat[prop] = null;
                }
              });
              
              // Force material update
              mat.needsUpdate = true;
            }
          });
          setScene(gltf.scene);
        },
        undefined,
        (error) => {
          console.error('Error loading GLB:', error);
          setError('Failed to load 3D model');
        }
      );
    } catch (error) {
      console.error('Failed to load model:', error);
      setError(error.message);
    }
  };

  if (error) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" opacity={0.3} transparent />
      </mesh>
    );
  }

  if (!scene) return null;
  
  return <primitive object={scene} scale={2} position={[0, -1, 0]} />;
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