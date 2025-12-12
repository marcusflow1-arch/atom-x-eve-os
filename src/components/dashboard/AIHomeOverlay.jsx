import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, X, Play, Code, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AIHomeOverlay({ onClose }) {
  const [embedUrl, setEmbedUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const handleLaunch = () => {
    if (embedUrl) {
      setIsPlaying(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      {/* Close Button - Always visible */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-[120] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md"
      >
        <X className="w-5 h-5" />
      </button>

      {isPlaying ? (
        <div className="flex-1 w-full h-full relative">
           <iframe 
             src={embedUrl}
             className="w-full h-full border-none"
             title="Rogue Engine Game"
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
             allowFullScreen
           />
           {/* Controls Overlay */}
           <div className="absolute top-6 left-6 z-[120] flex gap-4">
              <button 
                onClick={() => setIsPlaying(false)}
                className="px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md text-sm font-bold border border-white/10 flex items-center gap-2 transition-all"
              >
                <Settings className="w-4 h-4" /> Change Game
              </button>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {/* Background Gradient */}
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              background: 'radial-gradient(circle at center, #10b981 0%, #064e3b 40%, #022c22 80%, #000000 100%)'
            }}
          />

          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full px-6">
            
            {/* Icon */}
            <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
              <Code className="w-10 h-10 text-white" />
            </div>

            {/* Titles */}
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight">AI HOME ENGINE</h1>
            <p className="text-emerald-400 font-bold tracking-widest uppercase mb-12">Embed & Run Rogue Engine Games</p>

            {/* Input Section */}
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
               <div className="mb-6">
                 <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block text-left">Game URL / Embed Link</label>
                 <Input 
                   value={embedUrl}
                   onChange={(e) => setEmbedUrl(e.target.value)}
                   placeholder="https://..."
                   className="bg-black/40 border-white/10 text-white h-12 text-lg font-mono focus:ring-emerald-500/50"
                 />
               </div>
               
               <Button 
                 onClick={handleLaunch}
                 disabled={!embedUrl}
                 className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02]"
               >
                 <Play className="w-5 h-5 mr-2 fill-current" />
                 Launch Environment
               </Button>
            </div>
            
            <p className="mt-8 text-white/30 text-xs">
              Supports Rogue Engine builds hosted on web. Ensure the URL is accessible and supports iframe embedding.
            </p>

          </div>
        </div>
      )}
    </motion.div>
  );
}