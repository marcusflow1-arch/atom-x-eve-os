import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function LauncherBoot({ onComplete }) {
  const [stage, setStage] = useState('boot'); // 'boot', 'handshake', 'complete'
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (stage === 'boot') {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setStage('handshake');
            return 100;
          }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'handshake') {
      const timer = setTimeout(() => {
        onComplete();
      }, 4000); // 4 seconds for handshake
      return () => clearTimeout(timer);
    }
  }, [stage, onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {stage === 'boot' && (
          <motion.div
            key="boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-8 relative">
              <Bot className="w-8 h-8 text-white/50" />
              <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
              <div 
                className="absolute inset-0 border-2 border-cyan-500 rounded-full border-t-transparent animate-spin" 
                style={{ animationDuration: '1s' }}
              />
            </div>
            <h2 className="text-white font-medium text-lg tracking-widest uppercase mb-2">Atom x Eve</h2>
            <p className="text-white/40 text-xs font-mono">Syncing system core... {loadingProgress}%</p>
          </motion.div>
        )}

        {stage === 'handshake' && (
          <motion.div
            key="handshake"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center max-w-md p-8"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
              <Bot className="w-12 h-12 text-cyan-400" />
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold text-white mb-2">Welcome back, User.</h3>
              <p className="text-cyan-200/80 text-lg font-medium leading-relaxed">
                "Synchronizing your cards, achievements, and world state."
              </p>
            </motion.div>

            <motion.div 
              className="mt-8 flex flex-col gap-2 w-full max-w-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between text-xs text-white/40 py-1 border-b border-white/5">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Identity</span>
                <span className="font-mono text-green-500">VERIFIED</span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/40 py-1 border-b border-white/5">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> License</span>
                <span className="font-mono text-green-500">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/40 py-1 border-b border-white/5">
                <span className="flex items-center gap-2"><RefreshCw className="w-3 h-3 text-cyan-500 animate-spin" /> Card Integrity</span>
                <span className="font-mono text-white/60">CHECKING...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}