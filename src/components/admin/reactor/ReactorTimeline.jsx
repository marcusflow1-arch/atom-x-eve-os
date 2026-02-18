import React from 'react';
import { Badge } from '@/components/ui/badge';

const TYPE_COLORS = {
  physical: '#94a3b8', energy: '#facc15', lightning: '#60a5fa',
  fire: '#f97316', ice: '#22d3ee', true_damage: '#ef4444',
  poison: '#22c55e', holy: '#fbbf24',
};

export default function ReactorTimeline({ reactors = [], selectedReactorId, onSelect, animTime = 0 }) {
  if (reactors.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-600 text-xs">
        No reactors — click a bone in the 3D viewport and create one
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Timeline track header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800">
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Reactor Timeline</span>
        <div className="flex gap-3 text-[9px] text-slate-600">
          <span>0.0</span><span>0.25</span><span>0.50</span><span>0.75</span><span>1.0</span>
        </div>
      </div>

      {/* Timeline ruler with playhead */}
      <div className="relative h-4 bg-slate-900 border-b border-slate-800">
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <div key={t} className="absolute h-full border-l border-slate-700" style={{ left: `${t * 100}%` }}>
            <div className="absolute -top-0 left-0.5 text-[7px] text-slate-600">{t.toFixed(2)}</div>
          </div>
        ))}
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-10 transition-[left] duration-75"
          style={{ left: `${(animTime || 0) * 100}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full" />
        </div>
      </div>

      {/* Reactor bars */}
      <div className="flex-1 overflow-y-auto relative" style={{ scrollbarWidth: 'thin' }}>
        {/* Vertical playhead line across all tracks */}
        <div
          className="absolute top-0 bottom-0 w-px bg-cyan-400/30 z-10 pointer-events-none transition-[left] duration-75"
          style={{ left: `${(animTime || 0) * 100}%` }}
        />

        {reactors.map(r => {
          const color = TYPE_COLORS[r.damage_type] || '#94a3b8';
          const left = (r.trigger_time || 0) * 100;
          const width = Math.max(((r.trigger_end_time || r.trigger_time + 0.1) - (r.trigger_time || 0)) * 100, 2);
          const isSelected = r.id === selectedReactorId;

          // Is the playhead inside this reactor's active window?
          const isActive = animTime >= (r.trigger_time || 0) && animTime <= (r.trigger_end_time || r.trigger_time + 0.1);

          return (
            <div
              key={r.id || r.bone_name + r.animation_name}
              onClick={() => onSelect(r)}
              className={`relative h-10 border-b border-slate-800/50 cursor-pointer transition-colors ${
                isSelected ? 'bg-white/5' : isActive ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                <Badge className="text-[7px] py-0" style={{ background: color + '30', color, borderColor: color + '50' }}>
                  {r.bone_name}
                </Badge>
                <span className="text-[8px] text-slate-500">{r.base_damage}dmg</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
              </div>

              <div
                className="absolute top-1.5 bottom-1.5 rounded-md transition-all"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: `linear-gradient(90deg, ${color}${isActive ? '60' : '40'}, ${color}${isActive ? '30' : '20'})`,
                  border: `1px solid ${color}${isActive ? '90' : '60'}`,
                  boxShadow: isSelected ? `0 0 8px ${color}40` : isActive ? `0 0 12px ${color}30` : 'none',
                }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ background: color }} />
                <div className="absolute right-0 top-0 bottom-0 w-0.5 rounded-full" style={{ background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}