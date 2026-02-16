import React from 'react';
import { Move, ArrowRight, MapPin } from 'lucide-react';

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

  const isRootMotion = (entry.movementBehavior || 'in_place') === 'root_motion';
  const snapBehavior = entry.snapBehavior || 'maintain_end';

  return (
    <div className="mt-2 p-4 bg-slate-900/60 border border-slate-700/50 rounded-lg space-y-4">
      {/* ─── Root Motion Handling ─── */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <Move className="w-3 h-3" /> Movement Handling Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => {
              update('movementBehavior', 'in_place');
            }}
            className={`flex-1 p-2.5 rounded-lg text-xs font-medium transition-all border text-left ${
              !isRootMotion
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <div className="font-semibold">In-Place</div>
            <div className="text-[10px] mt-0.5 opacity-70">Ignore root motion — character stays put</div>
          </button>
          <button
            onClick={() => {
              update('movementBehavior', 'root_motion');
            }}
            className={`flex-1 p-2.5 rounded-lg text-xs font-medium transition-all border text-left ${
              isRootMotion
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <div className="font-semibold">Apply Root Motion</div>
            <div className="text-[10px] mt-0.5 opacity-70">Allow animation to move character</div>
          </button>
        </div>
      </div>

      {/* ─── Position After Completion (only when Root Motion) ─── */}
      {isRootMotion && (
        <div className="pl-3 border-l-2 border-cyan-500/30">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <MapPin className="w-3 h-3" /> Position After Completion
          </label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => update('snapBehavior', 'maintain_end')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left ${
                snapBehavior === 'maintain_end'
                  ? 'bg-green-500/15 border-green-500/40 text-green-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold">Maintain End Position</div>
              <div className="text-[10px] mt-0.5 opacity-70">Stay where animation ends (default)</div>
            </button>
            <button
              onClick={() => update('snapBehavior', 'snap_to_origin')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left ${
                snapBehavior === 'snap_to_origin'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold">Snap Back To Start</div>
              <div className="text-[10px] mt-0.5 opacity-70">Instantly return to pre-animation position</div>
            </button>
            <button
              onClick={() => update('snapBehavior', 'blend_to_idle_pos')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left ${
                snapBehavior === 'blend_to_idle_pos'
                  ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold">Blend Back Smoothly</div>
              <div className="text-[10px] mt-0.5 opacity-70">Lerp back over ~0.3s</div>
            </button>
          </div>
        </div>
      )}

      {/* ─── After Animation (Return State) ─── */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <ArrowRight className="w-3 h-3" /> After Animation
        </label>
        <div className="flex gap-2 flex-wrap">
          {RETURN_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('returnState', opt.value)}
              className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all border ${
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