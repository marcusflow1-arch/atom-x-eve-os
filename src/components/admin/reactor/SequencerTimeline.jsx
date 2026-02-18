import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripHorizontal, Sparkles, Zap, Play, Pause, SkipBack, ZoomIn, ZoomOut, Trash2, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

const TYPE_COLORS = {
  physical: '#94a3b8', energy: '#facc15', lightning: '#60a5fa',
  fire: '#f97316', ice: '#22d3ee', true_damage: '#ef4444',
  poison: '#22c55e', holy: '#fbbf24',
};

const FX_TYPE_COLORS = {
  projectile: '#3b82f6', burst: '#f97316', aura: '#a855f7',
  beam: '#22d3ee', trail: '#22c55e', impact: '#ef4444',
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function formatFrame(norm, duration) {
  if (!duration) return '0.00s';
  return `${(norm * duration).toFixed(2)}s`;
}

export default function SequencerTimeline({
  reactors = [],
  fxBlocks = [],
  selectedReactorId,
  selectedFXBlockId,
  onSelectReactor,
  onSelectFXBlock,
  animTime = 0,
  animDuration = 0,
  animName = '',
  isPlaying,
  onTogglePlay,
  onScrub,
  onUpdateReactorTime,
  onUpdateFXBlock,
  onRemoveFXBlock,
  onDropFXAtTime,
  activeFXDrag,
}) {
  const trackRef = useRef(null);
  const [zoom, setZoom] = useState(1); // 1 = 100%, 2 = 200%, etc.
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragging, setDragging] = useState(null); // { type:'reactor'|'fx', id, edge:'start'|'end'|'body', offset }
  const [fxDropPreview, setFxDropPreview] = useState(null);
  const scrollRef = useRef(null);
  const [trackVisibility, setTrackVisibility] = useState({ animation: true, fx: true, damage: true });
  const [trackLock, setTrackLock] = useState({ animation: false, fx: false, damage: false });

  const timelineWidth = zoom * 100; // percentage width

  const normalizedFromMouseX = useCallback((e) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const scrollX = scrollRef.current?.scrollLeft || 0;
    const totalWidth = rect.width * zoom;
    const x = (e.clientX - rect.left) + scrollX;
    return clamp(x / totalWidth, 0, 1);
  }, [zoom]);

  // Scrub on ruler click
  const handleRulerClick = (e) => {
    const t = normalizedFromMouseX(e);
    onScrub?.(Math.round(t * 1000) / 1000);
  };

  // Drag logic
  const handleBarMouseDown = (e, type, id, edge, itemData) => {
    e.stopPropagation();
    const t = normalizedFromMouseX(e);
    const startTime = type === 'reactor' ? (itemData.trigger_time || 0) : (itemData.start_time || 0);
    const offset = edge === 'body' ? t - startTime : 0;
    setDragging({ type, id, edge, offset, data: itemData });
  };

  const handleMouseMove = useCallback((e) => {
    if (activeFXDrag) {
      const t = normalizedFromMouseX(e);
      setFxDropPreview(Math.round(t * 1000) / 1000);
      return;
    }
    if (!dragging) return;
    const t = normalizedFromMouseX(e);
    const d = dragging.data;

    if (dragging.type === 'reactor') {
      const start = d.trigger_time || 0;
      const end = d.trigger_end_time || start + 0.1;
      const dur = end - start;
      if (dragging.edge === 'start') {
        onUpdateReactorTime?.(dragging.id, clamp(Math.round(t * 100) / 100, 0, end - 0.02), end);
      } else if (dragging.edge === 'end') {
        onUpdateReactorTime?.(dragging.id, start, clamp(Math.round(t * 100) / 100, start + 0.02, 1));
      } else {
        const ns = clamp(Math.round((t - dragging.offset) * 100) / 100, 0, 1 - dur);
        onUpdateReactorTime?.(dragging.id, ns, ns + dur);
      }
    } else if (dragging.type === 'fx') {
      const start = d.start_time || 0;
      const durNorm = d.duration_norm || 0.1;
      if (dragging.edge === 'start') {
        const ns = clamp(Math.round(t * 100) / 100, 0, start + durNorm - 0.02);
        const newDur = (start + durNorm) - ns;
        onUpdateFXBlock?.(dragging.id, { start_time: ns, duration_norm: newDur });
      } else if (dragging.edge === 'end') {
        const ne = clamp(Math.round(t * 100) / 100, start + 0.02, 1);
        onUpdateFXBlock?.(dragging.id, { duration_norm: ne - start });
      } else {
        const ns = clamp(Math.round((t - dragging.offset) * 100) / 100, 0, 1 - durNorm);
        onUpdateFXBlock?.(dragging.id, { start_time: ns });
      }
    }
  }, [dragging, activeFXDrag, normalizedFromMouseX, onUpdateReactorTime, onUpdateFXBlock]);

  const handleMouseUp = useCallback(() => {
    if (activeFXDrag && fxDropPreview != null) {
      onDropFXAtTime?.(activeFXDrag, fxDropPreview);
      setFxDropPreview(null);
      return;
    }
    if (dragging) setDragging(null);
  }, [dragging, activeFXDrag, fxDropPreview, onDropFXAtTime]);

  // Auto-scroll to follow playhead
  useEffect(() => {
    if (!scrollRef.current || !isPlaying) return;
    const container = scrollRef.current;
    const totalWidth = container.scrollWidth;
    const viewWidth = container.clientWidth;
    const playheadX = animTime * totalWidth;
    const scrollL = container.scrollLeft;
    if (playheadX > scrollL + viewWidth - 40) {
      container.scrollLeft = playheadX - viewWidth / 2;
    } else if (playheadX < scrollL + 40) {
      container.scrollLeft = Math.max(0, playheadX - viewWidth / 2);
    }
  }, [animTime, isPlaying]);

  // Generate tick marks based on zoom level
  const tickCount = Math.max(10, Math.round(20 * zoom));
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i / tickCount);

  const toggleTrack = (track) => setTrackVisibility(v => ({ ...v, [track]: !v[track] }));
  const toggleLock = (track) => setTrackLock(v => ({ ...v, [track]: !v[track] }));

  return (
    <div
      className="h-full flex flex-col select-none bg-slate-950"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { if (dragging) setDragging(null); if (fxDropPreview != null) setFxDropPreview(null); }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sequencer</span>
          {animName && (
            <Badge className="bg-cyan-500/20 text-cyan-300 text-[8px] border border-cyan-500/30">{animName}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Transport */}
          <Button size="icon" variant="ghost" onClick={() => onScrub?.(0)} className="h-6 w-6 text-slate-400 hover:text-white" title="Reset">
            <SkipBack className="w-3 h-3" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onTogglePlay} className={`h-6 w-6 ${isPlaying ? 'text-green-400' : 'text-slate-400'} hover:text-white`}>
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
          <span className="text-[9px] text-slate-500 font-mono min-w-[80px]">
            {formatFrame(animTime, animDuration)} / {animDuration?.toFixed(2) || '0.00'}s
          </span>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          {/* Zoom */}
          <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.max(1, z - 0.5))} className="h-6 w-6 text-slate-400 hover:text-white" title="Zoom Out">
            <ZoomOut className="w-3 h-3" />
          </Button>
          <span className="text-[8px] text-slate-500 font-mono w-8 text-center">{Math.round(zoom * 100)}%</span>
          <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.min(5, z + 0.5))} className="h-6 w-6 text-slate-400 hover:text-white" title="Zoom In">
            <ZoomIn className="w-3 h-3" />
          </Button>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          {/* FX drop hint */}
          {activeFXDrag && (
            <span className="text-[9px] text-amber-400 animate-pulse flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Drop "{activeFXDrag.name}" on FX track
            </span>
          )}
          <span className="text-[8px] text-slate-600">{reactors.length}R {fxBlocks.length}FX</span>
        </div>
      </div>

      {/* Track labels + scrollable area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Labels (fixed left column) */}
        <div className="w-28 flex-shrink-0 border-r border-slate-800 bg-slate-900/60">
          {/* Ruler label */}
          <div className="h-6 border-b border-slate-800 flex items-center px-2">
            <span className="text-[7px] text-slate-600 font-mono">FRAME</span>
          </div>
          {/* Animation Track Label */}
          {trackVisibility.animation && (
            <TrackLabel
              name="Animation"
              color="text-cyan-400"
              visible={trackVisibility.animation}
              locked={trackLock.animation}
              onToggleVisible={() => toggleTrack('animation')}
              onToggleLock={() => toggleLock('animation')}
            />
          )}
          {/* FX Track Label */}
          <TrackLabel
            name="FX Effects"
            color="text-amber-400"
            visible={trackVisibility.fx}
            locked={trackLock.fx}
            onToggleVisible={() => toggleTrack('fx')}
            onToggleLock={() => toggleLock('fx')}
            count={fxBlocks.length}
          />
          {/* Damage Track Label */}
          <TrackLabel
            name="Damage"
            color="text-red-400"
            visible={trackVisibility.damage}
            locked={trackLock.damage}
            onToggleVisible={() => toggleTrack('damage')}
            onToggleLock={() => toggleLock('damage')}
            count={reactors.length}
          />
        </div>

        {/* Scrollable timeline area */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'thin' }}>
          <div ref={trackRef} style={{ width: `${timelineWidth}%`, minWidth: '100%' }} className="h-full relative">
            {/* Ruler */}
            <div className="h-6 bg-slate-900 border-b border-slate-800 relative cursor-crosshair" onClick={handleRulerClick}>
              {ticks.map(t => (
                <div key={t} className="absolute h-full" style={{ left: `${t * 100}%` }}>
                  <div className={`h-full ${t % 0.25 === 0 ? 'border-l border-slate-600' : t % 0.1 === 0 ? 'border-l border-slate-700/60' : 'border-l border-slate-800/40'}`} />
                  {(t * tickCount) % Math.max(1, Math.round(tickCount / 10)) === 0 && (
                    <span className="absolute top-0.5 left-1 text-[7px] text-slate-500 font-mono">
                      {formatFrame(t, animDuration)}
                    </span>
                  )}
                </div>
              ))}
              {/* Playhead on ruler */}
              <Playhead position={animTime} />
              {/* FX drop ghost on ruler */}
              {activeFXDrag && fxDropPreview != null && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-10"
                  style={{
                    left: `${fxDropPreview * 100}%`,
                    width: `${Math.max(((activeFXDrag.duration || 0.5) / (animDuration || 3)) * 100, 2)}%`,
                    background: `${activeFXDrag.color || '#ff8800'}30`,
                    border: `1px dashed ${activeFXDrag.color || '#ff8800'}`,
                    borderRadius: '3px',
                  }}
                />
              )}
            </div>

            {/* ANIMATION TRACK */}
            {trackVisibility.animation && (
              <div className="h-8 border-b border-slate-800/50 relative bg-cyan-500/[0.03]">
                {/* Full animation bar */}
                <div className="absolute top-1 bottom-1 left-0 right-0 rounded bg-cyan-500/10 border border-cyan-500/20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] text-cyan-400/60 font-mono truncate px-2">{animName || 'No animation'}</span>
                  </div>
                </div>
                <PlayheadLine position={animTime} />
              </div>
            )}

            {/* FX TRACK */}
            {trackVisibility.fx && (
              <div className="border-b border-slate-800/50 relative bg-amber-500/[0.02]" style={{ minHeight: Math.max(40, fxBlocks.length * 14 + 16) + 'px' }}>
                <PlayheadLine position={animTime} />
                {/* FX drop preview line */}
                {activeFXDrag && fxDropPreview != null && (
                  <div className="absolute top-0 bottom-0 w-px z-10 pointer-events-none" style={{ left: `${fxDropPreview * 100}%`, borderLeft: `1px dashed ${activeFXDrag.color || '#ff8800'}` }} />
                )}
                {fxBlocks.length === 0 && !activeFXDrag && (
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-600">
                    Drag FX from the panel to place effects on the timeline
                  </div>
                )}
                {fxBlocks.map((fx, i) => {
                  const left = (fx.start_time || 0) * 100;
                  const width = Math.max((fx.duration_norm || 0.1) * 100, 1);
                  const color = FX_TYPE_COLORS[fx.effect_type] || '#f59e0b';
                  const isSelected = fx._id === selectedFXBlockId;
                  const isActive = animTime >= (fx.start_time || 0) && animTime <= (fx.start_time || 0) + (fx.duration_norm || 0.1);
                  const isDraggingThis = dragging?.type === 'fx' && dragging?.id === fx._id;

                  return (
                    <div
                      key={fx._id}
                      className={`absolute rounded-md transition-shadow cursor-grab group ${isDraggingThis ? 'ring-1 ring-white/40 z-20' : 'z-10'}`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        top: `${4 + i * 14}px`,
                        height: '12px',
                        background: `linear-gradient(90deg, ${color}${isActive ? '80' : '50'}, ${color}${isActive ? '40' : '25'})`,
                        border: `1px solid ${color}${isSelected ? 'ff' : isActive ? 'aa' : '70'}`,
                        boxShadow: isSelected ? `0 0 10px ${color}50` : isActive ? `0 0 8px ${color}30` : 'none',
                        minWidth: '6px',
                      }}
                      onClick={(e) => { e.stopPropagation(); onSelectFXBlock?.(fx); }}
                      onMouseDown={(e) => !trackLock.fx && handleBarMouseDown(e, 'fx', fx._id, 'body', fx)}
                    >
                      {/* Left resize handle */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-10 hover:bg-white/20 rounded-l"
                        onMouseDown={(e) => !trackLock.fx && handleBarMouseDown(e, 'fx', fx._id, 'start', fx)}
                      />
                      {/* Label */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden px-1">
                        <span className="text-[7px] font-bold truncate" style={{ color }}>{fx.fx_name}</span>
                      </div>
                      {/* Right resize handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-10 hover:bg-white/20 rounded-r"
                        onMouseDown={(e) => !trackLock.fx && handleBarMouseDown(e, 'fx', fx._id, 'end', fx)}
                      />
                      {/* Delete button */}
                      {isSelected && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemoveFXBlock?.(fx._id); }}
                          className="absolute -top-3 -right-1 w-3.5 h-3.5 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500 z-20"
                        >
                          <Trash2 className="w-2 h-2 text-white" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* DAMAGE TRACK */}
            {trackVisibility.damage && (
              <div className="relative bg-red-500/[0.02]" style={{ minHeight: Math.max(40, reactors.length * 14 + 16) + 'px' }}>
                <PlayheadLine position={animTime} />
                {reactors.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-600">
                    No damage reactors — click a bone then "Add Reactor"
                  </div>
                )}
                {reactors.map((r, i) => {
                  const color = TYPE_COLORS[r.damage_type] || '#94a3b8';
                  const left = (r.trigger_time || 0) * 100;
                  const width = Math.max(((r.trigger_end_time || r.trigger_time + 0.1) - (r.trigger_time || 0)) * 100, 1);
                  const isSelected = r.id === selectedReactorId;
                  const isActive = animTime >= (r.trigger_time || 0) && animTime <= (r.trigger_end_time || r.trigger_time + 0.1);
                  const isDraggingThis = dragging?.type === 'reactor' && dragging?.id === r.id;

                  return (
                    <div
                      key={r.id}
                      className={`absolute rounded-md transition-shadow cursor-grab group ${isDraggingThis ? 'ring-1 ring-white/40 z-20' : 'z-10'}`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        top: `${4 + i * 14}px`,
                        height: '12px',
                        background: `linear-gradient(90deg, ${color}${isActive ? '80' : '50'}, ${color}${isActive ? '40' : '25'})`,
                        border: `1px solid ${color}${isSelected ? 'ff' : isActive ? 'aa' : '70'}`,
                        boxShadow: isSelected ? `0 0 10px ${color}50` : isActive ? `0 0 8px ${color}30` : 'none',
                        minWidth: '6px',
                      }}
                      onClick={(e) => { e.stopPropagation(); onSelectReactor?.(r); }}
                      onMouseDown={(e) => !trackLock.damage && handleBarMouseDown(e, 'reactor', r.id, 'body', r)}
                    >
                      {/* Left resize */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-10 hover:bg-white/20 rounded-l"
                        onMouseDown={(e) => !trackLock.damage && handleBarMouseDown(e, 'reactor', r.id, 'start', r)}
                      />
                      <div className="absolute inset-0 flex items-center px-1 pointer-events-none overflow-hidden gap-1">
                        <span className="text-[7px] font-bold truncate" style={{ color }}>{r.bone_name}</span>
                        <span className="text-[6px] opacity-60" style={{ color }}>{r.base_damage}dmg</span>
                        {r.fx_name && <Sparkles className="w-2 h-2 flex-shrink-0" style={{ color: '#f59e0b' }} />}
                        {isActive && <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse flex-shrink-0" />}
                      </div>
                      {/* Right resize */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-10 hover:bg-white/20 rounded-r"
                        onMouseDown={(e) => !trackLock.damage && handleBarMouseDown(e, 'reactor', r.id, 'end', r)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackLabel({ name, color, visible, locked, onToggleVisible, onToggleLock, count }) {
  return (
    <div className="h-auto min-h-[40px] border-b border-slate-800/50 flex items-center px-2 gap-1">
      <div className="flex-1 min-w-0">
        <span className={`text-[9px] font-bold uppercase tracking-wider ${color}`}>{name}</span>
        {count != null && <span className="text-[7px] text-slate-600 ml-1">({count})</span>}
      </div>
      <button onClick={onToggleVisible} className="text-slate-600 hover:text-white" title={visible ? 'Hide' : 'Show'}>
        {visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
      </button>
      <button onClick={onToggleLock} className="text-slate-600 hover:text-white" title={locked ? 'Unlock' : 'Lock'}>
        {locked ? <Lock className="w-2.5 h-2.5 text-amber-500" /> : <Unlock className="w-2.5 h-2.5" />}
      </button>
    </div>
  );
}

function Playhead({ position }) {
  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-30 pointer-events-none"
      style={{ left: `${(position || 0) * 100}%` }}
    >
      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-cyan-400" />
    </div>
  );
}

function PlayheadLine({ position }) {
  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-cyan-400/40 z-20 pointer-events-none"
      style={{ left: `${(position || 0) * 100}%` }}
    />
  );
}