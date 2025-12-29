import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Shield, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';

export default function LaunchModal({ game, onClose, onLaunchComplete }) {
  const [step, setStep] = useState(0); // 0: Init, 1: Validating, 2: Token, 3: Launching
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Simulate DRM/AI checks
    const sequence = async () => {
      addLog("Initializing AI wrapper...");
      await delay(800);
      
      setStep(1);
      addLog("Validating device hash: 8f9a2b...");
      await delay(600);
      addLog("Checking ownership entitlements...");
      await delay(600);
      
      setStep(2);
      addLog("Minting session token...");
      addLog("Synchronizing card integrity...");
      await delay(800);
      
      setStep(3);
      addLog("Injecting AI context...");
      addLog("Launching executable...");
      await delay(1000);
      
      onLaunchComplete();
    };
    
    sequence();
  }, []);

  const addLog = (text) => {
    setLogs(prev => [...prev, text]);
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#151921] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-lg">Launching {game.title}</h3>
            {step < 3 ? (
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono">
                <Loader2 className="w-3 h-3 animate-spin" />
                PREPARING AI
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-400 text-xs font-mono">
                <CheckCircle2 className="w-3 h-3" />
                READY
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-2">
          {/* Main Visual */}
          <div className="relative h-32 rounded-lg bg-black/50 border border-white/5 mb-6 overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
             
             {/* Progress Steps */}
             <div className="flex items-center gap-4 relative z-10">
                <StepIcon icon={Shield} active={step >= 1} label="Secure" />
                <div className={`w-8 h-px transition-colors ${step >= 1 ? 'bg-cyan-500' : 'bg-white/10'}`} />
                <StepIcon icon={Lock} active={step >= 2} label="Token" />
                <div className={`w-8 h-px transition-colors ${step >= 2 ? 'bg-cyan-500' : 'bg-white/10'}`} />
                <StepIcon icon={Loader2} active={step >= 3} label="Launch" spin={step === 3} />
             </div>
          </div>

          {/* Console Log */}
          <div className="font-mono text-[10px] text-white/50 bg-black/40 p-3 rounded-lg border border-white/5 h-32 overflow-y-auto custom-scrollbar flex flex-col-reverse">
            {logs.slice().reverse().map((log, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -5 }} 
                animate={{ opacity: 1, x: 0 }}
                className="mb-1"
              >
                <span className="text-cyan-500 mr-2">{'>'}</span>
                {log}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/5 flex justify-between items-center">
          <p className="text-[10px] text-white/30">Session ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          <button onClick={onClose} className="text-xs text-white/40 hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const StepIcon = ({ icon: Icon, active, label, spin }) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
      active 
        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
        : 'bg-white/5 border-white/10 text-white/20'
    }`}>
      <Icon className={`w-5 h-5 ${spin ? 'animate-spin' : ''}`} />
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-white/20'}`}>
      {label}
    </span>
  </div>
);