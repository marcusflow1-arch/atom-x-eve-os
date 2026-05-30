// ChainBreakHUD.jsx — React UI wired to ChainBreakSystem + ClashSystem + ChainUI

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChainBreakSystem, ClanType } from './ChainBreakSystem';
import { ClashSystem } from './ClashSystem';
import { Enemy } from './Enemy';
import ChainBreakMeter from './ChainBreakMeter';
import ClashContest from './ClashContest';
import ClanFinisher from './ClanFinisher';
import { Sword, Target, Zap, Users, RotateCcw } from 'lucide-react';

const CLANS = ['Wolf', 'Bear', 'Shadow'];

// Mirrors Unity spawn positions
const spawnEnemies = () => [
  new Enemy({ id: 'e1', name: 'Redirector',    hp: 55, level: 28, position: { x: 5,  y: 0, z: 8  } }),
  new Enemy({ id: 'e2', name: 'Loop Sentinel', hp: 90, level: 33, position: { x: -3, y: 0, z: 12 } }),
  new Enemy({ id: 'e3', name: 'Virus Entity',  hp: 80, level: 30, position: { x: 7,  y: 0, z: -4 } }),
  new Enemy({ id: 'e4', name: 'Copy Enemy',    hp: 70, level: 31, position: { x: -6, y: 0, z: 3  } }),
  new Enemy({ id: 'e5', name: 'Distortion',    hp: 40, level: 20, position: { x: 2,  y: 0, z: 15 } }),
];

function EnemyCard({ enemy, isTarget, onSelect }) {
  const pct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
  return (
    <button
      onClick={() => !enemy.dead && onSelect(enemy)}
      disabled={enemy.dead}
      className="w-full text-left px-3 py-2 rounded-lg transition-all"
      style={{
        opacity: enemy.dead ? 0.3 : 1,
        background: isTarget ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
        border: isTarget ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isTarget ? '0 0 12px rgba(99,102,241,0.25)' : 'none',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-white/80">
          {enemy.dead ? <s>{enemy.name}</s> : enemy.name}
        </span>
        <div className="flex items-center gap-2">
          {isTarget && <span className="text-[9px] text-indigo-300 tracking-[0.2em] uppercase">⊕ Lock</span>}
          <span className="text-[10px] text-white/30">Lv{enemy.level}</span>
        </div>
      </div>
      {!enemy.dead && (
        <>
          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: pct > 50 ? '#34d399' : pct > 25 ? '#fbbf24' : '#ef4444',
              }}
            />
          </div>
          <div className="text-[9px] text-white/25 mt-0.5 tabular-nums">{Math.round(enemy.hp)} / {enemy.maxHp} HP</div>
        </>
      )}
    </button>
  );
}

