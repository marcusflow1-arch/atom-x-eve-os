import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConsoleHub from './ConsoleHub';

export default function ConsoleHubOverlay({ isVisible, onClose }) {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[95vw] h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Console Hub</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Console Hub Content */}
          <div className="w-full h-full pt-16">
            <ConsoleHub />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}