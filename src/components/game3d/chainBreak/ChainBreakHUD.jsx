// Chain Break HUD — Main controller + demo panel

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  subscribeChainState, getChainState,
  addChainMeter, activateChainBreak, performChainAttack,
  tryClash, endChainBreak, triggerFinisher, updateChainState,
} from './chainBreakStore';
import ChainBreakMeter from './ChainBreakMeter';
import ClashContest from './ClashContest';
import ClanFinisher from './ClanFinisher';
import { Sword, Target, Zap, Users } from 'lucide-react';

// Simulated enemy pool for demo
const ENEMY_POOL = [
  { id: 'e1', name: 'Redirector', hp: 55, level: 28, clan: 'NONE' },
  { id: 'e2', name: 'Loop Sentinel', hp: 90, level: 33, clan: 'NONE' },
  { id: 'e3', name: 'Virus Entity', hp: 80, level: 30, clan: 'NONE' },
  { id: 'e4', name: 'Copy Enemy', hp: 70, level: 31, clan: 'NONE' },
  { id: 'e5', name: 'Distortion', hp: 40, level: 20, clan: 'NONE' },
];

const CLANS = ['WOLF', 'BEAR', 'SHADOW'];

function EnemyCard({ enemy, isTarget, onSelect }) {
  const pct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
  return (
    <button
      onClick={() => onSelect(enemy)}
      className="w-full text-left px-3 py-2 rounded-lg transition-all"
      style={{
        background: isTarget ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
        border: isTarget ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isTarget ? '0 0 12px rgba(99,102,241,0.25)' : 'none',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-white/80">{enemy.name}</span>
        <div className="flex items-center gap-2">
          {isTarget && (
            <span className="text-[9px] text-indigo-300 tracking-[0.2em] uppercase">⊕ Target</span>
          )}
          <span className="text-[10px] text-white/30">Lv{enemy.level}</span>
        </div>
      </div>
      <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: pct > 50 ? '#34d399' : pct > 25 ? '#fbbf24' : '#ef4444',
          }}
        />
      </div>
      <div className="text-[9px] text-white/25 mt-0.5 tabular-nums">{enemy.hp} / {enemy.maxHp} HP</div>
    </button>
  );
}

