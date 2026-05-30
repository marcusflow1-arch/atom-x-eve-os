// Chain Break Gauge + Chain Count + Buff Indicators

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function ChainBreakMeter({ chainMeter, chainReady, chainActive, chainCount, chainBuff }) {
  const meterColor = chainReady
    ? '#f59e0b'
    : chainMeter > 60
    ? '#34d399'
    : chainMeter > 30
    ? '#60a5fa'
    : 'rgba(255,255,255,0.3)';

  return (
    <div className="select-none">
      {/* Gauge */}
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" style={{ color: meterColor }} />
          <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Chain Break
          </span>
        </div>
        <span className="text-[10px] tabular-nums font-bold" style={{ color: meterColor }}>
          {Math.round(chainMeter)}%
        </span>
      </div>

      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${chainMeter}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            background: chainReady
              ? 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)'
              : `linear-gradient(90deg, #3b82f6, ${meterColor})`,
            boxShadow: chainReady ? `0 0 12px ${meterColor}88` : 'none',
          }}
        />
        {/* Segment ticks — 5 kills */}
        {[20, 40, 60, 80].map(pct => (
          <div
            key={pct}
            className="absolute top-0 bottom-0 w-px"
            style={{ left: `${pct}%`, background: 'rgba(0,0,0,0.4)' }}
          />
        ))}
      </div>

      {/* Chain Ready Pulse */}
      <AnimatePresence>
        {chainReady && !chainActive && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: [0.7, 1, 0.7], y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="mt-1 text-center text-[9px] tracking-[0.45em] uppercase font-bold"
            style={{ color: '#f59e0b' }}
          >
            ⚡ CHAIN BREAK READY
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Chain Count */}
      <AnimatePresence>
        {chainActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Chain
              </span>
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {chainCount} / 5
              </span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <motion.div
                  key={n}
                  className="flex-1 h-3 rounded-sm"
                  animate={chainCount >= n ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.2 }}
                  style={{
                    background: chainCount >= n
                      ? n === 5 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : '#6366f1'
                      : 'rgba(255,255,255,0.07)',
                    boxShadow: chainCount >= n ? '0 0 6px rgba(99,102,241,0.5)' : 'none',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                />
              ))}
            </div>

            {/* Active Buffs */}
            {(chainBuff.damage > 1.0 || chainBuff.crit > 0) && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {chainBuff.damage > 1.0 && (
                  <span className="text-[9px] px-2 py-0.5 rounded"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                    +{Math.round((chainBuff.damage - 1) * 100)}% DMG
                  </span>
                )}
                {chainBuff.crit > 0 && (
                  <span className="text-[9px] px-2 py-0.5 rounded"
                    style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
                    +{Math.round(chainBuff.crit * 100)}% CRIT
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}