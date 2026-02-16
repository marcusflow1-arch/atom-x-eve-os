import React, { useState, useMemo } from 'react';
import { Bot, Shield, Swords, Heart, Zap, Eye, Move, Target, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/error/ErrorToast';
import AIAnimationAssigner from './AIAnimationAssigner';
import AICombatSettings from './AICombatSettings';

const BEHAVIOR_TYPES = [
  { value: 'passive_wander', label: 'Passive Wander', desc: 'Wanders randomly within radius, occasional idle', icon: Move },
  { value: 'aggressive', label: 'Aggressive', desc: 'Detects player, chases, attacks within range', icon: Swords },
  { value: 'defensive', label: 'Defensive', desc: 'Only attacks when attacked first', icon: Shield },
  { value: 'follower', label: 'Follower', desc: 'Follows the player model', icon: Eye },
  { value: 'patrol_route', label: 'Patrol Route', desc: 'Moves between defined waypoints', icon: Target },
  { value: 'idle_loop', label: 'Idle Loop', desc: 'Stays in place, plays idle animation', icon: Bot },
];

const ROLES = [
  { value: 'player', label: 'Player', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { value: 'enemy', label: 'Enemy', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { value: 'neutral', label: 'Neutral', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
  { value: 'companion', label: 'Companion', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
];

export default function AIModelController() {
  const queryClient = useQueryClient();
  const [selectedModelId, setSelectedModelId] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: models = [] } = useQuery({
    queryKey: ['ai-models'],
    queryFn: () => base44.entities.Model3D.list('name'),
  });

  const { data: animations = [] } = useQuery({
    queryKey: ['ai-animations'],
    queryFn: () => base44.entities.AnimationFBX.list('name'),
  });

  const selectedModel = useMemo(() => models.find(m => m.id === selectedModelId), [models, selectedModelId]);

  // Local editable copy of model data
  const [editState, setEditState] = useState(null);

  const handleSelectModel = (id) => {
    setSelectedModelId(id);
    const model = models.find(m => m.id === id);
    if (model) {
      setEditState({
        role: model.role || 'player',
        ai_enabled: model.ai_enabled || false,
        stats: { hp: 100, max_hp: 100, attack: 10, defense: 5, speed: 1.0, stamina: 100, ...(model.stats || {}) },
        stats_per_level: { hp: 10, attack: 2, defense: 1, speed: 0.05, stamina: 5, ...(model.stats_per_level || {}) },
        ai_profile: {
          behavior_type: 'idle_loop',
          detection_range: 10,
          attack_range: 2,
          aggression_level: 5,
          wander_radius: 5,
          patrol_points: [],
          animations: {},
          ...(model.ai_profile || {}),
        },
      });
    } else {
      setEditState(null);
    }
  };

  const handleSave = async () => {
    if (!selectedModelId || !editState) return;
    setSaving(true);
    try {
      await base44.entities.Model3D.update(selectedModelId, editState);
      queryClient.invalidateQueries({ queryKey: ['ai-models'] });
      showSuccess('AI profile saved');
    } catch (e) {
      showError(e, 'Save AI Profile');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path, value) => {
    setEditState(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = copy;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  // Validate missing animations
  const missingAnims = useMemo(() => {
    if (!editState?.ai_enabled || !editState?.ai_profile) return [];
    const bt = editState.ai_profile.behavior_type;
    const anims = editState.ai_profile.animations || {};
    const required = [];
    if (bt === 'aggressive') required.push('idle', 'run', 'attack');
    else if (bt === 'passive_wander') required.push('idle', 'walk');
    else if (bt === 'patrol_route') required.push('idle', 'walk');
    else if (bt === 'defensive') required.push('idle', 'block', 'attack');
    else if (bt === 'follower') required.push('idle', 'run');
    else if (bt === 'idle_loop') required.push('idle');
    return required.filter(r => !anims[r]);
  }, [editState]);

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Bot className="w-6 h-6 text-purple-500" />
            3D Model AI Controller
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Assign AI behavior, combat stats, and animation sets to 3D models. All settings execute at runtime.
          </p>
        </div>
      </div>

      {/* Model Selector */}
      <div className="mb-6">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Select Model</label>
        <select
          value={selectedModelId}
          onChange={(e) => handleSelectModel(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">— Choose a Model —</option>
          {models.map(m => (
            <option key={m.id} value={m.id}>{m.name} ({m.file_type}) {m.ai_enabled ? '🤖' : ''}</option>
          ))}
        </select>
      </div>

      {editState && selectedModel && (
        <div className="space-y-6">
          {/* Role Selector */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Model Role</label>
            <div className="flex gap-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => updateField('role', r.value)}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold border transition-all ${
                    editState.role === r.value ? r.color : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Toggle */}
          <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
            <Switch checked={editState.ai_enabled} onCheckedChange={(v) => updateField('ai_enabled', v)} />
            <div>
              <span className="text-white font-semibold">Enable AI Controller</span>
              <p className="text-slate-400 text-xs">When enabled, this model runs autonomously via AI behavior script at runtime</p>
            </div>
          </div>

          {/* AI Behavior Type */}
          {editState.ai_enabled && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Behavior Type</label>
              <div className="grid grid-cols-3 gap-2">
                {BEHAVIOR_TYPES.map(bt => {
                  const Icon = bt.icon;
                  return (
                    <button
                      key={bt.value}
                      onClick={() => updateField('ai_profile.behavior_type', bt.value)}
                      className={`p-3 rounded-lg text-left border transition-all ${
                        editState.ai_profile.behavior_type === bt.value
                          ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <Icon className="w-4 h-4" />
                        {bt.label}
                      </div>
                      <div className="text-[10px] mt-1 opacity-70">{bt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Range Settings */}
          {editState.ai_enabled && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Detection Range</label>
                <Input
                  type="number" step="0.5"
                  value={editState.ai_profile.detection_range}
                  onChange={(e) => updateField('ai_profile.detection_range', parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 border-slate-700"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Attack Range</label>
                <Input
                  type="number" step="0.5"
                  value={editState.ai_profile.attack_range}
                  onChange={(e) => updateField('ai_profile.attack_range', parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 border-slate-700"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Aggression (1-10)</label>
                <Input
                  type="number" min="1" max="10"
                  value={editState.ai_profile.aggression_level}
                  onChange={(e) => updateField('ai_profile.aggression_level', parseInt(e.target.value) || 1)}
                  className="bg-slate-900 border-slate-700"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Wander Radius</label>
                <Input
                  type="number" step="0.5"
                  value={editState.ai_profile.wander_radius}
                  onChange={(e) => updateField('ai_profile.wander_radius', parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 border-slate-700"
                />
              </div>
            </div>
          )}

          {/* Missing Animation Warnings */}
          {editState.ai_enabled && missingAnims.length > 0 && (
            <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold mb-1">
                <AlertTriangle className="w-4 h-4" />
                Missing Required Animations
              </div>
              <p className="text-amber-200/70 text-xs">
                Behavior "{editState.ai_profile.behavior_type}" requires: {missingAnims.join(', ')}. Assign them below.
              </p>
            </div>
          )}

          {/* AI Animation Assignment */}
          {editState.ai_enabled && (
            <AIAnimationAssigner
              assignedAnimations={editState.ai_profile.animations || {}}
              allAnimations={animations}
              onChange={(newAnims) => updateField('ai_profile.animations', newAnims)}
            />
          )}

          {/* Combat Stats */}
          <AICombatSettings
            stats={editState.stats}
            statsPerLevel={editState.stats_per_level}
            onStatsChange={(s) => updateField('stats', s)}
            onPerLevelChange={(s) => updateField('stats_per_level', s)}
          />

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700 py-3 text-base">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save AI Profile &amp; Stats for {selectedModel.name}
          </Button>
        </div>
      )}
    </section>
  );
}