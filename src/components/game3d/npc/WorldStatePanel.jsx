// WorldStatePanel.jsx — Live view of world flags, modifiers, reputation

import React from 'react';
import { Globe, Zap, Shield, Flame, Clock } from 'lucide-react';

export default function WorldStatePanel({ worldState }) {
  const { flags, pathScores, reputation, world, modifiers } = worldState;
  const activeFlags = Object.entries(flags).filter(([, v]) => v === true);

  const mods = [
    { label: 'Damage Bonus',   value: modifiers.damageBonus,   color: '#ef4444', icon: Flame },
    { label: 'Control Bonus',  value: modifiers.controlBonus,  color: '#6ec3ff', icon: Shield },
    { label: 'Chain Duration', value: modifiers.chainDuration, color: '#fbbf24', icon: Clock },
    { label: 'Chain Scaling',  value: modifiers.chainScaling,  color: '#34d399', icon: Zap },
  ];

  return (
    <div className="space-y-3 p-3 text-[11px]">

      {/* Reputation */}
      <div className="px-3 py-2 rounded-lg"
        style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.20)' }}>
        <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-0.5">Reputation</div>
        <div className="font-bold text-[13px]" style={{ color: '#a78bfa' }}>{reputation}</div>
      </div>

      {/* Chaos level */}
      <div>
        <div className="flex justify-between text-[9px] text-white/30 mb-1">
          <span>Chaos Level</span>
          <span className="tabular-nums">{world.chaosLevel}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${world.chaosLevel}%`,
              background: world.chaosLevel > 60 ? '#ef4444' : world.chaosLevel > 30 ? '#fbbf24' : '#34d399',
            }} />
        </div>
        <div className="flex gap-3 mt-1 text-[9px] text-white/20">
          {world.safeZoneActive && <span style={{ color: '#34d399' }}>✓ Safe Zone Active</span>}
          {world.newEnemiesSpawned && <span style={{ color: '#ef4444' }}>⚠ New Enemies Spawned</span>}
        </div>
      </div>

      {/* Path scores */}
      <div>
        <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-1.5">Path Scores</div>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(pathScores).map(([path, score]) => (
            <div key={path} className="px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-white/30 capitalize">{path}</span>
              <span className="float-right font-bold text-white/70 tabular-nums">{score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modifiers */}
      <div>
        <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-1.5">Gameplay Modifiers</div>
        <div className="space-y-1">
          {mods.filter(m => m.value > 0).map(m => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="flex items-center gap-2">
                <Icon className="w-3 h-3" style={{ color: m.color }} />
                <span className="text-white/40 flex-1">{m.label}</span>
                <span className="font-bold tabular-nums" style={{ color: m.color }}>+{m.value}</span>
              </div>
            );
          })}
          {mods.every(m => m.value === 0) && (
            <div className="text-[10px] text-white/20">No modifiers yet</div>
          )}
        </div>
      </div>

      {/* Active flags */}
      {activeFlags.length > 0 && (
        <div>
          <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 mb-1.5">World Flags</div>
          <div className="flex flex-wrap gap-1.5">
            {activeFlags.map(([key]) => (
              <span key={key} className="px-2 py-0.5 rounded text-[9px]"
                style={{ background: 'rgba(110,195,255,0.08)', border: '1px solid rgba(110,195,255,0.20)', color: '#6ec3ff' }}>
                {key}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}