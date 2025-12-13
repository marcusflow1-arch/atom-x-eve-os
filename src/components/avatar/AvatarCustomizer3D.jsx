import React, { Suspense, useState, ErrorBoundary } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import AvatarModel from './AvatarModel';
import CustomizationSidebar from './CustomizationSidebar';

function CustomModel({ modelUrl }) {
  const [model, setModel] = React.useState(null);
  
  React.useEffect(() => {
    const loader = new GLTFLoader();
    
    loader.load(
      modelUrl,
      (gltf) => {
        if (gltf?.scene) {
          // Clean up materials and textures
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              child.frustumCulled = false;
              
              if (child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                
                materials.forEach(mat => {
                  if (!mat) return;
                  
                  // Clean up any textures without valid sources
                  ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'bumpMap', 'displacementMap'].forEach(mapType => {
                    if (mat[mapType] && (!mat[mapType].source || !mat[mapType].image)) {
                      mat[mapType] = null;
                    }
                  });
                  
                  mat.needsUpdate = true;
                });
              }
            }
          });
          
          setModel(gltf.scene);
        }
      },
      undefined,
      (error) => {
        console.error('Error loading GLB:', error);
        setModel(null);
      }
    );
  }, [modelUrl]);
  
  return model ? <primitive object={model} /> : null;
}

function ModelErrorBoundary({ children }) {
  return (
    <React.Suspense fallback={null}>
      {children}
    </React.Suspense>
  );
}

function Scene({ customModelUrl }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.5, 3]} fov={50} />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={5}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0.5, 0]}
      />
      
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} />
      <pointLight position={[0, 2, 0]} intensity={0.3} />
      
      <ModelErrorBoundary>
        {customModelUrl ? (
          <CustomModel modelUrl={customModelUrl} />
        ) : (
          <AvatarModel />
        )}
      </ModelErrorBoundary>
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.1} roughness={0.9} />
      </mesh>
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-white/60 text-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm">Loading Avatar Studio...</p>
      </div>
    </div>
  );
}

export default function AvatarCustomizer3D({ onClose }) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [error, setError] = useState(null);
  const [customModelUrl, setCustomModelUrl] = useState(null);
  const fileInputRef = React.useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.glb')) {
      try {
        const url = URL.createObjectURL(file);
        setCustomModelUrl(url);
        setError(null);
      } catch (err) {
        console.error('Error loading file:', err);
        setError('Failed to load model file');
      }
    } else {
      alert('Please upload a .glb file');
    }
  };
  
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load Avatar Studio</p>
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50"
      style={{
        background: 'radial-gradient(circle at center, #1f1f1f 0%, #0a0a0a 100%)'
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-8 left-8 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors border border-white/10"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Upload Model Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="absolute top-8 left-24 z-50 w-12 h-12 rounded-full bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-md flex items-center justify-center transition-colors border border-blue-400/30"
        title="Upload your own .glb model"
      >
        <Upload className="w-6 h-6 text-blue-300" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Toggle Sidebar Button */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="absolute top-8 right-8 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors border border-white/10"
        >
          <User className="w-6 h-6 text-white" />
        </button>
      )}
      
      {/* Title */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Avatar Studio</h1>
        <p className="text-white/60 text-sm">Customize your character appearance</p>
      </div>
      
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            gl={{ 
              antialias: true,
              alpha: true,
              powerPreference: "high-performance"
            }}
            dpr={[1, 2]}
            onCreated={({ gl }) => {
              gl.setClearColor('#000000', 0);
            }}
            onError={(error) => {
              console.error('Canvas error:', error);
              setError('Failed to render 3D model');
            }}
          >
            <Scene customModelUrl={customModelUrl} />
          </Canvas>
        </Suspense>
      </div>
      
      {/* Customization Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <CustomizationSidebar onClose={() => setShowSidebar(false)} />
        )}
      </AnimatePresence>
      
      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-white/40 text-sm">
          Click and drag to rotate • Scroll to zoom
        </p>
      </div>
    </motion.div>
  );
}