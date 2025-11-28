import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Activity, Wifi, HardDrive, Thermometer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const StatCard = ({ icon: Icon, label, value, max, color, unit = '%' }) => {
  const percentage = (value / max) * 100;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-slate-400 text-sm">{label}</h3>
          <p className="text-2xl font-bold text-white">
            {value}{unit}
          </p>
        </div>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-slate-500 mt-2">Max: {max}{unit}</p>
    </motion.div>
  );
};

const CircularGauge = ({ value, max, label, color }) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-700"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={color}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl font-bold text-white">{value}</span>
          <span className="text-xs text-slate-400">/ {max}</span>
        </div>
      </div>
      <p className="text-sm text-slate-300 mt-3 font-semibold">{label}</p>
    </div>
  );
};

export default function CommandCenter() {
  const [stats, setStats] = useState({
    cpu: 45,
    gpu: 68,
    ram: 12.4,
    network: 850,
    storage: 67,
    temp: 72
  });

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        cpu: Math.min(100, Math.max(20, prev.cpu + (Math.random() - 0.5) * 10)),
        gpu: Math.min(95, Math.max(50, prev.gpu + (Math.random() - 0.5) * 8)),
        ram: Math.min(16, Math.max(8, prev.ram + (Math.random() - 0.5) * 0.5)),
        network: Math.min(1000, Math.max(500, prev.network + (Math.random() - 0.5) * 100)),
        storage: prev.storage,
        temp: Math.min(85, Math.max(65, prev.temp + (Math.random() - 0.5) * 3))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">COMMAND CENTER</h2>
          <p className="text-slate-400">Real-time system monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-green-400 font-semibold">Systems Nominal</span>
        </div>
      </div>

      {/* Circular Gauges */}
      <div className="grid grid-cols-3 gap-6 bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <CircularGauge value={Math.round(stats.cpu)} max={100} label="CPU Load" color="text-blue-500" />
        <CircularGauge value={Math.round(stats.gpu)} max={100} label="GPU Usage" color="text-purple-500" />
        <CircularGauge value={stats.ram.toFixed(1)} max={16} label="RAM (GB)" color="text-cyan-500" />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Cpu}
          label="Processor Load"
          value={Math.round(stats.cpu)}
          max={100}
          color="bg-blue-600"
        />
        <StatCard
          icon={Zap}
          label="Graphics Processing"
          value={Math.round(stats.gpu)}
          max={100}
          color="bg-purple-600"
        />
        <StatCard
          icon={Wifi}
          label="Network Speed"
          value={Math.round(stats.network)}
          max={1000}
          color="bg-green-600"
          unit=" Mbps"
        />
        <StatCard
          icon={Thermometer}
          label="GPU Temperature"
          value={Math.round(stats.temp)}
          max={85}
          color="bg-orange-600"
          unit="°C"
        />
      </div>

      {/* Storage Overview */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <HardDrive className="w-6 h-6 text-cyan-400" />
          <h3 className="text-white font-bold text-lg">Storage</h3>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">System Drive (C:)</span>
              <span className="text-white font-semibold">{stats.storage}% Used</span>
            </div>
            <Progress value={stats.storage} className="h-3" />
            <p className="text-xs text-slate-500 mt-1">670 GB / 1 TB</p>
          </div>
        </div>
      </div>
    </div>
  );
}