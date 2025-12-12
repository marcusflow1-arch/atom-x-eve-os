import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, X, Play, Code, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AdvancedModel3DViewer from '@/components/3d/AdvancedModel3DViewer';

export default function AIHomeOverlay({ onClose }) {
  const [viewMode, setViewMode] = useState('iframe'); // 'iframe' or '3d'
  const webAppUrl = "https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/1d902378c_webpackconfig.zip";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col"
    >
      {/* Header Controls */}
      <div className="absolute top-6 left-6 right-6 z-[120] flex items-center justify-between">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10">
          <button
            onClick={() => setViewMode('iframe')}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
              viewMode === 'iframe' 
                ? 'bg-blue-600 text-white' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            Web View
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
              viewMode === '3d' 
                ? 'bg-purple-600 text-white' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            3D View
          </button>
        </div>

        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full h-full relative pt-20">
        {viewMode === 'iframe' ? (
          <iframe 
            src={webAppUrl}
            className="w-full h-full border-none rounded-3xl"
            title="Web App Viewer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full relative">
            <AdvancedModel3DViewer modelUrl={webAppUrl} />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl rounded-full px-6 py-3 border border-white/20">
              <p className="text-white/80 text-sm font-medium">
                Interactive 3D Environment • Drag to rotate • Scroll to zoom
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}