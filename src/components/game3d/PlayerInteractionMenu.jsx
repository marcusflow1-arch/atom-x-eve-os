import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, UserPlus, ArrowLeftRight, Users, X } from 'lucide-react';

/**
 * PlayerInteractionMenu — pops up at screen coordinates when the user
 * middle-clicks another player in the world. Shows 4 actions:
 * Duel, Add Friend, Trade, Party Up.
 */
export default function PlayerInteractionMenu({ open, x, y, player, onClose, onAction }) {
  if (!player) return null;

  const actions = [
    { id: 'duel', label: 'Duel', icon: Swords, color: 'text-red-300', bg: 'hover:bg-red-500/20' },
    { id: 'friend', label: 'Add Friend', icon: UserPlus, color: 'text-emerald-300', bg: 'hover:bg-emerald-500/20' },
    { id: 'trade', label: 'Trade', icon: ArrowLeftRight, color: 'text-amber-300', bg: 'hover:bg-amber-500/20' },
    { id: 'party', label: 'Party Up', icon: Users, color: 'text-cyan-300', bg: 'hover:bg-cyan-500/20' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Click-outside backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
            onContextMenu={(e) => { e.preventDefault(); onClose(); }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 w-52 rounded-xl overflow-hidden"
            style={{
              left: Math.min(x, window.innerWidth - 220),
              top: Math.min(y, window.innerHeight - 240),
              background: 'rgba(10, 14, 22, 0.92)',
              backdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(59, 130, 246, 0.15)',
            }}
          >
            {/* Header — player name */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-blue-500/10">
              <div className="text-[11px] font-bold text-white truncate tracking-wide">
                {player.name}
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Actions */}
            <div className="py-1">
              {actions.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { onAction(a.id, player); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-white/90 transition-colors ${a.bg}`}
                >
                  <a.icon className={`w-4 h-4 ${a.color}`} />
                  <span className="font-medium">{a.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}