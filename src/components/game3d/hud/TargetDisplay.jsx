import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeAbilities, clearTarget } from '../abilityStore';
import { X } from 'lucide-react';

/**
 * TargetDisplay — top-center HUD showing the currently selected enemy.
 * Sits between the minimap/quest tracker and the OnlinePlayersPanel.
 */
export default function TargetDisplay() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    return subscribeAbilities((s) => setTarget(s.target));
  }, []);

  const hpPct = target ? Math.max(0, Math.min(100, (target.hp / target.maxHp) * 100)) : 0;

  const hpColor = hpPct > 50 ? '#4ade80' : hpPct > 25 ? '#facc15' : '#ef4444';

  const tierLabel = target?.tier === 'boss'
    ? 'WORLD BOSS'
    : target?.tier === 'champion'
    ? 'CHAMPION'
    : target?.tier === 'elite'
    ? 'ELITE'
    : 'ENEMY';

  const tierColor = target?.tier === 'boss'
    ? '#ff6b35'
    : target?.tier === 'champion'
    ? '#a855f7'
    : target?.tier === 'elite'
    ? '#facc15'
    : '#94a3b8';

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
          style={{ minWidth: 220 }}
        >
          <div
            className="relative px-4 py-2.5 rounded-lg"
            style={{
              background: 'linear-gradient(180deg, rgba(10,14,22,0.92) 0%, rgba(8,12,18,0.88) 100%)',
              border: '1px solid rgba(180,140,80,0.4)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 6px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Tier badge + name row */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] font-black tracking-[0.2em] uppercase px-1.5 py-0.5 rounded"
                  style={{ color: tierColor, background: `${tierColor}22`, border: `1px solid ${tierColor}55` }}
                >
                  {tierLabel}
                </span>
                <span className="text-white font-bold text-sm tracking-wide">
                  {target.bossName || 'Enemy'}
                </span>
                <span className="text-white/50 text-[11px]">Lv.{target.level}</span>
              </div>
              <button
                onClick={clearTarget}
                className="w-5 h-5 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* HP bar */}
            <div className="flex items-center gap-2">
              <div
                className="flex-1 h-2.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${hpColor}cc, ${hpColor})`, boxShadow: `0 0 6px ${hpColor}88` }}
                  animate={{ width: `${hpPct}%` }}
                  transition={{ duration: 0.25 }}
                />
              </div>
              <span className="text-[10px] font-bold tabular-nums text-white/70 min-w-[56px] text-right">
                {Math.round(target.hp)}/{Math.round(target.maxHp)}
              </span>
            </div>

            {/* Hint */}
            <div className="mt-1.5 text-[9px] text-white/35 text-center tracking-wider">
              SCROLL CLICK to deselect · Q–F to use ability
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}