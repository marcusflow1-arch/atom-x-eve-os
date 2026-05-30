// TrustPanel.jsx — Shows all NPC trust bars + world state + reputation + modifiers

import React from 'react';
import { motion } from 'framer-motion';
import { NPC_DEFS, getEndgamePath } from './questNetwork';
import { Shield, Zap, Globe, Award } from 'lucide-react';

function TrustBar({ npc, trust }) {
  const pct = (trust + 100) / 2; // -100..100 → 0..100%
  const color = trust > 50 ? '#34d399' : trust < -20 ? '#f87171' : '#6ec3ff';
  const label = trust > 50 ? 'Ally' : trust < -20 ? 'Hostile' : 'Neutral';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">{npc.icon}</span>
          <span className="text-[11px] font-semibold" style={{ color: npc.color }}>{npc.name}</span>
          <span className="text-[8px] uppercase tracking-[0.2em]" style={{ color }}>{label}</span>
        </div>
        <span className="text-[10px] tabular-nums" style={{ color }}>
          {trust > 0 ? '+' : ''}{trust}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${pct}%` }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export default function TrustPanel({ trust, pathScores, world, reputation, modifiers }) {
  const endgame = getEndgamePath(pathScores);

  return (
    <div className="space-y-4 px-4 py-3">

      {/* Reputation */}
      <div className="flex items-center gap-2">
        <Award className="w-3.5 h-3.5 text-white/30" />
        <span className="text-[9px] tracking-[0.3em] uppercase text-white/25">Reputation</span>
        <span className="text-[11px] font-bold ml-auto" style={{ color: '#fbbf24' }}>{reputation}</span>
      </div>

      {/* Trust bars */}
      <div>
        <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-2">NPC Trust</div>
        <div className="space-y-2.5">
          {NPC_DEFS.map(npc => (
            <TrustBar key={npc.id} npc={npc} trust={trust[npc.id] ?? 0} />
          ))}
        </div>
      </div>

      {/* Path scores */}
      <div>
        <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-2">Alignment Scores</div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { key: 'combat',  label: 'Combat',  color: '#f87171' },
            { key: 'mercy',   label: 'Mercy',   color: '#6ec3ff' },
            { key: 'control', label: 'Control', color: '#34d399' },
            { key: 'chaos',   label: 'Chaos',   color: '#fbbf24' },
          ].map(p => (
            <div key={p.key} className="flex items-center justify-between px-2 py-1 rounded"
              style={{ background: `${p.color}08`, border: `1px solid ${p.color}20` }}>
              <span className="text-[9px] text-white/40">{p.label}</span>
              <span className="text-[10px] font-bold" style={{ color: p.color }}>
                {pathScores[p.key] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* World state */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Globe className="w-3 h-3 text-white/25" />
          <span className="text-[9px] tracking-[0.3em] uppercase text-white/25">World State</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-white/35">Chaos Level</span>
            <span style={{ color: world.chaosLevel > 50 ? '#f87171' : '#34d399' }}>{world.chaosLevel}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div className="h-full rounded-full" animate={{ width: `${world.chaosLevel}%` }}
              style={{ background: world.chaosLevel > 50 ? '#f87171' : '#34d399' }} />
          </div>
          {world.safeZoneActive && (
            <div className="text-[9px] text-center" style={{ color: '#34d399' }}>✅ Safe zones active</div>
          )}
          {world.newEnemiesSpawned && (
            <div className="text-[9px] text-center" style={{ color: '#f87171' }}>⚠️ New enemies spawned</div>
          )}
        </div>
      </div>

      {/* Gameplay modifiers */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3 h-3 text-white/25" />
          <span className="text-[9px] tracking-[0.3em] uppercase text-white/25">Modifiers</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="text-[9px] text-white/35 flex justify-between px-2 py-1 rounded"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span>⚔️ Damage</span><span className="text-orange-400">+{modifiers.damageBonus}</span>
          </div>
          <div className="text-[9px] text-white/35 flex justify-between px-2 py-1 rounded"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span>🛡️ Control</span><span className="text-blue-400">+{modifiers.controlBonus}</span>
          </div>
          <div className="text-[9px] text-white/35 flex justify-between px-2 py-1 rounded"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span>⚡ Chain+</span><span className="text-purple-400">+{modifiers.chainScaling}</span>
          </div>
          <div className="text-[9px] text-white/35 flex justify-between px-2 py-1 rounded"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span>⏱️ Duration</span><span className="text-green-400">+{modifiers.chainDuration}s</span>
          </div>
        </div>
      </div>

      {/* Endgame path indicator */}
      {endgame && (
        <div className="mt-2 px-3 py-2 rounded-xl text-center"
          style={{ background: `${endgame.color}10`, border: `1px solid ${endgame.color}30` }}>
          <div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mb-1">Projected Ending</div>
          <div className="text-[11px] font-bold" style={{ color: endgame.color }}>{endgame.title}</div>
          <div className="text-[9px] text-white/30">via {endgame.npc}</div>
        </div>
      )}
    </div>
  );
}