import React from 'react';
import { Zap, Shield, Flame, Snowflake, Sparkles, Skull, Heart, Sword } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const DAMAGE_TYPES = [
  { id: 'physical', label: 'Physical', icon: Sword, color: 'text-slate-300' },
  { id: 'energy', label: 'Energy', icon: Zap, color: 'text-yellow-400' },
  { id: 'lightning', label: 'Lightning', icon: Zap, color: 'text-blue-400' },
  { id: 'fire', label: 'Fire', icon: Flame, color: 'text-orange-400' },
  { id: 'ice', label: 'Ice', icon: Snowflake, color: 'text-cyan-300' },
  { id: 'true_damage', label: 'True', icon: Skull, color: 'text-red-400' },
  { id: 'poison', label: 'Poison', icon: Skull, color: 'text-green-400' },
  { id: 'holy', label: 'Holy', icon: Sparkles, color: 'text-amber-300' },
];

const STATUS_EFFECTS = ['none', 'burn', 'stun', 'slow', 'bleed', 'poison', 'freeze'];
const TRIGGER_TYPES = ['on_start', 'on_end', 'on_custom_frame'];
const COLLIDER_TYPES = ['sphere', 'capsule', 'box'];

function NumberField({ label, value, onChange, min = 0, max, step = 1 }) {
  return (
    <div>
      <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">{label}</label>
      <Input
        type="number"
        value={value ?? 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="bg-slate-900/50 border-slate-700 h-7 text-xs"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">{label}</label>
      <select
        value={value || options[0]}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
      >
        {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
      </select>
    </div>
  );
}

export default function ReactorPropertiesPanel({ reactor, onChange }) {
  const update = (field, value) => onChange({ ...reactor, [field]: value });
  const updateOffset = (axis, value) => {
    const offset = { ...(reactor.collider_offset || { x: 0, y: 0, z: 0 }), [axis]: value };
    onChange({ ...reactor, collider_offset: offset });
  };

  return (
    <div className="space-y-4 text-white">
      {/* Damage Type Selector */}
      <div>
        <label className="text-[9px] text-slate-500 uppercase font-bold mb-2 block">Damage Type</label>
        <div className="grid grid-cols-4 gap-1">
          {DAMAGE_TYPES.map(dt => (
            <button
              key={dt.id}
              onClick={() => update('damage_type', dt.id)}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-[9px] transition-all ${
                reactor.damage_type === dt.id
                  ? 'bg-white/10 border-white/20 ' + dt.color
                  : 'border-transparent text-slate-500 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <dt.icon className="w-3.5 h-3.5" />
              {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Core Damage */}
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Base Damage" value={reactor.base_damage} onChange={(v) => update('base_damage', v)} />
        <NumberField label="Dmg / Level" value={reactor.scaled_damage_per_level} onChange={(v) => update('scaled_damage_per_level', v)} />
      </div>

      {/* Crit */}
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Crit Chance (0-1)" value={reactor.critical_chance} onChange={(v) => update('critical_chance', v)} min={0} max={1} step={0.05} />
        <NumberField label="Crit Multiplier" value={reactor.critical_multiplier} onChange={(v) => update('critical_multiplier', v)} step={0.1} />
      </div>

      {/* XP & Knockback */}
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="XP Reward" value={reactor.xp_reward} onChange={(v) => update('xp_reward', v)} />
        <NumberField label="Knockback" value={reactor.knockback_force} onChange={(v) => update('knockback_force', v)} step={0.5} />
      </div>

      {/* Status Effect */}
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Status Effect" value={reactor.status_effect} onChange={(v) => update('status_effect', v)} options={STATUS_EFFECTS} />
        <NumberField label="Status Duration (s)" value={reactor.status_duration} onChange={(v) => update('status_duration', v)} step={0.5} />
      </div>

      {/* Collider */}
      <div className="border-t border-slate-700 pt-3">
        <label className="text-[9px] text-slate-500 uppercase font-bold mb-2 block flex items-center gap-1">
          <Shield className="w-3 h-3" /> Collider
        </label>
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Shape" value={reactor.collider_type} onChange={(v) => update('collider_type', v)} options={COLLIDER_TYPES} />
          <NumberField label="Radius" value={reactor.collider_radius} onChange={(v) => update('collider_radius', v)} step={0.1} />
        </div>
        <label className="text-[9px] text-slate-500 mt-2 mb-1 block">Offset (X / Y / Z)</label>
        <div className="grid grid-cols-3 gap-1">
          <NumberField label="" value={reactor.collider_offset?.x} onChange={(v) => updateOffset('x', v)} step={0.1} />
          <NumberField label="" value={reactor.collider_offset?.y} onChange={(v) => updateOffset('y', v)} step={0.1} />
          <NumberField label="" value={reactor.collider_offset?.z} onChange={(v) => updateOffset('z', v)} step={0.1} />
        </div>
      </div>

      {/* Trigger */}
      <div className="border-t border-slate-700 pt-3">
        <label className="text-[9px] text-slate-500 uppercase font-bold mb-2 block">Animation Trigger</label>
        <SelectField label="Trigger Type" value={reactor.trigger_type} onChange={(v) => update('trigger_type', v)} options={TRIGGER_TYPES} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <NumberField label="Start Time (0-1)" value={reactor.trigger_time} onChange={(v) => update('trigger_time', v)} min={0} max={1} step={0.01} />
          <NumberField label="End Time (0-1)" value={reactor.trigger_end_time} onChange={(v) => update('trigger_end_time', v)} min={0} max={1} step={0.01} />
        </div>
      </div>

      {/* Cooldown */}
      <NumberField label="Cooldown (s)" value={reactor.cooldown} onChange={(v) => update('cooldown', v)} step={0.1} />
    </div>
  );
}