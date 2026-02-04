import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AvatarModel from './AvatarModel';
import CustomizationSidebar from './CustomizationSidebar';

// Simple Error Boundary Class to catch 3D loading errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("3D Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) return null; // Fallback UI can go here
    return this.props.children;
  }
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
      
      {/* FIX: Wrapped in proper Class ErrorBoundary + Suspense 
         FIX: Passed customModelUrl down to the model
      */}
      <ErrorBoundary>
        <Suspense fallback={null}>
           <AvatarModel modelUrl={customModelUrl} />
        </Suspense>
      </ErrorBoundary>
      
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
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
  const fileInputRef = useRef(null);
  
  // Suppress texture source errors globally
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.toString().includes('source') || args[0]?.message?.includes('source')) {
        return; 
      }
      originalError.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, []);

  const handleFileUpload = (event) => {
    // You mentioned this is disabled, but if enabled later, logic goes here:
    // const file = event.target.files[0];
    // if (file) setCustomModelUrl(URL.createObjectURL(file));
    alert('Custom model upload is temporarily disabled due to texture compatibility issues. This feature will be re-enabled soon.');
    event.target.value = '';
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
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 text-center pointer-events-none">
        <h1 className="text-3xl font-bold text-white mb-2">Avatar Studio</h1>
        <p className="text-white/60 text-sm">Customize your character appearance</p>
      </div>
      
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        {/* FIX: Moved Suspense higher up or kept inside Canvas. 
            Canvas handles Suspense internally usually, but explicitly wrapping 
            inner components is safer. */}
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
        >
            <Scene customModelUrl={customModelUrl} />
        </Canvas>
        
        {/* Loading Overlay (Separate from Canvas for better HTML rendering) */}
        <Suspense fallback={<LoadingFallback />}>
           {/* Dummy suspense trigger if needed, otherwise rely on Scene */}
           <span /> 
        </Suspense>
      </div>
      
      {/* Customization Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <CustomizationSidebar onClose={() => setShowSidebar(false)} />
        )}
      </AnimatePresence>
      
      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-white/40 text-sm">
          Click and drag to rotate • Scroll to zoom
        </p>
      </div>
    </motion.div>
  );
}