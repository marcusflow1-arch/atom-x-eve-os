import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, LogOut, Play, Volume2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Pause / system menu — toggled by the Escape key from GameWorld3D.
 * Provides Resume, Settings (placeholder), and Logout actions.
 */
export default function PauseMenu({ open, onClose, onOpenSettings }) {
  const handleLogout = async () => {
    try {
      await base44.auth.logout();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(5, 8, 14, 0.78)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 240 }}
            className="relative w-[400px] rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(20,28,42,0.95) 0%, rgba(12,16,24,0.95) 100%)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <div className="text-[10px] text-white/40 font-bold tracking-[0.3em] uppercase">System</div>
                <div className="text-lg font-bold text-white tracking-wider">Game Paused</div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-2">
              <MenuButton icon={Play} label="Resume" hint="Esc" onClick={onClose} accent="cyan" />
              <MenuButton icon={Settings} label="Settings" hint="Audio · Controls" onClick={onOpenSettings} accent="white" />
              <MenuButton icon={LogOut} label="Logout" hint="Sign out of account" onClick={handleLogout} accent="red" />
            </div>

            {/* Footer hint */}
            <div className="px-6 py-3 border-t border-white/5 text-center">
              <span className="text-[10px] text-white/30 font-mono tracking-wider">Press ESC to resume</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuButton({ icon: Icon, label, hint, onClick, accent = 'white' }) {
  const accents = {
    cyan: { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.25)', icon: 'text-cyan-300' },
    red:  { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', icon: 'text-red-300' },
    white:{ bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)', icon: 'text-white/80' },
  };
  const a = accents[accent] || accents.white;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.02] text-left"
      style={{ background: a.bg, border: `1px solid ${a.border}` }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <Icon className={`w-5 h-5 ${a.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold text-sm">{label}</div>
        <div className="text-white/40 text-xs">{hint}</div>
      </div>
    </button>
  );
}