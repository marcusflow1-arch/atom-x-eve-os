import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, Trash2, Save, Loader2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import ReactorViewport from './reactor/ReactorViewport';
import ReactorBoneSelector from './reactor/ReactorBoneSelector';
import ReactorPropertiesPanel from './reactor/ReactorPropertiesPanel';
import ReactorTimeline from './reactor/ReactorTimeline';
import FXUploadManager from './reactor/FXUploadManager';

const DEFAULT_REACTOR = {
  bone_name: '', animation_name: '', trigger_time: 0.5, trigger_end_time: 0.6,
  trigger_type: 'on_custom_frame', collider_type: 'sphere', collider_radius: 1.5,
  collider_offset: { x: 0, y: 0, z: 0 }, base_damage: 50, scaled_damage_per_level: 5,
  damage_type: 'physical', critical_chance: 0.1, critical_multiplier: 2.0,
  xp_reward: 20, knockback_force: 0, status_effect: 'none', status_duration: 0,
  fx_id: '', fx_name: '', cooldown: 0, is_active: true,
};

export default function ReactorEditor() {
  const queryClient = useQueryClient();
  const viewportRef = useRef(null);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [selectedBone, setSelectedBone] = useState(null);
  const [editingReactor, setEditingReactor] = useState(null);
  const [selectedReactorId, setSelectedReactorId] = useState(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [rightTab, setRightTab] = useState('properties'); // properties | fx

  // Fetch data
  const { data: models = [] } = useQuery({
    queryKey: ['models3d-reactor'],
    queryFn: () => base44.entities.Model3D.list('-created_date', 50),
  });

  const { data: animations = [] } = useQuery({
    queryKey: ['animations-reactor'],
    queryFn: () => base44.entities.AnimationFBX.list('-created_date', 200),
  });

  const { data: reactors = [], isLoading: reactorsLoading } = useQuery({
    queryKey: ['damage-reactors', selectedModelId],
    queryFn: () => selectedModelId
      ? base44.entities.DamageReactor.filter({ character_model_id: selectedModelId }, '-created_date', 100)
      : [],
    enabled: !!selectedModelId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DamageReactor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reactors', selectedModelId] });
      setEditingReactor(null);
      showSuccess('Reactor created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DamageReactor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reactors', selectedModelId] });
      showSuccess('Reactor updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DamageReactor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reactors', selectedModelId] });
      setSelectedReactorId(null);
      setEditingReactor(null);
      showSuccess('Reactor deleted');
    },
  });

  const selectedModel = models.find(m => m.id === selectedModelId);

  const handleBoneSelect = (bone) => {
    setSelectedBone(bone);
    if (editingReactor) {
      setEditingReactor({ ...editingReactor, bone_name: bone });
    }
  };

  const handleAddReactor = () => {
    if (!selectedBone) { showError('Select a bone first'); return; }
    setEditingReactor({
      ...DEFAULT_REACTOR,
      character_model_id: selectedModelId,
      character_name: selectedModel?.name || '',
      bone_name: selectedBone,
    });
    setRightTab('properties');
  };

  const handleSaveReactor = () => {
    if (!editingReactor?.bone_name || !editingReactor?.animation_name) {
      showError('Bone and animation are required');
      return;
    }
    if (editingReactor.id) {
      const { id, created_date, updated_date, created_by, ...data } = editingReactor;
      updateMutation.mutate({ id, data });
    } else {
      createMutation.mutate(editingReactor);
    }
  };

  const handleSelectReactor = (r) => {
    setSelectedReactorId(r.id);
    setEditingReactor({ ...r });
    setSelectedBone(r.bone_name);
    setRightTab('properties');
  };

  const handleSelectFX = (fx) => {
    if (editingReactor) {
      setEditingReactor({ ...editingReactor, fx_id: fx.id, fx_name: fx.name });
      setRightTab('properties');
      showSuccess(`FX "${fx.name}" assigned to reactor`);
    }
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">Damage Reactor Editor</h2>
            <p className="text-slate-500 text-[10px]">Attach combat reactors to bones • Animation-synced damage • FX binding</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Model Selector */}
          <select
            value={selectedModelId || ''}
            onChange={(e) => { setSelectedModelId(e.target.value || null); setSelectedBone(null); setEditingReactor(null); }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white min-w-[200px]"
          >
            <option value="">Select Character Model...</option>
            {models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.file_type})</option>)}
          </select>
          <Badge variant="outline" className="text-slate-400 text-[9px]">{reactors.length} reactors</Badge>
        </div>
      </div>

      {!selectedModelId ? (
        <div className="flex items-center justify-center py-24 text-slate-600">
          <div className="text-center">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Select a character model above to start</p>
            <p className="text-xs mt-1">Supports C1, White Bot, or any imported rigged FBX/GLB</p>
          </div>
        </div>
      ) : (
        <div className="flex" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          {/* LEFT PANEL: Bone Selector */}
          <div className={`border-r border-slate-800 transition-all flex flex-col ${leftCollapsed ? 'w-8' : 'w-56'}`}>
            <button onClick={() => setLeftCollapsed(!leftCollapsed)} className="p-1.5 border-b border-slate-800 text-slate-500 hover:text-white flex items-center justify-center">
              {leftCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
            {!leftCollapsed && (
              <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'thin' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Rig Bones</span>
                </div>
                <ReactorBoneSelector
                  selectedBone={selectedBone}
                  onSelect={handleBoneSelect}
                  rigBones={viewportRef.current?.getBones?.() || []}
                />
                {selectedBone && (
                  <Button size="sm" onClick={handleAddReactor} className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white h-7 text-[10px]">
                    <Plus className="w-3 h-3 mr-1" /> Add Reactor to {selectedBone}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* CENTER: 3D Viewport + Timeline */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Viewport */}
            <div className="flex-1">
              <ReactorViewport
                ref={viewportRef}
                modelUrl={selectedModel?.file_url}
                selectedBone={selectedBone}
                reactors={reactors}
                onBoneClick={handleBoneSelect}
              />
            </div>
            {/* Timeline */}
            <div className="h-36 border-t border-slate-800 bg-slate-950/50">
              <ReactorTimeline
                reactors={reactors}
                selectedReactorId={selectedReactorId}
                onSelect={handleSelectReactor}
              />
            </div>
          </div>

          {/* RIGHT PANEL: Properties / FX */}
          <div className={`border-l border-slate-800 transition-all flex flex-col ${rightCollapsed ? 'w-8' : 'w-72'}`}>
            <div className="flex items-center border-b border-slate-800">
              <button onClick={() => setRightCollapsed(!rightCollapsed)} className="p-1.5 text-slate-500 hover:text-white">
                {rightCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {!rightCollapsed && (
                <div className="flex gap-0.5 px-1">
                  <button onClick={() => setRightTab('properties')} className={`px-2.5 py-1.5 text-[10px] font-bold rounded-t-lg ${rightTab === 'properties' ? 'text-white bg-slate-800' : 'text-slate-500'}`}>
                    Properties
                  </button>
                  <button onClick={() => setRightTab('fx')} className={`px-2.5 py-1.5 text-[10px] font-bold rounded-t-lg ${rightTab === 'fx' ? 'text-white bg-slate-800' : 'text-slate-500'}`}>
                    FX Effects
                  </button>
                </div>
              )}
            </div>
            {!rightCollapsed && (
              <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'thin' }}>
                {rightTab === 'properties' ? (
                  editingReactor ? (
                    <div className="space-y-3">
                      {/* Animation selector */}
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">Animation</label>
                        <select
                          value={editingReactor.animation_name || ''}
                          onChange={(e) => {
                            const anim = animations.find(a => a.name === e.target.value);
                            setEditingReactor({ ...editingReactor, animation_name: e.target.value, animation_id: anim?.id || '' });
                          }}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                        >
                          <option value="">Select animation...</option>
                          {animations.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                        </select>
                      </div>

                      {/* FX display */}
                      {editingReactor.fx_name && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-300 text-[10px] font-bold">{editingReactor.fx_name}</span>
                          <button onClick={() => setEditingReactor({ ...editingReactor, fx_id: '', fx_name: '' })} className="ml-auto text-slate-500 hover:text-red-400 text-[9px]">×</button>
                        </div>
                      )}

                      <ReactorPropertiesPanel reactor={editingReactor} onChange={setEditingReactor} />

                      {/* Save / Delete */}
                      <div className="flex gap-2 pt-2 border-t border-slate-700">
                        <Button size="sm" onClick={handleSaveReactor} disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white h-7 text-[10px]">
                          {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" /> Save</>}
                        </Button>
                        {editingReactor.id && (
                          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(editingReactor.id)} className="text-red-400 hover:text-red-300 h-7 text-[10px]">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-600 text-xs">
                      <p>Select a reactor from the timeline</p>
                      <p className="mt-1">or add one to a bone</p>
                    </div>
                  )
                ) : (
                  <FXUploadManager onSelectFX={handleSelectFX} />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}