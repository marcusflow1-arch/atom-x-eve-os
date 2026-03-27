import React, { Suspense } from 'react';
import { motion } from 'framer-motion';

// Mock 3D component using existing YBotPlayerViewer or a simple placeholder
// since we don't want to break if the advanced model isn't available
const AdvancedModel3DViewer = React.lazy(() => import('@/components/3d/AdvancedModel3DViewer').catch(() => {
  return { default: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
      <div className="w-16 h-16 border-2 border-white/10 border-t-white/50 rounded-full animate-spin mb-4" />
      <p>Loading Avatar Model...</p>
    </div>
  )};
}));

export default function AvatarCreator3DViewer({ avatarConfig }) {
  // Translate our simple config to the model viewer props if needed
  
  return (
    <div className="absolute inset-0 pt-16 pb-24">
      {/* 3D Scene container */}
      <div className="w-full h-full relative" style={{ 
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
      }}>
        {/* Glow behind model */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[500px] bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <Suspense fallback={
          <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
             <div className="w-12 h-12 border-2 border-white/10 border-t-white/40 rounded-full animate-spin mb-4" />
             <p className="text-xs uppercase tracking-widest">Loading 3D Engine</p>
          </div>
        }>
          <div className="w-full h-full transform scale-125 translate-y-[10%]">
            <AdvancedModel3DViewer 
              modelUrl={avatarConfig.preset === 'eve' ? '/models/eve.glb' : '/models/ybot.fbx'} 
              autoRotate={true}
              autoRotateSpeed={0.5}
            />
          </div>
        </Suspense>
      </div>

      {/* Floating UI Elements around the character */}
      <motion.div 
        className="absolute top-[30%] left-[20%] z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-black/40 backdrop-blur-md border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-white/70 text-[10px] uppercase tracking-wider font-mono">Facial Rig Active</span>
        </div>
      </motion.div>

      <motion.div 
        className="absolute bottom-[35%] right-[20%] z-10"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-black/40 backdrop-blur-md border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-white/70 text-[10px] uppercase tracking-wider font-mono">Mesh Normalized</span>
        </div>
      </motion.div>
    </div>
  );
}