import React from 'react';
import { Move, ArrowRight, MapPin, Check } from 'lucide-react';

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

  // The main checkbox: does this animation move the character?
  const allowsMovement = (entry.movementBehavior || 'in_place') === 'root_motion';
  // If it moves the character, should the character stay at the new position?
  const keepPosition = (entry.snapBehavior || 'maintain_end') === 'maintain_end';

  const handleToggleMovement = () => {
    if (allowsMovement) {
      // Turning OFF — go back to in_place
      update('movementBehavior', 'in_place');
    } else {
      // Turning ON — enable root motion, default to keep position
      onChange(index, { ...entry, movementBehavior: 'root_motion', snapBehavior: 'maintain_end' });
    }
  };

  const handleToggleKeepPosition = () => {
    if (keepPosition) {
      // Uncheck → snap back to start
      update('snapBehavior', 'snap_to_origin');
    } else {
      // Check → maintain end position
      update('snapBehavior', 'maintain_end');
    }
  };

  return (
    <div className="mt-2 p-4 bg-slate-900/60 border border-slate-700/50 rounded-lg space-y-4">

      {/* ─── Checkbox: Allow Animation To Move Character ─── */}
      <label
        className="flex items-start gap-3 cursor-pointer group"
        onClick={handleToggleMovement}
      >
        <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          allowsMovement
            ? 'bg-cyan-500 border-cyan-400'
            : 'bg-slate-800 border-slate-600 group-hover:border-slate-500'
        }`}>
          {allowsMovement && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
        <div>
          <div className="text-sm font-semibold text-white flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-cyan-400" />
            Allow animation to move character
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {allowsMovement
              ? 'Root motion enabled — animation can change character position'
              : 'In-place — character stays at current position during animation'}
          </div>
        </div>
      </label>

      {/* ─── Checkbox: Keep Character At New Position (only when movement allowed) ─── */}
      {allowsMovement && (
        <div className="pl-8">
          <label
            className="flex items-start gap-3 cursor-pointer group"
            onClick={handleToggleKeepPosition}
          >
            <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              keepPosition
                ? 'bg-green-500 border-green-400'
                : 'bg-slate-800 border-slate-600 group-hover:border-slate-500'
            }`}>
              {keepPosition && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-green-400" />
                Keep character at new position
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {keepPosition
                  ? 'Character stays where the animation ends — no snap-back'
                  : 'Character will return to where it started after animation'}
              </div>
            </div>
          </label>

          {/* If NOT keeping position, show how to return */}
          {!keepPosition && (
            <div className="mt-3 pl-8 flex gap-2">
              <button
                onClick={() => update('snapBehavior', 'snap_to_origin')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-all border ${
                  entry.snapBehavior === 'snap_to_origin'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Instant Snap Back
              </button>
              <button
                onClick={() => update('snapBehavior', 'blend_to_idle_pos')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-all border ${
                  entry.snapBehavior === 'blend_to_idle_pos'
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Smooth Blend Back
              </button>
            </div>
          )}
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