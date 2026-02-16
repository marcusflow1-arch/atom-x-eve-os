import React from 'react';
import { Heart, Swords, Shield, Zap, Wind } from 'lucide-react';
import { Input } from '@/components/ui/input';

const STAT_DEFS = [
  { key: 'hp', label: 'Base HP', icon: Heart, color: 'text-red-400' },
  { key: 'max_hp', label: 'Max HP', icon: Heart, color: 'text-red-300', perLevel: false },
  { key: 'attack', label: 'Attack', icon: Swords, color: 'text-orange-400' },
  { key: 'defense', label: 'Defense', icon: Shield, color: 'text-blue-400' },
  { key: 'speed', label: 'Speed', icon: Wind, color: 'text-cyan-400', step: 0.1 },
  { key: 'stamina', label: 'Stamina', icon: Zap, color: 'text-yellow-400' },
];

export default function AICombatSettings({ stats, statsPerLevel, onStatsChange, onPerLevelChange }) {
  const updateStat = (key, value) => {
    onStatsChange({ ...stats, [key]: value });
  };

  const updatePerLevel = (key, value) => {
    onPerLevelChange({ ...statsPerLevel, [key]: value });
  };

  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block flex items-center gap-2">
        <Swords className="w-3 h-3" />
        Combat &amp; Stats
      </label>
      <p className="text-slate-400 text-[11px] mb-4">
        These values initialize at runtime. HP changes are tracked in real time during combat. When HP ≤ 0, death animation triggers.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STAT_DEFS.map(def => {
          const Icon = def.icon;
          const showPerLevel = def.perLevel !== false && def.key !== 'max_hp';
          return (
            <div key={def.key} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${def.color}`}>
                <Icon className="w-3 h-3" />
                {def.label}
              </label>
              <Input
                type="number"
                step={def.step || 1}
                value={stats[def.key] ?? 0}
                onChange={(e) => updateStat(def.key, parseFloat(e.target.value) || 0)}
                className="bg-slate-900 border-slate-700 mb-2"
              />
              {showPerLevel && (
                <div>
                  <label className="text-[9px] text-slate-500 uppercase">Per Level +</label>
                  <Input
                    type="number"
                    step={def.step || 1}
                    value={statsPerLevel[def.key] ?? 0}
                    onChange={(e) => updatePerLevel(def.key, parseFloat(e.target.value) || 0)}
                    className="bg-slate-900 border-slate-700 text-xs h-7"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}