export default function ChainBreakHUD({ playerClan = 'Wolf' }) {
  const [activeClan, setActiveClan] = useState(playerClan);
  const [chainState, setChainState] = useState({
    chainMeter: 0, chainCount: 0, chainActive: false,
    damageMultiplier: 1, critChance: 0, chainReady: false,
  });
  const [enemies, setEnemies] = useState(spawnEnemies());
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [log, setLog] = useState([]);
  const [clashActive, setClashActive] = useState(false);
  const [clashScore, setClashScore] = useState(0);
  const [clashResult, setClashResult] = useState(null);
  const [finisherActive, setFinisherActive] = useState(false);
  const [finisherClan, setFinisherClan] = useState(null);

  // Refs hold the actual class instances — mirrors Unity MonoBehaviour references
  const systemRef = useRef(null);
  const clashRef = useRef(null);
  const enemiesRef = useRef(enemies);

  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);

  const addLog = useCallback((msg, color = 'rgba(255,255,255,0.5)') => {
    setLog(prev => [{ msg, color, id: Date.now() + Math.random() }, ...prev].slice(0, 30));
  }, []);

  // Re-instantiate system when clan changes — mirrors setting clan on the component
  useEffect(() => {
    systemRef.current = new ChainBreakSystem({
      clan: ClanType[activeClan] || ClanType.Wolf,
      baseDamage: 20,
      targetRange: 30,
      onStateChange: s => setChainState({ ...s }),
      onLog: addLog,
      onFinisher: (clan) => {
        setFinisherClan(clan);
        setFinisherActive(true);
        setTimeout(() => setFinisherActive(false), 3000);
      },
    });

    clashRef.current = new ClashSystem({
      onLog: addLog,
      onClashStart: () => { setClashActive(true); setClashScore(0); },
      onClashEnd: (result) => {
        setClashActive(false);
        setClashResult(result);
        setTimeout(() => setClashResult(null), 3000);
      },
    });
  }, [activeClan, addLog]);

  // ChainUI.Update() equivalent — clash key listener
  useEffect(() => {
    const handler = (e) => {
      if ((e.code === 'Space' || e.code === 'KeyZ') && clashActive) {
        clashRef.current?.addInput();
        setClashScore(prev => {
          const next = prev + 1;
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clashActive]);

  const syncEnemies = () => setEnemies([...enemiesRef.current]);

  const handleActivate = () => {
    const target = selectedTarget || systemRef.current?.targeting.getNextTarget(enemiesRef.current, { x: 0, y: 0, z: 0 });
    systemRef.current?.activate(enemiesRef.current);
    syncEnemies();
  };

  const handleSimulateKill = () => {
    // Simulate a kill: damage & kill the nearest alive enemy
    const sys = systemRef.current;
    if (!sys) return;
    const target = sys.targeting.getNextTarget(enemiesRef.current, sys._playerPos)
      || enemiesRef.current.find(e => !e.dead);
    if (!target) { addLog('No enemies left.', '#fca5a5'); return; }
    target.takeDamage(9999);
    sys.onKill(target.level);
    syncEnemies();
  };

  const handleDamageGauge = () => {
    systemRef.current?.addMeter(5);
  };

  const handleChainAttack = () => {
    const sys = systemRef.current;
    if (!sys || !chainState.chainActive) return;
    sys._chainNext(enemiesRef.current).finally(syncEnemies);
  };

  const handleClash = () => {
    // Simulate opponent at chain 4, chainActive true
    const fakeOpponent = { chainActive: true, chainCount: 4 };
    const triggered = clashRef.current?.tryClash(systemRef.current, fakeOpponent);
    if (!triggered) addLog('Clash requires both players at 4+ chains', '#fca5a5');
  };

  const handleClashResolve = () => {
    const fakeOpponent = { chainActive: true, chainCount: 4 };
    clashRef.current?.forceResolve(systemRef.current, fakeOpponent);
    setClashActive(false);
  };

  const handleReset = () => {
    setEnemies(spawnEnemies());
    setSelectedTarget(null);
    setClashActive(false);
    setClashResult(null);
    setFinisherActive(false);
    systemRef.current?._endChain();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.85)' }}>

      {/* Overlays */}
      <ClashContest
        clashActive={clashActive}
        clashScore={clashScore}
        onResolved={handleClashResolve}
      />
      <ClanFinisher finisherActive={finisherActive} finisherClan={finisherClan} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Title */}
        <div className="pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[9px] tracking-[0.6em] uppercase text-white/25 mb-0.5">Unity → JS Port</div>
          <div className="text-base font-bold tracking-[0.25em] uppercase text-white/90">⚡ CHAIN BREAK</div>
        </div>

        {/* Clan Selector — mirrors ClanType enum */}
        <div>
          <div className="text-[9px] tracking-[0.3em] uppercase text-white/30 mb-2">ClanType</div>
          <div className="flex gap-2">
            {CLANS.map(c => (
              <button key={c} onClick={() => setActiveClan(c)}
                className="flex-1 py-1.5 rounded text-[10px] tracking-[0.2em] uppercase font-semibold transition-all"
                style={{
                  background: activeClan === c ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                  border: activeClan === c ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(255,255,255,0.07)',
                  color: activeClan === c ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                }}>
                {c === 'Wolf' ? '🐺' : c === 'Bear' ? '🐻' : '🌑'} {c}
              </button>
            ))}
          </div>
        </div>

        {/* ChainUI.Update() — meter + chain count */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <ChainBreakMeter
            chainMeter={chainState.chainMeter}
            chainReady={chainState.chainReady}
            chainActive={chainState.chainActive}
            chainCount={chainState.chainCount}
            chainBuff={{ damage: chainState.damageMultiplier, crit: chainState.critChance }}
          />
        </div>

        {/* Clash Result */}
        <AnimatePresence>
          {clashResult && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-lg px-4 py-3 text-center"
              style={{
                background: clashResult === 'win' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
                border: clashResult === 'win' ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(239,68,68,0.3)',
              }}>
              <div className="text-sm font-bold" style={{ color: clashResult === 'win' ? '#fbbf24' : '#fca5a5' }}>
                {clashResult === 'win' ? '🏆 CLASH VICTORY' : '💀 CLASH DEFEAT'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls — mirrors Input.GetKeyDown(KeyCode.R) etc. */}
        <div className="space-y-2">
          <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-1">Input</div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleDamageGauge}
              className="px-3 py-2 rounded text-[11px] transition-all hover:bg-white/[0.08]"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.20)', color: '#93c5fd' }}>
              <Zap className="w-3 h-3 inline mr-1" /> +5% Meter
            </button>
            <button onClick={handleSimulateKill}
              className="px-3 py-2 rounded text-[11px] transition-all hover:bg-white/[0.08]"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.20)', color: '#34d399' }}>
              <Sword className="w-3 h-3 inline mr-1" /> OnKill()
            </button>
          </div>

          {/* R key — ActivateChainBreak */}
          {chainState.chainReady && !chainState.chainActive && (
            <motion.button
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileTap={{ scale: 0.97 }}
              onClick={handleActivate}
              className="w-full py-3 rounded-lg text-sm font-bold tracking-[0.3em] uppercase transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(239,68,68,0.20))',
                border: '1px solid rgba(245,158,11,0.5)',
                color: '#fbbf24',
                boxShadow: '0 0 20px rgba(245,158,11,0.2)',
              }}>
              ⚡ ACTIVATE [R]
            </motion.button>
          )}

          {chainState.chainActive && (
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
                }}>
                <Target className="w-4 h-4 inline mr-2" />
                ChainAttack() ×{chainState.chainCount + 1}
              </motion.button>

              {chainState.chainCount >= 4 && (
                <button onClick={handleClash}
                  className="w-full py-2 rounded text-[11px] font-bold tracking-[0.2em] uppercase transition-all"
                  style={{
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.30)',
                    color: '#fbbf24',
                  }}>
                  <Users className="w-3 h-3 inline mr-1" /> TryClash()
                </button>
              )}
            </>
          )}

          <button onClick={handleReset}
            className="w-full py-1.5 rounded text-[10px] flex items-center justify-center gap-1.5 transition-all"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)' }}>
            <RotateCcw className="w-3 h-3" /> Reset Scene
          </button>
        </div>

        {/* TargetingSystem enemies */}
        <div>
          <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-2">Enemy[] — TargetingSystem</div>
          <div className="space-y-1.5">
            {enemies.map(e => (
              <EnemyCard
                key={e.id}
                enemy={e}
                isTarget={selectedTarget?.id === e.id}
                onSelect={setSelectedTarget}
              />
            ))}
          </div>
        </div>

        {/* Debug.Log equivalent */}
        {log.length > 0 && (
          <div>
            <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-2">Debug.Log</div>
            <div className="space-y-0.5 max-h-44 overflow-y-auto">
              {log.map(entry => (
                <div key={entry.id} className="text-[10px]" style={{ color: entry.color }}>{entry.msg}</div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}