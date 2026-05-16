import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameSettingsMenu({ isOpen, onClose, onSettingsChange }) {
  const [soundVolume, setSoundVolume] = useState(() => {
    return parseFloat(localStorage.getItem('gameVolume') || '1.0');
  });
  const [graphicsLevel, setGraphicsLevel] = useState(() => {
    return localStorage.getItem('graphicsLevel') || 'high';
  });
  const [settings, setSettings] = useState({
    showProfileNames: true,
    showNameplates: true,
    showDamageNumbers: false,
    disableClickMove: false,
    allowSkillRetargeting: true,
    stopMoveAfterDie: false,
    enableTextChat: true,
  });

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

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
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
            className="fixed inset-0 bg-black/70 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            {/* Wooden Panel Frame */}
            <div
              className="pointer-events-auto relative w-96 p-6 rounded-sm border-8 border-amber-900/40"
              style={{
                background: 'linear-gradient(135deg, #3d2817 0%, #4a3420 50%, #2d1f12 100%)',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 10px 40px rgba(0,0,0,0.9)',
                borderImage: 'linear-gradient(135deg, #8b7355 0%, #5d4037 50%, #3e2723 100%) 8',
              }}
            >
              {/* Top border accent */}
              <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600" />

              {/* Header with decorative lines */}
              <div className="text-center mb-6 pb-4 border-b-2 border-amber-700/30">
                <div className="flex justify-center items-center gap-2 mb-2">
                  <div className="w-6 h-px bg-gradient-to-r from-transparent to-amber-600" />
                  <h2 className="text-xl font-bold text-amber-100 tracking-widest uppercase">Options</h2>
                  <div className="w-6 h-px bg-gradient-to-l from-transparent to-amber-600" />
                </div>
              </div>

              {/* Settings List */}
              <div className="space-y-3 mb-6 max-h-72 overflow-y-auto">
                {/* Show Profile Names Overhead */}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-amber-100 font-medium">Show Profile Names Overhead</span>
                  <button
                    onClick={() => toggleSetting('showProfileNames')}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      settings.showProfileNames
                        ? 'bg-amber-600 border-amber-400'
                        : 'bg-transparent border-amber-700'
                    }`}
                  >
                    {settings.showProfileNames && <span className="text-amber-100 text-xs font-bold">✓</span>}
                  </button>
                </div>

                {/* Always Show Nameplates */}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-amber-100 font-medium">Always Show Nameplates</span>
                  <button
                    onClick={() => toggleSetting('showNameplates')}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      settings.showNameplates
                        ? 'bg-amber-600 border-amber-400'
                        : 'bg-transparent border-amber-700'
                    }`}
                  >
                    {settings.showNameplates && <span className="text-amber-100 text-xs font-bold">✓</span>}
                  </button>
                </div>

                {/* Show Damage Numbers */}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-amber-100 font-medium">Show Damage Numbers</span>
                  <button
                    onClick={() => toggleSetting('showDamageNumbers')}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      settings.showDamageNumbers
                        ? 'bg-amber-600 border-amber-400'
                        : 'bg-transparent border-amber-700'
                    }`}
                  >
                    {settings.showDamageNumbers && <span className="text-amber-100 text-xs font-bold">✓</span>}
                  </button>
                </div>

                {/* Disable Click-to-Move */}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-amber-100 font-medium">Disable Click-to-Move</span>
                  <button
                    onClick={() => toggleSetting('disableClickMove')}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      settings.disableClickMove
                        ? 'bg-amber-600 border-amber-400'
                        : 'bg-transparent border-amber-700'
                    }`}
                  >
                    {settings.disableClickMove && <span className="text-amber-100 text-xs font-bold">✓</span>}
                  </button>
                </div>

                {/* Allow Skill Retargeting */}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-amber-100 font-medium">Allow Skill Retargeting</span>
                  <button
                    onClick={() => toggleSetting('allowSkillRetargeting')}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      settings.allowSkillRetargeting
                        ? 'bg-amber-600 border-amber-400'
                        : 'bg-transparent border-amber-700'
                    }`}
                  >
                    {settings.allowSkillRetargeting && <span className="text-amber-100 text-xs font-bold">✓</span>}
                  </button>
                </div>

                {/* Stop Moving After Target Dies */}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-amber-100 font-medium">Stop Moving After Target Dies</span>
                  <button
                    onClick={() => toggleSetting('stopMoveAfterDie')}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      settings.stopMoveAfterDie
                        ? 'bg-amber-600 border-amber-400'
                        : 'bg-transparent border-amber-700'
                    }`}
                  >
                    {settings.stopMoveAfterDie && <span className="text-amber-100 text-xs font-bold">✓</span>}
                  </button>
                </div>

                {/* UI Scale */}
                <div className="px-3 py-3 border-t border-amber-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-amber-100 font-medium">UI Scale</span>
                    <span className="text-xs text-amber-600">Default</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="150"
                    defaultValue="100"
                    className="w-full h-1 bg-amber-900 rounded appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                {/* Safe Zone Adjust */}
                <div className="px-3 py-3 border-t border-amber-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-amber-100 font-medium">Safe Zone Adjust</span>
                    <span className="text-xs text-amber-600">Normal</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="50"
                    className="w-full h-1 bg-amber-900 rounded appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                {/* Enable Text Chat UI */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-amber-700/30 pt-3">
                  <span className="text-sm text-amber-100 font-medium">Enable Text Chat UI</span>
                  <button
                    onClick={() => toggleSetting('enableTextChat')}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      settings.enableTextChat
                        ? 'bg-amber-600 border-amber-400'
                        : 'bg-transparent border-amber-700'
                    }`}
                  >
                    {settings.enableTextChat && <span className="text-amber-100 text-xs font-bold">✓</span>}
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-center pt-4 border-t border-amber-700/30">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gradient-to-b from-amber-700 to-amber-800 border-2 border-amber-600 text-amber-100 font-bold text-sm uppercase rounded hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg"
                >
                  Key Bindings
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gradient-to-b from-amber-700 to-amber-800 border-2 border-amber-600 text-amber-100 font-bold text-sm uppercase rounded hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg"
                >
                  Video Settings
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gradient-to-b from-orange-600 to-orange-700 border-2 border-orange-500 text-orange-100 font-bold text-sm uppercase rounded hover:from-orange-500 hover:to-orange-600 transition-all shadow-lg"
                >
                  OK
                </button>
              </div>

              {/* Bottom border accent */}
              <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}