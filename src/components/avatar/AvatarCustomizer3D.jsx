import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X } from 'lucide-react';
import AvatarModel from './AvatarModel';
import CustomizationSidebar from './CustomizationSidebar';

function Scene() {
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
      
      <Environment preset="studio" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      
      <Suspense fallback={null}>
        <AvatarModel />
      </Suspense>
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.1} roughness={0.9} />
      </mesh>
    </>
  );
}

export default function AvatarCustomizer3D({ onClose }) {
  const [showSidebar, setShowSidebar] = useState(true);
  
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
        <Canvas shadows>
          <Scene />
        </Canvas>
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