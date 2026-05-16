import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Monitor } from 'lucide-react';

export default function GameSettingsMenu({ isOpen, onClose, onSettingsChange }) {
  const [soundVolume, setSoundVolume] = useState(() => {
    return parseFloat(localStorage.getItem('gameVolume') || '1.0');
  });
  const [graphicsLevel, setGraphicsLevel] = useState(() => {
    return localStorage.getItem('graphicsLevel') || 'high';
  });

  const graphicsLevels = [
    { value: 'low', label: 'Low', description: 'Reduced shadows, lower LOD, minimal effects' },
    { value: 'medium', label: 'Medium', description: 'Balanced quality and performance' },
    { value: 'high', label: 'High', description: 'Full quality, all effects enabled' },
  ];

  const handleVolumeChange = (e) => {
    const volume = parseFloat(e.target.value);
    setSoundVolume(volume);
    localStorage.setItem('gameVolume', volume);
    onSettingsChange?.({ soundVolume: volume, graphicsLevel });
  };

  const handleGraphicsChange = (level) => {
    setGraphicsLevel(level);
    localStorage.setItem('graphicsLevel', level);
    onSettingsChange?.({ soundVolume, graphicsLevel: level });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md rounded-2xl p-6 border border-white/20"
              style={{
                background: 'rgba(15, 25, 40, 0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white tracking-wider">SETTINGS</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sound Settings */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Master Volume</h3>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={soundVolume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-sm font-bold text-cyan-400 w-8 text-right">
                    {Math.round(soundVolume * 100)}%
                  </span>
                </div>
              </div>

              {/* Graphics Settings */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Graphics Quality</h3>
                </div>
                <div className="space-y-2">
                  {graphicsLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => handleGraphicsChange(level.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-all text-left ${
                        graphicsLevel === level.value
                          ? 'bg-cyan-500/20 border-cyan-400/60 text-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="font-semibold">{level.label}</div>
                      <div className="text-xs text-white/50 mt-0.5">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-white/40 text-center">
                  Graphics changes take effect immediately
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}