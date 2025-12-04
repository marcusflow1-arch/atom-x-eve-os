import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Maximize2, Cpu, Wifi, HardDrive, Gamepad2, Play, Settings, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOADING_STEPS = [
  { text: 'Initializing System...', duration: 800 },
  { text: 'Loading Assets...', duration: 1200 },
  { text: 'Optimizing Shaders...', duration: 1500 },
  { text: 'Connecting to Services...', duration: 1000 },
  { text: 'Synchronizing Save Data...', duration: 800 },
  { text: 'Ready', duration: 500 }
];

export default function GameLauncherOverlay({ game, onClose }) {
  const [loadingStep, setLoadingStep] = useState(0);
  const [isLaunched, setIsLaunched] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);

  useEffect(() => {
    let currentStep = 0;
    let progress = 0;
    
    const stepInterval = setInterval(() => {
      if (currentStep < LOADING_STEPS.length) {
        setLoadingStep(currentStep);
        currentStep++;
      } else {
        clearInterval(stepInterval);
        setTimeout(() => setIsLaunched(true), 500);
      }
    }, 1000);

    const progressInterval = setInterval(() => {
      if (progress < 100) {
        progress += 2;
        setLaunchProgress(Math.min(progress, 100));
      } else {
        clearInterval(progressInterval);
      }
    }, 50);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  if (isMinimized) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4 flex items-center gap-4 max-w-sm"
      >
        <div className="relative w-12 h-12 rounded overflow-hidden">
          <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-green-500/20 animate-pulse" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-white text-sm truncate">{game.title}</h4>
          <p className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Running
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => setIsMinimized(false)} title="Restore">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose} title="Close Game" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <Power className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <img 
          src={game.banner || game.cover_image || game.cover} 
          alt="Background" 
          className="w-full h-full object-cover opacity-30 blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {!isLaunched ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl text-center"
            >
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                src={game.cover_image || game.cover}
                alt={game.title}
                className="w-48 h-64 object-cover rounded-lg shadow-2xl mx-auto mb-8 border border-slate-700"
              />
              
              <h2 className="text-4xl font-black text-white mb-2 tracking-tight">{game.title}</h2>
              <p className="text-slate-400 mb-8 text-lg">{LOADING_STEPS[Math.min(loadingStep, LOADING_STEPS.length - 1)]?.text}</p>

              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                <motion.div 
                  className="absolute top-0 left-0 bottom-0 bg-blue-500"
                  style={{ width: `${launchProgress}%` }}
                />
              </div>

              <div className="flex justify-center gap-8 text-sm text-slate-500 font-mono">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  <span>CPU: 32%</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  <span>MEM: 4.2GB</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  <span>NET: CONNECTED</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <div className="flex-1 w-full flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-black text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                    GAME RUNNING
                  </h1>
                  <p className="text-xl text-slate-300 mb-8">Press Shift + Tab for Overlay</p>
                  
                  <div className="flex gap-4 justify-center">
                    <Button 
                      size="lg" 
                      className="bg-white text-black hover:bg-slate-200 font-bold px-8"
                    >
                      <Gamepad2 className="w-5 h-5 mr-2" />
                      Resume Game
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => setIsMinimized(true)}
                    >
                      <Minimize2 className="w-5 h-5 mr-2" />
                      Minimize
                    </Button>
                    <Button 
                      size="lg" 
                      variant="destructive"
                      onClick={onClose}
                    >
                      <X className="w-5 h-5 mr-2" />
                      Quit Game
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Fake HUD Elements */}
              <div className="absolute top-8 left-8 flex items-center gap-4">
                <div className="bg-black/50 backdrop-blur-md p-2 rounded-lg border border-white/10 text-green-400 font-mono text-sm">
                  FPS: 144
                </div>
                <div className="bg-black/50 backdrop-blur-md p-2 rounded-lg border border-white/10 text-blue-400 font-mono text-sm">
                  PING: 24ms
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}