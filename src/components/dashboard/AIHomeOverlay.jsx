import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, X, Play, Code, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AIHomeOverlay({ onClose }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-[120] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md"
      >
        <X className="w-5 h-5" />
      </button>

      <iframe 
        src="http://localhost:3110/"
        className="w-full h-full border-none"
        title="Local Web App"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </motion.div>
  );
}