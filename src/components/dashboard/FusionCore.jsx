import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Activity, AlertTriangle, Clock, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const HardwareCard = ({ icon: Icon, label, value, rank, color }) => (
  <div className="bg-slate-900/80 rounded-lg p-4 border-2 border-orange-500/30 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
    <div className="relative flex items-center gap-3">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-slate-400 text-xs font-semibold">{label}</p>
        <p className="text-white text-xl font-black">{value}</p>
        <Badge className="mt-1 bg-orange-500/20 text-orange-400 border-orange-500/50">
          {rank}
        </Badge>
      </div>
    </div>
  </div>
);

const PerkNode = ({ perk, unlocked, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
      unlocked
        ? 'bg-orange-600/30 border-orange-500 shadow-lg shadow-orange-500/30'
        : 'bg-slate-800/50 border-slate-700 hover:border-orange-500/50'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded ${unlocked ? 'bg-orange-500' : 'bg-slate-700'}`}>
        {perk.icon}
      </div>
      <div className="flex-1">
        <h4 className={`font-bold text-sm mb-1 ${unlocked ? 'text-orange-400' : 'text-slate-300'}`}>
          {perk.name}
        </h4>
        <p className="text-xs text-slate-400">{perk.description}</p>
      </div>
    </div>
    {unlocked && (
      <div className="absolute top-1 right-1">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
      </div>
    )}
  </motion.div>
);

export default function FusionCore() {
  const [isScanning, setIsScanning] = useState(false);
  const [systemScore, setSystemScore] = useState(null);
  const [fusionRate, setFusionRate] = useState(0);
  const [unlockedPerks, setUnlockedPerks] = useState([]);

  const hardwareSpecs = [
    { icon: Cpu, label: 'CPU', value: 'Ryzen 9 5950X', rank: 'S-Rank', color: 'bg-orange-600' },
    { icon: Activity, label: 'GPU', value: 'RTX 4090', rank: 'S-Rank', color: 'bg-orange-500' },
    { icon: Zap, label: 'RAM', value: '64GB DDR5', rank: 'A-Rank', color: 'bg-orange-400' }
  ];

  const perks = [
    {
      id: 1,
      name: 'Emergency Reboot',
      icon: <AlertTriangle className="w-4 h-4 text-white" />,
      description: 'Regain 30% of Fusion Meter instantly if HP drops to critical'
    },
    {
      id: 2,
      name: 'Hardware Acceleration',
      icon: <Zap className="w-4 h-4 text-white" />,
      description: '+15% Attack Speed when Fusion is active'
    },
    {
      id: 3,
      name: 'Thermal Venting',
      icon: <Clock className="w-4 h-4 text-white" />,
      description: 'Fusion Mode lasts 5 seconds longer'
    }
  ];

  const runStressTest = () => {
    setIsScanning(true);
    setSystemScore(null);
    
    setTimeout(() => {
      setSystemScore('S-RANK');
      setFusionRate(95);
      setIsScanning(false);
    }, 3000);
  };

  const togglePerk = (perkId) => {
    setUnlockedPerks(prev => 
      prev.includes(perkId) 
        ? prev.filter(id => id !== perkId)
        : [...prev, perkId]
    );
  };

  return (
    <div className="p-6 space-y-6 bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
            AI FUSION CORE
          </h2>
          <p className="text-slate-400 mt-1">Ultimate System Override Protocol</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-lg border border-orange-500/30">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-orange-400 font-bold text-sm">CORE ACTIVE</span>
        </div>
      </div>

      {/* Section A: Hardware Resonance */}
      <div className="bg-slate-800/30 rounded-xl p-6 border-2 border-orange-500/20">
        <h3 className="text-orange-400 font-bold text-xl mb-4 flex items-center gap-2">
          <Cpu className="w-6 h-6" />
          Hardware Resonance
        </h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {hardwareSpecs.map((spec, i) => (
            <HardwareCard key={i} {...spec} />
          ))}
        </div>

        <div className="relative">
          <Button
            onClick={runStressTest}
            disabled={isScanning}
            className="w-full h-16 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black text-lg relative overflow-hidden"
          >
            {isScanning ? (
              <>
                <span className="relative z-10">ANALYZING SYSTEM...</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </>
            ) : (
              'RUN SYSTEM STRESS TEST'
            )}
          </Button>

          {/* Matrix Scanning Animation */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 to-transparent animate-pulse" />
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 100, opacity: [0, 1, 0] }}
                    transition={{ duration: 1, delay: i * 0.05, repeat: 3 }}
                    className="absolute w-1 h-4 bg-orange-500"
                    style={{ left: `${i * 5}%` }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {systemScore && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="mt-4 p-4 bg-gradient-to-r from-orange-600/30 to-red-600/30 rounded-lg border-2 border-orange-500 text-center"
          >
            <p className="text-orange-400 text-sm font-semibold mb-1">SYSTEM POTENTIAL</p>
            <p className="text-white text-3xl font-black">{systemScore} HARDWARE DETECTED</p>
          </motion.div>
        )}
      </div>

      {/* Section B: Fusion Gauge */}
      <div className="bg-slate-800/30 rounded-xl p-6 border-2 border-orange-500/20">
        <h3 className="text-orange-400 font-bold text-xl mb-4 flex items-center gap-2">
          <Gauge className="w-6 h-6" />
          Fusion Sync Rate
        </h3>

        <div className="flex items-center justify-center gap-8">
          {/* Circular Progress */}
          <div className="relative w-48 h-48">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-slate-700"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - fusionRate / 100)}`}
                className="transition-all duration-1000"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-5xl font-black text-orange-500">{fusionRate}%</span>
              <span className="text-xs text-slate-400 mt-1">SYNC RATE</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-orange-500/30">
              <p className="text-slate-400 text-sm mb-3">
                <span className="text-orange-400 font-bold">Higher PC Specs</span> = 
                <span className="text-orange-400 font-bold"> Higher Base Sync Rate</span>
              </p>
              <Progress value={fusionRate} className="h-3 mb-2" />
              <p className="text-xs text-slate-500">
                Current Hardware: <span className="text-orange-400 font-bold">S-Rank Configuration</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section C: Overclock Tree */}
      <div className="bg-slate-800/30 rounded-xl p-6 border-2 border-orange-500/20">
        <h3 className="text-orange-400 font-bold text-xl mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Overclock Tree
        </h3>

        <div className="grid grid-cols-3 gap-4">
          {perks.map((perk) => (
            <PerkNode
              key={perk.id}
              perk={perk}
              unlocked={unlockedPerks.includes(perk.id)}
              onClick={() => togglePerk(perk.id)}
            />
          ))}
        </div>

        <div className="mt-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
          <p className="text-xs text-slate-400 text-center">
            <span className="text-orange-400 font-bold">{unlockedPerks.length}/3</span> Perks Active
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}