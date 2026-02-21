import React, { useState } from 'react';
import { Box, Sparkles, Trash2, Eye, EyeOff, MousePointer, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const TYPE_ICONS = { object: Box, effect: Sparkles };
const TYPE_COLORS = {
  object: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  effect: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
};

export default function AttachmentObjectPanel({
  objects,
  selectedId,
  onSelect,
  onAddFromLibrary,
  onRemove,
  onToggleVisibility,
  onUpdateTransform,
  boneList,
  onChangeBone,
  onChangeUrl,
  onReattach,
}) {
  const selected = objects.find(o => o.id === selectedId);

  const NumberInput = ({ label, value, onChange, step = 1 }) => (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-slate-500 w-4 font-mono">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-white w-20 outline-none focus:border-cyan-500/40"
      />
    </div>
  );

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Attached Objects</span>
        <span className="text-[9px] text-slate-600">{objects.length} items</span>
      </div>

      {/* Add Buttons — open asset picker */}
      <div className="flex gap-1.5">
        <Button size="sm" onClick={() => onAddFromLibrary('object')} className="flex-1 h-7 text-[9px] bg-blue-600/80 hover:bg-blue-600 gap-1">
          <Box className="w-3 h-3" /> + 3D Object
        </Button>
        <Button size="sm" onClick={() => onAddFromLibrary('effect')} className="flex-1 h-7 text-[9px] bg-cyan-600/80 hover:bg-cyan-600 gap-1">
          <Sparkles className="w-3 h-3" /> + Effect
        </Button>
      </div>

      {/* Object List */}
      <div className="space-y-1 max-h-44 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {objects.length === 0 && (
          <div className="text-center py-4 text-slate-600 text-[10px]">No objects attached yet</div>
        )}
        {objects.map(obj => {
          const Icon = TYPE_ICONS[obj.type] || Box;
          const isActive = obj.id === selectedId;
          return (
            <button
              key={obj.id}
              onClick={() => onSelect(obj.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                isActive ? 'bg-white/10 border border-cyan-500/30' : 'bg-white/[0.03] border border-transparent hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div className="flex-1 min-w-0">
                <span className={`text-[11px] font-medium truncate block ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {obj.label || `${obj.type} ${obj.id.slice(-4)}`}
                </span>
                <span className="text-[9px] text-slate-600 truncate block">{obj.bone}</span>
              </div>
              <Badge className={`text-[8px] h-4 px-1.5 ${TYPE_COLORS[obj.type] || TYPE_COLORS.object}`}>{obj.type}</Badge>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(obj.id); }}
                className="text-slate-600 hover:text-white p-0.5"
              >
                {obj.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
            </button>
          );
        })}
      </div>

      <div className="h-px bg-slate-800" />

      {/* Selected Object Properties */}
      {selected ? (
        <div className="flex-1 overflow-y-auto space-y-3" style={{ scrollbarWidth: 'thin' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white font-bold truncate">
              {selected.label || `${selected.type} ${selected.id.slice(-4)}`}
            </span>
            <button onClick={() => onRemove(selected.id)} className="text-red-500 hover:text-red-400 p-1 flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Source info */}
          {selected.sourceType && (
            <Badge variant="outline" className="text-[8px] text-slate-500 border-slate-700">
              From: {selected.sourceType}
            </Badge>
          )}

          {/* Label */}
          <div>
            <label className="text-[9px] text-slate-500 uppercase mb-1 block">Label</label>
            <Input
              value={selected.label || ''}
              onChange={(e) => onUpdateTransform(selected.id, { label: e.target.value })}
              className="bg-slate-950 border-slate-700 h-7 text-[11px]"
              placeholder="e.g. Fire Slash Effect"
            />
          </div>

          {/* URL (readonly if from library, editable for manual) */}
          <div>
            <label className="text-[9px] text-slate-500 uppercase mb-1 block">Model URL</label>
            <Input
              value={selected.url || ''}
              onChange={(e) => onChangeUrl(selected.id, e.target.value)}
              className="bg-slate-950 border-slate-700 h-7 text-[10px]"
              placeholder="GLB/FBX URL"
            />
            <Button size="sm" onClick={() => onReattach(selected.id)} className="w-full mt-1.5 h-6 text-[9px] bg-cyan-700 hover:bg-cyan-600">
              <Eye className="w-3 h-3 mr-1" /> Load / Reload
            </Button>
          </div>

          {/* Bone */}
          <div>
            <label className="text-[9px] text-slate-500 uppercase mb-1 block">Bone Attachment</label>
            <select
              value={selected.bone || ''}
              onChange={(e) => onChangeBone(selected.id, e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-[11px] text-white"
            >
              {boneList.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Position */}
          <div>
            <label className="text-[9px] text-slate-500 uppercase mb-1 block">Position</label>
            <div className="space-y-1">
              <NumberInput label="X" value={selected.position.x} onChange={(v) => onUpdateTransform(selected.id, { position: { ...selected.position, x: v } })} />
              <NumberInput label="Y" value={selected.position.y} onChange={(v) => onUpdateTransform(selected.id, { position: { ...selected.position, y: v } })} />
              <NumberInput label="Z" value={selected.position.z} onChange={(v) => onUpdateTransform(selected.id, { position: { ...selected.position, z: v } })} />
            </div>
          </div>

          {/* Rotation */}
          <div>
            <label className="text-[9px] text-slate-500 uppercase mb-1 block">Rotation (°)</label>
            <div className="space-y-1">
              <NumberInput label="X" value={selected.rotation.x} onChange={(v) => onUpdateTransform(selected.id, { rotation: { ...selected.rotation, x: v } })} step={5} />
              <NumberInput label="Y" value={selected.rotation.y} onChange={(v) => onUpdateTransform(selected.id, { rotation: { ...selected.rotation, y: v } })} step={5} />
              <NumberInput label="Z" value={selected.rotation.z} onChange={(v) => onUpdateTransform(selected.id, { rotation: { ...selected.rotation, z: v } })} step={5} />
            </div>
          </div>

          {/* Scale */}
          <div>
            <label className="text-[9px] text-slate-500 uppercase mb-1 block">Scale</label>
            <NumberInput label="S" value={selected.scale} onChange={(v) => onUpdateTransform(selected.id, { scale: v })} step={5} />
          </div>

          <p className="text-[9px] text-cyan-500/60 italic mt-2">
            Click the object in the 3D viewport to show gizmo handles for direct drag manipulation.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-[10px]">
          <MousePointer className="w-6 h-6 mb-2 opacity-30" />
          <p>Select an object above</p>
          <p>or add a new one from your library</p>
        </div>
      )}
    </div>
  );
}