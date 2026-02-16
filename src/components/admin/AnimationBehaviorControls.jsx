import React from 'react';
import { Shield, Move, RotateCcw, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const MOVEMENT_OPTIONS = [
  { value: 'in_place', label: 'In-Place', desc: 'No position change' },
  { value: 'root_motion', label: 'Root Motion', desc: 'Animation moves character' },
  { value: 'snap_back', label: 'Snap Back', desc: 'Return to origin after' },
];

const SNAP_OPTIONS = [
  { value: 'snap_to_origin', label: 'Snap To Origin' },
  { value: 'maintain_end', label: 'Maintain End Position' },
  { value: 'blend_to_idle_pos', label: 'Blend Back To Idle Pos' },
];

const RETURN_OPTIONS = [
  { value: 'idle', label: 'Return to Idle' },
  { value: 'previous', label: 'Return to Previous State' },
  { value: 'freeze', label: 'Stay in Final Frame' },
  { value: 'specific', label: 'Transition to Specific Anim' },
];

export default function AnimationBehaviorControls({ entry, index, onChange, allAnimationNames = [] }) {
  const update = (field, value) => {
    onChange(index, { ...entry, [field]: value });
  };

  return (
    <div className="mt-2 p-3 bg-slate-900/60 border border-slate-700/50 rounded-lg space-y-3">
      {/* Movement Behavior */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
          <Move className="w-3 h-3" /> Movement
        </label>
        <div className="flex gap-2">
          {MOVEMENT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('movementBehavior', opt.value)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border ${
                (entry.movementBehavior || 'in_place') === opt.value
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
              title={opt.desc}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Snap Behavior */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
          <RotateCcw className="w-3 h-3" /> Snap Behavior
        </label>
        <div className="flex gap-2">
          {SNAP_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('snapBehavior', opt.value)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border ${
                (entry.snapBehavior || 'maintain_end') === opt.value
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Return State */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
          <ArrowRight className="w-3 h-3" /> After Animation
        </label>
        <div className="flex gap-2 flex-wrap">
          {RETURN_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('returnState', opt.value)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border ${
                (entry.returnState || 'idle') === opt.value
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {(entry.returnState === 'specific') && (
          <select
            value={entry.returnAnimationName || ''}
            onChange={(e) => update('returnAnimationName', e.target.value)}
            className="mt-2 w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-1.5 text-xs"
          >
            <option value="">— Select Animation —</option>
            {allAnimationNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}