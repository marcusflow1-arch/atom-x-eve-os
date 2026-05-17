import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, LogOut, Play, Volume2, VolumeX, Monitor, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Pause / system menu — toggled by Escape inside the game world.
 * Liquid-glass finish with:
 *  - Game theme volume slider (live)
 *  - Graphics settings (quality preset, shadows, fps cap)
 *  - Logout
 */
export default function PauseMenu({ open, onClose, volume, onVolumeChange }) {
  const [view, setView] = useState('main'); // 'main' | 'graphics'
  const [graphics, setGraphics] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('game_graphics_settings') || 'null') || {
        quality: 'high',
        shadows: true,
        fpsCap: 60,
      };
    } catch {
      return { quality: 'high', shadows: true, fpsCap: 60 };
    }
  });

  const updateGraphics = (next) => {
    setGraphics(next);
    localStorage.setItem('game_graphics_settings', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('graphicsSettingsChanged', { detail: next }));
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  // Reset to main view whenever menu closes
  React.useEffect(() => {
    if (!open) setView('main');
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(10,15,25,0.55) 0%, rgba(2,4,8,0.85) 100%)',
            backdropFilter: 'blur(24px) saturate(140%)',
            WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          }}
        >
          <motion.div
            initial={{ scale: 0.94, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 24, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className="relative w-[460px] rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 30px 90px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.2)',
            }}
          >
            {/* Liquid sheen */}
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background: 'radial-gradient(ellipse at top left, rgba(180,220,255,0.18), transparent 50%), radial-gradient(ellipse at bottom right, rgba(120,180,255,0.10), transparent 60%)',
              }}
            />

            {/* Header */}
            <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <div className="text-[10px] text-white/50 font-bold tracking-[0.3em] uppercase">
                  {view === 'graphics' ? 'Settings' : 'Settings'}
                </div>
                <div className="text-xl font-bold text-white tracking-wider drop-shadow">
                  {view === 'graphics' ? 'Graphics' : 'Game Settings'}
                </div>
              </div>
              <button
                onClick={view === 'graphics' ? () => setView('main') : onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <X className="w-4 h-4 text-white/80" />
              </button>
            </div>

            {/* Body */}
            <div className="relative p-5 space-y-4">
              {view === 'main' && (
                <>
                  {/* Volume slider */}
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {volume > 0 ? (
                          <Volume2 className="w-4 h-4 text-cyan-300" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-white/50" />
                        )}
                        <span className="text-white font-semibold text-sm">Game Theme</span>
                      </div>
                      <span className="text-cyan-300 font-mono text-sm tabular-nums">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <MenuButton icon={Play} label="Close Settings" hint="Esc" onClick={onClose} accent="cyan" />
                  <MenuButton
                    icon={Monitor}
                    label="Graphics Settings"
                    hint={`${graphics.quality} · ${graphics.fpsCap}fps`}
                    onClick={() => setView('graphics')}
                    accent="white"
                    chevron
                  />
                  <MenuButton icon={LogOut} label="Logout" hint="Sign out of account" onClick={handleLogout} accent="red" />
                </>
              )}

              {view === 'graphics' && (
                <GraphicsPanel graphics={graphics} onChange={updateGraphics} />
              )}
            </div>

            {/* Footer hint */}
            <div className="relative px-6 py-3 border-t border-white/10 text-center">
              <span className="text-[10px] text-white/40 font-mono tracking-wider">
                Press ESC to {view === 'graphics' ? 'go back' : 'close'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuButton({ icon: Icon, label, hint, onClick, accent = 'white', chevron = false }) {
  const accents = {
    cyan:  { bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.30)', icon: 'text-cyan-300', glow: '0 0 20px rgba(34,211,238,0.15)' },
    red:   { bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.30)', icon: 'text-red-300', glow: '0 0 20px rgba(248,113,113,0.15)' },
    white: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.14)', icon: 'text-white/85', glow: 'none' },
  };
  const a = accents[accent] || accents.white;
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.02] text-left"
      style={{
        background: a.bg,
        border: `1px solid ${a.border}`,
        backdropFilter: 'blur(20px)',
        boxShadow: a.glow,
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Icon className={`w-5 h-5 ${a.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold text-sm">{label}</div>
        <div className="text-white/50 text-xs">{hint}</div>
      </div>
      {chevron && <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition" />}
    </button>
  );
}

function GraphicsPanel({ graphics, onChange }) {
  const qualities = ['low', 'medium', 'high', 'ultra'];
  const fpsCaps = [30, 60, 120, 144];

  return (
    <div className="space-y-3">
      {/* Quality */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Quality Preset</div>
        <div className="grid grid-cols-4 gap-2">
          {qualities.map((q) => (
            <button
              key={q}
              onClick={() => onChange({ ...graphics, quality: q })}
              className="px-2 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{
                background: graphics.quality === q ? 'rgba(34,211,238,0.20)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${graphics.quality === q ? 'rgba(34,211,238,0.50)' : 'rgba(255,255,255,0.10)'}`,
                color: graphics.quality === q ? '#a5f3fc' : 'rgba(255,255,255,0.7)',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Shadows */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div>
          <div className="text-white font-semibold text-sm">Shadows</div>
          <div className="text-white/50 text-xs">Dynamic shadow rendering</div>
        </div>
        <button
          onClick={() => onChange({ ...graphics, shadows: !graphics.shadows })}
          className="relative w-12 h-6 rounded-full transition-all"
          style={{
            background: graphics.shadows ? 'rgba(34,211,238,0.40)' : 'rgba(255,255,255,0.10)',
            border: `1px solid ${graphics.shadows ? 'rgba(34,211,238,0.60)' : 'rgba(255,255,255,0.20)'}`,
          }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
            style={{ left: graphics.shadows ? '26px' : '2px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
          />
        </button>
      </div>

      {/* FPS Cap */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">FPS Cap</div>
        <div className="grid grid-cols-4 gap-2">
          {fpsCaps.map((f) => (
            <button
              key={f}
              onClick={() => onChange({ ...graphics, fpsCap: f })}
              className="px-2 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: graphics.fpsCap === f ? 'rgba(34,211,238,0.20)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${graphics.fpsCap === f ? 'rgba(34,211,238,0.50)' : 'rgba(255,255,255,0.10)'}`,
                color: graphics.fpsCap === f ? '#a5f3fc' : 'rgba(255,255,255,0.7)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}