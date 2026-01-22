import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Eye, Package, ArrowLeft } from 'lucide-react';
import ActiveCardDisplay from './ActiveCardDisplay';
import ForgeView from './ForgeView';
import InspectView from './InspectView';
import ManageView from './ManageView';
import { Button } from '@/components/ui/button';

export default function AchievementWorkspace({ card, onClose, initialMode = 'forge' }) {
  const [mode, setMode] = useState(initialMode); // forge, inspect, manage
  const [liveStats, setLiveStats] = useState(null);

  // Update stats from Forge to Display
  const handleStatsUpdate = (stats) => {
    setLiveStats(stats);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0f1419] text-white flex flex-col"
    >
      {/* Top Navigation Bar */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 text-white/60">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="h-8 w-px bg-white/10" />
          <h1 className="text-lg font-bold tracking-wide text-white/90">Workstation</h1>
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
          <ModeToggle 
            active={mode === 'forge'} 
            onClick={() => setMode('forge')} 
            icon={Hammer} 
            label="Forge" 
            color="text-orange-400" 
            activeBg="bg-orange-500/20" 
            activeBorder="border-orange-500/50"
          />
          <ModeToggle 
            active={mode === 'inspect'} 
            onClick={() => setMode('inspect')} 
            icon={Eye} 
            label="Inspect" 
            color="text-blue-400" 
            activeBg="bg-blue-500/20" 
            activeBorder="border-blue-500/50"
          />
          <ModeToggle 
            active={mode === 'manage'} 
            onClick={() => setMode('manage')} 
            icon={Package} 
            label="Manage" 
            color="text-slate-300" 
            activeBg="bg-slate-500/20" 
            activeBorder="border-slate-500/50"
          />
        </div>

        <div className="w-32" /> {/* Spacer for balance */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Active Card Display (30-35%) */}
        <div className="w-[30%] h-full relative z-10">
          <ActiveCardDisplay card={card} stats={liveStats} />
        </div>

        {/* Right Side: Modular Workspace (70%) */}
        <div className="flex-1 h-full relative z-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          
          <AnimatePresence mode="wait">
            {mode === 'forge' && (
              <motion.div 
                key="forge"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="h-full w-full"
              >
                <ForgeView card={card} onStatsUpdate={handleStatsUpdate} />
              </motion.div>
            )}

            {mode === 'inspect' && (
              <motion.div 
                key="inspect"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full"
              >
                <InspectView card={card} />
              </motion.div>
            )}

            {mode === 'manage' && (
              <motion.div 
                key="manage"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full"
              >
                <ManageView card={card} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}

function ModeToggle({ active, onClick, icon: Icon, label, color, activeBg, activeBorder }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 border
        ${active 
          ? `${activeBg} ${activeBorder} ${color} shadow-lg` 
          : 'bg-transparent border-transparent text-white/40 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <Icon className={`w-4 h-4 ${active ? 'fill-current' : ''}`} />
      <span className="font-bold text-sm uppercase tracking-wide">{label}</span>
    </button>
  );
}