export default function ChainBreakHUD({ playerClan = 'WOLF' }) {
  const [state, setState] = useState(getChainState());
  const [enemies, setEnemies] = useState(ENEMY_POOL.map(e => ({ ...e, maxHp: e.hp })));
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [activeClan, setActiveClan] = useState(playerClan);
  const [log, setLog] = useState([]);

  useEffect(() => subscribeChainState(s => {
    setState(s);
    if (s.log.length > 0) setLog([...s.log]);
  }), []);

  const aliveEnemies = enemies.filter(e => e.hp > 0);

  const findNextTarget = useCallback(() => {
    const alive = enemies.filter(e => e.hp > 0);
    if (alive.length === 0) return null;
    // Prioritize lowest HP
    return alive.sort((a, b) => a.hp - b.hp)[0];
  }, [enemies]);

  const handleActivate = () => {
    const target = selectedTarget || findNextTarget();
    if (!target) return;
    activateChainBreak(target);
    setSelectedTarget(target);
  };

  const handleChainAttack = () => {
    const target = state.currentTarget || selectedTarget || findNextTarget();
    if (!target) return;

    const result = performChainAttack(target, findNextTarget);
    if (!result) return;

    if (result.killed) {
      setEnemies(prev => prev.map(e =>
        e.id === target.id ? { ...e, hp: 0 } : e
      ));
    } else if (result.updatedTarget) {
      setEnemies(prev => prev.map(e =>
        e.id === target.id ? { ...e, hp: result.updatedTarget.hp } : e
      ));
    }

    if (result.finisher) {
      triggerFinisher(activeClan);
    }
  };

  const handleDamageGauge = () => addChainMeter(5);
  const handleKillGauge = () => {
    addChainMeter(20);
    if (state.chainActive) {
      const target = findNextTarget();
      if (target) {
        setEnemies(prev => prev.map(e =>
          e.id === target.id ? { ...e, hp: 0 } : e
        ));
      }
    }
  };

  const handleClash = () => {
    const triggered = tryClash(4, true); // Simulate opponent at chain 4
    if (!triggered) alert('Clash requires both players at 4+ chains');
  };

  const handleResetEnemies = () => {
    setEnemies(ENEMY_POOL.map(e => ({ ...e, maxHp: e.hp })));
    setSelectedTarget(null);
    endChainBreak();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.85)' }}>

      {/* Overlays */}
      <ClashContest
        clashActive={state.clashActive}
        clashScore={state.clashScore}
        onResolved={() => {}}
      />
      <ClanFinisher
        finisherActive={state.finisherActive}
        finisherClan={state.finisherClan}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Title */}
        <div className="pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[9px] tracking-[0.6em] uppercase text-white/25 mb-0.5">PvP System</div>
          <div className="text-base font-bold tracking-[0.25em] uppercase text-white/90">⚡ CHAIN BREAK</div>
        </div>

        {/* Clan Selector */}
        <div>
          <div className="text-[9px] tracking-[0.3em] uppercase text-white/30 mb-2">Your Clan</div>
          <div className="flex gap-2">
            {CLANS.map(c => (
              <button
                key={c}
                onClick={() => setActiveClan(c)}
                className="flex-1 py-1.5 rounded text-[10px] tracking-[0.2em] uppercase font-semibold transition-all"
                style={{
                  background: activeClan === c ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                  border: activeClan === c ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(255,255,255,0.07)',
                  color: activeClan === c ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                }}
              >
                {c === 'WOLF' ? '🐺' : c === 'BEAR' ? '🐻' : '🌑'} {c}
              </button>
            ))}
          </div>
        </div>

        {/* Chain Break Meter */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <ChainBreakMeter
            chainMeter={state.chainMeter}
            chainReady={state.chainReady}
            chainActive={state.chainActive}
            chainCount={state.chainCount}
            chainBuff={state.chainBuff}
          />
        </div>

        {/* Clash Result */}
        <AnimatePresence>
          {state.clashResult && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg px-4 py-3 text-center"
              style={{
                background: state.clashResult === 'win' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
                border: state.clashResult === 'win' ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(239,68,68,0.3)',
              }}
            >
              <div className="text-sm font-bold" style={{ color: state.clashResult === 'win' ? '#fbbf24' : '#fca5a5' }}>
                {state.clashResult === 'win' ? '🏆 CLASH VICTORY' : '💀 CLASH DEFEAT'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="space-y-2">
          <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-1">Controls</div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDamageGauge}
              className="px-3 py-2 rounded text-[11px] transition-all hover:bg-white/[0.08]"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.20)', color: '#93c5fd' }}
            >
              <Zap className="w-3 h-3 inline mr-1" />
              +5% Gauge
            </button>
            <button
              onClick={handleKillGauge}
              className="px-3 py-2 rounded text-[11px] transition-all hover:bg-white/[0.08]"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.20)', color: '#34d399' }}
            >
              <Sword className="w-3 h-3 inline mr-1" />
              Simulate Kill
            </button>
          </div>

          {state.chainReady && !state.chainActive && (
            <motion.button
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleActivate}
              className="w-full py-3 rounded-lg text-sm font-bold tracking-[0.3em] uppercase transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(239,68,68,0.20))',
                border: '1px solid rgba(245,158,11,0.5)',
                color: '#fbbf24',
                boxShadow: '0 0 20px rgba(245,158,11,0.2)',
                animation: 'pulse 1.5s infinite',
              }}
            >
              ⚡ ACTIVATE CHAIN BREAK
            </motion.button>
          )}

          {state.chainActive && (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleChainAttack}
                className="w-full py-3 rounded-lg text-sm font-bold tracking-[0.3em] uppercase transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(167,139,250,0.20))',
                  border: '1px solid rgba(99,102,241,0.5)',
                  color: '#a5b4fc',
                  boxShadow: '0 0 20px rgba(99,102,241,0.2)',
                }}
              >
                <Target className="w-4 h-4 inline mr-2" />
                CHAIN ATTACK ×{state.chainCount + 1}
              </motion.button>

              {state.chainCount >= 4 && (
                <button
                  onClick={handleClash}
                  className="w-full py-2 rounded text-[11px] font-bold tracking-[0.2em] uppercase transition-all"
                  style={{
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.30)',
                    color: '#fbbf24',
                  }}
                >
                  <Users className="w-3 h-3 inline mr-1" />
                  Try Clash (PvP)
                </button>
              )}
            </>
          )}

          <button
            onClick={handleResetEnemies}
            className="w-full py-1.5 rounded text-[10px] transition-all"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            Reset Enemies
          </button>
        </div>

        {/* Enemy List */}
        <div>
          <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-2">Targets</div>
          <div className="space-y-1.5">
            {enemies.map(e => (
              e.hp > 0 ? (
                <EnemyCard
                  key={e.id}
                  enemy={e}
                  isTarget={state.currentTarget?.id === e.id || selectedTarget?.id === e.id}
                  onSelect={setSelectedTarget}
                />
              ) : (
                <div
                  key={e.id}
                  className="px-3 py-2 rounded-lg text-[11px] text-white/20 line-through"
                  style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  {e.name} — Defeated
                </div>
              )
            ))}
          </div>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div>
            <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-2">Event Log</div>
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {log.map(entry => (
                <div key={entry.id} className="text-[10px]" style={{ color: entry.color }}>
                  {entry.msg}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}