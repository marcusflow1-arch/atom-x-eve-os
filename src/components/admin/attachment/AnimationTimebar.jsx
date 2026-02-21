import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

/**
 * A simple animation timeline bar for the Attachment Editor.
 * Shows play/pause, scrub slider, and current time readout.
 */
export default function AnimationTimebar({
  isPlaying,
  animTime,
  animDuration,
  currentAnimName,
  onPlay,
  onPause,
  onScrub,
  onSelectAnimation,
  animations,
}) {
  const pct = animDuration > 0 ? (animTime / animDuration) * 100 : 0;
  const timeStr = animTime.toFixed(2) + 's';
  const durStr = animDuration.toFixed(2) + 's';

  return (
    <div className="bg-slate-950/80 border-t border-slate-800 px-3 py-2 flex items-center gap-3">
      {/* Animation Selector */}
      <select
        value={currentAnimName || ''}
        onChange={(e) => {
          const a = animations.find(a => a.name === e.target.value);
          if (a) onSelectAnimation(a);
        }}
        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-white w-32 truncate"
      >
        <option value="">No Animation</option>
        {animations.map(a => (
          <option key={a.id} value={a.name}>{a.name}</option>
        ))}
      </select>

      {/* Play / Pause */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
      >
        {isPlaying
          ? <Pause className="w-3.5 h-3.5 text-white" />
          : <Play className="w-3.5 h-3.5 text-white ml-0.5" />
        }
      </button>

      {/* Scrub slider */}
      <div className="flex-1 relative h-6 flex items-center group cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          onScrub(Math.max(0, Math.min(1, x)) * animDuration);
        }}
      >
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Playhead */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-cyan-500 shadow-lg transition-all"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>

      {/* Time readout */}
      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap w-20 text-right">
        {timeStr} / {durStr}
      </span>
    </div>
  );
}