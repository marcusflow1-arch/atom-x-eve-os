import React, { useRef, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { GripHorizontal, Sparkles } from 'lucide-react';

const TYPE_COLORS = {
  physical: '#94a3b8', energy: '#facc15', lightning: '#60a5fa',
  fire: '#f97316', ice: '#22d3ee', true_damage: '#ef4444',
  poison: '#22c55e', holy: '#fbbf24',
};

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

function normalizedFromMouseX(e, containerRef) {
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return 0;
  return clamp((e.clientX - rect.left) / rect.width, 0, 1);
}

export default function ReactorTimeline({
  reactors = [], selectedReactorId, onSelect, animTime = 0,
  onScrub, onUpdateReactorTime, onDropFXAtTime, activeFXDrag,
}) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(null); // { reactorId, edge: 'start'|'end'|'body', offsetNorm }
  const [fxDropPreview, setFxDropPreview] = useState(null); // normalized time when hovering with FX

  // --- SCRUB: click on ruler to move playhead ---
  const handleRulerClick = (e) => {
    const t = normalizedFromMouseX(e, trackRef);
    onScrub?.(Math.round(t * 1000) / 1000);
  };

  // --- DRAG REACTOR BAR: start/end/body ---
  const handleBarMouseDown = (e, reactor, edge) => {
    e.stopPropagation();
    const t = normalizedFromMouseX(e, trackRef);
    const offset = edge === 'body' ? t - (reactor.trigger_time || 0) : 0;
    setDragging({ reactorId: reactor.id, edge, offsetNorm: offset, reactor });
  };

  const handleMouseMove = useCallback((e) => {
    if (activeFXDrag) {
      const t = normalizedFromMouseX(e, trackRef);
      setFxDropPreview(Math.round(t * 1000) / 1000);
      return;
    }
    if (!dragging) return;
    const t = normalizedFromMouseX(e, trackRef);
    const r = dragging.reactor;
    const start = r.trigger_time || 0;
    const end = r.trigger_end_time || start + 0.1;
    const duration = end - start;

    if (dragging.edge === 'start') {
      const newStart = clamp(Math.round(t * 100) / 100, 0, end - 0.02);
      onUpdateReactorTime?.(dragging.reactorId, newStart, end);
    } else if (dragging.edge === 'end') {
      const newEnd = clamp(Math.round(t * 100) / 100, start + 0.02, 1);
      onUpdateReactorTime?.(dragging.reactorId, start, newEnd);
    } else if (dragging.edge === 'body') {
      const newStart = clamp(Math.round((t - dragging.offsetNorm) * 100) / 100, 0, 1 - duration);
      onUpdateReactorTime?.(dragging.reactorId, newStart, newStart + duration);
    }
  }, [dragging, activeFXDrag, onUpdateReactorTime]);

  const handleMouseUp = useCallback((e) => {
    if (activeFXDrag && fxDropPreview != null) {
      onDropFXAtTime?.(activeFXDrag, fxDropPreview);
      setFxDropPreview(null);
      return;
    }
    if (dragging) setDragging(null);
  }, [dragging, activeFXDrag, fxDropPreview, onDropFXAtTime]);

  const handleMouseLeave = () => {
    if (dragging) setDragging(null);
    if (fxDropPreview != null) setFxDropPreview(null);
  };

  const ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

  return (
    <div
      className="h-full flex flex-col select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800">
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Reactor Timeline</span>
        <div className="flex items-center gap-2">
          {activeFXDrag && (
            <span className="text-[9px] text-amber-400 animate-pulse flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Drop "{activeFXDrag.name}" on timeline to set trigger point
            </span>
          )}
          <span className="text-[9px] text-slate-600">{reactors.length} reactors</span>
        </div>
      </div>

      {/* Ruler + Playhead (clickable to scrub) */}
      <div
        ref={trackRef}
        className="relative h-6 bg-slate-900 border-b border-slate-800 cursor-crosshair"
        onClick={handleRulerClick}
      >
        {ticks.map(t => (
          <div key={t} className="absolute h-full" style={{ left: `${t * 100}%` }}>
            <div className={`h-full ${t % 0.5 === 0 ? 'border-l border-slate-600' : 'border-l border-slate-800'}`} />
            {t % 0.25 === 0 && (
              <div className="absolute top-0.5 left-1 text-[7px] text-slate-500 font-mono">{t.toFixed(2)}</div>
            )}
          </div>
        ))}
        {/* Playhead on ruler */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 pointer-events-none"
          style={{ left: `${(animTime || 0) * 100}%` }}
        >
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-cyan-400" />
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
        </div>
        {/* FX drop preview ghost */}
        {activeFXDrag && fxDropPreview != null && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-10"
            style={{
              left: `${fxDropPreview * 100}%`,
              width: `${Math.max((activeFXDrag.duration || 0.5) / 3 * 100, 3)}%`,
              background: `${activeFXDrag.color || '#ff8800'}30`,
              border: `1px dashed ${activeFXDrag.color || '#ff8800'}`,
              borderRadius: '4px',
            }}
          >
            <span className="absolute -top-4 left-0 text-[8px] text-amber-300 whitespace-nowrap bg-slate-900 px-1 rounded">
              {fxDropPreview.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Reactor tracks */}
      <div className="flex-1 overflow-y-auto relative" style={{ scrollbarWidth: 'thin' }}>
        {/* Playhead line across all tracks */}
        <div
          className="absolute top-0 bottom-0 w-px bg-cyan-400/40 z-10 pointer-events-none"
          style={{ left: `${(animTime || 0) * 100}%` }}
        />
        {/* FX drop line across tracks */}
        {activeFXDrag && fxDropPreview != null && (
          <div
            className="absolute top-0 bottom-0 w-px z-10 pointer-events-none"
            style={{ left: `${fxDropPreview * 100}%`, borderLeft: `1px dashed ${activeFXDrag.color || '#ff8800'}` }}
          />
        )}

        {reactors.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs px-4 text-center">
            {activeFXDrag
              ? 'Click on the ruler above to place the FX at that time'
              : 'No reactors — click a bone in the 3D viewport and create one, or drag an FX here'}
          </div>
        ) : (
          reactors.map(r => {
            const color = TYPE_COLORS[r.damage_type] || '#94a3b8';
            const left = (r.trigger_time || 0) * 100;
            const width = Math.max(((r.trigger_end_time || r.trigger_time + 0.1) - (r.trigger_time || 0)) * 100, 2);
            const isSelected = r.id === selectedReactorId;
            const isActive = animTime >= (r.trigger_time || 0) && animTime <= (r.trigger_end_time || r.trigger_time + 0.1);
            const isDraggingThis = dragging?.reactorId === r.id;

            return (
              <div
                key={r.id || r.bone_name + r.animation_name}
                onClick={() => onSelect(r)}
                className={`relative h-12 border-b border-slate-800/50 cursor-pointer transition-colors ${
                  isSelected ? 'bg-white/5' : isActive ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* Label */}
                <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 pointer-events-none">
                  <Badge className="text-[7px] py-0" style={{ background: color + '30', color, borderColor: color + '50' }}>
                    {r.bone_name}
                  </Badge>
                  <span className="text-[8px] text-slate-500">{r.base_damage}dmg</span>
                  {r.fx_name && (
                    <span className="text-[7px] text-amber-400/70 flex items-center gap-0.5">
                      <Sparkles className="w-2 h-2" />{r.fx_name}
                    </span>
                  )}
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                </div>

                {/* Reactor bar (draggable) */}
                <div
                  className={`absolute top-2 bottom-2 rounded-md transition-shadow group ${isDraggingThis ? 'ring-1 ring-white/40' : ''}`}
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    background: `linear-gradient(90deg, ${color}${isActive ? '60' : '40'}, ${color}${isActive ? '30' : '20'})`,
                    border: `1px solid ${color}${isActive ? '90' : '60'}`,
                    boxShadow: isSelected ? `0 0 8px ${color}40` : isActive ? `0 0 12px ${color}30` : 'none',
                    cursor: 'grab',
                    minWidth: '8px',
                  }}
                  onMouseDown={(e) => handleBarMouseDown(e, r, 'body')}
                >
                  {/* Left edge handle (drag to change start) */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 group/handle hover:bg-white/20 rounded-l-md"
                    onMouseDown={(e) => handleBarMouseDown(e, r, 'start')}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ background: color }} />
                  </div>
                  {/* Center grip */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity">
                    <GripHorizontal className="w-3 h-3" style={{ color }} />
                  </div>
                  {/* Right edge handle (drag to change end) */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 group/handle hover:bg-white/20 rounded-r-md"
                    onMouseDown={(e) => handleBarMouseDown(e, r, 'end')}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-0.5 rounded-full" style={{ background: color }} />
                  </div>
                  {/* Time label inside bar */}
                  {width > 6 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[7px] font-mono opacity-60" style={{ color }}>
                        {(r.trigger_time || 0).toFixed(2)} – {(r.trigger_end_time || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}